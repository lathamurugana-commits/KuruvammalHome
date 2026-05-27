import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Home, Building, FileText, Bell, Settings, PlusCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const navItems = [
  { to: '/dashboard', icon: Home, label: 'Home' },
  { to: '/generate-bill', icon: PlusCircle, label: 'Generate' },
  { to: '/bills/history', icon: FileText, label: 'Bills' },
  { to: '/houses', icon: Building, label: 'Houses' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function Layout() {
  const location = useLocation();

  return (
    <div className="app-layout">
      <header className="app-header">
        <div className="app-header-left">
          <div className="header-icon">
            <Home size={20} />
          </div>
          <h1>KURUVAMMAL HOME</h1>
        </div>

      </header>

      <main className="app-content">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      <p className="app-footer-text">Powered by Hema</p>

      <nav className="bottom-nav">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `bottom-nav-item${isActive ? ' active' : ''}`
            }
          >
            <Icon size={22} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
