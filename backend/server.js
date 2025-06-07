// server.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/auth');
const ticketRoutes = require('./routes/ticket');
const stationRoutes = require('./routes/station');
const orderRoutes = require('./routes/order');
const midtransRoutes = require('./routes/midtrans');
const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/ticket', ticketRoutes);
app.use('/api/station', stationRoutes);
app.use('/api/ticket/order', orderRoutes);
app.use('/api/midtrans', midtransRoutes);

// Jalankan server
app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});