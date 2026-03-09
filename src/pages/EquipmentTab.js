import { useState, useEffect, useMemo } from 'react';
import API from '../utils/api';
import TrashModal from '../components/TrashModal';

const EMPTY_FORM = { studio: '', projector: '', server: '', kapasitas_server: '' };

export default function EquipmentTab({ outletName }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErr, setFormErr] = useState({});
  const [showTrash, setShowTrash] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetch = async () => {
    setLoading(true);
    try { const res = await API.get('/equipment'); setItems(res.data); } catch {}
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return !q ? items : items.filter(e => e.studio?.toLowerCase().includes(q) || e.projector?.toLowerCase().includes(q) || e.server?.toLowerCase().includes(q));
  }, [items, search]);

  const openAdd = () => { setEditItem(null); setForm(EMPTY_FORM); setFormErr({}); setShowForm(true); };
  const openEdit = (item) => { setEditItem(item); setForm({ ...item }); setFormErr({}); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setEditItem(null); };

  const validate = () => {
    const req = ['studio', 'projector', 'server'];
    const errs = {};
    req.forEach(k => { if (!form[k]) errs[k] = 'Wajib diisi'; });
    setFormErr(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      if (editItem) await API.put(`/equipment/${editItem.id}`, form);
      else await API.post('/equipment', form);
      fetch(); closeForm();
    } catch { alert('Gagal menyimpan'); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Pindahkan ke tempat sampah?')) return;
    try { await API.delete(`/equipment/${id}`); fetch(); } catch { alert('Gagal'); }
  };

  const handleBulkDelete = async () => {
    if (!selected.length) return;
    if (!window.confirm(`Hapus ${selected.length} data?`)) return;
    try { await API.post('/equipment/bulk-delete', { ids: selected }); setSelected([]); fetch(); } catch {}
  };

  const toggleSelect = (id) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const toggleAll = () => setSelected(selected.length === filtered.length ? [] : filtered.map(x => x.id));

  const fc = (k) => form[k] || '';
  const setFc = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const cls = (k) => `form-control ${formErr[k] ? 'is-invalid' : ''}`;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0"><i className="bi bi-pc-display me-2" />Data Equipment</h5>
        <span className="badge bg-secondary">{filtered.length} item</span>
      </div>

      <div className="data-card p-3">
        <div className="table-toolbar">
          <input className="form-control search-input" placeholder="Cari studio, projector, server..." value={search} onChange={e => setSearch(e.target.value)} />
          <button className="btn btn-primary btn-sm" onClick={openAdd}><i className="bi bi-plus-lg me-1" />Tambah</button>
          <button className="btn btn-danger btn-sm" onClick={handleBulkDelete} disabled={!selected.length}><i className="bi bi-trash me-1" />Hapus ({selected.length})</button>
          <button className="btn btn-outline-secondary btn-sm" onClick={() => setShowTrash(true)}><i className="bi bi-trash2 me-1" />Sampah</button>
        </div>

        {loading ? <div className="text-center py-4"><div className="spinner-border text-primary" /></div> : (
          <div className="table-responsive">
            <table className="table table-bordered table-sm">
              <thead>
                <tr>
                  <th><input type="checkbox" className="form-check-input" onChange={toggleAll} checked={filtered.length > 0 && selected.length === filtered.length} /></th>
                  <th>No</th>
                  <th>Studio</th>
                  <th>Projector</th>
                  <th>Server</th>
                  <th>Kapasitas Server</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} className="text-center text-muted py-3">Tidak ada data</td></tr>
                ) : filtered.map((e, i) => (
                  <tr key={e.id}>
                    <td><input type="checkbox" className="form-check-input" checked={selected.includes(e.id)} onChange={() => toggleSelect(e.id)} /></td>
                    <td>{i + 1}</td>
                    <td>{e.studio}</td>
                    <td>{e.projector}</td>
                    <td>{e.server}</td>
                    <td>{e.kapasitas_server || '-'}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <button className="btn btn-sm btn-warning me-1" onClick={() => openEdit(e)}><i className="bi bi-pencil" /></button>
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(e.id)}><i className="bi bi-trash" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <div className="modal show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{editItem ? 'Edit Equipment' : 'Tambah Equipment'}</h5>
                <button className="btn-close" onClick={closeForm} />
              </div>
              <div className="modal-body">
                <div className="row g-3">
                  {[
                    { k: 'studio', l: 'Studio *' },
                    { k: 'projector', l: 'Projector *' },
                    { k: 'server', l: 'Server *' },
                    { k: 'kapasitas_server', l: 'Kapasitas Server' },
                  ].map(({ k, l }) => (
                    <div className="col-md-6" key={k}>
                      <label className="form-label small fw-semibold">{l}</label>
                      <input className={cls(k)} value={fc(k)} onChange={e => setFc(k, e.target.value)} />
                      {formErr[k] && <div className="invalid-feedback">{formErr[k]}</div>}
                    </div>
                  ))}
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

      <TrashModal show={showTrash} onHide={() => setShowTrash(false)} endpoint="equipment"
        columns={[{ key: 'studio', label: 'Studio' }, { key: 'projector', label: 'Projector' }, { key: 'server', label: 'Server' }]}
        onRestored={fetch} />
    </div>
  );
}
