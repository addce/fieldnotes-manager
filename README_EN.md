# Field Notes and Interview Records System

## Project Overview
A field notes and interview records management platform specifically designed for researchers in anthropology, sociology, and related fields.

## Technology Stack
- **Backend**: FastAPI (Python)
- **Frontend**: React + Material UI
- **Database**: MySQL 8.0+
- **Development Environment**: VS Code

## Project Structure
```
FieldNotesSystem/
├── backend/          # Backend API service
│   ├── app/          # Core application code
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
```

## Quick Start

### Environment Requirements
- Python 3.8+
- Node.js 16+
- MySQL 8.0+

### Backend Setup
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend Setup
```bash
cd frontend
npm install
npm start
```

### Database Configuration
1. Create database: `fieldwork_notes`
2. Configure connection info (default: root/root)
3. Run database migration scripts

## Development Guide
Please refer to the `docs/` directory for detailed development documentation.

## Features
- Field notes creation and management
- Participant information management
- Field site information management
- Multi-dimensional search and filtering
- Statistical analysis functionality
- Image upload support
- Data export functionality

## License
MIT License