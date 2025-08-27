import React, { useState, useEffect } from 'react';
import api from '../utils/api';

const ProgressDashboard = () => {
  const [progress, setProgress] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [customUsersProgress, setCustomUsersProgress] = useState([]);

  useEffect(() => {
    fetchProgress();
    fetchCustomUsersProgress();
  }, [selectedDate]);

  const fetchProgress = async () => {
    try {
      const response = await api.get(`/admin/progress?date=${selectedDate}`);

      setProgress(response.data.progress);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching progress:', error);
      setLoading(false);
    }
  };

  const fetchCustomUsersProgress = async () => {
    try {
      const response = await api.get('/admin/custom-users-progress');
      setCustomUsersProgress(response.data.custom_users);
    } catch (error) {
      console.error('Error fetching custom users progress:', error);
    }
  };

  if (loading) {
    return <div className="loading">Loading progress data...</div>;
  }

  const totalResponses = progress.reduce((sum, p) => sum + p.responses_today, 0);
  const totalTarget = progress.length * 100;
  const overallPercentage = totalTarget > 0 ? (totalResponses / totalTarget) * 100 : 0;

  return (
    <div>
      <div className="card">
        <h2>Daily Progress Dashboard</h2>
        
        <div className="form-group" style={{ maxWidth: '200px', marginBottom: '2rem' }}>
          <label htmlFor="dateSelect">Select Date</label>
          <input
            type="date"
            id="dateSelect"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="form-control"
          />
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-number">{totalResponses}</div>
            <div className="stat-label">Total Responses</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{totalTarget}</div>
            <div className="stat-label">Total Target</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{overallPercentage.toFixed(1)}%</div>
            <div className="stat-label">Overall Progress</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{progress.filter(p => p.responses_today >= 100).length}</div>
            <div className="stat-label">Targets Met</div>
          </div>
        </div>
      </div>

      <div className="card">
        <h3>Individual Caller Progress</h3>
        
        <table className="table">
          <thead>
            <tr>
              <th>Caller Name</th>
              <th>Responses Today</th>
              <th>Total Assigned</th>
              <th>Target</th>
              <th>Progress</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {progress.map(caller => (
              <tr key={caller.caller_id}>
                <td>{caller.caller_name}</td>
                <td>{caller.responses_today}</td>
                <td>{caller.total_assigned}</td>
                <td>{caller.target}</td>
                <td>
                  <div className="progress">
                    <div 
                      className="progress-bar" 
                      style={{ 
                        width: `${caller.percentage}%`,
                        background: caller.percentage >= 100 ? '#27ae60' : 
                                   caller.percentage >= 75 ? '#f39c12' : '#e74c3c'
                      }}
                    >
                      {caller.percentage.toFixed(1)}%
                    </div>
                  </div>
                </td>
                <td>
                  <span style={{
                    padding: '0.25rem 0.5rem',
                    borderRadius: '4px',
                    fontSize: '12px',
                    background: caller.responses_today >= 100 ? '#d4edda' : 
                               caller.responses_today >= 75 ? '#fff3cd' : '#f8d7da',
                    color: caller.responses_today >= 100 ? '#155724' : 
                           caller.responses_today >= 75 ? '#856404' : '#721c24'
                  }}>
                    {caller.responses_today >= 100 ? 'Target Met' : 
                     caller.responses_today >= 75 ? 'On Track' : 'Behind'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {progress.length === 0 && (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#7f8c8d' }}>
            No caller data available for {selectedDate}
          </div>
        )}
      </div>

      {/* Custom Users Task Progress */}
      {customUsersProgress.length > 0 && (
        <div className="card">
          <h3>🎯 Custom Role Users - Active Tasks Progress</h3>
          <p style={{ color: '#666', marginBottom: '1.5rem' }}>
            Real-time progress tracking for custom role users (completed tasks are automatically hidden)
          </p>
          
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Active Tasks</th>
                  <th>Completed</th>
                  <th>Overdue</th>
                  <th>Avg Progress</th>
                  <th>Current Tasks</th>
                </tr>
              </thead>
              <tbody>
                {customUsersProgress.map(user => (
                  <tr key={user.user_id}>
                    <td>
                      <div>
                        <strong>{user.name}</strong>
                        <div style={{ fontSize: '0.8rem', color: '#666' }}>@{user.username}</div>
                      </div>
                    </td>
                    <td>
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        background: '#e8f4fd',
                        color: '#1f4e79',
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                        textTransform: 'capitalize'
                      }}>
                        {user.role}
                      </span>
                    </td>
                    <td>{user.total_tasks - user.completed_tasks}</td>
                    <td style={{ color: '#27ae60', fontWeight: 'bold' }}>{user.completed_tasks}</td>
                    <td style={{ 
                      color: user.overdue_tasks > 0 ? '#e74c3c' : '#666', 
                      fontWeight: user.overdue_tasks > 0 ? 'bold' : 'normal' 
                    }}>
                      {user.overdue_tasks}
                    </td>
                    <td>
                      <div className="progress">
                        <div 
                          className="progress-bar" 
                          style={{ 
                            width: `${user.avg_progress}%`,
                            background: user.avg_progress >= 75 ? '#27ae60' : 
                                       user.avg_progress >= 50 ? '#f39c12' : '#e74c3c'
                          }}
                        >
                          {user.avg_progress}%
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ maxWidth: '300px' }}>
                        {user.recent_tasks.length > 0 ? (
                          user.recent_tasks.map(task => (
                            <div key={task.id} style={{
                              background: task.is_overdue ? '#fff5f5' : '#f8f9fa',
                              border: `1px solid ${task.is_overdue ? '#e74c3c' : '#e1e5e9'}`,
                              borderRadius: '6px',
                              padding: '0.5rem',
                              marginBottom: '0.5rem',
                              fontSize: '0.8rem'
                            }}>
                              <div style={{ 
                                fontWeight: '500', 
                                color: task.is_overdue ? '#e74c3c' : '#333',
                                marginBottom: '0.25rem'
                              }}>
                                {task.title.length > 25 ? task.title.substring(0, 25) + '...' : task.title}
                              </div>
                              <div style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center' 
                              }}>
                                <span style={{
                                  background: task.is_overdue ? '#fadbd8' : '#e8f4fd',
                                  color: task.is_overdue ? '#721c24' : '#1f4e79',
                                  padding: '0.1rem 0.3rem',
                                  borderRadius: '3px',
                                  fontWeight: 'bold'
                                }}>
                                  {task.progress}%
                                </span>
                                {task.deadline && (
                                  <span style={{ 
                                    color: task.is_overdue ? '#e74c3c' : '#666',
                                    fontWeight: task.is_overdue ? 'bold' : 'normal'
                                  }}>
                                    📅 {new Date(task.deadline).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          <span style={{ color: '#999', fontSize: '0.8rem' }}>
                            All tasks completed! 🎉
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {customUsersProgress.length === 0 && (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#7f8c8d' }}>
              No custom role users found
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProgressDashboard;