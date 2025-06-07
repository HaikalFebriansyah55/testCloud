const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/search', (req, res) => {
  const { from, to } = req.query;

  if (!from || !to) {
    return res.status(400).json({ message: 'from dan to harus diisi' });
  }

  const sql = `
    SELECT r.route_id, r.departure_station, r.arrival_station, r.departure_time, r.arrival_time, 
           t.train_name, t.train_class,t.train_id, f.price, f.available_seats
    FROM routes r
    JOIN trains t ON r.train_id = t.train_id
    JOIN fares f ON r.route_id = f.route_id
    WHERE r.departure_station = ? AND r.arrival_station = ?
  `;

  db.query(sql, [from, to], (err, rows) => {
    if (err) {
      console.error('SQL Error:', err); // Tambahkan log error ini
      return res.status(500).json({ message: 'Terjadi kesalahan server', error: err.message });
    }
    res.json(rows);
  });
});
// Route untuk detail kereta/rute berdasarkan train_id
router.get('/detail', (req, res) => {
  const { train_id } = req.query;
  if (!train_id) {
    return res.status(400).json({ message: 'train_id harus diisi' });
  }

  const sql = `
    SELECT r.route_id, r.departure_station, r.arrival_station, r.departure_time, r.arrival_time,
           t.train_id, t.train_name, t.train_class, f.price
    FROM routes r
    JOIN trains t ON r.train_id = t.train_id
    JOIN fares f ON r.route_id = f.route_id
    WHERE t.train_id = ?
    LIMIT 1
  `;
  db.query(sql, [train_id], (err, rows) => {
    if (err) {
      return res.status(500).json({ message: 'Terjadi kesalahan server', error: err.message });
    }
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Data kereta tidak ditemukan' });
    }
    res.json(rows[0]);
  });
});

module.exports = router;