import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getApplications, deleteApplication } from '../services/api';
import { useAuth } from '../context/AuthContext';

const cardStyle = {
  background: '#fff',
  borderRadius: '12px',
  padding: '1.5rem',
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  border: '1px solid #e5e7eb',
};

const statusFilters = ['all', 'completed', 'processing', 'failed', 'received', 'validated'];

export default function ApplicationList() {
  const { isAdmin } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const fetchApps = () => {
    setLoading(true);
    const status = filter === 'all' ? null : filter;
    getApplications(0, 50, status)
      .then((res) => setApplications(res.data || []))
      .catch(() => setApplications([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchApps(); }, [filter]);

  const handleDelete = async (appId) => {
    if (!window.confirm(`Delete application ${appId}?`)) return;
    try {
      await deleteApplication(appId);
      fetchApps();
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Failed to delete application';
      alert(Array.isArray(msg) ? msg.join(', ') : msg);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Applications</h1>
        <Link to="/upload" style={{
          background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
          color: '#fff',
          padding: '0.6rem 1.5rem',
          borderRadius: '8px',
          fontWeight: 600,
          fontSize: '0.9rem',
          textDecoration: 'none',
        }}>
          + Upload PDFs
        </Link>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {statusFilters.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            style={{
              padding: '0.4rem 1rem',
              borderRadius: '20px',
              fontSize: '0.85rem',
              fontWeight: 500,
              background: filter === s ? '#2563eb' : '#f3f4f6',
              color: filter === s ? '#fff' : '#4b5563',
              border: filter === s ? '2px solid #2563eb' : '2px solid #e5e7eb',
              textTransform: 'capitalize',
              transition: 'all 0.2s',
            }}
          >
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>Loading...</div>
      ) : applications.length === 0 ? (
        <div style={{ ...cardStyle, textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>
          No applications found. <Link to="/upload">Upload PDFs</Link> to process.
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {applications.map((app) => (
            <div key={app.application_id} style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: '1.5rem', transition: 'box-shadow 0.2s' }}>
              <div style={{ flex: 1 }}>
                <Link to={`/applications/${app.application_id}`} style={{ fontWeight: 700, fontSize: '1.05rem', color: '#111827' }}>
                  {app.application_id}
                </Link>
                <div style={{ color: '#6b7280', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                  {app.email_subject || 'No subject'}
                  {app.email_sender && <span> &middot; {app.email_sender}</span>}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: '#9ca3af', textTransform: 'uppercase' }}>Documents</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{app.total_documents}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: '#9ca3af', textTransform: 'uppercase' }}>Pages</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{app.total_pages}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: '#9ca3af', textTransform: 'uppercase' }}>Confidence</div>
                  <div style={{
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    color: app.confidence_score >= 80 ? '#059669' : app.confidence_score >= 50 ? '#d97706' : '#dc2626',
                  }}>
                    {app.confidence_score > 0 ? `${app.confidence_score.toFixed(1)}%` : '-'}
                  </div>
                </div>
                <div>
                  <span style={{
                    background: app.status === 'completed' ? '#d1fae5' : app.status === 'failed' ? '#fee2e2' : '#dbeafe',
                    color: app.status === 'completed' ? '#059669' : app.status === 'failed' ? '#dc2626' : '#2563eb',
                    padding: '0.3rem 0.8rem',
                    borderRadius: '12px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    textTransform: 'capitalize',
                  }}>
                    {app.status}
                  </span>
                </div>
                {isAdmin && (
                <button onClick={() => handleDelete(app.application_id)} style={{
                  background: '#fee2e2',
                  color: '#dc2626',
                  padding: '0.4rem 0.8rem',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  fontWeight: 500,
                }}>
                  Delete
                </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
