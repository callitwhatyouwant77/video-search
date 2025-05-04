from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field


# 共享属性基础模型
class UserBase(BaseModel):
    email: Optional[EmailStr] = None
    username: Optional[str] = None
    is_active: Optional[bool] = True
    is_superuser: bool = False


# 创建用户时的属性
class UserCreate(UserBase):
    email: EmailStr
    username: str
    password: str


# 更新用户时的属性
class UserUpdate(UserBase):
    password: Optional[str] = None


# 数据库模型的属性
class UserInDBBase(UserBase):
    id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# 返回给前端的用户属性
class User(UserInDBBase):
    pass


# 数据库中存储的用户信息（包含哈希密码）
class UserInDB(UserInDBBase):
    hashed_password: str


# 用户登录请求
class UserLogin(BaseModel):
    username: str
    password: str
