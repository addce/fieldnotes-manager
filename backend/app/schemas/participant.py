"""
参与者相关的 Pydantic 模型
"""
from typing import Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field
from enum import Enum


class GenderEnum(str, Enum):
    """性别枚举"""
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"
    UNKNOWN = "unknown"


class DataSensitivityEnum(str, Enum):
    """数据敏感级别枚举"""
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    CONFIDENTIAL = "confidential"


# ============ 创建参与者 ============
class ParticipantCreate(BaseModel):
    """创建参与者请求"""
    name_or_code: str = Field(..., min_length=1, max_length=100, description="姓名或代号")
    gender: Optional[str] = Field(None, max_length=20, description="性别")
    age_range: Optional[str] = Field(None, max_length=20, description="年龄段")
    occupation: Optional[str] = Field(None, max_length=100, description="职业/身份")
    education: Optional[str] = Field(None, max_length=50, description="教育背景")
    
    contact_info: Optional[Dict[str, Any]] = Field(default_factory=dict, description="联系信息")
    social_attributes: Optional[Dict[str, Any]] = Field(default_factory=dict, description="社会属性")
    research_related: Optional[Dict[str, Any]] = Field(default_factory=dict, description="研究相关信息")
    
    is_anonymous: bool = Field(default=False, description="是否匿名化")
    data_sensitivity: str = Field(default="normal", description="数据敏感级别")
    
    notes: Optional[str] = Field(None, description="备注信息")


# ============ 更新参与者 ============
class ParticipantUpdate(BaseModel):
    """更新参与者请求"""
    name_or_code: Optional[str] = Field(None, min_length=1, max_length=100)
    gender: Optional[str] = Field(None, max_length=20)
    age_range: Optional[str] = Field(None, max_length=20)
    occupation: Optional[str] = Field(None, max_length=100)
    education: Optional[str] = Field(None, max_length=50)
    
    contact_info: Optional[Dict[str, Any]] = None
    social_attributes: Optional[Dict[str, Any]] = None
    research_related: Optional[Dict[str, Any]] = None
    
    is_anonymous: Optional[bool] = None
    data_sensitivity: Optional[str] = None
    
    notes: Optional[str] = None


# ============ 参与者响应 ============
class ParticipantResponse(BaseModel):
    """参与者响应"""
    id: int
    name_or_code: str
    gender: Optional[str] = None
    age_range: Optional[str] = None
    occupation: Optional[str] = None
    education: Optional[str] = None
    
    contact_info: Optional[Dict[str, Any]] = None
    social_attributes: Optional[Dict[str, Any]] = None
    research_related: Optional[Dict[str, Any]] = None
    
    is_anonymous: bool = False
    data_sensitivity: str = "normal"
    
    notes: Optional[str] = None
    
    created_by: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============ 参与者列表项 ============
class ParticipantListItem(BaseModel):
    """参与者列表项"""
    id: int
    name_or_code: str
    gender: Optional[str] = None
    age_range: Optional[str] = None
    occupation: Optional[str] = None
    education: Optional[str] = None
    is_anonymous: bool = False
    data_sensitivity: str = "normal"
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ============ 参与者列表响应 ============
class ParticipantListResponse(BaseModel):
    """参与者列表响应"""
    items: list[ParticipantListItem]
    total: int
    skip: int
    limit: int

