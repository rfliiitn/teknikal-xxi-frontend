import { useState, useEffect, useMemo } from 'react';
import API from '../utils/api';
import TrashModal from '../components/TrashModal';
import { generateFilmPDF } from '../utils/pdfUtils';

const STATUS_OPTIONS = ['Belum Tayang', 'Sedang Tayang', 'Sudah Tayang'];

const EMPTY_FORM = {
  judul_film: '', nama_file: '', format_film: '', tanggal_upload: '', petugas_upload: '',
  tanggal_tayang: '', status_tayang: 'Belum Tayang', status_kdm: '', jumlah_file: '',
  dikirim_dari: '', dikirim_ke: '', keterangan: '', rumah_produksi: ''
};

const rowClass = (status) => {
  if (status === 'Sedang Tayang') return 'row-sedang-tayang';
  if (status === 'Sudah Tayang') return 'row-sudah-tayang';
  return '';
};

export default function FilmTab({ settings, outletName }) {
  const [films, setFilms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selected, setSelected] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErr, setFormErr] = useState({});
  const [showTrash, setShowTrash] = useState(false);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const PER_PAGE = 20;

  const fetchFilms = async () => {
    setLoading(true);
    try {
      const res = await API.get('/film');
      setFilms(res.data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchFilms(); }, []);

  const filtered = useMemo(() => {
    return films.filter(f => {
      const q = search.toLowerCase();
      const matchSearch = !q || f.judul_film?.toLowerCase().includes(q) || f.format_film?.toLowerCase().includes(q) || f.rumah_produksi?.toLowerCase().includes(q);
      const matchStatus = !filterStatus || f.status_tayang === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [films, search, filterStatus]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const openAdd = () => { setEditItem(null); setForm(EMPTY_FORM); setFormErr({}); setShowForm(true); };
  const openEdit = (item) => { setEditItem(item); setForm({ ...item }); setFormErr({}); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setEditItem(null); };

  const validate = () => {
    const required = ['judul_film', 'nama_file', 'format_film', 'tanggal_upload', 'petugas_upload', 'status_tayang', 'status_kdm', 'jumlah_file', 'dikirim_dari', 'dikirim_ke', 'rumah_produksi'];
    const errs = {};
    required.forEach(k => { if (!form[k]) errs[k] = 'Wajib diisi'; });
    setFormErr(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      if (editItem) {
        await API.put(`/film/${editItem.id}`, form);
      } else {
        await API.post('/film', form);
      }
      fetchFilms();
      closeForm();
    } catch (err) {
      alert(err.response?.data?.error || 'Gagal menyimpan');
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Pindahkan ke tempat sampah?')) return;
    try { await API.delete(`/film/${id}`); fetchFilms(); } catch { alert('Gagal menghapus'); }
  };

  const handleBulkDelete = async () => {
    if (!selected.length) return;
    if (!window.confirm(`Hapus ${selected.length} data terpilih?`)) return;
    try { await API.post('/film/bulk-delete', { ids: selected }); setSelected([]); fetchFilms(); } catch { alert('Gagal menghapus'); }
  };

  const toggleSelect = (id) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const toggleAll = () => setSelected(selected.length === paginated.length ? [] : paginated.map(f => f.id));

  const fc = (key) => form[key] || '';
  const setFc = (key, val) => setForm(f => ({ ...f, [key]: val }));
  const fErr = (key) => formErr[key] ? <div className="invalid-feedback">{formErr[key]}</div> : null;
  const cls = (key) => `form-control ${formErr[key] ? 'is-invalid' : ''}`;

  const TRASH_COLS = [
    { key: 'judul_film', label: 'Judul Film' },
    { key: 'format_film', label: 'Format' },
    { key: 'status_tayang', label: 'Status' }
  ];

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0"><i className="bi bi-film me-2" />Data Film</h5>
        <span className="badge bg-secondary">{filtered.length} film</span>
      </div>

      <div className="data-card p-3">
        {/* Toolbar */}
        <div className="table-toolbar">
          <input className="form-control search-input" placeholder="Cari judul, format, rumah produksi..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          <select className="form-select" style={{ width: 160 }} value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}>
            <option value="">Semua Status</option>
            {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
          </select>
          <button className="btn btn-primary btn-sm" onClick={openAdd}>
            <i className="bi bi-plus-lg me-1" />Tambah
          </button>
          <button className="btn btn-danger btn-sm" onClick={handleBulkDelete} disabled={!selected.length}>
            <i className="bi bi-trash me-1" />Hapus ({selected.length})
          </button>
          <button className="btn btn-outline-secondary btn-sm" onClick={() => setShowTrash(true)}>
            <i className="bi bi-trash2 me-1" />Sampah
          </button>
          <button className="btn btn-outline-dark btn-sm" onClick={() => generateFilmPDF(filtered, settings, outletName)}>
            <i className="bi bi-file-pdf me-1" />PDF
          </button>
        </div>

        {/* Legend */}
        <div className="d-flex gap-3 mb-2 small">
          <span><span className="badge bg-secondary me-1">&#9632;</span>Belum Tayang</span>
          <span style={{ color: '#155724' }}><span style={{ background: '#c6efce', padding: '1px 6px', borderRadius: 3 }} className="me-1">&#9632;</span>Sedang Tayang</span>
          <span style={{ color: '#721c24' }}><span style={{ background: '#ffc7ce', padding: '1px 6px', borderRadius: 3 }} className="me-1">&#9632;</span>Sudah Tayang</span>
        </div>

        {loading ? (
          <div className="text-center py-4"><div className="spinner-border text-primary" /></div>
        ) : (
          <div className="table-responsive">
            <table className="table table-bordered table-sm">
              <thead>
                <tr>
                  <th style={{ width: 36 }}>
                    <input type="checkbox" className="form-check-input" onChange={toggleAll} checked={paginated.length > 0 && selected.length === paginated.length} />
                  </th>
                  <th>No</th>
                  <th>Judul Film</th>
                  <th>Nama File</th>
                  <th>Format</th>
                  <th>Tgl Upload</th>
                  <th>Petugas</th>
                  <th>Tgl Tayang</th>
                  <th>Status Tayang</th>
                  <th>Status KDM</th>
                  <th>Jml File</th>
                  <th>Dari</th>
                  <th>Ke</th>
                  <th>Rumah Prod.</th>
                  <th>Keterangan</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr><td colSpan={16} className="text-center text-muted py-3">Tidak ada data</td></tr>
                ) : paginated.map((f, i) => (
                  <tr key={f.id} className={rowClass(f.status_tayang)}>
                    <td>
                      <input type="checkbox" className="form-check-input" checked={selected.includes(f.id)} onChange={() => toggleSelect(f.id)} />
                    </td>
                    <td>{(page - 1) * PER_PAGE + i + 1}</td>
                    <td style={{ maxWidth: 160, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.judul_film}</td>
                    <td style={{ maxWidth: 120, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.nama_file}</td>
                    <td>{f.format_film}</td>
                    <td>{f.tanggal_upload}</td>
                    <td>{f.petugas_upload}</td>
                    <td>{f.tanggal_tayang || '-'}</td>
                    <td>
                      <span className={`badge badge-${f.status_tayang?.toLowerCase().replace(/ /g, '-')}`}>
                        {f.status_tayang}
                      </span>
                    </td>
                    <td>{f.status_kdm}</td>
                    <td>{f.jumlah_file}</td>
                    <td>{f.dikirim_dari}</td>
                    <td>{f.dikirim_ke}</td>
                    <td>{f.rumah_produksi}</td>
                    <td>{f.keterangan || '-'}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <button className="btn btn-sm btn-warning me-1" onClick={() => openEdit(f)} title="Edit">
                        <i className="bi bi-pencil" />
                      </button>
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(f.id)} title="Hapus">
                        <i className="bi bi-trash" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <nav className="mt-2">
            <ul className="pagination pagination-sm mb-0">
              <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                <button className="page-link" onClick={() => setPage(p => p - 1)}>&#8249;</button>
              </li>
              {Array.from({ length: totalPages }, (_, i) => (
                <li key={i + 1} className={`page-item ${page === i + 1 ? 'active' : ''}`}>
                  <button className="page-link" onClick={() => setPage(i + 1)}>{i + 1}</button>
                </li>
              ))}
              <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}>
                <button className="page-link" onClick={() => setPage(p => p + 1)}>&#8250;</button>
              </li>
            </ul>
          </nav>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="modal show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-xl modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{editItem ? 'Edit Film' : 'Tambah Film'}</h5>
                <button className="btn-close" onClick={closeForm} />
              </div>
              <div className="modal-body">
                <div className="row g-3">
                  {[
                    { k: 'judul_film', l: 'Judul Film', req: true },
                    { k: 'nama_file', l: 'Nama File', req: true },
                    { k: 'format_film', l: 'Format Film', req: true, placeholder: 'Contoh: 2D, 3D, IMAX' },
                    { k: 'petugas_upload', l: 'Petugas Upload', req: true },
                    { k: 'status_kdm', l: 'Status KDM', req: true },
                    { k: 'jumlah_file', l: 'Jumlah File', req: true },
                    { k: 'dikirim_dari', l: 'Dikirim Dari', req: true },
                    { k: 'dikirim_ke', l: 'Dikirim Ke', req: true },
                    { k: 'rumah_produksi', l: 'Rumah Produksi', req: true },
                  ].map(({ k, l, req, placeholder }) => (
                    <div className="col-md-6" key={k}>
                      <label className="form-label small fw-semibold">{l}{req && ' *'}</label>
                      <input className={cls(k)} value={fc(k)} placeholder={placeholder || ''} onChange={e => setFc(k, e.target.value)} />
                      {fErr(k)}
                    </div>
                  ))}

                  <div className="col-md-6">
                    <label className="form-label small fw-semibold">Tanggal Upload *</label>
                    <input type="date" className={cls('tanggal_upload')} value={fc('tanggal_upload')} onChange={e => setFc('tanggal_upload', e.target.value)} />
                    {fErr('tanggal_upload')}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label small fw-semibold">Tanggal Tayang</label>
                    <input type="date" className="form-control" value={fc('tanggal_tayang')} onChange={e => setFc('tanggal_tayang', e.target.value)} />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label small fw-semibold">Status Tayang *</label>
                    <select className={cls('status_tayang')} value={fc('status_tayang')} onChange={e => setFc('status_tayang', e.target.value)}>
                      {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
                    </select>
                    {fErr('status_tayang')}
                  </div>

                  <div className="col-12">
                    <label className="form-label small fw-semibold">Keterangan</label>
                    <textarea className="form-control" rows={2} value={fc('keterangan')} onChange={e => setFc('keterangan', e.target.value)} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={closeForm}>Batal</button>
                <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                  {saving ? <span className="spinner-border spinner-border-sm me-1" /> : null}
                  {editItem ? 'Simpan Perubahan' : 'Tambah Film'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <TrashModal
        show={showTrash}
        onHide={() => setShowTrash(false)}
        endpoint="film"
        columns={TRASH_COLS}
        onRestored={fetchFilms}
      />
    </div>
  );
}
