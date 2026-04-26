import React, { useState, useEffect } from 'react';
import useAuth            from './hooks/useAuth';
import AuthPage           from './pages/AuthPage';
import ResetPasswordPage  from './pages/ResetPasswordPage';
import Home               from './pages/Home';
import Session            from './pages/Session';
import Report             from './pages/Report';
import Dashboard          from './pages/Dashboard';

export default function App() {
  const { user, loading, login, logout } = useAuth();
  const [page,        setPage]        = useState('home');
  const [sessionData, setSessionData] = useState(null);
  const [reportId,    setReportId]    = useState(null);

  // Handle /reset-password?token=... URL — show reset form regardless of auth state
  const isResetPage = window.location.pathname === '/reset-password' &&
                      window.location.search.includes('token=');

  if (isResetPage) {
    return (
      <ResetPasswordPage
        onDone={() => {
          // Strip token from URL and go to login
          window.history.replaceState({}, '', '/');
        }}
      />
    );
  }

  if (loading) {
    return (
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center',
        justifyContent:'center', color:'var(--muted)', fontSize:14 }}>
        Loading…
      </div>
    );
  }

  if (!user) return <AuthPage onAuth={login} />;

  // ── Logged-in routing ───────────────────────────────────────────────────────
  if (page === 'dashboard') {
    return (
      <Dashboard
        user={user}
        onBack={() => setPage('home')}
        onViewSession={id => { setReportId(id); setPage('report'); }}
      />
    );
  }

  if (page === 'session') {
    return (
      <Session
        scenario={sessionData}
        user={user}
        onComplete={id => { setReportId(id); setPage('report'); }}
        onBack={() => setPage('home')}
      />
    );
  }

  if (page === 'report') {
    return <Report sessionId={reportId} onBack={() => setPage('home')} />;
  }

  return (
    <Home
      user={user}
      onStart={scenario => { setSessionData(scenario); setPage('session'); }}
      onLogout={logout}
      onDashboard={() => setPage('dashboard')}
    />
  );
}
