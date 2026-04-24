import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  CheckCircle,
  XCircle,
  ChevronRight,
  RotateCcw,
  Trophy,
  Brain,
  Target,
  BarChart3,
  ArrowLeft,
  Search,
  Zap,
  Activity,
  Loader2,
  CheckCircle2,
  Info,
  History as HistoryIcon
} from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Card, Button, Badge, ProgressBar } from '../components/ui';
import api from '../services/api';
import { toast } from 'react-hot-toast';

export const QuizPage = () => {
  // Quiz State
  const [quizState, setQuizState] = useState('selection'); // selection, loading, active, completed
  const [topTopics, setTopTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [activeTopic, setActiveTopic] = useState(null);
  const [difficulty, setDifficulty] = useState('medium');
  const [questionCount, setQuestionCount] = useState(5);
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [answers, setAnswers] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingMore, setIsGeneratingMore] = useState(false);
  const [forceRefresh, setForceRefresh] = useState(false);

  const [customTopic, setCustomTopic] = useState('');
  
  // Quiz Pool State
  const [existingQuestions, setExistingQuestions] = useState([]);
  const [isPoolLoading, setIsPoolLoading] = useState(false);
  const [showPoolSidebox, setShowPoolSidebox] = useState(false);
  const [newQuestionForm, setNewQuestionForm] = useState({
    question: '',
    options: ['', '', '', ''],
    correctAnswer: 0,
    explanation: '',
    difficulty: 'medium'
  });
  const [isAddingToPool, setIsAddingToPool] = useState(false);

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

  // Fetch existing questions for a topic
  const fetchExistingQuestions = async (topic) => {
    if (!topic) return;
    setIsPoolLoading(true);
    try {
      const response = await api.get('/quiz/pool', {
        params: { topic }
      });
      if (response.data.success) {
        setExistingQuestions(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch existing questions:', error);
    } finally {
      setIsPoolLoading(false);
    }
  };

  const addQuestionToPool = async (e) => {
    e.preventDefault();
    const topicToUse = customTopic.trim() || (selectedTopic ? (selectedTopic.topic || selectedTopic.query) : null);
    
    if (!topicToUse) {
      toast.error("Please select a topic first");
      return;
    }

    if (!newQuestionForm.question || newQuestionForm.options.some(o => !o)) {
      toast.error("Please fill in all question fields");
      return;
    }

    setIsAddingToPool(true);
    try {
      const response = await api.post('/quiz/pool/add', {
        topic: topicToUse,
        ...newQuestionForm
      });
      if (response.data.success) {
        toast.success("Question added to pool!");
        setExistingQuestions([...existingQuestions, response.data.data]);
        setNewQuestionForm({
          question: '',
          options: ['', '', '', ''],
          correctAnswer: 0,
          explanation: '',
          difficulty: 'medium'
        });
      }
    } catch (error) {
      console.error('Failed to add question:', error);
      toast.error("Failed to add question to pool");
    } finally {
      setIsAddingToPool(false);
    }
  };

  // Fetch top topics on mount
  useEffect(() => {
    fetchTopTopics();
  }, []);

  // Update pool when topic changes
  useEffect(() => {
    const topic = customTopic.trim() || (selectedTopic ? (selectedTopic.topic || selectedTopic.query) : null);
    if (topic) {
      fetchExistingQuestions(topic);
    } else {
      setExistingQuestions([]);
    }
  }, [selectedTopic, customTopic]);

  // Timer effect
  useEffect(() => {
    if (quizState === 'active' && timeLeft > 0 && !showResult) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (quizState === 'active' && timeLeft === 0 && !showResult) {
      handleSubmit();
    }
  }, [timeLeft, showResult, quizState]);

  const startQuiz = async (refresh = false) => {
    // If refresh, use activeTopic, otherwise find topic from selection
    const topicToUse = refresh ? activeTopic : (customTopic.trim() || (selectedTopic ? (selectedTopic.topic || selectedTopic.query) : null));
    
    if (!topicToUse) {
      toast.error("Please select or enter a topic first!");
      return;
    }

    const shouldRefresh = refresh || forceRefresh;

    if (refresh) {
      setIsGeneratingMore(true);
    } else {
      setQuizState('loading');
    }

    try {
      const response = await api.post('/quiz/generate', {
        topic: topicToUse,
        difficulty,
        questionCount,
        refresh: shouldRefresh
      });

      if (response.data.success) {
        if (!refresh) {
          // Save to history so it appears in Top Topics
          try {
            await api.post('/search/history', {
              query: topicToUse,
              topic: topicToUse,
              category: 'quiz'
            });
          } catch (historyError) {
            console.warn('Failed to update search history:', historyError);
          }
        }

        setQuestions(response.data.data.questions);
        setQuizState('active');
        setActiveTopic(topicToUse); // Lock topic
        setCurrentQuestion(0);
        setScore(0);
        setTimeLeft(60);
        setAnswers([]);
        // Set selected topic name for display
        setSelectedTopic({ topic: topicToUse });

        if (refresh) {
          toast.success("New questions added and shuffled!");
        }
      }
    } catch (error) {
      console.error('Failed to generate quiz:', error);
      toast.error(error.response?.data?.message || "Failed to generate quiz. Please try again.");
      if (!refresh) setQuizState('selection');
    } finally {
      setIsGeneratingMore(false);
    }
  };

  const handleSelectAnswer = (index) => {
    if (!showResult) {
      setSelectedAnswer(index);
    }
  };

  const handleSubmit = () => {
    const question = questions[currentQuestion];
    const isCorrect = selectedAnswer === question.correctAnswer;
    if (isCorrect) setScore(score + 1);
    
    setAnswers([...answers, {
      question: question.question,
      selected: selectedAnswer,
      correct: question.correctAnswer,
      isCorrect,
      explanation: question.explanation
    }]);
    
    setShowResult(true);
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setShowResult(false);
      setTimeLeft(60);
    } else {
      setQuizState('completed');
      saveQuizResults();
    }
  };

  const saveQuizResults = async () => {
    setIsSaving(true);
    try {
      const accuracy = Math.round((score / questions.length) * 100);
      const answersData = answers.map((ans, idx) => ({
        questionId: `q${idx}`,
        selectedOption: ans.selected !== null ? ans.selected : -1,
        isCorrect: ans.isCorrect
      }));

      await api.post('/quiz/submit', {
        topic: selectedTopic.topic || selectedTopic.query,
        difficulty,
        score: score * 10,
        totalQuestions: questions.length,
        correctAnswers: score,
        timeTaken: (questions.length * 60) - timeLeft,
        answers: answersData,
        accuracy
      });
    } catch (error) {
      console.error('Failed to save quiz results:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRestart = () => {
    setQuizState('selection');
    setSelectedTopic(null);
    setCustomTopic('');
    setSelectedAnswer(null);
    setShowResult(false);
    fetchTopTopics();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // --- Render Views ---

  if (quizState === 'selection') {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto space-y-10 pb-20">
          <div className="text-center space-y-4">
            <div className="inline-flex p-3 bg-indigo-600 rounded-2xl shadow-xl shadow-indigo-200 mb-4">
              <Brain className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
              Adaptive Quiz Generator
            </h1>
            <p className="text-lg text-slate-500 dark:text-slate-400 font-medium">
              Pick a topic from your history to test your knowledge
            </p>
          </div>

          <div className="grid md:grid-cols-12 gap-8">
            {/* Left: Topic Selection */}
            <div className={`space-y-8 transition-all duration-300 ${showPoolSidebox ? 'md:col-span-6' : 'md:col-span-8'}`}>
              {/* Custom Topic Input */}
              <div className="space-y-4">
                <div className="flex justify-between items-center px-2">
                  <div className="flex items-center gap-3">
                    <Search className="w-5 h-5 text-indigo-600" />
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Enter Custom Topic</h3>
                  </div>
                  {(selectedTopic || customTopic.trim()) && (
                    <button 
                      onClick={() => setShowPoolSidebox(!showPoolSidebox)}
                      className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg flex items-center gap-2 transition-all ${
                        showPoolSidebox ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      <HistoryIcon className="w-3.5 h-3.5" />
                      {showPoolSidebox ? 'Close Pool' : 'Question Pool'}
                      {existingQuestions.length > 0 && (
                        <span className={`px-1.5 py-0.5 rounded-md text-[8px] ${showPoolSidebox ? 'bg-white/20' : 'bg-indigo-50 text-indigo-600'}`}>
                          {existingQuestions.length}
                        </span>
                      )}
                    </button>
                  )}
                </div>
                <div className="relative group">
                  <input
                    type="text"
                    value={customTopic}
                    onChange={(e) => {
                      setCustomTopic(e.target.value);
                      if (e.target.value.trim()) setSelectedTopic(null);
                    }}
                    placeholder="e.g. Photosynthesis, Binary Search, Human Heart..."
                    className="w-full px-8 py-6 rounded-[2rem] bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all text-lg font-bold placeholder:text-slate-400 dark:text-white"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl group-focus-within:bg-indigo-600 transition-colors">
                      <Zap className="w-6 h-6 text-indigo-400 group-focus-within:text-white" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 px-2">
                  <BarChart3 className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Top Searched Topics</h3>
                </div>
                
                <div className="grid sm:grid-cols-2 gap-4">
                  {topTopics.length > 0 ? (
                    topTopics.map((item) => (
                      <motion.div
                        key={item._id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setSelectedTopic(item);
                          setCustomTopic('');
                        }}
                        className={`cursor-pointer p-6 rounded-[2rem] border-2 transition-all duration-300 ${
                          selectedTopic?._id === item._id
                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-200'
                            : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-indigo-200'
                        }`}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`p-2 rounded-xl ${selectedTopic?._id === item._id ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-700'}`}>
                            <Search className={`w-4 h-4 ${selectedTopic?._id === item._id ? 'text-white' : 'text-slate-500'}`} />
                          </div>
                          <div className="flex flex-col">
                            <Badge className={selectedTopic?._id === item._id ? 'bg-white/20 text-white' : 'bg-indigo-50 text-indigo-600'}>
                              {item.category}
                            </Badge>
                          </div>
                          <div className="ml-auto flex items-center gap-1.5 px-2 py-1 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-100 dark:border-slate-600">
                            <Activity className={`w-3 h-3 ${selectedTopic?._id === item._id ? 'text-white' : 'text-indigo-400'}`} />
                            <span className={`text-[10px] font-black ${selectedTopic?._id === item._id ? 'text-white' : 'text-slate-500'}`}>
                              {item.count} Searches
                            </span>
                          </div>
                        </div>
                        <h4 className={`font-black text-lg truncate ${selectedTopic?._id === item._id ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                          {item.topic}
                        </h4>
                      </motion.div>
                    ))
                  ) : (
                    <div className="col-span-2 p-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2rem] text-center opacity-50">
                      <p className="font-bold text-slate-400 uppercase tracking-widest">No popular topics yet. Start exploring!</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Middle: Question Pool Sidebox (Optional) */}
            {showPoolSidebox && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="md:col-span-3 space-y-6 max-h-[80vh] overflow-y-auto pr-2"
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-3 px-2">
                    <HistoryIcon className="w-5 h-5 text-indigo-500" />
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Pool</h3>
                  </div>
                  
                  {/* Add New Question Form */}
                  <Card className="p-4 bg-slate-50 dark:bg-slate-800/50 border-dashed border-2 border-slate-200">
                    <form onSubmit={addQuestionToPool} className="space-y-3">
                      <h4 className="text-[10px] font-black uppercase text-slate-400">Add New Question</h4>
                      <input
                        type="text"
                        placeholder="Question text..."
                        className="w-full px-3 py-2 text-xs rounded-lg border dark:bg-slate-700 dark:border-slate-600 outline-none focus:ring-2 focus:ring-indigo-500/20"
                        value={newQuestionForm.question}
                        onChange={(e) => setNewQuestionForm({...newQuestionForm, question: e.target.value})}
                      />
                      <div className="grid grid-cols-2 gap-2">
                        {newQuestionForm.options.map((opt, i) => (
                          <div key={i} className="flex items-center gap-1">
                            <input
                              type="radio"
                              name="correctAnswer"
                              checked={newQuestionForm.correctAnswer === i}
                              onChange={() => setNewQuestionForm({...newQuestionForm, correctAnswer: i})}
                              className="w-3 h-3 text-indigo-600"
                            />
                            <input
                              type="text"
                              placeholder={`Opt ${String.fromCharCode(65+i)}`}
                              className="w-full px-2 py-1 text-[10px] rounded-md border dark:bg-slate-700 dark:border-slate-600 outline-none"
                              value={opt}
                              onChange={(e) => {
                                const newOpts = [...newQuestionForm.options];
                                newOpts[i] = e.target.value;
                                setNewQuestionForm({...newQuestionForm, options: newOpts});
                              }}
                            />
                          </div>
                        ))}
                      </div>
                      <textarea
                        placeholder="Explanation..."
                        className="w-full px-3 py-2 text-[10px] rounded-lg border dark:bg-slate-700 dark:border-slate-600 outline-none h-16"
                        value={newQuestionForm.explanation}
                        onChange={(e) => setNewQuestionForm({...newQuestionForm, explanation: e.target.value})}
                      />
                      <select
                        className="w-full px-2 py-1 text-[10px] rounded-md border dark:bg-slate-700 dark:border-slate-600 outline-none"
                        value={newQuestionForm.difficulty}
                        onChange={(e) => setNewQuestionForm({...newQuestionForm, difficulty: e.target.value})}
                      >
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </select>
                      <Button 
                        type="submit" 
                        size="sm" 
                        className="w-full py-2 text-[10px] font-black uppercase tracking-widest"
                        disabled={isAddingToPool}
                      >
                        {isAddingToPool ? 'Adding...' : 'Add to Pool'}
                      </Button>
                    </form>
                  </Card>

                  {/* Existing Questions List */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black uppercase text-slate-400 px-2">Existing ({existingQuestions.length})</h4>
                    {isPoolLoading ? (
                      <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-indigo-400" /></div>
                    ) : existingQuestions.length > 0 ? (
                      existingQuestions.map((q, idx) => (
                        <div key={idx} className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 space-y-2">
                          <div className="flex justify-between items-start gap-2">
                            <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300 line-clamp-2">{q.question}</p>
                            <Badge className="text-[8px] px-1 py-0">{q.difficulty}</Badge>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-[10px] text-slate-400 text-center py-4 font-bold uppercase tracking-widest italic">No existing questions</p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Right: Difficulty & Start */}
            <div className={`space-y-6 transition-all duration-300 ${showPoolSidebox ? 'md:col-span-3' : 'md:col-span-4'}`}>
              <Card className="p-8 space-y-8 sticky top-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 px-2">
                    <Zap className="w-5 h-5 text-amber-500" />
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Difficulty</h3>
                  </div>
                  <div className="grid gap-3">
                    {['easy', 'medium', 'hard'].map((level) => (
                      <button
                        key={level}
                        onClick={() => setDifficulty(level)}
                        className={`px-6 py-4 rounded-2xl border-2 font-black uppercase tracking-widest text-xs transition-all ${
                          difficulty === level
                            ? 'bg-slate-900 border-slate-900 text-white shadow-lg'
                            : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400 hover:border-slate-200'
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-3">
                      <BarChart3 className="w-5 h-5 text-indigo-500" />
                      <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Questions</h3>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[5, 10, 15].map((count) => (
                      <button
                        key={count}
                        onClick={() => setQuestionCount(count)}
                        className={`py-3 rounded-xl border-2 font-black text-xs transition-all ${
                          questionCount === count
                            ? 'bg-slate-900 border-slate-900 text-white'
                            : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400 hover:border-slate-200'
                        }`}
                      >
                        {count}
                      </button>
                    ))}
                  </div>

                  {/* AI Generation Toggle */}
                  <div 
                    onClick={() => setForceRefresh(!forceRefresh)}
                    className={`mt-4 flex items-center justify-between p-4 rounded-2xl cursor-pointer border-2 transition-all ${
                      forceRefresh 
                        ? 'bg-amber-50 border-amber-200 shadow-inner' 
                        : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${forceRefresh ? 'bg-amber-500' : 'bg-slate-100 dark:bg-slate-700'}`}>
                        <Zap className={`w-4 h-4 ${forceRefresh ? 'text-white' : 'text-slate-400'}`} />
                      </div>
                      <div className="flex flex-col">
                        <span className={`text-[10px] font-black uppercase tracking-widest ${forceRefresh ? 'text-amber-700' : 'text-slate-500'}`}>
                          AI Mode
                        </span>
                        <span className={`text-[8px] font-bold ${forceRefresh ? 'text-amber-600' : 'text-slate-400'}`}>
                          Always generate fresh
                        </span>
                      </div>
                    </div>
                    <div className={`w-10 h-6 rounded-full p-1 transition-all ${forceRefresh ? 'bg-amber-500' : 'bg-slate-200 dark:bg-slate-700'}`}>
                      <motion.div 
                        animate={{ x: forceRefresh ? 16 : 0 }}
                        className="w-4 h-4 bg-white rounded-full shadow-sm"
                      />
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => startQuiz()}
                  disabled={!selectedTopic && !customTopic.trim()}
                  className="w-full py-6 rounded-2xl text-lg font-black uppercase tracking-[0.2em] shadow-xl shadow-indigo-200"
                  icon={ChevronRight}
                >
                  Start Quiz
                </Button>
              </Card>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (quizState === 'loading') {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-40 space-y-6 text-center">
          <div className="relative">
            <Loader2 className="w-20 h-20 text-indigo-600 animate-spin" />
            <Zap className="w-10 h-10 text-amber-400 absolute -top-4 -right-4 animate-pulse" />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase">Analyzing Concept...</h2>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">
              Generating custom questions for {selectedTopic?.topic || selectedTopic?.query || 'selected topic'}
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (quizState === 'completed') {
    const percentage = Math.round((score / questions.length) * 100);
    
    return (
      <DashboardLayout>
        <div className="max-w-3xl mx-auto space-y-8 pb-20">
          <Card className="p-10 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
            
            <div className="w-24 h-24 mx-auto mb-8 rounded-[2rem] bg-indigo-600 flex items-center justify-center shadow-2xl shadow-indigo-200 rotate-3">
              <Trophy className="w-12 h-12 text-white -rotate-3" />
            </div>
            
            <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-2 uppercase tracking-tight">
              Mastery Achieved!
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-sm mb-10">
              You scored {score} out of {questions.length}
            </p>

            <div className="mb-12 space-y-4">
              <div className="text-7xl font-black text-slate-900 dark:text-white tracking-tighter">
                {percentage}%
              </div>
              <div className="max-w-sm mx-auto">
                <ProgressBar progress={percentage} color={percentage >= 70 ? 'emerald' : percentage >= 40 ? 'amber' : 'red'} />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-10">
              <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-700">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Time Spent</div>
                <div className="text-2xl font-black text-slate-900 dark:text-white">{formatTime((questions.length * 60) - timeLeft)}</div>
              </div>
              <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-700">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Difficulty</div>
                <div className="text-2xl font-black text-slate-900 dark:text-white uppercase">{difficulty}</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button onClick={handleRestart} className="py-6 px-10 rounded-2xl font-black uppercase tracking-widest" icon={RotateCcw}>
                New Quiz
              </Button>
              <Button variant="secondary" className="py-6 px-10 rounded-2xl font-black uppercase tracking-widest" icon={BarChart3}>
                Analytics
              </Button>
            </div>
          </Card>

          <div className="space-y-6">
            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight px-4">Review Answers</h3>
            <div className="space-y-4">
              {answers.map((answer, index) => (
                <Card key={index} className={`p-6 border-2 ${
                  answer.isCorrect 
                    ? 'border-emerald-100 bg-emerald-50/30' 
                    : 'border-red-100 bg-red-50/30'
                }`}>
                  <div className="flex gap-4">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                      answer.isCorrect ? 'bg-emerald-500' : 'bg-red-500'
                    }`}>
                      {answer.isCorrect ? <CheckCircle2 className="w-6 h-6 text-white" /> : <XCircle className="w-6 h-6 text-white" />}
                    </div>
                    <div className="space-y-3">
                      <p className="font-bold text-slate-900 dark:text-white leading-relaxed">
                        {answer.question}
                      </p>
                      <div className="flex items-center gap-4 text-sm font-bold uppercase tracking-widest">
                        <span className={answer.isCorrect ? 'text-emerald-600' : 'text-red-600'}>
                          Your Answer: {questions[index].options[answer.selected] || 'Skipped'}
                        </span>
                        {!answer.isCorrect && (
                          <span className="text-emerald-600">
                            Correct: {questions[index].options[answer.correct]}
                          </span>
                        )}
                      </div>
                      <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl text-xs text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-700 flex gap-2">
                        <Info className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                        <span>{answer.explanation}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const question = questions[currentQuestion];

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8 pb-20">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl">
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center">
              <Brain className="w-8 h-8 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
                {selectedTopic?.topic || selectedTopic?.query || 'Custom Topic'}
              </h1>
              <div className="flex items-center gap-4 mt-1">
                <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest px-3">
                  Difficulty: {difficulty}
                </Badge>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Question {currentQuestion + 1} of {questions.length}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-3 px-6 py-3 rounded-2xl border-2 transition-all ${
              timeLeft < 15 ? 'bg-red-50 border-red-200 text-red-600 animate-pulse' : 'bg-slate-50 border-slate-100 text-slate-600'
            }`}>
              <Clock className="w-5 h-5" />
              <span className="text-xl font-black font-mono">{formatTime(timeLeft)}</span>
            </div>
            <Button variant="ghost" onClick={handleRestart} className="text-slate-400 hover:text-red-500">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <ProgressBar 
          progress={((currentQuestion + 1) / questions.length) * 100} 
          color="indigo"
          className="h-3 rounded-full"
        />

        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* Question Column */}
          <div className="lg:col-span-8">
            <Card className="p-10 space-y-10 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
                <Brain className="w-40 h-40" />
              </div>

              <div className="space-y-4 relative z-10">
                <h2 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">
                  {question.question}
                </h2>
              </div>

              <div className="grid gap-4">
                {question.options.map((option, index) => (
                  <motion.button
                    key={index}
                    whileHover={{ scale: 1.01, x: 5 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => handleSelectAnswer(index)}
                    disabled={showResult}
                    className={`w-full p-6 rounded-[1.5rem] text-left border-2 transition-all flex items-center justify-between group ${
                      showResult
                        ? index === question.correctAnswer
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-900'
                          : selectedAnswer === index
                            ? 'bg-red-50 border-red-500 text-red-900'
                            : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 opacity-50'
                        : selectedAnswer === index
                          ? 'bg-indigo-50 border-indigo-500 text-indigo-900'
                          : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-indigo-200'
                    }`}
                  >
                    <span className="font-bold text-lg">{option}</span>
                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                      selectedAnswer === index ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-200 group-hover:border-indigo-400'
                    }`}>
                      {showResult && index === question.correctAnswer ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <span className="text-xs font-black">{String.fromCharCode(65 + index)}</span>
                      )}
                    </div>
                  </motion.button>
                ))}
              </div>

              <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                {!showResult ? (
                  <Button 
                    onClick={handleSubmit} 
                    disabled={selectedAnswer === null}
                    className="px-10 py-6 rounded-2xl font-black uppercase tracking-widest"
                  >
                    Confirm Answer
                  </Button>
                ) : (
                  <Button 
                    onClick={handleNext}
                    className="px-10 py-6 rounded-2xl font-black uppercase tracking-widest bg-slate-900 hover:bg-black"
                    icon={ChevronRight}
                  >
                    {currentQuestion < questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
                  </Button>
                )}
              </div>
            </Card>
          </div>

          {/* Sidebar Info */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="p-8 bg-slate-900 text-white space-y-6">
              <div className="flex items-center gap-3">
                <Target className="w-5 h-5 text-indigo-400" />
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Score Tracker</h3>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-black">{score}</span>
                <span className="text-slate-500 font-bold uppercase tracking-widest text-xs">Points</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <span>Progress</span>
                  <span>{Math.round(((currentQuestion + 1) / questions.length) * 100)}%</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
                    className="h-full bg-indigo-500"
                  />
                </div>
              </div>
            </Card>

            <AnimatePresence>
              {showResult && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                >
                  <Card className={`p-8 border-2 ${
                    answers[answers.length - 1].isCorrect ? 'border-emerald-500 bg-emerald-50/50' : 'border-red-500 bg-red-50/50'
                  }`}>
                    <div className="flex items-center gap-3 mb-4">
                      <Info className={`w-5 h-5 ${answers[answers.length - 1].isCorrect ? 'text-emerald-600' : 'text-red-600'}`} />
                      <h4 className="font-black uppercase tracking-widest text-xs">Explanation</h4>
                    </div>
                    <p className={`text-sm font-medium leading-relaxed ${answers[answers.length - 1].isCorrect ? 'text-emerald-900' : 'text-red-900'}`}>
                      {questions[currentQuestion].explanation}
                    </p>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
