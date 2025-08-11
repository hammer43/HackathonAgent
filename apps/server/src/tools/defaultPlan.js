export function buildDefaultPlan({ sku, date, qty = 1, po_ref = null, epsilon = 0.05, strategy = 'epsilon' }) {
  return {
    context: { sku, date, qty, po_ref, epsilon, strategy },
    workflow: [
      { step: 'fetch_features', id: 'features1' },
      { step: 'price', id: 'price1', args: { epsilon, strategy } },
      { step: 'policy_check', id: 'guard1', args: { max_price_pct: 20 } },
      { step: 'generate_invoice', id: 'invoice1', args: { po: '${context.po_ref}' }, out: { invoice_id: 'invoice_id' } },
      { step: 'report_snapshot', id: 'report1', args: { sku: '${context.sku}', days: 7 } }
    ]
  };
}