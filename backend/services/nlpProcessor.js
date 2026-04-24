const natural = require('natural');
const compromise = require('compromise');

class NLPProcessor {
  constructor() {
    this.tokenizer = new natural.WordTokenizer();
    this.tfidf = new natural.TfIdf();
  }

  // Step 4.1: Text Preprocessing
  preprocess(text) {
    // Clean and normalize text
    let cleaned = text
      .toLowerCase()
      .replace(/[^a-zA-Z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    return {
      original: text,
      cleaned: cleaned,
      wordCount: cleaned.split(' ').length
    };
  }

  // Step 4.2: Tokenization
  tokenize(text) {
    const tokens = this.tokenizer.tokenize(text);
    return {
      tokens: tokens,
      uniqueTokens: [...new Set(tokens)],
      tokenCount: tokens.length
    };
  }

  // Step 4.3: Keyword Extraction using compromise.js
  extractKeywords(text, topN = 5) {
    const doc = compromise(text);
    
    // Extract nouns, topics, and technical terms
    const nouns = doc.nouns().out('array');
    const topics = doc.topics().out('array');
    const verbs = doc.verbs().out('array');
    
    // Get frequency and relevance scores
    const keywordScores = {};
    
    [...nouns, ...topics].forEach(word => {
      keywordScores[word] = (keywordScores[word] || 0) + 2;
    });
    
    verbs.forEach(word => {
      keywordScores[word] = (keywordScores[word] || 0) + 1;
    });
    
    // Sort by score and return top keywords
    const sorted = Object.entries(keywordScores)
      .sort(([,a], [,b]) => b - a)
      .slice(0, topN);
    
    return sorted.map(([keyword, score]) => ({
      keyword,
      score,
      type: this.classifyKeyword(keyword, doc)
    }));
  }

  // Classify keyword type (component, process, concept, etc.)
  classifyKeyword(keyword, doc) {
    const patterns = {
      component: /(engine|piston|crankshaft|cylinder|valve|plug|injector|rod|bearing)/i,
      process: /(combustion|ignition|injection|rotation|movement|cycle)/i,
      material: /(metal|steel|aluminum|iron|alloy|fuel|oil)/i,
      concept: /(thermodynamics|physics|chemistry|biology|mathematics)/i,
      action: /(work|function|operate|run|drive|move)/i
    };
    
    for (const [type, regex] of Object.entries(patterns)) {
      if (regex.test(keyword)) return type;
    }
    return 'concept';
  }

  // Step 5: AI Layer - Analyze query and generate structured topic object
  analyzeQuery(query) {
    const preprocessed = this.preprocess(query);
    const tokenized = this.tokenize(preprocessed.cleaned);
    const keywords = this.extractKeywords(query, 10);
    
    // Determine query type and intent
    const intent = this.detectIntent(query);
    const complexity = this.assessComplexity(query, keywords);
    
    // Extract main subject (usually the most important noun phrase)
    const mainSubject = this.extractMainSubject(query, keywords);
    
    return {
      originalQuery: query,
      preprocessed,
      tokenized,
      keywords,
      intent,
      complexity,
      mainSubject,
      components: this.identifyComponents(keywords),
      relationships: this.identifyRelationships(query, keywords)
    };
  }

  // Detect user intent (explanation, comparison, process, etc.)
  detectIntent(query) {
    const patterns = {
      explanation: /(what is|how does|explain|describe|what are)/i,
      comparison: /(vs|versus|compare|difference between|similarities)/i,
      process: /(how to|steps|procedure|process of|work)/i,
      definition: /(define|meaning of|what do you mean by)/i,
      example: /(example|sample|instance|demonstration)/i
    };
    
    for (const [intent, regex] of Object.entries(patterns)) {
      if (regex.test(query)) return intent;
    }
    return 'explanation';
  }

  // Assess complexity level (beginner, intermediate, advanced)
  assessComplexity(query, keywords) {
    const technicalTerms = keywords.filter(k => 
      ['component', 'process', 'material'].includes(k.type)
    ).length;
    
    const wordCount = query.split(' ').length;
    
    if (technicalTerms >= 5 || wordCount > 15) return 'advanced';
    if (technicalTerms >= 3 || wordCount > 10) return 'intermediate';
    return 'beginner';
  }

  // Extract main subject of the query
  extractMainSubject(query, keywords) {
    // Use the highest-scored keyword as main subject
    if (keywords.length > 0) {
      return keywords[0].keyword;
    }
    
    // Fallback: use compromise to find noun phrases
    const doc = compromise(query);
    const nounPhrase = doc.nouns().first().text();
    return nounPhrase || 'unknown';
  }

  // Identify system components
  identifyComponents(keywords) {
    return keywords
      .filter(k => k.type === 'component' || k.type === 'material')
      .map(k => ({
        id: `comp-${k.keyword.replace(/\s+/g, '-').toLowerCase()}`,
        name: k.keyword,
        type: k.type,
        relevance: k.score
      }));
  }

  // Identify relationships between components
  identifyRelationships(query, keywords) {
    const relationships = [];
    const components = keywords.filter(k => k.type === 'component');
    
    // Simple relationship detection based on positioning in text
    if (components.length >= 2) {
      for (let i = 0; i < components.length - 1; i++) {
        relationships.push({
          from: components[i].keyword,
          to: components[i + 1].keyword,
          type: 'connected_to',
          description: `${components[i].keyword} connects to ${components[i + 1].keyword}`
        });
      }
    }
    
    return relationships;
  }
}

module.exports = NLPProcessor;
