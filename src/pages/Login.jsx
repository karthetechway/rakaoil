import { useState } from 'react'
import { signIn } from '../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    const { error: err } = await signIn(email, password)
    if (err) setError(err.message)
    setLoading(false)
  }

  return (
    <div className="login-wrapper">
      <div className="login-card">
        {/* Branding Slot: User can add public/branding.png */}
        <div className="branding-slot">
          <img src="branding.png" alt="J Oil Mill Branding"
            onError={(e) => { e.target.style.display = 'none' }}
            className="brand-img" />
          <div className="brand-fallback">
            <div style={{ fontSize: 48, marginBottom: 12 }}>🫙</div>
            <h1>J Oil Mill</h1>
            <p>Billing Software</p>
          </div>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label>Email Address</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="admin@joilmill.com" required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••" required />
          </div>

          {error && <div className="error-box">{error}</div>}

          <button className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Authenticating…' : 'Sign In'}
          </button>
        </form>

        <footer className="login-footer">
          <p>© {new Date().getFullYear()} J Oil Mill</p>
          <p style={{ marginTop: 4 }}>Sivakasi, Tamil Nadu</p>
        </footer>
      </div>
    </div>
  )
}
