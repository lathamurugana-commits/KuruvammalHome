import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

export default function SplashScreen() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    // If auth is resolved and user is logged in, auto-redirect to dashboard
    if (!loading && user) {
      const timer = setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 1200); // Short splash animation before redirect
      return () => clearTimeout(timer);
    }
  }, [user, loading, navigate]);

  return (
    <div className="splash-screen">
      <motion.div
        className="splash-content"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        <motion.div
          className="splash-icon-wrapper"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
        >
          <Home size={64} />
          <div className="splash-icon-bill">
            <FileText size={24} />
          </div>
        </motion.div>

        <motion.h1
          className="splash-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          KURUVAMMAL HOME
        </motion.h1>

        <motion.p
          className="splash-subtitle"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          Smart Rent & Bill Management
        </motion.p>

        <motion.div
          className="splash-loader"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <div className="splash-loader-bar" />
        </motion.div>

        {/* Only show "Get Started" if user is not logged in */}
        {!loading && !user && (
          <motion.button
            className="splash-btn"
            onClick={() => navigate('/login')}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.4 }}
            whileTap={{ scale: 0.96 }}
          >
            Get Started →
          </motion.button>
        )}
      </motion.div>
    </div>
  );
}
