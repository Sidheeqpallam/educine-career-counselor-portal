import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Counselor } from '../types';

interface AuthContextType {
  counselor: Counselor | null;
  login: (mobile: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [counselor, setCounselor] = useState<Counselor | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('counselorToken');
    const counselorInfo = localStorage.getItem('counselorInfo');

    if (token && counselorInfo) {
      try {
        setCounselor(JSON.parse(counselorInfo));
      } catch (error) {
        localStorage.removeItem('counselorToken');
        localStorage.removeItem('counselorInfo');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (mobile: string) => {
    const response = await fetch(`${process.env.REACT_APP_API_URL}/api/educine/counselors/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ mobile }),
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    const data = await response.json();
    const counselorInfo: Counselor = {
      id: data.data.id,
      name: data.data.name,
      mobile,
    };

    setCounselor(counselorInfo);
    localStorage.setItem('counselorToken', 'dummy-token'); // In real app, use actual token
    localStorage.setItem('counselorInfo', JSON.stringify(counselorInfo));
  };

  const logout = () => {
    setCounselor(null);
    localStorage.removeItem('counselorToken');
    localStorage.removeItem('counselorInfo');
  };

  return (
    <AuthContext.Provider value={{ counselor, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
