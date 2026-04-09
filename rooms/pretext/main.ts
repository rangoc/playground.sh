import {
  prepareWithSegments, layoutNextLine, type LayoutCursor,
} from '@chenglou/pretext'
import { applyPreviewClass } from '@shared/preview'

applyPreviewClass()

const FONT_SIZE = 13
const FONT_FAMILY = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
const FONT = `400 ${FONT_SIZE}px ${FONT_FAMILY}`

const messages = [
  "Meeting notes from the Q1 planning session with engineering and design — action items inside",
  "Build passed",
  "Quick sync about the deployment pipeline changes we discussed last Tuesday",
  "Bug #4821: Login button unresponsive on Safari 17.2 after update — priority critical",
  "Hey",
  "Re: Updated auth flow proposal — please review before Friday",
  "All checks passed",
  "Quarterly review template — fill in your section by March 15th",
  "New API endpoints for user management ready for integration testing in staging",
  "OK",
  "Design review for the dashboard redesign — Thursday 2pm",
  "Server maintenance this Saturday 2am–6am EST",
  "Thanks!",
  "Action required: Update SSH keys before April 1st — see wiki for detailed instructions",
  "Lunch?",
]

let prepared: ReturnType<typeof prepareWithSegments>[] = []

function isTruncated(prep: ReturnType<typeof prepareWithSegments>, width: number): boolean {
  if (width <= 0) return true
  const line = layoutNextLine(prep, { segmentIndex: 0, graphemeIndex: 0 }, width)
  if (!line) return true
  return layoutNextLine(prep, line.end, width) !== null
}

const app = document.getElementById('app')!
app.innerHTML = `
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: #0e0e10;
      font-family: ${FONT_FAMILY};
      color: rgba(255,255,255,0.9);
      display: flex;
      justify-content: center;
      padding: 48px 20px;
      min-height: 100vh;
    }

    .root { width: 100%; max-width: 680px; }

    .header { margin-bottom: 32px; }
    .header h1 {
      font-size: 20px; font-weight: 600;
      letter-spacing: -0.3px; margin-bottom: 8px;
    }
    .header p {
      font-size: 13px; color: rgba(255,255,255,0.4);
      line-height: 1.6; max-width: 520px;
    }
    .header code {
      background: rgba(255,255,255,0.08);
      padding: 1px 5px; border-radius: 4px; font-size: 12px;
    }

    .width-control {
      display: flex; align-items: center; gap: 12px; margin-bottom: 16px;
    }
    .width-control label {
      font-size: 12px; color: rgba(255,255,255,0.4); white-space: nowrap;
    }
    .width-control input[type="range"] {
      flex: 1; accent-color: #5ac8fa;
    }
    .width-val {
      font-size: 12px; color: rgba(255,255,255,0.4);
      font-variant-numeric: tabular-nums;
      min-width: 48px; text-align: right;
    }

    .card {
      background: #1c1c1e; border-radius: 12px;
      border: 1px solid rgba(255,255,255,0.06);
      overflow: hidden;
    }

    .list-header {
      padding: 12px 16px;
      display: flex; justify-content: space-between; align-items: center;
      border-bottom: 1px solid rgba(255,255,255,0.06);
    }
    .list-header span:first-child { font-size: 13px; font-weight: 500; }

    .stats {
      font-size: 11px; color: rgba(255,255,255,0.3);
      font-variant-numeric: tabular-nums;
    }

    .item {
      display: flex; align-items: center;
      padding: 10px 16px; gap: 10px;
      border-bottom: 1px solid rgba(255,255,255,0.04);
      min-width: 0;
    }
    .item:last-child { border-bottom: none; }

    .item-text {
      flex: 1; min-width: 0;
      font-size: ${FONT_SIZE}px; font-weight: 400;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      color: rgba(255,255,255,0.85);
      cursor: default;
    }

    .badge {
      font-size: 9px; font-weight: 600;
      text-transform: uppercase; letter-spacing: 0.5px;
      padding: 2px 6px; border-radius: 4px;
      background: rgba(90, 200, 250, 0.15); color: #5ac8fa;
      opacity: 0; transition: opacity 0.15s;
      flex-shrink: 0;
    }
    .badge.active { opacity: 1; }

    .hint {
      margin-top: 16px; font-size: 12px;
      color: rgba(255,255,255,0.2); text-align: center;
    }

    [data-preview] .width-control,
    [data-preview] .header,
    [data-preview] .hint { display: none; }
  </style>

  <div class="root">
    <div class="header">
      <h1>Dynamic title on truncated text</h1>
      <p>
        Use <code>@chenglou/pretext</code> to measure whether text overflows its container,
        then set the <code>title</code> attribute only when it's actually needed —
        hover over truncated items to see the tooltip.
      </p>
    </div>

    <div class="width-control">
      <label>Container width</label>
      <input type="range" id="slider" min="200" max="680" value="680">
      <span class="width-val" id="width-val">680px</span>
    </div>

    <div class="card" id="card">
      <div class="list-header">
        <span>Messages</span>
        <span class="stats" id="stats"></span>
      </div>
      <div id="list">
        ${messages.map(text => `
          <div class="item">
            <span class="item-text">${text}</span>
            <span class="badge">title</span>
          </div>
        `).join('')}
      </div>
    </div>

    <div class="hint">Drag the slider to resize — watch title attributes appear only where needed</div>
  </div>
`

const card = document.getElementById('card')!
const slider = document.getElementById('slider') as HTMLInputElement
const widthVal = document.getElementById('width-val')!
const statsEl = document.getElementById('stats')!

function checkTruncation() {
  if (prepared.length === 0) return

  const items = document.querySelectorAll('.item') as NodeListOf<HTMLElement>
  let truncated = 0

  items.forEach((item, i) => {
    const textEl = item.querySelector('.item-text') as HTMLElement
    const badge = item.querySelector('.badge') as HTMLElement
    const width = textEl.getBoundingClientRect().width

    if (isTruncated(prepared[i], width)) {
      textEl.title = messages[i]
      badge.classList.add('active')
      truncated++
    } else {
      textEl.removeAttribute('title')
      badge.classList.remove('active')
    }
  })

  statsEl.textContent = `${truncated}/${messages.length} with title`
}

slider.addEventListener('input', () => {
  const w = slider.value
  card.style.maxWidth = w + 'px'
  widthVal.textContent = w + 'px'
  requestAnimationFrame(checkTruncation)
})

new ResizeObserver(() => requestAnimationFrame(checkTruncation)).observe(card)

document.fonts.ready.then(() => {
  prepared = messages.map(text => prepareWithSegments(text, FONT))
  checkTruncation()
})
