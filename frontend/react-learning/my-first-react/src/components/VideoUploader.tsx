import React, { useState, useRef, ChangeEvent } from 'react';
import { Box, Button, TextField, Typography, LinearProgress, Alert } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import apiService from '../services/api';

const VideoUploader: React.FC = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      
      // 检查文件类型
      const validFileTypes = ['video/mp4', 'video/webm', 'video/avi', 'video/mov', 'video/quicktime', 'video/x-matroska'];
      if (!validFileTypes.includes(selectedFile.type)) {
        setError('不支持的文件类型，请上传mp4、webm、avi、mov或mkv格式的视频');
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
      
      // 检查文件大小 (限制为500MB)
      if (selectedFile.size > 500 * 1024 * 1024) {
        setError('文件大小超过限制（最大500MB）');
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
      
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !file) {
      setError('请填写标题并选择一个视频文件');
      return;
    }
    
    setUploading(true);
    setProgress(0);
    setError(null);
    setSuccess(false);
    
    try {
      const formData = new FormData();
      formData.append('title', title);
      if (description) formData.append('description', description);
      formData.append('video_file', file);
      
      // 模拟上传进度
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          const newProgress = Math.min(prev + 5, 95);
          return newProgress;
        });
      }, 500);
      
      const response = await apiService.videos.upload(formData);
      
      clearInterval(progressInterval);
      setProgress(100);
      setSuccess(true);
      
      // 重置表单
      setTitle('');
      setDescription('');
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      
      console.log('上传成功:', response);
    } catch (err: any) {
      console.error('上传失败:', err);
      setError(err.response?.data?.detail || '上传失败，请稍后再试');
    } finally {
      setTimeout(() => {
        setUploading(false);
      }, 1000);
    }
  };

  return (
    <Box 
      component="form" 
      onSubmit={handleSubmit} 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: 3, 
        maxWidth: 600, 
        margin: '0 auto',
        p: 2
      }}
    >
      <Typography variant="h4" gutterBottom>
        上传视频
      </Typography>
      
      {error && <Alert severity="error">{error}</Alert>}
      {success && <Alert severity="success">视频上传成功，正在处理中...</Alert>}
      
      <TextField
        label="视频标题"
        variant="outlined"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
        fullWidth
        disabled={uploading}
      />
      
      <TextField
        label="视频描述（可选）"
        variant="outlined"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        multiline
        rows={3}
        fullWidth
        disabled={uploading}
      />
      
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
        <input
          ref={fileInputRef}
          type="file"
          accept="video/mp4,video/webm,video/avi,video/mov,video/quicktime,video/x-matroska"
          onChange={handleFileChange}
          style={{ display: 'none' }}
          disabled={uploading}
        />
        
        <Button
          variant="outlined"
          color="primary"
          startIcon={<CloudUploadIcon />}
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          sx={{ mb: 1 }}
        >
          选择视频文件
        </Button>
        
        {file && (
          <Typography variant="body2" color="textSecondary">
            已选择: {file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)
          </Typography>
        )}
      </Box>
      
      {uploading && (
        <Box sx={{ mb: 2 }}>
          <LinearProgress variant="determinate" value={progress} />
          <Typography variant="body2" align="center" sx={{ mt: 1 }}>
            上传进度: {progress}%
          </Typography>
        </Box>
      )}
      
      <Button 
        type="submit" 
        variant="contained" 
        color="primary" 
        fullWidth
        disabled={uploading || !file}
      >
        {uploading ? '上传中...' : '上传视频'}
      </Button>
    </Box>
  );
};

export default VideoUploader; 