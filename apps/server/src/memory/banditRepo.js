const store = Object.create(null);
export function getBeta(sku, model){ const k=`${sku}|${model}`; return store[k] || {a:1,b:1}; }
export function updateBeta(sku, model, success){ const k=`${sku}|${model}`; const s=store[k]||{a:1,b:1}; success? s.a++ : s.b++; store[k]=s; return s; }
