import { createContext, useState, useContext, useCallback } from 'react';
import api from '../api';

const AuthContext = createContext();

const getStoredAuth = () => {
  const storedToken = localStorage.getItem('token');
  const storedUser = localStorage.getItem('user');

  if (!storedToken || !storedUser) {
    return { token: null, user: null };
  }

  try {
    return { token: storedToken, user: JSON.parse(storedUser) };
  } catch (e) {
    console.error("Failed to parse stored user", e);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return { token: null, user: null };
  }
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [initialAuth] = useState(getStoredAuth);
  const [user, setUser] = useState(initialAuth.user);
  const [token, setToken] = useState(initialAuth.token);
  const [loading] = useState(false);

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, ...userData } = response.data;

      setUser(userData);
      setToken(token);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('token', token);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed'
      };
    }
  };

  const register = async (name, email, password) => {
    try {
      const response = await api.post('/auth/register', { name, email, password });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed'
      };
    }
  };

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  }, []);

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
