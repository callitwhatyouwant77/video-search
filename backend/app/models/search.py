from datetime import datetime
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Text, Integer
from sqlalchemy.orm import relationship

from app.db.session import Base


class Transcript(Base):
    """
    存储视频台词信息，与向量数据库中的向量建立关联
    """
    __tablename__ = "transcripts"

    id = Column(String, primary_key=True, index=True)
    video_id = Column(String, ForeignKey("videos.id"), nullable=False)
    start_time = Column(Float, nullable=False)  # 开始时间(秒)
    end_time = Column(Float, nullable=False)  # 结束时间(秒)
    text = Column(Text, nullable=False)  # 台词文本
    vector_id = Column(String, index=True, nullable=True)  # 向量数据库中的ID
    confidence = Column(Float, nullable=True)  # 语音识别置信度
    segment_index = Column(Integer, nullable=False)  # 在视频中的片段索引
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # 关系
    video = relationship("Video", back_populates="transcripts")
    
    def __repr__(self):
        return f"<Transcript {self.id} ({self.start_time}-{self.end_time})>"
