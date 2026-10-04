import { PREDEFINED_RULES } from '../constants/predefinedRules.js';
import { findMatchingFeedingRule } from '../services/feedingRuleService.js';
import { calculateFeed as serviceCalculateFeed } from '../services/calculationService.js';

/**
 * Format numbers cleanly for farmer readability without floating-point artifacts.
 * e.g. 14.875000000000002 -> 14.875
 * 425.00 -> 425
 * 1190 -> 1,190
 */
export function formatDisplayNumber(value, maxDecimals = 2, useGrouping = true) {
  if (value === null || value === undefined || isNaN(value)) return '—';
  const num = Number(value);
  if (!isFinite(num)) return '—';

  // Round to maxDecimals cleanly
  const factor = Math.pow(10, maxDecimals);
  const rounded = Math.round((num + Number.EPSILON) * factor) / factor;

  const parts = rounded.toString().split('.');
  if (useGrouping) {
    // Format Indian number system or standard grouping
    parts[0] = Number(parts[0]).toLocaleString('en-IN');
  }
  return parts.length > 1 ? `${parts[0]}.${parts[1]}` : parts[0];
}

/**
 * Find the matching feeding rule from rules array (predefined or fetched from Supabase).
 */
export function findFeedingRule(rulesList, params = {}) {
  return findMatchingFeedingRule({ ...params, rulesList });
}

/**
 * Main calculation engine.
 */
export function calculateFeed(input, ruleOverride = null) {
  return serviceCalculateFeed(input, ruleOverride);
}
