require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const connectDB = require('./config/db');
const eventRoutes = require('./routes/eventRoutes');

const app = express();
const PORT = process.env.PORT || 5001;

// Enable Cross-Origin Resource Sharing (CORS)
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body parsers: support JSON and beacon/text payloads
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(express.text({ type: ['text/*', 'application/json'] }));

// Request logging in development
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// 1. Serve Tracker Script for client integration
// Any site can embed: <script src="http://localhost:5000/tracker.js"></script>
app.use(
  '/tracker.js',
  express.static(path.join(__dirname, '../../tracker/tracker.js'), {
    setHeaders: (res) => {
      res.set('Content-Type', 'application/javascript');
      res.set('Access-Control-Allow-Origin', '*');
      res.set('Cache-Control', 'no-cache');
    },
  })
);

// 2. Serve Demo E-Commerce Store
app.use('/demo', express.static(path.join(__dirname, '../../demo-site')));

// 3. API Routes
app.use('/api', eventRoutes);

// 4. Health & Status endpoint
app.get('/health', (req, res) => {
  const isConnected = require('mongoose').connection.readyState === 1;
  res.json({
    status: isConnected ? 'healthy' : 'degraded',
    mongoConnected: isConnected,
    timestamp: new Date(),
    uptimeSeconds: Math.floor(process.uptime()),
    endpoints: {
      tracker: `http://localhost:${PORT}/tracker.js`,
      demoSite: `http://localhost:${PORT}/demo/index.html`,
      eventsApi: `http://localhost:${PORT}/api/events`,
      sessionsApi: `http://localhost:${PORT}/api/sessions`,
      heatmapApi: `http://localhost:${PORT}/api/heatmap`,
      pagesApi: `http://localhost:${PORT}/api/pages`,
      statsApi: `http://localhost:${PORT}/api/stats`,
    },
  });
});

// 5. Serve React Frontend Dashboard (production build)
const frontendDistPath = path.join(__dirname, '../../frontend/dist');
const fs = require('fs');

if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/demo') || req.path === '/tracker.js' || req.path === '/health') {
      return next();
    }
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
} else {
  // Root landing endpoint fallback
  app.get('/', (req, res) => {
    res.json({
      name: 'CausalFunnel Analytics Engine',
      version: '1.0.0',
      description: 'Real-time session tracking, user journey analytics, and click heatmaps',
      dashboard: 'Run npm run build in frontend/ or visit http://localhost:3000',
      documentation: '/health',
    });
  });
}

// Start Server
const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`=======================================================`);
      console.log(`🚀 CausalFunnel Analytics Backend running on port ${PORT}`);
      console.log(`📡 Tracker CDN: http://localhost:${PORT}/tracker.js`);
      console.log(`🛍️ Demo Store:  http://localhost:${PORT}/demo/index.html`);
      console.log(`📊 API Base:    http://localhost:${PORT}/api`);
      console.log(`=======================================================`);
    });
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
};

startServer();

module.exports = app;
