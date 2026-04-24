const OpenAI = require('openai');
const axios = require('axios');
const FormData = require('form-data');
const Bytez = require('bytez.js');

class DiagramGenerationService {
  constructor() {
    // OpenAI client for text/NLP tasks (GPT-4) and image tasks (DALL-E)
    this.openaiText = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    // Bytez client for image generation
    if (process.env.BYTEZ_API_KEY) {
      this.bytez = new Bytez(process.env.BYTEZ_API_KEY);
    }
  }

  // Step 2: AI analyzes concept and extracts components
  async analyzeConcept(topic) {
    try {
      const prompt = `Analyze the topic "${topic}" and identify the key components/parts that should be labeled in an educational diagram.
      
Return ONLY a JSON object in this exact format:
{
  "concept": "${topic}",
  "components": [
    "Component Name 1",
    "Component Name 2",
    "Component Name 3",
    "Component Name 4",
    "Component Name 5",
    "Component Name 6"
  ],
  "description": "Brief description of what this is"
}

Guidelines:
- Identify 4-8 key components that are visually distinct
- Use clear, standard terminology
- Focus on parts that can be pointed to in a diagram
- Make sure components are relevant for educational purposes`;

      const response = await this.openaiText.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are an expert educational content analyzer. Extract key components from topics for diagram generation. Always respond with valid JSON only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 500
      });

      const content = response.choices[0].message.content;
      // Extract JSON from possible markdown code block
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/```\n?([\s\S]*?)\n?```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;
      
      return JSON.parse(jsonStr);
    } catch (error) {
      console.error('Concept Analysis Error:', error);
      // Fallback with basic extraction
      return this.fallbackComponentExtraction(topic);
    }
  }

  // Step 3: Create diagram generation prompt
  // Step 3: Create diagram generation prompt - clean image without labels
  createDiagramPrompt(concept, components) {
    const componentsList = components.length > 0 ? `Include these parts: ${components.join(', ')}.` : '';
    
    return `Basic educational line drawing of ${concept}. 
Style: Minimalist black and white schematic outline.
Background: Pure solid white.
Visual properties: 
- Simple, clean, and bold black lines.
- No complex 3D shading, no realistic textures, no gradients.
- Clear 2D or simple isometric perspective.
- High contrast for maximum legibility.
- Minimalist representation of internal structure.
- ABSOLUTELY NO TEXT, no letters, no numbers, no symbols.
- NO pointers, no arrows, no annotations.
- Like a simple sketch in a basic science workbook.
${componentsList}
The entire diagram should be centered and very easy to understand at a glance.`;
  }

  // Step 4: Generate diagram image using the configured provider with robust fallback
  async generateDiagramImage(prompt) {
    const primaryProvider = process.env.THIRD_PARTY_IMAGE_PROVIDER || 'openai';
    let result = null;

    // 1. Attempt Primary Provider
    if (primaryProvider === 'bytez' && this.bytez) {
      result = await this.tryBytez(prompt);
    } else {
      result = await this.tryOpenAI(prompt);
    }

    if (result) {
      console.log(`✅ Image generated successfully using primary provider: ${primaryProvider}`);
      return result;
    }

    // 2. Attempt Secondary Provider (as fallback)
    if (primaryProvider === 'openai' && this.bytez) {
      console.log('🔄 OpenAI failed, attempting Bytez fallback...');
      result = await this.tryBytez(prompt);
    } else if (primaryProvider === 'bytez') {
      console.log('🔄 Bytez failed, attempting OpenAI fallback...');
      result = await this.tryOpenAI(prompt);
    }

    if (result) {
      console.log('✅ Image generated successfully using secondary fallback provider');
      return result;
    }

    // 3. Final Fallback to Pollinations AI
    console.log('🔄 All premium providers failed. Using fast fallback to Pollinations AI...');
    try {
      const encodedPrompt = encodeURIComponent(prompt);
      const fallbackUrl = `https://pollinations.ai/p/${encodedPrompt}?width=1024&height=1024&seed=${Date.now()}&nologo=true&model=flux`;
      console.log(`Pollinations fallback URL: ${fallbackUrl}`);
      return {
        url: fallbackUrl,
        revised_prompt: prompt
      };
    } catch (fallbackError) {
      console.error('Pollinations AI Fallback Error:', fallbackError.message);
      // Final fallback to a static placeholder image
      console.log('⚠️ Using static placeholder image as a last resort.');
      return {
        url: 'https://via.placeholder.com/1024x1024.png?text=Image+Generation+Failed',
        revised_prompt: prompt
      };
    }
  }

  // Helper: Try Bytez Generation
  async tryBytez(prompt) {
    try {
      console.log('🎨 Generating clean diagram image with Bytez (OpenAI DALL-E 2)...');
      
      // Bytez has a 1000 character limit for prompts
      const finalPrompt = prompt.length > 1000 ? prompt.substring(0, 997) + "..." : prompt;
      
      const model = this.bytez.model("openai/dall-e-2");
      const { error, output } = await model.run(finalPrompt);

      if (error) throw new Error(`Bytez API Error: ${JSON.stringify(error)}`);
      
      if (output) {
        const imageUrl = typeof output === 'string' ? output : output[0];
        return {
          url: imageUrl,
          revised_prompt: prompt
        };
      }
    } catch (error) {
      console.error('Bytez Generation Error:', error.message);
      return null;
    }
  }

  // Helper: Try OpenAI Generation
  async tryOpenAI(prompt) {
    try {
      console.log('🎨 Generating clean diagram image with OpenAI DALL-E...');
      const response = await this.openaiText.images.generate({
        model: "dall-e-3",
        prompt: prompt,
        n: 1,
        size: "1024x1024",
        quality: "standard",
      });

      if (response.data && response.data[0] && response.data[0].url) {
        return {
          url: response.data[0].url,
          revised_prompt: response.data[0].revised_prompt || prompt
        };
      }
    } catch (error) {
      console.error('OpenAI DALL-E Generation Error:', error.message);
      return null;
    }
  }

  // Step 5: Detect component positions on clean image (without pre-built labels)
  async detectLabelPositions(imageUrl, components) {
    try {
      const prompt = `Analyze this educational diagram of ${components.join(', ')}.

This is a CLEAN diagram WITHOUT any text labels or annotations.

Your task: Identify where each component is located and suggest the BEST position to place a label.

Return ONLY a JSON array in this exact format:
[
  {"name": "Component Name", "x": 450, "y": 320},
  {"name": "Component Name", "x": 230, "y": 180}
]

Guidelines:
- x and y should be pixel coordinates (0-1024) where a label should be placed
- Position labels near their respective components
- Space labels evenly - don't cluster them together
- For left-side labels (x < 200), place them on the left side of the image
- For right-side labels (x > 824), place them on the right side
- All components listed must be included`;

      const response = await this.openaiText.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at analyzing diagrams and suggesting optimal label positions. Always respond with valid JSON only.'
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: imageUrl } }
            ]
          }
        ],
        max_tokens: 1000
      });

      const content = response.choices[0].message.content;
      // Extract JSON from response
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/```\n?([\s\S]*?)\n?```/) || content.match(/(\[[\s\S]*\])/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;
      
      return JSON.parse(jsonStr);
    } catch (error) {
      console.error('Label Detection Error:', error);
      
      // Check for quota exceeded error
      if (error.status === 429 || (error.error && error.error.code === 'insufficient_quota')) {
        console.warn('⚠️ OpenAI Quota Exceeded - Using fallback label positions');
        // Return a special flag or just the estimated positions
        const estimated = this.estimateLabelPositions(components);
        // Add a flag to indicate this was a fallback due to quota
        estimated._quotaExceeded = true;
        return estimated;
      }
      
      // Fallback to estimated positions with better distribution
      return this.estimateLabelPositions(components);
    }
  }

  // Step 9: Generate comprehensive component explanation with YouTube recommendations
  async generateComponentExplanation(concept, component) {
    try {
      const prompt = `Provide a comprehensive educational explanation of "${component}" in the context of "${concept}".

Structure your response with these sections:

1. OVERVIEW (2-3 sentences)
   - What is this component?
   - Where is it located in the system?

2. FUNCTION & PURPOSE (2-3 sentences)
   - What does it do?
   - Why is it important?

3. HOW IT WORKS (3-4 sentences)
   - Explain the mechanism/process
   - Use simple terms suitable for students

4. KEY FACTS
   - 2-3 interesting facts about this component

5. REAL-WORLD EXAMPLES
   - Where else do we see similar mechanisms?

Keep the total response concise but informative (about 150-200 words). Make it engaging and educational.`;

      const response = await this.openaiText.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are an expert educational content creator. Explain technical components comprehensively but in an engaging, easy-to-understand way for students.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.5,
        max_tokens: 800
      });

      const explanation = response.choices[0].message.content;
      
      // Generate YouTube search queries for video recommendations
      const videoQueries = [
        `how ${component} works in ${concept}`,
        `${component} function and purpose`,
        `${concept} ${component} explained`,
        `${component} animation educational`
      ];

      return {
        component: component,
        concept: concept,
        explanation: explanation,
        videoQuery: videoQueries[0],
        videoQueries: videoQueries,
        youtubeUrls: videoQueries.map(q => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`)
      };
    } catch (error) {
      console.error('Explanation Generation Error:', error);
      return {
        component: component,
        concept: concept,
        explanation: `${component} is a crucial part of the ${concept} system. It plays a vital role in the overall functionality and operation. Understanding how ${component} works helps us comprehend the complete system better.`,
        videoQuery: `how ${component} works in ${concept}`,
        videoQueries: [`how ${component} works in ${concept}`],
        youtubeUrls: [`https://www.youtube.com/results?search_query=${encodeURIComponent(`how ${component} works in ${concept}`)}`]
      };
    }
  }

  // Fallback: Extract components without AI
  fallbackComponentExtraction(topic) {
    const lowerTopic = topic.toLowerCase();
    
    // Common component mappings
    const knownSystems = {
      engine: ['Cylinder', 'Piston', 'Spark Plug', 'Crankshaft', 'Fuel Injector', 'Valves'],
      car: ['Engine', 'Transmission', 'Wheels', 'Brakes', 'Battery', 'Radiator'],
      digestive: ['Mouth', 'Esophagus', 'Stomach', 'Small Intestine', 'Large Intestine', 'Liver'],
      heart: ['Right Atrium', 'Left Atrium', 'Right Ventricle', 'Left Ventricle', 'Aorta', 'Valves'],
      brain: ['Cerebrum', 'Cerebellum', 'Brain Stem', 'Frontal Lobe', 'Parietal Lobe', 'Occipital Lobe'],
      photosynthesis: ['Chloroplast', 'Stomata', 'Xylem', 'Phloem', 'Leaf Blade', 'Veins'],
      computer: ['CPU', 'RAM', 'Hard Drive', 'Motherboard', 'Power Supply', 'Graphics Card'],
      circuit: ['Resistor', 'Capacitor', 'Transistor', 'Diode', 'Inductor', 'IC Chip']
    };
    
    const key = Object.keys(knownSystems).find(k => lowerTopic.includes(k));
    const components = key ? knownSystems[key] : ['Main Component', 'Secondary Part', 'Support Structure', 'Control Unit', 'Input', 'Output'];
    
    return {
      concept: topic,
      components: components,
      description: `Educational diagram of ${topic}`
    };
  }

  // Fallback: Estimate label positions in a grid layout
  estimateLabelPositions(components) {
    const positions = [];
    const count = components.length;
    const cols = Math.ceil(Math.sqrt(count));
    const rows = Math.ceil(count / cols);
    
    const cellWidth = 1024 / (cols + 1);
    const cellHeight = 1024 / (rows + 1);
    
    components.forEach((component, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      
      positions.push({
        name: component,
        x: Math.round((col + 1) * cellWidth),
        y: Math.round((row + 1) * cellHeight)
      });
    });
    
    return positions;
  }

  // New, simplified function for image-only generation
  async generateImageOnly(topic) {
    try {
        console.log(`🖼️  Generating image only for: ${topic}`);
        // Create a prompt for a clean, unlabeled image
        const prompt = this.createDiagramPrompt(topic, []);
        const imageResult = await this.generateDiagramImage(prompt);
        console.log('✅ Image generated (image-only mode)');

        return {
            success: true,
            image: imageResult.url,
            title: topic,
            description: `A high-quality diagram of ${topic}.`
        };
    } catch (error) {
        console.error('Image-Only Generation Failed:', error);
        return {
            success: false,
            error: error.message
        };
    }
  }

  // Complete workflow: Step 1-5
  async generateCompleteDiagram(topic, preextractedComponents = null) {
    console.log(`🎨 Generating diagram for: ${topic}`);
    
    try {
      // Step 2: Analyze concept (or use pre-extracted components)
      const analysis = preextractedComponents 
        ? { concept: topic, components: preextractedComponents, description: `Educational diagram of ${topic}` }
        : await this.analyzeConcept(topic);
        
      console.log('✅ Components extracted:', analysis.components);
      
      // Step 3: Create prompt
      const prompt = this.createDiagramPrompt(analysis.concept, analysis.components);
      
      // Step 4: Generate image
      const imageResult = await this.generateDiagramImage(prompt);
      console.log('✅ Image generated');
      
      // Step 5: Detect positions
      const labels = await this.detectLabelPositions(imageResult.url, analysis.components);
      console.log('✅ Label positions detected');
      
      return {
        success: true,
        image: imageResult.url,
        concept: analysis.concept,
        description: analysis.description,
        labels: labels,
        prompt: prompt,
        revised_prompt: imageResult.revised_prompt,
        quotaExceeded: labels._quotaExceeded || false
      };
    } catch (error) {
      console.error('Diagram Generation Failed:', error);
      return {
        success: false,
        error: error.message,
        fallback: true
      };
    }
  }
}

module.exports = DiagramGenerationService;
