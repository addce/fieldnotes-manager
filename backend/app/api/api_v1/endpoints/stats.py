"""
统计数据API
提供仪表盘所需的统计信息
"""
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, or_
from pydantic import BaseModel

from app.core.database import get_db
from app.models.user import User
from app.models.record import Record
from app.models.participant import Participant
from app.models.field import Field
from app.models.tag import Tag
from app.api.api_v1.endpoints.auth import get_current_active_user

router = APIRouter()


# ============ Schema 定义 ============
class OverviewStats(BaseModel):
    """统计概览响应"""
    records_count: int
    participants_count: int
    fields_count: int
    tags_count: int


class RecentActivity(BaseModel):
    """最近活动项"""
    id: int
    type: str  # record, participant, field, tag
    action: str  # created, updated
    title: str
    created_at: datetime
    creator_name: Optional[str] = None

    class Config:
        from_attributes = True


class RecentActivitiesResponse(BaseModel):
    """最近活动列表响应"""
    items: List[RecentActivity]
    total: int


# ============ API 端点 ============

@router.get("/overview", summary="获取统计概览", response_model=OverviewStats)
async def get_overview_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    获取各模块的统计数据
    - 研究者只能看到自己创建的数据统计
    - 管理员可以看到全部数据统计
    """
    is_admin = current_user.role.value == "admin"

    # 统计田野记录数
    records_query = db.query(func.count(Record.id))
    if not is_admin:
        records_query = records_query.filter(Record.created_by == current_user.id)
    records_count = records_query.scalar() or 0

    # 统计参与者数
    participants_query = db.query(func.count(Participant.id))
    if not is_admin:
        participants_query = participants_query.filter(Participant.created_by == current_user.id)
    participants_count = participants_query.scalar() or 0

    # 统计场域数
    fields_query = db.query(func.count(Field.id))
    if not is_admin:
        fields_query = fields_query.filter(Field.created_by == current_user.id)
    fields_count = fields_query.scalar() or 0

    # 统计标签数
    tags_query = db.query(func.count(Tag.id))
    if not is_admin:
        tags_query = tags_query.filter(Tag.created_by == current_user.id)
    tags_count = tags_query.scalar() or 0

    return OverviewStats(
        records_count=records_count,
        participants_count=participants_count,
        fields_count=fields_count,
        tags_count=tags_count
    )


@router.get("/recent-activities", summary="获取最近活动", response_model=RecentActivitiesResponse)
async def get_recent_activities(
    limit: int = Query(10, ge=1, le=50, description="返回的活动数量"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    获取最近的创建/更新活动
    - 研究者只能看到自己的活动
    - 管理员可以看到全部活动
    - 返回最近创建的记录、参与者、场域
    """
    is_admin = current_user.role.value == "admin"
    activities: List[RecentActivity] = []

    # 获取最近的田野记录
    records_query = db.query(Record).join(User, Record.created_by == User.id)
    if not is_admin:
        records_query = records_query.filter(Record.created_by == current_user.id)
    recent_records = records_query.order_by(desc(Record.created_at)).limit(limit).all()

    for record in recent_records:
        creator = db.query(User).filter(User.id == record.created_by).first()
        activities.append(RecentActivity(
            id=record.id,
            type="record",
            action="created",
            title=record.title,
            created_at=record.created_at,
            creator_name=creator.full_name or creator.username if creator else "未知"
        ))

    # 获取最近的参与者
    participants_query = db.query(Participant)
    if not is_admin:
        participants_query = participants_query.filter(Participant.created_by == current_user.id)
    recent_participants = participants_query.order_by(desc(Participant.created_at)).limit(limit).all()

    for participant in recent_participants:
        creator = db.query(User).filter(User.id == participant.created_by).first()
        activities.append(RecentActivity(
            id=participant.id,
            type="participant",
            action="created",
            title=f"参与者: {participant.name_or_code}",
            created_at=participant.created_at,
            creator_name=creator.full_name or creator.username if creator else "未知"
        ))

    # 获取最近的场域
    fields_query = db.query(Field)
    if not is_admin:
        fields_query = fields_query.filter(Field.created_by == current_user.id)
    recent_fields = fields_query.order_by(desc(Field.created_at)).limit(limit).all()

    for field in recent_fields:
        creator = db.query(User).filter(User.id == field.created_by).first()
        # 使用 Field 模型的 full_location 属性构建完整地点标题
        field_title = field.full_location

        activities.append(RecentActivity(
            id=field.id,
            type="field",
            action="created",
            title=f"场域: {field_title}",
            created_at=field.created_at,
            creator_name=creator.full_name or creator.username if creator else "未知"
        ))

    # 按创建时间倒序排列，只返回前 limit 条
    activities.sort(key=lambda x: x.created_at, reverse=True)
    activities = activities[:limit]

    return RecentActivitiesResponse(
        items=activities,
        total=len(activities)
    )

