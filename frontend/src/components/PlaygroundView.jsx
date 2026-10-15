import React, { useState, useEffect } from 'react';
import { 
  Play, ExternalLink, RefreshCw, Smartphone, Monitor, Sparkles, 
  Check, Copy, Terminal, MousePointer, Globe, Zap, ArrowRight, ShieldCheck
} from 'lucide-react';

export default function PlaygroundView({ onRefreshAfterAction }) {
  const [activePage, setActivePage] = useState('/demo/index.html');
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const [eventLogs, setEventLogs] = useState([
    {
      time: new Date().toLocaleTimeString(),
      type: 'page_view',
      label: 'Storefront Loaded',
      detail: '/demo/index.html',
      transport: 'sendBeacon'
    },
    {
      time: new Date().toLocaleTimeString(),
      type: 'click',
      label: 'Clicked "Explore Aura Pro"',
      detail: '#hero-shop-now (X: 640px, Y: 340px)',
      transport: 'sendBeacon'
    }
  ]);

  const pages = [
    { name: 'Storefront (Home)', path: '/demo/index.html' },
    { name: 'Product Detail (Aura Pro)', path: '/demo/product.html' },
    { name: 'Checkout & Cart', path: '/demo/checkout.html' },
  ];

  const snippetCode = `<script\n  src="http://localhost:5001/tracker.js"\n  data-endpoint="http://localhost:5001/api/events"\n  data-debug="true">\n</script>`;

  const copySnippet = () => {
    navigator.clipboard.writeText(snippetCode);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  const reloadIframe = () => {
    setIframeKey((k) => k + 1);
    addLog('page_view', 'Store Reloaded', activePage);
    onRefreshAfterAction();
  };

  const addLog = (type, label, detail) => {
    setEventLogs((prev) => [
      {
        time: new Date().toLocaleTimeString(),
        type,
        label,
        detail,
        transport: 'sendBeacon'
      },
      ...prev.slice(0, 19)
    ]);
  };

  // Simulate instant user interactions directly to backend
  const simulateAction = async (actionType) => {
    const sessionId = `sess_sim_${Math.random().toString(36).substring(2, 8)}`;
    let payload = {};

    if (actionType === 'add_cart') {
      payload = {
        sessionId,
        eventType: 'click',
        pageUrl: 'http://localhost:5001/demo/product.html',
        x: 780,
        y: 410,
        xPercent: 60.9,
        yPercent: 51.2,
        metadata: {
          elementId: 'btn-add-cart',
          elementTag: 'BUTTON',
          elementText: 'Add to Bag',
          pageTitle: 'Aura Pro Wireless Headphones'
        }
      };
      addLog('click', 'Simulated Click "Add to Bag"', '#btn-add-cart (60.9% / 51.2%)');
    } else if (actionType === 'checkout') {
      payload = {
        sessionId,
        eventType: 'click',
        pageUrl: 'http://localhost:5001/demo/checkout.html',
        x: 640,
        y: 580,
        xPercent: 50.0,
        yPercent: 72.5,
        metadata: {
          elementId: 'btn-pay-now',
          elementTag: 'BUTTON',
          elementText: 'Complete Order ($249.00)',
          pageTitle: 'Checkout & Payment'
        }
      };
      addLog('click', 'Simulated Checkout Order', '#btn-pay-now (50.0% / 72.5%)');
    } else if (actionType === 'rage_click') {
      // 3 fast clicks in the same spot
      for (let i = 0; i < 3; i++) {
        await fetch('/api/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            eventType: 'click',
            pageUrl: 'http://localhost:5001/demo/index.html',
            x: 640 + i * 2,
            y: 340 + i * 2,
            xPercent: 50.0,
            yPercent: 42.5,
            metadata: {
              elementId: 'hero-shop-now',
              elementTag: 'BUTTON',
              elementText: 'Explore Aura Pro'
            }
          })
        });
      }
      addLog('click', 'Simulated Rapid Rage Clicks (×3)', '#hero-shop-now (50.0% / 42.5%)');
      onRefreshAfterAction();
      return;
    }

    try {
      await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      onRefreshAfterAction();
    } catch (err) {
      console.error('Simulation error:', err);
    }
  };

  return (
    <div>
      {/* View Header */}
      <div className="view-header">
        <div className="view-title-group">
          <h1>
            <Play size={22} style={{ color: '#10b981' }} />
            <span>Interactive Store Sandbox & Event Stream</span>
          </h1>
          <p>Live embedded test store with real-time beacon transport and telemetry inspection console.</p>
        </div>

        <div className="view-controls">
          <button className="btn btn-outline btn-sm" onClick={reloadIframe} title="Reload demo iframe">
            <RefreshCw size={12} />
            <span>Reload Store</span>
          </button>
          <a
            href={activePage}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary btn-sm"
          >
            <span>Open Fullscreen</span>
            <ExternalLink size={12} />
          </a>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '1.25rem', alignItems: 'start' }}>
        
        {/* Left: Embedded Interactive Store Frame */}
        <div className="card">
          <div className="card-header">
            {/* Store Page Switcher */}
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {pages.map((p) => (
                <button
                  key={p.path}
                  className={`btn btn-sm ${activePage === p.path ? 'btn-secondary' : 'btn-ghost'}`}
                  style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem' }}
                  onClick={() => {
                    setActivePage(p.path);
                    addLog('page_view', 'Navigated to ' + p.name, p.path);
                  }}
                >
                  {p.name}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.72rem', color: '#10b981', fontWeight: 600 }}>
              <span className="pulse-dot" />
              <span>Tracker Connected</span>
            </div>
          </div>

          <div className="card-body" style={{ padding: 0 }}>
            <div style={{ height: '620px', background: '#090a10', position: 'relative' }}>
              <iframe
                key={iframeKey}
                src={activePage}
                title="Aura E-Commerce Store"
                style={{ width: '100%', height: '100%', border: 'none', background: '#090a10' }}
              />
            </div>
          </div>
        </div>

        {/* Right: Live Telemetry Inspector & Simulation Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Quick Simulation Triggers */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <Zap size={16} style={{ color: '#f59e0b' }} />
                <span>Simulate User Actions</span>
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>Instant Beacons</span>
            </div>

            <div className="card-body">
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '0.85rem' }}>
                Dispatch realistic interaction beacons to test funnel conversion and heatmap painting immediately:
              </p>

              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button 
                  className="btn btn-outline btn-sm"
                  onClick={() => simulateAction('add_cart')}
                  title="Simulate Add to Bag button click"
                >
                  <span>🛍️ Add to Bag</span>
                </button>
                <button 
                  className="btn btn-outline btn-sm"
                  onClick={() => simulateAction('checkout')}
                  title="Simulate Complete Order click"
                >
                  <span>💳 Complete Checkout</span>
                </button>
                <button 
                  className="btn btn-outline btn-sm"
                  onClick={() => simulateAction('rage_click')}
                  title="Simulate 3 rapid clicks"
                >
                  <span>⚡ Rage Clicks</span>
                </button>
              </div>
            </div>
          </div>

          {/* Live Developer Telemetry Console */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <Terminal size={16} style={{ color: '#38bdf8' }} />
                <span>Real-Time Telemetry Stream</span>
              </div>
              <span style={{ fontSize: '0.7rem', color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>
                PORT 5001 /events
              </span>
            </div>

            <div className="card-body" style={{ padding: '0.85rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', maxHeight: '250px', overflowY: 'auto' }}>
                {eventLogs.map((log, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.5rem 0.75rem',
                      fontSize: '0.75rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.2rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        padding: '0.1rem 0.35rem',
                        borderRadius: '3px',
                        background: log.type === 'page_view' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(192, 132, 252, 0.15)',
                        color: log.type === 'page_view' ? '#38bdf8' : '#c084fc'
                      }}>
                        {log.type.toUpperCase()}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                        {log.time}
                      </span>
                    </div>

                    <div style={{ fontWeight: 600, color: '#fff' }}>
                      {log.label}
                    </div>

                    <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                      {log.detail}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Embed Snippet */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <ShieldCheck size={16} style={{ color: '#10b981' }} />
                <span>Client Tracker Snippet</span>
              </div>
              <button
                className="btn btn-outline btn-sm"
                onClick={copySnippet}
                style={{ padding: '0.2rem 0.5rem', fontSize: '0.72rem' }}
              >
                {copiedSnippet ? <Check size={11} color="#10b981" /> : <Copy size={11} />}
                <span>{copiedSnippet ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <div className="card-body">
              <div className="code-box-styled">
                <pre>{snippetCode}</pre>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
