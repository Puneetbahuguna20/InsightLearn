import { useTranslation } from './LanguageContext';

// Translation service for dynamic content
class TranslationService {
  constructor() {
    this.cache = new Map();
    this.translationQueue = [];
    this.isProcessing = false;
  }

  // Translate text in real-time using multiple translation APIs
  async translateText(text, targetLanguage) {
    if (!text || typeof text !== 'string') return text;
    
    // Check cache first
    const cacheKey = `${text}:${targetLanguage}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    // If same language, return as-is
    if (targetLanguage === 'en') {
      return text;
    }

    // Try multiple translation APIs
    const translationApis = [
      {
        url: 'https://translate.googleapis.com/language/translate/v2',
        method: 'google-translate-free',
        key: 'AIzaSyBDwqF0i7XOqQ9mS8rN6jL5kH4gF3dE2cA' // Free API key
      },
      {
        url: 'https://api.mymemory.translated.net/get',
        method: 'mymemory'
      }
    ];

    for (const api of translationApis) {
      try {
        const result = await this.tryTranslationAPI(text, targetLanguage, api);
        if (result && result !== text) {
          // Cache the result
          this.cache.set(cacheKey, result);
          return result;
        }
      } catch (error) {
        console.warn(`Translation API ${api.method} failed:`, error);
        continue;
      }
    }

    // If all APIs fail, use basic dictionary translation
    const basicResult = this.basicTranslation(text, targetLanguage);
    return basicResult;
  }

  // Try different translation APIs
  async tryTranslationAPI(text, targetLanguage, api) {
    switch (api.method) {
      case 'mymemory':
        return this.tryMyMemoryAPI(text, targetLanguage);
      case 'google-translate-free':
        return this.tryGoogleTranslateAPI(text, targetLanguage);
      default:
        return null;
    }
  }

  // MyMemory API (Free, no CORS issues)
  async tryMyMemoryAPI(text, targetLanguage) {
    try {
      const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${targetLanguage}`);
      if (response.ok) {
        const data = await response.json();
        return data.responseData.translatedText;
      }
    } catch (error) {
      throw new Error('MyMemory API failed');
    }
    return null;
  }

  // Google Translate Free API
  async tryGoogleTranslateAPI(text, targetLanguage) {
    try {
      const response = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLanguage}&dt=t&q=${encodeURIComponent(text)}`);
      if (response.ok) {
        const data = await response.json();
        if (data && data[0] && data[0][0] && data[0][0][0]) {
          return data[0][0][0];
        }
      }
    } catch (error) {
      throw new Error('Google Translate API failed');
    }
    return null;
  }

  // Basic dictionary translation as fallback
  basicTranslation(text, targetLanguage) {
    const basicTranslations = {
      'hi': {
        'What is': 'क्या है',
        'Question': 'प्रश्न',
        'Answer': 'उत्तर',
        'Correct': 'सही',
        'Wrong': 'गलत',
        'Submit': 'जमा करें',
        'Next': 'अगला',
        'Previous': 'पिछला',
        'Score': 'स्कोर',
        'Time': 'समय',
        'Quiz': 'क्विज',
        'Start': 'शुरू',
        'End': 'समाप्त',
        'Loading': 'लोड हो रहा है',
        'Error': 'त्रुटि',
        'Success': 'सफलता',
        'Welcome': 'स्वागत',
        'Dashboard': 'डैशबोर्ड',
        'Learn': 'सीखें',
        'Revision': 'रिवीजन',
        'Profile': 'प्रोफाइल',
        'Settings': 'सेटिंग्स',
        'Logout': 'लॉगआउट',
        'Easy': 'आसान',
        'Medium': 'मध्यम',
        'Hard': 'कठिन',
        'Photosynthesis': 'प्रकाश संश्लेषण',
        'Machine Learning': 'मशीन लर्निंग',
        'Mathematics': 'गणित',
        'Science': 'विज्ञान',
        'History': 'इतिहास',
        'Geography': 'भूगोल',
        'Physics': 'भौतिकी',
        'Chemistry': 'रसायन',
        'Biology': 'जीव विज्ञान',
        'Computer Science': 'कंप्यूटर विज्ञान',
        'Process': 'प्रक्रिया',
        'System': 'प्रणाली',
        'Method': 'विधि',
        'Technique': 'तकनीक',
        'Algorithm': 'एल्गोरिथ्म',
        'Function': 'फलन',
        'Variable': 'चर',
        'Constant': 'अचर',
        'Energy': 'ऊर्जा',
        'Power': 'शक्ति',
        'Force': 'बल',
        'Motion': 'गति',
        'Speed': 'गति',
        'Velocity': 'वेग',
        'Acceleration': 'त्वरण',
        'Mass': 'द्रव्यमान',
        'Weight': 'भार',
        'Temperature': 'तापमान',
        'Heat': 'ऊष्मा',
        'Light': 'प्रकाश',
        'Sound': 'ध्वनि',
        'Electricity': 'विद्युत',
        'Magnetism': 'चुम्बकत्व',
        'Gravity': 'गुरुत्वाकर्षण',
        'Pressure': 'दाब',
        'Density': 'घनत्व',
        'Volume': 'आयतन',
        'Area': 'क्षेत्रफल',
        'Length': 'लंबाई',
        'Width': 'चौड़ाई',
        'Height': 'ऊंचाई',
        'Time': 'समय',
        'Space': 'अंतरिक्ष',
        'Matter': 'पदार्थ',
        'Element': 'तत्व',
        'Compound': 'यौगिक',
        'Molecule': 'अणु',
        'Atom': 'परमाणु',
        'Cell': 'कोशिका',
        'Organism': 'जीव',
        'Plant': 'पौधा',
        'Animal': 'जंतु',
        'Human': 'मनुष्य',
        'Environment': 'पर्यावरण',
        'Nature': 'प्रकृति',
        'Earth': 'पृथ्वी',
        'Water': 'जल',
        'Air': 'वायु',
        'Fire': 'अग्नि',
        'Soil': 'मृदा',
        'the': '',
        'is': 'है',
        'are': 'हैं',
        'and': 'और',
        'or': 'या',
        'but': 'लेकिन',
        'in': 'में',
        'on': 'पर',
        'at': 'पर',
        'to': 'को',
        'for': 'के लिए',
        'of': 'का',
        'with': 'के साथ',
        'by': 'द्वारा',
        'from': 'से',
        'up': 'ऊपर',
        'down': 'नीचे',
        'out': 'बाहर',
        'off': 'बंद',
        'over': 'ऊपर',
        'under': 'नीचे',
        'again': 'फिर से',
        'further': 'आगे',
        'then': 'तब',
        'once': 'एक बार',
        // Scientific Terms
        'Chlorophyll': 'क्लोरोफिल',
        'Water': 'जल',
        'Carbon Dioxide': 'कार्बन डाइऑक्साइड',
        'Light Energy': 'प्रकाश ऊर्जा',
        'Glucose': 'ग्लूकोज',
        'Oxygen': 'ऑक्सीजन',
        // Engine Components
        'Cylinders': 'सिलेंडर',
        'Pistons': 'पिस्टन',
        'Crankshaft': 'क्रैंकशाफ्ट',
        'Camshaft': 'कैमशाफ्ट',
        'Valves': 'वाल्व',
        'Engine': 'इंजन',
        'Car': 'कार',
        'Motor': 'मोटर',
        'Fuel': 'ईंधन',
        'Gasoline': 'पेट्रोल',
        'Diesel': 'डीजल',
        'Combustion': 'दहन',
        'Power': 'शक्ति',
        'Stroke': 'स्ट्रोक',
        'Intake': 'इंटेक',
        'Compression': 'कंप्रेशन',
        'Exhaust': 'एक्जॉस्ट',
        'Spark': 'स्पार्क',
        'Plug': 'प्लग',
        'Oil': 'तेल',
        'Water': 'पानी',
        'Cooling': 'कूलिंग',
        'System': 'सिस्टम',
        'Mechanism': 'तंत्र',
        'Process': 'प्रक्रिया',
        'Function': 'कार्य',
        'Operation': 'ऑपरेशन',
        'Component': 'घटक',
        'Part': 'भाग',
        'Assembly': 'असेंबली',
        'Structure': 'संरचना',
        'Design': 'िजाइन',
        'Working': 'काम करना',
        'How': 'कैसे',
        'Works': 'काम करता है',
        'Internal': 'आंतरिक',
        'External': 'बाहरी'
      },
      'fr': {
        'What is': 'Qu\'est-ce que',
        'Question': 'Question',
        'Answer': 'Réponse',
        'Correct': 'Correct',
        'Wrong': 'Faux',
        'Submit': 'Soumettre',
        'Next': 'Suivant',
        'Previous': 'Précédent',
        'Score': 'Score',
        'Time': 'Temps',
        'Quiz': 'Quiz',
        'Start': 'Commencer',
        'End': 'Fin',
        'Loading': 'Chargement',
        'Error': 'Erreur',
        'Success': 'Succès',
        'Welcome': 'Bienvenue',
        'Dashboard': 'Tableau de bord',
        'Learn': 'Apprendre',
        'Revision': 'Révision',
        'Profile': 'Profil',
        'Settings': 'Paramètres',
        'Logout': 'Déconnexion',
        'Easy': 'Facile',
        'Medium': 'Moyen',
        'Hard': 'Difficile',
        'Photosynthesis': 'Photosynthèse',
        'Machine Learning': 'Apprentissage automatique',
        'Mathematics': 'Mathématiques',
        'Science': 'Science',
        'History': 'Histoire',
        'Geography': 'Géographie',
        'Physics': 'Physique',
        'Chemistry': 'Chimie',
        'Biology': 'Biologie',
        'Computer Science': 'Informatique',
        // Engine Components
        'Cylinders': 'Cylindres',
        'Pistons': 'Pistons',
        'Crankshaft': 'Vilebrequin',
        'Camshaft': 'Arbre à cames',
        'Valves': 'Vannes',
        'Engine': 'Moteur',
        'Car': 'Voiture',
        'Motor': 'Moteur',
        'Fuel': 'Carburant',
        'Gasoline': 'Essence',
        'Diesel': 'Diesel',
        'Combustion': 'Combustion',
        'Power': 'Puissance',
        'Stroke': 'Course',
        'Intake': 'Admission',
        'Compression': 'Compression',
        'Exhaust': 'Échappement',
        'Spark': 'Étincelle',
        'Plug': 'Bougie',
        'Oil': 'Huile',
        'Water': 'Eau',
        'Cooling': 'Refroidissement',
        'System': 'Système',
        'Mechanism': 'Mécanisme',
        'Process': 'Processus',
        'Function': 'Fonction',
        'Operation': 'Opération',
        'Component': 'Composant',
        'Part': 'Partie',
        'Assembly': 'Assemblage',
        'Structure': 'Structure',
        'Design': 'Conception',
        'Working': 'Fonctionnement',
        'How': 'Comment',
        'Works': 'Fonctionne',
        'Internal': 'Interne',
        'External': 'Externe'
      },
      'es': {
        'What is': 'Qué es',
        'Question': 'Pregunta',
        'Answer': 'Respuesta',
        'Correct': 'Correcto',
        'Wrong': 'Incorrecto',
        'Submit': 'Enviar',
        'Next': 'Siguiente',
        'Previous': 'Anterior',
        'Score': 'Puntuación',
        'Time': 'Tiempo',
        'Quiz': 'Cuestionario',
        'Start': 'Comenzar',
        'End': 'Fin',
        'Loading': 'Cargando',
        'Error': 'Error',
        'Success': 'Éxito',
        'Welcome': 'Bienvenido',
        'Dashboard': 'Tablero',
        'Learn': 'Aprender',
        'Revision': 'Revisión',
        'Profile': 'Perfil',
        'Settings': 'Configuración',
        'Logout': 'Cerrar sesión',
        'Easy': 'Fácil',
        'Medium': 'Medio',
        'Hard': 'Difícil',
        'Photosynthesis': 'Fotosíntesis',
        'Machine Learning': 'Aprendizaje automático',
        'Mathematics': 'Matemáticas',
        'Science': 'Ciencia',
        'History': 'Historia',
        'Geography': 'Geografía',
        'Physics': 'Física',
        'Chemistry': 'Química',
        'Biology': 'Biología',
        'Computer Science': 'Ciencias de la computación',
        // Engine Components
        'Cylinders': 'Cilindros',
        'Pistons': 'Pistones',
        'Crankshaft': 'Cigüeñal',
        'Camshaft': 'Árbol de levas',
        'Valves': 'Válvulas',
        'Engine': 'Motor',
        'Car': 'Coche',
        'Motor': 'Motor',
        'Fuel': 'Combustible',
        'Gasoline': 'Gasolina',
        'Diesel': 'Diésel',
        'Combustion': 'Combustión',
        'Power': 'Potencia',
        'Stroke': 'Carrera',
        'Intake': 'Admisión',
        'Compression': 'Compresión',
        'Exhaust': 'Escape',
        'Spark': 'Chispa',
        'Plug': 'Bujía',
        'Oil': 'Aceite',
        'Water': 'Agua',
        'Cooling': 'Refrigeración',
        'System': 'Sistema',
        'Mechanism': 'Mecanismo',
        'Process': 'Proceso',
        'Function': 'Función',
        'Operation': 'Operación',
        'Component': 'Componente',
        'Part': 'Parte',
        'Assembly': 'Ensamblaje',
        'Structure': 'Estructura',
        'Design': 'Diseño',
        'Working': 'Funcionamiento',
        'How': 'Cómo',
        'Works': 'Funciona',
        'Internal': 'Interno',
        'External': 'Externo'
      }
    };

    const translations = basicTranslations[targetLanguage] || {};
    let translatedText = text;

    // Translate word by word
    Object.entries(translations).forEach(([english, translated]) => {
      const regex = new RegExp(`\\b${english}\\b`, 'gi');
      translatedText = translatedText.replace(regex, translated);
    });

    return translatedText;
  }

  // Translate array of texts
  async translateTexts(texts, targetLanguage) {
    if (!Array.isArray(texts)) return texts;
    
    const promises = texts.map(text => this.translateText(text, targetLanguage));
    return Promise.all(promises);
  }

  // Translate quiz questions and options
  async translateQuizData(quizData, targetLanguage) {
    if (!quizData || targetLanguage === 'en') return quizData;

    const translatedQuiz = { ...quizData };
    
    if (quizData.questions) {
      translatedQuiz.questions = await Promise.all(
        quizData.questions.map(async (question) => {
          const translatedQuestion = { ...question };
          
          // Translate question text
          if (question.question) {
            translatedQuestion.question = await this.translateText(question.question, targetLanguage);
          }
          
          // Translate options
          if (question.options && Array.isArray(question.options)) {
            translatedQuestion.options = await this.translateTexts(question.options, targetLanguage);
          }
          
          // Translate explanation
          if (question.explanation) {
            translatedQuestion.explanation = await this.translateText(question.explanation, targetLanguage);
          }
          
          return translatedQuestion;
        })
      );
    }
    
    return translatedQuiz;
  }

  // Translate learning content
  async translateLearningContent(content, targetLanguage) {
    if (!content || targetLanguage === 'en') return content;

    const translatedContent = { ...content };
    
    // Translate steps
    if (content.steps) {
      translatedContent.steps = await Promise.all(
        content.steps.map(async (step) => {
          const translatedStep = { ...step };
          
          if (step.title) {
            translatedStep.title = await this.translateText(step.title, targetLanguage);
          }
          
          if (step.content) {
            translatedStep.content = await this.translateText(step.content, targetLanguage);
          }
          
          if (step.explanation) {
            translatedStep.explanation = await this.translateText(step.explanation, targetLanguage);
          }
          
          return translatedStep;
        })
      );
    }
    
    // Translate main content
    if (content.content) {
      translatedContent.content = await this.translateText(content.content, targetLanguage);
    }

    // Translate introduction
    if (content.introduction) {
      translatedContent.introduction = await this.translateText(content.introduction, targetLanguage);
    }

    // Translate summary
    if (content.summary) {
      translatedContent.summary = await this.translateText(content.summary, targetLanguage);
    }
    
    // Translate examples walkthrough
    if (content.examples && Array.isArray(content.examples)) {
      translatedContent.examples = await Promise.all(
        content.examples.map(async (example) => {
          const translatedExample = { ...example };
          
          if (example.walkthrough && Array.isArray(example.walkthrough)) {
            translatedExample.walkthrough = await this.translateTexts(example.walkthrough, targetLanguage);
          }
          
          if (example.context) {
            translatedExample.context = await this.translateText(example.context, targetLanguage);
          }
          
          return translatedExample;
        })
      );
    }
    
    return translatedContent;
  }

  // Translate flashcards
  async translateFlashcards(flashcards, targetLanguage) {
    if (!Array.isArray(flashcards) || targetLanguage === 'en') return flashcards;

    return Promise.all(
      flashcards.map(async (flashcard) => {
        const translatedFlashcard = { ...flashcard };
        
        if (flashcard.question) {
          translatedFlashcard.question = await this.translateText(flashcard.question, targetLanguage);
        }
        
        if (flashcard.answer) {
          translatedFlashcard.answer = await this.translateText(flashcard.answer, targetLanguage);
        }
        
        if (flashcard.explanation) {
          translatedFlashcard.explanation = await this.translateText(flashcard.explanation, targetLanguage);
        }
        
        return translatedFlashcard;
      })
    );
  }

  // Translate search history
  async translateSearchHistory(history, targetLanguage) {
    if (!Array.isArray(history) || targetLanguage === 'en') return history;

    return Promise.all(
      history.map(async (item) => {
        const translatedItem = { ...item };
        
        if (item.query) {
          translatedItem.query = await this.translateText(item.query, targetLanguage);
        }
        
        if (item.topic) {
          translatedItem.topic = await this.translateText(item.topic, targetLanguage);
        }
        
        return translatedItem;
      })
    );
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
  }
}

// Create singleton instance
const translationService = new TranslationService();

// React hook for translation service
export const useTranslationService = () => {
  const { language } = useTranslation();
  
  return {
    translateText: (text) => translationService.translateText(text, language),
    translateTexts: (texts) => translationService.translateTexts(texts, language),
    translateQuizData: (quizData) => translationService.translateQuizData(quizData, language),
    translateLearningContent: (content) => translationService.translateLearningContent(content, language),
    translateFlashcards: (flashcards) => translationService.translateFlashcards(flashcards, language),
    translateSearchHistory: (history) => translationService.translateSearchHistory(history, language),
    clearCache: () => translationService.clearCache()
  };
};

export default translationService;
