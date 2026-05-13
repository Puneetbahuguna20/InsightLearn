import React from 'react';
import { useTranslation } from '../i18n/LanguageContext';

const TestTranslation = () => {
  console.log('TestTranslation component rendering...');
  
  try {
    const { language, changeLanguage, availableLanguages, t } = useTranslation();
    console.log('TestTranslation - useTranslation successful');
    console.log('TestTranslation - language:', language);
    console.log('TestTranslation - availableLanguages count:', Object.keys(availableLanguages).length);
    
    // Test translation function
    const testText = t('dashboard.welcome');
    console.log('TestTranslation - t("dashboard.welcome"):', testText);
    
    return (
      <div style={{
        position: 'fixed',
        top: '10px',
        right: '10px',
        background: 'white',
        border: '2px solid red',
        padding: '10px',
        zIndex: 9999,
        borderRadius: '8px'
      }}>
        <h4>🔍 Translation Test</h4>
        <p><strong>Language:</strong> {language}</p>
        <p><strong>Test Text:</strong> {testText}</p>
        <p><strong>Available:</strong> {Object.keys(availableLanguages).length} languages</p>
        
        <div style={{ marginTop: '10px' }}>
          <button 
            onClick={() => changeLanguage('hi')}
            style={{ margin: '2px', padding: '4px 8px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}
          >
            Hindi
          </button>
          <button 
            onClick={() => changeLanguage('fr')}
            style={{ margin: '2px', padding: '4px 8px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}
          >
            French
          </button>
          <button 
            onClick={() => changeLanguage('en')}
            style={{ margin: '2px', padding: '4px 8px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}
          >
            English
          </button>
        </div>
      </div>
    );
  } catch (error) {
    console.error('TestTranslation - Error:', error);
    return (
      <div style={{
        position: 'fixed',
        top: '10px',
        right: '10px',
        background: '#ffcccc',
        border: '2px solid red',
        padding: '10px',
        zIndex: 9999,
        borderRadius: '8px'
      }}>
        <h4>❌ Translation Error</h4>
        <p><strong>Error:</strong> {error.message}</p>
      </div>
    );
  }
};

export default TestTranslation;
