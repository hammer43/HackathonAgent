/****
 A pure agent that delegates IO via injected ports.
****/
export async function PricingAgent({ choosePricePort }, input) {
  // input: { sku, date, epsilon?, strategy? }
  if (!choosePricePort) throw new Error('choosePricePort required');
  const decision = await choosePricePort(input);
  return { decision };
}