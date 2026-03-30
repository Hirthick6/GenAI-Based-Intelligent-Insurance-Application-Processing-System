import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getStats, getApplications } from '../services/api';

const cardStyle = {
  background: '#fff',
  borderRadius: '12px',
  padding: '1.5rem',
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  border: '1px solid #e5e7eb',
};

const statCard = (color) => ({
  ...cardStyle,
  borderTop: `4px solid ${color}`,
});

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recentApps, setRecentApps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getStats().catch(() => ({ data: {} })),
      getApplications(0, 5).catch(() => ({ data: [] })),
    ]).then(([statsRes, appsRes]) => {
      setStats(statsRes.data);
      setRecentApps(appsRes.data || []);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <div style={{ fontSize: '2rem', color: '#9ca3af' }}>Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#111827' }}>
          Pipeline Dashboard
        </h1>
        
      </div>

      {/* Stats - Linear Layout */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem', overflowX: 'auto' }}>
        <StatCard label="Total Applications" value={stats?.total_applications || 0} color="#2563eb" />
        <StatCard label="Completed" value={stats?.completed || 0} color="#059669" />
        <StatCard label="Processing" value={stats?.processing || 0} color="#d97706" />
        <StatCard label="Failed" value={stats?.failed || 0} color="#dc2626" />
        <StatCard label="Total Documents" value={stats?.total_documents || 0} color="#7c3aed" />
        <StatCard label="Total Pages" value={stats?.total_pages || 0} color="#0891b2" />
      </div>

      
      

      {/* Recent Applications */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Recent Applications</h2>
          <Link to="/applications" style={{ fontSize: '0.9rem', fontWeight: 500 }}>View All &rarr;</Link>
        </div>

        {recentApps.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>
            No applications yet. <Link to="/upload">Upload PDFs</Link> to get started.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                <th style={{ textAlign: 'left', padding: '0.75rem', fontSize: '0.85rem', color: '#6b7280' }}>Application ID</th>
                <th style={{ textAlign: 'left', padding: '0.75rem', fontSize: '0.85rem', color: '#6b7280' }}>Subject</th>
                <th style={{ textAlign: 'center', padding: '0.75rem', fontSize: '0.85rem', color: '#6b7280' }}>Docs</th>
                <th style={{ textAlign: 'center', padding: '0.75rem', fontSize: '0.85rem', color: '#6b7280' }}>Status</th>
                <th style={{ textAlign: 'center', padding: '0.75rem', fontSize: '0.85rem', color: '#6b7280' }}>Confidence</th>
              </tr>
            </thead>
            <tbody>
              {recentApps.map((app) => (
                <tr key={app.application_id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '0.75rem' }}>
                    <Link to={`/applications/${app.application_id}`} style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                      {app.application_id}
                    </Link>
                  </td>
                  <td style={{ padding: '0.75rem', color: '#4b5563', fontSize: '0.9rem' }}>
                    {app.email_subject || '-'}
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 600 }}>
                    {app.total_documents}
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                    <StatusBadge status={app.status} />
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                    <ConfidenceBadge score={app.confidence_score} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const colors = {
    completed: { bg: '#d1fae5', text: '#059669' },
    processing: { bg: '#dbeafe', text: '#2563eb' },
    failed: { bg: '#fee2e2', text: '#dc2626' },
    received: { bg: '#f3f4f6', text: '#6b7280' },
    validated: { bg: '#d1fae5', text: '#059669' },
  };
  const c = colors[status] || colors.received;

  return (
    <span style={{
      background: c.bg,
      color: c.text,
      padding: '0.25rem 0.75rem',
      borderRadius: '12px',
      fontSize: '0.8rem',
      fontWeight: 600,
      textTransform: 'capitalize',
    }}>
      {status}
    </span>
  );
}

function ConfidenceBadge({ score }) {
  const color = score >= 80 ? '#059669' : score >= 50 ? '#d97706' : '#dc2626';
  return (
    <span style={{ color, fontWeight: 600, fontSize: '0.9rem' }}>
      {score > 0 ? `${score.toFixed(1)}%` : '-'}
    </span>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div style={{
      background: '#fff',
      borderRadius: '8px',
      padding: '1rem 1.25rem',
      border: '1px solid #d1d5db',
      minWidth: '140px',
      flex: '1',
    }}>
      <div style={{ fontSize: '0.7rem', color: '#6b7280', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
        {label}
      </div>
      <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#000' }}>
        {value}
      </div>
    </div>
  );
}
