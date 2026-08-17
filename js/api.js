// Local dev talks to the backend directly; a deployed build is served behind
// nginx on the same host, which proxies /api to the backend port.
const API_BASE = ['localhost', '127.0.0.1', ''].includes(location.hostname) ? 'http://localhost:5000/api' : '/api';

function getToken() {
  return localStorage.getItem('token');
}

function setToken(token) {
  if (token) {
    localStorage.setItem('token', token);
  } else {
    localStorage.removeItem('token');
  }
}

async function apiRequest(path, { method = 'GET', body, params } = {}) {
  let url = API_BASE + path;

  if (params) {
    const query = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')),
    ).toString();
    if (query) url += '?' + query;
  }

  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = 'Bearer ' + token;

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message = json.message || json.errors?.[0]?.message || `Request failed (${res.status})`;
    throw new Error(message);
  }

  return json;
}
