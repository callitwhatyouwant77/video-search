import time
from typing import Any, List

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app import models, schemas
from app.api import deps
from app.services.vector_search import search_transcripts

router = APIRouter()


@router.post("/", response_model=schemas.SearchResults)
def search(
    *,
    db: Session = Depends(deps.get_db),
    search_query: schemas.SearchQuery,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    搜索视频台词
    """
    start_time = time.time()
    
    # 执行向量搜索
    results, total = search_transcripts(
        db=db,
        user_id=current_user.id,
        query_text=search_query.query,
        limit=search_query.limit,
        min_confidence=search_query.min_confidence
    )
    
    processing_time = time.time() - start_time
    
    return {
        "query": search_query.query,
        "results": results,
        "total": total,
        "processing_time": processing_time
    }


@router.get("/video/{video_id}/transcripts", response_model=List[schemas.Transcript])
def get_video_transcripts(
    *,
    db: Session = Depends(deps.get_db),
    video_id: str,
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    获取视频的所有台词
    """
    # 检查视频是否存在
    video = db.query(models.Video).filter(
        models.Video.id == video_id
    ).first()
    
    if not video:
        raise HTTPException(status_code=404, detail="视频不存在")
    
    # 检查权限
    if video.owner_id != current_user.id and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="没有足够的权限访问此视频")
    
    # 获取台词
    transcripts = db.query(models.Transcript).filter(
        models.Transcript.video_id == video_id
    ).order_by(models.Transcript.start_time).offset(skip).limit(limit).all()
    
    return transcripts
