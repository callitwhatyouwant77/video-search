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