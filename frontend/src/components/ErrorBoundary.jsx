import React from 'react';
import { RefreshCcw, AlertCircle } from 'lucide-react';
import { Card, Button } from './ui';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950">
          <Card className="max-w-md w-full p-8 text-center space-y-6 rounded-[2rem] shadow-2xl border-2 border-red-100 dark:border-red-900/20">
            <div className="inline-flex p-4 bg-red-50 dark:bg-red-900/10 rounded-2xl">
              <AlertCircle className="w-10 h-10 text-red-600" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                Application Error
              </h1>
              <p className="text-slate-500 dark:text-slate-400 font-medium">
                Something went wrong while rendering this page.
              </p>
            </div>

            {this.state.error && (
              <div className="p-4 bg-slate-100 dark:bg-slate-800/50 rounded-xl text-left overflow-auto max-h-40">
                <code className="text-xs text-red-600 dark:text-red-400 font-mono break-all">
                  {this.state.error.toString()}
                </code>
              </div>
            )}

            <Button 
              onClick={() => window.location.reload()}
              className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black uppercase tracking-widest text-xs gap-3"
            >
              <RefreshCcw className="w-4 h-4" />
              Reload Page
            </Button>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
