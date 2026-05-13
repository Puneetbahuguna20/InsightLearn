import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart as ReBarChart, 
  Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, LineChart, Line, AreaChart, Area 
} from 'recharts';
import {
  Users,
  Search,
  BookOpen,
  TrendingUp,
  Activity,
  User,
  Calendar,
  Clock,
  ArrowRight,
  GraduationCap,
  Heart,
  Target,
  Zap
} from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Card, Badge, StatCard, SectionHeader, Button } from '../components/ui';
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

export const AdminAnalyticsPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    fetchAdminAnalytics();
  }, []);

  const fetchAdminAnalytics = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/analytics');
      if (response.data.success) {
        setData(response.data.data);
      } else {
        setError('Failed to load analytics data');
      }
    } catch (err) {
      console.error('Error fetching admin analytics:', err);
      setError(err.response?.data?.message || 'Unauthorized access to analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-500 animate-pulse">Loading Admin Insights...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Card className="p-8 text-center max-w-md">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Activity className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h2>
            <p className="text-slate-500 mb-6">{error}</p>
            <Button onClick={() => window.location.href = '/dashboard'}>Return to Dashboard</Button>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const { stats, users, dailyActivity, topTopics } = data;

  return (
    <DashboardLayout>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="space-y-8"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <SectionHeader
            title="Platform Analytics"
            subtitle="Overview of user activity and system performance"
          />
          <div className="flex items-center space-x-2 text-sm text-slate-500 bg-white dark:bg-slate-900 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
            <Calendar className="w-4 h-4" />
            <span>Last 7 Days</span>
          </div>
        </motion.div>

        {/* User Details Modal */}
        {selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-800"
            >
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-lg">
                    {selectedUser.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-xl">{selectedUser.username}</h3>
                    <p className="text-sm text-slate-500">{selectedUser.email}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedUser(null)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                >
                  <ArrowRight className="w-6 h-6 rotate-45" />
                </button>
              </div>

              <div className="p-6 space-y-8">
                {/* User Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Total Searches</p>
                    <p className="text-2xl font-bold text-indigo-600">{selectedUser.activity.totalSearches}</p>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Quiz Attempts</p>
                    <p className="text-2xl font-bold text-indigo-600">{selectedUser.activity.totalQuizzes}</p>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Avg Accuracy</p>
                    <p className="text-2xl font-bold text-emerald-600">{selectedUser.accuracy}%</p>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Joined</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{new Date(selectedUser.joinedAt).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  {/* Searched Topics */}
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                      <Search className="w-4 h-4 text-indigo-500" />
                      Searched Topics
                    </h4>
                    <div className="space-y-2">
                      {selectedUser.activity.searchedTopics.length > 0 ? (
                        selectedUser.activity.searchedTopics.map((topic, i) => (
                          <div key={i} className="px-3 py-2 bg-slate-50 dark:bg-slate-800/30 rounded-lg text-sm text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-slate-800">
                            {topic}
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-slate-500 italic">No topics searched yet</p>
                      )}
                    </div>
                  </div>

                  {/* Recent Quizzes */}
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-emerald-500" />
                      Recent Quiz Scores
                    </h4>
                    <div className="space-y-3">
                      {selectedUser.activity.recentQuizzes.length > 0 ? (
                        selectedUser.activity.recentQuizzes.map((quiz, i) => (
                          <div key={i} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/30 rounded-lg border border-slate-100 dark:border-slate-800">
                            <div>
                              <p className="text-sm font-medium text-slate-900 dark:text-white truncate max-w-[120px]">{quiz.topic}</p>
                              <p className="text-[10px] text-slate-500">{new Date(quiz.date).toLocaleDateString()}</p>
                            </div>
                            <Badge variant={quiz.score >= 80 ? 'success' : quiz.score >= 50 ? 'primary' : 'danger'}>
                              {quiz.score}%
                            </Badge>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-slate-500 italic">No quiz attempts yet</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-slate-100 dark:border-slate-800 text-right">
                <Button onClick={() => setSelectedUser(null)}>Close Details</Button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Top Stats - Enhanced Student Details */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Students"
            value={stats.totalUsers || 0}
            icon={Users}
            color="blue"
            description="Registered learners"
          />
          <StatCard
            title="Total Searches"
            value={stats.totalSearches || 0}
            icon={Search}
            color="purple"
            description="All student searches"
          />
          <StatCard
            title="Total Quizzes"
            value={stats.totalQuizzes || 0}
            icon={BookOpen}
            color="amber"
            description="All quiz attempts"
          />
          <StatCard
            title="Avg. Accuracy"
            value={`${stats.avgAccuracy || 0}%`}
            icon={Activity}
            color="emerald"
            description="Overall quiz performance"
          />
        </motion.div>

        {/* Additional Student Metrics */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            title="Searches per Student"
            value={stats.avgSearchesPerUser || 0}
            icon={TrendingUp}
            color="indigo"
            description="Average searches per student"
          />
          <StatCard
            title="Quizzes per Student"
            value={stats.avgQuizzesPerUser || 0}
            icon={Target}
            color="green"
            description="Average quizzes per student"
          />
          <StatCard
            title="Active Students"
            value={stats.activeUsers || 0}
            icon={Zap}
            color="orange"
            description="Students active in last 7 days"
          />
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Activity Chart */}
          <motion.div variants={itemVariants} className="lg:col-span-2">
            <Card className="p-6 h-full">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">System Engagement</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Daily logins, searches, and quizzes over the last 7 days</p>
                </div>
                <Badge variant="primary">Active</Badge>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyActivity}>
                    <defs>
                      <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis 
                      dataKey="_id" 
                      stroke="#94a3b8" 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false}
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                      }}
                    />
                    <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip 
                      labelFormatter={(value) => new Date(value).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="count" 
                      stroke="#6366f1" 
                      fillOpacity={1} 
                      fill="url(#colorCount)" 
                      strokeWidth={3}
                      name="Quiz Attempts"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </motion.div>

          {/* Top Topics Card */}
          <motion.div variants={itemVariants}>
            <Card className="p-6 h-full flex flex-col">
              <h3 className="font-bold text-slate-900 dark:text-white mb-4">Trending Topics</h3>
              <div className="space-y-6 flex-1">
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Top Searched</h4>
                  <div className="space-y-2">
                    {topTopics?.searched?.length > 0 ? (
                      topTopics.searched.map((topic, i) => (
                        <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                          <span className="text-sm text-slate-700 dark:text-slate-300 truncate max-w-[150px]">{topic._id}</span>
                          <Badge variant="secondary" className="text-[10px]">{topic.count} searches</Badge>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 italic text-center py-2">No searches yet</p>
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Top Quizzes</h4>
                  <div className="space-y-2">
                    {topTopics?.quizzes?.length > 0 ? (
                      topTopics.quizzes.map((topic, i) => (
                        <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/20">
                          <span className="text-sm text-indigo-700 dark:text-indigo-300 truncate max-w-[150px]">{topic._id}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-indigo-600 font-bold">{topic.avgScore.toFixed(0)}% avg</span>
                            <Badge variant="primary" className="text-[10px]">{topic.count}</Badge>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 italic text-center py-2">No quizzes yet</p>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Student Directory */}
        <motion.div variants={itemVariants}>
          <Card className="overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-lg">Student Directory</h3>
                <p className="text-sm text-slate-500">Detailed overview of student performance and activity</p>
              </div>
              <Badge variant="outline">{users.length} Users</Badge>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/50">
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Student</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Education</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Accuracy</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Activity</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {users.map((user) => (
                    <React.Fragment key={user.id}>
                      <tr 
                        className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer ${selectedUser?.id === user.id ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''}`}
                        onClick={() => setSelectedUser(selectedUser?.id === user.id ? null : user)}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm mr-3">
                              {user.username.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900 dark:text-white">{user.username}</div>
                              <div className="text-xs text-slate-500">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-slate-700 dark:text-slate-300 capitalize">
                            {user.education?.level || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-900 dark:text-white">{user.accuracy}%</span>
                            <div className="w-12 h-1 bg-slate-100 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${user.accuracy > 80 ? 'bg-emerald-500' : user.accuracy > 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                                style={{ width: `${user.accuracy}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <Badge variant="secondary" className="text-[10px]">{user.activity.totalQuizzes} Q</Badge>
                            <Badge variant="outline" className="text-[10px]">{user.activity.totalSearches} S</Badge>
                            <Badge variant="primary" className="text-[10px] flex items-center gap-1">
                              <TrendingUp className="w-2.5 h-2.5" /> {user.streak}
                            </Badge>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500">
                          {new Date(user.joinedAt).toLocaleDateString()}
                        </td>
                      </tr>
                      {/* Detailed Info (Shown inline when selected) */}
                      {selectedUser?.id === user.id && (
                        <tr className="bg-slate-50/30 dark:bg-slate-900/20">
                          <td colSpan="5" className="px-6 py-6 border-l-4 border-indigo-500">
                            <motion.div 
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="space-y-8"
                            >
                              {/* Student Profile Info Section */}
                              <div className="grid md:grid-cols-3 gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
                                <div>
                                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <User className="w-3 h-3" /> Personal Info
                                  </h4>
                                  <div className="space-y-1">
                                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{user.fullName || 'No full name'}</p>
                                    <p className="text-xs text-slate-500">{user.age ? `${user.age} years old` : 'Age not specified'} • {user.gender || 'Gender not specified'}</p>
                                    <div className="flex flex-col gap-1 mt-2">
                                      <p className="text-[10px] text-slate-400 flex items-center gap-1">
                                        <Calendar className="w-2.5 h-2.5" /> Joined: {new Date(user.joinedAt).toLocaleDateString()}
                                      </p>
                                      <p className="text-[10px] text-slate-400 flex items-center gap-1">
                                        <Clock className="w-2.5 h-2.5" /> Last Active: {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Never'}
                                      </p>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-2 italic">{user.bio || 'No bio provided'}</p>
                                  </div>
                                </div>
                                <div>
                                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <GraduationCap className="w-3 h-3" /> Education
                                  </h4>
                                  <div className="space-y-1">
                                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 capitalize">{user.education?.level || 'N/A'}</p>
                                    {user.education?.level === 'school' && (
                                      <p className="text-xs text-slate-500">Class {user.education?.schoolDetails?.class || 'N/A'} • {user.education?.schoolDetails?.stream || 'N/A'}</p>
                                    )}
                                    {user.education?.level === 'college' && (
                                      <p className="text-xs text-slate-500">{user.education?.collegeDetails?.degree || 'N/A'} • Year {user.education?.collegeDetails?.year || 'N/A'}</p>
                                    )}
                                  </div>
                                </div>
                                <div>
                                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <Heart className="w-3 h-3" /> Interests
                                  </h4>
                                  <div className="flex flex-wrap gap-1">
                                    {user.interests && user.interests.length > 0 ? (
                                      user.interests.map((interest, i) => (
                                        <span key={i} className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full text-[10px] border border-indigo-100 dark:border-indigo-800">
                                          {interest}
                                        </span>
                                      ))
                                    ) : (
                                      <span className="text-xs text-slate-500 italic">No interests listed</span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Activity Section */}
                              <div className="grid md:grid-cols-2 gap-8">
                                <div>
                                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <Search className="w-3 h-3" /> Recent Searches
                                  </h4>
                                  <div className="flex flex-wrap gap-2">
                                    {user.activity.searchedTopics.length > 0 ? (
                                      user.activity.searchedTopics.map((topic, i) => (
                                        <span key={i} className="px-2 py-1 bg-white dark:bg-slate-800 rounded text-[11px] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                          {topic}
                                        </span>
                                      ))
                                    ) : (
                                      <span className="text-xs text-slate-500 italic">No searches yet</span>
                                    )}
                                  </div>
                                </div>
                                <div>
                                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <BookOpen className="w-3 h-3" /> Recent Quizzes
                                  </h4>
                                  <div className="space-y-2">
                                    {user.activity.recentQuizzes.length > 0 ? (
                                      user.activity.recentQuizzes.map((quiz, i) => (
                                        <div key={i} className="flex items-center justify-between text-xs p-2 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
                                          <span className="font-medium text-slate-700 dark:text-slate-300">{quiz.topic}</span>
                                          <div className="flex items-center gap-3">
                                            <span className="text-slate-400">{new Date(quiz.date).toLocaleDateString()}</span>
                                            <span className={`font-bold ${quiz.score >= 80 ? 'text-emerald-500' : quiz.score >= 50 ? 'text-amber-500' : 'text-red-500'}`}>
                                              {quiz.score}%
                                            </span>
                                          </div>
                                        </div>
                                      ))
                                    ) : (
                                      <p className="text-xs text-slate-500 italic">No quizzes attempted</p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
            {users.length === 0 && (
              <div className="p-12 text-center">
                <p className="text-slate-500 italic">No students found in the database.</p>
              </div>
            )}
          </Card>
        </motion.div>
      </motion.div>
    </DashboardLayout>
  );
};
