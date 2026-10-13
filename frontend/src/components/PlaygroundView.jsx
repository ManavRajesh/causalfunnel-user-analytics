import React, { useState } from 'react';
import { Play, ExternalLink, RefreshCw, Smartphone, Monitor, Sparkles, Check, Copy } from 'lucide-react';

export default function PlaygroundView({ onRefreshAfterAction }) {
  const [activePage, setActivePage] = useState('/demo/index.html');
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);

  const pages = [
    { name: 'Storefront (Home)', path: '/demo/index.html' },
    { name: 'Product Detail (Aura Pro)', path: '/demo/product.html' },
    { name: 'Checkout & Cart', path: '/demo/checkout.html' },
  ];

  const snippetCode = `<script\n  src="http://localhost:5000/tracker.js"\n  data-endpoint="http://localhost:5000/api/events">\n</script>`;

  const copySnippet = () => {
    navigator.clipboard.writeText(snippetCode);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  const reloadIframe = () => {
    setIframeKey((k) => k + 1);
    onRefreshAfterAction();
  };

  return (
    <div>
      <div className="section-title-bar">
        <div>
          <h2>
            <Play size={20} style={{ color: '#10b981' }} />
            <span>Interactive Demo Store Playground</span>
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
            Interact with the demo e-commerce store below. Every click and page view automatically logs to MongoDB in real time!
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button className="btn btn-outline btn-sm" onClick={reloadIframe} title="Reload demo frame">
            <RefreshCw size={13} />
            <span>Reload Store</span>
          </button>
          <a
            href={activePage}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary btn-sm"
          >
            <span>Open in New Tab</span>
            <ExternalLink size={13} />
          </a>
        </div>
      </div>

      <div className="playground-grid">
        {/* Left: Interactive Live Frame */}
        <div className="panel-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', gap: '0.5rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              {pages.map((p) => (
                <button
                  key={p.path}
                  className={`btn btn-sm ${activePage === p.path ? 'btn-primary' : 'btn-outline'}`}
                  style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
                  onClick={() => setActivePage(p.path)}
                >
                  {p.name}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: '#10b981' }}>
              <span className="pulse-dot"></span>
              <span>Tracker Active</span>
            </div>
          </div>

          <div style={{ border: '1px solid var(--border-card)', borderRadius: '10px', overflow: 'hidden', background: '#090e1a', height: '580px' }}>
            <iframe
              key={iframeKey}
              src={activePage}
              title="Demo E-Commerce Store"
              style={{ width: '100%', height: '100%', border: 'none' }}
            />
          </div>
        </div>

        {/* Right: How to Test & Code Integration */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="panel-card">
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', marginBottom: '0.75rem', color: '#fff' }}>
              🧪 How to Test Real-Time Tracking
            </h3>
            <ol style={{ paddingLeft: '1.2rem', color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: '1.8' }}>
              <li>
                <strong>Click any product button</strong> or header link in the store window on the left.
              </li>
              <li>
                The embedded <code>tracker.js</code> script automatically generates a persistent <code>session_id</code> in localStorage.
              </li>
              <li>
                Your clicks with exact <strong>X/Y coordinates, normalized viewport %</strong>, and target metadata are dispatched via <code>sendBeacon</code> to the backend.
              </li>
              <li>
                Switch to the <strong>Sessions & Journey</strong> tab to view your fresh session timeline!
              </li>
              <li>
                Switch to the <strong>Click Heatmap</strong> tab to watch your clicks paint heat spots on the canvas!
              </li>
            </ol>
          </div>

          <div className="panel-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', color: '#fff' }}>
                📦 Client-Side Embedding
              </h3>
              <button
                className="btn btn-outline btn-sm"
                onClick={copySnippet}
                style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
              >
                {copiedSnippet ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                <span>{copiedSnippet ? 'Copied!' : 'Copy Code'}</span>
              </button>
            </div>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.75rem' }}>
              Embed this CDN script on your web application. Zero configuration or external dependencies needed.
            </p>

            <div className="code-snippet-box">
              <code>{snippetCode}</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
