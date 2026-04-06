interface Room {
  name: string
  tags: string[]
  path: string
  running: boolean
  port: number | null
}

const grid = document.getElementById('grid')!
const emptyState = document.getElementById('empty-state')!
const filterBar = document.getElementById('filter-bar')!
const roomCountEl = document.getElementById('room-count')!
const themeToggle = document.getElementById('theme-toggle')!

let allRooms: Room[] = []
let activeFilters = new Set<string>()

// ---- Theme ----
const THEME_KEY = 'playground-dashboard-theme'

function getPreferredTheme(): 'light' | 'dark' {
  const stored = localStorage.getItem(THEME_KEY)
  if (stored === 'light' || stored === 'dark') return stored
  return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyTheme(theme: 'light' | 'dark') {
  document.documentElement.setAttribute('data-theme', theme)
  localStorage.setItem(THEME_KEY, theme)
  themeToggle.textContent = theme === 'dark' ? '\u2600' : '\u263E'
}

applyTheme(getPreferredTheme())

themeToggle.addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme')
  applyTheme(current === 'light' ? 'dark' : 'light')
})

// ---- API ----
async function fetchRooms(): Promise<Room[]> {
  const res = await fetch('/api/rooms')
  return res.json()
}

async function startRoom(name: string): Promise<{ name: string; port: number }> {
  const res = await fetch(`/api/rooms/${name}/start`, { method: 'POST' })
  return res.json()
}

async function stopRoom(name: string): Promise<void> {
  await fetch(`/api/rooms/${name}/stop`, { method: 'POST' })
}

// ---- Room Count ----
function updateRoomCount(rooms: Room[]) {
  const total = rooms.length
  const running = rooms.filter((r) => r.running).length
  if (running > 0) {
    roomCountEl.textContent = `${total} rooms \u00B7 ${running} running`
  } else {
    roomCountEl.textContent = `${total} rooms`
  }
}

// ---- Filters ----
function getAllTags(rooms: Room[]): string[] {
  const tags = new Set<string>()
  for (const room of rooms) {
    for (const t of room.tags) tags.add(t)
  }
  return [...tags].sort()
}

function renderFilters(rooms: Room[]) {
  const tags = getAllTags(rooms)
  filterBar.innerHTML = ''

  if (tags.length === 0) return

  for (const t of tags) {
    const btn = document.createElement('button')
    btn.className = `filter-tag${activeFilters.has(t) ? ' active' : ''}`
    btn.textContent = t
    btn.addEventListener('click', () => {
      if (activeFilters.has(t)) {
        activeFilters.delete(t)
      } else {
        activeFilters.add(t)
      }
      renderFilters(allRooms)
      renderGrid(allRooms)
    })
    filterBar.appendChild(btn)
  }
}

// ---- Card ----
function renderCard(room: Room): HTMLElement {
  const card = document.createElement('div')
  card.className = 'room-card'

  // Preview
  const preview = document.createElement('div')
  preview.className = `room-card__preview${room.running ? ' running' : ''}`

  if (room.running && room.port) {
    const IFRAME_W = 1024
    const IFRAME_H = 768
    const previewW = 380
    const previewH = 220
    const scale = Math.min(previewW / IFRAME_W, previewH / IFRAME_H)
    preview.style.setProperty('--preview-scale', String(scale))

    const iframe = document.createElement('iframe')
    iframe.src = `http://localhost:${room.port}?preview=true`
    preview.appendChild(iframe)
  } else {
    preview.textContent = room.name
  }

  // Info
  const info = document.createElement('div')
  info.className = 'room-card__info'

  const name = document.createElement('div')
  name.className = 'room-card__name'

  if (room.running) {
    const dot = document.createElement('span')
    dot.className = 'status-dot'
    name.appendChild(dot)
  }

  const nameText = document.createTextNode(room.name)
  name.appendChild(nameText)

  const tags = document.createElement('div')
  tags.className = 'room-card__tags'
  for (const t of room.tags) {
    const tag = document.createElement('span')
    tag.className = 'tag'
    tag.textContent = t
    tags.appendChild(tag)
  }

  info.appendChild(name)
  info.appendChild(tags)

  // Actions
  const actions = document.createElement('div')
  actions.className = 'room-card__actions'

  if (room.running && room.port) {
    const openBtn = document.createElement('button')
    openBtn.className = 'btn-primary'
    openBtn.textContent = 'Open'
    openBtn.addEventListener('click', (e) => {
      e.stopPropagation()
      window.open(`http://localhost:${room.port}`, '_blank')
    })

    const stopBtn = document.createElement('button')
    stopBtn.className = 'btn-danger'
    stopBtn.textContent = 'Stop'
    stopBtn.addEventListener('click', async (e) => {
      e.stopPropagation()
      await stopRoom(room.name)
      room.running = false
      room.port = null
      const newCard = renderCard(room)
      card.replaceWith(newCard)
      updateRoomCount(allRooms)
    })

    actions.appendChild(openBtn)
    actions.appendChild(stopBtn)
  } else {
    const startBtn = document.createElement('button')
    startBtn.className = 'btn-outline'
    startBtn.textContent = 'Start'
    startBtn.addEventListener('click', async (e) => {
      e.stopPropagation()
      startBtn.innerHTML = '<span class="spinner"></span>'
      const result = await startRoom(room.name)
      room.running = true
      room.port = result.port
      const newCard = renderCard(room)
      card.replaceWith(newCard)
      updateRoomCount(allRooms)
    })
    actions.appendChild(startBtn)
  }

  card.appendChild(preview)
  card.appendChild(info)
  card.appendChild(actions)

  return card
}

// ---- Grid ----
function renderGrid(rooms: Room[]) {
  let filtered = rooms
  if (activeFilters.size > 0) {
    filtered = rooms.filter((r) =>
      [...activeFilters].every((f) => r.tags.includes(f))
    )
  }

  if (filtered.length === 0 && rooms.length > 0) {
    grid.innerHTML = '<p class="no-match">No rooms match the selected filters.</p>'
    grid.hidden = false
    emptyState.hidden = true
    return
  }

  if (rooms.length === 0) {
    grid.hidden = true
    emptyState.hidden = false
    return
  }

  grid.hidden = false
  emptyState.hidden = true
  grid.innerHTML = ''

  for (const room of filtered) {
    grid.appendChild(renderCard(room))
  }
}

// ---- Init ----
async function render() {
  allRooms = await fetchRooms()
  updateRoomCount(allRooms)
  renderFilters(allRooms)
  renderGrid(allRooms)
}

render()
