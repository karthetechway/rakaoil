import { useState } from 'react'
import { signIn } from '../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showLogin, setShowLogin] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    const { error: err } = await signIn(email, password)
    if (err) setError(err.message)
    setLoading(false)
  }

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero">
        <img src="hero-bg.png" alt="J Oil Mill Products" className="hero-img" />
        <div className="hero-content">
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🫙</div>
          <h1>J Oil Mill</h1>
          <p>Pure, Traditional, Wood-Pressed Oils for a Healthier Life.</p>
          <button className="btn btn-primary btn-lg" onClick={() => {
            const el = document.getElementById('products');
            el?.scrollIntoView({ behavior: 'smooth' });
          }}>
            Explore Our Products
          </button>
        </div>
      </section>

      {/* Main Content */}
      <div className="section" id="products">
        <div className="section-title">
          <h2>Our Traditional Range</h2>
          <p>Cold-pressed with care to preserve every drop of nutrition.</p>
        </div>

        <div className="promo-grid">
          <div className="promo-item">
            <span className="promo-icon">🥜</span>
            <h3>Groundnut Oil</h3>
            <p>Perfect for traditional Indian cooking with a rich, nutty aroma.</p>
          </div>
          <div className="promo-item">
            <span className="promo-icon">🫘</span>
            <h3>Sesame Oil</h3>
            <p>Our signature wood-pressed gingelly oil, pure and healthy.</p>
          </div>
          <div className="promo-item">
            <span className="promo-icon">🥥</span>
            <h3>Coconut Oil</h3>
            <p>Crystal clear and multi-purpose, from cooking to hair care.</p>
          </div>
        </div>
      </div>

      {/* Special Banner Section */}
      <div style={{ background: 'var(--brown-dark)', color: '#fff', padding: '4rem 1.5rem', textAlign: 'center' }}>
        <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Quality Since Generations</h2>
        <p style={{ maxWidth: 600, margin: '0 auto', opacity: 0.8 }}>
          We use the traditional "Chekku" method to ensure no heat is generated, keeping all natural antioxidants intact.
        </p>
      </div>

      {/* Admin Portal Trigger */}
      <div className="admin-trigger">
        {!showLogin ? (
          <button className="btn btn-outline" onClick={() => setShowLogin(true)}>
            Admin Portal Access
          </button>
        ) : (
          <div className="card" style={{ maxWidth: 400, margin: '0 auto', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0 }}>Admin Login</h3>
              <button className="del-btn" onClick={() => setShowLogin(false)}>✕</button>
            </div>
            <form onSubmit={handleLogin}>
              <div style={{ marginBottom: 12 }}>
                <label>Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="admin@joilmill.com" required />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label>Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" required />
              </div>
              {error && <p style={{ color: 'var(--red)', fontSize: 13, marginBottom: 12 }}>{error}</p>}
              <button className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                {loading ? 'Signing in…' : 'Open Dashboard'}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer style={{ padding: '3rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
        <p>© {new Date().getFullYear()} J Oil Mill. All Rights Reserved.</p>
        <p style={{ marginTop: 8 }}>Vellore, Tamil Nadu, India</p>
      </footer>
    </div>
  )
}
