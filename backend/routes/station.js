const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
  const sql = `
    SELECT DISTINCT departure_station AS station FROM routes
    UNION
    SELECT DISTINCT arrival_station AS station FROM routes
  `;
  db.query(sql, (err, rows) => {
    if (err) {
      return res.status(500).json({ message: 'Gagal mengambil data stasiun', error: err.message });
    }
    // rows: [{station: 'Jakarta'}, ...]
    res.json(rows.map(r => r.station));
  });
});

module.exports = router;