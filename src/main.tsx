import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import '@fontsource-variable/space-grotesk'
import '@fontsource/questrial/400.css'
import '@fontsource/space-mono/400.css'
import './theme.css'
import { App } from './App'
import { startLogging } from './log'

startLogging()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Offline support. When a new version is published, switch to it straight away
// (the page reloads once), so phones never get stuck on an old copy.
registerSW({ immediate: true })
