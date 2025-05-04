# 导入所有模型，以便Alembic能够创建迁移脚本

from app.db.session import Base
from app.models.user import User
from app.models.video import Video, VideoSegment
from app.models.search import Transcript
