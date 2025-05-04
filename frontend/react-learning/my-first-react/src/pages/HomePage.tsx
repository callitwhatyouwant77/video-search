import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Grid,
  Card, 
  CardMedia, 
  CardContent, 
  Box,
  TextField,
  InputAdornment,
  Button,
  CircularProgress
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/api';

interface VideoItem {
  id: string;
  title: string;
  thumbnail: string;
  views?: number;
  upload_date: string;
}

const HomePage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [featuredVideos, setFeaturedVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchFeaturedVideos = async () => {
      try {
        setLoading(true);
        const response = await apiService.videos.getAll();
        const videos = response.map((video: any) => ({
          id: video.id,
          title: video.title,
          thumbnail: video.thumbnail_url || 'https://via.placeholder.com/300x180',
          views: video.views || 0,
          upload_date: video.upload_date || new Date().toISOString().split('T')[0]
        }));
        setFeaturedVideos(videos.slice(0, 6)); // 限制为6个
      } catch (error) {
        console.error('获取视频列表失败:', error);
        // 使用备用数据
        setFeaturedVideos([
          {
            id: '1',
            title: '2023年度精彩回顾',
            thumbnail: 'https://via.placeholder.com/300x180',
            views: 245678,
            upload_date: '2023-12-30'
          },
          {
            id: '2',
            title: '春季旅行Vlog',
            thumbnail: 'https://via.placeholder.com/300x180',
            views: 189245,
            upload_date: '2024-03-15'
          },
          {
            id: '3',
            title: '烹饪教程：家常菜30分钟搞定',
            thumbnail: 'https://via.placeholder.com/300x180',
            views: 352410,
            upload_date: '2024-02-20'
          },
          {
            id: '4',
            title: '编程入门：React基础',
            thumbnail: 'https://via.placeholder.com/300x180',
            views: 124578,
            upload_date: '2024-01-10'
          },
          {
            id: '5',
            title: '每日新闻快讯',
            thumbnail: 'https://via.placeholder.com/300x180',
            views: 98752,
            upload_date: '2024-04-01'
          },
          {
            id: '6',
            title: '音乐现场：城市之声',
            thumbnail: 'https://via.placeholder.com/300x180',
            views: 203654,
            upload_date: '2024-03-25'
          }
        ]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchFeaturedVideos();
  }, []);
  
  const handleSearch = (searchType: string) => {
    if (!searchQuery.trim()) return;
    navigate(`/search?q=${encodeURIComponent(searchQuery)}&type=${searchType}`);
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch('script'); // 默认台词搜索
    }
  };
  
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Hero Section */}
      <Box sx={{ 
        p: 5, 
        borderRadius: 2,
        mb: 4, 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        textAlign: 'center'
      }}>
        <Typography variant="h3" component="h1" gutterBottom fontWeight="bold">
          视频台词搜索与剪辑助手
        </Typography>
        <Typography variant="h6" sx={{ mb: 3, maxWidth: '800px', mx: 'auto' }}>
          快速定位视频片段，轻松实现二次创作
        </Typography>
        
        <Box sx={{ maxWidth: '700px', mx: 'auto', mt: 4 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="输入视频台词或视频名称..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'white' }} />
                </InputAdornment>
              ),
              sx: { 
                bgcolor: 'rgba(255,255,255,0.15)',
                borderRadius: 2,
                '& fieldset': { border: 'none' },
                color: 'white',
                '&::placeholder': { color: 'rgba(255,255,255,0.7)' }
              }
            }}
          />
          <Box sx={{ mt: 2, display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button 
              variant="contained" 
              onClick={() => handleSearch('script')}
              sx={{ bgcolor: 'white', color: '#764ba2', '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' } }}
            >
              搜索台词
            </Button>
            <Button 
              variant="outlined" 
              onClick={() => handleSearch('video')}
              sx={{ borderColor: 'white', color: 'white', '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}
            >
              搜索视频
            </Button>
          </Box>
        </Box>
      </Box>
      
      {/* Featured Videos Section */}
      <Box sx={{ mb: 6 }}>
        <Typography variant="h4" component="h2" sx={{ mb: 3, fontWeight: 'bold' }}>
          热门推荐
        </Typography>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={3}>
            {featuredVideos.map((video) => (
              <Grid item key={video.id} xs={12} sm={6} md={4}>
                <Card 
                  sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: '0 12px 20px rgba(0,0,0,0.1)'
                    },
                    cursor: 'pointer'
                  }}
                  onClick={() => navigate(`/video/${video.id}`)}
                >
                  <CardMedia
                    component="img"
                    height="180"
                    image={video.thumbnail}
                    alt={video.title}
                  />
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography gutterBottom variant="h6" component="div" noWrap>
                      {video.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {video.views ? `${video.views.toLocaleString()} 次观看` : ''} • {video.upload_date}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
      
      {/* Features Section */}
      <Box sx={{ mb: 6 }}>
        <Typography variant="h4" component="h2" sx={{ mb: 3, fontWeight: 'bold', textAlign: 'center' }}>
          主要功能
        </Typography>
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center', p: 2 }}>
              <Box sx={{ 
                width: 80, 
                height: 80, 
                borderRadius: '50%', 
                bgcolor: 'rgba(118, 75, 162, 0.1)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                mx: 'auto',
                mb: 2
              }}>
                <SearchIcon sx={{ fontSize: 40, color: '#764ba2' }} />
              </Box>
              <Typography variant="h6" gutterBottom>台词精准搜索</Typography>
              <Typography variant="body2" color="text.secondary">
                根据视频台词关键词，精准定位到视频片段时间点，帮助创作者快速找到所需素材。
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center', p: 2 }}>
              <Box sx={{ 
                width: 80, 
                height: 80, 
                borderRadius: '50%', 
                bgcolor: 'rgba(118, 75, 162, 0.1)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                mx: 'auto',
                mb: 2
              }}>
                <SearchIcon sx={{ fontSize: 40, color: '#764ba2' }} />
              </Box>
              <Typography variant="h6" gutterBottom>视频名称搜索</Typography>
              <Typography variant="body2" color="text.secondary">
                快速找到您想要的视频，浏览更多相关内容，提高创作效率。
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center', p: 2 }}>
              <Box sx={{ 
                width: 80, 
                height: 80, 
                borderRadius: '50%', 
                bgcolor: 'rgba(118, 75, 162, 0.1)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                mx: 'auto',
                mb: 2
              }}>
                <SearchIcon sx={{ fontSize: 40, color: '#764ba2' }} />
              </Box>
              <Typography variant="h6" gutterBottom>个性化推荐</Typography>
              <Typography variant="body2" color="text.secondary">
                基于您的浏览和搜索历史，智能推荐更多您可能感兴趣的视频内容。
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default HomePage; 