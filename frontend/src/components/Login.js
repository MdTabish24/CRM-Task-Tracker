import React, { useState } from 'react';
import api from '../utils/api';

const Login = ({ onLogin }) => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('Attempting login with:', credentials.username);
      const response = await api.post('/auth/login', credentials);
      const { access_token, user } = response.data;
      
      console.log('Login successful, token received:', access_token ? 'Yes' : 'No');
      console.log('User data:', user);
      
      onLogin(user, access_token);
    } catch (error) {
      console.error('Login error:', error);
      setError(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleSubmit}>
        <h2>CRM Login</h2>
        
        {error && (
          <div style={{ 
            color: '#e74c3c', 
            marginBottom: '1rem', 
            textAlign: 'center',
            padding: '0.5rem',
            background: '#fadbd8',
            borderRadius: '4px'
          }}>
            {error}
          </div>
        )}

        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            name="username"
            className="form-control"
            value={credentials.username}
            onChange={handleChange}
            required
            placeholder="Enter username"
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            className="form-control"
            value={credentials.password}
            onChange={handleChange}
            required
            placeholder="Enter password"
          />
        </div>

        <button 
          type="submit" 
          className="btn btn-primary" 
          style={{ width: '100%' }}
          disabled={loading}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>

        <div style={{ marginTop: '1rem', fontSize: '14px', color: '#7f8c8d' }}>
          
        </div>
      </form>
    </div>
  );
};

export default Login;