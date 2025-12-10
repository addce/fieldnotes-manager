"""
场域管理API
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.core.database import get_db
from app.models.user import User, UserRole
from app.models.field import Field
from app.schemas.field import (
    FieldCreate,
    FieldUpdate,
    FieldResponse,
    FieldListResponse
)
from app.api.api_v1.endpoints.auth import get_current_active_user

router = APIRouter()


@router.get("/", summary="获取场域列表")
async def get_fields(
    skip: int = Query(0, ge=0, description="跳过的记录数"),
    limit: int = Query(100, ge=1, le=1000, description="返回的记录数"),
    region: Optional[str] = Query(None, description="区域筛选"),
    search: Optional[str] = Query(None, description="搜索关键词"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """获取场域列表"""
    query = db.query(Field)
    
    # 数据隔离：研究者只能看到自己创建的场域，管理员可以看到所有
    if current_user.role != UserRole.ADMIN:
        query = query.filter(Field.created_by == current_user.id)
    
    # 区域筛选
    if region:
        query = query.filter(Field.region == region)
    
    # 搜索
    if search:
        query = query.filter(
            Field.location.contains(search) |
            Field.sub_field.contains(search)
        )
    
    fields = query.offset(skip).limit(limit).all()
    total = query.count()
    
    return {
        "items": fields,
        "total": total,
        "skip": skip,
        "limit": limit
    }


@router.post("/", summary="创建场域", response_model=FieldResponse)
async def create_field(
    field_data: FieldCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    创建新场域
    - 任何已登录用户都可以创建场域
    - 场域将关联到创建者
    """
    # 创建场域实例
    db_field = Field(
        region=field_data.region,
        location=field_data.location,
        sub_field=field_data.sub_field,
        latitude=field_data.latitude,
        longitude=field_data.longitude,
        address=field_data.address,
        description=field_data.description,
        time_attributes=field_data.time_attributes,
        created_by=current_user.id
    )

    db.add(db_field)
    db.commit()
    db.refresh(db_field)

    return db_field


@router.get("/regions", summary="获取区域列表")
async def get_regions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """获取所有区域列表"""
    regions = db.query(Field.region).distinct().all()
    return [region[0] for region in regions if region[0]]


@router.get("/{field_id}", summary="获取场域详情")
async def get_field(
    field_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """获取场域详情"""
    field = db.query(Field).filter(Field.id == field_id).first()
    if not field:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="场域不存在"
        )
    
    return field


@router.put("/{field_id}", summary="更新场域", response_model=FieldResponse)
async def update_field(
    field_id: int,
    field_data: FieldUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    更新场域信息
    - 研究者只能编辑自己创建的场域
    - 管理员可以编辑任何场域
    """
    # 查找场域
    field = db.query(Field).filter(Field.id == field_id).first()
    if not field:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="场域不存在"
        )

    # 检查权限：研究者只能编辑自己创建的场域，管理员拥有全部权限
    if field.created_by != current_user.id and current_user.role.value != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="权限不足，只能编辑自己创建的场域"
        )

    # 更新字段（仅更新非None的字段）
    update_data = field_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(field, key, value)

    db.commit()
    db.refresh(field)

    return field


@router.delete("/{field_id}", summary="删除场域")
async def delete_field(
    field_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """删除场域"""
    field = db.query(Field).filter(Field.id == field_id).first()
    if not field:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="场域不存在"
        )
    
    # 检查权限
    if field.created_by != current_user.id and current_user.role.value != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="权限不足，只能删除自己创建的场域"
        )
    
    db.delete(field)
    db.commit()
    
    return {"message": "场域删除成功"}
