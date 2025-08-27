import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import CallerDashboard from './components/CallerDashboard';
import TaskManager from './components/TaskManager';
import CustomDashboard from './components/CustomDashboard';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData, token) => {
    console.log('Setting user data and token');
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    console.log('User set:', userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route 
            path="/login" 
            element={
              user ? 
                <Navigate to={
                  user.role === 'admin' ? '/admin' : 
                  user.role === 'caller' ? '/caller' : '/custom'
                } replace /> : 
                <Login onLogin={handleLogin} />
            } 
          />
          
          <Route 
            path="/admin/*" 
            element={
              user && user.role === 'admin' ? 
                <AdminDashboard user={user} onLogout={handleLogout} /> : 
                <Navigate to="/login" replace />
            } 
          />
          
          <Route 
            path="/caller" 
            element={
              user && user.role === 'caller' ? 
                <CallerDashboard user={user} onLogout={handleLogout} /> : 
                <Navigate to="/login" replace />
            } 
          />
          
          <Route 
            path="/custom" 
            element={
              user && !['admin', 'caller'].includes(user.role) ? 
                <CustomDashboard user={user} onLogout={handleLogout} /> : 
                <Navigate to="/login" replace />
            } 
          />
          
          <Route 
            path="/tasks" 
            element={
              user ? 
                <TaskManager user={user} onLogout={handleLogout} /> : 
                <Navigate to="/login" replace />
            } 
          />
          
          <Route 
            path="/" 
            element={
              user ? 
                <Navigate to={
                  user.role === 'admin' ? '/admin' : 
                  user.role === 'caller' ? '/caller' : '/custom'
                } replace /> : 
                <Navigate to="/login" replace />
            } 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;