import { useState, useEffect, useRef } from 'react';
import API from '../utils/api';

function SignaturePad({ value, onChange }) {
  const canvasRef = useRef(null);
  const isDrawing = useRef(false);
  const loaded = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (value && !loaded.current) {
      loaded.current = true;
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
      img.src = value;
    } else if (!value) {
      loaded.current = false;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, [value]);

  const getPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const sx = canvas.width / rect.width;
    const sy = canvas.height / rect.height;
    const src = e.touches ? e.touches[0] : e;
    return { x: (src.clientX - rect.left) * sx, y: (src.clientY - rect.top) * sy };
  };

  const startDraw = (e) => {
    e.preventDefault();
    isDrawing.current = true;
    const ctx = canvasRef.current.getContext('2d');
    const p = getPos(e);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  };

  const draw = (e) => {
    e.preventDefault();
    if (!isDrawing.current) return;
    const ctx = canvasRef.current.getContext('2d');
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#000';
    const p = getPos(e);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  };

  const stopDraw = () => {
    if (!isDrawing.current) return;
    isDrawing.current = false;
    loaded.current = true;
    onChange(canvasRef.current.toDataURL('image/png'));
  };

  const handleClear = () => {
    loaded.current = false;
    const ctx = canvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    onChange('');
  };

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={400}
        height={130}
        style={{ border: '1px solid #dee2e6', borderRadius: 4, cursor: 'crosshair', background: '#fff', width: '100%', touchAction: 'none' }}
        onMouseDown={startDraw}
        onMouseMove={draw}
        onMouseUp={stopDraw}
        onMouseLeave={stopDraw}
        onTouchStart={startDraw}
        onTouchMove={draw}
        onTouchEnd={stopDraw}
      />
      <div className="mt-1">
        <button type="button" className="btn btn-sm btn-outline-danger" onClick={handleClear}>
          <i className="bi bi-x-lg me-1" />Hapus
        </button>
      </div>
    </div>
  );
}

export default function SettingTab({ settings, onSaved }) {
  const [form, setForm] = useState({
    yang_membuat_nama: '',
    yang_membuat_divisi: '',
    yang_mengetahui_nama: '',
    yang_mengetahui_divisi: '',
    ttd_yang_membuat: '',
    ttd_yang_mengetahui: '',
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (settings) {
      setForm({
        yang_membuat_nama: settings.yang_membuat_nama || '',
        yang_membuat_divisi: settings.yang_membuat_divisi || '',
        yang_mengetahui_nama: settings.yang_mengetahui_nama || '',
        yang_mengetahui_divisi: settings.yang_mengetahui_divisi || '',
        ttd_yang_membuat: settings.ttd_yang_membuat || '',
        ttd_yang_mengetahui: settings.ttd_yang_mengetahui || '',
      });
    }
  }, [settings]);

  const setFc = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setSaving(true); setSuccess(''); setError('');
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
    <div style={{ maxWidth: 640 }}>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0"><i className="bi bi-gear me-2" />Setting Outlet</h5>
      </div>

      <div className="data-card p-4">
        {success && <div className="alert alert-success py-2 small">{success}</div>}
        {error && <div className="alert alert-danger py-2 small">{error}</div>}

        <div className="mb-3 p-3 rounded" style={{ background: '#f8f9fa', border: '1px solid #dee2e6' }}>
          <div className="small text-muted mb-1 fw-semibold">Nama Outlet</div>
          <div className="fw-semibold">{settings?.nama_outlet || '-'}</div>
          <div className="form-text">Nama outlet diatur oleh admin dan tidak bisa diubah di sini.</div>
        </div>

        <hr />

        <h6 className="mb-3 text-muted text-uppercase" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>Tanda Tangan PDF</h6>

        {/* Yang Membuat */}
        <div className="mb-4">
          <div className="fw-semibold small mb-2">Yang Membuat</div>
          <div className="row g-2 mb-2">
            <div className="col-md-6">
              <label className="form-label small">Nama</label>
              <input className="form-control" value={form.yang_membuat_nama} onChange={e => setFc('yang_membuat_nama', e.target.value)} placeholder="Nama lengkap" />
            </div>
            <div className="col-md-6">
              <label className="form-label small">Divisi / Jabatan</label>
              <input className="form-control" value={form.yang_membuat_divisi} onChange={e => setFc('yang_membuat_divisi', e.target.value)} placeholder="Contoh: Technical Staff" />
            </div>
          </div>
          <label className="form-label small">Tanda Tangan <span className="text-muted">(gambar langsung atau upload)</span></label>
          <SignaturePad value={form.ttd_yang_membuat} onChange={v => setFc('ttd_yang_membuat', v)} />
        </div>

        {/* Yang Mengetahui */}
        <div className="mb-4">
          <div className="fw-semibold small mb-2">Yang Mengetahui</div>
          <div className="row g-2 mb-2">
            <div className="col-md-6">
              <label className="form-label small">Nama</label>
              <input className="form-control" value={form.yang_mengetahui_nama} onChange={e => setFc('yang_mengetahui_nama', e.target.value)} placeholder="Nama lengkap" />
            </div>
            <div className="col-md-6">
              <label className="form-label small">Divisi / Jabatan</label>
              <input className="form-control" value={form.yang_mengetahui_divisi} onChange={e => setFc('yang_mengetahui_divisi', e.target.value)} placeholder="Contoh: Technical Manager" />
            </div>
          </div>
          <label className="form-label small">Tanda Tangan <span className="text-muted">(gambar langsung atau upload)</span></label>
          <SignaturePad value={form.ttd_yang_mengetahui} onChange={v => setFc('ttd_yang_mengetahui', v)} />
        </div>

        {/* Preview */}
        <div className="p-3 rounded mb-4" style={{ background: '#f8f9fa', border: '1px dashed #dee2e6' }}>
          <div className="small text-muted mb-2 fw-semibold">Preview Tanda Tangan PDF:</div>
          <div className="d-flex justify-content-between">
            <div className="text-center" style={{ minWidth: 140 }}>
              <div className="small">Yang Membuat,</div>
              {form.ttd_yang_membuat
                ? <img src={form.ttd_yang_membuat} alt="ttd" style={{ height: 48, margin: '4px 0', display: 'block', maxWidth: 140 }} />
                : <div style={{ height: 48, margin: '4px 0' }} />
              }
              <div style={{ borderBottom: '1px solid #999', width: 140, margin: '0 auto 4px' }} />
              <div className="small fw-semibold">{form.yang_membuat_nama || '...'}</div>
              <div className="small text-muted">{form.yang_membuat_divisi || '...'}</div>
            </div>
            <div className="text-center" style={{ minWidth: 140 }}>
              <div className="small">Yang Mengetahui,</div>
              {form.ttd_yang_mengetahui
                ? <img src={form.ttd_yang_mengetahui} alt="ttd" style={{ height: 48, margin: '4px 0', display: 'block', maxWidth: 140 }} />
                : <div style={{ height: 48, margin: '4px 0' }} />
              }
              <div style={{ borderBottom: '1px solid #999', width: 140, margin: '0 auto 4px' }} />
              <div className="small fw-semibold">{form.yang_mengetahui_nama || '...'}</div>
              <div className="small text-muted">{form.yang_mengetahui_divisi || '...'}</div>
            </div>
          </div>
        </div>

        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? <span className="spinner-border spinner-border-sm me-2" /> : null}
          <i className="bi bi-check-lg me-1" />Simpan Pengaturan
        </button>
      </div>
    </div>
  );
}
