export function createInvoice({ po, lines }){
  const subtotal = round2(lines.reduce((a,l)=> a + l.qty*l.unit_price, 0));
  const tax = round2(subtotal * 0.10);
  const total = round2(subtotal + tax);
  if (Math.abs((subtotal+tax)-total)>0.001) throw new Error("TOTALS_MISMATCH");
  return {
    invoice_id:`INV-${Date.now()}`, po_ref: po||null,
    currency:"USD", lines, subtotal, tax, total, created_at:new Date().toISOString()
  };
}
function round2(n){ return Math.round(n*100)/100; }
