'use client';
import { Mail, Shield, CheckCircle, Database, RefreshCw, Info } from 'lucide-react';
import Link from 'next/link';

export default function PrivacyPolicyPage() {
  const lastUpdated = 'June 13, 2026';

  return (
    <div style={{
      background: 'linear-gradient(180deg, #f0f4f8 0%, #e6eef4 100%)',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: "'Inter', 'Outfit', sans-serif",
      color: '#1e293b'
    }}>
      {/* Navbar Branding */}
      <header style={{
        background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
        padding: '20px 40px',
        boxShadow: '0 4px 20px rgba(99, 102, 241, 0.15)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            background: 'white',
            color: '#6366f1',
            padding: '8px 14px',
            borderRadius: '12px',
            fontWeight: '800',
            fontSize: '1.2rem',
            boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
          }}>
            SR
          </div>
          <span style={{
            fontSize: '1.4rem',
            fontWeight: '800',
            color: 'white',
            letterSpacing: '-0.02em'
          }}>
            SkyRelief
          </span>
        </div>
        <div style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.82rem', fontWeight: '500' }}>
          Play Store Compliance
        </div>
      </header>

      {/* Main Container */}
      <main style={{
        flex: 1,
        maxWidth: '800px',
        margin: '40px auto',
        padding: '0 24px w-full',
        width: '100%',
        boxSizing: 'border-box'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '24px',
          padding: '40px',
          boxShadow: '0 10px 30px rgba(15, 23, 42, 0.04)',
          border: '1.5px solid #e2e8f0',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Top banner accent */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '6px',
            background: 'linear-gradient(90deg, #6366f1 0%, #4f46e5 100%)'
          }}></div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '24px', marginBottom: '32px' }}>
            <div>
              <h1 style={{ fontSize: '2rem', fontWeight: '850', color: '#0f172a', letterSpacing: '-0.03em', marginBottom: '8px' }}>
                Privacy Policy
              </h1>
              <p style={{ color: '#64748b', fontSize: '0.875rem', fontWeight: '500' }}>
                Official privacy statement for the SkyRelief application.
              </p>
            </div>
            <div style={{ background: '#f1f5f9', color: '#475569', padding: '6px 14px', borderRadius: '99px', fontSize: '0.75rem', fontWeight: '750' }}>
              Last Updated: {lastUpdated}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {/* Section 1: Introduction */}
            <section>
              <h2 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0f172a', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Info size={20} color="#6366f1" />
                <span>Introduction</span>
              </h2>
              <p style={{ color: '#475569', fontSize: '0.9rem', lineHeight: '1.6' }}>
                Welcome to <strong>SkyRelief</strong>. Your privacy and trust are paramount to us. This Privacy Policy details how we collect, use, store, and safeguard your personal information when using our mobile application and related ERP platform. By utilizing our services, you consent to the collection and use of data outlined in this document.
              </p>
            </section>

            {/* Section 2: What We Collect */}
            <section style={{ background: '#f8fafc', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0f172a', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Database size={20} color="#6366f1" />
                <span>What Data We Collect</span>
              </h2>
              <p style={{ color: '#475569', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '16px' }}>
                To facilitate insurance and relief operations, we collect the following pieces of user information:
              </p>
              <ul style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
                {[
                  'Full Name / Personal Identification',
                  'Registered Mobile Number',
                  'Email Address',
                  'Profile Details (Avatar/Details)',
                  'KYC Documents (when legally required)',
                  'Insurance or Member Plan Details',
                  'Payment & Transaction Records'
                ].map((item, idx) => (
                  <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#334155', fontWeight: '600' }}>
                    <CheckCircle size={15} color="#10b981" style={{ flexShrink: 0 }} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Section 3: Why We Collect Data */}
            <section>
              <h2 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0f172a', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <RefreshCw size={20} color="#6366f1" />
                <span>Why We Collect Your Data</span>
              </h2>
              <p style={{ color: '#475569', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '14px' }}>
                We utilize your information for operational, validation, and administrative services, including:
              </p>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingLeft: '4px' }}>
                {[
                  { title: 'Account Creation', desc: 'Setting up agent or member user credentials for logging into app platforms.' },
                  { title: 'Member & Agent Management', desc: 'Validating profiles, assignment paths, and operational parameters.' },
                  { title: 'Insurance Plan Management', desc: 'Managing schemes, benefit structures, and enrollment details.' },
                  { title: 'Payments & Reminders', desc: 'Processing contribution transactions, verification checks, and notifying reminders.' },
                  { title: 'Support & Security', desc: 'Addressing customer questions, blocking fraud, and maintaining code compliance.' }
                ].map((item, idx) => (
                  <li key={idx} style={{ fontSize: '0.85rem', color: '#475569', lineHeight: '1.5' }}>
                    <strong style={{ color: '#0f172a' }}>• {item.title}:</strong> {item.desc}
                  </li>
                ))}
              </ul>
            </section>

            {/* Section 4: Data Sharing */}
            <section style={{ borderLeft: '4px solid #10b981', paddingLeft: '16px' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0f172a', marginBottom: '12px' }}>
                Data Sharing & Disclosures
              </h2>
              <p style={{ color: '#475569', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '8px' }}>
                <strong>We do not sell, rent, or trade your personal data with third-party advertisers.</strong>
              </p>
              <p style={{ color: '#475569', fontSize: '0.9rem', lineHeight: '1.6' }}>
                Your data is strictly restricted and may only be shared with authorized admin/team members or service providers specifically required to manage transaction processing or policy validation.
              </p>
            </section>

            {/* Section 5: Data Security */}
            <section>
              <h2 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0f172a', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Shield size={20} color="#6366f1" />
                <span>Data Security</span>
              </h2>
              <p style={{ color: '#475569', fontSize: '0.9rem', lineHeight: '1.6' }}>
                We employ standard encryption algorithms (SSL/TLS) for data transport and securely hash parameters in the database. While we take maximum precautions, no online connection or storage method is 100% immune to leaks, so users are requested to manage their login credentials securely.
              </p>
            </section>

            {/* Section 6: Contact */}
            <section style={{ borderTop: '1px solid #f1f5f9', paddingTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: '800', color: '#0f172a', marginBottom: '4px' }}>
                  Have Questions?
                </h3>
                <p style={{ color: '#64748b', fontSize: '0.78rem' }}>
                  Reach out to us regarding compliance and deletion operations.
                </p>
              </div>
              <a href="mailto:support@skyrelief.org" style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                background: '#eef2ff',
                color: '#6366f1',
                borderRadius: '12px',
                fontWeight: '700',
                fontSize: '0.85rem',
                border: '1px solid rgba(99, 102, 241, 0.15)',
                transition: 'all 0.2s'
              }}
                onMouseEnter={e => { e.currentTarget.style.background = '#6366f1'; e.currentTarget.style.color = 'white'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#eef2ff'; e.currentTarget.style.color = '#6366f1'; }}
              >
                <Mail size={16} />
                <span>support@skyrelief.org</span>
              </a>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        background: '#0f172a',
        color: '#94a3b8',
        padding: '30px 40px',
        textAlign: 'center',
        fontSize: '0.8rem',
        borderTop: '1px solid #1e293b'
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginBottom: '12px' }}>
          <Link href="/privacy-policy" style={{ color: 'white', fontWeight: '600' }}>Privacy Policy</Link>
          <Link href="/delete-account" style={{ hover: { color: 'white' } }}>Delete Account</Link>
        </div>
        <p>© 2026 SkyRelief Foundation. All rights reserved.</p>
        <p style={{ marginTop: '6px', fontSize: '0.72rem', color: '#64748b' }}>Contact Support: support@skyrelief.org</p>
      </footer>
    </div>
  );
}
