import express from 'express'
import { createServer as createViteServer } from 'vite'
import { resolve } from 'path'
import { fileURLToPath } from 'url'
import { scanRooms } from '../shared/scanner'
import { spawn, execSync, ChildProcess } from 'child_process'
import { createServer as createNetServer } from 'net'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const ROOMS_DIR = resolve(__dirname, '..', 'rooms')

const runningRooms = new Map<string, { port: number; process: ChildProcess }>()

function killProcessTree(pid: number) {
  try {
    // Kill the entire process group (works on macOS/Linux)
    process.kill(-pid, 'SIGKILL')
  } catch {
    try {
      // Fallback: find and kill all child processes
      const children = execSync(`pgrep -P ${pid}`, { encoding: 'utf-8' }).trim().split('\n')
      for (const childPid of children) {
        if (childPid) {
          try { process.kill(Number(childPid), 'SIGKILL') } catch {}
        }
      }
    } catch {}
    try { process.kill(pid, 'SIGKILL') } catch {}
  }
}

async function findFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createNetServer()
    server.listen(0, () => {
      const addr = server.address()
      if (addr && typeof addr === 'object') {
        const port = addr.port
        server.close(() => resolve(port))
      } else {
        reject(new Error('Could not find free port'))
      }
    })
  })
}

async function startRoomServer(
  roomName: string,
  roomPath: string
): Promise<number> {
  if (runningRooms.has(roomName)) {
    return runningRooms.get(roomName)!.port
  }

  const port = await findFreePort()

  const child = spawn('npx', ['vite', '--port', String(port), '--strictPort'], {
    cwd: roomPath,
    stdio: 'pipe',
    env: { ...process.env },
    detached: true,
  })

  runningRooms.set(roomName, { port, process: child })

  child.on('exit', () => {
    runningRooms.delete(roomName)
  })

  // Wait for Vite to be ready
  await new Promise<void>((resolve) => {
    child.stdout?.on('data', (data: Buffer) => {
      if (data.toString().includes('Local:')) {
        resolve()
      }
    })
    // Fallback timeout
    setTimeout(resolve, 5000)
  })

  return port
}

async function main() {
  const app = express()

  // API: list rooms
  app.get('/api/rooms', async (_req, res) => {
    const rooms = await scanRooms(ROOMS_DIR)
    const withStatus = rooms.map((room) => ({
      ...room,
      running: runningRooms.has(room.name),
      port: runningRooms.get(room.name)?.port ?? null,
    }))
    res.json(withStatus)
  })

  // API: start a room's dev server
  app.post('/api/rooms/:name/start', async (req, res) => {
    const rooms = await scanRooms(ROOMS_DIR)
    const room = rooms.find((r) => r.name === req.params.name)
    if (!room) {
      res.status(404).json({ error: 'Room not found' })
      return
    }

    const port = await startRoomServer(room.name, room.path)
    res.json({ name: room.name, port })
  })

  // API: stop a room's dev server
  app.post('/api/rooms/:name/stop', async (req, res) => {
    const entry = runningRooms.get(req.params.name)
    if (!entry) {
      res.status(404).json({ error: 'Room not running' })
      return
    }

    killProcessTree(entry.process.pid!)
    runningRooms.delete(req.params.name)
    res.json({ stopped: true })
  })

  // Vite middleware for the dashboard frontend
  const vite = await createViteServer({
    root: __dirname,
    server: { middlewareMode: true },
  })
  app.use(vite.middlewares)

  const PORT = 3000
  app.listen(PORT, () => {
    console.log(`\n  playground.sh dashboard: http://localhost:${PORT}\n`)
  })

  // Cleanup on exit
  process.on('SIGINT', () => {
    for (const [, entry] of runningRooms) {
      killProcessTree(entry.process.pid!)
    }
    process.exit()
  })
}

main()
