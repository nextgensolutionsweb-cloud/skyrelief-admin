'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ChevronRight, UserPlus, UserCircle2, Shield, Megaphone, TrendingUp, TrendingDown,
  Users, UserCheck, Clock, UserX, AlertCircle, Sparkles, Activity, Layers, Calendar
} from 'lucide-react';
import { apiRequest, formatCurrency } from '@/lib/api';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, LabelList
} from 'recharts';

const quickActions = [
  { label: 'Add Member', icon: UserPlus,    bg: 'linear-gradient(135deg, #38bdf8 0%, #0ea5e9 100%)', shadow: 'rgba(14, 165, 233, 0.25)', href: '/members' },
  { label: 'Add Agent',  icon: UserCircle2, bg: 'linear-gradient(135deg, #34d399 0%, #10b981 100%)', shadow: 'rgba(16, 185, 129, 0.25)', href: '/agents' },
  { label: 'Add Insurance', icon: Shield,      bg: 'linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)', shadow: 'rgba(139, 92, 246, 0.25)', href: '/insurance' },
  { label: 'Broadcast',  icon: Megaphone,   bg: 'linear-gradient(135deg, #fb923c 0%, #f97316 100%)', shadow: 'rgba(249, 115, 22, 0.25)', href: '/announcements' },
];

const memberStatusStyle = {
  Active:   { bg: '#dcfce7', color: '#15803d', label: 'Active' },
  Pending:  { bg: '#fef3c7', color: '#92400e', label: 'Pending' },
  Inactive: { bg: '#f1f5f9', color: '#475569', label: 'Inactive' },
};

const agentStatusStyle = {
  1: { bg: '#dcfce7', color: '#15803d', label: 'Active' },
  2: { bg: '#fef3c7', color: '#92400e', label: 'Suspended' },
  0: { bg: '#fee2e2', color: '#991b1b', label: 'Pending' },
  '-1': { bg: '#f1f5f9', color: '#475569', label: 'Deleted' },
};

const avatarColors = ['#0ea5e9','#10b981','#8b5cf6','#f59e0b','#ef4444','#06b6d4','#ec4899','#6366f1'];

export default function Dashboard() {
  const router = useRouter();
  const [summary, setSummary] = useState(null);
  const [planStats, setPlanStats] = useState([]);
  const [recent, setRecent] = useState({ members: [], agents: [], marriages: [] });
  
  // Analytics States
  const [memberTrends, setMemberTrends] = useState([]);
  const [trendTimeframe, setTrendTimeframe] = useState('monthly');
  const [trendPlanId, setTrendPlanId] = useState('');
  const [trendStartDate, setTrendStartDate] = useState('');
  const [trendEndDate, setTrendEndDate] = useState('');
  
  const [dynamicAgeStats, setDynamicAgeStats] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [trendAgentId, setTrendAgentId] = useState('');
  const [ageAgentId, setAgeAgentId] = useState('');
  
  const [financialTrends, setFinancialTrends] = useState([]);
  const [financialTimeframe, setFinancialTimeframe] = useState('monthly');
  const [financialAgentId, setFinancialAgentId] = useState('');
  const [allAgents, setAllAgents] = useState([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [summaryRes, planStatsRes, recentRes, agentsRes] = await Promise.all([
          apiRequest('/api/dashboard/summary').catch(() => ({ s: 0, r: null })),
          apiRequest('/api/dashboard/plan-stats').catch(() => ({ s: 0, r: [] })),
          apiRequest('/api/dashboard/recent-activity').catch(() => ({ s: 0, r: null })),
          apiRequest('/api/agent/get-all').catch(() => ({ s: 0, r: [] }))
        ]);
        
        if (summaryRes.s === 1 && summaryRes.r) {
          setSummary(summaryRes.r);
        }
        if (planStatsRes.s === 1 && Array.isArray(planStatsRes.r)) {
          setPlanStats(planStatsRes.r);
          if (planStatsRes.r.length > 0) {
            if (!selectedPlanId) setSelectedPlanId(planStatsRes.r[0].plan_id);
          }
        }
        if (recentRes.s === 1 && recentRes.r) {
          setRecent({
            members: recentRes.r.recent_members || [],
            agents: recentRes.r.recent_agents || [],
            marriages: recentRes.r.recent_marriages || []
          });
        }
        if (agentsRes.s === 1 && Array.isArray(agentsRes.r)) {
          setAllAgents(agentsRes.r);
        }
      } catch (e) {
        console.error('Failed to load dashboard data:', e);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  useEffect(() => {
    async function fetchFinancialTrends() {
      try {
        let url = `/api/dashboard/financial-trends?timeframe=${financialTimeframe}`;
        if (financialAgentId) url += `&agent_id=${financialAgentId}`;
        
        const res = await apiRequest(url);
        if (res.s === 1 && Array.isArray(res.r)) {
          setFinancialTrends(res.r);
        }
      } catch (e) {
        console.error(e);
      }
    }
    fetchFinancialTrends();
  }, [financialTimeframe, financialAgentId]);

  useEffect(() => {
    async function fetchMemberTrends() {
      try {
        let url = `/api/dashboard/member-trends?timeframe=${trendTimeframe}`;
        if (trendPlanId) url += `&plan_id=${trendPlanId}`;
        if (trendAgentId) url += `&agent_id=${trendAgentId}`;
        
        if (trendTimeframe === 'custom') {
          if (!trendStartDate || !trendEndDate) return;
          url += `&start_date=${trendStartDate}&end_date=${trendEndDate}`;
        }
        
        const res = await apiRequest(url);
        if (res.s === 1 && Array.isArray(res.r)) {
          setMemberTrends(res.r);
        }
      } catch (e) {
        console.error(e);
      }
    }
    fetchMemberTrends();
  }, [trendTimeframe, trendPlanId, trendAgentId, trendStartDate, trendEndDate]);

  useEffect(() => {
    async function fetchAgeStats() {
      if (!selectedPlanId) return;
      try {
        let url = `/api/dashboard/dynamic-age-stats?plan_id=${selectedPlanId}`;
        if (ageAgentId) url += `&agent_id=${ageAgentId}`;
        const res = await apiRequest(url);
        if (res.s === 1 && Array.isArray(res.r)) {
          setDynamicAgeStats(res.r);
        }
      } catch (e) {
        console.error(e);
      }
    }
    fetchAgeStats();
  }, [selectedPlanId, ageAgentId]);

  const getInitials = (firstName, lastName) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || 'AG';
  };

  // Clean, soft-colored metric cards data
  const memberMetrics = [
    { label: 'Total Members',     value: summary?.total_members?.toLocaleString() || '0', iconBg: '#e0f2fe', iconColor: '#0284c7', emoji: '👥', href: '/members' },
    { label: 'Active Members',    value: summary?.active_members?.toLocaleString() || '0', iconBg: '#dcfce7', iconColor: '#16a34a', emoji: '✅', href: '/members' },
    { label: 'Pending Requests',  value: summary?.pending_requests?.toLocaleString() || '0', iconBg: '#fef3c7', iconColor: '#d97706', emoji: '⏳', href: '/admin/agent-requests' },
    { label: 'Suspended Members', value: summary?.suspended_account_members?.toLocaleString() || '0', iconBg: '#fee2e2', iconColor: '#dc2626', emoji: '⏸️', href: '/members?filter=suspended' },
    { label: 'Rejected Members',  value: summary?.rejected_members?.toLocaleString() || '0', iconBg: '#fce7f3', iconColor: '#db2777', emoji: '❌', href: '/members?filter=rejected' },
  ];

  const agentMetrics = [
    { label: 'Total Agents',      value: summary?.total_agents?.toLocaleString() || '0', iconBg: '#ede9fe', iconColor: '#9333ea', emoji: '🧑‍💼', href: '/agents' },
    { label: 'Active Agents',     value: summary?.active_agents?.toLocaleString() || '0', iconBg: '#d1fae5', iconColor: '#059669', emoji: '✅', href: '/agents' },
    { label: 'Suspended Agents',  value: summary?.suspended_agents?.toLocaleString() || '0', iconBg: '#ffedd5', iconColor: '#ea580c', emoji: '⏸️', href: '/agents' },
  ];

  const recentMembers = recent.members.map(m => {
    const firstName = m.first_name || '';
    const lastName = m.last_name || '';
    const initials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || 'MB';
    const agentName = m.agent_first_name ? `${m.agent_first_name} ${m.agent_last_name || ''}`.trim() : 'N/A';
    
    return {
      ...m,
      name: `${firstName} ${lastName}`.trim(),
      initials,
      color: '#0ea5e9',
      branch: `Agent: ${agentName}`,
      status: m.status === 1 || m.status === '1' ? 'Active' : 'Pending'
    };
  });
  const recentAgents  = recent.agents;
  const recentMarriages = recent.marriages;

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* ── Welcome Banner Header ────────────────────────────────────── */}
      <div style={{
        padding: '24px 28px',
        borderRadius: '24px',
        background: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)',
        boxShadow: '0 10px 30px -4px rgba(14, 165, 233, 0.3)',
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative Circles */}
        <div style={{ position: 'absolute', right: '-40px', top: '-40px', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', right: '120px', bottom: '-50px', width: '150px', height: '150px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{ padding: '4px 10px', borderRadius: '9999px', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)', fontSize: '0.72rem', fontWeight: '800', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              ✦ SkyRelief ERP Overview
            </span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800', letterSpacing: '-0.03em', margin: 0, color: '#ffffff' }}>
            System Dashboard
          </h1>
          <p style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.85)', marginTop: '4px', fontWeight: '500' }}>
            SkyRelief Foundation — Real-time overview of members, agents, programs & analytics
          </p>
        </div>

        {/* Quick Summary Pill Badge */}
        <div style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          background: 'rgba(255,255,255,0.15)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.25)',
          padding: '12px 20px',
          borderRadius: '16px'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: '800', lineHeight: 1 }}>{summary?.total_members || '0'}</div>
            <div style={{ fontSize: '0.68rem', opacity: 0.85, fontWeight: '600', marginTop: '2px' }}>Total Members</div>
          </div>
          <div style={{ width: '1px', height: '28px', background: 'rgba(255,255,255,0.25)' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: '800', lineHeight: 1 }}>{summary?.total_agents || '0'}</div>
            <div style={{ fontSize: '0.68rem', opacity: 0.85, fontWeight: '600', marginTop: '2px' }}>Total Agents</div>
          </div>
        </div>
      </div>

      {/* ── Members Clean KPI Cards ───────────────────────────────────── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', paddingLeft: '4px' }}>
          <Users size={18} style={{ color: '#0ea5e9' }} strokeWidth={2.5} />
          <h2 style={{ fontSize: '1rem', fontWeight: '800', color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
            Member Metrics
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px' }}>
          {memberMetrics.map(({ label, value, iconBg, emoji, href }) => (
            <div
              key={label}
              onClick={() => router.push(href)}
              style={{
                background: '#ffffff',
                borderRadius: '18px',
                padding: '18px 20px',
                border: '1.5px solid #e2e8f0',
                boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 18px rgba(14, 165, 233, 0.12)';
                e.currentTarget.style.borderColor = '#bae6fd';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.02)';
                e.currentTarget.style.borderColor = '#e2e8f0';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '11px',
                  background: iconBg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.05rem'
                }}>
                  {emoji}
                </div>
                <ChevronRight size={16} style={{ color: '#cbd5e1' }} />
              </div>

              <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.03em', lineHeight: 1, marginBottom: '5px' }}>
                {loading ? '...' : value}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: '600' }}>
                {label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Agents Clean KPI Cards ────────────────────────────────────── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', paddingLeft: '4px' }}>
          <UserCircle2 size={18} style={{ color: '#10b981' }} strokeWidth={2.5} />
          <h2 style={{ fontSize: '1rem', fontWeight: '800', color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
            Agent Metrics
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          {agentMetrics.map(({ label, value, iconBg, emoji, href }) => (
            <div
              key={label}
              onClick={() => router.push(href)}
              style={{
                background: '#ffffff',
                borderRadius: '18px',
                padding: '18px 20px',
                border: '1.5px solid #e2e8f0',
                boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 18px rgba(16, 185, 129, 0.12)';
                e.currentTarget.style.borderColor = '#a7f3d0';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.02)';
                e.currentTarget.style.borderColor = '#e2e8f0';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '11px',
                  background: iconBg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.05rem'
                }}>
                  {emoji}
                </div>
                <ChevronRight size={16} style={{ color: '#cbd5e1' }} />
              </div>

              <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.03em', lineHeight: 1, marginBottom: '5px' }}>
                {loading ? '...' : value}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: '600' }}>
                {label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Quick Actions Bar ────────────────────────────────────────── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', paddingLeft: '4px' }}>
          <Sparkles size={18} style={{ color: '#8b5cf6' }} strokeWidth={2.5} />
          <h2 style={{ fontSize: '1rem', fontWeight: '800', color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
            Quick Actions
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px' }}>
          {quickActions.map(({ label, icon: Icon, bg, shadow, href }) => (
            <button
              key={label}
              onClick={() => router.push(href)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                padding: '14px 18px',
                background: '#ffffff',
                border: '1.5px solid #e2e8f0',
                borderRadius: '18px',
                fontFamily: 'inherit',
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = `0 8px 20px ${shadow}`;
                e.currentTarget.style.borderColor = '#bae6fd';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.02)';
                e.currentTarget.style.borderColor = '#e2e8f0';
              }}
            >
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '11px',
                background: bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 3px 10px ${shadow}`,
                flexShrink: 0
              }}>
                <Icon size={19} color="white" strokeWidth={2.5} />
              </div>
              <span style={{ fontSize: '0.88rem', fontWeight: '700', color: '#0f172a', letterSpacing: '-0.01em' }}>
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Analytics Graphs Section ───────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '20px' }}>
        
        {/* Member Onboarding Trends Chart */}
        <div style={{
          background: '#ffffff',
          borderRadius: '20px',
          border: '1.5px solid #e2e8f0',
          boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h2 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
                Member Trends
              </h2>
              <p style={{ fontSize: '0.72rem', color: '#64748b', margin: '2px 0 0' }}>Member registrations over time</p>
            </div>

            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
              <select 
                value={trendPlanId} 
                onChange={e => setTrendPlanId(e.target.value)}
                style={{
                  padding: '5px 10px',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  borderRadius: '8px',
                  border: '1.5px solid #e2e8f0',
                  color: '#334155',
                  outline: 'none',
                  background: '#f8fafc'
                }}
              >
                <option value="">All Plans</option>
                {planStats.map(p => (
                  <option key={`trend-${p.plan_id}`} value={p.plan_id}>{p.plan_name}</option>
                ))}
              </select>

              <select 
                value={trendAgentId} 
                onChange={e => setTrendAgentId(e.target.value)}
                style={{
                  padding: '5px 10px',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  borderRadius: '8px',
                  border: '1.5px solid #e2e8f0',
                  color: '#334155',
                  outline: 'none',
                  background: '#f8fafc'
                }}
              >
                <option value="">All Agents</option>
                {allAgents.map(a => (
                  <option key={`trend-agent-${a.id}`} value={a.id}>{a.first_name} {a.last_name}</option>
                ))}
              </select>

              <select
                value={trendTimeframe}
                onChange={e => setTrendTimeframe(e.target.value)}
                style={{
                  padding: '5px 10px',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  borderRadius: '8px',
                  border: '1.5px solid #e2e8f0',
                  color: '#334155',
                  outline: 'none',
                  background: '#f8fafc'
                }}
              >
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
                <option value="custom">Custom</option>
              </select>
            </div>
          </div>

          <div style={{ width: '100%', height: '310px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={memberTrends} margin={{ top: 30, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="period" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '14px', border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}
                  labelStyle={{ fontWeight: '700', color: '#0f172a' }}
                  formatter={(value) => [`${value} Members`, 'Joined']}
                />
                <Bar dataKey="members_joined" name="Members Joined" fill="#0ea5e9" radius={[8, 8, 0, 0]} maxBarSize={44}>
                  <LabelList dataKey="members_joined" position="top" style={{ fontSize: '11px', fill: '#0ea5e9', fontWeight: 'bold' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Dynamic Age-Based Analysis Donut Chart */}
        <div style={{
          background: '#ffffff',
          borderRadius: '20px',
          border: '1.5px solid #e2e8f0',
          boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h2 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
                Plan Age Rules Analysis
              </h2>
              <p style={{ fontSize: '0.72rem', color: '#64748b', margin: '2px 0 0' }}>Age demographics break-down by plan</p>
            </div>

            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <select 
                value={selectedPlanId} 
                onChange={e => setSelectedPlanId(e.target.value)}
                style={{
                  padding: '5px 10px',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  borderRadius: '8px',
                  border: '1.5px solid #e2e8f0',
                  color: '#334155',
                  outline: 'none',
                  background: '#f8fafc'
                }}
              >
                {planStats.map(p => (
                  <option key={p.plan_id} value={p.plan_id}>{p.plan_name}</option>
                ))}
              </select>

              <select 
                value={ageAgentId} 
                onChange={e => setAgeAgentId(e.target.value)}
                style={{
                  padding: '5px 10px',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  borderRadius: '8px',
                  border: '1.5px solid #e2e8f0',
                  color: '#334155',
                  outline: 'none',
                  background: '#f8fafc'
                }}
              >
                <option value="">All Agents</option>
                {allAgents.map(a => (
                  <option key={`age-agent-${a.id}`} value={a.id}>{a.first_name} {a.last_name}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ width: '100%', height: '310px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {dynamicAgeStats.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dynamicAgeStats}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={5}
                    dataKey="count"
                    labelLine={{ stroke: '#94a3b8', strokeWidth: 1.5 }}
                    label={({ name, value }) => value > 0 ? `${name} (${value})` : ''}
                    style={{ fontSize: '11px', fontWeight: 'bold' }}
                  >
                    {dynamicAgeStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={avatarColors[index % avatarColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '14px', border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '0.8rem', fontWeight: '600' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ color: '#94a3b8', fontSize: '0.88rem', fontWeight: '500' }}>No age rules data available for this plan</div>
            )}
          </div>
        </div>

      </div>

      {/* ── Plan Wise Overview Table ─────────────────────────────────── */}
      <div className="premium-table-container">
        <div style={{ padding: '18px 24px', borderBottom: '1.5px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ffffff' }}>
          <div>
            <span style={{ fontWeight: '800', fontSize: '1.05rem', color: '#0f172a', letterSpacing: '-0.02em' }}>Plan Wise Overview</span>
            <p style={{ fontSize: '0.73rem', color: '#64748b', margin: '2px 0 0' }}>Distribution of members and agents across programs</p>
          </div>
        </div>

        <table className="premium-table">
          <thead>
            <tr>
              <th>Plan Name</th>
              <th>Total Members</th>
              <th>Active Members</th>
              <th>Total Agents</th>
            </tr>
          </thead>
          <tbody>
            {planStats.map((plan) => (
              <tr key={plan.plan_id}>
                <td style={{ fontWeight: '800', color: '#0f172a' }}>
                  {plan.plan_name}
                </td>
                <td style={{ fontWeight: '600', color: '#334155' }}>
                  {plan.total_members}
                </td>
                <td>
                  <span style={{ padding: '4px 10px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '800', background: '#dcfce7', color: '#15803d' }}>
                    {plan.active_members} Active
                  </span>
                </td>
                <td style={{ fontWeight: '600', color: '#334155' }}>
                  {plan.total_agents}
                </td>
              </tr>
            ))}
            {planStats.length === 0 && !loading && (
              <tr>
                <td colSpan="4" style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>No plans available</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Recent Activity 3-Column Grid ─────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>

        {/* Recent Members */}
        <div className="premium-table-container">
          <div style={{ padding: '18px 20px', borderBottom: '1.5px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ffffff' }}>
            <span style={{ fontWeight: '800', fontSize: '0.98rem', color: '#0f172a' }}>Recent Members</span>
            <button onClick={() => router.push('/members')} style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.78rem', fontWeight: '700', color: '#0ea5e9', cursor: 'pointer', border: 'none', background: 'none' }}>
              View all <ChevronRight size={14} />
            </button>
          </div>
          {recentMembers.map((m, i) => (
            <div
              key={m.id}
              onClick={() => router.push(`/members/${m.id}`)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 20px',
                borderBottom: i < recentMembers.length - 1 ? '1px solid #f1f5f9' : 'none',
                cursor: 'pointer',
                transition: 'background 0.15s ease'
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#f0f9ff'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '11px',
                  background: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.78rem',
                  fontWeight: '800',
                  boxShadow: '0 3px 10px rgba(14, 165, 233, 0.2)',
                  flexShrink: 0
                }}>
                  {m.initials}
                </div>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '0.86rem', color: '#0f172a' }}>{m.name}</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '1px' }}>{m.branch}</div>
                </div>
              </div>
              <span className={`status-badge ${m.status.toLowerCase()}`}>
                ● {m.status}
              </span>
            </div>
          ))}
          {recentMembers.length === 0 && (
            <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '0.82rem' }}>No recent members found</div>
          )}
        </div>

        {/* Recent Agents */}
        <div className="premium-table-container">
          <div style={{ padding: '18px 20px', borderBottom: '1.5px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ffffff' }}>
            <span style={{ fontWeight: '800', fontSize: '0.98rem', color: '#0f172a' }}>Recent Agents</span>
            <button onClick={() => router.push('/agents')} style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.78rem', fontWeight: '700', color: '#0ea5e9', cursor: 'pointer', border: 'none', background: 'none' }}>
              View all <ChevronRight size={14} />
            </button>
          </div>
          {recentAgents.map((a, i) => {
            const statusStyle = agentStatusStyle[a.status] || { bg: '#f1f5f9', color: '#475569', label: 'Inactive' };
            return (
              <div
                key={a.id}
                onClick={() => router.push('/agents')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 20px',
                  borderBottom: i < recentAgents.length - 1 ? '1px solid #f1f5f9' : 'none',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease'
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#f0f9ff'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '11px',
                    background: avatarColors[i % avatarColors.length],
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.78rem',
                    fontWeight: '800',
                    boxShadow: '0 3px 10px rgba(0,0,0,0.1)',
                    flexShrink: 0
                  }}>
                    {getInitials(a.first_name, a.last_name)}
                  </div>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '0.86rem', color: '#0f172a' }}>{a.first_name} {a.last_name}</div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '1px' }}>{a.phone}</div>
                  </div>
                </div>
                <span style={{
                  padding: '4px 10px',
                  borderRadius: '9999px',
                  fontSize: '0.72rem',
                  fontWeight: '700',
                  background: statusStyle.bg,
                  color: statusStyle.color
                }}>
                  ● {statusStyle.label}
                </span>
              </div>
            );
          })}
          {recentAgents.length === 0 && !loading && (
            <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '0.82rem' }}>No recent agents found</div>
          )}
        </div>

        {/* Recent Marriage Events */}
        <div className="premium-table-container">
          <div style={{ padding: '18px 20px', borderBottom: '1.5px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ffffff' }}>
            <span style={{ fontWeight: '800', fontSize: '0.98rem', color: '#0f172a' }}>Recent Marriage Events</span>
            <button onClick={() => router.push('/marriages')} style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.78rem', fontWeight: '700', color: '#0ea5e9', cursor: 'pointer', border: 'none', background: 'none' }}>
              View all <ChevronRight size={14} />
            </button>
          </div>
          {recentMarriages.map((m, i) => {
            const statusLabel = m.status === 1 ? 'Upcoming' : 'Completed';
            const statusColor = m.status === 1 ? { bg: '#fef3c7', color: '#92400e' } : { bg: '#e0f2fe', color: '#0369a1' };
            const mDate = new Date(m.marriage_date).toLocaleDateString('en-GB');

            return (
              <div
                key={m.id}
                onClick={() => router.push('/marriages')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 20px',
                  borderBottom: i < recentMarriages.length - 1 ? '1px solid #f1f5f9' : 'none',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease'
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#f0f9ff'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '11px',
                    background: 'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1rem',
                    boxShadow: '0 3px 10px rgba(236, 72, 153, 0.25)',
                    flexShrink: 0
                  }}>
                    💍
                  </div>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '0.86rem', color: '#0f172a' }}>{m.member_first_name} {m.member_last_name}</div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '1px' }}>{m.plan_name} · {mDate}</div>
                  </div>
                </div>
                <span style={{
                  padding: '4px 10px',
                  borderRadius: '9999px',
                  fontSize: '0.72rem',
                  fontWeight: '700',
                  background: statusColor.bg,
                  color: statusColor.color
                }}>
                  ● {statusLabel}
                </span>
              </div>
            );
          })}
          {recentMarriages.length === 0 && !loading && (
            <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '0.82rem' }}>No recent marriages found</div>
          )}
        </div>

      </div>

    </div>
  );
}
