const BASE_URL = 'http://localhost:8080';

// Generate or retrieve persistent device fingerprint
export const getDeviceFingerprint = () => {
  let deviceId = localStorage.getItem('deviceId');
  if (!deviceId) {
    // Generate a simple unique fingerprint for this session/browser
    deviceId = 'dev-' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('deviceId', deviceId);
  }
  return deviceId;
};

// Central request handler
export const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Inject JWT token if present
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Inject default device ID for tracking (required by WPRS)
  if (!headers['X-Device-ID']) {
    headers['X-Device-ID'] = getDeviceFingerprint();
  }

  const config = {
    ...options,
    headers,
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, config);

  if (response.status === 401) {
    // Session expired or invalid
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  if (response.status === 403) {
    // Forbidden by WPRS or Spring Security
    try {
      const data = await response.json();
      // Throw specialized error containing WPRS block reasons
      const err = new Error(data.decision === 'BLOCK' ? 'WPRS_BLOCKED' : 'Forbidden');
      err.wprsInfo = data;
      throw err;
    } catch (e) {
      if (e.message === 'WPRS_BLOCKED') throw e;
      throw new Error('Access Forbidden (403)');
    }
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Request failed with status ${response.status}`);
  }

  // For logout or delete routes returning empty body
  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return null;
  }

  try {
    return await response.json();
  } catch (e) {
    return null;
  }
};

export const api = {
  get: (endpoint, options = {}) => apiRequest(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, body, options = {}) => apiRequest(endpoint, { ...options, method: 'POST', body: JSON.stringify(body) }),
  put: (endpoint, body, options = {}) => apiRequest(endpoint, { ...options, method: 'PUT', body: JSON.stringify(body) }),
  delete: (endpoint, options = {}) => apiRequest(endpoint, { ...options, method: 'DELETE' }),
};
