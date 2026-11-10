/**
 * StaffConnect - Centralized API Service, Animations & Toast Utility
 */

const API_BASE_URL = 'https://staffconnect-backend.onrender.com/api';

const api = {
  getToken() {
    return localStorage.getItem('staffconnect_token');
  },

  getUser() {
    const userStr = localStorage.getItem('staffconnect_user');
    return userStr ? JSON.parse(userStr) : null;
  },

  setAuth(token, user) {
    localStorage.setItem('staffconnect_token', token);
    localStorage.setItem('staffconnect_user', JSON.stringify(user));
  },

  clearAuth() {
    localStorage.removeItem('staffconnect_token');
    localStorage.removeItem('staffconnect_user');
  },

  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (response.status === 401) {
        this.clearAuth();
        if (!window.location.pathname.endsWith('index.html') && !window.location.pathname.endsWith('/')) {
          window.location.href = 'index.html';
        }
        throw new Error('Session expired. Please log in again.');
      }

      const resData = await response.json();

      if (!response.ok) {
        throw new Error(resData.message || `Request failed with status ${response.status}`);
      }

      return resData;
    } catch (error) {
      console.error(`API Error on [${options.method || 'GET'}] ${endpoint}:`, error);
      throw error;
    }
  },

  get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  },

  post(endpoint, body) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  put(endpoint, body) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  },

  patch(endpoint, body) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  },

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  },

  /**
   * Multipart file upload helper
   */
  async uploadFile(endpoint, file) {
    const url = `${API_BASE_URL}${endpoint}`;
    const formData = new FormData();
    formData.append('file', file);

    const headers = {};
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers, // Do NOT set Content-Type header so browser adds correct boundary
        body: formData,
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.message || 'File upload failed');
      }
      return resData;
    } catch (error) {
      console.error(`Upload error on ${endpoint}:`, error);
      throw error;
    }
  }
};

/**
 * Toast Notification Utility with Title, Message, Icon & Close button
 */
function showToast(titleOrMessage, messageOrType = 'info', typeParam = null) {
  let title = '';
  let message = '';
  let type = 'info';

  if (typeParam !== null) {
    title = titleOrMessage;
    message = messageOrType;
    type = typeParam;
  } else if (['success', 'error', 'warning', 'info'].includes(messageOrType)) {
    message = titleOrMessage;
    type = messageOrType;
    title = type.charAt(0).toUpperCase() + type.slice(1);
  } else {
    message = titleOrMessage;
    type = 'info';
    title = 'Notification';
  }

  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  let iconClass = 'fa-info-circle';
  if (type === 'success') iconClass = 'fa-check-circle';
  if (type === 'error') iconClass = 'fa-exclamation-triangle';
  if (type === 'warning') iconClass = 'fa-exclamation-circle';

  toast.innerHTML = `
    <i class="fas ${iconClass} toast-icon"></i>
    <div class="toast-content">
      <div class="toast-title">${escapeHtml(title)}</div>
      <div class="toast-message">${escapeHtml(message)}</div>
    </div>
    <button type="button" class="toast-close" title="Dismiss">&times;</button>
  `;

  const closeBtn = toast.querySelector('.toast-close');
  closeBtn.addEventListener('click', () => removeToast(toast));

  container.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add('show');
  });

  const timer = setTimeout(() => {
    removeToast(toast);
  }, 4500);

  function removeToast(t) {
    clearTimeout(timer);
    t.classList.remove('show');
    setTimeout(() => {
      if (t.parentNode) {
        t.parentNode.removeChild(t);
      }
    }, 350);
  }
}

/**
 * Animated Statistic Counter Utility
 */
function animateCounter(elementId, targetValue, duration = 900) {
  const el = document.getElementById(elementId);
  if (!el) return;

  const target = Number(targetValue) || 0;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    el.textContent = target;
    return;
  }

  const startTime = performance.now();
  const start = 0;

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    // Cubic ease-out
    const ease = 1 - Math.pow(1 - progress, 3);
    const current = Math.floor(start + (target - start) * ease);
    el.textContent = current;

    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      el.textContent = target;
    }
  }

  requestAnimationFrame(update);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (e) {
    return dateStr;
  }
}

function formatDateTime(dateStr) {
  if (!dateStr) return 'First Login';
  try {
    const d = new Date(dateStr);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (e) {
    return dateStr;
  }
}

function isValidEmail(email) {
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return re.test(String(email).trim());
}

function isValidPhone(phone) {
  if (!phone) return true; // optional unless required
  const cleaned = phone.replace(/[^0-9+]/g, '');
  return cleaned.length >= 7 && cleaned.length <= 16;
}
