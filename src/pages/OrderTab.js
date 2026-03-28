import { useState, useEffect, useMemo } from 'react';
import API from '../utils/api';
import TrashModal from '../components/TrashModal';
import { generateOrderPDF, previewOrderPDF } from '../utils/pdfUtils';
import { useToast } from '../context/ToastContext';

const STATUS_OPTIONS = ['Sudah Diterima', 'Belum Diterima'];

const EMPTY_FORM = {
  nama_barang: '', jumlah_barang: '', tanggal_order: '',
  tanggal_diterima: '', status_barang: 'Belum Diterima', no_fpkb: '', keterangan: ''
};

export default function OrderTab({ settings, outletName }) {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showActions, setShowActions] = useState(false);
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

  const fetch = async () => {
    setLoading(true);
    try { const res = await API.get('/order'); setItems(res.data); } catch {}
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);

  const filtered = useMemo(() => items.filter(o => {
    const q = search.toLowerCase();
    const matchSearch = !q || o.nama_barang?.toLowerCase().includes(q);
    const matchStatus = !filterStatus || o.status_barang === filterStatus;
    return matchSearch && matchStatus;
  }).sort((a, b) => new Date(b.tanggal_order || b.created_at || 0) - new Date(a.tanggal_order || a.created_at || 0)), [items, search, filterStatus]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const openAdd = () => { setEditItem(null); setForm(EMPTY_FORM); setFormErr({}); setShowForm(true); };
  const openEdit = (item) => { setEditItem(item); setForm({ ...item }); setFormErr({}); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setEditItem(null); };

  const validate = () => {
    const req = ['nama_barang', 'jumlah_barang', 'tanggal_order', 'status_barang'];
    const errs = {};
    req.forEach(k => { if (!form[k]) errs[k] = 'Wajib diisi'; });
    setFormErr(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      if (editItem) await API.put(`/order/${editItem.id}`, form);
      else await API.post('/order', form);
      toast.success(editItem ? 'Data berhasil diperbarui' : 'Data berhasil ditambahkan');
      fetch(); closeForm();
    } catch { toast.error('Gagal menyimpan data'); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Pindahkan ke tempat sampah?')) return;
    try { await API.delete(`/order/${id}`); fetch(); } catch { toast.error('Gagal menghapus data'); }
  };

  const handleBulkDelete = async () => {
    if (!selected.length) return;
    if (!window.confirm(`Hapus ${selected.length} data?`)) return;
    try { await API.post('/order/bulk-delete', { ids: selected }); toast.success(`${selected.length} data dihapus`); setSelected([]); fetch(); } catch { toast.error('Gagal menghapus'); }
  };

  const toggleSelect = (id) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const toggleAll = () => setSelected(selected.length === paginated.length ? [] : paginated.map(x => x.id));

  const fc = (k) => form[k] || '';
  const setFc = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const cls = (k) => `form-control ${formErr[k] ? 'is-invalid' : ''}`;
  const fErr = (k) => formErr[k] ? <div className="invalid-feedback">{formErr[k]}</div> : null;

  const rowCls = (status) => status === 'Sudah Diterima' ? 'row-sudah-diterima' : 'row-belum-diterima';

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0"><i className="bi bi-box-seam me-2" />Data Order Barang</h5>
        <span className="badge bg-secondary">{filtered.length} item</span>
      </div>

      <div className="data-card p-3">
        <div className="table-toolbar">
          <input className="form-control search-input" placeholder="Cari nama barang..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          <button className="btn btn-sm btn-outline-secondary" onClick={() => setShowActions(v => !v)}>
            <i className={`bi ${showActions ? 'bi-x' : 'bi-list'} me-1`} />MENU
          </button>
        </div>
        {showActions && (
          <div className="toolbar-actions">
            <select className="form-select form-select-sm" style={{ width: 150 }} value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}>
              <option value="">Semua Status</option>
              {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
            </select>
            <button className="btn btn-primary btn-sm" onClick={openAdd}><i className="bi bi-plus-lg me-1" />Tambah</button>
            <button className="btn btn-danger btn-sm" onClick={handleBulkDelete} disabled={!selected.length}><i className="bi bi-trash me-1" />Hapus ({selected.length})</button>
            <button className="btn btn-outline-secondary btn-sm" onClick={() => setShowTrash(true)}><i className="bi bi-trash2 me-1" />Sampah</button>
            <button className="btn btn-outline-dark btn-sm" onClick={() => previewOrderPDF(filtered, settings, outletName)}><i className="bi bi-eye me-1" />Preview PDF</button>
            <button className="btn btn-outline-secondary btn-sm" onClick={() => generateOrderPDF(filtered, settings, outletName)}><i className="bi bi-download me-1" />Download PDF</button>
          </div>
        )}

        {loading ? <div className="text-center py-4"><div className="spinner-border text-primary" /></div> : (
          <div className="table-responsive">
            <table className="table table-bordered table-sm">
              <thead>
                <tr>
                  <th><input type="checkbox" className="form-check-input" onChange={toggleAll} checked={paginated.length > 0 && selected.length === paginated.length} /></th>
                  <th>No</th>
                  <th className="text-start">Nama Barang</th>
                  <th>Jumlah</th>
                  <th>Tgl Order</th>
                  <th>Tgl Diterima</th>
                  <th>No FPKB</th>
                  <th>Status</th>
                  <th className="text-start">Keterangan</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody style={{ textTransform: 'uppercase' }}>
                {paginated.length === 0 ? (
                  <tr><td colSpan={10} className="text-center text-muted py-3">Tidak ada data</td></tr>
                ) : paginated.map((o, i) => (
                  <tr key={o.id} className={rowCls(o.status_barang)}>
                    <td><input type="checkbox" className="form-check-input" checked={selected.includes(o.id)} onChange={() => toggleSelect(o.id)} /></td>
                    <td>{(page - 1) * PER_PAGE + i + 1}</td>
                    <td className="text-start">{o.nama_barang}</td>
                    <td>{o.jumlah_barang}</td>
                    <td>{o.tanggal_order}</td>
                    <td>{o.tanggal_diterima || '-'}</td>
                    <td>{o.no_fpkb || '-'}</td>
                    <td><span className={`badge badge-${o.status_barang?.toLowerCase().replace(/ /g, '-')}`}>{o.status_barang}</span></td>
                    <td className="text-start">{o.keterangan || '-'}</td>
                    <td style={{ whiteSpace: 'nowrap' }} className="action-cell">
                      <button className="btn btn-sm btn-warning me-1 action-btn" onClick={() => openEdit(o)}><i className="bi bi-pencil" /></button>
                      <button className="btn btn-sm btn-danger action-btn" onClick={() => handleDelete(o.id)}><i className="bi bi-trash" /></button>
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
          <div className="modal-dialog modal-lg modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{editItem ? 'Edit Order' : 'Tambah Order Barang'}</h5>
                <button className="btn-close" onClick={closeForm} />
              </div>
              <div className="modal-body">
                <div className="row g-3">
                  <div className="col-md-8">
                    <label className="form-label small fw-semibold">Nama Barang *</label>
                    <input className={cls('nama_barang')} value={fc('nama_barang')} onChange={e => setFc('nama_barang', e.target.value)} />
                    {fErr('nama_barang')}
                  </div>
                  <div className="col-md-4">
                    <label className="form-label small fw-semibold">Jumlah Barang *</label>
                    <input className={cls('jumlah_barang')} value={fc('jumlah_barang')} onChange={e => setFc('jumlah_barang', e.target.value)} />
                    {fErr('jumlah_barang')}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold">Tanggal Order *</label>
                    <input type="date" className={cls('tanggal_order')} value={fc('tanggal_order')} onChange={e => setFc('tanggal_order', e.target.value)} />
                    {fErr('tanggal_order')}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold">Tanggal Diterima</label>
                    <input className="form-control" value={fc('tanggal_diterima')} onChange={e => setFc('tanggal_diterima', e.target.value)} placeholder="Contoh: 15 Jan 2025" />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold">Status Barang *</label>
                    <select className={cls('status_barang')} value={fc('status_barang')} onChange={e => setFc('status_barang', e.target.value)}>
                      {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
                    </select>
                    {fErr('status_barang')}
                  </div>
                  <div className="col-12">
                    <label className="form-label small fw-semibold">No FPKB</label>
                    <input className="form-control" value={fc('no_fpkb')} onChange={e => setFc('no_fpkb', e.target.value)} placeholder="Nomor FPKB" />
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
                  {editItem ? 'Simpan' : 'Tambah'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <TrashModal show={showTrash} onHide={() => setShowTrash(false)} endpoint="order"
        columns={[{ key: 'nama_barang', label: 'Nama Barang' }, { key: 'jumlah_barang', label: 'Jumlah' }, { key: 'status_barang', label: 'Status' }]}
        onRestored={fetch} />
    </div>
  );
}