from typing import Optional
from pydantic import BaseModel


class Token(BaseModel):
    """
    OAuth2 令牌响应模型
    """
    access_token: str
    token_type: str


class TokenPayload(BaseModel):
    """
    令牌负载模型
    """
    sub: Optional[str] = None
    exp: Optional[int] = None 