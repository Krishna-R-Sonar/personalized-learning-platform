// client/src/components/AIAssistant.js
import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

function AIAssistant({ token, assignments, rollNo, disabled, activeTab }) {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (disabled) {
      toast.error('AI assistance is disabled during tests.');
      return;
    }
    if (!query.trim()) {
      toast.error('Please enter a question to get assistance.');
      return;
    }

    setLoading(true);
    setResponse([]);

    const assignment = assignments.find((a) =>
      a.students.some((s) => s.rollNo === rollNo && s.progress < 100)
    );
    if (!assignment) {
      toast.error('No active assignments to assist with.');
      setLoading(false);
      return;
    }

    try {
      const res = await axios.post(
        'http://localhost:5000/api/assignments/ai-assist',
        { query, assignmentId: assignment._id },
        { headers: { 'x-auth-token': token } }
      );

      const steps = res.data.response.split('\n').filter((step) => step.trim());
      setResponse(steps);
      toast.success('AI response received!');
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Error fetching AI assistance');
      setResponse(['Sorry, I couldn’t process your request. Please try again or rephrase your question.']);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ai-assistant">
      <h2>AI Study Assistant</h2>
      {disabled && (
        <p className="disabled-message">
          AI assistance is disabled while viewing tests or during an active test.
        </p>
      )}
      <form onSubmit={handleSubmit}>
        <textarea
          placeholder="Ask a question about your assignment... (e.g., 'How do I solve this equation?' or 'Explain photosynthesis')"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={loading || disabled}
        />
        <button type="submit" disabled={loading || disabled}>
          {loading ? 'Asking...' : 'Ask'}
        </button>
      </form>
      {response.length > 0 && (
        <div className="response">
          <h4>AI Response:</h4>
          <ol className="step-by-step">
            {response.map((step, index) => (
              <li key={index}>{step}</li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

export default AIAssistant;