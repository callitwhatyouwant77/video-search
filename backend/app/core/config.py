import os
import secrets
from typing import Any, Dict, List, Optional, Union

from pydantic import AnyHttpUrl, PostgresDsn, field_validator, computed_field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = secrets.token_urlsafe(32)
    # 60 minutes * 24 hours * 8 days = 8 days
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8
    SERVER_NAME: str = "VideoSearch"
    SERVER_HOST: AnyHttpUrl = "http://localhost"
    
    # CORS 配置 
    BACKEND_CORS_ORIGINS: List[AnyHttpUrl] = []

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> Union[List[str], str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)

    PROJECT_NAME: str = "VideoSearch"
    
    # 数据库配置 - 已解决认证问题，使用postgres作为用户
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"  # 使用默认密码
    POSTGRES_DB: str = "videosearch"
    
    @computed_field
    @property
    def SQLALCHEMY_DATABASE_URI(self) -> str:
        # 使用标准的带密码连接串
        return f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}/{self.POSTGRES_DB}"
    
    # Redis 配置
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0
    
    # Celery 配置
    CELERY_BROKER_URL: str = f"redis://{REDIS_HOST}:{REDIS_PORT}/{REDIS_DB}"
    CELERY_RESULT_BACKEND: str = CELERY_BROKER_URL
    
    # 视频存储配置
    VIDEOS_STORAGE_PATH: str = "/tmp/videosearch/videos"
    
    # Whisper 模型配置
    WHISPER_MODEL: str = "base"  # 可选: "tiny", "base", "small", "medium", "large"
    
    # 向量搜索配置
    VECTOR_DIMENSION: int = 768  # Sentence-BERT 默认维度
    TOP_K_RESULTS: int = 10
    
    # 静态文件配置
    STATIC_DIR: str = "static"
    
    class Config:
        case_sensitive = True
        env_file = ".env"


settings = Settings()
