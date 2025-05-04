import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import apiService from '../services/api';

interface User {
  id: string;
  username: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  register: (userData: any) => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // 检查是否已经登录
  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          // 这里应该添加获取用户信息的API调用
          // 暂时使用模拟数据
          setUser({
            id: 'user-id',
            username: 'user',
            email: 'user@example.com',
          });
          setToken(storedToken);
        } catch (error) {
          console.error('验证token失败:', error);
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  // 登录
  const login = async (username: string, password: string) => {
    setLoading(true);
    try {
      const data = await apiService.auth.login(username, password);
      localStorage.setItem('token', data.access_token);
      setToken(data.access_token);
      
      // 设置用户信息
      setUser({
        id: 'user-id', // 实际应用中应该从后端获取
        username,
        email: username, // 假设用户名就是邮箱
      });
    } catch (error) {
      console.error('登录失败:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // 注销
  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  // 注册
  const register = async (userData: any) => {
    setLoading(true);
    try {
      await apiService.auth.register(userData);
      // 注册成功后自动登录
      await login(userData.username, userData.password);
    } catch (error) {
      console.error('注册失败:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        login,
        logout,
        register,
        loading,
      }}
    >
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