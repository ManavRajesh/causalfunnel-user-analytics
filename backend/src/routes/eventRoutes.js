const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const Event = require('../models/Event');
const { generateDemoData } = require('../seed/seedDemoData');

// 1. Ingest events
router.post('/events', eventController.recordEvents);

// 2. Fetch list of sessions
router.get('/sessions', eventController.getSessions);

// 3. Fetch all events for specific session (User Journey)
router.get('/sessions/:sessionId', eventController.getSessionEvents);

// 4. Fetch click data for a page (Heatmap)
router.get('/heatmap', eventController.getHeatmapData);

// 5. Additional helpers
router.get('/pages', eventController.getTrackedPages);
router.get('/stats', eventController.getStats);

// 6. Demo seed & clear utilities
router.post('/seed', async (req, res) => {
  try {
    const count = parseInt(req.body.count, 10) || 8;
    const inserted = await generateDemoData(count);
    return res.json({
      success: true,
      message: `Successfully seeded ${inserted.length} demo events across ${count} sessions`,
      count: inserted.length,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/events', async (req, res) => {
  try {
    const result = await Event.deleteMany({});
    return res.json({
      success: true,
      message: `Cleared all events (${result.deletedCount} deleted)`,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
