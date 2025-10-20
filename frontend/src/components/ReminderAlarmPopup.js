import React, { useEffect, useRef, useState } from 'react';
import api from '../utils/api';

const ReminderAlarmPopup = ({ queueItem, onDismiss }) => {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    // Create LOUD alarm sound using Web Audio API
    const playAlarmSound = () => {
      try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        let isPlaying = true;
        
        const playBeep = () => {
          if (!isPlaying) return;
          
          // Create two oscillators for richer, louder sound
          const oscillator1 = audioContext.createOscillator();
          const oscillator2 = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator1.connect(gainNode);
          oscillator2.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          // Two frequencies for louder, more attention-grabbing sound
          oscillator1.frequency.value = 800; // Main frequency
          oscillator2.frequency.value = 1000; // Harmonic frequency
          oscillator1.type = 'square'; // Square wave is louder than sine
          oscillator2.type = 'square';
          
          // Much louder volume (0.7 instead of 0.3)
          gainNode.gain.setValueAtTime(0.7, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
          
          oscillator1.start(audioContext.currentTime);
          oscillator2.start(audioContext.currentTime);
          oscillator1.stop(audioContext.currentTime + 0.4);
          oscillator2.stop(audioContext.currentTime + 0.4);
          
          // Faster beeps - every 0.6 seconds for more urgency
          setTimeout(() => {
            if (isPlaying) playBeep();
          }, 600);
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

  const handleOkButton = async () => {
    // For 17h_before, just acknowledge - don't dismiss from queue
    // Stop audio
    if (audioRef.current && audioRef.current.stop) {
      audioRef.current.stop();
      setIsPlaying(false);
    }

    // Only dismiss from queue, don't deactivate reminder
    try {
      await api.post(`/caller/reminder-queue/${queueItem.queue_id}/dismiss`);
      onDismiss(queueItem.queue_id);
    } catch (error) {
      console.error('Error dismissing reminder:', error);
    }
  };

  const handleStopAlarm = async () => {
    // For exact_time, stop alarm and remove from queue completely
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
      return '⏰ ADVANCE REMINDER: Student will visit in 17 hours!';
    } else {
      return '🔔 URGENT ALERT: Student visit scheduled NOW!';
    }
  };

  const getButtonText = () => {
    if (queueItem.trigger_type === '17h_before') {
      return '✓ OK, GOT IT';
    } else {
      return '🛑 STOP ALARM';
    }
  };

  const getButtonColor = () => {
    if (queueItem.trigger_type === '17h_before') {
      return '#4CAF50'; // Green for OK
    } else {
      return '#f44336'; // Red for Stop
    }
  };

  const getButtonHoverColor = () => {
    if (queueItem.trigger_type === '17h_before') {
      return '#45a049'; // Darker green
    } else {
      return '#d32f2f'; // Darker red
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
          onClick={queueItem.trigger_type === '17h_before' ? handleOkButton : handleStopAlarm}
          style={{
            padding: '1rem 3rem',
            fontSize: '18px',
            fontWeight: 'bold',
            backgroundColor: getButtonColor(),
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = getButtonHoverColor()}
          onMouseOut={(e) => e.target.style.backgroundColor = getButtonColor()}
        >
          {getButtonText()}
        </button>
        
        {queueItem.trigger_type === '17h_before' && (
          <div style={{
            marginTop: '1rem',
            fontSize: '14px',
            color: '#666',
            fontStyle: 'italic'
          }}>
            You will receive another alarm at the exact scheduled time
          </div>
        )}
      </div>
    </div>
  );
};

export default ReminderAlarmPopup;
