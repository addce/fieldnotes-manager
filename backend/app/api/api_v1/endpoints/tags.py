"""
标签管理API
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func

from app.core.database import get_db
from app.models.user import User
from app.models.tag import Tag, TagCategory, TagCategoryType
from app.api.api_v1.endpoints.auth import get_current_active_user
from app.schemas.tag import (
    TagCategoryCreate,
    TagCategoryUpdate,
    TagCategoryResponse,
    TagCreate,
    TagUpdate,
    TagResponse,
    TagListResponse
)

router = APIRouter()


# ============ 标签分类 API ============

@router.get("/categories", summary="获取标签分类列表")
async def get_tag_categories(
    type: Optional[TagCategoryType] = Query(None, description="分类类型"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    获取标签分类列表
    - 可选按类型筛选
    - 返回每个分类下的标签数量
    """
    query = db.query(TagCategory)

    if type:
        query = query.filter(TagCategory.type == type)

    categories = query.order_by(TagCategory.created_at.desc()).all()

    # 计算每个分类下的标签数量
    result = []
    for category in categories:
        tag_count = db.query(func.count(Tag.id)).filter(Tag.category_id == category.id).scalar()
        result.append({
            "id": category.id,
            "name": category.name,
            "type": category.type,
            "description": category.description,
            "color": category.color,
            "created_at": category.created_at,
            "updated_at": category.updated_at,
            "tag_count": tag_count
        })

    return {"items": result, "total": len(result)}


@router.post("/categories", summary="创建标签分类", response_model=TagCategoryResponse)
async def create_tag_category(
    category_data: TagCategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    创建新的标签分类
    - 分类名称不能重复
    """
    # 检查分类名是否已存在
    existing = db.query(TagCategory).filter(TagCategory.name == category_data.name).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="分类名称已存在"
        )

    # 创建分类
    category = TagCategory(
        name=category_data.name,
        type=category_data.type,
        description=category_data.description,
        color=category_data.color or "#2196F3"  # 默认蓝色
    )

    db.add(category)
    db.commit()
    db.refresh(category)

    return {
        "id": category.id,
        "name": category.name,
        "type": category.type,
        "description": category.description,
        "color": category.color,
        "created_at": category.created_at,
        "updated_at": category.updated_at,
        "tag_count": 0
    }


@router.get("/categories/{category_id}", summary="获取标签分类详情")
async def get_tag_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """获取标签分类详情"""
    category = db.query(TagCategory).filter(TagCategory.id == category_id).first()
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="分类不存在"
        )

    tag_count = db.query(func.count(Tag.id)).filter(Tag.category_id == category.id).scalar()

    return {
        "id": category.id,
        "name": category.name,
        "type": category.type,
        "description": category.description,
        "color": category.color,
        "created_at": category.created_at,
        "updated_at": category.updated_at,
        "tag_count": tag_count
    }


@router.put("/categories/{category_id}", summary="更新标签分类", response_model=TagCategoryResponse)
async def update_tag_category(
    category_id: int,
    category_data: TagCategoryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    更新标签分类
    - 管理员可以更新所有分类
    """
    # 查找分类
    category = db.query(TagCategory).filter(TagCategory.id == category_id).first()
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="分类不存在"
        )

    # 检查权限（只有管理员可以修改分类）
    if current_user.role.value != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="权限不足，只有管理员可以修改分类"
        )

    # 如果更新名称，检查是否重复
    if category_data.name and category_data.name != category.name:
        existing = db.query(TagCategory).filter(TagCategory.name == category_data.name).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="分类名称已存在"
            )

    # 更新字段
    update_data = category_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(category, key, value)

    db.commit()
    db.refresh(category)

    tag_count = db.query(func.count(Tag.id)).filter(Tag.category_id == category.id).scalar()

    return {
        "id": category.id,
        "name": category.name,
        "type": category.type,
        "description": category.description,
        "color": category.color,
        "created_at": category.created_at,
        "updated_at": category.updated_at,
        "tag_count": tag_count
    }


@router.delete("/categories/{category_id}", summary="删除标签分类")
async def delete_tag_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    删除标签分类
    - 如果分类下有标签，不能删除
    - 只有管理员可以删除分类
    """
    category = db.query(TagCategory).filter(TagCategory.id == category_id).first()
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="分类不存在"
        )

    # 检查权限
    if current_user.role.value != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="权限不足，只有管理员可以删除分类"
        )

    # 检查是否有标签使用此分类
    tag_count = db.query(func.count(Tag.id)).filter(Tag.category_id == category_id).scalar()
    if tag_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"该分类下还有 {tag_count} 个标签，请先删除或移动这些标签"
        )

    db.delete(category)
    db.commit()

    return {"message": "分类删除成功", "id": category_id}


# ============ 标签 API ============

@router.get("/", summary="获取标签列表", response_model=TagListResponse)
async def get_tags(
    skip: int = Query(0, ge=0, description="跳过的记录数"),
    limit: int = Query(100, ge=1, le=1000, description="返回的记录数"),
    category_id: Optional[int] = Query(None, description="分类ID"),
    search: Optional[str] = Query(None, description="搜索关键词"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    获取标签列表
    - 支持按分类筛选
    - 支持按名称搜索
    - 支持分页
    """
    query = db.query(Tag).options(joinedload(Tag.category))

    # 分类筛选
    if category_id:
        query = query.filter(Tag.category_id == category_id)

    # 搜索
    if search:
        query = query.filter(Tag.name.contains(search))

    # 按创建时间倒序
    query = query.order_by(Tag.created_at.desc())

    # 获取总数（分页前）
    total = query.count()

    # 分页
    tags = query.offset(skip).limit(limit).all()

    return TagListResponse(
        items=tags,
        total=total,
        skip=skip,
        limit=limit
    )


@router.post("/", summary="创建标签", response_model=TagResponse)
async def create_tag(
    tag_data: TagCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    创建新标签
    - 标签名在同一分类下不能重复
    """
    # 检查分类是否存在
    category = db.query(TagCategory).filter(TagCategory.id == tag_data.category_id).first()
    if not category:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="指定的分类不存在"
        )

    # 检查同一分类下是否有重名标签
    existing = db.query(Tag).filter(
        Tag.name == tag_data.name,
        Tag.category_id == tag_data.category_id
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="该分类下已存在同名标签"
        )

    # 创建标签
    tag = Tag(
        name=tag_data.name,
        description=tag_data.description,
        category_id=tag_data.category_id,
        created_by=current_user.id,
        usage_count=0
    )

    db.add(tag)
    db.commit()
    db.refresh(tag)

    # 重新加载以获取关联的category
    db.refresh(tag)
    tag = db.query(Tag).options(joinedload(Tag.category)).filter(Tag.id == tag.id).first()

    return tag


@router.get("/{tag_id}", summary="获取标签详情", response_model=TagResponse)
async def get_tag(
    tag_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """获取标签详情"""
    tag = db.query(Tag).options(joinedload(Tag.category)).filter(Tag.id == tag_id).first()
    if not tag:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="标签不存在"
        )

    return tag


@router.put("/{tag_id}", summary="更新标签", response_model=TagResponse)
async def update_tag(
    tag_id: int,
    tag_data: TagUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    更新标签信息
    - 研究者只能编辑自己创建的标签
    - 管理员可以编辑任何标签
    """
    # 查找标签
    tag = db.query(Tag).filter(Tag.id == tag_id).first()
    if not tag:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="标签不存在"
        )

    # 检查权限
    if tag.created_by != current_user.id and current_user.role.value != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="权限不足，只能编辑自己创建的标签"
        )

    # 如果更新分类，检查新分类是否存在
    if tag_data.category_id and tag_data.category_id != tag.category_id:
        category = db.query(TagCategory).filter(TagCategory.id == tag_data.category_id).first()
        if not category:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="指定的分类不存在"
            )

    # 如果更新名称，检查同一分类下是否有重名
    new_category_id = tag_data.category_id or tag.category_id
    if tag_data.name and tag_data.name != tag.name:
        existing = db.query(Tag).filter(
            Tag.name == tag_data.name,
            Tag.category_id == new_category_id,
            Tag.id != tag_id
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="该分类下已存在同名标签"
            )

    # 更新字段
    update_data = tag_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(tag, key, value)

    db.commit()
    db.refresh(tag)

    # 重新加载关联
    tag = db.query(Tag).options(joinedload(Tag.category)).filter(Tag.id == tag.id).first()

    return tag


@router.delete("/{tag_id}", summary="删除标签")
async def delete_tag(
    tag_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    删除标签
    - 研究者只能删除自己创建的标签
    - 管理员可以删除任何标签
    """
    tag = db.query(Tag).filter(Tag.id == tag_id).first()
    if not tag:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="标签不存在"
        )

    # 检查权限
    if tag.created_by != current_user.id and current_user.role.value != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="权限不足，只能删除自己创建的标签"
        )

    db.delete(tag)
    db.commit()

    return {"message": "标签删除成功", "id": tag_id}
