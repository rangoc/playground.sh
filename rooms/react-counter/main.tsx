import { createRoot } from 'react-dom/client'
import { useState, useEffect } from 'react'
import { initTheme } from '@shared/theme'

function Counter() {
  const [count, setCount] = useState(0)

  useEffect(() => { initTheme() }, [])

  return (
    <div>
      <h1>react-counter</h1>
      <p>Count: {count}</p>
      <button onClick={() => setCount((c) => c + 1)}>+</button>
      <button onClick={() => setCount((c) => c - 1)}>-</button>
    </div>
  )
}

createRoot(document.getElementById('root')!).render(<Counter />)
