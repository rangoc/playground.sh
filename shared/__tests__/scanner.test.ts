import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import { scanRooms } from '../scanner'

describe('scanRooms', () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'playground-test-'))
  })

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true })
  })

  it('returns empty array for empty rooms directory', async () => {
    const rooms = await scanRooms(tmpDir)
    expect(rooms).toEqual([])
  })

  it('tags a room with react in dependencies as react', async () => {
    const roomDir = join(tmpDir, 'react-app')
    mkdirSync(roomDir)
    writeFileSync(join(roomDir, 'index.html'), '<html></html>')
    writeFileSync(
      join(roomDir, 'package.json'),
      JSON.stringify({ dependencies: { react: '^18.0.0', 'react-dom': '^18.0.0' } })
    )

    const rooms = await scanRooms(tmpDir)
    expect(rooms[0].tags).toEqual(['react'])
  })

  it('tags a room with three in dependencies as three.js', async () => {
    const roomDir = join(tmpDir, 'shader-room')
    mkdirSync(roomDir)
    writeFileSync(join(roomDir, 'index.html'), '<html></html>')
    writeFileSync(
      join(roomDir, 'package.json'),
      JSON.stringify({ dependencies: { three: '^0.160.0' } })
    )

    const rooms = await scanRooms(tmpDir)
    expect(rooms[0].tags).toEqual(['three.js'])
  })

  it('tags a room with only HTML and TS files as vanilla', async () => {
    const roomDir = join(tmpDir, 'my-sketch')
    mkdirSync(roomDir)
    writeFileSync(join(roomDir, 'index.html'), '<html></html>')
    writeFileSync(join(roomDir, 'main.ts'), 'console.log("hi")')

    const rooms = await scanRooms(tmpDir)
    expect(rooms).toEqual([
      { name: 'my-sketch', tags: ['vanilla'], path: roomDir },
    ])
  })

  it('detects multiple rooms', async () => {
    const room1 = join(tmpDir, 'alpha')
    const room2 = join(tmpDir, 'beta')
    mkdirSync(room1)
    mkdirSync(room2)
    writeFileSync(join(room1, 'index.html'), '<html></html>')
    writeFileSync(join(room2, 'index.html'), '<html></html>')

    const rooms = await scanRooms(tmpDir)
    const names = rooms.map((r) => r.name).sort()
    expect(names).toEqual(['alpha', 'beta'])
  })

  it('skips directories without index.html', async () => {
    const valid = join(tmpDir, 'valid-room')
    const invalid = join(tmpDir, 'not-a-room')
    mkdirSync(valid)
    mkdirSync(invalid)
    writeFileSync(join(valid, 'index.html'), '<html></html>')
    writeFileSync(join(invalid, 'readme.md'), '# hi')

    const rooms = await scanRooms(tmpDir)
    expect(rooms).toHaveLength(1)
    expect(rooms[0].name).toBe('valid-room')
  })
})
