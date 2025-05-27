import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

console.log('main.jsx loading...')
window.addEventListener('error', (e) => {
  console.error('Global error:', e)
})

const root = document.getElementById('root')
if (!root) {
  console.error('Root element not found!')
  document.body.innerHTML = '<h1>Root element not found!</h1>'
} else {
  console.log('Creating React root...')
  try {
    createRoot(root).render(
      <StrictMode>
        <App />
      </StrictMode>,
    )
    console.log('React app rendered')
  } catch (error) {
    console.error('React render error:', error)
    document.body.innerHTML = `<h1>React Error: ${error.message}</h1>`
  }
}