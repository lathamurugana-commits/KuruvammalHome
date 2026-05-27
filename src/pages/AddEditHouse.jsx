import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { ArrowLeft, Save, Home } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export default function AddEditHouse() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState({
    home_name: '',
    tenant_name: '',
    address: '',
    contact: '',
    rent: '',
  });
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(isEdit);

  useEffect(() => {
    if (isEdit) {
      fetchHome();
    }
  }, [id]);

  const fetchHome = async () => {
    try {
      const { data, error } = await supabase.from('homes').select('*').eq('id', id).single();
      if (error) throw error;
      if (data) {
        setForm({
          home_name: data.home_name || '',
          tenant_name: data.tenant_name || '',
          address: data.address || '',
          contact: data.contact || '',
          rent: data.rent?.toString() || '',
        });
      }
    } catch (error) {
      toast.error('Failed to load home details');
      navigate('/houses');
    } finally {
      setFetchLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.home_name.trim()) {
      toast.error('Home name is required');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        home_name: form.home_name.trim(),
        tenant_name: form.tenant_name.trim(),
        address: form.address.trim(),
        contact: form.contact.trim(),
        rent: parseFloat(form.rent) || 0,
      };

      let error;
      if (isEdit) {
        ({ error } = await supabase.from('homes').update(payload).eq('id', id));
      } else {
        ({ error } = await supabase.from('homes').insert([payload]));
      }

      if (error) throw error;
      toast.success(isEdit ? 'Home updated!' : 'Home added!');
      navigate('/houses');
    } catch (error) {
      toast.error(error.message || 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <div>
        <div className="skeleton" style={{ height: 36, width: 120, marginBottom: '1.25rem' }} />
        <div className="skeleton" style={{ height: 400, borderRadius: 'var(--radius-lg)' }} />
      </div>
    );
  }

  return (
    <div className="form-page">
      <button className="back-button" onClick={() => navigate('/houses')}>
        <ArrowLeft size={20} />
        Back to Houses
      </button>

      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="page-title">{isEdit ? 'Edit House' : 'Add New House'}</h1>
        <p className="page-subtitle">{isEdit ? 'Update property details' : 'Enter property information'}</p>

        <form onSubmit={handleSubmit}>
          <div className="form-card">
            <div className="form-group">
              <label htmlFor="home_name">Home Name *</label>
              <input
                id="home_name"
                name="home_name"
                type="text"
                placeholder="e.g., House A - Ground Floor"
                value={form.home_name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="tenant_name">Tenant Name</label>
              <input
                id="tenant_name"
                name="tenant_name"
                type="text"
                placeholder="Enter tenant name"
                value={form.tenant_name}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="address">Address</label>
              <input
                id="address"
                name="address"
                type="text"
                placeholder="Enter address"
                value={form.address}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="contact">Contact Number</label>
              <input
                id="contact"
                name="contact"
                type="tel"
                placeholder="Enter phone number"
                value={form.contact}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="rent">Monthly Rent (₹)</label>
              <input
                id="rent"
                name="rent"
                type="number"
                placeholder="0"
                value={form.rent}
                onChange={handleChange}
                min="0"
                step="1"
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
          >
            {loading ? (
              <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
            ) : (
              <>
                <Save size={18} />
                {isEdit ? 'Update Home' : 'Add Home'}
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
