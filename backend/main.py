import os
from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse

from app.api.endpoints import auth, videos, search
from app.core.config import settings
from app.db.session import engine, Base
from app.services.vector_search import init_vector_search

# 初始化应用
app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# 配置CORS
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# 创建必要的目录
os.makedirs(settings.STATIC_DIR, exist_ok=True)
os.makedirs(settings.VIDEOS_STORAGE_PATH, exist_ok=True)
os.makedirs(os.path.join(settings.VIDEOS_STORAGE_PATH, "segments"), exist_ok=True)

# 挂载静态文件目录
app.mount("/static", StaticFiles(directory=settings.STATIC_DIR), name="static")

# 注册路由
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["认证"])
app.include_router(videos.router, prefix=f"{settings.API_V1_STR}/videos", tags=["视频"])
app.include_router(search.router, prefix=f"{settings.API_V1_STR}/search", tags=["搜索"])


@app.on_event("startup")
async def startup():
    # 创建数据库表（如果不存在）
    Base.metadata.create_all(bind=engine)
    
    # 初始化向量搜索系统
    init_vector_search()


@app.get("/")
def root():
    content = {"message": "欢迎使用视频台词搜索API"}
    return JSONResponse(
        content=content,
        headers={"Content-Type": "application/json; charset=utf-8"}
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
