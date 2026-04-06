import { describe, it, expect, beforeAll } from 'vitest'
import { execSync } from 'child_process'
import { existsSync, readFileSync, readdirSync } from 'fs'
import { resolve, join } from 'path'

const ROOT = resolve(import.meta.dirname!, '..', '..')
const ROOMS = resolve(ROOT, 'rooms')

function buildRoom(name: string) {
  execSync(`pnpm --filter ${name} build`, { cwd: ROOT, stdio: 'pipe' })
}

function distDir(name: string) {
  return resolve(ROOMS, name, 'dist')
}

function readAllFiles(dir: string): string[] {
  const files: string[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...readAllFiles(full))
    } else {
      files.push(full)
    }
  }
  return files
}

describe('room builds', () => {
  beforeAll(() => {
    buildRoom('hello-world')
    buildRoom('react-counter')
  }, 30000)

  it('hello-world build produces index.html', () => {
    expect(existsSync(join(distDir('hello-world'), 'index.html'))).toBe(true)
  })

  it('react-counter build produces index.html', () => {
    expect(existsSync(join(distDir('react-counter'), 'index.html'))).toBe(true)
  })

  it('built output has no unresolved @shared references', () => {
    for (const room of ['hello-world', 'react-counter']) {
      const files = readAllFiles(distDir(room))
      for (const file of files) {
        if (!file.endsWith('.js') && !file.endsWith('.html')) continue
        const content = readFileSync(file, 'utf-8')
        expect(content).not.toContain('@shared')
      }
    }
  })

  it('built HTML references only local assets', () => {
    for (const room of ['hello-world', 'react-counter']) {
      const html = readFileSync(join(distDir(room), 'index.html'), 'utf-8')
      // Should not reference parent directories or absolute system paths
      expect(html).not.toContain('../')
      expect(html).not.toMatch(/src="\/Users\//)
    }
  })
})
