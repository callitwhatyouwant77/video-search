from celery import Celery

from app.core.config import settings

# 创建Celery实例
celery_app = Celery(
    "video_search",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
)

# 配置Celery
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Shanghai",
    enable_utc=False,
    worker_max_tasks_per_child=1000,  # 每个worker处理1000个任务后重启，防止内存泄漏
    task_acks_late=True,  # 任务执行完成后再确认
)

# 包含任务模块
celery_app.autodiscover_tasks(["app.services"])
