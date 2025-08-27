import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';

const CustomDashboard = ({ user, onLogout }) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingTask, setEditingTask] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    deadline: ''
  });

  useEffect(() => {
    fetchDashboardData();
    // Refresh every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      console.log('Fetching custom dashboard data for user:', user);
      const response = await api.get('/dashboard/custom');
      console.log('Dashboard data received:', response.data);
      setDashboardData(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      // If access denied, show error message but don't redirect
      if (error.response?.status === 403) {
        setDashboardData(null);
      }
      setLoading(false);
    }
  };

  const updateTask = async (taskId, updates) => {
    try {
      await api.patch(`/tasks/${taskId}`, updates);
      fetchDashboardData();
      setEditingTask(null);
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const createTask = async (e) => {
    e.preventDefault();
    try {
      await api.post('/tasks/self', {
        title: newTask.title,
        description: newTask.description,
        deadline: newTask.deadline || null
      });
      
      setNewTask({ title: '', description: '', deadline: '' });
      setShowCreateForm(false);
      fetchDashboardData();
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const completeTask = async (taskId) => {
    try {
      await api.patch(`/tasks/${taskId}`, { 
        status: 'completed', 
        progress: 100 
      });
      fetchDashboardData();
    } catch (error) {
      console.error('Error completing task:', error);
    }
  };

  const deleteTask = async (taskId) => {
    try {
      await api.delete(`/tasks/${taskId}`);
      fetchDashboardData();
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#27ae60';
      case 'in_progress': return '#f39c12';
      case 'overdue': return '#e74c3c';
      default: return '#95a5a6';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return '✅';
      case 'in_progress': return '🔄';
      case 'overdue': return '⚠️';
      default: return '📋';
    }
  };

  const isOverdue = (deadline, status) => {
    return deadline && new Date(deadline) < new Date() && status !== 'completed';
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="error-container">
        <div className="error-content">
          <h2>🚫 Access Issue</h2>
          <p>Unable to load dashboard data. This might be a temporary issue.</p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button onClick={fetchDashboardData} className="btn btn-primary">
              🔄 Retry
            </button>
            <button onClick={onLogout} className="btn btn-secondary">
              🚪 Logout
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="custom-dashboard">
      <header className="header">
        <div className="header-content">
          <div className="header-left">
            <h1>📋 {dashboardData.user.role.charAt(0).toUpperCase() + dashboardData.user.role.slice(1)} Dashboard</h1>
            <p>Welcome, {dashboardData.user.name}</p>
          </div>
          <div className="header-actions">
            <button onClick={onLogout} className="btn btn-logout">
              🚪 Logout
            </button>
          </div>
        </div>
      </header>

      <main className="main-content">
        {/* Welcome Section */}
        <div className="welcome-section">
          <div className="card welcome-card">
            <div className="welcome-content">
              <div className="welcome-text">
                <h2>Welcome back, {dashboardData.user.name}! 👋</h2>
                <p>You're logged in as <strong>{dashboardData.user.role}</strong>. Here's your task overview for today.</p>
              </div>
              <div className="welcome-stats">
                <div className="quick-stat">
                  <span className="quick-number">{dashboardData.today_completed || 0}</span>
                  <span className="quick-label">Completed Today</span>
                </div>
                <div className="quick-stat">
                  <span className="quick-number">{dashboardData.overdue_count || 0}</span>
                  <span className="quick-label">Overdue Tasks</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="stats-section">
          <div className="stats-grid">
            <div className="stat-card total-card">
              <div className="stat-icon">📋</div>
              <div className="stat-content">
                <div className="stat-number">{dashboardData.stats?.total_tasks || 0}</div>
                <div className="stat-label">Total Tasks</div>
              </div>
            </div>
            <div className="stat-card completed-card">
              <div className="stat-icon">✅</div>
              <div className="stat-content">
                <div className="stat-number">{dashboardData.stats?.completed_tasks || 0}</div>
                <div className="stat-label">Completed</div>
              </div>
            </div>
            <div className="stat-card progress-card">
              <div className="stat-icon">🔄</div>
              <div className="stat-content">
                <div className="stat-number">{dashboardData.stats?.in_progress_tasks || 0}</div>
                <div className="stat-label">In Progress</div>
              </div>
            </div>
            <div className="stat-card pending-card">
              <div className="stat-icon">⏳</div>
              <div className="stat-content">
                <div className="stat-number">{dashboardData.stats?.pending_tasks || 0}</div>
                <div className="stat-label">Pending</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tasks Section */}
        <div className="tasks-section">
          <div className="card">
            <div className="section-header">
              <h2>📝 My Todo List</h2>
              <div className="header-actions">
                <button 
                  onClick={() => setShowCreateForm(!showCreateForm)}
                  className="btn btn-primary"
                >
                  ➕ Add Task
                </button>
                <button 
                  onClick={fetchDashboardData}
                  className="btn btn-refresh"
                >
                  🔄 Refresh
                </button>
              </div>
            </div>

            {/* Create Task Form */}
            {showCreateForm && (
              <div className="create-task-form">
                <h3>➕ Create New Task</h3>
                <form onSubmit={createTask}>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Task Title *</label>
                      <input
                        type="text"
                        value={newTask.title}
                        onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                        placeholder="What needs to be done?"
                        required
                        className="form-input"
                      />
                    </div>
                    <div className="form-group">
                      <label>Deadline</label>
                      <input
                        type="date"
                        value={newTask.deadline}
                        onChange={(e) => setNewTask({...newTask, deadline: e.target.value})}
                        className="form-input"
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Description</label>
                    <textarea
                      value={newTask.description}
                      onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                      placeholder="Add more details about this task..."
                      rows="3"
                      className="form-input"
                    />
                  </div>
                  <div className="form-actions">
                    <button type="submit" className="btn btn-success">
                      ✅ Create Task
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setShowCreateForm(false)}
                      className="btn btn-secondary"
                    >
                      ❌ Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Tasks List */}
            {dashboardData.my_tasks && dashboardData.my_tasks.length > 0 ? (
              <div className="tasks-container">
                {dashboardData.my_tasks
                  .filter(task => task.status !== 'completed') // Hide completed tasks
                  .map(task => {
                    const overdue = isOverdue(task.deadline, task.status);
                    
                    return (
                      <div 
                        key={task.id} 
                        className={`task-item ${overdue ? 'overdue' : ''}`}
                      >
                        <div className="task-main">
                          <div className="task-info">
                            <div className="task-title-row">
                              <span className="task-icon">{getStatusIcon(overdue ? 'overdue' : task.status)}</span>
                              <h3 className="task-title">{task.title}</h3>
                              {task.deadline && (
                                <span className={`task-deadline ${overdue ? 'overdue-text' : ''}`}>
                                  📅 {new Date(task.deadline).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                            {task.description && (
                              <p className="task-description">{task.description}</p>
                            )}
                          </div>

                          <div className="task-controls">
                            <div className="progress-section">
                              <label>Progress: {task.progress}%</label>
                              <div className="progress-input-group">
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={task.progress}
                                  onChange={(e) => updateTask(task.id, { 
                                    progress: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)),
                                    status: parseInt(e.target.value) > 0 ? 'in_progress' : 'pending'
                                  })}
                                  className="progress-input"
                                />
                                <span className="progress-unit">%</span>
                              </div>
                            </div>

                            <div className="task-actions">
                              <button
                                onClick={() => completeTask(task.id)}
                                className="btn btn-done"
                                title="Mark as completed and remove from list"
                              >
                                ✅ Done
                              </button>
                              <button
                                onClick={() => deleteTask(task.id)}
                                className="btn btn-delete"
                                title="Delete this task"
                              >
                                🗑️ Delete
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="task-progress-bar">
                          <div 
                            className="progress-fill"
                            style={{ 
                              width: `${task.progress}%`,
                              background: overdue ? '#e74c3c' : 
                                         task.progress === 100 ? '#27ae60' :
                                         task.progress > 0 ? '#f39c12' : '#95a5a6'
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className="no-tasks">
                <div className="no-tasks-icon">📝</div>
                <h3>No Active Tasks</h3>
                <p>Create your first task to get started with your todo list!</p>
                <button 
                  onClick={() => setShowCreateForm(true)}
                  className="btn btn-primary"
                >
                  ➕ Create First Task
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      <style jsx>{`
        .custom-dashboard {
          min-height: 100vh;
          background: #f5f6fa;
        }

        .loading-container, .error-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          color: #666;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #3498db;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 1rem;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 2rem;
        }

        .header-content {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .header-left h1 {
          margin: 0 0 0.5rem 0;
          font-size: 2rem;
        }

        .header-left p {
          margin: 0;
          opacity: 0.9;
        }

        .main-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
        }

        .welcome-section {
          margin-bottom: 2rem;
        }

        .welcome-card {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
        }

        .welcome-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 2rem;
        }

        .welcome-text h2 {
          margin: 0 0 0.5rem 0;
          font-size: 1.8rem;
        }

        .welcome-text p {
          margin: 0;
          opacity: 0.9;
          font-size: 1.1rem;
        }

        .welcome-stats {
          display: flex;
          gap: 2rem;
        }

        .quick-stat {
          text-align: center;
          background: rgba(255, 255, 255, 0.1);
          padding: 1rem;
          border-radius: 8px;
          min-width: 80px;
        }

        .quick-number {
          display: block;
          font-size: 2rem;
          font-weight: bold;
          margin-bottom: 0.25rem;
        }

        .quick-label {
          font-size: 0.9rem;
          opacity: 0.9;
        }

        .stats-section {
          margin-bottom: 2rem;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }

        .stat-card {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          display: flex;
          align-items: center;
          gap: 1rem;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          transition: transform 0.2s ease;
        }

        .stat-card:hover {
          transform: translateY(-2px);
        }

        .total-card {
          background: white;
          border: 2px solid #3498db;
          color: #3498db;
        }

        .completed-card {
          background: white;
          border: 2px solid #27ae60;
          color: #27ae60;
        }

        .progress-card {
          background: white;
          border: 2px solid #f39c12;
          color: #f39c12;
        }

        .pending-card {
          background: white;
          border: 2px solid #95a5a6;
          color: #95a5a6;
        }

        .stat-icon {
          font-size: 2rem;
        }

        .stat-number {
          font-size: 2rem;
          font-weight: bold;
          margin-bottom: 0.25rem;
        }

        .stat-label {
          font-size: 0.9rem;
          opacity: 0.8;
        }

        .card {
          background: white;
          border-radius: 12px;
          padding: 2rem;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .section-header h2 {
          margin: 0;
          color: #333;
        }

        .header-actions {
          display: flex;
          gap: 0.5rem;
        }

        .create-task-form {
          background: #f8f9fa;
          border-radius: 12px;
          padding: 2rem;
          margin-bottom: 2rem;
          border: 2px dashed #dee2e6;
        }

        .create-task-form h3 {
          margin: 0 0 1.5rem 0;
          color: #333;
        }

        .form-row {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .form-group {
          margin-bottom: 1rem;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
          color: #333;
        }

        .form-input {
          width: 100%;
          padding: 0.75rem;
          border: 2px solid #e1e5e9;
          border-radius: 8px;
          font-size: 14px;
          transition: border-color 0.2s ease;
        }

        .form-input:focus {
          outline: none;
          border-color: #3498db;
        }

        .form-actions {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
        }

        .tasks-container {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .task-item {
          background: white;
          border: 2px solid #e1e5e9;
          border-radius: 12px;
          padding: 1.5rem;
          transition: all 0.2s ease;
        }

        .task-item:hover {
          border-color: #3498db;
          box-shadow: 0 4px 12px rgba(52, 152, 219, 0.1);
        }

        .task-item.overdue {
          border-color: #e74c3c;
          background: #fff5f5;
        }

        .task-main {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 2rem;
          margin-bottom: 1rem;
        }

        .task-info {
          flex: 1;
        }

        .task-title-row {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
        }

        .task-title {
          margin: 0;
          color: #333;
          flex: 1;
        }

        .task-deadline {
          font-size: 0.9rem;
          color: #666;
          background: #f8f9fa;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
        }

        .task-description {
          margin: 0;
          color: #666;
          font-size: 0.9rem;
          line-height: 1.4;
        }

        .task-controls {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          min-width: 200px;
        }

        .progress-section {
          text-align: center;
        }

        .progress-section label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
          color: #333;
        }

        .progress-input-group {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.25rem;
        }

        .progress-input {
          width: 60px;
          padding: 0.5rem;
          border: 2px solid #e1e5e9;
          border-radius: 6px;
          text-align: center;
          font-weight: bold;
        }

        .progress-input:focus {
          outline: none;
          border-color: #3498db;
        }

        .progress-unit {
          font-weight: bold;
          color: #666;
        }

        .task-actions {
          display: flex;
          gap: 0.5rem;
          justify-content: center;
        }

        .task-progress-bar {
          height: 6px;
          background: #e9ecef;
          border-radius: 3px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          border-radius: 3px;
          transition: width 0.3s ease;
        }

        .task-card {
          border: 1px solid #e1e5e9;
          border-radius: 12px;
          padding: 1.5rem;
          transition: all 0.2s ease;
        }

        .task-card:hover {
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .task-card.overdue {
          border-color: #e74c3c;
          background: #fff5f5;
        }

        .task-card.completed {
          border-color: #27ae60;
          background: #f8fff8;
        }

        .task-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1rem;
        }

        .task-title {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .task-title h3 {
          margin: 0;
          color: #333;
        }

        .task-icon {
          font-size: 1.2rem;
        }

        .status-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 500;
          text-transform: capitalize;
        }

        .task-description {
          color: #666;
          margin-bottom: 1rem;
          line-height: 1.5;
        }

        .task-meta {
          display: grid;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }

        .task-deadline, .task-progress {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .meta-label {
          font-weight: 500;
          color: #333;
          min-width: 80px;
        }

        .meta-value {
          color: #666;
        }

        .overdue-text {
          color: #e74c3c;
          font-weight: 600;
        }

        .progress-container {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex: 1;
        }

        .progress-bar {
          flex: 1;
          height: 8px;
          background: #e9ecef;
          border-radius: 4px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          border-radius: 4px;
          transition: width 0.3s ease;
        }

        .progress-text {
          font-size: 0.8rem;
          font-weight: 500;
          color: #666;
          min-width: 35px;
        }

        .task-actions {
          border-top: 1px solid #f1f3f4;
          padding-top: 1rem;
        }

        .edit-controls {
          display: flex;
          gap: 1rem;
          align-items: center;
          flex-wrap: wrap;
        }

        .status-select {
          padding: 0.5rem;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 0.9rem;
        }

        .progress-slider {
          flex: 1;
          min-width: 100px;
        }

        .btn {
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 6px;
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
        }

        .btn-logout {
          background: rgba(255, 255, 255, 0.2);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.3);
        }

        .btn-logout:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        .btn-refresh {
          background: #3498db;
          color: white;
        }

        .btn-refresh:hover {
          background: #2980b9;
        }

        .btn-edit {
          background: #f39c12;
          color: white;
        }

        .btn-edit:hover {
          background: #e67e22;
        }

        .btn-done {
          background: #27ae60;
          color: white;
          padding: 0.5rem 1rem;
          font-size: 0.9rem;
        }

        .btn-done:hover {
          background: #229954;
        }

        .btn-delete {
          background: #e74c3c;
          color: white;
          padding: 0.5rem 1rem;
          font-size: 0.9rem;
        }

        .btn-delete:hover {
          background: #c0392b;
        }

        .btn-success {
          background: #27ae60;
          color: white;
        }

        .btn-success:hover {
          background: #229954;
        }

        .btn-primary {
          background: #3498db;
          color: white;
        }

        .btn-primary:hover {
          background: #2980b9;
        }

        .no-tasks {
          text-align: center;
          padding: 4rem 2rem;
          color: #666;
        }

        .no-tasks-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
        }

        .no-tasks h3 {
          margin-bottom: 0.5rem;
          color: #333;
        }

        @media (max-width: 768px) {
          .header-content {
            flex-direction: column;
            gap: 1rem;
            text-align: center;
          }

          .main-content {
            padding: 1rem;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }

          .section-header {
            flex-direction: column;
            gap: 1rem;
            align-items: stretch;
          }

          .task-header {
            flex-direction: column;
            gap: 1rem;
          }

          .edit-controls {
            flex-direction: column;
            align-items: stretch;
          }
        }
      `}</style>
    </div>
  );
};

export default CustomDashboard;