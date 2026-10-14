# CausalFunnel User Analytics Platform

> A full-stack user behavior analytics application featuring a client-side interaction tracking script, high-throughput Node.js/Express ingestion API, indexed MongoDB data store, and a modern React dashboard with session journey timelines and visual click heatmaps.

---

## 🌟 Table of Contents
1. [Overview & Objective](#overview--objective)
2. [Key Features](#key-features)
3. [Architecture & Data Flow](#architecture--data-flow)
4. [Tech Stack](#tech-stack)
5. [Quickstart & Setup Instructions](#quickstart--setup-instructions)
6. [API Specification](#api-specification)
7. [Client Tracking Script Integration](#client-tracking-script-integration)
8. [Dashboard Views](#dashboard-views)
9. [Assumptions, Trade-Offs & Scalability](#assumptions-trade-offs--scalability)

---

## 1. Overview & Objective
E-commerce businesses need to understand how users interact with their storefronts to identify drop-off points, optimize conversion funnels, and improve UX. This project implements a lightweight end-to-end analytics pipeline:
- **Client Tracking Script (`tracker.js`)**: Injects into any webpage, captures page views and clicks with exact spatial coordinates and normalized viewport percentages, and manages persistent user sessions.
- **Backend API (Node.js + Express + MongoDB)**: Ingests single and batched events, aggregates session metrics, generates chronological user journeys, and computes page click heatmaps.
- **Interactive Analytics Dashboard (React + Vite)**: Displays KPI metrics, an interactive session explorer with step-by-step user journeys, a multi-mode visual heatmap studio (Gaussian canvas heatmap, scatter dots, and density grid), and an embedded live demo store playground.

---

## 2. Key Features

### 📍 Client-Side Tracking SDK (`tracker/tracker.js`)
- **Zero External Dependencies**: Standalone ~3KB JavaScript script.
- **Session Management**: Automatically generates persistent, high-entropy session IDs stored in `localStorage` with a fallback `cookie` and a 30-minute inactivity refresh window.
- **Event Capture**:
  - `page_view`: Triggered on DOM load and intercepts SPA history transitions (`pushState`, `replaceState`, `popstate`).
  - `click`: Global event delegation capturing element tags, IDs, class names, inner text labels, absolute `(x, y)` coordinates, and normalized `(xPercent, yPercent)` across screen sizes.
- **Reliable Beacon Transport**: Uses `navigator.sendBeacon` and `fetch(..., { keepalive: true })` with batch buffering so interactions are never lost during page unloads or navigations.

### ⚡ Backend API (`backend/src`)
- **Structured MongoDB Ingestion**: Validates and normalizes event payloads.
- **Session Aggregation Pipeline**: Computes total event counts, click volume, page view counts, start/end timestamps, duration, entry pages, and exit pages.
- **User Journey Builder**: Chronologically orders all interactions within a session and computes elapsed time and delta intervals between steps.
- **Heatmap Spatial Queries**: Aggregates clicks per URL and ranks top-clicked UI elements.
- **Mock E-Commerce Store**: Realistic built-in storefront ("Aura Essentials") with multiple pages (`/demo/index.html`, `/demo/product.html`, `/demo/checkout.html`).

### 📊 React Dashboard (`frontend/src`)
- **Executive Overview**: Real-time KPI summary cards (Total Sessions, Ingested Events, Clicks, Pageviews, Engagement Depth) and top-visited pages leaderboard.
- **Sessions & Journey View**: Searchable session list with event counts and an interactive vertical user journey timeline.
- **Heatmap Studio**:
  1. *Gaussian Heatmap*: Canvas-rendered radial blur density gradient (Blue → Cyan → Lime → Yellow → Red).
  2. *Scatter Dots*: Interactive colored markers with hover tooltips detailing element target, text, and coordinates.
  3. *Density Grid Matrix*: 10×8 spatial grid color-coded by click density percentage.
  4. *Sliders*: Real-time radius and opacity adjustments.
- **Live Demo Store Playground**: Built-in test sandbox allowing immediate click experimentation and instant dashboard updates.

---

## 3. Architecture & Data Flow

```mermaid
flowchart LR
    subgraph Client["Webpages / Demo Store"]
        A[User Browser] -->|Clicks & Navigations| B["CausalTracker SDK (tracker.js)"]
        B -->|sendBeacon / fetch(keepalive)| C["POST /api/events"]
    end

    subgraph Backend["Node.js / Express API (Port 5001)"]
        C --> D["Validation & Sanitization Controller"]
        D --> E[("MongoDB (Port 27017)\nEvents Collection")]
        E --> F["Session Aggregation Pipeline"]
        E --> G["Heatmap Query Pipeline"]
    end

    subgraph Dashboard["React Frontend (Port 3000 / 5001)"]
        F --> H["Sessions & User Journey Timeline"]
        G --> I["Canvas Heatmap & Density Grid"]
        E --> J["KPI Overview Metrics"]
    end
```

---

## 4. Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Client Tracker** | Native JavaScript (ES6+ IIFE) | Zero-dependency tracking snippet with `sendBeacon` & batching |
| **Backend API** | Node.js, Express 4 | REST API, static asset CDN, and demo store server |
| **Database** | MongoDB, Mongoose 8 | Document storage with compound indexing (`sessionId`, `pageUrl`, `timestamp`) |
| **Frontend Dashboard** | React 19, Vite 8 | Single Page Application dashboard |
| **Styling** | Vanilla CSS Design System | Custom dark glassmorphism theme, typography (Outfit & Inter), responsive layouts |
| **Icons** | Lucide React | Modern icons for metrics and journey steps |

---

## 5. Quickstart & Setup Instructions

### Prerequisites
- **Node.js**: v18.0.0 or newer (`node -v`)
- **npm**: v9.0.0 or newer (`npm -v`)
- **MongoDB**: v6.0 or newer running locally on `mongodb://127.0.0.1:27017` (or provide a remote MongoDB Atlas URI)

### Step 1: Clone & Install Dependencies
```bash
git clone https://github.com/ManavRajesh/causalfunnel-user-analytics.git
cd causalfunnel-user-analytics

# Run unified setup (installs backend & frontend dependencies, builds bundle, and seeds demo data)
npm run setup
```
*Or manually:*
```bash
cd backend && npm install
cd ../frontend && npm install
```

### Step 2: Configure Environment
A default `.env` is configured in `backend/.env`:
```env
PORT=5001
MONGO_URI=mongodb://127.0.0.1:27017/causalfunnel_analytics
NODE_ENV=development
BASE_URL=http://localhost:5001
```

### Step 3: Seed Realistic Demo Sessions
```bash
npm run seed
```
This populates 10 realistic user journeys with clicks, navigation paths, and cart actions across the demo storefront.

### Step 4: Run the Application
You can run the full application in either of two ways:

#### Option A: Single-Port Production Mode (Recommended)
Starts backend which serves API, static tracker, demo store, and the compiled React dashboard all on **port 5001**:
```bash
npm start
```
Open **`http://localhost:5001`** in your browser.

#### Option B: Dual Development Server Mode (with Vite HMR)
In two terminal tabs:
```bash
# Terminal 1: Backend
npm run dev:backend

# Terminal 2: Frontend (Vite with hot reload)
npm run dev:frontend
```
Open **`http://localhost:3000`** in your browser.

---

## 6. API Specification

### 1. Ingest Events
- **`POST /api/events`**
- **Payload**: Accepts a single event object or an array of events (`{ events: [...] }` or `[...]`).
```json
{
  "session_id": "sess_89f2a890_mvk019",
  "event_type": "click",
  "page_url": "http://localhost:5001/demo/index.html",
  "timestamp": "2026-10-13T10:30:00.000Z",
  "x": 640,
  "y": 340,
  "viewport": { "width": 1280, "height": 800 },
  "metadata": {
    "elementTag": "BUTTON",
    "elementId": "hero-shop-now",
    "elementText": "Shop Summer Collection"
  }
}
```
- **Response**: `201 Created` with recorded count.

### 2. Fetch Sessions List
- **`GET /api/sessions?page=1&limit=50&search=...`**
- **Response**:
```json
{
  "success": true,
  "data": [
    {
      "sessionId": "sess_4oddozdc_mv6ln60c",
      "totalEvents": 8,
      "clicks": 6,
      "pageViews": 2,
      "firstSeen": "2026-10-13T11:15:27.061Z",
      "lastSeen": "2026-10-13T11:16:01.318Z",
      "durationSeconds": 34.3,
      "pagesVisited": ["http://localhost:5001/demo/index.html", "http://localhost:5001/demo/product.html"],
      "entryPage": "http://localhost:5001/demo/index.html",
      "exitPage": "http://localhost:5001/demo/product.html"
    }
  ],
  "pagination": { "page": 1, "limit": 50, "totalSessions": 20, "totalPages": 1 }
}
```

### 3. Fetch Session Events (User Journey)
- **`GET /api/sessions/:sessionId`**
- **Response**: Ordered chronological sequence of steps with time delta from previous actions:
```json
{
  "success": true,
  "sessionId": "sess_4oddozdc_mv6ln60c",
  "summary": { "totalEvents": 8, "totalClicks": 6, "totalPageViews": 2, "durationSeconds": 34.3 },
  "events": [
    {
      "stepNumber": 1,
      "eventType": "page_view",
      "pageUrl": "http://localhost:5001/demo/index.html",
      "timestamp": "2026-10-13T11:15:27.061Z",
      "elapsedSeconds": 0.0,
      "deltaSeconds": 0.0
    },
    {
      "stepNumber": 2,
      "eventType": "click",
      "pageUrl": "http://localhost:5001/demo/index.html",
      "x": 428,
      "y": 34,
      "xPercent": 33.44,
      "yPercent": 4.25,
      "metadata": { "elementTag": "A", "elementId": "nav-products", "elementText": "Products" },
      "elapsedSeconds": 6.1,
      "deltaSeconds": 6.1
    }
  ]
}
```

### 4. Fetch Heatmap Data
- **`GET /api/heatmap?pageUrl=http://localhost:5001/demo/index.html`**
- **Response**:
```json
{
  "success": true,
  "pageUrl": "http://localhost:5001/demo/index.html",
  "totalClicks": 25,
  "uniqueSessions": 8,
  "topElements": [
    { "target": "BUTTON#hero-shop-now \"Shop Summer Collection\"", "count": 10 }
  ],
  "clicks": [
    {
      "x": 640,
      "y": 340,
      "xPercent": 50.0,
      "yPercent": 42.5,
      "viewport": { "width": 1280, "height": 800 },
      "metadata": { "elementTag": "BUTTON", "elementId": "hero-shop-now" }
    }
  ]
}
```

### 5. Helper Endpoints
- `GET /api/pages`: Distinct tracked pages with visit and click counts.
- `GET /api/stats`: Overview KPI summary statistics.
- `POST /api/seed`: Generates sample test sessions on demand.
- `GET /health`: Health check with MongoDB connection status.

---

## 7. Client Tracking Script Integration

Add this single `<script>` tag to the `<head>` or `<body>` of any web application:

```html
<script 
  src="http://localhost:5001/tracker.js" 
  data-endpoint="http://localhost:5001/api/events">
</script>
```

### Manual Tracking JavaScript API (Optional)
The script exposes `window.CausalTracker`:
```javascript
// Trigger a page view programmatically (e.g. in Single Page Apps)
window.CausalTracker.trackPageView('/custom/path');

// Read active session ID
const currentSession = window.CausalTracker.getSessionId();

// Reset/rotate session (e.g., upon user logout)
window.CausalTracker.resetSession();

// Force immediate flush of pending queued events
window.CausalTracker.flush();
```

---

## 8. Dashboard Views

1. **Overview View**: High-level KPIs (Total Sessions, Ingested Events, Total Clicks, Pageviews, Engagement Depth) and top-visited pages leaderboard.
2. **Sessions & Journey View**:
   - Filterable session list showing duration, total events, page view counts, and entry pages.
   - Selected session detail drawer with an interactive step-by-step visual timeline (`PAGE_VIEW` with blue globe, `CLICK` with purple cursor, click position `(X, Y)`, and time delta between actions).
3. **Heatmap View**:
   - Page URL selector.
   - Multi-mode display: Canvas Density Heatmap, Scatter Dots with coordinate tooltips, and a 10×8 Density Grid Matrix.
   - Interactive sliders for blur radius and opacity.
   - Leaderboard of most clicked buttons and elements on the page.
4. **Live Demo Store View**:
   - Interactive embedded storefront ("Aura Essentials") with live tracking badge.
   - Test clicks and immediately view your fresh journey in the dashboard.

---

## 9. Assumptions, Trade-Offs & Scalability

### 1. Session Definition & Expiration
- **Implementation**: Sessions are identified by a UUID generated client-side and persisted in both `localStorage` and `cookie`. User activity refreshes a `lastActive` timestamp.
- **Inactivity Timeout**: Set to 30 minutes (industry standard used by Google Analytics & PostHog). If a user returns after 30+ minutes of idle time, a new `session_id` is automatically initialized.
- **Trade-Off**: Handled client-side for maximum speed and zero server overhead. In a distributed multi-domain enterprise environment, a server-side HttpOnly cookie with Redis session store would provide cross-subdomain synchronization.

### 2. Viewport & Coordinate Normalization
- **Implementation**: Captured clicks record absolute coordinates `(clientX, clientY)` alongside screen viewport dimensions `(viewport.width, viewport.height)`. The script and backend automatically calculate normalized percentages `(xPercent, yPercent)`.
- **Rationale**: Real users interact across diverse screen sizes (e.g. 1920×1080 desktop vs 1440×900 laptop). Rendering heatmaps using percentage coordinates ensures click heat spots map accurately to responsive UI elements regardless of the screen on which the analytics dashboard is viewed.

### 3. Non-Blocking Event Transport
- **Implementation**: The tracking script buffers events with a 1.5s debounce window and dispatches using `navigator.sendBeacon()`, falling back to `fetch(url, { keepalive: true })`.
- **Rationale**: Traditional `XMLHttpRequest` or standard `fetch` can be terminated by browsers when a user navigates away or closes a tab. `sendBeacon` guarantees delivery without delaying page unloads or degrading user experience.

### 4. Database Selection & High-Throughput Scaling
- **Current Choice**: MongoDB document database with compound indexes:
  - `{ sessionId: 1, timestamp: 1 }` (for ultra-fast session journey queries)
  - `{ pageUrl: 1, eventType: 1, timestamp: -1 }` (for fast heatmap filtering)
- **High-Volume Production Scaling**:
  - At millions of events/sec, MongoDB ingestion can be fronted with **Apache Kafka** or **Redis Streams** as an event buffer.
  - Historical click analytics and OLAP aggregations can be routed to a columnar store like **ClickHouse** or **TimescaleDB** for sub-second aggregations over billions of rows.
