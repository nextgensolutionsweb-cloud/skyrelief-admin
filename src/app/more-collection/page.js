'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Wallet, CreditCard, CheckSquare, Users, ArrowUpRight, TrendingUp, 
  Clock, CheckCircle, AlertCircle, RefreshCw, ChevronRight, QrCode, 
  ArrowLeft, Landmark, FileText, Sparkles
} from 'lucide-react';
import { apiRequest, formatCurrency } from '@/lib/api';

export default function CollectionDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [dash, setDash] = useState(null);
  const [pendingSubmissions, setPendingSubmissions] = useState([]);
  const [agentSummary, setAgentSummary] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [dashRes, submissionsRes, agentRes] = await Promise.all([
        apiRequest('/api/payment/dashboard/admin').catch(() => ({ s: 0, r: null })),
        apiRequest('/api/admin/payment-submissions').catch(() => ({ s: 0, r: [] })),
        apiRequest('/api/payment/agent-collection-summary?limit=5').catch(() => ({ s: 0, r: null }))
      ]);

      if (dashRes.s === 1 && dashRes.r) {
        setDash(dashRes.r);
      }
      if (submissionsRes.s === 1 && Array.isArray(submissionsRes.r)) {
        setPendingSubmissions(submissionsRes.r.slice(0, 6));
      }
      if (agentRes.s === 1 && agentRes.r) {
        setAgentSummary(agentRes.r);
      }
    } catch (err) {
      console.error('Error loading collections dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalCollected = Number(dash?.total_collected || 0);
  const totalTarget = Number(dash?.total_target || 0);
  const totalDuesCount = Number(dash?.total_dues || 0);
  const paidDuesCount = Number(dash?.paid_dues || 0);
  const totalCommission = Number(agentSummary?.summary?.total_commission_payable || 0);
  const pendingCount = pendingSubmissions.filter(p => p.status === 0 || p.is_submission_pending).length;

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '40px' }}>
      
      {/* Top Hero Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%)',
        borderRadius: '24px',
        padding: '30px 36px',
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '20px',
        boxShadow: '0 10px 36px rgba(6, 78, 59, 0.28)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Subtle background glow */}
        <div style={{
          position: 'absolute',
          right: '-50px',
          top: '-50px',
          width: '260px',
          height: '260px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(52, 211, 153, 0.25) 0%, rgba(6, 95, 70, 0) 70%)',
          pointerEvents: 'none'
        }} />

        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', background: 'rgba(255,255,255,0.18)', padding: '5px 14px', borderRadius: '9999px', fontSize: '0.74rem', fontWeight: '800', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '10px' }}>
            <Landmark size={14} color="#6ee7b7" />
            <span>Dedicated Financial Workspace</span>
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '900', letterSpacing: '-0.025em', margin: 0 }}>
            Collections & Payments Portal
          </h1>
          <p style={{ margin: '8px 0 0', fontSize: '0.88rem', color: '#a7f3d0', maxWidth: '640px', lineHeight: 1.5 }}>
            Centralized hub for monitoring member dues, marriage & death campaigns, verifying UTR & QR payments, and managing agent commission payouts.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => router.push('/')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '11px 18px',
              borderRadius: '14px',
              background: 'rgba(255,255,255,0.15)',
              backdropFilter: 'blur(10px)',
              color: '#ffffff',
              border: '1.5px solid rgba(255,255,255,0.3)',
              fontSize: '0.85rem',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <ArrowLeft size={16} />
            <span>Main ERP</span>
          </button>

          <button
            onClick={loadData}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '11px 20px',
              borderRadius: '14px',
              background: '#ffffff',
              color: '#065f46',
              border: 'none',
              fontSize: '0.85rem',
              fontWeight: '800',
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
              transition: 'all 0.2s ease',
            }}
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} color="#059669" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '18px' }}>
        
        {/* Total Collected */}
        <div className="card" style={{ padding: '22px 24px', borderRadius: '20px', border: '1.5px solid #d1fae5', background: '#ffffff', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.74rem', fontWeight: '800', color: '#059669', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Total Dues Collected
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: '900', color: '#064e3b', marginTop: '6px' }}>
                {formatCurrency(totalCollected)}
              </div>
            </div>
            <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={22} />
            </div>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>Target: <strong>{formatCurrency(totalTarget)}</strong></span>
            <span>•</span>
            <span style={{ color: '#059669', fontWeight: '700' }}>
              {totalTarget > 0 ? `${((totalCollected / totalTarget) * 100).toFixed(1)}% Completed` : '0%'}
            </span>
          </div>
        </div>

        {/* Pending Submissions */}
        <div className="card" style={{ padding: '22px 24px', borderRadius: '20px', border: '1.5px solid #fed7aa', background: '#ffffff', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.74rem', fontWeight: '800', color: '#ea580c', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Pending Verification
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: '900', color: '#9a3412', marginTop: '6px' }}>
                {pendingCount} Requests
              </div>
            </div>
            <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: '#fff7ed', color: '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={22} />
            </div>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '12px' }}>
            Online submissions requiring UTR and proof check
          </div>
        </div>

        {/* Paid vs Total Dues */}
        <div className="card" style={{ padding: '22px 24px', borderRadius: '20px', border: '1.5px solid #bfdbfe', background: '#ffffff', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.74rem', fontWeight: '800', color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Paid Member Slips
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: '900', color: '#1e40af', marginTop: '6px' }}>
                {paidDuesCount} / {totalDuesCount}
              </div>
            </div>
            <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle size={22} />
            </div>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '12px' }}>
            {totalDuesCount - paidDuesCount} member slips currently pending
          </div>
        </div>

        {/* Commission Payable */}
        <div className="card" style={{ padding: '22px 24px', borderRadius: '20px', border: '1.5px solid #e9d5ff', background: '#ffffff', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.74rem', fontWeight: '800', color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Commissions Payable
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: '900', color: '#5b21b6', marginTop: '6px' }}>
                {formatCurrency(totalCommission)}
              </div>
            </div>
            <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: '#faf5ff', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Wallet size={22} />
            </div>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '12px' }}>
            Earned by agents across active programs
          </div>
        </div>

      </div>

      {/* 3 Core Module Navigators */}
      <div>
        <h2 style={{ fontSize: '1.1rem', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.02em', marginBottom: '14px' }}>
          Collection Modules
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          
          {/* Module 1: Payment Campaigns */}
          <div 
            onClick={() => router.push('/more-collection/campaigns')}
            className="card"
            style={{
              padding: '24px',
              borderRadius: '20px',
              cursor: 'pointer',
              border: '1.5px solid #e2e8f0',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              background: '#ffffff',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = '#059669';
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.boxShadow = '0 12px 30px rgba(5, 150, 105, 0.12)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = '#e2e8f0';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.02)';
            }}
          >
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
              <CreditCard size={24} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                Payment Campaigns
              </h3>
              <ArrowUpRight size={18} color="#059669" />
            </div>
            <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '8px 0 16px', lineHeight: 1.45 }}>
              Browse all marriage and suraksha campaigns, track collected amount vs targets, and inspect plan-level metrics.
            </p>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', fontWeight: '750', color: '#059669' }}>
              Manage Campaigns <ChevronRight size={14} />
            </div>
          </div>

          {/* Module 2: Payment Requests & QR */}
          <div 
            onClick={() => router.push('/more-collection/payment-requests')}
            className="card"
            style={{
              padding: '24px',
              borderRadius: '20px',
              cursor: 'pointer',
              border: '1.5px solid #e2e8f0',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              background: '#ffffff',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = '#2563eb';
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.boxShadow = '0 12px 30px rgba(37, 99, 235, 0.12)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = '#e2e8f0';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.02)';
            }}
          >
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
              <QrCode size={24} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                Payment Requests & QR
              </h3>
              <ArrowUpRight size={18} color="#2563eb" />
            </div>
            <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '8px 0 16px', lineHeight: 1.45 }}>
              Approve or reject member & agent payment submissions with duplicate UTR check, view proof screenshots, and edit Bank QR UPI.
            </p>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', fontWeight: '750', color: '#2563eb' }}>
              Verify Payments <ChevronRight size={14} />
            </div>
          </div>

          {/* Module 3: Agents & Wallets */}
          <div 
            onClick={() => router.push('/more-collection/agents')}
            className="card"
            style={{
              padding: '24px',
              borderRadius: '20px',
              cursor: 'pointer',
              border: '1.5px solid #e2e8f0',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              background: '#ffffff',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = '#7c3aed';
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.boxShadow = '0 12px 30px rgba(124, 58, 237, 0.12)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = '#e2e8f0';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.02)';
            }}
          >
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#faf5ff', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
              <Users size={24} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                Agents & Wallets
              </h3>
              <ArrowUpRight size={18} color="#7c3aed" />
            </div>
            <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '8px 0 16px', lineHeight: 1.45 }}>
              View agent financial records, commission rates, collected joining fees, paid dues, and process commission deductions.
            </p>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', fontWeight: '750', color: '#7c3aed' }}>
              Inspect Agent Wallets <ChevronRight size={14} />
            </div>
          </div>

        </div>
      </div>

      {/* Recent Submissions Preview */}
      <div className="card" style={{ padding: '0', borderRadius: '20px', overflow: 'hidden' }}>
        <div style={{ padding: '18px 24px', borderBottom: '1.5px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '1.02rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
              Recent Payment Submissions
            </h2>
            <p style={{ fontSize: '0.74rem', color: '#64748b', margin: '2px 0 0' }}>Latest member and agent payment uploads</p>
          </div>
          <button
            onClick={() => router.push('/more-collection/payment-requests')}
            style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', fontWeight: '700', color: '#059669', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            View all submissions <ChevronRight size={15} />
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                <th style={{ padding: '12px 20px', fontSize: '0.7rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Member / Uploader</th>
                <th style={{ padding: '12px 20px', fontSize: '0.7rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Amount</th>
                <th style={{ padding: '12px 20px', fontSize: '0.7rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>UTR / Reference</th>
                <th style={{ padding: '12px 20px', fontSize: '0.7rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Status</th>
                <th style={{ padding: '12px 20px', fontSize: '0.7rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {pendingSubmissions.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ padding: '30px', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                    No recent payment submissions.
                  </td>
                </tr>
              ) : (
                pendingSubmissions.map((item, idx) => (
                  <tr key={item.id || idx} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ fontSize: '0.88rem', fontWeight: '800', color: '#0f172a' }}>
                        {item.member_name || item.name || 'Member'}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
                        {item.campaign_no || item.program_name || 'Payment Due'}
                      </div>
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{ fontSize: '0.92rem', fontWeight: '900', color: '#065f46' }}>
                        ₹{item.amount || '0'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{ fontFamily: 'monospace', fontSize: '0.82rem', fontWeight: '700', color: '#334155', background: '#f1f5f9', padding: '3px 8px', borderRadius: '6px' }}>
                        {item.utr_number || item.transaction_id || 'N/A'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{
                        padding: '3px 9px',
                        borderRadius: '9999px',
                        fontSize: '0.72rem',
                        fontWeight: '800',
                        background: item.status === 1 ? '#dcfce7' : (item.status === 2 ? '#fee2e2' : '#fef3c7'),
                        color: item.status === 1 ? '#15803d' : (item.status === 2 ? '#991b1b' : '#92400e'),
                      }}>
                        {item.status === 1 ? 'Approved' : (item.status === 2 ? 'Rejected' : 'Pending')}
                      </span>
                    </td>
                    <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                      <button
                        onClick={() => router.push('/more-collection/payment-requests')}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '8px',
                          fontSize: '0.76rem',
                          fontWeight: '750',
                          color: '#2563eb',
                          background: '#eff6ff',
                          border: '1px solid #bfdbfe',
                          cursor: 'pointer'
                        }}
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
