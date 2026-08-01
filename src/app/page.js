
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight, UserPlus, UserCircle2, Shield, Megaphone, TrendingUp, TrendingDown } from 'lucide-react';
import { apiRequest, formatCurrency } from '@/lib/api';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, LabelList
} from 'recharts';

const quickActions = [
  { label: 'Add Member', icon: UserPlus,    bg: 'linear-gradient(135deg,#38bdf8,#0ea5e9)', shadow: 'rgba(14,165,233,0.35)', href: '/members' },
  { label: 'Add Agent',  icon: UserCircle2, bg: 'linear-gradient(135deg,#34d399,#10b981)', shadow: 'rgba(16,185,129,0.35)', href: '/agents' },
  { label: 'Add Insurance', icon: Shield,      bg: 'linear-gradient(135deg,#a78bfa,#8b5cf6)', shadow: 'rgba(139,92,246,0.35)', href: '/insurance' },
  { label: 'Broadcast',  icon: Megaphone,   bg: 'linear-gradient(135deg,#fb923c,#f97316)', shadow: 'rgba(249,115,22,0.35)', href: '/announcements' },
];

const memberStatusStyle = {
  Active:   { bg: '#dcfce7', color: '#15803d' },
  Pending:  { bg: '#fef3c7', color: '#92400e' },
  Inactive: { bg: '#f1f5f9', color: '#475569' },
};

const agentStatusStyle = {
  1: { bg: '#dcfce7', color: '#15803d', label: 'Active' },
  2: { bg: '#fef3c7', color: '#92400e', label: 'Suspended' },
  0: { bg: '#fee2e2', color: '#991b1b', label: 'Pending' },
  '-1': { bg: '#f1f5f9', color: '#475569', label: 'Deleted' },
};

const avatarColors = ['#0ea5e9','#22c55e','#8b5cf6','#f59e0b','#ef4444','#06b6d4','#ec4899','#14b8a6'];



export default function Dashboard() {
  const router = useRouter();
  const [summary, setSummary] = useState(null);
  const [planStats, setPlanStats] = useState([]);
  const [recent, setRecent] = useState({ members: [], agents: [], marriages: [] });
  
  // New Analytics States
  const [memberTrends, setMemberTrends] = useState([]);
  const [trendTimeframe, setTrendTimeframe] = useState('monthly');
  const [trendPlanId, setTrendPlanId] = useState('');
  
  const [dynamicAgeStats, setDynamicAgeStats] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  
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
          // Set first plan as default for dynamic age stats if available
          if (planStatsRes.r.length > 0) {
            if (!selectedPlanId) setSelectedPlanId(planStatsRes.r[0].plan_id);
            if (!trendPlanId) setTrendPlanId(planStatsRes.r[0].plan_id);
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
      if (!trendPlanId) return;
      try {
        const res = await apiRequest(`/api/dashboard/member-trends?timeframe=${trendTimeframe}&plan_id=${trendPlanId}`);
        if (res.s === 1 && Array.isArray(res.r)) {
          setMemberTrends(res.r);
        }
      } catch (e) {
        console.error(e);
      }
    }
    fetchMemberTrends();
  }, [trendTimeframe, trendPlanId]);

  useEffect(() => {
    async function fetchAgeStats() {
      if (!selectedPlanId) return;
      try {
        const res = await apiRequest(`/api/dashboard/dynamic-age-stats?plan_id=${selectedPlanId}`);
        if (res.s === 1 && Array.isArray(res.r)) {
          setDynamicAgeStats(res.r);
        }
      } catch (e) {
        console.error(e);
      }
    }
    fetchAgeStats();
  }, [selectedPlanId]);

  const getInitials = (firstName, lastName) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || 'AG';
  };



  const stats = [
    { label: 'Total Members',      value: summary?.total_members?.toLocaleString() || '0', iconBg: '#dbeafe', emoji: '👥',  href: '/members'   },
    { label: 'Active Members',     value: summary?.active_members?.toLocaleString() || '0', iconBg: '#dcfce7', emoji: '✅', href: '/members'    },
    { label: 'Pending Requests',   value: summary?.pending_requests?.toLocaleString() || '0', iconBg: '#fef3c7', emoji: '⏳', href: '/admin/agent-requests'    },
    { label: 'Suspended Members',  value: summary?.suspended_account_members?.toLocaleString() || '0', iconBg: '#fee2e2', emoji: '⏸️', href: '/members?account_status=2'    },

    { label: 'Total Agents',       value: summary?.total_agents?.toLocaleString() || '0', iconBg: '#ede9fe', emoji: '🧑‍💼', href: '/agents'    },
    { label: 'Active Agents',      value: summary?.active_agents?.toLocaleString() || '0', iconBg: '#d1fae5', emoji: '✅',  href: '/agents'  },
    { label: 'Suspended Agents',   value: summary?.suspended_agents?.toLocaleString() || '0', iconBg: '#fef3c7', emoji: '⏸️',  href: '/agents'  },
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
    <div style={{ maxWidth: '1300px', margin: '0 auto' }}>

      {/* Page title */}
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.025em' }}>Dashboard</h1>
        <p style={{ color: '#64748b', fontSize: '0.82rem', marginTop: '3px' }}>SkyRelief Foundation — Ahmedabad, Gujarat</p>
      </div>



      {/* ── Summary Stats ─────────────────────────────────────────── */}
      <div className="responsive-grid-4" style={{ marginBottom: '20px' }}>
        {stats.map(({ label, value, change, iconBg, emoji, href }) => (
          <div key={label} onClick={() => router.push(href)} style={{ background: '#fff', borderRadius: '16px', padding: '18px 14px', border: '1.5px solid #bee3f8', boxShadow: '0 2px 10px rgba(14,165,233,0.08)', cursor: 'pointer', transition: 'all 0.18s ease' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(14,165,233,0.18)'; e.currentTarget.style.borderColor = '#7dd3fc'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 10px rgba(14,165,233,0.08)'; e.currentTarget.style.borderColor = '#bee3f8'; }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>{emoji}</div>
              <span style={{ fontSize: '0.65rem', fontWeight: '700', background: '#dcfce7', color: '#15803d', padding: '2px 6px', borderRadius: '5px' }}>{change}</span>
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.025em', lineHeight: 1, marginBottom: '4px' }}>{loading ? '...' : value}</div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: '500', lineHeight: 1.3 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* ── Quick Actions ────────────────────────────────────── */}
      <div className="responsive-grid-4" style={{ marginBottom: '20px' }}>
        {quickActions.map(({ label, icon: Icon, bg, shadow, href }) => (
          <button key={label} onClick={() => router.push(href)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '14px', background: 'white', border: '1.5px solid #bee3f8', borderRadius: '14px', fontFamily: 'inherit', cursor: 'pointer', transition: 'all 0.18s ease', boxShadow: '0 1px 4px rgba(14,165,233,0.07)' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 6px 20px ${shadow}`; e.currentTarget.style.borderColor = 'transparent'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 4px rgba(14,165,233,0.07)'; e.currentTarget.style.borderColor = '#bee3f8'; }}
          >
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 3px 10px ${shadow}`, flexShrink: 0 }}>
              <Icon size={17} color="white" strokeWidth={2.5} />
            </div>
            <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#334155' }}>{label}</span>
          </button>
        ))}
      </div>

      {/* ── Analytics Graphs ──────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px', marginBottom: '20px' }}>
        
        {/* 1. Member Onboarding Trends */}
        <div style={{ background: '#fff', borderRadius: '18px', border: '1.5px solid #bee3f8', boxShadow: '0 2px 10px rgba(14,165,233,0.08)', padding: '20px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>Member Onboarding Trends</h2>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <select 
                value={trendPlanId} 
                onChange={e => setTrendPlanId(e.target.value)}
                style={{
                  padding: '6px 12px',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  color: '#334155',
                  outline: 'none',
                  background: '#f8fafc'
                }}
              >
                {planStats.map(p => (
                  <option key={`trend-${p.plan_id}`} value={p.plan_id}>{p.plan_name}</option>
                ))}
              </select>
              <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '8px', padding: '4px' }}>
                {['weekly', 'monthly', 'yearly'].map(tf => (
                  <button 
                    key={tf}
                    onClick={() => setTrendTimeframe(tf)}
                    style={{
                      padding: '6px 12px',
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      background: trendTimeframe === tf ? '#fff' : 'transparent',
                      color: trendTimeframe === tf ? '#0ea5e9' : '#64748b',
                      boxShadow: trendTimeframe === tf ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                      textTransform: 'capitalize',
                      transition: 'all 0.2s'
                    }}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div style={{ width: '100%', height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={memberTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="period" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}
                  labelStyle={{ fontWeight: '700', color: '#0f172a' }}
                  formatter={(value) => [`${value} Members`, 'Joined']}
                />
                <Bar dataKey="members_joined" name="Members Joined" fill="#0ea5e9" radius={[6, 6, 0, 0]} maxBarSize={40}>
                  <LabelList dataKey="members_joined" position="top" style={{ fontSize: '11px', fill: '#334155', fontWeight: 'bold' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Dynamic Age-Based Analysis */}
        <div style={{ background: '#fff', borderRadius: '18px', border: '1.5px solid #bee3f8', boxShadow: '0 2px 10px rgba(14,165,233,0.08)', padding: '20px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>Plan Age Rules Analysis</h2>
            <select 
              value={selectedPlanId} 
              onChange={e => setSelectedPlanId(e.target.value)}
              style={{
                padding: '6px 12px',
                fontSize: '0.8rem',
                fontWeight: '600',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                color: '#334155',
                outline: 'none',
                background: '#f8fafc'
              }}
            >
              {planStats.map(p => (
                <option key={p.plan_id} value={p.plan_id}>{p.plan_name}</option>
              ))}
            </select>
          </div>
          <div style={{ width: '100%', height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {dynamicAgeStats.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dynamicAgeStats}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="count"
                    labelLine={{ stroke: '#64748b', strokeWidth: 1 }}
                    label={({ name, value }) => value > 0 ? `${name} (${value})` : ''}
                    style={{ fontSize: '11px', fontWeight: 'bold' }}
                  >
                    {dynamicAgeStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={avatarColors[index % avatarColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '0.8rem', fontWeight: '600' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ color: '#94a3b8', fontSize: '0.9rem', fontWeight: '500' }}>No age rules available for this plan</div>
            )}
          </div>
        </div>

      </div>

      {/* 3. Financial Collections Trend */}
      <div style={{ background: '#fff', borderRadius: '18px', border: '1.5px solid #bee3f8', boxShadow: '0 2px 10px rgba(14,165,233,0.08)', padding: '20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>Financial Collections Trend</h2>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <select 
              value={financialAgentId} 
              onChange={e => setFinancialAgentId(e.target.value)}
              style={{
                padding: '6px 12px',
                fontSize: '0.75rem',
                fontWeight: '600',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                color: '#334155',
                outline: 'none',
                background: '#f8fafc'
              }}
            >
              <option value="">All Agents</option>
              {allAgents.map(a => (
                <option key={`fin-agent-${a.id}`} value={a.id}>{a.first_name} {a.last_name}</option>
              ))}
            </select>
            <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '8px', padding: '4px' }}>
              {['weekly', 'monthly', 'yearly'].map(tf => (
                <button 
                  key={tf}
                  onClick={() => setFinancialTimeframe(tf)}
                  style={{
                    padding: '6px 12px',
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    background: financialTimeframe === tf ? '#fff' : 'transparent',
                    color: financialTimeframe === tf ? '#10b981' : '#64748b',
                    boxShadow: financialTimeframe === tf ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    textTransform: 'capitalize',
                    transition: 'all 0.2s'
                  }}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div style={{ width: '100%', height: '350px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={financialTrends} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="period" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(val) => `₹${(val/1000).toFixed(0)}k`} />
              <Tooltip 
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}
                formatter={(value) => [`₹${Number(value).toLocaleString()}`, undefined]}
              />
              <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ fontSize: '0.8rem', fontWeight: '600', paddingBottom: '20px' }} />
              <Bar dataKey="total_collected" name="Total Collected (Joining + Slips)" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={50}>
                <LabelList dataKey="total_collected" position="top" formatter={(val) => val > 0 ? `₹${(val/1000).toFixed(0)}k` : ''} style={{ fontSize: '11px', fill: '#10b981', fontWeight: 'bold' }} />
              </Bar>
              <Bar dataKey="pending_joining_expected" name="Pending Expected (Joining)" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={50}>
                <LabelList dataKey="pending_joining_expected" position="top" formatter={(val) => val > 0 ? `₹${(val/1000).toFixed(0)}k` : ''} style={{ fontSize: '11px', fill: '#f59e0b', fontWeight: 'bold' }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Plan Wise Overview ──────────────────────────────── */}
      <div style={{ background: '#fff', borderRadius: '18px', border: '1.5px solid #bee3f8', boxShadow: '0 2px 10px rgba(14,165,233,0.08)', overflow: 'hidden', marginBottom: '20px' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e0f2fe', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: '700', fontSize: '1rem', color: '#0f172a' }}>Plan Wise Overview</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fbff', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <th style={{ padding: '14px 20px', fontWeight: '700' }}>Plan Name</th>
                <th style={{ padding: '14px 20px', fontWeight: '700' }}>Total Members</th>
                <th style={{ padding: '14px 20px', fontWeight: '700' }}>Active Members</th>
                <th style={{ padding: '14px 20px', fontWeight: '700' }}>Married Members</th>
                <th style={{ padding: '14px 20px', fontWeight: '700' }}>Total Agents</th>
                <th style={{ padding: '14px 20px', fontWeight: '700' }}>Upcoming Marriages</th>
                <th style={{ padding: '14px 20px', fontWeight: '700' }}>Completed Marriages</th>
              </tr>
            </thead>
            <tbody>
              {planStats.map((plan, i) => (
                <tr key={plan.plan_id} style={{ borderBottom: i < planStats.length - 1 ? '1px solid #f0f9ff' : 'none', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f0f9ff'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '14px 20px', fontSize: '0.85rem', fontWeight: '600', color: '#0f172a' }}>{plan.plan_name}</td>
                  <td style={{ padding: '14px 20px', fontSize: '0.85rem', color: '#475569' }}>{plan.total_members}</td>
                  <td style={{ padding: '14px 20px', fontSize: '0.85rem', color: '#15803d', fontWeight: '600' }}>{plan.active_members}</td>
                  <td style={{ padding: '14px 20px', fontSize: '0.85rem', color: '#e11d48', fontWeight: '600' }}>{plan.married_members}</td>
                  <td style={{ padding: '14px 20px', fontSize: '0.85rem', color: '#475569' }}>{plan.total_agents}</td>
                  <td style={{ padding: '14px 20px', fontSize: '0.85rem', color: '#d97706', fontWeight: '600' }}>{plan.upcoming_marriages}</td>
                  <td style={{ padding: '14px 20px', fontSize: '0.85rem', color: '#4f46e5', fontWeight: '600' }}>{plan.completed_marriages}</td>
                </tr>
              ))}
              {planStats.length === 0 && !loading && (
                <tr>
                  <td colSpan="7" style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>No plans available</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Recent Members, Agents, Marriages ──────────────────────────── */}
      <div className="grid-r-3">


        {/* Recent Members */}
        <div style={{ background: '#fff', borderRadius: '18px', border: '1.5px solid #bee3f8', boxShadow: '0 2px 10px rgba(14,165,233,0.08)', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #e0f2fe', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: '700', fontSize: '0.95rem', color: '#0f172a' }}>Recent Members</span>
            <button onClick={() => router.push('/members')} style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.78rem', fontWeight: '700', color: '#0ea5e9', cursor: 'pointer', border: 'none', background: 'none', fontFamily: 'inherit' }}>
              View all <ChevronRight size={14} />
            </button>
          </div>
          {recentMembers.map((m, i) => (
            <div key={m.id} onClick={() => router.push(`/members/${m.id}`)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderBottom: i < recentMembers.length - 1 ? '1px solid #f0f9ff' : 'none', cursor: 'pointer', transition: 'background 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background = '#f0f9ff'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: m.color, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: '700', flexShrink: 0 }}>{m.initials}</div>
                <div>
                  <div style={{ fontWeight: '600', fontSize: '0.85rem', color: '#0f172a' }}>{m.name}</div>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}> {m.branch}</div>
                </div>
              </div>
              <span style={{ padding: '3px 9px', borderRadius: '9999px', fontSize: '0.7rem', fontWeight: '700', background: memberStatusStyle[m.status]?.bg || '#f1f5f9', color: memberStatusStyle[m.status]?.color || '#475569' }}>● {m.status}</span>
            </div>
          ))}
          {recentMembers.length === 0 && (
            <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '0.82rem' }}>No recent members found</div>
          )}
        </div>

        {/* Recent Agents */}
        <div style={{ background: '#fff', borderRadius: '18px', border: '1.5px solid #bee3f8', boxShadow: '0 2px 10px rgba(14,165,233,0.08)', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #e0f2fe', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: '700', fontSize: '0.95rem', color: '#0f172a' }}>Recent Agents</span>
            <button onClick={() => router.push('/agents')} style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.78rem', fontWeight: '700', color: '#0ea5e9', cursor: 'pointer', border: 'none', background: 'none', fontFamily: 'inherit' }}>
              View all <ChevronRight size={14} />
            </button>
          </div>
          {recentAgents.map((a, i) => {
            const statusStyle = agentStatusStyle[a.status] || { bg: '#f1f5f9', color: '#475569', label: 'Inactive' };
            return (
              <div key={a.id} onClick={() => router.push('/agents')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderBottom: i < recentAgents.length - 1 ? '1px solid #f0f9ff' : 'none', cursor: 'pointer', transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#f0f9ff'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: avatarColors[i % avatarColors.length], color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: '700', flexShrink: 0 }}>
                    {getInitials(a.first_name, a.last_name)}
                  </div>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '0.85rem', color: '#0f172a' }}>{a.first_name} {a.last_name}</div>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{a.phone}</div>
                  </div>
                </div>
                <span style={{ padding: '3px 9px', borderRadius: '9999px', fontSize: '0.7rem', fontWeight: '700', background: statusStyle.bg, color: statusStyle.color }}>● {statusStyle.label}</span>
              </div>
            );
          })}
          {recentAgents.length === 0 && !loading && (
            <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '0.82rem' }}>No recent agents found</div>
          )}
        </div>

        {/* Recent Marriages */}
        <div style={{ background: '#fff', borderRadius: '18px', border: '1.5px solid #bee3f8', boxShadow: '0 2px 10px rgba(14,165,233,0.08)', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #e0f2fe', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: '700', fontSize: '0.95rem', color: '#0f172a' }}>Recent Marriage Events</span>
            <button onClick={() => router.push('/marriages')} style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.78rem', fontWeight: '700', color: '#0ea5e9', cursor: 'pointer', border: 'none', background: 'none', fontFamily: 'inherit' }}>
              View all <ChevronRight size={14} />
            </button>
          </div>
          {recentMarriages.map((m, i) => {
            const statusLabel = m.status === 1 ? 'Upcoming' : 'Completed';
            const statusColor = m.status === 1 ? { bg: '#fef3c7', color: '#92400e' } : { bg: '#dbeafe', color: '#1e40af' };
            const mDate = new Date(m.marriage_date).toLocaleDateString('en-GB');

            return (
              <div key={m.id} onClick={() => router.push('/marriages')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderBottom: i < recentMarriages.length - 1 ? '1px solid #f0f9ff' : 'none', cursor: 'pointer', transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#f0f9ff'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#fb7185', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>💍</div>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '0.85rem', color: '#0f172a' }}>{m.member_first_name} {m.member_last_name}</div>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{m.plan_name} · {mDate}</div>
                  </div>
                </div>
                <span style={{ padding: '3px 9px', borderRadius: '9999px', fontSize: '0.7rem', fontWeight: '700', background: statusColor.bg, color: statusColor.color }}>● {statusLabel}</span>
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

