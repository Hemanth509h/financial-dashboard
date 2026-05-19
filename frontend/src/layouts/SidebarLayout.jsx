import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Archive, LayoutDashboard, CalendarDays, Wallet, Building2, Menu, X, Settings } from 'lucide-react';
import './SidebarLayout.css';

export const SidebarLayout = () => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Work Log', path: '/work-log', icon: CalendarDays },
    { name: 'Payments', path: '/payments', icon: Wallet },
    { name: 'Loans', path: '/loans', icon: Building2 },
    { name: 'History', path: '/monthly-history', icon: Archive },
  ];
  const bottomNavItems = navItems.slice(0, 4);

  const footerItems = [
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

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
                  {item.path.startsWith('#') ? (
                    <a href={item.path} className="nav-link text-muted">
                      <item.icon size={20} />
                      {item.name}
                    </a>
                  ) : (
                    <NavLink
                      to={item.path}
                      onClick={() => setIsMobileOpen(false)}
                      className={({ isActive }) => `nav-link ${isActive ? 'active' : ''} text-muted`}
                    >
                      <item.icon size={20} />
                      {item.name}
                    </NavLink>
                  )}
                </li>
              ))}
            </ul>
          </nav>
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
          <div className="mobile-popup-header">
            <h3>Menu</h3>
            <button onClick={() => setIsMobileOpen(false)}><X size={24} /></button>
          </div>
          <div className="mobile-popup-body">
            <div className="popup-section">
              <p className="section-title">Navigation</p>
              {navItems.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.path}
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
                item.path.startsWith('#') ? (
                  <a key={item.name} href={item.path} className="popup-link text-muted" onClick={() => setIsMobileOpen(false)}>
                    <item.icon size={20} />
                    {item.name}
                  </a>
                ) : (
                  <NavLink
                    key={item.name}
                    to={item.path}
                    onClick={() => setIsMobileOpen(false)}
                    className="popup-link text-muted"
                  >
                    <item.icon size={20} />
                    {item.name}
                  </NavLink>
                )
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
