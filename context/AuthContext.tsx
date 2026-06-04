'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  _id: string;
  username: string;
  email: string;
  avatar?: string;
  bio?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  refetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      setUser(data.user);
    } catch (error) {
      console.error('Error fetching user:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const refetchUser = async () => {
    setLoading(true);
    await fetchUser();
  };

  return (
    <AuthContext.Provider value={{ user, loading, refetchUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}