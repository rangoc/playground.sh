import { renderShadow, PRESETS, DEFAULT_CONFIG, type ShadowConfig } from 'funky-shadow'
import { initTheme } from '@shared/theme'
import { applyPreviewClass } from '@shared/preview'
import { createSlider, createSegmented, createToggle, createSection, createSidebar } from '@shared/sidebar'
import '@shared/sidebar.css'

const isPreview = applyPreviewClass()
if (!isPreview) initTheme()

const state: ShadowConfig & { width: number; height: number; radius: number } = {
  ...DEFAULT_CONFIG,
  width: 320,
  height: 200,
  radius: 16,
}

let customStops: [number, number, number][] = []

// ---- Scaffold page ----
const app = document.getElementById('app')!
app.innerHTML = `
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', -apple-system, sans-serif;
      background: #f5f5f7; color: #1d1d1f;
      min-height: 100vh; transition: background 0.2s, color 0.2s;
    }
    [data-theme="dark"] body { background: #000; color: #fff; }

    .layout { display: flex; min-height: 100vh; }
    .preview-area {
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
      background: #fff; border-radius: 16px;
      display: flex; align-items: center; justify-content: center;
      font-size: 17px; font-weight: 500; color: #1d1d1f;
      box-shadow: 0 1px 4px rgba(0,0,0,0.06);
      transition: background 0.2s, color 0.2s;
    }
    [data-theme="dark"] .card { background: #1c1c1e; color: #fff; box-shadow: none; }

    /* XY Pad (inline in sidebar) */
    .xy-labels { display: flex; gap: 10px; font-size: 12px; color: var(--sb-label, rgba(0,0,0,0.48)); }
    .xy-labels strong { color: var(--sb-text, #1d1d1f); font-variant-numeric: tabular-nums; }
    .xy-pad {
      width: 100%; max-width: 120px; aspect-ratio: 1;
      background: var(--sb-control-bg, #e8e8ed); border-radius: 12px;
      position: relative; cursor: crosshair; touch-action: none;
    }
    .xy-dot {
      width: 10px; height: 10px; background: var(--sb-track-fill, #1d1d1f); border-radius: 50%;
      position: absolute; transform: translate(-50%, -50%); pointer-events: none;
      border: 2px solid var(--sb-toggle-thumb, #fff); box-shadow: 0 1px 3px rgba(0,0,0,0.2);
    }
    /* Shuffle */
    .shuffle-btn {
      position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
      background: #fff; border: 1px solid rgba(0,0,0,0.1); color: #1d1d1f;
      padding: 8px 20px; border-radius: 980px; cursor: pointer;
      font-size: 14px; font-weight: 400; font-family: 'Inter', sans-serif;
      z-index: 10; transition: all 0.15s; letter-spacing: -0.2px;
    }
    [data-theme="dark"] .shuffle-btn { background: #2c2c2e; border-color: rgba(255,255,255,0.1); color: #fff; }
    .shuffle-btn:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.1); }

    /* Preview mode */
    [data-preview] .sb,
    [data-preview] .shuffle-btn,
    [data-preview] #theme-toggle { display: none !important; }
    [data-preview] .preview-area { width: 100vw; height: 100vh; overflow: hidden; }
    [data-preview] .card-container { transform: scale(0.65); transform-origin: center center; }
  </style>

  <div class="layout">
    <div id="sidebar-mount"></div>
    <div class="preview-area">
      <div class="card-container">
        <canvas id="shadow"></canvas>
        <div class="card" id="card">funky shadow</div>
      </div>
    </div>
  </div>

  <button class="shuffle-btn" id="shuffle-btn">Shuffle</button>
`

const canvas = document.getElementById('shadow') as HTMLCanvasElement
const card = document.getElementById('card') as HTMLDivElement
const sidebarMount = document.getElementById('sidebar-mount')!

// ---- Build Sidebar ----
const sb = createSidebar()
sidebarMount.appendChild(sb)

// All slider/control refs for syncing
const controls: Record<string, { setValue: (v: number | string | boolean) => void }> = {}

// Dimensions
const dimSection = createSection()
const widthSlider = createSlider({ label: 'Width', min: 100, max: 600, value: state.width, suffix: 'px', onChange: v => { state.width = v; update() } })
const heightSlider = createSlider({ label: 'Height', min: 60, max: 400, value: state.height, suffix: 'px', onChange: v => { state.height = v; update() } })
const radiusSlider = createSlider({ label: 'Radius', min: 0, max: 100, value: state.radius, suffix: 'px', onChange: v => { state.radius = v; update() } })
dimSection.append(widthSlider.el, heightSlider.el, radiusSlider.el)
controls.width = widthSlider; controls.height = heightSlider; controls.radius = radiusSlider
sb.appendChild(dimSection)

// Shadow
const shadowSection = createSection()
const xOffsetSlider = createSlider({ label: 'X Offset', min: -60, max: 60, value: state.offsetX, suffix: 'px', onChange: v => { state.offsetX = v; syncXYPad(); update() } })
const yOffsetSlider = createSlider({ label: 'Y Offset', min: -60, max: 60, value: state.offsetY, suffix: 'px', onChange: v => { state.offsetY = v; syncXYPad(); update() } })
const blurSlider = createSlider({ label: 'Blur', min: 0, max: 80, value: state.blur, suffix: 'px', onChange: v => { state.blur = v; syncXYPad(); update() } })
const opacitySlider = createSlider({ label: 'Opacity', min: 0, max: 100, value: Math.round(state.opacity * 100), suffix: '%', onChange: v => { state.opacity = v / 100; syncXYPad(); update() } })
shadowSection.append(xOffsetSlider.el, yOffsetSlider.el, blurSlider.el, opacitySlider.el)
controls.offsetX = xOffsetSlider; controls.offsetY = yOffsetSlider; controls.blur = blurSlider; controls.opacity = opacitySlider
sb.appendChild(shadowSection)

// XY Pad (Position)
const xySection = createSection('Position')
const xyLabels = document.createElement('div')
xyLabels.className = 'xy-labels'
xyLabels.innerHTML = '<span>X <strong id="xy-x">0</strong></span><span>Y <strong id="xy-y">0</strong></span>'
xySection.appendChild(xyLabels)

const xyPadEl = document.createElement('div')
xyPadEl.className = 'xy-pad'
xyPadEl.id = 'xy-pad'
const xyDotEl = document.createElement('div')
xyDotEl.className = 'xy-dot'
xyDotEl.id = 'xy-dot'
xyPadEl.appendChild(xyDotEl)
xySection.appendChild(xyPadEl)
sb.appendChild(xySection)

// Palette
const paletteSection = createSection()
const paletteHeader = document.createElement('div')
paletteHeader.className = 'sb-palette-header'
const paletteLbl = document.createElement('div')
paletteLbl.className = 'sb-label'
paletteLbl.textContent = 'Palette'
const randomizeBtn = document.createElement('button')
randomizeBtn.className = 'sb-palette-header__action'
randomizeBtn.textContent = 'Randomize'
paletteHeader.append(paletteLbl, randomizeBtn)
paletteSection.appendChild(paletteHeader)

const paletteGrid = document.createElement('div')
paletteGrid.className = 'sb-palette-grid'
paletteSection.appendChild(paletteGrid)

function renderPalette() {
  paletteGrid.innerHTML = ''
  for (const p of PRESETS) {
    const swatch = document.createElement('button')
    swatch.className = `sb-swatch${state.preset === p.id && !state.colors ? ' active' : ''}`
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

randomizeBtn.addEventListener('click', () => {
  state.preset = PRESETS[Math.floor(Math.random() * PRESETS.length)].id
  delete (state as any).colors
  customStops = []
  renderPalette()
  renderCustomColors()
  update()
})

sb.appendChild(paletteSection)

// Custom Colors (inline circles)
const colorsSection = createSection()
const colorsHeader = document.createElement('div')
colorsHeader.className = 'sb-palette-header'
const colorsLbl = document.createElement('div')
colorsLbl.className = 'sb-label'
colorsLbl.textContent = 'Colors'
const colorsActive = document.createElement('span')
colorsActive.className = 'sb-active-badge'
colorsActive.hidden = true
colorsActive.textContent = 'active'
colorsHeader.append(colorsLbl, colorsActive)
colorsSection.appendChild(colorsHeader)

const colorsRow = document.createElement('div')
colorsRow.className = 'sb-colors-row'
colorsSection.appendChild(colorsRow)

const backLink = document.createElement('button')
backLink.className = 'sb-back-link'
backLink.textContent = 'Back to preset'
backLink.hidden = true
backLink.addEventListener('click', () => {
  delete (state as any).colors
  customStops = []
  renderPalette()
  renderCustomColors()
  update()
})
colorsSection.appendChild(backLink)

function hexToRgb(hex: string): [number, number, number] {
  return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)]
}

function rgbToHex(rgb: [number, number, number]): string {
  return '#' + rgb.map(c => c.toString(16).padStart(2, '0')).join('')
}

function applyCustomColors() {
  if (customStops.length >= 2) {
    state.colors = [...customStops]
    paletteGrid.querySelectorAll('.sb-swatch').forEach(s => s.classList.remove('active'))
    update()
  }
}

function renderCustomColors() {
  colorsRow.innerHTML = ''
  const isCustom = !!state.colors
  colorsActive.hidden = !isCustom
  backLink.hidden = !isCustom

  for (let i = 0; i < customStops.length; i++) {
    const stop = customStops[i]
    const colorInput = document.createElement('input')
    colorInput.type = 'color'
    colorInput.className = 'sb-color-circle'
    colorInput.value = rgbToHex(stop)
    colorInput.addEventListener('input', () => {
      customStops[i] = hexToRgb(colorInput.value)
      applyCustomColors()
    })
    colorsRow.appendChild(colorInput)
  }

  const addBtn = document.createElement('button')
  addBtn.className = 'sb-color-add'
  addBtn.textContent = '+'
  addBtn.addEventListener('click', () => {
    if (customStops.length === 0) {
      customStops.push([0, 0, 0], [255, 255, 255])
    } else {
      customStops.push([Math.floor(Math.random() * 256), Math.floor(Math.random() * 256), Math.floor(Math.random() * 256)])
    }
    applyCustomColors()
    renderCustomColors()
  })
  colorsRow.appendChild(addBtn)
}
renderCustomColors()

sb.appendChild(colorsSection)

// Shape
const shapeSection = createSection('Shape')
const shapeSeg = createSegmented({
  options: [{ label: 'Linear', value: 'line' }, { label: 'Radial', value: 'radial' }],
  value: state.shape,
  onChange: v => { state.shape = v as any; update() },
})
shapeSection.appendChild(shapeSeg.el)
controls.shape = shapeSeg
sb.appendChild(shapeSection)

// Angle & Spread
const geoSection = createSection()
const angleSlider = createSlider({ label: 'Angle', min: 0, max: 360, value: state.angle, suffix: '\u00B0', onChange: v => { state.angle = v; update() } })
const spreadSlider = createSlider({ label: 'Spread', min: 0, max: 200, value: state.spread, onChange: v => { state.spread = v; update() } })
geoSection.append(angleSlider.el, spreadSlider.el)
controls.angle = angleSlider; controls.spread = spreadSlider
sb.appendChild(geoSection)

// Pixel Scale
const pxSection = createSection('Pixel Scale')
const pxSeg = createSegmented({
  options: [{ label: '1px', value: '1' }, { label: '2px', value: '2' }, { label: '3px', value: '3' }, { label: '4px', value: '4' }, { label: '5px', value: '5' }, { label: '6px', value: '6' }],
  value: String(state.pixelScale),
  onChange: v => { state.pixelScale = Number(v); update() },
})
pxSection.appendChild(pxSeg.el)
controls.pixelScale = pxSeg
sb.appendChild(pxSection)

// Dither
const ditherSection = createSection('Dither')
const ditherSeg = createSegmented({
  options: [{ label: 'Off', value: 'off' }, { label: '2\u00D72', value: '2x2' }, { label: '4\u00D74', value: '4x4' }, { label: '8\u00D78', value: '8x8' }],
  value: state.dither,
  onChange: v => { state.dither = v as any; update() },
})
ditherSection.appendChild(ditherSeg.el)
controls.dither = ditherSeg
sb.appendChild(ditherSection)

// Quant Levels
const quantSection = createSection()
const quantSlider = createSlider({ label: 'Quant Levels', min: 2, max: 7, step: 1, value: state.quantLevels, onChange: v => { state.quantLevels = v; update() } })
quantSection.appendChild(quantSlider.el)
controls.quantLevels = quantSlider
sb.appendChild(quantSection)

// Oklab
const oklabSection = createSection()
const oklabToggle = createToggle({ label: 'Oklab Interpolation', value: state.oklab, onChange: v => { state.oklab = v; update() } })
oklabSection.appendChild(oklabToggle.el)
controls.oklab = oklabToggle
sb.appendChild(oklabSection)

// Contrast & Brightness
const cbSection = createSection()
const contrastSlider = createSlider({ label: 'Contrast', min: 50, max: 200, value: state.contrast, onChange: v => { state.contrast = v; update() } })
const brightnessSlider = createSlider({ label: 'Brightness', min: -50, max: 50, value: state.brightness, onChange: v => { state.brightness = v; update() } })
cbSection.append(contrastSlider.el, brightnessSlider.el)
controls.contrast = contrastSlider; controls.brightness = brightnessSlider
sb.appendChild(cbSection)

// ---- XY Pad ----
const xyPad = document.getElementById('xy-pad')!
const xyDot = document.getElementById('xy-dot')!
const xyXLabel = document.getElementById('xy-x')!
const xyYLabel = document.getElementById('xy-y')!
function syncXYPad() {
  const x = ((state.offsetX + 60) / 120) * 100
  const y = ((state.offsetY + 60) / 120) * 100
  xyDot.style.left = `${x}%`
  xyDot.style.top = `${y}%`
  xyXLabel.textContent = String(state.offsetX)
  xyYLabel.textContent = String(state.offsetY)
}

function handleXYMove(e: PointerEvent) {
  const rect = xyPad.getBoundingClientRect()
  const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
  const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height))
  state.offsetX = Math.round(x * 120 - 60)
  state.offsetY = Math.round(y * 120 - 60)
  xOffsetSlider.setValue(state.offsetX)
  yOffsetSlider.setValue(state.offsetY)
  syncXYPad()
  update()
}

xyPad.addEventListener('pointerdown', (e) => {
  handleXYMove(e)
  const onMove = (ev: PointerEvent) => handleXYMove(ev)
  const onUp = () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp) }
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', onUp)
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

  widthSlider.setValue(state.width)
  heightSlider.setValue(state.height)
  radiusSlider.setValue(state.radius)
  xOffsetSlider.setValue(state.offsetX)
  yOffsetSlider.setValue(state.offsetY)
  blurSlider.setValue(state.blur)
  opacitySlider.setValue(Math.round(state.opacity * 100))
  angleSlider.setValue(state.angle)
  spreadSlider.setValue(state.spread)
  quantSlider.setValue(state.quantLevels)
  contrastSlider.setValue(state.contrast)
  brightnessSlider.setValue(state.brightness)
  shapeSeg.setValue(state.shape)
  pxSeg.setValue(String(state.pixelScale))
  ditherSeg.setValue(state.dither)
  oklabToggle.setValue(state.oklab)

  renderPalette()
  renderCustomColors()
  syncXYPad()
  update()
})

// ---- Render ----
function update() {
  const { width, height, radius, ...config } = state

  card.style.width = `${width}px`
  card.style.height = `${height}px`
  card.style.borderRadius = `${radius}px`

  renderShadow(canvas, width, height, radius, config)

  const pad = config.blur * 2 + Math.max(Math.abs(config.offsetX), Math.abs(config.offsetY)) + 20
  const canvasW = width + pad * 2
  const canvasH = height + pad * 2
  const ps = config.pixelScale
  const cssW = Math.ceil(canvasW / ps) * ps
  const cssH = Math.ceil(canvasH / ps) * ps
  canvas.style.width = `${cssW}px`
  canvas.style.height = `${cssH}px`
  canvas.style.left = `calc(50% - ${cssW / 2}px)`
  canvas.style.top = `calc(50% - ${cssH / 2}px)`
  canvas.style.opacity = String(config.opacity)
}

syncXYPad()
update()
