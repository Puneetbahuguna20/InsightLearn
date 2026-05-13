import React, { useState } from 'react';
import { useTranslation } from '../i18n/LanguageContext';
import { Globe, ChevronDown } from 'lucide-react';

const LanguageSwitcher = () => {
  const { language, changeLanguage, availableLanguages } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const currentLanguage = availableLanguages[language];

  const handleLanguageChange = (langCode) => {
    console.log('Changing language to:', langCode);
    changeLanguage(langCode);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* Language Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
      >
        <Globe className="w-4 h-4 text-slate-600 dark:text-slate-400" />
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {currentLanguage?.native || currentLanguage?.name}
        </span>
        <ChevronDown 
          className={`w-4 h-4 text-slate-400 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Language Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown Menu */}
          <div className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-20 max-h-80 overflow-y-auto">
            <div className="p-2">
              {Object.entries(availableLanguages).map(([code, lang]) => (
                <button
                  key={code}
                  onClick={() => handleLanguageChange(code)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md transition-colors ${
                    language === code
                      ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Language Flag/Icon */}
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 flex items-center justify-center">
                      <span className="text-xs font-bold text-white">
                        {lang.native ? lang.native.charAt(0) : lang.name.charAt(0)}
                      </span>
                    </div>
                    
                    <div className="text-left">
                      <div className="font-medium text-sm">
                        {lang.native || lang.name}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {lang.name}
                      </div>
                    </div>
                  </div>
                  
                  {/* Selected Indicator */}
                  {language === code && (
                    <div className="w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
            
            {/* Footer */}
            <div className="border-t border-slate-200 dark:border-slate-700 p-2">
              <div className="text-xs text-slate-500 dark:text-slate-400 text-center">
                🌍 Select your preferred language
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default LanguageSwitcher;
