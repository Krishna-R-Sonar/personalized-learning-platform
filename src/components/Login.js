// client/src/components/Login.js
import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [rollNo, setRollNo] = useState('');
  const [className, setClassName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const endpoint = e.target.name === 'register' ? '/register' : '/login';
      const res = await axios.post(`http://localhost:5000/api/auth${endpoint}`, {
        username,
        password,
        role,
        rollNo: role === 'student' && endpoint === '/register' ? rollNo : undefined,
        class: role === 'student' && endpoint === '/register' ? className : undefined,
      });

      const userData = {
        role,
        username,
        rollNo: res.data.rollNo || (role === 'student' && endpoint === '/register' ? rollNo : undefined),
        points: res.data.points || 0,
        badges: res.data.badges || [],
      };

      onLogin(res.data.token, userData);
      toast.success(endpoint === '/register' ? 'Registered successfully!' : 'Logged in successfully!');
    } catch (err) {
      toast.error(err.response?.data?.msg || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <h2>EduPath</h2>
      <form className="login-form">
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          disabled={loading}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
        />
        <select value={role} onChange={(e) => setRole(e.target.value)} disabled={loading}>
          <option value="student">Student</option>
          <option value="teacher">Teacher</option>
        </select>
        {role === 'student' && (
          <>
            <input
              type="text"
              placeholder="Roll Number"
              value={rollNo}
              onChange={(e) => setRollNo(e.target.value)}
              disabled={loading}
            />
            <input
              type="text"
              placeholder="Class (e.g., 10A)"
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              disabled={loading}
            />
          </>
        )}
        <div className="button-group">
          <button type="submit" name="login" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Loading...' : 'Login'}
          </button>
          <button type="submit" name="register" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Loading...' : 'Register'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default Login;