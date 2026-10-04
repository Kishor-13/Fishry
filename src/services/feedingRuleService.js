import { PREDEFINED_RULES } from '../constants/predefinedRules.js';

/**
 * Reusable Rule Engine
 * 
 * Rules selection priority:
 * 1. Ignore Other / Custom
 * 2. Match species
 * 3. Species-specific Manual or Special rules (e.g. Magur, Grass Carp)
 * 4. IMC Nursery: project reference basis
 * 5. Specific weight-based rules (e.g. Common Carp, Tilapia) with priority
 * 6. IMC Rearing period matching (Month 1, Month 2, Later stages)
 * 7. IMC Grow-out phase matching (Initial, Mid, Final)
 * 8. Culture period / month rules (e.g. Pangasius)
 * 9. Culture stage rules (Nursery, Rearing, Grow-out)
 * 10. Return most specific valid rule, or null if no valid rule exists.
 */
export function findMatchingFeedingRule({
  species,
  cultureStage,
  averageWeight,
  cultureMonth,
  rearingPeriod,
  growoutPhase,
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

  const spLower = species.toLowerCase();
  const isIMC = ['rohu', 'catla', 'mrigal'].includes(spLower);
  const stageLower = (cultureStage || '').toLowerCase();

  // 3. Magur rule
  if (spLower === 'magur') {
    return candidateRules[0] || null;
  }

  // 4. Grass Carp rule
  if (spLower === 'grass carp' || spLower === 'grass_carp') {
    return candidateRules[0] || null;
  }

  // 5. IMC Nursery rule (Manual selection, Initial spawn weight reference)
  if (isIMC && stageLower === 'nursery') {
    const nurseryRule = candidateRules.find(
      (r) => (r.culture_stage || '').toLowerCase() === 'nursery'
    );
    if (nurseryRule) return nurseryRule;
  }

  // 6. Weight-based specific rule matching (High priority, e.g. Common Carp, Tilapia)
  if (weight !== null && !isNaN(weight) && weight > 0) {
    const weightRules = candidateRules.filter((r) => {
      if (r.min_weight === null || r.max_weight === null) return false;
      return weight >= r.min_weight && weight <= r.max_weight;
    });

    if (weightRules.length > 0) {
      weightRules.sort((a, b) => (b.priority || 0) - (a.priority || 0));
      return weightRules[0];
    }
  }

  // 7. IMC Rearing period matching
  if (isIMC && stageLower === 'rearing') {
    let effectivePeriod = rearingPeriod;
    if (!effectivePeriod && month !== null) {
      if (month <= 1) effectivePeriod = 'month_1';
      else if (month === 2) effectivePeriod = 'month_2';
      else effectivePeriod = 'later';
    }

    if (effectivePeriod) {
      const periodRule = candidateRules.find(
        (r) => (r.culture_stage || '').toLowerCase() === 'rearing' && r.rearing_period === effectivePeriod
      );
      if (periodRule) return periodRule;
    }

    // Default rearing rule (Month 1 if unspecified)
    const defaultRearing = candidateRules.find(
      (r) => (r.culture_stage || '').toLowerCase() === 'rearing' && r.rearing_period === 'month_1'
    ) || candidateRules.find((r) => (r.culture_stage || '').toLowerCase() === 'rearing');
    if (defaultRearing) return defaultRearing;
  }

  // 8. IMC Grow-out phase matching
  if (isIMC && stageLower === 'grow-out') {
    let effectivePhase = growoutPhase;
    if (!effectivePhase && weight !== null && weight > 0) {
      if (weight < 250) effectivePhase = 'initial';
      else if (weight <= 700) effectivePhase = 'mid';
      else effectivePhase = 'final';
    }

    if (effectivePhase) {
      const phaseRule = candidateRules.find(
        (r) => (r.culture_stage || '').toLowerCase() === 'grow-out' && r.growout_phase === effectivePhase
      );
      if (phaseRule) return phaseRule;
    }

    // Default grow-out rule (Initial if unspecified)
    const defaultGrowout = candidateRules.find(
      (r) => (r.culture_stage || '').toLowerCase() === 'grow-out' && r.growout_phase === 'initial'
    ) || candidateRules.find((r) => (r.culture_stage || '').toLowerCase() === 'grow-out');
    if (defaultGrowout) return defaultGrowout;
  }

  // 9. Culture period / month matching (e.g. Pangasius)
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

  // 10. Culture stage matching fallback
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

  // 11. Species general fallback rule
  const generalRule = candidateRules.find(
    (r) => (r.culture_stage || '').toLowerCase() === 'all' && r.min_weight === null && r.min_month === null
  );

  return generalRule || candidateRules[0] || null;
}
