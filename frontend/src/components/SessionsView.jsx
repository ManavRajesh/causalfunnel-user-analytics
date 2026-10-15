import React, { useState, useEffect } from 'react';
import { 
  Users, Search, Clock, MousePointer, Globe, Copy, Check, 
  Play, Pause, SkipForward, SkipBack, Code, ChevronDown, ChevronUp,
  Layers, Filter, ArrowRight, CornerDownRight, Smartphone, Monitor,
  ExternalLink, Sparkles
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
  const [selectedArchetype, setSelectedArchetype] = useState('ALL');
  const [eventFilter, setEventFilter] = useState('all'); // 'all' | 'page_view' | 'click'
  
  // Session Replay Simulator State
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1); // 1x, 2x, 4x

  const events = sessionJourney?.events || [];

  // Reset active step when session changes
  useEffect(() => {
    setActiveStepIndex(0);
    setIsPlaying(false);
  }, [selectedSessionId]);

  // Replay Simulator Timer
  useEffect(() => {
    if (!isPlaying) return;
    if (events.length === 0) return;

    const intervalMs = Math.max(400, 1500 / playbackSpeed);
    const timer = setInterval(() => {
      setActiveStepIndex((prev) => {
        if (prev >= events.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isPlaying, events.length, playbackSpeed]);

  // Infer user archetype based on session behavior
  const getSessionArchetype = (session) => {
    const pages = session.pagesVisited || [];
    const hasCheckout = pages.some(p => p.toLowerCase().includes('checkout'));
    const hasProduct = pages.some(p => p.toLowerCase().includes('product'));
    const clicks = session.clicks || 0;

    if (hasCheckout && clicks >= 3) return { label: 'High Intent Buyer', type: 'high-intent', emoji: '🎯' };
    if (hasCheckout && clicks < 3) return { label: 'Cart Abandoner', type: 'abandoner', emoji: '🛒' };
    if (hasProduct && clicks >= 3) return { label: 'Curious Researcher', type: 'researcher', emoji: '🔬' };
    return { label: 'Quick Bouncer', type: 'bouncer', emoji: '🏃' };
  };

  const filteredSessions = sessions.filter((s) => {
    const archetype = getSessionArchetype(s);
    if (selectedArchetype !== 'ALL' && archetype.type !== selectedArchetype) return false;

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

  // Filter events by type (all, page_view, click)
  const displayedEvents = events.filter((ev) => {
    if (eventFilter === 'all') return true;
    return ev.eventType === eventFilter;
  });

  return (
    <div>
      {/* View Header */}
      <div className="view-header">
        <div className="view-title-group">
          <h1>
            <Users size={22} style={{ color: '#818cf8' }} />
            <span>Session Journey Intelligence</span>
          </h1>
          <p>Chronological micro-interaction traces, user persona archetypes, and timeline playback.</p>
        </div>
      </div>

      <div className="sessions-layout">
        {/* Left Sidebar: Session List */}
        <div className="sessions-sidebar">
          {/* Search & Filters */}
          <div className="sessions-filter-box">
            <div className="search-input-wrap">
              <Search size={14} style={{ color: 'var(--text-tertiary)' }} />
              <input
                type="text"
                placeholder="Search session ID or page URL..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Persona Chips Filter */}
            <div className="persona-chips-row">
              <button
                className={`persona-chip ${selectedArchetype === 'ALL' ? 'active' : ''}`}
                onClick={() => setSelectedArchetype('ALL')}
              >
                All ({sessions.length})
              </button>
              <button
                className={`persona-chip ${selectedArchetype === 'high-intent' ? 'active' : ''}`}
                onClick={() => setSelectedArchetype('high-intent')}
              >
                🎯 Buyer
              </button>
              <button
                className={`persona-chip ${selectedArchetype === 'researcher' ? 'active' : ''}`}
                onClick={() => setSelectedArchetype('researcher')}
              >
                🔬 Researcher
              </button>
              <button
                className={`persona-chip ${selectedArchetype === 'abandoner' ? 'active' : ''}`}
                onClick={() => setSelectedArchetype('abandoner')}
              >
                🛒 Abandoner
              </button>
              <button
                className={`persona-chip ${selectedArchetype === 'bouncer' ? 'active' : ''}`}
                onClick={() => setSelectedArchetype('bouncer')}
              >
                🏃 Bouncer
              </button>
            </div>
          </div>

          {/* Scrollable Session List */}
          <div className="sessions-list-scroll">
            {filteredSessions.length > 0 ? (
              filteredSessions.map((s) => {
                const isSelected = selectedSessionId === s.sessionId;
                const archetype = getSessionArchetype(s);
                const shortId = s.sessionId.length > 16 
                  ? `${s.sessionId.substring(0, 8)}...${s.sessionId.substring(s.sessionId.length - 6)}` 
                  : s.sessionId;

                return (
                  <div
                    key={s.sessionId}
                    className={`session-item-row ${isSelected ? 'selected' : ''}`}
                    onClick={() => onSelectSession(s.sessionId)}
                  >
                    <div className="session-header-line">
                      <div className="session-id-label">
                        <span>{shortId}</span>
                        <button
                          style={{ background: 'transparent', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', padding: 0 }}
                          onClick={(e) => copyToClipboard(s.sessionId, e)}
                          title="Copy full session ID"
                        >
                          {copiedId === s.sessionId ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                        </button>
                      </div>

                      <span className={`session-archetype-tag tag-${archetype.type}`}>
                        <span>{archetype.emoji}</span>
                        <span>{archetype.label}</span>
                      </span>
                    </div>

                    <div className="session-metrics-line">
                      <span>
                        <Globe size={11} style={{ color: '#38bdf8' }} />
                        {s.pageViews} PV
                      </span>
                      <span>
                        <MousePointer size={11} style={{ color: '#c084fc' }} />
                        {s.clicks} Clicks
                      </span>
                      <span>
                        <Clock size={11} style={{ color: '#f59e0b' }} />
                        {formatDuration(s.durationSeconds)}
                      </span>
                      <span style={{ marginLeft: 'auto', color: 'var(--text-muted)' }}>
                        {formatTime(s.lastSeen)}
                      </span>
                    </div>

                    {s.entryPage && (
                      <div className="session-entry-pill" title={s.entryPage}>
                        <span style={{ color: 'var(--text-tertiary)' }}>Entry: </span>
                        {s.entryPage.replace(/^https?:\/\/[^/]+/, '') || '/'}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div style={{ padding: '3rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                No sessions matching your filter criteria.
              </div>
            )}
          </div>
        </div>

        {/* Right Main Panel: User Journey Timeline & Replay */}
        <div className="journey-container">
          {selectedSessionId ? (
            <div>
              {/* Header Info */}
              <div className="journey-top-bar">
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                    <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', color: '#fff', margin: 0 }}>
                      User Journey Trace
                    </h2>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', background: 'rgba(255, 255, 255, 0.05)', padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-sm)', color: '#c7d2fe' }}>
                      {selectedSessionId}
                    </span>
                  </div>

                  {sessionJourney?.summary && (
                    <div style={{ display: 'flex', gap: '1.25rem', marginTop: '0.5rem', flexWrap: 'wrap', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      <span>
                        Duration: <strong style={{ color: '#fff' }}>{formatDuration(sessionJourney.summary.durationSeconds)}</strong>
                      </span>
                      <span>
                        Events: <strong style={{ color: '#38bdf8' }}>{sessionJourney.summary.totalEvents}</strong>
                      </span>
                      <span>
                        Clicks: <strong style={{ color: '#c084fc' }}>{sessionJourney.summary.totalClicks}</strong>
                      </span>
                      <span>
                        Unique Pages: <strong style={{ color: '#34d399' }}>{sessionJourney.summary.uniquePages?.length || 1}</strong>
                      </span>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  {/* Event Type Filter Tabs */}
                  <div style={{ display: 'flex', background: 'var(--bg-surface)', padding: '0.2rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                    <button 
                      className={`btn btn-sm ${eventFilter === 'all' ? 'btn-secondary' : 'btn-ghost'}`} 
                      style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}
                      onClick={() => setEventFilter('all')}
                    >
                      All ({events.length})
                    </button>
                    <button 
                      className={`btn btn-sm ${eventFilter === 'page_view' ? 'btn-secondary' : 'btn-ghost'}`} 
                      style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}
                      onClick={() => setEventFilter('page_view')}
                    >
                      PVs
                    </button>
                    <button 
                      className={`btn btn-sm ${eventFilter === 'click' ? 'btn-secondary' : 'btn-ghost'}`} 
                      style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}
                      onClick={() => setEventFilter('click')}
                    >
                      Clicks
                    </button>
                  </div>

                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => setShowJson(!showJson)}
                    title="Toggle raw telemetry payload"
                  >
                    <Code size={12} />
                    <span>{showJson ? 'Hide' : 'JSON'}</span>
                  </button>
                </div>
              </div>

              {/* Session Replay Stepper Controls */}
              {events.length > 0 && (
                <div className="replay-player-bar">
                  <div className="replay-controls">
                    <button
                      className="btn btn-primary btn-sm btn-icon"
                      onClick={() => setIsPlaying(!isPlaying)}
                      title={isPlaying ? 'Pause replay' : 'Play journey step-by-step'}
                    >
                      {isPlaying ? <Pause size={13} /> : <Play size={13} style={{ marginLeft: '1px' }} />}
                    </button>

                    <button
                      className="btn btn-outline btn-sm btn-icon"
                      disabled={activeStepIndex === 0}
                      onClick={() => {
                        setIsPlaying(false);
                        setActiveStepIndex(Math.max(0, activeStepIndex - 1));
                      }}
                      title="Previous step"
                    >
                      <SkipBack size={12} />
                    </button>

                    <button
                      className="btn btn-outline btn-sm btn-icon"
                      disabled={activeStepIndex >= events.length - 1}
                      onClick={() => {
                        setIsPlaying(false);
                        setActiveStepIndex(Math.min(events.length - 1, activeStepIndex + 1));
                      }}
                      title="Next step"
                    >
                      <SkipForward size={12} />
                    </button>

                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#fff', marginLeft: '0.3rem' }}>
                      Step {activeStepIndex + 1} of {events.length}
                    </span>
                  </div>

                  {/* Scrub Track */}
                  <div 
                    className="replay-timeline-track"
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const pct = (e.clientX - rect.left) / rect.width;
                      const step = Math.min(events.length - 1, Math.max(0, Math.floor(pct * events.length)));
                      setIsPlaying(false);
                      setActiveStepIndex(step);
                    }}
                  >
                    <div 
                      className="replay-timeline-fill" 
                      style={{ width: `${((activeStepIndex + 1) / events.length) * 100}%` }} 
                    />
                  </div>

                  {/* Playback speed toggle */}
                  <div style={{ display: 'flex', gap: '2px' }}>
                    {[1, 2, 4].map((spd) => (
                      <button
                        key={spd}
                        className={`btn btn-sm ${playbackSpeed === spd ? 'btn-secondary' : 'btn-ghost'}`}
                        style={{ fontSize: '0.68rem', padding: '0.15rem 0.4rem' }}
                        onClick={() => setPlaybackSpeed(spd)}
                      >
                        {spd}x
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Raw JSON viewer */}
              {showJson && (
                <div className="code-box-styled" style={{ maxHeight: '220px', marginBottom: '1.25rem' }}>
                  <pre>{JSON.stringify(sessionJourney, null, 2)}</pre>
                </div>
              )}

              {/* Timeline Stream */}
              {isLoadingJourney ? (
                <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Loading session events...
                </div>
              ) : displayedEvents.length > 0 ? (
                <div className="journey-timeline-stream">
                  {displayedEvents.map((ev, idx) => {
                    const isPageView = ev.eventType === 'page_view';
                    const isCurrentStep = activeStepIndex === idx;

                    return (
                      <div 
                        key={ev._id || idx} 
                        className={`timeline-event-card ${isCurrentStep ? 'current-step' : ''}`}
                        style={{ opacity: isPlaying && idx > activeStepIndex ? 0.35 : 1 }}
                      >
                        <div className={`timeline-node-icon ${isPageView ? 'page-view' : 'click'}`}>
                          {isPageView ? <Globe size={13} /> : <MousePointer size={13} />}
                        </div>

                        <div 
                          className="timeline-card-content"
                          style={{
                            borderColor: isCurrentStep ? 'var(--brand-primary)' : undefined,
                            background: isCurrentStep ? 'rgba(99, 102, 241, 0.08)' : undefined
                          }}
                        >
                          <div className="timeline-card-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span className="timeline-step-badge">
                                STEP {ev.stepNumber || idx + 1}
                              </span>
                              <span style={{
                                fontSize: '0.68rem',
                                padding: '0.1rem 0.4rem',
                                borderRadius: '4px',
                                fontWeight: 700,
                                background: isPageView ? 'rgba(56, 189, 248, 0.12)' : 'rgba(192, 132, 252, 0.12)',
                                color: isPageView ? '#38bdf8' : '#c084fc',
                              }}>
                                {isPageView ? 'PAGE VIEW' : 'CLICK'}
                              </span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              {ev.deltaSeconds > 0 && (
                                <span className="timeline-delta-badge">
                                  +{ev.deltaSeconds}s
                                </span>
                              )}
                              <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                                {formatTime(ev.timestamp)}
                              </span>
                            </div>
                          </div>

                          {/* Event Details */}
                          {isPageView ? (
                            <div>
                              <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.88rem' }}>
                                {ev.metadata?.pageTitle || 'Store Page Navigation'}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', marginTop: '0.2rem' }}>
                                {ev.pageUrl}
                              </div>
                            </div>
                          ) : (
                            <div>
                              <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.88rem' }}>
                                Clicked {ev.metadata?.elementText ? `"${ev.metadata.elementText}"` : ev.metadata?.elementTag || 'Element'}
                              </div>

                              <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.3rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                {ev.metadata?.elementId && (
                                  <span style={{ fontSize: '0.72rem', color: '#c7d2fe', fontFamily: 'var(--font-mono)', background: 'rgba(255, 255, 255, 0.05)', padding: '0.1rem 0.35rem', borderRadius: '3px' }}>
                                    #{ev.metadata.elementId}
                                  </span>
                                )}

                                <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
                                  Coords: X: {ev.x}px, Y: {ev.y}px
                                </span>

                                {ev.xPercent !== null && (
                                  <span style={{ fontSize: '0.72rem', color: '#38bdf8', fontWeight: 600 }}>
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
                  No events found matching current filter.
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '400px', color: 'var(--text-muted)', textAlign: 'center' }}>
              <Layers size={48} style={{ opacity: 0.25, marginBottom: '1rem', color: '#6366f1' }} />
              <h3 style={{ color: '#fff', fontSize: '1.1rem', marginBottom: '0.4rem' }}>Select a User Session</h3>
              <p style={{ maxWidth: '360px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                Pick any user journey from the left sidebar to inspect step-by-step navigation traces, click coordinates, and playback simulation.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
