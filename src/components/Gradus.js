import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

function Gradus({ token }) {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!query.trim()) {
      toast.error('Please enter a question for Gradus.');
      return;
    }

    setLoading(true);
    setResponse([]);

    try {
      const res = await axios.post(
        'http://localhost:5000/api/gradus/ask',
        { query },
        { headers: { 'x-auth-token': token } }
      );

      const steps = res.data.response.split('\n').filter((step) => step.trim());
      setResponse(steps);
      toast.success('Gradus has responded!');
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Error fetching Gradus response');
      setResponse(['Sorry, I couldn’t process your request. Please try again or rephrase your question.']);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="gradus">
      <h2>Gradus - Your AI Study Companion</h2>
      <form onSubmit={handleSubmit}>
        <textarea
          placeholder="Ask anything! (e.g., 'How does gravity work?' or 'Explain quadratic equations')"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={loading}
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Asking...' : 'Ask Gradus'}
        </button>
      </form>
      {response.length > 0 && (
        <div className="response">
          <h4>Gradus Response:</h4>
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

export default Gradus;