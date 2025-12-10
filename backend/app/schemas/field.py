"""
场域相关的 Pydantic 模型
"""
from typing import Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field


# ============ 创建场域 ============
class FieldCreate(BaseModel):
    """创建场域请求"""
    region: str = Field(..., min_length=1, max_length=100, description="区域 (省/市/区县)")
    location: str = Field(..., min_length=1, max_length=200, description="具体地点")
    sub_field: Optional[str] = Field(None, max_length=200, description="子场域")
    
    # 地理信息
    latitude: Optional[float] = Field(None, ge=-90, le=90, description="纬度")
    longitude: Optional[float] = Field(None, ge=-180, le=180, description="经度")
    address: Optional[str] = Field(None, description="详细地址")
    
    # 描述信息 (JSON格式)
    description: Optional[Dict[str, Any]] = Field(
        default_factory=dict, 
        description="描述信息 (environment, cultural_background, accessibility)"
    )
    
    # 时间属性 (JSON格式)
    time_attributes: Optional[Dict[str, Any]] = Field(
        default_factory=dict,
        description="时间属性 (active_hours, seasonal_changes)"
    )


# ============ 更新场域 ============
class FieldUpdate(BaseModel):
    """更新场域请求"""
    region: Optional[str] = Field(None, min_length=1, max_length=100)
    location: Optional[str] = Field(None, min_length=1, max_length=200)
    sub_field: Optional[str] = Field(None, max_length=200)
    
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)
    address: Optional[str] = None
    
    description: Optional[Dict[str, Any]] = None
    time_attributes: Optional[Dict[str, Any]] = None


# ============ 场域响应 ============
class FieldResponse(BaseModel):
    """场域响应"""
    id: int
    region: str
    location: str
    sub_field: Optional[str] = None
    
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    address: Optional[str] = None
    
    description: Optional[Dict[str, Any]] = None
    time_attributes: Optional[Dict[str, Any]] = None
    
    created_by: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============ 场域列表项 ============
class FieldListItem(BaseModel):
    """场域列表项"""
    id: int
    region: str
    location: str
    sub_field: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    address: Optional[str] = None
    created_at: datetime
    created_by: int

    class Config:
        from_attributes = True


# ============ 场域列表响应 ============
class FieldListResponse(BaseModel):
    """场域列表响应"""
    items: list[FieldListItem]
    total: int
    skip: int
    limit: int

