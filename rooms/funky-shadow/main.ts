import { renderShadow } from 'funky-shadow'
import { initTheme } from '@shared/theme'

initTheme()

const PRESETS = [
  'galaxy', 'synthwave', 'ocean', 'forest',
  'crt-night', 'thermal', 'plasma', 'deep-scan',
  'sunset-strip', 'vaporwave', 'magma', 'noir',
]

const app = document.getElementById('app')!
app.innerHTML = `
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #0a0a0a; color: #e0e0e0; font-family: system-ui, sans-serif; min-height: 100vh; transition: background 0.2s, color 0.2s; }
    [data-theme="light"] body { background: #f5f5f5; color: #222; }
    #app { display: flex; flex-direction: column; align-items: center; padding: 2rem; gap: 2rem; }
    h1 { font-size: 1.5rem; font-weight: 600; color: #fff; }
    [data-theme="light"] h1 { color: #111; }
    .controls { display: flex; flex-wrap: wrap; gap: 0.75rem; justify-content: center; max-width: 600px; }
    .controls label { display: flex; flex-direction: column; gap: 0.25rem; font-size: 0.8125rem; color: #888; }
    .controls input, .controls select { background: #1a1a1a; border: 1px solid #333; color: #e0e0e0; padding: 0.375rem 0.5rem; border-radius: 4px; font-size: 0.875rem; }
    [data-theme="light"] .controls input, [data-theme="light"] .controls select { background: #fff; border-color: #ccc; color: #222; }
    [data-theme="light"] .controls label { color: #666; }
    .card-container { position: relative; margin-top: 1rem; width: 320px; height: 200px; }
    canvas { position: absolute; z-index: 0; pointer-events: none; image-rendering: pixelated; }
    .card {
      position: relative; z-index: 1;
      width: 320px; height: 200px; background: #1a1a1a; border-radius: 16px;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.125rem; font-weight: 500; color: #fff; border: 1px solid #333;
      transition: background 0.2s, color 0.2s, border-color 0.2s;
    }
    [data-theme="light"] .card { background: #fff; color: #111; border-color: #ddd; }
  </style>
  <h1>funky-shadow</h1>
  <div class="controls">
    <label>preset <select id="preset">${PRESETS.map(p => `<option value="${p}">${p}</option>`).join('')}</select></label>
    <label>pixelScale <input id="pixelScale" type="range" min="1" max="6" value="3" /></label>
    <label>blur <input id="blur" type="range" min="0" max="60" value="30" /></label>
    <label>opacity <input id="opacity" type="range" min="0" max="100" value="70" /></label>
    <label>offsetY <input id="offsetY" type="range" min="-40" max="40" value="20" /></label>
    <label>dither <select id="dither"><option value="off">off</option><option value="2x2">2x2</option><option value="4x4" selected>4x4</option><option value="8x8">8x8</option></select></label>
  </div>
  <div class="card-container">
    <canvas id="shadow"></canvas>
    <div class="card">funky shadow</div>
  </div>
`

const canvas = document.getElementById('shadow') as HTMLCanvasElement
const WIDTH = 320
const HEIGHT = 200
const RADIUS = 16

function getConfig() {
  return {
    preset: (document.getElementById('preset') as HTMLSelectElement).value,
    pixelScale: Number((document.getElementById('pixelScale') as HTMLInputElement).value),
    blur: Number((document.getElementById('blur') as HTMLInputElement).value),
    opacity: Number((document.getElementById('opacity') as HTMLInputElement).value) / 100,
    offsetY: Number((document.getElementById('offsetY') as HTMLInputElement).value),
    dither: (document.getElementById('dither') as HTMLSelectElement).value,
  }
}

function update() {
  const config = getConfig()
  renderShadow(canvas, WIDTH, HEIGHT, RADIUS, config)

  // Size the canvas CSS to match what the library expects (like the React component does)
  const blur = config.blur
  const offX = -15 // default offsetX
  const offY = config.offsetY
  const pad = blur * 2 + Math.max(Math.abs(offX), Math.abs(offY)) + 20
  const canvasW = WIDTH + pad * 2
  const canvasH = HEIGHT + pad * 2

  canvas.style.width = `${canvasW}px`
  canvas.style.height = `${canvasH}px`
  canvas.style.left = `calc(50% - ${canvasW / 2}px)`
  canvas.style.top = `calc(50% - ${canvasH / 2}px)`
  canvas.style.opacity = String(config.opacity)
}

document.querySelectorAll('.controls input, .controls select').forEach((el) => {
  el.addEventListener('input', update)
})

update()
