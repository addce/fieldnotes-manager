"""
记录模型
"""
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, JSON, Enum, Table
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base

# 记录与参与者的多对多关联表
record_participants = Table(
    'record_participants',
    Base.metadata,
    Column('record_id', Integer, ForeignKey('records.id'), primary_key=True),
    Column('participant_id', Integer, ForeignKey('participants.id'), primary_key=True)
)

# 记录与标签的多对多关联表
record_tags = Table(
    'record_tags',
    Base.metadata,
    Column('record_id', Integer, ForeignKey('records.id'), primary_key=True),
    Column('tag_id', Integer, ForeignKey('tags.id'), primary_key=True)
)


class RecordType(str, enum.Enum):
    """记录类型枚举"""
    FIELD_NOTE = "field_note"      # 田野笔记
    INTERVIEW = "interview"        # 访谈记录
    OBSERVATION = "observation"    # 观察记录
    OTHER = "other"               # 其他


class RecordStatus(str, enum.Enum):
    """记录状态枚举"""
    DRAFT = "draft"           # 草稿
    COMPLETED = "completed"   # 已完成
    ARCHIVED = "archived"     # 已归档


class Record(Base):
    """记录模型"""
    __tablename__ = "records"
    
    id = Column(Integer, primary_key=True, index=True, comment="记录ID")
    
    # 基本信息
    title = Column(String(200), nullable=False, comment="记录标题")
    type = Column(Enum(RecordType), nullable=False, comment="记录类型")
    record_date = Column(DateTime(timezone=True), nullable=False, comment="记录日期")
    time_range = Column(String(50), nullable=True, comment="时间段")
    duration = Column(Integer, nullable=True, comment="持续时间(分钟)")
    
    # 场域信息
    field_id = Column(Integer, ForeignKey("fields.id"), nullable=True, comment="场域ID")
    specific_location = Column(Text, nullable=True, comment="具体位置描述")
    
    # 内容 (JSON格式存储)
    content = Column(JSON, nullable=False, comment="记录内容")
    
    # 元数据
    status = Column(Enum(RecordStatus), default=RecordStatus.DRAFT, comment="记录状态")
    version = Column(Integer, default=1, comment="版本号")
    
    # 创建者
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False, comment="创建者ID")
    
    # 时间戳
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="创建时间")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), comment="更新时间")
    
    # 关系
    field = relationship("Field", backref="records")
    creator = relationship("User", backref="created_records")
    participants = relationship("Participant", secondary=record_participants, backref="records")
    tags = relationship("Tag", secondary=record_tags, backref="records")
    
    def __repr__(self):
        return f"<Record(id={self.id}, title='{self.title}', type='{self.type}')>"


class RecordImage(Base):
    """记录图片模型"""
    __tablename__ = "record_images"
    
    id = Column(Integer, primary_key=True, index=True, comment="图片ID")
    
    # 关联记录
    record_id = Column(Integer, ForeignKey("records.id"), nullable=False, comment="记录ID")
    
    # 文件信息
    filename = Column(String(255), nullable=False, comment="文件名")
    original_filename = Column(String(255), nullable=False, comment="原始文件名")
    file_path = Column(String(500), nullable=False, comment="文件路径")
    thumbnail_path = Column(String(500), nullable=True, comment="缩略图路径")
    file_size = Column(Integer, nullable=False, comment="文件大小(字节)")
    mime_type = Column(String(100), nullable=False, comment="MIME类型")
    
    # 图片描述
    description = Column(Text, nullable=True, comment="图片描述")
    
    # 排序
    sort_order = Column(Integer, default=0, comment="排序顺序")
    
    # 时间戳
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="创建时间")
    
    # 关系
    record = relationship("Record", backref="images")
    
    def __repr__(self):
        return f"<RecordImage(id={self.id}, filename='{self.filename}')>"
