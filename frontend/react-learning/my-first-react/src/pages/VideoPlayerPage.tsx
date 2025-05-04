import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Box, 
  Typography, 
  Grid, 
  Card, 
  CardMedia, 
  CardContent, 
  Button, 
  Divider, 
  List, 
  ListItemButton,
  ListItemText, 
  Tab, 
  Tabs, 
  IconButton, 
  TextField,
  Avatar,
  Paper,
  CircularProgress,
  Alert
} from '@mui/material';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import ShareIcon from '@mui/icons-material/Share';
import ThumbUpOutlinedIcon from '@mui/icons-material/ThumbUpOutlined';
import ThumbDownOutlinedIcon from '@mui/icons-material/ThumbDownOutlined';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import apiService from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface TimeMarker {
  id: string;
  time: string;
  text: string;
}

interface VideoData {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  videoUrl: string;
  channel?: string;
  channelAvatar?: string;
  subscribers?: number;
  views?: number;
  likes?: number;
  dislikes?: number;
  upload_date: string;
  duration?: string;
  bookmarked?: boolean;
}

const VideoPlayerPage: React.FC = () => {
  const { videoId } = useParams<{ videoId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  const initialTimestamp = searchParams.get('t') || '00:00';
  
  const [activeTab, setActiveTab] = useState<string>('script');
  const [videoData, setVideoData] = useState<VideoData | null>(null);
  const [timeMarkers, setTimeMarkers] = useState<TimeMarker[]>([]);
  const [relatedVideos, setRelatedVideos] = useState<VideoData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isBookmarked, setIsBookmarked] = useState<boolean>(false);
  const [highlightedMarker, setHighlightedMarker] = useState<string | null>(null);
  
  // 加载视频数据
  useEffect(() => {
    const fetchVideoData = async () => {
      if (!videoId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // 获取视频详情
        const videoResponse = await apiService.videos.getById(videoId);
        setVideoData({
          id: videoResponse.id,
          title: videoResponse.title,
          description: videoResponse.description || '没有描述',
          thumbnail: videoResponse.thumbnail_url || 'https://via.placeholder.com/1280x720',
          videoUrl: videoResponse.video_url || '',
          channel: videoResponse.channel || '未知频道',
          channelAvatar: videoResponse.channel_avatar || 'https://via.placeholder.com/50',
          upload_date: videoResponse.upload_date || new Date().toISOString().split('T')[0],
          duration: videoResponse.duration || '00:00',
          views: videoResponse.views || 0,
          likes: videoResponse.likes || 0,
          dislikes: videoResponse.dislikes || 0,
          bookmarked: videoResponse.is_bookmarked || false
        });
        setIsBookmarked(videoResponse.is_bookmarked || false);
        
        // 获取视频字幕/台词
        const transcriptResponse = await apiService.videos.getTranscripts(videoId);
        // 转换为时间标记
        const markers: TimeMarker[] = transcriptResponse.map((item: any, index: number) => ({
          id: `m${index}`,
          time: item.timestamp || '00:00',
          text: item.text || ''
        }));
        setTimeMarkers(markers);
        
        // 获取相关视频
        const relatedResponse = await apiService.videos.getRelated(videoId);
        setRelatedVideos(relatedResponse.map((item: any) => ({
          id: item.id,
          title: item.title,
          thumbnail: item.thumbnail_url || 'https://via.placeholder.com/300x180',
          channel: item.channel || '未知频道',
          views: item.views || 0,
          upload_date: item.upload_date || new Date().toISOString().split('T')[0],
          duration: item.duration || '00:00'
        })));
        
        // 如果有时间戳参数，高亮显示对应的标记
        if (initialTimestamp !== '00:00') {
          const matchingMarker = markers.find(marker => marker.time === initialTimestamp);
          if (matchingMarker) {
            setHighlightedMarker(matchingMarker.id);
          }
        }
      } catch (err: any) {
        console.error('加载视频失败:', err);
        setError(err.response?.data?.detail || '加载视频失败，请稍后再试');
      } finally {
        setLoading(false);
      }
    };
    
    fetchVideoData();
  }, [videoId, initialTimestamp]);
  
  const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
    setActiveTab(newValue);
  };
  
  const toggleBookmark = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    if (!videoId) return;
    
    try {
      await apiService.videos.toggleBookmark(videoId);
      setIsBookmarked(!isBookmarked);
    } catch (err) {
      console.error('收藏操作失败:', err);
    }
  };
  
  const handleMarkerClick = (markerId: string) => {
    setHighlightedMarker(markerId);
    const marker = timeMarkers.find(m => m.id === markerId);
    if (marker) {
      // 实际应用中，这里会跳转到视频的对应时间点
      console.log(`跳转到时间点: ${marker.time}`);
      
      // 更新URL参数但不重新加载页面
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.set('t', marker.time);
      navigate(`/video/${videoId}?${newSearchParams.toString()}`, { replace: true });
    }
  };
  
  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 8, textAlign: 'center' }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          加载视频中...
        </Typography>
      </Container>
    );
  }
  
  if (error || !videoData) {
    return (
      <Container maxWidth="xl" sx={{ py: 8 }}>
        <Alert severity="error" sx={{ mb: 4 }}>
          {error || '无法加载视频'}
        </Alert>
        <Button 
          variant="contained" 
          onClick={() => navigate('/')}
          sx={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #5a71d4 0%, #6a4291 100%)',
            }
          }}
        >
          返回首页
        </Button>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Grid container spacing={3}>
        {/* 左侧：视频播放器和信息 */}
        <Grid item xs={12} lg={8}>
          {/* 视频播放器 */}
          <Box 
            sx={{ 
              width: '100%', 
              height: 0, 
              paddingBottom: '56.25%', /* 16:9 宽高比 */
              position: 'relative',
              bgcolor: 'black',
              borderRadius: 2,
              overflow: 'hidden',
              mb: 2
            }}
          >
            {videoData.videoUrl ? (
              <iframe
                src={videoData.videoUrl}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  border: 'none'
                }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={videoData.title}
              />
            ) : (
              <Box sx={{ 
                position: 'absolute', 
                top: 0, 
                left: 0, 
                width: '100%', 
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Box 
                  component="img" 
                  src={videoData.thumbnail} 
                  alt={videoData.title}
                  sx={{ 
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'cover',
                    opacity: 0.7
                  }}
                />
                <IconButton 
                  sx={{ 
                    position: 'absolute',
                    color: 'white',
                    bgcolor: 'rgba(118, 75, 162, 0.8)',
                    '&:hover': { bgcolor: 'rgba(118, 75, 162, 0.9)' },
                    p: 2
                  }}
                >
                  <PlayArrowIcon sx={{ fontSize: 60 }} />
                </IconButton>
              </Box>
            )}
          </Box>
          
          {/* 视频标题和操作按钮 */}
          <Typography variant="h5" component="h1" gutterBottom fontWeight="bold">
            {videoData.title}
          </Typography>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                {videoData.views?.toLocaleString()} 次观看 • {videoData.upload_date}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button 
                startIcon={<ThumbUpOutlinedIcon />} 
                variant="outlined"
                size="small"
              >
                {videoData.likes?.toLocaleString()}
              </Button>
              
              <Button 
                startIcon={<ThumbDownOutlinedIcon />} 
                variant="outlined"
                size="small"
              >
                {videoData.dislikes?.toLocaleString()}
              </Button>
              
              <Button 
                startIcon={<ShareIcon />} 
                variant="outlined"
                size="small"
              >
                分享
              </Button>
              
              <Button 
                startIcon={isBookmarked ? <BookmarkIcon /> : <BookmarkBorderIcon />} 
                variant="outlined"
                size="small"
                onClick={toggleBookmark}
                sx={{ 
                  color: isBookmarked ? '#764ba2' : 'inherit',
                  borderColor: isBookmarked ? '#764ba2' : 'inherit'
                }}
              >
                收藏
              </Button>
            </Box>
          </Box>
          
          {/* 分隔线 */}
          <Divider sx={{ my: 2 }} />
          
          {/* 频道信息 */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Avatar 
                src={videoData.channelAvatar} 
                alt={videoData.channel}
                sx={{ width: 48, height: 48, mr: 2 }}
              />
              <Box>
                <Typography variant="subtitle1" fontWeight="bold">
                  {videoData.channel}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {videoData.subscribers ? `${videoData.subscribers.toLocaleString()} 位订阅者` : ''}
                </Typography>
              </Box>
            </Box>
            
            <Button 
              variant="contained" 
              sx={{ 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5a71d4 0%, #6a4291 100%)',
                }
              }}
            >
              订阅
            </Button>
          </Box>
          
          {/* 视频描述 */}
          <Paper sx={{ p: 2, mb: 4, bgcolor: 'rgba(0,0,0,0.02)' }}>
            <Typography variant="body1">
              {videoData.description}
            </Typography>
          </Paper>
          
          {/* 台词/评论切换选项卡 */}
          <Box sx={{ width: '100%', mb: 4 }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs 
                value={activeTab} 
                onChange={handleTabChange}
                indicatorColor="primary"
                textColor="primary"
              >
                <Tab label="台词时间轴" value="script" />
                <Tab label="评论" value="comments" />
              </Tabs>
            </Box>
            
            {/* 台词时间轴 */}
            {activeTab === 'script' && (
              <Box>
                {timeMarkers.length > 0 ? (
                  <List component="div" disablePadding>
                    {timeMarkers.map((marker) => (
                      <ListItemButton
                        key={marker.id}
                        selected={highlightedMarker === marker.id}
                        onClick={() => handleMarkerClick(marker.id)}
                        sx={{
                          borderBottom: '1px solid rgba(0,0,0,0.06)',
                          bgcolor: highlightedMarker === marker.id ? 'rgba(118, 75, 162, 0.08)' : 'transparent',
                          '&:hover': {
                            bgcolor: 'rgba(118, 75, 162, 0.05)'
                          }
                        }}
                      >
                        <ListItemText
                          primary={marker.text}
                          secondary={marker.time}
                          primaryTypographyProps={{
                            variant: 'body2',
                          }}
                          secondaryTypographyProps={{
                            variant: 'caption',
                            color: highlightedMarker === marker.id ? 'primary' : 'text.secondary',
                            fontWeight: highlightedMarker === marker.id ? 'bold' : 'normal'
                          }}
                        />
                      </ListItemButton>
                    ))}
                  </List>
                ) : (
                  <Box sx={{ py: 4, textAlign: 'center' }}>
                    <Typography color="text.secondary">
                      没有可用的字幕
                    </Typography>
                  </Box>
                )}
              </Box>
            )}
            
            {/* 评论区 */}
            {activeTab === 'comments' && (
              <Box sx={{ py: 2 }}>
                <Typography variant="h6" gutterBottom>
                  评论
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <TextField
                    fullWidth
                    placeholder="添加评论..."
                    size="small"
                    multiline
                    rows={2}
                  />
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                    <Button 
                      variant="contained" 
                      size="small"
                      disabled={!isAuthenticated}
                      sx={{ 
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #5a71d4 0%, #6a4291 100%)',
                        }
                      }}
                    >
                      发布评论
                    </Button>
                  </Box>
                </Box>
                <Box sx={{ py: 4, textAlign: 'center' }}>
                  <Typography color="text.secondary">
                    暂无评论
                  </Typography>
                </Box>
              </Box>
            )}
          </Box>
        </Grid>
        
        {/* 右侧：相关视频 */}
        <Grid item xs={12} lg={4}>
          <Typography variant="h6" gutterBottom>
            相关视频
          </Typography>
          
          {relatedVideos.length > 0 ? (
            <Box>
              {relatedVideos.map((video) => (
                <Card 
                  key={video.id} 
                  sx={{ 
                    mb: 2, 
                    display: 'flex',
                    boxShadow: 'none',
                    '&:hover': {
                      bgcolor: 'rgba(0,0,0,0.02)'
                    }
                  }}
                  onClick={() => navigate(`/video/${video.id}`)}
                >
                  <Box sx={{ position: 'relative', flexShrink: 0, width: 180 }}>
                    <CardMedia
                      component="img"
                      sx={{ width: 180, height: 100 }}
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
                      borderRadius: 1,
                      fontSize: '0.75rem'
                    }}>
                      {video.duration}
                    </Box>
                  </Box>
                  <CardContent sx={{ flex: '1 0 auto', p: 1 }}>
                    <Typography variant="body2" fontWeight="medium" gutterBottom>
                      {video.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {video.channel}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {video.views?.toLocaleString()} 次观看 • {video.upload_date}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Box>
          ) : (
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">
                没有相关视频
              </Typography>
            </Box>
          )}
        </Grid>
      </Grid>
    </Container>
  );
};

export default VideoPlayerPage; 