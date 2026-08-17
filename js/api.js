const API_BASE = 'http://localhost:5000/api';

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
