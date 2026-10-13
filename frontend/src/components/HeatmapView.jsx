import React, { useState, useEffect, useRef } from 'react';
import { Flame, Layers, Eye, Sliders, Target, Grid, Info, MousePointer, ExternalLink } from 'lucide-react';

export default function HeatmapView({ 
  pages, 
  selectedPageUrl, 
  setSelectedPageUrl, 
  heatmapData, 
  isLoadingHeatmap 
}) {
  const [viewMode, setViewMode] = useState('heatmap'); // 'heatmap' | 'dots' | 'grid'
  const [radius, setRadius] = useState(35);
  const [opacity, setOpacity] = useState(0.75);
  const [hoveredClick, setHoveredClick] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  // Default dimensions
  const STAGE_WIDTH = 1200;
  const STAGE_HEIGHT = 750;

  // Render Canvas Heatmap when data or settings change
  useEffect(() => {
    if (viewMode !== 'heatmap') return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const clicks = heatmapData?.clicks || [];
    if (clicks.length === 0) return;

    // 1. Create offscreen alpha map
    const alphaCanvas = document.createElement('canvas');
    alphaCanvas.width = canvas.width;
    alphaCanvas.height = canvas.height;
    const alphaCtx = alphaCanvas.getContext('2d');

    clicks.forEach((c) => {
      // Calculate coordinates normalized to canvas resolution
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
      radGrad.addColorStop(0.5, 'rgba(0, 0, 0, 0.2)');
      radGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      alphaCtx.fillStyle = radGrad;
      alphaCtx.beginPath();
      alphaCtx.arc(px, py, rad, 0, Math.PI * 2);
      alphaCtx.fill();
    });

    // 2. Colorize alpha channel with heat gradient
    const imgData = alphaCtx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;

    // Create gradient palette
    const paletteCanvas = document.createElement('canvas');
    paletteCanvas.width = 256;
    paletteCanvas.height = 1;
    const paletteCtx = paletteCanvas.getContext('2d');
    const grad = paletteCtx.createLinearGradient(0, 0, 256, 1);
    grad.addColorStop(0.0, 'rgba(0, 0, 255, 0)');
    grad.addColorStop(0.2, 'rgba(0, 255, 255, 0.8)');
    grad.addColorStop(0.45, 'rgba(0, 255, 0, 0.9)');
    grad.addColorStop(0.7, 'rgba(255, 255, 0, 0.95)');
    grad.addColorStop(0.9, 'rgba(255, 60, 0, 1.0)');
    grad.addColorStop(1.0, 'rgba(255, 0, 0, 1.0)');
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
        data[i] = Math.min(255, alpha * opacity * 1.5); // A
      }
    }

    ctx.putImageData(imgData, 0, 0);
  }, [heatmapData, viewMode, radius, opacity]);

  // Compute Grid density matrix (10 columns x 8 rows)
  const computeGrid = () => {
    const cols = 10;
    const rows = 8;
    const cells = Array.from({ length: rows }, () => Array(cols).fill(0));
    const clicks = heatmapData?.clicks || [];

    if (clicks.length === 0) return { cells, max: 0, cols, rows };

    let maxClicks = 0;
    clicks.forEach((c) => {
      let xPct = c.xPercent ?? (c.x ? (c.x / STAGE_WIDTH) * 100 : 50);
      let yPct = c.yPercent ?? (c.y ? (c.y / STAGE_HEIGHT) * 100 : 50);

      const colIdx = Math.min(cols - 1, Math.max(0, Math.floor((xPct / 100) * cols)));
      const rowIdx = Math.min(rows - 1, Math.max(0, Math.floor((yPct / 100) * rows)));

      cells[rowIdx][colIdx] += 1;
      if (cells[rowIdx][colIdx] > maxClicks) {
        maxClicks = cells[rowIdx][colIdx];
      }
    });

    return { cells, max: maxClicks, cols, rows };
  };

  const gridData = computeGrid();
  const clicks = heatmapData?.clicks || [];

  return (
    <div>
      {/* 1. Heatmap Controls Bar */}
      <div className="heatmap-controls-bar">
        <div className="controls-group-left">
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem', fontWeight: 600 }}>
              SELECT PAGE URL
            </label>
            <select
              className="control-select"
              value={selectedPageUrl || ''}
              onChange={(e) => setSelectedPageUrl(e.target.value)}
            >
              {pages && pages.length > 0 ? (
                pages.map((p, idx) => (
                  <option key={idx} value={p.pageUrl}>
                    {p.pageUrl} ({p.clicks || 0} clicks)
                  </option>
                ))
              ) : (
                <option value="">No tracked pages available yet</option>
              )}
            </select>
          </div>

          {/* View Mode Switcher */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem', fontWeight: 600 }}>
              VISUALIZATION MODE
            </label>
            <div className="view-mode-toggle">
              <button
                className={`mode-btn ${viewMode === 'heatmap' ? 'active' : ''}`}
                onClick={() => setViewMode('heatmap')}
                title="Smooth Gaussian gradient heat density"
              >
                <Flame size={13} style={{ display: 'inline', marginRight: '4px' }} />
                Heatmap
              </button>
              <button
                className={`mode-btn ${viewMode === 'dots' ? 'active' : ''}`}
                onClick={() => setViewMode('dots')}
                title="Individual interactive click dots"
              >
                <Target size={13} style={{ display: 'inline', marginRight: '4px' }} />
                Scatter Dots
              </button>
              <button
                className={`mode-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
                title="10x8 spatial density matrix grid"
              >
                <Grid size={13} style={{ display: 'inline', marginRight: '4px' }} />
                Density Grid
              </button>
            </div>
          </div>
        </div>

        <div className="controls-group-right">
          {/* Sliders */}
          {viewMode === 'heatmap' && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Radius: {radius}px</span>
                <input
                  type="range"
                  min="15"
                  max="65"
                  value={radius}
                  onChange={(e) => setRadius(Number(e.target.value))}
                  style={{ cursor: 'pointer', width: '85px' }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Opacity: {Math.round(opacity * 100)}%</span>
                <input
                  type="range"
                  min="0.2"
                  max="1.0"
                  step="0.05"
                  value={opacity}
                  onChange={(e) => setOpacity(Number(e.target.value))}
                  style={{ cursor: 'pointer', width: '85px' }}
                />
              </div>
            </>
          )}

          {/* Page Link */}
          {selectedPageUrl && (
            <div>
              <a
                href={selectedPageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline btn-sm"
                style={{ fontSize: '0.8rem' }}
              >
                <span>Visit Page</span>
                <ExternalLink size={12} />
              </a>
            </div>
          )}
        </div>
      </div>

      {/* 2. Page Stats Overview Banner */}
      {heatmapData && (
        <div style={{ display: 'flex', gap: '1.5rem', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-card)', borderRadius: '10px', padding: '0.85rem 1.25rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center', fontSize: '0.85rem' }}>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Total Clicks: </span>
            <strong style={{ color: '#c084fc', fontSize: '1rem' }}>{heatmapData.totalClicks}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Unique Sessions: </span>
            <strong style={{ color: '#38bdf8', fontSize: '1rem' }}>{heatmapData.uniqueSessions}</strong>
          </div>
          {heatmapData.topElements && heatmapData.topElements.length > 0 && (
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Top Clicked Target: </span>
              <strong style={{ color: '#34d399' }}>
                {heatmapData.topElements[0].target} ({heatmapData.topElements[0].count} clicks)
              </strong>
            </div>
          )}
        </div>
      )}

      {/* 3. Heatmap Stage */}
      <div className="heatmap-stage-wrapper">
        <div className="heatmap-browser-bar">
          <div className="browser-dots">
            <span className="b-dot dot-red"></span>
            <span className="b-dot dot-yellow"></span>
            <span className="b-dot dot-green"></span>
          </div>
          <div className="browser-url-bar">
            {selectedPageUrl || 'http://localhost:5000/demo/index.html'}
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            Viewport: {STAGE_WIDTH}x{STAGE_HEIGHT}
          </span>
        </div>

        <div
          ref={containerRef}
          className="heatmap-canvas-container"
          style={{ height: `${STAGE_HEIGHT}px` }}
          onMouseLeave={() => setHoveredClick(null)}
        >
          {/* Wireframe Mockup Underlay (Simulates the demo e-commerce store layout) */}
          <div className="mockup-underlay">
            {/* Header */}
            <div style={{ height: '60px', borderBottom: '1px solid #1e293b', background: '#0e1628', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2rem' }}>
              <div style={{ fontWeight: 700, color: '#fff', fontSize: '1.1rem' }}>AURA STORE</div>
              <div style={{ display: 'flex', gap: '1.5rem', color: '#64748b', fontSize: '0.85rem' }}>
                <span>Home</span>
                <span>Products</span>
                <span>Featured</span>
                <span>Cart (1)</span>
              </div>
            </div>

            {/* Hero / Banner Wireframe */}
            <div style={{ height: '280px', background: 'radial-gradient(circle at 50% 30%, #1e2544 0%, #0d1222 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid #1e293b' }}>
              <div style={{ width: '140px', height: '24px', background: '#273456', borderRadius: '12px', marginBottom: '1rem' }}></div>
              <div style={{ width: '450px', height: '36px', background: '#334155', borderRadius: '8px', marginBottom: '1rem' }}></div>
              <div style={{ width: '560px', height: '16px', background: '#1e293b', borderRadius: '6px', marginBottom: '1.5rem' }}></div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ width: '180px', height: '42px', background: '#4f46e5', borderRadius: '8px' }}></div>
                <div style={{ width: '140px', height: '42px', background: '#1e293b', borderRadius: '8px', border: '1px solid #334155' }}></div>
              </div>
            </div>

            {/* Products Row Wireframe */}
            <div style={{ padding: '2rem', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
              {[1, 2, 3].map((card) => (
                <div key={card} style={{ height: '260px', background: '#141d33', border: '1px solid #1e293b', borderRadius: '12px', padding: '1rem', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ height: '120px', background: '#1e293b', borderRadius: '8px', marginBottom: '1rem' }}></div>
                  <div style={{ width: '60%', height: '16px', background: '#334155', borderRadius: '4px', marginBottom: '0.5rem' }}></div>
                  <div style={{ width: '30%', height: '20px', background: '#475569', borderRadius: '4px', marginBottom: 'auto' }}></div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                    <div style={{ flex: 1, height: '34px', background: '#1e293b', borderRadius: '6px' }}></div>
                    <div style={{ flex: 1, height: '34px', background: '#4338ca', borderRadius: '6px' }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* MODE 1: Canvas Heatmap Layer */}
          {viewMode === 'heatmap' && (
            <canvas
              ref={canvasRef}
              width={STAGE_WIDTH}
              height={STAGE_HEIGHT}
              className="heatmap-canvas"
            />
          )}

          {/* MODE 2: Scatter Dots Layer */}
          {viewMode === 'dots' && (
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
              {clicks.map((c, idx) => {
                let posX = c.x;
                let posY = c.y;

                if (c.xPercent !== null && c.xPercent !== undefined) {
                  posX = (c.xPercent / 100) * STAGE_WIDTH;
                }
                if (c.yPercent !== null && c.yPercent !== undefined) {
                  posY = (c.yPercent / 100) * STAGE_HEIGHT;
                }

                return (
                  <div
                    key={c.id || idx}
                    className="click-dot"
                    style={{
                      left: `${posX}px`,
                      top: `${posY}px`,
                      pointerEvents: 'auto',
                    }}
                    onMouseEnter={(e) => {
                      setHoveredClick(c);
                      const rect = containerRef.current?.getBoundingClientRect();
                      if (rect) {
                        setTooltipPos({
                          x: e.clientX - rect.left,
                          y: e.clientY - rect.top,
                        });
                      }
                    }}
                    onMouseMove={(e) => {
                      const rect = containerRef.current?.getBoundingClientRect();
                      if (rect) {
                        setTooltipPos({
                          x: e.clientX - rect.left,
                          y: e.clientY - rect.top,
                        });
                      }
                    }}
                  />
                );
              })}
            </div>
          )}

          {/* MODE 3: Density Grid Layer */}
          {viewMode === 'grid' && (
            <div style={{ position: 'absolute', inset: 0 }}>
              {gridData.cells.map((row, rIdx) =>
                row.map((count, cIdx) => {
                  const widthPct = 100 / gridData.cols;
                  const heightPct = 100 / gridData.rows;
                  const left = cIdx * widthPct;
                  const top = rIdx * heightPct;

                  const ratio = gridData.max > 0 ? count / gridData.max : 0;
                  const bg =
                    count === 0
                      ? 'transparent'
                      : ratio < 0.25
                      ? 'rgba(59, 130, 246, 0.35)'
                      : ratio < 0.6
                      ? 'rgba(234, 179, 8, 0.45)'
                      : 'rgba(239, 68, 68, 0.6)';

                  return (
                    <div
                      key={`${rIdx}-${cIdx}`}
                      className="grid-cell"
                      style={{
                        left: `${left}%`,
                        top: `${top}%`,
                        width: `${widthPct}%`,
                        height: `${heightPct}%`,
                        backgroundColor: bg,
                        color: count > 0 ? '#fff' : 'transparent',
                      }}
                      title={`Cell [${cIdx + 1}, ${rIdx + 1}]: ${count} click(s)`}
                    >
                      {count > 0 && count}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Interactive Tooltip on hover */}
          {hoveredClick && (
            <div
              style={{
                position: 'absolute',
                left: `${tooltipPos.x + 12}px`,
                top: `${tooltipPos.y + 12}px`,
                background: 'rgba(15, 23, 42, 0.95)',
                backdropFilter: 'blur(8px)',
                border: '1px solid #3b82f6',
                borderRadius: '8px',
                padding: '0.6rem 0.85rem',
                fontSize: '0.78rem',
                color: '#fff',
                pointerEvents: 'none',
                zIndex: 100,
                boxShadow: '0 8px 20px rgba(0,0,0,0.6)',
                maxWidth: '260px',
              }}
            >
              <div style={{ fontWeight: 700, color: '#38bdf8', marginBottom: '0.2rem' }}>
                {hoveredClick.metadata?.elementTag || 'CLICK TARGET'}
                {hoveredClick.metadata?.elementId ? ` #${hoveredClick.metadata.elementId}` : ''}
              </div>
              {hoveredClick.metadata?.elementText && (
                <div style={{ color: '#e2e8f0', marginBottom: '0.35rem' }}>
                  "{hoveredClick.metadata.elementText}"
                </div>
              )}
              <div style={{ color: '#94a3b8', fontFamily: 'var(--font-mono)', fontSize: '0.72rem' }}>
                X: {hoveredClick.x}px | Y: {hoveredClick.y}px
                {hoveredClick.xPercent !== null && ` (${hoveredClick.xPercent}% / ${hoveredClick.yPercent}%)`}
              </div>
              <div style={{ color: '#64748b', fontSize: '0.7rem', marginTop: '0.2rem' }}>
                Session: {hoveredClick.sessionId?.substring(0, 12)}...
              </div>
            </div>
          )}

          {/* Legend */}
          <div className="heatmap-legend">
            <span>Low</span>
            <div className="legend-bar"></div>
            <span>High Intensity</span>
          </div>
        </div>
      </div>

      {/* 4. Top Clicked Elements Table */}
      {heatmapData?.topElements && heatmapData.topElements.length > 0 && (
        <div className="panel-card" style={{ marginTop: '1.5rem' }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MousePointer size={16} style={{ color: '#c084fc' }} />
            <span>Element Interaction Leaderboard</span>
          </h3>

          <table className="data-table">
            <thead>
              <tr>
                <th>Element Target / Selector</th>
                <th>Total Clicks</th>
                <th>Click Share</th>
              </tr>
            </thead>
            <tbody>
              {heatmapData.topElements.map((el, idx) => {
                const pct = ((el.count / heatmapData.totalClicks) * 100).toFixed(1);
                return (
                  <tr key={idx}>
                    <td style={{ fontFamily: 'var(--font-mono)', color: '#e2e8f0' }}>{el.target}</td>
                    <td>
                      <span style={{ fontWeight: 700, color: '#c084fc' }}>{el.count}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ flex: 1, maxWidth: '120px', height: '6px', background: '#1e293b', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: 'var(--gradient-brand)' }}></div>
                        </div>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{pct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
