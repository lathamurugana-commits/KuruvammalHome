import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Info, ChevronRight, Home } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export default function Settings() {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success('Logged out successfully');
      navigate('/', { replace: true });
    } catch (error) {
      toast.error('Failed to log out');
    }
  };

  return (
    <div>
      <h1 className="page-title">Settings</h1>
      <p className="page-subtitle">App preferences & info</p>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="settings-card">
          <div className="settings-item">
            <Home size={20} />
            <span>Kuruvammal Home</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--gray)', marginLeft: 'auto', marginRight: '0.5rem' }}>
              v1.0.0
            </span>
          </div>
          <div className="settings-item">
            <Info size={20} />
            <span>About</span>
            <ChevronRight size={16} className="settings-arrow" />
          </div>
        </div>

        <div className="settings-card" style={{ marginTop: '1rem' }}>
          <button className="settings-item danger" onClick={handleLogout}>
            <LogOut size={20} />
            <span>Log Out</span>
            <ChevronRight size={16} className="settings-arrow" />
          </button>
        </div>

        <p className="app-footer-text" style={{ marginTop: '2rem' }}>
          Built with ❤️ by Hema<br />
          <span style={{ fontSize: '0.65rem' }}>Powered by React + Supabase</span>
        </p>
      </motion.div>
    </div>
  );
}
