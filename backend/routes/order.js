const express = require('express');
const router = express.Router();
const db = require('../db');

// POST /api/ticket/order
router.post('/order', (req, res) => {
  const { user_id, train_id, route_id, selected_seats, passengers } = req.body;
  // selected_seats: array of seat_id
  // passengers: array of { name, id_number }

  if (!user_id || !train_id || !route_id || !selected_seats || !Array.isArray(selected_seats) || !passengers || !Array.isArray(passengers)) {
    return res.status(400).json({ message: 'Data tidak lengkap' });
  }
  if (selected_seats.length !== passengers.length) {
    return res.status(400).json({ message: 'Jumlah kursi dan penumpang tidak sesuai' });
  }

  // Ambil harga kursi
  db.query('SELECT price FROM fares WHERE route_id = ?', [route_id], (err, fareRows) => {
    if (err) return res.status(500).json({ message: 'Gagal mengambil harga', error: err.message });
    if (fareRows.length === 0) return res.status(400).json({ message: 'Harga tidak ditemukan' });

    const price = fareRows[0].price;
    const total_price = price * selected_seats.length;

    // Mulai transaksi
    db.beginTransaction(err => {
      if (err) return res.status(500).json({ message: 'Gagal mulai transaksi', error: err.message });

      // 1. Insert ke bookings
      db.query(
        'INSERT INTO bookings (user_id, train_id, route_id, total_price) VALUES (?, ?, ?, ?)',
        [user_id, train_id, route_id, total_price],
        (err, result) => {
          if (err) {
            db.rollback(() => {});
            return res.status(500).json({ message: 'Gagal membuat booking', error: err.message });
          }
          const booking_id = result.insertId;

          // 2. Insert ke booking_details dan update kursi
          let completed = 0;
          let hasError = false;

          selected_seats.forEach((seat_id, idx) => {
            const passenger = passengers[idx];
            db.query(
              'INSERT INTO booking_details (booking_id, seat_id, passenger_name, passenger_id_number) VALUES (?, ?, ?, ?)',
              [booking_id, seat_id, passenger.name, passenger.id_number],
              (err) => {
                if (err) {
                  hasError = true;
                  db.rollback(() => {
                    return res.status(500).json({ message: 'Gagal simpan detail penumpang', error: err.message });
                  });
                  return;
                }
                // Update kursi
                db.query(
                  'UPDATE seats SET is_available = 0 WHERE seat_id = ?',
                  [seat_id],
                  (err) => {
                    if (err) {
                      hasError = true;
                      db.rollback(() => {
                        return res.status(500).json({ message: 'Gagal update kursi', error: err.message });
                      });
                      return;
                    }
                    completed++;
                    if (completed === selected_seats.length && !hasError) {
                      db.commit(err => {
                        if (err) {
                          db.rollback(() => {
                            return res.status(500).json({ message: 'Gagal commit transaksi', error: err.message });
                          });
                        } else {
                          res.json({ message: 'Pemesanan berhasil', booking_id });
                        }
                      });
                    }
                  }
                );
              }
            );
          });
        }
      );
    });
  });
});

module.exports = router;