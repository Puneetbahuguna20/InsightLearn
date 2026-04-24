import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Target,
  TrendingUp,
  Flame,
  Clock,
  Play,
  BookOpen,
  MoreHorizontal,
  ChevronRight,
} from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Card, Button, Badge, ProgressBar, StatCard, SectionHeader } from '../components/ui';
import { useInsightStore } from '../stores/insightStore';
import api from '../services/api';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export const DashboardPage = () => {
  const { user } = useInsightStore();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const userName = user?.name || 'Guest';
  const firstName = userName.split(' ')[0];

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/user/dashboard');
      setDashboardData(response.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="space-y-8"
      >
        {/* Welcome Header */}
        <motion.div variants={itemVariants} className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              Welcome back, {firstName}! 👋
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Here's your learning progress today
            </p>
          </div>
          <Link to="/learn">
            <Button icon={BookOpen}>
              Start Learning
            </Button>
          </Link>
        </motion.div>

        {/* Stats Grid */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Accuracy Rate"
            value={`${dashboardData?.stats?.quiz?.averageScore?.toFixed(0) || 0}%`}
            change="+5%"
            icon={Target}
            color="emerald"
            trend="up"
          />
          <StatCard
            title="Quizzes Attempted"
            value={dashboardData?.stats?.quiz?.totalAttempts || 0}
            change="+12 this week"
            icon={TrendingUp}
            color="indigo"
            trend="up"
          />
          <StatCard
            title="Study Streak"
            value={`${dashboardData?.stats?.streak || 0} days`}
            change="Keep it up!"
            icon={Flame}
            color="amber"
            trend="up"
          />
          <StatCard
            title="Study Time"
            value={(() => {
              const totalMinutes = Math.round(dashboardData?.stats?.learning?.totalStudyTime || 0);
              if (totalMinutes === 0) return '0m';
              if (totalMinutes < 60) return `${totalMinutes}m`;
              const h = Math.floor(totalMinutes / 60);
              const m = totalMinutes % 60;
              return m > 0 ? `${h}h ${m}m` : `${h}h`;
            })()}
            change="Total"
            icon={Clock}
            color="purple"
          />
        </motion.div>

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content - 2 columns */}
          <div className="lg:col-span-2 space-y-8">
            {/* Continue Learning */}
            <motion.div variants={itemVariants}>
              <SectionHeader
                title="Continue Learning"
                subtitle="Pick up where you left off"
                action={() => {}}
              />
              
              <div className="space-y-4">
                {dashboardData?.recentProgress?.length > 0 ? (
                  dashboardData.recentProgress.slice(0, 2).map((topic, idx) => (
                    <Card key={topic._id || idx} className="p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-4">
                        <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-2xl">
                          {(topic.topic || topic.title || 'L').charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="primary">Learning</Badge>
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              {topic.lastStudied ? new Date(topic.lastStudied).toLocaleDateString() : 'Just now'}
                            </span>
                          </div>
                          <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
                            {topic.topic || topic.title}
                          </h3>
                          <div className="flex items-center gap-3">
                            <div className="flex-1">
                              <ProgressBar progress={topic.progress || 0} color="indigo" />
                            </div>
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                              {topic.progress || 0}%
                            </span>
                          </div>
                        </div>
                        <Link to={`/learn?topic=${encodeURIComponent(topic.topic || topic.title)}`}>
                          <Button variant="secondary" size="sm" icon={Play}>
                            Continue
                          </Button>
                        </Link>
                      </div>
                    </Card>
                  ))
                ) : (
                  <Card className="p-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2rem] text-center opacity-50">
                    <p className="font-bold text-slate-400 uppercase tracking-widest">No active topics. Start learning something new!</p>
                  </Card>
                )}
              </div>
            </motion.div>

            {/* Recent Topics */}
            <motion.div variants={itemVariants}>
              <SectionHeader
                title="Recent Searches"
                subtitle="Your learning journey"
              />
              
              <div className="grid sm:grid-cols-2 gap-4">
                {dashboardData?.recentHistory?.length > 0 ? (
                  dashboardData.recentHistory.map((history, idx) => (
                    <Link key={history._id || idx} to={`/learn?topic=${encodeURIComponent(history.query)}`}>
                      <Card className="overflow-hidden group cursor-pointer hover:shadow-md transition-all">
                        <div className="p-6 space-y-4">
                          <div className="flex items-center justify-between">
                            <Badge variant="primary">
                              {history.category || 'general'}
                            </Badge>
                            <span className="text-[10px] font-black text-slate-400 uppercase">
                              {new Date(history.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors truncate">
                            {history.topic || history.query}
                          </h3>
                          <div className="flex items-center text-xs font-bold text-indigo-600 uppercase tracking-widest">
                            View Content <ChevronRight className="w-3 h-3 ml-1" />
                          </div>
                        </div>
                      </Card>
                    </Link>
                  ))
                ) : (
                  <div className="col-span-2 p-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2rem] text-center opacity-50">
                    <p className="font-bold text-slate-400 uppercase tracking-widest">No recent searches yet.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Sidebar - 1 column */}
          <div className="space-y-8">
            {/* Learning Activity */}
            <motion.div variants={itemVariants}>
              <Card className="p-6">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-4">
                  Learning Summary
                </h3>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">Topics Started</span>
                    <span className="font-bold">{dashboardData?.stats?.learning?.totalTopics || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">Topics Completed</span>
                    <span className="font-bold text-emerald-600">{dashboardData?.stats?.learning?.completedTopics || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">Certificates Earned</span>
                    <span className="font-bold text-indigo-600">{dashboardData?.stats?.certificates || 0}</span>
                  </div>
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                      Keep up the momentum!
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Quick Actions */}
            <motion.div variants={itemVariants}>
              <Card className="p-6">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-4">
                  Quick Actions
                </h3>
                <div className="space-y-3">
                  <Link to="/learn">
                    <Button variant="secondary" fullWidth className="justify-between">
                      <span className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4" />
                        Learn New Topic
                      </span>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Link to="/quiz">
                    <Button variant="secondary" fullWidth className="justify-between">
                      <span className="flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        Take a Quiz
                      </span>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Link to="/revision">
                    <Button variant="secondary" fullWidth className="justify-between">
                      <span className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        Revision Mode
                      </span>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </Card>
            </motion.div>

            {/* Achievements */}
            <motion.div variants={itemVariants}>
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-slate-900 dark:text-white">
                    Achievements
                  </h3>
                  <Badge variant="amber">3 New</Badge>
                </div>
                <div className="space-y-3">
                  {[
                    { name: 'First Steps', desc: 'Complete your first lesson', icon: '🎯' },
                    { name: 'Quiz Master', desc: 'Score 90% on 5 quizzes', icon: '🏆' },
                    { name: 'Streak Keeper', desc: '7-day study streak', icon: '🔥' },
                  ].map((achievement, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl"
                    >
                      <span className="text-2xl">{achievement.icon}</span>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white text-sm">
                          {achievement.name}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {achievement.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
};
