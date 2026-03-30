import React, { useState, useEffect } from 'react';
import { getEmailInbox, getStats } from '../services/api';

const cardStyle = {
  background: '#fff',
  borderRadius: '12px',
  padding: '1.5rem',
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  border: '1px solid #e5e7eb',
};

export default function Settings() {
  const [inboxInfo, setInboxInfo] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getEmailInbox().catch(() => ({ data: { configured: false } })),
      getStats().catch(() => ({ data: {} })),
    ]).then(([inboxRes, statsRes]) => {
      setInboxInfo(inboxRes.data);
      setStats(statsRes.data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '4rem', color: '#9ca3af' }}>Loading settings...</div>;
  }

  return (
    <div>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>Settings</h1>
      <p style={{ color: '#6b7280', marginBottom: '2rem' }}>System configuration and status</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {/* Email Inbox */}
        <div style={cardStyle}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: '#374151', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>&#128231;</span> Email Inbox
          </h3>
          {inboxInfo?.configured ? (
            <div>
              <div style={{ fontSize: '0.9rem', color: '#059669', fontWeight: 500, marginBottom: '0.5rem' }}>Configured</div>
              <div style={{ fontFamily: 'monospace', fontSize: '0.95rem', color: '#1d4ed8' }}>{inboxInfo.inbox_email}</div>
              <p style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '0.75rem' }}>IMAP connected. Use Upload PDFs to check inbox.</p>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: '0.9rem', color: '#dc2626', fontWeight: 500, marginBottom: '0.5rem' }}>Not configured</div>
              <p style={{ fontSize: '0.85rem', color: '#6b7280' }}>Set IMAP_EMAIL and IMAP_PASSWORD in backend/.env</p>
            </div>
          )}
        </div>

        {/* Pipeline Stats */}
        <div style={cardStyle}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: '#374151', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>&#128202;</span> Pipeline Stats
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div style={{ padding: '0.75rem', background: '#f9fafb', borderRadius: '8px' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#2563eb' }}>{stats?.total_applications ?? '-'}</div>
              <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>Applications</div>
            </div>
            <div style={{ padding: '0.75rem', background: '#f9fafb', borderRadius: '8px' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#059669' }}>{stats?.completed ?? '-'}</div>
              <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>Completed</div>
            </div>
            <div style={{ padding: '0.75rem', background: '#f9fafb', borderRadius: '8px' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#d97706' }}>{stats?.total_documents ?? '-'}</div>
              <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>Documents</div>
            </div>
            <div style={{ padding: '0.75rem', background: '#f9fafb', borderRadius: '8px' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#7c3aed' }}>{stats?.total_pages ?? '-'}</div>
              <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>Pages</div>
            </div>
          </div>
        </div>

        {/* Pipeline Flow */}
        
      </div>
    </div>
  );
}
