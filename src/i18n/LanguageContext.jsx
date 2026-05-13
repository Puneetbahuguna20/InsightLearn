import React, { createContext, useContext, useState, useEffect } from 'react';

// Language context
const LanguageContext = createContext();

// Available languages
export const LANGUAGES = {
  en: { code: 'en', name: 'English', native: 'English' },
  hi: { code: 'hi', name: 'Hindi', native: 'हिंदी' },
  fr: { code: 'fr', name: 'French', native: 'Français' },
  es: { code: 'es', name: 'Spanish', native: 'Español' },
  bn: { code: 'bn', name: 'Bengali', native: 'বাংলা' },
  gu: { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી' },
  mr: { code: 'mr', name: 'Marathi', native: 'मराठी' },
  ta: { code: 'ta', name: 'Tamil', native: 'தமிழ்' },
  te: { code: 'te', name: 'Telugu', native: 'తెలుగు' },
  kn: { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ' },
  ml: { code: 'ml', name: 'Malayalam', native: 'മലയാളം' },
  pa: { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
  ur: { code: 'ur', name: 'Urdu', native: 'اردو' },
  ar: { code: 'ar', name: 'Arabic', native: 'العربية' },
  zh: { code: 'zh', name: 'Chinese', native: '中文' },
  ja: { code: 'ja', name: 'Japanese', native: '日本語' },
  ko: { code: 'ko', name: 'Korean', native: '한국어' },
  pt: { code: 'pt', name: 'Portuguese', native: 'Português' },
  ru: { code: 'ru', name: 'Russian', native: 'Русский' },
  de: { code: 'de', name: 'German', native: 'Deutsch' },
  it: { code: 'it', name: 'Italian', native: 'Italiano' }
};

// Language provider component
export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    // Get saved language from localStorage or browser language
    const savedLanguage = localStorage.getItem('insight-learn-language');
    if (savedLanguage && LANGUAGES[savedLanguage]) {
      return savedLanguage;
    }
    
    // Fallback to browser language
    const browserLang = navigator.language.split('-')[0];
    return LANGUAGES[browserLang] ? browserLang : 'en';
  });
  
  const [translations, setTranslations] = useState({});
  const [loading, setLoading] = useState(true);

  // Load translations when language changes
  useEffect(() => {
    const loadTranslations = async () => {
      try {
        setLoading(true);
        
        // Try to load the translation file
        let translationData;
        try {
          translationData = await import(`../locales/${language}.json`);
        } catch (error) {
          // Fallback to English if language file not found
          console.warn(`Translation file for ${language} not found, falling back to English`);
          translationData = await import(`../locales/en.json`);
        }
        
        setTranslations(translationData.default);
      } catch (error) {
        console.error('Failed to load translations:', error);
        // Fallback to empty object
        setTranslations({});
      } finally {
        setLoading(false);
      }
    };

    loadTranslations();
  }, [language]);

  // Save language preference to localStorage
  useEffect(() => {
    localStorage.setItem('insight-learn-language', language);
  }, [language]);

  // Translation function
  const t = (key, fallback = key) => {
    if (!key) return fallback;
    
    // Navigate through nested object using dot notation
    const keys = key.split('.');
    let value = translations;
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // Fallback to English if translation not found
        if (language !== 'en') {
          const englishFallback = getEnglishFallback(key);
          return englishFallback || fallback;
        }
        return fallback;
      }
    }
    
    return typeof value === 'string' ? value : fallback;
  };

  // Get English fallback
  const getEnglishFallback = async (key) => {
    try {
      const englishTranslations = await import(`../locales/en.json`);
      const keys = key.split('.');
      let value = englishTranslations.default;
      
      for (const k of keys) {
        if (value && typeof value === 'object' && k in value) {
          value = value[k];
        } else {
          return null;
        }
      }
      
      return typeof value === 'string' ? value : null;
    } catch (error) {
      return null;
    }
  };

  // Change language function
  const changeLanguage = (newLanguage) => {
    if (LANGUAGES[newLanguage]) {
      setLanguage(newLanguage);
    }
  };

  const value = {
    language,
    changeLanguage,
    t,
    translations,
    loading,
    availableLanguages: LANGUAGES
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

// Hook to use language context
export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
};

// Higher-order component for automatic translation
export const withTranslation = (Component) => {
  return function TranslatedComponent(props) {
    const { t, loading } = useTranslation();
    
    if (loading) {
      return <div>Loading translations...</div>;
    }
    
    return <Component {...props} t={t} />;
  };
};

export default LanguageContext;
