import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../state/AuthContext.jsx';

const sectionMeta = {
  '/': {
    label: 'Integrity Dashboard',
    status: 'Integrity watch active',
  },
  '/polygon-transparency': {
    label: 'Polygon Transparency Feed',
    status: 'Broadcasting synthetic anchors',
  },
};

function Layout() {
  const location = useLocation();
  const { email, logout } = useAuth();
  const meta =
    sectionMeta[location.pathname] ?? {
      label: 'EvidenceShield Console',
      status: 'Monitoring session state',
    };

  return (
    <div className="workspace">
      <aside className="workspace-sidebar">
        <div className="sidebar-brand">
          <span className="sidebar-badge">MVP</span>
          <span className="sidebar-title">EvidenceShield</span>
          <span className="sidebar-subtitle">IPFS x Polygon</span>
        </div>
        <nav className="sidebar-nav">
          <NavLink to="/" className={({ isActive }) => (isActive ? 'active' : undefined)} end>
            <span className="nav-label">Dashboard</span>
            <span className="nav-description">Uploads | Proofs | Stats</span>
          </NavLink>
          <NavLink
            to="/polygon-transparency"
            className={({ isActive }) => (isActive ? 'active' : undefined)}
          >
            <span className="nav-label">PolygonScan Mirror</span>
            <span className="nav-description">Anchors | Proof IDs</span>
          </NavLink>
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-chip">Real-time ZKP check</div>
          <div className="sidebar-note">
            Session data clears on reload. Files never leave this browser.
          </div>
        </div>
      </aside>
      <div className="workspace-content">
        <header className="workspace-topbar">
          <div>
            <h1>{meta.label}</h1>
            <p>{meta.status}</p>
          </div>
          <div className="topbar-session">
            <div className="topbar-indicator">
              <span className="indicator-dot" />
              Live session
            </div>
            <div className="topbar-user">
              <div className="topbar-email">{email || 'session@local'}</div>
              <button type="button" className="btn btn-secondary btn-compact" onClick={logout}>
                Sign out
              </button>
            </div>
          </div>
        </header>
        <main className="workspace-main">
          <Outlet />
        </main>
        <footer className="workspace-footer">
          © {new Date().getFullYear()} EvidenceShield MVP - IPFS x Polygon x ZKP demo
        </footer>
      </div>
    </div>
  );
}

export default Layout;
