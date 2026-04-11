// Simple PIN gate — stores PIN as plain text in .env (VITE_ADMIN_PIN)
// Session unlock stored in sessionStorage — clears when tab closes

const SESSION_KEY = 'chekku_admin_unlocked'

export function verifyPin(inputPin) {
  const envPin = import.meta.env.VITE_ADMIN_PIN
  if (!envPin) {
    // No PIN configured — use default "1234" and warn
    console.warn('[chekku] VITE_ADMIN_PIN not set in .env — defaulting to 1234')
    return String(inputPin).trim() === '1234'
  }
  return String(inputPin).trim() === String(envPin).trim()
}

export function isAdminUnlocked() {
  return sessionStorage.getItem(SESSION_KEY) === 'yes'
}

export function setAdminUnlocked(val) {
  if (val) sessionStorage.setItem(SESSION_KEY, 'yes')
  else sessionStorage.removeItem(SESSION_KEY)
}

export function lockAdmin() {
  sessionStorage.removeItem(SESSION_KEY)
}
