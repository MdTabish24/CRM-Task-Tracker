import React, { useState, useEffect } from 'react';
import api from '../utils/api';

const VisitNotifications = ({ user }) => {
  const [notifications, setNotifications] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
    // Refresh every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/caller/visit-notifications');
      setNotifications(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading notifications...</div>;
  }

  if (!notifications) {
    return null;
  }

  return (
    <div className="card">
      <h2>🔔 Visit Notifications</h2>
      
      {/* Stats Summary */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-number" style={{ color: '#9b59b6' }}>
            {notifications.stats.total_visits_done}
          </div>
          <div className="stat-label">🏠 Visits Done</div>
        </div>
        <div className="stat-card">
          <div className="stat-number" style={{ color: '#27ae60' }}>
            {notifications.stats.total_confirmed}
          </div>
          <div className="stat-label">✅ Visits Confirmed</div>
        </div>
        <div className="stat-card">
          <div className="stat-number" style={{ color: '#f39c12' }}>
            {notifications.stats.pending_visits}
          </div>
          <div className="stat-label">⏳ Pending Review</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem', marginTop: '2rem' }}>
        
        {/* Recent Visits */}
        <div>
          <h3 style={{ color: '#9b59b6', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            🏠 Recent Visits
          </h3>
          {notifications.recent_visits.length > 0 ? (
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {notifications.recent_visits.map(visit => (
                <div key={visit.id} style={{
                  padding: '0.75rem',
                  background: '#f3e5f5',
                  borderRadius: '8px',
                  marginBottom: '0.5rem',
                  border: '1px solid #9b59b6',
                  transition: 'transform 0.2s ease'
                }}>
                  <div style={{ fontWeight: 'bold', color: '#333' }}>{visit.name || 'Unknown'}</div>
                  <div style={{ fontSize: '14px', color: '#666' }}>{visit.phone_number}</div>
                  <div style={{ fontSize: '12px', color: '#888', marginTop: '0.25rem' }}>
                    Visited: {new Date(visit.updated_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: '#7f8c8d', fontStyle: 'italic' }}>No visits recorded yet</p>
          )}
        </div>

        {/* Recent Confirmations */}
        <div>
          <h3 style={{ color: '#27ae60', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            ✅ Recent Confirmations
          </h3>
          {notifications.recent_confirmations.length > 0 ? (
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {notifications.recent_confirmations.map(visit => (
                <div key={visit.id} style={{
                  padding: '0.75rem',
                  background: '#d5f4e6',
                  borderRadius: '8px',
                  marginBottom: '0.5rem',
                  border: '1px solid #27ae60',
                  transition: 'transform 0.2s ease'
                }}>
                  <div style={{ fontWeight: 'bold', color: '#333' }}>{visit.name || 'Unknown'}</div>
                  <div style={{ fontSize: '14px', color: '#666' }}>{visit.phone_number}</div>
                  <div style={{ fontSize: '12px', color: '#888', marginTop: '0.25rem' }}>
                    Confirmed: {new Date(visit.updated_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: '#7f8c8d', fontStyle: 'italic' }}>No confirmed visits yet</p>
          )}
        </div>
      </div>

      {/* Performance Summary */}
      <div style={{ 
        marginTop: '2rem', 
        padding: '1.5rem', 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '12px',
        textAlign: 'center',
        color: 'white'
      }}>
        <h4 style={{ marginBottom: '1rem' }}>📈 Your Performance</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
              {notifications.stats.total_visits_done + notifications.stats.total_confirmed}
            </div>
            <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Total Visits</div>
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
              {(notifications.stats.total_visits_done + notifications.stats.total_confirmed) > 0 
                ? Math.round((notifications.stats.total_confirmed / (notifications.stats.total_visits_done + notifications.stats.total_confirmed)) * 100)
                : 0}%
            </div>
            <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Conversion Rate</div>
          </div>
        </div>
        <p style={{ fontSize: '14px', marginTop: '1rem', opacity: 0.9 }}>
          Keep up the great work! Your calls are making a difference.
        </p>
      </div>

      <div style={{ textAlign: 'center', marginTop: '1rem' }}>
        <button 
          onClick={fetchNotifications}
          className="btn btn-primary"
          style={{ fontSize: '14px' }}
        >
          🔄 Refresh Notifications
        </button>
      </div>
    </div>
  );
};

export default VisitNotifications;