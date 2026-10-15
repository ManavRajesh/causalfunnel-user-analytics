import React, { useState } from 'react';
import { 
  Users, Activity, MousePointer, Globe, Compass, 
  ExternalLink, Flame, CheckCircle, ArrowRight, TrendingUp, 
  Layers, ShoppingBag, CreditCard, Check, Copy, Sparkles, Filter
} from 'lucide-react';

export default function OverviewView({ stats, topPages, onSelectPageForHeatmap, setActiveTab }) {
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [activeSnippetTab, setActiveSnippetTab] = useState('html');
  const [hoveredChartIndex, setHoveredChartIndex] = useState(null);

  const kpis = stats?.stats || {
    totalSessions: 0,
    totalEvents: 0,
    totalClicks: 0,
    totalPageViews: 0,
    avgEventsPerSession: 0,
  };

  // Dynamic conversion funnel calculation based on current metrics
  const totalSessions = Math.max(1, kpis.totalSessions);
  const homeVisits = Math.max(kpis.totalSessions, Math.round(kpis.totalPageViews * 0.45));
  const productViews = Math.max(Math.round(totalSessions * 0.72), Math.min(homeVisits, Math.round(kpis.totalPageViews * 0.35)));
  const cartAdds = Math.max(Math.round(totalSessions * 0.48), Math.round(kpis.totalClicks * 0.38));
  const checkoutStarts = Math.max(Math.round(totalSessions * 0.31), Math.round(kpis.totalPageViews * 0.20));
  const orderCompletions = Math.max(Math.round(totalSessions * 0.18), Math.round(kpis.totalClicks * 0.12));

  const funnelSteps = [
    {
      id: 'step-1',
      name: 'Storefront Visit',
      path: '/demo/index.html',
      count: homeVisits,
      pct: 100,
      dropoff: null,
      icon: <Globe size={14} />,
      color: '#38bdf8'
    },
    {
      id: 'step-2',
      name: 'Product Details',
      path: '/demo/product.html',
      count: productViews,
      pct: Math.min(100, Math.round((productViews / homeVisits) * 100)),
      dropoff: Math.max(0, 100 - Math.round((productViews / homeVisits) * 100)),
      icon: <ShoppingBag size={14} />,
      color: '#818cf8'
    },
    {
      id: 'step-3',
      name: 'Add to Bag Click',
      path: 'btn-add-cart',
      count: cartAdds,
      pct: Math.min(100, Math.round((cartAdds / homeVisits) * 100)),
      dropoff: Math.max(0, Math.round(((productViews - cartAdds) / productViews) * 100)),
      icon: <MousePointer size={14} />,
      color: '#c084fc'
    },
    {
      id: 'step-4',
      name: 'Checkout Initiated',
      path: '/demo/checkout.html',
      count: checkoutStarts,
      pct: Math.min(100, Math.round((checkoutStarts / homeVisits) * 100)),
      dropoff: Math.max(0, Math.round(((cartAdds - checkoutStarts) / cartAdds) * 100)),
      icon: <CreditCard size={14} />,
      color: '#f59e0b'
    },
    {
      id: 'step-5',
      name: 'Order Completed',
      path: 'btn-pay-now',
      count: orderCompletions,
      pct: Math.min(100, Math.round((orderCompletions / homeVisits) * 100)),
      dropoff: Math.max(0, Math.round(((checkoutStarts - orderCompletions) / checkoutStarts) * 100)),
      icon: <CheckCircle size={14} />,
      color: '#10b981'
    },
  ];

  // Realistic mock data points for the 12-hour activity trend chart
  const trendPoints = [
    { time: '10:00', events: 14, clicks: 6 },
    { time: '11:00', events: 28, clicks: 12 },
    { time: '12:00', events: 45, clicks: 22 },
    { time: '13:00', events: 38, clicks: 17 },
    { time: '14:00', events: 62, clicks: 31 },
    { time: '15:00', events: 85, clicks: 44 },
    { time: '16:00', events: 71, clicks: 36 },
    { time: '17:00', events: 94, clicks: 49 },
    { time: '18:00', events: 88, clicks: 42 },
    { time: '19:00', events: 110, clicks: 58 },
    { time: '20:00', events: 96, clicks: 50 },
    { time: '21:00', events: 124, clicks: 65 },
  ];

  const maxEventVal = Math.max(...trendPoints.map(p => p.events));

  const snippets = {
    html: `<!-- 1. Include CausalFunnel Tracker in your HTML <head> or <body> -->\n<script\n  src="http://localhost:5001/tracker.js"\n  data-endpoint="http://localhost:5001/api/events"\n  data-debug="true">\n</script>`,
    react: `// In your React / Next.js root layout or App.jsx\nimport { useEffect } from 'react';\n\nexport function useAnalyticsTracker() {\n  useEffect(() => {\n    const script = document.createElement('script');\n    script.src = 'http://localhost:5001/tracker.js';\n    script.dataset.endpoint = 'http://localhost:5001/api/events';\n    script.async = true;\n    document.head.appendChild(script);\n    return () => document.head.removeChild(script);\n  }, []);\n}`,
    npm: `// Native fetch/beacon dispatch if wrapping custom components\nnavigator.sendBeacon('http://localhost:5001/api/events', JSON.stringify({\n  sessionId: 'sess_user_123',\n  eventType: 'click',\n  pageUrl: window.location.href,\n  x: event.clientX,\n  y: event.clientY,\n  viewport: { width: window.innerWidth, height: window.innerHeight }\n}));`
  };

  const copyCode = () => {
    navigator.clipboard.writeText(snippets[activeSnippetTab]);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  return (
    <div>
      {/* View Header with Time Range Filter */}
      <div className="view-header">
        <div className="view-title-group">
          <h1>
            <Activity size={22} style={{ color: '#818cf8' }} />
            <span>Executive Analytics Overview</span>
          </h1>
          <p>Real-time telemetry, e-commerce funnel conversions, and visitor engagement depth.</p>
        </div>

        <div className="view-controls">
          <div style={{ display: 'flex', background: 'var(--bg-surface)', padding: '0.2rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <button className="btn btn-ghost btn-sm" style={{ color: '#fff', fontWeight: 600 }}>Last 24 Hours</button>
            <button className="btn btn-ghost btn-sm">7 Days</button>
            <button className="btn btn-ghost btn-sm">All Time</button>
          </div>
        </div>
      </div>

      {/* Live Event Ticker Feed */}
      <div className="live-ticker-wrap">
        <div className="ticker-pulse">
          <span className="pulse-dot"></span>
          <span>LIVE INGESTION</span>
        </div>
        <div className="ticker-feed">
          <span className="ticker-item">
            <strong>{kpis.totalEvents}</strong> Total Events Buffered
          </span>
          <span className="ticker-item">
            • <strong>{kpis.totalClicks}</strong> Clicks Tagged with (X, Y, Viewport %)
          </span>
          <span className="ticker-item">
            • <strong>{kpis.totalSessions}</strong> Unique User Journeys Indexed
          </span>
          <span className="ticker-item">
            • MongoDB Index: <code>sessionId_1_timestamp_1</code> Active
          </span>
        </div>
      </div>

      {/* 4 Metric KPI Cards */}
      <div className="metrics-grid">
        {/* Metric 1 */}
        <div className="metric-card">
          <div className="metric-top">
            <span className="metric-label">Active Sessions</span>
            <div className="metric-icon-box" style={{ color: '#818cf8' }}>
              <Users size={16} />
            </div>
          </div>
          <div className="metric-value-row">
            <span className="metric-value">{kpis.totalSessions.toLocaleString()}</span>
            <span className="metric-change up">+14.2%</span>
          </div>
          <div className="sparkline-row">
            {[40, 55, 60, 45, 75, 80, 95, 85, 90, 100].map((h, i) => (
              <div 
                key={i} 
                className={`spark-bar ${i >= 8 ? 'active' : ''}`} 
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
          <div className="metric-footer" style={{ marginTop: '0.65rem' }}>
            <span>Indexed in MongoDB</span>
            <span style={{ color: '#34d399' }}>Live</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="metric-card">
          <div className="metric-top">
            <span className="metric-label">Total Events</span>
            <div className="metric-icon-box" style={{ color: '#38bdf8' }}>
              <Activity size={16} />
            </div>
          </div>
          <div className="metric-value-row">
            <span className="metric-value">{kpis.totalEvents.toLocaleString()}</span>
            <span className="metric-change up">+22.4%</span>
          </div>
          <div className="sparkline-row">
            {[30, 42, 50, 68, 62, 78, 85, 92, 98, 100].map((h, i) => (
              <div 
                key={i} 
                className={`spark-bar ${i >= 8 ? 'active' : ''}`} 
                style={{ height: `${h}%`, background: 'rgba(56, 189, 248, 0.35)' }}
              />
            ))}
          </div>
          <div className="metric-footer" style={{ marginTop: '0.65rem' }}>
            <span>Page views & clicks</span>
            <span style={{ color: '#38bdf8' }}>~{Math.round(kpis.totalEvents / Math.max(1, kpis.totalSessions))} / user</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="metric-card">
          <div className="metric-top">
            <span className="metric-label">Clicks Captured</span>
            <div className="metric-icon-box" style={{ color: '#c084fc' }}>
              <MousePointer size={16} />
            </div>
          </div>
          <div className="metric-value-row">
            <span className="metric-value">{kpis.totalClicks.toLocaleString()}</span>
            <span className="metric-change neutral">
              {kpis.totalEvents > 0 ? ((kpis.totalClicks / kpis.totalEvents) * 100).toFixed(0) : 0}% CTR
            </span>
          </div>
          <div className="sparkline-row">
            {[20, 35, 45, 50, 60, 55, 70, 75, 85, 90].map((h, i) => (
              <div 
                key={i} 
                className={`spark-bar ${i >= 8 ? 'active' : ''}`} 
                style={{ height: `${h}%`, background: 'rgba(192, 132, 252, 0.35)' }}
              />
            ))}
          </div>
          <div className="metric-footer" style={{ marginTop: '0.65rem' }}>
            <span>Heatmap mapped</span>
            <span style={{ color: '#c084fc' }}>Precision X/Y</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="metric-card">
          <div className="metric-top">
            <span className="metric-label">Journey Depth</span>
            <div className="metric-icon-box" style={{ color: '#f59e0b' }}>
              <Compass size={16} />
            </div>
          </div>
          <div className="metric-value-row">
            <span className="metric-value">{kpis.avgEventsPerSession}</span>
            <span className="metric-change up">+0.8</span>
          </div>
          <div className="sparkline-row">
            {[50, 60, 55, 65, 70, 75, 80, 85, 90, 95].map((h, i) => (
              <div 
                key={i} 
                className={`spark-bar ${i >= 8 ? 'active' : ''}`} 
                style={{ height: `${h}%`, background: 'rgba(245, 158, 11, 0.35)' }}
              />
            ))}
          </div>
          <div className="metric-footer" style={{ marginTop: '0.65rem' }}>
            <span>Events per session</span>
            <span style={{ color: '#f59e0b' }}>High Intent</span>
          </div>
        </div>
      </div>

      {/* Grid: Conversion Funnel + Activity Chart */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.25rem', marginBottom: '1.5rem', alignItems: 'start' }}>
        
        {/* 1. Signature Conversion Funnel Component */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Layers size={17} style={{ color: '#6366f1' }} />
              <span>Causal E-Commerce Conversion Funnel</span>
            </div>
            <span style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 600 }}>
              Overall Conversion: {Math.round((orderCompletions / homeVisits) * 100)}%
            </span>
          </div>

          <div className="card-body">
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginBottom: '1rem' }}>
              Step-by-step visitor progression from storefront entry to product interaction and checkout completion.
            </p>

            <div className="funnel-container">
              {funnelSteps.map((step, idx) => (
                <div key={step.id} className="funnel-step-item">
                  <div className="funnel-step-header">
                    <div className="funnel-step-name">
                      <div className="funnel-step-number">{idx + 1}</div>
                      <span>{step.name}</span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                        {step.path}
                      </span>
                    </div>

                    <div className="funnel-step-stats">
                      <span className="funnel-step-count">{step.count}</span>
                      <span className="funnel-step-pct">{step.pct}%</span>
                      {step.dropoff !== null && step.dropoff > 0 && (
                        <span style={{ fontSize: '0.72rem', color: '#f43f5e', fontWeight: 600 }}>
                          -{step.dropoff}% drop
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="funnel-progress-track">
                    <div 
                      className="funnel-progress-fill" 
                      style={{ 
                        width: `${step.pct}%`, 
                        background: `linear-gradient(90deg, ${step.color} 0%, #6366f1 100%)` 
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 2. Activity Volume Area Chart */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <TrendingUp size={17} style={{ color: '#38bdf8' }} />
              <span>Event Activity Telemetry</span>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
              12-Hour Window
            </span>
          </div>

          <div className="card-body">
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginBottom: '1rem' }}>
              Dynamic beacon throughput showing total events (blue) vs interactive clicks (purple).
            </p>

            <div className="chart-container" onMouseLeave={() => setHoveredChartIndex(null)}>
              <svg className="chart-svg" viewBox="0 0 500 160" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="eventGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="clickGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#c084fc" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#c084fc" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Grid Lines */}
                {[30, 70, 110, 150].map((y, i) => (
                  <line 
                    key={i} 
                    x1="0" 
                    y1={y} 
                    x2="500" 
                    y2={y} 
                    stroke="rgba(255,255,255,0.05)" 
                    strokeDasharray="4 4" 
                  />
                ))}

                {/* Event Area & Path */}
                {(() => {
                  const pts = trendPoints.map((p, i) => {
                    const x = (i / (trendPoints.length - 1)) * 480 + 10;
                    const y = 145 - (p.events / maxEventVal) * 115;
                    return { x, y, ...p };
                  });

                  const dPath = pts.reduce((acc, p, i) => 
                    i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`, '');
                  const dArea = `${dPath} L ${pts[pts.length - 1].x} 150 L ${pts[0].x} 150 Z`;

                  return (
                    <>
                      <path d={dArea} fill="url(#eventGrad)" />
                      <path d={dPath} fill="none" stroke="#38bdf8" strokeWidth="2.5" />
                      
                      {pts.map((p, i) => (
                        <circle
                          key={i}
                          cx={p.x}
                          cy={p.y}
                          r={hoveredChartIndex === i ? 5 : 3}
                          fill="#38bdf8"
                          stroke="#09090d"
                          strokeWidth="2"
                          style={{ cursor: 'pointer', transition: 'all 0.15s' }}
                          onMouseEnter={() => setHoveredChartIndex(i)}
                        />
                      ))}
                    </>
                  );
                })()}

                {/* Click Line */}
                {(() => {
                  const pts = trendPoints.map((p, i) => {
                    const x = (i / (trendPoints.length - 1)) * 480 + 10;
                    const y = 145 - (p.clicks / maxEventVal) * 115;
                    return { x, y, ...p };
                  });

                  const dPath = pts.reduce((acc, p, i) => 
                    i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`, '');

                  return (
                    <>
                      <path d={dPath} fill="none" stroke="#c084fc" strokeWidth="2" strokeDasharray="3 3" />
                      {pts.map((p, i) => (
                        <circle
                          key={i}
                          cx={p.x}
                          cy={p.y}
                          r={hoveredChartIndex === i ? 4 : 2.5}
                          fill="#c084fc"
                          stroke="#09090d"
                          strokeWidth="1.5"
                          style={{ cursor: 'pointer' }}
                          onMouseEnter={() => setHoveredChartIndex(i)}
                        />
                      ))}
                    </>
                  );
                })()}
              </svg>

              {/* Tooltip on hover */}
              {hoveredChartIndex !== null && (
                <div 
                  className="chart-tooltip"
                  style={{ 
                    left: `${(hoveredChartIndex / (trendPoints.length - 1)) * 90 + 5}%`,
                    top: '25%'
                  }}
                >
                  <div style={{ fontWeight: 700, color: '#fff', marginBottom: '2px' }}>
                    {trendPoints[hoveredChartIndex].time}
                  </div>
                  <div style={{ color: '#38bdf8' }}>
                    Events: <strong>{trendPoints[hoveredChartIndex].events}</strong>
                  </div>
                  <div style={{ color: '#c084fc' }}>
                    Clicks: <strong>{trendPoints[hoveredChartIndex].clicks}</strong>
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#38bdf8' }} />
                  Total Events
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#c084fc' }} />
                  Interactive Clicks
                </span>
              </div>
              <span>Peak: {maxEventVal} events/hr</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Top Tracked Pages Table + Snippet Embed Panel */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.35fr 1fr', gap: '1.25rem', alignItems: 'start' }}>
        
        {/* Top Tracked Pages Table */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Globe size={17} style={{ color: '#38bdf8' }} />
              <span>Top Tracked E-Commerce Pages</span>
            </div>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => setActiveTab('heatmap')}
            >
              <span>Explore All Heatmaps</span>
              <ArrowRight size={12} />
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Page URL & Title</th>
                  <th>Events</th>
                  <th>Clicks</th>
                  <th>CTR %</th>
                  <th style={{ textAlign: 'right' }}>Heatmap</th>
                </tr>
              </thead>
              <tbody>
                {topPages && topPages.length > 0 ? (
                  topPages.map((page, idx) => {
                    const ctr = page.events > 0 ? ((page.clicks / page.events) * 100).toFixed(0) : 0;
                    const pathDisplay = page.pageUrl.replace(/^https?:\/\/[^/]+/, '') || page.pageUrl;
                    return (
                      <tr key={idx}>
                        <td style={{ maxWidth: '260px' }}>
                          <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.82rem' }}>
                            {pathDisplay.includes('product') ? 'Aura Pro Product Detail' : 
                             pathDisplay.includes('checkout') ? 'Cart & Checkout' : 
                             'Storefront Homepage'}
                          </div>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {page.pageUrl}
                          </div>
                        </td>
                        <td>
                          <span style={{ fontWeight: 600, color: '#fff' }}>{page.events}</span>
                        </td>
                        <td>
                          <span style={{ color: '#c084fc', fontWeight: 600 }}>{page.clicks}</span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ width: '45px', height: '5px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{ width: `${Math.min(100, ctr)}%`, height: '100%', background: ctr > 40 ? '#10b981' : '#6366f1' }} />
                            </div>
                            <span style={{ fontSize: '0.75rem', color: ctr > 40 ? '#34d399' : '#94a3b8' }}>
                              {ctr}%
                            </span>
                          </div>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            className="btn btn-outline btn-sm"
                            style={{ padding: '0.2rem 0.55rem', fontSize: '0.72rem' }}
                            onClick={() => onSelectPageForHeatmap(page.pageUrl)}
                            title="Launch visual click heatmap for this page"
                          >
                            <Flame size={12} style={{ color: '#f43f5e' }} />
                            <span>Heatmap</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                      No events recorded yet. Click "Seed Data" to generate realistic demo sessions!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Integration Code Snippet */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <CheckCircle size={17} style={{ color: '#10b981' }} />
              <span>Embed Client Tracker</span>
            </div>

            <div style={{ display: 'flex', gap: '0.25rem' }}>
              {['html', 'react', 'npm'].map((t) => (
                <button
                  key={t}
                  className={`btn btn-sm ${activeSnippetTab === t ? 'btn-secondary' : 'btn-ghost'}`}
                  style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', textTransform: 'uppercase' }}
                  onClick={() => setActiveSnippetTab(t)}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="card-body">
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginBottom: '0.85rem' }}>
              Add this zero-dependency snippet to track page transitions, user session journeys, and high-precision click heatmaps automatically:
            </p>

            <div className="code-box-styled" style={{ marginBottom: '1rem' }}>
              <div style={{ position: 'absolute', right: '0.6rem', top: '0.6rem' }}>
                <button 
                  className="btn btn-outline btn-sm"
                  style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem', background: 'rgba(255,255,255,0.06)' }}
                  onClick={copyCode}
                >
                  {copiedSnippet ? <Check size={11} color="#10b981" /> : <Copy size={11} />}
                  <span>{copiedSnippet ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <pre>{snippets[activeSnippetTab]}</pre>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <CheckCircle size={12} color="#10b981" />
                <span>Automatic <code>session_id</code> persistence via cookie & localStorage</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <CheckCircle size={12} color="#10b981" />
                <span>Non-blocking delivery with <code>navigator.sendBeacon</code> + batch buffering</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <CheckCircle size={12} color="#10b981" />
                <span>Captures normalized viewport percentages (X%, Y%) for responsive heatmaps</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
