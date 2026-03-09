import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';
import FilmTab from './FilmTab';
import OrderTab from './OrderTab';
import MaintenanceTab from './MaintenanceTab';
import EquipmentTab from './EquipmentTab';
import SettingTab from './SettingTab';

const TABS = [
  { key: 'film', label: 'Data Film', icon: 'bi-film' },
  { key: 'order', label: 'Data Order Barang', icon: 'bi-box-seam' },
  { key: 'equipment', label: 'Equipment', icon: 'bi-pc-display' },
  { key: 'maintenance', label: 'Data Maintenance', icon: 'bi-tools' },
  { key: 'setting', label: 'Setting', icon: 'bi-gear' },
];

export default function MainLayout() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('film');
  const [settings, setSettings] = useState(null);

  const fetchSettings = async () => {
    try {
      const res = await API.get('/setting');
      setSettings(res.data);
    } catch {}
  };

  useEffect(() => { fetchSettings(); }, []);

  const outletName = settings?.nama_outlet || user?.nama_outlet || 'Outlet';

  return (
    <div className="d-flex flex-column" style={{ minHeight: '100vh' }}>
      <nav className="navbar navbar-expand-lg app-navbar">
        <div className="container-fluid">
          <span className="navbar-brand">
            Teknikal-XXI
            <span className="outlet-name ms-2">| {outletName}</span>
          </span>

          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav"
            style={{ borderColor: 'rgba(255,255,255,0.4)' }}>
            <span className="navbar-toggler-icon" style={{ filter: 'invert(1)' }} />
          </button>

          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav me-auto ms-3">
              {TABS.map(tab => (
                <li className="nav-item" key={tab.key}>
                  <button
                    className={`nav-link btn btn-link ${activeTab === tab.key ? 'active' : ''}`}
                    style={{ textDecoration: 'none' }}
                    onClick={() => setActiveTab(tab.key)}
                  >
                    <i className={`bi ${tab.icon} me-1`} />
                    {tab.label}
                  </button>
                </li>
              ))}
            </ul>

            <div className="d-flex align-items-center gap-2">
              <span className="text-white small">
                <i className="bi bi-person-circle me-1" />
                {user?.nama_lengkap || user?.email}
              </span>
              <button className="btn btn-sm btn-outline-light" onClick={logout}>
                <i className="bi bi-box-arrow-right me-1" />
                Keluar
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="content-area flex-grow-1">
        {activeTab === 'film' && <FilmTab settings={settings} outletName={outletName} />}
        {activeTab === 'order' && <OrderTab settings={settings} outletName={outletName} />}
        {activeTab === 'equipment' && <EquipmentTab outletName={outletName} />}
        {activeTab === 'maintenance' && <MaintenanceTab settings={settings} outletName={outletName} />}
        {activeTab === 'setting' && <SettingTab settings={settings} onSaved={fetchSettings} />}
      </div>

      <footer className="text-center py-2" style={{ fontSize: '0.75rem', color: '#aaa', background: '#f8f9fa', borderTop: '1px solid #dee2e6' }}>
        &copy; {new Date().getFullYear()} Teknikal-XXI | {outletName}
      </footer>
    </div>
  );
}
