import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#12121A',
            color: '#fff',
            border: '1px solid #2A2A3A',
            borderRadius: '8px',
            fontFamily: 'Inter, sans-serif',
          },
          success: {
            iconTheme: { primary: '#C6FF3D', secondary: '#0A0A0F' },
          },
          error: {
            iconTheme: { primary: '#FF2D95', secondary: '#0A0A0F' },
          },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>,
)
