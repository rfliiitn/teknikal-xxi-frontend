import { useState, useEffect, useMemo } from 'react';
import API from '../utils/api';
import TrashModal from '../components/TrashModal';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useToast } from '../context/ToastContext';

const STATUS_OPTIONS = ['Belum Tayang', 'Sedang Tayang', 'Sudah Tayang'];

const EMPTY_FORM = {
  judul_film: '', nama_file: '', format_film: '', tanggal_upload: '',
  petugas_upload: '', tanggal_tayang: '', status_tayang: 'Belum Tayang',
  status_kdm: '', jumlah_file: '', dikirim_dari: '', dikirim_ke: '',
  keterangan: '', rumah_produksi: ''
};

const rowClass = (status) => {
  if (status === 'Sedang Tayang') return 'row-sedang-tayang';
  if (status === 'Sudah Tayang') return 'row-sudah-tayang';
  return 'row-belum-tayang';
};

// Helper: format tanggal untuk periode
const formatPeriode = () => {
  const now = new Date();
  const bulan = now.toLocaleDateString('id-ID', { month: 'long' }).toUpperCase();
  const tahun = now.getFullYear();
  const tgl = String(now.getDate()).padStart(2, '0');
  return `${tgl} ${bulan} ${tahun}`;
};

// Warna teks per status
const textColor = (status) => {
  if (status === 'Sedang Tayang') return [0, 128, 0];    // hijau
  if (status === 'Sudah Tayang') return [255, 0, 0];     // merah
  return [0, 0, 0];                                       // hitam
};

const buildPDF = (films, outletName, settings, servers) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const marginL = 14;
  const marginR = 14;

  // ── HEADER ──
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('LAPORAN DATA FILM DI SERVER', pageWidth / 2, 14, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Nama Outlet', marginL, 23);
  doc.text(':', marginL + 26, 23);
  doc.setFont('helvetica', 'bold');
  doc.text((outletName || '-').toUpperCase(), marginL + 30, 23);

  doc.setFont('helvetica', 'normal');
  doc.text('Periode', marginL, 29);
  doc.text(':', marginL + 26, 29);
  doc.setFont('helvetica', 'bold');
  doc.text(formatPeriode(), marginL + 30, 29);

  // ── TABEL UTAMA ──
  const AMBER = [255, 192, 0];
  autoTable(doc, {
    startY: 33,
    head: [[
      { content: 'NO', styles: { halign: 'center' } },
      { content: 'JUDUL FILM', styles: { halign: 'center' } },
      { content: 'KETERANGAN\n(Belum / Sedang / Sudah)', styles: { halign: 'center' } },
      { content: 'FORMAT FILM\n2D / 3D / ATMOS', styles: { halign: 'center' } },
      { content: 'KDM\n(ada / tidak)', styles: { halign: 'center' } }
    ]],
    body: films.map((f, i) => [
      { content: i + 1, styles: { halign: 'center' } },
      f.judul_film?.toUpperCase() || '',
      { content: f.status_tayang?.toUpperCase() || '', styles: { halign: 'center' } },
      { content: f.format_film?.toUpperCase() || '', styles: { halign: 'center' } },
      { content: f.status_kdm?.toUpperCase() || '', styles: { halign: 'center' } }
    ]),
    styles: { fontSize: 8, cellPadding: 1.8, lineColor: [0,0,0], lineWidth: 0.3, textColor: [0,0,0] },
    headStyles: {
      fillColor: AMBER,
      textColor: [0,0,0],
      fontStyle: 'bold',
      lineWidth: 0.3,
      lineColor: [0,0,0],
      fontSize: 8,
      halign: 'center',
      valign: 'middle'
    },
    columnStyles: {
      0: { cellWidth: 8 },
      1: { cellWidth: 65 },
      2: { cellWidth: 35, halign: 'center' },
      3: { cellWidth: 22, halign: 'center' },
      4: { cellWidth: 52, halign: 'center' }
    },
    didParseCell: (data) => {
      if (data.section === 'body') {
        const film = films[data.row.index];
        data.cell.styles.textColor = textColor(film?.status_tayang);
      }
    },
    margin: { left: marginL, right: marginR }
  });

  const finalY = doc.lastAutoTable.finalY;

  // ── Section bawah: NOTE + Tanda Tangan ──
  const estServerLines = (servers && servers.length > 0) ? servers.length : 1;
  const neededHeight = 18 + estServerLines * 4.5 + 40;
  let sectionY;
  if (finalY + neededHeight > pageHeight - 10) {
    doc.addPage();
    sectionY = 20;
  } else {
    sectionY = finalY + 8;
  }

  // ── Koordinat kolom ──
  const leftCx    = pageWidth * 0.17;   // ~35mm
  const leftLineX = leftCx - 27;        // ~8mm
  const rightCx   = pageWidth * 0.83;   // ~174mm
  const rightLineX = rightCx - 27;      // ~147mm
  const noteX     = 72;                 // NOTE mulai 72mm dari kiri

  // ── Build server lines ──
  const serverLines = [];
  if (servers && servers.length > 0) {
    [...servers].sort((a, b) => {
      if (a.is_aam) return -1; if (b.is_aam) return 1;
      return String(a.studio_number || '').localeCompare(String(b.studio_number || ''), undefined, { numeric: true });
    }).forEach(sv => {
      const kap = parseFloat(sv.kapasitas_server) || 0;
      const terpakai = parseFloat(sv.size_terpakai) || 0;
      const sisa = kap > 0 ? kap - terpakai : null;
      const persen = kap > 0 ? Math.round((sisa / kap) * 100) : null;
      const sisaStr = sisa !== null ? `${sisa.toFixed(0)} GB (${persen}%)` : '-';
      const label = sv.is_aam
        ? sv.type_server.toUpperCase()
        : (sv.studio_number ? `STD ${String(sv.studio_number).toUpperCase()} - ${sv.type_server.toUpperCase()}` : sv.type_server.toUpperCase());
      serverLines.push({ label, val: sisaStr });
    });
  } else {
    serverLines.push({ label: 'Tidak ada data server', val: '' });
  }

  // ── Hitung posisi garis TTD berdasarkan tinggi NOTE ──
  const noteHeaderH = 8.5;  // NOTE + SISA KAPASITAS
  const noteBodyH   = serverLines.length * 4.5;
  const lineY       = sectionY + noteHeaderH + noteBodyH + 4;

  // ── Render YANG MEMBUAT (kiri) — label di atas garis ──
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('YANG MEMBUAT', leftCx, sectionY, { align: 'center' });

  // ── Render MENGETAHUI (kanan) — label di atas garis ──
  doc.text('MENGETAHUI', rightCx, sectionY, { align: 'center' });

  // ── Render NOTE (tengah) ──
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('NOTE :', noteX, sectionY);
  doc.text('SISA KAPASITAS PENYIMPANAN SERVER', noteX, sectionY + 4);
  doc.setFontSize(7);
  serverLines.forEach(({ label, val }, idx) => {
    const y = sectionY + noteHeaderH + idx * 4.5;
    doc.setFont('helvetica', 'bold');
    doc.text(`- ${label}`, noteX, y);
    doc.setFont('helvetica', 'normal');
    if (val) doc.text(` : ${val}`, noteX + doc.getTextWidth(`- ${label}`), y);
  });

  // ── Garis TTD ──
  doc.setLineWidth(0.4);
  doc.line(leftLineX, lineY, leftLineX + 54, lineY);
  doc.line(rightLineX, lineY, rightLineX + 54, lineY);

  // ── Nama & Jabatan ──
  const nameY = lineY + 5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text((settings?.yang_membuat_nama || '').toUpperCase(), leftCx, nameY, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.text((settings?.yang_membuat_divisi || '').toUpperCase(), leftCx, nameY + 5, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.text((settings?.yang_mengetahui_nama || '').toUpperCase(), rightCx, nameY, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.text((settings?.yang_mengetahui_divisi || '').toUpperCase(), rightCx, nameY + 5, { align: 'center' });

  // ── KETERANGAN WARNA ──
  const ketY = nameY + 12;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(0, 0, 0);
  doc.text('KETERANGAN :', leftLineX, ketY);
  const tblX = leftLineX;
  const tblY = ketY + 2;
  const col1W = 28; const col2W = 34; const rowH = 7;
  const ketRows = [
    { label: 'FONT HITAM', ket: 'BELUM TAYANG',  color: [0, 0, 0] },
    { label: 'FONT HIJAU', ket: 'SEDANG TAYANG', color: [0, 128, 0] },
    { label: 'FONT MERAH', ket: 'SUDAH TAYANG',  color: [200, 0, 0] },
  ];
  doc.setLineWidth(0.3);
  doc.rect(tblX, tblY, col1W + col2W, rowH * ketRows.length);
  doc.line(tblX + col1W, tblY, tblX + col1W, tblY + rowH * ketRows.length);
  ketRows.forEach((_, i) => { if (i > 0) doc.line(tblX, tblY + rowH * i, tblX + col1W + col2W, tblY + rowH * i); });
  ketRows.forEach((r, i) => {
    const y = tblY + rowH * i + rowH * 0.65;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...r.color);
    doc.text(r.label, tblX + 2, y);
    doc.setFont('helvetica', 'normal');
    doc.text(r.ket, tblX + col1W + 2, y);
  });
  doc.setTextColor(0, 0, 0);

    return doc;
};


export default function FilmTab({ settings, outletName }) {
  const toast = useToast();
  const [films, setFilms] = useState([]);
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
  const [showServerUpdate, setShowServerUpdate] = useState(false);
  const [servers, setServers] = useState([]);
  const [allServers, setAllServers] = useState([]);
  const [serverInputs, setServerInputs] = useState({});
  const PER_PAGE = 20;

  const fetchFilms = async () => {
    setLoading(true);
    try { const res = await API.get('/film'); setFilms(res.data); } catch {}
    setLoading(false);
  };

  const fetchEquipments = async () => {
    try {
      const [inStudio, all] = await Promise.all([API.get('/server/in-studio'), API.get('/server')]);
      setServers(inStudio.data || []);
      setAllServers(all.data || []);
    } catch (err) { console.error('fetchEquipments error:', err); }
  };

  useEffect(() => { fetchFilms(); fetchEquipments(); }, []);

  const STATUS_ORDER = { 'Belum Tayang': 0, 'Sedang Tayang': 1, 'Sudah Tayang': 2 };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return films
      .filter(f => {
        const matchSearch = !q || f.judul_film?.toLowerCase().includes(q) || f.format_film?.toLowerCase().includes(q) || f.rumah_produksi?.toLowerCase().includes(q);
        const matchStatus = !filterStatus || f.status_tayang === filterStatus;
        return matchSearch && matchStatus;
      })
      .sort((a, b) => {
        const statusDiff = (STATUS_ORDER[a.status_tayang] ?? 0) - (STATUS_ORDER[b.status_tayang] ?? 0);
        if (statusDiff !== 0) return statusDiff;
        return new Date(b.tanggal_upload || 0) - new Date(a.tanggal_upload || 0);
      });
  }, [films, search, filterStatus]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const openAdd = () => { setEditItem(null); setForm(EMPTY_FORM); setFormErr({}); setShowForm(true); };
  const openEdit = (item) => { setEditItem(item); setForm({ ...item }); setFormErr({}); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setEditItem(null); };

  const validate = () => {
    const required = ['judul_film', 'nama_file', 'format_film', 'tanggal_upload', 'petugas_upload', 'status_tayang', 'status_kdm'];
    const errs = {};
    required.forEach(k => { if (!form[k]) errs[k] = 'Wajib diisi'; });
    setFormErr(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    // Konversi field date kosong jadi null agar tidak error di Supabase
    const payload = { ...form };
    if (!payload.tanggal_tayang) payload.tanggal_tayang = null;
    if (!payload.tanggal_upload) payload.tanggal_upload = null;
    try {
      if (editItem) await API.put(`/film/${editItem.id}`, payload);
      else await API.post('/film', payload);
      toast.success(editItem ? 'Data film berhasil diperbarui' : 'Film berhasil ditambahkan');
      fetchFilms(); closeForm();
    } catch (err) { toast.error(err.response?.data?.error || 'Gagal menyimpan data'); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Pindahkan ke tempat sampah?')) return;
    try { await API.delete(`/film/${id}`); toast.success('Film dipindahkan ke sampah'); fetchFilms(); } catch { toast.error('Gagal menghapus data'); }
  };

  const handleBulkDelete = async () => {
    if (!selected.length) return;
    if (!window.confirm(`Hapus ${selected.length} data terpilih?`)) return;
    try { await API.post('/film/bulk-delete', { ids: selected }); setSelected([]); fetchFilms(); } catch { toast.error('Gagal menghapus data'); }
  };

  const toggleSelect = (id) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const toggleAll = () => setSelected(selected.length === paginated.length ? [] : paginated.map(f => f.id));

  const fc = (key) => form[key] || '';
  const setFc = (key, val) => setForm(f => ({ ...f, [key]: val }));
  const fErr = (key) => formErr[key] ? <div className="invalid-feedback">{formErr[key]}</div> : null;
  const cls = (key) => `form-control ${formErr[key] ? 'is-invalid' : ''}`;

  const handlePreviewPDF = () => {
    const doc = buildPDF(filtered, outletName, settings, servers);
    const url = doc.output('bloburl');
    window.open(url, '_blank');
  };

  const handleDownloadPDF = () => {
    const doc = buildPDF(filtered, outletName, settings, servers);
    const periode = formatPeriode().replace(/ /g, '_');
    doc.save(`LAPORAN_FILM_${(outletName || 'OUTLET').toUpperCase().replace(/ /g, '_')}_${periode}.pdf`);
  };

  const handleUpdateServer = async () => {
    setSaving(true);
    try {
      // Deduplicate by server id (server yang sama muncul di 2 studio = 1 update)
      const promises = [];
      // AAM: update langsung ke servers table
      allServers.filter(sv => sv.is_aam).forEach(sv => {
        const val = serverInputs[sv.id];
        promises.push(API.put(`/server/${sv.id}`, { size_terpakai: val !== '' && val !== undefined ? parseFloat(val) : null }));
      });
      // Non-AAM: update size_terpakai_unit di studios per studio row
      servers.filter(sv => !sv.is_aam).forEach(sv => {
        const key = sv.studio_server_key || sv.id;
        const val = serverInputs[key];
        promises.push(API.put(`/server/${sv.id}/unit`, {
          studio_number: sv.studio_number,
          server_unit: sv.server_unit,
          size_terpakai_unit: val !== '' && val !== undefined ? parseFloat(val) : null,
        }));
      });
      await Promise.all(promises);
      await fetchEquipments();
      setShowServerUpdate(false);
      toast.success('Kapasitas server berhasil diupdate');
    } catch { toast.error('Gagal update kapasitas server'); }
    setSaving(false);
  };

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
        <div className="table-toolbar">
          <input className="form-control search-input" placeholder="Cari judul, format, rumah produksi..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
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
            <button className="btn btn-outline-dark btn-sm" onClick={handlePreviewPDF}><i className="bi bi-eye me-1" />Preview PDF</button>
            <button className="btn btn-outline-secondary btn-sm" onClick={handleDownloadPDF}><i className="bi bi-download me-1" />Download PDF</button>
            <button className="btn btn-outline-info btn-sm" onClick={() => { const init = {};
      // allServers tidak punya studio info, pakai servers (in-studio) untuk non-AAM
      servers.forEach(sv => { init[sv.studio_server_key || sv.id] = sv.size_terpakai ?? ''; });
      // AAM dari allServers
      allServers.filter(sv => sv.is_aam).forEach(sv => { init[sv.id] = sv.size_terpakai ?? ''; });
      setServerInputs(init); setShowServerUpdate(true); }}><i className="bi bi-hdd me-1" />Update Server</button>
          </div>
        )}

        {/* Legend */}
        <div className="d-flex gap-3 mb-2 small">
          <span style={{ color: '#000' }}>&#9632; Belum Tayang</span>
          <span style={{ color: '#008000' }}>&#9632; Sedang Tayang</span>
          <span style={{ color: '#FF0000' }}>&#9632; Sudah Tayang</span>
        </div>

        {loading ? <div className="text-center py-4"><div className="spinner-border text-primary" /></div> : (
          <div className="table-responsive">
            <table className="table table-bordered table-sm">
              <thead>
                <tr>
                  <th style={{ width: 36 }}><input type="checkbox" className="form-check-input" onChange={toggleAll} checked={paginated.length > 0 && selected.length === paginated.length} /></th>
                  <th>No</th><th className="text-start">Judul Film</th><th className="text-start">Nama File</th><th>Format</th>
                  <th>Tgl Upload</th><th>Petugas</th><th>Tgl Tayang</th><th>Status Tayang</th>
                  <th>Status KDM</th><th>Jml File</th><th>Dari</th><th>Ke</th>
                  <th>Rumah Prod.</th><th className="text-start">Keterangan</th><th>Aksi</th>
                </tr>
              </thead>
              <tbody style={{ textTransform: 'uppercase' }}>
                {paginated.length === 0 ? (
                  <tr><td colSpan={16} className="text-center text-muted py-3">Tidak ada data</td></tr>
                ) : paginated.map((f, i) => (
                  <tr key={f.id} className={rowClass(f.status_tayang)}>
                    <td><input type="checkbox" className="form-check-input" checked={selected.includes(f.id)} onChange={() => toggleSelect(f.id)} /></td>
                    <td>{(page - 1) * PER_PAGE + i + 1}</td>
                    <td className="text-start" style={{ maxWidth: 150, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textTransform: 'uppercase' }}>{f.judul_film}</td>
                    <td className="text-start" style={{ maxWidth: 120, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textTransform: 'uppercase' }}>{f.nama_file}</td>
                    <td>{f.format_film}</td><td>{f.tanggal_upload}</td><td>{f.petugas_upload}</td>
                    <td>{f.tanggal_tayang || '-'}</td>
                    <td><span className={`badge badge-${f.status_tayang?.toLowerCase().replace(/ /g, '-')}`}>{f.status_tayang}</span></td>
                    <td>{f.status_kdm}</td><td>{f.jumlah_file || '-'}</td>
                    <td>{f.dikirim_dari || '-'}</td><td>{f.dikirim_ke || '-'}</td>
                    <td>{f.rumah_produksi || '-'}</td><td className="text-start">{f.keterangan || '-'}</td>
                    <td style={{ whiteSpace: 'nowrap' }} className="action-cell">
                      <button className="btn btn-sm btn-warning me-1 action-btn" onClick={() => openEdit(f)}><i className="bi bi-pencil" /></button>
                      <button className="btn btn-sm btn-danger action-btn" onClick={() => handleDelete(f.id)}><i className="bi bi-trash" /></button>
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

      {/* Form Modal */}
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
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold">Judul Film *</label>
                    <input className={cls('judul_film')} value={fc('judul_film')} onChange={e => setFc('judul_film', e.target.value)} />
                    {fErr('judul_film')}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold">Nama File *</label>
                    <input className={cls('nama_file')} value={fc('nama_file')} onChange={e => setFc('nama_file', e.target.value)} />
                    {fErr('nama_file')}
                  </div>
                  <div className="col-md-4">
                    <label className="form-label small fw-semibold">Format Film *</label>
                    <input className={cls('format_film')} value={fc('format_film')} placeholder="2D, 3D, IMAX..." onChange={e => setFc('format_film', e.target.value)} />
                    {fErr('format_film')}
                  </div>
                  <div className="col-md-4">
                    <label className="form-label small fw-semibold">Petugas Upload *</label>
                    <input className={cls('petugas_upload')} value={fc('petugas_upload')} onChange={e => setFc('petugas_upload', e.target.value)} />
                    {fErr('petugas_upload')}
                  </div>
                  <div className="col-md-4">
                    <label className="form-label small fw-semibold">Tanggal Upload *</label>
                    <input type="date" className={cls('tanggal_upload')} value={fc('tanggal_upload')} onChange={e => setFc('tanggal_upload', e.target.value)} />
                    {fErr('tanggal_upload')}
                  </div>
                  <div className="col-md-4">
                    <label className="form-label small fw-semibold">Status Tayang *</label>
                    <select className={cls('status_tayang')} value={fc('status_tayang')} onChange={e => setFc('status_tayang', e.target.value)}>
                      {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
                    </select>
                    {fErr('status_tayang')}
                  </div>
                  <div className="col-md-4">
                    <label className="form-label small fw-semibold">Status KDM *</label>
                    <input className={cls('status_kdm')} value={fc('status_kdm')} onChange={e => setFc('status_kdm', e.target.value)} />
                    {fErr('status_kdm')}
                  </div>
                  <div className="col-md-4">
                    <label className="form-label small fw-semibold">Tanggal Tayang <span className="text-muted fw-normal">(opsional)</span></label>
                    <div className="input-group">
                      <input type="date" className="form-control" value={fc('tanggal_tayang')} onChange={e => setFc('tanggal_tayang', e.target.value)} />
                      {fc('tanggal_tayang') && (
                        <button type="button" className="btn btn-outline-secondary" onClick={() => setFc('tanggal_tayang', '')} title="Hapus tanggal"><i className="bi bi-x" /></button>
                      )}
                    </div>
                  </div>

                  <div className="col-12"><hr className="my-1" /><div className="small text-muted">Field tambahan (opsional)</div></div>

                  <div className="col-md-4">
                    <label className="form-label small fw-semibold">Jumlah File</label>
                    <input className="form-control" value={fc('jumlah_file')} onChange={e => setFc('jumlah_file', e.target.value)} />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label small fw-semibold">Dikirim Dari</label>
                    <input className="form-control" value={fc('dikirim_dari')} onChange={e => setFc('dikirim_dari', e.target.value)} />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label small fw-semibold">Dikirim Ke</label>
                    <input className="form-control" value={fc('dikirim_ke')} onChange={e => setFc('dikirim_ke', e.target.value)} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold">Rumah Produksi</label>
                    <input className="form-control" value={fc('rumah_produksi')} onChange={e => setFc('rumah_produksi', e.target.value)} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold">Keterangan</label>
                    <input className="form-control" value={fc('keterangan')} onChange={e => setFc('keterangan', e.target.value)} />
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


    

      {/* Update Server Modal */}
      {showServerUpdate && (
        <div className="modal show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title"><i className="bi bi-hdd me-2" />Update Sisa Kapasitas Server</h5>
                <button className="btn-close" onClick={() => setShowServerUpdate(false)} />
              </div>
              <div className="modal-body">
                {(allServers.length === 0 && servers.length === 0) ? (
                  <div className="alert alert-warning">Belum ada data server. Tambah di tab Equipment &gt; Data Server terlebih dahulu.</div>
                ) : (
                  <div className="row g-2">
                    {(() => {
                        // AAM dari allServers + non-AAM dari servers (in-studio, per studio row)
                        const rows = [];
                        allServers.filter(sv => sv.is_aam).forEach(sv => {
                          rows.push({ ...sv, _rowKey: sv.id });
                        });
                        servers.filter(sv => !sv.is_aam).forEach(sv => {
                          rows.push({ ...sv, _rowKey: sv.studio_server_key || sv.id });
                        });
                        rows.sort((a, b) => {
                          if (a.is_aam) return -1;
                          if (b.is_aam) return 1;
                          return String(a.studio_number || '').localeCompare(String(b.studio_number || ''), undefined, { numeric: true });
                        });
                        return rows;
                      })().map(sv => {
                      const label = sv.is_aam ? sv.type_server.toUpperCase()
                        : (sv.studio_number ? `STD ${sv.studio_number} - ${sv.type_server.toUpperCase()}` : sv.type_server.toUpperCase());
                      const kap = parseFloat(sv.kapasitas_server) || 0;
                      const terpakai = parseFloat(serverInputs[sv._rowKey || sv.id]) || 0;
                      const sisa = kap > 0 ? (kap - terpakai).toFixed(0) : null;
                      const persen = kap > 0 ? Math.round(((kap - terpakai) / kap) * 100) : null;
                      return (
                        <div key={sv._rowKey || sv.id} className="col-12">
                          <div className="p-2 rounded" style={{ border: '1px solid var(--border)', background: 'var(--surface-2)' }}>
                            <div className="d-flex justify-content-between align-items-center mb-1">
                              <span className="fw-semibold small" style={{ textTransform: 'uppercase' }}>{label}</span>
                              {sisa !== null && (
                                <span className="small text-muted">Sisa: <strong>{sisa} GB</strong> ({persen}%)</span>
                              )}
                            </div>
                            <div className="input-group input-group-sm">
                              <span className="input-group-text" style={{ minWidth: 90 }}>Terpakai</span>
                              <input
                                type="number"
                                className="form-control"
                                placeholder={kap > 0 ? `Maks ${kap} GB` : 'GB'}
                                value={serverInputs[sv._rowKey || sv.id] ?? ''}
                                onChange={e => setServerInputs(s => ({ ...s, [sv._rowKey || sv.id]: e.target.value }))}
                              />
                              <span className="input-group-text">GB</span>
                              {kap > 0 && <span className="input-group-text text-muted">/ {kap} GB</span>}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowServerUpdate(false)}>Batal</button>
                <button className="btn btn-primary" onClick={handleUpdateServer} disabled={allServers.length === 0 || saving}>
                  {saving ? <span className="spinner-border spinner-border-sm me-1" /> : <i className="bi bi-check-lg me-1" />}Update Semua
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <TrashModal show={showTrash} onHide={() => setShowTrash(false)} endpoint="film" columns={TRASH_COLS} onRestored={fetchFilms} />
    </div>
  );
}