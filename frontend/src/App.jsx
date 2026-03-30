import React, { useState } from 'react';
import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import ApplicationList from './pages/ApplicationList';
import ApplicationDetail from './pages/ApplicationDetail';
import Upload from './pages/Upload';
import Analytics from './pages/Analytics';
import DocumentLibrary from './pages/DocumentLibrary';
import DocumentViewer from './pages/DocumentViewer';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Signup from './pages/Signup';
import { useAuth } from './context/AuthContext';

const SIDEBAR_WIDTH = 260;
const SIDEBAR_COLLAPSED_WIDTH = 72;

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: '#9ca3af' }}>
        Loading...
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, loading, logout, isAdmin } = useAuth();

  // Public routes: Login, Signup
  if (!loading && !user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex' }}>
      {/* Sidebar */}
      <aside
        style={{
          width: sidebarOpen ? SIDEBAR_WIDTH : SIDEBAR_COLLAPSED_WIDTH,
          minHeight: '100vh',
          background: '#ffffff',
          borderRight: '1px solid #e5e7eb',
          boxShadow: '2px 0 8px rgba(0,0,0,0.04)',
          transition: 'width 0.25s ease',
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Logo / Brand */}
        <div
          style={{
            padding: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            borderBottom: '1px solid #e5e7eb',
          }}
        >
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              background: '#f3f4f6',
              border: '1px solid #e5e7eb',
              color: '#374151',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.25rem',
              flexShrink: 0,
            }}
          >
            &#9776;
          </button>
          {sidebarOpen && (
            <span
              style={{
                color: '#111827',
                fontWeight: 700,
                fontSize: '1rem',
                lineHeight: 1.3,
                overflow: 'hidden',
              }}
            >
              Insurance Document Processor
            </span>
          )}
        </div>

        {/* Nav Links */}
        <nav style={{ padding: '1rem 0.75rem', flex: 1 }}>
          <NavLink
            to="/"
            end
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              textDecoration: 'none',
              color: isActive ? '#2563eb' : '#374151',
              background: isActive ? '#eff6ff' : 'transparent',
              marginBottom: '0.35rem',
              transition: 'all 0.2s',
            })}
          >
            <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>&#128202;</span>
            {sidebarOpen && <span style={{ fontWeight: 500 }}>Dashboard</span>}
          </NavLink>
          <NavLink
            to="/applications"
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              textDecoration: 'none',
              color: isActive ? '#2563eb' : '#374151',
              background: isActive ? '#eff6ff' : 'transparent',
              marginBottom: '0.35rem',
              transition: 'all 0.2s',
            })}
          >
            <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>&#128196;</span>
            {sidebarOpen && <span style={{ fontWeight: 500 }}>Applications</span>}
          </NavLink>
          <NavLink
            to="/upload"
            style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                textDecoration: 'none',
                color: isActive ? '#2563eb' : '#374151',
                background: isActive ? '#eff6ff' : 'transparent',
                marginBottom: '0.35rem',
                transition: 'all 0.2s',
              })}
            >
              <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>&#128231;</span>
            {sidebarOpen && <span style={{ fontWeight: 500 }}>Upload PDFs</span>}
          </NavLink>
          <NavLink
            to="/analytics"
            style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                textDecoration: 'none',
                color: isActive ? '#2563eb' : '#374151',
                background: isActive ? '#eff6ff' : 'transparent',
                marginBottom: '0.35rem',
                transition: 'all 0.2s',
              })}
            >
              <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>&#128200;</span>
            {sidebarOpen && <span style={{ fontWeight: 500 }}>Analytics</span>}
          </NavLink>
          <NavLink
            to="/document-library"
            style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                textDecoration: 'none',
                color: isActive ? '#2563eb' : '#374151',
                background: isActive ? '#eff6ff' : 'transparent',
                marginBottom: '0.35rem',
                transition: 'all 0.2s',
              })}
            >
              <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>&#128218;</span>
            {sidebarOpen && <span style={{ fontWeight: 500 }}>Document Library</span>}
          </NavLink>

          {/* Divider */}
          <div style={{ height: '1px', background: '#e5e7eb', margin: '0.75rem 0' }} />

          <NavLink
            to="/settings"
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              textDecoration: 'none',
              color: isActive ? '#2563eb' : '#374151',
              background: isActive ? '#eff6ff' : 'transparent',
              marginBottom: '0.35rem',
              transition: 'all 0.2s',
            })}
          >
            <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>&#9881;</span>
            {sidebarOpen && <span style={{ fontWeight: 500 }}>Settings</span>}
          </NavLink>
          {sidebarOpen && (
            <button
              onClick={logout}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                width: '100%',
                border: 'none',
                background: 'transparent',
                color: '#dc2626',
                fontSize: '0.9rem',
                fontWeight: 500,
                cursor: 'pointer',
                textAlign: 'left',
                marginTop: '0.5rem',
              }}
            >
              <span style={{ fontSize: '1.2rem' }}>&#128682;</span>
              Logout
            </button>
          )}
        </nav>

        {/* Footer when expanded */}
        {sidebarOpen && (
          <div
            style={{
              padding: '1rem',
              borderTop: '1px solid #e5e7eb',
              fontSize: '0.75rem',
              color: '#6b7280',
            }}
          >
            <div>{user?.email}</div>
            <div style={{ marginTop: '0.25rem' }}>{user?.role === 'admin' ? 'Admin' : 'Employee'}</div>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <main
          style={{
            flex: 1,
            padding: '2rem',
            background: '#ffffff',
            overflow: 'auto',
          }}
        >
          <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
            <Routes>
              <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/applications" element={<ProtectedRoute><ApplicationList /></ProtectedRoute>} />
              <Route path="/applications/:applicationId" element={<ProtectedRoute><ApplicationDetail /></ProtectedRoute>} />
              <Route path="/upload" element={<ProtectedRoute><Upload /></ProtectedRoute>} />
              <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
              <Route path="/document-library" element={<ProtectedRoute><DocumentLibrary /></ProtectedRoute>} />
              <Route path="/document-viewer/:applicationId" element={<ProtectedRoute><DocumentViewer /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
}
