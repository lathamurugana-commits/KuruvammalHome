import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Home, FileText, Clock, CheckCircle, IndianRupee, AlertTriangle, ChevronRight, X, Inbox } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Count-up animation component
const CountUp = ({ value, prefix = '', suffix = '' }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 1000;
    if (value === 0) {
      setCount(0);
      return;
    }
    const increment = value / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [value]);

  return <span>{prefix}{count.toLocaleString('en-IN')}{suffix}</span>;
};

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalHomes: 0,
    totalBills: 0,
    pending: 0,
    paid: 0,
    overdue: 0,
    monthlyCollection: 0,
    totalPendingAmount: 0,
  });

  const [homesList, setHomesList] = useState([]);
  const [billsList, setBillsList] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeModal, setActiveModal] = useState(null); // 'homes', 'generated', 'pending', 'paid', 'collection'

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [{ data: homes }, { data: bills }] = await Promise.all([
        supabase.from('homes').select('*'),
        supabase.from('bills').select('*'),
      ]);

      setHomesList(homes || []);
      setBillsList(bills || []);

      const totalHomes = homes?.length || 0;
      const totalBills = bills?.length || 0;
      const pending = bills?.filter((b) => b.status === 'pending').length || 0;
      const paid = bills?.filter((b) => b.status === 'paid').length || 0;
      const overdue = bills?.filter((b) => b.status === 'overdue').length || 0;

      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const monthlyCollection = bills
        ?.filter((b) => b.status === 'paid' && b.month === currentMonth)
        .reduce((sum, b) => sum + (b.total_amount || 0), 0) || 0;

      const totalPendingAmount = bills
        ?.filter((b) => b.status === 'pending')
        .reduce((sum, b) => sum + (b.total_amount || 0), 0) || 0;

      setStats({ totalHomes, totalBills, pending, paid, overdue, monthlyCollection, totalPendingAmount });

      // Build notifications from homes with expiry dates
      const notifList = [];
      if (homes) {
        homes.forEach((h) => {
          if (h.expiry_date) {
            const expiry = new Date(h.expiry_date);
            const daysLeft = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
            if (daysLeft < 0) {
              notifList.push({ type: 'overdue', title: h.home_name, text: `Expired ${Math.abs(daysLeft)} days ago`, link: '/houses' });
            } else if (daysLeft <= 7) {
              notifList.push({ type: 'due-soon', title: h.home_name, text: `Expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`, link: '/houses' });
            }
          }
        });
      }
      // Also add pending bills as notifications
      if (bills) {
        bills.filter((b) => b.status === 'pending').slice(0, 3).forEach((b) => {
          notifList.push({ type: 'pending', title: `Bill ${b.bill_number}`, text: `₹${b.total_amount} pending`, link: '/bills' });
        });
      }
      setNotifications(notifList.slice(0, 5));
    } catch (error) {
      console.error('Dashboard fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getNotifIcon = (type) => {
    if (type === 'overdue') return 'overdue';
    if (type === 'due-soon') return 'due-soon';
    return 'pending';
  };

  if (loading) {
    return (
      <div>
        <div className="skeleton skeleton-stat" style={{ marginBottom: '0.875rem' }} />
        <div className="stats-grid">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton skeleton-stat" />
          ))}
        </div>
        <div className="skeleton skeleton-card" />
        <div className="skeleton skeleton-card" />
      </div>
    );
  }

  const statCards = [
    { id: 'homes', label: 'Total Homes', value: stats.totalHomes, icon: Home, variant: 'primary' },
    { id: 'generated', label: 'Bills Generated', value: stats.totalBills, icon: FileText, variant: 'info' },
    { id: 'pending', label: 'Pending', value: stats.pending, icon: Clock, variant: 'warning' },
    { id: 'paid', label: 'Paid', value: stats.paid, icon: CheckCircle, variant: 'success' },
  ];

  /* Modal render helpers */
  const renderModalContent = () => {
    if (!activeModal) return null;

    if (activeModal === 'homes') {
      return (
        <>
          <div className="sheet-header">
            <h3 className="sheet-title">Total Homes</h3>
            <button className="close-sheet-btn" onClick={() => setActiveModal(null)}><X size={18} /></button>
          </div>
          <div className="sheet-content">
            {homesList.length === 0 ? (
              <div className="empty-state">
                <Home size={32} />
                <p>No homes registered yet.</p>
              </div>
            ) : (
              homesList.map(home => (
                <div key={home.id} className="house-card" style={{ marginBottom: '0.75rem', padding: '1rem' }}>
                  <div className="house-card-header" style={{ marginBottom: '0.25rem' }}>
                    <h3 style={{ fontSize: '0.95rem' }}>{home.home_name}</h3>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--gray)' }}>{home.tenant_name || 'No tenant'}</p>
                </div>
              ))
            )}
          </div>
        </>
      );
    }

    if (['generated', 'pending', 'paid'].includes(activeModal)) {
      let filteredBills = billsList;
      let title = 'All Bills';
      if (activeModal === 'pending') {
        filteredBills = billsList.filter(b => b.status === 'pending');
        title = 'Pending Bills';
      } else if (activeModal === 'paid') {
        filteredBills = billsList.filter(b => b.status === 'paid');
        title = 'Paid Bills';
      } else {
        title = 'Generated Bills';
      }

      return (
        <>
          <div className="sheet-header">
            <h3 className="sheet-title">{title}</h3>
            <button className="close-sheet-btn" onClick={() => setActiveModal(null)}><X size={18} /></button>
          </div>
          <div className="sheet-content">
            {filteredBills.length === 0 ? (
              <div className="empty-state">
                <FileText size={32} />
                <p>No bills found.</p>
              </div>
            ) : (
              filteredBills.map(bill => (
                <div key={bill.id} className="house-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', padding: '1rem' }}>
                  <div>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: '700', marginBottom: '0.25rem' }}>{bill.bill_number}</h4>
                    <p style={{ fontSize: '0.75rem', color: 'var(--gray)' }}>{bill.month}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--dark)' }}>₹{bill.total_amount?.toLocaleString('en-IN')}</p>
                    <span className={`house-status ${bill.status}`} style={{ fontSize: '0.6rem', marginTop: '0.25rem', display: 'inline-block' }}>
                      {bill.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      );
    }

    if (activeModal === 'collection') {
      const collectionEfficiency = stats.monthlyCollection + stats.totalPendingAmount > 0
        ? Math.round((stats.monthlyCollection / (stats.monthlyCollection + stats.totalPendingAmount)) * 100)
        : 0;

      return (
        <>
          <div className="sheet-header">
            <h3 className="sheet-title">Collection Analytics</h3>
            <button className="close-sheet-btn" onClick={() => setActiveModal(null)}><X size={18} /></button>
          </div>
          <div className="sheet-content">
            <div className="house-card" style={{ marginBottom: '1rem', background: 'var(--dark)', color: 'var(--white)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--gray-light)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Overall Efficiency</p>
                  <h2 style={{ fontSize: '2rem', fontFamily: "'Outfit', sans-serif", margin: '0.25rem 0' }}>{collectionEfficiency}%</h2>
                </div>
                <div style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.1)', borderRadius: '50%', color: 'var(--gold-light)' }}>
                  < IndianRupee size={24} />
                </div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.1)', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                <motion.div 
                  initial={{ width: 0 }} 
                  animate={{ width: `${collectionEfficiency}%` }} 
                  transition={{ duration: 1, delay: 0.2 }}
                  style={{ background: 'var(--gold)', height: '100%' }} 
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
              <div className="house-card" style={{ flex: 1, padding: '1rem' }}>
                <p style={{ fontSize: '0.7rem', color: 'var(--gray)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Collected</p>
                <p style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--success)' }}>₹{stats.monthlyCollection.toLocaleString('en-IN')}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--gray)', marginTop: '0.25rem' }}>{stats.paid} bills</p>
              </div>
              <div className="house-card" style={{ flex: 1, padding: '1rem' }}>
                <p style={{ fontSize: '0.7rem', color: 'var(--gray)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Pending</p>
                <p style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--warning)' }}>₹{stats.totalPendingAmount.toLocaleString('en-IN')}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--gray)', marginTop: '0.25rem' }}>{stats.pending} bills</p>
              </div>
            </div>

            <h4 style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.75rem', color: 'var(--dark)' }}>Pending Bills Breakdown</h4>
            {billsList.filter(b => b.status === 'pending').length === 0 ? (
              <div className="empty-state"><p>No pending collections.</p></div>
            ) : (
              billsList.filter(b => b.status === 'pending').map(bill => (
                <div key={bill.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid var(--beige)' }}>
                  <div>
                    <p style={{ fontSize: '0.85rem', fontWeight: '600' }}>{bill.bill_number}</p>
                    <p style={{ fontSize: '0.7rem', color: 'var(--gray)' }}>{bill.month}</p>
                  </div>
                  <p style={{ fontSize: '0.9rem', fontWeight: '700' }}>₹{bill.total_amount?.toLocaleString('en-IN')}</p>
                </div>
              ))
            )}
          </div>
        </>
      );
    }
    return null;
  };

  return (
    <div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Overview of your properties</p>
      </motion.div>

      <div style={{ marginBottom: '0.875rem' }}>
        <motion.div
          whileTap={{ scale: 0.96 }}
          onClick={() => setActiveModal('collection')}
          className="stat-card stat-card-full"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{ cursor: 'pointer' }}
        >
          <div className="stat-card-icon" style={{ marginBottom: '1rem' }}>
            <IndianRupee size={20} />
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div className="stat-card-value">
                ₹<CountUp value={stats.monthlyCollection} />
              </div>
              <div className="stat-card-label">Total Collection</div>
            </div>
            
            <div style={{ textAlign: 'right' }}>
              <div className="stat-card-value" style={{ color: 'var(--gold-light)' }}>
                ₹<CountUp value={stats.totalPendingAmount} />
              </div>
              <div className="stat-card-label" style={{ color: 'var(--gray-light)' }}>Pending Amount</div>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="stats-grid">
        {statCards.map((card, i) => (
          <motion.div
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveModal(card.id)}
            key={card.label}
            className={`stat-card ${card.variant}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.1 }}
            style={{ cursor: 'pointer' }}
          >
            <div className="stat-card-icon">
              <card.icon size={20} />
            </div>
            <div className="stat-card-value">
              <CountUp value={card.value} />
            </div>
            <div className="stat-card-label">{card.label}</div>
          </motion.div>
        ))}
      </div>

      {notifications.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <div className="section-header">
            <h3>🔔 Notifications</h3>
            <Link to="/notifications">See all</Link>
          </div>

          {notifications.map((notif, i) => (
            <Link to={notif.link} key={i}>
              <motion.div whileTap={{ scale: 0.98 }} className="notification-card" style={{ cursor: 'pointer' }}>
                <div className={`notif-icon ${getNotifIcon(notif.type)}`}>
                  <AlertTriangle size={18} />
                </div>
                <div className="notif-text">
                  <h4>{notif.title}</h4>
                  <p>{notif.text}</p>
                </div>
                <ChevronRight size={16} className="notif-arrow" />
              </motion.div>
            </Link>
          ))}
        </motion.div>
      )}

      {/* BOTTOM SHEET MODAL */}
      <AnimatePresence>
        {activeModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="modal-backdrop"
              onClick={() => setActiveModal(null)}
            >
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="bottom-sheet"
                onClick={e => e.stopPropagation()}
              >
                <div className="sheet-handle" />
                {renderModalContent()}
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
