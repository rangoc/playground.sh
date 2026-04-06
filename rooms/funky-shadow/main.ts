import { renderShadow, PRESETS, DEFAULT_CONFIG, type ShadowConfig } from 'funky-shadow'
import { initTheme } from '@shared/theme'
import { applyPreviewClass } from '@shared/preview'

const preview = applyPreviewClass()

if (!preview) initTheme()

const state: ShadowConfig & { width: number; height: number; radius: number } = {
  ...DEFAULT_CONFIG,
  width: 320,
  height: 200,
  radius: 16,
}

const app = document.getElementById('app')!
app.innerHTML = `
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: #0a0a0a; color: #e0e0e0; font-family: system-ui, -apple-system, sans-serif;
      min-height: 100vh; transition: background 0.2s, color 0.2s;
    }
    [data-theme="light"] body { background: #f5f5f5; color: #222; }

    .layout { display: flex; min-height: 100vh; }

    /* Preview area */
    .preview {
      flex: 1; display: flex; align-items: center; justify-content: center;
      position: relative; overflow: hidden;
    }
    .card-container { position: relative; }
    .card-container canvas {
      position: absolute; z-index: 0; pointer-events: none;
      image-rendering: pixelated;
    }
    .card {
      position: relative; z-index: 1;
      background: #1a1a1a; border-radius: 16px;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.125rem; font-weight: 500; color: #fff; border: 1px solid #333;
      transition: background 0.2s, color 0.2s, border-color 0.2s;
    }
    [data-theme="light"] .card { background: #fff; color: #111; border-color: #ddd; }

    /* XY Pad */
    .xy-pad-container { position: fixed; bottom: 1.5rem; left: 1.5rem; z-index: 10; }
    .xy-labels { display: flex; gap: 0.75rem; margin-bottom: 0.5rem; font-size: 0.75rem; color: #888; }
    .xy-labels span { display: flex; align-items: center; gap: 0.25rem; }
    .xy-labels strong { color: #fff; font-variant-numeric: tabular-nums; }
    [data-theme="light"] .xy-labels strong { color: #111; }
    .xy-pad {
      width: 100px; height: 100px; background: #1a1a1a; border: 1px solid #333;
      border-radius: 8px; position: relative; cursor: crosshair; touch-action: none;
    }
    [data-theme="light"] .xy-pad { background: #eee; border-color: #ccc; }
    .xy-dot {
      width: 12px; height: 12px; background: #7c8aff; border-radius: 50%;
      position: absolute; transform: translate(-50%, -50%); pointer-events: none;
      border: 2px solid #fff;
    }
    .xy-extra { display: flex; flex-direction: column; gap: 0.375rem; margin-top: 0.75rem; }
    .xy-extra label { font-size: 0.75rem; color: #888; display: flex; flex-direction: column; gap: 0.125rem; }
    .xy-extra input[type="range"] { width: 100px; }

    /* Sidebar */
    .sidebar {
      width: 300px; border-left: 1px solid #222; overflow-y: auto; padding: 1rem;
      display: flex; flex-direction: column; gap: 1rem; flex-shrink: 0;
      background: #0f0f0f;
    }
    [data-theme="light"] .sidebar { background: #fafafa; border-color: #ddd; }

    .section-label {
      font-size: 0.6875rem; font-weight: 600; text-transform: uppercase;
      letter-spacing: 0.05em; color: #666; margin-bottom: 0.25rem;
    }

    /* Slider row */
    .slider-row {
      display: flex; align-items: center; justify-content: space-between;
      background: #1a1a1a; border: 1px solid #222; border-radius: 6px;
      padding: 0.5rem 0.75rem; gap: 0.5rem;
    }
    [data-theme="light"] .slider-row { background: #fff; border-color: #ddd; }
    .slider-row span { font-size: 0.8125rem; white-space: nowrap; }
    .slider-row input[type="range"] { flex: 1; min-width: 0; }
    .slider-row .value {
      font-size: 0.8125rem; font-variant-numeric: tabular-nums;
      color: #aaa; min-width: 3ch; text-align: right;
    }
    [data-theme="light"] .slider-row .value { color: #666; }

    /* Segmented control */
    .segmented {
      display: flex; border: 1px solid #222; border-radius: 6px; overflow: hidden;
    }
    [data-theme="light"] .segmented { border-color: #ddd; }
    .segmented button {
      flex: 1; padding: 0.375rem 0.5rem; background: #1a1a1a; color: #888;
      border: none; cursor: pointer; font-size: 0.8125rem; transition: all 0.15s;
    }
    [data-theme="light"] .segmented button { background: #fff; color: #888; }
    .segmented button + button { border-left: 1px solid #222; }
    [data-theme="light"] .segmented button + button { border-color: #ddd; }
    .segmented button.active { background: #2a2a4e; color: #7c8aff; }
    [data-theme="light"] .segmented button.active { background: #e8e8ff; color: #4a5aff; }

    /* Toggle */
    .toggle-row {
      display: flex; align-items: center; justify-content: space-between;
      padding: 0.375rem 0;
    }
    .toggle-row span { font-size: 0.8125rem; }
    .toggle {
      width: 36px; height: 20px; background: #333; border-radius: 10px;
      position: relative; cursor: pointer; transition: background 0.2s; border: none;
    }
    .toggle.on { background: #4a5aff; }
    .toggle::after {
      content: ''; position: absolute; top: 2px; left: 2px;
      width: 16px; height: 16px; background: #fff; border-radius: 50%;
      transition: transform 0.2s;
    }
    .toggle.on::after { transform: translateX(16px); }

    /* Palette grid */
    .palette-header { display: flex; justify-content: space-between; align-items: center; }
    .palette-header button {
      font-size: 0.75rem; background: none; border: none; color: #7c8aff;
      cursor: pointer; padding: 0.125rem 0;
    }
    .palette-header button:hover { text-decoration: underline; }
    .palette-grid {
      display: grid; grid-template-columns: repeat(6, 1fr); gap: 6px;
    }
    .palette-swatch {
      width: 100%; aspect-ratio: 1; border-radius: 50%; cursor: pointer;
      border: 2px solid transparent; transition: border-color 0.15s;
    }
    .palette-swatch.active { border-color: #fff; }
    [data-theme="light"] .palette-swatch.active { border-color: #333; }

    /* Custom colors */
    .custom-colors-header { display: flex; justify-content: space-between; align-items: center; }
    .custom-colors-header button {
      font-size: 0.75rem; background: none; border: none; color: #7c8aff;
      cursor: pointer; padding: 0.125rem 0;
    }
    .custom-colors-header button:hover { text-decoration: underline; }
    .color-stops { display: flex; flex-direction: column; gap: 6px; }
    .color-stop {
      display: flex; align-items: center; gap: 0.5rem;
    }
    .color-stop input[type="color"] {
      width: 32px; height: 32px; border: 1px solid #333; border-radius: 6px;
      background: none; cursor: pointer; padding: 0;
    }
    [data-theme="light"] .color-stop input[type="color"] { border-color: #ccc; }
    .color-stop .hex {
      font-size: 0.75rem; color: #888; font-family: monospace; flex: 1;
    }
    .color-stop .remove-stop {
      background: none; border: none; color: #666; cursor: pointer;
      font-size: 1rem; padding: 0 0.25rem; line-height: 1;
    }
    .color-stop .remove-stop:hover { color: #ff7c7c; }
    .add-stop-btn {
      background: #1a1a1a; border: 1px dashed #444; color: #888;
      padding: 0.375rem; border-radius: 6px; cursor: pointer;
      font-size: 0.75rem; text-align: center; transition: border-color 0.15s;
    }
    [data-theme="light"] .add-stop-btn { background: #fff; border-color: #ccc; }
    .add-stop-btn:hover { border-color: #7c8aff; color: #7c8aff; }
    .custom-active-indicator {
      font-size: 0.6875rem; color: #7c8aff; font-weight: 500;
    }

    /* Shuffle button */
    .shuffle-btn {
      position: fixed; bottom: 1.5rem; left: 50%; transform: translateX(-50%);
      background: #1a1a1a; border: 1px solid #333; color: #e0e0e0;
      padding: 0.5rem 1.25rem; border-radius: 8px; cursor: pointer;
      font-size: 0.875rem; z-index: 10; transition: background 0.15s;
    }
    [data-theme="light"] .shuffle-btn { background: #fff; border-color: #ccc; color: #222; }
    .shuffle-btn:hover { background: #252525; }
    [data-theme="light"] .shuffle-btn:hover { background: #f0f0f0; }

    /* Preview mode — hide all chrome, show only the shadow card */
    [data-preview] .sidebar,
    [data-preview] .xy-pad-container,
    [data-preview] .shuffle-btn,
    [data-preview] #theme-toggle { display: none !important; }
    [data-preview] .preview {
      width: 100vw; height: 100vh;
      overflow: hidden;
    }
    [data-preview] .card-container {
      transform: scale(0.65);
      transform-origin: center center;
    }
  </style>

  <div class="layout">
    <div class="preview">
      <div class="card-container">
        <canvas id="shadow"></canvas>
        <div class="card" id="card">funky shadow</div>
      </div>
    </div>

    <div class="sidebar">
      <div>
        <div class="section-label">Dimensions</div>
        <div class="slider-row"><span>Width</span><input type="range" min="100" max="600" data-prop="width" /><span class="value"></span></div>
        <div class="slider-row" style="margin-top:4px"><span>Height</span><input type="range" min="60" max="400" data-prop="height" /><span class="value"></span></div>
        <div class="slider-row" style="margin-top:4px"><span>Radius</span><input type="range" min="0" max="100" data-prop="radius" /><span class="value"></span></div>
      </div>

      <div>
        <div class="section-label">Shadow</div>
        <div class="slider-row"><span>X Offset</span><input type="range" min="-60" max="60" data-prop="offsetX" /><span class="value"></span></div>
        <div class="slider-row" style="margin-top:4px"><span>Y Offset</span><input type="range" min="-60" max="60" data-prop="offsetY" /><span class="value"></span></div>
        <div class="slider-row" style="margin-top:4px"><span>Blur</span><input type="range" min="0" max="80" data-prop="blur" /><span class="value"></span></div>
        <div class="slider-row" style="margin-top:4px"><span>Opacity</span><input type="range" min="0" max="100" data-prop="opacity" /><span class="value"></span></div>
      </div>

      <div>
        <div class="palette-header">
          <div class="section-label" style="margin:0">Palette</div>
          <button id="randomize-btn">Randomize</button>
        </div>
        <div class="palette-grid" id="palette-grid"></div>
      </div>

      <div>
        <div class="custom-colors-header">
          <div class="section-label" style="margin:0">Custom Colors</div>
          <span class="custom-active-indicator" id="custom-indicator" hidden>active</span>
        </div>
        <div class="color-stops" id="color-stops"></div>
        <button class="add-stop-btn" id="add-stop-btn">+ Add color stop</button>
        <button class="add-stop-btn" id="use-preset-btn" style="margin-top:4px" hidden>Back to preset</button>
      </div>

      <div>
        <div class="section-label">Shape</div>
        <div class="segmented" id="shape-seg">
          <button data-val="line">Linear</button>
          <button data-val="radial">Radial</button>
        </div>
      </div>

      <div>
        <div class="slider-row"><span>Angle</span><input type="range" min="0" max="360" data-prop="angle" /><span class="value"></span></div>
      </div>

      <div>
        <div class="slider-row"><span>Spread</span><input type="range" min="0" max="200" data-prop="spread" /><span class="value"></span></div>
      </div>

      <div>
        <div class="section-label">Pixel Scale</div>
        <div class="segmented" id="pixelscale-seg">
          <button data-val="1">1px</button>
          <button data-val="2">2px</button>
          <button data-val="3">3px</button>
          <button data-val="4">4px</button>
          <button data-val="5">5px</button>
          <button data-val="6">6px</button>
        </div>
      </div>

      <div>
        <div class="section-label">Dither</div>
        <div class="segmented" id="dither-seg">
          <button data-val="off">Off</button>
          <button data-val="2x2">2x2</button>
          <button data-val="4x4">4x4</button>
          <button data-val="8x8">8x8</button>
        </div>
      </div>

      <div>
        <div class="slider-row"><span>Quant Levels</span><input type="range" min="2" max="7" step="1" data-prop="quantLevels" /><span class="value"></span></div>
      </div>

      <div>
        <div class="toggle-row">
          <span>Oklab Interpolation</span>
          <button class="toggle" id="oklab-toggle"></button>
        </div>
      </div>

      <div>
        <div class="slider-row"><span>Contrast</span><input type="range" min="50" max="200" data-prop="contrast" /><span class="value"></span></div>
        <div class="slider-row" style="margin-top:4px"><span>Brightness</span><input type="range" min="-50" max="50" data-prop="brightness" /><span class="value"></span></div>
      </div>
    </div>
  </div>

  <!-- XY Pad -->
  <div class="xy-pad-container">
    <div class="xy-labels">
      <span>X <strong id="xy-x">0</strong></span>
      <span>Y <strong id="xy-y">0</strong></span>
    </div>
    <div class="xy-pad" id="xy-pad">
      <div class="xy-dot" id="xy-dot"></div>
    </div>
    <div class="xy-extra">
      <label>Blur <input type="range" min="0" max="80" id="xy-blur" /></label>
      <label>Opacity <input type="range" min="0" max="100" id="xy-opacity" /></label>
    </div>
  </div>

  <button class="shuffle-btn" id="shuffle-btn">Shuffle</button>
`

const canvas = document.getElementById('shadow') as HTMLCanvasElement
const card = document.getElementById('card') as HTMLDivElement

// ---- Palette ----
const paletteGrid = document.getElementById('palette-grid')!
function renderPalette() {
  paletteGrid.innerHTML = ''
  for (const p of PRESETS) {
    const swatch = document.createElement('button')
    swatch.className = `palette-swatch${state.preset === p.id ? ' active' : ''}`
    const mid = p.stops[Math.floor(p.stops.length / 2)]
    const edge = p.stops[p.stops.length - 1]
    swatch.style.background = `radial-gradient(circle, rgb(${mid}), rgb(${edge}))`
    swatch.addEventListener('click', () => {
      state.preset = p.id
      delete (state as any).colors
      customStops = []
      renderPalette()
      renderCustomColors()
      update()
    })
    paletteGrid.appendChild(swatch)
  }
}
renderPalette()

document.getElementById('randomize-btn')!.addEventListener('click', () => {
  const idx = Math.floor(Math.random() * PRESETS.length)
  state.preset = PRESETS[idx].id
  delete (state as any).colors
  renderPalette()
  renderCustomColors()
  update()
})

// ---- Custom Colors ----
const colorStopsContainer = document.getElementById('color-stops')!
const addStopBtn = document.getElementById('add-stop-btn')!
const usePresetBtn = document.getElementById('use-preset-btn')!
const customIndicator = document.getElementById('custom-indicator')!

let customStops: [number, number, number][] = []

function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return [r, g, b]
}

function rgbToHex(rgb: [number, number, number]): string {
  return '#' + rgb.map(c => c.toString(16).padStart(2, '0')).join('')
}

function applyCustomColors() {
  if (customStops.length >= 2) {
    state.colors = [...customStops]
    customIndicator.hidden = false
    usePresetBtn.hidden = false
    // Deselect palette
    paletteGrid.querySelectorAll('.palette-swatch').forEach(s => s.classList.remove('active'))
    update()
  }
}

function renderCustomColors() {
  colorStopsContainer.innerHTML = ''
  const isCustomActive = !!state.colors

  customIndicator.hidden = !isCustomActive
  usePresetBtn.hidden = !isCustomActive

  customStops.forEach((stop, i) => {
    const row = document.createElement('div')
    row.className = 'color-stop'

    const picker = document.createElement('input')
    picker.type = 'color'
    picker.value = rgbToHex(stop)
    picker.addEventListener('input', () => {
      customStops[i] = hexToRgb(picker.value)
      hex.textContent = picker.value
      applyCustomColors()
    })

    const hex = document.createElement('span')
    hex.className = 'hex'
    hex.textContent = rgbToHex(stop)

    const removeBtn = document.createElement('button')
    removeBtn.className = 'remove-stop'
    removeBtn.textContent = '\u00D7'
    removeBtn.addEventListener('click', () => {
      customStops.splice(i, 1)
      if (customStops.length < 2) {
        delete (state as any).colors
        update()
      } else {
        applyCustomColors()
      }
      renderCustomColors()
    })

    row.appendChild(picker)
    row.appendChild(hex)
    row.appendChild(removeBtn)
    colorStopsContainer.appendChild(row)
  })
}

addStopBtn.addEventListener('click', () => {
  // If first time, seed with two colors
  if (customStops.length === 0) {
    customStops.push([0, 0, 0], [255, 255, 255])
  } else {
    // Add a random color
    const r = Math.floor(Math.random() * 256)
    const g = Math.floor(Math.random() * 256)
    const b = Math.floor(Math.random() * 256)
    customStops.push([r, g, b])
  }
  applyCustomColors()
  renderCustomColors()
})

usePresetBtn.addEventListener('click', () => {
  delete (state as any).colors
  customStops = []
  renderPalette()
  renderCustomColors()
  update()
})

renderCustomColors()

// ---- Sliders ----
function syncSliders() {
  document.querySelectorAll<HTMLInputElement>('[data-prop]').forEach((input) => {
    const prop = input.dataset.prop as keyof typeof state
    let val = (state as any)[prop]
    if (prop === 'opacity') val = Math.round(val * 100)
    input.value = String(val)
    const valueEl = input.parentElement?.querySelector('.value')
    if (valueEl) {
      let display = String(val)
      if (prop === 'angle') display += '\u00B0'
      else if (prop === 'opacity') display += '%'
      else if (['width', 'height', 'radius', 'offsetX', 'offsetY', 'blur', 'spread'].includes(prop)) display += 'px'
      valueEl.textContent = display
    }
  })
}

document.querySelectorAll<HTMLInputElement>('[data-prop]').forEach((input) => {
  input.addEventListener('input', () => {
    const prop = input.dataset.prop as string
    let val = Number(input.value)
    if (prop === 'opacity') val = val / 100
    ;(state as any)[prop] = val
    syncSliders()
    syncXYPad()
    update()
  })
})

// ---- Segmented controls ----
function initSegmented(id: string, prop: string) {
  const container = document.getElementById(id)!
  function activate() {
    container.querySelectorAll('button').forEach((btn) => {
      const val = btn.dataset.val!
      btn.classList.toggle('active', String((state as any)[prop]) === val)
    })
  }
  container.querySelectorAll('button').forEach((btn) => {
    btn.addEventListener('click', () => {
      const val = btn.dataset.val!
      ;(state as any)[prop] = prop === 'pixelScale' ? Number(val) : val
      activate()
      update()
    })
  })
  activate()
}
initSegmented('shape-seg', 'shape')
initSegmented('pixelscale-seg', 'pixelScale')
initSegmented('dither-seg', 'dither')

// ---- Oklab toggle ----
const oklabToggle = document.getElementById('oklab-toggle')!
function syncOklab() {
  oklabToggle.classList.toggle('on', state.oklab)
}
oklabToggle.addEventListener('click', () => {
  state.oklab = !state.oklab
  syncOklab()
  update()
})
syncOklab()

// ---- XY Pad ----
const xyPad = document.getElementById('xy-pad')!
const xyDot = document.getElementById('xy-dot')!
const xyXLabel = document.getElementById('xy-x')!
const xyYLabel = document.getElementById('xy-y')!
const xyBlur = document.getElementById('xy-blur') as HTMLInputElement
const xyOpacity = document.getElementById('xy-opacity') as HTMLInputElement

function syncXYPad() {
  const x = ((state.offsetX + 60) / 120) * 100
  const y = ((state.offsetY + 60) / 120) * 100
  xyDot.style.left = `${x}%`
  xyDot.style.top = `${y}%`
  xyXLabel.textContent = String(state.offsetX)
  xyYLabel.textContent = String(state.offsetY)
  xyBlur.value = String(state.blur)
  xyOpacity.value = String(Math.round(state.opacity * 100))
}

function handleXYMove(e: PointerEvent) {
  const rect = xyPad.getBoundingClientRect()
  const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
  const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height))
  state.offsetX = Math.round(x * 120 - 60)
  state.offsetY = Math.round(y * 120 - 60)
  syncXYPad()
  syncSliders()
  update()
}

xyPad.addEventListener('pointerdown', (e) => {
  handleXYMove(e)
  const onMove = (ev: PointerEvent) => handleXYMove(ev)
  const onUp = () => {
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerup', onUp)
  }
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', onUp)
})

xyBlur.addEventListener('input', () => {
  state.blur = Number(xyBlur.value)
  syncSliders()
  update()
})
xyOpacity.addEventListener('input', () => {
  state.opacity = Number(xyOpacity.value) / 100
  syncSliders()
  update()
})

// ---- Shuffle ----
document.getElementById('shuffle-btn')!.addEventListener('click', () => {
  state.width = Math.floor(Math.random() * 400) + 150
  state.height = Math.floor(Math.random() * 280) + 100
  state.radius = Math.floor(Math.random() * 60)
  state.preset = PRESETS[Math.floor(Math.random() * PRESETS.length)].id
  state.pixelScale = Math.ceil(Math.random() * 5)
  state.dither = (['off', '2x2', '4x4', '8x8'] as const)[Math.floor(Math.random() * 4)]
  state.shape = Math.random() > 0.5 ? 'radial' : 'line'
  state.angle = Math.floor(Math.random() * 360)
  state.spread = Math.floor(Math.random() * 200)
  state.blur = Math.floor(Math.random() * 60) + 10
  state.opacity = Math.round((Math.random() * 0.6 + 0.3) * 100) / 100
  state.offsetX = Math.floor(Math.random() * 80) - 40
  state.offsetY = Math.floor(Math.random() * 80) - 40
  state.contrast = Math.floor(Math.random() * 100) + 80
  state.brightness = Math.floor(Math.random() * 40) - 20
  state.quantLevels = Math.floor(Math.random() * 5) + 2
  delete (state as any).colors
  customStops = []

  renderPalette()
  renderCustomColors()
  syncSliders()
  syncXYPad()
  syncOklab()
  initSegmented('shape-seg', 'shape')
  initSegmented('pixelscale-seg', 'pixelScale')
  initSegmented('dither-seg', 'dither')
  update()
})

// ---- Render ----
function update() {
  const { width, height, radius, ...config } = state

  card.style.width = `${width}px`
  card.style.height = `${height}px`
  card.style.borderRadius = `${radius}px`

  renderShadow(canvas, width, height, radius, config)

  // Size canvas CSS to match the library's React component behavior
  const pad = config.blur * 2 + Math.max(Math.abs(config.offsetX), Math.abs(config.offsetY)) + 20
  const canvasW = width + pad * 2
  const canvasH = height + pad * 2
  // Use exact integer multiples of pixelScale for CSS size to avoid
  // sub-pixel scaling artifacts that cause visible color banding
  const ps = config.pixelScale
  const cssW = Math.ceil(canvasW / ps) * ps
  const cssH = Math.ceil(canvasH / ps) * ps
  canvas.style.width = `${cssW}px`
  canvas.style.height = `${cssH}px`
  canvas.style.left = `calc(50% - ${cssW / 2}px)`
  canvas.style.top = `calc(50% - ${cssH / 2}px)`
  canvas.style.opacity = String(config.opacity)
}

syncSliders()
syncXYPad()
update()
