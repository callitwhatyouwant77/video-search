import os
import uuid
from typing import Any, List, Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks, status, Response
from sqlalchemy.orm import Session

from app import models, schemas
from app.api import deps
from app.core.config import settings
from app.services.video_processing import process_video

router = APIRouter()


@router.get("/", response_model=List[schemas.Video])
def get_videos(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(deps.get_current_active_user)
) -> Any:
    """
    获取当前用户的所有视频
    """
    videos = db.query(models.Video).filter(
        models.Video.owner_id == current_user.id
    ).offset(skip).limit(limit).all()
    
    return videos


@router.post("/", response_model=schemas.Video)
def create_video(
    *,
    db: Session = Depends(deps.get_db),
    background_tasks: BackgroundTasks,
    title: str = Form(...),
    description: Optional[str] = Form(None),
    video_file: UploadFile = File(...),
    current_user: models.User = Depends(deps.get_current_active_user)
) -> Any:
    """
    上传新视频（单文件上传）
    """
    # 检查扩展名
    file_ext = os.path.splitext(video_file.filename)[1].lower()
    if file_ext not in ['.mp4', '.avi', '.mov', '.mkv', '.webm']:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="不支持的视频格式，请上传 mp4, avi, mov, mkv 或 webm 格式的视频"
        )
    
    # 创建上传目录
    os.makedirs(settings.VIDEOS_STORAGE_PATH, exist_ok=True)
    
    # 生成唯一ID
    video_id = str(uuid.uuid4())
    file_name = f"{video_id}{file_ext}"
    file_path = os.path.join(settings.VIDEOS_STORAGE_PATH, file_name)
    
    # 保存文件
    with open(file_path, "wb+") as file_object:
        file_object.write(video_file.file.read())
    
    # 创建视频记录
    video = models.Video(
        id=video_id,
        title=title,
        description=description,
        file_path=file_path,
        owner_id=current_user.id,
        processing_status=models.ProcessingStatus.PENDING
    )
    
    db.add(video)
    db.commit()
    db.refresh(video)
    
    # 将视频处理任务加入后台队列
    background_tasks.add_task(process_video, video_id)
    
    return video


@router.get("/{video_id}", response_model=schemas.VideoDetail)
def get_video(
    *,
    db: Session = Depends(deps.get_db),
    video_id: str,
    current_user: models.User = Depends(deps.get_current_active_user)
) -> Any:
    """
    获取视频详情
    """
    video = db.query(models.Video).filter(
        models.Video.id == video_id
    ).first()
    
    if not video:
        raise HTTPException(status_code=404, detail="视频不存在")
    
    # 检查权限
    if video.owner_id != current_user.id and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="没有足够的权限访问此视频"
        )
    
    return video


@router.delete("/{video_id}")
def delete_video(
    *,
    db: Session = Depends(deps.get_db),
    video_id: str,
    current_user: models.User = Depends(deps.get_current_active_user),
    response: Response
) -> Any:
    """
    删除视频
    """
    video = db.query(models.Video).filter(
        models.Video.id == video_id
    ).first()
    
    if not video:
        raise HTTPException(status_code=404, detail="视频不存在")
    
    # 检查权限
    if video.owner_id != current_user.id and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="没有足够的权限删除此视频"
        )
    
    # 删除文件
    if os.path.exists(video.file_path):
        os.remove(video.file_path)
    
    # 删除数据库记录
    db.delete(video)
    db.commit()
    
    # 设置204状态码但不返回响应体
    response.status_code = status.HTTP_204_NO_CONTENT
