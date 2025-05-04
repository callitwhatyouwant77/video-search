from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

from app.models.video import ProcessingStatus


# 视频片段基础模型
class VideoSegmentBase(BaseModel):
    start_time: float
    end_time: float


# 创建视频片段
class VideoSegmentCreate(VideoSegmentBase):
    video_id: str
    segment_path: Optional[str] = None


# 数据库中的视频片段
class VideoSegmentInDBBase(VideoSegmentBase):
    id: str
    video_id: str
    segment_path: Optional[str] = None
    created_at: datetime

    class Config:
        orm_mode = True


# 返回给前端的视频片段
class VideoSegment(VideoSegmentInDBBase):
    pass


# 视频基础模型
class VideoBase(BaseModel):
    title: str
    description: Optional[str] = None


# 创建视频时的属性
class VideoCreate(VideoBase):
    pass


# 更新视频时的属性
class VideoUpdate(VideoBase):
    title: Optional[str] = None
    processing_status: Optional[ProcessingStatus] = None


# 数据库中的视频属性
class VideoInDBBase(VideoBase):
    id: str
    file_path: str
    duration: Optional[float] = None
    file_size: Optional[int] = None
    format: Optional[str] = None
    resolution: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    owner_id: str
    processing_status: ProcessingStatus
    metadata: Optional[Dict[str, Any]] = None

    class Config:
        orm_mode = True


# 返回给前端的视频信息（不包含片段）
class Video(VideoInDBBase):
    pass


# 返回给前端的详细视频信息（包含片段）
class VideoDetail(Video):
    segments: List[VideoSegment] = []


# 上传视频初始化请求
class VideoUploadInit(BaseModel):
    title: str
    description: Optional[str] = None
    file_size: int
    file_type: str


# 上传视频初始化响应
class VideoUploadInitResponse(BaseModel):
    upload_id: str
    video_id: str
    parts: List[Dict[str, Any]]


# 上传视频分块完成请求
class VideoUploadComplete(BaseModel):
    upload_id: str
    video_id: str
    parts: List[Dict[str, Any]]
