"""
记录相关的 Pydantic 模型
"""
from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field
from enum import Enum


class RecordTypeEnum(str, Enum):
    """记录类型枚举"""
    FIELD_NOTE = "field_note"
    INTERVIEW = "interview"
    OBSERVATION = "observation"
    OTHER = "other"


class RecordStatusEnum(str, Enum):
    """记录状态枚举"""
    DRAFT = "draft"
    COMPLETED = "completed"
    ARCHIVED = "archived"


# ============ 参与者简要信息 ============
class ParticipantBrief(BaseModel):
    """参与者简要信息"""
    id: int
    name_or_code: str

    class Config:
        from_attributes = True


# ============ 场域简要信息 ============
class FieldBrief(BaseModel):
    """场域简要信息"""
    id: int
    region: str
    location: str
    sub_field: Optional[str] = None

    class Config:
        from_attributes = True


# ============ 标签简要信息 ============
class TagBrief(BaseModel):
    """标签简要信息"""
    id: int
    name: str
    color: Optional[str] = None

    class Config:
        from_attributes = True


# ============ 创建记录 ============
class RecordCreate(BaseModel):
    """创建记录请求"""
    title: str = Field(..., min_length=1, max_length=200, description="记录标题")
    type: RecordTypeEnum = Field(..., description="记录类型")
    record_date: datetime = Field(..., description="记录日期")
    time_range: Optional[str] = Field(None, max_length=50, description="时间段")
    duration: Optional[int] = Field(None, ge=0, description="持续时间(分钟)")
    
    field_id: Optional[int] = Field(None, description="场域ID")
    specific_location: Optional[str] = Field(None, description="具体位置描述")
    
    content: Dict[str, Any] = Field(default_factory=dict, description="记录内容")
    
    status: RecordStatusEnum = Field(default=RecordStatusEnum.DRAFT, description="记录状态")
    
    participant_ids: List[int] = Field(default_factory=list, description="参与者ID列表")
    tag_ids: List[int] = Field(default_factory=list, description="标签ID列表")


# ============ 更新记录 ============
class RecordUpdate(BaseModel):
    """更新记录请求"""
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    type: Optional[RecordTypeEnum] = None
    record_date: Optional[datetime] = None
    time_range: Optional[str] = None
    duration: Optional[int] = None
    
    field_id: Optional[int] = None
    specific_location: Optional[str] = None
    
    content: Optional[Dict[str, Any]] = None
    
    status: Optional[RecordStatusEnum] = None
    
    participant_ids: Optional[List[int]] = None
    tag_ids: Optional[List[int]] = None


# ============ 记录响应 ============
class RecordResponse(BaseModel):
    """记录响应"""
    id: int
    title: str
    type: RecordTypeEnum
    record_date: datetime
    time_range: Optional[str] = None
    duration: Optional[int] = None
    
    field_id: Optional[int] = None
    specific_location: Optional[str] = None
    
    content: Dict[str, Any]
    
    status: RecordStatusEnum
    version: int
    
    created_by: int
    created_at: datetime
    updated_at: datetime
    
    # 关联数据
    field: Optional[FieldBrief] = None
    participants: List[ParticipantBrief] = []
    tags: List[TagBrief] = []

    class Config:
        from_attributes = True


# ============ 记录列表项 ============
class RecordListItem(BaseModel):
    """记录列表项（精简版）"""
    id: int
    title: str
    type: RecordTypeEnum
    record_date: datetime
    status: RecordStatusEnum
    created_at: datetime

    # 添加 content 字段，确保编辑/查看时能获取到内容
    content: Dict[str, Any] = Field(default_factory=dict, description="记录内容")
    time_range: Optional[str] = None
    duration: Optional[int] = None
    specific_location: Optional[str] = None

    field: Optional[FieldBrief] = None
    participants: List[ParticipantBrief] = []

    class Config:
        from_attributes = True


# ============ 记录列表响应 ============
class RecordListResponse(BaseModel):
    """记录列表响应"""
    items: List[RecordListItem]
    total: int
    skip: int
    limit: int


# ============ 记录内容结构 ============
class InterviewContent(BaseModel):
    """访谈记录内容结构"""
    interview_outline: Optional[str] = Field(None, description="访谈提纲")
    qa_records: List[Dict[str, str]] = Field(default_factory=list, description="问答记录")
    researcher_notes: Optional[str] = Field(None, description="研究者笔记")
    follow_up_questions: List[str] = Field(default_factory=list, description="追问问题")


class FieldNoteContent(BaseModel):
    """田野笔记内容结构"""
    description: Optional[str] = Field(None, description="描述性记录")
    reflection: Optional[str] = Field(None, description="反思性记录")
    theoretical_notes: Optional[str] = Field(None, description="理论性笔记")


class ObservationContent(BaseModel):
    """观察记录内容结构"""
    scene_description: Optional[str] = Field(None, description="场景描述")
    behavior_records: List[Dict[str, Any]] = Field(default_factory=list, description="行为记录")
    environment_notes: Optional[str] = Field(None, description="环境记录")
    researcher_reflection: Optional[str] = Field(None, description="研究者反思")


# ============ 图片相关 ============
class RecordImageResponse(BaseModel):
    """图片响应"""
    id: int
    record_id: int
    filename: str
    original_filename: str
    file_path: str
    thumbnail_path: Optional[str] = None
    file_size: int
    mime_type: str
    description: Optional[str] = None
    sort_order: int
    created_at: datetime

    # 生成完整的访问URL
    url: Optional[str] = None

    class Config:
        from_attributes = True


class RecordImageListResponse(BaseModel):
    """图片列表响应"""
    items: List[RecordImageResponse]
    total: int

