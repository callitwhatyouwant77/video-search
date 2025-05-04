from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, Enum, JSON, Text
from sqlalchemy.orm import relationship
import enum

from app.db.session import Base


class ProcessingStatus(enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class Video(Base):
    __tablename__ = "videos"

    id = Column(String, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False)
    description = Column(Text, nullable=True)
    file_path = Column(String, nullable=False)
    duration = Column(Float, nullable=True)  # 视频时长(秒)
    file_size = Column(Integer, nullable=True)  # 文件大小(字节)
    format = Column(String, nullable=True)  # 视频格式
    resolution = Column(String, nullable=True)  # 分辨率
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    owner_id = Column(String, ForeignKey("users.id"))
    processing_status = Column(Enum(ProcessingStatus), default=ProcessingStatus.PENDING)
    video_metadata = Column(JSON, nullable=True)  # 其他元数据，改名避免与SQLAlchemy内部属性冲突
    
    # 关系
    owner = relationship("User", back_populates="videos")
    segments = relationship("VideoSegment", back_populates="video", cascade="all, delete-orphan")
    transcripts = relationship("Transcript", back_populates="video", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Video {self.title}>"


class VideoSegment(Base):
    __tablename__ = "video_segments"

    id = Column(String, primary_key=True, index=True)
    video_id = Column(String, ForeignKey("videos.id"), nullable=False)
    start_time = Column(Float, nullable=False)  # 开始时间(秒)
    end_time = Column(Float, nullable=False)  # 结束时间(秒)
    segment_path = Column(String, nullable=True)  # 片段文件路径
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # 关系
    video = relationship("Video", back_populates="segments")
    
    def __repr__(self):
        return f"<VideoSegment {self.id} ({self.start_time}-{self.end_time})>"
