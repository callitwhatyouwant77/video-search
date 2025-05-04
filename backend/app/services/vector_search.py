import os
import numpy as np
import faiss
import logging
from typing import List, Tuple, Dict, Any, Optional
import time

from sqlalchemy.orm import Session
from app.models.search import Transcript
from app.models.video import Video
from app.core.config import settings

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 向量索引（全局变量，在第一次使用时初始化）
_vector_index = None
_vector_ids = []
_index_initialized = False


def get_vector_index():
    """
    获取或初始化向量索引
    """
    global _vector_index, _vector_ids, _index_initialized
    
    if not _index_initialized:
        try:
            # 创建向量索引
            dimension = settings.VECTOR_DIMENSION
            logger.info(f"初始化向量索引，维度: {dimension}")
            
            # 检查GPU是否可用
            gpu_count = faiss.get_num_gpus()
            logger.info(f"FAISS检测到的GPU数量: {gpu_count}")
            
            # 创建基础索引（使用内积/余弦相似度）
            base_index = faiss.IndexFlatIP(dimension)
            
            # 如果GPU可用，使用GPU资源
            if gpu_count > 0:
                try:
                    # 创建GPU资源对象
                    res = faiss.StandardGpuResources()
                    # 设置GPU资源的使用
                    gpu_options = faiss.GpuClonerOptions()
                    gpu_options.useFloat16 = True  # 使用FP16可以节省内存
                    # 将索引转移到GPU
                    _vector_index = faiss.index_cpu_to_gpu(res, 0, base_index, gpu_options)
                    logger.info(f"成功将FAISS索引移至GPU 0，使用FP16优化")
                except Exception as gpu_error:
                    logger.error(f"无法使用GPU: {gpu_error}")
                    logger.info("回退到CPU版本")
                    _vector_index = base_index
            else:
                logger.info("未检测到GPU，使用CPU版本的FAISS")
                _vector_index = base_index
            
            # 初始化向量ID列表
            _vector_ids = []
            
            _index_initialized = True
            logger.info("向量索引初始化完成")
        
        except Exception as e:
            logger.error(f"初始化向量索引失败: {e}")
            raise
    
    return _vector_index, _vector_ids


def reset_index():
    """
    重置向量索引（用于测试或重建索引）
    """
    global _vector_index, _vector_ids, _index_initialized
    _vector_index = None
    _vector_ids = []
    _index_initialized = False
    logger.info("向量索引已重置")


def add_vector_to_index(vector_id: str, vector: np.ndarray):
    """
    将向量添加到索引中
    """
    global _vector_index, _vector_ids
    
    try:
        if vector is None or not isinstance(vector, np.ndarray):
            logger.error(f"无效的向量数据: {vector_id}")
            return False
        
        # 确保向量是浮点型并且形状正确
        vector = vector.astype(np.float32).reshape(1, -1)
        
        # 获取索引
        index, ids = get_vector_index()
        
        # 添加向量
        index.add(vector)
        ids.append(vector_id)
        
        logger.info(f"向量添加成功: {vector_id}, 当前索引大小: {len(ids)}")
        return True
    
    except Exception as e:
        logger.error(f"添加向量到索引失败: {e}")
        return False


def batch_add_vectors(vector_ids: List[str], vectors: np.ndarray):
    """
    批量添加向量到索引（更高效）
    """
    global _vector_index, _vector_ids
    
    try:
        if not vector_ids or vectors is None or vectors.size == 0:
            logger.error("无效的批量向量数据")
            return False
        
        # 确保向量是浮点型
        vectors = vectors.astype(np.float32)
        
        # 获取索引
        index, ids = get_vector_index()
        
        # 添加向量
        index.add(vectors)
        ids.extend(vector_ids)
        
        logger.info(f"批量添加向量成功: {len(vector_ids)}条, 当前索引大小: {len(ids)}")
        return True
    
    except Exception as e:
        logger.error(f"批量添加向量到索引失败: {e}")
        return False


def search_vectors(query_vector: np.ndarray, top_k: int = 10) -> List[Tuple[str, float]]:
    """
    搜索向量
    """
    try:
        # 获取索引
        index, ids = get_vector_index()
        
        if len(ids) == 0:
            logger.warning("向量索引为空，无法搜索")
            return []
        
        # 确保查询向量是浮点型并且形状正确
        query_vector = query_vector.astype(np.float32).reshape(1, -1)
        
        # 执行搜索
        distances, indices = index.search(query_vector, min(top_k, len(ids)))
        
        # 获取结果
        results = []
        for i, idx in enumerate(indices[0]):
            if idx < len(ids) and idx >= 0:
                results.append((ids[idx], float(distances[0][i])))
        
        logger.info(f"搜索完成，找到{len(results)}个结果")
        return results
    
    except Exception as e:
        logger.error(f"搜索向量失败: {e}")
        return []


def vectorize_query(query_text: str) -> Optional[np.ndarray]:
    """
    将查询文本向量化
    """
    try:
        from sentence_transformers import SentenceTransformer
        
        # 加载模型（与视频处理中使用相同的模型）
        model = SentenceTransformer('distiluse-base-multilingual-cased-v1')
        
        # 获取文本向量
        embedding = model.encode(query_text)
        
        return embedding
    
    except Exception as e:
        logger.error(f"向量化查询文本时出错: {e}")
        return None


def search_transcripts(db: Session, user_id: str, query_text: str, limit: int = 10, min_confidence: float = 0.5) -> Tuple[List[Dict[str, Any]], int]:
    """
    搜索视频台词
    """
    start_time = time.time()
    
    try:
        # 向量化查询文本
        query_vector = vectorize_query(query_text)
        if query_vector is None:
            logger.error("无法向量化查询文本")
            return [], 0
        
        # 在FAISS中搜索相似向量
        vector_results = search_vectors(query_vector, top_k=limit*3)  # 获取更多结果以便过滤
        
        if not vector_results:
            logger.warning(f"未找到与查询 '{query_text}' 相匹配的向量")
            return [], 0
        
        # 从数据库获取相应的台词记录
        vector_ids = [vid for vid, _ in vector_results]
        
        # 获取台词记录，包括用户权限检查
        transcripts_with_video = (
            db.query(Transcript, Video)
            .join(Video, Transcript.video_id == Video.id)
            .filter(
                Transcript.vector_id.in_(vector_ids),
                Video.owner_id == user_id,
                Transcript.confidence >= min_confidence
            )
            .all()
        )
        
        # 将结果映射到前端格式
        results = []
        for transcript, video in transcripts_with_video:
            # 找到该向量的相似度分数
            similarity_score = 0.0
            for vid, score in vector_results:
                if vid == transcript.vector_id:
                    similarity_score = score
                    break
            
            result = {
                "id": transcript.id,
                "text": transcript.text,
                "start_time": transcript.start_time,
                "end_time": transcript.end_time,
                "confidence": transcript.confidence,
                "similarity_score": similarity_score,
                "video": {
                    "id": video.id,
                    "title": video.title,
                    "description": video.description,
                    "duration": video.duration,
                    "thumbnail": f"/static/thumbnails/{video.id}.jpg"
                }
            }
            
            results.append(result)
        
        # 按相似度排序
        results = sorted(results, key=lambda x: x["similarity_score"], reverse=True)[:limit]
        
        processing_time = time.time() - start_time
        logger.info(f"搜索完成，耗时: {processing_time:.3f}秒, 结果数: {len(results)}")
        
        return results, len(results)
    
    except Exception as e:
        logger.error(f"搜索台词时出错: {e}")
        return [], 0


# 初始化函数，用于在应用启动时预热模型和索引
def init_vector_search():
    """
    初始化向量搜索组件（可用于应用启动时调用）
    """
    try:
        # 初始化索引
        index, _ = get_vector_index()
        logger.info(f"向量搜索系统初始化完成，是否在GPU上: {isinstance(index, faiss.GpuIndex)}")
        return True
    except Exception as e:
        logger.error(f"初始化向量搜索系统失败: {e}")
        return False 