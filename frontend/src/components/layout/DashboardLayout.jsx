import React from 'react';
import { Navigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { useInsightStore } from '../../stores/insightStore';

export const DashboardLayout = ({ children }) => {
  const { sidebarOpen, isAuthenticated } = useInsightStore();

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar />
      <div
        className={`transition-all duration-300 ${
          sidebarOpen ? 'lg:ml-72' : ''
        }`}
      >
        <Navbar />
        <main className="p-4 lg:p-8 min-h-[calc(100vh-4rem)]">
          {children}
        </main>
      </div>
    </div>
  );
};
