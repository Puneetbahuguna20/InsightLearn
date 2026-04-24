import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, ChevronLeft, ChevronRight, Check, X, RotateCcw, Trophy, Flame, Search, Activity, Zap, BarChart3, Loader2 } from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Card, Button, Badge, ProgressBar } from '../components/ui';
import api from '../services/api';
import { toast } from 'react-hot-toast';

export const RevisionPage = () => {
  const [revisionState, setRevisionState] = useState('selection'); // selection, loading, active
  const [topTopics, setTopTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [activeTopic, setActiveTopic] = useState(null);
  const [customTopic, setCustomTopic] = useState('');
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [difficulty, setDifficulty] = useState(null);
  const [progress, setProgress] = useState({ easy: 0, hard: 0 });
  const [completed, setCompleted] = useState([]);
  const [flashcards, setFlashcards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isGeneratingMore, setIsGeneratingMore] = useState(false);

  useEffect(() => {
    fetchTopTopics();
  }, []);

  const fetchTopTopics = async () => {
    try {
      const response = await api.get('/search/top-topics');
      if (response.data.success) {
        setTopTopics(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch top topics:', error);
    }
  };

  const startRevision = async (topic = null, refresh = false) => {
    // If refresh, we use the activeTopic first
    const topicToUse = topic || (refresh ? activeTopic : (customTopic.trim() || (selectedTopic ? (selectedTopic.topic || selectedTopic.query) : null)));
    
    if (!topicToUse) {
      toast.error("Please select or enter a topic first!");
      return;
    }

    if (refresh) {
      setIsGeneratingMore(true);
    } else {
      setRevisionState('loading');
      setLoading(true);
    }

    try {
      // 1. Try to fetch existing cards from history/DB first (unless refreshing)
      if (!refresh) {
        const existingResponse = await api.get('/flashcards', {
          params: { topic: topicToUse }
        });

        if (existingResponse.data.success && existingResponse.data.cards.length > 0) {
          // Shuffle before setting
          const shuffled = [...existingResponse.data.cards].sort(() => Math.random() - 0.5);
          setFlashcards(shuffled);
          setRevisionState('active');
          setActiveTopic(topicToUse); // Set active topic here
          setCurrentIndex(0);
          setIsFlipped(false);
          setProgress({ easy: 0, hard: 0 });
          setCompleted([]);
          return;
        }
      }

      // 2. Generate new/more cards
      const response = await api.post('/flashcards/generate', {
        topic: topicToUse,
        count: 10,
        refresh
      });

      if (response.data.success) {
        if (!refresh) {
          // Save to history so it appears in Top Topics
          try {
            await api.post('/search/history', {
              query: topicToUse,
              topic: topicToUse,
              category: 'revision'
            });
          } catch (historyError) {
            console.warn('Failed to update search history:', historyError);
          }
        }

        setFlashcards(response.data.data.flashcards);
        setRevisionState('active');
        setActiveTopic(topicToUse); // Set active topic here
        setCurrentIndex(0);
        setIsFlipped(false);
        setProgress({ easy: 0, hard: 0 });
        setCompleted([]);
        
        if (refresh) {
          toast.success("Added new cards and shuffled the deck!");
        }
      }
    } catch (error) {
      console.error('Failed to fetch flashcards:', error);
      toast.error("Failed to generate revision cards. Please try again.");
      if (!refresh) setRevisionState('selection');
    } finally {
      setLoading(false);
      setIsGeneratingMore(false);
    }
  };

  const currentCard = flashcards[currentIndex];

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleDifficulty = async (level) => {
    setDifficulty(level);
    setProgress({ ...progress, [level]: progress[level] + 1 });
    
    if (!completed.includes(currentIndex)) {
      setCompleted([...completed, currentIndex]);
    }

    // Save review to database
    try {
      const cardId = flashcards[currentIndex]?._id;
      if (cardId) {
        await api.post(`/flashcards/${cardId}/review`, {
          correct: level === 'easy'
        });
      }
    } catch (error) {
      console.error('Failed to save flashcard review:', error);
    }

    setTimeout(() => {
      if (currentIndex < flashcards.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setIsFlipped(false);
        setDifficulty(null);
      }
    }, 500);
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
      setDifficulty(null);
    }
  };

  const handleRestart = () => {
    setRevisionState('selection');
    setSelectedTopic(null);
    setCustomTopic('');
    setCurrentIndex(0);
    setIsFlipped(false);
    setDifficulty(null);
    setProgress({ easy: 0, hard: 0 });
    setCompleted([]);
    fetchTopTopics();
  };

  const progressPercentage = flashcards.length > 0 ? ((currentIndex + 1) / flashcards.length) * 100 : 0;

  if (revisionState === 'selection') {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto space-y-10 pb-20">
          <div className="text-center space-y-4">
            <div className="inline-flex p-3 bg-amber-500 rounded-2xl shadow-xl shadow-amber-200 mb-4">
              <Brain className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
              Smart Revision Mode
            </h1>
            <p className="text-lg text-slate-500 dark:text-slate-400 font-medium">
              Pick a topic or enter your own to generate AI flashcards
            </p>
          </div>

          <div className="space-y-8">
            {/* Custom Topic Input */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 px-2">
                <Search className="w-5 h-5 text-amber-500" />
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Enter Custom Topic</h3>
              </div>
              <div className="relative group">
                <input
                  type="text"
                  value={customTopic}
                  onChange={(e) => {
                    setCustomTopic(e.target.value);
                    if (e.target.value.trim()) setSelectedTopic(null);
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && startRevision()}
                  placeholder="e.g. Quantum Computing, Photosynthesis, Machine Learning..."
                  className="w-full px-8 py-6 rounded-[2rem] bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none transition-all text-lg font-bold placeholder:text-slate-400 dark:text-white"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <Button 
                    onClick={() => startRevision()}
                    className="bg-amber-500 hover:bg-amber-600 py-4 px-6 rounded-2xl font-black uppercase tracking-widest text-xs"
                  >
                    Generate
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 px-2">
                <BarChart3 className="w-5 h-5 text-amber-500" />
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Your Top Topics</h3>
              </div>
              
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                {topTopics.length > 0 ? (
                  topTopics.map((item) => (
                    <motion.div
                      key={item._id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => startRevision(item.topic)}
                      className="cursor-pointer p-6 rounded-[2rem] border-2 bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-amber-200 transition-all group"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-900/30 group-hover:bg-amber-500 transition-colors">
                          <Zap className="w-4 h-4 text-amber-500 group-hover:text-white" />
                        </div>
                        <Badge className="bg-slate-100 text-slate-600">
                          {item.category}
                        </Badge>
                      </div>
                      <h4 className="font-black text-lg truncate text-slate-900 dark:text-white mb-2">
                        {item.topic}
                      </h4>
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Activity className="w-3 h-3" />
                        <span className="text-[10px] font-black uppercase">{item.count} Lessons Learned</span>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="col-span-full p-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2rem] text-center opacity-50">
                    <p className="font-bold text-slate-400 uppercase tracking-widest">No history yet. Type a topic above!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (revisionState === 'loading') {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-40 space-y-6 text-center">
          <div className="relative">
            <Loader2 className="w-20 h-20 text-amber-500 animate-spin" />
            <Brain className="w-10 h-10 text-indigo-400 absolute -top-4 -right-4 animate-pulse" />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase">Preparing Revision...</h2>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">AI is creating personalized flashcards for you</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto pb-20">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-200">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                Revision
              </h1>
              <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest">
                Active Session
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={() => startRevision(null, true)} 
              loading={isGeneratingMore}
              className="text-[10px] font-black uppercase tracking-widest px-3"
              icon={Zap}
            >
              New Cards
            </Button>
            <Button variant="ghost" onClick={handleRestart} className="text-slate-400 hover:text-red-500">
              <RotateCcw className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-8 space-y-4">
          <div className="flex items-center justify-between px-2">
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
              Card {currentIndex + 1} of {flashcards.length}
            </span>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-emerald-600">
                <Check className="w-4 h-4" />
                <span className="text-lg font-black">{progress.easy}</span>
              </div>
              <div className="flex items-center gap-2 text-amber-600">
                <X className="w-4 h-4" />
                <span className="text-lg font-black">{progress.hard}</span>
              </div>
            </div>
          </div>
          <ProgressBar progress={progressPercentage} color="amber" className="h-3 rounded-full shadow-inner" />
        </div>

        {/* Flashcard */}
        <div className="relative h-[450px] mb-12" style={{ perspective: '2000px' }}>
          <motion.div
            className="w-full h-full relative cursor-pointer"
            animate={{ rotateY: isFlipped ? 180 : 0 }}
            transition={{ duration: 0.6, type: 'spring', stiffness: 260, damping: 20 }}
            style={{ transformStyle: 'preserve-3d' }}
            onClick={handleFlip}
          >
            {/* Front */}
            <Card
              className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center border-4 border-slate-50 dark:border-slate-800 shadow-2xl rounded-[3rem]"
              style={{ backfaceVisibility: 'hidden' }}
              hover={false}
              overflow={false}
            >
              <div className="absolute top-8 left-1/2 -translate-x-1/2">
                <Badge className="bg-amber-100 text-amber-700 px-4 py-1 font-black uppercase tracking-widest">
                  {currentCard?.difficulty || 'medium'}
                </Badge>
              </div>
              <h2 className="text-3xl font-black text-slate-900 dark:text-white leading-tight">
                {currentCard?.front}
              </h2>
              <div className="absolute bottom-8 text-slate-400 font-black uppercase tracking-[0.2em] text-[10px] flex items-center gap-2">
                <Zap className="w-3 h-3" />
                Click to reveal answer
              </div>
            </Card>

            {/* Back */}
            <Card
              className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center border-4 border-indigo-500 shadow-2xl rounded-[3rem] bg-indigo-50 dark:bg-indigo-950/30"
              style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
              hover={false}
              overflow={false}
            >
              <div className="absolute top-8 left-1/2 -translate-x-1/2">
                <Badge className="bg-indigo-600 text-white px-4 py-1 font-black uppercase tracking-widest">
                  Correct Answer
                </Badge>
              </div>
              <p className="text-xl font-bold text-slate-800 dark:text-slate-200 leading-relaxed">
                {currentCard?.back}
              </p>
            </Card>
          </motion.div>
        </div>

        {/* Difficulty Buttons */}
        <div className="h-20">
          <AnimatePresence mode="wait">
            {isFlipped && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="grid grid-cols-2 gap-6"
              >
                <Button
                  onClick={() => handleDifficulty('easy')}
                  className="py-8 rounded-[2rem] bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase tracking-[0.2em] shadow-xl shadow-emerald-200"
                >
                  <Check className="w-5 h-5 mr-3" />
                  Easy
                </Button>
                <Button
                  onClick={() => handleDifficulty('hard')}
                  className="py-8 rounded-[2rem] bg-red-500 hover:bg-red-600 text-white font-black uppercase tracking-[0.2em] shadow-xl shadow-red-200"
                >
                  <X className="w-5 h-5 mr-3" />
                  Hard
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-12">
          <Button
            variant="ghost"
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="font-black uppercase tracking-widest text-xs"
            icon={ChevronLeft}
          >
            Prev
          </Button>
          
          <div className="flex items-center gap-2">
            {flashcards.slice(0, 10).map((_, index) => (
              <div
                key={index}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? 'bg-amber-500 w-8'
                    : index < currentIndex
                      ? 'bg-emerald-500'
                      : 'bg-slate-200 dark:bg-slate-700'
                }`}
              />
            ))}
          </div>
          
          <Button
            variant="ghost"
            onClick={() => {
              if (currentIndex < flashcards.length - 1) {
                setCurrentIndex(currentIndex + 1);
                setIsFlipped(false);
                setDifficulty(null);
              }
            }}
            disabled={currentIndex === flashcards.length - 1}
            className="font-black uppercase tracking-widest text-xs"
            icon={ChevronRight}
          >
            Next
          </Button>
        </div>

        {/* Completion Message */}
        {currentIndex === flashcards.length - 1 && isFlipped && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-12 text-center p-10 bg-white dark:bg-slate-900 rounded-[3rem] border-2 border-emerald-100 shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500"></div>
            <Trophy className="w-16 h-16 text-emerald-500 mx-auto mb-6" />
            <h3 className="text-3xl font-black text-slate-900 dark:text-white uppercase mb-2">
              Review Complete!
            </h3>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-sm mb-8">
              You've mastered {progress.easy} concepts today
            </p>
            <Button 
              onClick={handleRestart} 
              className="py-6 px-10 rounded-2xl font-black uppercase tracking-widest bg-slate-900"
              icon={RotateCcw}
            >
              Restart Session
            </Button>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
};
