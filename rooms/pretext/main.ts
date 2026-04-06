import {
  prepare, layout, prepareWithSegments, layoutWithLines, clearCache,
} from '@chenglou/pretext'
import { initTheme } from '@shared/theme'
import { applyPreviewClass } from '@shared/preview'
import { createSlider, createSegmented, createToggle, createSection, createSidebar } from '@shared/sidebar'
import '@shared/sidebar.css'

const isPreview = applyPreviewClass()
if (!isPreview) initTheme()

const SAMPLE_TEXTS: Record<string, string> = {
  article: `The architecture of software systems is shaped by the forces that act on them during development. Conway's Law tells us that the structure of a system mirrors the communication structure of the organization that built it. This isn't merely an observation — it's a force as real as gravity.

When teams are small, software tends to be monolithic. Not because monoliths are chosen, but because a single team naturally produces a single cohesive unit. As organizations grow, boundaries emerge along team lines, and the software fractures accordingly.

The interesting question isn't whether this happens — it always does — but whether we can use this knowledge deliberately. If we design our teams to match our desired architecture, the software follows. This is the "Inverse Conway Maneuver," and it's one of the most powerful tools in a technical leader's arsenal.

Consider a platform team responsible for shared infrastructure. Their code naturally becomes a platform: stable interfaces, clear contracts, minimal coupling. Meanwhile, product teams build vertically integrated features that cut through many layers. The architecture reflects the org chart, for better or worse.`,

  code: `function fibonacci(n: number): number {
  if (n <= 1) return n
  return fibonacci(n - 1) + fibonacci(n - 2)
}

// A more efficient approach using memoization:
function fibMemo(n: number, memo: Map<number, number> = new Map()): number {
  if (memo.has(n)) return memo.get(n)!
  if (n <= 1) return n
  const result = fibMemo(n - 1, memo) + fibMemo(n - 2, memo)
  memo.set(n, result)
  return result
}

// Or iteratively, O(n) time and O(1) space:
function fibIterative(n: number): number {
  let a = 0, b = 1
  for (let i = 0; i < n; i++) {
    [a, b] = [b, a + b]
  }
  return a
}`,

  mixed: `Design Systems at Scale 🎨

Building a design system that serves 50+ teams requires thinking about constraints differently. You aren't designing components — you're designing the rules that generate components.

色は文化的な意味を持ちます。赤は西洋では危険を、東洋では幸運を意味することがあります。デザインシステムはこれらの違いを考慮する必要があります。

Key metrics from our rollout:
• 73% reduction in inconsistent UI patterns
• 2.4x faster feature delivery for new teams
• 89% component reuse rate across products
• $2.1M estimated savings in design/dev time

The hardest part wasn't the components. It was getting 200+ engineers to trust that the system would evolve with their needs, not constrain them. 信頼は技術よりも重要です。`,

  emoji: `The Evolution of Digital Communication 💬

From :) to 😊 to 🫠 — emoji have become a genuine linguistic tool. They're not decorative; they carry meaning that text alone cannot.

Consider: "Sure." vs "Sure! 😊" — the emoji completely changes the tone. Or the progression: 👍 → 👍🏽 → the introduction of skin tone modifiers was a meaningful step toward inclusive representation.

Complex sequences like 👨‍👩‍👧‍👦 (family) or 🏳️‍🌈 (pride flag) are built from multiple code points joined by Zero-Width Joiners. Text layout engines must treat these as single grapheme clusters — breaking them mid-sequence would render as separate emoji.

This is exactly the kind of problem pretext solves: accurate grapheme-aware text measurement across all Unicode, without DOM reflow. 🚀`,
}

let fontSize = 16
let lineHeightMult = 1.6
let sampleKey = 'article'
let whiteSpace: 'normal' | 'pre-wrap' = 'normal'
let showLineBreaks = true
let showWidthBars = true
let currentText = SAMPLE_TEXTS.article

// Prepared handle — created once, reused on every resize
let preparedHandle: any = null
let preparedSegHandle: any = null
let lastPrepareTime = 0

const app = document.getElementById('app')!
app.innerHTML = `
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', -apple-system, sans-serif;
      background: var(--bg, #f5f5f7); color: var(--text-primary, #1d1d1f);
      min-height: 100vh;
    }
    .layout { display: flex; min-height: 100vh; }
    .main-area {
      flex: 1; display: flex; flex-direction: column; overflow: hidden;
      min-height: 0; height: 100vh;
    }

    /* Stats banner */
    .banner {
      padding: 12px 24px; display: flex; gap: 20px; flex-wrap: wrap;
      font-size: 13px; color: var(--text-secondary, rgba(0,0,0,0.48));
      border-bottom: 1px solid var(--border, rgba(0,0,0,0.08));
      flex-shrink: 0;
    }
    .banner strong { color: var(--text-primary, #1d1d1f); font-weight: 600; }
    .banner .fast { color: #34c759; font-weight: 700; }
    .banner .label { color: var(--text-tertiary, rgba(0,0,0,0.3)); }

    /* Canvas area */
    .canvas-area {
      flex: 1; overflow: auto; display: flex; justify-content: center;
      padding: 32px; min-height: 0;
    }
    .canvas-container {
      position: relative; flex-shrink: 0;
    }
    canvas {
      display: block; border-radius: 4px;
    }

    /* Resize handle */
    .resize-handle {
      position: absolute; top: 0; right: -8px; width: 16px; height: 100%;
      cursor: col-resize; z-index: 2;
      display: flex; align-items: center; justify-content: center;
    }
    .resize-handle::after {
      content: ''; width: 4px; height: 40px; border-radius: 2px;
      background: var(--blue, #0071e3); opacity: 0.4; transition: opacity 0.15s;
    }
    .resize-handle:hover::after { opacity: 0.8; }

    /* Width indicator */
    .width-indicator {
      position: absolute; bottom: -24px; right: -8px;
      font-size: 11px; font-weight: 600; color: var(--blue, #0071e3);
      font-variant-numeric: tabular-nums;
    }

    /* Textarea */
    .text-input {
      width: 100%; min-height: 100px; padding: 12px; border-radius: 8px;
      background: var(--surface, #fff); border: 1px solid var(--border, rgba(0,0,0,0.08));
      color: var(--text-primary, #1d1d1f); font-family: 'Inter', sans-serif;
      font-size: 13px; resize: vertical; outline: none; transition: border-color 0.15s;
    }
    .text-input:focus { border-color: #0071e3; }

    /* Preview mode */
    [data-preview] .sb, [data-preview] #theme-toggle { display: none !important; }
    [data-preview] .main-area { width: 100vw; }
  </style>

  <div class="layout">
    <div id="sidebar-mount"></div>
    <div class="main-area">
      <div class="banner" id="banner"></div>
      <div class="canvas-area" id="canvas-area">
        <div class="canvas-container" id="canvas-container">
          <canvas id="canvas"></canvas>
          <div class="resize-handle" id="resize-handle"></div>
          <div class="width-indicator" id="width-indicator"></div>
        </div>
      </div>
    </div>
  </div>
`

// ---- Sidebar ----
const sb = createSidebar()
document.getElementById('sidebar-mount')!.appendChild(sb)

let canvasWidth = 500

const textSection = createSection('Text')
const textarea = document.createElement('textarea')
textarea.className = 'text-input'
textarea.rows = 6
textarea.value = currentText
textarea.addEventListener('input', () => {
  currentText = textarea.value
  doPrepare()
  doLayout()
})
textSection.appendChild(textarea)

const sampleSeg = createSegmented({
  options: [
    { label: 'Article', value: 'article' },
    { label: 'Code', value: 'code' },
    { label: 'Mixed', value: 'mixed' },
    { label: 'Emoji', value: 'emoji' },
  ],
  value: sampleKey,
  onChange: v => {
    sampleKey = v
    currentText = SAMPLE_TEXTS[v] ?? SAMPLE_TEXTS.article
    textarea.value = currentText
    whiteSpace = v === 'code' ? 'pre-wrap' : 'normal'
    wsSeg.setValue(whiteSpace)
    doPrepare()
    doLayout()
  }
})
textSection.appendChild(sampleSeg.el)
sb.appendChild(textSection)

const fontSection = createSection('Font')
const fontSlider = createSlider({
  label: 'Size', min: 10, max: 36, value: fontSize, suffix: 'px',
  onChange: v => { fontSize = v; doPrepare(); doLayout() }
})
const lhSlider = createSlider({
  label: 'Line Height', min: 12, max: 25, value: 16, suffix: '',
  onChange: v => { lineHeightMult = v / 10; doLayout() }
})
fontSection.append(fontSlider.el, lhSlider.el)
sb.appendChild(fontSection)

const wsSection = createSection('White Space')
const wsSeg = createSegmented({
  options: [
    { label: 'normal', value: 'normal' },
    { label: 'pre-wrap', value: 'pre-wrap' },
  ],
  value: whiteSpace,
  onChange: v => { whiteSpace = v as any; doPrepare(); doLayout() }
})
wsSection.appendChild(wsSeg.el)
sb.appendChild(wsSection)

const vizSection = createSection('Visualize')
const lineBreakToggle = createToggle({
  label: 'Line breaks', value: showLineBreaks,
  onChange: v => { showLineBreaks = v; doLayout() }
})
const widthBarToggle = createToggle({
  label: 'Width bars', value: showWidthBars,
  onChange: v => { showWidthBars = v; doLayout() }
})
vizSection.append(lineBreakToggle.el, widthBarToggle.el)
sb.appendChild(vizSection)

const infoSection = createSection('What you\'re seeing')
const infoEl = document.createElement('div')
infoEl.style.cssText = 'font-size: 12px; color: var(--text-secondary, rgba(0,0,0,0.48)); line-height: 1.5; letter-spacing: -0.1px;'
infoEl.innerHTML = `
  <p><strong style="color: var(--text-primary, #1d1d1f)">Drag the blue handle</strong> to resize. pretext recalculates the entire text layout — every line break, every line width — using only <em>layout()</em>, which is pure arithmetic.</p>
  <br>
  <p><strong style="color: var(--text-primary, #1d1d1f)">prepare()</strong> runs once when you change the text or font. It analyzes graphemes, word breaks, and measures character widths.</p>
  <br>
  <p><strong style="color: var(--text-primary, #1d1d1f)">layout()</strong> runs on every resize. It takes the prepared data and computes line breaks at any width. No DOM, no canvas measureText — just math.</p>
`
infoSection.appendChild(infoEl)
sb.appendChild(infoSection)

// ---- Core ----
function doPrepare() {
  const font = `${fontSize}px Inter`
  const t0 = performance.now()
  clearCache()
  preparedHandle = prepare(currentText, font, { whiteSpace })
  preparedSegHandle = prepareWithSegments(currentText, font, { whiteSpace })
  lastPrepareTime = performance.now() - t0
}

function doLayout() {
  const lh = fontSize * lineHeightMult
  const t0 = performance.now()
  const result = layoutWithLines(preparedSegHandle, canvasWidth, lh)
  const layoutMs = performance.now() - t0

  // Update banner
  document.getElementById('banner')!.innerHTML =
    `<span class="label">prepare()</span> <strong>${lastPrepareTime.toFixed(2)}ms</strong>` +
    `<span class="label">layout()</span> <strong class="fast">${layoutMs.toFixed(2)}ms</strong>` +
    `<span class="label">lines</span> <strong>${result.lineCount}</strong>` +
    `<span class="label">height</span> <strong>${result.height.toFixed(0)}px</strong>` +
    `<span class="label">width</span> <strong>${canvasWidth}px</strong>`

  drawCanvas(result.lines, canvasWidth, lh, result.height)

  // Width indicator
  document.getElementById('width-indicator')!.textContent = `${canvasWidth}px`
}

function drawCanvas(
  lines: { text: string; width: number }[],
  maxW: number,
  lh: number,
  totalHeight: number,
) {
  const canvas = document.getElementById('canvas') as HTMLCanvasElement
  const container = document.getElementById('canvas-container')!
  const dpr = window.devicePixelRatio || 1
  const padding = 24
  const w = maxW + padding * 2
  const h = totalHeight + padding * 2

  canvas.width = w * dpr
  canvas.height = h * dpr
  canvas.style.width = `${w}px`
  canvas.style.height = `${h}px`
  container.style.width = `${w}px`

  const ctx = canvas.getContext('2d')!
  ctx.scale(dpr, dpr)

  // Background
  const dark = document.documentElement.getAttribute('data-theme') === 'dark'
  ctx.fillStyle = dark ? '#1c1c1e' : '#ffffff'
  ctx.fillRect(0, 0, w, h)

  // Draw lines
  const font = `${fontSize}px Inter`
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const x = padding
    const y = padding + i * lh

    // Alternating row background
    if (i % 2 === 0) {
      ctx.fillStyle = dark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)'
      ctx.fillRect(padding, y, maxW, lh)
    }

    // Text
    ctx.fillStyle = dark ? '#e5e5e7' : '#1d1d1f'
    ctx.font = font
    ctx.textBaseline = 'top'
    ctx.fillText(line.text, x, y + (lh - fontSize) / 2)

    // Width bar
    if (showWidthBars) {
      ctx.fillStyle = dark ? 'rgba(41,151,255,0.15)' : 'rgba(0,113,227,0.1)'
      ctx.fillRect(x, y + lh - 2, line.width, 2)
    }

    // Line break marker
    if (showLineBreaks && i < lines.length - 1) {
      ctx.fillStyle = dark ? 'rgba(48,209,88,0.4)' : 'rgba(52,199,89,0.4)'
      ctx.fillRect(x + line.width + 4, y + (lh - 8) / 2, 2, 8)
    }
  }

  // Right edge guide
  ctx.strokeStyle = dark ? 'rgba(41,151,255,0.2)' : 'rgba(0,113,227,0.15)'
  ctx.lineWidth = 1
  ctx.setLineDash([3, 3])
  ctx.beginPath()
  ctx.moveTo(padding + maxW, padding)
  ctx.lineTo(padding + maxW, padding + totalHeight)
  ctx.stroke()
  ctx.setLineDash([])
}

// ---- Resize handle ----
const resizeHandle = document.getElementById('resize-handle')!
resizeHandle.addEventListener('pointerdown', (e) => {
  e.preventDefault()
  const startX = e.clientX
  const startW = canvasWidth

  const onMove = (ev: PointerEvent) => {
    canvasWidth = Math.max(100, Math.min(1000, startW + (ev.clientX - startX)))
    doLayout()
  }
  const onUp = () => {
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerup', onUp)
  }
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', onUp)
})

// ---- Init ----
doPrepare()
doLayout()
