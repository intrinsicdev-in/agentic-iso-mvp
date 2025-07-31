# ETS Aero ISO

AI-powered ISO 9001 and ISO 27001 compliance management system with intelligent document import, clause mapping, and automated compliance assistance.

## 🚀 Quick Start (Local Development)

### Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose
- Git

### Setup

1. **Clone and setup the project:**
   ```bash
   git clone <repository-url>
   cd agentic-iso
   ./setup-local.sh
   ```

2. **Add your OpenAI API key:**
   ```bash
   # Edit backend/.env and add your OpenAI API key
   OPENAI_API_KEY=sk-your-api-key-here
   ```

3. **Start the development servers:**
   ```bash
   # Terminal 1: Backend
   cd backend && npm run dev

   # Terminal 2: Frontend
   cd frontend && npm run dev
   ```

4. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - MinIO Console: http://localhost:9001 (minioadmin/minioadmin)

## 🏗️ Architecture

```
agentic-iso/
├── frontend/          # Next.js 14 + TypeScript + Tailwind
├── backend/           # Node.js + Express + Prisma
├── shared/            # Shared types and utilities
├── docker-compose.yml # PostgreSQL + MinIO
└── setup-local.sh     # Quick setup script
```

## 🧪 Testing Document Import

The system can import and automatically classify these document types:
- **Word Documents** (.docx, .doc)
- **PDF Files** (.pdf)
- **Excel Spreadsheets** (.xlsx, .xls)
- **Text Files** (.txt)

### Test the Document Parser

1. **Create a test document** with ISO-like content:
   ```text
   4.1 Understanding the organization and its context
   
   The organization shall determine external and internal issues that are relevant to its purpose and its strategic direction and that affect its ability to achieve the intended result(s) of its quality management system.
   
   6.1 Actions to address risks and opportunities
   
   When planning for the quality management system, the organization shall consider the issues referred to in 4.1...
   ```

2. **Test via API** (once backend is running):
   ```bash
   curl -X POST http://localhost:3001/api/artefacts/import \
     -F "file=@your-test-document.txt" \
     -F "standard=ISO_9001_2015" \
     -F "autoClassify=true" \
     -F "ownerId=test-user-id"
   ```

## 🗄️ Database Schema

The system includes:
- **Users & Roles** (Admin, Manager, Contributor, Viewer, Auditor)
- **Artefacts** with versioning and S3 storage
- **ISO Clauses** (9001:2015 and 27001:2022)
- **AI Agents** for different compliance tasks
- **Tasks & Events** with calendar integration
- **Audit Logs** for full traceability

## 🤖 AI Features

- **Document Classification**: Automatically maps documents to ISO clauses
- **Compliance Checking**: AI reviews for ISO compliance
- **Risk Assessment**: Identifies potential risks in documentation
- **Suggestion Engine**: Provides improvement recommendations

## 🔧 Key Features Implemented

✅ **Project Structure** - Monorepo with Next.js frontend and Node.js backend  
✅ **Database Schema** - PostgreSQL with Prisma ORM  
✅ **Document Parser** - Supports Word, PDF, Excel, Text files  
✅ **ISO Clause Mapping** - Automatic classification using fuzzy matching  
✅ **Versioning System** - Full document version control  
✅ **File Storage** - S3-compatible storage (MinIO for local dev)  
✅ **Audit Trail** - Complete logging of all actions  

## 🔮 Next Steps

- Authentication system (OAuth2 + JWT)
- Frontend components for document upload
- Calendar integration for compliance tasks
- AI agent system with LangChain
- Export engine for audit documentation
- Management review workflows

## 🐛 Troubleshooting

### Database Connection Issues
```bash
# Reset the database
docker-compose down -v
docker-compose up -d
cd backend && npm run prisma:migrate
```

### Port Conflicts
If ports 3000, 3001, 5432, or 9000 are in use, update the configuration in:
- `docker-compose.yml`
- `backend/.env`
- `frontend/.env.local`

### MinIO Access Issues
Access MinIO console at http://localhost:9001 with credentials: `minioadmin/minioadmin`

## 📚 API Documentation

### Health Check
```bash
GET /health
```

### List Artefacts
```bash
GET /api/artefacts
```

### List ISO Clauses
```bash
GET /api/iso-clauses?standard=ISO_9001_2015
```

For detailed API documentation, see the backend source code or use a tool like Postman with the provided endpoints.