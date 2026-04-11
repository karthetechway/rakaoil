import { useState, useEffect } from 'react'
import { verifyPin, isAdminUnlocked, setAdminUnlocked, lockAdmin } from '../hooks/useAdminPin'

export default function AdminPinGate({ children, title = 'Admin Access Required' }) {
  const [unlocked, setUnlocked]   = useState(false)
  const [pin, setPin]             = useState('')
  const [error, setError]         = useState('')
  const [attempts, setAttempts]   = useState(0)
  const [lockedOut, setLockedOut] = useState(false)
  const [countdown, setCountdown] = useState(0)

  useEffect(() => {
    setUnlocked(isAdminUnlocked())
  }, [])

  useEffect(() => {
    if (countdown <= 0) return
    const t = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { setLockedOut(false); setAttempts(0); clearInterval(t); return 0 }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(t)
  }, [countdown])

  const handleDigit = (d) => {
    if (lockedOut) return
    setPin(p => p.length < 6 ? p + d : p)
    setError('')
  }

  const handleBackspace = () => { setPin(p => p.slice(0, -1)); setError('') }

  const handleUnlock = () => {
    if (lockedOut || pin.length < 4) return

    const ok = verifyPin(pin)
    setPin('')

    if (ok) {
      setAdminUnlocked(true)
      setUnlocked(true)
      setAttempts(0)
      setError('')
    } else {
      const next = attempts + 1
      setAttempts(next)
      if (next >= 5) {
        setLockedOut(true)
        setCountdown(30)
        setError('Too many wrong attempts. Locked for 30 seconds.')
      } else {
        setError(`Wrong PIN — ${5 - next} attempt(s) left`)
      }
    }
  }

  const handleLock = () => {
    lockAdmin()
    setUnlocked(false)
    setPin('')
    setError('')
    setAttempts(0)
  }

  // ── Already unlocked — show content ───────────────────────
  if (unlocked) {
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Admin session active</span>
          <button className="btn btn-outline btn-sm" onClick={handleLock}>🔒 Lock</button>
        </div>
        {children}
      </div>
    )
  }

  // ── PIN entry screen ───────────────────────────────────────
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 420 }}>
      <div className="card" style={{ width: 320, padding: '2rem' }}>

        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'var(--cream-dark)', margin: '0 auto 12px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24
          }}>🔐</div>
          <h2 style={{ fontSize: '1.1rem', color: 'var(--brown-dark)' }}>{title}</h2>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 5 }}>
            Enter your admin PIN to manage products
          </p>
        </div>

        {/* PIN dot display */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 20 }}>
          {[0,1,2,3,4,5].map(i => (
            <div key={i} style={{
              width: 13, height: 13, borderRadius: '50%',
              background: pin.length > i ? 'var(--brown)' : 'var(--cream-mid)',
              border: '2px solid var(--border)', transition: 'background .1s'
            }} />
          ))}
        </div>

        {/* Error */}
        {error && (
          <div style={{ color: 'var(--red)', fontSize: 13, textAlign: 'center', marginBottom: 12 }}>
            {error}
            {lockedOut && countdown > 0 && (
              <div style={{ fontWeight: 600, fontSize: 16, marginTop: 4 }}>{countdown}s</div>
            )}
          </div>
        )}

        {/* Numpad */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 12 }}>
          {[1,2,3,4,5,6,7,8,9,'',0,'⌫'].map((k, i) => (
            <button
              key={i}
              disabled={lockedOut}
              onClick={() => {
                if (k === '⌫') handleBackspace()
                else if (k !== '') handleDigit(String(k))
              }}
              style={{
                padding: '13px 0', borderRadius: 'var(--r-md)',
                border: '1px solid var(--border)',
                background: k === '' ? 'transparent' : 'var(--cream)',
                fontSize: k === '⌫' ? 18 : 19,
                fontFamily: 'var(--font-mono)',
                cursor: k === '' ? 'default' : 'pointer',
                color: 'var(--text-main)',
                visibility: k === '' ? 'hidden' : 'visible',
                transition: 'background .1s',
                opacity: lockedOut ? 0.4 : 1
              }}
            >
              {k}
            </button>
          ))}
        </div>

        <button
          className="btn btn-primary"
          style={{ width: '100%', fontSize: 15 }}
          disabled={lockedOut || pin.length < 4}
          onClick={handleUnlock}
        >
          Unlock
        </button>

        <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', marginTop: 14 }}>
          Auto-locks when browser tab is closed
        </p>
      </div>
    </div>
  )
}
