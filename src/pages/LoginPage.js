import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async () => {
    setError('');
    if (!form.email || !form.password) return setError('Email dan password wajib diisi');

    setLoading(true);
    try {
      const res = await API.post('/auth/login', form);
      login(res.data.token, res.data.user);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Login gagal');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => { if (e.key === 'Enter') handleSubmit(); };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="text-center mb-4">
          <div className="auth-title">Teknikal-XXI</div>
          <div className="auth-subtitle">Sistem Data Teknikal Cinema</div>
        </div>

        {error && <div className="alert alert-danger py-2 small">{error}</div>}

        <div className="mb-3">
          <label className="form-label fw-semibold small">Email</label>
          <input
            className="form-control"
            type="email"
            name="email"
            placeholder="nama@cinema21.net"
            value={form.email}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
          />
        </div>

        <div className="mb-4">
          <label className="form-label fw-semibold small">Password</label>
          <input
            className="form-control"
            type="password"
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
          />
        </div>

        <button
          className="btn btn-primary w-100 fw-semibold"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? <span className="spinner-border spinner-border-sm me-2" /> : null}
          Masuk
        </button>

        <div className="text-center mt-3 small text-muted">
          Belum punya akun?{' '}
          <Link to="/register" className="text-decoration-none fw-semibold">Daftar di sini</Link>
        </div>

        <div className="text-center mt-2">
          <small className="text-muted" style={{ fontSize: '0.75rem' }}>
            Hanya email @cinema21.net yang diizinkan
          </small>
        </div>
      </div>
    </div>
  );
}
