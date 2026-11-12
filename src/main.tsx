import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { AppDialogHost } from './AppDialog'
import './styles.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
    <AppDialogHost />
  </React.StrictMode>
)
