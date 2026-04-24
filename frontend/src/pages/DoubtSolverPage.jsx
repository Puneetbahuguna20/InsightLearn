import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Paperclip, Sparkles, Bot, User, Lightbulb, Image, X } from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Card, Button } from '../components/ui';
import api from '../services/api';

const mockAIResponses = [
  "That's a great question! Let me break this down for you...",
  "Think of it like this: imagine you're building with LEGO blocks. Each piece connects in a specific way.",
  "Here's a visual way to understand this concept:",
  "The key thing to remember is that practice makes perfect. Keep at it!",
  "Would you like me to create a diagram to help explain this better?",
];

const suggestedQuestions = [
  "Explain neural networks simply",
  "What is backpropagation?",
  "How does photosynthesis work?",
  "Difference between AI and ML?",
  "Explain quantum entanglement",
];

export const DoubtSolverPage = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'ai',
      content: "Hello! I'm your AI learning assistant. I can help explain complex concepts, answer your questions, and create visual diagrams. What would you like to learn today?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (content = inputValue) => {
    if (!content.trim()) return;

    // Add user message
    const userMessage = {
      id: messages.length + 1,
      type: 'user',
      content,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages([...messages, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Save user message to database
    try {
      await api.post('/chat/message', {
        role: 'user',
        content,
        topic: 'general'
      });
    } catch (error) {
      console.error('Failed to save user message:', error);
    }

    // Simulate AI response
    setTimeout(async () => {
      const randomResponse = mockAIResponses[Math.floor(Math.random() * mockAIResponses.length)];
      const aiMessage = {
        id: messages.length + 2,
        type: 'ai',
        content: randomResponse,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiMessage]);
      setIsTyping(false);
      
      // Save AI response to database
      try {
        await api.post('/chat/message', {
          role: 'assistant',
          content: randomResponse,
          topic: 'general'
        });
      } catch (error) {
        console.error('Failed to save AI message:', error);
      }
    }, 1500);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-8rem)] flex flex-col max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-4 pb-4 border-b border-slate-200 dark:border-slate-700">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              AI Doubt Solver
              <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs rounded-full">
                Online
              </span>
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Ask anything - I'll explain it simply with visuals
            </p>
          </div>
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
          {/* Welcome Suggestions */}
          {messages.length === 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-2 md:grid-cols-3 gap-3"
            >
              {suggestedQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => handleSend(question)}
                  className="p-4 text-left bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 rounded-xl transition-all text-sm text-slate-700 dark:text-slate-300"
                >
                  <Lightbulb className="w-4 h-4 text-amber-500 mb-2" />
                  {question}
                </button>
              ))}
            </motion.div>
          )}

          {/* Chat Messages */}
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`flex gap-4 ${message.type === 'user' ? 'flex-row-reverse' : ''}`}
              >
                {/* Avatar */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  message.type === 'user'
                    ? 'bg-gradient-to-br from-indigo-500 to-purple-500'
                    : 'bg-gradient-to-br from-emerald-500 to-teal-500'
                }`}>
                  {message.type === 'user' ? (
                    <User className="w-5 h-5 text-white" />
                  ) : (
                    <Bot className="w-5 h-5 text-white" />
                  )}
                </div>

                {/* Message Content */}
                <div className={`max-w-[80%] ${message.type === 'user' ? 'text-right' : ''}`}>
                  <div className={`inline-block px-4 py-3 rounded-2xl text-left ${
                    message.type === 'user'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}>
                    <p className="leading-relaxed">{message.content}</p>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {message.timestamp}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Typing Indicator */}
          {isTyping && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-4"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="bg-slate-100 dark:bg-slate-800 px-4 py-3 rounded-2xl">
                <div className="flex gap-1">
                  <motion.div
                    animate={{ y: [0, -5, 0] }}
                    transition={{ repeat: Infinity, duration: 0.6, delay: 0 }}
                    className="w-2 h-2 bg-slate-400 rounded-full"
                  />
                  <motion.div
                    animate={{ y: [0, -5, 0] }}
                    transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }}
                    className="w-2 h-2 bg-slate-400 rounded-full"
                  />
                  <motion.div
                    animate={{ y: [0, -5, 0] }}
                    transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }}
                    className="w-2 h-2 bg-slate-400 rounded-full"
                  />
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
          <div className="flex items-end gap-3 bg-slate-50 dark:bg-slate-800 p-2 rounded-2xl border border-slate-200 dark:border-slate-700 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
            <button className="p-2 text-slate-400 hover:text-indigo-600 transition-colors rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700">
              <Paperclip className="w-5 h-5" />
            </button>
            <button className="p-2 text-slate-400 hover:text-indigo-600 transition-colors rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700">
              <Image className="w-5 h-5" />
            </button>
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything... (e.g., Explain neural networks in simple terms)"
              className="flex-1 bg-transparent border-0 resize-none py-3 px-2 max-h-32 focus:outline-none text-slate-900 dark:text-white placeholder-slate-400"
              rows={1}
              style={{ minHeight: '44px' }}
            />
            <Button
              onClick={() => handleSend()}
              disabled={!inputValue.trim() || isTyping}
              size="sm"
              className="mb-1"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-slate-400 text-center mt-2">
            Press Enter to send, Shift + Enter for new line
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
};
