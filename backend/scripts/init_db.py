"""
数据库初始化脚本
"""
import sys
import os

# 添加项目根目录到Python路径
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine
from app.core.config import settings
from app.core.security import get_password_hash
from app.models import Base, User, TagCategory, Tag
from app.models.user import UserRole
from app.models.tag import TagCategoryType


def create_database():
    """创建数据库"""
    # 创建数据库引擎
    engine = create_engine(settings.DATABASE_URL)
    
    # 创建所有表
    Base.metadata.create_all(bind=engine)
    print("✅ 数据库表创建成功")
    
    return engine


def init_admin_user(engine):
    """初始化管理员用户"""
    from sqlalchemy.orm import sessionmaker
    
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    try:
        # 检查是否已存在管理员用户
        admin_user = db.query(User).filter(User.username == "admin").first()
        if admin_user:
            print("⚠️  管理员用户已存在")
            return
        
        # 创建管理员用户
        admin_user = User(
            username="admin",
            email="admin@fieldwork.com",
            full_name="系统管理员",
            role=UserRole.ADMIN,
            is_active=True,
            is_verified=True,
            hashed_password=get_password_hash("admin123")  # 默认密码，生产环境需要修改
        )
        
        db.add(admin_user)
        db.commit()
        print("✅ 管理员用户创建成功")
        print("   用户名: admin")
        print("   密码: admin123")
        print("   ⚠️  请在生产环境中修改默认密码！")
        
    except Exception as e:
        print(f"❌ 创建管理员用户失败: {e}")
        db.rollback()
    finally:
        db.close()


def init_tag_categories(engine):
    """初始化标签分类"""
    from sqlalchemy.orm import sessionmaker
    
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    try:
        # 检查是否已存在标签分类
        if db.query(TagCategory).first():
            print("⚠️  标签分类已存在")
            return
        
        # 创建默认标签分类
        categories = [
            # 主题分类
            TagCategory(name="研究主题", type=TagCategoryType.THEME, description="研究的主要主题领域", color="#2196F3"),
            TagCategory(name="方法论", type=TagCategoryType.THEME, description="研究方法和技术", color="#4CAF50"),
            TagCategory(name="情感色彩", type=TagCategoryType.THEME, description="情感和态度相关", color="#FF9800"),
            TagCategory(name="数据类型", type=TagCategoryType.THEME, description="数据的性质和类型", color="#9C27B0"),
            TagCategory(name="研究阶段", type=TagCategoryType.THEME, description="研究进展阶段", color="#607D8B"),
            
            # 内容分类
            TagCategory(name="行为观察", type=TagCategoryType.CONTENT, description="观察到的行为模式", color="#F44336"),
            TagCategory(name="话语分析", type=TagCategoryType.CONTENT, description="语言和交流相关", color="#E91E63"),
            TagCategory(name="物质文化", type=TagCategoryType.CONTENT, description="物质环境和文化符号", color="#795548"),
            TagCategory(name="社会关系", type=TagCategoryType.CONTENT, description="人际关系和社会网络", color="#009688"),
            
            # 分析维度
            TagCategory(name="理论框架", type=TagCategoryType.ANALYSIS, description="理论视角和分析框架", color="#3F51B5"),
            TagCategory(name="重要程度", type=TagCategoryType.ANALYSIS, description="数据的重要性级别", color="#FF5722"),
            TagCategory(name="可信度", type=TagCategoryType.ANALYSIS, description="数据来源的可靠性", color="#8BC34A"),
            TagCategory(name="后续行动", type=TagCategoryType.ANALYSIS, description="需要采取的后续行动", color="#FFC107"),
        ]
        
        for category in categories:
            db.add(category)
        
        db.commit()
        print("✅ 标签分类初始化成功")
        
    except Exception as e:
        print(f"❌ 初始化标签分类失败: {e}")
        db.rollback()
    finally:
        db.close()


def init_default_tags(engine):
    """初始化默认标签"""
    from sqlalchemy.orm import sessionmaker
    
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    try:
        # 检查是否已存在标签
        if db.query(Tag).first():
            print("⚠️  标签已存在")
            return
        
        # 获取分类
        categories = {cat.name: cat for cat in db.query(TagCategory).all()}
        
        # 创建默认标签
        default_tags = [
            # 研究主题
            ("教育", "教育相关研究", "研究主题"),
            ("医疗", "医疗健康相关", "研究主题"),
            ("社区治理", "社区管理和治理", "研究主题"),
            ("文化传承", "文化传统和传承", "研究主题"),
            
            # 方法论
            ("参与观察", "参与式观察方法", "方法论"),
            ("深度访谈", "一对一深度访谈", "方法论"),
            ("焦点小组", "焦点小组讨论", "方法论"),
            
            # 重要程度
            ("核心发现", "重要的核心发现", "重要程度"),
            ("支撑材料", "支撑性材料", "重要程度"),
            ("背景信息", "背景和上下文信息", "重要程度"),
        ]
        
        # 创建管理员用户作为标签创建者
        admin_user = db.query(User).filter(User.username == "admin").first()
        if not admin_user:
            print("❌ 未找到管理员用户，无法创建默认标签")
            return
        
        for tag_name, tag_desc, category_name in default_tags:
            if category_name in categories:
                tag = Tag(
                    name=tag_name,
                    description=tag_desc,
                    category_id=categories[category_name].id,
                    created_by=admin_user.id
                )
                db.add(tag)
        
        db.commit()
        print("✅ 默认标签创建成功")
        
    except Exception as e:
        print(f"❌ 创建默认标签失败: {e}")
        db.rollback()
    finally:
        db.close()


def main():
    """主函数"""
    print("🚀 开始初始化数据库...")
    
    try:
        # 创建数据库表
        engine = create_database()
        
        # 初始化管理员用户
        init_admin_user(engine)
        
        # 初始化标签分类
        init_tag_categories(engine)
        
        # 初始化默认标签
        init_default_tags(engine)
        
        print("\n🎉 数据库初始化完成！")
        print("\n📝 接下来的步骤:")
        print("1. 启动后端服务: uvicorn main:app --reload")
        print("2. 访问API文档: http://localhost:8000/docs")
        print("3. 使用管理员账号登录: admin / admin123")
        
    except Exception as e:
        print(f"❌ 数据库初始化失败: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
