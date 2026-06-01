import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Archive, LayoutDashboard, CalendarDays, Wallet, Building2, Menu, X, Settings, LogOut, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/useAuth';
import './SidebarLayout.css';

export const SidebarLayout = () => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard',  path: '/',                icon: LayoutDashboard, gradient: 'linear-gradient(135deg,#134e4a,#10b981)' },
    { name: 'Work Log',   path: '/work-log',         icon: CalendarDays,    gradient: 'linear-gradient(135deg,#1e3a5f,#3b82f6)' },
    { name: 'Payments',   path: '/payments',         icon: Wallet,          gradient: 'linear-gradient(135deg,#78350f,#f59e0b)' },
    { name: 'Loans',      path: '/loans',            icon: Building2,       gradient: 'linear-gradient(135deg,#4c1d95,#8b5cf6)' },
    { name: 'History',    path: '/monthly-history',  icon: Archive,         gradient: 'linear-gradient(135deg,#0c4a6e,#0284c7)' },
  ];
  const bottomNavItems = navItems.slice(0, 4);

  const displayName  = user?.name || user?.email?.split('@')[0] || 'Account';
  const displayEmail = user?.email || '';
  const initials     = displayName.slice(0, 2).toUpperCase();

  return (
    <div className="layout">
      {isMobileOpen && (
        <div className="sidebar-overlay" onClick={() => setIsMobileOpen(false)} />
      )}

      {/* ── Desktop Sidebar ── */}
      <aside className="sidebar">
        {/* Branding */}
        <div className="sidebar-brand">
          <div className="sidebar-brand-inner">
            <div className="sidebar-logo-wrap">
              <img src="/logo.png" alt="GigFinance" style={{ width: 28, height: 28, borderRadius: 7, objectFit: 'cover' }} />
            </div>
            <div>
              <div className="sidebar-app-name">GigFinance</div>
              <div className="sidebar-app-sub">Worker Portal</div>
            </div>
          </div>
        </div>

        {/* Main nav */}
        <div className="sidebar-section-label">Navigation</div>
        <nav className="sidebar-nav">
          <ul>
            {navItems.map((item) => (
              <li key={item.name}>
                <NavLink
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                >
                  <span className="nav-icon-wrap" style={{ background: item.gradient }}>
                    <item.icon size={15} color="#fff" strokeWidth={2.2} />
                  </span>
                  <span className="nav-label">{item.name}</span>
                  <ChevronRight size={14} className="nav-chevron" />
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="sidebar-spacer" />

        {/* Settings */}
        <div className="sidebar-section-label">Account</div>
        <nav className="sidebar-nav sidebar-nav-bottom">
          <ul>
            <li>
              <NavLink
                to="/settings"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                <span className="nav-icon-wrap" style={{ background: 'linear-gradient(135deg,#374151,#6b7280)' }}>
                  <Settings size={15} color="#fff" strokeWidth={2.2} />
                </span>
                <span className="nav-label">Settings</span>
                <ChevronRight size={14} className="nav-chevron" />
              </NavLink>
            </li>
          </ul>
        </nav>

        {/* User profile */}
        <div className="sidebar-profile">
          <div className="sidebar-profile-avatar">{initials}</div>
          <div className="sidebar-profile-info">
            <div className="sidebar-profile-name">{displayName}</div>
            <div className="sidebar-profile-email">{displayEmail}</div>
          </div>
          <button onClick={handleLogout} className="sidebar-logout-btn" title="Sign out">
            <LogOut size={15} />
          </button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>

      {/* ── Mobile Bottom Nav ── */}
      <nav className="bottom-nav">
        {bottomNavItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            end={item.path === '/'}
            onClick={() => setIsMobileOpen(false)}
            className={({ isActive }) => `bottom-nav-link ${isActive ? 'active' : ''}`}
          >
            {({ isActive }) => (
              <>
                <span className="bnl-icon" style={isActive ? { background: item.gradient } : {}}>
                  <item.icon size={18} strokeWidth={isActive ? 2.4 : 2} />
                </span>
                <span className="bnl-label">{item.name}</span>
              </>
            )}
          </NavLink>
        ))}
        <button
          type="button"
          className={`bottom-nav-link ${isMobileOpen ? 'active' : ''}`}
          onClick={() => setIsMobileOpen(true)}
        >
          <span className="bnl-icon" style={isMobileOpen ? { background: 'linear-gradient(135deg,#374151,#6b7280)' } : {}}>
            <Menu size={18} strokeWidth={2} />
          </span>
          <span className="bnl-label">More</span>
        </button>
      </nav>

      {/* ── Mobile Bottom Sheet ── */}
      <div className={`mobile-popup ${isMobileOpen ? 'open' : ''}`} onClick={(e) => e.target === e.currentTarget && setIsMobileOpen(false)}>
        <div className="mobile-popup-content">
          <div className="mobile-popup-drag-handle" />

          {/* User banner inside popup */}
          <div className="popup-user-banner">
            <div className="popup-user-avatar">{initials}</div>
            <div className="popup-user-info">
              <div className="popup-user-name">{displayName}</div>
              <div className="popup-user-email">{displayEmail}</div>
            </div>
            <button onClick={() => setIsMobileOpen(false)} className="popup-close-btn">
              <X size={16} />
            </button>
          </div>

          <div className="mobile-popup-body">
            <p className="section-title">Pages</p>
            <div className="popup-nav-grid">
              {navItems.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.path}
                  end={item.path === '/'}
                  onClick={() => setIsMobileOpen(false)}
                  className={({ isActive }) => `popup-nav-tile ${isActive ? 'active' : ''}`}
                >
                  <span className="popup-tile-icon" style={{ background: item.gradient }}>
                    <item.icon size={20} color="#fff" strokeWidth={2} />
                  </span>
                  <span className="popup-tile-label">{item.name}</span>
                </NavLink>
              ))}
            </div>

            <div className="popup-divider" />

            <NavLink
              to="/settings"
              onClick={() => setIsMobileOpen(false)}
              className={({ isActive }) => `popup-action-row ${isActive ? 'active' : ''}`}
            >
              <span className="popup-action-icon" style={{ background: 'linear-gradient(135deg,#374151,#6b7280)' }}>
                <Settings size={16} color="#fff" />
              </span>
              Settings
            </NavLink>
            <button onClick={handleLogout} className="popup-action-row popup-signout">
              <span className="popup-action-icon" style={{ background: 'linear-gradient(135deg,#7f1d1d,#ef4444)' }}>
                <LogOut size={16} color="#fff" />
              </span>
              Sign out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
