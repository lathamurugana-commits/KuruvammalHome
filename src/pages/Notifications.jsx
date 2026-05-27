import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { AlertTriangle, Clock, IndianRupee, Bell } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const [{ data: homes }, { data: bills }] = await Promise.all([
        supabase.from('homes').select('*'),
        supabase.from('bills').select('*').order('generated_at', { ascending: false }),
      ]);

      const notifs = [];
      const now = new Date();

      // Overdue agreements
      if (homes) {
        homes.forEach((h) => {
          if (h.expiry_date) {
            const expiry = new Date(h.expiry_date);
            const daysLeft = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
            if (daysLeft < 0) {
              notifs.push({
                type: 'overdue',
                icon: AlertTriangle,
                title: `${h.home_name} — Agreement Expired`,
                text: `Expired ${Math.abs(daysLeft)} days ago. Tenant: ${h.tenant_name || '--'}`,
                priority: 1,
              });
            } else if (daysLeft <= 7) {
              notifs.push({
                type: 'due-soon',
                icon: Clock,
                title: `${h.home_name} — Expiring Soon`,
                text: `Expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}. Tenant: ${h.tenant_name || '--'}`,
                priority: 2,
              });
            } else if (daysLeft <= 30) {
              notifs.push({
                type: 'due-soon',
                icon: Clock,
                title: `${h.home_name} — Expiring in ${daysLeft} days`,
                text: `Tenant: ${h.tenant_name || '--'}`,
                priority: 3,
              });
            }
          }
        });
      }

      // Pending / overdue bills
      if (bills) {
        bills.forEach((b) => {
          if (b.status === 'pending') {
            const homeName = homes?.find((h) => h.id === b.home_id)?.home_name || 'Unknown';
            notifs.push({
              type: 'pending',
              icon: IndianRupee,
              title: `${homeName} — Payment Pending`,
              text: `Bill ${b.bill_number}: ₹${(b.total_amount || 0).toLocaleString('en-IN')}`,
              priority: 2,
            });
          }
          if (b.status === 'overdue') {
            const homeName = homes?.find((h) => h.id === b.home_id)?.home_name || 'Unknown';
            notifs.push({
              type: 'overdue',
              icon: AlertTriangle,
              title: `${homeName} — Payment Overdue`,
              text: `Bill ${b.bill_number}: ₹${(b.total_amount || 0).toLocaleString('en-IN')}`,
              priority: 1,
            });
          }
        });
      }

      // Sort by priority
      notifs.sort((a, b) => a.priority - b.priority);
      setNotifications(notifs);
    } catch (error) {
      console.error('Notification fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div>
        <div className="skeleton" style={{ height: 36, width: 160, marginBottom: '1.25rem' }} />
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton skeleton-card" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <h1 className="page-title">Notifications</h1>
      <p className="page-subtitle">Stay updated on your properties</p>

      {notifications.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <Bell size={36} />
          </div>
          <h3>All caught up!</h3>
          <p>No alerts or notifications at the moment</p>
        </div>
      ) : (
        notifications.map((notif, i) => {
          const IconComp = notif.icon;
          return (
            <motion.div
              key={i}
              className="notification-card"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <div className={`notif-icon ${notif.type}`}>
                <IconComp size={18} />
              </div>
              <div className="notif-text">
                <h4>{notif.title}</h4>
                <p>{notif.text}</p>
              </div>
            </motion.div>
          );
        })
      )}
    </div>
  );
}
