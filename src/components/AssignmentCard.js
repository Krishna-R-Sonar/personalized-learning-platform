// client/src/components/AssignmentCard.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

function AssignmentCard({ assignment, token, user, onTestStart, onTestComplete, isTestInProgress }) {
  const [answers, setAnswers] = useState(new Array(assignment.quizzes?.length || 0).fill(''));
  const [feedback, setFeedback] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const rollNo = user && user.rollNo ? user.rollNo : null;
  const student = rollNo ? assignment.students.find((s) => s.rollNo === rollNo) : null;
  const progress = student ? student.progress : 0;
  const score = student ? student.score : 0;

  useEffect(() => {
    if (progress === 100) {
      setSubmitted(true);
      setFeedback(score === 100 ? 'Great job! You aced it!' : score >= 60 ? 'Good effort! Keep practicing.' : 'Needs improvement. Review the material and try again.');
    }
  }, [progress, score]);

  useEffect(() => {
    if (submitted && assignment.type === 'test' && onTestComplete) {
      onTestComplete();
    }
  }, [submitted, assignment.type, onTestComplete]);

  const handleAnswerChange = (index, option) => {
    if (assignment.type === 'test' && !isTestInProgress && onTestStart) {
      onTestStart();
    }
    const newAnswers = [...answers];
    newAnswers[index] = option;
    setAnswers(newAnswers);
  };

  const handleSubmit = async () => {
    if (!rollNo) {
      toast.error('User roll number not found. Please log in again.');
      return;
    }

    try {
      const res = await axios.put(
        `http://localhost:5000/api/assignments/submit/${assignment._id}`,
        { answers },
        { headers: { 'x-auth-token': token } }
      );
      setSubmitted(true);
      setFeedback(res.data.feedback);
      toast.success('Assignment submitted successfully!');
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Error submitting assignment');
    }
  };

  const speakQuestion = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
  };

  if (!rollNo) {
    return (
      <div className="assignment-card">
        <p className="error">Error: User roll number not found. Please log in again.</p>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="assignment-card">
        <p className="error">This assignment is not assigned to you.</p>
      </div>
    );
  }

  return (
    <div className="assignment-card">
      <h3>{assignment.title}</h3>
      <p>{assignment.description}</p>
      <div className="progress">
        <p>Progress: {progress}%</p>
        <div className="progress-bar" style={{ width: `${progress}%` }}></div>
        <p>Score: {score}</p>
      </div>
      {assignment.resources?.length > 0 && (
        <div className="resources">
          <h4>Resources</h4>
          {assignment.resources.map((res, index) => (
            <p key={index}>
              <a href={res.url} target="_blank" rel="noopener noreferrer">
                {res.title}
              </a>
            </p>
          ))}
        </div>
      )}
      {assignment.type === 'learning_path' && assignment.steps?.length > 0 && (
        <div className="steps">
          <h4>Steps</h4>
          {assignment.steps.map((step, index) => (
            <div key={index} className="step">
              <h5>Step {index + 1}: {step.title}</h5>
              <p>{step.description}</p>
            </div>
          ))}
        </div>
      )}
      {(assignment.type === 'test' || assignment.type === 'homework') && assignment.quizzes?.length > 0 && (
        <div className="quizzes">
          {submitted ? (
            <div className="submitted-message">
              {assignment.type === 'test' ? (
                <p>You submitted this test.</p>
              ) : (
                <p>You submitted this homework.</p>
              )}
              {feedback && <p className="feedback">{feedback}</p>}
            </div>
          ) : (
            <>
              <h4>Quizzes</h4>
              {assignment.quizzes.map((quiz, index) => (
                <div key={index} className="quiz">
                  <div className="quiz-header">
                    <span>Question {index + 1}</span>
                    <button
                      className="speak-btn"
                      onClick={() => speakQuestion(quiz.question)}
                      aria-label="Speak question"
                    >
                      🔊
                    </button>
                  </div>
                  <p>{quiz.question}</p>
                  <div className="quiz-options">
                    {quiz.options.map((option, optIndex) => (
                      <label key={optIndex} className="quiz-option">
                        <input
                          type="radio"
                          name={`quiz-${index}`}
                          value={option}
                          checked={answers[index] === option}
                          onChange={() => handleAnswerChange(index, option)}
                          disabled={submitted}
                        />
                        <span className="radio-custom"></span>
                        {option}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
              <button
                className="primary submit-btn"
                onClick={handleSubmit}
                disabled={submitted}
              >
                Submit
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default AssignmentCard;