import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getApplication, getExtractedFields, chatWithDocument, updateExtractedField } from '../services/api';

const cardStyle = {
  background: '#fff',
  borderRadius: '12px',
  padding: '1.5rem',
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  border: '1px solid #e5e7eb',
};

export default function DocumentViewer() {
  const { applicationId } = useParams();
  const [app, setApp] = useState(null);
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('chat');
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [selectedPage, setSelectedPage] = useState(null);
  
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    Promise.all([
      getApplication(applicationId),
      getExtractedFields(applicationId).catch(() => ({ data: [] })),
    ]).then(([appRes, fieldsRes]) => {
      setApp(appRes.data);
      setFields(fieldsRes.data || []);
      if (appRes.data?.documents?.length > 0) {
        setSelectedDoc(appRes.data.documents[0]);
        if (appRes.data.documents[0].pages?.length > 0) {
          setSelectedPage(appRes.data.documents[0].pages[0]);
        }
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [applicationId]);

  const [chatLoading, setChatLoading] = useState(false);

  const handleChatSend = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const question = chatInput.trim();
    setChatMessages(prev => [...prev, { role: 'user', content: question }]);
    setChatInput('');
    setChatLoading(true);
    try {
      const res = await chatWithDocument(applicationId, question);
      const answer = res.data?.answer || 'No response received.';
      setChatMessages(prev => [...prev, { role: 'assistant', content: answer }]);
    } catch (err) {
      const errMsg = err.response?.data?.detail || 'Failed to get a response. Please try again.';
      setChatMessages(prev => [...prev, { role: 'assistant', content: errMsg }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleSearch = () => {
    if (!searchQuery.trim() || !selectedPage) return;
    const text = selectedPage.ocr_text || '';
    const query = searchQuery.toLowerCase();
    const results = [];
    let index = text.toLowerCase().indexOf(query);
    while (index !== -1) {
      results.push({
        text: text.substring(Math.max(0, index - 50), Math.min(text.length, index + query.length + 50)),
        position: index,
      });
      index = text.toLowerCase().indexOf(query, index + 1);
    }
    setSearchResults(results);
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '4rem', color: '#9ca3af' }}>Loading...</div>;
  }

  if (!app) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <h2 style={{ color: '#dc2626' }}>Document not found</h2>
        <Link to="/document-library">Back to Library</Link>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link to="/document-library" style={{ fontSize: '0.9rem', color: '#6b7280', textDecoration: 'none' }}>
          &larr; Back to Library
        </Link>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '0.5rem', marginBottom: 0 }}>
          {app.application_id}
        </h1>
      </div>

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '70% 30%', gap: '1.5rem', minHeight: 0 }}>
        <PDFPreview
          documents={app.documents}
          selectedDoc={selectedDoc}
          setSelectedDoc={setSelectedDoc}
          selectedPage={selectedPage}
          setSelectedPage={setSelectedPage}
          app={app}
        />
        <InteractionPanel
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          chatMessages={chatMessages}
          chatInput={chatInput}
          setChatInput={setChatInput}
          handleChatSend={handleChatSend}
          chatLoading={chatLoading}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          handleSearch={handleSearch}
          searchResults={searchResults}
          fields={fields}
          extractedData={app.extracted_data}
          editingField={editingField}
          editValue={editValue}
          setEditValue={setEditValue}
          handleEditField={(field) => { setEditingField(field); setEditValue(field.field_value || String(field.value || '')); setSaveError(''); }}
          handleSaveEdit={async () => {
            if (!editingField) return;
            const [category, field] = editingField.field_name.split('.');
            try {
              await updateExtractedField(applicationId, category, field, editValue);
              // Update local app state so chat also sees the new value
              setApp(prev => ({
                ...prev,
                extracted_data: {
                  ...prev.extracted_data,
                  [category]: {
                    ...prev.extracted_data[category],
                    [field]: editValue,
                  },
                },
              }));
              setEditingField(null);
              setSaveError('');
            } catch {
              setSaveError('Save failed. Please try again.');
            }
          }}
          saveError={saveError}
        />
      </div>
    </div>
  );
}

function PDFPreview({ documents, selectedDoc, setSelectedDoc, selectedPage, setSelectedPage, app }) {
  const [showFallback, setShowFallback] = useState(true);

  useEffect(() => {
    if (selectedDoc) {
      setShowFallback(true);
    }
  }, [selectedDoc]);

  return (
    <div style={{ ...cardStyle, display: 'flex', flexDirection: 'column', height: '100%', padding: '1rem' }}>
      {documents && documents.length > 1 && (
        <select
          value={selectedDoc?.id || ''}
          onChange={(e) => {
            const doc = documents.find(d => d.id === e.target.value);
            setSelectedDoc(doc);
            if (doc?.pages?.length > 0) setSelectedPage(doc.pages[0]);
          }}
          style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #e5e7eb', marginBottom: '1rem' }}
        >
          {documents.map(doc => <option key={doc.id} value={doc.id}>{doc.filename}</option>)}
        </select>
      )}

      {showFallback && (
        <div style={{
          padding: '1rem',
          marginBottom: '1rem',
          background: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderRadius: '8px',
          color: '#1e40af',
          fontSize: '0.9rem',
          fontWeight: 500,
          textAlign: 'center',
        }}>
          ℹ️ Showing extracted document information
        </div>
      )}

      {showFallback && app ? (
        <div style={{ flex: 1, overflow: 'auto' }}>
          <FallbackDocumentView app={app} selectedDoc={selectedDoc} />
        </div>
      ) : !selectedDoc ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📄</div>
            <p>No document selected</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}


function InteractionPanel({ activeTab, setActiveTab, chatMessages, chatInput, setChatInput, handleChatSend, chatLoading, searchQuery, setSearchQuery, handleSearch, searchResults, fields, extractedData, editingField, editValue, setEditValue, handleEditField, handleSaveEdit, saveError }) {
  const tabs = [
    { id: 'chat', label: 'Chat', icon: '💬' },
    { id: 'search', label: 'Search', icon: '🔍' },
    { id: 'extracted', label: 'Data', icon: '📋' },
    { id: 'entities', label: 'Entities', icon: '🏷️' },
  ];

  return (
    <div style={{ ...cardStyle, display: 'flex', flexDirection: 'column', height: '100%', padding: '1rem' }}>
      <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1rem', borderBottom: '2px solid #e5e7eb', paddingBottom: '0.5rem' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1,
              padding: '0.5rem',
              borderRadius: '6px 6px 0 0',
              background: activeTab === tab.id ? '#eff6ff' : 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: 600,
              color: activeTab === tab.id ? '#2563eb' : '#6b7280',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.35rem',
            }}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {activeTab === 'chat' && <ChatTab messages={chatMessages} input={chatInput} setInput={setChatInput} onSend={handleChatSend} loading={chatLoading} />}
        {activeTab === 'search' && <SearchTab query={searchQuery} setQuery={setSearchQuery} onSearch={handleSearch} results={searchResults} />}
        {activeTab === 'extracted' && <ExtractedTab data={extractedData} fields={fields} editingField={editingField} editValue={editValue} setEditValue={setEditValue} onEdit={handleEditField} onSave={handleSaveEdit} saveError={saveError} />}
        {activeTab === 'entities' && <EntitiesTab data={extractedData} />}
      </div>
    </div>
  );
}

function ChatTab({ messages, input, setInput, onSend, loading }) {
  const quickSuggestions = [
    "What is the sum assured?",
    "Who is the nominee?",
    "What is the policy term?",
    "Show applicant details"
  ];

  const handleSuggestionClick = (suggestion) => {
    setInput(suggestion);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Input Box at Top */}
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && input.trim() && !loading && onSend()}
            placeholder="Ask something about this document..."
            disabled={loading}
            style={{ 
              flex: 1, 
              padding: '0.75rem', 
              borderRadius: '8px', 
              border: '1px solid #e5e7eb', 
              fontSize: '0.85rem',
              outline: 'none',
              transition: 'border-color 0.2s',
            }}
            onFocus={(e) => e.target.style.borderColor = '#2563eb'}
            onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
          />
          <button 
            onClick={onSend} 
            disabled={!input.trim() || loading}
            style={{ 
              padding: '0.75rem 1.25rem', 
              borderRadius: '8px', 
              background: input.trim() && !loading ? '#2563eb' : '#9ca3af', 
              color: '#fff', 
              border: 'none', 
              cursor: input.trim() && !loading ? 'pointer' : 'not-allowed', 
              fontSize: '0.85rem', 
              fontWeight: 600,
              transition: 'background 0.2s',
            }}
          >
            {loading ? '...' : 'Send'}
          </button>
        </div>

        {/* Quick Suggestions */}
        {messages.length === 0 && (
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {quickSuggestions.map((suggestion, i) => (
              <button
                key={i}
                onClick={() => handleSuggestionClick(suggestion)}
                style={{
                  padding: '0.4rem 0.75rem',
                  borderRadius: '16px',
                  background: '#f3f4f6',
                  border: '1px solid #e5e7eb',
                  color: '#374151',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#e5e7eb';
                  e.target.style.borderColor = '#d1d5db';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = '#f3f4f6';
                  e.target.style.borderColor = '#e5e7eb';
                }}
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Messages Area - Scrollable */}
      <div style={{ flex: 1, overflow: 'auto', paddingRight: '0.5rem' }}>
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#9ca3af' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>💬</div>
            <p style={{ fontSize: '0.9rem', fontWeight: 500 }}>Start a conversation</p>
            <p style={{ fontSize: '0.75rem', marginTop: '0.5rem', color: '#9ca3af' }}>
              Ask questions about the document content
            </p>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} style={{ marginBottom: '1rem', padding: '0.75rem', borderRadius: '8px', background: msg.role === 'user' ? '#eff6ff' : '#f9fafb', border: `1px solid ${msg.role === 'user' ? '#dbeafe' : '#e5e7eb'}` }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 600, marginBottom: '0.35rem', color: '#6b7280', textTransform: 'uppercase' }}>
                {msg.role === 'user' ? 'You' : 'AI'}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#111827', lineHeight: 1.5 }}>{msg.content}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function SearchTab({ query, setQuery, onSearch, results }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && query.trim() && onSearch()}
            placeholder="Search for keywords in document..."
            style={{ 
              flex: 1, 
              padding: '0.75rem', 
              borderRadius: '8px', 
              border: '1px solid #e5e7eb', 
              fontSize: '0.85rem',
              outline: 'none',
              transition: 'border-color 0.2s',
            }}
            onFocus={(e) => e.target.style.borderColor = '#2563eb'}
            onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
          />
          <button 
            onClick={onSearch}
            disabled={!query.trim()}
            style={{ 
              padding: '0.75rem 1.25rem', 
              borderRadius: '8px', 
              background: query.trim() ? '#2563eb' : '#9ca3af', 
              color: '#fff', 
              border: 'none', 
              cursor: query.trim() ? 'pointer' : 'not-allowed', 
              fontSize: '0.85rem', 
              fontWeight: 600,
              transition: 'background 0.2s',
            }}
          >
            Search
          </button>
        </div>
      </div>
      <div style={{ flex: 1, overflow: 'auto', paddingRight: '0.5rem' }}>
        {results.length > 0 ? (
          <div>
            <div style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '0.75rem' }}>{results.length} match{results.length !== 1 ? 'es' : ''}</div>
            {results.map((result, i) => (
              <div key={i} style={{ padding: '0.75rem', marginBottom: '0.5rem', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '6px', fontSize: '0.8rem' }}>
                ...{result.text}...
              </div>
            ))}
          </div>
        ) : query ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>No matches</div>
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🔍</div>
            <p style={{ fontSize: '0.9rem', fontWeight: 500 }}>Search document content</p>
            <p style={{ fontSize: '0.75rem', marginTop: '0.5rem', color: '#9ca3af' }}>
              Enter keywords to find in the document
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function ExtractedTab({ data, fields, editingField, editValue, setEditValue, onEdit, onSave, saveError }) {
  const categories = data ? Object.keys(data).filter(k => k !== 'field_confidence') : [];
  return (
    <div style={{ height: '100%', overflow: 'auto', paddingRight: '0.5rem' }}>
      {categories.length > 0 ? categories.map(category => (
        <div key={category} style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.75rem', textTransform: 'capitalize', color: '#374151', borderBottom: '2px solid #e5e7eb', paddingBottom: '0.5rem' }}>
            {category.replace(/_/g, ' ')}
          </h3>
          {typeof data[category] === 'object' && !Array.isArray(data[category]) && Object.entries(data[category])
            .filter(([k, v]) => {
              const s = String(v || '').trim().toLowerCase();
              return s && s !== 'not available' && s !== '-' && s !== 'null';
            })
            .map(([key, value]) => {
              const field = fields.find(f => f.field_name === `${category}.${key}`);
              const isEditing = editingField?.field_name === `${category}.${key}`;
              return (
                <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid #f3f4f6', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.8rem', color: '#6b7280', textTransform: 'capitalize', minWidth: '100px' }}>
                    {key.replace(/_/g, ' ')}
                  </span>
                  {isEditing ? (
                    <div style={{ display: 'flex', gap: '0.5rem', flex: 1, flexDirection: 'column' }}>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input type="text" value={editValue} onChange={(e) => setEditValue(e.target.value)} style={{ flex: 1, padding: '0.35rem 0.5rem', borderRadius: '4px', border: '1px solid #e5e7eb', fontSize: '0.8rem' }} />
                        <button onClick={onSave} style={{ padding: '0.35rem 0.75rem', borderRadius: '4px', background: '#059669', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>Save</button>
                      </div>
                      {saveError && <span style={{ fontSize: '0.7rem', color: '#dc2626' }}>{saveError}</span>}
                    </div>
                  ) : (
                    <>
                      <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#111827', flex: 1, textAlign: 'right' }}>{String(value)}</span>
                      <button onClick={() => onEdit(field || { field_name: `${category}.${key}`, field_value: value })} style={{ padding: '0.35rem 0.5rem', borderRadius: '4px', background: '#f3f4f6', border: 'none', cursor: 'pointer', fontSize: '0.7rem', color: '#6b7280' }}>Edit</button>
                    </>
                  )}
                </div>
              );
            })}
        </div>
      )) : (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📋</div>
          <p>No data</p>
        </div>
      )}
    </div>
  );
}

function EntitiesTab({ data }) {
  const entities = { 'Person Names': [], 'Dates': [], 'Amounts': [], 'Locations': [] };
  if (data) {
    if (data.applicant?.full_name) entities['Person Names'].push(data.applicant.full_name);
    if (data.nominee?.name) entities['Person Names'].push(data.nominee.name);
    if (data.applicant?.date_of_birth) entities['Dates'].push(data.applicant.date_of_birth);
    if (data.insurance?.sum_assured) entities['Amounts'].push(`Sum: ${data.insurance.sum_assured}`);
    if (data.insurance?.premium_amount) entities['Amounts'].push(`Premium: ${data.insurance.premium_amount}`);
    if (data.contact?.city) entities['Locations'].push(data.contact.city);
    if (data.contact?.state) entities['Locations'].push(data.contact.state);
  }
  return (
    <div style={{ height: '100%', overflow: 'auto', paddingRight: '0.5rem' }}>
      {Object.entries(entities).map(([category, items]) => items.length > 0 && (
        <div key={category} style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.75rem', color: '#374151' }}>{category}</h3>
          {items.map((item, i) => (
            <div key={i} style={{ padding: '0.5rem 0.75rem', marginBottom: '0.5rem', background: '#f3f4f6', borderRadius: '6px', fontSize: '0.8rem', color: '#111827' }}>
              {item}
            </div>
          ))}
        </div>
      ))}
      {Object.values(entities).every(arr => arr.length === 0) && (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🏷️</div>
          <p>No entities</p>
        </div>
      )}
    </div>
  );
}

function FallbackDocumentView({ app, selectedDoc }) {
  const InfoRow = ({ label, value }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #f3f4f6' }}>
      <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>{label}</span>
      <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#111827', textAlign: 'right', maxWidth: '60%' }}>{value}</span>
    </div>
  );

  const ConfidenceBar = ({ score }) => {
    const color = score >= 80 ? '#059669' : score >= 50 ? '#d97706' : '#dc2626';
    return (
      <div style={{ marginTop: '0.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#9ca3af', marginBottom: '0.25rem' }}>
          <span>Confidence</span>
          <span style={{ color, fontWeight: 600 }}>{score?.toFixed(1) || 0}%</span>
        </div>
        <div style={{ height: '6px', background: '#e5e7eb', borderRadius: '3px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${score || 0}%`, background: color, borderRadius: '3px', transition: 'width 0.5s ease' }} />
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '0.5rem' }}>
      {/* Application Info */}
      <div style={cardStyle}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: '#374151', borderBottom: '2px solid #e5e7eb', paddingBottom: '0.5rem' }}>
          Application Info
        </h3>
        <InfoRow label="Application ID" value={app.application_id} />
        <InfoRow label="Email Subject" value={app.email_subject || '-'} />
        <InfoRow label="Sender" value={app.email_sender || '-'} />
        <InfoRow label="Received" value={app.email_received_at ? new Date(app.email_received_at).toLocaleString() : '-'} />
        <InfoRow label="Created" value={new Date(app.created_at).toLocaleString()} />
      </div>

      {/* Processing Summary */}
      <div style={cardStyle}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: '#374151', borderBottom: '2px solid #e5e7eb', paddingBottom: '0.5rem' }}>
          Processing Summary
        </h3>
        <InfoRow label="Total Documents" value={app.total_documents} />
        <InfoRow label="Total Pages" value={app.total_pages} />
        <InfoRow label="Confidence Score" value={`${app.confidence_score?.toFixed(1) || 0}%`} />
        <InfoRow label="Application Extraction" value={`${app.extraction_percentage?.toFixed(2) || 0}%`} />
        <InfoRow 
          label="Status" 
          value={
            <span style={{
              padding: '0.25rem 0.75rem',
              borderRadius: '12px',
              fontSize: '0.75rem',
              fontWeight: 600,
              background: app.status === 'completed' ? '#d1fae5' : '#dbeafe',
              color: app.status === 'completed' ? '#059669' : '#2563eb',
              textTransform: 'capitalize',
            }}>
              {app.status}
            </span>
          } 
        />
      </div>

      {/* Documents Breakdown */}
      <div style={cardStyle}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: '#374151', borderBottom: '2px solid #e5e7eb', paddingBottom: '0.5rem' }}>
          Documents Breakdown
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {app.documents?.map((doc) => (
            <div 
              key={doc.id} 
              style={{
                border: selectedDoc?.id === doc.id ? '2px solid #2563eb' : '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '1rem',
                background: selectedDoc?.id === doc.id ? '#eff6ff' : '#f9fafb',
                transition: 'all 0.2s',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.5rem', color: '#111827', wordBreak: 'break-word' }}>
                    {doc.filename}
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem', color: '#6b7280', flexWrap: 'wrap' }}>
                    <span>
                      Type: <strong style={{ color: '#374151', textTransform: 'capitalize' }}>
                        {doc.document_type?.replace(/_/g, ' ') || 'Other'}
                      </strong>
                    </span>
                    <span>
                      Pages: <strong style={{ color: '#374151' }}>{doc.total_pages}</strong>
                    </span>
                  </div>
                </div>
              </div>
              <ConfidenceBar score={doc.confidence_score} />
            </div>
          ))}
        </div>
      </div>

      {/* OCR Text Preview (if available) */}
      {selectedDoc?.ocr_text && (
        <div style={cardStyle}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: '#374151', borderBottom: '2px solid #e5e7eb', paddingBottom: '0.5rem' }}>
            Extracted Text Preview
          </h3>
          <pre style={{
            background: '#f9fafb',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '1rem',
            fontSize: '0.8rem',
            lineHeight: 1.6,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            maxHeight: '300px',
            overflow: 'auto',
            fontFamily: "'Courier New', monospace",
          }}>
            {selectedDoc.ocr_text.substring(0, 1000)}{selectedDoc.ocr_text.length > 1000 ? '...' : ''}
          </pre>
        </div>
      )}
    </div>
  );
}
