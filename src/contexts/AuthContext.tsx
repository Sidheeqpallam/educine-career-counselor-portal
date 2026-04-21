import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Counselor } from '../types';
import http from '../utils/http';

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
    const response = await http.post('/counselors/login', { mobile });
    const data = response.data || {};

    // Try multiple token locations to be resilient to API shape
    const token = data.data?.token || data.token || data.data?.authToken || data.authToken || '';

    if (!data.data || !data.data.id) {
      throw new Error('Login failed');
    }

    const counselorInfo: Counselor = {
      id: data.data.id,
      name: data.data.name,
      mobile,
    };

    setCounselor(counselorInfo);
    if (token) {
      localStorage.setItem('counselorToken', token);
    }
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
