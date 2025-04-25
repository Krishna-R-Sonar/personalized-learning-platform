// client/src/components/SmartChalk.js
import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

function SmartChalk({ token }) {
  const [prompt, setPrompt] = useState('');
  const [quizzes, setQuizzes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validateQuizzes = (quizzes) => {
    try {
      const parsed = JSON.parse(quizzes);
      if (!Array.isArray(parsed)) return 'Quizzes must be an array';
      if (parsed.length === 0) return 'At least one quiz is required';
      for (const quiz of parsed) {
        if (!quiz.question || !Array.isArray(quiz.options) || quiz.options.length !== 4 || !quiz.answer || !quiz.options.includes(quiz.answer)) {
          return 'Each quiz must have a question, exactly 4 options, and a correct answer matching one of the options';
        }
      }
      return '';
    } catch (e) {
      return 'Invalid JSON format';
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!prompt) {
      toast.error('Please enter a prompt');
      setError('Please enter a prompt');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await axios.post(
        'http://localhost:5000/api/assignments/ai-generate',
        { prompt },
        { headers: { 'x-auth-token': token } }
      );
      const quizzesString = JSON.stringify(res.data.quizzes, null, 2);
      const validationError = validateQuizzes(quizzesString);
      if (validationError) {
        toast.error(`Generated quizzes invalid: ${validationError}`);
        setError(`Generated quizzes invalid: ${validationError}`);
        setQuizzes('');
      } else {
        setQuizzes(quizzesString);
        toast.success('Quiz questions generated! Copy and paste into Assignment Form.');
      }
    } catch (err) {
      const msg = err.response?.data?.msg || 'Error generating quiz questions';
      toast.error(msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!quizzes || validateQuizzes(quizzes)) {
      toast.error('No valid quizzes to copy');
      setError('No valid quizzes to copy');
      return;
    }
    navigator.clipboard.writeText(quizzes);
    toast.success('Quizzes copied to clipboard!');
  };

  const dismissError = () => setError('');

  return (
    <div className="smartchalk">
      <form onSubmit={handleGenerate}>
        <div className="form-group">
          <label>Generate Quiz Questions with Gemini AI</label>
          <textarea
            placeholder="e.g., Generate 3 algebra questions with 4 options and answers"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={loading}
            className={error ? 'input-error' : ''}
          />
          {error && (
            <div className="error-alert">
              <p>{error}</p>
              <button type="button" onClick={dismissError}>×</button>
            </div>
          )}
        </div>
        <button type="submit" className="primary" disabled={loading}>
          {loading ? (
            <span className="spinner">Generating...</span>
          ) : (
            'Generate Questions'
          )}
        </button>
      </form>
      {quizzes && (
        <div className="quiz-output">
          <h4>Generated Quizzes</h4>
          <pre>{quizzes}</pre>
          <button onClick={handleCopy} className="primary" disabled={loading}>
            Copy to Clipboard
          </button>
        </div>
      )}
    </div>
  );
}

export default SmartChalk;