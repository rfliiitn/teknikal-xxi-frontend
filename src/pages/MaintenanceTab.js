import { useState, useEffect, useMemo } from 'react';
import API from '../utils/api';
import TrashModal from '../components/TrashModal';
import { generateMaintenancePDF, previewMaintenancePDF } from '../utils/pdfUtils';
import { useToast } from '../context/ToastContext';

const EMPTY_FORM = { tanggal: '', maintenance: '', keterangan: '' };

export default function MaintenanceTab({ settings, outletName }) {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErr, setFormErr] = useState({});
  const [showTrash, setShowTrash] = useState(false);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const PER_PAGE = 20;

  const fetch = async () => {
    setLoading(true);
    try { const res = await API.get('/maintenance'); setItems(res.data); } catch {}
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const f = !q ? items : items.filter(m => m.maintenance?.toLowerCase().includes(q) || m.keterangan?.toLowerCase().includes(q));
    return [...f].sort((a, b) => new Date(b.tanggal || b.created_at || 0) - new Date(a.tanggal || a.created_at || 0));
  }, [items, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const openAdd = () => { setEditItem(null); setForm(EMPTY_FORM); setFormErr({}); setShowForm(true); };
  const openEdit = (item) => { setEditItem(item); setForm({ ...item }); setFormErr({}); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setEditItem(null); };

  const validate = () => {
    const req = ['tanggal', 'maintenance', 'keterangan'];
    const errs = {};
    req.forEach(k => { if (!form[k]) errs[k] = 'Wajib diisi'; });
    setFormErr(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      if (editItem) await API.put(`/maintenance/${editItem.id}`, form);
      else await API.post('/maintenance', form);
      toast.success(editItem ? 'Data berhasil diperbarui' : 'Data berhasil ditambahkan');
      fetch(); closeForm();
    } catch { toast.error('Gagal menyimpan data'); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Pindahkan ke tempat sampah?')) return;
    try { await API.delete(`/maintenance/${id}`); fetch(); } catch { toast.error('Gagal menghapus data'); }
  };

  const handleBulkDelete = async () => {
    if (!selected.length) return;
    if (!window.confirm(`Hapus ${selected.length} data?`)) return;
    try { await API.post('/maintenance/bulk-delete', { ids: selected }); toast.success(`${selected.length} data dihapus`); setSelected([]); fetch(); } catch { toast.error('Gagal menghapus'); }
  };

  const toggleSelect = (id) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const toggleAll = () => setSelected(selected.length === paginated.length ? [] : paginated.map(x => x.id));

  const fc = (k) => form[k] || '';
  const setFc = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const cls = (k) => `form-control ${formErr[k] ? 'is-invalid' : ''}`;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0"><i className="bi bi-tools me-2" />Data Maintenance</h5>
        <span className="badge bg-secondary">{filtered.length} record</span>
      </div>

      <div className="data-card p-3">
        <div className="table-toolbar">
          <input className="form-control search-input" placeholder="Cari maintenance..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          <button className="btn btn-sm btn-outline-secondary" onClick={() => setShowActions(v => !v)}>
            <i className={`bi ${showActions ? 'bi-x' : 'bi-list'} me-1`} />MENU
          </button>
        </div>
        {showActions && (
          <div className="toolbar-actions">
            <button className="btn btn-primary btn-sm" onClick={openAdd}><i className="bi bi-plus-lg me-1" />Tambah</button>
            <button className="btn btn-danger btn-sm" onClick={handleBulkDelete} disabled={!selected.length}><i className="bi bi-trash me-1" />Hapus ({selected.length})</button>
            <button className="btn btn-outline-secondary btn-sm" onClick={() => setShowTrash(true)}><i className="bi bi-trash2 me-1" />Sampah</button>
            <button className="btn btn-outline-dark btn-sm" onClick={() => previewMaintenancePDF(filtered, settings, outletName)}><i className="bi bi-eye me-1" />Preview PDF</button>
            <button className="btn btn-outline-secondary btn-sm" onClick={() => generateMaintenancePDF(filtered, settings, outletName)}><i className="bi bi-download me-1" />Download PDF</button>
          </div>
        )}

        {loading ? <div className="text-center py-4"><div className="spinner-border text-primary" /></div> : (
          <div className="table-responsive">
            <table className="table table-bordered table-sm">
              <thead>
                <tr>
                  <th><input type="checkbox" className="form-check-input" onChange={toggleAll} checked={paginated.length > 0 && selected.length === paginated.length} /></th>
                  <th>No</th>
                  <th>Tanggal</th>
                  <th>Maintenance</th>
                  <th>Keterangan</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody style={{ textTransform: 'uppercase' }}>
                {paginated.length === 0 ? (
                  <tr><td colSpan={6} className="text-center text-muted py-3">Tidak ada data</td></tr>
                ) : paginated.map((m, i) => (
                  <tr key={m.id}>
                    <td><input type="checkbox" className="form-check-input" checked={selected.includes(m.id)} onChange={() => toggleSelect(m.id)} /></td>
                    <td>{(page - 1) * PER_PAGE + i + 1}</td>
                    <td>{m.tanggal}</td>
                    <td>{m.maintenance}</td>
                    <td>{m.keterangan}</td>
                    <td style={{ whiteSpace: 'nowrap' }} className="action-cell">
                      <button className="btn btn-sm btn-warning me-1 action-btn" onClick={() => openEdit(m)}><i className="bi bi-pencil" /></button>
                      <button className="btn btn-sm btn-danger action-btn" onClick={() => handleDelete(m.id)}><i className="bi bi-trash" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <nav className="mt-2">
            <ul className="pagination pagination-sm mb-0">
              <li className={`page-item ${page === 1 ? 'disabled' : ''}`}><button className="page-link" onClick={() => setPage(p => p - 1)}>&#8249;</button></li>
              {Array.from({ length: totalPages }, (_, i) => (
                <li key={i + 1} className={`page-item ${page === i + 1 ? 'active' : ''}`}><button className="page-link" onClick={() => setPage(i + 1)}>{i + 1}</button></li>
              ))}
              <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}><button className="page-link" onClick={() => setPage(p => p + 1)}>&#8250;</button></li>
            </ul>
          </nav>
        )}
      </div>

      {showForm && (
        <div className="modal show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{editItem ? 'Edit Maintenance' : 'Tambah Maintenance'}</h5>
                <button className="btn-close" onClick={closeForm} />
              </div>
              <div className="modal-body">
                <div className="row g-3">
                  <div className="col-md-4">
                    <label className="form-label small fw-semibold">Tanggal *</label>
                    <input type="date" className={cls('tanggal')} value={fc('tanggal')} onChange={e => setFc('tanggal', e.target.value)} />
                    {formErr.tanggal && <div className="invalid-feedback">{formErr.tanggal}</div>}
                  </div>
                  <div className="col-md-8">
                    <label className="form-label small fw-semibold">Maintenance *</label>
                    <input className={cls('maintenance')} value={fc('maintenance')} onChange={e => setFc('maintenance', e.target.value)} placeholder="Nama/jenis maintenance" />
                    {formErr.maintenance && <div className="invalid-feedback">{formErr.maintenance}</div>}
                  </div>
                  <div className="col-12">
                    <label className="form-label small fw-semibold">Keterangan *</label>
                    <textarea className={cls('keterangan')} rows={3} value={fc('keterangan')} onChange={e => setFc('keterangan', e.target.value)} placeholder="Detail keterangan maintenance" />
                    {formErr.keterangan && <div className="invalid-feedback">{formErr.keterangan}</div>}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={closeForm}>Batal</button>
                <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                  {saving ? <span className="spinner-border spinner-border-sm me-1" /> : null}
                  {editItem ? 'Simpan' : 'Tambah'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <TrashModal show={showTrash} onHide={() => setShowTrash(false)} endpoint="maintenance"
        columns={[{ key: 'tanggal', label: 'Tanggal' }, { key: 'maintenance', label: 'Maintenance' }]}
        onRestored={fetch} />
    </div>
  );
}