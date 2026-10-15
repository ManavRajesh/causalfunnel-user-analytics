import React, { useState, useEffect, useRef } from 'react';
import { 
  Flame, Layers, Eye, Sliders, Target, Grid, Info, MousePointer, 
  ExternalLink, Smartphone, Monitor, Tablet, Palette, Sparkles, Filter
} from 'lucide-react';

export default function HeatmapView({ 
  pages, 
  selectedPageUrl, 
  setSelectedPageUrl, 
  heatmapData, 
  isLoadingHeatmap 
}) {
  const [viewMode, setViewMode] = useState('heatmap'); // 'heatmap' | 'dots' | 'grid'
  const [paletteMode, setPaletteMode] = useState('thermal'); // 'thermal' | 'inferno' | 'cyber'
  const [deviceViewport, setDeviceViewport] = useState('desktop'); // 'desktop' | 'tablet' | 'mobile'
  const [radius, setRadius] = useState(36);
  const [opacity, setOpacity] = useState(0.8);
  const [hoveredClick, setHoveredClick] = useState(null);
  const [hoveredTargetId, setHoveredTargetId] = useState(null);
  const [underlayMode, setUnderlayMode] = useState('fidelity'); // 'fidelity' | 'iframe'

  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  // Viewport dimensions
  const viewports = {
    desktop: { width: 1200, height: 750, label: 'Desktop (1200×750)' },
    tablet: { width: 768, height: 620, label: 'Tablet (768×620)' },
    mobile: { width: 420, height: 680, label: 'Mobile (420×680)' },
  };

  const currentViewport = viewports[deviceViewport];
  const STAGE_WIDTH = currentViewport.width;
  const STAGE_HEIGHT = currentViewport.height;

  // Render Canvas Heatmap when data, palette, or radius changes
  useEffect(() => {
    if (viewMode !== 'heatmap') return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const clicks = heatmapData?.clicks || [];
    if (clicks.length === 0) return;

    // 1. Create offscreen alpha channel map
    const alphaCanvas = document.createElement('canvas');
    alphaCanvas.width = canvas.width;
    alphaCanvas.height = canvas.height;
    const alphaCtx = alphaCanvas.getContext('2d');

    clicks.forEach((c) => {
      let px = c.x;
      let py = c.y;

      if (c.xPercent !== null && c.xPercent !== undefined) {
        px = (c.xPercent / 100) * canvas.width;
      }
      if (c.yPercent !== null && c.yPercent !== undefined) {
        py = (c.yPercent / 100) * canvas.height;
      }

      if (px === null || py === null) return;

      const rad = radius;
      const radGrad = alphaCtx.createRadialGradient(px, py, 0, px, py, rad);
      radGrad.addColorStop(0, 'rgba(0, 0, 0, 0.45)');
      radGrad.addColorStop(0.5, 'rgba(0, 0, 0, 0.18)');
      radGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      alphaCtx.fillStyle = radGrad;
      alphaCtx.beginPath();
      alphaCtx.arc(px, py, rad, 0, Math.PI * 2);
      alphaCtx.fill();
    });

    // 2. Colorize alpha channel with selected heat gradient palette
    const imgData = alphaCtx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;

    const paletteCanvas = document.createElement('canvas');
    paletteCanvas.width = 256;
    paletteCanvas.height = 1;
    const paletteCtx = paletteCanvas.getContext('2d');
    const grad = paletteCtx.createLinearGradient(0, 0, 256, 1);

    if (paletteMode === 'thermal') {
      grad.addColorStop(0.0, 'rgba(0, 0, 255, 0)');
      grad.addColorStop(0.2, 'rgba(0, 255, 255, 0.8)');
      grad.addColorStop(0.45, 'rgba(0, 255, 0, 0.9)');
      grad.addColorStop(0.7, 'rgba(255, 255, 0, 0.95)');
      grad.addColorStop(0.9, 'rgba(255, 60, 0, 1.0)');
      grad.addColorStop(1.0, 'rgba(255, 0, 0, 1.0)');
    } else if (paletteMode === 'inferno') {
      grad.addColorStop(0.0, 'rgba(0, 0, 0, 0)');
      grad.addColorStop(0.25, 'rgba(87, 16, 110, 0.85)');
      grad.addColorStop(0.5, 'rgba(187, 55, 84, 0.95)');
      grad.addColorStop(0.75, 'rgba(249, 142, 9, 1.0)');
      grad.addColorStop(1.0, 'rgba(252, 255, 164, 1.0)');
    } else {
      // Cyber neon
      grad.addColorStop(0.0, 'rgba(10, 10, 25, 0)');
      grad.addColorStop(0.3, 'rgba(6, 182, 212, 0.8)');
      grad.addColorStop(0.6, 'rgba(139, 92, 246, 0.9)');
      grad.addColorStop(0.85, 'rgba(236, 72, 153, 0.95)');
      grad.addColorStop(1.0, 'rgba(255, 255, 255, 1.0)');
    }

    paletteCtx.fillStyle = grad;
    paletteCtx.fillRect(0, 0, 256, 1);
    const palette = paletteCtx.getImageData(0, 0, 256, 1).data;

    for (let i = 3; i < data.length; i += 4) {
      const alpha = data[i];
      if (alpha > 0) {
        const offset = alpha * 4;
        data[i - 3] = palette[offset];     // R
        data[i - 2] = palette[offset + 1]; // G
        data[i - 1] = palette[offset + 2]; // B
        data[i] = Math.min(255, alpha * opacity * 1.6); // A
      }
    }

    ctx.putImageData(imgData, 0, 0);
  }, [heatmapData, viewMode, paletteMode, radius, opacity, STAGE_WIDTH, STAGE_HEIGHT]);

  const clicks = heatmapData?.clicks || [];

  // Group top clicked elements from clicks data
  const targetMap = {};
  clicks.forEach((c) => {
    const key = c.targetId || c.targetText || c.targetTag || 'general-viewport';
    if (!targetMap[key]) {
      targetMap[key] = {
        key,
        tag: c.targetTag || 'ELEMENT',
        text: c.targetText || key,
        count: 0,
        xPct: c.xPercent,
        yPct: c.yPercent
      };
    }
    targetMap[key].count += 1;
  });

  const rankedTargets = Object.values(targetMap)
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  return (
    <div>
      {/* View Header */}
      <div className="view-header">
        <div className="view-title-group">
          <h1>
            <Flame size={22} style={{ color: '#f43f5e' }} />
            <span>Click Heatmap & Attention Studio</span>
          </h1>
          <p>Gaussian spatial density visualization, interactive scatter coordinate dots, and element ranking.</p>
        </div>
      </div>

      {/* Control Bar */}
      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <div className="card-body" style={{ padding: '0.9rem 1.4rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            
            {/* Left Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-tertiary)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.2rem' }}>
                  Target Page URL
                </label>
                <select
                  style={{
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-card)',
                    color: '#fff',
                    padding: '0.4rem 0.8rem',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    minWidth: '260px'
                  }}
                  value={selectedPageUrl || ''}
                  onChange={(e) => setSelectedPageUrl(e.target.value)}
                >
                  {pages && pages.length > 0 ? (
                    pages.map((p, idx) => (
                      <option key={idx} value={p.pageUrl}>
                        {p.pageUrl.replace(/^https?:\/\/[^/]+/, '') || p.pageUrl} ({p.clicks || 0} clicks)
                      </option>
                    ))
                  ) : (
                    <option value="">No pages available</option>
                  )}
                </select>
              </div>

              {/* View Mode Toggle */}
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-tertiary)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.2rem' }}>
                  Visualization Mode
                </label>
                <div style={{ display: 'flex', background: 'var(--bg-surface)', padding: '0.2rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <button
                    className={`btn btn-sm ${viewMode === 'heatmap' ? 'btn-secondary' : 'btn-ghost'}`}
                    style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem' }}
                    onClick={() => setViewMode('heatmap')}
                  >
                    <Flame size={12} style={{ color: '#f43f5e' }} />
                    <span>Heatmap</span>
                  </button>
                  <button
                    className={`btn btn-sm ${viewMode === 'dots' ? 'btn-secondary' : 'btn-ghost'}`}
                    style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem' }}
                    onClick={() => setViewMode('dots')}
                  >
                    <Target size={12} style={{ color: '#38bdf8' }} />
                    <span>Scatter Dots</span>
                  </button>
                </div>
              </div>

              {/* Device Viewport Selector */}
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-tertiary)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.2rem' }}>
                  Device Viewport
                </label>
                <div style={{ display: 'flex', background: 'var(--bg-surface)', padding: '0.2rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <button
                    className={`btn btn-sm ${deviceViewport === 'desktop' ? 'btn-secondary' : 'btn-ghost'}`}
                    style={{ padding: '0.25rem 0.55rem' }}
                    onClick={() => setDeviceViewport('desktop')}
                    title="Desktop 1200x750"
                  >
                    <Monitor size={13} />
                  </button>
                  <button
                    className={`btn btn-sm ${deviceViewport === 'tablet' ? 'btn-secondary' : 'btn-ghost'}`}
                    style={{ padding: '0.25rem 0.55rem' }}
                    onClick={() => setDeviceViewport('tablet')}
                    title="Tablet 768x620"
                  >
                    <Tablet size={13} />
                  </button>
                  <button
                    className={`btn btn-sm ${deviceViewport === 'mobile' ? 'btn-secondary' : 'btn-ghost'}`}
                    style={{ padding: '0.25rem 0.55rem' }}
                    onClick={() => setDeviceViewport('mobile')}
                    title="Mobile 420x680"
                  >
                    <Smartphone size={13} />
                  </button>
                </div>
              </div>
            </div>

            {/* Right Sliders & Options */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              {viewMode === 'heatmap' && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Palette:</span>
                    <select
                      style={{
                        background: 'var(--bg-input)',
                        border: '1px solid var(--border-card)',
                        color: '#fff',
                        padding: '0.3rem 0.6rem',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.75rem',
                      }}
                      value={paletteMode}
                      onChange={(e) => setPaletteMode(e.target.value)}
                    >
                      <option value="thermal">Thermal Glow</option>
                      <option value="inferno">Inferno Magma</option>
                      <option value="cyber">Cyber Neon</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Radius: {radius}px</span>
                    <input
                      type="range"
                      min="15"
                      max="65"
                      value={radius}
                      onChange={(e) => setRadius(Number(e.target.value))}
                      style={{ width: '70px', cursor: 'pointer' }}
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Opacity: {Math.round(opacity * 100)}%</span>
                    <input
                      type="range"
                      min="0.2"
                      max="1.0"
                      step="0.05"
                      value={opacity}
                      onChange={(e) => setOpacity(Number(e.target.value))}
                      style={{ width: '70px', cursor: 'pointer' }}
                    />
                  </div>
                </>
              )}

              {selectedPageUrl && (
                <a
                  href={selectedPageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline btn-sm"
                  title="Open live webpage in new tab"
                >
                  <span>Visit Page</span>
                  <ExternalLink size={11} />
                </a>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* Grid: Canvas Stage + Top Clicked Targets */}
      <div style={{ display: 'grid', gridTemplateColumns: deviceViewport === 'desktop' ? '1fr 340px' : '1fr', gap: '1.25rem', alignItems: 'start' }}>
        
        {/* Stage Wrapper */}
        <div className="heatmap-stage-frame">
          <div className="browser-header-mockup">
            <div className="mac-traffic-lights">
              <span className="traffic-light traffic-red" />
              <span className="traffic-light traffic-yellow" />
              <span className="traffic-light traffic-green" />
            </div>

            <div className="browser-url-input">
              <span style={{ color: 'var(--text-tertiary)' }}>🔒</span>
              <span>{selectedPageUrl || 'http://localhost:5001/demo/index.html'}</span>
            </div>

            <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
              {STAGE_WIDTH}×{STAGE_HEIGHT}
            </span>
          </div>

          <div
            ref={containerRef}
            className="heatmap-canvas-wrapper"
            style={{ width: '100%', maxWidth: `${STAGE_WIDTH}px`, height: `${STAGE_HEIGHT}px`, margin: '0 auto' }}
          >
            {/* High Fidelity Mock Underlay matching the Aura Store */}
            <div className="mockup-store-canvas">
              {/* Store Nav */}
              <div className="mockup-store-nav">
                <div style={{ fontWeight: 800, letterSpacing: '-0.02em', fontSize: '1.1rem' }}>AURA</div>
                <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.8rem', color: '#94a3b8' }}>
                  <span style={{ color: '#fff' }}>Home</span>
                  <span>Products</span>
                  <span>Featured</span>
                  <span>Cart (1)</span>
                </div>
                <div style={{ background: '#4f46e5', padding: '0.25rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600 }}>
                  🛒 Bag
                </div>
              </div>

              {/* Store Hero */}
              <div className="mockup-hero">
                <span style={{ fontSize: '0.7rem', color: '#818cf8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.4rem' }}>
                  Next-Gen Audio Experience
                </span>
                <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff', marginBottom: '0.5rem' }}>
                  Hear Sound As It Was Intended
                </h2>
                <p style={{ maxWidth: '440px', fontSize: '0.82rem', color: '#94a3b8', marginBottom: '1.2rem' }}>
                  Spatial active noise cancellation, handcrafted acoustic drivers, and 48-hour battery longevity.
                </p>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <div className="mockup-hero-btn" id="hero-shop-now">
                    Explore Aura Pro &rarr;
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.08)', padding: '0.6rem 1.2rem', borderRadius: '8px', fontSize: '0.9rem', color: '#cbd5e1' }}>
                    Browse Collection
                  </div>
                </div>
              </div>

              {/* Store Products */}
              <div className="mockup-products-row">
                <div className="mockup-prod-card" id="card-featured-1">
                  <div style={{ height: '90px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', marginBottom: '0.75rem' }}>
                    🎧
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#fff' }}>Aura Wireless Headphones</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: 'auto' }}>$249.00</div>
                  <div style={{ background: '#4f46e5', padding: '0.4rem', borderRadius: '6px', textAlign: 'center', fontSize: '0.75rem', fontWeight: 600, marginTop: '0.75rem' }}>
                    Add to Cart
                  </div>
                </div>

                <div className="mockup-prod-card" id="card-featured-2">
                  <div style={{ height: '90px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', marginBottom: '0.75rem' }}>
                    ⌚
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#fff' }}>Minimalist Chrono Watch</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: 'auto' }}>$189.00</div>
                  <div style={{ background: '#4f46e5', padding: '0.4rem', borderRadius: '6px', textAlign: 'center', fontSize: '0.75rem', fontWeight: 600, marginTop: '0.75rem' }}>
                    Add to Cart
                  </div>
                </div>

                <div className="mockup-prod-card">
                  <div style={{ height: '90px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', marginBottom: '0.75rem' }}>
                    🔊
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#fff' }}>Aura Sound Speaker</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: 'auto' }}>$129.00</div>
                  <div style={{ background: '#4f46e5', padding: '0.4rem', borderRadius: '6px', textAlign: 'center', fontSize: '0.75rem', fontWeight: 600, marginTop: '0.75rem' }}>
                    Add to Cart
                  </div>
                </div>
              </div>
            </div>

            {/* Mode 1: Canvas Heatmap Layer */}
            {viewMode === 'heatmap' && (
              <canvas
                ref={canvasRef}
                width={STAGE_WIDTH}
                height={STAGE_HEIGHT}
                className="heatmap-overlay-canvas"
              />
            )}

            {/* Mode 2: Interactive Scatter Dots Layer */}
            {viewMode === 'dots' && (
              <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 12 }}>
                {clicks.map((c, idx) => {
                  let posX = c.x;
                  let posY = c.y;

                  if (c.xPercent !== null && c.xPercent !== undefined) {
                    posX = (c.xPercent / 100) * STAGE_WIDTH;
                  }
                  if (c.yPercent !== null && c.yPercent !== undefined) {
                    posY = (c.yPercent / 100) * STAGE_HEIGHT;
                  }

                  const isTargetHighlighted = hoveredTargetId && (c.targetId === hoveredTargetId || c.targetText === hoveredTargetId);

                  return (
                    <div
                      key={c.id || idx}
                      className="scatter-click-dot"
                      style={{
                        left: `${posX}px`,
                        top: `${posY}px`,
                        transform: isTargetHighlighted ? 'translate(-50%, -50%) scale(2)' : undefined,
                        background: isTargetHighlighted ? '#10b981' : undefined
                      }}
                      onMouseEnter={() => setHoveredClick({ ...c, posX, posY })}
                      onMouseLeave={() => setHoveredClick(null)}
                    />
                  );
                })}
              </div>
            )}

            {/* Hover Tooltip */}
            {hoveredClick && (
              <div
                className="chart-tooltip"
                style={{
                  left: `${hoveredClick.posX}px`,
                  top: `${hoveredClick.posY - 15}px`,
                  zIndex: 50,
                  transform: 'translate(-50%, -100%)'
                }}
              >
                <div style={{ fontWeight: 700, color: '#fff' }}>
                  {hoveredClick.targetText || hoveredClick.targetId || 'Clicked Element'}
                </div>
                <div style={{ color: '#c7d2fe', fontSize: '0.72rem', fontFamily: 'var(--font-mono)' }}>
                  #{hoveredClick.targetId || 'target'} {hoveredClick.targetTag ? `<${hoveredClick.targetTag}>` : ''}
                </div>
                <div style={{ color: '#38bdf8', fontSize: '0.7rem', marginTop: '2px' }}>
                  X: {Math.round(hoveredClick.posX)}px, Y: {Math.round(hoveredClick.posY)}px
                  {hoveredClick.xPercent !== null && ` (${hoveredClick.xPercent}% / ${hoveredClick.yPercent}%)`}
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Top Clicked Targets Ranking Panel */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <MousePointer size={16} style={{ color: '#c084fc' }} />
              <span>Target Interaction Rank</span>
            </div>
            <span style={{ fontSize: '0.72rem', color: '#34d399', fontWeight: 600 }}>
              {clicks.length} Total Clicks
            </span>
          </div>

          <div className="card-body" style={{ padding: '0.9rem' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', marginBottom: '0.85rem' }}>
              Hover any element below to highlight its click clusters on the canvas.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {rankedTargets.length > 0 ? (
                rankedTargets.map((item, idx) => {
                  const sharePct = clicks.length > 0 ? Math.round((item.count / clicks.length) * 100) : 0;
                  return (
                    <div
                      key={idx}
                      style={{
                        background: hoveredTargetId === item.key ? 'rgba(99, 102, 241, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid',
                        borderColor: hoveredTargetId === item.key ? 'var(--brand-primary)' : 'var(--border-subtle)',
                        borderRadius: 'var(--radius-md)',
                        padding: '0.65rem 0.85rem',
                        cursor: 'pointer',
                        transition: 'all 0.15s'
                      }}
                      onMouseEnter={() => setHoveredTargetId(item.key)}
                      onMouseLeave={() => setHoveredTargetId(null)}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                        <span style={{ fontWeight: 600, color: '#fff', fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px' }}>
                          {item.text}
                        </span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#c084fc' }}>
                          {item.count} clicks ({sharePct}%)
                        </span>
                      </div>

                      <div className="funnel-progress-track" style={{ height: '4px' }}>
                        <div
                          className="funnel-progress-fill"
                          style={{ width: `${sharePct}%`, background: '#c084fc' }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  No clicks recorded for this page yet.
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
