import os
import uuid
import tempfile
import ffmpeg
import logging
from typing import List, Dict, Any, Optional
import numpy as np

from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.video import Video, VideoSegment, ProcessingStatus
from app.models.search import Transcript
from app.core.config import settings
from app.core.celery_app import celery_app
from app.services.vector_search import add_vector_to_index, batch_add_vectors

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def get_video_info(file_path: str) -> Dict[str, Any]:
    """
    使用ffmpeg获取视频文件信息
    """
    try:
        probe = ffmpeg.probe(file_path)
        video_stream = next((stream for stream in probe['streams'] if stream['codec_type'] == 'video'), None)
        
        if video_stream is None:
            return {}
        
        info = {
            'duration': float(probe['format'].get('duration', 0)),
            'file_size': int(probe['format'].get('size', 0)),
            'format': probe['format'].get('format_name', ''),
            'resolution': f"{video_stream.get('width', 0)}x{video_stream.get('height', 0)}",
            'codec': video_stream.get('codec_name', '')
        }
        
        return info
    
    except ffmpeg.Error as e:
        logger.error(f"获取视频信息时出错: {e}")
        return {}


def extract_audio(video_path: str, output_path: str) -> bool:
    """
    从视频中提取音频
    """
    try:
        (
            ffmpeg
            .input(video_path)
            .output(output_path, acodec='pcm_s16le', ac=1, ar='16k')
            .run(quiet=True, overwrite_output=True)
        )
        return True
    except ffmpeg.Error as e:
        logger.error(f"提取音频时出错: {e}")
        return False


def split_video(video_path: str, start_time: float, end_time: float, output_path: str) -> bool:
    """
    分割视频片段
    """
    try:
        (
            ffmpeg
            .input(video_path, ss=start_time, to=end_time)
            .output(output_path, codec='copy')
            .run(quiet=True, overwrite_output=True)
        )
        return True
    except ffmpeg.Error as e:
        logger.error(f"分割视频时出错: {e}")
        return False


def transcribe_audio(audio_path: str, model_name: str = None) -> List[Dict[str, Any]]:
    """
    使用Whisper模型进行语音识别
    """
    try:
        from faster_whisper import WhisperModel
        
        # 优先使用配置中的模型路径
        if hasattr(settings, 'WHISPER_MODEL_PATH') and os.path.exists(settings.WHISPER_MODEL_PATH):
            logger.info(f"使用配置的自定义模型路径: {settings.WHISPER_MODEL_PATH}")
            model = WhisperModel(settings.WHISPER_MODEL_PATH, device="cuda", compute_type="float16")
        # 如果提供了model_name且是完整路径
        elif model_name and os.path.exists(model_name):
            logger.info(f"使用传入的自定义模型路径: {model_name}")
            model = WhisperModel(model_name, device="cuda", compute_type="float16")
        else:
            # 使用预设的模型名称
            model_name = model_name or settings.WHISPER_MODEL
            logger.info(f"使用预设模型: {model_name}")
            model = WhisperModel(model_name, device="cuda", compute_type="float16")
        
        # 执行转录
        segments, info = model.transcribe(
            audio_path, 
            language="zh", 
            beam_size=5,
            word_timestamps=True,
            vad_filter=True
        )
        
        # 处理结果
        results = []
        for segment in segments:
            results.append({
                "start": segment.start,
                "end": segment.end,
                "text": segment.text,
                "confidence": segment.avg_logprob,
                "words": [{"word": word.word, "start": word.start, "end": word.end} for word in segment.words]
            })
        
        return results
    
    except Exception as e:
        logger.error(f"语音识别时出错: {e}")
        return []


def vectorize_text(text: str):
    """
    将文本转换为向量表示（使用sentence-transformers）
    """
    try:
        from sentence_transformers import SentenceTransformer
        
        # 加载模型（这里使用中文预训练模型）
        model = SentenceTransformer('distiluse-base-multilingual-cased-v1')
        
        # 获取文本向量
        embedding = model.encode(text)
        
        return embedding
    
    except Exception as e:
        logger.error(f"向量化文本时出错: {e}")
        return None


def process_video(video_id: str):
    """
    处理上传的视频，包括提取信息、切分、转录和向量化
    """
    # 创建数据库会话
    db = SessionLocal()
    
    try:
        # 获取视频记录
        video = db.query(Video).filter(Video.id == video_id).first()
        if not video:
            logger.error(f"视频不存在: {video_id}")
            return
        
        # 更新处理状态
        video.processing_status = ProcessingStatus.PROCESSING
        db.commit()
        
        # 获取视频信息
        video_info = get_video_info(video.file_path)
        if not video_info:
            logger.error(f"无法获取视频信息: {video.file_path}")
            video.processing_status = ProcessingStatus.FAILED
            db.commit()
            return
        
        # 更新视频信息
        for key, value in video_info.items():
            setattr(video, key, value)
        
        db.commit()
        
        # 创建临时目录
        with tempfile.TemporaryDirectory() as temp_dir:
            # 提取音频
            audio_path = os.path.join(temp_dir, f"{video_id}.wav")
            if not extract_audio(video.file_path, audio_path):
                video.processing_status = ProcessingStatus.FAILED
                db.commit()
                return
            
            # 使用Whisper进行语音识别
            transcript_segments = transcribe_audio(audio_path, settings.WHISPER_MODEL)
            
            if not transcript_segments:
                logger.error(f"语音识别失败: {video_id}")
                video.processing_status = ProcessingStatus.FAILED
                db.commit()
                return
            
            # 创建视频片段目录
            segments_dir = os.path.join(settings.VIDEOS_STORAGE_PATH, "segments")
            os.makedirs(segments_dir, exist_ok=True)
            
            # 准备批量添加向量
            all_vectors = []
            all_vector_ids = []
            
            # 处理转录结果
            for i, segment in enumerate(transcript_segments):
                # 生成唯一ID
                segment_id = str(uuid.uuid4())
                
                # 获取时间范围
                start_time = segment["start"]
                end_time = segment["end"]
                text = segment["text"]
                confidence = segment["confidence"]
                
                # 创建视频片段
                segment_path = os.path.join(segments_dir, f"{segment_id}.mp4")
                if split_video(video.file_path, start_time, end_time, segment_path):
                    # 创建片段记录
                    video_segment = VideoSegment(
                        id=segment_id,
                        video_id=video.id,
                        start_time=start_time,
                        end_time=end_time,
                        segment_path=segment_path
                    )
                    db.add(video_segment)
                
                # 向量化文本
                text_vector = vectorize_text(text)
                vector_id = None
                
                if text_vector is not None:
                    # 使用segment_id作为vector_id
                    vector_id = segment_id
                    
                    # 将向量添加到批处理列表
                    all_vectors.append(text_vector)
                    all_vector_ids.append(vector_id)
                
                # 创建台词记录
                transcript = Transcript(
                    id=str(uuid.uuid4()),
                    video_id=video.id,
                    start_time=start_time,
                    end_time=end_time,
                    text=text,
                    vector_id=vector_id,
                    confidence=confidence,
                    segment_index=i
                )
                db.add(transcript)
            
            # 批量提交到数据库
            db.commit()
            
            # 批量添加向量到FAISS索引
            if all_vectors and all_vector_ids:
                try:
                    # 将列表转换为numpy数组
                    vectors_array = np.array(all_vectors)
                    # 批量添加到索引
                    batch_add_vectors(all_vector_ids, vectors_array)
                    logger.info(f"成功为视频 {video_id} 添加 {len(all_vectors)} 个向量到FAISS索引")
                except Exception as e:
                    logger.error(f"向量添加失败: {e}")
            
            # 更新处理状态
            video.processing_status = ProcessingStatus.COMPLETED
            db.commit()
            
            logger.info(f"视频处理完成: {video_id}")
    
    except Exception as e:
        logger.error(f"处理视频时出错: {e}")
        video.processing_status = ProcessingStatus.FAILED
        db.commit()
    
    finally:
        db.close()


@celery_app.task
def process_video_task(video_id: str):
    """
    Celery任务：处理视频
    """
    return process_video(video_id) 