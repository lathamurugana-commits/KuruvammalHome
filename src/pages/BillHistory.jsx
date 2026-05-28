import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { FileText, Eye, CheckCircle, Edit, Trash2, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

export default function BillHistory() {
  const [bills, setBills] = useState([]);
  const [homes, setHomes] = useState([]);
  const [filter, setFilter] = useState('all');
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

  const toggleStatus = async (billId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'paid' ? 'pending' : 'paid';
      const { error } = await supabase.from('bills').update({ status: newStatus }).eq('id', billId);
      if (error) throw error;
      setBills((prev) =>
        prev.map((b) => (b.id === billId ? { ...b, status: newStatus } : b))
      );
      toast.success(`Marked as ${newStatus === 'paid' ? 'paid' : 'unpaid'}!`);
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

  const filteredBills = bills.filter((bill) => {
    if (filter === 'all') return true;
    if (filter === 'none') return !bill.status || bill.status === 'none';
    return bill.status === filter;
  });

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

      <div className="filter-tabs">
        {['all', 'paid', 'pending', 'overdue', 'none'].map((f) => (
          <button
            key={f}
            className={`filter-tab${filter === f ? ' active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === 'none' ? 'No Bills' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {filteredBills.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <FileText size={36} />
          </div>
          <h3>No bills found</h3>
          <p>{bills.length === 0 ? 'Generate your first bill from the house list' : 'No bills match the selected filter'}</p>
        </div>
      ) : (
        filteredBills.map((bill, i) => (
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
            
            <div className="history-card-body">
              <div className="history-info">
                <h4>{getHomeName(bill)}</h4>
                <div className="history-info-meta">
                  {bill.bill_number} &middot; {formatMonth(bill.month)}
                </div>
              </div>

              <div className="history-right-panel">
                <div className="history-amount-status">
                  <div className="history-amount">
                    ₹{(bill.total_amount || 0).toLocaleString('en-IN')}
                  </div>
                  <span className={`house-status ${bill.status} history-status`}>
                    {bill.status}
                  </span>
                </div>

                <div className="history-actions" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px', flexWrap: 'nowrap' }}>
                  <button
                    type="button"
                    className="btn-edit"
                    onClick={() => navigate(`/bills/preview/${bill.id}`)}
                    title="View bill"
                  >
                    <Eye size={16} />
                  </button>
                  <button
                    type="button"
                    className="btn-edit"
                    onClick={() => navigate(`/bills/edit/${bill.id}`)}
                    title="Edit bill"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    type="button"
                    className={bill.status === 'paid' ? "btn-edit" : "btn-success"}
                    onClick={() => toggleStatus(bill.id, bill.status)}
                    title={bill.status === 'paid' ? "Mark as unpaid" : "Mark as paid"}
                  >
                    {bill.status === 'paid' ? <RotateCcw size={16} /> : <CheckCircle size={16} />}
                  </button>
                  <button
                    type="button"
                    className="btn-delete"
                    onClick={() => setDeleteModal(bill)}
                    title="Delete bill"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
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
