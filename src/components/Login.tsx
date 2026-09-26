import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'

export function Login() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin },
    })
    setBusy(false)
    if (error) setError(error.message)
    else setSent(true)
  }

  return (
    <div className="login">
      <div className="panel login-card">
        <div className="label">Household debt tracker</div>
        <h1>Mayberry Debt Payoff</h1>
        {sent ? (
          <p>Check <b>{email}</b> for a sign-in link. It opens this page already signed in.</p>
        ) : (
          <form onSubmit={submit} className="stack">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} />
            <button type="submit" disabled={busy}>{busy ? 'Sending…' : 'Email me a sign-in link'}</button>
            {error && <p className="error">{error}</p>}
          </form>
        )}
      </div>
    </div>
  )
}
