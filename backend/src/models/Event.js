const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: [true, 'sessionId is required'],
      index: true,
      trim: true,
    },
    eventType: {
      type: String,
      required: [true, 'eventType is required'],
      enum: ['page_view', 'click'],
      index: true,
    },
    pageUrl: {
      type: String,
      required: [true, 'pageUrl is required'],
      index: true,
      trim: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    // Click coordinates (for click events)
    x: {
      type: Number,
      default: null,
    },
    y: {
      type: Number,
      default: null,
    },
    // Viewport dimensions for responsive heatmap normalization
    viewport: {
      width: { type: Number, default: null },
      height: { type: Number, default: null },
    },
    xPercent: {
      type: Number,
      default: null,
    },
    yPercent: {
      type: Number,
      default: null,
    },
    // Additional context for rich journey exploration
    metadata: {
      elementTag: { type: String, default: null },
      elementId: { type: String, default: null },
      elementClass: { type: String, default: null },
      elementText: { type: String, default: null },
      pageTitle: { type: String, default: null },
      referrer: { type: String, default: null },
      userAgent: { type: String, default: null },
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for optimal query performance
EventSchema.index({ sessionId: 1, timestamp: 1 });
EventSchema.index({ pageUrl: 1, eventType: 1, timestamp: -1 });

module.exports = mongoose.model('Event', EventSchema);
