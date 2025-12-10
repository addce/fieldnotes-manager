"""
数据导出API
"""
import io
import json
from typing import Optional, List
from datetime import datetime
from urllib.parse import quote
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.models.user import User, UserRole
from app.models.record import Record, RecordType, RecordStatus
from app.models.participant import Participant
from app.models.tag import Tag
from app.api.api_v1.endpoints.auth import get_current_active_user

router = APIRouter()


def get_type_label(type_value: str) -> str:
    """获取类型中文标签"""
    labels = {
        'field_note': '田野笔记',
        'interview': '访谈记录',
        'observation': '观察记录',
        'other': '其他'
    }
    return labels.get(type_value, type_value)


def get_status_label(status_value: str) -> str:
    """获取状态中文标签"""
    labels = {
        'draft': '草稿',
        'completed': '已完成',
        'archived': '已归档'
    }
    return labels.get(status_value, status_value)


def format_record_for_export(record: Record) -> dict:
    """格式化记录用于导出"""
    # 场域信息
    field_info = ""
    if record.field:
        parts = [record.field.region, record.field.location]
        if record.field.sub_field:
            parts.append(record.field.sub_field)
        field_info = " - ".join(parts)
    if record.specific_location:
        field_info = f"{field_info} ({record.specific_location})" if field_info else record.specific_location

    # 参与者
    participants = ", ".join([p.name_or_code for p in record.participants]) if record.participants else ""

    # 标签
    tags = ", ".join([t.name for t in record.tags]) if record.tags else ""

    # 内容
    content = record.content or {}
    content_text = ""
    if isinstance(content, dict):
        if content.get('description'):
            content_text += f"描述：{content['description']}\n"
        if content.get('reflection'):
            content_text += f"反思：{content['reflection']}\n"
        if content.get('notes'):
            content_text += f"备注：{content['notes']}\n"
    content_text = content_text.strip() or str(content)

    return {
        'id': record.id,
        'title': record.title,
        'type': get_type_label(record.type.value),
        'type_value': record.type.value,
        'record_date': record.record_date.strftime('%Y-%m-%d %H:%M') if record.record_date else '',
        'time_range': record.time_range or '',
        'duration': record.duration or 0,
        'field': field_info,
        'participants': participants,
        'tags': tags,
        'content': content_text,
        'content_raw': content,
        'status': get_status_label(record.status.value),
        'status_value': record.status.value,
        'created_at': record.created_at.strftime('%Y-%m-%d %H:%M') if record.created_at else '',
        'updated_at': record.updated_at.strftime('%Y-%m-%d %H:%M') if record.updated_at else '',
    }


@router.get("/records/json", summary="导出记录为JSON")
async def export_records_json(
    record_ids: Optional[str] = Query(None, description="记录ID列表(逗号分隔)，为空则导出全部"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """导出记录为JSON格式"""
    query = db.query(Record).options(
        joinedload(Record.field),
        joinedload(Record.participants),
        joinedload(Record.tags)
    )

    # 数据隔离：研究者只能导出自己的记录
    if current_user.role != UserRole.ADMIN:
        query = query.filter(Record.created_by == current_user.id)

    # 如果指定了ID列表，则只导出指定记录
    if record_ids:
        try:
            ids = [int(id.strip()) for id in record_ids.split(',') if id.strip()]
            query = query.filter(Record.id.in_(ids))
        except ValueError:
            raise HTTPException(status_code=400, detail="无效的记录ID格式")

    records = query.order_by(Record.record_date.desc()).all()

    if not records:
        raise HTTPException(status_code=404, detail="没有找到可导出的记录")

    # 格式化数据
    export_data = {
        'export_time': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        'total_count': len(records),
        'records': [format_record_for_export(r) for r in records]
    }

    # 生成JSON
    json_content = json.dumps(export_data, ensure_ascii=False, indent=2)
    
    filename = f"field_records_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    filename_cn = f"田野记录导出_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    
    return StreamingResponse(
        io.BytesIO(json_content.encode('utf-8')),
        media_type='application/json',
        headers={
            'Content-Disposition': f"attachment; filename=\"{filename}\"; filename*=UTF-8''{quote(filename_cn)}"
        }
    )


@router.get("/records/csv", summary="导出记录为CSV")
async def export_records_csv(
    record_ids: Optional[str] = Query(None, description="记录ID列表(逗号分隔)，为空则导出全部"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """导出记录为CSV格式（Excel兼容）"""
    query = db.query(Record).options(
        joinedload(Record.field),
        joinedload(Record.participants),
        joinedload(Record.tags)
    )

    # 数据隔离：研究者只能导出自己的记录
    if current_user.role != UserRole.ADMIN:
        query = query.filter(Record.created_by == current_user.id)

    if record_ids:
        try:
            ids = [int(id.strip()) for id in record_ids.split(',') if id.strip()]
            query = query.filter(Record.id.in_(ids))
        except ValueError:
            raise HTTPException(status_code=400, detail="无效的记录ID格式")

    records = query.order_by(Record.record_date.desc()).all()

    if not records:
        raise HTTPException(status_code=404, detail="没有找到可导出的记录")

    # CSV头部
    headers = ['ID', '标题', '类型', '记录日期', '时间段', '持续时间(分钟)', '场域', '参与者', '标签', '内容', '状态', '创建时间', '更新时间']
    
    # 生成CSV内容（使用BOM以支持Excel中文）
    lines = ['\ufeff' + ','.join(headers)]
    
    for record in records:
        data = format_record_for_export(record)
        # CSV转义：双引号需要转义，字段用双引号包裹
        row = [
            str(data['id']),
            f'"{data["title"].replace(chr(34), chr(34)+chr(34))}"',
            f'"{data["type"]}"',
            f'"{data["record_date"]}"',
            f'"{data["time_range"]}"',
            str(data['duration']),
            f'"{data["field"].replace(chr(34), chr(34)+chr(34))}"',
            f'"{data["participants"].replace(chr(34), chr(34)+chr(34))}"',
            f'"{data["tags"].replace(chr(34), chr(34)+chr(34))}"',
            f'"{data["content"].replace(chr(34), chr(34)+chr(34)).replace(chr(10), " ")}"',
            f'"{data["status"]}"',
            f'"{data["created_at"]}"',
            f'"{data["updated_at"]}"',
        ]
        lines.append(','.join(row))
    
    csv_content = '\n'.join(lines)
    filename = f"field_records_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    filename_cn = f"田野记录导出_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    
    return StreamingResponse(
        io.BytesIO(csv_content.encode('utf-8-sig')),
        media_type='text/csv; charset=utf-8-sig',
        headers={
            'Content-Disposition': f"attachment; filename=\"{filename}\"; filename*=UTF-8''{quote(filename_cn)}"
        }
    )


@router.get("/records/markdown", summary="导出记录为Markdown")
async def export_records_markdown(
    record_ids: Optional[str] = Query(None, description="记录ID列表(逗号分隔)，为空则导出全部"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """导出记录为Markdown格式"""
    query = db.query(Record).options(
        joinedload(Record.field),
        joinedload(Record.participants),
        joinedload(Record.tags)
    )

    # 数据隔离：研究者只能导出自己的记录
    if current_user.role != UserRole.ADMIN:
        query = query.filter(Record.created_by == current_user.id)

    if record_ids:
        try:
            ids = [int(id.strip()) for id in record_ids.split(',') if id.strip()]
            query = query.filter(Record.id.in_(ids))
        except ValueError:
            raise HTTPException(status_code=400, detail="无效的记录ID格式")

    records = query.order_by(Record.record_date.desc()).all()

    if not records:
        raise HTTPException(status_code=404, detail="没有找到可导出的记录")

    # 生成Markdown
    md_lines = [
        f"# 田野记录导出",
        f"",
        f"导出时间：{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
        f"",
        f"共 {len(records)} 条记录",
        f"",
        f"---",
        f""
    ]

    for record in records:
        data = format_record_for_export(record)
        content = record.content or {}
        
        md_lines.extend([
            f"## {data['title']}",
            f"",
            f"| 属性 | 值 |",
            f"|------|-----|",
            f"| 类型 | {data['type']} |",
            f"| 记录日期 | {data['record_date']} |",
            f"| 时间段 | {data['time_range'] or '-'} |",
            f"| 持续时间 | {data['duration']}分钟 |" if data['duration'] else f"| 持续时间 | - |",
            f"| 场域 | {data['field'] or '-'} |",
            f"| 参与者 | {data['participants'] or '-'} |",
            f"| 标签 | {data['tags'] or '-'} |",
            f"| 状态 | {data['status']} |",
            f""
        ])

        # 内容部分
        if isinstance(content, dict):
            if content.get('description'):
                md_lines.extend([
                    f"### 描述",
                    f"",
                    content['description'],
                    f""
                ])
            if content.get('reflection'):
                md_lines.extend([
                    f"### 反思",
                    f"",
                    content['reflection'],
                    f""
                ])
            if content.get('notes'):
                md_lines.extend([
                    f"### 备注",
                    f"",
                    content['notes'],
                    f""
                ])
        
        md_lines.extend([f"---", f""])

    md_content = '\n'.join(md_lines)
    filename = f"field_records_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.md"
    filename_cn = f"田野记录导出_{datetime.now().strftime('%Y%m%d_%H%M%S')}.md"
    
    return StreamingResponse(
        io.BytesIO(md_content.encode('utf-8')),
        media_type='text/markdown; charset=utf-8',
        headers={
            'Content-Disposition': f"attachment; filename=\"{filename}\"; filename*=UTF-8''{quote(filename_cn)}"
        }
    )
