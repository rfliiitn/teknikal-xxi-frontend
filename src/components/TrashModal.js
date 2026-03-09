import { useState, useEffect } from 'react';
import API from '../utils/api';

export default function TrashModal({ show, onHide, endpoint, columns, onRestored }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (show) fetchTrash();
  }, [show]);

  const fetchTrash = async () => {
    setLoading(true);
    try {
      const res = await API.get(`/${endpoint}/trash`);
      setItems(res.data);
    } catch {}
    setLoading(false);
  };

  const handleRestore = async (id) => {
    try {
      await API.post(`/${endpoint}/${id}/restore`);
      fetchTrash();
      onRestored();
    } catch (err) {
      alert('Gagal memulihkan data');
    }
  };

  const handlePermanentDelete = async (id) => {
    if (!window.confirm('Hapus permanen? Data tidak bisa dipulihkan.')) return;
    try {
      await API.delete(`/${endpoint}/${id}/permanent`);
      fetchTrash();
    } catch {
      alert('Gagal menghapus permanen');
    }
  };

  if (!show) return null;

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-xl modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              <i className="bi bi-trash me-2" />
              Tempat Sampah
            </h5>
            <button className="btn-close" onClick={onHide} />
          </div>
          <div className="modal-body p-0">
            {loading ? (
              <div className="text-center py-4"><div className="spinner-border text-primary" /></div>
            ) : items.length === 0 ? (
              <div className="text-center py-4 text-muted">
                <i className="bi bi-trash3 fs-1 d-block mb-2" />
                Tempat sampah kosong
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-sm mb-0">
                  <thead>
                    <tr>
                      <th>No</th>
                      {columns.map(c => <th key={c.key}>{c.label}</th>)}
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, i) => (
                      <tr key={item.id}>
                        <td>{i + 1}</td>
                        {columns.map(c => <td key={c.key}>{item[c.key] || '-'}</td>)}
                        <td>
                          <button className="btn btn-sm btn-success me-1" onClick={() => handleRestore(item.id)} title="Pulihkan">
                            <i className="bi bi-arrow-counterclockwise" />
                          </button>
                          <button className="btn btn-sm btn-danger" onClick={() => handlePermanentDelete(item.id)} title="Hapus Permanen">
                            <i className="bi bi-x-lg" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onHide}>Tutup</button>
          </div>
        </div>
      </div>
    </div>
  );
}
