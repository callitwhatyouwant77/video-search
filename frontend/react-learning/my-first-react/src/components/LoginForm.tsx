import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { TextField, Button, Box, Typography, Alert } from '@mui/material';

const LoginForm: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { login, loading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!username || !password) {
      setError('请输入用户名和密码');
      return;
    }
    
    try {
      await login(username, password);
    } catch (err) {
      setError('登录失败，请检查用户名和密码');
      console.error(err);
    }
  };

  return (
    <Box 
      component="form" 
      onSubmit={handleSubmit} 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: 2, 
        maxWidth: 400, 
        margin: '0 auto' 
      }}
    >
      <Typography variant="h5" component="h1" align="center">
        登录
      </Typography>
      
      {error && <Alert severity="error">{error}</Alert>}
      
      <TextField
        label="用户名"
        variant="outlined"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        required
        fullWidth
      />
      
      <TextField
        label="密码"
        type="password"
        variant="outlined"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        fullWidth
      />
      
      <Button 
        type="submit" 
        variant="contained" 
        color="primary" 
        fullWidth
        disabled={loading}
      >
        {loading ? '登录中...' : '登录'}
      </Button>
    </Box>
  );
};

export default LoginForm; 