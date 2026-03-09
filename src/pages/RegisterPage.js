import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../utils/api';

export default function RegisterPage() {
  const [form, setForm] = useState({ email: '', password: '', konfirmasi: '', nama_outlet: '', nama_lengkap: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [outletTerdaftar, setOutletTerdaftar] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async () => {
    setError('');
    setSuccess('');
    setOutletTerdaftar(false);

    if (!form.email || !form.password || !form.nama_outlet || !form.nama_lengkap) return setError('Semua field wajib diisi');
    if (!form.email.endsWith('@cinema21.net')) return setError('Hanya email @cinema21.net yang diizinkan');
    if (form.password !== form.konfirmasi) return setError('Password dan konfirmasi tidak cocok');
    if (form.password.length < 6) return setError('Password minimal 6 karakter');

    setLoading(true);
    try {
      await API.post('/auth/register', {
        email: form.email,
        password: form.password,
        nama_outlet: form.nama_outlet,
        nama_lengkap: form.nama_lengkap
      });
      setSuccess('Registrasi berhasil! Silakan login.');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      const msg = err.response?.data?.error || 'Registrasi gagal';
      if (err.response?.data?.already_registered) setOutletTerdaftar(true);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card" style={{ maxWidth: 460 }}>
        <div className="text-center mb-4">
          <div className="auth-title">Daftar Akun</div>
          <div className="auth-subtitle">Teknikal-XXI — Outlet Cinema</div>
        </div>

        {error && (
          <div className={`alert py-2 small ${outletTerdaftar ? 'alert-warning' : 'alert-danger'}`}>
            {outletTerdaftar && <i className="bi bi-exclamation-triangle me-2" />}
            {error}
            {outletTerdaftar && (
              <div className="mt-1">
                <small>Jika Anda adalah operator outlet ini, hubungi admin untuk mendapatkan akses.</small>
              </div>
            )}
          </div>
        )}
        {success && <div className="alert alert-success py-2 small">{success}</div>}

        <div className="row g-3">
          <div className="col-12">
            <label className="form-label fw-semibold small">Nama Outlet</label>
            <input className="form-control" name="nama_outlet" placeholder="Contoh: Cinema XXI Sudirman" value={form.nama_outlet} onChange={handleChange} />
          </div>
          <div className="col-12">
            <label className="form-label fw-semibold small">Nama Lengkap</label>
            <input className="form-control" name="nama_lengkap" placeholder="Nama lengkap Anda" value={form.nama_lengkap} onChange={handleChange} />
          </div>
          <div className="col-12">
            <label className="form-label fw-semibold small">Email</label>
            <input className="form-control" type="email" name="email" placeholder="nama@cinema21.net" value={form.email} onChange={handleChange} />
          </div>
          <div className="col-md-6">
            <label className="form-label fw-semibold small">Password</label>
            <input className="form-control" type="password" name="password" placeholder="Min. 6 karakter" value={form.password} onChange={handleChange} />
          </div>
          <div className="col-md-6">
            <label className="form-label fw-semibold small">Konfirmasi</label>
            <input className="form-control" type="password" name="konfirmasi" placeholder="Ulangi password" value={form.konfirmasi} onChange={handleChange} />
          </div>
        </div>

        <button className="btn btn-primary w-100 fw-semibold mt-4" onClick={handleSubmit} disabled={loading}>
          {loading ? <span className="spinner-border spinner-border-sm me-2" /> : null}
          Daftar
        </button>

        <div className="text-center mt-3 small text-muted">
          Sudah punya akun?{' '}
          <Link to="/login" className="text-decoration-none fw-semibold">Login di sini</Link>
        </div>
      </div>
    </div>
  );
}
