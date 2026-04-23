const express = require('express');
const cors    = require('cors');
const path    = require('path');
const dotenv  = require('dotenv');

// Load env from backend/.env
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const app = express();
app.use(cors());
app.use(express.json());

// ── Helper: adapt Vercel-style handler to Express ─────────────────────────
function use(handler) {
  return async (req, res) => {
    try {
      await handler(req, res);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}

// ── Routes ────────────────────────────────────────────────────────────────
app.get('/health',                use(require('./health')));
app.post('/api/register',         use(require('./register')));
app.post('/api/login',            use(require('./login')));
app.post('/api/send-otp',         use(require('./send-otp')));
app.post('/api/verify-otp',       use(require('./verify-otp')));
app.post('/api/sessions',         use(require('./sessions')));
app.get('/api/progress',          use(require('./progress')));
app.get('/api/profile',           use(require('./profile')));
app.put('/api/profile',           use(require('./profile')));
app.put('/api/profile/password',  use(require('./profile/password')));

app.get('/', (_, res) => res.json({ message: 'Yoga Intelligence API', version: '3.0.0' }));

// ── Start ─────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});
