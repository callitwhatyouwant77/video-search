import React from 'react';
import { 
  Box,
  Container,
  Typography,
  Grid,
  Divider,
  Link
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <Box
      component="footer"
      sx={{
        py: 6,
        px: 2,
        mt: 'auto',
        backgroundColor: (theme) => theme.palette.mode === 'light' ? '#f5f5f5' : '#333',
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          {/* @ts-ignore */}
          <Grid item xs={12} sm={6} md={3}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                mb: 2,
                backgroundImage: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              VIDSCRIPT
            </Typography>
            <Typography variant="body2" color="text.secondary">
              帮助创作者快速找到视频素材，
              <br />
              提高二次创作效率的平台
            </Typography>
          </Grid>
          
          {/* @ts-ignore */}
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="subtitle1" color="text.primary" gutterBottom fontWeight="bold">
              功能
            </Typography>
            <Link component={RouterLink} to="/search?type=script" color="inherit" underline="hover" display="block" sx={{ mb: 1 }}>
              台词搜索
            </Link>
            <Link component={RouterLink} to="/search?type=video" color="inherit" underline="hover" display="block" sx={{ mb: 1 }}>
              视频搜索
            </Link>
            <Link component={RouterLink} to="/favorites" color="inherit" underline="hover" display="block" sx={{ mb: 1 }}>
              收藏管理
            </Link>
          </Grid>
          
          {/* @ts-ignore */}
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="subtitle1" color="text.primary" gutterBottom fontWeight="bold">
              关于我们
            </Typography>
            <Link component={RouterLink} to="/about" color="inherit" underline="hover" display="block" sx={{ mb: 1 }}>
              公司介绍
            </Link>
            <Link component={RouterLink} to="/team" color="inherit" underline="hover" display="block" sx={{ mb: 1 }}>
              团队成员
            </Link>
            <Link component={RouterLink} to="/contact" color="inherit" underline="hover" display="block" sx={{ mb: 1 }}>
              联系我们
            </Link>
          </Grid>
          
          {/* @ts-ignore */}
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="subtitle1" color="text.primary" gutterBottom fontWeight="bold">
              法律
            </Typography>
            <Link component={RouterLink} to="/terms" color="inherit" underline="hover" display="block" sx={{ mb: 1 }}>
              服务条款
            </Link>
            <Link component={RouterLink} to="/privacy" color="inherit" underline="hover" display="block" sx={{ mb: 1 }}>
              隐私政策
            </Link>
            <Link component={RouterLink} to="/copyright" color="inherit" underline="hover" display="block" sx={{ mb: 1 }}>
              版权声明
            </Link>
          </Grid>
        </Grid>
        
        <Divider sx={{ my: 3 }} />
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', flexDirection: { xs: 'column', sm: 'row' } }}>
          <Typography variant="body2" color="text.secondary" align="center">
            © {new Date().getFullYear()} VIDSCRIPT. 保留所有权利
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: { xs: 'center', sm: 'flex-end' }, mt: { xs: 2, sm: 0 } }}>
            <Link href="#" color="inherit" sx={{ mx: 1 }}>
              <img src="https://via.placeholder.com/24" alt="微信" width="24" height="24" />
            </Link>
            <Link href="#" color="inherit" sx={{ mx: 1 }}>
              <img src="https://via.placeholder.com/24" alt="微博" width="24" height="24" />
            </Link>
            <Link href="#" color="inherit" sx={{ mx: 1 }}>
              <img src="https://via.placeholder.com/24" alt="抖音" width="24" height="24" />
            </Link>
            <Link href="#" color="inherit" sx={{ mx: 1 }}>
              <img src="https://via.placeholder.com/24" alt="哔哩哔哩" width="24" height="24" />
            </Link>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer; 