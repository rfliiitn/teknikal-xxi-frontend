import { useState, useEffect } from 'react';
import API from '../utils/api';

export default function SettingTab({ settings, onSaved }) {
  const [form, setForm] = useState({
    nama_outlet: '',
    yang_membuat_nama: '',
    yang_membuat_divisi: '',
    yang_mengetahui_nama: '',
    yang_mengetahui_divisi: ''
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (settings) {
      setForm({
        nama_outlet: settings.nama_outlet || '',
        yang_membuat_nama: settings.yang_membuat_nama || '',
        yang_membuat_divisi: settings.yang_membuat_divisi || '',
        yang_mengetahui_nama: settings.yang_mengetahui_nama || '',
        yang_mengetahui_divisi: settings.yang_mengetahui_divisi || '',
      });
    }
  }, [settings]);

  const setFc = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    setSuccess('');
    setError('');
    try {
      await API.put('/setting', form);
      setSuccess('Pengaturan berhasil disimpan');
      onSaved();
    } catch {
      setError('Gagal menyimpan pengaturan');
    }
    setSaving(false);
  };

  return (
    <div style={{ maxWidth: 600 }}>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0"><i className="bi bi-gear me-2" />Setting Outlet</h5>
      </div>

      <div className="data-card p-4">
        {success && <div className="alert alert-success py-2 small">{success}</div>}
        {error && <div className="alert alert-danger py-2 small">{error}</div>}

        <h6 className="mb-3 text-muted text-uppercase" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>Identitas Outlet</h6>
        <div className="mb-4">
          <label className="form-label small fw-semibold">Nama Outlet</label>
          <input className="form-control" value={form.nama_outlet} onChange={e => setFc('nama_outlet', e.target.value)} placeholder="Nama outlet cinema" />
          <div className="form-text">Nama ini akan tampil di navbar dan di dokumen PDF</div>
        </div>

        <hr />

        <h6 className="mb-3 text-muted text-uppercase" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>Tanda Tangan PDF</h6>

        <div className="row g-3 mb-3">
          <div className="col-12">
            <label className="form-label small fw-semibold text-muted">Yang Membuat</label>
          </div>
          <div className="col-md-6">
            <label className="form-label small">Nama</label>
            <input className="form-control" value={form.yang_membuat_nama} onChange={e => setFc('yang_membuat_nama', e.target.value)} placeholder="Nama lengkap" />
          </div>
          <div className="col-md-6">
            <label className="form-label small">Divisi / Jabatan</label>
            <input className="form-control" value={form.yang_membuat_divisi} onChange={e => setFc('yang_membuat_divisi', e.target.value)} placeholder="Contoh: Technical Staff" />
          </div>
        </div>

        <div className="row g-3 mb-4">
          <div className="col-12">
            <label className="form-label small fw-semibold text-muted">Yang Mengetahui</label>
          </div>
          <div className="col-md-6">
            <label className="form-label small">Nama</label>
            <input className="form-control" value={form.yang_mengetahui_nama} onChange={e => setFc('yang_mengetahui_nama', e.target.value)} placeholder="Nama lengkap" />
          </div>
          <div className="col-md-6">
            <label className="form-label small">Divisi / Jabatan</label>
            <input className="form-control" value={form.yang_mengetahui_divisi} onChange={e => setFc('yang_mengetahui_divisi', e.target.value)} placeholder="Contoh: Technical Manager" />
          </div>
        </div>

        {/* Preview tanda tangan */}
        <div className="p-3 rounded mb-4" style={{ background: '#f8f9fa', border: '1px dashed #dee2e6' }}>
          <div className="small text-muted mb-2 fw-semibold">Preview Tanda Tangan PDF:</div>
          <div className="d-flex justify-content-between">
            <div className="text-center" style={{ minWidth: 140 }}>
              <div className="small">Yang Membuat,</div>
              <div style={{ height: 40, borderBottom: '1px solid #ccc', margin: '8px 0' }} />
              <div className="small fw-semibold">{form.yang_membuat_nama || '...'}</div>
              <div className="small text-muted">{form.yang_membuat_divisi || '...'}</div>
            </div>
            <div className="text-center" style={{ minWidth: 140 }}>
              <div className="small">Yang Mengetahui,</div>
              <div style={{ height: 40, borderBottom: '1px solid #ccc', margin: '8px 0' }} />
              <div className="small fw-semibold">{form.yang_mengetahui_nama || '...'}</div>
              <div className="small text-muted">{form.yang_mengetahui_divisi || '...'}</div>
            </div>
          </div>
        </div>

        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? <span className="spinner-border spinner-border-sm me-2" /> : null}
          <i className="bi bi-check-lg me-1" />
          Simpan Pengaturan
        </button>
      </div>
    </div>
  );
}
