require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const { User, Payment, connectDB, isConnected } = require('./models');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Optionally connect to MongoDB
connectDB();

app.get('/', (req, res) => {
  res.type('text/plain').send('Eventura proxy is running. Use /movieglu/* endpoints.');
});

app.get('/movieglu/health', (req, res) => {
  res.json({ ok: true, target: MG_BASE });
});

// Env-configurable MovieGlu credentials
const MG_BASE = 'https://api-gate2.movieglu.com';
const MG_CLIENT = process.env.MOVIEGLU_CLIENT || 'EVEN_4';
const MG_API_KEY = process.env.MOVIEGLU_API_KEY || process.env.THEATRES_API_KEY || 'asb8HtEHG2GZqrkdMtPk4o6rbFWjz7H25ztTV576';
const MG_TERRITORY = process.env.MOVIEGLU_TERRITORY || 'IN';
const MG_VERSION = process.env.MOVIEGLU_API_VERSION || 'v201';
const MG_AUTH = process.env.MOVIEGLU_AUTH || 'Basic RVZFTl80X1hYOmxycldZN1ZIV2ZpMw==';

function buildHeaders(req) {
  const now = new Date().toISOString();
  const incoming = req.headers || {};
  return {
    'x-api-key': incoming['x-api-key'] || MG_API_KEY,
    'client': incoming['client'] || MG_CLIENT,
    'territory': incoming['territory'] || MG_TERRITORY,
    'api-version': incoming['api-version'] || MG_VERSION,
    'device-datetime': incoming['device-datetime'] || now,
    'geolocation': incoming['geolocation'] || incoming['x-geo'] || '',
    'authorization': incoming['authorization'] || MG_AUTH,
    'accept': 'application/json'
  };
}

// Generic proxy for MovieGlu
app.use('/movieglu', async (req, res) => {
  try {
    const targetPath = req.url; // includes leading '/...'
    const url = `${MG_BASE}${targetPath}`;
    const headers = buildHeaders(req);
    const options = {
      method: req.method,
      headers,
    };
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      options.body = JSON.stringify(req.body || {});
      headers['content-type'] = 'application/json';
    }
    const upstream = await fetch(url, options);
    const text = await upstream.text();
    res.status(upstream.status);
    res.set('content-type', upstream.headers.get('content-type') || 'application/json');
    res.send(text);
  } catch (e) {
    res.status(500).json({ error: 'Proxy error', details: String(e) });
  }
});

// Simple in-memory stores (replace with Mongo in production)
const OTP_STORE = new Map(); // key: mobile, value: { code, expiresAt }
const USERS = new Map(); // key: mobile, value: { mobile, createdAt }

// Auth: Request OTP
app.post('/api/auth/request-otp', async (req, res) => {
  const { mobile } = req.body || {};
  if (!mobile || !/^\d{10}$/.test(String(mobile))) {
    return res.status(400).json({ error: 'Invalid mobile' });
  }
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 min
  OTP_STORE.set(mobile, { code, expiresAt });
  
  // If MongoDB is connected, ensure user exists
  if (isConnected()) {
    try {
      await User.findOneAndUpdate(
        { mobile },
        { mobile, lastLoginAt: new Date() },
        { upsert: true, new: true }
      );
    } catch (error) {
      console.log('MongoDB user update error:', error.message);
    }
  }
  
  // In real-world, send via SMS provider. For dev, return masked info and log code.
  console.log(`[OTP] Mobile ${mobile} Code ${code}`);
  res.json({ ok: true, message: 'OTP sent', dev_hint: 'Check server logs for code' });
});

// Auth: Verify OTP
app.post('/api/auth/verify-otp', (req, res) => {
  const { mobile, code } = req.body || {};
  const record = OTP_STORE.get(mobile);
  if (!record) return res.status(400).json({ error: 'Request OTP first' });
  if (Date.now() > record.expiresAt) return res.status(400).json({ error: 'OTP expired' });
  if (String(code) !== String(record.code)) return res.status(400).json({ error: 'Invalid OTP' });
  OTP_STORE.delete(mobile);
  if (!USERS.has(mobile)) USERS.set(mobile, { mobile, createdAt: new Date().toISOString() });
  // For demo, return a signed-less token
  const token = Buffer.from(`${mobile}:${Date.now()}`).toString('base64');
  res.json({ ok: true, token, user: { mobile } });
});

// Payments: Mock processing endpoint
app.post('/api/payments/create', async (req, res) => {
  const { method, amount, currency, meta, movieTitle, theatreName, showtime, seats } = req.body || {};
  if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' });
  
  const id = `pay_${Math.random().toString(36).slice(2)}`;
  let status = 'pending';
  let responseData = { ok: true, id, method, amount, currency };
  
  // Simulate behavior based on method
  if (method === 'card') {
    status = 'succeeded';
    responseData.status = status;
  } else if (method === 'upi') {
    // Simulate UPI collect
    status = 'pending';
    responseData = { ...responseData, status, action: 'collect', note: 'Open your UPI app to approve' };
  } else if (method === 'netbanking') {
    status = 'redirect';
    responseData = { ...responseData, status, redirect_url: 'https://example.com/mock-bank' };
  } else if (method === 'wallet') {
    status = 'succeeded';
    responseData = { ...responseData, status, wallet: (meta?.wallet || 'wallet') };
  } else {
    return res.status(400).json({ error: 'Unsupported payment method' });
  }
  
  // If MongoDB is connected, save payment record
  if (isConnected()) {
    try {
      const payment = new Payment({
        paymentId: id,
        userId: 'anonymous', // Could be extracted from auth token
        method,
        amount,
        currency: currency || 'INR',
        status,
        movieTitle,
        theatreName,
        showtime,
        seats: Array.isArray(seats) ? seats : [],
        ticketCount: Array.isArray(seats) ? seats.length : 0,
        meta: meta || {}
      });
      await payment.save();
      console.log(`✅ Payment ${id} saved to database`);
    } catch (error) {
      console.log('MongoDB payment save error:', error.message);
    }
  }
  
  res.json(responseData);
});

app.listen(PORT, () => {
  console.log(`Eventura proxy + API listening on http://localhost:${PORT}`);
});


