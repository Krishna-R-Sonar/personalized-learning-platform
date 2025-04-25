const express = require('express');
const jwt = require('jsonwebtoken');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const router = express.Router();
const dotenv = require('dotenv');

dotenv.config();

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

router.post('/ask', auth, async (req, res) => {
  if (req.user.role !== 'student') return res.status(403).json({ msg: 'Access denied' });

  const { query } = req.body;

  if (!query || typeof query !== 'string' || query.trim().length < 1) {
    return res.status(400).json({ msg: 'Please provide a valid question' });
  }

  try {
    const context = `You are Gradus, an AI study companion for students. A student has asked: "${query}". Provide a clear, step-by-step, and suitable response to help the student understand the topic or solve the problem.`;

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });
    const result = await model.generateContent(context);
    let responseText = result.response.text();

    responseText = responseText.replace(/```/g, '').trim();
    if (!responseText.includes('Step')) {
      responseText = `Step 1: Analyze the question: "${query}".\nStep 2: Provide a clear explanation.\nStep 3: ${responseText}`;
    }

    res.json({ response: responseText });
  } catch (err) {
    console.error('Gradus AI error:', err.message);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

module.exports = router;