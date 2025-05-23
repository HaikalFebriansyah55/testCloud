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

app.post('/register', (req, res) => {
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
        console.log("Database error:", err);  // 👈 Log error
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
            console.log("Gagal insert user:", err);  // 👈 Log error
            return res.status(500).json({ message: 'Gagal mendaftar' });
          }
          res.json({ message: 'Registrasi berhasil!' });
        }
      );
    }
  );
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
// Endpoint untuk verifikasi token
app.get('/api/verify-token', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1]; // Ambil token dari header

  if (!token) {
    return res.status(401).json({ message: 'Token tidak ditemukan' });
  }

  try {
    // Verifikasi token dengan secret key
    const decoded = jwt.verify(token, SECRET_KEY);
    
    // Cek user di database (opsional)
    db.query(
      'SELECT name FROM users WHERE email = ?',
      [decoded.email],
      (err, results) => {
        if (err || results.length === 0) {
          return res.status(401).json({ message: 'User tidak ditemukan' });
        }

        // Kirim data user yang divalidasi
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

// Jalankan server
app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});
