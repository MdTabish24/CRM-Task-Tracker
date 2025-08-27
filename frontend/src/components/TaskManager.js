import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';

const TaskManager = ({ user, onLogout }) => {
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  useEffect(() => {
    fetchTasks();
    if (user.role === 'admin') {
      fetchUsers();
    }
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await api.get('/tasks');

      setTasks(response.data.tasks);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');

      setUsers(response.data.users);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const CreateTaskForm = () => {
    const [formData, setFormData] = useState({
      title: '',
      description: '',
      assigned_to: '',
      deadline: ''
    });

    const handleSubmit = async (e) => {
      e.preventDefault();
      try {
        await api.post('/tasks', formData);

        setShowCreateForm(false);
        fetchTasks();
        setFormData({ title: '', description: '', assigned_to: '', deadline: '' });
      } catch (error) {
        console.error('Error creating task:', error);
      }
    };

    return (
      <div className="card">
        <h3>Create New Task</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="form-control"
              required
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="form-control"
              rows="3"
            />
          </div>

          <div className="form-group">
            <label>Assign To</label>
            <select
              value={formData.assigned_to}
              onChange={(e) => setFormData({...formData, assigned_to: e.target.value})}
              className="form-control"
              required
            >
              <option value="">Select User</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.role})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Deadline</label>
            <input
              type="datetime-local"
              value={formData.deadline}
              onChange={(e) => setFormData({...formData, deadline: e.target.value})}
              className="form-control"
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button type="submit" className="btn btn-primary">Create Task</button>
            <button 
              type="button" 
              onClick={() => setShowCreateForm(false)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  };

  const updateTask = async (taskId, updates) => {
    try {
      await api.patch(`/tasks/${taskId}`, updates);

      setTasks(tasks.map(task => 
        task.id === taskId ? { ...task, ...updates } : task
      ));
      setEditingTask(null);
    } catch (error) {
      console.error('Error updating task:', error);
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

  const isOverdue = (deadline, status) => {
    return deadline && new Date(deadline) < new Date() && status !== 'completed';
  };

  if (loading) {
    return <div className="loading">Loading tasks...</div>;
  }

  return (
    <div>
      <header className="header">
        <h1>Task Manager</h1>
        <div className="header-actions">
          <div className="user-info">
            <span>{user.name}</span>
            <Link 
              to={user.role === 'admin' ? '/admin' : '/caller'} 
              className="btn btn-secondary"
            >
              Back to Dashboard
            </Link>
            <button onClick={onLogout} className="btn btn-danger">Logout</button>
          </div>
        </div>
      </header>

      <main className="main-content">
        {user.role === 'admin' && (
          <div style={{ marginBottom: '2rem' }}>
            {!showCreateForm ? (
              <button 
                onClick={() => setShowCreateForm(true)}
                className="btn btn-primary"
              >
                Create New Task
              </button>
            ) : (
              <CreateTaskForm />
            )}
          </div>
        )}

        <div className="card">
          <h2>{user.role === 'admin' ? 'All Tasks' : 'My Tasks'}</h2>
          
          {tasks.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#7f8c8d', padding: '2rem' }}>
              No tasks found
            </p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Description</th>
                  {user.role === 'admin' && <th>Assigned To</th>}
                  <th>Deadline</th>
                  <th>Status</th>
                  <th>Progress</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map(task => {
                  const overdue = isOverdue(task.deadline, task.status);
                  
                  return (
                    <tr key={task.id} style={{ 
                      background: overdue ? '#fff5f5' : 'transparent' 
                    }}>
                      <td>
                        {task.title}
                        {overdue && (
                          <span style={{ 
                            color: '#e74c3c', 
                            fontSize: '12px', 
                            marginLeft: '0.5rem' 
                          }}>
                            (OVERDUE)
                          </span>
                        )}
                      </td>
                      <td>{task.description || '-'}</td>
                      {user.role === 'admin' && (
                        <td>
                          {users.find(u => u.id === task.assigned_to)?.name || 'Unknown'}
                        </td>
                      )}
                      <td>
                        {task.deadline ? 
                          new Date(task.deadline).toLocaleString() : 
                          'No deadline'
                        }
                      </td>
                      <td>
                        <span style={{
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '12px',
                          background: getStatusColor(overdue ? 'overdue' : task.status),
                          color: 'white'
                        }}>
                          {overdue ? 'overdue' : task.status}
                        </span>
                      </td>
                      <td>
                        <div className="progress">
                          <div 
                            className="progress-bar" 
                            style={{ width: `${task.progress}%` }}
                          >
                            {task.progress}%
                          </div>
                        </div>
                      </td>
                      <td>
                        {editingTask === task.id ? (
                          <div style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
                            <select
                              value={task.status}
                              onChange={(e) => updateTask(task.id, { status: e.target.value })}
                              className="form-control"
                              style={{ fontSize: '12px' }}
                            >
                              <option value="pending">Pending</option>
                              <option value="in_progress">In Progress</option>
                              <option value="completed">Completed</option>
                            </select>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={task.progress}
                              onChange={(e) => updateTask(task.id, { progress: parseInt(e.target.value) })}
                              className="form-control"
                              style={{ fontSize: '12px' }}
                            />
                            <button 
                              onClick={() => setEditingTask(null)}
                              className="btn btn-secondary"
                              style={{ fontSize: '12px' }}
                            >
                              Done
                            </button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => setEditingTask(task.id)}
                            className="btn btn-primary"
                            style={{ fontSize: '12px' }}
                          >
                            Update
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
};

export default TaskManager;