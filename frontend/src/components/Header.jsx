import React from 'react';
import { BarChart3, Users, Flame, Play, Sparkles, RefreshCw, ExternalLink, Database } from 'lucide-react';

export default function Header({ activeTab, setActiveTab, onRefresh, onSeed, isSeeding, isRefreshing, health }) {
  return (
    <header className="app-header">
      <div className="logo-group">
        <div className="logo-icon">
          <BarChart3 size={22} />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="brand-title">CausalFunnel</span>
            <span className="brand-badge">Analytics</span>
          </div>
        </div>
      </div>

      <nav className="nav-tabs">
        <button
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <BarChart3 size={16} />
          <span>Overview</span>
        </button>

        <button
          className={`tab-btn ${activeTab === 'sessions' ? 'active' : ''}`}
          onClick={() => setActiveTab('sessions')}
        >
          <Users size={16} />
          <span>Sessions & Journey</span>
        </button>

        <button
          className={`tab-btn ${activeTab === 'heatmap' ? 'active' : ''}`}
          onClick={() => setActiveTab('heatmap')}
        >
          <Flame size={16} />
          <span>Click Heatmap</span>
        </button>

        <button
          className={`tab-btn ${activeTab === 'playground' ? 'active' : ''}`}
          onClick={() => setActiveTab('playground')}
        >
          <Play size={16} />
          <span>Live Demo Store</span>
        </button>
      </nav>

      <div className="header-actions">
        {health?.mongoConnected ? (
          <div className="status-pill" title="MongoDB connection healthy">
            <div className="pulse-dot"></div>
            <span>MongoDB Active</span>
          </div>
        ) : (
          <div className="status-pill" style={{ background: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.3)', color: '#f87171' }}>
            <Database size={13} />
            <span>Connecting...</span>
          </div>
        )}

        <button
          className="btn btn-outline btn-sm"
          onClick={onRefresh}
          disabled={isRefreshing}
          title="Refresh metrics and sessions"
        >
          <RefreshCw size={14} className={isRefreshing ? 'spin-anim' : ''} />
          <span>Refresh</span>
        </button>

        <button
          className="btn btn-primary btn-sm"
          onClick={onSeed}
          disabled={isSeeding}
          title="Seed realistic sample sessions"
        >
          <Sparkles size={14} />
          <span>{isSeeding ? 'Seeding...' : 'Seed Data'}</span>
        </button>

        <a
          href="/demo/index.html"
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-outline btn-sm"
          title="Open interactive demo site in new tab"
        >
          <span>Store</span>
          <ExternalLink size={13} />
        </a>
      </div>
    </header>
  );
}
