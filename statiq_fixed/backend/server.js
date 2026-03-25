const express = require('express');
const cors    = require('cors');
const path    = require('path');
const fs      = require('fs');
const statsRoutes = require('./routes/stats');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../web_client')));

// ── Persistent stats file ─────────────────────────────────────
const STATS_FILE = path.join(__dirname, 'site_stats.json');

function loadStats() {
  try {
    if (fs.existsSync(STATS_FILE)) {
      return JSON.parse(fs.readFileSync(STATS_FILE, 'utf8'));
    }
  } catch (e) {}
  return { visitors: 0, likes: 0 };
}

function saveStats(data) {
  try { fs.writeFileSync(STATS_FILE, JSON.stringify(data)); } catch (e) {}
}

let siteStats = loadStats();

// ── Routes ───────────────────────────────────────────────────
app.get('/', (_req, res) => {
  siteStats.visitors++;
  saveStats(siteStats);
  res.sendFile(path.join(__dirname, '../web_client/index.html'));
});

// Alias /calculator to root — no separate home page
app.get('/calculator', (_req, res) => {
  res.redirect('/');
});

// Get stats
app.get('/api/stats', (_req, res) => {
  res.json({ success: true, visitors: siteStats.visitors, likes: siteStats.likes });
});

// Add a like
app.post('/api/like', (_req, res) => {
  siteStats.likes++;
  saveStats(siteStats);
  res.json({ success: true, likes: siteStats.likes });
});

// Track page visit (called from calculator page)
app.post('/api/visit', (_req, res) => {
  siteStats.visitors++;
  saveStats(siteStats);
  res.json({ success: true, visitors: siteStats.visitors });
});

app.use('/api', statsRoutes);

app.get('/health', (_req, res) =>
  res.json({ status: 'ok', message: 'Stats Calculator API running' })
);

app.listen(PORT, () => {
  console.log('\n✅  StatIQ running on port ' + PORT);
  console.log('🌐  Homepage → http://localhost:' + PORT + '\n');
});
