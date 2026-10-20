import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api.js';

const AuthContext = createContext(null);

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
      const res = await api.get('/auth/me');
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
      const res = await api.post('/auth/login', { email, password });
      if (res.data.success) {
        localStorage.setItem('arcstep_token', res.data.token);
        setUser(res.data.user);
        return true;
      }
    } catch (err) {
      setUser(null);
      if (err.response) {
        setError(err.response.data?.message || 'Authentication failed');
      } else if (err.request) {
        setError('Cannot reach the server. Check your connection.');
      } else {
        setError('Login failed');
      }
      return false;
    }
  };

  const sendOtp = async (name, email, password) => {
    setError('');
    try {
      const res = await api.post('/auth/send-otp', { name, email, password });
      return { success: true, message: res.data?.message || 'Verification code sent' };
    } catch (err) {
      const message = err.response?.data?.message || (err.request ? 'Cannot reach the server' : 'Failed to send verification code');
      setError(message);
      return { success: false, message };
    }
  };

  const resendOtp = async (email, name = '') => {
    setError('');
    try {
      const res = await api.post('/auth/resend-otp', { email, name });
      return { success: true, message: res.data?.message || 'New verification code sent' };
    } catch (err) {
      const message = err.response?.data?.message || (err.request ? 'Cannot reach the server' : 'Failed to resend verification code');
      setError(message);
      return { success: false, message };
    }
  };

  const verifyAndRegister = async (name, email, password, otp) => {
    setError('');
    try {
      const res = await api.post('/auth/register', { name, email, password, otp });
      if (res.data.success) {
        localStorage.setItem('arcstep_token', res.data.token);
        setUser(res.data.user);
        return true;
      }
      throw new Error(res.data?.message || 'Registration failed');
    } catch (err) {
      const message = err.response?.data?.message || (err.request ? 'Cannot reach the server. Check your connection.' : err.message || 'Registration failed');
      setError(message);
      return false;
    }
  };

  const register = async (name, email, password, otp) => {
    return verifyAndRegister(name, email, password, otp);
  };

  const logout = () => {
    localStorage.removeItem('arcstep_token');
    setUser(null);
    api.post('/auth/logout').catch(() => {});
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        setError,
        login,
        register,
        sendOtp,
        resendOtp,
        verifyAndRegister,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
