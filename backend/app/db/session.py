from typing import Generator
import os
import subprocess
import logging
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

from app.core.config import settings

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 尝试使用多种数据库连接方式
connection_uri = settings.SQLALCHEMY_DATABASE_URI

# 如果普通连接失败，尝试使用Unix socket方式连接
try:
    # 创建数据库引擎
    engine = create_engine(
        connection_uri,
        pool_pre_ping=True,  # 自动检测连接是否有效
        echo=False,  # 设置为 True 可以在控制台查看 SQL 日志
    )
    # 测试连接
    with engine.connect() as conn:
        logger.info("成功连接到数据库")
except Exception as e:
    logger.error(f"标准连接失败: {e}")
    
    # 尝试使用Unix socket方式连接
    try:
        # 构建Unix socket连接URI
        socket_uri = f"postgresql+psycopg2://{settings.POSTGRES_USER}:{settings.POSTGRES_PASSWORD}@/{settings.POSTGRES_DB}?host=/var/run/postgresql"
        logger.info(f"尝试使用Unix socket连接: {socket_uri}")
        
        engine = create_engine(
            socket_uri,
            pool_pre_ping=True,
            echo=False,
        )
        
        # 测试连接
        with engine.connect() as conn:
            logger.info("成功通过Unix socket连接到数据库")
    except Exception as socket_e:
        logger.error(f"Unix socket连接也失败: {socket_e}")
        logger.warning("请确保已手动创建数据库表，或者使用适当的数据库迁移工具")

# 创建会话工厂
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 创建基础模型类
Base = declarative_base()

# 依赖注入函数，用于API路由中获取数据库会话
def get_db() -> Generator:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
