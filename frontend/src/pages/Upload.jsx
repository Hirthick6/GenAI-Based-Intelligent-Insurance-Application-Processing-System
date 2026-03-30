import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadFiles, getEmailInbox, processEmails } from '../services/api';
import { useAuth } from '../context/AuthContext';

const cardStyle = {
  background: '#fff',
  borderRadius: '12px',
  padding: '1.5rem',
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  border: '1px solid #e5e7eb',
};

export default function Upload() {
  const { isAdmin } = useAuth();
  const [files, setFiles] = useState([]);
  const [subject, setSubject] = useState('');
  const [sender, setSender] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  // Email Inbox state
  const [inboxInfo, setInboxInfo] = useState(null);
  const [emailProcessing, setEmailProcessing] = useState(false);
  const [emailResult, setEmailResult] = useState(null);

  useEffect(() => {
    getEmailInbox().then((res) => setInboxInfo(res.data)).catch(() => setInboxInfo({ configured: false }));
  }, []);

  const handleCheckEmails = async () => {
    if (!inboxInfo?.configured) return;
    setEmailProcessing(true);
    setEmailResult(null);
    setError('');
    try {
      const res = await processEmails();
      setEmailResult(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Email processing failed. Check IMAP credentials in .env');
    } finally {
      setEmailProcessing(false);
    }
  };

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files).filter(f => f.name.toLowerCase().endsWith('.pdf'));
    setFiles(prev => [...prev, ...selectedFiles]);
    setError('');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files).filter(f => f.name.toLowerCase().endsWith('.pdf'));
    setFiles(prev => [...prev, ...droppedFiles]);
    setError('');
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      setError('Please select at least one PDF file');
      return;
    }

    setUploading(true);
    setProgress('Uploading and processing files...');
    setError('');

    try {
      const progressSteps = [
        'Uploading PDFs...',
        'Batch processing pages...',
        'Running OCR on each page...',
        'Structuring with Docling...',
        'Generating JSON...',
        'Running GenAI extraction...',
        'Validating data...',
        'Saving to database...',
      ];

      let stepIdx = 0;
      const progressInterval = setInterval(() => {
        if (stepIdx < progressSteps.length) {
          setProgress(progressSteps[stepIdx]);
          stepIdx++;
        }
      }, 3000);

      const response = await uploadFiles(files, subject, sender);
      clearInterval(progressInterval);

      setResult(response.data);
      setProgress('Processing complete!');
      setFiles([]);

    } catch (err) {
      setError(err.response?.data?.detail || 'Upload failed. Please try again.');
      setProgress('');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>Upload PDF Documents</h1>
      <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
        Upload multiple PDFs to process through the complete pipeline: OCR &rarr; Docling &rarr; GenAI &rarr; Validation
      </p>

      {/* Selected Files - shown prominently when files are chosen */}
      {files.length > 0 && (
        <div style={{
          ...cardStyle,
          marginBottom: '1.5rem',
          borderLeft: '4px solid #059669',
          background: '#f0fdf4',
        }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem', color: '#059669' }}>
            Selected PDFs ({files.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {files.map((file, i) => (
              <div key={i} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.6rem 0.75rem',
                background: '#fff',
                borderRadius: '8px',
                border: '1px solid #a7f3d0',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1.25rem' }}>&#128196;</span>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: '0.95rem' }}>{file.name}</div>
                    <div style={{ color: '#6b7280', fontSize: '0.8rem' }}>
                      {(file.size / 1024).toFixed(1)} KB
                    </div>
                  </div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                  style={{
                    background: '#fee2e2',
                    color: '#dc2626',
                    padding: '0.25rem 0.6rem',
                    borderRadius: '4px',
                    fontSize: '0.8rem',
                    fontWeight: 500,
                  }}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dedicated Email Inbox Section */}
      <div style={{
        ...cardStyle,
        marginBottom: '1.5rem',
        borderLeft: '4px solid #2563eb',
        background: inboxInfo?.configured ? '#f0f9ff' : '#f9fafb',
      }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem', color: '#1e40af', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.25rem' }}>&#128231;</span>
          Dedicated Email Inbox
        </h3>
        {inboxInfo?.configured ? (
          <>
            <p style={{ fontSize: '0.9rem', color: '#374151', marginBottom: '0.75rem' }}>
              Customers send insurance application PDFs to:
            </p>
            <div style={{
              padding: '1rem',
              background: '#fff',
              borderRadius: '8px',
              border: '1px solid #bfdbfe',
              fontFamily: 'monospace',
              fontSize: '1.1rem',
              fontWeight: 600,
              color: '#1d4ed8',
              marginBottom: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.5rem',
            }}>
              <span>{inboxInfo.inbox_email}</span>
              {inboxInfo.inbox_email?.toLowerCase().includes('gmail') && (
                <a
                  href="https://mail.google.com/mail/u/0/#inbox"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: '0.8rem',
                    color: '#2563eb',
                    textDecoration: 'none',
                    fontWeight: 500,
                  }}
                >
                  Open in Gmail →
                </a>
              )}
            </div>
            <p style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '1rem' }}>
              {isAdmin ? '' : 'Email processing is admin-only. Use the upload form below to add documents.'}
            </p>
            {isAdmin && (
            <button
              onClick={handleCheckEmails}
              disabled={emailProcessing}
              style={{
                padding: '0.65rem 1.5rem',
                borderRadius: '8px',
                background: emailProcessing ? '#9ca3af' : 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                color: '#fff',
                fontSize: '0.95rem',
                fontWeight: 600,
                cursor: emailProcessing ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              {emailProcessing ? (
                <>Checking inbox...</>
              ) : (
                <>Check & Process Emails</>
              )}
            </button>
            )}
          </>
        ) : (
          <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>
            <p style={{ marginBottom: '0.5rem' }}>
              Configure <code style={{ background: '#e5e7eb', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>IMAP_EMAIL</code> and{' '}
              <code style={{ background: '#e5e7eb', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>IMAP_PASSWORD</code> in <code>backend/.env</code> to enable.
            </p>
            <p style={{ fontSize: '0.85rem', color: '#9ca3af' }}>
              Example: applications@insurance.com — Use Gmail App Password if using Gmail.
            </p>
          </div>
        )}

        {/* Email Processing Results */}
        {emailResult && (
          <div style={{
            marginTop: '1rem',
            padding: '1rem',
            background: emailResult.results?.length > 0 ? '#d1fae5' : '#f3f4f6',
            borderRadius: '8px',
            border: `1px solid ${emailResult.results?.length > 0 ? '#a7f3d0' : '#e5e7eb'}`,
          }}>
            <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.5rem' }}>{emailResult.message}</div>
            {emailResult.results?.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                {emailResult.results.map((r, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 500 }}>{r.application_id}</span>
                    <span style={{ color: '#059669', fontSize: '0.85rem' }}>{r.status}</span>
                    {r.total_documents && (
                      <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>{r.total_documents} docs</span>
                    )}
                    <button
                      onClick={() => navigate(`/applications/${r.application_id}`)}
                      style={{
                        padding: '0.25rem 0.6rem',
                        background: '#059669',
                        color: '#fff',
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                        fontWeight: 500,
                      }}
                    >
                      View
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: '0.85rem', color: '#6b7280' }}>No unread emails with PDF attachments found.</p>
            )}
          </div>
        )}
      </div>

      {/* Divider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
        <span style={{ fontSize: '0.85rem', color: '#9ca3af', fontWeight: 500 }}>or upload manually</span>
        <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
      </div>

      {/* Success Result */}
      {result && (
        <div style={{
          ...cardStyle,
          borderLeft: '4px solid #059669',
          marginBottom: '1.5rem',
          background: '#f0fdf4',
        }}>
          <h3 style={{ color: '#059669', marginBottom: '0.5rem' }}>Processing Complete</h3>
          <p style={{ fontSize: '0.9rem', color: '#374151' }}>
            Application <strong>{result.application_id}</strong> created with {result.documents_count} document(s).
          </p>
          <button
            onClick={() => navigate(`/applications/${result.application_id}`)}
            style={{
              marginTop: '0.75rem',
              background: '#059669',
              color: '#fff',
              padding: '0.5rem 1.25rem',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '0.9rem',
            }}
          >
            View Application &rarr;
          </button>
        </div>
      )}

      {/* Application Metadata */}
      <div style={{ ...cardStyle, marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Application Details (Optional)</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#374151', fontWeight: 500, marginBottom: '0.25rem' }}>Subject / Reference</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g., New Insurance Application"
              style={{
                width: '100%',
                padding: '0.6rem 0.75rem',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '0.9rem',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => e.target.style.borderColor = '#2563eb'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#374151', fontWeight: 500, marginBottom: '0.25rem' }}>Sender / Source</label>
            <input
              type="text"
              value={sender}
              onChange={(e) => setSender(e.target.value)}
              placeholder="e.g., agent@insurance.com"
              style={{
                width: '100%',
                padding: '0.6rem 0.75rem',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '0.9rem',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => e.target.style.borderColor = '#2563eb'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>
        </div>
      </div>

      {/* Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => fileInputRef.current?.click()}
        style={{
          ...cardStyle,
          border: files.length > 0 ? '2px solid #059669' : '2px dashed #d1d5db',
          textAlign: 'center',
          padding: '3rem',
          cursor: 'pointer',
          marginBottom: '1.5rem',
          transition: 'border-color 0.2s, background 0.2s',
          background: files.length > 0 ? '#f0fdf4' : '#fafbfc',
        }}
        onMouseOver={(e) => { if (files.length === 0) { e.currentTarget.style.borderColor = '#2563eb'; e.currentTarget.style.background = '#f0f7ff'; } }}
        onMouseOut={(e) => { if (files.length === 0) { e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.background = '#fafbfc'; } }}
      >
        <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>&#128196;</div>
        <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#374151' }}>
          {files.length > 0 ? `${files.length} PDF(s) selected – click to add more` : 'Drop PDF files here or click to browse'}
        </div>
        <div style={{ fontSize: '0.85rem', color: '#9ca3af', marginTop: '0.5rem' }}>
          Supports multiple PDFs &middot; Each PDF can have multiple pages
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          multiple
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
      </div>

      {/* Error */}
      {error && (
        <div style={{
          background: '#fee2e2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          padding: '0.75rem 1rem',
          color: '#dc2626',
          fontSize: '0.9rem',
          marginBottom: '1rem',
        }}>
          {error}
        </div>
      )}

      {/* Progress */}
      {uploading && progress && (
        <div style={{
          background: '#dbeafe',
          border: '1px solid #93c5fd',
          borderRadius: '8px',
          padding: '0.75rem 1rem',
          color: '#1d4ed8',
          fontSize: '0.9rem',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
        }}>
          <div style={{
            width: '20px', height: '20px', border: '3px solid #93c5fd',
            borderTopColor: '#2563eb', borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }} />
          {progress}
        </div>
      )}

      {/* Upload Button */}
      <button
        onClick={handleUpload}
        disabled={uploading || files.length === 0}
        style={{
          width: '100%',
          padding: '0.85rem',
          borderRadius: '10px',
          background: uploading || files.length === 0
            ? '#d1d5db'
            : 'linear-gradient(135deg, #2563eb, #1d4ed8)',
          color: '#fff',
          fontSize: '1rem',
          fontWeight: 700,
          cursor: uploading || files.length === 0 ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s',
        }}
      >
        {uploading ? 'Processing...' : `Upload & Process ${files.length} PDF${files.length !== 1 ? 's' : ''}`}
      </button>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
