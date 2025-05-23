// routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const router = express.Router();

const SECRET_KEY = 'xK5!9pL2#sQ8*vN1$wR4%yU7&zA3^cF6'; // Sebaiknya pindahkan ke .env

// Register endpoint
router.post('/register', (req, res) => {
  const { username, email, password } = req.body;

  // Validasi input
  if (!username || !email || !password) {
    return res.status(400).json({ message: 'Semua field wajib diisi!' });
  }

  // Cek email sudah terdaftar
  db.query(
    'SELECT * FROM users WHERE email = ?', 
    [email], 
    (err, results) => {
      if (err) {
        console.log("Database error:", err);
        return res.status(500).json({ message: 'Error database' });
      }

      if (results.length > 0) {
        return res.status(400).json({ message: 'Email sudah terdaftar' });
      }

      // Hash password
      const hashedPassword = bcrypt.hashSync(password, 8);

      // Simpan user baru
      db.query(
        'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
        [username, email, hashedPassword],
        (err) => {
          if (err) {
            console.log("Gagal insert user:", err);
            return res.status(500).json({ message: 'Gagal mendaftar' });
          }
          res.json({ message: 'Registrasi berhasil!' });
        }
      );
    }
  );
});

// Login endpoint
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!(email && password)) {
    return res.status(400).json({ message: 'Email dan password harus diisi' });
  }

  const sql = 'SELECT * FROM users WHERE email = ?';
  db.query(sql, [email], (err, results) => {
    if (err) return res.status(500).json({ message: 'Error database', error: err });

    if (results.length === 0) {
      return res.status(400).json({ message: 'User tidak ditemukan' });
    }

    const user = results[0];

    const passwordIsValid = bcrypt.compareSync(password, user.password_hash);
    if (!passwordIsValid) {
      return res.status(401).json({ message: 'Password salah' });
    }

    // Generate token JWT
    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email },
      SECRET_KEY,
      { expiresIn: '1h' }
    );

    res.json({ message: 'Login berhasil', token });
  });
});

// Verify token endpoint
router.get('/verify-token', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token tidak ditemukan' });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    
    db.query(
      'SELECT name FROM users WHERE email = ?',
      [decoded.email],
      (err, results) => {
        if (err || results.length === 0) {
          return res.status(401).json({ message: 'User tidak ditemukan' });
        }

        res.json({ 
          message: 'Token valid',
          user: { name: results[0].name } 
        });
      }
    );
  } catch (err) {
    res.status(401).json({ message: 'Token tidak valid atau kadaluarsa' });
  }
});

module.exports = router;