from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


# 台词基础模型
class TranscriptBase(BaseModel):
    start_time: float
    end_time: float
    text: str


# 创建台词
class TranscriptCreate(TranscriptBase):
    video_id: str
    vector_id: Optional[str] = None
    confidence: Optional[float] = None
    segment_index: int


# 数据库中的台词
class TranscriptInDBBase(TranscriptBase):
    id: str
    video_id: str
    vector_id: Optional[str] = None
    confidence: Optional[float] = None
    segment_index: int
    created_at: datetime

    class Config:
        orm_mode = True


# 返回给前端的台词
class Transcript(TranscriptInDBBase):
    pass


# 搜索请求
class SearchQuery(BaseModel):
    query: str
    limit: Optional[int] = 10
    min_confidence: Optional[float] = 0.5
    include_video_details: Optional[bool] = False


# 搜索结果中的视频信息
class SearchResultVideo(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    duration: Optional[float] = None
    thumbnail: Optional[str] = None


# 搜索结果中的台词命中
class SearchResultTranscript(BaseModel):
    id: str
    text: str
    start_time: float
    end_time: float
    confidence: Optional[float] = None
    similarity_score: float
    video: SearchResultVideo


# 搜索结果响应
class SearchResults(BaseModel):
    query: str
    results: List[SearchResultTranscript]
    total: int
    processing_time: float
