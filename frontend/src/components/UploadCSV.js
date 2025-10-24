import React, { useState } from 'react';
import api from '../utils/api';

const UploadCSV = ({ onUploadSuccess }) => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [showDistributionModal, setShowDistributionModal] = useState(false);
  const [distributionType, setDistributionType] = useState('equal'); // 'equal' or 'single'
  const [selectedCaller, setSelectedCaller] = useState('');
  const [callers, setCallers] = useState([]);

  const handleFileChange = async (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(selectedFiles);
    setResult(null);
    setError('');
    
    // Fetch callers when files are selected
    if (selectedFiles.length > 0) {
      try {
        const response = await api.get('/users');
        const callerUsers = response.data.users.filter(u => u.role === 'caller');
        setCallers(callerUsers);
        setShowDistributionModal(true);
      } catch (error) {
        console.error('Error fetching callers:', error);
      }
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      setError('Please select at least one file');
      return;
    }
    
    if (distributionType === 'single' && !selectedCaller) {
      setError('Please select a caller');
      return;
    }

    setUploading(true);
    setError('');
    setShowDistributionModal(false);

    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });
    
    // Add distribution parameters
    formData.append('distribution_type', distributionType);
    if (distributionType === 'single') {
      formData.append('caller_id', selectedCaller);
    }

    try {
      const response = await api.post('/admin/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setResult(response.data);
      setFiles([]);
      setDistributionType('equal');
      setSelectedCaller('');
      if (onUploadSuccess) onUploadSuccess();
    } catch (error) {
      setError(error.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="card">
      <h2>Upload CSV/Excel Files</h2>
      
      <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#e8f4fd', borderRadius: '4px' }}>
        <h4>File Requirements:</h4>
        <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
          <li><strong>Recommended:</strong> CSV format (.csv) for best compatibility</li>
          <li>Excel format (.xlsx, .xls) also supported</li>
          <li><strong>Phone Column:</strong> Any column containing 'phone', 'mobile', 'number', 'contact', 'cell'</li>
          <li><strong>Name Column:</strong> Any column containing 'name', 'customer', 'client', 'person' (optional)</li>
          <li>Smart column detection - no need for exact column names</li>
          <li>Duplicates will be automatically removed</li>
          <li>Records equally distributed per file among callers</li>
        </ul>
      </div>

      {error && error.includes('pandas') && (
        <div style={{ 
          marginBottom: '1rem', 
          padding: '1rem', 
          background: '#fff3cd', 
          borderRadius: '4px',
          border: '1px solid #ffeaa7'
        }}>
          <h4>⚠️ Excel Support Issue</h4>
          <p>There's a compatibility issue with Excel file processing. Please:</p>
          <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
            <li>Use CSV format instead (.csv)</li>
            <li>Or convert your Excel file to CSV format</li>
            <li>CSV files work perfectly and are processed faster</li>
          </ul>
        </div>
      )}

      <form onSubmit={handleUpload}>
        <div className="form-group">
          <label htmlFor="csvFile">Select Files (Multiple files supported)</label>
          <input
            type="file"
            id="csvFile"
            accept=".csv,.xlsx,.xls"
            multiple
            onChange={handleFileChange}
            className="form-control"
          />
        </div>

        {files.length > 0 && (
          <div style={{ marginBottom: '1rem', padding: '0.5rem', background: '#f8f9fa', borderRadius: '4px' }}>
            <strong>Selected {files.length} file(s):</strong>
            <ul style={{ marginTop: '0.5rem', paddingLeft: '1rem' }}>
              {files.map((file, index) => (
                <li key={index}>{file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</li>
              ))}
            </ul>
          </div>
        )}

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

        {result && (
          <div style={{ 
            color: '#27ae60', 
            marginBottom: '1rem', 
            padding: '1rem',
            background: '#d5f4e6',
            borderRadius: '4px'
          }}>
            <h4>✅ Upload Successful!</h4>
            <p>{result.message}</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
              <div>
                <strong>📊 Summary:</strong>
                <ul style={{ marginTop: '0.5rem', paddingLeft: '1rem' }}>
                  <li>Total records added: {result.total_records_added}</li>
                  {result.total_skipped_duplicates > 0 && <li>Duplicates skipped: {result.total_skipped_duplicates}</li>}
                  <li>Files processed: {result.files_processed}</li>
                  {result.files_failed > 0 && <li>Files failed: {result.files_failed}</li>}
                </ul>
              </div>
              {result.final_distribution && (
                <div>
                  <strong>👥 Final Distribution:</strong>
                  <ul style={{ marginTop: '0.5rem', paddingLeft: '1rem' }}>
                    {Object.entries(result.final_distribution).map(([caller, count]) => (
                      <li key={caller}>{caller}: {count} records</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            {result.file_results && (
              <div style={{ marginTop: '1rem' }}>
                <strong>📁 File Results:</strong>
                <ul style={{ marginTop: '0.5rem', paddingLeft: '1rem' }}>
                  {result.file_results.map((fileResult, index) => (
                    <li key={index} style={{ color: fileResult.status === 'success' ? '#27ae60' : '#e74c3c' }}>
                      {fileResult.filename}: {fileResult.status === 'success' ? 
                        `${fileResult.records_added} records added` : 
                        fileResult.message
                      }
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Distribution Modal */}
        {showDistributionModal && (
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
              <h3>Choose Distribution Method</h3>
              
              <div style={{ marginTop: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '1rem', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    value="equal"
                    checked={distributionType === 'equal'}
                    onChange={(e) => setDistributionType(e.target.value)}
                    style={{ marginRight: '0.5rem' }}
                  />
                  <strong>Distribute Equally</strong>
                  <div style={{ marginLeft: '1.5rem', color: '#666', fontSize: '14px' }}>
                    Records will be distributed equally among all callers
                  </div>
                </label>
                
                <label style={{ display: 'block', marginBottom: '1rem', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    value="single"
                    checked={distributionType === 'single'}
                    onChange={(e) => setDistributionType(e.target.value)}
                    style={{ marginRight: '0.5rem' }}
                  />
                  <strong>Assign to One Caller</strong>
                  <div style={{ marginLeft: '1.5rem', color: '#666', fontSize: '14px' }}>
                    All records will be assigned to a single caller
                  </div>
                </label>
                
                {distributionType === 'single' && (
                  <div style={{ marginLeft: '1.5rem', marginTop: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                      Select Caller:
                    </label>
                    <select
                      value={selectedCaller}
                      onChange={(e) => setSelectedCaller(e.target.value)}
                      className="form-control"
                      required
                    >
                      <option value="">-- Select Caller --</option>
                      {callers.map(caller => (
                        <option key={caller.id} value={caller.id}>
                          {caller.name} ({caller.username})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              
              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowDistributionModal(false);
                    setFiles([]);
                    setDistributionType('equal');
                    setSelectedCaller('');
                  }}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleUpload}
                  className="btn btn-primary"
                  disabled={distributionType === 'single' && !selectedCaller}
                >
                  Upload Files
                </button>
              </div>
            </div>
          </div>
        )}

        <button 
          type="button"
          onClick={() => document.getElementById('csvFile').click()}
          className="btn btn-primary"
          disabled={files.length === 0 || uploading}
        >
          {uploading ? 'Uploading...' : `Upload ${files.length} File${files.length !== 1 ? 's' : ''}`}
        </button>
      </form>

      <div style={{ marginTop: '2rem', padding: '1rem', background: '#fff3cd', borderRadius: '4px' }}>
        <h4>Sample CSV Format:</h4>
        <pre style={{ background: 'white', padding: '0.5rem', borderRadius: '4px', fontSize: '12px' }}>
{`Mobile_Number,Customer_Name
+1234567890,John Doe
+1234567891,Jane Smith

OR

Phone,Name
+1234567890,John Doe
+1234567891,Jane Smith`}
        </pre>
      </div>
    </div>
  );
};

export default UploadCSV;