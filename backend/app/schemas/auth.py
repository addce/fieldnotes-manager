"""
认证相关的Pydantic模型
"""
from pydantic import BaseModel


class Token(BaseModel):
    """令牌响应模型"""
    access_token: str
    token_type: str
    expires_in: int


class TokenData(BaseModel):
    """令牌数据模型"""
    username: str | None = None


class UserLogin(BaseModel):
    """用户登录模型"""
    username: str
    password: str
