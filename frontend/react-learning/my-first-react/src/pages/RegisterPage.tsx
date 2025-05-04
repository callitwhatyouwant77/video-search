import React, { useState } from 'react';
import { 
  Container, 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Paper, 
  Link, 
  InputAdornment, 
  IconButton,
  Divider,
  Checkbox,
  FormControlLabel,
  Stack,
  Alert
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const RegisterPage: React.FC = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { register, loading } = useAuth();
  const navigate = useNavigate();
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'agreeTerms' ? checked : value
    }));
  };
  
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    
    // 表单验证
    if (!formData.username || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('请填写所有必填字段');
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }
    
    if (!formData.agreeTerms) {
      setError('请阅读并同意服务条款和隐私政策');
      return;
    }
    
    try {
      await register({
        username: formData.username,
        email: formData.email,
        password: formData.password
      });
      
      // 注册成功后会自动登录并跳转到首页
      navigate('/');
    } catch (err: any) {
      console.error('注册失败:', err);
      setError(err.response?.data?.detail || '注册失败，请稍后再试');
    }
  };
  
  return (
    <Container component="main" maxWidth="sm">
      <Paper
        elevation={3}
        sx={{
          mt: 8,
          p: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          borderRadius: 2
        }}
      >
        <Typography component="h1" variant="h4" fontWeight="bold" sx={{ mb: 3 }}>
          创建账号
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
          <Stack spacing={2}>
            <TextField
              required
              fullWidth
              id="username"
              label="用户名"
              name="username"
              autoComplete="username"
              value={formData.username}
              onChange={handleChange}
            />
            
            <TextField
              required
              fullWidth
              id="email"
              label="邮箱地址"
              name="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
            />
            
            <TextField
              required
              fullWidth
              name="password"
              label="密码"
              type={showPassword ? 'text' : 'password'}
              id="password"
              autoComplete="new-password"
              value={formData.password}
              onChange={handleChange}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            
            <TextField
              required
              fullWidth
              name="confirmPassword"
              label="确认密码"
              type={showConfirmPassword ? 'text' : 'password'}
              id="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle confirm password visibility"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      edge="end"
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            
            <FormControlLabel
              control={
                <Checkbox 
                  name="agreeTerms" 
                  color="primary" 
                  checked={formData.agreeTerms}
                  onChange={handleChange}
                />
              }
              label={
                <Box component="span" sx={{ fontSize: '0.875rem' }}>
                  我已阅读并同意
                  <Link component={RouterLink} to="/terms" sx={{ ml: 0.5 }}>
                    服务条款
                  </Link>
                  和
                  <Link component={RouterLink} to="/privacy" sx={{ ml: 0.5 }}>
                    隐私政策
                  </Link>
                </Box>
              }
            />
          </Stack>
          
          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={!formData.agreeTerms || loading}
            sx={{ 
              mt: 3, 
              mb: 2, 
              py: 1.2,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5a71d4 0%, #6a4291 100%)',
              }
            }}
          >
            {loading ? '注册中...' : '注册'}
          </Button>
          
          <Box sx={{ textAlign: 'center', mb: 2 }}>
            <Link component={RouterLink} to="/login" variant="body2">
              已有账号? 立即登录
            </Link>
          </Box>
          
          <Divider sx={{ my: 2 }}>或</Divider>
          
          <Button
            fullWidth
            variant="outlined"
            sx={{ py: 1 }}
          >
            使用微信注册
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default RegisterPage; 