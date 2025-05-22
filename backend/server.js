const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db');  // koneksi database MySQL

const app = express();
const PORT = 3000;
const SECRET_KEY = 'ini_rahasia_token'; // Ganti dan simpan di environment variables kalau production

app.use(cors());
app.use(bodyParser.json());

// Register endpoint
app.post('/register', (req, res) => {
  const { username, email, password } = req.body;

  if (!(username && email && password)) {
    return res.status(400).json({ message: 'Semua field harus diisi' });
  }

  // Cek apakah user sudah ada
  const checkSql = 'SELECT * FROM users WHERE email = ?';
  db.query(checkSql, [email], (err, results) => {
    if (err) return res.status(500).json({ message: 'Error database', error: err });

    if (results.length > 0) {
      return res.status(400).json({ message: 'Email sudah terdaftar' });
    }

    // Hash password sebelum simpan
    const hashedPassword = bcrypt.hashSync(password, 8);

    const insertSql = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)';
    db.query(insertSql, [username, email, hashedPassword], (err2) => {
      if (err2) return res.status(500).json({ message: 'Gagal mendaftar', error: err2 });

      res.json({ message: 'Registrasi berhasil' });
    });
  });
});

// Login endpoint
app.post('/login', (req, res) => {
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

    const passwordIsValid = bcrypt.compareSync(password, user.password);
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

// Jalankan server
app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});
