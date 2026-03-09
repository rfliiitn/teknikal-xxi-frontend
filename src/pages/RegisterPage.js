import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../utils/api';

export default function RegisterPage() {
  const [form, setForm] = useState({ email: '', password: '', konfirmasi: '', nama_outlet: '', nama_lengkap: '' });
  const [outletList, setOutletList] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingOutlet, setLoadingOutlet] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOutletList = async () => {
      try {
        const res = await API.get('/auth/outlet-list');
        setOutletList(res.data);
      } catch {
        setOutletList([]);
      }
      setLoadingOutlet(false);
    };
    fetchOutletList();
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async () => {
    setError('');
    setSuccess('');

    if (!form.email || !form.password || !form.nama_outlet || !form.nama_lengkap) return setError('Semua field wajib diisi');
    if (!form.email.endsWith('@cinema21.net')) return setError('Hanya email @cinema21.net yang diizinkan');
    if (form.password !== form.konfirmasi) return setError('Password dan konfirmasi tidak cocok');
    if (form.password.length < 6) return setError('Password minimal 6 karakter');

    const selectedOutlet = outletList.find(o => o.nama_outlet === form.nama_outlet);
    if (selectedOutlet?.sudah_terdaftar) {
      return setError(`Outlet "${form.nama_outlet}" sudah terdaftar. Hubungi admin jika ini milik Anda.`);
    }

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
      setError(err.response?.data?.error || 'Registrasi gagal');
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

        {error && <div className="alert alert-danger py-2 small">{error}</div>}
        {success && <div className="alert alert-success py-2 small">{success}</div>}

        <div className="row g-3">
          {/* Pilih Outlet */}
          <div className="col-12">
            <label className="form-label fw-semibold small">Pilih Outlet *</label>
            {loadingOutlet ? (
              <div className="text-muted small"><span className="spinner-border spinner-border-sm me-2" />Memuat daftar outlet...</div>
            ) : outletList.length === 0 ? (
              <div className="alert alert-warning py-2 small mb-0">
                Belum ada outlet terdaftar. Hubungi admin.
              </div>
            ) : (
              <select
                className="form-select"
                name="nama_outlet"
                value={form.nama_outlet}
                onChange={handleChange}
              >
                <option value="">-- Pilih nama outlet --</option>
                {outletList.map(o => (
                  <option
                    key={o.nama_outlet}
                    value={o.nama_outlet}
                    disabled={o.sudah_terdaftar}
                    style={o.sudah_terdaftar ? { textDecoration: 'line-through', color: '#aaa' } : {}}
                  >
                    {o.nama_outlet}{o.sudah_terdaftar ? ' — Sudah Terdaftar' : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="col-12">
            <label className="form-label fw-semibold small">Nama Lengkap *</label>
            <input className="form-control" name="nama_lengkap" placeholder="Nama lengkap Anda" value={form.nama_lengkap} onChange={handleChange} />
          </div>

          <div className="col-12">
            <label className="form-label fw-semibold small">Email *</label>
            <input className="form-control" type="email" name="email" placeholder="nama@cinema21.net" value={form.email} onChange={handleChange} />
          </div>

          <div className="col-md-6">
            <label className="form-label fw-semibold small">Password *</label>
            <input className="form-control" type="password" name="password" placeholder="Min. 6 karakter" value={form.password} onChange={handleChange} />
          </div>

          <div className="col-md-6">
            <label className="form-label fw-semibold small">Konfirmasi *</label>
            <input className="form-control" type="password" name="konfirmasi" placeholder="Ulangi password" value={form.konfirmasi} onChange={handleChange} />
          </div>
        </div>

        <button className="btn btn-primary w-100 fw-semibold mt-4" onClick={handleSubmit} disabled={loading || loadingOutlet}>
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