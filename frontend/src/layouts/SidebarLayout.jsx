import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, CalendarDays, Wallet, Building2, HelpCircle, Menu, MoreHorizontal, X } from 'lucide-react';
import './SidebarLayout.css';

export const SidebarLayout = () => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Work Log', path: '/work-log', icon: CalendarDays },
    { name: 'Payments', path: '/payments', icon: Wallet },
    { name: 'Loans', path: '/loans', icon: Building2 },
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
              <span className="text-muted body-sm" style={{textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.05em'}}>Worker Portal v3.1</span>
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
              <li>
                <a href="#" className="nav-link text-muted">
                  <HelpCircle size={20} />
                  Support
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>

      {/* Bottom Navigation for Mobile */}
      <nav className="bottom-nav">
        {navItems.map((item) => (
          <NavLink 
            key={item.name}
            to={item.path} 
            className={({ isActive }) => `bottom-nav-link ${isActive ? 'active' : ''}`}
          >
            <item.icon size={24} />
            <span>{item.name}</span>
          </NavLink>
        ))}
        <button 
          className="bottom-nav-link" 
          onClick={() => setIsMobileOpen(true)}
        >
          <MoreHorizontal size={24} />
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
              <a href="#" className="popup-link text-muted" onClick={() => setIsMobileOpen(false)}>
                <HelpCircle size={20} />
                Support
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
