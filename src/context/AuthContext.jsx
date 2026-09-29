import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

const API_URL = 'http://localhost:5000/api';

// Configure axios defaults
axios.defaults.withCredentials = true;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('arcstep_token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const res = await axios.get(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setUser(res.data.user);
      }
    } catch (err) {
      localStorage.removeItem('arcstep_token');
    }
    setLoading(false);
  };

  const login = async (email, password) => {
    setError('');
    try {
      const res = await axios.post(`${API_URL}/auth/login`, { email, password });
      if (res.data.success) {
        localStorage.setItem('arcstep_token', res.data.token);
        setUser(res.data.user);
        return true;
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
      return false;
    }
  };

  const register = async (name, email, password) => {
    setError('');
    try {
      const res = await axios.post(`${API_URL}/auth/register`, { name, email, password });
      if (res.data.success) {
        localStorage.setItem('arcstep_token', res.data.token);
        setUser(res.data.user);
        return true;
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('arcstep_token');
    setUser(null);
    axios.post(`${API_URL}/auth/logout`).catch(() => {});
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, setError, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
