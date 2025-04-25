// client/src/components/TeacherDashboard.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import AssignmentForm from './AssignmentForm';
import SmartChalk from './SmartChalk';

function TeacherDashboard({ token, onLogout }) {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState({ rollNo: '', class: '', completion: '' });

  useEffect(() => {
    const fetchAssignments = async () => {
      setLoading(true);
      try {
        const res = await axios.get('http://localhost:5000/api/assignments/teacher', {
          headers: { 'x-auth-token': token },
        });
        setAssignments(res.data);
        toast.success('Assignments loaded successfully!');
      } catch (err) {
        toast.error(err.response?.data?.msg || 'An error occurred');
      } finally {
        setLoading(false);
      }
    };
    fetchAssignments();
  }, [token]);

  const filteredAssignments = assignments
    .map((assignment) => ({
      ...assignment,
      students: assignment.students.filter(
        (s) =>
          (!filter.rollNo || s.rollNo.includes(filter.rollNo)) &&
          (!filter.completion || s.progress.toString().includes(filter.completion))
      ),
    }))
    .filter((a) => a.students.length > 0);

  return (
    <div className="dashboard">
      <header>
        <h1>EduPath - Teacher</h1>
        <button className="logout-btn" onClick={onLogout}>
          Logout
        </button>
      </header>
      {loading && <p className="loading">Loading assignments...</p>}
      <div className="teacher-sections">
        <section className="assignment-section">
          <h2>Create Assignment</h2>
          <AssignmentForm token={token} />
        </section>
        <section className="smartchalk-section">
          <h2>SmartChalk - AI Question Generator</h2>
          <SmartChalk token={token} />
        </section>
        <section className="progress-section">
          <h2>Progress Tracking</h2>
          <div className="filters">
            <input
              type="text"
              placeholder="Filter by Roll No"
              value={filter.rollNo}
              onChange={(e) => setFilter({ ...filter, rollNo: e.target.value })}
            />
            <input
              type="text"
              placeholder="Filter by Completion %"
              value={filter.completion}
              onChange={(e) => setFilter({ ...filter, completion: e.target.value })}
            />
          </div>
          <div className="assignment-list">
            {filteredAssignments.map((assignment) => (
              <div key={assignment._id} className="assignment-card">
                <h3>
                  {assignment.title} ({assignment.type})
                </h3>
                <p>{assignment.description}</p>
                <h4>Student Progress</h4>
                <ul>
                  {assignment.students.map((s) => (
                    <li key={s.rollNo}>
                      Roll No: {s.rollNo} - {s.progress}% (Score: {s.score})
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export default TeacherDashboard;