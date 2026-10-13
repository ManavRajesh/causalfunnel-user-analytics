import React from 'react';
import { Users, Activity, MousePointer, Globe, Compass, ExternalLink, Flame, CheckCircle, ArrowRight } from 'lucide-react';

export default function OverviewView({ stats, topPages, onSelectPageForHeatmap, setActiveTab }) {
  const kpis = stats?.stats || {
    totalSessions: 0,
    totalEvents: 0,
    totalClicks: 0,
    totalPageViews: 0,
    avgEventsPerSession: 0,
  };

  return (
    <div>
      {/* KPI Cards Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Active Sessions</span>
            <div className="stat-icon-box" style={{ color: '#818cf8' }}>
              <Users size={18} />
            </div>
          </div>
          <div className="stat-value">{kpis.totalSessions.toLocaleString()}</div>
          <div className="stat-subtitle">
            <span style={{ color: '#34d399' }}>● Indexed in MongoDB</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Total Ingested Events</span>
            <div className="stat-icon-box" style={{ color: '#38bdf8' }}>
              <Activity size={18} />
            </div>
          </div>
          <div className="stat-value">{kpis.totalEvents.toLocaleString()}</div>
          <div className="stat-subtitle">
            <span>Client beacons & batches</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Clicks Captured</span>
            <div className="stat-icon-box" style={{ color: '#c084fc' }}>
              <MousePointer size={18} />
            </div>
          </div>
          <div className="stat-value">{kpis.totalClicks.toLocaleString()}</div>
          <div className="stat-subtitle">
            <span style={{ color: '#a855f7' }}>Heatmap coordinate data</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Page Views</span>
            <div className="stat-icon-box" style={{ color: '#34d399' }}>
              <Globe size={18} />
            </div>
          </div>
          <div className="stat-value">{kpis.totalPageViews.toLocaleString()}</div>
          <div className="stat-subtitle">
            <span>Navigation transitions</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Avg Events / Session</span>
            <div className="stat-icon-box" style={{ color: '#f59e0b' }}>
              <Compass size={18} />
            </div>
          </div>
          <div className="stat-value">{kpis.avgEventsPerSession}</div>
          <div className="stat-subtitle">
            <span>Session engagement depth</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* Top Tracked Pages Table */}
        <div className="panel-card">
          <div className="section-title-bar">
            <h2>
              <Globe size={18} style={{ color: '#38bdf8' }} />
              <span>Top Tracked E-Commerce Pages</span>
            </h2>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => setActiveTab('heatmap')}
            >
              <span>View All Heatmaps</span>
              <ArrowRight size={13} />
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Page URL</th>
                  <th>Total Events</th>
                  <th>Clicks</th>
                  <th>Click Rate</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {topPages && topPages.length > 0 ? (
                  topPages.map((page, idx) => {
                    const clickRate = page.events > 0 ? ((page.clicks / page.events) * 100).toFixed(0) : 0;
                    return (
                      <tr key={idx}>
                        <td style={{ maxWidth: '300px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#e2e8f0', wordBreak: 'break-all' }}>
                              {page.pageUrl}
                            </span>
                          </div>
                        </td>
                        <td>
                          <span style={{ fontWeight: 600, color: '#fff' }}>{page.events}</span>
                        </td>
                        <td>
                          <span style={{ color: '#c084fc', fontWeight: 600 }}>{page.clicks}</span>
                        </td>
                        <td>
                          <span style={{ color: clickRate > 50 ? '#34d399' : '#94a3b8' }}>
                            {clickRate}%
                          </span>
                        </td>
                        <td>
                          <button
                            className="btn btn-outline btn-sm"
                            style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                            onClick={() => onSelectPageForHeatmap(page.pageUrl)}
                            title="Analyze click heatmap for this page"
                          >
                            <Flame size={12} style={{ color: '#ef4444' }} />
                            <span>Heatmap</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      No events recorded yet. Click "Seed Data" or visit the Demo Store to generate live data!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Integration & Architecture Card */}
        <div className="panel-card">
          <div className="section-title-bar">
            <h2>
              <CheckCircle size={18} style={{ color: '#10b981' }} />
              <span>Embed Tracking Snippet</span>
            </h2>
          </div>

          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '1rem' }}>
            Add this 1-line script to any HTML head or body to begin tracking page views, clicks, and session journeys automatically:
          </p>

          <div className="code-snippet-box" style={{ marginBottom: '1.25rem' }}>
            <code>{`<script\n  src="http://localhost:5000/tracker.js"\n  data-endpoint="http://localhost:5000/api/events">\n</script>`}</code>
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-card)', borderRadius: '10px', padding: '1rem' }}>
            <h4 style={{ fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.5rem' }}>⚡ Capabilities:</h4>
            <ul style={{ paddingLeft: '1.2rem', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.7' }}>
              <li>Automatic persistent <code>session_id</code> via cookie & localStorage.</li>
              <li>Captures both <code>page_view</code> and <code>click</code> with x/y & normalized viewport percentages.</li>
              <li>SPA history change interception (Next.js/React Router support).</li>
              <li>Non-blocking transport with <code>sendBeacon</code> and batching.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
