import React, { useState, useEffect } from 'react';
import api from '../utils/api';

const VisitedRecords = ({ onClose }) => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchFilters, setSearchFilters] = useState({
    search_name: '',
    search_phone: ''
  });
  const [showOtherAdmissionModal, setShowOtherAdmissionModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [otherAdmissionForm, setOtherAdmissionForm] = useState({
    discount_rate: '',
    total_fees: '',
    enrolled_course: ''
  });

  useEffect(() => {
    fetchRecords();
  }, [currentPage, searchFilters]);

  const fetchRecords = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage,
        ...searchFilters
      });
      
      const response = await api.get(`/admin/visited-records?${params}`);
      setRecords(response.data.records);
      setTotalPages(response.data.pages);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching visited records:', error);
      setLoading(false);
    }
  };

  const updateVisitStatus = async (recordId, status) => {
    try {
      await api.patch(`/visit/${recordId}`, { visit: status });
      fetchRecords(); // Refresh the list
    } catch (error) {
      console.error('Error updating visit status:', error);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchRecords();
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
      fetchRecords();
    } catch (error) {
      console.error('Error creating other admission:', error);
    }
  };

  if (loading) {
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading visited records...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content large-modal">
        <div className="modal-header">
          <h2>🏠 Visited Records Management</h2>
          <button onClick={onClose} className="close-btn">×</button>
        </div>

        <div className="modal-body">
          {/* Search Section */}
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

          {/* Records Table */}
          <div className="records-section">
            {records.length > 0 ? (
              <div className="records-table-container">
                <table className="records-table">
                  <thead>
                    <tr>
                      <th>📞 Phone</th>
                      <th>👤 Name</th>
                      <th>📞 Caller</th>
                      <th>💬 Response</th>
                      <th>📅 Visit Date</th>
                      <th>⚡ Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map(record => (
                      <tr key={record.id} className="record-row">
                        <td className="phone-cell">{record.phone_number}</td>
                        <td className="name-cell">{record.name || '-'}</td>
                        <td className="caller-cell">{record.caller.name}</td>
                        <td className="response-cell">
                          <div className="response-content" title={record.response}>
                            {record.response}
                          </div>
                        </td>
                        <td className="date-cell">
                          {record.updated_at ? new Date(record.updated_at).toLocaleDateString() : '-'}
                        </td>
                        <td className="actions-cell">
                          <div className="action-buttons">
                            <button
                              onClick={() => updateVisitStatus(record.id, 'confirmed')}
                              className="btn btn-confirmed"
                              title="Confirm Visit - Customer Converted"
                            >
                              ✅ Confirmed
                            </button>
                            <button
                              onClick={() => updateVisitStatus(record.id, 'declined')}
                              className="btn btn-declined"
                              title="Decline Visit - Customer Not Interested"
                            >
                              ❌ Declined
                            </button>
                            <button
                              onClick={() => handleOtherAdmission(record)}
                              className="btn btn-other-admission"
                              title="Other Admission"
                            >
                              🎓 Other Admission
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
                <div className="no-records-icon">🏠</div>
                <h3>No Visited Records</h3>
                <p>No customers have visited yet or all visits have been processed.</p>
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

      {/* Other Admission Modal */}
      {showOtherAdmissionModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1001
        }}>
          <div style={{
            backgroundColor: 'white', padding: '2rem', borderRadius: '8px',
            width: '500px', maxWidth: '90vw'
          }}>
            <h3>🎓 Other Admission - {selectedRecord?.name || selectedRecord?.phone_number}</h3>
            <form onSubmit={submitOtherAdmission}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Discount Rate (%)</label>
                <input
                  type="number"
                  value={otherAdmissionForm.discount_rate}
                  onChange={(e) => setOtherAdmissionForm({...otherAdmissionForm, discount_rate: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px' }}
                  placeholder="Enter discount percentage..."
                  min="0" max="100"
                />
              </div>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Total Fees</label>
                <input
                  type="number"
                  value={otherAdmissionForm.total_fees}
                  onChange={(e) => setOtherAdmissionForm({...otherAdmissionForm, total_fees: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px' }}
                  placeholder="Enter total fees..."
                  min="0"
                />
              </div>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Enrolled Course</label>
                <input
                  type="text"
                  value={otherAdmissionForm.enrolled_course}
                  onChange={(e) => setOtherAdmissionForm({...otherAdmissionForm, enrolled_course: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px' }}
                  placeholder="Enter course name..."
                  required
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button 
                  type="button" 
                  onClick={() => setShowOtherAdmissionModal(false)} 
                  style={{ padding: '0.75rem 1rem', background: '#95a5a6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  style={{ padding: '0.75rem 1rem', background: '#3498db', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Record Admission
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          background: white;
          border-radius: 12px;
          width: 90%;
          max-width: 1200px;
          max-height: 90vh;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        }

        .large-modal {
          width: 95%;
          max-width: 1400px;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          border-bottom: 1px solid #e1e5e9;
          background: #f8f9fa;
        }

        .modal-header h2 {
          margin: 0;
          color: #333;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 2rem;
          cursor: pointer;
          color: #666;
          padding: 0;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: background 0.2s ease;
        }

        .close-btn:hover {
          background: #e9ecef;
        }

        .modal-body {
          padding: 1.5rem;
          max-height: calc(90vh - 100px);
          overflow-y: auto;
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
          .modal-content {
            width: 95%;
            margin: 1rem;
          }

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
        }
      `}</style>
    </div>
  );
};

export default VisitedRecords;