import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async () => {
    setError('');
    if (!form.email || !form.password) return setError('Email/username dan password wajib diisi');
    setLoading(true);
    try {
      const res = await API.post('/auth/login', form);
      login(res.data.token, res.data.user);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Login gagal, periksa kembali email/username dan password');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => { if (e.key === 'Enter') handleSubmit(); };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">

        {/* Logo / Title */}
        <div className="text-center mb-4">
          <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 14px'
          }}>
            <i className="bi bi-projector-fill text-white" style={{ fontSize: '1.4rem' }} />
          </div>
          <div className="auth-title">Teknikal-XXI</div>
          <div className="auth-subtitle">Sistem Data Teknikal Cinema</div>
        </div>

        {/* Error Alert — persisten, tidak hilang sendiri */}
        {error && (
          <div className="alert py-2 px-3 mb-3 d-flex align-items-start gap-2"
            style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#b91c1c' }}>
            <i className="bi bi-exclamation-circle-fill mt-1 flex-shrink-0" style={{ fontSize: '0.9rem' }} />
            <span className="small">{error}</span>
          </div>
        )}

        {/* Email / Username */}
        <div className="mb-3">
          <label className="form-label fw-semibold small">Email atau Username</label>
          <div className="input-group">
            <span className="input-group-text" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRight: 'none' }}>
              <i className="bi bi-person" style={{ color: '#94a3b8' }} />
            </span>
            <input
              className="form-control"
              style={{ borderLeft: 'none' }}
              type="text"
              name="email"
              placeholder="nama@cinema21.net atau username"
              value={form.email}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              autoComplete="username"
            />
          </div>
        </div>

        {/* Password */}
        <div className="mb-4">
          <label className="form-label fw-semibold small">Password</label>
          <div className="input-group">
            <span className="input-group-text" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRight: 'none' }}>
              <i className="bi bi-lock" style={{ color: '#94a3b8' }} />
            </span>
            <input
              className="form-control"
              style={{ borderLeft: 'none', borderRight: 'none' }}
              type={showPassword ? 'text' : 'password'}
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              style={{
                background: '#f8fafc', border: '1px solid #e2e8f0', borderLeft: 'none',
                borderRadius: '0 6px 6px 0', padding: '0 12px', cursor: 'pointer', color: '#94a3b8'
              }}
            >
              <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`} />
            </button>
          </div>
        </div>

        {/* Submit */}
        <button className="btn btn-primary w-100 fw-semibold py-2" onClick={handleSubmit} disabled={loading}>
          {loading
            ? <><span className="spinner-border spinner-border-sm me-2" />Memproses...</>
            : <><i className="bi bi-box-arrow-in-right me-2" />Masuk</>
          }
        </button>

        <div className="text-center mt-3 small text-muted">
          Belum punya akun?{' '}
          <Link to="/register" className="text-decoration-none fw-semibold" style={{ color: '#2563eb' }}>Daftar di sini</Link>
        </div>

        <div className="text-center mt-2">
          <small className="text-muted" style={{ fontSize: '0.72rem' }}>
            <i className="bi bi-info-circle me-1" />Gunakan email @cinema21.net atau username
          </small>
        </div>
      </div>
    </div>
  );
}