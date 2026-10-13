/**
 * CausalFunnel Analytics Tracker (Client-Side SDK)
 * Lightweight, zero-dependency analytics script for session tracking,
 * page view analytics, and click heatmap capture.
 */
(function (window, document) {
  'use strict';

  // Prevent multiple initializations
  if (window.CausalTracker && window.CausalTracker.initialized) {
    return;
  }

  const STORAGE_KEY_SESSION = 'cf_session_id';
  const STORAGE_KEY_LAST_ACTIVE = 'cf_last_active';
  const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes inactivity timeout

  // Discover script configuration from <script> tag attributes
  let configuredEndpoint = 'http://localhost:5001/api/events';
  const currentScript =
    document.currentScript ||
    document.querySelector('script[data-api]') ||
    document.querySelector('script[data-endpoint]');

  if (currentScript) {
    const customEndpoint =
      currentScript.getAttribute('data-api') ||
      currentScript.getAttribute('data-endpoint');
    if (customEndpoint) {
      configuredEndpoint = customEndpoint;
    }
  }

  // State
  const state = {
    endpoint: configuredEndpoint,
    sessionId: null,
    queue: [],
    flushTimer: null,
    debug: false,
    batchIntervalMs: 1500, // Debounce/batch window (1.5 seconds)
    maxQueueSize: 25,
  };

  /**
   * Cookie helpers
   */
  function setCookie(name, value, days) {
    try {
      const d = new Date();
      d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
      document.cookie = `${name}=${encodeURIComponent(value)};expires=${d.toUTCString()};path=/;SameSite=Lax`;
    } catch (_) {}
  }

  function getCookie(name) {
    try {
      const match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
      return match ? decodeURIComponent(match[3]) : null;
    } catch (_) {
      return null;
    }
  }

  /**
   * High-entropy UUID generator for reliable session IDs
   */
  function generateUUID() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return 'sess_' + crypto.randomUUID().replace(/-/g, '').slice(0, 16);
    }
    const rand = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
    return 'sess_' + Date.now().toString(36) + '_' + rand;
  }

  /**
   * Session Management
   * Persistent across pages, auto-refreshed upon user activity
   */
  function getOrCreateSession() {
    const now = Date.now();
    let sessionId = null;
    let lastActive = 0;

    // Try localStorage first
    try {
      sessionId = localStorage.getItem(STORAGE_KEY_SESSION);
      lastActive = parseInt(localStorage.getItem(STORAGE_KEY_LAST_ACTIVE) || '0', 10);
    } catch (_) {
      // Fall back to cookie
      sessionId = getCookie(STORAGE_KEY_SESSION);
      lastActive = parseInt(getCookie(STORAGE_KEY_LAST_ACTIVE) || '0', 10);
    }

    // Check if session expired due to inactivity
    const isExpired = !sessionId || (lastActive > 0 && now - lastActive > SESSION_TIMEOUT_MS);

    if (isExpired) {
      sessionId = generateUUID();
      if (state.debug) console.log('[CausalTracker] New session generated:', sessionId);
    }

    updateSessionActivity(sessionId);
    return sessionId;
  }

  function updateSessionActivity(sessionId) {
    const now = Date.now();
    try {
      localStorage.setItem(STORAGE_KEY_SESSION, sessionId);
      localStorage.setItem(STORAGE_KEY_LAST_ACTIVE, now.toString());
    } catch (_) {}

    setCookie(STORAGE_KEY_SESSION, sessionId, 1);
    setCookie(STORAGE_KEY_LAST_ACTIVE, now.toString(), 1);
  }

  /**
   * Sends event payload to backend via sendBeacon or fetch(keepalive)
   */
  function sendPayload(events) {
    if (!events || events.length === 0) return;

    const payload = JSON.stringify({ events });
    const url = state.endpoint;

    // Use sendBeacon if available (ideal for reliable background beaconing)
    if (navigator.sendBeacon) {
      try {
        const blob = new Blob([payload], { type: 'application/json' });
        const success = navigator.sendBeacon(url, blob);
        if (success) {
          if (state.debug) console.log(`[CausalTracker] sendBeacon delivered ${events.length} event(s)`);
          return;
        }
      } catch (e) {
        if (state.debug) console.warn('[CausalTracker] sendBeacon failed, falling back to fetch', e);
      }
    }

    // Fallback: Modern fetch with keepalive
    try {
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true,
      }).catch((err) => {
        if (state.debug) console.warn('[CausalTracker] fetch error:', err);
      });
    } catch (e) {
      if (state.debug) console.error('[CausalTracker] Failed to dispatch events:', e);
    }
  }

  /**
   * Enqueue event and schedule batch flush
   */
  function enqueue(eventData) {
    state.sessionId = getOrCreateSession();

    const fullEvent = {
      session_id: state.sessionId,
      timestamp: new Date().toISOString(),
      page_url: window.location.href,
      ...eventData,
    };

    state.queue.push(fullEvent);

    if (state.debug) {
      console.log('[CausalTracker] Event enqueued:', fullEvent.event_type, fullEvent);
    }

    // If queue is large, flush immediately
    if (state.queue.length >= state.maxQueueSize) {
      flush();
      return;
    }

    // Debounce flush
    if (!state.flushTimer) {
      state.flushTimer = setTimeout(flush, state.batchIntervalMs);
    }
  }

  /**
   * Flush pending events queue
   */
  function flush() {
    if (state.flushTimer) {
      clearTimeout(state.flushTimer);
      state.flushTimer = null;
    }

    if (state.queue.length === 0) return;

    const toSend = state.queue.slice();
    state.queue = [];
    sendPayload(toSend);
  }

  /**
   * 1. Track Page View
   */
  function trackPageView(customUrl) {
    enqueue({
      event_type: 'page_view',
      page_url: customUrl || window.location.href,
      viewport: {
        width: window.innerWidth || document.documentElement.clientWidth,
        height: window.innerHeight || document.documentElement.clientHeight,
      },
      metadata: {
        pageTitle: document.title,
        referrer: document.referrer || '',
        userAgent: navigator.userAgent,
      },
    });
  }

  /**
   * 2. Track Click Event
   */
  function trackClick(e) {
    if (!e) return;

    const target = e.target || e.srcElement;
    const vpWidth = window.innerWidth || document.documentElement.clientWidth || 1;
    const vpHeight = window.innerHeight || document.documentElement.clientHeight || 1;

    // Viewport-relative coordinates (for screen display and heatmaps)
    const clientX = e.clientX || 0;
    const clientY = e.clientY || 0;

    // Normalized percentage coordinates (0 - 100%)
    const xPercent = Math.min(100, Math.max(0, Number(((clientX / vpWidth) * 100).toFixed(2))));
    const yPercent = Math.min(100, Math.max(0, Number(((clientY / vpHeight) * 100).toFixed(2))));

    // Extract human-readable target metadata
    let targetText = '';
    let targetTag = 'UNKNOWN';
    let targetId = '';
    let targetClass = '';

    if (target && target.tagName) {
      targetTag = target.tagName;
      targetId = target.id || '';
      targetClass = (typeof target.className === 'string' ? target.className : '').trim();
      targetText = (target.innerText || target.value || target.getAttribute('aria-label') || '').slice(0, 50).trim();
    }

    enqueue({
      event_type: 'click',
      x: clientX,
      y: clientY,
      xPercent,
      yPercent,
      viewport: {
        width: vpWidth,
        height: vpHeight,
      },
      metadata: {
        elementTag: targetTag,
        elementId: targetId,
        elementClass: targetClass,
        elementText: targetText,
        pageTitle: document.title,
      },
    });
  }

  /**
   * Initialize Tracker
   */
  function init(options) {
    if (options && typeof options === 'object') {
      if (options.endpoint) state.endpoint = options.endpoint;
      if (options.debug !== undefined) state.debug = options.debug;
      if (options.batchIntervalMs) state.batchIntervalMs = options.batchIntervalMs;
    }

    state.sessionId = getOrCreateSession();

    // 1. Initial page view
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      trackPageView();
    } else {
      document.addEventListener('DOMContentLoaded', () => trackPageView());
    }

    // 2. Global click listener (Event delegation)
    document.addEventListener('click', trackClick, { capture: true, passive: true });

    // 3. Listen to SPA navigations (pushState, replaceState, popstate)
    const originalPushState = history.pushState;
    if (originalPushState) {
      history.pushState = function () {
        const result = originalPushState.apply(this, arguments);
        setTimeout(() => trackPageView(), 50);
        return result;
      };
    }

    const originalReplaceState = history.replaceState;
    if (originalReplaceState) {
      history.replaceState = function () {
        const result = originalReplaceState.apply(this, arguments);
        setTimeout(() => trackPageView(), 50);
        return result;
      };
    }

    window.addEventListener('popstate', () => {
      setTimeout(() => trackPageView(), 50);
    });

    // 4. Reliable flush on page unload / tab hide
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        flush();
      }
    });

    window.addEventListener('beforeunload', () => {
      flush();
    });

    window.addEventListener('pagehide', () => {
      flush();
    });

    window.CausalTracker.initialized = true;
    if (state.debug) {
      console.log(`[CausalTracker] Initialized with session: ${state.sessionId}, endpoint: ${state.endpoint}`);
    }
  }

  // Public API exposed on window.CausalTracker
  window.CausalTracker = {
    init,
    initialized: false,
    trackPageView,
    trackClick,
    getSessionId: () => state.sessionId || getOrCreateSession(),
    resetSession: () => {
      const newId = generateUUID();
      updateSessionActivity(newId);
      state.sessionId = newId;
      return newId;
    },
    flush,
    getState: () => ({ ...state }),
  };

  // Auto-init immediately
  init();

})(window, document);
