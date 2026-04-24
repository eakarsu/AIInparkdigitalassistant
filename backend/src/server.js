const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const app = express();
const PORT = process.env.BACKEND_PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/rides', require('./routes/rides'));
app.use('/api/shows', require('./routes/shows'));
app.use('/api/restaurants', require('./routes/restaurants'));
app.use('/api/attractions', require('./routes/attractions'));
app.use('/api/events', require('./routes/events'));
app.use('/api/gift-shops', require('./routes/giftshops'));
app.use('/api/facilities', require('./routes/facilities'));
app.use('/api/park-zones', require('./routes/parkzones'));
app.use('/api/tickets', require('./routes/tickets'));
app.use('/api/ai', require('./routes/ai'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Adventure Kingdom API is running' });
});

app.listen(PORT, () => {
  console.log(`🏰 Adventure Kingdom Backend running on port ${PORT}`);
});
