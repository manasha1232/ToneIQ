import React, { useState } from 'react';

const API = import.meta.env.VITE_API_URL || '';

// ─────────────────────────────────────────────────────────────────────────────
export default function AuthPage({ onAuth }) {
  const [mode, setMode] = useState('login'); // 'login' | 'signup' | 'forgot' | 'forgot-sent'

  if (mode === 'forgot')      return <ForgotPassword onBack={() => setMode('login')} onSent={() => setMode('forgot-sent')} />;
  if (mode === 'forgot-sent') return <ForgotSent onBack={() => setMode('login')} />;

  return <LoginSignup mode={mode} setMode={setMode} onAuth={onAuth} />;
}

// ── Login / Signup ────────────────────────────────────────────────────────────
function LoginSignup({ mode, setMode, onAuth }) {
  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  function switchMode(m) { setMode(m); setError(''); setName(''); setEmail(''); setPassword(''); }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(''); setLoading(true);
    const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
    const body     = mode === 'login' ? { email, password } : { email, password, name };
    try {
      const res  = await fetch(`${API}${endpoint}`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Something went wrong.'); return; }
      onAuth(data.user);
    } catch { setError('Could not reach the server. Is the backend running?'); }
    finally   { setLoading(false); }
  }

  return (
    <Shell>
      {/* Tab switcher */}
      <div style={{ display:'flex', background:'var(--bg)', borderRadius:10, padding:4, marginBottom:28 }}>
        {['login','signup'].map(m => (
          <button key={m} onClick={() => switchMode(m)} style={{
            flex:1, padding:'9px 0', borderRadius:8, fontSize:14, fontWeight:500,
            background: mode===m ? 'var(--accent)' : 'transparent',
            color:      mode===m ? '#fff' : 'var(--muted)',
          }}>{m === 'login' ? 'Log in' : 'Sign up'}</button>
        ))}
      </div>

      <form onSubmit={handleSubmit} noValidate>
        {mode === 'signup' && (
          <Field label="Name">
            <input type="text" placeholder="Your name" value={name}
              onChange={e => setName(e.target.value)} style={inputStyle} autoComplete="name" />
          </Field>
        )}
        <Field label="Email">
          <input type="email" placeholder="you@example.com" value={email} required
            onChange={e => setEmail(e.target.value)} style={inputStyle} autoComplete="email" />
        </Field>
        <Field label="Password" style={{ marginBottom: 8 }}>
          <div style={{ position:'relative' }}>
            <input type={showPw ? 'text' : 'password'}
              placeholder={mode==='signup' ? 'Min 8 chars, 1 letter + 1 number' : 'Your password'}
              value={password} required onChange={e => setPassword(e.target.value)}
              style={{ ...inputStyle, paddingRight:44 }}
              autoComplete={mode==='login' ? 'current-password' : 'new-password'} />
            <button type="button" onClick={() => setShowPw(v=>!v)} aria-label="Toggle password"
              style={{ position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',
                background:'none',border:'none',color:'var(--muted)',fontSize:16,cursor:'pointer' }}>
              {showPw ? '🙈' : '👁️'}
            </button>
          </div>
          {mode==='signup' && password.length > 0 && <PasswordStrength password={password} />}
        </Field>

        {mode === 'login' && (
          <div style={{ textAlign:'right', marginBottom:20 }}>
            <button type="button" onClick={() => setMode('forgot')}
              style={{ background:'none',border:'none',fontSize:13,
                color:'var(--accent)',cursor:'pointer',padding:0 }}>
              Forgot password?
            </button>
          </div>
        )}

        {error && <ErrorBox>{error}</ErrorBox>}

        <button type="submit" className="btn-primary" disabled={loading}
          style={{ width:'100%', padding:'13px', fontSize:15, opacity: loading ? 0.7 : 1 }}>
          {loading
            ? (mode==='login' ? 'Logging in…' : 'Creating account…')
            : (mode==='login' ? 'Log in' : 'Create account')}
        </button>
      </form>
    </Shell>
  );
}

// ── Forgot password ───────────────────────────────────────────────────────────
function ForgotPassword({ onBack, onSent }) {
  const [email,   setEmail]   = useState('');
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const res  = await fetch(`${API}/api/auth/forgot-password`, {
        method:'POST', headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Something went wrong.'); return; }

      // Dev convenience: if backend returned _devResetLink, show it
      if (data._devResetLink) {
        console.log('[dev] Reset link:', data._devResetLink);
      }
      onSent();
    } catch { setError('Could not reach the server.'); }
    finally  { setLoading(false); }
  }

  return (
    <Shell>
      <button onClick={onBack} style={{ background:'none',border:'none',
        color:'var(--muted)',fontSize:13,cursor:'pointer',marginBottom:20,padding:0 }}>
        ← Back to login
      </button>
      <h2 style={{ fontSize:18, fontWeight:700, marginBottom:6 }}>Reset your password</h2>
      <p style={{ fontSize:13, color:'var(--muted)', marginBottom:24 }}>
        Enter your email and we'll send you a reset link.
      </p>
      <form onSubmit={handleSubmit} noValidate>
        <Field label="Email">
          <input type="email" placeholder="you@example.com" value={email} required
            onChange={e => setEmail(e.target.value)} style={inputStyle} autoComplete="email" />
        </Field>
        {error && <ErrorBox>{error}</ErrorBox>}
        <button type="submit" className="btn-primary" disabled={loading}
          style={{ width:'100%', padding:'13px', fontSize:15, opacity: loading ? 0.7:1 }}>
          {loading ? 'Sending…' : 'Send reset link'}
        </button>
      </form>
    </Shell>
  );
}

function ForgotSent({ onBack }) {
  return (
    <Shell>
      <div style={{ textAlign:'center', padding:'20px 0' }}>
        <div style={{ fontSize:48, marginBottom:16 }}>📬</div>
        <h2 style={{ fontSize:18, fontWeight:700, marginBottom:10 }}>Check your inbox</h2>
        <p style={{ fontSize:14, color:'var(--muted)', lineHeight:1.6, marginBottom:24 }}>
          If an account exists for that email, a reset link has been sent.<br />
          <span style={{ fontSize:12 }}>(In dev mode, check the backend terminal for the link.)</span>
        </p>
        <button onClick={onBack} className="btn-secondary" style={{ padding:'10px 28px' }}>
          Back to login
        </button>
      </div>
    </Shell>
  );
}

// ── Shared sub-components ─────────────────────────────────────────────────────
function Shell({ children }) {
  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center',
      justifyContent:'center', padding:'20px', background:'var(--bg)' }}>
      <div style={{ width:'100%', maxWidth:420 }}>
        <div style={{ textAlign:'center', marginBottom:40 }}>
          <div style={{ fontSize:44, marginBottom:10 }}>🎤</div>
          <h1 style={{ fontSize:28, fontWeight:700, letterSpacing:'-0.5px' }}>ToneIQ</h1>
          <p style={{ color:'var(--muted)', fontSize:14, marginTop:6 }}>
            Practice difficult conversations with AI.
          </p>
        </div>
        <div className="card" style={{ padding:32 }}>{children}</div>
        <p style={{ textAlign:'center', fontSize:12, color:'var(--muted)', marginTop:20 }}>
          Your data stays private. Audio is never stored long-term.
        </p>
      </div>
    </div>
  );
}

function Field({ label, children, style }) {
  return (
    <div style={{ marginBottom:16, ...style }}>
      <label style={{ display:'block', fontSize:13, fontWeight:500,
        color:'var(--muted)', marginBottom:6 }}>{label}</label>
      {children}
    </div>
  );
}

function ErrorBox({ children }) {
  return (
    <div style={{ background:'rgba(224,90,90,0.1)', border:'1px solid rgba(224,90,90,0.3)',
      borderRadius:8, padding:'10px 14px', fontSize:13, color:'var(--danger)', marginBottom:16 }}>
      ⚠️ {children}
    </div>
  );
}

function PasswordStrength({ password }) {
  let score = 0;
  if (password.length >= 8)           score++;
  if (password.length >= 12)          score++;
  if (/[A-Z]/.test(password))         score++;
  if (/[0-9]/.test(password))         score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;
  const levels = [
    { label:'Too short',   color:'var(--danger)' },
    { label:'Weak',        color:'var(--danger)' },
    { label:'Fair',        color:'var(--warn)' },
    { label:'Good',        color:'var(--warn)' },
    { label:'Strong',      color:'var(--success)' },
    { label:'Very strong', color:'var(--success)' },
  ];
  const { label, color } = levels[Math.min(score, levels.length - 1)];
  return (
    <div style={{ marginTop:8 }}>
      <div style={{ display:'flex', gap:4, marginBottom:4 }}>
        {[1,2,3,4,5].map(i => (
          <div key={i} style={{ flex:1, height:3, borderRadius:2,
            background: i<=score ? color : 'var(--border)', transition:'background 0.2s' }} />
        ))}
      </div>
      <div style={{ fontSize:11, color }}>{label}</div>
    </div>
  );
}

const inputStyle = {
  width:'100%', padding:'11px 14px', background:'var(--bg)',
  border:'1px solid var(--border)', borderRadius:8,
  color:'var(--text)', fontSize:14, outline:'none',
  fontFamily:'var(--font)', transition:'border-color 0.15s',
};
