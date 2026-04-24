# InsightLearn - AI-Powered Visual Learning Platform

## 🚀 Project Overview
InsightLearn is a modern, production-ready frontend web application for AI-powered visual learning. Built with React, TypeScript, Tailwind CSS, and modern UI components.

## 📁 Project Structure

```
frontend/src/
├── components/
│   ├── layout/
│   │   ├── Sidebar.jsx
│   │   ├── Navbar.jsx
│   │   ├── DashboardLayout.jsx
│   │   └── index.js
│   └── ui/
│       └── index.jsx (Reusable UI components)
├── pages/
│   ├── LandingPage.jsx
│   ├── LoginPage.jsx
│   ├── RegisterPage.jsx
│   ├── ForgotPasswordPage.jsx
│   ├── DashboardPage.jsx
│   ├── LearnPage.jsx
│   ├── QuizPage.jsx
│   ├── RevisionPage.jsx
│   ├── DoubtSolverPage.jsx
│   ├── AnalyticsPage.jsx
│   ├── ProfilePage.jsx
│   └── index.js
├── stores/
│   └── insightStore.js (Zustand state management)
├── data/
│   └── dummyData.js (Mock data for the app)
└── App.jsx
```

## 🎯 Features Implemented

### 1️⃣ Landing Page
- Hero section with search input
- Feature highlights (AI Diagrams, Smart Quiz, Revision Mode, Doubt Solver, Multi-language)
- Statistics display
- Testimonials section
- Call-to-action sections
- Footer

### 2️⃣ Authentication Pages
- **Login Page**: Email/password login with form validation
- **Register Page**: User registration with password strength indicator
- **Forgot Password Page**: Password reset flow
- Social login buttons (Google placeholder)

### 3️⃣ Dashboard
- Sidebar navigation with all routes
- Top navbar with search, notifications, profile dropdown
- Stats cards (Accuracy, Quizzes, Study Streak, Study Time)
- Continue Learning section
- Recent Topics with progress bars
- Weekly progress chart
- Quick actions

### 4️⃣ Learn Page (Concept Learning)
- Search bar for topics
- AI-generated diagram display
- Clickable labels on diagrams
- Language selector
- Explanation panel with tabs
- Related videos section
- Save and Share buttons

### 5️⃣ Quiz Page
- Topic-based quizzes
- Timer functionality
- MCQ options with visual feedback
- Difficulty selector (Easy/Medium/Hard)
- Score tracking
- Results summary with review

### 6️⃣ Revision Mode
- Flashcard UI with flip animation
- Easy/Hard difficulty tracking
- Progress indicators
- Streak celebration

### 7️⃣ Doubt Solver (AI Chat)
- ChatGPT-like interface
- User and AI message bubbles
- Typing indicators
- Suggested questions
- Image attachment UI

### 8️⃣ Analytics Dashboard
- Weekly activity bar chart
- Accuracy donut chart
- Topic performance horizontal bar chart
- Study streak calendar
- Strong/Weak topics sections
- Stats cards

### 9️⃣ Profile Page
- User avatar and cover image
- Bio and details
- Statistics grid
- Learning progress bar
- Certificates section
- Learning history

## 🛠️ Tech Stack

- **Framework**: React (Vite)
- **Styling**: Tailwind CSS
- **UI Components**: Custom components with shadcn/ui design patterns
- **State Management**: Zustand
- **Animations**: Framer Motion
- **Charts**: Recharts
- **Icons**: Lucide React

## 🎨 Design Features

- Clean, modern SaaS UI
- Soft gradients (indigo, purple, teal)
- Rounded 2xl cards
- Soft shadows
- Smooth animations
- Responsive design (mobile + tablet + desktop)
- Dark mode support

## 🚀 Getting Started

### Install Dependencies
```bash
cd frontend
npm install
```

### Run Development Server
```bash
npm run dev
```

### Build for Production
```bash
npm run build
```

## 📱 Available Routes

- `/` - Landing Page
- `/login` - Login
- `/register` - Register
- `/forgot-password` - Forgot Password
- `/dashboard` - Dashboard Home
- `/learn` - Concept Learning
- `/quiz` - Quiz
- `/revision` - Smart Revision
- `/doubt-solver` - AI Chat
- `/analytics` - Analytics
- `/profile` - Profile

## 📝 Notes

- All data is currently dummy/mock data
- No backend integration yet (can be added later)
- Fully responsive and mobile-friendly
- Dark mode toggle available
- Authentication is simulated with local storage

## 🎉 Project Status

✅ All pages and features completed
✅ Responsive design implemented
✅ Dark mode support added
✅ Animations and transitions added
✅ Ready for development server
