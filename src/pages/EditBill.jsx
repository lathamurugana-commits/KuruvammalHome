import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { ArrowLeft, Save } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export default function EditBill() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [bill, setBill] = useState(null);
  
  // Bill charges
  const [month, setMonth] = useState('');
  
  const [charges, setCharges] = useState({
    rent: '',
    water_tax: '',
    current_bill: '',
    cleaning_maintenance: '',
    additional_charges: '',
  });
  
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);

  useEffect(() => {
    fetchBill();
  }, [id]);

  const fetchBill = async () => {
    try {
      const { data, error } = await supabase
        .from('bills')
        .select('*')
        .eq('id', id)
        .single();
        
      if (error) throw error;
      
      setBill(data);
      setMonth(data.month || '');
      setDueDate(data.expiry_date || '');
      setNotes(data.notes || '');
      setCharges({
        rent: data.rent ? Math.round(data.rent).toString() : '',
        water_tax: data.water_tax ? Math.round(data.water_tax).toString() : '',
        current_bill: data.current_bill ? Math.round(data.current_bill).toString() : '',
        cleaning_maintenance: data.cleaning_maintenance ? Math.round(data.cleaning_maintenance).toString() : '',
        additional_charges: data.additional_charges ? Math.round(data.additional_charges).toString() : '',
      });
      
    } catch (error) {
      toast.error('Failed to load bill');
      navigate('/bills/history');
    } finally {
      setFetchLoading(false);
    }
  };

  const getNumber = (val) => parseFloat(val) || 0;

  const total = 
    getNumber(charges.rent) + 
    getNumber(charges.water_tax) + 
    getNumber(charges.current_bill) + 
    getNumber(charges.cleaning_maintenance) + 
    getNumber(charges.additional_charges);

  const handleUpdate = async () => {
    if (!month) {
      toast.error('Please select a billing month.');
      return;
    }
    if (!dueDate) {
      toast.error('Please select a due date.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        month: month,
        rent: getNumber(charges.rent),
        water_tax: getNumber(charges.water_tax),
        current_bill: getNumber(charges.current_bill),
        cleaning_maintenance: getNumber(charges.cleaning_maintenance),
        additional_charges: getNumber(charges.additional_charges),
        notes: notes.trim(),
        total_amount: total,
        expiry_date: dueDate || null, 
      };

      const { error } = await supabase
        .from('bills')
        .update(payload)
        .eq('id', id);
        
      if (error) throw error;

      toast.success('Bill updated successfully!');
      navigate(`/bills/preview/${id}`);
    } catch (error) {
      console.error(error);
      toast.error(error?.message || 'Failed to update bill');
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <div>
        <div className="skeleton" style={{ height: 36, width: 140, marginBottom: '1.25rem' }} />
        <div className="skeleton" style={{ height: 300, borderRadius: 'var(--radius-lg)' }} />
      </div>
    );
  }

  if (!bill) return null;

  return (
    <div className="form-page" style={{ paddingBottom: '80px' }}>
      <button type="button" className="back-button" onClick={() => navigate(-1)}>
        <ArrowLeft size={20} />
        Back
      </button>

      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="page-title">Edit Bill</h1>
        <p className="page-subtitle">Update bill details for {bill?.bill_number}</p>

        <div className="bill-form-section">
          <h3>Billing Details</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label>Billing Month</label>
              <input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Due Date *</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Rent (₹)</label>
              <input
                type="number"
                value={charges.rent}
                onChange={(e) => setCharges(p => ({ ...p, rent: e.target.value }))}
                min="0" step="1"
              />
            </div>
            <div className="form-group">
              <label>EB Charges (₹)</label>
              <input
                type="number"
                value={charges.current_bill}
                onChange={(e) => setCharges(p => ({ ...p, current_bill: e.target.value }))}
                min="0" step="1"
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Water Tax (₹)</label>
              <input
                type="number"
                value={charges.water_tax}
                onChange={(e) => setCharges(p => ({ ...p, water_tax: e.target.value }))}
                min="0" step="1"
              />
            </div>
            <div className="form-group">
              <label>Maint. & Cleaning (₹)</label>
              <input
                type="number"
                value={charges.cleaning_maintenance}
                onChange={(e) => setCharges(p => ({ ...p, cleaning_maintenance: e.target.value }))}
                min="0" step="1"
              />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>Additional Charges (₹) - Optional</label>
              <input
                type="number"
                value={charges.additional_charges}
                onChange={(e) => setCharges(p => ({ ...p, additional_charges: e.target.value }))}
                min="0" step="1"
              />
            </div>
            <div className="form-group">
              <label>Notes (Optional)</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="bill-form-section">
          <h3>Live Summary</h3>
          <div className="bill-summary-row">
            <span className="label">Rent</span>
            <span className="value">₹{getNumber(charges.rent).toLocaleString('en-IN')}</span>
          </div>
          <div className="bill-summary-row">
            <span className="label">Water Tax</span>
            <span className="value">₹{getNumber(charges.water_tax).toLocaleString('en-IN')}</span>
          </div>
          <div className="bill-summary-row">
            <span className="label">EB Charges</span>
            <span className="value">₹{getNumber(charges.current_bill).toLocaleString('en-IN')}</span>
          </div>
          <div className="bill-summary-row">
            <span className="label">Maintenance</span>
            <span className="value">₹{getNumber(charges.cleaning_maintenance).toLocaleString('en-IN')}</span>
          </div>
          {getNumber(charges.additional_charges) > 0 && (
            <div className="bill-summary-row">
              <span className="label">Additional Charges</span>
              <span className="value">₹{getNumber(charges.additional_charges).toLocaleString('en-IN')}</span>
            </div>
          )}
          <div className="bill-summary-total">
            <span>Total Amount</span>
            <span>₹{total.toLocaleString('en-IN')}</span>
          </div>
        </div>

        <button
          className="btn-primary"
          onClick={handleUpdate}
          disabled={loading}
        >
          {loading ? (
            <div className="spinner" style={{ width: 24, height: 24, borderWidth: 3 }} />
          ) : (
            <>
              <Save size={20} />
              Update Invoice
            </>
          )}
        </button>
      </motion.div>
    </div>
  );
}
