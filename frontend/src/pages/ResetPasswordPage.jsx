import React, { useState, useEffect } from 'react';

const API = import.meta.env.VITE_API_URL || '';

export default function ResetPasswordPage({ onDone }) {
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // ✅ Get token from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get('token');

    if (!t) {
      setError('Invalid or missing reset token.');
      return;
    }

    setToken(t.trim());
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    // ✅ validations
    if (!token) {
      setError('Missing reset token.');
      return;
    }

    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API}/api/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token: String(token),
          password: String(password)
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to reset password.');
        return;
      }

      setSuccess(true);

    } catch (err) {
      console.error(err);
      setError('Server not reachable.');
    } finally {
      setLoading(false);
    }
  }

  // ✅ SUCCESS UI
  if (success) {
    return (
      <div style={wrapStyle}>
        <div className="card" style={{ padding: 32, textAlign: 'center', maxWidth: 400 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
          <h2>Password updated</h2>
          <p>Your password has been reset successfully.</p>

          <button className="btn-primary" onClick={onDone}>
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // ❌ FORM UI
  return (
    <div style={wrapStyle}>
      <div className="card" style={{ padding: 32, width: '100%', maxWidth: 400 }}>

        <h2 style={{ textAlign: 'center', marginBottom: 20 }}>
          🔑 Reset Password
        </h2>

        <form onSubmit={handleSubmit}>

          <label style={labelStyle}>New Password</label>
          <input
            type={showPw ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
            required
          />

          <label style={labelStyle}>Confirm Password</label>
          <input
            type={showPw ? 'text' : 'password'}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            style={inputStyle}
            required
          />

          <button
            type="button"
            onClick={() => setShowPw(!showPw)}
            style={{ marginBottom: 10 }}
          >
            {showPw ? 'Hide Password' : 'Show Password'}
          </button>

          {error && (
            <div style={{
              color: 'red',
              marginBottom: 10
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ width: '100%' }}
          >
            {loading ? 'Updating...' : 'Update Password'}
          </button>

        </form>
      </div>
    </div>
  );
}

// styles
const wrapStyle = {
  minHeight: '100vh',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
};

const labelStyle = {
  display: 'block',
  marginTop: 10,
};

const inputStyle = {
  width: '100%',
  padding: 10,
  marginBottom: 10,
};