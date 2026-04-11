import { useState } from 'react'
import { AuthProvider, useAuth } from './hooks/useAuth'
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
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🫙</div>
          <div>Loading…</div>
        </div>
      </div>
    )
  }

  if (!user) return <Login />

  const PAGES = { billing: Billing, history: History, products: Products, reports: Reports }
  const PageComponent = PAGES[page] || Billing

  return (
    <div className="app-layout">
      <Sidebar active={page} onNav={setPage} />
      <main className="main-content">
        {page === 'billing'
          ? <PageComponent />
          : <PageComponent />
        }
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
