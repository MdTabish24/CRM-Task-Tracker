import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import VisitNotifications from './VisitNotifications';
import CallerTasks from './CallerTasks';
import ReminderModal from './ReminderModal';
import ReminderAlarmPopup from './ReminderAlarmPopup';

const CallerDashboard = ({ user, onLogout }) => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [editingRecord, setEditingRecord] = useState(null);
  const [todayProgress, setTodayProgress] = useState(0);
  const [reminderModalRecord, setReminderModalRecord] = useState(null);
  const [reminderQueue, setReminderQueue] = useState([]);
  const [showAlarmPopup, setShowAlarmPopup] = useState(false);
  const [activeTab, setActiveTab] = useState('tasks'); // tasks, alarms, try_again, visited, confirmed, other

  useEffect(() => {
    fetchRecords();
    fetchTodayProgress();
    checkReminders();
    
    // Check reminders every 30 seconds
    const reminderInterval = setInterval(() => {
      checkReminders();
    }, 30000);
    
    return () => clearInterval(reminderInterval);
  }, [currentPage, search, activeTab]);

  const fetchRecords = async () => {
    if (activeTab === 'tasks') {
      setLoading(false);
      return; // Tasks are fetched separately
    }
    
    try {
      const tab = activeTab === 'alarms' ? 'alarms' : 
                  activeTab === 'try_again' ? 'try_again' :
                  activeTab === 'visited' ? 'visited' :
                  activeTab === 'confirmed' ? 'confirmed' : 'other';
      const response = await api.get(`/caller/records?page=${currentPage}&search=${search}&tab=${tab}`);

      setRecords(response.data.records);
      setTotalPages(response.data.pages);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching records:', error);
      setLoading(false);
    }
  };

  const fetchTodayProgress = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await api.get(`/admin/progress?date=${today}`);

      const myProgress = response.data.progress.find(p => p.caller_id === user.id);
      setTodayProgress(myProgress ? myProgress.responses_today : 0);
    } catch (error) {
      console.error('Error fetching progress:', error);
    }
  };

  const checkReminders = async () => {
    try {
      console.log('🔍 Checking reminders...');
      
      // First check for new reminders to trigger
      const checkResponse = await api.get('/caller/check-reminders');
      console.log('✅ Check response:', checkResponse.data);
      
      // Then get the queue
      const queueResponse = await api.get('/caller/reminder-queue');
      console.log('📋 Queue response:', queueResponse.data);
      
      if (queueResponse.data.count > 0) {
        console.log('🔔 Found alarms in queue:', queueResponse.data.count);
        setReminderQueue(queueResponse.data.queue);
        setShowAlarmPopup(true);
      } else {
        console.log('😴 No alarms in queue');
      }
    } catch (error) {
      console.error('❌ Error checking reminders:', error);
    }
  };

  const handleDismissAlarm = (queueId) => {
    setReminderQueue(prev => prev.filter(item => item.queue_id !== queueId));
    
    // If no more alarms, hide popup
    if (reminderQueue.length <= 1) {
      setShowAlarmPopup(false);
    }
  };

  const handleSetReminder = (record) => {
    setReminderModalRecord(record);
  };

  const handleDeleteRecord = async (recordId) => {
    if (!window.confirm('Are you sure you want to delete this record? This action cannot be undone.')) {
      return;
    }
    
    try {
      await api.delete(`/records/${recordId}`);
      fetchRecords();
      alert('Record deleted successfully');
    } catch (error) {
      console.error('Error deleting record:', error);
      alert('Failed to delete record');
    }
  };

  const handleWhatsAppClick = (phoneNumber, name) => {
    // Format phone number - remove spaces, dashes, and add country code if needed
    let formattedNumber = phoneNumber.replace(/[\s\-\(\)]/g, '');
    
    // Add +91 if number doesn't start with + or country code
    if (!formattedNumber.startsWith('+')) {
      if (!formattedNumber.startsWith('91') && formattedNumber.length === 10) {
        formattedNumber = '91' + formattedNumber;
      }
    }
    
    // Create pre-filled message template
    const studentName = name || 'Student';
    const message = `Hello ${studentName},

I hope this message finds you well. I'm reaching out from [Your Institute Name] regarding your interest in our courses.

We would love to discuss how we can help you achieve your career goals. When would be a convenient time for you to talk?

Looking forward to hearing from you!

Best regards,
${user.name}
[Your Institute Name]`;
    
    // Encode message for URL
    const encodedMessage = encodeURIComponent(message);
    
    // Open WhatsApp Web with pre-filled message
    const whatsappUrl = `https://web.whatsapp.com/send?phone=${formattedNumber}&text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleUpdateRecord = async (recordId, updates) => {
    try {
      await api.patch(`/records/${recordId}`, updates);

      // Update local state
      setRecords(records.map(record => 
        record.id === recordId ? { ...record, ...updates } : record
      ));
      
      setEditingRecord(null);
      fetchTodayProgress(); // Refresh progress
    } catch (error) {
      console.error('Error updating record:', error);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchRecords();
  };

  const EditForm = ({ record, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
      name: record.name || '',
      response: record.response || '',
      notes: record.notes || ''
    });
    const [responseType, setResponseType] = useState(() => {
      // Determine initial response type
      const resp = record.response || '';
      if (resp === 'Positive') return 'positive';
      if (resp === 'Negative') return 'negative';
      if (resp === 'Not Picked') return 'not_picked';
      if (resp) return 'other';
      return '';
    });
    const [customResponse, setCustomResponse] = useState(() => {
      const resp = record.response || '';
      if (['Positive', 'Negative', 'Not Picked'].includes(resp)) return '';
      return resp;
    });

    const handleSubmit = (e) => {
      e.preventDefault();
      
      // Set response based on type
      let finalResponse = '';
      if (responseType === 'positive') finalResponse = 'Positive';
      else if (responseType === 'negative') finalResponse = 'Negative';
      else if (responseType === 'not_picked') finalResponse = 'Not Picked';
      else if (responseType === 'other') finalResponse = customResponse;
      
      onSave(record.id, {
        ...formData,
        response: finalResponse
      });
    };

    return (
      <tr>
        <td>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>{record.phone_number}</span>
            <button
              onClick={() => handleWhatsAppClick(record.phone_number, formData.name || record.name)}
              title="Open WhatsApp chat"
              type="button"
              style={{
                background: '#25D366',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                padding: '0',
                transition: 'transform 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              💬
            </button>
          </div>
        </td>
        <td>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            className="form-control"
            placeholder="Enter name"
          />
        </td>
        <td>
          <select
            value={responseType}
            onChange={(e) => setResponseType(e.target.value)}
            className="form-control"
            style={{ marginBottom: '0.5rem' }}
          >
            <option value="">-- Select Response --</option>
            <option value="positive">✅ Positive</option>
            <option value="negative">❌ Negative</option>
            <option value="not_picked">📵 Not Picked</option>
            <option value="other">📝 Other</option>
          </select>
          
          {responseType === 'other' && (
            <textarea
              value={customResponse}
              onChange={(e) => setCustomResponse(e.target.value)}
              className="form-control"
              placeholder="Enter custom response"
              rows="2"
            />
          )}
        </td>
        <td>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({...formData, notes: e.target.value})}
            className="form-control"
            placeholder="Enter notes"
            rows="2"
          />
        </td>
        <td>{record.visit}</td>
        <td>
          <button onClick={handleSubmit} className="btn btn-success" style={{marginRight: '0.5rem'}}>
            Save
          </button>
          <button onClick={onCancel} className="btn btn-secondary">
            Cancel
          </button>
        </td>
      </tr>
    );
  };

  if (loading) {
    return <div className="loading">Loading records...</div>;
  }

  return (
    <div>
      <header className="header">
        <h1>Caller Dashboard</h1>
        <div className="header-actions">
          <div className="user-info">
            <span>Welcome, {user.name}</span>
            <Link to="/tasks" className="btn btn-secondary">My Tasks</Link>
            <button onClick={onLogout} className="btn btn-danger">Logout</button>
          </div>
        </div>
      </header>

      <main className="main-content">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-number">{todayProgress}</div>
            <div className="stat-label">Responses Today</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{records.length}</div>
            <div className="stat-label">Records on Page</div>
          </div>
          <div className="stat-card">
            <div className="progress">
              <div 
                className="progress-bar" 
                style={{ width: `${Math.min(100, (todayProgress / 100) * 100)}%` }}
              >
                {Math.round((todayProgress / 100) * 100)}%
              </div>
            </div>
            <div className="stat-label">Daily Target (100)</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="card">
          <div style={{ borderBottom: '2px solid #e0e0e0', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => { setActiveTab('tasks'); setCurrentPage(1); }}
                style={{
                  padding: '0.75rem 1.5rem',
                  border: 'none',
                  background: activeTab === 'tasks' ? '#007bff' : 'transparent',
                  color: activeTab === 'tasks' ? 'white' : '#666',
                  cursor: 'pointer',
                  borderBottom: activeTab === 'tasks' ? '3px solid #007bff' : 'none',
                  fontWeight: activeTab === 'tasks' ? 'bold' : 'normal'
                }}
              >
                📋 My Tasks
              </button>
              <button
                onClick={() => { setActiveTab('alarms'); setCurrentPage(1); }}
                style={{
                  padding: '0.75rem 1.5rem',
                  border: 'none',
                  background: activeTab === 'alarms' ? '#007bff' : 'transparent',
                  color: activeTab === 'alarms' ? 'white' : '#666',
                  cursor: 'pointer',
                  borderBottom: activeTab === 'alarms' ? '3px solid #007bff' : 'none',
                  fontWeight: activeTab === 'alarms' ? 'bold' : 'normal'
                }}
              >
                ⏰ With Alarms
              </button>
              <button
                onClick={() => { setActiveTab('try_again'); setCurrentPage(1); }}
                style={{
                  padding: '0.75rem 1.5rem',
                  border: 'none',
                  background: activeTab === 'try_again' ? '#007bff' : 'transparent',
                  color: activeTab === 'try_again' ? 'white' : '#666',
                  cursor: 'pointer',
                  borderBottom: activeTab === 'try_again' ? '3px solid #007bff' : 'none',
                  fontWeight: activeTab === 'try_again' ? 'bold' : 'normal'
                }}
              >
                🔄 Try Again
              </button>
              <button
                onClick={() => { setActiveTab('visited'); setCurrentPage(1); }}
                style={{
                  padding: '0.75rem 1.5rem',
                  border: 'none',
                  background: activeTab === 'visited' ? '#007bff' : 'transparent',
                  color: activeTab === 'visited' ? 'white' : '#666',
                  cursor: 'pointer',
                  borderBottom: activeTab === 'visited' ? '3px solid #007bff' : 'none',
                  fontWeight: activeTab === 'visited' ? 'bold' : 'normal'
                }}
              >
                👥 Visited
              </button>
              <button
                onClick={() => { setActiveTab('confirmed'); setCurrentPage(1); }}
                style={{
                  padding: '0.75rem 1.5rem',
                  border: 'none',
                  background: activeTab === 'confirmed' ? '#007bff' : 'transparent',
                  color: activeTab === 'confirmed' ? 'white' : '#666',
                  cursor: 'pointer',
                  borderBottom: activeTab === 'confirmed' ? '3px solid #007bff' : 'none',
                  fontWeight: activeTab === 'confirmed' ? 'bold' : 'normal'
                }}
              >
                ✅ Confirmed
              </button>
              <button
                onClick={() => { setActiveTab('other'); setCurrentPage(1); }}
                style={{
                  padding: '0.75rem 1.5rem',
                  border: 'none',
                  background: activeTab === 'other' ? '#007bff' : 'transparent',
                  color: activeTab === 'other' ? 'white' : '#666',
                  cursor: 'pointer',
                  borderBottom: activeTab === 'other' ? '3px solid #007bff' : 'none',
                  fontWeight: activeTab === 'other' ? 'bold' : 'normal'
                }}
              >
                📞 Other Records
              </button>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'tasks' ? (
            <CallerTasks />
          ) : (
            <>
              <h2>
                {activeTab === 'alarms' && 'Records with Alarms'}
                {activeTab === 'try_again' && 'Try Again - Not Picked Calls'}
                {activeTab === 'visited' && 'Visited Records (Read Only)'}
                {activeTab === 'confirmed' && 'Confirmed Records'}
                {activeTab === 'other' && 'Other Records'}
              </h2>
          
          <form onSubmit={handleSearch} style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <input
                type="text"
                placeholder="Search by phone or name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="form-control"
                style={{ flex: 1 }}
              />
              <button type="submit" className="btn btn-primary">Search</button>
            </div>
          </form>

          <table className="table">
            <thead>
              <tr>
                <th>Phone Number</th>
                <th>Name</th>
                <th>Response</th>
                <th>Notes</th>
                <th>Visit Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {records.map(record => (
                editingRecord === record.id ? (
                  <EditForm
                    key={record.id}
                    record={record}
                    onSave={handleUpdateRecord}
                    onCancel={() => setEditingRecord(null)}
                  />
                ) : (
                  <tr key={record.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span>{record.phone_number}</span>
                        <button
                          onClick={() => handleWhatsAppClick(record.phone_number, record.name)}
                          title="Open WhatsApp chat"
                          style={{
                            background: '#25D366',
                            border: 'none',
                            borderRadius: '50%',
                            width: '32px',
                            height: '32px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '18px',
                            padding: '0',
                            transition: 'transform 0.2s'
                          }}
                          onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                          onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        >
                          💬
                        </button>
                      </div>
                    </td>
                    <td>{record.name || '-'}</td>
                    <td>{record.response || '-'}</td>
                    <td>{record.notes || '-'}</td>
                    <td>
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '12px',
                        background: record.visit === 'confirmed' ? '#d4edda' : 
                                   record.visit === 'declined' ? '#f8d7da' : 
                                   record.visit === 'visited' ? '#e1f5fe' : '#fff3cd',
                        color: record.visit === 'confirmed' ? '#155724' : 
                               record.visit === 'declined' ? '#721c24' : 
                               record.visit === 'visited' ? '#01579b' : '#856404'
                      }}>
                        {record.visit}
                      </span>
                    </td>
                    <td>
                      {activeTab === 'visited' ? (
                        // Visited tab - only alarm button (read-only)
                        <button 
                          onClick={() => handleSetReminder(record)}
                          className="btn btn-warning"
                          title="Set reminder for this student"
                          style={{ fontSize: '18px', padding: '0.25rem 0.75rem' }}
                        >
                          {record.has_alarm ? '⏰✓' : '⏰'}
                        </button>
                      ) : (
                        // Other tabs - full access
                        <>
                          <button 
                            onClick={() => setEditingRecord(record.id)}
                            className="btn btn-primary"
                            style={{ marginRight: '0.5rem' }}
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => handleSetReminder(record)}
                            className="btn btn-warning"
                            title="Set reminder for this student"
                            style={{ fontSize: '18px', padding: '0.25rem 0.75rem', marginRight: '0.5rem' }}
                          >
                            {record.has_alarm ? '⏰✓' : '⏰'}
                          </button>
                          <button 
                            onClick={() => handleDeleteRecord(record.id)}
                            className="btn btn-danger"
                            title="Delete this record"
                            style={{ fontSize: '14px', padding: '0.25rem 0.75rem' }}
                          >
                            🗑️
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                )
              ))}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem' }}>
              <button 
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="btn btn-secondary"
              >
                Previous
              </button>
              <span style={{ padding: '0.5rem 1rem' }}>
                Page {currentPage} of {totalPages}
              </span>
              <button 
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="btn btn-secondary"
              >
                Next
              </button>
            </div>
          )}
            </>
          )}
        </div>

        <VisitNotifications user={user} />
      </main>

      {/* Reminder Modal */}
      {reminderModalRecord && (
        <ReminderModal
          record={reminderModalRecord}
          onClose={() => setReminderModalRecord(null)}
          onSuccess={() => {
            fetchRecords();
            checkReminders();
          }}
        />
      )}

      {/* Alarm Popup - Show first alarm in queue */}
      {showAlarmPopup && reminderQueue.length > 0 && (
        <>
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            zIndex: 9999
          }} />
          <ReminderAlarmPopup
            queueItem={reminderQueue[0]}
            onDismiss={handleDismissAlarm}
          />
        </>
      )}
    </div>
  );
};

export default CallerDashboard;