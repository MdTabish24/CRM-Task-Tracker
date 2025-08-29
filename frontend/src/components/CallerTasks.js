import React, { useState, useEffect } from 'react';
import api from '../utils/api';

const CallerTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    deadline: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await api.get('/caller/tasks');
      setTasks(response.data.tasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTask.title.trim()) return;

    setLoading(true);
    try {
      await api.post('/caller/tasks', newTask);
      setNewTask({ title: '', description: '', deadline: '' });
      setShowTaskForm(false);
      fetchTasks();
    } catch (error) {
      console.error('Error creating task:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await api.patch(`/caller/tasks/${taskId}`, { 
        status: newStatus,
        progress: newStatus === 'completed' ? 100 : newStatus === 'in_progress' ? 50 : 0
      });
      fetchTasks();
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#27ae60';
      case 'in_progress': return '#f39c12';
      case 'pending': return '#95a5a6';
      default: return '#95a5a6';
    }
  };

  return (
    <div style={{ marginBottom: '20px' }}>
      {/* Task Toggle Button */}
      <div style={{ marginBottom: '15px' }}>
        <button
          onClick={() => setShowTaskForm(!showTaskForm)}
          style={{
            backgroundColor: '#3498db',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <span style={{ fontSize: '16px' }}>
            {showTaskForm ? '−' : '+'}
          </span>
          My Tasks ({tasks.length})
        </button>
      </div>

      {/* Task Form */}
      {showTaskForm && (
        <div style={{
          backgroundColor: '#f8f9fa',
          padding: '15px',
          borderRadius: '5px',
          marginBottom: '15px',
          border: '1px solid #dee2e6'
        }}>
          <form onSubmit={handleCreateTask}>
            <div style={{ marginBottom: '10px' }}>
              <input
                type="text"
                placeholder="Task title..."
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
                required
              />
            </div>
            <div style={{ marginBottom: '10px' }}>
              <textarea
                placeholder="Description (optional)..."
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                  minHeight: '60px',
                  resize: 'vertical'
                }}
              />
            </div>
            <div style={{ marginBottom: '10px' }}>
              <input
                type="date"
                value={newTask.deadline}
                onChange={(e) => setNewTask({ ...newTask, deadline: e.target.value })}
                style={{
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="submit"
                disabled={loading}
                style={{
                  backgroundColor: '#27ae60',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                {loading ? 'Adding...' : 'Add Task'}
              </button>
              <button
                type="button"
                onClick={() => setShowTaskForm(false)}
                style={{
                  backgroundColor: '#95a5a6',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tasks List */}
      {tasks.length > 0 && (
        <div style={{
          backgroundColor: '#fff',
          border: '1px solid #dee2e6',
          borderRadius: '5px',
          maxHeight: '300px',
          overflowY: 'auto'
        }}>
          {tasks.map((task) => (
            <div
              key={task.id}
              style={{
                padding: '12px',
                borderBottom: '1px solid #eee',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{
                  fontWeight: '500',
                  fontSize: '14px',
                  marginBottom: '4px',
                  textDecoration: task.status === 'completed' ? 'line-through' : 'none'
                }}>
                  {task.title}
                </div>
                {task.description && (
                  <div style={{
                    fontSize: '12px',
                    color: '#666',
                    marginBottom: '4px'
                  }}>
                    {task.description}
                  </div>
                )}
                <div style={{ fontSize: '11px', color: '#999' }}>
                  {task.deadline && `Due: ${new Date(task.deadline).toLocaleDateString()}`}
                  {task.assigned_by_name !== task.assigned_to && ` • Assigned by: ${task.assigned_by_name}`}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <select
                  value={task.status}
                  onChange={(e) => handleStatusChange(task.id, e.target.value)}
                  style={{
                    padding: '4px 8px',
                    fontSize: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '3px',
                    backgroundColor: getStatusColor(task.status),
                    color: 'white'
                  }}
                >
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CallerTasks;