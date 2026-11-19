// Pure cost logic (no DOM). Unknown costs are never treated as zero.

/**
 * Normalise a provider cost into one of three states:
 *   unknown - no amount recorded (or it cannot be converted)
 *   free    - amount is explicitly 0
 *   paid    - amount > 0 with a monthly or annual billing frequency
 */
export function normalizeCost(cost) {
  const unknown = { state: 'unknown', amount: null, billing: null, monthly: null, annual: null };
  if (!cost || typeof cost.amount !== 'number' || !Number.isFinite(cost.amount) || cost.amount < 0) return unknown;
  if (cost.amount === 0) return { state: 'free', amount: 0, billing: cost.billing ?? null, monthly: 0, annual: 0 };
  if (cost.billing === 'monthly') {
    return { state: 'paid', amount: cost.amount, billing: 'monthly', monthly: cost.amount, annual: cost.amount * 12 };
  }
  if (cost.billing === 'annual') {
    return { state: 'paid', amount: cost.amount, billing: 'annual', monthly: cost.amount / 12, annual: cost.amount };
  }
  return unknown; // an amount without a billing frequency cannot be compared
}

/** Totals across providers. Totals include known costs only; unknown ones are counted separately. */
export function summarizeCosts(providers) {
  const out = { total: providers.length, free: 0, paid: 0, unknown: 0, known: 0, monthly: 0, annual: 0 };
  for (const p of providers) {
    const c = p.costInfo ?? normalizeCost(p.cost);
    out[c.state] += 1;
    if (c.state !== 'unknown') {
      out.known += 1;
      out.monthly += c.monthly;
      out.annual += c.annual;
    }
  }
  return out;
}

export function formatMoney(value, currency = 'USD') {
  if (value == null) return '—';
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency}`;
  }
}
