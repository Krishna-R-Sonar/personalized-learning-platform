// server/routes/assignments.js
const express = require('express');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const { PinataSDK } = require('pinata-web3');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Assignment = require('../models/Assignment');
const User = require('../models/User');
const router = express.Router();
const dotenv = require('dotenv');
const fs = require('fs').promises;

dotenv.config();

const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT,
  pinataGateway: 'https://gateway.pinata.cloud',
});

const upload = multer({ dest: 'uploads/' });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const auth = (req, res, next) => {
  const token = req.header('x-auth-token');
  if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};

router.post('/create', auth, upload.single('pdf'), async (req, res) => {
  if (req.user.role !== 'teacher') return res.status(403).json({ msg: 'Access denied' });

  const { type, title, description, resources, rollNos, steps, quizzes } = req.body;
  let parsedResources = [];
  let parsedSteps = [];
  let parsedQuizzes = [];

  console.log('Received form data:', { type, title, description, rollNos, resources, steps, quizzes });
  console.log('Received file:', req.file);

  try {
    if (!type || !title || !rollNos) {
      return res.status(400).json({ msg: 'Type, title, and roll numbers are required' });
    }

    if (!['test', 'homework', 'learning_path', 'resource'].includes(type)) {
      return res.status(400).json({ msg: 'Invalid assignment type' });
    }

    if (type === 'test' || type === 'homework') {
      if (!quizzes || quizzes.trim() === '') {
        return res.status(400).json({ msg: 'Quizzes are required for tests and homework' });
      }
    }

    if (resources) {
      try {
        parsedResources = JSON.parse(resources);
        if (!Array.isArray(parsedResources)) throw new Error('Resources must be an array');
        for (const res of parsedResources) {
          if (!res.title || !res.url) throw new Error('Each resource must have a title and URL');
        }
      } catch (e) {
        console.error('Resource parsing error:', e.message);
        return res.status(400).json({ msg: 'Invalid resources format', error: e.message });
      }
    }

    if (steps) {
      try {
        parsedSteps = JSON.parse(steps);
        if (!Array.isArray(parsedSteps)) throw new Error('Steps must be an array');
        for (const step of parsedSteps) {
          if (!step.title || !step.description) throw new Error('Each step must have a title and description');
        }
      } catch (e) {
        console.error('Steps parsing error:', e.message);
        return res.status(400).json({ msg: 'Invalid steps format', error: e.message });
      }
    }

    if (quizzes) {
      try {
        parsedQuizzes = JSON.parse(quizzes);
        if (!Array.isArray(parsedQuizzes)) throw new Error('Quizzes must be an array');
        if (parsedQuizzes.length === 0) throw new Error('At least one quiz is required');
        for (const quiz of parsedQuizzes) {
          if (!quiz.question || !Array.isArray(quiz.options) || quiz.options.length !== 4 || !quiz.answer || !quiz.options.includes(quiz.answer)) {
            throw new Error('Each quiz must have a question, exactly 4 options, and a correct answer matching one of the options');
          }
          quiz.timed = type === 'test';
        }
      } catch (e) {
        console.error('Quizzes parsing error:', e.message);
        return res.status(400).json({ msg: 'Invalid quizzes format', error: e.message });
      }
    }

    const rollNoArray = rollNos.split(',').map((r) => r.trim()).filter((r) => r);
    if (rollNoArray.length === 0) {
      return res.status(400).json({ msg: 'At least one valid roll number is required' });
    }

    if (req.file) {
      console.log('Uploading PDF to Pinata:', req.file.path);
      try {
        const fileBuffer = await fs.readFile(req.file.path);
        const file = new File([fileBuffer], req.file.originalname, { type: 'application/pdf' });
        const uploadResult = await pinata.upload.file(file);
        parsedResources.push({
          title: req.file.originalname,
          url: `https://gateway.pinata.cloud/ipfs/${uploadResult.IpfsHash}`,
          type: 'pdf',
        });
        await fs.unlink(req.file.path);
        console.log('PDF uploaded successfully:', uploadResult.IpfsHash);
      } catch (pinataErr) {
        console.error('Pinata upload error:', pinataErr.message);
        return res.status(500).json({ msg: 'Failed to upload PDF to IPFS', error: pinataErr.message });
      }
    }

    console.log('Saving assignment to MongoDB');
    const assignment = new Assignment({
      type,
      title,
      description,
      resources: parsedResources,
      quizzes: parsedQuizzes,
      steps: parsedSteps,
      createdBy: req.user.id,
      students: rollNoArray.map((rollNo) => ({ rollNo, progress: 0, score: 0, notified: true })),
    });

    await assignment.save();
    console.log('Assignment saved:', assignment._id);
    res.json(assignment);
  } catch (err) {
    console.error('Assignment creation error:', err.message, err.stack);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

router.get('/student', auth, async (req, res) => {
  if (req.user.role !== 'student') return res.status(403).json({ msg: 'Access denied' });

  try {
    const user = await User.findById(req.user.id);
    if (!user || !user.rollNo) {
      return res.status(400).json({ msg: 'User roll number not found' });
    }

    const assignments = await Assignment.find({ 'students.rollNo': user.rollNo }).populate(
      'createdBy',
      'username'
    );
    res.json(assignments);
  } catch (err) {
    console.error('Fetch student assignments error:', err.message);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

router.put('/submit/:id', auth, async (req, res) => {
  if (req.user.role !== 'student') return res.status(403).json({ msg: 'Access denied' });

  const { answers } = req.body;

  try {
    const user = await User.findById(req.user.id);
    if (!user || !user.rollNo) {
      return res.status(400).json({ msg: 'User roll number not found' });
    }

    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ msg: 'Assignment not found' });

    const student = assignment.students.find((s) => s.rollNo === user.rollNo);
    if (!student) return res.status(403).json({ msg: 'Not assigned to this assignment' });

    let score = 0;
    let answeredQuestions = 0;

    if (assignment.type === 'test' || assignment.type === 'homework') {
      const totalQuestions = assignment.quizzes.length;
      const pointsPerQuestion = 100 / totalQuestions;

      assignment.quizzes.forEach((q, i) => {
        if (answers[i] !== undefined) {
          answeredQuestions++;
          if (q.answer === answers[i]) {
            score += pointsPerQuestion;
          }
        }
      });

      student.progress = Math.min((answeredQuestions / totalQuestions) * 100, 100);
    } else {
      student.progress = Math.min(student.progress + 25, 100);
      score = student.progress;
    }

    student.score = Math.round(score);
    student.notified = false;

    await assignment.save();

    user.points += student.score;
    if (student.score === 100 && !user.badges.includes(`${assignment.title} Master`)) {
      user.badges.push(`${assignment.title} Master`);
    }
    await user.save();

    let feedback = student.score === 100 ? 'Great job! You aced it!' : student.score >= 60 ? 'Good effort! Keep practicing.' : 'Needs improvement. Review the material and try again.';
    res.json({ assignment, feedback });
  } catch (err) {
    console.error('Assignment submission error:', err.message);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

router.get('/teacher', auth, async (req, res) => {
  if (req.user.role !== 'teacher') return res.status(403).json({ msg: 'Access denied' });

  try {
    const assignments = await Assignment.find({ createdBy: req.user.id });
    res.json(assignments);
  } catch (err) {
    console.error('Fetch teacher assignments error:', err.message);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

router.post('/ai-assist', auth, async (req, res) => {
  if (req.user.role !== 'student') return res.status(403).json({ msg: 'Access denied' });

  const { query, assignmentId } = req.body;

  try {
    let context = '';

    if (assignmentId) {
      const assignment = await Assignment.findById(assignmentId);
      if (!assignment) return res.status(404).json({ msg: 'Assignment not found' });
      if (assignment.type === 'test') return res.status(403).json({ msg: 'AI assistance disabled during tests' });

      if (assignment.type === 'homework') {
        context = `You are assisting a student with their homework titled "${assignment.title}". Description: ${assignment.description}. The homework includes quizzes: ${JSON.stringify(assignment.quizzes)}. Provide solutions, information, to help the student with their query: "${query}".`;
      } else if (assignment.type === 'learning_path') {
        context = `You are assisting a student with a learning path titled "${assignment.title}". Description: ${assignment.description}. The learning path includes steps: ${JSON.stringify(assignment.steps)}. Provide solutions, information, to help the student with their query: "${query}".`;
      } else if (assignment.type === 'resource') {
        context = `You are assisting a student with supplementary resources titled "${assignment.title}". Description: ${assignment.description}. The resources include: ${JSON.stringify(assignment.resources)}. Provide solutions, information, to help the student with their query: "${query}".`;
      }
    } else {
      context = `You are Gradus, an AI study companion. A student has asked: "${query}". Provide a clear, step-by-step, and suitable response to help the student understand the topic or solve the problem.`;
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });
    const result = await model.generateContent(context);
    let responseText = result.response.text();

    responseText = responseText.replace(/```/g, '').trim();
    if (!responseText.includes('Step')) {
      responseText = `Step 1: Analyze the question: "${query}".\nStep 2: Provide a clear explanation.\nStep 3: ${responseText}`;
    }

    res.json({ response: responseText });
  } catch (err) {
    console.error('AI assist error:', err.message);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

router.post('/ai-generate', auth, async (req, res) => {
  if (req.user.role !== 'teacher') return res.status(403).json({ msg: 'Access denied' });

  let { prompt } = req.body;
  if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 10) {
    return res.status(400).json({ msg: 'Prompt must be a string with at least 10 characters' });
  }

  if (!process.env.GEMINI_API_KEY) {
    console.error('GEMINI_API_KEY is not set');
    return res.status(500).json({ msg: 'Server configuration error: Missing Gemini API key' });
  }

  prompt += '\nReturn only a JSON array in the format: [{ "question": "", "options": ["", "", "", ""], "answer": "" }, ...]. Do not include any additional text, explanations, markdown, or code block markers. Ensure each question has exactly 4 options and a correct answer matching one of the options.';

  try {
    console.log('Sending prompt to Gemini AI:', prompt);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });
    const result = await model.generateContent(prompt);
    const quizzesText = result.response.text();

    if (!quizzesText) {
      console.error('No content in Gemini response');
      return res.status(500).json({ msg: 'No content returned from Gemini AI' });
    }

    console.log('Raw Gemini response:', quizzesText);
    let quizzes;
    try {
      const jsonMatch = quizzesText.match(/\[.*\]/s);
      const cleanedText = jsonMatch ? jsonMatch[0] : quizzesText;
      console.log('Extracted quizzes text:', cleanedText);
      quizzes = JSON.parse(cleanedText);

      if (!Array.isArray(quizzes) || quizzes.length === 0) {
        throw new Error('Quizzes must be a non-empty array');
      }

      for (const quiz of quizzes) {
        if (!quiz.question || !Array.isArray(quiz.options) || quiz.options.length !== 4 || !quiz.answer || !quiz.options.includes(quiz.answer)) {
          throw new Error('Each quiz must have a question, exactly 4 options, and a correct answer matching one of the options');
        }
      }
    } catch (e) {
      console.error('Quizzes parsing error:', e.message, 'Raw text:', quizzesText);
      quizzes = [
        {
          question: 'What is the capital of France?',
          options: ['Paris', 'London', 'Berlin', 'Madrid'],
          answer: 'Paris'
        }
      ];
      console.log('Using fallback quizzes:', quizzes);
    }

    res.json({ quizzes });
  } catch (err) {
    console.error('AI generate error:', err.message, err.stack);
    res.status(500).json({ msg: 'Failed to generate quiz questions', error: err.message });
  }
});

module.exports = router;