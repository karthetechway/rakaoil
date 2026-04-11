import { signOut } from '../lib/supabase'

const SHOP_NAME = import.meta.env.VITE_SHOP_NAME || 'Chekku Oil Shop'

const NAV = [
  { key: 'billing',  label: 'New Bill',     icon: BillIcon },
  { key: 'history',  label: 'Bill History', icon: HistoryIcon },
  { key: 'products', label: 'Products',     icon: ProductIcon },
  { key: 'reports',  label: 'Reports',      icon: ReportIcon },
]

export default function Sidebar({ active, onNav }) {
  return (
    <aside className="sidebar no-print">
      <div className="sidebar-logo">
        <h1>{SHOP_NAME}</h1>
        <p>Billing Software</p>
      </div>

      <nav className="sidebar-nav">
        {NAV.map(n => (
          <button
            key={n.key}
            className={`nav-item${active === n.key ? ' active' : ''}`}
            onClick={() => onNav(n.key)}
          >
            <n.icon />
            {n.label}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button
          className="nav-item"
          style={{ width: '100%', color: 'rgba(237,217,190,0.5)' }}
          onClick={signOut}
        >
          <LogoutIcon /> Sign Out
        </button>
      </div>
    </aside>
  )
}

function BillIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
    <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
  </svg>
}
function HistoryIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <polyline points="12 8 12 12 14 14"/><path d="M3.05 11a9 9 0 1 0 .5-4.5"/>
    <polyline points="3 3 3 7 7 7"/>
  </svg>
}
function ProductIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
    <line x1="12" y1="22.08" x2="12" y2="12"/>
  </svg>
}
function ReportIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <line x1="18" y1="20" x2="18" y2="10"/>
    <line x1="12" y1="20" x2="12" y2="4"/>
    <line x1="6"  y1="20" x2="6"  y2="14"/>
  </svg>
}
function LogoutIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
}
