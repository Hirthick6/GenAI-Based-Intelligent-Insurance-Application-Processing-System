import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getApplication, getValidation, getExtractedFields, getDocumentPdfUrl } from '../services/api';

const cardStyle = {
  background: '#fff',
  borderRadius: '12px',
  padding: '1.5rem',
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  border: '1px solid #e5e7eb',
};

const tabStyle = (active) => ({
  padding: '0.6rem 1.25rem',
  borderRadius: '8px 8px 0 0',
  fontSize: '0.9rem',
  fontWeight: 600,
  cursor: 'pointer',
  background: active ? '#fff' : '#f3f4f6',
  color: active ? '#2563eb' : '#6b7280',
  borderBottom: active ? '2px solid #2563eb' : '2px solid transparent',
  transition: 'all 0.2s',
});

export default function ApplicationDetail() {
  const { applicationId } = useParams();
  const [app, setApp] = useState(null);
  const [validation, setValidation] = useState(null);
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [selectedPage, setSelectedPage] = useState(null);

  useEffect(() => {
    Promise.all([
      getApplication(applicationId),
      getValidation(applicationId).catch(() => ({ data: null })),
      getExtractedFields(applicationId).catch(() => ({ data: [] })),
    ]).then(([appRes, valRes, fieldsRes]) => {
      setApp(appRes.data);
      setValidation(valRes.data);
      setFields(fieldsRes.data || []);
      if (appRes.data?.documents?.length > 0) {
        setSelectedDoc(appRes.data.documents[0]);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [applicationId]);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '4rem', color: '#9ca3af' }}>Loading application details...</div>;
  }

  if (!app) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <h2 style={{ color: '#dc2626' }}>Application not found</h2>
        <Link to="/applications" style={{ marginTop: '1rem', display: 'inline-block' }}>Back to Applications</Link>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link to="/applications" style={{ fontSize: '0.9rem', color: '#6b7280' }}>&larr; Back to Applications</Link>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: '0.5rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>{app.application_id}</h1>
            <p style={{ color: '#6b7280' }}>{app.email_subject || 'No subject'} &middot; {app.email_sender || ''}</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <SummaryCard label="Documents" value={app.total_documents} color="#2563eb" />
        <SummaryCard label="Total Pages" value={app.total_pages} color="#7c3aed" />
        <SummaryCard label="Confidence" value={`${app.confidence_score?.toFixed(1) || 0}%`} color="#059669" />
        <SummaryCard label="Application Extraction" value={`${app.extraction_percentage?.toFixed(2) || 0}%`} color="#f59e0b" />
        <SummaryCard label="Status" value={app.status} color={app.status === 'completed' ? '#059669' : '#d97706'} />
      </div>

      <div style={{ display: 'flex', gap: '0.25rem', borderBottom: '2px solid #e5e7eb', marginBottom: '1.5rem' }}>
        {['overview', 'documents', 'extracted', 'validation'].map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={tabStyle(activeTab === tab)}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && <OverviewTab app={app} />}
      {activeTab === 'documents' && (
        <DocumentsTab
          documents={app.documents}
          selectedDoc={selectedDoc}
          setSelectedDoc={setSelectedDoc}
          selectedPage={selectedPage}
          setSelectedPage={setSelectedPage}
        />
      )}
      {activeTab === 'extracted' && <ExtractedTab data={app.extracted_data} fields={fields} />}
      {activeTab === 'validation' && <ValidationTab validation={validation} summary={app.validation_summary} />}
    </div>
  );
}

function OverviewTab({ app }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
      <div style={cardStyle}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: '#374151' }}>Application Info</h3>
        <InfoRow label="Application ID" value={app.application_id} />
        <InfoRow label="Email Subject" value={app.email_subject || '-'} />
        <InfoRow label="Sender" value={app.email_sender || '-'} />
        <InfoRow label="Received" value={app.email_received_at ? new Date(app.email_received_at).toLocaleString() : '-'} />
        <InfoRow label="Created" value={new Date(app.created_at).toLocaleString()} />
      </div>

      <div style={cardStyle}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: '#374151' }}>Processing Summary</h3>
        <InfoRow label="Total Documents" value={app.total_documents} />
        <InfoRow label="Total Pages" value={app.total_pages} />
        <InfoRow label="Confidence Score" value={`${app.confidence_score?.toFixed(1) || 0}%`} />
        <InfoRow label="Application Extraction" value={`${app.extraction_percentage?.toFixed(2) || 0}%`} />
        <InfoRow label="Status" value={<StatusBadge status={app.status} />} />
        {app.error_message && (
          <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: '#fee2e2', borderRadius: '8px', color: '#dc2626', fontSize: '0.85rem' }}>
            Error: {app.error_message}
          </div>
        )}
      </div>

      <div style={{ ...cardStyle, gridColumn: 'span 2' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: '#374151' }}>Documents Breakdown</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
          {app.documents?.map((doc) => (
            <div key={doc.id} style={{
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '1rem',
              background: '#f9fafb',
            }}>
              <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.5rem' }}>{doc.filename}</div>
              <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem', color: '#6b7280' }}>
                <span>Type: <strong style={{ color: '#374151', textTransform: 'capitalize' }}>{doc.document_type?.replace(/_/g, ' ')}</strong></span>
                <span>Pages: <strong style={{ color: '#374151' }}>{doc.total_pages}</strong></span>
              </div>
              <div style={{ marginTop: '0.5rem' }}>
                <ConfidenceBar score={doc.confidence_score} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DocumentsTab({ documents, selectedDoc, setSelectedDoc, selectedPage, setSelectedPage }) {
  const [viewMode, setViewMode] = useState('images'); // 'pdf' or 'images'
  const [pdfLoading, setPdfLoading] = useState(true);
  const [pdfError, setPdfError] = useState(false);

  const pdfUrl = selectedDoc?.id ? getDocumentPdfUrl(selectedDoc.id) : null;

  useEffect(() => {
    if (selectedDoc && viewMode === 'pdf') {
      setPdfLoading(true);
      setPdfError(false);
    }
  }, [selectedDoc, viewMode]);

  const handlePdfLoad = () => {
    setPdfLoading(false);
    setPdfError(false);
  };

  const handlePdfError = () => {
    setPdfLoading(false);
    setPdfError(true);
  };

  const retryPdf = () => {
    setPdfLoading(true);
    setPdfError(false);
    const iframe = document.getElementById('doc-pdf-iframe');
    if (iframe) {
      iframe.src = iframe.src;
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '1.5rem', minHeight: '500px' }}>
      <div style={cardStyle}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '1rem' }}>Documents ({documents?.length || 0})</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {documents?.map((doc) => (
            <button
              key={doc.id}
              onClick={() => { setSelectedDoc(doc); setSelectedPage(null); }}
              style={{
                padding: '0.75rem',
                borderRadius: '8px',
                textAlign: 'left',
                background: selectedDoc?.id === doc.id ? '#dbeafe' : '#f9fafb',
                border: selectedDoc?.id === doc.id ? '2px solid #2563eb' : '2px solid transparent',
                transition: 'all 0.2s',
              }}
            >
              <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#111827', wordBreak: 'break-word' }}>{doc.filename}</div>
              <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem', textTransform: 'capitalize' }}>
                {doc.document_type?.replace(/_/g, ' ')} &middot; {doc.total_pages} pages
              </div>
            </button>
          ))}
        </div>
      </div>

      <div>
        {selectedDoc ? (
          <div>
            <div style={{ ...cardStyle, marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{selectedDoc.filename}</h3>
                  <span style={{
                    background: '#dbeafe',
                    color: '#2563eb',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    textTransform: 'capitalize',
                    marginTop: '0.25rem',
                    display: 'inline-block',
                  }}>
                    {selectedDoc.document_type?.replace(/_/g, ' ')}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => setViewMode('pdf')}
                    style={{
                      padding: '0.5rem 0.75rem',
                      borderRadius: '6px',
                      background: viewMode === 'pdf' ? '#2563eb' : '#f3f4f6',
                      color: viewMode === 'pdf' ? '#fff' : '#374151',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                    }}
                  >
                    PDF
                  </button>
                  <button
                    onClick={() => setViewMode('images')}
                    style={{
                      padding: '0.5rem 0.75rem',
                      borderRadius: '6px',
                      background: viewMode === 'images' ? '#2563eb' : '#f3f4f6',
                      color: viewMode === 'images' ? '#fff' : '#374151',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                    }}
                  >
                    Pages
                  </button>
                </div>
              </div>
            </div>

            {viewMode === 'pdf' ? (
              <div style={{ ...cardStyle, height: '600px', position: 'relative', padding: 0, overflow: 'hidden' }}>
                {pdfLoading && (
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', color: '#6b7280', zIndex: 10 }}>
                    <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>📄</div>
                    <p style={{ fontSize: '0.9rem', fontWeight: 500 }}>Loading PDF...</p>
                  </div>
                )}
                
                {pdfError && (
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', color: '#dc2626', zIndex: 10 }}>
                    <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>⚠️</div>
                    <p style={{ fontSize: '0.9rem', fontWeight: 500, marginBottom: '1rem' }}>Failed to load PDF</p>
                    <button
                      onClick={retryPdf}
                      style={{
                        padding: '0.5rem 1rem',
                        borderRadius: '6px',
                        background: '#2563eb',
                        color: '#fff',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                      }}
                    >
                      Retry
                    </button>
                    <button
                      onClick={() => setViewMode('images')}
                      style={{
                        padding: '0.5rem 1rem',
                        borderRadius: '6px',
                        background: '#6b7280',
                        color: '#fff',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        marginLeft: '0.5rem',
                      }}
                    >
                      View Pages
                    </button>
                  </div>
                )}

                {pdfUrl && (
                  <iframe
                    id="doc-pdf-iframe"
                    src={pdfUrl}
                    title="PDF Viewer"
                    onLoad={handlePdfLoad}
                    onError={handlePdfError}
                    style={{
                      width: '100%',
                      height: '100%',
                      border: 'none',
                      display: pdfLoading || pdfError ? 'none' : 'block',
                    }}
                  />
                )}
              </div>
            ) : (
              <>
                <div style={{ ...cardStyle, marginBottom: '1rem' }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.75rem' }}>Pages ({selectedDoc.pages?.length || 0})</h4>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {selectedDoc.pages?.map((page) => (
                      <button
                        key={page.id}
                        onClick={() => setSelectedPage(page)}
                        style={{
                          width: '50px',
                          height: '50px',
                          borderRadius: '8px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: selectedPage?.id === page.id ? '#2563eb' : '#f3f4f6',
                          color: selectedPage?.id === page.id ? '#fff' : '#374151',
                          border: selectedPage?.id === page.id ? '2px solid #1d4ed8' : '2px solid #e5e7eb',
                          fontWeight: 600,
                          fontSize: '0.85rem',
                          transition: 'all 0.2s',
                        }}
                      >
                        <span>{page.page_number}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {selectedPage ? (
                  <div style={cardStyle}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <h4 style={{ fontWeight: 600 }}>Page {selectedPage.page_number} - OCR Text</h4>
                      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                          Words: <strong>{selectedPage.word_count}</strong>
                        </span>
                      </div>
                    </div>

                    {selectedPage.image_path && (
                      <div style={{ marginBottom: '1rem' }}>
                        <img
                          src={selectedPage.image_path}
                          alt={`Page ${selectedPage.page_number}`}
                          style={{
                            maxWidth: '100%',
                            maxHeight: '400px',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            objectFit: 'contain',
                          }}
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      </div>
                    )}

                    {selectedPage.preprocessing_applied?.length > 0 && (
                      <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {selectedPage.preprocessing_applied.map((step) => (
                          <span key={step} style={{
                            background: '#f3f4f6',
                            color: '#4b5563',
                            padding: '0.2rem 0.5rem',
                            borderRadius: '4px',
                            fontSize: '0.7rem',
                            textTransform: 'capitalize',
                          }}>
                            {step.replace(/_/g, ' ')}
                          </span>
                        ))}
                      </div>
                    )}

                    <pre style={{
                      background: '#f9fafb',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      padding: '1rem',
                      fontSize: '0.85rem',
                      lineHeight: 1.6,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      maxHeight: '500px',
                      overflow: 'auto',
                      fontFamily: "'Courier New', monospace",
                    }}>
                      {selectedPage.ocr_text || 'No OCR text extracted for this page.'}
                    </pre>
                  </div>
                ) : (
                  <div style={{ ...cardStyle, textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>
                    Select a page above to view its OCR content
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          <div style={{ ...cardStyle, textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>
            Select a document from the sidebar
          </div>
        )}
      </div>
    </div>
  );
}

function ExtractedTab({ data, fields }) {
  const [showRawJson, setShowRawJson] = React.useState(false);
  const categories = data ? Object.keys(data).filter(k => k !== 'field_confidence') : [];

  return (
    <div>
      {/* Raw JSON Toggle - Moved to Top */}
      {data && Object.keys(data).length > 0 && (
        <div style={{ ...cardStyle, marginBottom: '1.5rem' }}>
          <button
            onClick={() => setShowRawJson(!showRawJson)}
            style={{
              padding: '0.5rem 1rem',
              background: '#2563eb',
              color: '#fff',
              borderRadius: '6px',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              marginBottom: showRawJson ? '1rem' : '0',
            }}
          >
            {showRawJson ? 'Hide' : 'Show'} Raw JSON
          </button>
          
          {showRawJson && (
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: '#374151' }}>
                Raw JSON Extracted Content
              </h3>
              <pre style={{
                background: '#1f2937',
                color: '#e5e7eb',
                padding: '1rem',
                borderRadius: '8px',
                fontSize: '0.8rem',
                lineHeight: 1.5,
                overflow: 'auto',
                maxHeight: '400px',
                fontFamily: "'Monaco', 'Menlo', monospace",
              }}>
                {JSON.stringify(data, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Categorized Fields Display */}
      {categories.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
          {categories.map((category) => {
            // Filter out "Not Available" values
            const categoryData = data[category];
            const filteredEntries = typeof categoryData === 'object' && !Array.isArray(categoryData)
              ? Object.entries(categoryData).filter(([key, value]) => {
                  const strValue = String(value || '').trim().toLowerCase();
                  return strValue && strValue !== 'not available' && strValue !== '-' && strValue !== 'null';
                })
              : [];

            // Skip category if no valid fields
            if (filteredEntries.length === 0 && typeof categoryData === 'object' && !Array.isArray(categoryData)) {
              return null;
            }

            return (
              <div key={category} style={cardStyle}>
                <h3 style={{
                  fontSize: '1rem',
                  fontWeight: 600,
                  marginBottom: '1rem',
                  textTransform: 'capitalize',
                  color: '#374151',
                  borderBottom: '2px solid #e5e7eb',
                  paddingBottom: '0.5rem',
                }}>
                  {category.replace(/_/g, ' ')}
                </h3>

                {filteredEntries.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {filteredEntries.map(([key, value]) => (
                      <div key={key} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '0.5rem 0',
                        borderBottom: '1px solid #f3f4f6',
                      }}>
                        <span style={{
                          fontSize: '0.85rem',
                          color: '#6b7280',
                          textTransform: 'capitalize',
                        }}>
                          {key.replace(/_/g, ' ')}
                        </span>
                        <span style={{
                          fontSize: '0.85rem',
                          fontWeight: 500,
                          color: '#111827',
                          textAlign: 'right',
                          maxWidth: '60%',
                        }}>
                          {Array.isArray(value) ? value.join(', ') : String(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <pre style={{
                    fontSize: '0.85rem',
                    whiteSpace: 'pre-wrap',
                    background: '#f9fafb',
                    padding: '0.75rem',
                    borderRadius: '6px',
                    border: '1px solid #e5e7eb',
                  }}>
                    {JSON.stringify(categoryData, null, 2)}
                  </pre>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* All Extracted Fields Table */}
      {fields.length > 0 && (
        <div style={cardStyle}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>All Extracted Fields ({fields.filter(f => {
            const strValue = String(f.field_value || '').trim().toLowerCase();
            return strValue && strValue !== 'not available' && strValue !== '-' && strValue !== 'null';
          }).length})</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                <th style={{ textAlign: 'left', padding: '0.75rem', fontSize: '0.85rem', color: '#6b7280', fontWeight: 600 }}>Field</th>
                <th style={{ textAlign: 'left', padding: '0.75rem', fontSize: '0.85rem', color: '#6b7280', fontWeight: 600 }}>Value</th>
                <th style={{ textAlign: 'left', padding: '0.75rem', fontSize: '0.85rem', color: '#6b7280', fontWeight: 600 }}>Category</th>
              </tr>
            </thead>
            <tbody>
              {fields.filter(f => {
                const strValue = String(f.field_value || '').trim().toLowerCase();
                return strValue && strValue !== 'not available' && strValue !== '-' && strValue !== 'null';
              }).map((f, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '0.75rem', fontSize: '0.85rem', fontWeight: 500, color: '#111827' }}>{f.field_name}</td>
                  <td style={{ padding: '0.75rem', fontSize: '0.85rem', color: '#374151' }}>{f.field_value}</td>
                  <td style={{ padding: '0.75rem', fontSize: '0.85rem', color: '#6b7280', textTransform: 'capitalize' }}>{f.field_category}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* No Data Message */}
      {!categories.length && !fields.length && (
        <div style={{ ...cardStyle, textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>
          No extracted data available
        </div>
      )}
    </div>
  );
}

function ValidationTab({ validation, summary }) {
  if (!validation && !summary) {
    return <div style={{ ...cardStyle, textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>No validation data available</div>;
  }

  const v = validation || {};

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <SummaryCard label="Total Checks" value={v.total_checks || summary?.total_checks || 0} color="#2563eb" />
        <SummaryCard label="Passed" value={v.passed_checks || summary?.passed_checks || 0} color="#059669" />
        <SummaryCard label="Failed" value={v.failed_checks || 0} color="#dc2626" />
        <SummaryCard label="Warnings" value={v.warnings || 0} color="#d97706" />
      </div>

      {(summary?.missing_documents?.length > 0 || summary?.missing_fields?.length > 0) && (
        <div style={{ ...cardStyle, marginBottom: '1.5rem', borderLeft: '4px solid #dc2626' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem', color: '#dc2626' }}>Missing Items</h3>
          {summary?.missing_documents?.length > 0 && (
            <div style={{ marginBottom: '0.5rem' }}>
              <strong style={{ fontSize: '0.85rem' }}>Missing Documents: </strong>
              {summary.missing_documents.map((d) => (
                <span key={d} style={{
                  background: '#fee2e2', color: '#dc2626', padding: '0.15rem 0.5rem',
                  borderRadius: '4px', fontSize: '0.8rem', marginRight: '0.5rem', textTransform: 'capitalize',
                }}>
                  {d.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          )}
          {summary?.missing_fields?.length > 0 && (
            <div>
              <strong style={{ fontSize: '0.85rem' }}>Missing Fields: </strong>
              {summary.missing_fields.map((f) => (
                <span key={f} style={{
                  background: '#fef3c7', color: '#d97706', padding: '0.15rem 0.5rem',
                  borderRadius: '4px', fontSize: '0.8rem', marginRight: '0.5rem',
                }}>
                  {f}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {v.results?.length > 0 && (
        <div style={cardStyle}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Validation Results</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {v.results.map((r, i) => (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.6rem 0.75rem',
                borderRadius: '6px',
                background: r.passed ? '#f0fdf4' : r.severity === 'error' ? '#fef2f2' : '#fffbeb',
                border: `1px solid ${r.passed ? '#bbf7d0' : r.severity === 'error' ? '#fecaca' : '#fde68a'}`,
              }}>
                <span style={{ fontSize: '1.1rem' }}>
                  {r.passed ? '\u2705' : r.severity === 'error' ? '\u274C' : '\u26A0\uFE0F'}
                </span>
                <span style={{ flex: 1, fontSize: '0.85rem' }}>{r.message}</span>
                <span style={{
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  fontWeight: 600,
                  color: r.severity === 'error' ? '#dc2626' : r.severity === 'warning' ? '#d97706' : '#059669',
                }}>
                  {r.severity}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid #f3f4f6' }}>
      <span style={{ fontSize: '0.85rem', color: '#6b7280', textTransform: 'capitalize' }}>{label}</span>
      <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#111827', textAlign: 'right', maxWidth: '60%' }}>{value}</span>
    </div>
  );
}

function SummaryCard({ label, value, color }) {
  return (
    <div style={{
      ...cardStyle,
      borderTop: `4px solid ${color}`,
      textAlign: 'center',
    }}>
      <div style={{ fontSize: '0.75rem', color: '#9ca3af', textTransform: 'uppercase', fontWeight: 500, letterSpacing: '0.05em' }}>{label}</div>
      <div style={{ fontSize: '1.5rem', fontWeight: 700, color, marginTop: '0.25rem', textTransform: 'capitalize' }}>{value}</div>
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
      background: c.bg, color: c.text, padding: '0.3rem 0.8rem', borderRadius: '12px',
      fontSize: '0.85rem', fontWeight: 600, textTransform: 'capitalize',
    }}>
      {status}
    </span>
  );
}

function ConfidenceBar({ score }) {
  const color = score >= 80 ? '#059669' : score >= 50 ? '#d97706' : '#dc2626';
  return (
    <div style={{ marginTop: '0.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#9ca3af', marginBottom: '0.15rem' }}>
        <span>Confidence</span>
        <span style={{ color, fontWeight: 600 }}>{score?.toFixed(1) || 0}%</span>
      </div>
      <div style={{ height: '4px', background: '#e5e7eb', borderRadius: '2px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${score || 0}%`, background: color, borderRadius: '2px', transition: 'width 0.5s ease' }} />
      </div>
    </div>
  );
}
