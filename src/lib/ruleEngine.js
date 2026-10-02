import { PREDEFINED_RULES } from '../constants/predefinedRules';

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
export function findFeedingRule(rulesList, { species, cultureStage, averageWeight, cultureMonth }) {
  const rules = (rulesList && rulesList.length > 0) ? rulesList : PREDEFINED_RULES;
  const weight = averageWeight !== '' && averageWeight !== null ? Number(averageWeight) : null;
  const month = cultureMonth !== '' && cultureMonth !== null ? Number(cultureMonth) : null;

  // Filter by species name (case-insensitive)
  const candidateRules = rules.filter(
    (r) => r.species.toLowerCase() === (species || '').toLowerCase()
  );

  if (candidateRules.length === 0) {
    return null;
  }

  // 1. High-priority weight-based rule match (e.g. Common Carp, Tilapia)
  if (weight !== null && weight > 0) {
    const weightRules = candidateRules.filter(
      (r) => r.min_weight !== null && r.max_weight !== null &&
             weight >= r.min_weight && weight <= r.max_weight
    );

    if (weightRules.length > 0) {
      // Sort by priority descending
      weightRules.sort((a, b) => (b.priority || 0) - (a.priority || 0));
      return weightRules[0];
    }
  }

  // 2. Culture-period / Month-based rule match (e.g. Pangasius)
  if (month !== null && month >= 0) {
    const monthRules = candidateRules.filter(
      (r) => r.min_month !== null && r.max_month !== null &&
             month >= r.min_month && month <= r.max_month
    );

    if (monthRules.length > 0) {
      monthRules.sort((a, b) => (b.priority || 0) - (a.priority || 0));
      return monthRules[0];
    }
  }

  // 3. Culture Stage match (e.g. Rohu Nursery, Rearing, Grow-out)
  if (cultureStage) {
    const stageRules = candidateRules.filter(
      (r) => r.culture_stage.toLowerCase() === cultureStage.toLowerCase() ||
             r.culture_stage.toLowerCase() === 'all'
    );

    if (stageRules.length > 0) {
      stageRules.sort((a, b) => (b.priority || 0) - (a.priority || 0));
      return stageRules[0];
    }
  }

  // 4. Default fallback rule for the species
  const generalRule = candidateRules.find((r) => r.culture_stage.toLowerCase() === 'all');
  return generalRule || candidateRules[0] || null;
}

/**
 * Main calculation engine.
 * Computes:
 * - survivingFish
 * - biomass
 * - feedingRate
 * - dailyFeed
 * - morningFeed
 * - eveningFeed
 * - dailyFeedCost
 * - ruleExplanation & source
 */
export function calculateFeed({
  species,
  isCustom,
  cultureStage,
  stocked,
  survivalPercent,
  averageWeight,
  feedPrice,
  cultureMonth,
  manualRate,
  rulesList = null,
}) {
  const result = {
    isValid: false,
    isIncomplete: false,
    specialStatus: null, // 'NEEDS_SPAWN_WEIGHT', 'VERIFIED_PROTOCOL', 'FORAGE_BASED', 'NO_RULE'
    message: '',
    message_mr: '',
    rule: null,
    rateSource: '',
    ruleExplanation: '',
    ruleExplanation_mr: '',
    feedingRate: null,
    survivingFish: 0,
    biomass: 0,
    dailyFeed: 0,
    morningFeed: 0,
    eveningFeed: 0,
    dailyFeedCost: 0,
    feedPriceNum: 0,
  };

  // Check mandatory basic observations
  const numStocked = Number(stocked);
  const numSurvival = Number(survivalPercent);
  const numWeight = Number(averageWeight);
  const numPrice = feedPrice !== '' && feedPrice !== null ? Number(feedPrice) : 0;
  result.feedPriceNum = numPrice;

  // Incomplete form check
  if (!species || !cultureStage || !stocked || !survivalPercent || !averageWeight) {
    result.isIncomplete = true;
    return result;
  }

  // Basic numeric validation
  if (isNaN(numStocked) || numStocked <= 0) {
    result.message = 'Number stocked must be greater than 0.';
    result.message_mr = 'साठवणूक केलेली संख्या ० पेक्षा जास्त असावी.';
    return result;
  }

  if (isNaN(numSurvival) || numSurvival <= 0 || numSurvival > 100) {
    result.message = 'Survival percentage must be between 1% and 100%.';
    result.message_mr = 'जिवंत राहण्याचे प्रमाण १% ते १००% दरम्यान असावे.';
    return result;
  }

  if (isNaN(numWeight) || numWeight <= 0) {
    result.message = 'Average fish weight must be greater than 0 g.';
    result.message_mr = 'सरासरी वजन ० ग्रॅमपेक्षा जास्त असावे.';
    return result;
  }

  if (isNaN(numPrice) || numPrice < 0) {
    result.message = 'Feed price must be 0 or greater.';
    result.message_mr = 'खाद्य दर ० किंवा अधिक असावा.';
    return result;
  }

  // 1. Surviving Fish: Number Stocked × Survival % ÷ 100
  const survivingFish = (numStocked * numSurvival) / 100;
  result.survivingFish = survivingFish;

  // 2. Biomass (kg): Surviving Fish × Average Weight (g) ÷ 1000
  const biomass = (survivingFish * numWeight) / 1000;
  result.biomass = biomass;

  // 3. Handle CUSTOM SPECIES
  if (isCustom || species === 'Other / Custom') {
    const numManualRate = Number(manualRate);
    if (!manualRate || isNaN(numManualRate) || numManualRate <= 0) {
      result.isIncomplete = true;
      result.message = 'Manual feeding rate must be greater than 0%.';
      result.message_mr = 'स्वतः भरलेला खाद्य दर ०% पेक्षा जास्त असावा.';
      return result;
    }

    result.feedingRate = numManualRate;
    result.rateSource = 'FARMER_ENTERED';
    result.ruleExplanation = `Manual Feeding Rate: ${numManualRate}% (Source: Entered by farmer)`;
    result.ruleExplanation_mr = `स्वतः खाद्य दर: ${numManualRate}% (स्रोत: शेतकऱ्याने भरलेला दर)`;

    // Daily Feed: Biomass × Manual Feeding Rate ÷ 100
    const dailyFeed = (biomass * numManualRate) / 100;
    result.dailyFeed = dailyFeed;
    result.morningFeed = dailyFeed * 0.5;
    result.eveningFeed = dailyFeed * 0.5;
    result.dailyFeedCost = dailyFeed * numPrice;
    result.isValid = true;
    return result;
  }

  // 4. Handle PREDEFINED SPECIES
  // Pangasius check: requires culture month
  if (species.toLowerCase() === 'pangasius' && (cultureMonth === '' || cultureMonth === null || cultureMonth === undefined)) {
    result.specialStatus = 'NEEDS_MONTH';
    result.message = 'Please specify the Culture Period / Month to determine the Pangasius feeding rate.';
    result.message_mr = 'पंगासियस खाद्य दर निश्चित करण्यासाठी कृपया संवर्धन महिना निवडा.';
    return result;
  }

  const matchedRule = findFeedingRule(rulesList, {
    species,
    cultureStage,
    averageWeight: numWeight,
    cultureMonth: cultureMonth ? Number(cultureMonth) : null,
  });

  if (!matchedRule) {
    result.specialStatus = 'NO_RULE';
    result.message = 'Feeding rate unavailable: No verified predefined feeding rule is available for this species/stage/weight combination.';
    result.message_mr = 'खाद्य दर उपलब्ध नाही: या जात/अवस्था/वजन संयोजनासाठी प्रमाणित स्वयंचलित खाद्य दर उपलब्ध नाही.';
    return result;
  }

  result.rule = matchedRule;

  // Check feeding method
  if (matchedRule.feeding_method === 'INITIAL_SPAWN_WEIGHT') {
    result.specialStatus = 'NEEDS_SPAWN_WEIGHT';
    result.message = 'Nursery feeding requires initial spawn-weight information.';
    result.message_mr = 'नर्सरी खाद्य गणनेसाठी सुरुवातीच्या स्पॉनचे वजन आवश्यक आहे.';
    result.ruleExplanation = `${species} → Nursery: ${matchedRule.notes || '4× to 8× initial spawn weight'}`;
    result.ruleExplanation_mr = `${species} → नर्सरी: ${matchedRule.notes_mr || 'सुरुवातीच्या स्पॉन वजनाच्या ४ ते ८ पट खाद्य'}`;
    return result;
  }

  if (matchedRule.feeding_method === 'VERIFIED_PROTOCOL') {
    result.specialStatus = 'VERIFIED_PROTOCOL';
    result.message = 'Use a verified Magur feeding protocol for this culture condition.';
    result.message_mr = 'या पालन परिस्थितीसाठी प्रमाणित मागूर खाद्य पद्धत वापरा.';
    result.ruleExplanation = `${species}: ${matchedRule.notes || 'Verified Protocol Required'}`;
    result.ruleExplanation_mr = `${species}: ${matchedRule.notes_mr || 'प्रमाणित मागूर पद्धत आवश्यक'}`;
    return result;
  }

  if (matchedRule.feeding_method === 'FORAGE_BASED') {
    result.specialStatus = 'FORAGE_BASED';
    result.message = 'Grass Carp feeding should follow a verified forage/supplementary-feed schedule.';
    result.message_mr = 'ग्रास कार्पसाठी प्रमाणित चारा व पूरक खाद्य वेळापत्रक वापरा.';
    result.ruleExplanation = `${species}: ${matchedRule.notes || 'Forage & Aquatic Vegetation Protocol'}`;
    result.ruleExplanation_mr = `${species}: ${matchedRule.notes_mr || 'चारा व पाणवनस्पती वेळापत्रक'}`;
    return result;
  }

  if (matchedRule.feeding_rate === null || matchedRule.feeding_rate === undefined) {
    result.specialStatus = 'NO_RULE';
    result.message = 'Feeding rate unavailable: No verified predefined feeding rule is available for this species/stage/weight combination.';
    result.message_mr = 'खाद्य दर उपलब्ध नाही: या जात/अवस्था/वजन संयोजनासाठी प्रमाणित स्वयंचलित खाद्य दर उपलब्ध नाही.';
    return result;
  }

  // Predefined BIOMASS_PERCENT calculation
  const feedingRate = Number(matchedRule.feeding_rate);
  result.feedingRate = feedingRate;
  result.rateSource = 'AUTOMATIC_RULE';

  // Construct explanatory rule breakdown
  let rangeStr = matchedRule.rate_min && matchedRule.rate_max && matchedRule.rate_min !== matchedRule.rate_max
    ? `${matchedRule.rate_min}–${matchedRule.rate_max}%`
    : `${feedingRate}%`;

  if (matchedRule.min_weight !== null && matchedRule.max_weight !== null) {
    result.ruleExplanation = `${species} (${matchedRule.scientific_name || ''}) → Weight ${matchedRule.min_weight}–${matchedRule.max_weight}g → ${rangeStr} biomass/day`;
    result.ruleExplanation_mr = `${species} → वजन ${matchedRule.min_weight}–${matchedRule.max_weight} ग्रॅम → बायोमासच्या ${rangeStr}/दिवस`;
  } else if (matchedRule.min_month !== null && matchedRule.max_month !== null) {
    result.ruleExplanation = `${species} → Month ${matchedRule.min_month}–${matchedRule.max_month} → ${rangeStr} biomass/day`;
    result.ruleExplanation_mr = `${species} → महिना ${matchedRule.min_month}–${matchedRule.max_month} → बायोमासच्या ${rangeStr}/दिवस`;
  } else {
    result.ruleExplanation = `${species} → ${cultureStage} → ${rangeStr} biomass/day`;
    result.ruleExplanation_mr = `${species} → ${cultureStage} → बायोमासच्या ${rangeStr}/दिवस`;
  }

  // 4. Daily Feed: Biomass × Automatically Selected Feeding Rate ÷ 100
  const dailyFeed = (biomass * feedingRate) / 100;
  result.dailyFeed = dailyFeed;

  // 5. Morning & Evening Feed: 50% split
  result.morningFeed = dailyFeed * 0.5;
  result.eveningFeed = dailyFeed * 0.5;

  // 6. Daily Feed Cost: Daily Feed × Feed Price per kg
  result.dailyFeedCost = dailyFeed * numPrice;
  result.isValid = true;

  return result;
}
