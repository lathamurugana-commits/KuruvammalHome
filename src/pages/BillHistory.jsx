import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { FileText, Eye, CheckCircle, Edit, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

export default function BillHistory() {
  const [bills, setBills] = useState([]);
  const [homes, setHomes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [{ data: billsData }, { data: homesData }] = await Promise.all([
        supabase.from('bills').select('*').order('generated_at', { ascending: false }),
        supabase.from('homes').select('id, home_name, tenant_name'),
      ]);
      setBills(billsData || []);
      setHomes(homesData || []);
    } catch (error) {
      toast.error('Failed to load bill history');
    } finally {
      setLoading(false);
    }
  };

  const getHomeName = (bill) => {
    if (bill.home_id) {
      const home = homes.find((h) => h.id === bill.home_id);
      if (home) return home.home_name;
    }
    return bill.home_name || 'Unknown';
  };

  const formatMonth = (monthStr) => {
    if (!monthStr) return '';
    const [year, month] = monthStr.split('-');
    const date = new Date(year, parseInt(month) - 1);
    return date.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
  };

  const handleMarkPaid = async (billId) => {
    try {
      const { error } = await supabase.from('bills').update({ status: 'paid' }).eq('id', billId);
      if (error) throw error;
      setBills((prev) =>
        prev.map((b) => (b.id === billId ? { ...b, status: 'paid' } : b))
      );
      toast.success('Marked as paid!');
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (id) => {
    try {
      const { error } = await supabase.from('bills').delete().eq('id', id);
      if (error) throw error;
      setBills((prev) => prev.filter((b) => b.id !== id));
      toast.success('Bill deleted successfully!');
    } catch (error) {
      toast.error('Failed to delete bill');
    }
    setDeleteModal(null);
  };

  if (loading) {
    return (
      <div>
        <div className="skeleton" style={{ height: 36, width: 140, marginBottom: '1.25rem' }} />
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton skeleton-card" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <h1 className="page-title">Bill History</h1>
      <p className="page-subtitle">View all generated bills</p>

      {bills.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <FileText size={36} />
          </div>
          <h3>No bills yet</h3>
          <p>Generate your first bill from the house list</p>
        </div>
      ) : (
        bills.map((bill, i) => (
          <motion.div
            key={bill.id}
            className="history-card"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
          >
            <div className="history-icon">
              <FileText size={20} />
            </div>
            <div className="history-info">
              <h4>{getHomeName(bill)}</h4>
              <p>{bill.bill_number} · {formatMonth(bill.month)}</p>
            </div>
            <div className="history-amount">
              ₹{(bill.total_amount || 0).toLocaleString('en-IN')}
            </div>
            <span className={`house-status ${bill.status} history-status`}>
              {bill.status}
            </span>
            <div style={{ display: 'flex', gap: '0.35rem', marginLeft: '0.35rem' }}>
              <button
                type="button"
                className="btn-edit"
                style={{ padding: '0.35rem 0.5rem', fontSize: '0.7rem' }}
                onClick={() => navigate(`/bills/preview/${bill.id}`)}
                title="View bill"
              >
                <Eye size={14} />
              </button>
              <button
                type="button"
                className="btn-edit"
                style={{ padding: '0.35rem 0.5rem', fontSize: '0.7rem' }}
                onClick={() => navigate(`/bills/edit/${bill.id}`)}
                title="Edit bill"
              >
                <Edit size={14} />
              </button>
              {bill.status !== 'paid' && (
                <button
                  className="btn-success"
                  style={{ padding: '0.35rem 0.5rem', fontSize: '0.7rem', cursor: 'pointer' }}
                  onClick={() => handleMarkPaid(bill.id)}
                  title="Mark as paid"
                >
                  <CheckCircle size={14} />
                </button>
              )}
              <button
                type="button"
                className="btn-delete"
                style={{ padding: '0.35rem 0.5rem', fontSize: '0.7rem' }}
                onClick={() => setDeleteModal(bill)}
                title="Delete bill"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </motion.div>
        ))
      )}
      {/* Delete confirmation modal */}
      <AnimatePresence>
        {deleteModal && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setDeleteModal(null)}
          >
            <motion.div
              className="modal-content"
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2>Delete Bill?</h2>
              <p>
                Are you sure you want to delete bill <strong>{deleteModal.bill_number}</strong> for <strong>{getHomeName(deleteModal)}</strong>?
                This action cannot be undone.
              </p>
              <div className="modal-actions">
                <button className="btn-secondary" onClick={() => setDeleteModal(null)}>
                  Cancel
                </button>
                <button className="btn-primary" style={{ background: 'var(--danger)' }} onClick={() => handleDelete(deleteModal.id)}>
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
