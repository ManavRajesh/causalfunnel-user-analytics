import React, { useState } from 'react';
import { 
  BarChart3, Users, Flame, Play, Sparkles, RefreshCw, 
  ExternalLink, Database, Activity, Check, ChevronDown
} from 'lucide-react';

export default function Header({ 
  activeTab, 
  setActiveTab, 
  onRefresh, 
  onSeed, 
  isSeeding, 
  isRefreshing, 
  health,
  sessionCount = 0,
  pageCount = 0,
  autoRefresh = true,
  setAutoRefresh
}) {
  const [seedMenuOpen, setSeedMenuOpen] = useState(false);

  return (
    <header className="app-header">
      {/* Brand & Logo */}
      <div className="logo-group" onClick={() => setActiveTab('overview')}>
        <div className="logo-icon-wrap">
          <Activity size={18} strokeWidth={2.4} />
        </div>
        <div className="brand-text-col">
          <div className="brand-title-row">
            <span className="brand-title">CausalFunnel</span>
            <span className="brand-badge">SaaS Intelligence</span>
          </div>
          <span className="brand-subtitle">Session Journeys & Click Heatmaps</span>
        </div>
      </div>

      {/* Segmented Navigation Tabs */}
      <nav className="nav-tabs-segmented" role="tablist">
        <button
          role="tab"
          aria-selected={activeTab === 'overview'}
          className={`segmented-tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <BarChart3 size={15} />
          <span>Overview</span>
        </button>

        <button
          role="tab"
          aria-selected={activeTab === 'sessions'}
          className={`segmented-tab ${activeTab === 'sessions' ? 'active' : ''}`}
          onClick={() => setActiveTab('sessions')}
        >
          <Users size={15} />
          <span>Sessions & Journey</span>
          {sessionCount > 0 && <span className="tab-badge">{sessionCount}</span>}
        </button>

        <button
          role="tab"
          aria-selected={activeTab === 'heatmap'}
          className={`segmented-tab ${activeTab === 'heatmap' ? 'active' : ''}`}
          onClick={() => setActiveTab('heatmap')}
        >
          <Flame size={15} />
          <span>Click Heatmap</span>
          {pageCount > 0 && <span className="tab-badge">{pageCount}</span>}
        </button>

        <button
          role="tab"
          aria-selected={activeTab === 'playground'}
          className={`segmented-tab ${activeTab === 'playground' ? 'active' : ''}`}
          onClick={() => setActiveTab('playground')}
        >
          <Play size={15} />
          <span>Live Demo Store</span>
        </button>
      </nav>

      {/* Header Right Actions */}
      <div className="header-actions">
        {/* MongoDB Connectivity Status */}
        {health?.mongoConnected ? (
          <div className="status-pill" title="MongoDB 127.0.0.1:27017 connection healthy">
            <div className="pulse-dot"></div>
            <span>MongoDB Connected</span>
          </div>
        ) : (
          <div className="status-pill" style={{ background: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.3)', color: '#f87171' }}>
            <Database size={12} />
            <span>Connecting DB...</span>
          </div>
        )}

        {/* Refresh Button */}
        <button
          className="btn btn-outline btn-sm"
          onClick={onRefresh}
          disabled={isRefreshing}
          title="Refresh analytics and event sessions"
        >
          <RefreshCw size={13} className={isRefreshing ? 'spin-anim' : ''} />
          <span>{isRefreshing ? 'Syncing...' : 'Refresh'}</span>
        </button>

        {/* Seed Data Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => onSeed(8)}
            disabled={isSeeding}
            title="Seed realistic e-commerce user sessions"
          >
            <Sparkles size={13} />
            <span>{isSeeding ? 'Seeding...' : 'Seed Data'}</span>
          </button>
        </div>

        {/* Store Launch Link */}
        <a
          href="/demo/index.html"
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-secondary btn-sm"
          title="Open interactive Aura Store demo in a new browser tab"
        >
          <span>Store</span>
          <ExternalLink size={12} />
        </a>
      </div>
    </header>
  );
}
