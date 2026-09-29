import { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { configureSessionClient } from './sessionClient';
import { dataCache } from '../hooks/useDataCache';

const apiBase = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
axios.defaults.baseURL = apiBase;
axios.defaults.timeout = 15_000;
const authApi = axios.create({ baseURL: apiBase, timeout: 15_000, withCredentials: true });
const apiOrigin = new URL(apiBase || window.location.origin, window.location.origin).origin;
const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

function completeUser(user, school = user?.school) {
  if (!user) throw new Error('Your account profile could not be loaded. Please sign in again.');
  return { ...user, school, schoolId: user.schoolId || school?.id, schoolName: school?.name || '' };
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessToken] = useState(null);
  const [session, setSession] = useState(null);
  const [startupError, setStartupError] = useState('');

  useEffect(() => {
    let active = true;
    dataCache.clear();
    const client = configureSessionClient(axios, {
      apiOrigin,
      refreshRequest: async () => (await authApi.post('/api/auth/refresh', {})).data.accessToken,
      onTokenChange: (token) => { if (active) setAccessToken(token); },
      onExpired: () => { if (active) { dataCache.clear(); setUser(null); } },
    });
    setSession(client);
    // Defer until after StrictMode's setup/cleanup probe, avoiding double token rotation.
    Promise.resolve().then(async () => {
      if (!active) return;
      try {
        await client.refresh();
        const response = await axios.get('/api/auth/me');
        if (active) setUser(completeUser(response.data.user));
      } catch (error) {
        if (active) {
          setUser(null);
          if (![401, 403].includes(error.response?.status)) {
            setStartupError(error.response?.data?.error || 'Unable to connect to the school service. Please try again.');
          }
        }
      } finally { if (active) setLoading(false); }
    });
    return () => { active = false; client.dispose(); };
  }, []);

  const reloadUser = async () => {
    const response = await axios.get('/api/auth/me');
    const nextUser = completeUser(response.data.user);
    setUser(nextUser);
    return nextUser;
  };
  const login = async (email, password) => {
    const response = await authApi.post('/api/auth/login', { email: email.trim(), password, clientType: 'web' });
    dataCache.clear();
    session.setToken(response.data.accessToken);
    const nextUser = completeUser(response.data.user, response.data.school);
    setUser(nextUser);
    setStartupError('');
    return nextUser;
  };
  const logout = async () => {
    dataCache.clear();
    session.setToken(null);
    setUser(null);
    try { await authApi.post('/api/auth/logout', {}); } catch { /* Local access is already cleared. */ }
  };
  const forgotPassword = async (email) => (await authApi.post('/api/auth/forgot-password', { email: email.trim() })).data;

  if (loading) return <div role="status" className="flex items-center justify-center min-h-screen text-primary-container">Loading your school portal...</div>;
  if (startupError) return <div role="alert" className="min-h-screen flex flex-col items-center justify-center gap-4 p-6">
    <p>{startupError}</p><button className="rounded-xl bg-primary p-3 text-white" onClick={() => window.location.reload()}>Try again</button>
  </div>;

  return <AuthContext.Provider value={{ user, login, logout, forgotPassword, reloadUser, loading, accessToken }}>
    {children}
  </AuthContext.Provider>;
};
