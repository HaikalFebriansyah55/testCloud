const mysql = require('mysql2');

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',       // ganti dengan user MySQL kamu
  password: '',       // ganti dengan password MySQL kamu
  database: 'testCloud'  // nama database yang kamu pakai
});

db.connect(err => {
  if (err) {
    console.error('Database connection failed:', err);
  } else {
    console.log('Connected to MySQL database!');
  }
});

module.exports = db;
