import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Archive, LayoutDashboard, CalendarDays, Wallet, Building2, Menu, X, Settings, LogOut, User, ReceiptText } from 'lucide-react';
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
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Work Log', path: '/work-log', icon: CalendarDays },
    { name: 'Expenses', path: '/expenses', icon: ReceiptText },
    { name: 'Payments', path: '/payments', icon: Wallet },
    { name: 'Loans', path: '/loans', icon: Building2 },
    { name: 'History', path: '/monthly-history', icon: Archive },
  ];
  const bottomNavItems = navItems.slice(0, 4);

  const footerItems = [
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  const displayName = user?.name || user?.email?.split('@')[0] || 'Account';
  const displayEmail = user?.email || '';

  return (
    <div className="layout">
      <button className="mobile-toggle" onClick={() => setIsMobileOpen(!isMobileOpen)}>
        <Menu size={24} />
      </button>

      {isMobileOpen && <div className="sidebar-overlay" onClick={() => setIsMobileOpen(false)}></div>}

      <aside className={`sidebar ${isMobileOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo flex items-center gap-sm">
            <img src="/logo.png" alt="GigFinance Logo" style={{ width: '32px', height: '32px', borderRadius: '8px', objectFit: 'cover' }} />
            <div>
              <h2 className="text-primary">GigFinance</h2>
              <span className="text-muted body-sm" style={{ textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.05em' }}>Worker Portal v3.1</span>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <ul>
            {navItems.map((item) => (
              <li key={item.name}>
                <NavLink
                  to={item.path}
                  end={item.path === '/'}
                  onClick={() => setIsMobileOpen(false)}
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                >
                  <item.icon size={20} />
                  {item.name}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="sidebar-footer">
          <nav className="sidebar-nav">
            <ul>
              {footerItems.map((item) => (
                <li key={item.name}>
                  <NavLink
                    to={item.path}
                    onClick={() => setIsMobileOpen(false)}
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''} text-muted`}
                  >
                    <item.icon size={20} />
                    {item.name}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          {/* User info + logout */}
          <div style={{ borderTop: '1px solid var(--outline-variant)', marginTop: '0.5rem', paddingTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--primary-container)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <User size={18} />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: '0.8125rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--on-surface-variant)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayEmail}</div>
            </div>
            <button onClick={handleLogout} title="Sign out" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--on-surface-variant)', padding: '4px', borderRadius: '6px', display: 'flex', alignItems: 'center' }}>
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>

      {/* Bottom Navigation for Mobile */}
      <nav className="bottom-nav">
        {bottomNavItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            end={item.path === '/'}
            onClick={() => setIsMobileOpen(false)}
            className={({ isActive }) => `bottom-nav-link ${isActive ? 'active' : ''}`}
          >
            <item.icon size={24} />
            <span>{item.name}</span>
          </NavLink>
        ))}
        <button
          type="button"
          className={`bottom-nav-link ${isMobileOpen ? 'active' : ''}`}
          onClick={() => setIsMobileOpen(true)}
        >
          <Menu size={24} />
          <span>Menu</span>
        </button>
      </nav>

      {/* Mobile Menu Popup */}
      <div className={`mobile-popup ${isMobileOpen ? 'open' : ''}`}>
        <div className="mobile-popup-content">
          <div className="mobile-popup-drag-handle"></div>
          <div className="mobile-popup-header">
            <h3>Menu</h3>
            <button onClick={() => setIsMobileOpen(false)}><X size={20} /></button>
          </div>
          <div className="mobile-popup-body">
            <div className="popup-section">
              <p className="section-title">Navigation</p>
              {navItems.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.path}
                  end={item.path === '/'}
                  onClick={() => setIsMobileOpen(false)}
                  className="popup-link"
                >
                  <item.icon size={20} />
                  {item.name}
                </NavLink>
              ))}
            </div>
            <div className="popup-section">
              <p className="section-title">Others</p>
              {footerItems.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.path}
                  onClick={() => setIsMobileOpen(false)}
                  className="popup-link text-muted"
                >
                  <item.icon size={20} />
                  {item.name}
                </NavLink>
              ))}
              <button
                className="popup-link text-muted"
                style={{ background: 'none', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0' }}
                onClick={handleLogout}
              >
                <LogOut size={20} />
                Sign out
              </button>
            </div>

            {/* User info in popup */}
            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--outline-variant)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--primary-container)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User size={20} />
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{displayName}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--on-surface-variant)' }}>{displayEmail}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
