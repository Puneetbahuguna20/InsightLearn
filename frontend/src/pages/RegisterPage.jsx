import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, GraduationCap, Chrome, Check } from 'lucide-react';
import { Button, Card, Input, Badge } from '../components/ui';
import { useInsightStore } from '../stores/insightStore';
import api from '../services/api';

export const RegisterPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    agreeTerms: false,
  });
  const [errors, setErrors] = useState({});

  const navigate = useNavigate();
  const { setUser } = useInsightStore();

  const validate = () => {
    const newErrors = {};
    if (!formData.name || formData.name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    if (!formData.agreeTerms) {
      newErrors.agreeTerms = 'You must agree to the terms';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    
    try {
      // Call backend API
      const response = await api.post('/auth/register', {
        username: formData.name,
        email: formData.email,
        password: formData.password
      });
      
      const { token, user } = response.data;
      
      // Store auth data
      localStorage.setItem('auth_token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Update store
      setUser(user);
      
      setIsLoading(false);
      navigate('/dashboard');
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed. Please try again.';
      setErrors({ submit: message });
      setIsLoading(false);
    }
  };

  const passwordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;
    return strength;
  };

  const strength = passwordStrength(formData.password);
  const strengthLabels = ['Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = ['bg-red-500', 'bg-amber-500', 'bg-blue-500', 'bg-emerald-500'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <GraduationCap className="w-7 h-7 text-white" />
            </div>
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-slate-900 dark:text-white">Create your account</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">Start your AI-powered learning journey today</p>
        </div>

        <Card className="p-8">
          {/* Social Login */}
          <button className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors mb-6">
            <Chrome className="w-5 h-5" />
            Continue with Google
          </button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-700" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400">Or sign up with email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Full Name"
              type="text"
              placeholder="Enter your full name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              error={errors.name}
              icon={User}
            />

            <Input
              label="Email Address"
              type="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              error={errors.email}
              icon={Mail}
            />

            <div>
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Create a strong password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                error={errors.password}
                icon={Lock}
              />
              
              {/* Password Strength */}
              {formData.password && (
                <div className="mt-3">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex-1 flex gap-1">
                      {[...Array(4)].map((_, i) => (
                        <div
                          key={i}
                          className={`h-1.5 flex-1 rounded-full transition-colors ${
                            i < strength ? strengthColors[strength - 1] : 'bg-slate-200 dark:bg-slate-700'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {strength > 0 ? strengthLabels[strength - 1] : ''}
                    </span>
                  </div>
                  <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
                    <li className={`flex items-center gap-1 ${formData.password.length >= 8 ? 'text-emerald-600 dark:text-emerald-400' : ''}`}>
                      <Check className="w-3 h-3" /> At least 8 characters
                    </li>
                    <li className={`flex items-center gap-1 ${/[a-z]/.test(formData.password) && /[A-Z]/.test(formData.password) ? 'text-emerald-600 dark:text-emerald-400' : ''}`}>
                      <Check className="w-3 h-3" /> Upper & lowercase letters
                    </li>
                    <li className={`flex items-center gap-1 ${/\d/.test(formData.password) ? 'text-emerald-600 dark:text-emerald-400' : ''}`}>
                      <Check className="w-3 h-3" /> At least one number
                    </li>
                  </ul>
                </div>
              )}
            </div>

            <div className="flex items-start">
              <input
                type="checkbox"
                id="terms"
                checked={formData.agreeTerms}
                onChange={(e) => setFormData({ ...formData, agreeTerms: e.target.checked })}
                className="w-4 h-4 mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="terms" className="ml-2 text-sm text-slate-600 dark:text-slate-400">
                I agree to the{' '}
                <Link to="#" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link to="#" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700">
                  Privacy Policy
                </Link>
              </label>
            </div>
            {errors.agreeTerms && (
              <p className="text-sm text-red-600 dark:text-red-400">{errors.agreeTerms}</p>
            )}

            <Button type="submit" fullWidth loading={isLoading} icon={ArrowRight}>
              Create Account
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700">
              Sign in
            </Link>
          </p>
        </Card>
      </motion.div>
    </div>
  );
};
