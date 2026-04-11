import { useState } from 'react'
import { AuthProvider, useAuth } from './hooks/useAuth.jsx'
import { ToastProvider } from './components/Toast'
import Sidebar from './components/Sidebar'
import Login from './pages/Login'
import Billing from './pages/Billing'
import History from './pages/History'
import Products from './pages/Products'
import Reports from './pages/Reports'

function AppShell() {
  const { user, loading } = useAuth()
  const [page, setPage] = useState('billing')

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🫙</div>
          <div>Loading…</div>
        </div>
      </div>
    )
  }

  if (!user) return <Login />

  const PAGES = {
    billing:  Billing,
    history:  History,
    products: Products,
    reports:  Reports,
  }
  const PageComponent = PAGES[page] || Billing

  return (
    <div className="app-layout">
      {/* Mobile Top Branding */}
      <header className="mobile-header mobile-only">
        <h1>{import.meta.env.VITE_SHOP_NAME || 'J Oil Mill'}</h1>
      </header>
      
      <Sidebar active={page} onNav={setPage} />
      <main className="main-content">
        <PageComponent />
      </main>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppShell />
      </ToastProvider>
    </AuthProvider>
  )
}
