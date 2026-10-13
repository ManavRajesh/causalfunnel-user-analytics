const mongoose = require('mongoose');
const Event = require('../models/Event');

const BASE_URL = process.env.BASE_URL || 'http://localhost:5001';

const PAGES = {
  HOME: `${BASE_URL}/demo/index.html`,
  PRODUCT: `${BASE_URL}/demo/product.html`,
  CHECKOUT: `${BASE_URL}/demo/checkout.html`,
};

// Realistic clickable elements and coordinates on a 1280x800 viewport
const CLICK_TARGETS = {
  [PAGES.HOME]: [
    { tag: 'BUTTON', id: 'hero-shop-now', text: 'Shop Summer Collection', x: 640, y: 340, xPct: 50.0, yPct: 42.5 },
    { tag: 'A', id: 'nav-products', text: 'Products', x: 420, y: 35, xPct: 32.8, yPct: 4.4 },
    { tag: 'DIV', id: 'card-featured-1', text: 'Aura Wireless Headphones', x: 320, y: 520, xPct: 25.0, yPct: 65.0 },
    { tag: 'BUTTON', id: 'quick-buy-1', text: 'Add to Cart', x: 320, y: 640, xPct: 25.0, yPct: 80.0 },
    { tag: 'DIV', id: 'card-featured-2', text: 'Minimalist Chrono Watch', x: 640, y: 520, xPct: 50.0, yPct: 65.0 },
    { tag: 'BUTTON', id: 'quick-buy-2', text: 'Add to Cart', x: 640, y: 640, xPct: 50.0, yPct: 80.0 },
    { tag: 'BUTTON', id: 'newsletter-btn', text: 'Subscribe', x: 820, y: 740, xPct: 64.0, yPct: 92.5 },
  ],
  [PAGES.PRODUCT]: [
    { tag: 'BUTTON', id: 'btn-color-black', text: 'Midnight Black', x: 720, y: 260, xPct: 56.2, yPct: 32.5 },
    { tag: 'BUTTON', id: 'btn-color-silver', text: 'Silver Titanium', x: 800, y: 260, xPct: 62.5, yPct: 32.5 },
    { tag: 'BUTTON', id: 'btn-add-cart', text: 'Add to Bag', x: 780, y: 410, xPct: 60.9, yPct: 51.2 },
    { tag: 'BUTTON', id: 'btn-buy-now', text: 'Instant Buy Now', x: 780, y: 465, xPct: 60.9, yPct: 58.1 },
    { tag: 'A', id: 'tab-specifications', text: 'Specifications', x: 620, y: 540, xPct: 48.4, yPct: 67.5 },
    { tag: 'A', id: 'tab-reviews', text: 'Customer Reviews (4.9)', x: 750, y: 540, xPct: 58.6, yPct: 67.5 },
  ],
  [PAGES.CHECKOUT]: [
    { tag: 'BUTTON', id: 'apply-coupon', text: 'Apply Code', x: 920, y: 280, xPct: 71.8, yPct: 35.0 },
    { tag: 'INPUT', id: 'shipping-express', text: 'Express Delivery ($9)', x: 450, y: 390, xPct: 35.1, yPct: 48.7 },
    { tag: 'BUTTON', id: 'btn-pay-now', text: 'Complete Order ($249.00)', x: 640, y: 580, xPct: 50.0, yPct: 72.5 },
  ],
};

const generateDemoData = async (sessionCount = 8) => {
  const eventsToInsert = [];
  const now = Date.now();

  const journeyArchetypes = [
    // 1. High intent buyer: Home -> Product -> Checkout
    {
      name: 'High Intent Buyer',
      flow: [
        { page: PAGES.HOME, clicks: ['hero-shop-now', 'card-featured-1'] },
        { page: PAGES.PRODUCT, clicks: ['btn-color-silver', 'btn-add-cart', 'btn-buy-now'] },
        { page: PAGES.CHECKOUT, clicks: ['apply-coupon', 'btn-pay-now'] },
      ],
    },
    // 2. Product researcher: Home -> Multiple clicks on products & reviews
    {
      name: 'Curious Researcher',
      flow: [
        { page: PAGES.HOME, clicks: ['nav-products', 'card-featured-2'] },
        { page: PAGES.PRODUCT, clicks: ['btn-color-black', 'tab-specifications', 'tab-reviews', 'btn-add-cart'] },
      ],
    },
    // 3. Quick Bouncer: Home -> Click newsletter -> leave
    {
      name: 'Newsletter Subscriber',
      flow: [
        { page: PAGES.HOME, clicks: ['newsletter-btn'] },
      ],
    },
    // 4. Bargain Hunter: Direct product -> Checkout -> Abandon
    {
      name: 'Cart Abandoner',
      flow: [
        { page: PAGES.PRODUCT, clicks: ['btn-add-cart', 'btn-buy-now'] },
        { page: PAGES.CHECKOUT, clicks: ['apply-coupon'] },
      ],
    },
  ];

  for (let i = 0; i < sessionCount; i++) {
    const archetype = journeyArchetypes[i % journeyArchetypes.length];
    const sessionId = `sess_${Math.random().toString(36).substring(2, 10)}_${Date.now().toString(36)}`;
    
    // Spread sessions across last 2 hours
    let sessionTime = now - (sessionCount - i) * 15 * 60 * 1000 + Math.floor(Math.random() * 60000);

    for (const step of archetype.flow) {
      // Step 1: Page View event
      eventsToInsert.push({
        sessionId,
        eventType: 'page_view',
        pageUrl: step.page,
        timestamp: new Date(sessionTime),
        viewport: { width: 1280, height: 800 },
        metadata: {
          pageTitle: step.page.includes('checkout')
            ? 'Aura Store | Secure Checkout'
            : step.page.includes('product')
            ? 'Aura Wireless Headphones | Aura Store'
            : 'Aura Store | Premium Essentials',
          referrer: i === 0 ? 'https://google.com' : 'direct',
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        },
      });

      // User pauses and reads page for 3-12 seconds
      sessionTime += 3000 + Math.floor(Math.random() * 5000);

      // Step 2: Click events on that page
      const availableTargets = CLICK_TARGETS[step.page] || [];
      for (const targetId of step.clicks) {
        const target = availableTargets.find((t) => t.id === targetId);
        if (target) {
          // Add slight natural jitter (+/- 8px) to click coordinates
          const jitterX = Math.round((Math.random() - 0.5) * 16);
          const jitterY = Math.round((Math.random() - 0.5) * 16);
          const finalX = target.x + jitterX;
          const finalY = target.y + jitterY;

          eventsToInsert.push({
            sessionId,
            eventType: 'click',
            pageUrl: step.page,
            timestamp: new Date(sessionTime),
            x: finalX,
            y: finalY,
            viewport: { width: 1280, height: 800 },
            xPercent: Number(((finalX / 1280) * 100).toFixed(2)),
            yPercent: Number(((finalY / 800) * 100).toFixed(2)),
            metadata: {
              elementTag: target.tag,
              elementId: target.id,
              elementText: target.text,
              pageTitle: 'Aura Store',
              userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
            },
          });

          sessionTime += 2000 + Math.floor(Math.random() * 4000);
        }
      }
    }
  }

  const inserted = await Event.insertMany(eventsToInsert);
  return inserted;
};

// If run directly from terminal: `node src/seed/seedDemoData.js`
if (require.main === module) {
  const connectDB = require('../config/db');
  require('dotenv').config();

  (async () => {
    try {
      await connectDB();
      console.log('[Seed] Connected to database. Generating demo sessions...');
      const docs = await generateDemoData(10);
      console.log(`[Seed] Successfully inserted ${docs.length} demo events!`);
      process.exit(0);
    } catch (err) {
      console.error('[Seed Error]:', err);
      process.exit(1);
    }
  })();
}

module.exports = { generateDemoData, PAGES };
