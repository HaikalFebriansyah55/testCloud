const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const router = express.Router();

// 🔐 REGISTER
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // Cek apakah email sudah terdaftar
    const check = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (check.rows.length > 0) {
      return res.status(400).json({ message: 'Email sudah terdaftar' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Simpan user
    const result = await pool.query(
      'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email',
      [name, email, hashedPassword]
    );

    res.status(201).json({ message: 'User terdaftar', user: result.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// 🔓 LOGIN
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Cari user
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) return res.status(400).json({ message: 'Email tidak ditemukan' });

    // Cek password
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(400).json({ message: 'Password salah' });

    // Buat token
    const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: '1d',
    });

    res.json({ message: 'Login berhasil', token });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

module.exports = router;
