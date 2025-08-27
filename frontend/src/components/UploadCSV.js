import React, { useState } from 'react';
import api from '../utils/api';

const UploadCSV = ({ onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setResult(null);
    setError('');
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    
    if (!file) {
      setError('Please select a file');
      return;
    }

    setUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/admin/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setResult(response.data);
      setFile(null);
      if (onUploadSuccess) onUploadSuccess();
      
      // Reset file input
      e.target.reset();
    } catch (error) {
      setError(error.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="card">
      <h2>Upload CSV/Excel File</h2>
      
      <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#e8f4fd', borderRadius: '4px' }}>
        <h4>File Requirements:</h4>
        <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
          <li><strong>Recommended:</strong> CSV format (.csv) for best compatibility</li>
          <li>Excel format (.xlsx, .xls) also supported</li>
          <li>Must contain a 'phone_number' column</li>
          <li>Optional 'name' column</li>
          <li>Maximum 100,000 records</li>
          <li>Duplicates will be automatically removed</li>
          <li>Records will be equally distributed among active callers</li>
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
          <label htmlFor="csvFile">Select File</label>
          <input
            type="file"
            id="csvFile"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileChange}
            className="form-control"
          />
        </div>

        {file && (
          <div style={{ marginBottom: '1rem', padding: '0.5rem', background: '#f8f9fa', borderRadius: '4px' }}>
            <strong>Selected:</strong> {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
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
                  <li>Records added: {result.records_added}</li>
                  {result.skipped_duplicates > 0 && <li>Duplicates skipped: {result.skipped_duplicates}</li>}
                  <li>Callers assigned: {result.callers_assigned}</li>
                </ul>
              </div>
              {result.distribution && (
                <div>
                  <strong>👥 Distribution:</strong>
                  <ul style={{ marginTop: '0.5rem', paddingLeft: '1rem' }}>
                    {Object.entries(result.distribution).map(([caller, count]) => (
                      <li key={caller}>{caller}: {count} records</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        <button 
          type="submit" 
          className="btn btn-primary"
          disabled={!file || uploading}
        >
          {uploading ? 'Uploading...' : 'Upload File'}
        </button>
      </form>

      <div style={{ marginTop: '2rem', padding: '1rem', background: '#fff3cd', borderRadius: '4px' }}>
        <h4>Sample CSV Format:</h4>
        <pre style={{ background: 'white', padding: '0.5rem', borderRadius: '4px', fontSize: '12px' }}>
{`phone_number,name
+1234567890,John Doe
+1234567891,Jane Smith
+1234567892,Bob Johnson`}
        </pre>
      </div>
    </div>
  );
};

export default UploadCSV;