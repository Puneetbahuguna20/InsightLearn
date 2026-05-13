# Multi-Language Translation System for Insight Learn

A complete translation system that converts English JSON files to multiple languages using free LibreTranslate API.

## 🚀 Features

- **Free Translation**: Uses LibreTranslate free server (no API keys required)
- **Recursive Translation**: Handles deeply nested JSON objects
- **Smart Caching**: Avoids translating the same text multiple times
- **Rate Limiting**: Built-in delays to avoid API limits
- **Error Handling**: Retry logic with exponential backoff
- **Progress Tracking**: Real-time progress display
- **Multiple Languages**: Support for 20+ languages
- **Structure Preservation**: Maintains exact JSON structure

## 📦 Installation

No dependencies required! Uses only Node.js built-in modules.

```bash
# Check Node.js version (requires 14+)
node --version

# Navigate to your project directory
cd /path/to/insight-learn
```

## 🌍 Supported Languages

| Code | Language | Code | Language |
|------|----------|------|----------|
| hi | Hindi | fr | French |
| es | Spanish | bn | Bengali |
| gu | Gujarati | mr | Marathi |
| ta | Tamil | te | Telugu |
| kn | Kannada | ml | Malayalam |
| pa | Punjabi | ur | Urdu |
| ar | Arabic | zh | Chinese |
| ja | Japanese | ko | Korean |
| pt | Portuguese | ru | Russian |
| de | German | it | Italian |

## 📖 How to Use

### Basic Usage

```bash
node translate.js <input.json> <output.json> <language_code>
```

### Examples

```bash
# Translate to Hindi
node translate.js en.json hi.json hi

# Translate to French
node translate.js en.json fr.json fr

# Translate to Spanish
node translate.js en.json es.json es
```

### Using NPM Scripts

```bash
# Translate to Hindi
npm run translate:hi

# Translate to French
npm run translate:fr

# Translate to Spanish
npm run translate:es

# Translate to all languages
npm run translate:all
```

## 📁 File Structure

```
insight-learn/
├── translate.js          # Main translation script
├── package.json          # NPM scripts
├── en.json              # English source file
├── hi.json              # Hindi translation (generated)
├── fr.json              # French translation (generated)
├── es.json              # Spanish translation (generated)
└── README_TRANSLATION.md # This file
```

## ⚙️ How It Works

### Step 1: Input Processing
- Reads the source JSON file (en.json)
- Parses and validates JSON structure
- Counts total strings to translate

### Step 2: Translation Process
- Recursively traverses the JSON object
- Identifies all string values for translation
- Skips non-string values and code-like strings
- Maintains exact keys and structure

### Step 3: API Integration
- Sends text to LibreTranslate API
- Implements retry logic with exponential backoff
- Adds delays between requests to avoid rate limits
- Handles network errors gracefully

### Step 4: Caching System
- Stores translated text in memory cache
- Reuses cached translations for duplicate text
- Improves performance and reduces API calls

### Step 5: Output Generation
- Creates translated JSON with same structure
- Formats with proper indentation
- Saves to specified output file

## 🔧 Configuration Options

Edit the `CONFIG` object in `translate.js`:

```javascript
const CONFIG = {
  // LibreTranslate server URL
  LIBRETRANSLATE_URL: 'https://libretranslate.de/translate',
  
  // Delay between requests (ms)
  REQUEST_DELAY: 1000,
  
  // Request timeout (ms)
  TIMEOUT: 30000,
  
  // Retry attempts
  MAX_RETRIES: 3
};
```

## 📊 Progress Tracking

The script shows real-time progress:

```
Progress: 45/100 (45%) | Rate: 2.3/sec | ETA: 24s
```

- **Current/Total**: Strings translated so far
- **Percentage**: Completion percentage
- **Rate**: Translation speed (strings per second)
- **ETA**: Estimated time remaining

## 🎯 Smart Features

### Automatic Text Filtering
Skips translation for:
- Empty strings
- Variable names (`userName`, `id`)
- JSON brackets/symbols
- Numbers
- Very short strings (< 2 chars)

### Error Recovery
- Automatic retry with exponential backoff
- Fallback to original text on failure
- Network timeout handling
- API error logging

### Performance Optimization
- In-memory caching for duplicate text
- Configurable rate limiting
- Batch processing for arrays
- Minimal memory usage

## 🚨 Error Handling

The script handles various error scenarios:

- **Network Errors**: Automatic retry with backoff
- **API Failures**: Fallback to original text
- **Invalid JSON**: Clear error messages
- **File Not Found**: Helpful error提示
- **Rate Limits**: Automatic delays

## 📈 Performance Stats

After completion, shows detailed statistics:

```
✅ Translation completed successfully!
📈 Stats:
   - Total strings: 156
   - Translated: 156
   - Cache hits: 23
   - Cache hit rate: 14.7%
   - Time taken: 67.3s
   - Average rate: 2.32 strings/sec
📁 Output saved to: hi.json
```

## 🔍 Sample Input/Output

### Input (en.json)
```json
{
  "app": {
    "name": "Insight Learn",
    "welcome": "Welcome back"
  }
}
```

### Output (hi.json)
```json
{
  "app": {
    "name": "इनसाइट लर्न",
    "welcome": "वापसी स्वागत है"
  }
}
```

## 🛠️ Advanced Usage

### Custom Language Addition
Add new languages to the `LANGUAGES` object:

```javascript
LANGUAGES: {
  'hi': 'Hindi',
  'mr': 'Marathi',
  'your_code': 'Your Language'
}
```

### Batch Translation
Create a script for multiple languages:

```javascript
const languages = ['hi', 'fr', 'es', 'bn'];
for (const lang of languages) {
  await translateJSON('en.json', `${lang}.json`, lang);
}
```

## 🌐 Alternative LibreTranslate Servers

If the default server is slow, try these alternatives:

```javascript
// Alternative servers
LIBRETRANSLATE_URL: 'https://translate.argosopentech.com/translate'
LIBRETRANSLATE_URL: 'https://libretranslate.pussthecat.org/translate'
LIBRETRANSLATE_URL: 'https://simplytranslate.org/translate'
```

## 🔧 Troubleshooting

### Common Issues

1. **Server Timeout**
   - Increase `REQUEST_DELAY`
   - Try alternative server URL

2. **Rate Limiting**
   - Increase delay between requests
   - Use caching effectively

3. **Translation Quality**
   - LibreTranslate is free but may have limitations
   - Consider manual review for important content

4. **Memory Issues**
   - Process large files in chunks
   - Clear cache periodically

## 📝 Integration with Frontend

### 1. Language Files Structure
```
src/
├── locales/
│   ├── en.json
│   ├── hi.json
│   ├── fr.json
│   └── es.json
```

### 2. Language Switcher Component
```javascript
// Example React component
import { useState, useEffect } from 'react';

const LanguageSwitcher = () => {
  const [language, setLanguage] = useState('en');
  const [translations, setTranslations] = useState({});

  useEffect(() => {
    import(`../locales/${language}.json`)
      .then(module => setTranslations(module.default));
  }, [language]);

  return (
    <select value={language} onChange={(e) => setLanguage(e.target.value)}>
      <option value="en">English</option>
      <option value="hi">हिंदी</option>
      <option value="fr">Français</option>
      <option value="es">Español</option>
    </select>
  );
};
```

### 3. Translation Hook
```javascript
import { useState, useEffect } from 'react';

const useTranslation = (language) => {
  const [t, setT] = useState({});

  useEffect(() => {
    import(`../locales/${language}.json`)
      .then(module => setT(module.default));
  }, [language]);

  return (key) => {
    return key.split('.').reduce((obj, k) => obj?.[k], t) || key;
  };
};

// Usage
const MyComponent = () => {
  const t = useTranslation('hi');
  
  return (
    <div>
      <h1>{t('dashboard.welcome')}</h1>
      <p>{t('dashboard.progress')}</p>
    </div>
  );
};
```

## 🎯 Best Practices

1. **Run Once**: Generate translation files once, don't translate at runtime
2. **Manual Review**: Review important translations for accuracy
3. **Version Control**: Commit translated files to git
4. **Incremental Updates**: Re-run only when source content changes
5. **Testing**: Test all language versions of your app

## 🚀 Production Deployment

1. **Generate All Languages**: Run translation for all target languages
2. **Commit to Git**: Add translated files to version control
3. **Deploy**: Include all language files in your build
4. **Language Detection**: Implement language preference storage
5. **Fallback**: Always have English as fallback language

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Verify LibreTranslate server availability
3. Test with smaller JSON files first
4. Check network connectivity

---

**Happy Translating! 🌍**
