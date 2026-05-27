import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { ArrowLeft, Download, Share2, CheckCircle, Save } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export default function BillPreview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const billRef = useRef(null);

  const [bill, setBill] = useState(null);
  const [home, setHome] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    fetchBill();
  }, [id]);

  const fetchBill = async () => {
    try {
      const { data: billData, error: billError } = await supabase
        .from('bills')
        .select('*')
        .eq('id', id)
        .single();

      if (billError) throw billError;
      setBill(billData);

      if (billData.home_id) {
        const { data: homeData } = await supabase
          .from('homes')
          .select('*')
          .eq('id', billData.home_id)
          .single();
        setHome(homeData);
      }
    } catch (error) {
      toast.error('Failed to load bill');
      navigate('/bills/history');
    } finally {
      setLoading(false);
    }
  };

  const formatMonth = (monthStr) => {
    if (!monthStr) return '';
    const [year, month] = monthStr.split('-');
    const date = new Date(year, parseInt(month) - 1);
    return date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '--';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const handleMarkPaid = async () => {
    try {
      const { error } = await supabase
        .from('bills')
        .update({ status: 'paid' })
        .eq('id', id);
      if (error) throw error;
      setBill((prev) => ({ ...prev, status: 'paid' }));
      toast.success('Bill marked as paid!');
    } catch (error) {
      toast.error('Failed to mark as paid');
    }
  };

  const handleSaveBill = () => {
    toast.success('Bill saved!');
    navigate('/bills/history');
  };

  const handleDownloadPDF = async () => {
    if (!billRef.current) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(billRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#FFFFFF',
      });
      const imgData = canvas.toDataURL('image/png');
      const pdfWidth = billRef.current.offsetWidth;
      const pdfHeight = billRef.current.offsetHeight;
      const pdf = new jsPDF({
        orientation: pdfWidth > pdfHeight ? 'l' : 'p',
        unit: 'px',
        format: [pdfWidth, pdfHeight]
      });
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Bill-${bill.bill_number}.pdf`);
      toast.success('PDF downloaded!');
    } catch (error) {
      console.error('PDF error:', error);
      toast.error('Failed to generate PDF');
    } finally {
      setDownloading(false);
    }
  };

  const handleShareWhatsApp = async () => {
    if (!billRef.current) return;
    setSharing(true);
    try {
      const canvas = await html2canvas(billRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#FFFFFF',
      });

      // Try Web Share API first (mobile)
      if (navigator.share && navigator.canShare) {
        const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
        const file = new File([blob], `Bill-${bill.bill_number}.png`, { type: 'image/png' });

        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: `Rent Bill - ${bill.bill_number}`,
            text: `Rent bill for ${home?.home_name || 'Property'} - ${formatMonth(bill.month)}\nTotal: ₹${bill.total_amount?.toLocaleString('en-IN')}`,
            files: [file],
          });
          toast.success('Shared successfully!');
          setSharing(false);
          return;
        }
      }

      // Fallback: WhatsApp deep link with text
      const text = encodeURIComponent(
        `🏠 *KURUVAMMAL HOME*\n📄 Bill: ${bill.bill_number}\n👤 Tenant: ${home?.tenant_name || '--'}\n📅 Month: ${formatMonth(bill.month)}\n💰 Total: ₹${bill.total_amount?.toLocaleString('en-IN')}\n\nContact: Kuruvammal Home`
      );
      const phoneNumber = home?.contact ? home.contact.replace(/\D/g, '') : '';
      const whatsappUrl = phoneNumber
        ? `https://wa.me/${phoneNumber.startsWith('91') ? phoneNumber : '91' + phoneNumber}?text=${text}`
        : `https://wa.me/?text=${text}`;
      window.open(whatsappUrl, '_blank');
      toast.success('Opening WhatsApp...');
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Share error:', error);
        toast.error('Failed to share');
      }
    } finally {
      setSharing(false);
    }
  };

  if (loading) {
    return (
      <div>
        <div className="skeleton" style={{ height: 36, width: 100, marginBottom: '1.25rem' }} />
        <div className="skeleton" style={{ height: 500, borderRadius: 'var(--radius-lg)' }} />
      </div>
    );
  }

  if (!bill) return null;

  return (
    <div>
      <button className="back-button" onClick={() => navigate(-1)}>
        <ArrowLeft size={20} />
        Back
      </button>

      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
        <div className="bill-preview-container">
          <div className="bill-preview" ref={billRef}>
            {/* Header */}
            <div className="bill-header">
              <h1>KURUVAMMAL HOME</h1>
              <p className="bill-address">Rent & Property Management</p>
            </div>

            {/* Meta */}
            <div className="bill-meta">
              <div className="bill-meta-item">
                <div className="label">Bill No.</div>
                <div className="value">{bill.bill_number}</div>
              </div>
              <div className="bill-meta-item">
                <div className="label">Month</div>
                <div className="value">{formatMonth(bill.month)}</div>
              </div>
              <div className="bill-meta-item">
                <div className="label">Date</div>
                <div className="value">{formatDate(bill.generated_at)}</div>
              </div>
            </div>

            {/* Tenant Info */}
            {home ? (
              <div className="bill-tenant-info">
                <h4>Billed To</h4>
                <p>{home.tenant_name || home.home_name}</p>
                {home.address && <p style={{ fontSize: '0.75rem', color: 'var(--gray)', marginTop: 4 }}>{home.address}</p>}
              </div>
            ) : bill.home_name ? (
              <div className="bill-tenant-info">
                <h4>Billed To</h4>
                <p>{bill.home_name}</p>
              </div>
            ) : null}

            {/* Line Items */}
            <div className="bill-items">
              <div className="bill-item-row">
                <span className="item-label">Rent</span>
                <span className="item-value">₹{(bill.rent || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="bill-item-row">
                <span className="item-label">Water Tax</span>
                <span className="item-value">₹{(bill.water_tax || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="bill-item-row">
                <span className="item-label">EB Bill (Current)</span>
                <span className="item-value">₹{(bill.current_bill || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="bill-item-row">
                <span className="item-label">Cleaning & Maintenance</span>
                <span className="item-value">₹{(bill.cleaning_maintenance || 0).toLocaleString('en-IN')}</span>
              </div>
              {bill.additional_charges > 0 && (
                <div className="bill-item-row">
                  <span className="item-label">Additional Charges</span>
                  <span className="item-value">₹{bill.additional_charges.toLocaleString('en-IN')}</span>
                </div>
              )}
            </div>

            {/* Total */}
            <div className="bill-total-row">
              <span className="total-label">Total Amount</span>
              <span className="total-value">₹{(bill.total_amount || 0).toLocaleString('en-IN')}</span>
            </div>
            
            {bill.notes && (
              <div className="bill-notes" style={{ marginTop: '1rem', padding: '0.75rem', background: 'var(--creamy-white, #fbf7f4)', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', color: 'var(--text-light)' }}>
                <strong style={{ display: 'block', marginBottom: '0.25rem', color: 'var(--text)' }}>Notes:</strong>
                {bill.notes}
              </div>
            )}

            {/* Footer */}
            <div className="bill-footer">
              {bill.expiry_date && (
                <div className="bill-expiry-badge">
                  Bill Expiry: {formatDate(bill.expiry_date)}
                </div>
              )}
              <p className="bill-footer-info" style={{ marginTop: '0.75rem' }}>
                Thank you.
              </p>
              <p className="bill-footer-brand">Powered by Hema</p>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="bill-actions" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '1.5rem' }}>
          <button className="btn-pdf" onClick={handleDownloadPDF} disabled={downloading}>
            <Download size={18} />
            {downloading ? 'Saving...' : 'Download PDF'}
          </button>
          <button className="btn-whatsapp" onClick={handleShareWhatsApp} disabled={sharing}>
            <Share2 size={18} />
            {sharing ? 'Sharing...' : 'WhatsApp'}
          </button>
          {bill.status !== 'paid' && (
            <button className="btn-primary" onClick={handleMarkPaid} style={{ gridColumn: '1 / -1', background: 'var(--success, #10b981)', border: 'none' }}>
              <CheckCircle size={18} />
              Mark as Paid
            </button>
          )}
          <button className="btn-secondary" onClick={handleSaveBill} style={{ gridColumn: '1 / -1' }}>
            <Save size={18} />
            Save Bill
          </button>
        </div>
      </motion.div>
    </div>
  );
}
