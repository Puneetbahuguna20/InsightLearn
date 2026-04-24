const NLPProcessor = require('./nlpProcessor');
const OpenAIService = require('./openaiService');
const freeAI = require('./freeAIService');
const axios = require('axios');

class AIContentGenerator {
  constructor() {
    this.nlp = new NLPProcessor();
    this.openai = new OpenAIService();
  }

  // Step 6: Content Generation
  async generateContent(query, language = 'en') {
    let aiContent;
    let analysis;

    try {
      // Step 2: AI Understands the Concept (Analyze query)
      analysis = this.nlp.analyzeQuery(query);
      
      // Try Groq first for fast structured JSON text generation
      try {
        if (process.env.GROQ_API_KEY) {
          console.log('🚀 Generating structured JSON with Groq...');
          aiContent = await this.generateWithGroq(query, language);
          console.log('✅ Structured JSON generated with Groq');
        } else {
          throw new Error('Groq API key not found');
        }
      } catch (groqErr) {
        console.warn('Groq failed, trying OpenAI:', groqErr.message);
        aiContent = await this.openai.generateLearningContent(query, language);
      }
      
      // IMAGE GENERATION DISABLED as per user request
      const imageUrl = null;
      
      // Combine everything for the final response
      return {
        query: analysis.originalQuery,
        title: aiContent.title,
        type: aiContent.type || (query.toLowerCase().includes('search') || query.toLowerCase().includes('sort') ? 'algorithm' : 'concept'),
        introduction: aiContent.introduction,
        visual: aiContent.visual || {
          representation: query.toLowerCase().includes('search') || query.toLowerCase().includes('sort') ? 'array' : 'components',
          data: (aiContent.components || []).map(c => c.name)
        },
        formula: aiContent.formula || null,
        example: aiContent.example || null,
        steps: aiContent.steps || [],
        flowchart: aiContent.flow || {
          nodes: (aiContent.steps || []).map(s => ({ id: s.id, label: s.title })),
          edges: []
        },
        result: aiContent.result || { text: aiContent.summary },
        summary: aiContent.summary,
        relatedTopics: aiContent.relatedTopics,
        image: null // Explicitly no image
      };
    } catch (error) {
      console.error('AI Generation Error:', error);
      const fallback = await freeAI.getStaticFallback(query);
      return {
        ...fallback,
        query: query,
        image: null,
        type: query.toLowerCase().includes('search') || query.toLowerCase().includes('sort') ? 'algorithm' : 'concept',
        visual: {
          representation: query.toLowerCase().includes('search') || query.toLowerCase().includes('sort') ? 'array' : 'components',
          data: (fallback.components || []).map(c => c.name)
        },
        steps: (fallback.sections || []).map((s, i) => ({
          id: (i + 1).toString(),
          title: s.title,
          explanation: s.content,
          action: s.keyPoints ? s.keyPoints[0] : ''
        })),
        result: { text: fallback.summary }
      };
    }
  }

  // Updated Groq prompt for specific visual/interactive structure
  async generateWithGroq(query, language) {
    const prompt = `
      You are an expert educational AI. Generate a structured JSON for an interactive educational UI about: "${query}"
      
      IMPORTANT: Output ONLY valid JSON. No markdown, no intro text.
      
      ADAPT STRUCTURE BASED ON TOPIC:
      1. If topic is an ALGORITHM (Binary Search, Quick Sort, etc.):
         - type: "algorithm"
         - visual: { "representation": "array", "data": [1, 3, 5, 7, 9, 11, 13] }
         - formula: { "expression": "mid = (low + high) / 2", "calculation": "Step-by-step index calculation" }
         - flowchart: Must follow this EXACT logical flow for Binary Search:
           [Start] -> [Check if Sorted] -> [Set low=0, high=n-1] -> [Repeat While low <= high] -> [Find mid] -> [Compare arr[mid] with target] -> 
           [Equal? -> Return index] | [Not Equal -> Is target < arr[mid]? -> (Yes (Left Side): high=mid-1) | (No (Right Side): low=mid+1) -> Repeat loop] -> [Element not found] -> [End].
         - example: { 
             "type": "code", 
             "language": "javascript", 
             "content": "A clean, commented code snippet implementing the algorithm",
             "walkthrough": [
               "📌 Input Array: [1, 3, 5, 7, 9, 11, 13], Target: 9",
               "⚡ Step 1: low=0, high=6. mid=3, arr[3]=7.",
               "🔄 Step 2: 7 < 9, so low=mid+1=4.",
               "⚡ Step 3: low=4, high=6. mid=5, arr[5]=11.",
               "🔄 Step 4: 11 > 9, so high=mid-1=4.",
               "⚡ Step 5: low=4, high=4. mid=4, arr[4]=9.",
               "✅ Final Output: Element found at index 4"
             ]
           }
         - steps: MUST be granular. Every single logical node in the flowchart MUST have a matching step in the steps array.
      
      2. If topic is a CONCEPT (Car Engine, Heart, Photosynthesis):
         - type: "concept"
         - visual: { "representation": "components", "data": ["Part 1", "Part 2", etc] }
         - flowchart: Logical nodes and edges showing the FULL process in detail.
         - example: { 
             "type": "real_world", 
             "content": "A practical real-world scenario or application where this concept is used",
             "walkthrough": ["Step 1 description", "Step 2 description", ...]
           }
         - steps: Detailed working process.
      
      REQUIRED JSON FORMAT:
      {
        "title": "Title of the Topic",
        "type": "algorithm | concept",
        "introduction": "Simple 1-2 sentence overview",
        "visual": {
          "representation": "array | components",
          "data": ["element1", "element2", ...],
          "highlight": { "current": null, "low": null, "high": null }
        },
        "formula": { "expression": "...", "calculation": "..." },
        "example": { 
          "type": "code | real_world", 
          "language": "javascript | python | etc", 
          "content": "...",
          "walkthrough": ["Formatted Step 1 with emoji", "Formatted Step 2 with emoji", ...]
        },
        "steps": [
          { 
            "id": "step_1", 
            "title": "Start", 
            "explanation": "Initialization and preparation for the algorithm.", 
            "action": "highlight_index:null" 
          },
          {
            "id": "step_2",
            "title": "Check Sorted",
            "explanation": "Ensure the array is sorted as binary search only works on sorted data.",
            "action": "highlight_index:all"
          }
          // ... more granular steps matching flowchart nodes ...
        ],
        "flowchart": {
          "nodes": [
            { "id": "start", "label": "Start", "type": "input" },
            { "id": "check", "label": "Check if Sorted" },
            { "id": "init", "label": "Set low = 0, high = n-1" },
            { "id": "loop", "label": "Repeat while low <= high" },
            { "id": "mid", "label": "Find mid = (low + high) / 2" },
            { "id": "compare", "label": "Compare arr[mid] with target" },
            { "id": "equal", "label": "Equal?" },
            { "id": "not_equal", "label": "Not Equal" },
            { "id": "found", "label": "Return index", "type": "output" },
            { "id": "less", "label": "Is target < arr[mid]?" },
            { "id": "yes_left", "label": "Yes (Left Side)" },
            { "id": "no_right", "label": "No (Right Side)" },
            { "id": "update_high", "label": "high = mid - 1" },
            { "id": "update_low", "label": "low = mid + 1" },
            { "id": "not_found", "label": "Element not found", "type": "output" }
          ],
          "edges": [
            { "source": "start", "target": "check" },
            { "source": "check", "target": "init" },
            { "source": "init", "target": "loop" },
            { "source": "loop", "target": "mid", "label": "Yes" },
            { "source": "loop", "target": "not_found", "label": "No" },
            { "source": "mid", "target": "compare" },
            { "source": "compare", "target": "equal" },
            { "source": "compare", "target": "not_equal" },
            { "source": "equal", "target": "found", "label": "Yes" },
            { "source": "not_equal", "target": "less" },
            { "source": "less", "target": "yes_left", "label": "Yes" },
            { "source": "less", "target": "no_right", "label": "No" },
            { "source": "yes_left", "target": "update_high" },
            { "source": "no_right", "target": "update_low" },
            { "source": "update_high", "target": "loop", "label": "Repeat" },
            { "source": "update_low", "target": "loop", "label": "Repeat" }
          ]
        },
        "result": { "text": "Final outcome/result" },
        "summary": "Final concluding summary",
        "relatedTopics": ["Topic 1", "Topic 2"]
      }
    `;

    const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: 'You are an educational AI that outputs structured JSON.' },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    return JSON.parse(response.data.choices[0].message.content);
  }

  // New method: Generate Quiz questions using Groq
  async generateQuiz(topic, difficulty = 'medium', language = 'en', questionCount = 5) {
    const prompt = `
      You are an expert educational AI. Generate a set of ${questionCount} multiple-choice questions for a quiz on the topic: "${topic}".
      Difficulty Level: ${difficulty}
      Language: ${language}
      
      IMPORTANT: Output ONLY valid JSON. No markdown, no intro text.
      
      REQUIRED JSON FORMAT:
      {
        "topic": "${topic}",
        "questions": [
          {
            "id": "1",
            "question": "The question text here?",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "correctAnswer": 0,
            "explanation": "Brief explanation of why the answer is correct.",
            "difficulty": "${difficulty}"
          }
        ]
      }
    `;

    try {
      const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: 'You are an educational AI that outputs structured JSON for quizzes.' },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      return JSON.parse(response.data.choices[0].message.content);
    } catch (error) {
      console.error('Groq Quiz Generation Error:', error);
      throw error;
    }
  }

  // New method: Generate Flashcards using Groq
  async generateFlashcards(topic, count = 10, language = 'en', promptOverride = null) {
    const defaultPrompt = `
      You are an expert educational AI. Generate a set of ${count} educational flashcards for the topic: "${topic}".
      Each flashcard should have a "front" (question or concept) and a "back" (answer or explanation).
      Language: ${language}
      
      IMPORTANT: Output ONLY valid JSON. No markdown, no intro text.
      
      REQUIRED JSON FORMAT:
      {
        "topic": "${topic}",
        "flashcards": [
          {
            "front": "Question or concept name",
            "back": "Detailed answer or explanation",
            "difficulty": "easy | medium | hard"
          }
        ]
      }
    `;

    const prompt = promptOverride ? `${promptOverride}\n\n${defaultPrompt}` : defaultPrompt;

    try {
      const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: 'You are an educational AI that outputs structured JSON for flashcards.' },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      return JSON.parse(response.data.choices[0].message.content);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.error('❌ Groq API Key is invalid or expired (401). Please check your Render environment variables.');
      } else {
        console.error('Groq Flashcard Generation Error:', error.message);
      }
      throw error;
    }
  }

  // Generate AI-optimized diagram (Old method, keeping for compatibility if needed)
  async generateAIDiagram(analysis, content, language) {
    try {
      // Use AI to generate optimal layout
      const layoutData = await this.openai.generateDiagramLayout(
        analysis.components,
        analysis.relationships,
        analysis.mainSubject
      );

      return {
        type: this.determineDiagramType(analysis),
        title: `${analysis.mainSubject} Diagram`,
        nodes: analysis.components.map((comp, index) => ({
          id: comp.id,
          label: comp.name,
          type: comp.type,
          x: layoutData.nodes[index]?.x || this.calculateNodeX(index, analysis.components.length),
          y: layoutData.nodes[index]?.y || this.calculateNodeY(index, analysis.components.length),
          size: 40 + (comp.relevance * 10),
          color: this.getNodeColor(comp.type),
          icon: this.getComponentIcon(comp.type, comp.name),
          details: {
            description: this.generateComponentDescription(comp, analysis.mainSubject),
            function: this.generateComponentFunction(comp)
          }
        })),
        edges: analysis.relationships.map((rel, index) => ({
          id: `edge-${index}`,
          from: analysis.components.find(c => c.name === rel.from)?.id || rel.from,
          to: analysis.components.find(c => c.name === rel.to)?.id || rel.to,
          label: rel.type,
          type: this.determineEdgeType(rel),
          animated: rel.type === 'process' || rel.type === 'flow'
        })),
        layout: layoutData.layout || this.suggestLayout(analysis),
        interactions: {
          clickable: true,
          hoverable: true,
          draggable: false,
          zoomable: true
        },
        legend: this.generateLegend(analysis.components)
      };
    } catch (error) {
      console.error('AI Diagram Generation Error:', error);
      return this.generateFallbackDiagram(analysis);
    }
  }

  // Enhanced content generation with AI
  generateExplanation(analysis, language) {
    return {
      type: 'explanation',
      title: `Understanding ${this.capitalize(analysis.mainSubject)}`,
      introduction: `${analysis.mainSubject} is a fundamental concept that involves ${analysis.keywords.slice(0, 3).map(k => k.keyword).join(', ')}. Understanding this topic is essential for grasping more advanced concepts in the field.`,
      sections: [
        {
          title: 'Overview',
          content: `The ${analysis.mainSubject} consists of several interconnected components that work together to achieve a specific function. Key elements include ${analysis.keywords.slice(0, 4).map(k => k.keyword).join(', ')}.`,
          keyPoints: analysis.keywords.slice(0, 5).map(k => k.keyword)
        },
        {
          title: 'Key Components',
          content: 'The system comprises multiple main components that each play a crucial role in overall functionality.',
          components: analysis.components.map(comp => ({
            name: comp.name,
            description: this.generateComponentDescription(comp, analysis.mainSubject),
            function: this.generateComponentFunction(comp)
          }))
        },
        {
          title: 'How It Works',
          content: `The ${analysis.mainSubject} operates through a coordinated sequence of processes involving ${analysis.keywords.slice(0, 4).map(k => k.keyword).join(', ')}. This creates a continuous cycle that maintains system functionality.`,
          steps: this.generateWorkingSteps(analysis)
        },
        {
          title: 'Real-World Applications',
          content: `Practical applications of ${analysis.mainSubject} include automotive systems, industrial machinery, consumer electronics, and scientific instruments. These applications demonstrate the versatility and importance of this concept.`,
          examples: this.generateRealWorldExamples(analysis)
        }
      ],
      summary: `In summary, ${analysis.mainSubject} represents a crucial technological concept involving ${analysis.components.length} key components. Understanding its working principles enables better design, troubleshooting, and innovation in related fields.`,
      relatedTopics: this.suggestRelatedTopics(analysis)
    };
  }

  // Generate comparison content
  generateComparison(analysis, language) {
    const items = analysis.keywords.filter(k => k.type === 'component' || k.type === 'concept').slice(0, 2);
    
    return {
      type: 'comparison',
      title: `${this.capitalize(items[0]?.keyword || 'Topic A')} vs ${this.capitalize(items[1]?.keyword || 'Topic B')}`,
      items: items.map(item => ({
        name: item.keyword,
        characteristics: this.generateCharacteristics(item),
        advantages: this.generateAdvantages(item),
        disadvantages: this.generateDisadvantages(item)
      })),
      comparisonTable: this.generateComparisonTable(items),
      verdict: this.generateVerdict(items)
    };
  }

  // Generate process/step-by-step content
  generateProcess(analysis, language) {
    return {
      type: 'process',
      title: `How ${this.capitalize(analysis.mainSubject)} Works`,
      overview: this.generateProcessOverview(analysis),
      steps: this.generateDetailedSteps(analysis),
      prerequisites: this.generatePrerequisites(analysis),
      tips: this.generateTips(analysis)
    };
  }

  // Generate definition content
  generateDefinition(analysis, language) {
    return {
      type: 'definition',
      title: `What is ${this.capitalize(analysis.mainSubject)}?`,
      definition: this.generateFormalDefinition(analysis),
      etymology: this.generateEtymology(analysis),
      types: this.generateTypes(analysis),
      examples: this.generateExamples(analysis)
    };
  }

  // Generate example content
  generateExample(analysis, language) {
    return {
      type: 'example',
      title: `Examples of ${this.capitalize(analysis.mainSubject)}`,
      examples: this.generateRealWorldExamples(analysis),
      codeExamples: this.generateCodeExamples(analysis),
      visualExamples: this.generateVisualExamples(analysis)
    };
  }

  // Step 7: Interactive Diagram Generation (Image-based with markers)
  generateDiagram(analysis) {
    const components = analysis.components;
    const subject = analysis.mainSubject;
    
    // Get appropriate image for the subject
    const diagramImage = this.getDiagramImage(subject);
    
    // Create markers from components with positions on the image
    const markers = components.map((comp, index) => ({
      id: comp.id,
      label: comp.name,
      x: this.calculateMarkerX(index, components.length),
      y: this.calculateMarkerY(index, components.length, comp.type),
      description: this.generateComponentDescription(comp, subject),
      type: comp.type,
      video: this.getComponentVideo(comp.name),
      videoUrl: `https://www.youtube.com/results?search_query=how+${encodeURIComponent(comp.name)}+works`,
      details: [
        `Key function: ${this.generateComponentFunction(comp)}`,
        `Part of: ${subject} system`,
        `Importance: Critical component`
      ]
    }));

    return {
      image: diagramImage,
      title: this.capitalize(subject),
      markers: markers,
      description: `Explore the parts of the ${subject} by clicking on the markers.`,
      layout: this.suggestLayout(analysis)
    };
  }

  // Get appropriate diagram image based on subject
  getDiagramImage(subject) {
    const lowerSubject = subject.toLowerCase();
    
    // More specific images for different topics
    const images = {
      // Human body systems
      heart: 'https://images.unsplash.com/photo-1628348070884-65ddad94617c?w=800', // Anatomical heart
      brain: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?w=800', // Brain illustration
      digestive: 'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=800', // Human anatomy
      stomach: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800', // Medical/anatomy
      lung: 'https://images.unsplash.com/photo-1530497610245-94d3c82f26f0?w=800', // Medical
      liver: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800', // Medical/anatomy
      kidney: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800', // Medical
      
      // Engine and mechanical
      engine: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800', // Car engine
      car: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800', // Car engine
      piston: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800', // Engine parts
      mechanical: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=800', // Mechanical parts
      gear: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=800', // Gears
      
      // Plants and biology
      photosynthesis: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=800', // Green leaf
      plant: 'https://images.unsplash.com/photo-1459156212016-c812468e2115?w=800', // Plant structure
      leaf: 'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?w=800', // Leaf closeup
      cell: 'https://images.unsplash.com/photo-1576086213369-97a306d36557?w=800', // Microscopic/cell
      biology: 'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=800', // Biology
      
      // Electronics and circuits
      circuit: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800', // Circuit board
      computer: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800', // Computer chip
      electronics: 'https://images.unsplash.com/photo-1498049860654-af1a5c5668ba?w=800', // Electronics
      chip: 'https://images.unsplash.com/photo-1555617981-778dd1c43165?w=800', // Microchip
      motherboard: 'https://images.unsplash.com/photo-1541029071516-cbe0e538cf65?w=800', // Motherboard
      
      // Nature and environment
      water: 'https://images.unsplash.com/photo-1583244532610-2a234e7c3eca?w=800', // Water cycle
      cycle: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800', // Nature cycle
      earth: 'https://images.unsplash.com/photo-1614730341194-75c607400070?w=800', // Earth
      solar: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800', // Solar panel
      
      // Physics and science
      atom: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800', // Atom/molecular
      physics: 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=800', // Physics
      energy: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=800', // Energy
      light: 'https://images.unsplash.com/photo-1507400492013-162706c8c05e?w=800', // Light/prism
      
      // Technology
      network: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800', // Network
      internet: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800', // Internet/tech
      ai: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800', // AI/ML
      robot: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800', // Robot
      
      // Chemistry
      chemistry: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=800', // Chemistry lab
      molecule: 'https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?w=800', // Molecules
      lab: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800', // Laboratory
      
      // Mathematics
      math: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=800', // Math
      geometry: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800', // Geometry
      
      // Space
      space: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=800', // Space
      planet: 'https://images.unsplash.com/photo-1614730341194-75c607400070?w=800', // Planet
      galaxy: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=800', // Galaxy
      star: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=800', // Stars
      
      // Architecture and structures
      building: 'https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=800', // Building
      bridge: 'https://images.unsplash.com/photo-1470240731273-7821a6eeb6bd?w=800', // Bridge
      structure: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800', // Architecture
      
      // Transportation
      airplane: 'https://images.unsplash.com/photo-1556388158-158ea5ccacbd?w=800', // Airplane
      train: 'https://images.unsplash.com/photo-1474487548417-781cb71445b3?w=800', // Train
      ship: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800', // Ship
      bicycle: 'https://images.unsplash.com/photo-1485965120184-e224f7a1dbac?w=800', // Bicycle
    };
    
    // Find best matching image
    const key = Object.keys(images).find(k => lowerSubject.includes(k));
    
    // Return matched image or a random appropriate default based on category
    if (key) {
      return images[key];
    }
    
    // Default images based on broad category detection
    if (lowerSubject.includes('body') || lowerSubject.includes('organ') || lowerSubject.includes('medical')) {
      return 'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=800';
    }
    if (lowerSubject.includes('machine') || lowerSubject.includes('motor') || lowerSubject.includes('vehicle')) {
      return 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=800';
    }
    if (lowerSubject.includes('tech') || lowerSubject.includes('digital') || lowerSubject.includes('software')) {
      return 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800';
    }
    if (lowerSubject.includes('nature') || lowerSubject.includes('animal') || lowerSubject.includes('eco')) {
      return 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=800';
    }
    
    // Generic educational default
    return 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800';
  }

  // Calculate marker X position (percentage)
  calculateMarkerX(index, total) {
    // Distribute markers across the image width (20% to 80%)
    const positions = [25, 40, 60, 75, 30, 50, 70, 35, 55, 65];
    return positions[index % positions.length];
  }

  // Calculate marker Y position (percentage)
  calculateMarkerY(index, total, type) {
    // Position based on component type and index
    const baseY = 20 + (index * 60 / Math.max(total, 1));
    const typeOffset = {
      component: 0,
      process: 10,
      material: -5,
      concept: 5
    };
    return Math.min(85, Math.max(15, baseY + (typeOffset[type] || 0)));
  }

  // Get component video info
  getComponentVideo(componentName) {
    const videos = {
      piston: {
        thumbnail: 'https://img.youtube.com/vi/2tzn9k0Y6Xc/0.jpg',
        title: 'How Car Engine Piston Works'
      },
      engine: {
        thumbnail: 'https://img.youtube.com/vi/8V2P3J8q8X0/0.jpg',
        title: 'How Car Engines Work'
      },
      crankshaft: {
        thumbnail: 'https://img.youtube.com/vi/2tzn9k0Y6Xc/0.jpg',
        title: 'Crankshaft Function and Design'
      },
      stomach: {
        thumbnail: 'https://img.youtube.com/vi/9b1GCE0QZiw/0.jpg',
        title: 'How The Digestive System Works'
      },
      valve: {
        thumbnail: 'https://img.youtube.com/vi/zqYx3hYwP8s/0.jpg',
        title: 'Engine Valve Operation'
      }
    };
    
    const key = Object.keys(videos).find(k => componentName.toLowerCase().includes(k));
    return videos[key] || {
      thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/0.jpg',
      title: `How ${componentName} Works`
    };
  }

  // Determine best diagram type based on content
  determineDiagramType(analysis) {
    const intent = analysis.intent;
    const components = analysis.components.length;
    
    if (intent === 'process' || intent === 'explanation') {
      if (components > 5) return 'system_architecture';
      if (components > 3) return 'flow_diagram';
      return 'schematic';
    }
    if (intent === 'comparison') return 'comparison_chart';
    return 'concept_map';
  }

  // Calculate node positions for visual layout
  calculateNodeX(index, total) {
    const angle = (index / total) * 2 * Math.PI;
    return 200 + 150 * Math.cos(angle);
  }

  calculateNodeY(index, total) {
    const angle = (index / total) * 2 * Math.PI;
    return 200 + 150 * Math.sin(angle);
  }

  // Get color based on component type
  getNodeColor(type) {
    const colors = {
      component: '#6366f1', // Indigo
      material: '#10b981',  // Emerald
      process: '#f59e0b',   // Amber
      concept: '#8b5cf6',   // Violet
      action: '#ef4444'     // Red
    };
    return colors[type] || '#6b7280';
  }

  // Get appropriate icon for component
  getComponentIcon(type, name) {
    const iconMap = {
      engine: 'cog',
      piston: 'arrows-up-down',
      crankshaft: 'rotate-cw',
      valve: 'activity',
      plug: 'zap',
      cylinder: 'box',
      injector: 'droplet',
      bearing: 'circle-dot',
      rod: 'minus'
    };
    
    const lowerName = name.toLowerCase();
    for (const [key, icon] of Object.entries(iconMap)) {
      if (lowerName.includes(key)) return icon;
    }
    
    return type === 'component' ? 'box' : 
           type === 'material' ? 'layers' : 
           type === 'process' ? 'play-circle' : 'circle';
  }

  // Determine edge type for relationships
  determineEdgeType(relationship) {
    const type = relationship.type;
    if (type === 'flow' || type === 'process') return 'arrow';
    if (type === 'connected_to') return 'line';
    if (type === 'depends_on') return 'dashed';
    return 'solid';
  }

  // Suggest layout algorithm
  suggestLayout(analysis) {
    const componentCount = analysis.components.length;
    
    if (componentCount <= 3) return 'horizontal';
    if (componentCount <= 6) return 'circular';
    if (analysis.intent === 'process') return 'flow';
    return 'hierarchical';
  }

  // Generate legend for diagram
  generateLegend(components) {
    const types = [...new Set(components.map(c => c.type))];
    return types.map(type => ({
      type,
      label: this.capitalize(type),
      color: this.getNodeColor(type)
    }));
  }

  // Helper methods for content generation
  capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  generateIntroduction(analysis) {
    return `${this.capitalize(analysis.mainSubject)} is a fundamental concept that involves ${analysis.keywords.slice(0, 3).map(k => k.keyword).join(', ')}. Understanding this topic is essential for grasping more advanced concepts in the field.`;
  }

  generateOverview(analysis) {
    return `The ${analysis.mainSubject} consists of several interconnected components that work together to achieve a specific function. Key elements include ${analysis.components.slice(0, 3).map(c => c.name).join(', ')}.`;
  }

  generateComponentsDescription(components) {
    if (components.length === 0) return 'This system operates through integrated mechanisms.';
    return `The system comprises ${components.length} main components: ${components.map(c => c.name).join(', ')}. Each plays a crucial role in the overall functionality.`;
  }

  generateComponentDescription(component, subject) {
    return `The ${component.name} is an essential part of the ${subject} system. It contributes to the overall operation and efficiency of the mechanism.`;
  }

  generateComponentFunction(component) {
    const functions = {
      component: `Facilitates mechanical or functional operations within the system.`,
      material: `Provides structural integrity and required physical properties.`,
      process: `Enables transformation or transfer of energy/matter.`,
      concept: `Defines theoretical framework and operational principles.`
    };
    return functions[component.type] || 'Performs essential system functions.';
  }

  suggestMaterials(component) {
    const materials = {
      piston: ['Aluminum alloy', 'Cast iron', 'Steel'],
      crankshaft: ['Forged steel', 'Cast iron', 'Carbon steel'],
      valve: ['Stainless steel', 'Titanium', 'Inconel'],
      cylinder: ['Cast iron', 'Aluminum', 'Ceramic coating'],
      bearing: ['Steel', 'Bronze', 'Ceramic']
    };
    return materials[component.name.toLowerCase()] || ['Standard industrial materials'];
  }

  suggestSpecifications(component) {
    return {
      dimensions: 'Standard industry specifications',
      tolerance: '±0.05mm',
      material: this.suggestMaterials(component)[0],
      lifespan: '100,000+ operating hours'
    };
  }

  generateWorkingPrinciple(analysis) {
    return `The ${analysis.mainSubject} operates through a coordinated sequence of processes involving ${analysis.keywords.slice(0, 4).map(k => k.keyword).join(', ')}. This creates a continuous cycle that maintains system functionality.`;
  }

  generateWorkingSteps(analysis) {
    return [
      { step: 1, description: `Initiation of ${analysis.keywords[0]?.keyword || 'process'}`, details: 'System activation and preparation' },
      { step: 2, description: `Primary ${analysis.mainSubject} operation`, details: 'Core mechanism engagement' },
      { step: 3, description: 'Secondary processes', details: 'Supporting functions execution' },
      { step: 4, description: 'Output generation', details: 'Final result production' }
    ];
  }

  generateApplications(analysis) {
    return `Real-world applications of ${analysis.mainSubject} include automotive systems, industrial machinery, consumer electronics, and scientific instruments. These applications demonstrate the versatility and importance of this concept.`;
  }

  generateSummary(analysis) {
    return `In summary, ${analysis.mainSubject} represents a crucial technological concept involving ${analysis.components.length} key components. Understanding its working principles enables better design, troubleshooting, and innovation in related fields.`;
  }

  suggestRelatedTopics(analysis) {
    const related = {
      engine: ['Combustion Process', 'Thermodynamics', 'Mechanical Systems', 'Fuel Injection'],
      piston: ['Reciprocating Motion', 'Cylinder Design', 'Engine Architecture'],
      photosynthesis: ['Plant Biology', 'Cellular Respiration', 'Energy Conversion', 'Chlorophyll'],
      default: ['Fundamental Principles', 'Advanced Applications', 'Modern Innovations']
    };
    
    const key = Object.keys(related).find(k => analysis.mainSubject.toLowerCase().includes(k));
    return related[key] || related.default;
  }

  generateCharacteristics(item) {
    return [
      `High efficiency in ${item.keyword} operations`,
      `Reliable performance under various conditions`,
      `Compatible with standard systems`,
      `Cost-effective implementation`
    ];
  }

  generateAdvantages(item) {
    return ['Optimal performance', 'Long durability', 'Easy maintenance', 'Wide applicability'];
  }

  generateDisadvantages(item) {
    return ['Initial complexity', 'Resource requirements', 'Maintenance needs'];
  }

  generateComparisonTable(items) {
    const criteria = ['Performance', 'Durability', 'Cost', 'Complexity'];
    return {
      criteria,
      data: items.map(item => ({
        name: item.keyword,
        scores: criteria.map(() => Math.floor(Math.random() * 3) + 7) // Random scores 7-9
      }))
    };
  }

  generateVerdict(items) {
    return `Both ${items.map(i => i.keyword).join(' and ')} have their unique advantages. The choice depends on specific requirements and constraints of the application.`;
  }

  generateProcessOverview(analysis) {
    return `The ${analysis.mainSubject} process involves sequential stages that transform inputs into desired outputs through systematic operations.`;
  }

  generateDetailedSteps(analysis) {
    return analysis.components.map((comp, index) => ({
      step: index + 1,
      title: `${comp.name} Stage`,
      description: this.generateComponentDescription(comp, analysis.mainSubject),
      duration: `${(index + 1) * 2} seconds`,
      requirements: [this.suggestMaterials(comp)[0], 'Proper alignment', 'Optimal conditions']
    }));
  }

  generatePrerequisites(analysis) {
    return ['Basic understanding of core concepts', 'Familiarity with system components', 'Access to necessary resources'];
  }

  generateTips(analysis) {
    return [
      'Monitor system parameters regularly',
      'Maintain optimal operating conditions',
      'Follow recommended procedures',
      'Document observations for improvement'
    ];
  }

  generateFormalDefinition(analysis) {
    return `${this.capitalize(analysis.mainSubject)} refers to a systematic approach or mechanism involving ${analysis.keywords.slice(0, 3).map(k => k.keyword).join(', ')}, designed to achieve specific functional objectives.`;
  }

  generateEtymology(analysis) {
    return `The term "${analysis.mainSubject}" derives from technical and scientific nomenclature, combining elements that describe its fundamental nature and operational characteristics.`;
  }

  generateTypes(analysis) {
    return ['Primary Type', 'Secondary Variant', 'Advanced Implementation', 'Specialized Form'];
  }

  generateExamples(analysis) {
    return [
      'Standard implementation in industrial settings',
      'Modern adaptation in consumer technology',
      'Innovative application in research contexts',
      'Traditional usage in established systems'
    ];
  }

  generateRealWorldExamples(analysis) {
    return analysis.components.map(comp => ({
      title: `${comp.name} Application`,
      context: `Real-world implementation of ${comp.name}`,
      description: this.generateComponentDescription(comp, analysis.mainSubject)
    }));
  }

  generateCodeExamples(analysis) {
    return []; // Placeholder for code examples if applicable
  }

  generateVisualExamples(analysis) {
    return []; // Placeholder for visual examples
  }
}

module.exports = AIContentGenerator;
