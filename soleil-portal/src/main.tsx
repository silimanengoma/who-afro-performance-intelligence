import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, HashRouter } from 'react-router-dom'
import './index.css'
import { App } from './App'
import { StoreProvider } from './data/store'
import { AuthProvider } from './auth/AuthContext'
import { I18nProvider } from './i18n'

// VITE_ROUTER=hash : build « démo portable » (fichier unique, aperçu hébergé)
const Router = import.meta.env.VITE_ROUTER === 'hash' ? HashRouter : BrowserRouter

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Router>
      <StoreProvider>
        <I18nProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </I18nProvider>
      </StoreProvider>
    </Router>
  </StrictMode>,
)
