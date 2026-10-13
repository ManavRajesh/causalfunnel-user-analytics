import React, { useState } from 'react';
import { 
  Users, Search, Clock, MousePointer, Globe, Copy, Check, 
  ExternalLink, ArrowRight, CornerDownRight, Layers, Code, ChevronDown, ChevronUp 
} from 'lucide-react';

export default function SessionsView({ 
  sessions, 
  selectedSessionId, 
  sessionJourney, 
  isLoadingJourney, 
  onSelectSession 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [showJson, setShowJson] = useState(false);

  const filteredSessions = sessions.filter((s) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      s.sessionId.toLowerCase().includes(term) ||
      (s.entryPage && s.entryPage.toLowerCase().includes(term)) ||
      (s.pagesVisited && s.pagesVisited.some((p) => p.toLowerCase().includes(term)))
    );
  });

  const copyToClipboard = (text, e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatDuration = (seconds) => {
    if (!seconds || seconds <= 0) return '< 1s';
    if (seconds < 60) return `${seconds.toFixed(0)}s`;
    const m = Math.floor(seconds / 60);
    const s = Math.round(seconds % 60);
    return `${m}m ${s}s`;
  };

  const formatTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="sessions-layout">
      {/* 1. Left Panel: Sessions List */}
      <div className="sessions-list-panel">
        <div className="panel-filter-bar">
          <Search size={15} style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="search-input"
            placeholder="Filter sessions by ID or page URL..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
            {filteredSessions.length} session{filteredSessions.length === 1 ? '' : 's'}
          </span>
        </div>

        <div className="session-cards-scroll">
          {filteredSessions.length > 0 ? (
            filteredSessions.map((s) => {
              const isSelected = selectedSessionId === s.sessionId;
              return (
                <div
                  key={s.sessionId}
                  className={`session-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => onSelectSession(s.sessionId)}
                >
                  <div className="session-item-top">
                    <span className="session-id-tag">
                      <span>{s.sessionId.substring(0, 14)}...</span>
                      <button
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
                        onClick={(e) => copyToClipboard(s.sessionId, e)}
                        title="Copy full session ID"
                      >
                        {copiedId === s.sessionId ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                      </button>
                    </span>

                    <span className="badge-event-count">
                      {s.totalEvents} event{s.totalEvents === 1 ? '' : 's'}
                    </span>
                  </div>

                  <div className="session-item-details">
                    <span title="Total Page Views">
                      <Globe size={13} style={{ color: '#38bdf8' }} />
                      <span>{s.pageViews} PV</span>
                    </span>
                    <span title="Total Clicks">
                      <MousePointer size={13} style={{ color: '#c084fc' }} />
                      <span>{s.clicks} Clicks</span>
                    </span>
                    <span title="Session Duration">
                      <Clock size={13} style={{ color: '#f59e0b' }} />
                      <span>{formatDuration(s.durationSeconds)}</span>
                    </span>
                  </div>

                  {s.entryPage && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.72rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <span style={{ color: '#64748b' }}>Entry:</span> {s.entryPage.replace(/http:\/\/[^/]+/, '')}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div style={{ padding: '3rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No matching sessions found.
            </div>
          )}
        </div>
      </div>

      {/* 2. Right Panel: User Journey Timeline */}
      <div className="journey-panel">
        {selectedSessionId ? (
          <div>
            <div className="journey-header">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ flex: 1, minWidth: '240px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', color: '#fff', margin: 0 }}>
                      User Journey
                    </h3>
                    <span className="session-id-tag" style={{ background: 'rgba(255,255,255,0.06)', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.78rem' }}>
                      {selectedSessionId}
                    </span>
                  </div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '0.4rem' }}>
                    Chronological trace of events and interactions during this user session.
                  </p>
                </div>

                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => setShowJson(!showJson)}
                  title="Toggle raw JSON payload"
                >
                  <Code size={13} />
                  <span>{showJson ? 'Hide JSON' : 'Raw JSON'}</span>
                  {showJson ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </button>
              </div>

              {sessionJourney?.summary && (
                <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1rem', flexWrap: 'wrap', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Duration: </span>
                    <strong style={{ color: '#fff' }}>{formatDuration(sessionJourney.summary.durationSeconds)}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Events: </span>
                    <strong style={{ color: '#818cf8' }}>{sessionJourney.summary.totalEvents}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Clicks: </span>
                    <strong style={{ color: '#c084fc' }}>{sessionJourney.summary.totalClicks}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Pages Visited: </span>
                    <strong style={{ color: '#38bdf8' }}>{sessionJourney.summary.uniquePages?.length || 1}</strong>
                  </div>
                </div>
              )}
            </div>

            {/* Raw JSON viewer */}
            {showJson && (
              <div className="code-snippet-box" style={{ maxHeight: '250px', marginBottom: '1.5rem' }}>
                <pre>{JSON.stringify(sessionJourney, null, 2)}</pre>
              </div>
            )}

            {/* Timeline Stream */}
            {isLoadingJourney ? (
              <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                Loading session journey events...
              </div>
            ) : sessionJourney?.events && sessionJourney.events.length > 0 ? (
              <div className="timeline">
                {sessionJourney.events.map((ev, idx) => {
                  const isPageView = ev.eventType === 'page_view';
                  return (
                    <div key={ev._id || idx} className="timeline-step">
                      <div className={`step-marker ${isPageView ? 'marker-pageview' : 'marker-click'}`}>
                        {isPageView ? <Globe size={14} /> : <MousePointer size={14} />}
                      </div>

                      <div className="step-card">
                        <div className="step-meta-row">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8' }}>
                              STEP {ev.stepNumber || idx + 1}
                            </span>
                            <span className={`step-type-badge ${isPageView ? 'badge-pv' : 'badge-ck'}`}>
                              {ev.eventType}
                            </span>
                          </div>

                          <div className="step-time-delta">
                            {formatTime(ev.timestamp)}
                            {ev.deltaSeconds > 0 && (
                              <span style={{ marginLeft: '0.5rem', color: '#818cf8' }}>
                                (+{ev.deltaSeconds}s)
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Event Details */}
                        {isPageView ? (
                          <div>
                            <div className="step-main-text">
                              {ev.metadata?.pageTitle || 'Page Navigation'}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: '0.2rem' }}>
                              {ev.pageUrl}
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="step-main-text">
                              Clicked {ev.metadata?.elementText ? `"${ev.metadata.elementText}"` : ev.metadata?.elementTag || 'Element'}
                            </div>
                            {ev.metadata?.elementId && (
                              <div style={{ fontSize: '0.75rem', color: '#a5b4fc', fontFamily: 'var(--font-mono)' }}>
                                #{ev.metadata.elementId} {ev.metadata.elementClass ? `.${ev.metadata.elementClass}` : ''}
                              </div>
                            )}

                            {/* Coordinates */}
                            <div className="step-coordinates">
                              <span>Position: X: {ev.x}px, Y: {ev.y}px</span>
                              {ev.xPercent !== null && (
                                <span style={{ color: '#38bdf8' }}>
                                  ({ev.xPercent}% / {ev.yPercent}%)
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                No events recorded for this session.
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '400px', color: 'var(--text-muted)', textAlign: 'center' }}>
            <Layers size={48} style={{ opacity: 0.3, marginBottom: '1rem', color: '#6366f1' }} />
            <h4 style={{ color: '#fff', fontSize: '1.1rem', marginBottom: '0.5rem' }}>Select a Session to View Journey</h4>
            <p style={{ maxWidth: '360px', fontSize: '0.85rem' }}>
              Click any session from the left list to inspect its ordered timeline, navigation steps, and click interactions.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
