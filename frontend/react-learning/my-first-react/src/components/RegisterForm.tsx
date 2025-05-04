import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { TextField, Button, Box, Typography, Alert } from '@mui/material';

const RegisterForm: React.FC = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { register, loading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // 验证表单
    if (!username || !email || !password || !confirmPassword) {
      setError('请填写所有字段');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }
    
    try {
      await register({
        username,
        email,
        password,
      });
    } catch (err: any) {
      setError(err.response?.data?.detail || '注册失败，请稍后再试');
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
        注册账号
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
        label="电子邮箱"
        type="email"
        variant="outlined"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
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
      
      <TextField
        label="确认密码"
        type="password"
        variant="outlined"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
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
        {loading ? '注册中...' : '注册'}
      </Button>
    </Box>
  );
};

export default RegisterForm; 