# 田野笔记与访谈记录系统

## 项目概述
专为人类学、社会学等领域研究者设计的田野笔记与访谈记录管理平台。

## 技术栈
- **后端**: FastAPI (Python)
- **前端**: React + Material UI
- **数据库**: MySQL 8.0+
- **开发环境**: VS Code

## 项目结构
```
田野笔记系统/
├── backend/          # 后端API服务
│   ├── app/          # 应用核心代码
│   ├── requirements.txt
│   ├── main.py
│   └── ...
├── frontend/         # 前端React应用
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── ...
├── docs/            # 项目文档
├── scripts/         # 部署和工具脚本
└── README.md
```

## 快速开始

### 环境要求
- Python 3.8+
- Node.js 16+
- MySQL 8.0+

### 后端启动
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

### 前端启动
```bash
cd frontend
npm install
npm start
```

### 数据库配置
1. 创建数据库: `fieldwork_notes`
2. 配置连接信息 (默认: root/root)
3. 运行数据库迁移脚本

## 开发指南
详细的开发文档请参考 `docs/` 目录。

## 功能特性
- 田野笔记创建与管理
- 参与者信息管理
- 场域信息管理
- 多维度检索与过滤
- 统计分析功能
- 图片上传支持
- 数据导出功能

## 许可证
MIT License
