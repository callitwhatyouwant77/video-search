#!/usr/bin/env python3
"""
初始化数据库表的脚本，使用两种方式创建表：
1. 直接使用SQLAlchemy创建
2. 使用psql命令执行SQL脚本
"""
import os
import subprocess
import logging

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# 创建SQL脚本
SQL_SCRIPT = """
-- 创建users表
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR PRIMARY KEY,
    email VARCHAR UNIQUE NOT NULL,
    hashed_password VARCHAR NOT NULL,
    full_name VARCHAR,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建videos表
CREATE TABLE IF NOT EXISTS videos (
    id VARCHAR PRIMARY KEY,
    title VARCHAR NOT NULL,
    description TEXT,
    file_path VARCHAR NOT NULL,
    duration FLOAT,
    file_size INTEGER,
    format VARCHAR,
    resolution VARCHAR,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    owner_id VARCHAR REFERENCES users(id),
    processing_status VARCHAR,
    video_metadata JSONB
);

-- 创建video_segments表
CREATE TABLE IF NOT EXISTS video_segments (
    id VARCHAR PRIMARY KEY,
    video_id VARCHAR NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    start_time FLOAT NOT NULL,
    end_time FLOAT NOT NULL,
    segment_path VARCHAR,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建transcripts表
CREATE TABLE IF NOT EXISTS transcripts (
    id VARCHAR PRIMARY KEY,
    video_id VARCHAR NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    start_time FLOAT NOT NULL,
    end_time FLOAT NOT NULL,
    text TEXT NOT NULL,
    vector_id VARCHAR,
    confidence FLOAT,
    segment_index INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_videos_title ON videos (title);
CREATE INDEX IF NOT EXISTS idx_videos_owner ON videos (owner_id);
CREATE INDEX IF NOT EXISTS idx_video_segments_video ON video_segments (video_id);
CREATE INDEX IF NOT EXISTS idx_transcripts_video ON transcripts (video_id);
"""

def init_db():
    """
    使用SQLAlchemy直接创建数据库表
    """
    try:
        from app.db.session import Base, engine
        
        # 导入所有模型
        from app.models.user import User
        from app.models.video import Video, VideoSegment
        from app.models.search import Transcript
        
        logger.info("开始创建数据库表...")
        Base.metadata.create_all(bind=engine)
        logger.info("数据库表创建成功！")
        
        return True
    except Exception as e:
        logger.error(f"创建数据库表失败: {e}")
        return False

def init_db_with_psql():
    """
    使用psql命令执行SQL脚本创建表
    """
    try:
        # 将SQL脚本保存到临时文件
        sql_file = "create_tables.sql"
        with open(sql_file, "w") as f:
            f.write(SQL_SCRIPT)
        
        # 执行SQL脚本
        logger.info("使用psql命令创建数据库表...")
        cmd = [
            "sudo", "-u", "postgres",
            "psql", "-d", "videosearch", "-f", sql_file
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        # 删除临时文件
        os.remove(sql_file)
        
        if result.returncode == 0:
            logger.info("SQL脚本执行成功！")
            logger.info(result.stdout)
            return True
        else:
            logger.error(f"SQL脚本执行失败: {result.stderr}")
            return False
    
    except Exception as e:
        logger.error(f"执行psql命令失败: {e}")
        return False

if __name__ == "__main__":
    # 首先尝试直接创建
    if not init_db():
        logger.info("直接创建失败，尝试使用psql命令...")
        if not init_db_with_psql():
            logger.error("所有创建方式都失败，请手动检查配置")
        else:
            logger.info("使用psql命令创建成功！")
    else:
        logger.info("直接创建成功！") 