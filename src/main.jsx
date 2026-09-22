import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// ponytail: one-time stale SW/cache purge; remove after all clients are on the micro-chunked build.
async function purgeStaleServiceWorker() {
  try {
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations()
      await Promise.all(regs.map((r) => r.unregister()))
    }
    if ('caches' in window) {
      const keys = await caches.keys()
      await Promise.all(keys.map((k) => caches.delete(k)))
    }
  } catch {}
}

purgeStaleServiceWorker().finally(() => {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
})
