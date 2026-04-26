import { useState, useEffect } from 'react';

const API = import.meta.env.VITE_API_URL || '';

/**
 * useAuth — manages the current user session.
 * Checks /api/auth/me on mount (verifies httpOnly cookie server-side).
 * Returns { user, loading, login, logout }
 */
export default function useAuth() {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true); // true while verifying on mount

  // On mount: ask the server if the cookie is still valid
  useEffect(() => {
    fetch(`${API}/api/auth/me`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(data => setUser(data?.user || null))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  function login(userData) {
    setUser(userData);
  }

  async function logout() {
    await fetch(`${API}/api/auth/logout`, {
      method:      'POST',
      credentials: 'include',
    }).catch(() => {});
    setUser(null);
  }

  return { user, loading, login, logout };
}
