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
  const navigate = useNavigate();

  const fetchOutletList = async (q = '') => {
    setLoadingOutlet(true);
    try {
      const res = await API.get(`/auth/outlet-list${q ? `?search=${encodeURIComponent(q)}` : ''}`);
      setOutletList(res.data);
    } catch { setOutletList([]); }
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
    if (!form.nama_outlet) return setError('Pilih outlet terlebih dahulu');
    if (!form.nama_lengkap) return setError('Username wajib diisi');
    if (!form.email) return setError('Email wajib diisi');
    if (!form.email.endsWith('@cinema21.net')) return setError('Hanya email @cinema21.net yang diizinkan');
    if (!form.password) return setError('Password wajib diisi');
    if (form.password.length < 6) return setError('Password minimal 6 karakter');
    if (form.password !== form.konfirmasi) return setError('Password dan konfirmasi tidak cocok');

    setLoading(true);
    try {
      await API.post('/auth/register', {
        email: form.email, password: form.password,
        nama_outlet: form.nama_outlet, nama_lengkap: form.nama_lengkap
      });
      setSuccess('Registrasi berhasil! Mengarahkan ke halaman login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Registrasi gagal, coba lagi');
    } finally {
      setLoading(false);
    }
  };

  // style helper
  const iconSpan = (icon) => (
    <span className="input-group-text" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRight: 'none' }}>
      <i className={`bi ${icon}`} style={{ color: '#94a3b8' }} />
    </span>
  );

  const eyeBtn = (show, toggle) => (
    <button type="button" onClick={toggle}
      style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderLeft: 'none', borderRadius: '0 6px 6px 0', padding: '0 12px', cursor: 'pointer', color: '#94a3b8' }}>
      <i className={`bi ${show ? 'bi-eye-slash' : 'bi-eye'}`} />
    </button>
  );

  return (
    <div className="auth-wrapper">
      <div className="auth-card" style={{ maxWidth: 480 }}>

        {/* Title */}
        <div className="text-center mb-4">
          <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 14px'
          }}>
            <i className="bi bi-person-plus-fill text-white" style={{ fontSize: '1.4rem' }} />
          </div>
          <div className="auth-title">Daftar Akun</div>
          <div className="auth-subtitle">Teknikal-XXI — Outlet Cinema</div>
        </div>

        {/* Alert */}
        {error && (
          <div className="d-flex align-items-start gap-2 mb-3 py-2 px-3"
            style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#b91c1c' }}>
            <i className="bi bi-exclamation-circle-fill mt-1 flex-shrink-0" style={{ fontSize: '0.9rem' }} />
            <span className="small">{error}</span>
          </div>
        )}
        {success && (
          <div className="d-flex align-items-start gap-2 mb-3 py-2 px-3"
            style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, color: '#15803d' }}>
            <i className="bi bi-check-circle-fill mt-1 flex-shrink-0" style={{ fontSize: '0.9rem' }} />
            <span className="small">{success}</span>
          </div>
        )}

        <div className="row g-3">

          {/* Pilih Outlet */}
          <div className="col-12" ref={searchRef} style={{ position: 'relative' }}>
            <label className="form-label fw-semibold small">Outlet *</label>
            <div className="input-group">
              {iconSpan('bi-building')}
              <input
                className="form-control"
                style={{ borderLeft: 'none' }}
                placeholder="Ketik nama outlet untuk mencari..."
                value={search}
                onChange={e => {
                  setSearch(e.target.value);
                  setShowDropdown(true);
                  if (!e.target.value) setForm(f => ({ ...f, nama_outlet: '' }));
                }}
                onFocus={() => setShowDropdown(true)}
              />
            </div>
            {form.nama_outlet && (
              <div className="mt-1 small" style={{ color: '#15803d' }}>
                <i className="bi bi-check-circle-fill me-1" />Terpilih: <strong>{form.nama_outlet}</strong>
              </div>
            )}
            {showDropdown && (
              <div className="border rounded mt-1 bg-white"
                style={{ maxHeight: 200, overflowY: 'auto', position: 'absolute', zIndex: 1050, left: 0, right: 0, top: '100%', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                {loadingOutlet ? (
                  <div className="p-2 text-center text-muted small">
                    <span className="spinner-border spinner-border-sm me-1" />Mencari...
                  </div>
                ) : outletList.length === 0 ? (
                  <div className="p-2 text-center text-muted small">Outlet tidak ditemukan</div>
                ) : outletList.map(o => (
                  <div key={o.nama_outlet}
                    className="px-3 py-2"
                    style={{
                      cursor: o.sudah_terdaftar ? 'not-allowed' : 'pointer',
                      background: form.nama_outlet === o.nama_outlet ? '#eff6ff' : 'white',
                      opacity: o.sudah_terdaftar ? 0.55 : 1,
                      borderBottom: '1px solid #f1f5f9'
                    }}
                    onMouseEnter={e => { if (!o.sudah_terdaftar) e.currentTarget.style.background = '#f8fafc'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = form.nama_outlet === o.nama_outlet ? '#eff6ff' : 'white'; }}
                    onClick={() => selectOutlet(o)}
                  >
                    <div className="small fw-semibold" style={o.sudah_terdaftar ? { textDecoration: 'line-through', color: '#94a3b8' } : {}}>
                      {o.nama_outlet}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                      {o.kota}
                      {o.sudah_terdaftar && <span className="ms-2 badge" style={{ background: '#fee2e2', color: '#b91c1c', fontSize: '0.62rem' }}>Sudah Terdaftar</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Username */}
          <div className="col-12">
            <label className="form-label fw-semibold small">Username *</label>
            <div className="input-group">
              {iconSpan('bi-at')}
              <input className="form-control" style={{ borderLeft: 'none' }}
                name="nama_lengkap" placeholder="Username untuk login"
                value={form.nama_lengkap} onChange={handleChange} />
            </div>
            <div className="form-text" style={{ fontSize: '0.75rem' }}>Digunakan untuk login selain email</div>
          </div>

          {/* Email */}
          <div className="col-12">
            <label className="form-label fw-semibold small">Email *</label>
            <div className="input-group">
              {iconSpan('bi-envelope')}
              <input className="form-control" style={{ borderLeft: 'none' }}
                type="email" name="email" placeholder="nama@cinema21.net"
                value={form.email} onChange={handleChange} />
            </div>
          </div>

          {/* Password */}
          <div className="col-md-6">
            <label className="form-label fw-semibold small">Password *</label>
            <div className="input-group">
              {iconSpan('bi-lock')}
              <input className="form-control" style={{ borderLeft: 'none', borderRight: 'none' }}
                type={showPassword ? 'text' : 'password'} name="password"
                placeholder="Min. 6 karakter"
                value={form.password} onChange={handleChange} />
              {eyeBtn(showPassword, () => setShowPassword(v => !v))}
            </div>
          </div>

          {/* Konfirmasi */}
          <div className="col-md-6">
            <label className="form-label fw-semibold small">Konfirmasi *</label>
            <div className="input-group">
              {iconSpan('bi-lock-fill')}
              <input className="form-control" style={{ borderLeft: 'none', borderRight: 'none' }}
                type={showKonfirmasi ? 'text' : 'password'} name="konfirmasi"
                placeholder="Ulangi password"
                value={form.konfirmasi} onChange={handleChange} />
              {eyeBtn(showKonfirmasi, () => setShowKonfirmasi(v => !v))}
            </div>
            {form.konfirmasi && form.password !== form.konfirmasi && (
              <div className="mt-1 small" style={{ color: '#b91c1c' }}>
                <i className="bi bi-x-circle me-1" />Password tidak cocok
              </div>
            )}
            {form.konfirmasi && form.password === form.konfirmasi && form.password.length >= 6 && (
              <div className="mt-1 small" style={{ color: '#15803d' }}>
                <i className="bi bi-check-circle me-1" />Password cocok
              </div>
            )}
          </div>
        </div>

        <button className="btn btn-primary w-100 fw-semibold py-2 mt-4" onClick={handleSubmit} disabled={loading}>
          {loading
            ? <><span className="spinner-border spinner-border-sm me-2" />Mendaftarkan...</>
            : <><i className="bi bi-person-check me-2" />Daftar</>
          }
        </button>

        <div className="text-center mt-3 small text-muted">
          Sudah punya akun?{' '}
          <Link to="/login" className="text-decoration-none fw-semibold" style={{ color: '#2563eb' }}>Login di sini</Link>
        </div>
      </div>
    </div>
  );
}