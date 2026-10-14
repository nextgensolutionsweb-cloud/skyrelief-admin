'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Users, Search, ChevronRight, ChevronLeft, Wallet, CreditCard, 
  DollarSign, CheckCircle2, Shield, Eye, ArrowUpRight, TrendingUp,
  FileSpreadsheet, Printer, Download, Calendar, Filter, X, RefreshCw
} from 'lucide-react';
import { formatCurrency, apiRequest, showToast } from '@/lib/api';
import * as XLSX from 'xlsx';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.skyrelief.org';

const getImageUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
};

const statusStyle = {
  1: { bg: '#dcfce7', color: '#15803d', label: 'Active' },
  2: { bg: '#fef3c7', color: '#92400e', label: 'Suspended' },
  0: { bg: '#fef3c7', color: '#92400e', label: 'Suspended' },
  '-1': { bg: '#fee2e2', color: '#991b1b', label: 'Deleted' },
};

const avatarColors = ['#0ea5e9', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#6366f1'];

export default function CollectionAgentsPage() {
  const router = useRouter();
  const [list, setList] = useState([]);
  const [allAgents, setAllAgents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [imageErrors, setImageErrors] = useState({});

  // Pagination states
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState(null);

  // Deposit Report Modal States
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportDeposits, setReportDeposits] = useState([]);
  
  // Date states default: current month 1st to today
  const getFirstDayOfMonth = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  };
  const getTodayDate = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const [fromDate, setFromDate] = useState(getFirstDayOfMonth());
  const [toDate, setToDate] = useState(getTodayDate());
  const [selectedReportAgent, setSelectedReportAgent] = useState('ALL');

  // Zoom lightbox state for proof
  const [zoomImage, setZoomImage] = useState(null);
  const [zoomTitle, setZoomTitle] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchInput]);

  const fetchAgents = async () => {
    setLoading(true);
    try {
      const res = await apiRequest(`/api/agent/get-all?page=${page}&limit=12&search=${encodeURIComponent(search)}`);
      if (res.s === 1 && Array.isArray(res.r)) {
        setList(res.r);
        setMeta(res.meta || null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllAgentsForDropdown = async () => {
    try {
      const res = await apiRequest(`/api/agent/get-all?limit=300`);
      if (res.s === 1 && Array.isArray(res.r)) {
        setAllAgents(res.r);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAgents();
    fetchAllAgentsForDropdown();
  }, [page, search]);

  const fetchDepositsReport = async () => {
    setReportLoading(true);
    try {
      let endpoint = `/api/agent/deposits?from_date=${fromDate}&to_date=${toDate}`;
      if (selectedReportAgent && selectedReportAgent !== 'ALL') {
        endpoint += `&agent_id=${selectedReportAgent}`;
      }
      const res = await apiRequest(endpoint);
      if (res.s === 1 && Array.isArray(res.r)) {
        setReportDeposits(res.r);
      } else {
        setReportDeposits([]);
      }
    } catch (err) {
      console.error('Failed to fetch deposits report:', err);
      showToast('Failed to fetch deposits', 'error');
    } finally {
      setReportLoading(false);
    }
  };

  const openReportModal = () => {
    setShowReportModal(true);
    fetchDepositsReport();
  };

  // Export to Excel (Excludes commission completely as requested)
  const handleExportExcel = () => {
    if (reportDeposits.length === 0) {
      showToast('No deposit receipts to export', 'error');
      return;
    }

    const totalAmount = reportDeposits.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

    const excelData = reportDeposits.map((d, idx) => ({
      'Receipt No': `RCP-${d.id}`,
      'Date': new Date(d.created_at).toLocaleDateString('en-GB'),
      'Agent Code': d.agent_code || '—',
      'Agent Name': `${d.first_name || ''} ${d.last_name || ''}`.trim() || 'Agent',
      'Phone': d.phone || '—',
      'City / Location': d.city || '—',
      'Payment Mode': d.payment_mode || 'Cash',
      'Reference Note / UTR': d.reference_note || '—',
      'Deposited Amount (INR)': Number(d.amount || 0),
    }));

    // Add Total Row at bottom
    excelData.push({
      'Receipt No': 'GRAND TOTAL',
      'Date': `${fromDate} to ${toDate}`,
      'Agent Code': '',
      'Agent Name': '',
      'Phone': '',
      'City / Location': '',
      'Payment Mode': '',
      'Reference Note / UTR': `Total ${reportDeposits.length} Receipts`,
      'Deposited Amount (INR)': totalAmount,
    });

    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Deposit Receipts');
    XLSX.writeFile(wb, `SkyRelief_Deposit_Receipts_${fromDate}_to_${toDate}.xlsx`);
    showToast('Report exported successfully!', 'success');
  };

  // Print formatted receipt statement via clean isolated A4 print document
  const handlePrintReceipts = () => {
    if (reportDeposits.length === 0) {
      showToast('No deposit receipts to print', 'error');
      return;
    }

    const agentScopeText = selectedReportAgent === 'ALL'
      ? 'All Registered Agents (Organization-Wide)'
      : `${selectedAgentObj?.first_name || ''} ${selectedAgentObj?.last_name || ''} (${selectedAgentObj?.agent_code || `ID ${selectedReportAgent}`})`;

    const rowsHtml = reportDeposits.map((item) => {
      const dateStr = new Date(item.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      const agentName = `${item.first_name || ''} ${item.last_name || ''}`.trim() || `Agent #${item.agent_id}`;
      const agentCode = item.agent_code || `ID: ${item.agent_id}`;
      const phone = item.phone ? ` • ${item.phone}` : '';
      const amount = Number(item.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });
      
      return `
        <tr>
          <td style="padding: 8px 10px; font-family: monospace; font-weight: 800; color: #1d4ed8; border-bottom: 1px solid #e2e8f0; white-space: nowrap;">
            RCP-${item.id}
          </td>
          <td style="padding: 8px 10px; color: #334155; font-weight: 600; border-bottom: 1px solid #e2e8f0; white-space: nowrap;">
            ${dateStr}
          </td>
          <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0;">
            <div style="font-weight: 800; color: #0f172a; font-size: 11px;">${agentName}</div>
            <div style="font-size: 9.5px; color: #059669; font-family: monospace; font-weight: 700;">${agentCode}${phone}</div>
          </td>
          <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; white-space: nowrap;">
            <span style="background: #f1f5f9; padding: 2px 7px; border-radius: 4px; font-weight: 750; font-size: 9.5px; color: #334155; border: 1px solid #e2e8f0;">
              ${item.payment_mode || 'Cash'}
            </span>
          </td>
          <td style="padding: 8px 10px; font-size: 10px; color: #64748b; border-bottom: 1px solid #e2e8f0;">
            ${item.reference_note || '—'}
          </td>
          <td style="padding: 8px 10px; text-align: right; font-weight: 900; color: #047857; font-size: 12px; border-bottom: 1px solid #e2e8f0; white-space: nowrap;">
            + ₹${amount}
          </td>
        </tr>
      `;
    }).join('');

    const printHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>SkyRelief_Deposit_Receipts_${fromDate}_to_${toDate}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 15mm 15mm 15mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
      margin: 0;
      padding: 0;
      background: #ffffff;
      color: #0f172a;
      font-size: 11px;
      line-height: 1.4;
    }
    .wrapper {
      width: 100%;
      margin: 0 auto;
    }
    .header-bar {
      border-bottom: 2.5px solid #0f172a;
      padding-bottom: 12px;
      margin-bottom: 14px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .brand-title {
      font-size: 20px;
      font-weight: 900;
      color: #0f172a;
      letter-spacing: -0.025em;
      margin: 0;
    }
    .brand-sub {
      font-size: 10px;
      font-weight: 800;
      color: #475569;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-top: 3px;
    }
    .brand-contact {
      font-size: 9.5px;
      color: #64748b;
      margin-top: 2px;
    }
    .period-box {
      text-align: right;
    }
    .period-dates {
      font-size: 13px;
      font-weight: 900;
      color: #047857;
      margin-top: 2px;
    }
    .scope-box {
      background: #ecfdf5 !important;
      border: 1.5px solid #a7f3d0;
      border-radius: 8px;
      padding: 9px 14px;
      margin-bottom: 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 11px;
    }
    .kpi-grid {
      display: flex;
      gap: 12px;
      margin-bottom: 16px;
    }
    .kpi-card {
      flex: 1;
      background: #f8fafc !important;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 10px 14px;
    }
    .kpi-title {
      font-size: 9px;
      font-weight: 800;
      text-transform: uppercase;
      color: #64748b;
    }
    .kpi-num {
      font-size: 17px;
      font-weight: 900;
      margin-top: 3px;
    }
    table.receipts-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 18px;
    }
    table.receipts-table th {
      background: #f1f5f9 !important;
      color: #334155;
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      padding: 8px 10px;
      border-bottom: 2px solid #cbd5e1;
      border-top: 1px solid #e2e8f0;
      text-align: left;
    }
    table.receipts-table tfoot td {
      background: #ecfdf5 !important;
      border-top: 2px solid #059669;
      color: #064e3b;
      font-weight: 900;
      font-size: 11.5px;
      padding: 10px;
    }
    table.receipts-table tr {
      page-break-inside: avoid;
    }
    .footer-sign {
      margin-top: 26px;
      padding-top: 12px;
      border-top: 1px dashed #cbd5e1;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      page-break-inside: avoid;
    }
    .sign-line {
      width: 170px;
      border-bottom: 1.5px solid #0f172a;
      margin-bottom: 4px;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header-bar">
      <div>
        <div class="brand-title">SKYRELIEF FOUNDATION</div>
        <div class="brand-sub">Official Agent Deposits & Collections Receipt Statement</div>
        <div class="brand-contact">Ahmedabad, Gujarat • Website: skyrelief.org</div>
      </div>
      <div class="period-box">
        <div style="font-size: 9.5px; color: #64748b;">Statement Period:</div>
        <div class="period-dates">${fromDate} to ${toDate}</div>
        <div style="font-size: 9.5px; color: #64748b; margin-top: 2px;">Generated: ${new Date().toLocaleString('en-GB')}</div>
      </div>
    </div>

    <div class="scope-box">
      <div style="color: #065f46; font-weight: 800;">
        Agent Scope: <span style="color: #047857;">${agentScopeText}</span>
      </div>
      <div style="background: #d1fae5; color: #047857; font-weight: 800; font-size: 10px; padding: 2px 8px; border-radius: 9999px;">
        ✓ Pure Jama Deposits Only (Commissions Excluded)
      </div>
    </div>

    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-title">Total Deposited Amount</div>
        <div class="kpi-num" style="color: #047857;">₹${Number(totalReportDeposit).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-title">Total Receipts Count</div>
        <div class="kpi-num" style="color: #0f172a;">${reportDeposits.length} Receipts</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-title">Deposit Status</div>
        <div class="kpi-num" style="color: #16a34a; font-size: 13.5px;">● Verified & Deposited</div>
      </div>
    </div>

    <table class="receipts-table">
      <thead>
        <tr>
          <th>Receipt #</th>
          <th>Date</th>
          <th>Agent Info</th>
          <th>Mode</th>
          <th>Ref / Remarks</th>
          <th style="text-align: right;">Deposited (₹)</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
      <tfoot>
        <tr>
          <td colspan="5" style="text-transform: uppercase;">Grand Total Deposited (${reportDeposits.length} Receipts)</td>
          <td style="text-align: right;">₹${Number(totalReportDeposit).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
        </tr>
      </tfoot>
    </table>

    <div class="footer-sign">
      <div>
        <div style="color: #64748b; font-size: 9.5px;">Prepared By: <strong>Admin Finance Desk</strong></div>
        <div style="color: #94a3b8; font-size: 9px; margin-top: 2px;">SkyRelief ERP Official Financial Statement</div>
      </div>
      <div style="text-align: center;">
        <div class="sign-line"></div>
        <div style="font-weight: 800; color: #0f172a; font-size: 11px;">Authorized Signatory</div>
      </div>
    </div>
  </div>
</body>
</html>`;

    // Create an invisible iframe for isolated printing
    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = '0';
    document.body.appendChild(printFrame);

    const frameDoc = printFrame.contentWindow.document;
    frameDoc.open();
    frameDoc.write(printHtml);
    frameDoc.close();

    printFrame.contentWindow.focus();
    setTimeout(() => {
      printFrame.contentWindow.print();
      setTimeout(() => {
        try {
          document.body.removeChild(printFrame);
        } catch {
          // ignore cleanup error if already removed
        }
      }, 1500);
    }, 250);
  };

  const filteredList = list.filter((item) => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Active') return item.status === 1;
    if (activeFilter === 'Suspended') return item.status === 2 || item.status === 0;
    return true;
  });

  const totalReportDeposit = reportDeposits.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  const selectedAgentObj = allAgents.find(a => String(a.id) === String(selectedReportAgent));

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #065f46 0%, #047857 50%, #0d9488 100%)',
        borderRadius: '24px',
        padding: '28px 32px',
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '20px',
        boxShadow: '0 8px 30px rgba(6, 95, 70, 0.25)',
      }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: '9999px', fontSize: '0.74rem', fontWeight: '800', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '8px' }}>
            <Wallet size={13} /> Financial Management
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: '900', letterSpacing: '-0.025em', margin: 0 }}>
            Agents & Wallets
          </h1>
          <p style={{ margin: '6px 0 0', fontSize: '0.86rem', color: '#a7f3d0', maxWidth: '600px' }}>
            Inspect agent collection balances, joining fee commissions, installment rates, and payout histories.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Generate Report Button */}
          <button
            onClick={openReportModal}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#ffffff',
              border: '1.5px solid #6ee7b7',
              fontSize: '0.84rem',
              fontWeight: '800',
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(16, 185, 129, 0.35)',
              transition: 'all 0.2s',
            }}
          >
            <FileSpreadsheet size={16} />
            <span>Generate Deposit Report</span>
          </button>

          <button
            onClick={() => router.push('/more-collection/campaigns')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              borderRadius: '14px',
              background: 'rgba(255,255,255,0.15)',
              backdropFilter: 'blur(10px)',
              color: '#ffffff',
              border: '1px solid rgba(255,255,255,0.3)',
              fontSize: '0.84rem',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <CreditCard size={16} />
            <span>Campaigns</span>
          </button>
          
          <button
            onClick={() => router.push('/more-collection/payment-requests')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              borderRadius: '14px',
              background: '#ffffff',
              color: '#065f46',
              border: 'none',
              fontSize: '0.84rem',
              fontWeight: '800',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(0,0,0,0.12)',
              transition: 'all 0.2s',
            }}
          >
            <CheckCircle2 size={16} color="#059669" />
            <span>Verify Payments & QR</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="card" style={{ padding: '16px 20px', borderRadius: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div style={{ position: 'relative', width: '320px', maxWidth: '100%' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Search by Agent name, code, phone..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="input-field"
            style={{ paddingLeft: '36px', height: '40px', fontSize: '0.84rem' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {['All', 'Active', 'Suspended'].map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              style={{
                padding: '7px 16px',
                borderRadius: '10px',
                fontSize: '0.82rem',
                fontWeight: activeFilter === filter ? '800' : '600',
                border: '1.5px solid',
                borderColor: activeFilter === filter ? '#059669' : '#e2e8f0',
                background: activeFilter === filter ? '#ecfdf5' : '#ffffff',
                color: activeFilter === filter ? '#065f46' : '#64748b',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Agents Financial Table */}
      <div className="card" style={{ padding: '0', overflow: 'hidden', borderRadius: '18px' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '850px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid #e2e8f0' }}>
                <th style={{ padding: '14px 20px', fontSize: '0.72rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Agent Profile</th>
                <th style={{ padding: '14px 20px', fontSize: '0.72rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Status</th>
                <th style={{ padding: '14px 20px', fontSize: '0.72rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Commission Rates</th>
                <th style={{ padding: '14px 20px', fontSize: '0.72rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>City / Contact</th>
                <th style={{ padding: '14px 20px', fontSize: '0.72rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                    <div className="animate-pulse" style={{ fontSize: '0.9rem', fontWeight: '700' }}>Loading agents data...</div>
                  </td>
                </tr>
              ) : filteredList.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: '0.88rem' }}>
                    No agents found matching the criteria.
                  </td>
                </tr>
              ) : (
                filteredList.map((agent, index) => {
                  const status = statusStyle[agent.status] || { bg: '#f1f5f9', color: '#475569', label: 'Unknown' };
                  const avatarColor = avatarColors[index % avatarColors.length];
                  const fullName = `${agent.first_name || ''} ${agent.last_name || ''}`.trim() || 'Agent';
                  const initials = fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
                  const photoUrl = getImageUrl(agent.profile || agent.profile_photo);
                  const hasPhoto = Boolean(photoUrl) && !imageErrors[agent.id];

                  return (
                    <tr 
                      key={agent.id}
                      style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s ease' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#f0fdf4')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      {/* Profile Column */}
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                          <div style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '12px',
                            background: avatarColor,
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: '800',
                            fontSize: '0.9rem',
                            flexShrink: 0,
                            overflow: 'hidden',
                            border: '1.5px solid #ffffff',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                          }}>
                            {hasPhoto ? (
                              <img
                                src={photoUrl}
                                alt=""
                                onError={() => setImageErrors((prev) => ({ ...prev, [agent.id]: true }))}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            ) : (
                              initials
                            )}
                          </div>
                          <div>
                            <div style={{ fontSize: '0.92rem', fontWeight: '800', color: '#0f172a' }}>
                              {fullName}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: '#059669', fontWeight: '700', fontFamily: 'monospace', marginTop: '2px' }}>
                              {agent.agent_code || 'CODE PENDING'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Status Column */}
                      <td style={{ padding: '16px 20px' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '4px 10px',
                          borderRadius: '9999px',
                          fontSize: '0.74rem',
                          fontWeight: '800',
                          background: status.bg,
                          color: status.color,
                        }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: status.color }} />
                          {status.label}
                        </span>
                      </td>

                      {/* Commissions Column */}
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                          <div style={{ background: '#ecfdf5', padding: '4px 10px', borderRadius: '8px', border: '1px solid #a7f3d0' }}>
                            <span style={{ fontSize: '0.65rem', color: '#065f46', fontWeight: '700', display: 'block', textTransform: 'uppercase' }}>Joining Fee</span>
                            <span style={{ fontSize: '0.85rem', fontWeight: '800', color: '#047857' }}>
                              {agent.joining_fee_commission_percent !== null && agent.joining_fee_commission_percent !== undefined ? `${agent.joining_fee_commission_percent}%` : '0%'}
                            </span>
                          </div>
                          <div style={{ background: '#eff6ff', padding: '4px 10px', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
                            <span style={{ fontSize: '0.65rem', color: '#1e40af', fontWeight: '700', display: 'block', textTransform: 'uppercase' }}>Installments</span>
                            <span style={{ fontSize: '0.85rem', fontWeight: '800', color: '#1d4ed8' }}>
                              {agent.installment_commission_percent !== null && agent.installment_commission_percent !== undefined ? `${agent.installment_commission_percent}%` : '0%'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Contact Column */}
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ fontSize: '0.84rem', fontWeight: '700', color: '#334155' }}>
                          {agent.phone || 'No Phone'}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
                          {agent.city || agent.state || 'Location unassigned'}
                        </div>
                      </td>

                      {/* Actions Column */}
                      <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                        <button
                          onClick={() => router.push(`/more-collection/agents/${agent.id}`)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '8px 14px',
                            borderRadius: '10px',
                            fontSize: '0.8rem',
                            fontWeight: '800',
                            color: '#ffffff',
                            background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                            border: 'none',
                            cursor: 'pointer',
                            boxShadow: '0 2px 8px rgba(5, 150, 105, 0.25)',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <Wallet size={14} />
                          <span>View Wallet</span>
                          <ChevronRight size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {meta && meta.total > 0 && (
          <div style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', flexWrap: 'wrap', gap: '10px', background: '#ffffff' }}>
            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
              Showing <strong>{((page - 1) * 12) + 1}</strong> to <strong>{Math.min(page * 12, meta.total)}</strong> of <strong>{meta.total}</strong> agents
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  fontWeight: '700',
                  border: '1.5px solid #e2e8f0',
                  background: page <= 1 ? '#f8fafc' : '#ffffff',
                  color: page <= 1 ? '#cbd5e1' : '#334155',
                  cursor: page <= 1 ? 'not-allowed' : 'pointer',
                }}
              >
                Previous
              </button>
              <button
                disabled={page * 12 >= meta.total}
                onClick={() => setPage((p) => p + 1)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  fontWeight: '700',
                  border: '1.5px solid #e2e8f0',
                  background: page * 12 >= meta.total ? '#f8fafc' : '#ffffff',
                  color: page * 12 >= meta.total ? '#cbd5e1' : '#334155',
                  cursor: page * 12 >= meta.total ? 'not-allowed' : 'pointer',
                }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── DEPOSIT RECEIPTS REPORT GENERATION MODAL ───────────────────────── */}
      {showReportModal && (
        <div className="report-modal-overlay" style={{ position: 'fixed', inset: 0, zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          {/* Overlay */}
          <div 
            className="report-modal-backdrop no-print"
            style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)' }} 
            onClick={() => setShowReportModal(false)} 
          />

          {/* Modal Container */}
          <div 
            id="printable-deposit-report"
            style={{ 
              position: 'relative', 
              background: '#ffffff', 
              borderRadius: '24px', 
              width: '1050px', 
              maxWidth: '96vw', 
              maxHeight: '92vh', 
              overflowY: 'auto', 
              boxShadow: '0 25px 60px -12px rgba(0, 0, 0, 0.25)', 
              display: 'flex', 
              flexDirection: 'column' 
            }}
          >
            
            {/* Modal Header (Non-print controls) */}
            <div className="no-print" style={{ padding: '20px 28px', borderBottom: '1.5px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', borderTopLeftRadius: '24px', borderTopRightRadius: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileSpreadsheet size={22} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.15rem', fontWeight: '900', color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
                    Generate Agent Deposits Report (Receipts)
                  </h2>
                  <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '2px 0 0' }}>
                    Download or print deposits statement. Commissions are strictly excluded.
                  </p>
                </div>
              </div>

              <button 
                onClick={() => setShowReportModal(false)}
                style={{ padding: '8px', borderRadius: '10px', background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#64748b', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Date & Agent Selection Bar */}
              <div className="no-print" style={{ background: '#f8fafc', padding: '18px 20px', borderRadius: '16px', border: '1.5px solid #e2e8f0', display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center' }}>
                  
                  {/* From Date */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '750', color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>
                      From Date
                    </label>
                    <input 
                      type="date"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      style={{ padding: '8px 12px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '0.85rem', fontWeight: '700', color: '#0f172a', outline: 'none' }}
                    />
                  </div>

                  {/* To Date */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '750', color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>
                      To Date
                    </label>
                    <input 
                      type="date"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                      style={{ padding: '8px 12px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '0.85rem', fontWeight: '700', color: '#0f172a', outline: 'none' }}
                    />
                  </div>

                  {/* Agent Selector */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '750', color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>
                      Agent Filter
                    </label>
                    <select
                      value={selectedReportAgent}
                      onChange={(e) => setSelectedReportAgent(e.target.value)}
                      style={{ padding: '8px 14px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '0.85rem', fontWeight: '700', color: '#0f172a', minWidth: '220px', outline: 'none' }}
                    >
                      <option value="ALL">All Agents (Complete Organization)</option>
                      {allAgents.map(a => (
                        <option key={a.id} value={a.id}>
                          {a.first_name} {a.last_name} ({a.agent_code || `ID ${a.id}`})
                        </option>
                      ))}
                    </select>
                  </div>

                </div>

                {/* Filter Trigger Button */}
                <button
                  onClick={fetchDepositsReport}
                  disabled={reportLoading}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '9px 18px',
                    borderRadius: '12px',
                    background: '#059669',
                    color: '#ffffff',
                    border: 'none',
                    fontSize: '0.84rem',
                    fontWeight: '800',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(5, 150, 105, 0.3)'
                  }}
                >
                  <Filter size={15} />
                  <span>Apply Filter</span>
                </button>
              </div>

              {/* ── OFFICIAL PRINTABLE RECEIPT STATEMENT VIEW ─────────────────── */}
              <div style={{ border: '2px solid #e2e8f0', borderRadius: '18px', padding: '24px', background: '#ffffff' }}>
                
                {/* Official Letterhead Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #0f172a', paddingBottom: '16px', marginBottom: '18px', flexWrap: 'wrap', gap: '14px' }}>
                  <div>
                    <div style={{ fontSize: '1.35rem', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.025em' }}>
                      SKYRELIEF FOUNDATION
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#475569', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: '2px' }}>
                      Official Agent Deposits & Collections Receipt Statement
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '3px' }}>
                      Ahmedabad, Gujarat • Website: skyrelief.org
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.76rem', color: '#64748b' }}>Statement Period:</div>
                    <div style={{ fontSize: '0.92rem', fontWeight: '800', color: '#059669' }}>
                      {fromDate} to {toDate}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '3px' }}>
                      Generated On: {new Date().toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Scope & Notice Banner */}
                <div style={{ background: '#ecfdf5', padding: '12px 18px', borderRadius: '12px', border: '1.5px solid #a7f3d0', marginBottom: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ fontSize: '0.82rem', color: '#065f46', fontWeight: '700' }}>
                    Agent Scope: <span style={{ color: '#047857', fontWeight: '800' }}>{selectedReportAgent === 'ALL' ? 'All Registered Agents' : `${selectedAgentObj?.first_name || ''} ${selectedAgentObj?.last_name || ''} (${selectedAgentObj?.agent_code || ''})`}</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#047857', fontWeight: '700', background: '#d1fae5', padding: '3px 10px', borderRadius: '9999px' }}>
                    ✓ Excludes Commissions (Pure Jama Deposits Only)
                  </div>
                </div>

                {/* Summary KPI Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '20px' }}>
                  <div style={{ background: '#f8fafc', padding: '14px 18px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: '750', color: '#64748b', textTransform: 'uppercase' }}>Total Deposited Amount</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#047857', marginTop: '4px' }}>
                      {formatCurrency(totalReportDeposit)}
                    </div>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '14px 18px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: '750', color: '#64748b', textTransform: 'uppercase' }}>Total Receipts Count</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#0f172a', marginTop: '4px' }}>
                      {reportDeposits.length} Receipts
                    </div>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '14px 18px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: '750', color: '#64748b', textTransform: 'uppercase' }}>Deposit Status</div>
                    <div style={{ fontSize: '1rem', fontWeight: '800', color: '#16a34a', marginTop: '8px' }}>
                      ● Verified & Deposited
                    </div>
                  </div>
                </div>

                {/* Receipts Statement Table */}
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '750px' }}>
                    <thead>
                      <tr style={{ background: '#f1f5f9', borderBottom: '1.5px solid #cbd5e1' }}>
                        <th style={{ padding: '10px 14px', fontSize: '0.72rem', fontWeight: '800', color: '#334155', textTransform: 'uppercase' }}>Receipt #</th>
                        <th style={{ padding: '10px 14px', fontSize: '0.72rem', fontWeight: '800', color: '#334155', textTransform: 'uppercase' }}>Date</th>
                        <th style={{ padding: '10px 14px', fontSize: '0.72rem', fontWeight: '800', color: '#334155', textTransform: 'uppercase' }}>Agent Info</th>
                        <th style={{ padding: '10px 14px', fontSize: '0.72rem', fontWeight: '800', color: '#334155', textTransform: 'uppercase' }}>Mode</th>
                        <th style={{ padding: '10px 14px', fontSize: '0.72rem', fontWeight: '800', color: '#334155', textTransform: 'uppercase' }}>Ref / Remarks</th>
                        <th style={{ padding: '10px 14px', fontSize: '0.72rem', fontWeight: '800', color: '#334155', textTransform: 'uppercase', textAlign: 'right' }}>Deposited (₹)</th>
                        <th className="no-print" style={{ padding: '10px 14px', fontSize: '0.72rem', fontWeight: '800', color: '#334155', textTransform: 'uppercase', textAlign: 'center' }}>Proof</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportLoading ? (
                        <tr>
                          <td colSpan="7" style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>
                            <div className="animate-pulse" style={{ fontSize: '0.88rem', fontWeight: '700' }}>Fetching deposit receipts...</div>
                          </td>
                        </tr>
                      ) : reportDeposits.length === 0 ? (
                        <tr>
                          <td colSpan="7" style={{ padding: '30px', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                            No deposit receipts found between {fromDate} and {toDate}.
                          </td>
                        </tr>
                      ) : (
                        reportDeposits.map((item, idx) => {
                          const dateStr = new Date(item.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                          const agentName = `${item.first_name || ''} ${item.last_name || ''}`.trim() || `Agent #${item.agent_id}`;

                          return (
                            <tr key={item.id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '10px 14px', fontSize: '0.78rem', fontWeight: '800', color: '#2563eb', fontFamily: 'monospace' }}>
                                RCP-{item.id}
                              </td>
                              <td style={{ padding: '10px 14px', fontSize: '0.8rem', color: '#334155', fontWeight: '600' }}>
                                {dateStr}
                              </td>
                              <td style={{ padding: '10px 14px' }}>
                                <div style={{ fontSize: '0.84rem', fontWeight: '800', color: '#0f172a' }}>{agentName}</div>
                                <div style={{ fontSize: '0.7rem', color: '#059669', fontFamily: 'monospace', fontWeight: '700' }}>
                                  {item.agent_code || `ID: ${item.agent_id}`} {item.phone ? `• ${item.phone}` : ''}
                                </div>
                              </td>
                              <td style={{ padding: '10px 14px' }}>
                                <span style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: '750', background: '#f1f5f9', color: '#334155' }}>
                                  {item.payment_mode || 'Cash'}
                                </span>
                              </td>
                              <td style={{ padding: '10px 14px', fontSize: '0.78rem', color: '#64748b' }}>
                                {item.reference_note || '—'}
                              </td>
                              <td style={{ padding: '10px 14px', textAlign: 'right', fontSize: '0.9rem', fontWeight: '900', color: '#059669' }}>
                                + ₹{Number(item.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              </td>
                              <td className="no-print" style={{ padding: '10px 14px', textAlign: 'center' }}>
                                {item.proof_image ? (
                                  <button
                                    onClick={() => {
                                      setZoomTitle(`Deposit Proof RCP-${item.id}`);
                                      setZoomImage(getImageUrl(item.proof_image));
                                    }}
                                    style={{ padding: '3px 8px', borderRadius: '6px', border: '1px solid #bae6fd', background: '#f0f9ff', color: '#0284c7', fontSize: '0.72rem', fontWeight: '750', cursor: 'pointer' }}
                                  >
                                    View
                                  </button>
                                ) : (
                                  <span style={{ color: '#cbd5e1', fontSize: '0.75rem' }}>—</span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                    <tfoot>
                      <tr style={{ background: '#ecfdf5', borderTop: '2px solid #059669' }}>
                        <td colSpan="5" style={{ padding: '12px 14px', fontWeight: '900', fontSize: '0.85rem', color: '#065f46', textTransform: 'uppercase' }}>
                          Grand Total Deposited ({reportDeposits.length} Receipts)
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: '950', fontSize: '1.05rem', color: '#064e3b' }}>
                          {formatCurrency(totalReportDeposit)}
                        </td>
                        <td className="no-print" />
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Signatory Footer for Printed Statement */}
                <div style={{ marginTop: '36px', paddingTop: '20px', borderTop: '1px dashed #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '20px' }}>
                  <div>
                    <div style={{ fontSize: '0.74rem', color: '#64748b' }}>Prepared By: <strong>Admin Finance Desk</strong></div>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>SkyRelief ERP System Generated Receipt</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ width: '180px', borderBottom: '1.5px solid #0f172a', marginBottom: '6px' }} />
                    <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#0f172a' }}>Authorized Signatory</div>
                  </div>
                </div>

              </div>

            </div>

            {/* Modal Actions Footer */}
            <div className="no-print" style={{ padding: '18px 28px', borderTop: '1.5px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottomLeftRadius: '24px', borderBottomRightRadius: '24px', flexWrap: 'wrap', gap: '10px' }}>
              <button
                onClick={() => setShowReportModal(false)}
                style={{ padding: '9px 18px', borderRadius: '12px', border: '1.5px solid #cbd5e1', background: '#ffffff', color: '#334155', fontSize: '0.84rem', fontWeight: '700', cursor: 'pointer' }}
              >
                Close
              </button>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={handlePrintReceipts}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '7px',
                    padding: '9px 18px',
                    borderRadius: '12px',
                    border: '1.5px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#0f172a',
                    fontSize: '0.84rem',
                    fontWeight: '800',
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.05)'
                  }}
                >
                  <Printer size={16} />
                  <span>Print / Save PDF</span>
                </button>

                <button
                  onClick={handleExportExcel}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '7px',
                    padding: '9px 20px',
                    borderRadius: '12px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: '#ffffff',
                    fontSize: '0.84rem',
                    fontWeight: '800',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)'
                  }}
                >
                  <Download size={16} />
                  <span>Download Excel (.xlsx)</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Proof Lightbox Modal */}
      {zoomImage && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(3px)' }} onClick={() => setZoomImage(null)}>
          <div style={{ position: 'relative', maxWidth: '85vw', maxHeight: '85vh', background: '#ffffff', padding: '16px', borderRadius: '16px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontWeight: '800', fontSize: '0.9rem', color: '#0f172a' }}>{zoomTitle}</span>
              <button onClick={() => setZoomImage(null)} style={{ border: 'none', background: '#f1f5f9', borderRadius: '8px', padding: '4px', cursor: 'pointer' }}><X size={16} /></button>
            </div>
            <img src={zoomImage} alt="" style={{ maxWidth: '100%', maxHeight: '72vh', objectFit: 'contain', borderRadius: '10px' }} />
          </div>
        </div>
      )}

    </div>
  );
}
