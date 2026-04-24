import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  User as UserIcon, 
  Mail, 
  Calendar, 
  Award, 
  Clock, 
  BookOpen, 
  Edit3, 
  Camera, 
  MapPin, 
  Link as LinkIcon, 
  ChevronRight, 
  Trophy, 
  Star,
  GraduationCap,
  Briefcase,
  Save,
  X,
  UserCircle,
  Flame,
  Target,
  Zap,
  BarChart3
} from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Card, Button, Badge, ProgressBar, SectionHeader } from '../components/ui';
import { useInsightStore } from '../stores/insightStore';
import api from '../services/api';
import toast from 'react-hot-toast';

export const ProfilePage = () => {
  const { user, setUser } = useInsightStore();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    age: user?.age || '',
    gender: user?.gender || 'prefer not to say',
    bio: user?.bio || '',
    educationLevel: user?.education?.level || 'school',
    schoolClass: user?.education?.schoolDetails?.class || '',
    schoolStream: user?.education?.schoolDetails?.stream || 'none',
    collegeDegree: user?.education?.collegeDetails?.degree || '',
    collegeYear: user?.education?.collegeDetails?.year || '',
    interests: user?.interests?.join(', ') || ''
  });

  const [certificates, setCertificates] = useState([]);
  const [stats, setStats] = useState({
    totalStudyTime: 0,
    totalTopics: 0,
    accuracy: 0,
    certificates: 0,
    streak: 0
  });

  useEffect(() => {
    fetchProfileData();
    // Sync form data with user store if it changes
    if (user) {
      setFormData({
        fullName: user.fullName || '',
        age: user.age || '',
        gender: user.gender || 'prefer not to say',
        bio: user.bio || '',
        educationLevel: user.education?.level || 'school',
        schoolClass: user.education?.schoolDetails?.class || '',
        schoolStream: user.education?.schoolDetails?.stream || 'none',
        collegeDegree: user.education?.collegeDetails?.degree || '',
        collegeYear: user.education?.collegeDetails?.year || '',
        interests: user.interests?.join(', ') || ''
      });
    }
  }, [user]);

  const fetchProfileData = async () => {
    try {
      const [certsResponse, dashboardResponse] = await Promise.all([
        api.get('/certificates'),
        api.get('/user/dashboard')
      ]);
      
      setCertificates(certsResponse.data.recentCertificates || []);
      setStats({
        totalStudyTime: Math.round(dashboardResponse.data?.stats?.learning?.totalStudyTime || 0),
        totalTopics: dashboardResponse.data?.stats?.learning?.totalTopics || 0,
        accuracy: dashboardResponse.data?.stats?.quiz?.averageScore?.toFixed(0) || 0,
        certificates: certsResponse.data.recentCertificates?.length || 0,
        streak: dashboardResponse.data?.stats?.streak || 0
      });
    } catch (error) {
      console.error('Failed to fetch profile data:', error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await api.put('/user/profile', {
        ...formData,
        interests: formData.interests.split(',').map(i => i.trim()).filter(i => i !== '')
      });
      
      if (response.data.success) {
        setUser(response.data.user);
        toast.success('Profile updated successfully!');
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Update profile error:', error);
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Profile Header Card */}
        <Card className="overflow-hidden border-none shadow-xl bg-white dark:bg-slate-900">
          <div className="h-40 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 relative">
            <div className="absolute inset-0 bg-black/10" />
          </div>
          
          <div className="px-8 pb-8">
            <div className="flex flex-col md:flex-row md:items-end -mt-16 mb-6 gap-6">
              <div className="relative group">
                <div className="w-32 h-32 rounded-3xl bg-white dark:bg-slate-800 border-8 border-white dark:border-slate-800 shadow-2xl overflow-hidden">
                  <img
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username || 'Guest'}`}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                </div>
                <button className="absolute bottom-2 right-2 w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg hover:bg-indigo-700 transition-all hover:scale-110">
                  <Camera className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                      {user?.fullName || user?.username || 'Learner'}
                    </h1>
                    <div className="flex items-center gap-2 mt-1 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-widest">
                      <Mail className="w-3 h-3" /> {user?.email}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="purple" className="px-4 py-1.5 rounded-full font-black text-[10px] uppercase tracking-widest">
                      {user?.education?.level || 'Student'}
                    </Badge>
                    <Badge variant="amber" className="px-4 py-1.5 rounded-full font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
                      <Flame className="w-3.5 h-3.5" />
                      {stats.streak} Day Streak
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-8 pt-6 border-t border-slate-100 dark:border-slate-800">
              <div className="md:col-span-2 space-y-6">
                {isEditing ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Full Name</label>
                        <input
                          type="text"
                          name="fullName"
                          value={formData.fullName}
                          onChange={handleChange}
                          className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 outline-none focus:border-indigo-500 transition-all"
                          placeholder="Your Name"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Age</label>
                        <input
                          type="number"
                          name="age"
                          value={formData.age}
                          onChange={handleChange}
                          className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 outline-none focus:border-indigo-500 transition-all"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Gender</label>
                        <select
                          name="gender"
                          value={formData.gender}
                          onChange={handleChange}
                          className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 outline-none focus:border-indigo-500 transition-all"
                        >
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                          <option value="prefer not to say">Prefer not to say</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Interests (Comma separated)</label>
                        <input
                          type="text"
                          name="interests"
                          value={formData.interests}
                          onChange={handleChange}
                          className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 outline-none focus:border-indigo-500 transition-all"
                          placeholder="AI, Science, Arts"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Education Level</label>
                      <select
                        name="educationLevel"
                        value={formData.educationLevel}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 outline-none focus:border-indigo-500 transition-all font-bold"
                      >
                        <option value="school">School</option>
                        <option value="college">College / University</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    {formData.educationLevel === 'school' && (
                      <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Class</label>
                          <input
                            type="text"
                            name="schoolClass"
                            value={formData.schoolClass}
                            onChange={handleChange}
                            placeholder="e.g. 11, 12"
                            className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 outline-none focus:border-indigo-500"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Stream</label>
                          <select
                            name="schoolStream"
                            value={formData.schoolStream}
                            onChange={handleChange}
                            className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 outline-none focus:border-indigo-500"
                          >
                            <option value="none">General</option>
                            <option value="science">Science</option>
                            <option value="arts">Arts</option>
                            <option value="commerce">Commerce</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {formData.educationLevel === 'college' && (
                      <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Degree</label>
                          <input
                            type="text"
                            name="collegeDegree"
                            value={formData.collegeDegree}
                            onChange={handleChange}
                            placeholder="e.g. B.Tech, MBA"
                            className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 outline-none focus:border-indigo-500"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Year</label>
                          <input
                            type="text"
                            name="collegeYear"
                            value={formData.collegeYear}
                            onChange={handleChange}
                            placeholder="e.g. 1st Year, Final Year"
                            className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 outline-none focus:border-indigo-500"
                          />
                        </div>
                      </div>
                    )}

                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Bio</label>
                      <textarea
                        name="bio"
                        value={formData.bio}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 outline-none focus:border-indigo-500 transition-all h-24 resize-none"
                        placeholder="Tell us about yourself..."
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Bio</h3>
                      <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                        {user?.bio || 'No bio yet. Tell us about your learning journey!'}
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Personal</h3>
                        <div className="space-y-3">
                          <div className="flex items-center gap-3 text-sm font-bold text-slate-600 dark:text-slate-400">
                            <UserCircle className="w-4 h-4 text-indigo-500" />
                            {user?.age ? `${user.age} Years old` : 'Age not set'}
                          </div>
                          <div className="flex items-center gap-3 text-sm font-bold text-slate-600 dark:text-slate-400 capitalize">
                            <Star className="w-4 h-4 text-indigo-500" />
                            {user?.gender || 'Gender not set'}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Education</h3>
                        <div className="space-y-3">
                          <div className="flex items-center gap-3 text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-tight">
                            <GraduationCap className="w-4 h-4 text-indigo-500" />
                            {user?.education?.level === 'school' ? (
                              `Class ${user.education?.schoolDetails?.class || '?'} • ${user.education?.schoolDetails?.stream || 'General'}`
                            ) : user?.education?.level === 'college' ? (
                              `${user.education?.collegeDetails?.degree || '?'} • ${user.education?.collegeDetails?.year || '?'}`
                            ) : 'Not specified'}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Interests</h3>
                      <div className="flex flex-wrap gap-2">
                        {user?.interests?.length > 0 ? (
                          user.interests.map((interest, i) => (
                            <Badge key={i} variant="secondary" className="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-slate-100 dark:bg-slate-800 border-none">
                              {interest}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs font-bold text-slate-400 italic">No interests added</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex flex-col gap-4">
                {isEditing ? (
                  <div className="flex flex-col gap-3">
                    <Button
                      variant="primary"
                      className="w-full py-4 rounded-2xl font-black uppercase tracking-[0.2em] shadow-lg shadow-indigo-200"
                      icon={Save}
                      onClick={handleSave}
                      loading={loading}
                    >
                      Save Changes
                    </Button>
                    <Button
                      variant="secondary"
                      className="w-full py-4 rounded-2xl font-black uppercase tracking-[0.2em]"
                      icon={X}
                      onClick={() => setIsEditing(false)}
                      disabled={loading}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="primary"
                    className="w-full py-4 rounded-2xl font-black uppercase tracking-[0.2em] shadow-lg shadow-indigo-200"
                    icon={Edit3}
                    onClick={() => setIsEditing(true)}
                  >
                    Edit Profile
                  </Button>
                )}

                <Card className="p-6 bg-slate-50 dark:bg-slate-800/30 border-dashed border-2 border-slate-200 dark:border-slate-700">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Account Stats</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500 uppercase">Joined</span>
                      <span className="text-xs font-black text-slate-900 dark:text-white">
                        {new Date(user?.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-6 text-center border-none shadow-md hover:shadow-xl transition-all group bg-white dark:bg-slate-900">
            <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Clock className="w-6 h-6 text-indigo-600" />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {stats.totalStudyTime < 60 ? `${stats.totalStudyTime}m` : `${Math.floor(stats.totalStudyTime/60)}h ${stats.totalStudyTime%60}m`}
            </div>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Study Time</div>
          </Card>
          <Card className="p-6 text-center border-none shadow-md hover:shadow-xl transition-all group bg-white dark:bg-slate-900">
            <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
              <BookOpen className="w-6 h-6 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{stats.totalTopics}</div>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Topics</div>
          </Card>
          <Card className="p-6 text-center border-none shadow-md hover:shadow-xl transition-all group bg-white dark:bg-slate-900">
            <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Target className="w-6 h-6 text-amber-600" />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{stats.accuracy}%</div>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Accuracy</div>
          </Card>
          <Card className="p-6 text-center border-none shadow-md hover:shadow-xl transition-all group bg-white dark:bg-slate-900">
            <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Trophy className="w-6 h-6 text-purple-600" />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{stats.certificates}</div>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Badges</div>
          </Card>
        </div>

        {/* Detailed Activity & Achievements */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Learning Insights */}
          <Card className="p-6 bg-white dark:bg-slate-900 border-none shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-900/30">
                <BarChart3 className="w-5 h-5 text-indigo-600" />
              </div>
              <h3 className="font-black text-slate-900 dark:text-white uppercase text-xs tracking-widest">Learning Insights</h3>
            </div>
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-tight">Current Focus</span>
                </div>
                <span className="text-xs font-black text-indigo-600 uppercase tracking-widest">
                  {user?.interests?.[0] || 'Exploring Topics'}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl border-2 border-slate-50 dark:border-slate-800">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Quizzes</p>
                  <p className="text-xl font-black text-slate-900 dark:text-white">{stats.totalAttempts || 0}</p>
                </div>
                <div className="p-4 rounded-2xl border-2 border-slate-50 dark:border-slate-800">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Streak Power</p>
                  <p className="text-xl font-black text-slate-900 dark:text-white">{stats.streak}x</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Achievement Badges */}
          <Card className="p-6 bg-white dark:bg-slate-900 border-none shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/30">
                <Star className="w-5 h-5 text-amber-600" />
              </div>
              <h3 className="font-black text-slate-900 dark:text-white uppercase text-xs tracking-widest">Unlocked Badges</h3>
            </div>
            <div className="grid grid-cols-4 gap-4">
              {[
                { icon: Zap, label: 'Fast Learner', color: 'text-amber-500', bg: 'bg-amber-50', active: true },
                { icon: Target, label: 'Sniper', color: 'text-emerald-500', bg: 'bg-emerald-50', active: stats.accuracy >= 80 },
                { icon: Clock, label: 'Early Bird', color: 'text-indigo-500', bg: 'bg-indigo-50', active: true },
                { icon: Trophy, label: 'Champion', color: 'text-purple-500', bg: 'bg-purple-50', active: stats.certificates > 0 },
              ].map((badge, i) => (
                <div key={i} className={`flex flex-col items-center gap-2 ${badge.active ? 'opacity-100' : 'opacity-20 grayscale'}`}>
                  <div className={`w-12 h-12 rounded-2xl ${badge.bg} dark:bg-slate-800 flex items-center justify-center shadow-sm`}>
                    <badge.icon className={`w-6 h-6 ${badge.color}`} />
                  </div>
                  <span className="text-[8px] font-black text-slate-500 uppercase text-center">{badge.label}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Certificates Section */}
        {certificates.length > 0 && (
          <motion.div variants={itemVariants}>
            <SectionHeader
              title="Recent Certificates"
              subtitle="Proof of your expertise"
            />
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {certificates.map((cert) => (
                <Card key={cert._id} className="p-5 border-none shadow-lg hover:shadow-2xl transition-all bg-white dark:bg-slate-900 group">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 group-hover:rotate-12 transition-transform">
                      <Award className="w-8 h-8 text-indigo-600" />
                    </div>
                    <Badge variant="emerald" className="px-3 py-1 font-black text-[10px]">
                      {cert.score}% SCORE
                    </Badge>
                  </div>
                  <h4 className="font-black text-slate-900 dark:text-white mb-1 uppercase tracking-tight truncate">
                    {cert.topic}
                  </h4>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Earned on {new Date(cert.issueDate).toLocaleDateString()}
                  </p>
                </Card>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
};
