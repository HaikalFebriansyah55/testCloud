const API_URL = 'http://13.210.215.118:44555/api/auth';

document.addEventListener('DOMContentLoaded', () => {
  // Fungsi bantu menampilkan pesan
  function showMessage(element, message, color = 'red') {
    element.textContent = message;
    element.style.color = color;
  }

  // ===========================
  // ==== REGISTRASI USER ======
  // ===========================
  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const username = document.getElementById('registerName').value.trim();
      const email = document.getElementById('registerEmail').value.trim();
      const password = document.getElementById('registerPassword').value.trim();
      const messageDiv = document.getElementById('registerMessage');

      if (!username || !email || !password) {
        showMessage(messageDiv, 'Semua field wajib diisi.');
        return;
      }

      showMessage(messageDiv, 'Memproses...', 'gray');

      try {
        const res = await fetch(`${API_URL}/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, email, password })
        });

        const data = await res.json();
        showMessage(messageDiv, data.message, res.ok ? 'green' : 'red');

        if (res.ok) {
          // Langsung redirect tanpa delay (atau kasih delay 1 detik kalau mau)
          setTimeout(() => {
            window.location.href = 'index.html'; // ke halaman login
          }, 1000);
        }
      } catch (err) {
        showMessage(messageDiv, 'Terjadi kesalahan koneksi.');
      }
    });
  }

  // ===========================
  // ===== LOGIN USER ==========
  // ===========================
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const email = document.getElementById('loginEmail').value.trim();
      const password = document.getElementById('loginPassword').value.trim();
      const messageDiv = document.getElementById('loginMessage');

      if (!email || !password) {
        showMessage(messageDiv, 'Email dan password wajib diisi.');
        return;
      }

      showMessage(messageDiv, 'Memproses...', 'gray');

      try {
        const res = await fetch(`${API_URL}/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (!res.ok) {
          // kalau gagal login
          showMessage(messageDiv, data.message || 'Login gagal.', 'red');
          return;
        }

        if (data.token) {
          localStorage.setItem('token', data.token);
          showMessage(messageDiv, 'Login berhasil!', 'green');
          // langsung redirect ke dashboard
          setTimeout(() => {
            window.location.href = 'dashboard.html';
          }, 1000);
        } else {
          showMessage(messageDiv, 'Token tidak diterima dari server.', 'red');
        }
      } catch (err) {
        showMessage(messageDiv, 'Terjadi kesalahan koneksi.');
      }
    });
  }

  // ===========================
  // ===== PROTEKSI LOGIN ======
  // ===========================
  // Fungsi ini bisa dipanggil di halaman dashboard untuk cek token
  async function checkToken() {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Silakan login terlebih dahulu!');
      window.location.href = 'index.html';
      return false;
    }

    try {
      const res = await fetch(`${API_URL}/verify-token`, {
        headers: { Authorization: 'Bearer ' + token }
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || 'Token tidak valid atau sudah kadaluarsa.');
        localStorage.removeItem('token');
        window.location.href = 'index.html';
        return false;
      }
      return true;
    } catch (error) {
      alert('Terjadi kesalahan koneksi.');
      return false;
    }
  }

  // Jika ada elemen dashboardPage, artinya halaman dashboard sedang dibuka
  const dashboardPage = document.getElementById('dashboardPage');
  if (dashboardPage) {
    checkToken();
  }

  // ===========================
  // ===== LOGOUT =============
  // ===========================
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('token');
      window.location.href = 'index.html';
    });
  }
});

