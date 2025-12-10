"""
标签相关的 Pydantic 模型
"""
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field
from enum import Enum


# ============ 枚举类型 ============
class TagCategoryType(str, Enum):
    """标签分类类型"""
    theme = "theme"        # 主题分类
    content = "content"    # 内容分类
    analysis = "analysis"  # 分析维度


# ============ 标签分类 Schema ============
class TagCategoryCreate(BaseModel):
    """创建标签分类请求"""
    name: str = Field(..., min_length=1, max_length=50, description="分类名称")
    type: TagCategoryType = Field(..., description="分类类型")
    description: Optional[str] = Field(None, description="分类描述")
    color: Optional[str] = Field(None, max_length=7, pattern=r'^#[0-9A-Fa-f]{6}$', description="分类颜色 (HEX格式)")


class TagCategoryUpdate(BaseModel):
    """更新标签分类请求"""
    name: Optional[str] = Field(None, min_length=1, max_length=50)
    type: Optional[TagCategoryType] = None
    description: Optional[str] = None
    color: Optional[str] = Field(None, max_length=7, pattern=r'^#[0-9A-Fa-f]{6}$')


class TagCategoryResponse(BaseModel):
    """标签分类响应"""
    id: int
    name: str
    type: TagCategoryType
    description: Optional[str] = None
    color: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    tag_count: int = 0  # 该分类下的标签数量

    class Config:
        from_attributes = True


class TagCategoryListResponse(BaseModel):
    """标签分类列表响应"""
    items: List[TagCategoryResponse]
    total: int


# ============ 标签 Schema ============
class TagCreate(BaseModel):
    """创建标签请求"""
    name: str = Field(..., min_length=1, max_length=50, description="标签名称")
    description: Optional[str] = Field(None, description="标签描述")
    category_id: int = Field(..., description="所属分类ID")


class TagUpdate(BaseModel):
    """更新标签请求"""
    name: Optional[str] = Field(None, min_length=1, max_length=50)
    description: Optional[str] = None
    category_id: Optional[int] = None


class TagCategoryBasic(BaseModel):
    """标签分类基本信息（用于嵌套）"""
    id: int
    name: str
    type: TagCategoryType
    color: Optional[str] = None

    class Config:
        from_attributes = True


class TagResponse(BaseModel):
    """标签响应"""
    id: int
    name: str
    description: Optional[str] = None
    category_id: int
    category: Optional[TagCategoryBasic] = None
    usage_count: int = 0
    created_by: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TagListItem(BaseModel):
    """标签列表项"""
    id: int
    name: str
    description: Optional[str] = None
    category_id: int
    category: Optional[TagCategoryBasic] = None
    usage_count: int = 0
    created_at: datetime

    class Config:
        from_attributes = True


class TagListResponse(BaseModel):
    """标签列表响应"""
    items: List[TagListItem]
    total: int
    skip: int
    limit: int

