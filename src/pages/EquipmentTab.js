import { useState, useEffect, useMemo } from 'react';
import API from '../utils/api';
import TrashModal from '../components/TrashModal';
import { useToast } from '../context/ToastContext';

// ─── PROJECTOR SUB-TAB ────────────────────────────────────────────────────────
function ProjectorTab() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ type_projector: '', type_lensa: '', lamp_projector: '', total_unit: '', keterangan: '' });
  const [formErr, setFormErr] = useState({});
  const [showTrash, setShowTrash] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try { const res = await API.get('/projector'); setItems(res.data); } catch {}
    setLoading(false);
  };
  useEffect(() => { fetchData(); }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return !q ? items : items.filter(p => p.type_projector?.toLowerCase().includes(q) || p.type_lensa?.toLowerCase().includes(q));
  }, [items, search]);

  const openAdd = () => { setEditItem(null); setForm({ type_projector: '', type_lensa: '', lamp_projector: '', keterangan: '' }); setFormErr({}); setShowForm(true); };
  const openEdit = (item) => { setEditItem(item); setForm({ ...item }); setFormErr({}); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setEditItem(null); };
  const validate = () => { const errs = {}; if (!form.type_projector) errs.type_projector = 'Wajib diisi'; setFormErr(errs); return Object.keys(errs).length === 0; };
  const handleSave = async () => {
    if (!validate()) return; setSaving(true);
    const toNum = v => (v !== '' && v !== null && v !== undefined) ? parseFloat(v) : null;
    const payload = { ...form, total_unit: toNum(form.total_unit) };
    try {
      if (editItem) await API.put(`/projector/${editItem.id}`, payload);
      else await API.post('/projector', payload);
      toast.success(editItem ? 'Projector berhasil diperbarui' : 'Projector berhasil ditambahkan');
      fetchData(); closeForm();
    } catch { toast.error('Gagal menyimpan data'); }
    setSaving(false);
  };
  const handleDelete = async (id) => {
    if (!window.confirm('Pindahkan ke tempat sampah?')) return;
    try { await API.delete(`/projector/${id}`); toast.success('Dipindahkan ke sampah'); fetchData(); } catch { toast.error('Gagal menghapus'); }
  };
  const fc = (k) => form[k] || '';
  const setFc = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const cls = (k) => `form-control ${formErr[k] ? 'is-invalid' : ''}`;

  return (
    <div>
      <div className="data-card p-3">
        <div className="table-toolbar">
          <input className="form-control search-input" placeholder="Cari tipe projector, lensa..." value={search} onChange={e => setSearch(e.target.value)} />
          <button className="btn btn-sm btn-outline-secondary" onClick={() => setShowActions(v => !v)}>
            <i className={`bi ${showActions ? 'bi-x' : 'bi-list'} me-1`} />MENU
          </button>
        </div>
        {showActions && (
          <div className="toolbar-actions">
            <button className="btn btn-primary btn-sm" onClick={openAdd}><i className="bi bi-plus-lg me-1" />Tambah</button>
            <button className="btn btn-outline-secondary btn-sm" onClick={() => setShowTrash(true)}><i className="bi bi-trash2 me-1" />Sampah</button>
          </div>
        )}
        {loading ? <div className="text-center py-4"><div className="spinner-border text-primary" /></div> : (
          <div className="table-responsive">
            <table className="table table-bordered table-sm">
              <thead><tr><th>No</th><th>Type Projector</th><th>Type Lensa</th><th>Lamp</th><th>Total Unit</th><th>Keterangan</th><th>Aksi</th></tr></thead>
              <tbody style={{ textTransform: 'uppercase' }}>
                {filtered.length === 0 ? <tr><td colSpan={6} className="text-center text-muted py-3">Tidak ada data</td></tr>
                : filtered.map((p, i) => (
                  <tr key={p.id}>
                    <td>{i + 1}</td><td>{p.type_projector}</td><td>{p.type_lensa || '-'}</td>
                    <td>{p.lamp_projector || '-'}</td><td>{p.total_unit || '-'}</td><td className="text-start">{p.keterangan || '-'}</td>
                    <td style={{ whiteSpace: 'nowrap' }} className="action-cell">
                      <button className="btn btn-sm btn-warning me-1 action-btn" onClick={() => openEdit(p)}><i className="bi bi-pencil" /></button>
                      <button className="btn btn-sm btn-danger action-btn" onClick={() => handleDelete(p.id)}><i className="bi bi-trash" /></button>
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
          <div className="modal-dialog"><div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">{editItem ? 'Edit Projector' : 'Tambah Projector'}</h5>
              <button className="btn-close" onClick={closeForm} />
            </div>
            <div className="modal-body">
              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label small fw-semibold">Type Projector *</label>
                  <input className={cls('type_projector')} placeholder="misal: CHRISTIE CP2220" value={fc('type_projector')} onChange={e => setFc('type_projector', e.target.value)} />
                  {formErr.type_projector && <div className="invalid-feedback">{formErr.type_projector}</div>}
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-semibold">Type Lensa</label>
                  <input className="form-control" value={fc('type_lensa')} onChange={e => setFc('type_lensa', e.target.value)} />
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-semibold">Lamp Projector</label>
                  <select className="form-select" value={fc('lamp_projector')} onChange={e => setFc('lamp_projector', e.target.value)}>
                    <option value="">-- Pilih --</option>
                    <option value="laser">Laser</option>
                    <option value="xenon">Xenon</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-semibold">Total Unit</label>
                  <input type="number" className="form-control" placeholder="Contoh: 2" value={fc('total_unit')} onChange={e => setFc('total_unit', e.target.value)} />
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
                {saving ? <span className="spinner-border spinner-border-sm me-1" /> : null}{editItem ? 'Simpan' : 'Tambah'}
              </button>
            </div>
          </div></div>
        </div>
      )}
      <TrashModal show={showTrash} onHide={() => setShowTrash(false)} endpoint="projector"
        columns={[{ key: 'type_projector', label: 'Type Projector' }, { key: 'lamp_projector', label: 'Lamp' }, { key: 'total_unit', label: 'Total Unit' }]} onRestored={fetchData} />
    </div>
  );
}

// ─── SERVER SUB-TAB ───────────────────────────────────────────────────────────
function ServerTab() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ type_server: '', kapasitas_server: '', total_unit: '', keterangan: '' });
  const [formErr, setFormErr] = useState({});
  const [showTrash, setShowTrash] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try { const res = await API.get('/server'); setItems(res.data); } catch {}
    setLoading(false);
  };
  useEffect(() => { fetchData(); }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return !q ? items : items.filter(s => s.type_server?.toLowerCase().includes(q));
  }, [items, search]);

  const openAdd = () => { setEditItem(null); setForm({ type_server: '', kapasitas_server: '', size_terpakai: '', keterangan: '' }); setFormErr({}); setShowForm(true); };
  const openEdit = (item) => { setEditItem(item); setForm({ ...item }); setFormErr({}); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setEditItem(null); };
  const validate = () => { const errs = {}; if (!form.type_server) errs.type_server = 'Wajib diisi'; setFormErr(errs); return Object.keys(errs).length === 0; };
  const handleSave = async () => {
    if (!validate()) return; setSaving(true);
    const toNum = v => (v !== '' && v !== null && v !== undefined) ? parseFloat(v) : null;
    const payload = { ...form, kapasitas_server: toNum(form.kapasitas_server), size_terpakai: toNum(form.size_terpakai), total_unit: toNum(form.total_unit) };
    try {
      if (editItem) await API.put(`/server/${editItem.id}`, payload);
      else await API.post('/server', payload);
      toast.success(editItem ? 'Server berhasil diperbarui' : 'Server berhasil ditambahkan');
      fetchData(); closeForm();
    } catch { toast.error('Gagal menyimpan data'); }
    setSaving(false);
  };
  const handleDelete = async (id) => {
    if (!window.confirm('Pindahkan ke tempat sampah?')) return;
    try { await API.delete(`/server/${id}`); toast.success('Dipindahkan ke sampah'); fetchData(); } catch { toast.error('Gagal menghapus'); }
  };

  const fc = (k) => form[k] ?? '';
  const setFc = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const cls = (k) => `form-control ${formErr[k] ? 'is-invalid' : ''}`;

  return (
    <div>
      <div className="data-card p-3">
        <div className="table-toolbar">
          <input className="form-control search-input" placeholder="Cari tipe server..." value={search} onChange={e => setSearch(e.target.value)} />
          <button className="btn btn-sm btn-outline-secondary" onClick={() => setShowActions(v => !v)}>
            <i className={`bi ${showActions ? 'bi-x' : 'bi-list'} me-1`} />MENU
          </button>
        </div>
        {showActions && (
          <div className="toolbar-actions">
            <button className="btn btn-primary btn-sm" onClick={openAdd}><i className="bi bi-plus-lg me-1" />Tambah</button>
            <button className="btn btn-outline-secondary btn-sm" onClick={() => setShowTrash(true)}><i className="bi bi-trash2 me-1" />Sampah</button>
          </div>
        )}
        {loading ? <div className="text-center py-4"><div className="spinner-border text-primary" /></div> : (
          <div className="table-responsive">
            <table className="table table-bordered table-sm">
              <thead><tr><th>No</th><th>Type Server</th><th>Kapasitas</th><th>Keterangan</th><th>Aksi</th></tr></thead>
              <tbody style={{ textTransform: 'uppercase' }}>
                {filtered.length === 0 ? <tr><td colSpan={5} className="text-center text-muted py-3">Tidak ada data</td></tr>
                : filtered.map((s, i) => (
                  <tr key={s.id}>
                    <td>{i + 1}</td>
                    <td className="text-start">
                      {s.is_aam && <span className="badge me-1" style={{background:'#fbbf24',color:'#78350f',fontSize:'0.7rem'}}>AAM</span>}
                      {s.type_server}
                    </td>
                    <td>{s.kapasitas_server ? `${s.kapasitas_server} GB` : '-'}</td>
                    <td className="text-start">{s.keterangan || '-'}</td>
                    <td style={{ whiteSpace: 'nowrap' }} className="action-cell">
                      <button className="btn btn-sm btn-warning me-1 action-btn" onClick={() => openEdit(s)}><i className="bi bi-pencil" /></button>
                      {!s.is_aam && <button className="btn btn-sm btn-danger action-btn" onClick={() => handleDelete(s.id)}><i className="bi bi-trash" /></button>}
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
          <div className="modal-dialog"><div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">{editItem ? 'Edit Server' : 'Tambah Server'}</h5>
              <button className="btn-close" onClick={closeForm} />
            </div>
            <div className="modal-body">
              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label small fw-semibold">Type Server *</label>
                  <input className={cls('type_server')} placeholder="ims3000 atau AAM library"
                    value={fc('type_server')} onChange={e => setFc('type_server', e.target.value)}
                    readOnly={!!editItem?.is_aam}
                    style={editItem?.is_aam ? {background:'var(--surface-2)',cursor:'not-allowed'} : {}} />
                  {editItem?.is_aam && <div className="form-text">AAM Library tidak dapat diubah namanya</div>}
                  {formErr.type_server && <div className="invalid-feedback">{formErr.type_server}</div>}
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-semibold">Kapasitas Server</label>
                  <div className="input-group">
                    <input type="number" className="form-control" placeholder="Contoh: 8000" value={fc('kapasitas_server')} onChange={e => setFc('kapasitas_server', e.target.value)} />
                    <span className="input-group-text">GB</span>
                  </div>
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-semibold">Total Unit</label>
                  <input type="number" className="form-control" placeholder="Contoh: 1" value={fc('total_unit')} onChange={e => setFc('total_unit', e.target.value)} />
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
                {saving ? <span className="spinner-border spinner-border-sm me-1" /> : null}{editItem ? 'Simpan' : 'Tambah'}
              </button>
            </div>
          </div></div>
        </div>
      )}
      <TrashModal show={showTrash} onHide={() => setShowTrash(false)} endpoint="server"
        columns={[{ key: 'type_server', label: 'Type Server' }, { key: 'kapasitas_server', label: 'Kapasitas' }]} onRestored={fetchData} />
    </div>
  );
}

// ─── AC SUB-TAB ───────────────────────────────────────────────────────────────
function AcTab() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ type_ac: '', merk_ac: '', total_pk: '', total_unit: '', keterangan: '' });
  const [formErr, setFormErr] = useState({});
  const [showTrash, setShowTrash] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try { const res = await API.get('/ac'); setItems(res.data); } catch {}
    setLoading(false);
  };
  useEffect(() => { fetchData(); }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return !q ? items : items.filter(a => a.merk_ac?.toLowerCase().includes(q) || a.type_ac?.toLowerCase().includes(q));
  }, [items, search]);

  const openAdd = () => { setEditItem(null); setForm({ type_ac: '', merk_ac: '', total_pk: '', total_unit: '', keterangan: '' }); setFormErr({}); setShowForm(true); };
  const openEdit = (item) => { setEditItem(item); setForm({ ...item }); setFormErr({}); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setEditItem(null); };
  const validate = () => {
    const errs = {};
    if (!form.type_ac) errs.type_ac = 'Wajib diisi';
    if (!form.merk_ac) errs.merk_ac = 'Wajib diisi';
    setFormErr(errs); return Object.keys(errs).length === 0;
  };
  const handleSave = async () => {
    if (!validate()) return; setSaving(true);
    const toNum = v => (v !== '' && v !== null && v !== undefined) ? parseFloat(v) : null;
    const payload = { ...form, total_pk: toNum(form.total_pk), total_unit: toNum(form.total_unit) };
    try {
      if (editItem) await API.put(`/ac/${editItem.id}`, payload);
      else await API.post('/ac', payload);
      toast.success(editItem ? 'AC berhasil diperbarui' : 'AC berhasil ditambahkan');
      fetchData(); closeForm();
    } catch { toast.error('Gagal menyimpan data'); }
    setSaving(false);
  };
  const handleDelete = async (id) => {
    if (!window.confirm('Pindahkan ke tempat sampah?')) return;
    try { await API.delete(`/ac/${id}`); toast.success('Dipindahkan ke sampah'); fetchData(); } catch { toast.error('Gagal menghapus'); }
  };
  const fc = (k) => form[k] || '';
  const setFc = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const cls = (k) => `form-control ${formErr[k] ? 'is-invalid' : ''}`;
  const clsSel = (k) => `form-select ${formErr[k] ? 'is-invalid' : ''}`;

  return (
    <div>
      <div className="data-card p-3">
        <div className="table-toolbar">
          <input className="form-control search-input" placeholder="Cari merk, tipe AC..." value={search} onChange={e => setSearch(e.target.value)} />
          <button className="btn btn-sm btn-outline-secondary" onClick={() => setShowActions(v => !v)}>
            <i className={`bi ${showActions ? 'bi-x' : 'bi-list'} me-1`} />MENU
          </button>
        </div>
        {showActions && (
          <div className="toolbar-actions">
            <button className="btn btn-primary btn-sm" onClick={openAdd}><i className="bi bi-plus-lg me-1" />Tambah</button>
            <button className="btn btn-outline-secondary btn-sm" onClick={() => setShowTrash(true)}><i className="bi bi-trash2 me-1" />Sampah</button>
          </div>
        )}
        {loading ? <div className="text-center py-4"><div className="spinner-border text-primary" /></div> : (
          <div className="table-responsive">
            <table className="table table-bordered table-sm">
              <thead><tr><th>No</th><th>Type AC</th><th>Merk AC</th><th>Total PK</th><th>Total Unit</th><th>Keterangan</th><th>Aksi</th></tr></thead>
              <tbody style={{ textTransform: 'uppercase' }}>
                {filtered.length === 0 ? <tr><td colSpan={6} className="text-center text-muted py-3">Tidak ada data</td></tr>
                : filtered.map((a, i) => (
                  <tr key={a.id}>
                    <td>{i + 1}</td><td>{a.type_ac || '-'}</td><td>{a.merk_ac}</td>
                    <td>{a.total_pk ? `${a.total_pk} PK` : '-'}</td><td>{a.total_unit || '-'}</td><td className="text-start">{a.keterangan || '-'}</td>
                    <td style={{ whiteSpace: 'nowrap' }} className="action-cell">
                      <button className="btn btn-sm btn-warning me-1 action-btn" onClick={() => openEdit(a)}><i className="bi bi-pencil" /></button>
                      <button className="btn btn-sm btn-danger action-btn" onClick={() => handleDelete(a.id)}><i className="bi bi-trash" /></button>
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
          <div className="modal-dialog"><div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">{editItem ? 'Edit AC' : 'Tambah AC'}</h5>
              <button className="btn-close" onClick={closeForm} />
            </div>
            <div className="modal-body">
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label small fw-semibold">Type AC *</label>
                  <select className={clsSel('type_ac')} value={fc('type_ac')} onChange={e => setFc('type_ac', e.target.value)}>
                    <option value="">-- Pilih --</option>
                    <option value="central">Central</option>
                    <option value="split">Split</option>
                  </select>
                  {formErr.type_ac && <div className="invalid-feedback">{formErr.type_ac}</div>}
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-semibold">Merk AC *</label>
                  <input className={cls('merk_ac')} value={fc('merk_ac')} onChange={e => setFc('merk_ac', e.target.value)} />
                  {formErr.merk_ac && <div className="invalid-feedback">{formErr.merk_ac}</div>}
                </div>
                <div className="col-md-4">
                  <label className="form-label small fw-semibold">Total PK</label>
                  <div className="input-group">
                    <input type="number" step="0.5" className="form-control" placeholder="Contoh: 12.5" value={fc('total_pk')} onChange={e => setFc('total_pk', e.target.value)} />
                    <span className="input-group-text">PK</span>
                  </div>
                </div>
                <div className="col-md-4">
                  <label className="form-label small fw-semibold">Total Unit</label>
                  <input type="number" className="form-control" placeholder="Contoh: 4" value={fc('total_unit')} onChange={e => setFc('total_unit', e.target.value)} />
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
                {saving ? <span className="spinner-border spinner-border-sm me-1" /> : null}{editItem ? 'Simpan' : 'Tambah'}
              </button>
            </div>
          </div></div>
        </div>
      )}
      <TrashModal show={showTrash} onHide={() => setShowTrash(false)} endpoint="ac"
        columns={[{ key: 'merk_ac', label: 'Merk AC' }, { key: 'type_ac', label: 'Type' }]} onRestored={fetchData} />
    </div>
  );
}

// ─── STUDIO SUB-TAB ───────────────────────────────────────────────────────────
function StudioTab() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [projectors, setProjectors] = useState([]);
  const [servers, setServers] = useState([]);
  const [acList, setAcList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ studio_number: '', projector_id: '', server_id: '', server_unit: '', ac_ids: [], kapasitas_kursi: '', ukuran_layar: '', type_layar: '', keterangan: '' });
  const [formErr, setFormErr] = useState({});
  const [showTrash, setShowTrash] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [stRes, prRes, srRes, acRes] = await Promise.all([
        API.get('/studio'), API.get('/projector'), API.get('/server'), API.get('/ac')
      ]);
      setItems(stRes.data);
      setProjectors(prRes.data);
      setServers(srRes.data);
      setAcList(acRes.data);
    } catch {}
    setLoading(false);
  };
  useEffect(() => { fetchAll(); }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return !q ? items : items.filter(s => String(s.studio_number).includes(q) || s.type_layar?.toLowerCase().includes(q));
  }, [items, search]);

  const openAdd = () => {
    setEditItem(null);
    setForm({ studio_number: '', projector_id: '', server_id: '', server_unit: '', ac_ids: [], kapasitas_kursi: '', ukuran_layar: '', type_layar: '', keterangan: '' });
    setFormErr({}); setShowForm(true);
  };
  const openEdit = (item) => { setEditItem(item); setForm({ ...item, ac_ids: item.ac_ids || [], server_unit: item.server_unit ?? '' }); setFormErr({}); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setEditItem(null); };
  const validate = () => { const errs = {}; if (!form.studio_number) errs.studio_number = 'Wajib diisi'; setFormErr(errs); return Object.keys(errs).length === 0; };

  const toggleAc = (id) => setForm(f => ({ ...f, ac_ids: f.ac_ids.includes(id) ? f.ac_ids.filter(x => x !== id) : [...f.ac_ids, id] }));

  const handleSave = async () => {
    if (!validate()) return; setSaving(true);
    try {
      const toNum = v => (v !== '' && v !== null && v !== undefined) ? parseFloat(v) : null;
      const payload = {
        ...form,
        studio_number: form.studio_number,
        kapasitas_kursi: toNum(form.kapasitas_kursi),
        ukuran_layar: toNum(form.ukuran_layar),
        projector_id: form.projector_id || null,
        server_id: form.server_id || null,
        server_unit: (() => {
          if (!form.server_id) return null;
          const sv = servers.find(s => s.id === form.server_id);
          const totalUnit = sv?.total_unit || 1;
          const usedUnits = items
            .filter(st => st.server_id === form.server_id && (!editItem || st.id !== editItem.id))
            .map(st => st.server_unit).filter(Boolean);
          // Assign unit terkecil yang belum dipakai
          for (let u = 1; u <= totalUnit; u++) { if (!usedUnits.includes(u)) return u; }
          return null;
        })(),
      };
      if (editItem) await API.put(`/studio/${editItem.id}`, payload);
      else await API.post('/studio', payload);
      toast.success(editItem ? 'Studio berhasil diperbarui' : 'Studio berhasil ditambahkan');
      fetchAll(); closeForm();
    } catch { toast.error('Gagal menyimpan data'); }
    setSaving(false);
  };
  const handleDelete = async (id) => {
    if (!window.confirm('Pindahkan ke tempat sampah?')) return;
    try { await API.delete(`/studio/${id}`); toast.success('Dipindahkan ke sampah'); fetchAll(); } catch { toast.error('Gagal menghapus'); }
  };

  const getProjectorLabel = (id) => projectors.find(p => p.id === id)?.type_projector || '-';
  const getServerLabel = (id) => { const sv = servers.find(s => s.id === id); if (!sv) return '-'; const kap = sv.kapasitas_server ? ` | ${sv.kapasitas_server} GB` : ''; return `${sv.type_server.toUpperCase()}${kap}`; };
  const getAcLabels = (ids) => {
    if (!ids || ids.length === 0) return '-';
    return ids.map(id => { const a = acList.find(x => x.id === id); if (!a) return '?'; const detail = [a.type_ac, a.total_pk ? a.total_pk + ' PK' : null].filter(Boolean).join(' | '); return `${a.merk_ac}${detail ? ' (' + detail + ')' : ''}`; }).join(', ');
  };

  const fc = (k) => form[k] ?? '';
  const setFc = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const cls = (k) => `form-control ${formErr[k] ? 'is-invalid' : ''}`;

  return (
    <div>
      <div className="data-card p-3">
        <div className="table-toolbar">
          <input className="form-control search-input" placeholder="Cari nomor studio, type layar..." value={search} onChange={e => setSearch(e.target.value)} />
          <button className="btn btn-sm btn-outline-secondary" onClick={() => setShowActions(v => !v)}>
            <i className={`bi ${showActions ? 'bi-x' : 'bi-list'} me-1`} />MENU
          </button>
        </div>
        {showActions && (
          <div className="toolbar-actions">
            <button className="btn btn-primary btn-sm" onClick={openAdd}><i className="bi bi-plus-lg me-1" />Tambah</button>
            <button className="btn btn-outline-secondary btn-sm" onClick={() => setShowTrash(true)}><i className="bi bi-trash2 me-1" />Sampah</button>
          </div>
        )}
        {loading ? <div className="text-center py-4"><div className="spinner-border text-primary" /></div> : (
          <div className="table-responsive">
            <table className="table table-bordered table-sm">
              <thead>
                <tr>
                  <th>No</th><th>Studio</th><th>Projector</th><th>Server</th>
                  <th>Kursi</th><th>Layar</th><th>Type Layar</th><th>AC</th><th>Keterangan</th><th>Aksi</th>
                </tr>
              </thead>
              <tbody style={{ textTransform: 'uppercase' }}>
                {filtered.length === 0 ? <tr><td colSpan={10} className="text-center text-muted py-3">Tidak ada data</td></tr>
                : filtered.map((s, i) => (
                  <tr key={s.id}>
                    <td>{i + 1}</td>
                    <td>{s.studio_number}</td>
                    <td>{getProjectorLabel(s.projector_id)}</td>
                    <td>{getServerLabel(s.server_id)}</td>
                    <td>{s.kapasitas_kursi || '-'}</td>
                    <td>{s.ukuran_layar ? `${s.ukuran_layar}m` : '-'}</td>
                    <td>{s.type_layar || '-'}</td>
                    <td>{getAcLabels(s.ac_ids)}</td>
                    <td className="text-start">{s.keterangan || '-'}</td>
                    <td style={{ whiteSpace: 'nowrap' }} className="action-cell">
                      <button className="btn btn-sm btn-warning me-1 action-btn" onClick={() => openEdit(s)}><i className="bi bi-pencil" /></button>
                      <button className="btn btn-sm btn-danger action-btn" onClick={() => handleDelete(s.id)}><i className="bi bi-trash" /></button>
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
          <div className="modal-dialog modal-lg"><div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">{editItem ? 'Edit Studio' : 'Tambah Studio'}</h5>
              <button className="btn-close" onClick={closeForm} />
            </div>
            <div className="modal-body">
              <div className="row g-3">
                <div className="col-md-3">
                  <label className="form-label small fw-semibold">Studio # *</label>
                  <input type="text" className={cls('studio_number')} placeholder="1" value={fc('studio_number')} onChange={e => setFc('studio_number', e.target.value)} />
                  {formErr.studio_number && <div className="invalid-feedback">{formErr.studio_number}</div>}
                </div>
                <div className="col-md-4">
                  <label className="form-label small fw-semibold">Kapasitas Kursi</label>
                  <input type="text" className="form-control" placeholder="Contoh: 150" value={fc('kapasitas_kursi')} onChange={e => setFc('kapasitas_kursi', e.target.value)} />
                </div>
                <div className="col-md-3">
                  <label className="form-label small fw-semibold">Ukuran Layar (m)</label>
                  <input type="text" className="form-control" placeholder="Contoh: 12.5" value={fc('ukuran_layar')} onChange={e => setFc('ukuran_layar', e.target.value)} />
                </div>
                <div className="col-md-2">
                  <label className="form-label small fw-semibold">Type Layar</label>
                  <input className="form-control" placeholder="Misal: PERLUX 180" value={fc('type_layar')} onChange={e => setFc('type_layar', e.target.value)} />
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-semibold">Projector</label>
                  <select className="form-select" value={fc('projector_id')} onChange={e => setFc('projector_id', e.target.value)}>
                    <option value="">-- Pilih Projector --</option>
                    {projectors.map(p => <option key={p.id} value={p.id}>{p.type_projector.toUpperCase()}</option>)}
                  </select>
                  {projectors.length === 0 && <div className="form-text text-warning">Belum ada data projector. Tambah di tab Projector dulu.</div>}
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-semibold">Server</label>
                  <select className="form-select" value={fc('server_id')} onChange={e => setFc('server_id', e.target.value)}>
                    <option value="">-- Pilih Server --</option>
                    {servers.filter(s => {
                      const totalUnit = s.total_unit || 1;
                      const usedCount = items.filter(st => st.server_id === s.id && (!editItem || st.id !== editItem.id)).length;
                      return (totalUnit - usedCount) > 0;
                    }).map(s => {
                      const kap = s.kapasitas_server ? `${s.kapasitas_server} GB` : null;
                      const label = [s.type_server.toUpperCase(), kap].filter(Boolean).join(' | ');
                      return <option key={s.id} value={s.id}>{label}</option>;
                    })}
                  </select>
                  {servers.length === 0 && <div className="form-text text-warning">Belum ada data server. Tambah di tab Server dulu.</div>}
                </div>

                <div className="col-12">
                  <label className="form-label small fw-semibold">AC <span className="text-muted fw-normal">(bisa pilih lebih dari 1)</span></label>
                  {acList.length === 0 ? (
                    <div className="form-text text-warning">Belum ada data AC. Tambah di tab AC dulu.</div>
                  ) : (
                    <div className="d-flex flex-wrap gap-3 mt-1">
                      {acList.map(a => (
                        <div key={a.id} className="form-check">
                          <input type="checkbox" className="form-check-input" id={`ac-${a.id}`}
                            checked={form.ac_ids.includes(a.id)} onChange={() => toggleAc(a.id)} />
                          <label className="form-check-label" htmlFor={`ac-${a.id}`} style={{ textTransform: 'uppercase', fontSize: '0.85rem' }}>
                            {a.merk_ac}{(() => { const d = [a.type_ac, a.total_pk ? a.total_pk + ' PK' : null].filter(Boolean).join(' | '); return d ? ` (${d})` : ''; })()}
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
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
                {saving ? <span className="spinner-border spinner-border-sm me-1" /> : null}{editItem ? 'Simpan' : 'Tambah'}
              </button>
            </div>
          </div></div>
        </div>
      )}
      <TrashModal show={showTrash} onHide={() => setShowTrash(false)} endpoint="studio"
        columns={[{ key: 'studio_number', label: 'Studio' }, { key: 'type_layar', label: 'Type Layar' }]} onRestored={fetchAll} />
    </div>
  );
}

// ─── MAIN EQUIPMENT TAB ───────────────────────────────────────────────────────
const SUB_TABS = [
  { key: 'studio',    label: 'Data Studio',    icon: 'bi-building' },
  { key: 'projector', label: 'Data Projector', icon: 'bi-camera-video' },
  { key: 'server',    label: 'Data Server',    icon: 'bi-hdd-rack' },
  { key: 'ac',        label: 'Data AC',        icon: 'bi-wind' },
];

export default function EquipmentTab() {
  const [activeTab, setActiveTab] = useState('studio');

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0"><i className="bi bi-pc-display me-2" />Data Equipment</h5>
      </div>
      <div className="mb-3 d-flex flex-wrap gap-2">
        {SUB_TABS.map(tab => (
          <button
            key={tab.key}
            className={`btn btn-sm ${activeTab === tab.key ? 'btn-dark' : 'btn-outline-secondary'}`}
            onClick={() => setActiveTab(tab.key)}
          >
            <i className={`bi ${tab.icon} me-1`} />{tab.label}
          </button>
        ))}
      </div>
      {activeTab === 'studio'    && <StudioTab />}
      {activeTab === 'projector' && <ProjectorTab />}
      {activeTab === 'server'    && <ServerTab />}
      {activeTab === 'ac'        && <AcTab />}
    </div>
  );
}