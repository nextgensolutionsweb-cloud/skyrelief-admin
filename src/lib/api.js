// API client for SkyRelief Admin Panel integration

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.skyrelief.org';

export function getAuth() {
  if (typeof window === 'undefined') return null;
  const apikey = localStorage.getItem('sky_apikey');
  const token = localStorage.getItem('sky_token');
  const userStr = localStorage.getItem('sky_user');
  let user = null;
  try {
    if (userStr) user = JSON.parse(userStr);
  } catch (e) { }
  return { apikey, token, user };
}

export function setAuth({ apikey, token, user }) {
  if (typeof window === 'undefined') return;
  if (apikey) localStorage.setItem('sky_apikey', apikey);
  if (token) localStorage.setItem('sky_token', token);
  if (user) localStorage.setItem('sky_user', JSON.stringify(user));
}

export function clearAuth() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('sky_apikey');
  localStorage.removeItem('sky_token');
  localStorage.removeItem('sky_user');
}

// Global toast dispatch helper
export function showToast(message, type = 'error') {
  if (typeof window !== 'undefined') {
    const event = new CustomEvent('sky-toast', { detail: { message, type } });
    window.dispatchEvent(event);
  }
}

export async function apiRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;

  // Get headers
  const auth = getAuth();
  const headers = { ...options.headers };

  if (auth?.apikey) {
    headers['apikey'] = auth.apikey;
  }
  if (auth?.token) {
    headers['token'] = auth.token;
  }

  // Set content type if not multipart/form-data
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const fetchOptions = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, fetchOptions);

    if (response.status === 401) {
      clearAuth();
      showToast('Session expired. Please log in again.', 'error');
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
      throw new Error('Unauthorized');
    }

    if (response.status === 403) {
      clearAuth();
      showToast('Forbidden: Your account might be suspended or blocked.', 'error');
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
      throw new Error('Forbidden');
    }

    if (!response.ok) {
      const text = await response.text();
      let errorMsg = `Server error: ${response.status}`;
      let errorData = null;
      try {
        const parsed = JSON.parse(text);
        if (parsed) {
          errorData = parsed;
          if (parsed.m) errorMsg = parsed.m;
        }
      } catch (e) { }
      if (!options.skipToast) {
        showToast(errorMsg, 'error');
      }
      const err = new Error(errorMsg);
      err.data = errorData;
      throw err;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error.message === 'Failed to fetch') {
      showToast('Network error: Unable to connect to the server.', 'error');
    }
    throw error;
  }
}

export const formatCurrency = (n) => {
  if (!n && n !== 0) return '₹0';
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)} L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n}`;
};
