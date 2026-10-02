import { PREDEFINED_RULES } from '../data/predefinedRules.js';

/**
 * Reusable Rule Engine (Section 42)
 * 
 * Rules selection priority:
 * 1. Ignore Other / Custom
 * 2. Match species
 * 3. Specific weight-based rules (e.g. Common Carp, Tilapia) with priority
 * 4. Culture period / month rules (e.g. Pangasius)
 * 5. Culture stage rules (Nursery, Rearing, Grow-out)
 * 6. Return most specific valid rule, or null if no valid rule exists.
 */
export function findMatchingFeedingRule({
  species,
  cultureStage,
  averageWeight,
  cultureMonth,
  rulesList = null,
}) {
  // 1. Ignore Other / Custom
  if (!species || species === 'Other / Custom') {
    return null;
  }

  const rules = (rulesList && rulesList.length > 0) ? rulesList : PREDEFINED_RULES;
  const weight = averageWeight !== '' && averageWeight !== null && averageWeight !== undefined
    ? Number(averageWeight)
    : null;
  const month = cultureMonth !== '' && cultureMonth !== null && cultureMonth !== undefined
    ? Number(cultureMonth)
    : null;

  // 2. Match species (case-insensitive)
  const candidateRules = rules.filter(
    (r) => (r.species || '').toLowerCase() === species.toLowerCase() && (r.active !== false)
  );

  if (candidateRules.length === 0) {
    return null;
  }

  // 3. Weight-based specific rule matching (High priority, e.g. Common Carp, Tilapia)
  if (weight !== null && !isNaN(weight) && weight > 0) {
    const weightRules = candidateRules.filter((r) => {
      if (r.min_weight === null || r.max_weight === null) return false;
      return weight >= r.min_weight && weight <= r.max_weight;
    });

    if (weightRules.length > 0) {
      // Sort by priority descending (e.g. 50 > 20)
      weightRules.sort((a, b) => (b.priority || 0) - (a.priority || 0));
      return weightRules[0];
    }
  }

  // 4. Culture period / month matching (e.g. Pangasius)
  if (month !== null && !isNaN(month) && month >= 0) {
    const monthRules = candidateRules.filter((r) => {
      if (r.min_month === null || r.max_month === null) return false;
      return month >= r.min_month && month <= r.max_month;
    });

    if (monthRules.length > 0) {
      monthRules.sort((a, b) => (b.priority || 0) - (a.priority || 0));
      return monthRules[0];
    }
  }

  // 5. Culture stage matching (e.g. Rohu Nursery, Rearing, Grow-out)
  if (cultureStage) {
    const stageRules = candidateRules.filter(
      (r) => (r.culture_stage || '').toLowerCase() === cultureStage.toLowerCase() ||
             (r.culture_stage || '').toLowerCase() === 'all'
    );

    if (stageRules.length > 0) {
      stageRules.sort((a, b) => (b.priority || 0) - (a.priority || 0));
      return stageRules[0];
    }
  }

  // 6. Species general fallback rule
  const generalRule = candidateRules.find(
    (r) => (r.culture_stage || '').toLowerCase() === 'all' && r.min_weight === null && r.min_month === null
  );

  return generalRule || null;
}
