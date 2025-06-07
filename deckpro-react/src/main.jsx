import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Register service worker for PWA support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => console.log('SW registered:', registration))
      .catch(err => console.log('SW registration failed:', err))
  })
}

window.addEventListener('error', (e) => {
  console.error('Global error:', e)
})

const root = document.getElementById('root')
if (!root) {
  console.error('Root element not found!')
  document.body.innerHTML = '<h1>Root element not found!</h1>'
} else {
  try {
    createRoot(root).render(
      <StrictMode>
        <App />
      </StrictMode>,
    )
  } catch (error) {
    console.error('React render error:', error)
    document.body.innerHTML = `<h1>React Error: ${error.message}</h1>`
  }
}