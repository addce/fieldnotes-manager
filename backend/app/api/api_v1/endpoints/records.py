"""
记录管理API
"""
import os
import uuid
import shutil
from typing import Optional, List
from datetime import datetime
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.models.user import User, UserRole
from app.models.record import Record, RecordType, RecordStatus, RecordImage
from app.models.participant import Participant
from app.models.tag import Tag
from app.schemas.record import (
    RecordCreate, RecordUpdate, RecordResponse, RecordListResponse,
    RecordImageResponse, RecordImageListResponse
)
from app.api.api_v1.endpoints.auth import get_current_active_user

router = APIRouter()

# 图片上传配置
UPLOAD_DIR = Path("uploads/records")
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB


@router.get("/", summary="获取记录列表", response_model=RecordListResponse)
async def get_records(
    skip: int = Query(0, ge=0, description="跳过的记录数"),
    limit: int = Query(100, ge=1, le=1000, description="返回的记录数"),
    type: Optional[RecordType] = Query(None, description="记录类型"),
    record_status: Optional[RecordStatus] = Query(None, alias="status", description="记录状态"),
    search: Optional[str] = Query(None, description="搜索关键词"),
    created_by: Optional[int] = Query(None, description="创建者ID"),
    # 新增筛选参数
    start_date: Optional[datetime] = Query(None, description="开始日期"),
    end_date: Optional[datetime] = Query(None, description="结束日期"),
    field_id: Optional[int] = Query(None, description="场域ID"),
    participant_ids: Optional[str] = Query(None, description="参与者ID列表(逗号分隔)"),
    tag_ids: Optional[str] = Query(None, description="标签ID列表(逗号分隔)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """获取记录列表，支持多条件筛选"""
    query = db.query(Record).options(
        joinedload(Record.field),
        joinedload(Record.participants),
        joinedload(Record.tags)
    )

    # 数据隔离：研究者只能看到自己的记录，管理员可以看到所有记录
    if current_user.role != UserRole.ADMIN:
        query = query.filter(Record.created_by == current_user.id)

    # 类型筛选
    if type:
        query = query.filter(Record.type == type)

    # 状态筛选
    if record_status:
        query = query.filter(Record.status == record_status)

    # 创建者筛选
    if created_by:
        query = query.filter(Record.created_by == created_by)

    # 搜索
    if search:
        query = query.filter(Record.title.contains(search))

    # 日期范围筛选
    if start_date:
        query = query.filter(Record.record_date >= start_date)
    if end_date:
        query = query.filter(Record.record_date <= end_date)

    # 场域筛选
    if field_id:
        query = query.filter(Record.field_id == field_id)

    # 参与者筛选（需要关联查询）
    if participant_ids:
        try:
            pid_list = [int(pid.strip()) for pid in participant_ids.split(',') if pid.strip()]
            if pid_list:
                query = query.filter(Record.participants.any(Participant.id.in_(pid_list)))
        except ValueError:
            pass  # 忽略无效的ID格式

    # 标签筛选（需要关联查询）
    if tag_ids:
        try:
            tid_list = [int(tid.strip()) for tid in tag_ids.split(',') if tid.strip()]
            if tid_list:
                query = query.filter(Record.tags.any(Tag.id.in_(tid_list)))
        except ValueError:
            pass  # 忽略无效的ID格式

    # 按记录日期倒序（更符合使用场景）
    query = query.order_by(Record.record_date.desc())

    # 去重（因为关联查询可能产生重复）
    query = query.distinct()

    # 统计总数（在分页前）
    total = query.count()

    # 分页
    records = query.offset(skip).limit(limit).all()

    return RecordListResponse(
        items=records,
        total=total,
        skip=skip,
        limit=limit
    )


@router.post("/", summary="创建记录", response_model=RecordResponse)
async def create_record(
    record_data: RecordCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """创建新记录"""
    # 调试：打印接收到的数据
    print(f"[DEBUG] 接收到的记录数据: {record_data}")
    print(f"[DEBUG] content 字段: {record_data.content}")

    # 创建记录实例
    record = Record(
        title=record_data.title,
        type=RecordType(record_data.type.value),
        record_date=record_data.record_date,
        time_range=record_data.time_range,
        duration=record_data.duration,
        field_id=record_data.field_id,
        specific_location=record_data.specific_location,
        content=record_data.content,
        status=RecordStatus(record_data.status.value),
        created_by=current_user.id
    )

    # 添加参与者关联
    if record_data.participant_ids:
        participants = db.query(Participant).filter(
            Participant.id.in_(record_data.participant_ids)
        ).all()
        record.participants = participants

    # 添加标签关联
    if record_data.tag_ids:
        tags = db.query(Tag).filter(
            Tag.id.in_(record_data.tag_ids)
        ).all()
        record.tags = tags

    db.add(record)
    db.commit()
    db.refresh(record)

    return record


@router.get("/{record_id}", summary="获取记录详情", response_model=RecordResponse)
async def get_record(
    record_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """获取记录详情"""
    record = db.query(Record).options(
        joinedload(Record.field),
        joinedload(Record.participants),
        joinedload(Record.tags)
    ).filter(Record.id == record_id).first()

    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="记录不存在"
        )

    # 数据隔离：研究者只能查看自己的记录
    if current_user.role != UserRole.ADMIN and record.created_by != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="权限不足，无法查看他人的记录"
        )

    return record


@router.put("/{record_id}", summary="更新记录", response_model=RecordResponse)
async def update_record(
    record_id: int,
    record_data: RecordUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """更新记录信息"""
    record = db.query(Record).filter(Record.id == record_id).first()
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="记录不存在"
        )

    # 检查权限：只能编辑自己创建的记录
    if record.created_by != current_user.id and current_user.role.value != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="权限不足，只能编辑自己创建的记录"
        )

    # 更新字段
    update_data = record_data.model_dump(exclude_unset=True)

    # 处理参与者关联
    if "participant_ids" in update_data:
        participant_ids = update_data.pop("participant_ids")
        participants = db.query(Participant).filter(
            Participant.id.in_(participant_ids)
        ).all()
        record.participants = participants

    # 处理标签关联
    if "tag_ids" in update_data:
        tag_ids = update_data.pop("tag_ids")
        tags = db.query(Tag).filter(
            Tag.id.in_(tag_ids)
        ).all()
        record.tags = tags

    # 更新类型枚举
    if "type" in update_data and update_data["type"]:
        update_data["type"] = RecordType(update_data["type"].value)

    # 更新状态枚举
    if "status" in update_data and update_data["status"]:
        update_data["status"] = RecordStatus(update_data["status"].value)

    # 更新其他字段
    for field, value in update_data.items():
        setattr(record, field, value)

    # 增加版本号
    record.version += 1

    db.commit()
    db.refresh(record)

    return record


@router.delete("/{record_id}", summary="删除记录")
async def delete_record(
    record_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """删除记录"""
    record = db.query(Record).filter(Record.id == record_id).first()
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="记录不存在"
        )

    # 检查权限
    if record.created_by != current_user.id and current_user.role.value != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="权限不足，只能删除自己创建的记录"
        )

    # 删除关联的图片文件
    images = db.query(RecordImage).filter(RecordImage.record_id == record_id).all()
    for image in images:
        file_path = Path(image.file_path)
        if file_path.exists():
            file_path.unlink()
        if image.thumbnail_path:
            thumb_path = Path(image.thumbnail_path)
            if thumb_path.exists():
                thumb_path.unlink()

    # 删除图片目录（如果为空）
    record_upload_dir = UPLOAD_DIR / str(record_id)
    if record_upload_dir.exists():
        try:
            record_upload_dir.rmdir()
        except OSError:
            pass  # 目录不为空，忽略

    db.delete(record)
    db.commit()

    return {"message": "记录删除成功", "id": record_id}


@router.get("/{record_id}/images", summary="获取记录图片列表", response_model=RecordImageListResponse)
async def get_record_images(
    record_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """获取记录的所有图片"""
    # 检查记录是否存在
    record = db.query(Record).filter(Record.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="记录不存在")

    # 获取图片列表
    images = db.query(RecordImage).filter(
        RecordImage.record_id == record_id
    ).order_by(RecordImage.sort_order, RecordImage.created_at).all()

    # 添加 URL 信息（不包含 /api/v1 前缀，前端会自动添加）
    items = []
    for img in images:
        img_dict = {
            "id": img.id,
            "record_id": img.record_id,
            "filename": img.filename,
            "original_filename": img.original_filename,
            "file_path": img.file_path,
            "thumbnail_path": img.thumbnail_path,
            "file_size": img.file_size,
            "mime_type": img.mime_type,
            "description": img.description,
            "sort_order": img.sort_order,
            "created_at": img.created_at,
            "url": f"/records/{record_id}/images/{img.id}/file"
        }
        items.append(RecordImageResponse(**img_dict))

    return RecordImageListResponse(items=items, total=len(items))


@router.post("/{record_id}/images", summary="上传记录图片", response_model=RecordImageResponse)
async def upload_record_image(
    record_id: int,
    file: UploadFile = File(..., description="图片文件"),
    description: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """为记录上传图片"""
    # 检查记录是否存在
    record = db.query(Record).filter(Record.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="记录不存在")

    # 检查权限（只有创建者或管理员可以上传）
    if record.created_by != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="无权为此记录上传图片")

    # 验证文件类型
    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"不支持的文件格式。支持的格式: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    # 读取文件内容并检查大小
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"文件过大。最大允许大小: {MAX_FILE_SIZE // 1024 // 1024}MB"
        )

    # 生成唯一文件名
    unique_filename = f"{uuid.uuid4().hex}{file_ext}"

    # 创建目录
    record_upload_dir = UPLOAD_DIR / str(record_id)
    record_upload_dir.mkdir(parents=True, exist_ok=True)

    # 保存文件
    file_path = record_upload_dir / unique_filename
    with open(file_path, "wb") as f:
        f.write(content)

    # 获取 MIME 类型
    mime_types = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".gif": "image/gif",
        ".webp": "image/webp",
    }
    mime_type = mime_types.get(file_ext, "image/jpeg")

    # 获取当前最大排序值
    max_sort = db.query(RecordImage).filter(
        RecordImage.record_id == record_id
    ).count()

    # 创建数据库记录
    db_image = RecordImage(
        record_id=record_id,
        filename=unique_filename,
        original_filename=file.filename,
        file_path=str(file_path),
        file_size=len(content),
        mime_type=mime_type,
        description=description,
        sort_order=max_sort
    )

    db.add(db_image)
    db.commit()
    db.refresh(db_image)

    return RecordImageResponse(
        id=db_image.id,
        record_id=db_image.record_id,
        filename=db_image.filename,
        original_filename=db_image.original_filename,
        file_path=db_image.file_path,
        thumbnail_path=db_image.thumbnail_path,
        file_size=db_image.file_size,
        mime_type=db_image.mime_type,
        description=db_image.description,
        sort_order=db_image.sort_order,
        created_at=db_image.created_at,
        url=f"/records/{record_id}/images/{db_image.id}/file"
    )


@router.get("/{record_id}/images/{image_id}/file", summary="获取图片文件")
async def get_image_file(
    record_id: int,
    image_id: int,
    db: Session = Depends(get_db)
):
    """获取图片文件"""
    image = db.query(RecordImage).filter(
        RecordImage.id == image_id,
        RecordImage.record_id == record_id
    ).first()

    if not image:
        raise HTTPException(status_code=404, detail="图片不存在")

    file_path = Path(image.file_path)
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="图片文件不存在")

    return FileResponse(
        path=str(file_path),
        media_type=image.mime_type,
        filename=image.original_filename
    )


@router.delete("/{record_id}/images/{image_id}", summary="删除记录图片")
async def delete_record_image(
    record_id: int,
    image_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """删除记录图片"""
    # 检查图片是否存在
    image = db.query(RecordImage).filter(
        RecordImage.id == image_id,
        RecordImage.record_id == record_id
    ).first()

    if not image:
        raise HTTPException(status_code=404, detail="图片不存在")

    # 检查权限
    record = db.query(Record).filter(Record.id == record_id).first()
    if record.created_by != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="无权删除此图片")

    # 删除文件
    file_path = Path(image.file_path)
    if file_path.exists():
        file_path.unlink()

    # 删除缩略图（如果存在）
    if image.thumbnail_path:
        thumb_path = Path(image.thumbnail_path)
        if thumb_path.exists():
            thumb_path.unlink()

    # 删除数据库记录
    db.delete(image)
    db.commit()

    return {"message": "图片删除成功", "id": image_id}
