import React, { useEffect, useRef, useState } from 'react';
import api from '../utils/api';

const ReminderAlarmPopup = ({ queueItem, onDismiss }) => {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    // Create alarm sound using Web Audio API
    const playAlarmSound = () => {
      try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        let isPlaying = true;
        
        const playBeep = () => {
          if (!isPlaying) return;
          
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          oscillator.frequency.value = 800; // Frequency in Hz
          oscillator.type = 'sine';
          
          gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
          
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.5);
          
          // Repeat beep every 1 second
          setTimeout(() => {
            if (isPlaying) playBeep();
          }, 1000);
        };
        
        playBeep();
        setIsPlaying(true);
        
        // Store cleanup function
        audioRef.current = {
          stop: () => {
            isPlaying = false;
            audioContext.close();
          }
        };
      } catch (err) {
        console.error('Error playing alarm:', err);
      }
    };
    
    playAlarmSound();
    
    return () => {
      if (audioRef.current && audioRef.current.stop) {
        audioRef.current.stop();
      }
    };
  }, []);

  const handleStopAlarm = async () => {
    // Stop audio
    if (audioRef.current && audioRef.current.stop) {
      audioRef.current.stop();
      setIsPlaying(false);
    }

    // Dismiss from queue
    try {
      await api.post(`/caller/reminder-queue/${queueItem.queue_id}/dismiss`);
      onDismiss(queueItem.queue_id);
    } catch (error) {
      console.error('Error dismissing reminder:', error);
    }
  };

  const getTriggerMessage = () => {
    if (queueItem.trigger_type === '17h_before') {
      return '⏰ Reminder: Student visit scheduled in 17 hours!';
    } else {
      return '🔔 ALERT: Student visit scheduled NOW!';
    }
  };

  const formatDateTime = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      backgroundColor: 'white',
      padding: '2rem',
      borderRadius: '12px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      zIndex: 10000,
      minWidth: '400px',
      maxWidth: '600px',
      border: '3px solid #ff5722',
      animation: 'pulse 1s infinite'
    }}>
      <style>
        {`
          @keyframes pulse {
            0%, 100% { transform: translate(-50%, -50%) scale(1); }
            50% { transform: translate(-50%, -50%) scale(1.02); }
          }
        `}
      </style>

      <div style={{
        textAlign: 'center',
        marginBottom: '1.5rem',
        fontSize: '24px',
        fontWeight: 'bold',
        color: '#ff5722'
      }}>
        {getTriggerMessage()}
      </div>

      <div style={{
        backgroundColor: '#fff3e0',
        padding: '1.5rem',
        borderRadius: '8px',
        marginBottom: '1.5rem'
      }}>
        <h3 style={{ marginTop: 0, color: '#e65100' }}>Student Details</h3>
        
        <div style={{ marginBottom: '0.75rem' }}>
          <strong>Name:</strong> {queueItem.record.name || 'Not provided'}
        </div>
        
        <div style={{ marginBottom: '0.75rem' }}>
          <strong>Phone Number:</strong> {queueItem.record.phone_number}
        </div>
        
        <div style={{ marginBottom: '0.75rem' }}>
          <strong>Response:</strong> {queueItem.record.response || 'No response'}
        </div>
        
        <div style={{ marginBottom: '0.75rem' }}>
          <strong>Notes:</strong> {queueItem.record.notes || 'No notes'}
        </div>
        
        <div style={{ marginBottom: '0.75rem' }}>
          <strong>Visit Status:</strong>{' '}
          <span style={{
            padding: '0.25rem 0.5rem',
            borderRadius: '4px',
            fontSize: '12px',
            background: queueItem.record.visit === 'confirmed' ? '#d4edda' : 
                       queueItem.record.visit === 'declined' ? '#f8d7da' : 
                       queueItem.record.visit === 'visited' ? '#e1f5fe' : '#fff3cd',
            color: queueItem.record.visit === 'confirmed' ? '#155724' : 
                   queueItem.record.visit === 'declined' ? '#721c24' : 
                   queueItem.record.visit === 'visited' ? '#01579b' : '#856404'
          }}>
            {queueItem.record.visit}
          </span>
        </div>
        
        <div style={{ marginBottom: '0.75rem' }}>
          <strong>Scheduled Visit Time:</strong> {formatDateTime(queueItem.scheduled_datetime)}
        </div>
        
        <div>
          <strong>Last Updated:</strong> {formatDateTime(queueItem.record.updated_at)}
        </div>
      </div>

      <div style={{ textAlign: 'center' }}>
        <button
          onClick={handleStopAlarm}
          style={{
            padding: '1rem 3rem',
            fontSize: '18px',
            fontWeight: 'bold',
            backgroundColor: '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#d32f2f'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#f44336'}
        >
          🛑 STOP ALARM
        </button>
      </div>
    </div>
  );
};

export default ReminderAlarmPopup;
