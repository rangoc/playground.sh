const STORAGE_KEY = 'playground-theme'

function getPreferred(): 'light' | 'dark' {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'light' || stored === 'dark') return stored
  return matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

function apply(theme: 'light' | 'dark') {
  document.documentElement.setAttribute('data-theme', theme)
  localStorage.setItem(STORAGE_KEY, theme)
}

function createToggle(): HTMLButtonElement {
  const btn = document.createElement('button')
  btn.id = 'theme-toggle'
  btn.setAttribute('aria-label', 'Toggle theme')

  const style = document.createElement('style')
  style.textContent = `
    #theme-toggle {
      position: fixed; top: 12px; right: 12px; z-index: 9999;
      width: 36px; height: 36px; border-radius: 50%;
      border: 1px solid #444; background: #222; color: #fff;
      cursor: pointer; font-size: 18px; line-height: 1;
      display: flex; align-items: center; justify-content: center;
      transition: background 0.2s, border-color 0.2s;
    }
    [data-theme="light"] #theme-toggle { background: #eee; color: #111; border-color: #ccc; }
  `
  document.head.appendChild(style)

  function update() {
    const current = document.documentElement.getAttribute('data-theme')
    btn.textContent = current === 'light' ? '\u263E' : '\u2600'
  }

  btn.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme')
    apply(current === 'light' ? 'dark' : 'light')
    update()
  })

  apply(getPreferred())
  update()

  return btn
}

/**
 * Call once to add a light/dark toggle to the page.
 * Sets `data-theme="light"|"dark"` on `<html>`.
 * Use `[data-theme="light"]` and `[data-theme="dark"]` in your CSS to style accordingly.
 */
export function initTheme() {
  apply(getPreferred())
  document.body.appendChild(createToggle())
}
