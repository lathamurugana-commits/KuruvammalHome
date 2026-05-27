import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Home, FileText, Clock, CheckCircle, IndianRupee, AlertTriangle, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalHomes: 0,
    totalBills: 0,
    pending: 0,
    paid: 0,
    overdue: 0,
    monthlyCollection: 0,
  });
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [{ data: homes }, { data: bills }] = await Promise.all([
        supabase.from('homes').select('*'),
        supabase.from('bills').select('*'),
      ]);

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

      setStats({ totalHomes, totalBills, pending, paid, overdue, monthlyCollection });

      // Build notifications from homes with expiry dates
      const notifList = [];
      if (homes) {
        homes.forEach((h) => {
          if (h.expiry_date) {
            const expiry = new Date(h.expiry_date);
            const daysLeft = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
            if (daysLeft < 0) {
              notifList.push({ type: 'overdue', title: h.home_name, text: `Expired ${Math.abs(daysLeft)} days ago` });
            } else if (daysLeft <= 7) {
              notifList.push({ type: 'due-soon', title: h.home_name, text: `Expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}` });
            }
          }
        });
      }
      // Also add pending bills as notifications
      if (bills) {
        bills.filter((b) => b.status === 'pending').slice(0, 3).forEach((b) => {
          notifList.push({ type: 'pending', title: `Bill ${b.bill_number}`, text: `₹${b.total_amount} pending` });
        });
      }
      setNotifications(notifList.slice(0, 5));
    } catch (error) {
      console.error('Dashboard fetch error:', error);
    } finally {
      setLoading(false);
    }
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
    { label: 'Total Homes', value: stats.totalHomes, icon: Home, variant: 'primary' },
    { label: 'Bills Generated', value: stats.totalBills, icon: FileText, variant: 'info' },
    { label: 'Pending', value: stats.pending, icon: Clock, variant: 'warning' },
    { label: 'Paid', value: stats.paid, icon: CheckCircle, variant: 'success' },
  ];

  const getNotifIcon = (type) => {
    if (type === 'overdue') return 'overdue';
    if (type === 'due-soon') return 'due-soon';
    return 'pending';
  };

  return (
    <div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Overview of your properties</p>
      </motion.div>

      <div className="stats-grid">
        {statCards.map((card, i) => (
          <motion.div
            key={card.label}
            className={`stat-card ${card.variant}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <div className="stat-card-icon">
              <card.icon size={20} />
            </div>
            <div className="stat-card-value">{card.value}</div>
            <div className="stat-card-label">{card.label}</div>
          </motion.div>
        ))}

        <motion.div
          className="stat-card stat-card-full"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="stat-card-icon">
            <IndianRupee size={20} />
          </div>
          <div className="stat-card-value">₹{stats.monthlyCollection.toLocaleString('en-IN')}</div>
          <div className="stat-card-label">Monthly Collection</div>
        </motion.div>
      </div>

      {notifications.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className="section-header">
            <h3>🔔 Notifications</h3>
            <Link to="/notifications">See all</Link>
          </div>

          {notifications.map((notif, i) => (
            <div key={i} className="notification-card">
              <div className={`notif-icon ${getNotifIcon(notif.type)}`}>
                <AlertTriangle size={18} />
              </div>
              <div className="notif-text">
                <h4>{notif.title}</h4>
                <p>{notif.text}</p>
              </div>
              <ChevronRight size={16} className="notif-arrow" />
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
