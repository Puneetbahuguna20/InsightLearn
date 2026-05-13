#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const https = require('https');
const http = require('http');

// Configuration
const CONFIG = {
  // LibreTranslate free server (you can change this)
  LIBRETRANSLATE_URL: 'https://libretranslate.de/translate',
  
  // Supported languages
  LANGUAGES: {
    'hi': 'Hindi',
    'fr': 'French', 
    'es': 'Spanish',
    'bn': 'Bengali',
    'gu': 'Gujarati',
    'mr': 'Marathi',
    'ta': 'Tamil',
    'te': 'Telugu',
    'kn': 'Kannada',
    'ml': 'Malayalam',
    'pa': 'Punjabi',
    'ur': 'Urdu',
    'ar': 'Arabic',
    'zh': 'Chinese',
    'ja': 'Japanese',
    'ko': 'Korean',
    'pt': 'Portuguese',
    'ru': 'Russian',
    'de': 'German',
    'it': 'Italian'
  },
  
  // Rate limiting (ms between requests)
  REQUEST_DELAY: 1000,
  
  // Cache for translated texts
  translationCache: new Map(),
  
  // Progress tracking
  totalStrings: 0,
  translatedStrings: 0,
  startTime: null
};

// Utility function to make HTTP requests
function makeRequest(url, data) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https://');
    const client = isHttps ? https : http;
    
    const postData = JSON.stringify(data);
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = client.request(url, options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(responseData);
          resolve(parsedData);
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.setTimeout(30000); // 30 seconds timeout
    req.write(postData);
    req.end();
  });
}

// Translate text using LibreTranslate
async function translateText(text, targetLang, retries = 3) {
  // Check cache first
  const cacheKey = `${text}:${targetLang}`;
  if (CONFIG.translationCache.has(cacheKey)) {
    return CONFIG.translationCache.get(cacheKey);
  }

  // Skip if text is empty, not a string, or looks like code/variables
  if (!text || typeof text !== 'string' || 
      text.trim() === '' || 
      text.match(/^[{}[\],\s]*$/) || // JSON brackets
      text.match(/^[a-zA-Z_][a-zA-Z0-9_]*$/) || // variable names
      text.match(/^[0-9]+$/) || // numbers
      text.length < 2) { // very short strings
    return text;
  }

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      console.log(`Translating: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}" -> ${CONFIG.LANGUAGES[targetLang]}`);
      
      const response = await makeRequest(CONFIG.LIBRETRANSLATE_URL, {
        q: text,
        source: 'en',
        target: targetLang,
        format: 'text'
      });

      if (response.translatedText) {
        // Cache the result
        CONFIG.translationCache.set(cacheKey, response.translatedText);
        
        // Update progress
        CONFIG.translatedStrings++;
        updateProgress();
        
        return response.translatedText;
      } else {
        throw new Error('No translation received');
      }
      
    } catch (error) {
      console.error(`Translation attempt ${attempt + 1} failed:`, error.message);
      
      if (attempt < retries - 1) {
        // Wait before retry with exponential backoff
        const delay = CONFIG.REQUEST_DELAY * Math.pow(2, attempt);
        console.log(`Retrying in ${delay}ms...`);
        await sleep(delay);
      } else {
        console.error(`Failed to translate after ${retries} attempts: "${text}"`);
        return text; // Return original text if all attempts fail
      }
    }
  }
}

// Sleep function for delays
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Update progress display
function updateProgress() {
  const percentage = Math.round((CONFIG.translatedStrings / CONFIG.totalStrings) * 100);
  const elapsed = Date.now() - CONFIG.startTime;
  const rate = CONFIG.translatedStrings / (elapsed / 1000);
  const eta = CONFIG.totalStrings > CONFIG.translatedStrings ? 
    Math.round((CONFIG.totalStrings - CONFIG.translatedStrings) / rate) : 0;
  
  process.stdout.write(`\rProgress: ${CONFIG.translatedStrings}/${CONFIG.totalStrings} (${percentage}%) | Rate: ${rate.toFixed(2)}/sec | ETA: ${eta}s`);
}

// Count total strings in JSON
function countStrings(obj) {
  let count = 0;
  
  function traverse(item) {
    if (typeof item === 'string') {
      count++;
    } else if (Array.isArray(item)) {
      item.forEach(traverse);
    } else if (item && typeof item === 'object') {
      Object.values(item).forEach(traverse);
    }
  }
  
  traverse(obj);
  return count;
}

// Recursively translate JSON object
async function translateObject(obj, targetLang) {
  if (typeof obj === 'string') {
    return await translateText(obj, targetLang);
  } else if (Array.isArray(obj)) {
    const translatedArray = [];
    for (const item of obj) {
      translatedArray.push(await translateObject(item, targetLang));
      // Add delay to avoid rate limiting
      if (typeof item === 'string') {
        await sleep(CONFIG.REQUEST_DELAY);
      }
    }
    return translatedArray;
  } else if (obj && typeof obj === 'object') {
    const translatedObj = {};
    for (const [key, value] of Object.entries(obj)) {
      translatedObj[key] = await translateObject(value, targetLang);
      // Add delay for string values
      if (typeof value === 'string') {
        await sleep(CONFIG.REQUEST_DELAY);
      }
    }
    return translatedObj;
  }
  
  return obj;
}

// Main translation function
async function translateJSON(inputPath, outputPath, targetLang) {
  try {
    console.log(`🚀 Starting translation to ${CONFIG.LANGUAGES[targetLang]}...`);
    console.log(`📁 Input: ${inputPath}`);
    console.log(`📁 Output: ${outputPath}`);
    
    // Read input JSON
    console.log('\n📖 Reading input JSON...');
    const inputData = await fs.readFile(inputPath, 'utf8');
    const jsonData = JSON.parse(inputData);
    
    // Count total strings
    CONFIG.totalStrings = countStrings(jsonData);
    CONFIG.startTime = Date.now();
    console.log(`📊 Found ${CONFIG.totalStrings} strings to translate`);
    
    // Translate the JSON
    console.log('\n🔄 Starting translation...');
    const translatedData = await translateObject(jsonData, targetLang);
    
    // Write output JSON
    console.log('\n💾 Writing translated JSON...');
    const outputJson = JSON.stringify(translatedData, null, 2);
    await fs.writeFile(outputPath, outputJson, 'utf8');
    
    // Show summary
    const totalTime = (Date.now() - CONFIG.startTime) / 1000;
    const cacheHitRate = ((CONFIG.translatedStrings - CONFIG.translationCache.size) / CONFIG.translatedStrings * 100).toFixed(1);
    
    console.log('\n✅ Translation completed successfully!');
    console.log(`📈 Stats:`);
    console.log(`   - Total strings: ${CONFIG.totalStrings}`);
    console.log(`   - Translated: ${CONFIG.translatedStrings}`);
    console.log(`   - Cache hits: ${CONFIG.translationCache.size}`);
    console.log(`   - Cache hit rate: ${cacheHitRate}%`);
    console.log(`   - Time taken: ${totalTime.toFixed(2)}s`);
    console.log(`   - Average rate: ${(CONFIG.translatedStrings / totalTime).toFixed(2)} strings/sec`);
    console.log(`📁 Output saved to: ${outputPath}`);
    
  } catch (error) {
    console.error('❌ Translation failed:', error.message);
    process.exit(1);
  }
}

// CLI interface
function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 3) {
    console.log('📖 Usage: node translate.js <input.json> <output.json> <language_code>');
    console.log('\n🌍 Available languages:');
    Object.entries(CONFIG.LANGUAGES).forEach(([code, name]) => {
      console.log(`   ${code}: ${name}`);
    });
    console.log('\n💡 Examples:');
    console.log('   node translate.json en.json hi.json hi');
    console.log('   node translate.json en.json fr.json fr');
    console.log('   node translate.json en.json es.json es');
    process.exit(1);
  }
  
  const [inputPath, outputPath, targetLang] = args;
  
  // Validate language
  if (!CONFIG.LANGUAGES[targetLang]) {
    console.error(`❌ Unsupported language: ${targetLang}`);
    console.log('🌍 Available languages:', Object.keys(CONFIG.LANGUAGES).join(', '));
    process.exit(1);
  }
  
  // Validate input file
  if (!inputPath.endsWith('.json')) {
    console.error('❌ Input file must be a JSON file (.json extension)');
    process.exit(1);
  }
  
  // Start translation
  translateJSON(inputPath, outputPath, targetLang);
}

// Export functions for testing
module.exports = {
  translateText,
  translateObject,
  translateJSON,
  CONFIG
};

// Run if called directly
if (require.main === module) {
  main();
}
