"""
标签模型
"""
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base


class TagCategoryType(str, enum.Enum):
    """标签分类类型"""
    THEME = "theme"        # 主题分类
    CONTENT = "content"    # 内容分类
    ANALYSIS = "analysis"  # 分析维度


class TagCategory(Base):
    """标签分类模型"""
    __tablename__ = "tag_categories"
    
    id = Column(Integer, primary_key=True, index=True, comment="分类ID")
    name = Column(String(50), nullable=False, comment="分类名称")
    type = Column(Enum(TagCategoryType), nullable=False, comment="分类类型")
    description = Column(Text, nullable=True, comment="分类描述")
    color = Column(String(7), nullable=True, comment="分类颜色 (HEX)")
    
    # 时间戳
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="创建时间")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), comment="更新时间")
    
    def __repr__(self):
        return f"<TagCategory(id={self.id}, name='{self.name}', type='{self.type}')>"


class Tag(Base):
    """标签模型"""
    __tablename__ = "tags"
    
    id = Column(Integer, primary_key=True, index=True, comment="标签ID")
    name = Column(String(50), nullable=False, comment="标签名称")
    description = Column(Text, nullable=True, comment="标签描述")
    
    # 分类关联
    category_id = Column(Integer, ForeignKey("tag_categories.id"), nullable=False, comment="分类ID")
    
    # 创建者
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False, comment="创建者ID")
    
    # 使用统计
    usage_count = Column(Integer, default=0, comment="使用次数")
    
    # 时间戳
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="创建时间")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), comment="更新时间")
    
    # 关系
    category = relationship("TagCategory", backref="tags")
    creator = relationship("User", backref="created_tags")
    
    def __repr__(self):
        return f"<Tag(id={self.id}, name='{self.name}', category='{self.category.name if self.category else None}')>"
