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

let allRooms: Room[] = []
let activeFilters = new Set<string>()

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

function renderCard(room: Room): HTMLElement {
  const card = document.createElement('div')
  card.className = 'room-card'

  const preview = document.createElement('div')
  preview.className = 'room-card__preview'

  if (room.running && room.port) {
    const iframe = document.createElement('iframe')
    iframe.src = `http://localhost:${room.port}`
    preview.appendChild(iframe)
  } else {
    preview.textContent = room.name
  }

  const info = document.createElement('div')
  info.className = 'room-card__info'

  const name = document.createElement('div')
  name.className = 'room-card__name'
  name.textContent = room.name

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

  const actions = document.createElement('div')
  actions.className = 'room-card__actions'

  const btn = document.createElement('button')
  if (room.running && room.port) {
    btn.textContent = 'Open'
    btn.addEventListener('click', (e) => {
      e.stopPropagation()
      window.open(`http://localhost:${room.port}`, '_blank')
    })

    const stopBtn = document.createElement('button')
    stopBtn.className = 'stop-btn'
    stopBtn.textContent = 'Stop'
    stopBtn.addEventListener('click', async (e) => {
      e.stopPropagation()
      await stopRoom(room.name)
      room.running = false
      room.port = null
      const newCard = renderCard(room)
      card.replaceWith(newCard)
    })
    actions.appendChild(stopBtn)
  } else {
    btn.textContent = 'Start'
    btn.addEventListener('click', async (e) => {
      e.stopPropagation()
      btn.innerHTML = '<span class="spinner"></span>'
      const result = await startRoom(room.name)
      room.running = true
      room.port = result.port

      const newCard = renderCard(room)
      card.replaceWith(newCard)
    })
  }

  actions.appendChild(btn)

  card.appendChild(preview)
  card.appendChild(info)
  card.appendChild(actions)

  return card
}

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

async function render() {
  allRooms = await fetchRooms()
  renderFilters(allRooms)
  renderGrid(allRooms)
}

render()
