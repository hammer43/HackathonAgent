export async function InvoiceAgent({ createInvoicePort }, input) {
  // input: { po?, lines: [{ sku, qty, unit_price }] }
  if (!createInvoicePort) throw new Error('createInvoicePort required');
  const invoice = await createInvoicePort(input);
  return { invoice };
}