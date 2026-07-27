'use client';
import { X } from 'lucide-react';

export default function Modal({ open, onClose, title, children, width = 480 }) {
  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(2px)' }} onClick={onClose} />
      <div style={{ position: 'relative', background: 'white', borderRadius: '18px', width: `${width}px`, maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.18)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #f1f5f9' }}>
          <span style={{ fontWeight: '800', fontSize: '1rem', color: '#0f172a' }}>{title}</span>
          <button onClick={onClose} style={{ color: '#94a3b8', cursor: 'pointer', padding: '4px', borderRadius: '7px', transition: 'background 0.15s', border: 'none', background: 'none' }}
            onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
          ><X size={18} /></button>
        </div>
        <div style={{ padding: '20px 24px' }}>{children}</div>
      </div>
    </div>
  );
}

export function ConfirmModal({ open, onClose, onConfirm, title, message, danger = true }) {
  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }} onClick={onClose} />
      <div style={{ position: 'relative', background: 'white', borderRadius: '16px', padding: '28px', width: '360px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ fontSize: '2.2rem', textAlign: 'center', marginBottom: '10px' }}>{danger ? '⚠️' : '❓'}</div>
        <div style={{ fontWeight: '800', fontSize: '1rem', color: '#0f172a', textAlign: 'center', marginBottom: '8px' }}>{title}</div>
        <div style={{ fontSize: '0.82rem', color: '#64748b', textAlign: 'center', marginBottom: '22px' }}>{message}</div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '9px', borderRadius: '9px', border: '1px solid #e8edf2', background: '#fff', fontWeight: '600', fontSize: '0.85rem', color: '#334155', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
          <button onClick={onConfirm} style={{ flex: 1, padding: '9px', borderRadius: '9px', border: 'none', background: danger ? '#ef4444' : 'linear-gradient(135deg,#0ea5e9,#6366f1)', color: 'white', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'inherit' }}>Confirm</button>
        </div>
      </div>
    </div>
  );
}

export function FormField({ label, type = 'text', value, onChange, options, placeholder }) {
  const base = { width: '100%', padding: '8px 12px', borderRadius: '9px', border: '1.5px solid #e8edf2', fontSize: '0.875rem', color: '#0f172a', background: '#f8fafc', outline: 'none', fontFamily: 'inherit', transition: 'border-color 0.15s', boxSizing: 'border-box' };
  return (
    <div style={{ marginBottom: '14px' }}>
      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: '#64748b', marginBottom: '5px' }}>{label}</label>
      {type === 'select' ? (
        <select value={value} onChange={e => onChange(e.target.value)} style={base}>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : type === 'textarea' ? (
        <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={3} style={{ ...base, resize: 'vertical' }} />
      ) : (
        <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={base}
          onFocus={e => { e.target.style.borderColor = '#0ea5e9'; e.target.style.background = '#fff'; e.target.style.boxShadow = '0 0 0 3px rgba(14,165,233,0.1)'; }}
          onBlur={e => { e.target.style.borderColor = '#e8edf2'; e.target.style.background = '#f8fafc'; e.target.style.boxShadow = 'none'; }}
        />
      )}
    </div>
  );
}

export function ActionMenu({ items, onClose }) {
  return (
    <div style={{ position: 'absolute', right: 0, top: '28px', background: 'white', border: '1px solid #e8edf2', borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', zIndex: 50, minWidth: '160px', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
      {items.map((item, i) => item === 'divider' ? (
        <div key={i} style={{ height: '1px', background: '#f1f5f9', margin: '3px 0' }} />
      ) : (
        <button key={i} onClick={() => { item.onClick(); onClose(); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '9px 14px', fontSize: '0.82rem', fontWeight: '600', color: item.danger ? '#ef4444' : '#334155', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}
          onMouseEnter={e => e.currentTarget.style.background = item.danger ? '#fff5f5' : '#f8fafc'}
          onMouseLeave={e => e.currentTarget.style.background = 'none'}
        >
          <span>{item.icon}</span> {item.label}
        </button>
      ))}
    </div>
  );
}
