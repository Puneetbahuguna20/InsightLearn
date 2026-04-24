const OpenAI = require('openai');

class OpenAIService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    this.defaultModel = 'gpt-4o';
  }

  // Generate AI content for learning topics
  async generateLearningContent(query, language = 'en') {
    try {
      const prompt = this.buildLearningPrompt(query, language);
      
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are an expert educational AI assistant. Generate comprehensive, structured learning content in ${language} language. Focus on clarity, accuracy, and educational value.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      });

      return this.parseAIResponse(response.choices[0].message.content);
    } catch (error) {
      console.error('OpenAI API Error:', error);
      throw new Error('Failed to generate AI content');
    }
  }

  // Generate detailed component information
  async generateComponentDetails(componentName, topic) {
    try {
      const prompt = `
        Generate detailed technical information for the component "${componentName}" in the context of "${topic}".
        
        Provide information in this JSON structure:
        {
          "overview": "Comprehensive description",
          "function": "Primary function and role",
          "workingPrinciple": "How it operates",
          "specifications": {
            "materials": ["List of materials"],
            "dimensions": "Size specifications",
            "weight": "Weight information",
            "lifespan": "Expected operational lifespan"
          },
          "maintenance": ["Step-by-step maintenance tasks"],
          "troubleshooting": [
            {"issue": "Common problem", "solution": "How to fix it"}
          ],
          "relatedComponents": ["Connected components"]
        }
      `;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a technical expert providing detailed component information. Always respond with valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1500
      });

      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      console.error('OpenAI Component Details Error:', error);
      return this.getDefaultComponentDetails(componentName);
    }
  }

  // Generate diagram layout suggestions
  async generateDiagramLayout(components, relationships, topic) {
    try {
      const prompt = `
        Generate optimal layout coordinates for an interactive diagram about "${topic}".
        
        Components: ${JSON.stringify(components)}
        Relationships: ${JSON.stringify(relationships)}
        
        Provide JSON response with:
        {
          "nodes": [
            {"id": "unique-id", "x": 0-800, "y": 0-500, "size": 40-100, "color": "#hex-color"}
          ],
          "layout": "circular|horizontal|vertical|hierarchical"
        }
        
        Rules:
        - Distribute nodes evenly
        - Avoid overlaps
        - Use professional colors
        - Consider relationship flow
      `;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a diagram layout expert. Always respond with valid JSON coordinates.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 1000
      });

      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      console.error('OpenAI Diagram Layout Error:', error);
      return this.getDefaultLayout(components);
    }
  }

  // Build learning prompt for AI
  buildLearningPrompt(query, language) {
    return `
      Generate comprehensive learning content and a structured, high-fidelity flow diagram for: "${query}"
      
      Language: ${language}
      
      Please provide structured content including:
      1. Brief introduction and overview
      2. Key components and their functions (EXACTLY 4-6 components)
      3. Working principles and processes
      4. Real-world applications and examples
      5. Related topics for further learning
      6. A practical example (code snippet for algorithms/coding, or real-world scenario for concepts)
      7. A rich logic flow diagram data (nodes and edges)
      
      Format as JSON:
      {
        "title": "Main title",
        "introduction": "Brief overview",
        "example": { "type": "code | real_world", "language": "javascript | python | etc", "content": "..." },
        "components": [
          { "name": "Component Name", "description": "Short description", "function": "Primary role", "working": "How it works" }
        ],
        "sections": [
          {
            "title": "Section title",
            "content": "Detailed explanation",
            "keyPoints": ["Important points"]
          }
        ],
        "summary": "Concluding summary",
        "relatedTopics": ["Related subjects"],
        "flow": {
          "nodes": [
            { 
              "id": "1", 
              "type": "step|process|decision|result", 
              "label": "Node Label", 
              "explanation": "Deep explanation", 
              "example": "Real-world example",
              "stepNumber": 1
            }
          ],
          "edges": [
            { "source": "1", "target": "2", "label": "Yes/No/Flow type" }
          ]
        }
      }
      
      Instructions for flow data:
      - Use "step" type for major phases (include "stepNumber").
      - Use "process" type for actions or internal workings.
      - Use "decision" type for logic branching (MUST have multiple outgoing edges with labels like "Yes", "No", "Match", etc.).
      - Use "result" type for final outcomes or conclusions.
      - The diagram must be comprehensive (8-12 nodes).
      - Ensure a logical, educational flow that mirrors the infographic style of a high-quality textbook.
      - Make content educational, accurate, and engaging for learners.
    `;
  }

  // Generate image using DALL-E 3
  async generateImage(prompt) {
    try {
      const response = await this.openai.images.generate({
        model: "dall-e-3",
        prompt: prompt,
        n: 1,
        size: "1024x1024",
        quality: "standard",
        response_format: "url",
      });

      return response.data[0].url;
    } catch (error) {
      console.error('OpenAI Image Generation Error:', error);
      throw new Error('Failed to generate image');
    }
  }

  // Detect label positions using GPT-4 Vision
  async detectLabelPositions(imageUrl, components, topic) {
    try {
      const componentNames = components.map(c => c.name).join(', ');
      const prompt = `
        Analyze the provided image of "${topic}".
        Find the exact center coordinates (x, y) for each of these components: ${componentNames}.
        
        The image is 1024x1024 pixels. Return coordinates as PIXELS (0-1024) relative to the top-left corner.
        
        Return ONLY a JSON array of objects:
        [
          {"name": "Component Name", "x": 512, "y": 300}
        ]
        
        Rules:
        - Coordinates must point to the actual part in the image.
        - x and y must be between 50 and 974.
        - Provide coordinates for ALL requested components.
      `;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "image_url",
                image_url: {
                  "url": imageUrl,
                },
              },
            ],
          },
        ],
        max_tokens: 1000,
      });

      // Extract JSON from response
      const content = response.choices[0].message.content;
      const jsonMatch = content.match(/\[.*\]/s);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('Failed to parse vision response');
    } catch (error) {
      console.error('OpenAI Vision Error:', error);
      // Return default positions if vision fails (using pixel coordinates)
      return components.map((c, i) => ({
        name: c.name,
        x: Math.round(200 + (i * 150)),
        y: 512
      }));
    }
  }

  // Parse AI response into structured format
  parseAIResponse(content) {
    try {
      // Try to parse as JSON first
      return JSON.parse(content);
    } catch (error) {
      // If not JSON, extract key information
      return {
        title: this.extractTitle(content),
        introduction: this.extractIntroduction(content),
        sections: this.extractSections(content),
        summary: this.extractSummary(content),
        relatedTopics: this.extractRelatedTopics(content)
      };
    }
  }

  // Helper methods for content extraction
  extractTitle(content) {
    const lines = content.split('\n');
    const titleLine = lines.find(line => line.includes('Title:') || line.includes('# '));
    return titleLine ? titleLine.replace(/^(Title:|#\s)/, '').trim() : 'Generated Content';
  }

  extractIntroduction(content) {
    const introMatch = content.match(/(?:Introduction|Overview):?\s*([^#\n]+)/i);
    return introMatch ? introMatch[1].trim() : 'Generated overview of the topic.';
  }

  extractSections(content) {
    const sections = [];
    const sectionMatches = content.matchAll(/(?:Section|Component|Step)\s+\d+:\s*([^#\n]+)/gi);
    
    sectionMatches.forEach((match, index) => {
      sections.push({
        title: `Section ${index + 1}`,
        content: match.trim(),
        keyPoints: this.extractKeyPoints(match)
      });
    });
    
    return sections.length > 0 ? sections : [{
      title: 'Main Content',
      content: content.substring(0, 500) + '...',
      keyPoints: ['Key concepts', 'Important details', 'Applications']
    }];
  }

  extractKeyPoints(content) {
    const points = [];
    const bulletMatches = content.matchAll(/[•\-\*]\s*([^\n]+)/g);
    bulletMatches.forEach(match => points.push(match[1].trim()));
    return points.slice(0, 5); // Limit to 5 key points
  }

  extractSummary(content) {
    const summaryMatch = content.match(/(?:Summary|Conclusion):?\s*([^#\n]+)/i);
    return summaryMatch ? summaryMatch[1].trim() : 'Summary of the generated content.';
  }

  extractRelatedTopics(content) {
    const topics = [];
    const topicMatches = content.matchAll(/(?:Related|Similar)\s+(?:Topics|Subjects):?\s*([^\n]+)/gi);
    
    topicMatches.forEach(match => {
      const items = match[1].split(/[,;]/).map(item => item.trim());
      topics.push(...items);
    });
    
    return topics.length > 0 ? [...new Set(topics)].slice(0, 5) : 
           ['Advanced Concepts', 'Practical Applications', 'Further Reading'];
  }

  // Fallback methods
  getDefaultComponentDetails(componentName) {
    return {
      overview: `${componentName} is an essential component in this system.`,
      function: `Primary function is to facilitate system operations.`,
      workingPrinciple: `Operates through coordinated mechanical and physical processes.`,
      specifications: {
        materials: ['High-grade steel', 'Aluminum alloy'],
        dimensions: 'Standard industry specifications',
        weight: 'Variable based on application',
        lifespan: '50,000+ operating hours'
      },
      maintenance: [
        'Regular inspection for wear and tear',
        'Lubrication as per schedule',
        'Alignment checks',
        'Performance monitoring'
      ],
      troubleshooting: [
        { issue: 'Unusual noise', solution: 'Check for loose fittings and lubrication' },
        { issue: 'Reduced performance', solution: 'Inspect for wear and clean components' }
      ],
      relatedComponents: ['Primary support structures', 'Control mechanisms']
    };
  }

  getDefaultLayout(components) {
    const nodeCount = components.length;
    const centerX = 400;
    const centerY = 250;
    const radius = 150;
    
    return {
      nodes: components.map((comp, index) => {
        const angle = (index / nodeCount) * 2 * Math.PI;
        return {
          id: comp.id,
          x: Math.round(centerX + radius * Math.cos(angle)),
          y: Math.round(centerY + radius * Math.sin(angle)),
          size: 60,
          color: this.getComponentColor(comp.type)
        };
      }),
      layout: 'circular'
    };
  }

  getComponentColor(type) {
    const colors = {
      component: '#6366f1',
      process: '#10b981',
      material: '#f59e0b',
      concept: '#8b5cf6',
      action: '#ef4444'
    };
    return colors[type] || '#6b7280';
  }
}

module.exports = OpenAIService;
