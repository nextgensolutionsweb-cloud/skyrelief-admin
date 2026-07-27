'use client';
import { Mail, Trash2, ShieldAlert, Clock, Smartphone, MessageSquare } from 'lucide-react';
import Link from 'next/link';

export default function DeleteAccountPage() {
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
        maxWidth: '720px',
        margin: '40px auto',
        padding: '0 24px',
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
            background: 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)'
          }}></div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid #f1f5f9', paddingBottom: '24px', marginBottom: '32px' }}>
            <div style={{
              background: '#fee2e2',
              color: '#ef4444',
              padding: '10px',
              borderRadius: '12px'
            }}>
              <Trash2 size={24} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.6rem', fontWeight: '850', color: '#0f172a', letterSpacing: '-0.03em' }}>
                Delete Your SkyRelief Account
              </h1>
              <p style={{ color: '#64748b', fontSize: '0.82rem', marginTop: '2px', fontWeight: '500' }}>
                Instructions to request account deletion and data removal.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            
            {/* Steps Section */}
            <section>
              <h2 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Smartphone size={18} color="#6366f1" />
                <span>Deletion via Mobile App (Recommended)</span>
              </h2>
              <p style={{ color: '#475569', fontSize: '0.88rem', lineHeight: '1.6', marginBottom: '16px' }}>
                To delete your account directly from the SkyRelief mobile application, please execute the following steps:
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  'Open the SkyRelief mobile app.',
                  'Login to your account.',
                  'Go to Profile section.',
                  'Tap on Delete Account.',
                  'Confirm your account deletion request.'
                ].map((step, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <div style={{
                      background: '#eef2ff',
                      color: '#6366f1',
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.78rem',
                      fontWeight: '800',
                      flexShrink: 0,
                      marginTop: '2px'
                    }}>
                      {idx + 1}
                    </div>
                    <span style={{ fontSize: '0.88rem', color: '#334155', lineHeight: '1.5', fontWeight: '500' }}>
                      {step}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* Alternative Method */}
            <section style={{ background: '#f8fafc', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0' }}>
              <h2 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0f172a', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MessageSquare size={18} color="#6366f1" />
                <span>Alternative Method</span>
              </h2>
              <p style={{ color: '#475569', fontSize: '0.88rem', lineHeight: '1.6', marginBottom: '16px' }}>
                If you are unable to access the app, you can request account deletion by contacting our support team:
              </p>
              <div style={{ display: 'flex', gap: '8px', color: '#334155', fontSize: '0.85rem', fontWeight: '600', marginBottom: '14px' }}>
                <span>• Please provide your <strong>registered mobile number</strong> and <strong>user type</strong> (Agent or Member).</span>
              </div>
              <a href="mailto:support@skyrelief.org" style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                background: '#eef2ff',
                color: '#6366f1',
                borderRadius: '10px',
                fontWeight: '700',
                fontSize: '0.82rem',
                border: '1px solid rgba(99, 102, 241, 0.15)'
              }}>
                <Mail size={14} />
                <span>support@skyrelief.org</span>
              </a>
            </section>

            {/* Timeline */}
            <section style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
              <div style={{ background: '#ecfdf5', color: '#10b981', padding: '8px', borderRadius: '10px', flexShrink: 0 }}>
                <Clock size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: '0.92rem', fontWeight: '800', color: '#0f172a', marginBottom: '4px' }}>
                  Data Deletion Timeline
                </h3>
                <p style={{ color: '#475569', fontSize: '0.85rem', lineHeight: '1.5' }}>
                  Your account deletion request will be processed within <strong>7 working days</strong>.
                </p>
              </div>
            </section>

            {/* Important Notes */}
            <section style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', borderTop: '1px solid #f1f5f9', paddingTop: '24px' }}>
              <div style={{ background: '#fffbeb', color: '#f59e0b', padding: '8px', borderRadius: '10px', flexShrink: 0 }}>
                <ShieldAlert size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: '0.92rem', fontWeight: '800', color: '#0f172a', marginBottom: '4px' }}>
                  Important Note
                </h3>
                <p style={{ color: '#64748b', fontSize: '0.82rem', lineHeight: '1.5' }}>
                  Some records may be retained if required for legal, payment, security, or compliance purposes (such as historical insurance plans, audits, or payment ledger records).
                </p>
              </div>
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
        <div style={{ display: 'flex', justifyText: 'center', gap: '24px', justifyContent: 'center', marginBottom: '12px' }}>
          <Link href="/privacy-policy" style={{ hover: { color: 'white' } }}>Privacy Policy</Link>
          <Link href="/delete-account" style={{ color: 'white', fontWeight: '600' }}>Delete Account</Link>
        </div>
        <p>© 2026 SkyRelief Foundation. All rights reserved.</p>
        <p style={{ marginTop: '6px', fontSize: '0.72rem', color: '#64748b' }}>Contact Support: support@skyrelief.org</p>
      </footer>
    </div>
  );
}
