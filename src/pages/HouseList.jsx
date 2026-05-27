import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Search, Plus, User, MapPin, Phone, FileText, Edit, Trash2, Home } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

export default function HouseList() {
  const [homes, setHomes] = useState([]);
  const [bills, setBills] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [{ data: homesData }, { data: billsData }] = await Promise.all([
        supabase.from('homes').select('*').order('created_at', { ascending: false }),
        supabase.from('bills').select('*').order('generated_at', { ascending: false }),
      ]);
      setHomes(homesData || []);
      setBills(billsData || []);
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('Failed to load homes');
    } finally {
      setLoading(false);
    }
  };

  const getHomeStatus = (homeId) => {
    const homeBills = bills.filter((b) => b.home_id === homeId);
    if (homeBills.length === 0) return 'none';
    const latest = homeBills[0];
    return latest.status || 'none';
  };

  const getTotalAmount = (home) => {
    return (
      (parseFloat(home.rent) || 0) +
      (parseFloat(home.water_tax) || 0) +
      (parseFloat(home.current_bill) || 0) +
      (parseFloat(home.cleaning_maintenance) || 0)
    );
  };

  const handleDelete = async (id) => {
    try {
      // Find the house name to tag bills before deleting
      const house = homes.find((h) => h.id === id);
      const vacatedName = house ? `${house.home_name} - vacated` : 'Unknown - vacated';

      // Preserve bill history: store house name and unlink home_id
      await supabase.from('bills').update({ home_id: null, home_name: vacatedName }).eq('home_id', id);
      const { error } = await supabase.from('homes').delete().eq('id', id);
      if (error) throw error;
      setHomes((prev) => prev.filter((h) => h.id !== id));
      setBills((prev) => prev.map((b) => b.home_id === id ? { ...b, home_id: null, home_name: vacatedName } : b));
      toast.success('Home deleted successfully');
    } catch (error) {
      toast.error('Failed to delete home');
    }
    setDeleteModal(null);
  };

  const filteredHomes = homes.filter((home) => {
    const matchesSearch =
      home.home_name?.toLowerCase().includes(search.toLowerCase()) ||
      home.tenant_name?.toLowerCase().includes(search.toLowerCase());

    if (filter === 'all') return matchesSearch;
    const status = getHomeStatus(home.id);
    return matchesSearch && status === filter;
  });

  if (loading) {
    return (
      <div>
        <div className="skeleton" style={{ height: 48, marginBottom: '1rem' }} />
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton skeleton-card" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <h1 className="page-title">My Houses</h1>
      <p className="page-subtitle">Manage all your rental properties</p>

      <div className="search-bar">
        <Search size={20} />
        <input
          type="text"
          placeholder="Search by name or tenant..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

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

      <AnimatePresence>
        {filteredHomes.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <Home size={36} />
            </div>
            <h3>No houses found</h3>
            <p>Add your first rental property to get started</p>
          </div>
        ) : (
          filteredHomes.map((home, i) => {
            const status = getHomeStatus(home.id);
            return (
              <motion.div
                key={home.id}
                className="house-card"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ delay: i * 0.05 }}
              >
                <div className="house-card-header">
                  <h3>{home.home_name}</h3>
                  <span className={`house-status ${status}`}>
                    {status === 'none' ? 'No Bills' : status}
                  </span>
                </div>

                {home.tenant_name && (
                  <div className="house-card-detail">
                    <User size={14} />
                    <span>{home.tenant_name}</span>
                  </div>
                )}
                {home.address && (
                  <div className="house-card-detail">
                    <MapPin size={14} />
                    <span>{home.address}</span>
                  </div>
                )}
                {home.contact && (
                  <div className="house-card-detail">
                    <Phone size={14} />
                    <span>{home.contact}</span>
                  </div>
                )}

                <div className="house-card-rent">
                  ₹{getTotalAmount(home).toLocaleString('en-IN')}
                  <span> /month</span>
                </div>

                <div className="house-card-actions">
                  <button
                    className="btn-edit"
                    onClick={() => navigate(`/houses/edit/${home.id}`)}
                  >
                    <Edit size={14} />
                    Edit
                  </button>
                  <button
                    className="btn-delete"
                    onClick={() => setDeleteModal(home)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </motion.div>
            );
          })
        )}
      </AnimatePresence>

      <button className="fab" onClick={() => navigate('/houses/add')}>
        <Plus size={28} />
      </button>

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
              <h2>Delete Home?</h2>
              <p>
                Are you sure you want to delete <strong>{deleteModal.home_name}</strong>?
                All bill records will be preserved. This action cannot be undone.
              </p>
              <div className="modal-actions">
                <button className="btn-secondary" onClick={() => setDeleteModal(null)}>
                  Cancel
                </button>
                <button className="btn-primary" style={{ background: 'var(--danger)', marginTop: 0 }} onClick={() => handleDelete(deleteModal.id)}>
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
