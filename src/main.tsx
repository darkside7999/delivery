import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
// Estilos que Claude PUEDE ajustar (variables de tema, acentos...).
import './app-surface/theme.css'

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
