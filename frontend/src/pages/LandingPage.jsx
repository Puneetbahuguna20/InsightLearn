import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Brain,
  Target,
  RefreshCw,
  MessageCircle,
  Globe,
  ArrowRight,
  Play,
  Sparkles,
  Search,
  GraduationCap,
  Check,
  Star,
  Sun,
  Moon,
} from 'lucide-react';
import { Button, Card, Badge, Input } from '../components/ui';
import { useInsightStore } from '../stores/insightStore';
import { features } from '../data/dummyData';

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

const iconComponents = {
  Brain,
  Target,
  RefreshCw,
  MessageCircle,
  Globe,
};

export const LandingPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { theme, toggleTheme } = useInsightStore();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/learn?topic=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-indigo-50/30 to-white dark:from-slate-950 dark:via-slate-900/50 dark:to-slate-950">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                InsightLearn
              </span>
            </div>
            <div className="hidden md:flex items-center gap-6">
              <a href="#features" className="text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400">Features</a>
              <a href="#how-it-works" className="text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400">How it Works</a>
              <a href="#pricing" className="text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400">Pricing</a>
              
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                {theme === 'light' ? (
                  <Moon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                ) : (
                  <Sun className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                )}
              </button>
              
              <Link to="/login">
                <Button variant="secondary" size="sm">Sign In</Button>
              </Link>
              <Link to="/register">
                <Button size="sm">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="text-center"
          >
            <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 mb-8">
              <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">Powered by Advanced AI</span>
              <Badge variant="purple">NEW</Badge>
            </motion.div>

            <motion.h1
              variants={itemVariants}
              className="text-5xl md:text-7xl font-bold text-slate-900 dark:text-white mb-6 leading-tight"
            >
              Learn Any Concept{' '}
              <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-teal-500 bg-clip-text text-transparent">
                Visually with AI
              </span>
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="text-xl text-slate-600 dark:text-slate-300 mb-10 max-w-3xl mx-auto"
            >
              Transform your learning experience with AI-generated diagrams, smart quizzes, 
              and personalized revision tools. Master any subject faster.
            </motion.p>

            {/* Search Bar */}
            <motion.form
              variants={itemVariants}
              onSubmit={handleSearch}
              className="max-w-2xl mx-auto mb-10"
            >
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="What do you want to learn today? (e.g., Neural Networks, Photosynthesis)"
                  className="w-full pl-14 pr-36 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-lg text-slate-900 dark:text-white placeholder-slate-400 shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
                <Button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                >
                  Learn Now
                </Button>
              </div>
            </motion.form>

            <motion.div variants={itemVariants} className="flex flex-wrap items-center justify-center gap-4">
              <Link to="/register">
                <Button size="lg" icon={ArrowRight}>
                  Get Started Free
                </Button>
              </Link>
              <Button variant="secondary" size="lg" icon={Play}>
                Watch Demo
              </Button>
            </motion.div>

            {/* Stats */}
            <motion.div
              variants={itemVariants}
              className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto"
            >
              {[
                { value: '10K+', label: 'Topics Covered' },
                { value: '50K+', label: 'Active Learners' },
                { value: '1M+', label: 'AI Diagrams Generated' },
                { value: '95%', label: 'Success Rate' },
              ].map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl font-bold text-slate-900 dark:text-white">{stat.value}</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge variant="primary" className="mb-4">Features</Badge>
            <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Everything You Need to Learn Smarter
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
              Our AI-powered platform provides all the tools you need for effective visual learning
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => {
              const Icon = iconComponents[feature.icon];
              return (
                <motion.div
                  key={feature.id}
                  whileHover={{ y: -8 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="p-8 h-full">
                    <div className={`w-14 h-14 rounded-2xl bg-${feature.color}-100 dark:bg-${feature.color}-900/30 flex items-center justify-center mb-6`}>
                      <Icon className={`w-7 h-7 text-${feature.color}-600 dark:text-${feature.color}-400`} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                      {feature.title}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400">
                      {feature.description}
                    </p>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge variant="teal" className="mb-4">How It Works</Badge>
            <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Start Learning in 3 Simple Steps
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Search Any Topic',
                description: 'Enter any concept or subject you want to learn about',
              },
              {
                step: '02',
                title: 'Get AI Visualizations',
                description: 'Our AI generates diagrams and explanations tailored to you',
              },
              {
                step: '03',
                title: 'Practice & Master',
                description: 'Take smart quizzes and use revision tools to cement knowledge',
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="text-center"
              >
                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-2xl font-bold text-white shadow-xl shadow-indigo-500/25">
                  {item.step}
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{item.title}</h3>
                <p className="text-slate-600 dark:text-slate-400">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge variant="amber" className="mb-4">Testimonials</Badge>
            <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Loved by Students Worldwide
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: 'Sarah Chen',
                role: 'Computer Science Student',
                content: 'The AI diagrams helped me understand neural networks in minutes instead of hours. Game changer!',
                rating: 5,
              },
              {
                name: 'Michael Roberts',
                role: 'Medical Student',
                content: 'InsightLearn made anatomy so much easier. The visual explanations are incredibly detailed.',
                rating: 5,
              },
              {
                name: 'Emily Watson',
                role: 'High School Teacher',
                content: 'I recommend this to all my students. The quiz feature helps them practice effectively.',
                rating: 5,
              },
            ].map((testimonial, index) => (
              <Card key={index} className="p-6">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-amber-500 fill-amber-500" />
                  ))}
                </div>
                <p className="text-slate-700 dark:text-slate-300 mb-6">"{testimonial.content}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                    {testimonial.name[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">{testimonial.name}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{testimonial.role}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-teal-500 p-12 md:p-16 text-center"
          >
            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Ready to Transform Your Learning?
              </h2>
              <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
                Join thousands of students already learning smarter with AI-powered visual education
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4">
                <Link to="/register">
                  <Button size="lg" className="bg-white text-indigo-600 hover:bg-white/90">
                    Start Learning Free
                  </Button>
                </Link>
                <div className="flex items-center gap-2 text-white/80">
                  <Check className="w-5 h-5" />
                  <span>No credit card required</span>
                </div>
              </div>
            </div>

            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-full h-full" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
              }} />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8 border-t border-slate-800">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold text-white">InsightLearn</span>
              </div>
              <p className="text-slate-400 text-sm">
                AI-powered visual learning platform helping students master any concept faster.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">For Teams</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Community</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-slate-800 text-center text-slate-400 text-sm">
            © 2024 InsightLearn. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};
