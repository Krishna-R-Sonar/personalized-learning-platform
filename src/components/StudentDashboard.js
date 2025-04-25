// client/src/components/StudentDashboard.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import AssignmentCard from './AssignmentCard';
import Gradus from './Gradus';

function StudentDashboard({ token, user, onLogout }) {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('activeTab') || 'homework';
  });
  const [testInProgress, setTestInProgress] = useState(false);
  const [showTestConfirmation, setShowTestConfirmation] = useState(false);

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/assignments/student', {
          headers: { 'x-auth-token': token },
        });
        setAssignments(res.data);
      } catch (err) {
        toast.error(err.response?.data?.msg || 'Error fetching assignments');
      } finally {
        setLoading(false);
      }
    };

    fetchAssignments();
  }, [token]);

  useEffect(() => {
    localStorage.setItem('activeTab', activeTab);
  }, [activeTab]);

  const filteredAssignments = assignments.filter((assignment) => {
    if (activeTab === 'tests') return assignment.type === 'test';
    if (activeTab === 'homework') return assignment.type === 'homework';
    if (activeTab === 'learning_path') return assignment.type === 'learning_path';
    if (activeTab === 'resources') return assignment.type === 'resource';
    return false;
  });

  const tests = assignments.filter((assignment) => assignment.type === 'test');
  const allTestsSubmitted = tests.every((test) => {
    const student = test.students.find((s) => s.rollNo === user.rollNo);
    return student && student.progress === 100;
  });

  const handleTabChange = (tab) => {
    if (activeTab === 'tests' && !allTestsSubmitted) {
      toast.error('You cannot navigate to other tabs while in the Tests tab until all tests are submitted.');
      return;
    }

    if (testInProgress) {
      toast.error('You cannot change tabs while a test is in progress. Please submit the test to continue.');
      return;
    }

    if (tab === 'tests') {
      setShowTestConfirmation(true);
    } else {
      setActiveTab(tab);
    }
  };

  const handleTestConfirmation = (confirmed) => {
    setShowTestConfirmation(false);
    if (confirmed) {
      setActiveTab('tests');
    } else {
      setActiveTab('homework');
    }
  };

  const handleTestStart = () => {
    setTestInProgress(true);
  };

  const handleTestComplete = () => {
    setTestInProgress(false);
  };

  if (!user || !user.rollNo) {
    return (
      <div className="dashboard">
        <h2>Student Dashboard</h2>
        <p className="error">Error: User data not found. Please log in again.</p>
      </div>
    );
  }

  return (
    <div className="dashboard student-dashboard">
      <header>
        <h1>EduPath - Student</h1>
        <button className="logout-btn" onClick={onLogout}>
          Logout
        </button>
      </header>
      <div className="stats">
        <p>Welcome, {user.username} (Roll No: {user.rollNo})</p>
        <p>Points: {user.points || 0}</p>
      </div>
      {user.badges?.length > 0 && (
        <div className="badges">
          {user.badges.map((badge, index) => (
            <span key={index} className="badge">
              {badge}
            </span>
          ))}
        </div>
      )}
      <div className="tabs">
        <button
          className={`tab-btn ${activeTab === 'tests' ? 'active' : ''}`}
          onClick={() => handleTabChange('tests')}
          disabled={activeTab === 'tests' && !allTestsSubmitted}
        >
          Tests
        </button>
        <button
          className={`tab-btn ${activeTab === 'homework' ? 'active' : ''}`}
          onClick={() => handleTabChange('homework')}
          disabled={activeTab === 'tests' && !allTestsSubmitted}
        >
          Homework
        </button>
        <button
          className={`tab-btn ${activeTab === 'learning_path' ? 'active' : ''}`}
          onClick={() => handleTabChange('learning_path')}
          disabled={activeTab === 'tests' && !allTestsSubmitted}
        >
          Learning Paths
        </button>
        <button
          className={`tab-btn ${activeTab === 'resources' ? 'active' : ''}`}
          onClick={() => handleTabChange('resources')}
          disabled={activeTab === 'tests' && !allTestsSubmitted}
        >
          Supplementary Resources
        </button>
        <button
          className={`tab-btn ${activeTab === 'gradus' ? 'active' : ''}`}
          onClick={() => handleTabChange('gradus')}
          disabled={activeTab === 'tests' && !allTestsSubmitted}
        >
          Gradus
        </button>
      </div>
      {showTestConfirmation && (
        <div className="confirmation-card">
          <h4>Warning: Entering Tests Tab</h4>
          <p>
            Once you enter the Tests tab, you cannot navigate to other tabs until you complete all your tests. Are you sure you want to proceed?
          </p>
          <div className="confirmation-buttons">
            <button className="primary" onClick={() => handleTestConfirmation(true)}>
              OK
            </button>
            <button className="cancel-btn" onClick={() => handleTestConfirmation(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}
      <h3>
        {activeTab === 'tests' && (
          <>
            Your Tests
            <span className="test-count"> ({tests.length} Test{tests.length !== 1 ? 's' : ''})</span>
          </>
        )}
        {activeTab === 'homework' && 'Your Homework'}
        {activeTab === 'learning_path' && 'Your Learning Paths'}
        {activeTab === 'resources' && 'Your Supplementary Resources'}
        {activeTab === 'gradus' && 'Gradus - AI Study Companion'}
      </h3>
      {activeTab === 'gradus' ? (
        <Gradus token={token} />
      ) : loading ? (
        <p className="loading">Loading assignments...</p>
      ) : filteredAssignments.length === 0 ? (
        <p>No {activeTab.replace('_', ' ')} available.</p>
      ) : (
        <div className="assignment-list">
          {filteredAssignments.map((assignment) => (
            <AssignmentCard
              key={assignment._id}
              assignment={assignment}
              token={token}
              user={user}
              onTestStart={handleTestStart}
              onTestComplete={handleTestComplete}
              isTestInProgress={testInProgress}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default StudentDashboard;