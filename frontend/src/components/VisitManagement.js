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
  const [otherAdmissionForm, setOtherAdmissionForm] = useState({
    discount_rate: '',
    total_fees: '',
    enrolled_course: ''
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
    setOtherAdmissionForm({ discount_rate: '', total_fees: '', enrolled_course: '' });
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
            width: '500px', maxWidth: '90vw'
          }}>
            <h3>🎓 Other Admission - {selectedRecord?.name || selectedRecord?.phone_number}</h3>
            <form onSubmit={submitOtherAdmission}>
              <div className="form-group">
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
              <div className="form-group">
                <label>Total Fees</label>
                <input
                  type="number"
                  value={otherAdmissionForm.total_fees}
                  onChange={(e) => setOtherAdmissionForm({...otherAdmissionForm, total_fees: e.target.value})}
                  className="form-control"
                  placeholder="Enter total fees..."
                  min="0"
                />
              </div>
              <div className="form-group">
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