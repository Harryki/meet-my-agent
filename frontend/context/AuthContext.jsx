import { createContext, useContext, useEffect, useState } from 'react';
import { getCurrentUserEmail, findUser, login, signup, logout } from '../lib/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const email = getCurrentUserEmail();
    if (email) {
      const found = findUser(email);
      if (found) {
        setUser({ email: found.email });
      }
    }
    setLoading(false);
  }, []);

  const handleLogin = (email, password) => {
    const result = login(email, password);
    if (result.success) {
      setUser(result.user);
    }
    return result;
  };

  const handleSignup = (email, password) => {
    const result = signup(email, password);
    if (result.success) {
      setUser(result.user);
    }
    return result;
  };

  const handleLogout = () => {
    logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login: handleLogin,
        signup: handleSignup,
        logout: handleLogout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
