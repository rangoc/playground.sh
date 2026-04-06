/**
 * Shared sidebar control builders.
 * Import alongside @shared/sidebar.css to get Apple-style controls.
 *
 * Usage:
 *   import { createSlider, createSegmented, createToggle, createSidebar } from '@shared/sidebar'
 */

export interface SliderOptions {
  label: string
  min: number
  max: number
  step?: number
  value: number
  suffix?: string
  onChange: (value: number) => void
}

export interface SegmentedOptions {
  options: { label: string; value: string }[]
  value: string
  onChange: (value: string) => void
}

export interface ToggleOptions {
  label: string
  value: boolean
  onChange: (value: boolean) => void
}

/** Create a pill-shaped slider row */
export function createSlider(opts: SliderOptions): {
  el: HTMLElement
  setValue: (v: number) => void
} {
  const row = document.createElement('div')
  row.className = 'sb-slider'

  const label = document.createElement('span')
  label.className = 'sb-slider__label'
  label.textContent = opts.label

  const input = document.createElement('input')
  input.className = 'sb-slider__input'
  input.type = 'range'
  input.min = String(opts.min)
  input.max = String(opts.max)
  input.step = String(opts.step ?? 1)
  input.value = String(opts.value)

  const valueEl = document.createElement('span')
  valueEl.className = 'sb-slider__value'
  valueEl.textContent = String(opts.value) + (opts.suffix ?? '')

  input.addEventListener('input', () => {
    const val = Number(input.value)
    valueEl.textContent = String(val) + (opts.suffix ?? '')
    opts.onChange(val)
  })

  row.appendChild(label)
  row.appendChild(input)
  row.appendChild(valueEl)

  return {
    el: row,
    setValue(v: number) {
      input.value = String(v)
      valueEl.textContent = String(v) + (opts.suffix ?? '')
    },
  }
}

/** Create an iOS-style segmented control */
export function createSegmented(opts: SegmentedOptions): {
  el: HTMLElement
  setValue: (v: string) => void
} {
  const container = document.createElement('div')
  container.className = 'sb-segmented'

  const buttons: HTMLButtonElement[] = []

  function activate(value: string) {
    for (const btn of buttons) {
      btn.classList.toggle('active', btn.dataset.val === value)
    }
  }

  for (const opt of opts.options) {
    const btn = document.createElement('button')
    btn.className = 'sb-segmented__btn'
    btn.dataset.val = opt.value
    btn.textContent = opt.label
    btn.addEventListener('click', () => {
      activate(opt.value)
      opts.onChange(opt.value)
    })
    buttons.push(btn)
    container.appendChild(btn)
  }

  activate(opts.value)

  return {
    el: container,
    setValue(v: string) {
      activate(v)
    },
  }
}

/** Create an iOS-style toggle switch */
export function createToggle(opts: ToggleOptions): {
  el: HTMLElement
  setValue: (v: boolean) => void
} {
  const row = document.createElement('div')
  row.className = 'sb-toggle-row'

  const label = document.createElement('span')
  label.className = 'sb-toggle-row__label'
  label.textContent = opts.label

  const toggle = document.createElement('button')
  toggle.className = `sb-toggle${opts.value ? ' on' : ''}`

  toggle.addEventListener('click', () => {
    const next = !toggle.classList.contains('on')
    toggle.classList.toggle('on', next)
    opts.onChange(next)
  })

  row.appendChild(label)
  row.appendChild(toggle)

  return {
    el: row,
    setValue(v: boolean) {
      toggle.classList.toggle('on', v)
    },
  }
}

/** Create a section with optional label */
export function createSection(label?: string): HTMLElement {
  const section = document.createElement('div')
  section.className = 'sb-section'
  if (label) {
    const lbl = document.createElement('div')
    lbl.className = 'sb-label'
    lbl.textContent = label
    section.appendChild(lbl)
  }
  return section
}

/** Create the sidebar container */
export function createSidebar(): HTMLElement {
  const sb = document.createElement('div')
  sb.className = 'sb'
  return sb
}
