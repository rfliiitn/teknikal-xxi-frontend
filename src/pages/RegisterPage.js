import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../utils/api';

export default function RegisterPage() {
  const [form, setForm] = useState({ email: '', password: '', konfirmasi: '', nama_outlet: '', nama_lengkap: '' });
  const [outletList, setOutletList] = useState([]);
  const [search, setSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingOutlet, setLoadingOutlet] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showKonfirmasi, setShowKonfirmasi] = useState(false);
  const searchRef = useRef(null);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const fetchOutletList = async (q = '') => {
    setLoadingOutlet(true);
    try {
      const res = await API.get(`/auth/outlet-list${q ? `?search=${encodeURIComponent(q)}` : ''}`);
      setOutletList(res.data);
    } catch {
      setOutletList([]);
    }
    setLoadingOutlet(false);
  };

  useEffect(() => { fetchOutletList(); }, []);

  useEffect(() => {
    const timer = setTimeout(() => { if (showDropdown) fetchOutletList(search); }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const handleClick = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowDropdown(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const selectOutlet = (o) => {
    if (o.sudah_terdaftar) return;
    setForm(f => ({ ...f, nama_outlet: o.nama_outlet }));
    setSearch(o.nama_outlet);
    setShowDropdown(false);
  };

  const handleSubmit = async () => {
    setError(''); setSuccess('');
    if (!form.email || !form.password || !form.nama_outlet || !form.nama_lengkap) return setError('Semua field wajib diisi');
    if (!form.email.endsWith('@cinema21.net')) return setError('Hanya email @cinema21.net yang diizinkan');
    if (form.password !== form.konfirmasi) return setError('Password dan konfirmasi tidak cocok');
    if (form.password.length < 6) return setError('Password minimal 6 karakter');

    setLoading(true);
    try {
      await API.post('/auth/register', {
        email: form.email, password: form.password,
        nama_outlet: form.nama_outlet, nama_lengkap: form.nama_lengkap
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
          {/* Cari & Pilih Outlet */}
          <div className="col-12" ref={searchRef} style={{ position: 'relative' }}>
            <label className="form-label fw-semibold small">Cari & Pilih Outlet *</label>
            <input
              className="form-control"
              placeholder="Ketik nama outlet untuk mencari..."
              value={search}
              onChange={e => {
                setSearch(e.target.value);
                setShowDropdown(true);
                if (!e.target.value) setForm(f => ({ ...f, nama_outlet: '' }));
              }}
              onFocus={() => setShowDropdown(true)}
            />
            {form.nama_outlet && (
              <div className="mt-1 small text-success">
                <i className="bi bi-check-circle me-1" />Terpilih: <strong>{form.nama_outlet}</strong>
              </div>
            )}
            {showDropdown && (
              <div
                ref={dropdownRef}
                className="border rounded mt-1 bg-white shadow"
                style={{
                  maxHeight: 220,
                  overflowY: 'auto',
                  position: 'absolute',
                  zIndex: 1050,
                  left: 0,
                  right: 0,
                  top: '100%'
                }}
              >
                {loadingOutlet ? (
                  <div className="p-2 text-center text-muted small">
                    <span className="spinner-border spinner-border-sm me-1" />Mencari...
                  </div>
                ) : outletList.length === 0 ? (
                  <div className="p-2 text-center text-muted small">Outlet tidak ditemukan</div>
                ) : outletList.map(o => (
                  <div
                    key={o.nama_outlet}
                    className="px-3 py-2"
                    style={{
                      cursor: o.sudah_terdaftar ? 'not-allowed' : 'pointer',
                      background: form.nama_outlet === o.nama_outlet ? '#e8f0fe' : 'white',
                      opacity: o.sudah_terdaftar ? 0.6 : 1,
                      borderBottom: '1px solid #f0f0f0'
                    }}
                    onClick={() => selectOutlet(o)}
                  >
                    <div className="small fw-semibold" style={o.sudah_terdaftar ? { textDecoration: 'line-through', color: '#999' } : {}}>
                      {o.nama_outlet}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#888' }}>
                      {o.kota}
                      {o.sudah_terdaftar && <span className="ms-2 badge bg-danger" style={{ fontSize: '0.65rem' }}>Sudah Terdaftar</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="col-12">
            <label className="form-label fw-semibold small">Username *</label>
            <input className="form-control" name="nama_lengkap" placeholder="Username untuk login" value={form.nama_lengkap} onChange={handleChange} />
            <div className="form-text">Username ini dipakai untuk login selain email</div>
          </div>

          <div className="col-12">
            <label className="form-label fw-semibold small">Email *</label>
            <input className="form-control" type="email" name="email" placeholder="nama@cinema21.net" value={form.email} onChange={handleChange} />
          </div>

          <div className="col-md-6">
            <label className="form-label fw-semibold small">Password *</label>
            <div className="input-group">
              <input
                className="form-control"
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="Min. 6 karakter"
                value={form.password}
                onChange={handleChange}
              />
              <button className="btn btn-outline-secondary" type="button" onClick={() => setShowPassword(v => !v)}>
                <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`} />
              </button>
            </div>
          </div>

          <div className="col-md-6">
            <label className="form-label fw-semibold small">Konfirmasi *</label>
            <div className="input-group">
              <input
                className="form-control"
                type={showKonfirmasi ? 'text' : 'password'}
                name="konfirmasi"
                placeholder="Ulangi password"
                value={form.konfirmasi}
                onChange={handleChange}
              />
              <button className="btn btn-outline-secondary" type="button" onClick={() => setShowKonfirmasi(v => !v)}>
                <i className={`bi ${showKonfirmasi ? 'bi-eye-slash' : 'bi-eye'}`} />
              </button>
            </div>
          </div>
        </div>

        <button className="btn btn-primary w-100 fw-semibold mt-4" onClick={handleSubmit} disabled={loading}>
          {loading ? <span className="spinner-border spinner-border-sm me-2" /> : null}
          Daftar
        </button>

        <div className="text-center mt-3 small text-muted">
          Sudah punya akun? <Link to="/login" className="text-decoration-none fw-semibold">Login di sini</Link>
        </div>
      </div>
    </div>
  );
}