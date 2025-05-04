import React, { useState } from 'react';
import { Box, TextField, Button, Typography, CircularProgress, Card, CardContent, List, ListItem, Divider } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import apiService from '../services/api';

interface SearchResult {
  id: string;
  text: string;
  start_time: number;
  end_time: number;
  confidence: number;
  similarity_score: number;
  video: {
    id: string;
    title: string;
    description: string;
    duration: number;
    thumbnail: string;
  };
}

interface SearchResponse {
  query: string;
  results: SearchResult[];
  total: number;
  processing_time: number;
}

const VideoSearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    setSearching(true);
    setError(null);
    
    try {
      const response = await apiService.search.transcripts(query);
      setResults(response);
    } catch (err: any) {
      console.error('搜索失败:', err);
      setError(err.response?.data?.detail || '搜索失败，请稍后再试');
      setResults(null);
    } finally {
      setSearching(false);
    }
  };

  // 格式化时间为 mm:ss 格式
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? '0' + secs : secs}`;
  };

  return (
    <Box sx={{ maxWidth: 800, margin: '0 auto', p: 2 }}>
      <Typography variant="h4" gutterBottom>
        视频台词搜索
      </Typography>
      
      <Box sx={{ display: 'flex', mb: 3 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="输入搜索关键词..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
        />
        <Button
          variant="contained"
          color="primary"
          onClick={handleSearch}
          disabled={searching || !query.trim()}
          startIcon={searching ? <CircularProgress size={20} color="inherit" /> : <SearchIcon />}
          sx={{ ml: 1 }}
        >
          {searching ? '搜索中...' : '搜索'}
        </Button>
      </Box>
      
      {error && (
        <Typography color="error" mb={2}>
          {error}
        </Typography>
      )}
      
      {results && (
        <Box>
          <Typography variant="body1" mb={2}>
            找到 {results.total} 条结果（用时 {results.processing_time.toFixed(3)} 秒）
          </Typography>
          
          <List>
            {results.results.map((result, index) => (
              <React.Fragment key={result.id}>
                {index > 0 && <Divider />}
                <ListItem sx={{ display: 'block', py: 2 }}>
                  <Card variant="outlined" sx={{ mb: 2 }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="h6">
                          {result.video.title}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {formatTime(result.start_time)} - {formatTime(result.end_time)}
                        </Typography>
                      </Box>
                      
                      <Typography variant="body1" gutterBottom>
                        "{result.text}"
                      </Typography>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                        <Typography variant="body2" color="textSecondary">
                          相似度: {(result.similarity_score * 100).toFixed(1)}%
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          置信度: {(result.confidence * 100).toFixed(1)}%
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        </Box>
      )}
    </Box>
  );
};

export default VideoSearch; 