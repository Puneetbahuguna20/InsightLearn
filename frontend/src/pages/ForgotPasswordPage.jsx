import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, CheckCircle, GraduationCap } from 'lucide-react';
import { Button, Card, Input } from '../components/ui';

export const ForgotPasswordPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const validate = () => {
    if (!email) {
      setError('Email is required');
      return false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email');
      return false;
    }
    setError('');
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setIsSubmitted(true);
    }, 1500);
  };

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
          <h1 className="mt-4 text-2xl font-bold text-slate-900 dark:text-white">
            {isSubmitted ? 'Check your email' : 'Reset your password'}
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            {isSubmitted 
              ? `We've sent a password reset link to ${email}` 
              : 'Enter your email address and we\'ll send you a link to reset your password'}
          </p>
        </div>

        <Card className="p-8">
          {isSubmitted ? (
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                Didn't receive the email? Check your spam folder or try again.
              </p>
              <div className="space-y-3">
                <Button 
                  variant="secondary" 
                  fullWidth 
                  onClick={() => setIsSubmitted(false)}
                >
                  Try another email
                </Button>
                <Link to="/login">
                  <Button variant="ghost" fullWidth>
                    Back to sign in
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                label="Email Address"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={error}
                icon={Mail}
              />

              <Button type="submit" fullWidth loading={isLoading}>
                Send Reset Link
              </Button>

              <Link 
                to="/login" 
                className="flex items-center justify-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to sign in
              </Link>
            </form>
          )}
        </Card>
      </motion.div>
    </div>
  );
};
