import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useInsightStore } from './stores/insightStore';

// Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { DashboardPage } from './pages/DashboardPage';
import { LearnPage } from './pages/LearnPage';
import { QuizPage } from './pages/QuizPage';
import { RevisionPage } from './pages/RevisionPage';
import { DoubtSolverPage } from './pages/DoubtSolverPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { ProfilePage } from './pages/ProfilePage';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  const { theme } = useInsightStore();

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <ErrorBoundary>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          {/* Protected Dashboard Routes */}
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/learn" element={<LearnPage />} />
          <Route path="/quiz" element={<QuizPage />} />
          <Route path="/revision" element={<RevisionPage />} />
          <Route path="/doubt-solver" element={<DoubtSolverPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Routes>
      </ErrorBoundary>
    </div>
  );
}

export default App;
