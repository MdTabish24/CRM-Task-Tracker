import React, { useState } from 'react';
import api from '../utils/api';

const ReminderModal = ({ record, onClose, onSuccess }) => {
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!scheduledDate || !scheduledTime) {
      alert('Please select both date and time');
      return;
    }

    setLoading(true);
    
    try {
      const scheduledDateTime = `${scheduledDate}T${scheduledTime}:00`;
      
      await api.post('/caller/reminders', {
        record_id: record.id,
        scheduled_datetime: scheduledDateTime
      });
      
      alert('Reminder set successfully!');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error setting reminder:', error);
      alert('Failed to set reminder');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '8px',
        maxWidth: '500px',
        width: '90%'
      }}>
        <h2 style={{ marginTop: 0 }}>Set Reminder</h2>
        
        <div style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
          <strong>Record:</strong> {record.name || 'No name'}<br />
          <strong>Phone:</strong> {record.phone_number}
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              When is the student planning to visit?
            </label>
            
            <div style={{ marginBottom: '0.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.25rem' }}>Date:</label>
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="form-control"
                required
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem' }}>Time:</label>
              <input
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="form-control"
                required
              />
            </div>
          </div>

          <div style={{ padding: '0.75rem', backgroundColor: '#e3f2fd', borderRadius: '4px', marginBottom: '1rem', fontSize: '14px' }}>
            <strong>Note:</strong> You will receive reminders:
            <ul style={{ marginBottom: 0, marginTop: '0.5rem' }}>
              <li>17 hours before the scheduled time</li>
              <li>At the exact scheduled time</li>
            </ul>
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Setting...' : 'Set Reminder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReminderModal;
