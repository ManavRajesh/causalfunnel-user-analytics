import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import OverviewView from './components/OverviewView';
import SessionsView from './components/SessionsView';
import HeatmapView from './components/HeatmapView';
import PlaygroundView from './components/PlaygroundView';
import { 
  fetchStats, 
  fetchSessions, 
  fetchSessionEvents, 
  fetchHeatmapData, 
  fetchPages, 
  seedDemoData, 
  checkHealth 
} from './api';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [sessionJourney, setSessionJourney] = useState(null);
  const [isLoadingJourney, setIsLoadingJourney] = useState(false);
  const [pages, setPages] = useState([]);
  const [selectedPageUrl, setSelectedPageUrl] = useState('');
  const [heatmapData, setHeatmapData] = useState(null);
  const [isLoadingHeatmap, setIsLoadingHeatmap] = useState(false);
  const [health, setHealth] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [notification, setNotification] = useState(null);

  const showToast = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  // Load overall metrics & pages
  const loadCoreData = useCallback(async () => {
    try {
      const [statsRes, pagesRes, sessionsRes, healthRes] = await Promise.allSettled([
        fetchStats(),
        fetchPages(),
        fetchSessions(1, 50),
        checkHealth(),
      ]);

      if (statsRes.status === 'fulfilled') setStats(statsRes.value);
      if (healthRes.status === 'fulfilled') setHealth(healthRes.value);

      if (pagesRes.status === 'fulfilled' && pagesRes.value.data) {
        setPages(pagesRes.value.data);
        if (!selectedPageUrl && pagesRes.value.data.length > 0) {
          setSelectedPageUrl(pagesRes.value.data[0].pageUrl);
        }
      }

      if (sessionsRes.status === 'fulfilled' && sessionsRes.value.data) {
        setSessions(sessionsRes.value.data);
        if (!selectedSessionId && sessionsRes.value.data.length > 0) {
          setSelectedSessionId(sessionsRes.value.data[0].sessionId);
        }
      }
    } catch (err) {
      console.error('Error loading core data:', err);
    }
  }, [selectedPageUrl, selectedSessionId]);

  // Load journey for selected session
  const loadJourney = useCallback(async (sessionId) => {
    if (!sessionId) return;
    setIsLoadingJourney(true);
    try {
      const res = await fetchSessionEvents(sessionId);
      if (res.success) {
        setSessionJourney(res);
      }
    } catch (err) {
      console.error('Error loading session journey:', err);
    } finally {
      setIsLoadingJourney(false);
    }
  }, []);

  // Load heatmap data for selected page
  const loadHeatmap = useCallback(async (pageUrl) => {
    if (!pageUrl) return;
    setIsLoadingHeatmap(true);
    try {
      const res = await fetchHeatmapData(pageUrl);
      if (res.success) {
        setHeatmapData(res);
      }
    } catch (err) {
      console.error('Error loading heatmap:', err);
    } finally {
      setIsLoadingHeatmap(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadCoreData();
  }, [loadCoreData]);

  // When selectedSessionId changes, fetch journey
  useEffect(() => {
    if (selectedSessionId) {
      loadJourney(selectedSessionId);
    }
  }, [selectedSessionId, loadJourney]);

  // When selectedPageUrl changes, fetch heatmap
  useEffect(() => {
    if (selectedPageUrl) {
      loadHeatmap(selectedPageUrl);
    }
  }, [selectedPageUrl, loadHeatmap]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadCoreData();
    if (selectedSessionId) await loadJourney(selectedSessionId);
    if (selectedPageUrl) await loadHeatmap(selectedPageUrl);
    setIsRefreshing(false);
    showToast('Analytics refreshed successfully');
  };

  const handleSeed = async () => {
    setIsSeeding(true);
    try {
      const res = await seedDemoData(8);
      showToast(res.message || 'Seeded 8 demo user sessions!');
      await loadCoreData();
      if (selectedSessionId) await loadJourney(selectedSessionId);
      if (selectedPageUrl) await loadHeatmap(selectedPageUrl);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsSeeding(false);
    }
  };

  const handleSelectPageForHeatmap = (url) => {
    setSelectedPageUrl(url);
    setActiveTab('heatmap');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onRefresh={handleRefresh}
        onSeed={handleSeed}
        isSeeding={isSeeding}
        isRefreshing={isRefreshing}
        health={health}
      />

      {/* Toast Notification */}
      {notification && (
        <div
          style={{
            position: 'fixed',
            top: '75px',
            right: '25px',
            background: notification.type === 'error' ? 'rgba(239, 68, 68, 0.95)' : 'rgba(16, 185, 129, 0.95)',
            color: '#fff',
            padding: '0.65rem 1.25rem',
            borderRadius: '8px',
            fontSize: '0.85rem',
            fontWeight: 600,
            zIndex: 9999,
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            backdropFilter: 'blur(8px)',
          }}
        >
          {notification.message}
        </div>
      )}

      <main className="app-main" style={{ flex: 1 }}>
        {activeTab === 'overview' && (
          <OverviewView
            stats={stats}
            topPages={pages}
            onSelectPageForHeatmap={handleSelectPageForHeatmap}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'sessions' && (
          <SessionsView
            sessions={sessions}
            selectedSessionId={selectedSessionId}
            sessionJourney={sessionJourney}
            isLoadingJourney={isLoadingJourney}
            onSelectSession={(sid) => setSelectedSessionId(sid)}
          />
        )}

        {activeTab === 'heatmap' && (
          <HeatmapView
            pages={pages}
            selectedPageUrl={selectedPageUrl}
            setSelectedPageUrl={setSelectedPageUrl}
            heatmapData={heatmapData}
            isLoadingHeatmap={isLoadingHeatmap}
          />
        )}

        {activeTab === 'playground' && (
          <PlaygroundView onRefreshAfterAction={handleRefresh} />
        )}
      </main>
    </div>
  );
}
