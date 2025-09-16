import React, { useState } from 'react';
import api from '../utils/api';

const UploadCSV = ({ onUploadSuccess }) => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(selectedFiles);
    setResult(null);
    setError('');
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    
    if (files.length === 0) {
      setError('Please select at least one file');
      return;
    }

    setUploading(true);
    setError('');

    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });

    try {
      const response = await api.post('/admin/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setResult(response.data);
      setFiles([]);
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

        <button 
          type="submit" 
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