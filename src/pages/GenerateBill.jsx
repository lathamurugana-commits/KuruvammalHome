import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { ArrowLeft, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export default function GenerateBill() {
  const [searchParams] = useSearchParams();
  const preselectedHomeId = searchParams.get('homeId');
  const navigate = useNavigate();

  const [homes, setHomes] = useState([]);
  const [selectedHomeId, setSelectedHomeId] = useState(preselectedHomeId || '');
  
  // Home details which can be edited
  const [homeDetails, setHomeDetails] = useState({
    home_name: '',
    tenant_name: '',
    address: '',
    contact: '',
  });

  // Bill charges
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  
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
    fetchHomes();
  }, []);

  useEffect(() => {
    if (selectedHomeId && homes.length > 0) {
      const home = homes.find((h) => h.id === selectedHomeId);
      if (home) {
        setHomeDetails({
          home_name: home.home_name || '',
          tenant_name: home.tenant_name || '',
          address: home.address || '',
          contact: home.contact || '',
        });
        setCharges({
          rent: home.rent ? Math.round(home.rent).toString() : '',
          water_tax: home.water_tax ? Math.round(home.water_tax).toString() : '',
          current_bill: home.current_bill ? Math.round(home.current_bill).toString() : '',
          cleaning_maintenance: home.cleaning_maintenance ? Math.round(home.cleaning_maintenance).toString() : '',
          additional_charges: '',
        });
        // Default due date to home expiry or empty
        setDueDate(home.expiry_date || '');
      }
    } else {
      setHomeDetails({ home_name: '', tenant_name: '', address: '', contact: '' });
      setCharges({ rent: '', water_tax: '', current_bill: '', cleaning_maintenance: '', additional_charges: '' });
      setDueDate('');
    }
  }, [selectedHomeId, homes]);

  const fetchHomes = async () => {
    try {
      const { data, error } = await supabase.from('homes').select('*').order('home_name');
      if (error) throw error;
      setHomes(data || []);
    } catch (error) {
      toast.error('Failed to load houses');
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

  const generateBillNumber = () => {
    const year = new Date().getFullYear();
    const random = String(Math.floor(Math.random() * 999) + 1).padStart(3, '0');
    return `KHB-${year}-${random}`;
  };

  const handleGenerate = async () => {
    if (!selectedHomeId) {
      toast.error('Please select a house first.');
      return;
    }
    if (!month) {
      toast.error('Please select a billing month.');
      return;
    }

    setLoading(true);
    try {
      // 1. Update home details to reflect user edits
      const { error: homeError } = await supabase.from('homes').update({
        home_name: homeDetails.home_name.trim(),
        tenant_name: homeDetails.tenant_name.trim(),
        address: homeDetails.address.trim(),
        contact: homeDetails.contact.trim(),
        rent: getNumber(charges.rent), // Sync default rent
      }).eq('id', selectedHomeId);
      
      if (homeError) throw homeError;

      // 2. Insert the bill
      const billNumber = generateBillNumber();

      const payload = {
        home_id: selectedHomeId,
        bill_number: billNumber,
        month: month,
        rent: getNumber(charges.rent),
        water_tax: getNumber(charges.water_tax),
        current_bill: getNumber(charges.current_bill),
        cleaning_maintenance: getNumber(charges.cleaning_maintenance),
        additional_charges: getNumber(charges.additional_charges),
        notes: notes.trim(),
        total_amount: total,
        status: 'pending',
        generated_at: new Date().toISOString(),
        expiry_date: dueDate || null, 
      };

      const { data, error } = await supabase.from('bills').insert([payload]).select().single();
      if (error) {
         throw error;
      }

      toast.success('Bill generated successfully!');
      navigate(`/bills/preview/${data.id}`);
    } catch (error) {
      console.error(error);
      const msg = error?.message || 'Failed to generate bill';
      if (msg.includes('additional_charges') || msg.includes('notes')) {
        toast.error('Missing required DB columns! Expected: additional_charges, notes');
      } else {
        toast.error(msg);
      }
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

  return (
    <div className="form-page" style={{ paddingBottom: '80px' }}>
      <button className="back-button" onClick={() => navigate(-1)}>
        <ArrowLeft size={20} />
        Back
      </button>

      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="page-title">Generate Bill</h1>
        <p className="page-subtitle">Invoice Generator Workflow</p>

        <div className="bill-form-section">
          <h3>Step 1: Choose House</h3>
          <div className="form-group">
            <select
              value={selectedHomeId}
              onChange={(e) => setSelectedHomeId(e.target.value)}
            >
              <option value="">-- Select House --</option>
              {homes.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.home_name} {h.tenant_name ? `(${h.tenant_name})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedHomeId && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            
            <div className="bill-form-section">
              <h3>Step 2: Property & Tenant Details</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>House Name</label>
                  <input
                    type="text"
                    value={homeDetails.home_name}
                    onChange={(e) => setHomeDetails(p => ({ ...p, home_name: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label>Tenant Name</label>
                  <input
                    type="text"
                    value={homeDetails.tenant_name}
                    onChange={(e) => setHomeDetails(p => ({ ...p, tenant_name: e.target.value }))}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Address</label>
                  <input
                    type="text"
                    value={homeDetails.address}
                    onChange={(e) => setHomeDetails(p => ({ ...p, address: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label>Contact Number</label>
                  <input
                    type="text"
                    value={homeDetails.contact}
                    onChange={(e) => setHomeDetails(p => ({ ...p, contact: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            <div className="bill-form-section">
              <h3>Step 3: Billing Details</h3>
              
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
                  <label>Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
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
              onClick={handleGenerate}
              disabled={loading}
            >
              {loading ? (
                <div className="spinner" style={{ width: 24, height: 24, borderWidth: 3 }} />
              ) : (
                <>
                  <FileText size={20} />
                  Generate Invoice
                </>
              )}
            </button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
