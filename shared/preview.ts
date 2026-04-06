/**
 * Shared preview-mode detection for room iframes.
 *
 * When the dashboard embeds a room in a ~300x200px card, it loads
 * `http://localhost:PORT?preview=true`. Rooms import this module to
 * detect that flag and strip non-essential UI (sidebars, controls, etc.)
 * so only the core visual output is shown.
 *
 * Usage in a room:
 *
 *   import { isPreview, applyPreviewClass } from '@shared/preview'
 *
 *   // Option A: CSS-only — adds `data-preview` to <html>, then use
 *   //   [data-preview] .sidebar { display: none; }
 *   applyPreviewClass()
 *
 *   // Option B: JS branching
 *   if (isPreview()) {
 *     // skip building the sidebar entirely
 *   }
 */

const PARAM = 'preview'

/** Returns true when the page was loaded with `?preview=true`. */
export function isPreview(): boolean {
  return new URLSearchParams(window.location.search).get(PARAM) === 'true'
}

/**
 * If in preview mode, sets `data-preview="true"` on `<html>` so rooms
 * can hide chrome with a single CSS attribute selector.
 * Returns whether preview mode is active (convenience for callers that
 * also need the boolean).
 */
export function applyPreviewClass(): boolean {
  const active = isPreview()
  if (active) {
    document.documentElement.setAttribute('data-preview', 'true')
  }
  return active
}
