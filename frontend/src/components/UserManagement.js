import React, { useState, useEffect } from 'react';
import api from '../utils/api';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showRoleForm, setShowRoleForm] = useState(false);
  const [roles, setRoles] = useState(['admin', 'caller']);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data.users);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching users:', error);
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await api.get('/admin/roles');
      setRoles(response.data.roles);
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
  };

  const CreateUserForm = () => {
    const [formData, setFormData] = useState({
      name: '',
      username: '',
      password: '',
      role: 'caller'
    });
    const [showInlineRoleForm, setShowInlineRoleForm] = useState(false);
    const [newRoleName, setNewRoleName] = useState('');

    const handleSubmit = async (e) => {
      e.preventDefault();
      setError('');
      setSuccess('');

      console.log('Creating user with data:', formData);

      try {
        const response = await api.post('/users', formData);
        console.log('User creation response:', response.data);

        setSuccess('User created successfully!');
        setShowCreateForm(false);
        fetchUsers();
        setFormData({ name: '', username: '', password: '', role: 'caller' });
      } catch (error) {
        console.error('User creation error:', error);
        console.error('Error response:', error.response);
        setError(error.response?.data?.message || error.message || 'Error creating user');
      }
    };

    const handleAddRole = async () => {
      if (!newRoleName.trim()) return;
      
      try {
        await api.post('/admin/roles', { role_name: newRoleName.trim().toLowerCase() });
        
        // Add to roles list and select it
        const newRole = newRoleName.trim().toLowerCase();
        setRoles([...roles, newRole]);
        setFormData({...formData, role: newRole});
        
        // Close form
        setShowInlineRoleForm(false);
        setNewRoleName('');
        setSuccess(`Role "${newRole}" created and selected!`);
      } catch (error) {
        setError(error.response?.data?.message || 'Error creating role');
      }
    };

    return (
      <div className="card">
        <h3>Create New User</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="form-control"
              required
            />
          </div>

          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({...formData, username: e.target.value})}
              className="form-control"
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              className="form-control"
              required
              minLength="6"
            />
          </div>

          <div className="form-group">
            <label>Role</label>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'end' }}>
              <select
                value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value})}
                className="form-control"
                style={{ flex: 1 }}
                required
              >
                {roles.map(role => (
                  <option key={role} value={role}>
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setShowInlineRoleForm(true)}
                className="btn btn-success"
                style={{ padding: '0.5rem', minWidth: 'auto' }}
              >
                ➕
              </button>
            </div>
            
            {showInlineRoleForm && (
              <div style={{ 
                marginTop: '0.5rem', 
                padding: '1rem', 
                background: '#f8f9fa', 
                borderRadius: '4px',
                border: '1px solid #dee2e6'
              }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'end' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '12px', marginBottom: '0.25rem' }}>New Role Name</label>
                    <input
                      type="text"
                      value={newRoleName}
                      onChange={(e) => setNewRoleName(e.target.value)}
                      className="form-control"
                      placeholder="e.g., developer, marketer"
                      style={{ fontSize: '14px' }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddRole}
                    className="btn btn-primary"
                    style={{ fontSize: '12px', padding: '0.5rem 0.75rem' }}
                  >
                    Add & Select
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowInlineRoleForm(false);
                      setNewRoleName('');
                    }}
                    className="btn btn-secondary"
                    style={{ fontSize: '12px', padding: '0.5rem 0.75rem' }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button type="submit" className="btn btn-primary">Create User</button>
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

  const CreateRoleForm = () => {
    const [roleName, setRoleName] = useState('');

    const handleSubmit = async (e) => {
      e.preventDefault();
      setError('');
      setSuccess('');

      try {
        await api.post('/admin/roles', { role_name: roleName });
        setSuccess(`Role "${roleName}" created successfully!`);
        setShowRoleForm(false);
        fetchRoles();
        setRoleName('');
      } catch (error) {
        setError(error.response?.data?.message || 'Error creating role');
      }
    };

    return (
      <div className="card">
        <h3>➕ Add New Role</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Role Name</label>
            <input
              type="text"
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
              className="form-control"
              placeholder="e.g., developer, marketer, designer"
              required
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button type="submit" className="btn btn-primary">Create Role</button>
            <button 
              type="button" 
              onClick={() => setShowRoleForm(false)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  };

  if (loading) {
    return <div className="loading">Loading users...</div>;
  }

  return (
    <div>
      {error && (
        <div style={{ 
          color: '#e74c3c', 
          marginBottom: '1rem', 
          padding: '0.5rem',
          background: '#fadbd8',
          borderRadius: '4px'
        }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{ 
          color: '#27ae60', 
          marginBottom: '1rem', 
          padding: '0.5rem',
          background: '#d5f4e6',
          borderRadius: '4px'
        }}>
          {success}
        </div>
      )}

      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
          {!showCreateForm && !showRoleForm && (
            <button 
              onClick={() => setShowCreateForm(true)}
              className="btn btn-primary"
            >
              👤 Create New User
            </button>
          )}
        </div>

        {showCreateForm && <CreateUserForm />}
      </div>

      <div className="card">
        <h2>User Management</h2>
        
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-number">{users.length}</div>
            <div className="stat-label">Total Users</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{users.filter(u => u.role === 'admin').length}</div>
            <div className="stat-label">Admins</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{users.filter(u => u.role === 'caller').length}</div>
            <div className="stat-label">Callers</div>
          </div>
        </div>

        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Username</th>
              <th>Role</th>
              <th>Created At</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.name}</td>
                <td>{user.username}</td>
                <td>
                  <span style={{
                    padding: '0.25rem 0.5rem',
                    borderRadius: '4px',
                    fontSize: '12px',
                    background: user.role === 'admin' ? '#e8f4fd' : '#f0f8ff',
                    color: user.role === 'admin' ? '#1f4e79' : '#2c5aa0'
                  }}>
                    {user.role}
                  </span>
                </td>
                <td>{new Date(user.created_at).toLocaleDateString()}</td>
                <td>
                  <span style={{
                    padding: '0.25rem 0.5rem',
                    borderRadius: '4px',
                    fontSize: '12px',
                    background: '#d4edda',
                    color: '#155724'
                  }}>
                    Active
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {users.length === 0 && (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#7f8c8d' }}>
            No users found
          </div>
        )}
      </div>

      <div className="card">
        <h3>User Guidelines</h3>
        <ul style={{ paddingLeft: '1.5rem' }}>
          <li><strong>Admin users</strong> can access all features including user management, CSV upload, progress tracking, and reports</li>
          <li><strong>Caller users</strong> can only see their assigned records and update call information</li>
          <li>Usernames must be unique across the system</li>
          <li>Passwords should be at least 6 characters long</li>
          <li>New callers will automatically receive assigned records when CSV files are uploaded</li>
        </ul>
      </div>
    </div>
  );
};

export default UserManagement;