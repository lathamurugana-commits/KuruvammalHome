import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Info, ChevronRight, Home } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

export default function Settings() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [showAbout, setShowAbout] = useState(false);

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
          <div className="settings-item" onClick={() => setShowAbout(true)}>
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


      </motion.div>

      {/* About Modal */}
      <AnimatePresence>
        {showAbout && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowAbout(false)}
          >
            <motion.div
              className="modal-content"
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2>About Kuruvammal Home</h2>
              <div style={{ marginTop: '1rem', lineHeight: '1.6', fontSize: '0.95rem', textAlign: 'left' }}>
                <p>
                  Kuruvammal Home is a smart property management application designed and developed by Hema to simplify rental and billing management.
                </p>
                <p style={{ marginTop: '0.75rem' }}>
                  This platform helps manage houses, generate monthly bills, track payments, and monitor collections efficiently.
                  It is built with a clean and modern mobile-first experience for easy daily use.
                </p>
                <p style={{ marginTop: '0.75rem' }}>
                  The app focuses on simplicity, reliability, and smooth property administration.
                  Designed with care by Hema to make property management organized and effortless.
                </p>
              </div>
              <div className="modal-actions" style={{ justifyContent: 'center', marginTop: '1.5rem' }}>
                <button
                  className="btn-primary"
                  onClick={() => setShowAbout(false)}
                  style={{ width: '100%', marginTop: '0' }}
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
