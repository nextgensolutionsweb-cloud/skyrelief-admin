'use client';
import { useState, useEffect } from 'react';

export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handleToast = (e) => {
      const { message, type } = e.detail;
      const id = Date.now();
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    };

    window.addEventListener('sky-toast', handleToast);
    return () => window.removeEventListener('sky-toast', handleToast);
  }, []);

  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.type}`}>
          <span style={{ fontSize: '1.1rem' }}>
            {t.type === 'success' ? '✅' : t.type === 'info' ? 'ℹ️' : '❌'}
          </span>
          <div>{t.message}</div>
        </div>
      ))}
    </div>
  );
}
