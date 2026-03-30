import React, { useState, useEffect } from 'react';
import { getApplications, getStats } from '../services/api';

const card = {
  background: '#fff',
  borderRadius: '12px',
  padding: '1.5rem',
  boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
  border: '1px solid #e5e7eb',
};

export default function Analytics() {
  const [stats, setStats] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getStats().catch(() => ({ data: {} })),
      getApplications(0, 100).catch(() => ({ data: [] })),
    ]).then(([sRes, aRes]) => {
      setStats(sRes.data);
      setApplications(aRes.data || []);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '4rem', color: '#9ca3af', fontSize: '1rem' }}>Loading analytics...</div>;
  }

  const total = stats?.total_applications || 0;
  const completed = stats?.completed || 0;
  const failed = stats?.failed || 0;
  const processing = stats?.processing || 0;
  const totalDocs = stats?.total_documents || 0;
  const totalPages = stats?.total_pages || 0;

  const avgConf = applications.length
    ? (applications.reduce((s, a) => s + (a.confidence_score || 0), 0) / applications.length).toFixed(1)
    : 0;

  // Confidence distribution
  const confBuckets = { '0–50%': 0, '50–70%': 0, '70–80%': 0, '80–100%': 0 };
  applications.forEach(a => {
    const c = a.confidence_score || 0;
    if (c < 50) confBuckets['0–50%']++;
    else if (c < 70) confBuckets['50–70%']++;
    else if (c < 80) confBuckets['70–80%']++;
    else confBuckets['80–100%']++;
  });

  // Docs per application
  const docsMap = {};
  applications.forEach(a => {
    const k = `${a.total_documents || 0} doc${(a.total_documents || 0) !== 1 ? 's' : ''}`;
    docsMap[k] = (docsMap[k] || 0) + 1;
  });

  // Weekly activity (real data from created_at)
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const weeklyCount = [0, 0, 0, 0, 0, 0, 0];
  const now = new Date();
  applications.forEach(a => {
    const d = new Date(a.created_at);
    const diff = Math.floor((now - d) / 86400000);
    if (diff < 7) weeklyCount[d.getDay()]++;
  });

  // Status breakdown
  const statusData = [
    { label: 'Completed', value: completed, color: '#059669' },
    { label: 'Processing', value: processing, color: '#3b82f6' },
    { label: 'Failed', value: failed, color: '#ef4444' },
    { label: 'Other', value: Math.max(0, total - completed - processing - failed), color: '#9ca3af' },
  ].filter(s => s.value > 0);

  const completedPct = total > 0 ? ((completed / total) * 100).toFixed(0) : 0;

  return (
    <div style={{ maxWidth: '1200px' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>Analytics</h1>
      <p style={{ color: '#6b7280', marginBottom: '2rem', fontSize: '0.9rem' }}>
        Application insights and performance metrics
      </p>

      {/* ── Summary Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { label: 'Total Applications', value: total, color: '#3b82f6', bg: '#eff6ff' },
          { label: 'Completed', value: completed, color: '#059669', bg: '#f0fdf4' },
          { label: 'Processing', value: processing, color: '#f59e0b', bg: '#fffbeb' },
          { label: 'Failed', value: failed, color: '#ef4444', bg: '#fef2f2' },
          { label: 'Total Documents', value: totalDocs, color: '#8b5cf6', bg: '#f5f3ff' },
          { label: 'Avg Confidence', value: `${avgConf}%`, color: '#0891b2', bg: '#ecfeff' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} style={{ ...card, padding: '1.25rem', background: bg, border: `1px solid ${color}22` }}>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color }}>{value}</div>
            <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem', fontWeight: 500 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* ── Row 1: Bar Charts ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <ChartCard title="Confidence Distribution" subtitle="OCR confidence score ranges">
          <HBarChart
            data={Object.entries(confBuckets).map(([label, value], i) => ({
              label, value,
              color: ['#ef4444', '#f59e0b', '#3b82f6', '#059669'][i],
            }))}
          />
        </ChartCard>

        <ChartCard title="Documents per Application" subtitle="How many PDFs per application">
          <HBarChart
            data={Object.entries(docsMap).map(([label, value]) => ({ label, value, color: '#8b5cf6' }))}
          />
        </ChartCard>

        <ChartCard title="Weekly Upload Activity" subtitle="Uploads in the last 7 days by day">
          <VBarChart
            data={weekDays.map((label, i) => ({ label, value: weeklyCount[i], color: '#3b82f6' }))}
          />
        </ChartCard>
      </div>

      {/* ── Row 2: Status + Donut ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <ChartCard title="Status Breakdown" subtitle="Application processing status distribution">
          <StatusBreakdown data={statusData} total={total} />
        </ChartCard>

        <ChartCard title="Completion Rate" subtitle="Percentage of successfully completed applications">
          <DonutChart pct={Number(completedPct)} completed={completed} total={total} />
        </ChartCard>
      </div>

      {/* ── Row 3: Extraction % distribution ── */}
      <ChartCard title="Extraction Quality Distribution" subtitle="How well fields were extracted across all applications">
        <ExtractionDistribution applications={applications} />
      </ChartCard>
    </div>
  );
}

function ChartCard({ title, subtitle, children }) {
  return (
    <div style={{
      background: '#fff',
      borderRadius: '12px',
      padding: '1.5rem',
      boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
      border: '1px solid #e5e7eb',
    }}>
      <div style={{ marginBottom: '1.25rem' }}>
        <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#111827' }}>{title}</div>
        <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.2rem' }}>{subtitle}</div>
      </div>
      {children}
    </div>
  );
}

/* Horizontal bar chart */
function HBarChart({ data }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {data.map(({ label, value, color }) => (
        <div key={label}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.3rem' }}>
            <span style={{ color: '#374151', fontWeight: 500 }}>{label}</span>
            <span style={{ color, fontWeight: 700 }}>{value}</span>
          </div>
          <div style={{ height: '10px', background: '#f3f4f6', borderRadius: '99px', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${(value / max) * 100}%`,
              background: color,
              borderRadius: '99px',
              transition: 'width 0.6s ease',
              minWidth: value > 0 ? '6px' : '0',
            }} />
          </div>
        </div>
      ))}
    </div>
  );
}

/* Vertical bar chart */
function VBarChart({ data }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem', height: '140px' }}>
      {data.map(({ label, value, color }) => (
        <div key={label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', height: '100%', justifyContent: 'flex-end' }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: value > 0 ? '#374151' : '#d1d5db' }}>{value}</span>
          <div style={{
            width: '100%',
            height: `${Math.max((value / max) * 110, value > 0 ? 8 : 0)}px`,
            background: value > 0 ? color : '#f3f4f6',
            borderRadius: '6px 6px 0 0',
            transition: 'height 0.5s ease',
          }} />
          <span style={{ fontSize: '0.68rem', color: '#9ca3af' }}>{label}</span>
        </div>
      ))}
    </div>
  );
}

/* Status breakdown with horizontal bars + legend */
function StatusBreakdown({ data, total }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Stacked bar */}
      <div style={{ display: 'flex', height: '20px', borderRadius: '99px', overflow: 'hidden', background: '#f3f4f6' }}>
        {data.map(({ label, value, color }) => (
          <div
            key={label}
            title={`${label}: ${value}`}
            style={{
              width: `${total > 0 ? (value / total) * 100 : 0}%`,
              background: color,
              transition: 'width 0.6s ease',
            }}
          />
        ))}
      </div>
      {/* Legend rows */}
      {data.map(({ label, value, color }) => (
        <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: color, flexShrink: 0 }} />
            <span style={{ fontSize: '0.82rem', color: '#374151', fontWeight: 500 }}>{label}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '80px', height: '6px', background: '#f3f4f6', borderRadius: '99px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${total > 0 ? (value / total) * 100 : 0}%`, background: color, borderRadius: '99px' }} />
            </div>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color, minWidth: '28px', textAlign: 'right' }}>{value}</span>
            <span style={{ fontSize: '0.75rem', color: '#9ca3af', minWidth: '36px', textAlign: 'right' }}>
              {total > 0 ? `${((value / total) * 100).toFixed(0)}%` : '0%'}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

/* Donut chart */
function DonutChart({ pct, completed, total }) {
  const r = 60;
  const sw = 14;
  const nr = r - sw / 2;
  const circ = nr * 2 * Math.PI;
  const offset = circ - (pct / 100) * circ;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <svg width="140" height="140" viewBox="0 0 140 140">
          <circle cx="70" cy="70" r={nr} fill="none" stroke="#f3f4f6" strokeWidth={sw} />
          <circle
            cx="70" cy="70" r={nr} fill="none"
            stroke={pct >= 80 ? '#059669' : pct >= 50 ? '#f59e0b' : '#ef4444'}
            strokeWidth={sw}
            strokeDasharray={circ}
            strokeDashoffset={offset}
            strokeLinecap="round"
            transform="rotate(-90 70 70)"
            style={{ transition: 'stroke-dashoffset 0.8s ease' }}
          />
        </svg>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center' }}>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#111827', lineHeight: 1 }}>{pct}%</div>
          <div style={{ fontSize: '0.65rem', color: '#9ca3af', marginTop: '0.2rem' }}>completed</div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {[
          { label: 'Completed', value: completed, color: '#059669' },
          { label: 'Remaining', value: total - completed, color: '#e5e7eb' },
          { label: 'Total', value: total, color: '#374151' },
        ].map(({ label, value, color }) => (
          <div key={label}>
            <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginBottom: '0.1rem' }}>{label}</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color }}>{value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* Extraction quality distribution */
function ExtractionDistribution({ applications }) {
  const buckets = [
    { label: '0–20%', min: 0, max: 20, color: '#ef4444' },
    { label: '20–40%', min: 20, max: 40, color: '#f97316' },
    { label: '40–60%', min: 40, max: 60, color: '#f59e0b' },
    { label: '60–80%', min: 60, max: 80, color: '#3b82f6' },
    { label: '80–100%', min: 80, max: 101, color: '#059669' },
  ].map(b => ({
    ...b,
    value: applications.filter(a => {
      const p = a.extraction_percentage || 0;
      return p >= b.min && p < b.max;
    }).length,
  }));

  const max = Math.max(...buckets.map(b => b.value), 1);

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1rem', height: '160px', padding: '0 1rem' }}>
      {buckets.map(({ label, value, color }) => (
        <div key={label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', height: '100%', justifyContent: 'flex-end' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: value > 0 ? '#374151' : '#d1d5db' }}>{value}</span>
          <div style={{
            width: '100%',
            height: `${Math.max((value / max) * 120, value > 0 ? 10 : 0)}px`,
            background: value > 0 ? color : '#f3f4f6',
            borderRadius: '6px 6px 0 0',
            transition: 'height 0.6s ease',
            position: 'relative',
          }}>
            {value > 0 && (
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                background: `${color}22`,
                borderRadius: '6px 6px 0 0',
              }} />
            )}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 500 }}>{label}</span>
        </div>
      ))}
    </div>
  );
}
