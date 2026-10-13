const Event = require('../models/Event');

/**
 * Normalizes and validates incoming event payload
 */
const sanitizeEvent = (raw) => {
  const sessionId = (raw.session_id || raw.sessionId || '').toString().trim();
  const eventType = (raw.event_type || raw.eventType || '').toString().trim().toLowerCase();
  const pageUrl = (raw.page_url || raw.pageUrl || '').toString().trim();

  if (!sessionId) throw new Error('Missing session_id');
  if (!['page_view', 'click'].includes(eventType)) {
    throw new Error(`Invalid event type "${eventType}". Expected "page_view" or "click"`);
  }
  if (!pageUrl) throw new Error('Missing page URL');

  const timestamp = raw.timestamp ? new Date(raw.timestamp) : new Date();
  const validTimestamp = isNaN(timestamp.getTime()) ? new Date() : timestamp;

  let x = typeof raw.x === 'number' ? raw.x : null;
  let y = typeof raw.y === 'number' ? raw.y : null;

  const viewport = {
    width: raw.viewport?.width || raw.viewportWidth || null,
    height: raw.viewport?.height || raw.viewportHeight || null,
  };

  let xPercent = typeof raw.xPercent === 'number' ? raw.xPercent : null;
  let yPercent = typeof raw.yPercent === 'number' ? raw.yPercent : null;

  if (x !== null && viewport.width && xPercent === null) {
    xPercent = Math.min(100, Math.max(0, Number(((x / viewport.width) * 100).toFixed(2))));
  }
  if (y !== null && viewport.height && yPercent === null) {
    yPercent = Math.min(100, Math.max(0, Number(((y / viewport.height) * 100).toFixed(2))));
  }

  const metadata = {
    elementTag: raw.metadata?.elementTag || raw.elementTag || raw.targetTag || null,
    elementId: raw.metadata?.elementId || raw.elementId || raw.targetId || null,
    elementClass: raw.metadata?.elementClass || raw.elementClass || raw.targetClass || null,
    elementText: raw.metadata?.elementText || raw.elementText || raw.targetText || null,
    pageTitle: raw.metadata?.pageTitle || raw.pageTitle || raw.title || null,
    referrer: raw.metadata?.referrer || raw.referrer || null,
    userAgent: raw.metadata?.userAgent || raw.userAgent || null,
  };

  return {
    sessionId,
    eventType,
    pageUrl,
    timestamp: validTimestamp,
    x,
    y,
    viewport,
    xPercent,
    yPercent,
    metadata,
  };
};

/**
 * 1. POST /api/events
 * Ingest single or batched events
 */
exports.recordEvents = async (req, res) => {
  try {
    const body = req.body;
    let rawEvents = [];

    if (Array.isArray(body)) {
      rawEvents = body;
    } else if (Array.isArray(body.events)) {
      rawEvents = body.events;
    } else if (typeof body === 'object' && body !== null) {
      rawEvents = [body];
    } else {
      return res.status(400).json({ success: false, message: 'Invalid payload format' });
    }

    if (rawEvents.length === 0) {
      return res.status(400).json({ success: false, message: 'No events provided' });
    }

    const docsToInsert = [];
    const errors = [];

    for (let i = 0; i < rawEvents.length; i++) {
      try {
        const sanitized = sanitizeEvent(rawEvents[i]);
        docsToInsert.push(sanitized);
      } catch (err) {
        errors.push({ index: i, error: err.message });
      }
    }

    if (docsToInsert.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'All submitted events failed validation',
        errors,
      });
    }

    const savedEvents = await Event.insertMany(docsToInsert);

    return res.status(201).json({
      success: true,
      message: `Successfully recorded ${savedEvents.length} event(s)`,
      count: savedEvents.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('[Error] recordEvents:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 2. GET /api/sessions
 * Fetch sessions with aggregated event counts and timeline metadata
 */
exports.getSessions = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));
    const skip = (page - 1) * limit;
    const search = (req.query.search || '').trim();

    const matchStage = {};
    if (search) {
      matchStage.$or = [
        { sessionId: { $regex: search, $options: 'i' } },
        { pageUrl: { $regex: search, $options: 'i' } },
      ];
    }

    const pipeline = [
      ...(Object.keys(matchStage).length > 0 ? [{ $match: matchStage }] : []),
      {
        $sort: { timestamp: 1 },
      },
      {
        $group: {
          _id: '$sessionId',
          totalEvents: { $sum: 1 },
          clicks: {
            $sum: { $cond: [{ $eq: ['$eventType', 'click'] }, 1, 0] },
          },
          pageViews: {
            $sum: { $cond: [{ $eq: ['$eventType', 'page_view'] }, 1, 0] },
          },
          firstSeen: { $first: '$timestamp' },
          lastSeen: { $last: '$timestamp' },
          pagesVisited: { $addToSet: '$pageUrl' },
          entryPage: { $first: '$pageUrl' },
          exitPage: { $last: '$pageUrl' },
        },
      },
      {
        $project: {
          sessionId: '$_id',
          _id: 0,
          totalEvents: 1,
          clicks: 1,
          pageViews: 1,
          firstSeen: 1,
          lastSeen: 1,
          durationSeconds: {
            $max: [
              0,
              {
                $round: [
                  {
                    $divide: [{ $subtract: ['$lastSeen', '$firstSeen'] }, 1000],
                  },
                  1,
                ],
              },
            ],
          },
          pagesVisited: 1,
          pagesVisitedCount: { $size: '$pagesVisited' },
          entryPage: 1,
          exitPage: 1,
        },
      },
      {
        $sort: { lastSeen: -1 },
      },
    ];

    // Count total distinct sessions
    const totalCountAgg = await Event.aggregate([
      ...(Object.keys(matchStage).length > 0 ? [{ $match: matchStage }] : []),
      { $group: { _id: '$sessionId' } },
      { $count: 'total' },
    ]);
    const totalSessions = totalCountAgg[0]?.total || 0;

    const sessions = await Event.aggregate([
      ...pipeline,
      { $skip: skip },
      { $limit: limit },
    ]);

    return res.json({
      success: true,
      data: sessions,
      pagination: {
        page,
        limit,
        totalSessions,
        totalPages: Math.ceil(totalSessions / limit),
      },
    });
  } catch (error) {
    console.error('[Error] getSessions:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 3. GET /api/sessions/:sessionId
 * Fetch ordered list of events for a specific session (User Journey)
 */
exports.getSessionEvents = async (req, res) => {
  try {
    const { sessionId } = req.params;
    if (!sessionId) {
      return res.status(400).json({ success: false, message: 'sessionId is required' });
    }

    const events = await Event.find({ sessionId }).sort({ timestamp: 1 }).lean();

    if (!events || events.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No events found for session "${sessionId}"`,
      });
    }

    const firstTime = new Date(events[0].timestamp).getTime();
    let prevTime = firstTime;

    // Enrich events with user journey metrics (elapsed time, time delta between steps)
    const enrichedEvents = events.map((ev, idx) => {
      const curTime = new Date(ev.timestamp).getTime();
      const elapsedMs = curTime - firstTime;
      const deltaMs = curTime - prevTime;
      prevTime = curTime;

      return {
        stepNumber: idx + 1,
        ...ev,
        elapsedSeconds: Number((elapsedMs / 1000).toFixed(1)),
        deltaSeconds: Number((deltaMs / 1000).toFixed(1)),
      };
    });

    const totalClicks = events.filter((e) => e.eventType === 'click').length;
    const totalPageViews = events.filter((e) => e.eventType === 'page_view').length;
    const totalDurationSeconds = Number(
      ((new Date(events[events.length - 1].timestamp).getTime() - firstTime) / 1000).toFixed(1)
    );

    return res.json({
      success: true,
      sessionId,
      summary: {
        totalEvents: events.length,
        totalClicks,
        totalPageViews,
        startTime: events[0].timestamp,
        endTime: events[events.length - 1].timestamp,
        durationSeconds: totalDurationSeconds,
        uniquePages: [...new Set(events.map((e) => e.pageUrl))],
      },
      events: enrichedEvents,
    });
  } catch (error) {
    console.error('[Error] getSessionEvents:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 4. GET /api/heatmap
 * Fetch click data for a specific page (for heatmap display)
 */
exports.getHeatmapData = async (req, res) => {
  try {
    const { pageUrl } = req.query;

    if (!pageUrl) {
      return res.status(400).json({
        success: false,
        message: 'Query parameter "pageUrl" is required. e.g. /api/heatmap?pageUrl=http://localhost:5000/demo',
      });
    }

    // Match exact URL or flexible URL path matching
    const query = {
      eventType: 'click',
      $or: [
        { pageUrl },
        { pageUrl: decodeURIComponent(pageUrl) },
      ],
    };

    const clicks = await Event.find(query)
      .select('sessionId x y xPercent yPercent viewport metadata timestamp')
      .sort({ timestamp: -1 })
      .lean();

    // Aggregate statistics
    const totalClicks = clicks.length;
    const uniqueSessions = new Set(clicks.map((c) => c.sessionId)).size;

    // Identify top clicked elements / targets
    const targetCounts = {};
    clicks.forEach((c) => {
      const tag = c.metadata?.elementTag || 'UNKNOWN';
      const text = c.metadata?.elementText ? ` "${c.metadata.elementText.slice(0, 30)}"` : '';
      const id = c.metadata?.elementId ? `#${c.metadata.elementId}` : '';
      const label = `${tag}${id}${text}`.trim();
      targetCounts[label] = (targetCounts[label] || 0) + 1;
    });

    const topElements = Object.entries(targetCounts)
      .map(([target, count]) => ({ target, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return res.json({
      success: true,
      pageUrl,
      totalClicks,
      uniqueSessions,
      topElements,
      clicks: clicks.map((c) => ({
        id: c._id,
        sessionId: c.sessionId,
        x: c.x,
        y: c.y,
        xPercent: c.xPercent,
        yPercent: c.yPercent,
        viewport: c.viewport,
        metadata: c.metadata,
        timestamp: c.timestamp,
      })),
    });
  } catch (error) {
    console.error('[Error] getHeatmapData:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 5. GET /api/pages
 * Fetch list of all tracked pages with pageview and click counts
 */
exports.getTrackedPages = async (req, res) => {
  try {
    const pages = await Event.aggregate([
      {
        $group: {
          _id: '$pageUrl',
          totalEvents: { $sum: 1 },
          clicks: {
            $sum: { $cond: [{ $eq: ['$eventType', 'click'] }, 1, 0] },
          },
          pageViews: {
            $sum: { $cond: [{ $eq: ['$eventType', 'page_view'] }, 1, 0] },
          },
          uniqueSessions: { $addToSet: '$sessionId' },
          lastActivity: { $max: '$timestamp' },
        },
      },
      {
        $project: {
          pageUrl: '$_id',
          _id: 0,
          totalEvents: 1,
          clicks: 1,
          pageViews: 1,
          uniqueSessionsCount: { $size: '$uniqueSessions' },
          lastActivity: 1,
        },
      },
      {
        $sort: { clicks: -1, pageViews: -1 },
      },
    ]);

    return res.json({
      success: true,
      data: pages,
    });
  } catch (error) {
    console.error('[Error] getTrackedPages:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 6. GET /api/stats
 * Overview analytics metrics for dashboard summary cards
 */
exports.getStats = async (req, res) => {
  try {
    const totalEvents = await Event.countDocuments();
    const totalClicks = await Event.countDocuments({ eventType: 'click' });
    const totalPageViews = await Event.countDocuments({ eventType: 'page_view' });

    const distinctSessions = await Event.distinct('sessionId');
    const totalSessions = distinctSessions.length;

    const avgEventsPerSession =
      totalSessions > 0 ? Number((totalEvents / totalSessions).toFixed(1)) : 0;

    const topPages = await Event.aggregate([
      {
        $group: {
          _id: '$pageUrl',
          events: { $sum: 1 },
          clicks: {
            $sum: { $cond: [{ $eq: ['$eventType', 'click'] }, 1, 0] },
          },
        },
      },
      { $sort: { events: -1 } },
      { $limit: 5 },
      {
        $project: {
          pageUrl: '$_id',
          _id: 0,
          events: 1,
          clicks: 1,
        },
      },
    ]);

    return res.json({
      success: true,
      stats: {
        totalEvents,
        totalClicks,
        totalPageViews,
        totalSessions,
        avgEventsPerSession,
      },
      topPages,
    });
  } catch (error) {
    console.error('[Error] getStats:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
