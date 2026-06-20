import { createContext, useContext, useEffect, useState } from 'react';
import { apiRequest, getTokens, setTokens, clearTokens, getApiBaseUrl } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const tokens = getTokens();
      if (tokens?.accessToken) {
        await fetchMe();
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const fetchMe = async () => {
    try {
      const response = await apiRequest('/v1/auth/me');
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        return userData;
      }
      clearTokens();
      setUser(null);
      return null;
    } catch {
      clearTokens();
      setUser(null);
      return null;
    }
  };

  const handleAuthCode = async (code) => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      if (response.status === 401) {
        const registerResponse = await fetch(`${getApiBaseUrl()}/v1/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        });

        if (!registerResponse.ok) {
          const error = await registerResponse.json().catch(() => ({}));
          throw new Error(error.detail || '회원가입에 실패했습니다.');
        }

        const registerData = await registerResponse.json();
        setTokens(registerData.access_token, registerData.refresh_token);
        await fetchMe();
        return { success: true };
      }

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || '로그인에 실패했습니다.');
      }

      const data = await response.json();
      setTokens(data.access_token, data.refresh_token);
      await fetchMe();
      return { success: true };
    } catch (error) {
      clearTokens();
      setUser(null);
      return { success: false, error: error.message };
    }
  };

  const handleLogout = async () => {
    const tokens = getTokens();
    if (tokens?.refreshToken) {
      try {
        await fetch(`${getApiBaseUrl()}/v1/auth/logout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: tokens.refreshToken }),
        });
      } catch {
        // ignore logout API errors
      }
    }
    clearTokens();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        loginWithCode: handleAuthCode,
        logout: handleLogout,
        refetchUser: fetchMe,
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
