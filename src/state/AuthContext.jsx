import { createContext, useContext, useMemo, useState, useCallback } from 'react';

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [session, setSession] = useState({
    isAuthenticated: false,
    email: '',
  });

  const login = useCallback((email) => {
    setSession({
      isAuthenticated: true,
      email,
    });
  }, []);

  const logout = useCallback(() => {
    setSession({
      isAuthenticated: false,
      email: '',
    });
  }, []);

  const value = useMemo(
    () => ({
      ...session,
      login,
      logout,
    }),
    [session, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
