import { readdirSync, readFileSync, existsSync } from 'fs'
import { join } from 'path'

export interface RoomMetadata {
  name: string
  tags: string[]
  path: string
}

export async function scanRooms(roomsDir: string): Promise<RoomMetadata[]> {
  if (!existsSync(roomsDir)) return []

  const entries = readdirSync(roomsDir, { withFileTypes: true })
  const rooms: RoomMetadata[] = []

  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    const roomPath = join(roomsDir, entry.name)
    const indexPath = join(roomPath, 'index.html')
    if (!existsSync(indexPath)) continue

    const tags = detectTags(roomPath)

    rooms.push({
      name: entry.name,
      tags,
      path: roomPath,
    })
  }

  return rooms
}

const DEP_TAG_MAP: Record<string, string> = {
  react: 'react',
  'react-dom': 'react',
  vue: 'vue',
  svelte: 'svelte',
  three: 'three.js',
  '@react-three/fiber': 'three.js',
}

function detectTags(roomPath: string): string[] {
  const tags = new Set<string>()
  const pkgPath = join(roomPath, 'package.json')

  if (existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
      const allDeps = {
        ...pkg.dependencies,
        ...pkg.devDependencies,
      }
      for (const dep of Object.keys(allDeps)) {
        if (dep in DEP_TAG_MAP) {
          tags.add(DEP_TAG_MAP[dep])
        }
      }
    } catch {}
  }

  if (tags.size === 0) {
    tags.add('vanilla')
  }

  return [...tags]
}
