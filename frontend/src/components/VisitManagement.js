import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import VisitedRecords from './VisitedRecords';

const VisitManagement = () => {
  const [visits, setVisits] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchFilters, setSearchFilters] = useState({
    search_name: '',
    search_phone: ''
  });
  const [showVisitedRecords, setShowVisitedRecords] = useState(false);
  const [showOtherAdmissionModal, setShowOtherAdmissionModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showAdmissionsModal, setShowAdmissionsModal] = useState(false);
  const [admissions, setAdmissions] = useState({ confirmed_admissions: [], other_admissions: [] });
  const [showPendingFeesModal, setShowPendingFeesModal] = useState(false);
  const [showPaidFeesModal, setShowPaidFeesModal] = useState(false);
  const [pendingFeesStudents, setPendingFeesStudents] = useState([]);
  const [paidFeesStudents, setPaidFeesStudents] = useState([]);
  const [pendingFeesSearch, setPendingFeesSearch] = useState('');
  const [paidFeesSearch, setPaidFeesSearch] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [otherAdmissionForm, setOtherAdmissionForm] = useState({
    discount_rate: '',
    enrolled_course: '',
    fees_paid: '',
    course_total_fees: '',
    course_start_date: '',
    course_end_date: '',
    payment_mode: ''
  });
  const [showOutsiderModal, setShowOutsiderModal] = useState(false);
  const [outsiderForm, setOutsiderForm] = useState({
    name: '',
    phone_number: '',
    enrolled_course: '',
    fees_paid: '',
    course_total_fees: '',
    discount_rate: '',
    course_start_date: '',
    course_end_date: '',
    payment_mode: '',
    source_of_reach: '',
    notes: ''
  });

  useEffect(() => {
    fetchVisits();
    fetchStats();
  }, [currentPage, searchFilters]);

  const fetchVisits = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage,
        ...searchFilters
      });
      
      const response = await api.get(`/admin/visits?${params}`);
      setVisits(response.data.records);
      setTotalPages(response.data.pages);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching visits:', error);
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/visit-stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const updateVisitStatus = async (recordId, status) => {
    try {
      await api.patch(`/visit/${recordId}`, { visit: status });
      fetchVisits();
      fetchStats();
    } catch (error) {
      console.error('Error updating visit status:', error);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchVisits();
  };

  const clearSearch = () => {
    setSearchFilters({ search_name: '', search_phone: '' });
    setCurrentPage(1);
  };

  const handleOtherAdmission = (record) => {
    setSelectedRecord(record);
    setShowOtherAdmissionModal(true);
    setOtherAdmissionForm({ 
      discount_rate: '', 
      enrolled_course: '',
      fees_paid: '',
      course_total_fees: '',
      course_start_date: '',
      course_end_date: '',
      payment_mode: ''
    });
  };

  const submitOtherAdmission = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/admin/other-admission/${selectedRecord.id}`, otherAdmissionForm);
      setShowOtherAdmissionModal(false);
      fetchVisits();
      fetchStats();
    } catch (error) {
      console.error('Error creating other admission:', error);
    }
  };

  const fetchAdmissions = async () => {
    try {
      const response = await api.get('/admin/admissions');
      setAdmissions(response.data);
    } catch (error) {
      console.error('Error fetching admissions:', error);
    }
  };

  const handleViewConfirmedAdmissions = () => {
    fetchAdmissions();
    setShowAdmissionsModal(true);
  };

  const fetchFeesData = async () => {
    try {
      const response = await api.get('/admin/other-admissions-list');
      const students = response.data.admissions;
      
      const pending = students.filter(student => 
        student.fees_paid < student.course_total_fees
      );
      const paid = students.filter(student => 
        student.fees_paid >= student.course_total_fees
      );
      
      setPendingFeesStudents(pending);
      setPaidFeesStudents(paid);
    } catch (error) {
      console.error('Error fetching fees data:', error);
    }
  };

  const deleteAdmission = async (admissionId) => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      try {
        await api.delete(`/admin/other-admission/${admissionId}`);
        fetchFeesData(); // Refresh data
      } catch (error) {
        console.error('Error deleting admission:', error);
      }
    }
  };

  const editAdmission = (student) => {
    setEditingStudent(student);
    setEditForm({
      discount_rate: student.discount_rate || '',
      enrolled_course: student.enrolled_course || '',
      fees_paid: student.fees_paid || '',
      course_total_fees: student.course_total_fees || '',
      course_start_date: student.course_start_date ? student.course_start_date.slice(0, 16) : '',
      course_end_date: student.course_end_date ? student.course_end_date.slice(0, 16) : '',
      payment_mode: student.payment_mode || ''
    });
    setShowEditModal(true);
  };

  const updateAdmission = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/admin/other-admission/${editingStudent.id}`, editForm);
      setShowEditModal(false);
      fetchFeesData(); // Refresh data
    } catch (error) {
      console.error('Error updating admission:', error);
    }
  };

  const filteredPendingStudents = pendingFeesStudents.filter(student =>
    student.name?.toLowerCase().includes(pendingFeesSearch.toLowerCase()) ||
    student.phone_number?.includes(pendingFeesSearch) ||
    student.enrolled_course?.toLowerCase().includes(pendingFeesSearch.toLowerCase())
  );

  const filteredPaidStudents = paidFeesStudents.filter(student =>
    student.name?.toLowerCase().includes(paidFeesSearch.toLowerCase()) ||
    student.phone_number?.includes(paidFeesSearch) ||
    student.enrolled_course?.toLowerCase().includes(paidFeesSearch.toLowerCase())
  );

  const handlePendingFeesClick = () => {
    fetchFeesData();
    setShowPendingFeesModal(true);
  };

  const handlePaidFeesClick = () => {
    fetchFeesData();
    setShowPaidFeesModal(true);
  };

  const submitOutsiderAdmission = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/outsider-admission', outsiderForm);
      setShowOutsiderModal(false);
      setOutsiderForm({
        name: '',
        phone_number: '',
        enrolled_course: '',
        fees_paid: '',
        course_total_fees: '',
        discount_rate: '',
        course_start_date: '',
        course_end_date: '',
        payment_mode: '',
        source_of_reach: '',
        notes: ''
      });
      fetchStats();
      alert('Walk-in student admission recorded successfully!');
    } catch (error) {
      console.error('Error creating outsider admission:', error);
      alert('Failed to record admission. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading visit data...</p>
      </div>
    );
  }

  return (
    <div className="visit-management">
      {/* Visit Statistics */}
      {stats && (
        <div className="stats-section">
          <div className="card gradient-card">
            <h2 className="section-title">📊 Visit & Conversion Statistics</h2>
            
            <div className="stats-grid">
              <div 
                className="stat-card visits-card clickable-card" 
                onClick={() => setShowVisitedRecords(true)}
                title="Click to view visited records"
              >
                <div className="stat-icon">🏠</div>
                <div className="stat-content">
                  <div className="stat-number">{stats.overall_stats.total_visits_done}</div>
                  <div className="stat-label">Total Visits Done</div>
                  <div className="stat-sublabel">Click to manage</div>
                </div>
              </div>
              <div 
                className="stat-card confirmed-card clickable-card"
                onClick={handleViewConfirmedAdmissions}
                title="Click to view confirmed admissions"
              >
                <div className="stat-icon">✅</div>
                <div className="stat-content">
                  <div className="stat-number">{stats.overall_stats.total_confirmed}</div>
                  <div className="stat-label">Visits Confirmed</div>
                  <div className="stat-sublabel">Click to view details</div>
                </div>
              </div>
              <div className="stat-card pending-card">
                <div className="stat-icon">⏳</div>
                <div className="stat-content">
                  <div className="stat-number">{stats.overall_stats.total_pending}</div>
                  <div className="stat-label">Pending Review</div>
                </div>
              </div>
              <div className="stat-card declined-card">
                <div className="stat-icon">❌</div>
                <div className="stat-content">
                  <div className="stat-number">{stats.overall_stats.total_declined}</div>
                  <div className="stat-label">Visits Declined</div>
                </div>
              </div>
              <div 
                className="stat-card pending-fees-card clickable-card"
                onClick={handlePendingFeesClick}
                title="Click to view pending fees students"
              >
                <div className="stat-icon">💰</div>
                <div className="stat-content">
                  <div className="stat-number">-</div>
                  <div className="stat-label">Pending Fees Students</div>
                  <div className="stat-sublabel">Click to manage</div>
                </div>
              </div>
              <div 
                className="stat-card paid-fees-card clickable-card"
                onClick={handlePaidFeesClick}
                title="Click to view fees paid students"
              >
                <div className="stat-icon">✅</div>
                <div className="stat-content">
                  <div className="stat-number">-</div>
                  <div className="stat-label">Fees Paid Students</div>
                  <div className="stat-sublabel">Click to view</div>
                </div>
              </div>
            </div>

            <div className="caller-performance">
              <h3 className="subsection-title">👥 Caller Performance</h3>
              <div className="performance-table-container">
                <table className="performance-table">
                  <thead>
                    <tr>
                      <th>Caller</th>
                      <th>Responses</th>
                      <th>Total Visits</th>
                      <th>Confirmed</th>
                      <th>Pending</th>
                      <th>Conversion Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.caller_stats.map(caller => (
                      <tr key={caller.caller_id}>
                        <td className="caller-name">{caller.caller_name}</td>
                        <td>{caller.total_responses}</td>
                        <td className="visits-done">{caller.visits_done}</td>
                        <td className="confirmed-count">{caller.visits_confirmed}</td>
                        <td className="pending-count">{caller.visits_pending}</td>
                        <td>
                          <div className="conversion-rate">
                            <div className="progress-bar-container">
                              <div 
                                className="progress-bar" 
                                style={{ 
                                  width: `${Math.min(100, caller.conversion_rate)}%`,
                                  backgroundColor: caller.conversion_rate >= 50 ? '#27ae60' : 
                                                 caller.conversion_rate >= 25 ? '#f39c12' : '#e74c3c'
                                }}
                              />
                            </div>
                            <span className="rate-text">{caller.conversion_rate}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* New Visited Button */}
            <div style={{ marginTop: '2rem', textAlign: 'center' }}>
              <button
                onClick={() => setShowOutsiderModal(true)}
                style={{
                  padding: '1rem 2rem',
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                  transition: 'all 0.3s ease',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.6)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
                }}
              >
                <span style={{ fontSize: '1.5rem' }}>➕</span>
                <span>New Visited (Walk-in Student)</span>
              </button>
              <p style={{ marginTop: '0.5rem', color: '#666', fontSize: '0.9rem' }}>
                For students who visited directly without calling
              </p>
            </div>

          </div>
        </div>
      )}

      {/* Pending Visits Management */}
      <div className="management-section">
        <div className="card">
          <div className="section-header">
            <h2 className="section-title">⏳ Pending Visits Review</h2>
            <p className="section-subtitle">People who responded and are waiting for visit confirmation</p>
          </div>
          
          {/* Search Filters */}
          <div className="search-section">
            <form onSubmit={handleSearch} className="search-form">
              <div className="search-inputs">
                <div className="search-group">
                  <label htmlFor="search_name">👤 Search by Name</label>
                  <input
                    type="text"
                    id="search_name"
                    placeholder="Enter name..."
                    value={searchFilters.search_name}
                    onChange={(e) => setSearchFilters({...searchFilters, search_name: e.target.value})}
                    className="search-input"
                  />
                </div>
                <div className="search-group">
                  <label htmlFor="search_phone">📞 Search by Phone</label>
                  <input
                    type="text"
                    id="search_phone"
                    placeholder="Enter phone number..."
                    value={searchFilters.search_phone}
                    onChange={(e) => setSearchFilters({...searchFilters, search_phone: e.target.value})}
                    className="search-input"
                  />
                </div>
              </div>
              <div className="search-actions">
                <button type="submit" className="btn btn-search">
                  🔍 Search
                </button>
                <button type="button" onClick={clearSearch} className="btn btn-clear">
                  🗑️ Clear
                </button>
              </div>
            </form>
          </div>

          {/* Visit Records */}
          <div className="records-section">
            {visits.length > 0 ? (
              <div className="records-table-container">
                <table className="records-table">
                  <thead>
                    <tr>
                      <th>📞 Phone</th>
                      <th>👤 Name</th>
                      <th>📞 Caller</th>
                      <th>💬 Response</th>
                      <th>📅 Date</th>
                      <th>⚡ Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visits.map(visit => (
                      <tr key={visit.id} className="record-row">
                        <td className="phone-cell">{visit.phone_number}</td>
                        <td className="name-cell">{visit.name || '-'}</td>
                        <td className="caller-cell">{visit.caller.name}</td>
                        <td className="response-cell">
                          <div className="response-content" title={visit.response}>
                            {visit.response}
                          </div>
                        </td>
                        <td className="date-cell">
                          {visit.updated_at ? new Date(visit.updated_at).toLocaleDateString() : '-'}
                        </td>
                        <td className="actions-cell">
                          <div className="action-buttons">
                            <button
                              onClick={() => updateVisitStatus(visit.id, 'visited')}
                              className="btn btn-visited"
                              title="Mark as Visited - Customer came to visit"
                            >
                              🏠 Visited
                            </button>
                            <button
                              onClick={() => updateVisitStatus(visit.id, 'confirmed')}
                              className="btn btn-confirmed"
                              title="Confirm Visit"
                            >
                              ✅ Confirmed
                            </button>
                            <button
                              onClick={() => updateVisitStatus(visit.id, 'declined')}
                              className="btn btn-declined"
                              title="Decline Visit"
                            >
                              ❌ Declined
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="no-records">
                <div className="no-records-icon">📭</div>
                <h3>No Pending Visits</h3>
                <p>All visits have been processed or no responses yet.</p>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination">
                <button 
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="btn btn-pagination"
                >
                  ← Previous
                </button>
                <span className="pagination-info">
                  Page {currentPage} of {totalPages}
                </span>
                <button 
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="btn btn-pagination"
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {showVisitedRecords && (
        <VisitedRecords 
          onClose={() => setShowVisitedRecords(false)} 
          onAdmissionCreated={() => {
            fetchStats();
            fetchAdmissions();
          }}
        />
      )}

      {/* Other Admission Modal */}
      {showOtherAdmissionModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white', padding: '2rem', borderRadius: '8px',
            width: '700px', maxWidth: '90vw', maxHeight: '90vh', overflowY: 'auto'
          }}>
            <h3>🎓 Other Admission - {selectedRecord?.name || selectedRecord?.phone_number}</h3>
            <form onSubmit={submitOtherAdmission}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label>Discount Rate (%)</label>
                <input
                  type="number"
                  value={otherAdmissionForm.discount_rate}
                  onChange={(e) => setOtherAdmissionForm({...otherAdmissionForm, discount_rate: e.target.value})}
                  className="form-control"
                  placeholder="Enter discount percentage..."
                  min="0" max="100"
                />
              </div>
              
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label>Enrolled Course</label>
                <input
                  type="text"
                  value={otherAdmissionForm.enrolled_course}
                  onChange={(e) => setOtherAdmissionForm({...otherAdmissionForm, enrolled_course: e.target.value})}
                  className="form-control"
                  placeholder="Enter course name..."
                  required
                />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label>Fees Paid by Student</label>
                  <input
                    type="number"
                    value={otherAdmissionForm.fees_paid}
                    onChange={(e) => setOtherAdmissionForm({...otherAdmissionForm, fees_paid: e.target.value})}
                    className="form-control"
                    placeholder="Amount paid by student..."
                    min="0"
                  />
                </div>
                <div className="form-group">
                  <label>Course Total Fees</label>
                  <input
                    type="number"
                    value={otherAdmissionForm.course_total_fees}
                    onChange={(e) => setOtherAdmissionForm({...otherAdmissionForm, course_total_fees: e.target.value})}
                    className="form-control"
                    placeholder="Total course fees..."
                    min="0"
                  />
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label>Course Start Date</label>
                  <input
                    type="datetime-local"
                    value={otherAdmissionForm.course_start_date}
                    onChange={(e) => setOtherAdmissionForm({...otherAdmissionForm, course_start_date: e.target.value})}
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label>Course End Date</label>
                  <input
                    type="datetime-local"
                    value={otherAdmissionForm.course_end_date}
                    onChange={(e) => setOtherAdmissionForm({...otherAdmissionForm, course_end_date: e.target.value})}
                    className="form-control"
                  />
                </div>
              </div>
              
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label>Payment Mode</label>
                <input
                  type="text"
                  value={otherAdmissionForm.payment_mode}
                  onChange={(e) => setOtherAdmissionForm({...otherAdmissionForm, payment_mode: e.target.value})}
                  className="form-control"
                  placeholder="e.g., Cash, Card, UPI, Bank Transfer..."
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowOtherAdmissionModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Record Admission
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admissions View Modal */}
      {showAdmissionsModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white', padding: '2rem', borderRadius: '8px',
            width: '800px', maxWidth: '95vw', maxHeight: '90vh', overflow: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3>🎓 Admissions Overview</h3>
              <button onClick={() => setShowAdmissionsModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>
                ×
              </button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              {/* Confirmed Admissions */}
              <div>
                <h4>✅ Confirmed Admissions ({admissions.confirmed_admissions.length})</h4>
                <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #ddd', borderRadius: '4px' }}>
                  {admissions.confirmed_admissions.map((admission) => (
                    <div key={admission.id} style={{ padding: '0.75rem', borderBottom: '1px solid #eee' }}>
                      <div style={{ fontWeight: '500' }}>{admission.name || admission.phone_number}</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>Caller: {admission.caller_name}</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>{new Date(admission.created_at).toLocaleDateString()}</div>
                    </div>
                  ))}
                  {admissions.confirmed_admissions.length === 0 && (
                    <div style={{ padding: '1rem', textAlign: 'center', color: '#666' }}>No confirmed admissions yet</div>
                  )}
                </div>
              </div>
              
              {/* Other Admissions */}
              <div>
                <h4>🎓 Other Admissions ({admissions.other_admissions.length})</h4>
                <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #ddd', borderRadius: '4px' }}>
                  {admissions.other_admissions.map((admission) => (
                    <div key={admission.id} style={{ padding: '0.75rem', borderBottom: '1px solid #eee' }}>
                      <div style={{ fontWeight: '500' }}>{admission.name || admission.phone_number}</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>Course: {admission.enrolled_course}</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>Fees: ₹{admission.total_fees} (Discount: {admission.discount_rate}%)</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>Caller: {admission.caller_name}</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>{new Date(admission.created_at).toLocaleDateString()}</div>
                    </div>
                  ))}
                  {admissions.other_admissions.length === 0 && (
                    <div style={{ padding: '1rem', textAlign: 'center', color: '#666' }}>No other admissions yet</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pending Fees Modal */}
      {showPendingFeesModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white', padding: '2rem', borderRadius: '8px',
            width: '600px', maxWidth: '90vw', maxHeight: '80vh', overflow: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3>💰 Pending Fees Students ({filteredPendingStudents.length})</h3>
              <button onClick={() => setShowPendingFeesModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>
                ×
              </button>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <input
                type="text"
                placeholder="Search by name, phone, or course..."
                value={pendingFeesSearch}
                onChange={(e) => setPendingFeesSearch(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px' }}
              />
            </div>
            
            {filteredPendingStudents.length > 0 ? (
              <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #ddd', borderRadius: '4px' }}>
                {filteredPendingStudents.map((student) => (
                  <div key={student.id} style={{ padding: '1rem', borderBottom: '1px solid #eee', backgroundColor: '#fff3cd' }}>
                    <div style={{ fontWeight: '500', fontSize: '16px' }}>{student.name || student.phone_number}</div>
                    <div style={{ fontSize: '14px', color: '#666', marginTop: '0.5rem' }}>Course: {student.enrolled_course}</div>
                    <div style={{ fontSize: '14px', color: '#666' }}>Phone: {student.phone_number}</div>
                    <div style={{ fontSize: '14px', color: '#d63384', fontWeight: '500', marginTop: '0.5rem' }}>
                      Paid: ₹{student.fees_paid || 0} / Total: ₹{student.course_total_fees || 0}
                    </div>
                    <div style={{ fontSize: '14px', color: '#d63384', fontWeight: '500' }}>
                      Pending: ₹{(student.course_total_fees || 0) - (student.fees_paid || 0)}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>Caller: {student.caller_name}</div>
                    <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => editAdmission(student)}
                        style={{ 
                          padding: '0.25rem 0.5rem', background: '#0d6efd', color: 'white', 
                          border: 'none', borderRadius: '4px', fontSize: '12px', cursor: 'pointer'
                        }}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => deleteAdmission(student.id)}
                        style={{ 
                          padding: '0.25rem 0.5rem', background: '#dc3545', color: 'white', 
                          border: 'none', borderRadius: '4px', fontSize: '12px', cursor: 'pointer'
                        }}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
                <h4>No Pending Fees!</h4>
                <p>All students have paid their fees completely.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Paid Fees Modal */}
      {showPaidFeesModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white', padding: '2rem', borderRadius: '8px',
            width: '600px', maxWidth: '90vw', maxHeight: '80vh', overflow: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3>✅ Fees Paid Students ({filteredPaidStudents.length})</h3>
              <button onClick={() => setShowPaidFeesModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>
                ×
              </button>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <input
                type="text"
                placeholder="Search by name, phone, or course..."
                value={paidFeesSearch}
                onChange={(e) => setPaidFeesSearch(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px' }}
              />
            </div>
            
            {filteredPaidStudents.length > 0 ? (
              <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #ddd', borderRadius: '4px' }}>
                {filteredPaidStudents.map((student) => (
                  <div key={student.id} style={{ padding: '1rem', borderBottom: '1px solid #eee', backgroundColor: '#d1edff' }}>
                    <div style={{ fontWeight: '500', fontSize: '16px' }}>{student.name || student.phone_number}</div>
                    <div style={{ fontSize: '14px', color: '#666', marginTop: '0.5rem' }}>Course: {student.enrolled_course}</div>
                    <div style={{ fontSize: '14px', color: '#666' }}>Phone: {student.phone_number}</div>
                    <div style={{ fontSize: '14px', color: '#198754', fontWeight: '500', marginTop: '0.5rem' }}>
                      ✅ Paid: ₹{student.fees_paid || 0} / Total: ₹{student.course_total_fees || 0}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>Caller: {student.caller_name}</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>Payment: {student.payment_mode}</div>
                    <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => editAdmission(student)}
                        style={{ 
                          padding: '0.25rem 0.5rem', background: '#0d6efd', color: 'white', 
                          border: 'none', borderRadius: '4px', fontSize: '12px', cursor: 'pointer'
                        }}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => deleteAdmission(student.id)}
                        style={{ 
                          padding: '0.25rem 0.5rem', background: '#dc3545', color: 'white', 
                          border: 'none', borderRadius: '4px', fontSize: '12px', cursor: 'pointer'
                        }}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💰</div>
                <h4>No Paid Students Yet</h4>
                <p>No students have completed their fee payments.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Outsider/Walk-in Student Modal */}
      {showOutsiderModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1001,
          overflowY: 'auto', padding: '2rem 0'
        }}>
          <div style={{
            backgroundColor: 'white', padding: '2rem', borderRadius: '12px',
            width: '800px', maxWidth: '90vw', maxHeight: '90vh', overflowY: 'auto',
            boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.5rem', color: '#333' }}>
                🚶 New Walk-in Student Admission
              </h3>
              <button 
                onClick={() => setShowOutsiderModal(false)} 
                style={{ 
                  background: 'none', border: 'none', fontSize: '2rem', 
                  cursor: 'pointer', color: '#999', lineHeight: 1 
                }}
              >
                ×
              </button>
            </div>
            
            <p style={{ color: '#666', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
              Record admission for students who visited directly without prior calling
            </p>

            <form onSubmit={submitOutsiderAdmission}>
              {/* Student Basic Info */}
              <div style={{ 
                background: '#f8f9fa', 
                padding: '1.5rem', 
                borderRadius: '8px', 
                marginBottom: '1.5rem',
                border: '1px solid #e9ecef'
              }}>
                <h4 style={{ marginTop: 0, marginBottom: '1rem', color: '#495057' }}>
                  👤 Student Information
                </h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                      Name <span style={{ color: 'red' }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={outsiderForm.name}
                      onChange={(e) => setOutsiderForm({...outsiderForm, name: e.target.value})}
                      className="form-control"
                      placeholder="Enter student name..."
                      required
                      style={{ width: '100%', padding: '0.75rem', border: '1px solid #ced4da', borderRadius: '6px' }}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                      Phone Number <span style={{ color: 'red' }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={outsiderForm.phone_number}
                      onChange={(e) => setOutsiderForm({...outsiderForm, phone_number: e.target.value})}
                      className="form-control"
                      placeholder="Enter phone number..."
                      required
                      style={{ width: '100%', padding: '0.75rem', border: '1px solid #ced4da', borderRadius: '6px' }}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    📍 Source of Reach <span style={{ color: 'red' }}>*</span>
                  </label>
                  <select
                    value={outsiderForm.source_of_reach}
                    onChange={(e) => setOutsiderForm({...outsiderForm, source_of_reach: e.target.value})}
                    className="form-control"
                    required
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #ced4da', borderRadius: '6px' }}
                  >
                    <option value="">-- How did they find us? --</option>
                    <option value="Walk-in">🚶 Walk-in (Direct Visit)</option>
                    <option value="Google Search">🔍 Google Search</option>
                    <option value="Facebook">📘 Facebook</option>
                    <option value="Instagram">📸 Instagram</option>
                    <option value="WhatsApp">💬 WhatsApp</option>
                    <option value="Friend Referral">👥 Friend Referral</option>
                    <option value="Family Referral">👨‍👩‍👧 Family Referral</option>
                    <option value="Banner/Poster">🪧 Banner/Poster</option>
                    <option value="Newspaper Ad">📰 Newspaper Ad</option>
                    <option value="Previous Student">🎓 Previous Student</option>
                    <option value="Other">📝 Other</option>
                  </select>
                </div>
              </div>

              {/* Course Details */}
              <div style={{ 
                background: '#e8f5e9', 
                padding: '1.5rem', 
                borderRadius: '8px', 
                marginBottom: '1.5rem',
                border: '1px solid #c8e6c9'
              }}>
                <h4 style={{ marginTop: 0, marginBottom: '1rem', color: '#2e7d32' }}>
                  📚 Course Details
                </h4>
                
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Enrolled Course <span style={{ color: 'red' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={outsiderForm.enrolled_course}
                    onChange={(e) => setOutsiderForm({...outsiderForm, enrolled_course: e.target.value})}
                    className="form-control"
                    placeholder="Enter course name..."
                    required
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #ced4da', borderRadius: '6px' }}
                  />
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                      Course Start Date
                    </label>
                    <input
                      type="datetime-local"
                      value={outsiderForm.course_start_date}
                      onChange={(e) => setOutsiderForm({...outsiderForm, course_start_date: e.target.value})}
                      className="form-control"
                      style={{ width: '100%', padding: '0.75rem', border: '1px solid #ced4da', borderRadius: '6px' }}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                      Course End Date
                    </label>
                    <input
                      type="datetime-local"
                      value={outsiderForm.course_end_date}
                      onChange={(e) => setOutsiderForm({...outsiderForm, course_end_date: e.target.value})}
                      className="form-control"
                      style={{ width: '100%', padding: '0.75rem', border: '1px solid #ced4da', borderRadius: '6px' }}
                    />
                  </div>
                </div>
              </div>

              {/* Payment Details */}
              <div style={{ 
                background: '#fff3e0', 
                padding: '1.5rem', 
                borderRadius: '8px', 
                marginBottom: '1.5rem',
                border: '1px solid #ffe0b2'
              }}>
                <h4 style={{ marginTop: 0, marginBottom: '1rem', color: '#e65100' }}>
                  💰 Payment Details
                </h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                      Course Total Fees
                    </label>
                    <input
                      type="number"
                      value={outsiderForm.course_total_fees}
                      onChange={(e) => setOutsiderForm({...outsiderForm, course_total_fees: e.target.value})}
                      className="form-control"
                      placeholder="Total fees..."
                      min="0"
                      style={{ width: '100%', padding: '0.75rem', border: '1px solid #ced4da', borderRadius: '6px' }}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                      Discount Rate (%)
                    </label>
                    <input
                      type="number"
                      value={outsiderForm.discount_rate}
                      onChange={(e) => setOutsiderForm({...outsiderForm, discount_rate: e.target.value})}
                      className="form-control"
                      placeholder="Discount %..."
                      min="0"
                      max="100"
                      style={{ width: '100%', padding: '0.75rem', border: '1px solid #ced4da', borderRadius: '6px' }}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                      Fees Paid
                    </label>
                    <input
                      type="number"
                      value={outsiderForm.fees_paid}
                      onChange={(e) => setOutsiderForm({...outsiderForm, fees_paid: e.target.value})}
                      className="form-control"
                      placeholder="Amount paid..."
                      min="0"
                      style={{ width: '100%', padding: '0.75rem', border: '1px solid #ced4da', borderRadius: '6px' }}
                    />
                  </div>
                </div>
                
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Payment Mode
                  </label>
                  <select
                    value={outsiderForm.payment_mode}
                    onChange={(e) => setOutsiderForm({...outsiderForm, payment_mode: e.target.value})}
                    className="form-control"
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #ced4da', borderRadius: '6px' }}
                  >
                    <option value="">-- Select Payment Mode --</option>
                    <option value="Cash">💵 Cash</option>
                    <option value="Card">💳 Card</option>
                    <option value="UPI">📱 UPI</option>
                    <option value="Bank Transfer">🏦 Bank Transfer</option>
                    <option value="Cheque">📝 Cheque</option>
                    <option value="Other">📋 Other</option>
                  </select>
                </div>
              </div>

              {/* Additional Notes */}
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  📝 Additional Notes
                </label>
                <textarea
                  value={outsiderForm.notes}
                  onChange={(e) => setOutsiderForm({...outsiderForm, notes: e.target.value})}
                  className="form-control"
                  placeholder="Any additional information..."
                  rows="3"
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid #ced4da', borderRadius: '6px', resize: 'vertical' }}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', paddingTop: '1rem', borderTop: '2px solid #e9ecef' }}>
                <button 
                  type="button" 
                  onClick={() => setShowOutsiderModal(false)} 
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '500',
                    fontSize: '1rem'
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  style={{
                    padding: '0.75rem 2rem',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '1rem',
                    boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)'
                  }}
                >
                  ✅ Record Admission
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1001
        }}>
          <div style={{
            backgroundColor: 'white', padding: '2rem', borderRadius: '8px',
            width: '700px', maxWidth: '90vw', maxHeight: '90vh', overflowY: 'auto'
          }}>
            <h3>✏️ Edit Record - {editingStudent?.name || editingStudent?.phone_number}</h3>
            <form onSubmit={updateAdmission}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label>Discount Rate (%)</label>
                <input
                  type="number"
                  value={editForm.discount_rate}
                  onChange={(e) => setEditForm({...editForm, discount_rate: e.target.value})}
                  className="form-control"
                  placeholder="Enter discount percentage..."
                  min="0" max="100"
                />
              </div>
              
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label>Enrolled Course</label>
                <input
                  type="text"
                  value={editForm.enrolled_course}
                  onChange={(e) => setEditForm({...editForm, enrolled_course: e.target.value})}
                  className="form-control"
                  placeholder="Enter course name..."
                  required
                />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label>Fees Paid by Student</label>
                  <input
                    type="number"
                    value={editForm.fees_paid}
                    onChange={(e) => setEditForm({...editForm, fees_paid: e.target.value})}
                    className="form-control"
                    placeholder="Amount paid by student..."
                    min="0"
                  />
                </div>
                <div className="form-group">
                  <label>Course Total Fees</label>
                  <input
                    type="number"
                    value={editForm.course_total_fees}
                    onChange={(e) => setEditForm({...editForm, course_total_fees: e.target.value})}
                    className="form-control"
                    placeholder="Total course fees..."
                    min="0"
                  />
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label>Course Start Date</label>
                  <input
                    type="datetime-local"
                    value={editForm.course_start_date}
                    onChange={(e) => setEditForm({...editForm, course_start_date: e.target.value})}
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label>Course End Date</label>
                  <input
                    type="datetime-local"
                    value={editForm.course_end_date}
                    onChange={(e) => setEditForm({...editForm, course_end_date: e.target.value})}
                    className="form-control"
                  />
                </div>
              </div>
              
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label>Payment Mode</label>
                <input
                  type="text"
                  value={editForm.payment_mode}
                  onChange={(e) => setEditForm({...editForm, payment_mode: e.target.value})}
                  className="form-control"
                  placeholder="e.g., Cash, Card, UPI, Bank Transfer..."
                />
              </div>
              
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowEditModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Update Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .visit-management {
          padding: 0;
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4rem;
          color: #666;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #3498db;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 1rem;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .gradient-card {
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          color: #333;
          border: 1px solid #dee2e6;
        }

        .section-title {
          margin-bottom: 1.5rem;
          font-size: 1.5rem;
          font-weight: 600;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .stat-card {
          background: white;
          border: 1px solid #e1e5e9;
          border-radius: 12px;
          padding: 1.5rem;
          display: flex;
          align-items: center;
          gap: 1rem;
          transition: transform 0.2s ease;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .pending-fees-card {
          border-left: 4px solid #ffc107;
        }

        .paid-fees-card {
          border-left: 4px solid #198754;
        }

        .stat-card:hover {
          transform: translateY(-2px);
        }

        .clickable-card {
          cursor: pointer;
          position: relative;
        }

        .clickable-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }

        .stat-sublabel {
          font-size: 0.75rem;
          color: #666;
          margin-top: 0.25rem;
          font-style: italic;
        }

        .stat-icon {
          font-size: 2rem;
        }

        .stat-number {
          font-size: 2rem;
          font-weight: bold;
          margin-bottom: 0.25rem;
        }

        .stat-label {
          font-size: 0.9rem;
          opacity: 0.9;
        }

        .caller-performance {
          background: white;
          border: 1px solid #e1e5e9;
          border-radius: 12px;
          padding: 1.5rem;
          margin-top: 2rem;
        }

        .subsection-title {
          margin-bottom: 1rem;
          font-size: 1.2rem;
        }

        .performance-table-container {
          overflow-x: auto;
        }

        .performance-table {
          width: 100%;
          border-collapse: collapse;
        }

        .performance-table th,
        .performance-table td {
          padding: 0.75rem;
          text-align: left;
          border-bottom: 1px solid #e1e5e9;
        }

        .performance-table th {
          font-weight: 600;
          background: #f8f9fa;
          color: #333;
        }

        .conversion-rate {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .progress-bar-container {
          flex: 1;
          height: 8px;
          background: #e9ecef;
          border-radius: 4px;
          overflow: hidden;
        }

        .progress-bar {
          height: 100%;
          border-radius: 4px;
          transition: width 0.3s ease;
        }

        .rate-text {
          font-size: 0.9rem;
          font-weight: 600;
        }

        .management-section {
          margin-top: 2rem;
        }

        .section-header {
          margin-bottom: 2rem;
        }

        .section-subtitle {
          color: #666;
          margin-top: 0.5rem;
        }

        .search-section {
          background: #f8f9fa;
          border-radius: 12px;
          padding: 1.5rem;
          margin-bottom: 2rem;
        }

        .search-form {
          display: flex;
          gap: 1rem;
          align-items: end;
          flex-wrap: wrap;
        }

        .search-inputs {
          display: flex;
          gap: 1rem;
          flex: 1;
          flex-wrap: wrap;
        }

        .search-group {
          flex: 1;
          min-width: 200px;
        }

        .search-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
          color: #333;
        }

        .search-input {
          width: 100%;
          padding: 0.75rem;
          border: 2px solid #e1e5e9;
          border-radius: 8px;
          font-size: 14px;
          transition: border-color 0.2s ease;
        }

        .search-input:focus {
          outline: none;
          border-color: #3498db;
        }

        .search-actions {
          display: flex;
          gap: 0.5rem;
        }

        .btn {
          padding: 0.75rem 1rem;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
        }

        .btn-search {
          background: #3498db;
          color: white;
        }

        .btn-search:hover {
          background: #2980b9;
        }

        .btn-clear {
          background: #95a5a6;
          color: white;
        }

        .btn-clear:hover {
          background: #7f8c8d;
        }

        .records-table-container {
          overflow-x: auto;
          border-radius: 12px;
          border: 1px solid #e1e5e9;
        }

        .records-table {
          width: 100%;
          border-collapse: collapse;
          background: white;
        }

        .records-table th {
          background: #f8f9fa;
          padding: 1rem;
          text-align: left;
          font-weight: 600;
          border-bottom: 2px solid #e1e5e9;
        }

        .records-table td {
          padding: 1rem;
          border-bottom: 1px solid #f1f3f4;
        }

        .record-row:hover {
          background: #f8f9fa;
        }

        .response-content {
          max-width: 200px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .action-buttons {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .btn-visited {
          background: #9b59b6;
          color: white;
          padding: 0.5rem 0.75rem;
          font-size: 12px;
        }

        .btn-visited:hover {
          background: #8e44ad;
        }

        .btn-confirmed {
          background: #27ae60;
          color: white;
          padding: 0.5rem 0.75rem;
          font-size: 12px;
        }

        .btn-confirmed:hover {
          background: #229954;
        }

        .btn-declined {
          background: #e74c3c;
          color: white;
          padding: 0.5rem 0.75rem;
          font-size: 12px;
        }

        .btn-declined:hover {
          background: #c0392b;
        }

        .btn-other-admission {
          background: #f39c12;
          color: white;
          padding: 0.5rem 0.75rem;
          font-size: 12px;
        }

        .btn-other-admission:hover {
          background: #e67e22;
        }

        .no-records {
          text-align: center;
          padding: 4rem 2rem;
          color: #666;
        }

        .no-records-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
        }

        .no-records h3 {
          margin-bottom: 0.5rem;
          color: #333;
        }

        .pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 1rem;
          margin-top: 2rem;
          padding: 1rem;
        }

        .btn-pagination {
          background: #3498db;
          color: white;
        }

        .btn-pagination:hover:not(:disabled) {
          background: #2980b9;
        }

        .btn-pagination:disabled {
          background: #bdc3c7;
          cursor: not-allowed;
        }

        .pagination-info {
          font-weight: 500;
          color: #666;
        }

        @media (max-width: 768px) {
          .search-form {
            flex-direction: column;
            align-items: stretch;
          }

          .search-inputs {
            flex-direction: column;
          }

          .search-actions {
            justify-content: center;
          }

          .action-buttons {
            flex-direction: column;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default VisitManagement;