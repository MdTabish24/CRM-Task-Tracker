import React, { useState, useEffect } from 'react';
import api from '../utils/api';

const Reports = () => {
  const [callsReport, setCallsReport] = useState(null);
  const [tasksReport, setTasksReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const [callsRes, tasksRes] = await Promise.all([
        api.get('/reports/calls'),
        api.get('/reports/tasks')
      ]);

      setCallsReport(callsRes.data);
      setTasksReport(tasksRes.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching reports:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading reports...</div>;
  }

  return (
    <div>
      <div className="card">
        <h2>System Reports</h2>
        <p>Comprehensive overview of system performance and metrics</p>
      </div>

      {/* Calls Report */}
      <div className="card">
        <h3>Calls & Records Report</h3>
        
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-number">{callsReport?.total_records || 0}</div>
            <div className="stat-label">Total Records</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{callsReport?.completed_calls || 0}</div>
            <div className="stat-label">Completed Calls</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{callsReport?.visits_confirmed || 0}</div>
            <div className="stat-label">Visits Confirmed</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{callsReport?.visits_declined || 0}</div>
            <div className="stat-label">Visits Declined</div>
          </div>
        </div>

        <div style={{ marginTop: '2rem' }}>
          <h4>Performance Metrics</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
            <div>
              <label>Call Completion Rate</label>
              <div className="progress">
                <div 
                  className="progress-bar" 
                  style={{ 
                    width: `${callsReport?.completion_rate || 0}%`,
                    background: (callsReport?.completion_rate || 0) >= 75 ? '#27ae60' : 
                               (callsReport?.completion_rate || 0) >= 50 ? '#f39c12' : '#e74c3c'
                  }}
                >
                  {(callsReport?.completion_rate || 0).toFixed(1)}%
                </div>
              </div>
            </div>
            
            <div>
              <label>Visit Conversion Rate</label>
              <div className="progress">
                <div 
                  className="progress-bar" 
                  style={{ 
                    width: `${callsReport ? (callsReport.visits_confirmed / (callsReport.visits_confirmed + callsReport.visits_declined) * 100) || 0 : 0}%`,
                    background: '#3498db'
                  }}
                >
                  {callsReport ? ((callsReport.visits_confirmed / (callsReport.visits_confirmed + callsReport.visits_declined) * 100) || 0).toFixed(1) : 0}%
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tasks Report */}
      <div className="card">
        <h3>Tasks Report</h3>
        
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-number">{tasksReport?.total_tasks || 0}</div>
            <div className="stat-label">Total Tasks</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{tasksReport?.completed_tasks || 0}</div>
            <div className="stat-label">Completed Tasks</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{tasksReport?.overdue_tasks || 0}</div>
            <div className="stat-label">Overdue Tasks</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">
              {tasksReport ? (tasksReport.total_tasks - tasksReport.completed_tasks - tasksReport.overdue_tasks) : 0}
            </div>
            <div className="stat-label">In Progress</div>
          </div>
        </div>

        <div style={{ marginTop: '2rem' }}>
          <h4>Task Performance</h4>
          <div>
            <label>Task Completion Rate</label>
            <div className="progress">
              <div 
                className="progress-bar" 
                style={{ 
                  width: `${tasksReport?.completion_rate || 0}%`,
                  background: (tasksReport?.completion_rate || 0) >= 75 ? '#27ae60' : 
                             (tasksReport?.completion_rate || 0) >= 50 ? '#f39c12' : '#e74c3c'
                }}
              >
                {(tasksReport?.completion_rate || 0).toFixed(1)}%
              </div>
            </div>
          </div>
        </div>

        {tasksReport?.overdue_tasks > 0 && (
          <div style={{ 
            marginTop: '1rem', 
            padding: '1rem', 
            background: '#fff3cd', 
            borderRadius: '4px',
            border: '1px solid #ffeaa7'
          }}>
            <strong>⚠️ Attention Required:</strong> There are {tasksReport.overdue_tasks} overdue tasks that need immediate attention.
          </div>
        )}
      </div>

      {/* Summary & Insights */}
      <div className="card">
        <h3>Summary & Insights</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
          <div>
            <h4>System Health</h4>
            <ul style={{ paddingLeft: '1.5rem' }}>
              <li>
                <strong>Call Performance:</strong> {
                  (callsReport?.completion_rate || 0) >= 75 ? '✅ Excellent' :
                  (callsReport?.completion_rate || 0) >= 50 ? '⚠️ Good' : '❌ Needs Improvement'
                }
              </li>
              <li>
                <strong>Task Management:</strong> {
                  (tasksReport?.completion_rate || 0) >= 75 ? '✅ On Track' :
                  (tasksReport?.completion_rate || 0) >= 50 ? '⚠️ Moderate' : '❌ Behind Schedule'
                }
              </li>
              <li>
                <strong>Overdue Items:</strong> {
                  (tasksReport?.overdue_tasks || 0) === 0 ? '✅ None' : `❌ ${tasksReport?.overdue_tasks} tasks`
                }
              </li>
            </ul>
          </div>

          <div>
            <h4>Recommendations</h4>
            <ul style={{ paddingLeft: '1.5rem' }}>
              {(callsReport?.completion_rate || 0) < 50 && (
                <li>Consider additional caller training or support</li>
              )}
              {(tasksReport?.overdue_tasks || 0) > 0 && (
                <li>Review and reassign overdue tasks</li>
              )}
              {(callsReport?.visits_confirmed || 0) / ((callsReport?.visits_confirmed || 0) + (callsReport?.visits_declined || 0)) < 0.3 && (
                <li>Improve visit conversion strategies</li>
              )}
              <li>Regular progress monitoring recommended</li>
            </ul>
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: '2rem' }}>
        <button onClick={fetchReports} className="btn btn-primary">
          Refresh Reports
        </button>
      </div>
    </div>
  );
};

export default Reports;