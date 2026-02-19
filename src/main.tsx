import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { ThemeProvider } from 'next-themes'
import './index.css'
import App from './App.tsx'
import { Toaster } from '@/components/ui/sonner'
import { seedDatabase } from './db/seed'

// Seed database on first load
seedDatabase();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <HashRouter>
        <App />
        <Toaster position="top-right" richColors />
      </HashRouter>
    </ThemeProvider>
  </StrictMode>,
)
