import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import api from '../utils/api';
import UploadCSV from './UploadCSV';
import ProgressDashboard from './ProgressDashboard';
import UserManagement from './UserManagement';
import Reports from './Reports';
import VisitManagement from './VisitManagement';

const AdminDashboard = ({ user, onLogout }) => {
  const location = useLocation();
  const [stats, setStats] = useState({
    totalRecords: 0,
    totalUsers: 0,
    totalTasks: 0,
    completedCalls: 0
  });
  const [callerTasks, setCallerTasks] = useState([]);

  useEffect(() => {
    // Test authentication first
    testAuth();
  }, []);

  const testAuth = async () => {
    try {
      console.log('Testing authentication...');
      const response = await api.get('/test-auth');
      console.log('Auth test successful:', response.data);
      // If auth test passes, fetch stats
      fetchStats();
    } catch (error) {
      console.error('Auth test failed:', error);
      console.error('Error response:', error.response?.data);
    }
  };

  const fetchStats = async () => {
    try {
      console.log('Fetching stats with token:', localStorage.getItem('token') ? 'Token exists' : 'No token');
      
      const [callsRes, usersRes, tasksRes] = await Promise.all([
        api.get('/reports/calls'),
        api.get('/users'),
        api.get('/reports/tasks')
      ]);

      setStats({
        totalRecords: callsRes.data.total_records,
        totalUsers: usersRes.data.users.length,
        totalTasks: tasksRes.data.total_tasks,
        completedCalls: callsRes.data.completed_calls
      });
      
      // Fetch caller tasks
      fetchCallerTasks();
    } catch (error) {
      console.error('Error fetching stats:', error);
      console.error('Error details:', error.response?.data);
    }
  };

  const fetchCallerTasks = async () => {
    try {
      const response = await api.get('/admin/caller-tasks');
      setCallerTasks(response.data.tasks);
    } catch (error) {
      console.error('Error fetching caller tasks:', error);
    }
  };

  const getActiveTab = () => {
    const path = location.pathname;
    if (path.includes('upload')) return 'upload';
    if (path.includes('progress')) return 'progress';
    if (path.includes('visits')) return 'visits';
    if (path.includes('users')) return 'users';
    if (path.includes('reports')) return 'reports';
    return 'dashboard';
  };

  return (
    <div>
      <header className="header">
        <h1>Admin Dashboard</h1>
        <div className="header-actions">
          <div className="user-info">
            <span>Welcome, {user.name}</span>
            <Link to="/tasks" className="btn btn-secondary">Tasks</Link>
            <button onClick={onLogout} className="btn btn-danger">Logout</button>
          </div>
        </div>
      </header>

      <nav className="nav-tabs">
        <ul>
          <li className={getActiveTab() === 'dashboard' ? 'active' : ''}>
            <Link to="/admin">Dashboard</Link>
          </li>
          <li className={getActiveTab() === 'upload' ? 'active' : ''}>
            <Link to="/admin/upload">Upload CSV</Link>
          </li>
          <li className={getActiveTab() === 'progress' ? 'active' : ''}>
            <Link to="/admin/progress">Progress</Link>
          </li>
          <li className={getActiveTab() === 'visits' ? 'active' : ''}>
            <Link to="/admin/visits">Visit Management</Link>
          </li>
          <li className={getActiveTab() === 'users' ? 'active' : ''}>
            <Link to="/admin/users">Users</Link>
          </li>
          <li className={getActiveTab() === 'reports' ? 'active' : ''}>
            <Link to="/admin/reports">Reports</Link>
          </li>
        </ul>
      </nav>

      <main className="main-content">
        <Routes>
          <Route path="/" element={
            <div>
              <h2>Overview</h2>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-number">{stats.totalRecords}</div>
                  <div className="stat-label">Total Records</div>
                </div>
                <div className="stat-card">
                  <div className="stat-number">{stats.completedCalls}</div>
                  <div className="stat-label">Completed Calls</div>
                </div>
                <div className="stat-card">
                  <div className="stat-number">{stats.totalUsers}</div>
                  <div className="stat-label">Total Users</div>
                </div>
                <div className="stat-card">
                  <div className="stat-number">{stats.totalTasks}</div>
                  <div className="stat-label">Total Tasks</div>
                </div>
              </div>
              
              <div className="card">
                <h3>Quick Actions</h3>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                  <Link to="/admin/upload" className="btn btn-primary">📁 Upload CSV</Link>
                  <Link to="/admin/progress" className="btn btn-success">📊 View Progress</Link>
                  <Link to="/admin/visits" className="btn" style={{ background: '#9b59b6', color: 'white' }}>🏠 Visit Management</Link>
                  <Link to="/tasks" className="btn btn-secondary">📋 Manage Tasks</Link>
                </div>
              </div>

              {callerTasks.length > 0 && (
                <div className="card">
                  <h3>Caller Personal Tasks ({callerTasks.length})</h3>
                  <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Caller</th>
                          <th>Task</th>
                          <th>Status</th>
                          <th>Deadline</th>
                          <th>Type</th>
                        </tr>
                      </thead>
                      <tbody>
                        {callerTasks.map((task) => (
                          <tr key={task.id}>
                            <td>{task.caller_name}</td>
                            <td>
                              <div style={{ fontWeight: '500' }}>{task.title}</div>
                              {task.description && (
                                <div style={{ fontSize: '12px', color: '#666' }}>
                                  {task.description}
                                </div>
                              )}
                            </td>
                            <td>
                              <span style={{
                                padding: '4px 8px',
                                borderRadius: '4px',
                                fontSize: '12px',
                                backgroundColor: task.status === 'completed' ? '#d4edda' : 
                                               task.status === 'in_progress' ? '#fff3cd' : '#f8d7da',
                                color: task.status === 'completed' ? '#155724' : 
                                       task.status === 'in_progress' ? '#856404' : '#721c24'
                              }}>
                                {task.status.replace('_', ' ')}
                              </span>
                            </td>
                            <td>
                              {task.deadline ? new Date(task.deadline).toLocaleDateString() : '-'}
                            </td>
                            <td>
                              <span style={{
                                fontSize: '11px',
                                color: task.is_self_assigned ? '#28a745' : '#6c757d'
                              }}>
                                {task.is_self_assigned ? 'Self' : 'Assigned'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          } />
          <Route path="/upload" element={<UploadCSV onUploadSuccess={fetchStats} />} />
          <Route path="/progress" element={<ProgressDashboard />} />
          <Route path="/visits" element={<VisitManagement />} />
          <Route path="/users" element={<UserManagement />} />
          <Route path="/reports" element={<Reports />} />
        </Routes>
      </main>
    </div>
  );
};

export default AdminDashboard;