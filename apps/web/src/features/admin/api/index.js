const BASE = import.meta.env.VITE_API_BASE || '';

export const getFlags = () => fetch(`${BASE}/api/admin/flags`).then(r=>r.json());
export const setFlag = (key, value) => fetch(`${BASE}/api/admin/flags/${encodeURIComponent(key)}`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ value })
}).then(r=>r.json());
export const getRecentExposures = (limit=20) => fetch(`${BASE}/api/admin/exposures?limit=${limit}`).then(r=>r.json());