import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart as ReBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import {
  TrendingUp,
  Target,
  Clock,
  Award,
  Brain,
  Zap,
  ChevronRight,
  Calendar,
} from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Card, Badge, StatCard, SectionHeader, ProgressBar, Button } from '../components/ui';
import api from '../services/api';

const weeklyData = [
  { day: 'Mon', hours: 2.5, score: 75 },
  { day: 'Tue', hours: 3.2, score: 82 },
  { day: 'Wed', hours: 1.8, score: 68 },
  { day: 'Thu', hours: 4.0, score: 88 },
  { day: 'Fri', hours: 2.9, score: 79 },
  { day: 'Sat', hours: 5.1, score: 92 },
  { day: 'Sun', hours: 3.5, score: 85 },
];

const accuracyData = [
  { name: 'Correct', value: 87, color: '#10b981' },
  { name: 'Incorrect', value: 13, color: '#ef4444' },
];

const topicPerformance = [
  { topic: 'Neural Networks', score: 85 },
  { topic: 'Data Structures', score: 92 },
  { topic: 'Biology', score: 78 },
  { topic: 'Physics', score: 65 },
  { topic: 'Chemistry', score: 72 },
];

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

export const AnalyticsPage = () => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      const response = await api.get('/user/dashboard');
      setAnalyticsData(response.data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
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
        {/* Header */}
        <motion.div variants={itemVariants}>
          <SectionHeader
            title="Learning Analytics"
            subtitle="Track your progress and identify areas for improvement"
          />
        </motion.div>

        {/* Stats Row */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Accuracy Rate"
            value={`${analyticsData?.stats?.quiz?.averageScore?.toFixed(0) || 0}%`}
            change="+3% this week"
            icon={Target}
            color="emerald"
            trend="up"
          />
          <StatCard
            title="Study Hours"
            value={`${Math.round((analyticsData?.stats?.learning?.totalStudyTime || 0) / 60)}h`}
            change="12h this week"
            icon={Clock}
            color="blue"
          />
          <StatCard
            title="Current Streak"
            value={`${analyticsData?.stats?.streak || 0} days`}
            change="Keep it up!"
            icon={Zap}
            color="amber"
            trend="up"
          />
          <StatCard
            title="Topics Completed"
            value={analyticsData?.stats?.learning?.completedTopics || 0}
            change={`${analyticsData?.stats?.learning?.totalTopics || 0} total`}
            icon={Award}
            color="purple"
          />
        </motion.div>

        {/* Charts Row 1 */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Weekly Activity Chart */}
          <motion.div variants={itemVariants}>
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">Weekly Activity</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Study hours vs. Quiz scores</p>
                </div>
                <Badge variant="primary">This Week</Badge>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <ReBarChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="day" stroke="#64748b" fontSize={12} />
                    <YAxis stroke="#64748b" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="hours" fill="#6366f1" radius={[4, 4, 0, 0]} name="Hours" />
                  </ReBarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </motion.div>

          {/* Accuracy Donut Chart */}
          <motion.div variants={itemVariants}>
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">Answer Accuracy</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Correct vs. Incorrect responses</p>
                </div>
                <Badge variant="emerald">87% Correct</Badge>
              </div>
              <div className="flex items-center justify-center">
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={accuracyData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {accuracyData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="absolute text-center">
                  <div className="text-3xl font-bold text-slate-900 dark:text-white">87%</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">Accuracy</div>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Topic Performance */}
          <motion.div variants={itemVariants} className="lg:col-span-2">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">Topic Performance</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Average scores by subject</p>
                </div>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <ReBarChart data={topicPerformance} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                    <XAxis type="number" domain={[0, 100]} stroke="#64748b" fontSize={12} />
                    <YAxis dataKey="topic" type="category" width={120} stroke="#64748b" fontSize={12} />
                    <Tooltip />
                    <Bar dataKey="score" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                  </ReBarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </motion.div>

          {/* Study Streak */}
          <motion.div variants={itemVariants}>
            <Card className="p-6">
              <div className="text-center mb-6">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
                  <Zap className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{learningStats.studyStreak} Days</h3>
                <p className="text-slate-500 dark:text-slate-400">Current Streak</p>
              </div>

              <div className="space-y-3">
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium ${
                      index < 5 ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    }`}>
                      {index < 5 ? '✓' : day}
                    </div>
                    <div className="flex-1">
                      <div className={`h-2 rounded-full ${index < 5 ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}`} style={{ width: index < 5 ? '100%' : '0%' }} />
                    </div>
                    <span className="text-sm text-slate-500">{index < 5 ? '2h' : '-'}</span>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                <p className="text-sm text-amber-800 dark:text-amber-300 text-center">
                  🔥 Keep studying to maintain your streak!
                </p>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Strengths & Weaknesses */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Strong Topics */}
          <motion.div variants={itemVariants}>
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">Strong Topics</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Keep up the good work!</p>
                </div>
              </div>
              <div className="space-y-4">
                {strongTopics.map((topic, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-lg">
                      {['🧠', '🧬', '📐'][index]}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-slate-900 dark:text-white">{topic.name}</span>
                        <Badge variant="emerald">{topic.score}%</Badge>
                      </div>
                      <ProgressBar progress={topic.score} color="emerald" />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>

          {/* Weak Topics */}
          <motion.div variants={itemVariants}>
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <Brain className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">Areas to Improve</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Focus on these topics</p>
                </div>
              </div>
              <div className="space-y-4">
                {weakTopics.map((topic, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-lg">
                      {['📊', '⚗️', '⚛️'][index]}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-slate-900 dark:text-white">{topic.name}</span>
                        <Badge variant="amber">{topic.score}%</Badge>
                      </div>
                      <ProgressBar progress={topic.score} color="amber" />
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="secondary" fullWidth className="mt-6" icon={ChevronRight}>
                Start Revision
              </Button>
            </Card>
          </motion.div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
};
