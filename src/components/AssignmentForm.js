// client/src/components/AssignmentForm.js
import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

function AssignmentForm({ token }) {
  const [type, setType] = useState('test');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [resources, setResources] = useState([{ title: '', url: '' }]);
  const [rollNos, setRollNos] = useState('');
  const [steps, setSteps] = useState([{ title: '', description: '' }]);
  const [quizzes, setQuizzes] = useState('');
  const [pdf, setPdf] = useState(null);
  const [loading, setLoading] = useState(false);
  const [quizError, setQuizError] = useState('');

  const validateQuizzes = (value) => {
    if (!value) return 'Quizzes are required';
    try {
      const parsed = JSON.parse(value);
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

  const handleQuizChange = (e) => {
    const value = e.target.value;
    setQuizzes(value);
    setQuizError(validateQuizzes(value));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !rollNos) {
      toast.error('Title and roll numbers are required');
      return;
    }
    if ((type === 'test' || type === 'homework') && (!quizzes || quizError)) {
      toast.error(quizError || 'Valid quizzes are required for tests and homework');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('type', type);
    formData.append('title', title);
    formData.append('description', description);
    formData.append('resources', JSON.stringify(resources.filter((r) => r.title && r.url)));
    formData.append('rollNos', rollNos);
    formData.append('steps', JSON.stringify(steps.filter((s) => s.title && s.description)));
    formData.append('quizzes', quizzes);
    if (pdf) formData.append('pdf', pdf);

    console.log('Sending form data:', Object.fromEntries(formData));

    try {
      await axios.post('http://localhost:5000/api/assignments/create', formData, {
        headers: { 'x-auth-token': token, 'Content-Type': 'multipart/form-data' },
      });
      setType('test');
      setTitle('');
      setDescription('');
      setResources([{ title: '', url: '' }]);
      setRollNos('');
      setSteps([{ title: '', description: '' }]);
      setQuizzes('');
      setPdf(null);
      toast.success('Assignment created successfully!');
      window.location.reload();
    } catch (err) {
      toast.error(err.response?.data?.msg || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const addResource = () => setResources([...resources, { title: '', url: '' }]);
  const addStep = () => setSteps([...steps, { title: '', description: '' }]);

  return (
    <div className="assignment-form">
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Type</label>
          <select value={type} onChange={(e) => setType(e.target.value)} disabled={loading}>
            <option value="test">Test</option>
            <option value="homework">Homework</option>
            <option value="learning_path">Learning Path</option>
            <option value="resource">Supplementary Resource</option>
          </select>
        </div>
        <div className="form-group">
          <label>Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={loading}
            required
          />
        </div>
        <div className="form-group">
          <label>Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={loading}
          />
        </div>
        {(type === 'test' || type === 'homework') && (
          <div className="form-group">
            <label>Quizzes (Paste JSON from SmartChalk)</label>
            <textarea
              placeholder='[{"question":"What is x in x+2=4?","options":["1","2","3","4"],"answer":"2"}, ...]'
              value={quizzes}
              onChange={handleQuizChange}
              disabled={loading}
              required
              className={quizError ? 'input-error' : ''}
            />
            {quizError && (
              <div className="error-alert">
                <p>{quizError}</p>
                <button type="button" onClick={() => setQuizError('')}>×</button>
              </div>
            )}
          </div>
        )}
        {type !== 'learning_path' && (
          <>
            <div className="form-group">
              <label>Resources</label>
              {resources.map((res, index) => (
                <div key={index} className="resource-input">
                  <input
                    type="text"
                    placeholder="Resource Title"
                    value={res.title}
                    onChange={(e) => {
                      const newResources = [...resources];
                      newResources[index].title = e.target.value;
                      setResources(newResources);
                    }}
                    disabled={loading}
                  />
                  <input
                    type="url"
                    placeholder="Resource URL"
                    value={res.url}
                    onChange={(e) => {
                      const newResources = [...resources];
                      newResources[index].url = e.target.value;
                      setResources(newResources);
                    }}
                    disabled={loading}
                  />
                </div>
              ))}
              <button type="button" className="add-btn" onClick={addResource} disabled={loading}>
                + Add Resource
              </button>
            </div>
            <div className="form-group">
              <label>Upload PDF</label>
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => setPdf(e.target.files[0])}
                disabled={loading}
              />
            </div>
          </>
        )}
        {type === 'learning_path' && (
          <div className="form-group">
            <label>Steps</label>
            {steps.map((step, index) => (
              <div key={index} className="step-input">
                <input
                  type="text"
                  placeholder="Step Title"
                  value={step.title}
                  onChange={(e) => {
                    const newSteps = [...steps];
                    newSteps[index].title = e.target.value;
                    setSteps(newSteps);
                  }}
                  disabled={loading}
                />
                <textarea
                  placeholder="Step Description"
                  value={step.description}
                  onChange={(e) => {
                    const newSteps = [...steps];
                    newSteps[index].description = e.target.value;
                    setSteps(newSteps);
                  }}
                  disabled={loading}
                />
              </div>
            ))}
            <button type="button" className="add-btn" onClick={addStep} disabled={loading}>
              + Add Step
            </button>
          </div>
        )}
        <div className="form-group">
          <label>Student Roll Numbers (comma-separated)</label>
          <input
            type="text"
            value={rollNos}
            onChange={(e) => setRollNos(e.target.value)}
            disabled={loading}
            required
          />
        </div>
        <button type="submit" className="primary" disabled={loading}>
          {loading ? <span className="spinner">Creating...</span> : 'Create Assignment'}
        </button>
      </form>
    </div>
  );
}

export default AssignmentForm;