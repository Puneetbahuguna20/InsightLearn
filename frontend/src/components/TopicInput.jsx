import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Sparkles, History, TrendingUp, X } from 'lucide-react';
import { useInsightStore } from '../stores/insightStore';

const TopicInput = ({ onSubmit, compact = false }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const { setCurrentQuery, setIsProcessing } = useInsightStore();

  const recentSearches = [
    'How does a car engine work?',
    'What is photosynthesis?',
    'Explain quick sort algorithm',
    'How does photosynthesis work?'
  ];

  const trendingTopics = [
    { topic: 'Machine Learning', queries: 1250 },
    { topic: 'Quantum Physics', queries: 890 },
    { topic: 'Climate Change', queries: 2340 },
    { topic: 'Space Exploration', queries: 1560 }
  ];

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    
    // Generate suggestions based on input
    if (value.length > 2) {
      const newSuggestions = [
        `${value} explained`,
        `How does ${value} work?`,
        `What is ${value}?`,
        `${value} vs similar concepts`
      ];
      setSuggestions(newSuggestions);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsProcessing(true);
    setCurrentQuery(query);
    setShowSuggestions(false);

    if (onSubmit) {
      onSubmit(query);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion);
    setShowSuggestions(false);
    handleSubmit({ preventDefault: () => {} });
  };

  const clearInput = () => {
    setQuery('');
    setShowSuggestions(false);
  };

  return (
    <div className={`w-full ${compact ? '' : 'max-w-3xl mx-auto'}`}>
      {/* Search Input */}
      <form onSubmit={handleSubmit} className="relative">
        <div className={`relative flex items-center bg-white dark:bg-slate-800 border-2 rounded-2xl shadow-lg transition-all duration-300 ${
          isFocused 
            ? 'border-indigo-500 shadow-indigo-500/25' 
            : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300'
        }`}>
          {/* Icon */}
          <div className="pl-6 pr-4">
            {isFocused ? (
              <Sparkles className="w-6 h-6 text-indigo-500 animate-pulse" />
            ) : (
              <Search className="w-6 h-6 text-slate-400" />
            )}
          </div>
          
          {/* Input */}
          <input
            type="text"
            value={query}
            onChange={handleInputChange}
            onFocus={() => {
              setIsFocused(true);
              query.length > 2 && setShowSuggestions(true);
            }}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
            placeholder="Ask anything... (e.g., 'How does a car engine work?')"
            className="flex-1 py-4 pr-32 text-lg font-medium placeholder-slate-400 focus:outline-none bg-transparent text-slate-900 dark:text-white"
          />

          {/* Clear button */}
          {query && (
            <button
              type="button"
              onClick={clearInput}
              className="absolute right-28 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
          )}
          
          {/* Submit button */}
          <motion.button
            type="submit"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="absolute right-3 top-1/2 -translate-y-1/2 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors disabled:bg-slate-300 dark:disabled:bg-slate-700"
            disabled={!query.trim()}
          >
            Learn
          </motion.button>
        </div>

        {/* Suggestions Dropdown */}
        <AnimatePresence>
          {showSuggestions && suggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden z-50"
            >
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full px-4 py-3 text-left text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors flex items-center gap-3"
                >
                  <Search className="w-4 h-4 text-slate-400" />
                  {suggestion}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </form>

      {/* Recent Searches & Trending */}
      {!compact && (
        <div className="mt-6 grid md:grid-cols-2 gap-6">
          {/* Recent Searches */}
          <div>
            <h4 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-2">
              <History className="w-4 h-4" />
              Recent Searches
            </h4>
            <div className="flex flex-wrap gap-2">
              {recentSearches.map((search, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(search)}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full text-sm transition-colors"
                >
                  {search.length > 30 ? search.substring(0, 30) + '...' : search}
                </button>
              ))}
            </div>
          </div>

          {/* Trending Topics */}
          <div>
            <h4 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Trending Topics
            </h4>
            <div className="space-y-2">
              {trendingTopics.map((topic, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(topic.topic)}
                  className="w-full flex items-center justify-between px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-sm transition-colors"
                >
                  <span className="text-slate-700 dark:text-slate-300">{topic.topic}</span>
                  <span className="text-xs text-slate-500">{topic.queries.toLocaleString()} searches</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default TopicInput;
