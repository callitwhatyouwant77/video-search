# 视频台词搜索后端

这是一个基于FastAPI、PostgreSQL、Redis和FAISS的视频台词搜索后端系统。系统能够处理上传的视频，使用Whisper进行语音识别，将台词转换为向量表示，并支持高效的向量相似度搜索。

## 特性

- 用户认证与授权（JWT）
- 视频上传与管理
- 视频处理（切片、语音识别）
- 台词提取与向量化
- 向量相似度搜索
- FAISS GPU加速支持
- 异步任务队列（Celery）

## 系统要求

- Python 3.9+
- PostgreSQL
- Redis
- CUDA (可选，用于GPU加速)

## 安装

1. 克隆代码库
2. 安装依赖

```bash
pip install -r requirements.txt
```

3. 设置环境变量：复制`.env.example`到`.env`并修改相应配置
4. 创建PostgreSQL数据库

```bash
createdb videosearch
```

## 启动服务

启动Web服务器：

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

启动Celery Worker：

```bash
celery -A app.core.celery_app worker --loglevel=info
```

## API文档

启动服务后，可以访问以下地址查看API文档：

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 主要API端点

- `/api/v1/auth/register`: 注册新用户
- `/api/v1/auth/login`: 用户登录
- `/api/v1/videos`: 视频上传与管理
- `/api/v1/search`: 台词搜索

## 发展路线

- 完善向量数据库集成
- 添加更多视频处理功能
- 优化搜索算法
- 性能改进与扩展 