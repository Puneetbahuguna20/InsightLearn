# VisualLearn

### AI-Powered Visual Learning Platform

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-18+-green?style=for-the-badge" alt="Node.js">
  <img src="https://img.shields.io/badge/React-18+-blue?style=for-the-badge" alt="React">
  <img src="https://img.shields.io/badge/MongoDB-5.0+-green?style=for-the-badge" alt="MongoDB">
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge" alt="License">
</p>

---

## 🎯 About

**VisualLearn** transforms complex educational concepts into interactive learning experiences using AI. Enter any topic and get:

- 📊 **Interactive Flow Diagrams** - Clickable React Flow diagrams with step-by-step explanations
- 🎨 **AI-Generated Visuals** - Custom diagrams created with DALL·E 3
- 📝 **Smart Quizzes** - Adaptive quizzes with difficulty levels
- 🔄 **Spaced Repetition** - Flashcard-based revision system
- 💬 **AI Doubt Solver** - Real-time chat assistance
- 📈 **Progress Analytics** - Track your learning journey

---

## ✨ Features

### Core Features
| Feature | Description |
|---------|-------------|
| **Interactive Diagrams** | React Flow + Dagre-powered hierarchical flowcharts |
| **AI Content Generation** | GPT-4o for structured educational content |
| **Multi-Language** | Support for 8 languages |
| **Quiz System** | Adaptive quizzes with performance tracking |
| **Flashcards** | Spaced repetition revision system |
| **Progress Tracking** | Learning analytics and study streaks |

### Tech Stack
| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite, Tailwind CSS, Zustand, React Flow |
| Backend | Node.js, Express.js, MongoDB (Mongoose) |
| AI Services | OpenAI GPT-4o, DALL·E 3, Groq, Bytez, Pollinations AI |
| Auth | JWT, bcrypt |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB 5.0+ (or MongoDB Atlas)
- OpenAI API Key

### Installation

```bash
# Clone the repository
git clone https://github.com/Puneetbahuguna20/InsightLearn.git
cd InsightLearn

# Backend setup
cd backend
npm install
cp .env.example .env
# Edit .env with your credentials

# Start backend
npm run dev

# Frontend setup (in new terminal)
cd frontend
npm install
npm run dev
```

**Access:**
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8081`

### Environment Variables

**Backend (.env)**
```env
NODE_ENV=development
PORT=8081
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/
OPENAI_API_KEY=sk-...
GROQ_API_KEY=gsk_...
JWT_SECRET=your-secret-key
BYTEZ_API_KEY=your-bytez-key
```

---

## 📁 Project Structure

```
VisualLearn/
├── backend/
│   ├── models/          # Mongoose schemas (User, Content, Quiz, etc.)
│   ├── services/        # AI integration (OpenAI, Groq, Bytez)
│   ├── routes/          # REST API endpoints
│   ├── middleware/       # Auth, rate limiting, error handling
│   └── server.js        # Entry point
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── FlowDiagram.jsx    # Interactive React Flow
│   │   │   ├── LearnPage.jsx       # Main learning interface
│   │   │   └── ...
│   │   ├── pages/       # Application pages
│   │   ├── stores/      # Zustand state management
│   │   └── services/    # API service
│   └── ...
│
├── ARCHITECTURE.md       # System architecture docs
└── README.md
```

---

## 🔌 API Overview

### Main Endpoint - Generate Learning Content

```bash
POST /api/learn/query
Content-Type: application/json

{
  "query": "binary search",
  "language": "en"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "title": "Binary Search Algorithm",
    "type": "algorithm",
    "steps": [...],
    "flowchart": {
      "nodes": [...],
      "edges": [...]
    },
    "example": {...}
  }
}
```

### Other Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/quiz/generate` | Generate quiz questions |
| POST | `/api/progress/update` | Update learning progress |
| GET | `/api/search/history` | Get search history |
| POST | `/api/auth/register` | User registration |

---

## 🎨 Interactive Flow Diagram

The **LearnPage** features a powerful interactive diagram system:

```
┌─────────────────┐
│   Step 1        │  ← Clickable nodes with
│   Start Process │      detailed explanations
└────────┬────────┘
         │ Next
         ▼
┌─────────────────┐
│   Step 2        │
│   Process       │
└────────┬────────┘
         │ Next
         ▼
┌─────────────────┐
│   ✅ Final      │  ← Result node with
│   Outcome       │      summary
└─────────────────┘
```

**Features:**
- 🔗 **Automatic Layout** - Top-to-bottom hierarchical arrangement
- 🖱️ **Interactive** - Click nodes for explanations
- 🔄 **Synchronized** - Syncs with step sidebar
- 🔍 **Zoom & Pan** - Navigate complex diagrams
- 🎯 **Highlighting** - Visual feedback for active steps

---

## 👥 User Journey

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│ Discover │ → │   Learn  │ → │ Practice │ → │  Review  │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
     │               │               │               │
     ▼               ▼               ▼               ▼
 Search or      Interactive    Take topic       Flashcards
 browse         diagrams       quizzes          + Progress
 topics
```

---

## 📊 Dashboard Preview

The 3-column learning interface:

```
┌────────────┬─────────────────────────────┬────────────┐
│   Steps    │      Logic Flow            │ Explanation│
│            │                            │            │
│ [Step 1]   │   ┌─────────────────┐     │ Step 1     │
│ [Step 2]   │   │  Flow Diagram   │     │ Details    │
│ [Step 3]   │   │  (React Flow)   │     │ + Actions  │
│            │   │                 │     │            │
│            │   └─────────────────┘     │            │
└────────────┴─────────────────────────────┴────────────┘
```

---

## 🛠️ Development

```bash
# Run backend
cd backend
npm run dev

# Run frontend
cd frontend
npm run dev

# Lint
cd frontend
npm run lint
```

---

## 🔒 Security

- ✅ JWT Authentication
- ✅ Password Hashing (bcrypt)
- ✅ Rate Limiting
- ✅ Input Validation (Joi)
- ✅ Environment Variables Protection

---

## 📖 Documentation

- [ARCHITECTURE.md](ARCHITECTURE.md) - System architecture
- [backend/README.md](backend/README.md) - API documentation
- [frontend/README.md](frontend/README.md) - Frontend structure

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit: `git commit -m 'Add amazing feature'`
4. Push: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

## 👨‍💻 Author

**Puneet Bahuguna**
- GitHub: [@Puneetbahuguna20](https://github.com/Puneetbahuguna20)

---

## 🙏 Acknowledgments

- [OpenAI](https://openai.com/) - GPT-4 and DALL·E
- [Groq](https://groq.com/) - Fast AI inference
- [MongoDB](https://www.mongodb.com/) - Database
- [React Flow](https://reactflow.dev/) - Interactive diagrams
- [Dagre](https://github.com/dagrejs/dagre) - Graph layout

---

<p align="center">
  <strong>Happy Learning! 🚀</strong>
</p>
