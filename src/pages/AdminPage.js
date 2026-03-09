import { useState, useEffect } from 'react';
import API from '../utils/api';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('stats');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [outletList, setOutletList] = useState([]);
  const [newOutlet, setNewOutlet] = useState('');
  const [loadingStats, setLoadingStats] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingOutlet, setLoadingOutlet] = useState(false);
  const [search, setSearch] = useState('');
  const [savingOutlet, setSavingOutlet] = useState(false);

  useEffect(() => { fetchStats(); fetchUsers(); fetchOutletList(); }, []);

  const fetchStats = async () => {
    setLoadingStats(true);
    try { const res = await API.get('/admin/stats'); setStats(res.data); } catch {}
    setLoadingStats(false);
  };

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try { const res = await API.get('/admin/users'); setUsers(res.data); } catch {}
    setLoadingUsers(false);
  };

  const fetchOutletList = async () => {
    setLoadingOutlet(true);
    try { const res = await API.get('/admin/outlet-list'); setOutletList(res.data); } catch {}
    setLoadingOutlet(false);
  };

  const handleToggleUser = async (id) => {
    try { await API.put(`/admin/users/${id}/toggle`); fetchUsers(); fetchStats(); } catch { alert('Gagal'); }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Hapus akun ini permanen?')) return;
    try { await API.delete(`/admin/users/${id}`); fetchUsers(); fetchStats(); } catch { alert('Gagal'); }
  };

  const handleAddOutlet = async () => {
    if (!newOutlet.trim()) return;
    setSavingOutlet(true);
    try {
      await API.post('/admin/outlet-list', { nama_outlet: newOutlet.trim() });
      setNewOutlet('');
      fetchOutletList();
      fetchStats();
    } catch (err) {
      alert(err.response?.data?.error || 'Gagal menambah outlet');
    }
    setSavingOutlet(false);
  };

  const handleDeleteOutlet = async (id) => {
    if (!window.confirm('Hapus outlet dari daftar?')) return;
    try { await API.delete(`/admin/outlet-list/${id}`); fetchOutletList(); } catch { alert('Gagal'); }
  };

  const filteredUsers = users.filter(u => {
    const q = search.toLowerCase();
    return !q || u.nama_outlet?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.nama_lengkap?.toLowerCase().includes(q);
  });

  // Merge outlet list dengan status registrasi
  const registeredOutlets = users.map(u => u.nama_outlet);
  const mergedOutletList = outletList.map(o => ({
    ...o,
    sudah_terdaftar: registeredOutlets.includes(o.nama_outlet),
    user: users.find(u => u.nama_outlet === o.nama_outlet)
  }));

  const TABS = [
    { key: 'stats', label: 'Dashboard', icon: 'bi-speedometer2' },
    { key: 'outlets', label: 'Daftar Outlet', icon: 'bi-building' },
    { key: 'users', label: 'Akun Outlet', icon: 'bi-people' },
  ];

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0"><i className="bi bi-shield-lock me-2" />Panel Admin</h5>
      </div>

      {/* Sub tabs */}
      <ul className="nav nav-tabs mb-4">
        {TABS.map(t => (
          <li className="nav-item" key={t.key}>
            <button
              className={`nav-link ${activeTab === t.key ? 'active' : ''}`}
              onClick={() => setActiveTab(t.key)}
            >
              <i className={`bi ${t.icon} me-1`} />{t.label}
            </button>
          </li>
        ))}
      </ul>

      {/* STATS */}
      {activeTab === 'stats' && (
        <div>
          {loadingStats ? (
            <div className="text-center py-4"><div className="spinner-border text-primary" /></div>
          ) : stats ? (
            <div className="row g-3">
              {[
                { label: 'Total Outlet', value: stats.total_outlet, icon: 'bi-building', color: '#1e3a5f' },
                { label: 'Outlet Aktif', value: stats.outlet_aktif, icon: 'bi-check-circle', color: '#198754' },
                { label: 'Outlet Nonaktif', value: stats.outlet_nonaktif, icon: 'bi-x-circle', color: '#dc3545' },
                { label: 'Total Film', value: stats.total_film, icon: 'bi-film', color: '#0d6efd' },
                { label: 'Sedang Tayang', value: stats.film_sedang_tayang, icon: 'bi-play-circle', color: '#198754' },
                { label: 'Total Order', value: stats.total_order, icon: 'bi-box-seam', color: '#fd7e14' },
                { label: 'Order Pending', value: stats.order_belum_diterima, icon: 'bi-hourglass', color: '#dc3545' },
                { label: 'Total Maintenance', value: stats.total_maintenance, icon: 'bi-tools', color: '#6f42c1' },
              ].map(s => (
                <div className="col-md-3 col-6" key={s.label}>
                  <div className="data-card p-3 text-center">
                    <i className={`bi ${s.icon} fs-2 mb-2 d-block`} style={{ color: s.color }} />
                    <div style={{ fontSize: '2rem', fontWeight: 700, color: s.color, fontFamily: 'DM Serif Display, serif' }}>{s.value}</div>
                    <div className="text-muted small">{s.label}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      )}

      {/* OUTLET LIST */}
      {activeTab === 'outlets' && (
        <div>
          <div className="data-card p-3 mb-3">
            <div className="fw-semibold mb-2 small text-muted text-uppercase" style={{ letterSpacing: '0.5px' }}>Tambah Outlet Baru</div>
            <div className="d-flex gap-2">
              <input
                className="form-control"
                placeholder="Nama outlet, contoh: Cinema XXI Sudirman"
                value={newOutlet}
                onChange={e => setNewOutlet(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddOutlet()}
              />
              <button className="btn btn-primary btn-sm px-3" onClick={handleAddOutlet} disabled={savingOutlet || !newOutlet.trim()}>
                {savingOutlet ? <span className="spinner-border spinner-border-sm" /> : <><i className="bi bi-plus-lg me-1" />Tambah</>}
              </button>
            </div>
          </div>

          <div className="data-card p-0">
            {loadingOutlet ? (
              <div className="text-center py-4"><div className="spinner-border text-primary" /></div>
            ) : mergedOutletList.length === 0 ? (
              <div className="text-center py-4 text-muted">Belum ada outlet. Tambah outlet di atas.</div>
            ) : (
              <div className="table-responsive">
                <table className="table table-sm table-bordered mb-0">
                  <thead>
                    <tr>
                      <th>No</th>
                      <th>Nama Outlet</th>
                      <th>Status Registrasi</th>
                      <th>Terdaftar Oleh</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mergedOutletList.map((o, i) => (
                      <tr key={o.id}>
                        <td>{i + 1}</td>
                        <td style={o.sudah_terdaftar ? { textDecoration: 'line-through', color: '#888' } : {}}>
                          {o.nama_outlet}
                        </td>
                        <td>
                          {o.sudah_terdaftar
                            ? <span className="badge bg-success">Sudah Terdaftar</span>
                            : <span className="badge bg-secondary">Belum Terdaftar</span>
                          }
                        </td>
                        <td className="small text-muted">
                          {o.user ? `${o.user.nama_lengkap} (${o.user.email})` : '-'}
                        </td>
                        <td>
                          <button className="btn btn-sm btn-danger" onClick={() => handleDeleteOutlet(o.id)} title="Hapus dari daftar">
                            <i className="bi bi-trash" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* USERS */}
      {activeTab === 'users' && (
        <div>
          <div className="data-card p-3">
            <div className="table-toolbar mb-3">
              <input className="form-control search-input" placeholder="Cari outlet, email, nama..." value={search} onChange={e => setSearch(e.target.value)} />
              <button className="btn btn-outline-secondary btn-sm" onClick={fetchUsers}>
                <i className="bi bi-arrow-clockwise me-1" />Refresh
              </button>
            </div>

            {loadingUsers ? (
              <div className="text-center py-4"><div className="spinner-border text-primary" /></div>
            ) : (
              <div className="table-responsive">
                <table className="table table-bordered table-sm">
                  <thead>
                    <tr>
                      <th>No</th>
                      <th>Nama Outlet</th>
                      <th>Nama Lengkap</th>
                      <th>Email</th>
                      <th>Status</th>
                      <th>Terdaftar</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length === 0 ? (
                      <tr><td colSpan={7} className="text-center text-muted py-3">Tidak ada data</td></tr>
                    ) : filteredUsers.map((u, i) => (
                      <tr key={u.id} style={!u.is_active ? { opacity: 0.6 } : {}}>
                        <td>{i + 1}</td>
                        <td>{u.nama_outlet}</td>
                        <td>{u.nama_lengkap}</td>
                        <td>{u.email}</td>
                        <td>
                          {u.is_active
                            ? <span className="badge bg-success">Aktif</span>
                            : <span className="badge bg-danger">Nonaktif</span>
                          }
                        </td>
                        <td className="small text-muted">{new Date(u.created_at).toLocaleDateString('id-ID')}</td>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          <button
                            className={`btn btn-sm me-1 ${u.is_active ? 'btn-warning' : 'btn-success'}`}
                            onClick={() => handleToggleUser(u.id)}
                            title={u.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                          >
                            <i className={`bi ${u.is_active ? 'bi-pause-circle' : 'bi-play-circle'}`} />
                          </button>
                          <button className="btn btn-sm btn-danger" onClick={() => handleDeleteUser(u.id)} title="Hapus permanen">
                            <i className="bi bi-trash" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}