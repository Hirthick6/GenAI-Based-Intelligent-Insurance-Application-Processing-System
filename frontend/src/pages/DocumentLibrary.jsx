import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getApplications } from '../services/api';

const cardStyle = {
  background: '#fff',
  borderRadius: '12px',
  padding: '1.5rem',
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  border: '1px solid #e5e7eb',
};

export default function DocumentLibrary() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const response = await getApplications();
      setApplications(response.data || []);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredApps = applications.filter(app => 
    app.application_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.email_subject?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openDocumentViewer = (app) => {
    navigate(`/document-viewer/${app.application_id}`);
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '4rem', color: '#9ca3af' }}>Loading documents...</div>;
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>Document Library</h1>
        <p style={{ color: '#6b7280' }}>Browse, search, and interact with your documents</p>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', alignItems: 'center' }}>
        {/* Search */}
        <input
          type="text"
          placeholder="Search documents..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            flex: 1,
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            fontSize: '0.9rem',
          }}
        />

        {/* View Mode Toggle */}
        <div style={{ display: 'flex', gap: '0.5rem', background: '#f3f4f6', padding: '0.25rem', borderRadius: '8px' }}>
          <button
            onClick={() => setViewMode('grid')}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              background: viewMode === 'grid' ? '#fff' : 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 600,
              color: viewMode === 'grid' ? '#2563eb' : '#6b7280',
            }}
          >
            Grid
          </button>
          <button
            onClick={() => setViewMode('list')}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              background: viewMode === 'list' ? '#fff' : 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 600,
              color: viewMode === 'list' ? '#2563eb' : '#6b7280',
            }}
          >
            List
          </button>
        </div>
      </div>

      {/* Document Count */}
      <div style={{ marginBottom: '1rem', color: '#6b7280', fontSize: '0.9rem' }}>
        {filteredApps.length} document{filteredApps.length !== 1 ? 's' : ''} found
      </div>

      {/* Documents Display */}
      {viewMode === 'grid' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {filteredApps.map((app) => (
            <DocumentCard key={app.id} app={app} onClick={() => openDocumentViewer(app)} />
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredApps.map((app) => (
            <DocumentListItem key={app.id} app={app} onClick={() => openDocumentViewer(app)} />
          ))}
        </div>
      )}

      {filteredApps.length === 0 && (
        <div style={{ ...cardStyle, textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>
          No documents found
        </div>
      )}
    </div>
  );
}

function DocumentCard({ app, onClick }) {
  const statusColors = {
    completed: { bg: '#d1fae5', text: '#059669' },
    processing: { bg: '#dbeafe', text: '#2563eb' },
    failed: { bg: '#fee2e2', text: '#dc2626' },
  };
  const statusColor = statusColors[app.status] || statusColors.processing;

  return (
    <div
      onClick={onClick}
      style={{
        ...cardStyle,
        cursor: 'pointer',
        transition: 'all 0.2s',
        ':hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.15)' },
      }}
      onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'}
      onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)'}
    >
      {/* Document Icon */}
      <div style={{
        width: '100%',
        height: '120px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '1rem',
        fontSize: '3rem',
      }}>
        📄
      </div>

      {/* Document Info */}
      <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.5rem', color: '#111827' }}>
        {app.application_id}
      </h3>
      <p style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {app.email_subject || 'No subject'}
      </p>

      {/* Metadata */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
          {app.total_documents} doc{app.total_documents !== 1 ? 's' : ''} • {app.total_pages} page{app.total_pages !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Status Badge */}
      <span style={{
        display: 'inline-block',
        padding: '0.25rem 0.75rem',
        borderRadius: '12px',
        fontSize: '0.75rem',
        fontWeight: 600,
        background: statusColor.bg,
        color: statusColor.text,
        textTransform: 'capitalize',
      }}>
        {app.status}
      </span>

      {/* Date */}
      <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: '#9ca3af' }}>
        {new Date(app.created_at).toLocaleDateString()}
      </div>
    </div>
  );
}

function DocumentListItem({ app, onClick }) {
  const statusColors = {
    completed: { bg: '#d1fae5', text: '#059669' },
    processing: { bg: '#dbeafe', text: '#2563eb' },
    failed: { bg: '#fee2e2', text: '#dc2626' },
  };
  const statusColor = statusColors[app.status] || statusColors.processing;

  return (
    <div
      onClick={onClick}
      style={{
        ...cardStyle,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '1.5rem',
        transition: 'all 0.2s',
      }}
      onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'}
      onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)'}
    >
      {/* Icon */}
      <div style={{
        width: '60px',
        height: '60px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '2rem',
        flexShrink: 0,
      }}>
        📄
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.25rem', color: '#111827' }}>
          {app.application_id}
        </h3>
        <p style={{ fontSize: '0.85rem', color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {app.email_subject || 'No subject'}
        </p>
      </div>

      {/* Metadata */}
      <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '0.25rem' }}>Documents</div>
          <div style={{ fontSize: '1rem', fontWeight: 600, color: '#111827' }}>{app.total_documents}</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '0.25rem' }}>Pages</div>
          <div style={{ fontSize: '1rem', fontWeight: 600, color: '#111827' }}>{app.total_pages}</div>
        </div>
        <div style={{ textAlign: 'center', minWidth: '100px' }}>
          <span style={{
            padding: '0.35rem 0.75rem',
            borderRadius: '12px',
            fontSize: '0.75rem',
            fontWeight: 600,
            background: statusColor.bg,
            color: statusColor.text,
            textTransform: 'capitalize',
          }}>
            {app.status}
          </span>
        </div>
        <div style={{ fontSize: '0.85rem', color: '#9ca3af', minWidth: '100px', textAlign: 'right' }}>
          {new Date(app.created_at).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
}
