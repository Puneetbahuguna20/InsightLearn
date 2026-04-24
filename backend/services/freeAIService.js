const axios = require('axios');

class FreeAIService {
  constructor() {
    this.textApiUrl = 'https://text.pollinations.ai/';
    this.imageApiUrl = 'https://image.pollinations.ai/prompt/';
  }

  /**
   * Generate structured learning content using free text AI
   */
  async generateLearningContent(query, language = 'en') {
    try {
      const prompt = `
        Generate comprehensive learning content for: "${query}"
        Language: ${language}
        
        Provide the response in EXACTLY this JSON format:
        {
          "title": "Main title",
          "introduction": "Brief overview (2-3 sentences)",
          "components": [
            { "name": "Component Name", "description": "Short description (1 sentence)", "function": "Primary role", "working": "How it works" }
          ],
          "sections": [
            {
              "title": "Section title",
              "content": "Detailed explanation (3-4 sentences)",
              "keyPoints": ["Point 1", "Point 2"]
            }
          ],
          "summary": "Concluding summary (1-2 sentences)",
          "relatedTopics": ["Topic 1", "Topic 2"],
          "flow": {
            "nodes": [
              { "id": "1", "type": "step|process|decision|result", "label": "Node Label", "explanation": "Deep explanation", "example": "Real-world example", "stepNumber": 1 }
            ],
            "edges": [
              { "source": "1", "target": "2", "label": "Yes/No/Flow type" }
            ]
          }
        }
        
        Rules:
        - Provide 4-6 components.
        - Provide 6-10 nodes and 5-8 edges for the flow.
        - Ensure content is educational and accurate.
        - Return ONLY the JSON object, no other text.
      `;

      // Pollinations text API works best with GET for simple prompts or POST for more complex ones
      // Using a GET request to their simple endpoint as it's very reliable
      const response = await axios.get(`${this.textApiUrl}${encodeURIComponent(prompt)}?json=true`);

      let content = response.data;
      
      if (typeof content === 'string') {
        // Try to find JSON in the string
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          content = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in response');
        }
      }

      return content;
    } catch (error) {
      console.error('Free Text AI Error:', error.message);
      return this.getStaticFallback(query);
    }
  }

  /**
   * Generate a dynamic diagram image using free image AI
   */
  generateImageUrl(prompt, query) {
    const seed = Math.floor(Math.random() * 1000000);
    const isDigestive = query.toLowerCase().includes('digestive');
    const isEngine = query.toLowerCase().includes('engine') || query.toLowerCase().includes('car');
    
    // Build a clean, simple prompt that Pollinations can definitely handle
    let finalPrompt = `educational diagram of ${query}, white background, professional scientific illustration, high quality`;
    
    if (isDigestive) {
      finalPrompt = `human digestive system anatomical diagram, stomach and intestines, white background, medical illustration`;
    } else if (isEngine) {
      finalPrompt = `car engine internal combustion technical diagram, engineering schematic, blue and white, high detail`;
    }

    // Use the simplest possible URL format for maximum reliability
    const encodedPrompt = encodeURIComponent(finalPrompt);
    return `https://pollinations.ai/p/${encodedPrompt}?width=1024&height=1024&seed=${seed}&nologo=true`;
  }

  /**
   * Basic static fallback if even the free AI fails
   */
  getStaticFallback(query) {
    const isEngine = query.toLowerCase().includes('engine') || query.toLowerCase().includes('car');
    const isDigestive = query.toLowerCase().includes('digestive');

    if (isDigestive) {
      return {
        title: 'Human Digestive System',
        introduction: 'The human digestive system consists of the gastrointestinal tract plus the accessory organs of digestion. Digestion involves the breakdown of food into smaller and smaller components.',
        components: [
          { name: 'Mouth', description: 'Where digestion begins with chewing and saliva.', function: 'Ingestion and mechanical breakdown', x: 50, y: 15 },
          { name: 'Esophagus', description: 'A muscular tube that carries food to the stomach.', function: 'Transportation', x: 50, y: 30 },
          { name: 'Stomach', description: 'Breaks down food with acids and enzymes.', function: 'Chemical and mechanical digestion', x: 55, y: 45 },
          { name: 'Small Intestine', description: 'Where most nutrients are absorbed into the blood.', function: 'Absorption', x: 50, y: 65 },
          { name: 'Large Intestine', description: 'Absorbs water and forms waste.', function: 'Waste processing', x: 50, y: 80 }
        ],
        sections: [
          {
            title: 'The Process of Digestion',
            content: 'Food moves through the GI tract by a process called peristalsis. The large, hollow organs of your GI tract contain a layer of muscle that enables their walls to move.',
            keyPoints: ['Mechanical Digestion', 'Chemical Digestion', 'Nutrient Absorption']
          }
        ],
        summary: 'The digestive system is essential for turning the food you eat into the nutrients your body needs to survive.',
        relatedTopics: ['Biology', 'Nutrition', 'Anatomy'],
        flow: {
          nodes: [
            { id: '1', type: 'step', label: 'Mouth', explanation: 'Food is chewed and mixed with saliva.', stepNumber: 1 },
            { id: '2', type: 'process', label: 'Esophagus', explanation: 'Muscular tube moves food to the stomach.' },
            { id: '3', type: 'process', label: 'Stomach', explanation: 'Acids and enzymes break down food into liquid.' },
            { id: '4', type: 'decision', label: 'Nutrients?', explanation: 'Check if nutrients are ready for absorption.' },
            { id: '5', type: 'process', label: 'Small Intestine', explanation: 'Most nutrients are absorbed here.' },
            { id: '6', type: 'process', label: 'Large Intestine', explanation: 'Water is absorbed, waste is formed.' },
            { id: '7', type: 'result', label: 'Waste Disposal', explanation: 'Undigested material leaves the body.' }
          ],
          edges: [
            { source: '1', target: '2', label: 'Swallow' },
            { source: '2', target: '3', label: 'Peristalsis' },
            { source: '3', target: '4', label: 'Digested' },
            { source: '4', target: '5', label: 'Yes' },
            { source: '5', target: '6', label: 'Complete' },
            { source: '6', target: '7', label: 'Ready' }
          ]
        }
      };
    }

    if (isEngine) {
      return {
        title: 'Internal Combustion Engine',
        introduction: 'An internal combustion engine (ICE) is a heat engine where the combustion of a fuel occurs with an oxidizer in a combustion chamber. It converts chemical energy from fuel into mechanical energy.',
        components: [
          { name: 'Cylinder Block', description: 'The main structure of the engine that houses the cylinders.', function: 'Structural support and housing', x: 50, y: 40 },
          { name: 'Piston', description: 'A sliding plug in the cylinder that moves under pressure.', function: 'Converts gas pressure into mechanical force', x: 45, y: 55 },
          { name: 'Spark Plug', description: 'A device for delivering electric current to the combustion chamber.', function: 'Ignites the air-fuel mixture', x: 50, y: 25 },
          { name: 'Crankshaft', description: 'A rotating shaft that converts reciprocating motion into rotation.', function: 'Main drive output', x: 50, y: 80 },
          { name: 'Valves', description: 'Control the flow of air/fuel and exhaust in the cylinders.', function: 'Regulate intake and exhaust', x: 40, y: 30 }
        ],
        sections: [
          {
            title: 'The Four-Stroke Cycle',
            content: 'Modern car engines use a four-stroke cycle: Intake (air/fuel enters), Compression (mixture is squeezed), Power (spark ignites mixture), and Exhaust (waste gases leave).',
            keyPoints: ['Intake Stroke', 'Compression Stroke', 'Power Stroke', 'Exhaust Stroke']
          }
        ],
        summary: 'The car engine is a complex machine that uses thousands of explosions every minute to generate the power needed to move a vehicle.',
        relatedTopics: ['Mechanical Engineering', 'Automotive Technology', 'Thermodynamics'],
        flow: {
          nodes: [
            { id: '1', type: 'step', label: 'Intake', explanation: 'Fuel and air are drawn into the cylinder.', stepNumber: 1 },
            { id: '2', type: 'process', label: 'Compression', explanation: 'Piston moves up to compress the mixture.' },
            { id: '3', type: 'process', label: 'Power', explanation: 'Spark plug ignites the mixture, pushing the piston down.' },
            { id: '4', type: 'process', label: 'Exhaust', explanation: 'Waste gases are pushed out of the cylinder.' },
            { id: '5', type: 'result', label: 'Rotation', explanation: 'The crankshaft rotates, powering the wheels.' }
          ],
          edges: [
            { source: '1', target: '2', label: 'Squeeze' },
            { source: '2', target: '3', label: 'Ignite' },
            { source: '3', target: '4', label: 'Clean' },
            { source: '4', target: '5', label: 'Drive' }
          ]
        }
      };
    }

    return {
      title: query,
      introduction: `Educational overview of ${query}. This topic covers essential concepts and components in its field.`,
      components: [
        { name: 'Core Element', description: `The primary part of ${query}.`, function: 'Main operation', working: 'Functions as the heart of the system.' },
        { name: 'Secondary Unit', description: 'Support component.', function: 'Auxiliary function', working: 'Provides necessary support.' },
        { name: 'Interface', description: 'Connects internal parts.', function: 'Integration', working: 'Facilitates communication.' }
      ],
      sections: [
        {
          title: 'Understanding the System',
          content: `The ${query} system operates by coordinating various elements to achieve a specific outcome.`,
          keyPoints: ['System integration', 'Operational flow', 'Efficiency']
        }
      ],
      summary: `In conclusion, ${query} is a vital concept that plays a key role in modern technology and science.`,
      relatedTopics: ['General Science', 'Related Systems'],
      flow: {
        nodes: [
          { id: '1', type: 'step', label: 'Concept Start', explanation: `The initial phase of ${query}.`, stepNumber: 1 },
          { id: '2', type: 'process', label: 'Core Action', explanation: 'Primary transformation occurring.' },
          { id: '3', type: 'result', label: 'Outcome', explanation: 'Final state of the system.' }
        ],
        edges: [
          { source: '1', target: '2', label: 'Process' },
          { source: '2', target: '3', label: 'Result' }
        ]
      }
    };
  }
}

module.exports = new FreeAIService();
