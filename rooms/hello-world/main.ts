import { clamp, lerp } from '@shared/math'
import { initTheme } from '@shared/theme'

initTheme()

const app = document.getElementById('app')!

const clamped = clamp(150, 0, 100)
const lerped = lerp(0, 10, 0.5)

app.innerHTML = `
  <h1>hello-world</h1>
  <p>playground.sh room is running.</p>
  <p>clamp(150, 0, 100) = ${clamped}</p>
  <p>lerp(0, 10, 0.5) = ${lerped}</p>
`
