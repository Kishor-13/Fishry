/**
 * Formats numbers cleanly without floating-point artifacts.
 * e.g. 14.875000000000002 -> "14.875"
 * 425.00 -> "425"
 * 1190 -> "1,190"
 */
export function formatNumber(value, maxDecimals = 2, useGrouping = true) {
  if (value === null || value === undefined || value === '' || isNaN(value)) return '—';
  const num = Number(value);
  if (!isFinite(num)) return '—';

  const factor = Math.pow(10, maxDecimals);
  const rounded = Math.round((num + Number.EPSILON) * factor) / factor;

  const parts = rounded.toString().split('.');
  if (useGrouping) {
    parts[0] = Number(parts[0]).toLocaleString('en-IN');
  }
  return parts.length > 1 ? `${parts[0]}.${parts[1]}` : parts[0];
}

/**
 * Currency formatter with Indian Rupee symbol
 */
export function formatCurrency(amount, maxDecimals = 0) {
  if (amount === null || amount === undefined || isNaN(amount)) return '₹0';
  return `₹${formatNumber(amount, maxDecimals, true)}`;
}

export const formatDisplayNumber = formatNumber;
