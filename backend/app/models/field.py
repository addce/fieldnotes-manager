"""
场域模型
"""
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, JSON, Float
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.core.database import Base


class Field(Base):
    """场域模型"""
    __tablename__ = "fields"
    
    id = Column(Integer, primary_key=True, index=True, comment="场域ID")
    
    # 层级结构
    region = Column(String(100), nullable=False, comment="区域 (省/市/区县)")
    location = Column(String(200), nullable=False, comment="具体地点")
    sub_field = Column(String(200), nullable=True, comment="子场域")
    
    # 地理信息
    latitude = Column(Float, nullable=True, comment="纬度")
    longitude = Column(Float, nullable=True, comment="经度")
    address = Column(Text, nullable=True, comment="详细地址")
    
    # 描述信息 (JSON格式存储)
    description = Column(JSON, nullable=True, comment="描述信息")
    
    # 时间属性 (JSON格式存储)
    time_attributes = Column(JSON, nullable=True, comment="时间属性")
    
    # 创建者
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False, comment="创建者ID")
    
    # 时间戳
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="创建时间")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), comment="更新时间")
    
    # 关系
    creator = relationship("User", backref="created_fields")
    
    def __repr__(self):
        return f"<Field(id={self.id}, location='{self.location}')>"
    
    @property
    def full_location(self):
        """完整地点描述"""
        parts = [self.region, self.location]
        if self.sub_field:
            parts.append(self.sub_field)
        return " - ".join(parts)
