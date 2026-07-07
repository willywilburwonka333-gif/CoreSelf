import { useState } from 'react';
import { createCoreAccount, signInCore } from '../services/authService';
import { firebaseProjectId } from '../services/firebaseClient';

export default function AuthPanel() {
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (mode === 'signup') await createCoreAccount(email.trim(), password);
      else await signInCore(email.trim(), password);
    } catch (err) {
      setError(err.message || 'Core login failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="app authShell">
      <section className="hero authHero">
        <div>
          <p className="eyebrow">CLOUD BRAIN ACCESS</p>
          <h1>Core Self</h1>
          <p>Genesis 0.2.0 protects Dylan Core with Firebase Auth, user-scoped Firestore, approval gates, and a security audit trail.</p>
          <div className="briefing">
            <h3>Backend active</h3>
            <p>Firebase project: <strong>{firebaseProjectId}</strong></p>
            <p className="muted">Email/password is the first secure login method. Google and Apple can be added later.</p>
          </div>
        </div>

        <form className="authCard" onSubmit={submit}>
          <h2>{mode === 'signup' ? 'Create Core Account' : 'Sign In'}</h2>
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Email" autoComplete="email" required />
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Password" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} minLength={6} required />
          {error && <p className="errorText">{error}</p>}
          <button className="primary" disabled={busy}>{busy ? 'Connecting...' : mode === 'signup' ? 'Create Account' : 'Sign In'}</button>
          <button type="button" className="ghostButton" onClick={() => setMode(mode === 'signup' ? 'signin' : 'signup')}>
            {mode === 'signup' ? 'Already have an account? Sign in' : 'Need an account? Create one'}
          </button>
        </form>
      </section>
    </main>
  );
}
