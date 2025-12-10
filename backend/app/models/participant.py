"""
参与者模型
"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.core.database import Base


class Participant(Base):
    """参与者模型"""
    __tablename__ = "participants"
    
    id = Column(Integer, primary_key=True, index=True, comment="参与者ID")
    
    # 基本信息
    name_or_code = Column(String(100), nullable=False, comment="姓名或代号")
    gender = Column(String(20), nullable=True, comment="性别")
    age_range = Column(String(20), nullable=True, comment="年龄段")
    occupation = Column(String(100), nullable=True, comment="职业/身份")
    education = Column(String(50), nullable=True, comment="教育背景")
    
    # 联系信息 (JSON格式存储)
    contact_info = Column(JSON, nullable=True, comment="联系信息")
    
    # 社会属性 (JSON格式存储)
    social_attributes = Column(JSON, nullable=True, comment="社会属性")
    
    # 研究相关信息 (JSON格式存储)
    research_related = Column(JSON, nullable=True, comment="研究相关信息")
    
    # 隐私设置
    is_anonymous = Column(Boolean, default=False, comment="是否匿名化")
    data_sensitivity = Column(String(20), default="normal", comment="数据敏感级别")
    
    # 备注
    notes = Column(Text, nullable=True, comment="备注信息")
    
    # 创建者
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False, comment="创建者ID")
    
    # 时间戳
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="创建时间")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), comment="更新时间")
    
    # 关系
    creator = relationship("User", backref="created_participants")
    
    def __repr__(self):
        return f"<Participant(id={self.id}, name='{self.name_or_code}')>"
