# Field Notes and Interview Recording System

---
![Test Status](https://img.shields.io/github/actions/workflow/status/addce/short-link/test.yml?branch=main&label=test&style=flat-square)

---
## Initial account credentials
Account:admin
Password:admin123
## Project Overview
A field notes and interview record management platform specifically designed for researchers in anthropology, sociology, and related fields.。

## Technology Stack
- **Backend**: FastAPI (Python)
- **Frontend**: React + Material UI
- **Database**: MySQL 8.0+
- **Development Environment**: VS Code

## Project Structure
```
Field Notes System/
├── backend/          # Backend API services
│   ├── app/          # Application core code
│   ├── requirements.txt
│   ├── main.py
│   └── ...
├── frontend/         # Frontend React application
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── ...
├── docs/            # Project documentation
├── scripts/         # Deployment and utility scripts
└── README.md

## Quick Start

### Environment Requirements
- Python 3.8+
- Node.js 16+
- MySQL 8.0+

### Start Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend Startup
```bash
cd frontend
npm install
npm start
```

### Database Configuration
1. Create database: `fieldwork_notes`
2. Configure connection details (default: root/root)
3. Run database migration scripts

## Development Guide
For detailed development documentation, please refer to the `docs/` directory.

## Features
- Field note creation and management
- Participant information management
- Site information management
- Multi-dimensional search and filtering
- Statistical analysis capabilities
- 图片上传支持
- 数据导出功能

## License
MIT License
