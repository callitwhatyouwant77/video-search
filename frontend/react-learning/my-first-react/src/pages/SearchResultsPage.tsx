import React, { useState, useEffect } from 'react';
import { 
  Container,
  Typography,
  Box,
  TextField,
  InputAdornment,
  Button,
  Tabs,
  Tab,
  Card,
  CardContent,
  CardMedia,
  Grid,
  Chip,
  Divider,
  IconButton,
  Pagination,
  CircularProgress,
  Alert
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { useSearchParams, useNavigate } from 'react-router-dom';
import apiService from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface VideoResult {
  id: string;
  title: string;
  thumbnail: string;
  channel?: string;
  views?: number;
  upload_date: string;
  duration?: string;
  bookmarked?: boolean;
}

interface ScriptSearchResult extends VideoResult {
  timestamp: string;
  script_context: string;
  matched_text: string;
}

const SearchResultsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  const initialQuery = searchParams.get('q') || '';
  const initialType = searchParams.get('type') || 'script';
  
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [searchType, setSearchType] = useState(initialType);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 搜索结果状态
  const [videoResults, setVideoResults] = useState<VideoResult[]>([]);
  const [scriptResults, setScriptResults] = useState<ScriptSearchResult[]>([]);
  const [totalResults, setTotalResults] = useState(0);

  useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery, initialType);
    }
  }, [initialQuery, initialType]);

  const performSearch = async (query: string, type: string, currentPage = 1) => {
    if (!query.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      if (type === 'script') {
        // 台词搜索
        const response = await apiService.search.transcripts(query, 10, 0.5, currentPage);
        setScriptResults(response.results.map((item: any) => ({
          id: item.video_id,
          title: item.video_title,
          thumbnail: item.thumbnail_url || 'https://via.placeholder.com/320x180',
          channel: item.channel || 'Unknown',
          upload_date: item.upload_date || new Date().toISOString().split('T')[0],
          duration: item.duration || '00:00',
          timestamp: item.timestamp || '00:00',
          script_context: item.context || '',
          matched_text: item.matched_text || query
        })));
        setTotalResults(response.total || response.results.length);
      } else {
        // 视频搜索
        const response = await apiService.videos.search(query, 10, currentPage);
        setVideoResults(response.results.map((item: any) => ({
          id: item.id,
          title: item.title,
          thumbnail: item.thumbnail_url || 'https://via.placeholder.com/320x180',
          channel: item.channel || 'Unknown',
          views: item.views || 0,
          upload_date: item.upload_date || new Date().toISOString().split('T')[0],
          duration: item.duration || '00:00'
        })));
        setTotalResults(response.total || response.results.length);
      }
    } catch (err: any) {
      console.error('搜索失败:', err);
      setError(err.response?.data?.detail || '搜索失败，请稍后再试');
      setScriptResults([]);
      setVideoResults([]);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSearch = () => {
    setPage(1); // 重置到第一页
    navigate(`/search?q=${encodeURIComponent(searchQuery)}&type=${searchType}`);
    performSearch(searchQuery, searchType, 1);
  };
  
  const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
    setSearchType(newValue);
    setPage(1); // 重置到第一页
    navigate(`/search?q=${encodeURIComponent(searchQuery)}&type=${newValue}`);
    performSearch(searchQuery, newValue, 1);
  };
  
  const toggleBookmark = async (id: string) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      await apiService.videos.toggleBookmark(id);
      // 更新本地状态
      if (searchType === 'video') {
        setVideoResults(prevResults => 
          prevResults.map(video => 
            video.id === id 
              ? { ...video, bookmarked: !video.bookmarked } 
              : video
          )
        );
      } else {
        setScriptResults(prevResults => 
          prevResults.map(result => 
            result.id === id 
              ? { ...result, bookmarked: !result.bookmarked } 
              : result
          )
        );
      }
    } catch (err) {
      console.error('收藏操作失败:', err);
    }
  };
  
  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
    performSearch(searchQuery, searchType, value);
    window.scrollTo(0, 0);
  };
  
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* 搜索框 */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="输入视频台词或视频名称..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ flexGrow: 1 }}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button 
            variant="contained" 
            onClick={handleSearch}
            disabled={loading}
            sx={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5a71d4 0%, #6a4291 100%)',
              }
            }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : '搜索'}
          </Button>
        </Box>
      </Box>
      
      {/* 搜索结果类型选项卡 */}
      <Box sx={{ mb: 2 }}>
        <Tabs 
          value={searchType} 
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab label="台词搜索" value="script" />
          <Tab label="视频搜索" value="video" />
        </Tabs>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {/* 搜索结果数量 */}
      {!loading && !error && (searchQuery || videoResults.length > 0 || scriptResults.length > 0) && (
        <Typography variant="body1" sx={{ mb: 3 }}>
          找到 {totalResults} 个结果
          {searchQuery && <> 与 "<strong>{searchQuery}</strong>" 相关</>}
        </Typography>
      )}
      
      {/* 加载指示器 */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      )}
      
      {/* 搜索结果 - 台词搜索 */}
      {!loading && searchType === 'script' && scriptResults.length > 0 && (
        <Box sx={{ mb: 4 }}>
          {scriptResults.map((result) => (
            <Card key={result.id} sx={{ mb: 2, overflow: 'hidden' }}>
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' } }}>
                <Box sx={{ position: 'relative', width: { xs: '100%', md: 320 }, flexShrink: 0 }}>
                  <CardMedia
                    component="img"
                    height="180"
                    image={result.thumbnail}
                    alt={result.title}
                  />
                  <Box sx={{ 
                    position: 'absolute', 
                    bottom: 8, 
                    right: 8, 
                    bgcolor: 'rgba(0,0,0,0.7)', 
                    color: 'white',
                    px: 1,
                    borderRadius: 1
                  }}>
                    {result.duration}
                  </Box>
                  <Box sx={{ 
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'rgba(0,0,0,0.3)',
                    opacity: 0,
                    transition: 'opacity 0.2s',
                    '&:hover': {
                      opacity: 1
                    }
                  }}
                    onClick={() => navigate(`/video/${result.id}?t=${result.timestamp}`)}
                  >
                    <IconButton sx={{ color: 'white', bgcolor: 'rgba(118, 75, 162, 0.8)', '&:hover': { bgcolor: 'rgba(118, 75, 162, 0.9)' } }}>
                      <PlayArrowIcon fontSize="large" />
                    </IconButton>
                  </Box>
                </Box>
                <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="h6" component="div" gutterBottom>
                      {result.title}
                    </Typography>
                    <IconButton 
                      size="small" 
                      onClick={() => toggleBookmark(result.id)}
                      sx={{ color: result.bookmarked ? '#764ba2' : 'inherit' }}
                    >
                      {result.bookmarked ? <BookmarkIcon /> : <BookmarkBorderIcon />}
                    </IconButton>
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {result.channel} • 时间点: {result.timestamp}
                  </Typography>
                  
                  <Box sx={{ my: 1, p: 1, bgcolor: 'rgba(118, 75, 162, 0.05)', borderRadius: 1 }}>
                    <Typography variant="body2">
                      ...{result.script_context.substring(0, result.script_context.indexOf(result.matched_text))}
                      <Box component="span" sx={{ bgcolor: 'rgba(118, 75, 162, 0.2)', px: 0.5, borderRadius: 0.5 }}>
                        {result.matched_text}
                      </Box>
                      {result.script_context.substring(result.script_context.indexOf(result.matched_text) + result.matched_text.length)}...
                    </Typography>
                  </Box>
                  
                  <Box sx={{ mt: 'auto', display: 'flex', justifyContent: 'flex-end' }}>
                    <Button 
                      variant="contained" 
                      size="small" 
                      onClick={() => navigate(`/video/${result.id}?t=${result.timestamp}`)}
                      sx={{ 
                        mt: 1,
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #5a71d4 0%, #6a4291 100%)',
                        }
                      }}
                    >
                      跳转到此片段
                    </Button>
                  </Box>
                </CardContent>
              </Box>
            </Card>
          ))}
          
          {totalResults > 10 && (
            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
              <Pagination 
                count={Math.ceil(totalResults / 10)} 
                page={page} 
                onChange={handlePageChange} 
                color="primary" 
              />
            </Box>
          )}
        </Box>
      )}
      
      {/* 搜索结果 - 视频搜索 */}
      {!loading && searchType === 'video' && videoResults.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Grid container spacing={3}>
            {videoResults.map((video) => (
              <Grid item key={video.id} xs={12} sm={6} md={4}>
                <Card sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 12px 20px rgba(0,0,0,0.1)'
                  }
                }}>
                  <Box sx={{ position: 'relative' }}>
                    <CardMedia
                      component="img"
                      height="180"
                      image={video.thumbnail}
                      alt={video.title}
                    />
                    <Box sx={{ 
                      position: 'absolute', 
                      bottom: 8, 
                      right: 8, 
                      bgcolor: 'rgba(0,0,0,0.7)', 
                      color: 'white',
                      px: 1,
                      borderRadius: 1
                    }}>
                      {video.duration}
                    </Box>
                    <Box sx={{ 
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: 'rgba(0,0,0,0.3)',
                      opacity: 0,
                      transition: 'opacity 0.2s',
                      '&:hover': {
                        opacity: 1
                      }
                    }}
                      onClick={() => navigate(`/video/${video.id}`)}
                    >
                      <IconButton sx={{ color: 'white', bgcolor: 'rgba(118, 75, 162, 0.8)', '&:hover': { bgcolor: 'rgba(118, 75, 162, 0.9)' } }}>
                        <PlayArrowIcon fontSize="large" />
                      </IconButton>
                    </Box>
                  </Box>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="h6" component="div" sx={{ 
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}>
                        {video.title}
                      </Typography>
                      <IconButton 
                        size="small" 
                        onClick={() => toggleBookmark(video.id)}
                        sx={{ 
                          flexShrink: 0, 
                          ml: 1, 
                          color: video.bookmarked ? '#764ba2' : 'inherit' 
                        }}
                      >
                        {video.bookmarked ? <BookmarkIcon /> : <BookmarkBorderIcon />}
                      </IconButton>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {video.channel}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {video.views && `${video.views.toLocaleString()} 次观看 • `}{video.upload_date}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
          
          {totalResults > 10 && (
            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
              <Pagination 
                count={Math.ceil(totalResults / 10)} 
                page={page} 
                onChange={handlePageChange} 
                color="primary" 
              />
            </Box>
          )}
        </Box>
      )}
      
      {/* 无搜索结果提示 */}
      {!loading && !error && ((searchType === 'script' && scriptResults.length === 0) || 
                               (searchType === 'video' && videoResults.length === 0)) && searchQuery && (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <Typography variant="h6" gutterBottom>
            未找到与 "{searchQuery}" 相关的{searchType === 'script' ? '台词' : '视频'}
          </Typography>
          <Typography color="text.secondary">
            请尝试其他关键词或切换搜索类型
          </Typography>
        </Box>
      )}
    </Container>
  );
};

export default SearchResultsPage; 