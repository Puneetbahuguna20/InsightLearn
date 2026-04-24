import React from 'react';
import { motion } from 'framer-motion';
import { Globe, Check } from 'lucide-react';
import { useInsightStore } from '../stores/insightStore';

const LanguageSelector = ({ onSelect, showLabel = true }) => {
  const { language, languages, setLanguage } = useInsightStore();

  const handleLanguageChange = (langCode) => {
    setLanguage(langCode);
    if (onSelect) onSelect(langCode);
  };

  const activeLanguage = languages.find(l => l.code === language) || languages[0];

  return (
    <div className="relative">
      {showLabel && (
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          <Globe className="w-4 h-4 inline mr-2" />
          Select Language
        </label>
      )}
      
      <div className="relative">
        <select
          value={language}
          onChange={(e) => handleLanguageChange(e.target.value)}
          className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none cursor-pointer"
        >
          {languages.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.flag} {lang.name}
            </option>
          ))}
        </select>
        
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {showLabel && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-2 text-xs text-slate-500 dark:text-slate-400"
        >
          Content will be generated in {activeLanguage.name}
        </motion.div>
      )}
    </div>
  );
};

export default LanguageSelector;
