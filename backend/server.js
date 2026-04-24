const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;
const MONGODB_URI = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Models
const Topic = require('./models/Topic');
const User = require('./models/User');
const Content = require('./models/Content');

// Middleware
const { auth, generateToken } = require('./middleware/auth');

// Basic middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB Connected');
  })
  .catch((err) => {
    console.error('❌ MongoDB Connection Error:', err);
  });

// Basic routes
app.get('/', (req, res) => {
  res.json({
    name: 'VisualLearn API',
    version: '1.0.0',
    status: 'running',
    database: 'MongoDB Connected',
    endpoints: {
      api: '/api',
      topics: '/api/topics'
    }
  });
});

app.get('/api', (req, res) => {
  res.json({
    name: 'VisualLearn API',
    version: '1.0.0',
    status: 'running'
  });
});

app.get('/api/topics', async (req, res) => {
  try {
    const topics = await Topic.find().sort({ createdAt: -1 }).limit(10);
    res.json({
      success: true,
      message: 'Topics retrieved from MongoDB',
      count: topics.length,
      data: topics
    });
  } catch (error) {
    console.error('Error fetching topics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch topics',
      error: error.message
    });
  }
});

app.get('/api/topics/popular', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    // Get most viewed content to determine popular topics
    const popularContent = await Content.find({ isPublic: true })
      .sort({ views: -1 })
      .limit(limit);
    
    // Extract unique topics from popular content
    const topicNames = [...new Set(popularContent.map(item => item.topic))];
    
    // Get topic details
    const topics = await Topic.find({ topic: { $in: topicNames } });
    
    res.json({
      success: true,
      message: 'Popular topics retrieved',
      count: topics.length,
      data: {
        topics
      }
    });
  } catch (error) {
    console.error('Error fetching popular topics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch popular topics',
      error: error.message
    });
  }
});

app.post('/api/topics', async (req, res) => {
  try {
    const { topic, type, description } = req.body;
    
    if (!topic || topic.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Topic must be at least 3 characters long'
      });
    }
    
    const newTopic = new Topic({
      topic: topic.trim(),
      type: type || 'programming',
      description: description || ''
    });
    
    const savedTopic = await newTopic.save();
    res.status(201).json({
      success: true,
      message: 'Topic created successfully',
      data: savedTopic
    });
  } catch (error) {
    console.error('Error creating topic:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create topic',
      error: error.message
    });
  }
});

// Authentication Routes

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide username, email, and password'
      });
    }
    
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email or username already exists'
      });
    }
    
    // Create new user
    const user = new User({ username, email, password });
    await user.save();
    
    // Generate token
    const token = generateToken(user._id);
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }
    
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Generate token
    const token = generateToken(user._id);
    
    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
});

// Get current user (protected route)
app.get('/api/auth/me', auth, async (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
});

// Content Management Routes (CRUD)

// Create content (protected)
app.post('/api/content', auth, async (req, res) => {
  try {
    const { title, topic, type, description, data, isPublic } = req.body;
    
    // Validation
    if (!title || !topic || !type || !data) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title, topic, type, and data'
      });
    }
    
    const content = new Content({
      title: title.trim(),
      topic: topic.trim(),
      type,
      description: description || '',
      data,
      createdBy: req.user._id,
      isPublic: isPublic !== undefined ? isPublic : true
    });
    
    await content.save();
    
    res.status(201).json({
      success: true,
      message: 'Content created successfully',
      data: content
    });
  } catch (error) {
    console.error('Content creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create content',
      error: error.message
    });
  }
});

// Get all content (public)
app.get('/api/content', async (req, res) => {
  try {
    const { topic, type, page = 1, limit = 10 } = req.query;
    
    const query = { isPublic: true };
    if (topic) query.topic = new RegExp(topic, 'i');
    if (type) query.type = type;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const contents = await Content.find(query)
      .populate('createdBy', 'username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Content.countDocuments(query);
    
    res.json({
      success: true,
      message: 'Content retrieved successfully',
      count: contents.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: contents
    });
  } catch (error) {
    console.error('Content fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch content',
      error: error.message
    });
  }
});

// Get single content by ID
app.get('/api/content/:id', async (req, res) => {
  try {
    const content = await Content.findById(req.params.id)
      .populate('createdBy', 'username');
    
    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }
    
    // Increment views
    content.views += 1;
    await content.save();
    
    res.json({
      success: true,
      data: content
    });
  } catch (error) {
    console.error('Content fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch content',
      error: error.message
    });
  }
});

// Update content (protected - only owner)
app.put('/api/content/:id', auth, async (req, res) => {
  try {
    const content = await Content.findById(req.params.id);
    
    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }
    
    // Check ownership
    if (content.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only edit your own content'
      });
    }
    
    const { title, topic, type, description, data, isPublic } = req.body;
    
    // Update fields
    if (title) content.title = title.trim();
    if (topic) content.topic = topic.trim();
    if (type) content.type = type;
    if (description !== undefined) content.description = description;
    if (data) content.data = data;
    if (isPublic !== undefined) content.isPublic = isPublic;
    
    content.updatedAt = Date.now();
    await content.save();
    
    res.json({
      success: true,
      message: 'Content updated successfully',
      data: content
    });
  } catch (error) {
    console.error('Content update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update content',
      error: error.message
    });
  }
});

// Delete content (protected - only owner)
app.delete('/api/content/:id', auth, async (req, res) => {
  try {
    const content = await Content.findById(req.params.id);
    
    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }
    
    // Check ownership
    if (content.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only delete your own content'
      });
    }
    
    await Content.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      message: 'Content deleted successfully'
    });
  } catch (error) {
    console.error('Content deletion error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete content',
      error: error.message
    });
  }
});

// Get user's own content (protected)
app.get('/api/my-content', auth, async (req, res) => {
  try {
    const contents = await Content.find({ createdBy: req.user._id })
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: contents.length,
      data: contents
    });
  } catch (error) {
    console.error('My content fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch your content',
      error: error.message
    });
  }
});

// Search functionality
app.get('/api/search', async (req, res) => {
  try {
    const { q, type, page = 1, limit = 10 } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a search query (at least 2 characters)'
      });
    }
    
    const searchQuery = {
      $text: { $search: q },
      isPublic: true
    };
    
    if (type) searchQuery.type = type;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const contents = await Content.find(searchQuery, { score: { $meta: 'textScore' } })
      .populate('createdBy', 'username')
      .sort({ score: { $meta: 'textScore' } })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Content.countDocuments(searchQuery);
    
    // Also search topics
    const topics = await Topic.find({
      $or: [
        { topic: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } }
      ]
    }).limit(5);
    
    res.json({
      success: true,
      query: q,
      contentResults: {
        count: contents.length,
        total,
        data: contents
      },
      topicResults: {
        count: topics.length,
        data: topics
      }
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      success: false,
      message: 'Search failed',
      error: error.message
    });
  }
});

// Get popular content
app.get('/api/content/popular', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const contents = await Content.find({ isPublic: true })
      .populate('createdBy', 'username')
      .sort({ views: -1, likes: -1 })
      .limit(parseInt(limit));
    
    res.json({
      success: true,
      count: contents.length,
      data: contents
    });
  } catch (error) {
    console.error('Popular content error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch popular content',
      error: error.message
    });
  }
});

// Like content
app.post('/api/content/:id/like', async (req, res) => {
  try {
    const content = await Content.findById(req.params.id);
    
    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }
    
    content.likes += 1;
    await content.save();
    
    res.json({
      success: true,
      message: 'Content liked',
      likes: content.likes
    });
  } catch (error) {
    console.error('Like error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to like content',
      error: error.message
    });
  }
});

// ============================================
// NEW ROUTES: Quiz, Progress, Flashcards, Certificates, Chat
// ============================================

// Import new models
const QuizAttempt = require('./models/QuizAttempt');
const LearningProgress = require('./models/LearningProgress');
const Flashcard = require('./models/Flashcard');
const Certificate = require('./models/Certificate');
const ChatMessage = require('./models/ChatMessage');
const SearchHistory = require('./models/SearchHistory');
const Quiz = require('./models/Quiz');

// ----- Search History Routes -----

// Save search history
app.post('/api/search/history', auth, async (req, res) => {
  try {
    const { query, topic, category } = req.body;
    
    if (!query) {
      return res.status(400).json({ success: false, message: 'Query is required' });
    }

    const trimmedQuery = query.trim();
    const normalizedQuery = trimmedQuery.toLowerCase();
    const normalizedTopic = (topic || trimmedQuery).toLowerCase();

    // Prevent duplicates by checking for existing history item with same query/topic for this user
    // Using case-insensitive search to prevent duplicates like "quick sort" and "Quick Sort"
    const existing = await SearchHistory.findOne({
      user: req.user._id,
      $or: [
        { query: { $regex: new RegExp(`^${trimmedQuery}$`, 'i') } },
        { topic: { $regex: new RegExp(`^${(topic || trimmedQuery)}$`, 'i') } }
      ]
    });

    if (existing) {
      existing.createdAt = new Date(); // Update timestamp to move to top of recents
      if (topic) existing.topic = topic; // Update with better topic if provided
      if (category) existing.category = category;
      await existing.save();
      return res.json({ success: true, message: 'History updated', data: existing });
    }
    
    const history = new SearchHistory({
      user: req.user._id,
      query: trimmedQuery,
      topic: topic || trimmedQuery,
      category: category || 'general'
    });
    
    await history.save();
    res.status(201).json({ success: true, data: history });
  } catch (error) {
    console.error('Save history error:', error);
    res.status(500).json({ success: false, message: 'Failed to save search history' });
  }
});

// Get top searched topics (global or user-specific)
app.get('/api/search/top-topics', auth, async (req, res) => {
  try {
    // Aggregation to count occurrences of each topic/query, sorted by frequency
    const topTopics = await SearchHistory.aggregate([
      {
        $group: {
          _id: { $toLower: "$topic" },
          topic: { $first: "$topic" },
          category: { $first: "$category" },
          count: { $sum: 1 },
          lastSearched: { $max: "$createdAt" }
        }
      },
      { $sort: { count: -1, lastSearched: -1 } },
      { $limit: 10 }
    ]);
    
    res.json({ success: true, data: topTopics });
  } catch (error) {
    console.error('Get top topics error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch top topics' });
  }
});

// Get user's search history
app.get('/api/search/history', auth, async (req, res) => {
  try {
    const history = await SearchHistory.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20);
    
    res.json({ success: true, data: history });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch search history' });
  }
});

// Delete specific history item
app.delete('/api/search/history/:id', auth, async (req, res) => {
  try {
    await SearchHistory.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    res.json({ success: true, message: 'History item deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete history item' });
  }
});

// Clear all history
app.delete('/api/search/history', auth, async (req, res) => {
  try {
    await SearchHistory.deleteMany({ user: req.user._id });
    res.json({ success: true, message: 'Search history cleared' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to clear search history' });
  }
});

// ----- Quiz Routes -----

// Generate quiz questions
app.post('/api/quiz/generate', auth, async (req, res) => {
  try {
    const { topic, difficulty, language = 'en', questionCount = 5, refresh = false } = req.body;
    
    if (!topic) {
      return res.status(400).json({ success: false, message: 'Topic is required' });
    }

    const normalizedTopic = topic.toLowerCase().trim();
    const escapedTopic = normalizedTopic.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // 1. Check if we have enough questions in DB for this topic and difficulty (unless refresh is true)
    if (!refresh) {
      const existingQuiz = await Quiz.findOne({
        topic: { $regex: new RegExp(`^${escapedTopic}$`, 'i') },
        difficulty,
        language
      });

      if (existingQuiz && existingQuiz.questions.length >= questionCount) {
        console.log(`✅ Found pooled quiz for: ${topic} (${difficulty}). Picking ${questionCount} random.`);
        // Shuffle and take questionCount questions
        const shuffled = [...existingQuiz.questions].sort(() => Math.random() - 0.5);
        const selected = shuffled.slice(0, questionCount);
        
        return res.json({
          success: true,
          data: {
            ...existingQuiz._doc,
            questions: selected
          },
          cached: true
        });
      }
    }

    console.log(`🧠 Generating ${refresh ? 'MORE' : 'NEW'} quiz questions for: ${topic} (${difficulty})`);
    const quizData = await aiGenerator.generateQuiz(topic, difficulty, language, questionCount);
    
    // 2. Save/Update pooled quiz in DB
    try {
      let existingQuiz = await Quiz.findOne({
        topic: { $regex: new RegExp(`^${escapedTopic}$`, 'i') },
        difficulty,
        language
      });

      if (existingQuiz) {
        // Append new questions, avoiding duplicates by question text
        const existingTexts = new Set(existingQuiz.questions.map(q => q.question.toLowerCase().trim()));
        const newQuestions = quizData.questions.filter(q => !existingTexts.has(q.question.toLowerCase().trim()));
        
        // Ensure new questions have unique IDs within the quiz pool
        const maxId = Math.max(...existingQuiz.questions.map(q => parseInt(q.id) || 0), 0);
        newQuestions.forEach((q, idx) => {
          q.id = (maxId + idx + 1).toString();
        });

        existingQuiz.questions.push(...newQuestions);
        await existingQuiz.save();
        console.log(`💾 Added ${newQuestions.length} new questions to pooled quiz cache`);
        
        // Shuffle and return requested count from the entire pool
        const shuffled = [...existingQuiz.questions].sort(() => Math.random() - 0.5);
        const selected = shuffled.slice(0, questionCount);

        return res.json({
          success: true,
          data: {
            ...existingQuiz._doc,
            questions: selected
          }
        });
      } else {
        const newQuiz = new Quiz({
          topic: normalizedTopic,
          difficulty,
          questionCount: quizData.questions.length, // Total in pool
          questions: quizData.questions,
          language
        });
        await newQuiz.save();
        console.log('💾 New pooled quiz saved to database');
        
        return res.json({
          success: true,
          data: {
            ...newQuiz._doc,
            questions: quizData.questions.sort(() => Math.random() - 0.5).slice(0, questionCount)
          }
        });
      }
    } catch (saveError) {
      console.warn('⚠️ Failed to save quiz pool:', saveError.message);
      // Fallback: return generated data even if saving failed
      return res.json({
        success: true,
        data: quizData
      });
    }
  } catch (error) {
    console.error('Quiz generation error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate quiz' });
  }
});

// Get all questions in pool for a topic
app.get('/api/quiz/pool', auth, async (req, res) => {
  try {
    const { topic, difficulty } = req.query;
    
    if (!topic) {
      return res.status(400).json({ success: false, message: 'Topic is required' });
    }
    
    const normalizedTopic = topic.toLowerCase().trim();
    const escapedTopic = normalizedTopic.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    const query = {
      topic: { $regex: new RegExp(`^${escapedTopic}$`, 'i') }
    };
    
    if (difficulty) {
      query.difficulty = difficulty;
    }
    
    const quizzes = await Quiz.find(query);
    
    // Flatten all questions from all difficulty levels if difficulty not specified
    const allQuestions = quizzes.reduce((acc, quiz) => {
      return acc.concat(quiz.questions.map(q => ({
        ...q.toObject(),
        difficulty: quiz.difficulty // Ensure difficulty is included
      })));
    }, []);
    
    res.json({
      success: true,
      data: allQuestions
    });
  } catch (error) {
    console.error('Get quiz pool error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch quiz pool' });
  }
});

// Add a new question to the pool
app.post('/api/quiz/pool/add', auth, async (req, res) => {
  try {
    const { topic, difficulty, question, options, correctAnswer, explanation } = req.body;
    
    if (!topic || !difficulty || !question || !options || correctAnswer === undefined) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    
    const normalizedTopic = topic.toLowerCase().trim();
    const escapedTopic = normalizedTopic.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    let quiz = await Quiz.findOne({
      topic: { $regex: new RegExp(`^${escapedTopic}$`, 'i') },
      difficulty
    });
    
    const newQuestion = {
      id: Date.now().toString(),
      question,
      options,
      correctAnswer,
      explanation,
      difficulty
    };
    
    if (quiz) {
      quiz.questions.push(newQuestion);
      quiz.questionCount = quiz.questions.length;
      await quiz.save();
    } else {
      quiz = new Quiz({
        topic: normalizedTopic,
        difficulty,
        questionCount: 1,
        questions: [newQuestion],
        language: 'en'
      });
      await quiz.save();
    }
    
    res.status(201).json({
      success: true,
      message: 'Question added to pool',
      data: newQuestion
    });
  } catch (error) {
    console.error('Add to quiz pool error:', error);
    res.status(500).json({ success: false, message: 'Failed to add question to pool' });
  }
});

// Submit quiz attempt
app.post('/api/quiz/submit', auth, async (req, res) => {
  try {
    const { topic, difficulty, score, totalQuestions, correctAnswers, timeTaken, answers, accuracy } = req.body;
    
    const quizAttempt = new QuizAttempt({
      user: req.user._id,
      topic,
      difficulty,
      score,
      totalQuestions,
      correctAnswers,
      timeTaken,
      answers,
      accuracy
    });
    
    await quizAttempt.save();
    
    // Award certificate if score >= 80%
    if (accuracy >= 80) {
      const grade = accuracy >= 95 ? 'A+' : accuracy >= 90 ? 'A' : accuracy >= 85 ? 'B+' : 'B';
      const certificate = new Certificate({
        user: req.user._id,
        title: `${topic} - ${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} Level`,
        topic,
        description: `Completed ${difficulty} level quiz with ${accuracy}% accuracy`,
        score: accuracy,
        grade
      });
      await certificate.save();
    }
    
    res.status(201).json({
      success: true,
      message: 'Quiz submitted successfully',
      quizAttempt
    });
  } catch (error) {
    console.error('Quiz submit error:', error);
    res.status(500).json({ success: false, message: 'Failed to submit quiz' });
  }
});

// Get user's quiz attempts
app.get('/api/quiz/history', auth, async (req, res) => {
  try {
    const attempts = await QuizAttempt.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20);
    
    const stats = await QuizAttempt.getUserStats(req.user._id);
    
    res.json({ success: true, attempts, stats });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch quiz history' });
  }
});

// Get quiz stats only
app.get('/api/quiz/stats', auth, async (req, res) => {
  try {
    const stats = await QuizAttempt.getUserStats(req.user._id);
    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch quiz stats' });
  }
});

// ----- Learning Progress Routes -----

// Update learning progress
app.post('/api/progress/update', auth, async (req, res) => {
  try {
    const { topic, progress, timeSpent, completed } = req.body;
    
    let learningProgress = await LearningProgress.findOne({
      user: req.user._id,
      topic
    });
    
    if (learningProgress) {
      learningProgress.progress = progress || learningProgress.progress;
      learningProgress.timeSpent += timeSpent || 0;
      learningProgress.lastStudied = new Date();
      if (completed) {
        learningProgress.completed = true;
        learningProgress.completedAt = new Date();
      }
    } else {
      learningProgress = new LearningProgress({
        user: req.user._id,
        topic,
        progress: progress || 0,
        timeSpent: timeSpent || 0,
        completed: completed || false
      });
    }
    
    await learningProgress.save();
    res.json({ success: true, progress: learningProgress });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update progress' });
  }
});

// Get user's learning progress
app.get('/api/progress', auth, async (req, res) => {
  try {
    const progress = await LearningProgress.find({ user: req.user._id })
      .sort({ lastStudied: -1 });
    
    const stats = await LearningProgress.getUserStats(req.user._id);
    const streak = await LearningProgress.getStudyStreak(req.user._id);
    
    res.json({ success: true, progress, stats, streak });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch progress' });
  }
});

// ----- Flashcard Routes -----

// Generate flashcards using AI
app.post('/api/flashcards/generate', auth, async (req, res) => {
  try {
    const { topic, count = 10, language = 'en', refresh = false } = req.body;
    
    if (!topic) {
      return res.status(400).json({ success: false, message: 'Topic is required' });
    }

    const normalizedTopic = topic.toLowerCase().trim();
    const escapedTopic = normalizedTopic.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Helper to get exactly 10 cards with 3 easy, 5 medium, 2 hard distribution from local array
    const getDistributedCards = (allCards) => {
      if (allCards.length === 0) return [];
      
      const easy = allCards.filter(c => c.difficulty === 'easy').sort(() => Math.random() - 0.5);
      const medium = allCards.filter(c => c.difficulty === 'medium').sort(() => Math.random() - 0.5);
      const hard = allCards.filter(c => c.difficulty === 'hard').sort(() => Math.random() - 0.5);
      
      let selected = [
        ...easy.slice(0, 3),
        ...medium.slice(0, 5),
        ...hard.slice(0, 2)
      ];
      
      // If we don't have enough to fulfill the 3/5/2 but have more cards, just pick random ones to make it 10
      if (selected.length < 10 && allCards.length > selected.length) {
        const selectedIds = new Set(selected.map(s => s._id.toString()));
        const remaining = allCards.filter(c => !selectedIds.has(c._id.toString()));
        const countNeeded = Math.min(10 - selected.length, remaining.length);
        selected.push(...remaining.sort(() => Math.random() - 0.5).slice(0, countNeeded));
      }
      
      // If still less than 10 but we have cards, just return what we have (randomized)
      return selected.sort(() => Math.random() - 0.5);
    };

    // 1. Check if cards for this topic already exist for this user (unless refresh is true)
    if (!refresh) {
      let existingCards = await Flashcard.find({
        user: req.user._id,
        topic: { $regex: new RegExp(`^${escapedTopic}$`, 'i') }
      });

      if (existingCards.length >= 10) {
        console.log(`✅ Found ${existingCards.length} existing flashcards for: ${topic}. Picking 10.`);
        const distributed = getDistributedCards(existingCards);
        return res.json({
          success: true,
          data: {
            topic: existingCards[0].topic,
            flashcards: distributed
          },
          cached: true
        });
      }
    }

    console.log(`🧠 Generating ${refresh ? 'MORE' : 'NEW'} flashcards for: ${topic}`);
    const aiGenerator = require('./services/aiContentGenerator');
    const generator = new aiGenerator();
    
    // Explicitly ask AI for the distribution
    const promptOverride = `Generate exactly 10 flashcards: 3 easy, 5 medium, and 2 hard ones about the topic: "${topic}".`;
    const flashcardData = await generator.generateFlashcards(topic, 10, language, promptOverride);
    
    // 2. Save newly generated flashcards to DB for the user
    const savedCards = [];
    try {
      for (const card of flashcardData.flashcards) {
        const newCard = new Flashcard({
          user: req.user._id,
          topic: flashcardData.topic || topic,
          front: card.front,
          back: card.back,
          difficulty: card.difficulty || 'medium'
        });
        const saved = await newCard.save();
        savedCards.push(saved);
      }
      console.log(`💾 ${savedCards.length} new flashcards saved to database`);

      // After saving, we pick exactly 10 with the distribution from ALL available cards
      const allCards = await Flashcard.find({
        user: req.user._id,
        topic: { $regex: new RegExp(`^${escapedTopic}$`, 'i') }
      });
      
      const distributed = getDistributedCards(allCards);

      // ----- Restore: Generate Learn Content in background if it doesn't exist -----
      try {
        const normalizedQuery = (flashcardData.topic || topic).toLowerCase().trim();
        const existingContent = await Content.findOne({
          topic: { $regex: new RegExp(`^${normalizedQuery}$`, 'i') }
        });

        if (!existingContent) {
          console.log(`🧠 Pre-generating learn content for: ${topic}`);
          // Don't 'await' this so we don't block the flashcard response
          generator.generateContent(topic, language).then(async (result) => {
            const newCache = new Content({
              title: result.title,
              topic: normalizedQuery,
              type: result.type || 'concept',
              description: result.introduction || `Learning content for ${topic}`,
              data: result,
              isPublic: true
            });
            await newCache.save();
            console.log('💾 Background learn content saved to database');
          }).catch(err => console.warn('⚠️ Background content generation failed:', err.message));
        }
      } catch (contentErr) {
        console.warn('⚠️ Non-critical: Failed to check/pre-generate learn content:', contentErr.message);
      }
      // -------------------------------------------------------------------------
      
      return res.json({
        success: true,
        data: {
          topic: flashcardData.topic || topic,
          flashcards: distributed
        }
      });
    } catch (saveError) {
      console.warn('⚠️ Failed to save flashcard cache:', saveError.message);
    }

    res.json({
      success: true,
      data: {
        topic: flashcardData.topic || topic,
        flashcards: flashcardData.flashcards
      }
    });
  } catch (error) {
    console.error('Flashcard generation error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate flashcards' });
  }
});

// Create flashcard
app.post('/api/flashcards', auth, async (req, res) => {
  try {
    const { topic, front, back, difficulty } = req.body;
    
    const flashcard = new Flashcard({
      user: req.user._id,
      topic,
      front,
      back,
      difficulty
    });
    
    await flashcard.save();
    res.status(201).json({ success: true, flashcard });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create flashcard' });
  }
});

// Get user's flashcards due for review
app.get('/api/flashcards/due', auth, async (req, res) => {
  try {
    const cards = await Flashcard.getDueCards(req.user._id, 20);
    res.json({ success: true, cards });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch flashcards' });
  }
});

// Get all user's flashcards
app.get('/api/flashcards', auth, async (req, res) => {
  try {
    const { topic } = req.query;
    const query = { user: req.user._id };
    if (topic) query.topic = topic;
    
    const cards = await Flashcard.find(query).sort({ createdAt: -1 });
    const stats = await Flashcard.getUserStats(req.user._id);
    
    res.json({ success: true, cards, stats });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch flashcards' });
  }
});

// Review flashcard
app.post('/api/flashcards/:id/review', auth, async (req, res) => {
  try {
    const { correct } = req.body;
    
    const flashcard = await Flashcard.findOne({
      _id: req.params.id,
      user: req.user._id
    });
    
    if (!flashcard) {
      return res.status(404).json({ success: false, message: 'Flashcard not found' });
    }
    
    flashcard.reviewCount++;
    flashcard.lastReviewed = new Date();
    
    if (correct) {
      flashcard.correctCount++;
      // Mark as mastered after 5 correct reviews
      if (flashcard.correctCount >= 5) {
        flashcard.mastered = true;
      }
    } else {
      flashcard.incorrectCount++;
    }
    
    // Simple spaced repetition: next review in 1, 3, 7, or 14 days based on correct streak
    const days = [1, 3, 7, 14][Math.min(flashcard.correctCount, 3)];
    flashcard.nextReview = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    
    await flashcard.save();
    res.json({ success: true, flashcard });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to review flashcard' });
  }
});

// ----- Certificate Routes -----

// Get user's certificates
app.get('/api/certificates', auth, async (req, res) => {
  try {
    const certificates = await Certificate.find({ user: req.user._id })
      .sort({ issueDate: -1 });
    res.json({ success: true, certificates });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch certificates' });
  }
});

// ----- Chat Routes -----

// Save chat message
app.post('/api/chat/message', auth, async (req, res) => {
  try {
    const { role, content, topic, attachments } = req.body;
    
    const message = new ChatMessage({
      user: req.user._id,
      role,
      content,
      topic: topic || 'general',
      attachments: attachments || []
    });
    
    await message.save();
    res.status(201).json({ success: true, message });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to save message' });
  }
});

// Get chat history
app.get('/api/chat/history', auth, async (req, res) => {
  try {
    const { topic } = req.query;
    
    let messages;
    if (topic) {
      messages = await ChatMessage.getTopicChat(req.user._id, topic, 50);
    } else {
      messages = await ChatMessage.getUserChat(req.user._id, 50);
    }
    
    res.json({ success: true, messages });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch chat history' });
  }
});

// Clear chat history
app.delete('/api/chat/history', auth, async (req, res) => {
  try {
    const { topic } = req.query;
    const query = { user: req.user._id };
    if (topic) query.topic = topic;
    
    await ChatMessage.deleteMany(query);
    res.json({ success: true, message: 'Chat history cleared' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to clear chat history' });
  }
});

// Profile Routes
app.get('/api/user/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error fetching profile' });
  }
});

app.put('/api/user/profile', auth, async (req, res) => {
  try {
    const { 
      fullName, age, gender, bio, interests, 
      educationLevel, schoolClass, schoolStream, 
      collegeDegree, collegeYear 
    } = req.body;

    const updateData = {
      fullName, age, gender, bio, interests,
      education: {
        level: educationLevel,
        schoolDetails: {
          class: schoolClass,
          stream: schoolStream
        },
        collegeDetails: {
          degree: collegeDegree,
          year: collegeYear
        }
      }
    };

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({ success: true, user });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: 'Server error updating profile' });
  }
});

// Get all user stats for dashboard
app.get('/api/user/dashboard', auth, async (req, res) => {
  try {
    const userId = req.user._id;

    // 1. Fetch data in parallel
    const [quizAttempts, learningProgress, flashcardStats, dbStreak, certificates, searchHistory] = await Promise.all([
      QuizAttempt.find({ user: userId }),
      LearningProgress.find({ user: userId }),
      Flashcard.getUserStats(userId),
      LearningProgress.getStudyStreak(userId),
      Certificate.find({ user: userId }).sort({ issueDate: -1 }).limit(5),
      SearchHistory.find({ user: userId })
    ]);

    // Ensure streak starts from at least 1 if there's any activity
    // "1 se count karna" means any history should result in at least a 1-day streak
    const totalActivity = quizAttempts.length + learningProgress.length + searchHistory.length;
    let streak = 0;
    if (totalActivity > 0) {
      streak = Math.max(dbStreak, 1);
    }

    // 2. Calculate Topics Started (Unique topics searched)
    const uniqueSearchedTopics = [...new Set(searchHistory.map(h => (h.topic || h.query).toLowerCase().trim()))];
    const topicsStarted = uniqueSearchedTopics.length;

    // 3. Calculate Topics Completed (Searched + Quiz Accuracy >= 60%)
    // Find unique topics that have at least one quiz attempt with accuracy >= 60
    const quizPassedTopics = new Set(
      quizAttempts
        .filter(attempt => attempt.accuracy >= 60)
        .map(attempt => attempt.topic.toLowerCase().trim())
    );
    
    // Intersection of searched topics and quiz passed topics
    const completedTopicsCount = uniqueSearchedTopics.filter(topic => quizPassedTopics.has(topic)).length;

    // 4. Calculate Study Time (Total active time)
    // Sum of LearningProgress time (minutes) + QuizAttempt time (seconds to minutes)
    const learningTime = learningProgress.reduce((sum, p) => sum + (p.timeSpent || 0), 0);
    const quizTime = quizAttempts.reduce((sum, a) => sum + ((a.timeTaken || 0) / 60), 0);
    const totalStudyTimeMinutes = learningTime + quizTime;

    // 5. Quiz Stats for StatCard
    const quizStats = {
      totalAttempts: quizAttempts.length,
      averageScore: quizAttempts.length > 0 
        ? quizAttempts.reduce((sum, a) => sum + a.accuracy, 0) / quizAttempts.length 
        : 0
    };

    const recentProgress = await LearningProgress.find({ user: userId })
      .sort({ lastStudied: -1 })
      .limit(5);

    const recentHistory = await SearchHistory.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(6);
    
    res.json({
      success: true,
      stats: {
        quiz: quizStats,
        learning: {
          totalTopics: topicsStarted, // Updated: unique searches
          completedTopics: completedTopicsCount, // Updated: search + quiz >= 60%
          totalStudyTime: totalStudyTimeMinutes // Updated: learning + quiz time
        },
        flashcards: flashcardStats,
        streak,
        certificates: certificates.length
      },
      recentProgress,
      recentHistory,
      recentCertificates: certificates
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard data' });
  }
});

// API Documentation endpoint
app.get('/api/docs', (req, res) => {
  res.json({
    name: 'VisualLearn API Documentation',
    version: '1.0.0',
    description: 'Educational content management API',
    baseUrl: `http://localhost:${PORT}`,
    authentication: {
      type: 'Bearer Token (JWT)',
      header: 'Authorization: Bearer <token>',
      endpoints: {
        register: { method: 'POST', path: '/api/auth/register', auth: false },
        login: { method: 'POST', path: '/api/auth/login', auth: false },
        getMe: { method: 'GET', path: '/api/auth/me', auth: true }
      }
    },
    endpoints: {
      topics: {
        getAll: { method: 'GET', path: '/api/topics', auth: false },
        create: { method: 'POST', path: '/api/topics', auth: false }
      },
      content: {
        getAll: { method: 'GET', path: '/api/content', auth: false, query: ['topic', 'type', 'page', 'limit'] },
        getOne: { method: 'GET', path: '/api/content/:id', auth: false },
        create: { method: 'POST', path: '/api/content', auth: true },
        update: { method: 'PUT', path: '/api/content/:id', auth: true },
        delete: { method: 'DELETE', path: '/api/content/:id', auth: true },
        popular: { method: 'GET', path: '/api/content/popular', auth: false },
        like: { method: 'POST', path: '/api/content/:id/like', auth: false }
      },
      myContent: {
        getAll: { method: 'GET', path: '/api/my-content', auth: true }
      },
      search: {
        search: { method: 'GET', path: '/api/search', auth: false, query: ['q', 'type', 'page', 'limit'] }
      }
    },
    contentTypes: ['structure', 'process', 'algorithm', 'hierarchy', 'comparison'],
    topicTypes: ['programming', 'science', 'math', 'history', 'language']
  });
});

// ----- InsightLearn AI/NLP Workflow Routes -----

const NLPProcessor = require('./services/nlpProcessor');
const AIContentGenerator = require('./services/aiContentGenerator');
const DiagramGenerationService = require('./services/diagramGenerationService');

const nlp = new NLPProcessor();
const aiGenerator = new AIContentGenerator();
const diagramService = new DiagramGenerationService();

// Step 2: Language selection - Get supported languages
app.get('/api/languages', (req, res) => {
  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸', active: true },
    { code: 'hi', name: 'Hindi', flag: '🇮🇳', active: true },
    { code: 'es', name: 'Spanish', flag: '🇪🇸', active: true },
    { code: 'fr', name: 'French', flag: '🇫🇷', active: true },
    { code: 'de', name: 'German', flag: '🇩🇪', active: true },
    { code: 'zh', name: 'Chinese', flag: '🇨🇳', active: true },
    { code: 'ja', name: 'Japanese', flag: '🇯🇵', active: true },
    { code: 'ar', name: 'Arabic', flag: '🇸🇦', active: true }
  ];
  
  res.json({
    success: true,
    languages,
    defaultLanguage: 'en'
  });
});

// Step 3 & 4: Topic Input + NLP Processing
app.post('/api/nlp/analyze', async (req, res) => {
  try {
    const { query, language = 'en' } = req.body;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Query is required'
      });
    }
    
    // Process through NLP pipeline
    const analysis = nlp.analyzeQuery(query);
    
    res.json({
      success: true,
      analysis
    });
  } catch (error) {
    console.error('NLP Analysis Error:', error);
    res.status(500).json({ success: false, message: 'Failed to analyze query' });
  }
});

// NEW ROUTE: Generate Interactive React Flow Diagram
app.post('/api/generate-diagram', auth, async (req, res) => {
  try {
    const { concept } = req.body;
    
    if (!concept) {
      return res.status(400).json({
        success: false,
        message: 'Concept is required'
      });
    }

    console.log(`🚀 Generating interactive diagram for: ${concept}`);

    const prompt = `You are an AI that converts a learning concept into structured diagram data for React Flow. 
Concept: "${concept}"
Return ONLY a JSON object with the following structure:
{
  "title": "Concept Title",
  "nodes": [
    { "id": "1", "label": "Node Label", "explanation": "Detailed explanation of this part.", "example": "A real-world example." }
  ],
  "edges": [
    { "source": "1", "target": "2" }
  ]
}
Ensure the diagram is logical, educational, and has at least 5-8 nodes.`;

    const response = await aiGenerator.openai.openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are a helpful assistant that generates structured JSON for educational diagrams." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }
    });

    const diagramData = JSON.parse(response.choices[0].message.content);

    res.json({
      success: true,
      data: diagramData
    });
  } catch (error) {
    console.error('Diagram Generation Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate diagram',
      error: error.message
    });
  }
});

// Step 5, 6, 7: AI Layer + Content Generation + Diagram
app.post('/api/ai/generate', async (req, res) => {
  try {
    const { query, language = 'en', complexity = 'auto' } = req.body;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Query is required'
      });
    }
    
    // Generate AI content with diagram
    const result = await aiGenerator.generateContent(query, language);
    
    res.json({
      success: true,
      result: {
        ...result,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('AI Generation Error:', error);
    res.status(500).json({
      success: false,
      message: 'AI content generation failed',
      error: error.message
    });
  }
});

// Step 8-9: Get component explanation (popup content)
app.post('/api/component/explain', async (req, res) => {
  try {
    const { concept, component, language = 'en' } = req.body;
    
    if (!concept || !component) {
      return res.status(400).json({
        success: false,
        message: 'Concept and component are required'
      });
    }
    
    console.log(`📚 Step 8-9: Generating explanation for ${component} in ${concept}`);
    
    // Step 9: AI generates explanation
    const explanation = await diagramService.generateComponentExplanation(concept, component);
    
    console.log('✅ Step 10: Sending popup content to frontend');
    
    res.json({
      success: true,
      workflow: {
        step8_clicked: component,
        step9_explained: true,
        step10_popup_ready: true
      },
      data: {
        component: explanation.component,
        concept: explanation.concept,
        explanation: explanation.explanation,
        videoQuery: explanation.videoQuery,
        videoUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(explanation.videoQuery)}`
      }
    });
  } catch (error) {
    console.error('Component Explanation Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate component explanation',
      error: error.message
    });
  }
});

const freeAI = require('./services/freeAIService');

// ... existing code ...

// Full workflow endpoint - Topic → AI Analysis → Interactive Diagram JSON
app.post('/api/learn/query', async (req, res) => {
  try {
    const { query, language = 'en' } = req.body;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Query is required'
      });
    }
    
    console.log(`🚀 Request received for complete interactive learning generation: "${query}"`);
    
    // 1. Check if content exists in DB (Cache)
    const normalizedQuery = query.toLowerCase().trim();
    
    // TEMPORARY: Bypass cache for "binary search" to allow testing of new prompt
    const isTestingBinarySearch = normalizedQuery === 'binary search';
    
    let cachedContent = null;
    if (!isTestingBinarySearch) {
      cachedContent = await Content.findOne({
        $or: [
          { topic: normalizedQuery },
          { title: new RegExp(`^${normalizedQuery}$`, 'i') }
        ]
      });
    }

    if (cachedContent) {
      console.log('✅ Found cached content in database');
      return res.json({
        success: true,
        data: {
          ...cachedContent.data,
          cached: true
        }
      });
    }

    // 2. If not found, use the unified generator for high-fidelity content and visual data
    console.log('🤖 No cache found, generating with AI...');
    const result = await aiGenerator.generateContent(query, language);
    
    // 3. Save to Content model as cache for future searches
    try {
      const newCache = new Content({
        title: result.title,
        topic: normalizedQuery,
        type: result.type || 'concept',
        description: result.introduction || `Learning content for ${query}`,
        data: result,
        isPublic: true
      });
      await newCache.save();
      console.log('💾 AI result saved to database cache');

      // ----- NEW: Generate and Save Flashcards for this content in parallel -----
      try {
        console.log(`🧠 Generating flashcards for new content: ${result.title}`);
        const flashcardData = await aiGenerator.generateFlashcards(result.title, 8, language);
        
        if (flashcardData && flashcardData.flashcards && req.user) {
          const savedCards = [];
          for (const card of flashcardData.flashcards) {
            const newCard = new Flashcard({
              user: req.user._id,
              topic: result.title,
              front: card.front,
              back: card.back,
              difficulty: card.difficulty || 'medium'
            });
            savedCards.push(newCard.save());
          }
          await Promise.all(savedCards);
          console.log(`💾 Saved ${savedCards.length} flashcards for future revision`);
        }
      } catch (flashcardErr) {
        console.warn('⚠️ Non-critical: Failed to pre-generate flashcards:', flashcardErr.message);
      }
      // -------------------------------------------------------------------------
    } catch (saveError) {
      console.warn('⚠️ Failed to save cache to database:', saveError.message);
    }

    // Send a response compatible with the frontend's expectations
    res.json({
      success: true,
      data: {
        ...result,
        ai_generated: true
      }
    });

  } catch (error) {
    console.error('Learn Query Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process learning query',
      error: error.message
    });
  }
});

// Save generated content to user's library
app.post('/api/content/save-generated', auth, async (req, res) => {
  try {
    const { topic, type, data, diagramData } = req.body;
    
    const content = new Content({
      title: topic,
      topic: topic,
      type: type || 'ai-generated',
      description: data.summary || `AI-generated content about ${topic}`,
      data: {
        ...data,
        generatedBy: 'AI',
        generatedAt: new Date()
      },
      createdBy: req.user._id,
      isPublic: false
    });
    
    await content.save();
    
    res.json({
      success: true,
      message: 'Generated content saved to your library',
      content
    });
  } catch (error) {
    console.error('Save Generated Content Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save content'
    });
  }
});

// Catch all other routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 API available at http://localhost:${PORT}/api`);
});