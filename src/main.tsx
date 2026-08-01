import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import App from './App'
import './styles/app.css'

registerSW({ onNeedRefresh() { window.dispatchEvent(new CustomEvent('plaindeck-update')) } })

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>)
