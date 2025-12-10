"""
API v1 路由汇总
"""
from fastapi import APIRouter

from .endpoints import auth, users, participants, fields, tags, records, stats, export

api_router = APIRouter()

# 注册各模块路由
api_router.include_router(auth.router, prefix="/auth", tags=["认证"])
api_router.include_router(users.router, prefix="/users", tags=["用户管理"])
api_router.include_router(participants.router, prefix="/participants", tags=["参与者管理"])
api_router.include_router(fields.router, prefix="/fields", tags=["场域管理"])
api_router.include_router(tags.router, prefix="/tags", tags=["标签管理"])
api_router.include_router(records.router, prefix="/records", tags=["记录管理"])
api_router.include_router(stats.router, prefix="/stats", tags=["统计数据"])
api_router.include_router(export.router, prefix="/export", tags=["数据导出"])
