"""
参与者管理API
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.core.database import get_db
from app.models.user import User, UserRole
from app.models.participant import Participant
from app.api.api_v1.endpoints.auth import get_current_active_user
from app.schemas.participant import (
    ParticipantCreate,
    ParticipantUpdate,
    ParticipantResponse,
    ParticipantListResponse
)

router = APIRouter()


@router.get("/", summary="获取参与者列表", response_model=ParticipantListResponse)
async def get_participants(
    skip: int = Query(0, ge=0, description="跳过的记录数"),
    limit: int = Query(100, ge=1, le=1000, description="返回的记录数"),
    search: Optional[str] = Query(None, description="搜索关键词"),
    gender: Optional[str] = Query(None, description="性别筛选"),
    is_anonymous: Optional[bool] = Query(None, description="是否匿名化"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    获取参与者列表

    - 支持按姓名/代号、职业搜索
    - 支持按性别、匿名状态筛选
    - 支持分页
    """
    query = db.query(Participant)

    # 数据隔离：研究者只能看到自己创建的参与者，管理员可以看到所有
    if current_user.role != UserRole.ADMIN:
        query = query.filter(Participant.created_by == current_user.id)

    # 搜索条件
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(
                Participant.name_or_code.like(search_pattern),
                Participant.occupation.like(search_pattern),
                Participant.notes.like(search_pattern)
            )
        )

    # 性别筛选
    if gender:
        query = query.filter(Participant.gender == gender)

    # 匿名状态筛选
    if is_anonymous is not None:
        query = query.filter(Participant.is_anonymous == is_anonymous)

    # 按创建时间倒序排列
    query = query.order_by(Participant.created_at.desc())

    # 获取总数（在分页之前）
    total = query.count()

    # 分页
    participants = query.offset(skip).limit(limit).all()

    return ParticipantListResponse(
        items=participants,
        total=total,
        skip=skip,
        limit=limit
    )


@router.post("/", summary="创建参与者", response_model=ParticipantResponse)
async def create_participant(
    participant_data: ParticipantCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """创建新参与者"""
    # 创建参与者实例
    participant = Participant(
        name_or_code=participant_data.name_or_code,
        gender=participant_data.gender,
        age_range=participant_data.age_range,
        occupation=participant_data.occupation,
        education=participant_data.education,
        contact_info=participant_data.contact_info or {},
        social_attributes=participant_data.social_attributes or {},
        research_related=participant_data.research_related or {},
        is_anonymous=participant_data.is_anonymous,
        data_sensitivity=participant_data.data_sensitivity,
        notes=participant_data.notes,
        created_by=current_user.id
    )

    db.add(participant)
    db.commit()
    db.refresh(participant)

    return participant


@router.get("/{participant_id}", summary="获取参与者详情", response_model=ParticipantResponse)
async def get_participant(
    participant_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """获取参与者详情"""
    participant = db.query(Participant).filter(Participant.id == participant_id).first()

    if not participant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="参与者不存在"
        )

    return participant


@router.put("/{participant_id}", summary="更新参与者", response_model=ParticipantResponse)
async def update_participant(
    participant_id: int,
    participant_data: ParticipantUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """更新参与者信息"""
    # 查找参与者
    participant = db.query(Participant).filter(Participant.id == participant_id).first()

    if not participant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="参与者不存在"
        )

    # 检查权限：只能更新自己创建的参与者，或管理员可以更新所有
    if participant.created_by != current_user.id and current_user.role.value != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="权限不足，只能更新自己创建的参与者"
        )

    # 更新字段（只更新提供的字段）
    update_data = participant_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(participant, field, value)

    db.commit()
    db.refresh(participant)

    return participant


@router.delete("/{participant_id}", summary="删除参与者")
async def delete_participant(
    participant_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """删除参与者"""
    participant = db.query(Participant).filter(Participant.id == participant_id).first()

    if not participant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="参与者不存在"
        )

    # 检查权限：只能删除自己创建的参与者，或管理员可以删除所有
    if participant.created_by != current_user.id and current_user.role.value != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="权限不足，只能删除自己创建的参与者"
        )

    db.delete(participant)
    db.commit()

    return {"message": "参与者删除成功", "id": participant_id}
