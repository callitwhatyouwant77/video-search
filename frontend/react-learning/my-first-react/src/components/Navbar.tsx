import React, { useState } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Box, 
  IconButton, 
  Avatar, 
  Menu, 
  MenuItem, 
  TextField, 
  InputAdornment,
  Divider,
  useScrollTrigger,
  Slide,
  Badge,
  Container
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import VideoCallOutlinedIcon from '@mui/icons-material/VideoCallOutlined';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface NavbarProps {
  isLoggedIn?: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ isLoggedIn = false }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  
  const trigger = useScrollTrigger();
  
  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}&type=script`);
      handleMenuClose();
    }
  };
  
  const handleLogout = () => {
    logout();
    handleMenuClose();
    navigate('/');
  };
  
  // 用户头像显示
  const getInitials = () => {
    if (!user || !user.username) return 'U';
    return user.username.charAt(0).toUpperCase();
  };
  
  return (
    <Slide appear={false} direction="down" in={!trigger}>
      <AppBar position="sticky" color="default" elevation={1} sx={{ bgcolor: 'rgba(255, 255, 255, 0.95)' }}>
        <Container maxWidth="xl">
          <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 1, sm: 2 } }}>
            {/* Logo */}
            <Box 
              component={RouterLink} 
              to="/" 
              sx={{ 
                textDecoration: 'none', 
                color: 'inherit',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <Typography
                variant="h6"
                noWrap
                sx={{
                  fontWeight: 700,
                  letterSpacing: '.2rem',
                  backgroundImage: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                VIDSCRIPT
              </Typography>
            </Box>
            
            {/* 搜索框 */}
            <Box 
              component="form" 
              onSubmit={handleSearch} 
              sx={{ 
                flexGrow: 1, 
                maxWidth: 600, 
                mx: 2,
                display: { xs: 'none', md: 'block' } 
              }}
            >
              <TextField
                fullWidth
                size="small"
                placeholder="搜索视频台词或名称..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                  endAdornment: searchQuery && (
                    <InputAdornment position="end">
                      <Button 
                        variant="contained" 
                        size="small" 
                        type="submit"
                        sx={{ 
                          minWidth: 'unset',
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          '&:hover': {
                            background: 'linear-gradient(135deg, #5a71d4 0%, #6a4291 100%)',
                          }
                        }}
                      >
                        搜索
                      </Button>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#764ba2',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#764ba2',
                    }
                  }
                }}
              />
            </Box>
            
            {/* 右侧菜单 */}
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {isLoggedIn ? (
                <>
                  <IconButton 
                    color="inherit" 
                    sx={{ mr: 1 }}
                    component={RouterLink}
                    to="/upload"
                  >
                    <VideoCallOutlinedIcon />
                  </IconButton>
                  <IconButton color="inherit" sx={{ mr: 2 }}>
                    <Badge badgeContent={3} color="primary">
                      <NotificationsNoneIcon />
                    </Badge>
                  </IconButton>
                  <IconButton
                    edge="end"
                    onClick={handleProfileMenuOpen}
                  >
                    <Avatar sx={{ width: 32, height: 32, bgcolor: '#764ba2' }}>
                      {getInitials()}
                    </Avatar>
                  </IconButton>
                  <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleMenuClose}
                    transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                    anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                  >
                    <MenuItem component={RouterLink} to="/profile" onClick={handleMenuClose}>个人资料</MenuItem>
                    <MenuItem component={RouterLink} to="/favorites" onClick={handleMenuClose}>我的收藏</MenuItem>
                    <MenuItem component={RouterLink} to="/videos" onClick={handleMenuClose}>我的视频</MenuItem>
                    <Divider />
                    <MenuItem onClick={handleLogout}>退出登录</MenuItem>
                  </Menu>
                </>
              ) : (
                <>
                  <Button 
                    component={RouterLink} 
                    to="/login" 
                    variant="outlined" 
                    sx={{ 
                      mr: 1,
                      borderColor: '#764ba2',
                      color: '#764ba2',
                      '&:hover': {
                        borderColor: '#5a3d7a',
                        bgcolor: 'rgba(118, 75, 162, 0.05)'
                      }
                    }}
                  >
                    登录
                  </Button>
                  <Button 
                    component={RouterLink} 
                    to="/register" 
                    variant="contained" 
                    sx={{ 
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #5a71d4 0%, #6a4291 100%)',
                      }
                    }}
                  >
                    注册
                  </Button>
                </>
              )}
            </Box>
          </Toolbar>
        </Container>
      </AppBar>
    </Slide>
  );
};

export default Navbar; 