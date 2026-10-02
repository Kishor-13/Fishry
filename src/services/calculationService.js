import { 
  calculateSurvivingFish, 
  calculateBiomass, 
  calculateDailyFeed, 
  calculateMorningFeed, 
  calculateEveningFeed, 
  calculateFeedCost 
} from '../utils/calculations.js';
import { findMatchingFeedingRule } from './feedingRuleService.js';

/**
 * Reusable Calculation Service (Section 41)
 * 
 * calculateFeed(input, ruleOverride)
 * 
 * Returns standardized calculation contract:
 * {
 *   survivingFish,
 *   biomass,
 *   feedingRate,
 *   dailyFeed,
 *   morningFeed,
 *   eveningFeed,
 *   feedCost,
 *   feedingMethod,
 *   rateSource,
 *   selectedRule
 * }
 */
export function calculateFeed(input, ruleOverride = null) {
  const {
    species,
    isCustom,
    cultureStage,
    stocked,
    survivalPercent,
    averageWeight,
    feedPrice = 0,
    cultureMonth = null,
    manualRate = null,
    rulesList = null,
  } = input || {};

  // Standard output contract
  const output = {
    survivingFish: 0,
    biomass: 0,
    feedingRate: null,
    dailyFeed: 0,
    morningFeed: 0,
    eveningFeed: 0,
    feedCost: 0,
    dailyFeedCost: 0,
    feedPriceNum: 0,
    feedingMethod: 'BIOMASS_PERCENT',
    rateSource: 'AUTOMATIC_RULE',
    selectedRule: null,
    
    // Status & Validation helpers
    isValid: false,
    isIncomplete: false,
    specialStatus: null, // 'NEEDS_SPAWN_WEIGHT' | 'VERIFIED_PROTOCOL' | 'FORAGE_BASED' | 'NO_RULE' | 'NEEDS_MONTH'
    message: '',
    message_mr: '',
    ruleExplanation: '',
    ruleExplanation_mr: '',
  };

  const numStocked = Number(stocked);
  const numSurvival = Number(survivalPercent);
  const numWeight = Number(averageWeight);
  const numPrice = Number(feedPrice) || 0;

  // 1. Incomplete check
  if (!species || !cultureStage || !stocked || !survivalPercent || !averageWeight) {
    output.isIncomplete = true;
    output.message = 'Enter the required observations to see the calculation.';
    output.message_mr = 'गणना पाहण्यासाठी आवश्यक माहिती भरा.';
    return output;
  }

  // 2. Numeric validation (Section 35)
  if (isNaN(numStocked) || numStocked <= 0) {
    output.message = 'Number stocked must be greater than 0.';
    output.message_mr = 'साठवणूक केलेली संख्या ० पेक्षा जास्त असावी.';
    return output;
  }

  if (isNaN(numSurvival) || numSurvival <= 0 || numSurvival > 100) {
    output.message = 'Survival percentage must be between 1% and 100%.';
    output.message_mr = 'जिवंत राहण्याचे प्रमाण १% ते १००% दरम्यान असावे.';
    return output;
  }

  if (isNaN(numWeight) || numWeight <= 0) {
    output.message = 'Average fish weight must be greater than 0 g.';
    output.message_mr = 'सरासरी वजन ० ग्रॅमपेक्षा जास्त असावे.';
    return output;
  }

  if (isNaN(numPrice) || numPrice < 0) {
    output.message = 'Feed price must be 0 or greater.';
    output.message_mr = 'खाद्याचा दर ० किंवा अधिक असावा.';
    return output;
  }

  // Compute Surviving Fish and Biomass
  const survivingFish = calculateSurvivingFish(numStocked, numSurvival);
  const biomass = calculateBiomass(survivingFish, numWeight);

  output.survivingFish = survivingFish;
  output.biomass = biomass;

  // 3. CRITICAL CUSTOM SPECIES RULE (Section 3 & 10)
  if (isCustom || species === 'Other / Custom') {
    const numManualRate = Number(manualRate);
    if (!manualRate || isNaN(numManualRate) || numManualRate <= 0) {
      output.isIncomplete = true;
      output.message = 'Manual feeding rate must be greater than 0%.';
      output.message_mr = 'स्वतः भरलेला खाद्य दर ०% पेक्षा जास्त असावा.';
      return output;
    }

    output.feedingRate = numManualRate;
    output.feedingMethod = 'MANUAL';
    output.rateSource = 'FARMER_ENTERED';
    output.ruleExplanation = `Manual Feeding Rate: ${numManualRate}% (Source: Entered by farmer)`;
    output.ruleExplanation_mr = `स्वतः खाद्य दर: ${numManualRate}% (स्रोत: शेतकऱ्याने भरलेला दर)`;

    const dailyFeed = calculateDailyFeed(biomass, numManualRate);
    output.dailyFeed = dailyFeed;
    output.morningFeed = calculateMorningFeed(dailyFeed);
    output.eveningFeed = calculateEveningFeed(dailyFeed);
    output.feedCost = calculateFeedCost(dailyFeed, numPrice);
    output.dailyFeedCost = output.feedCost;
    output.feedPriceNum = numPrice;
    output.isValid = true;
    return output;
  }

  // 4. Predefined Species Rule Determination
  // Pangasius check
  if (species.toLowerCase() === 'pangasius' && (cultureMonth === null || cultureMonth === '' || cultureMonth === undefined)) {
    output.specialStatus = 'NEEDS_MONTH';
    output.message = 'Please specify the Culture Period / Month to determine the Pangasius feeding rate.';
    output.message_mr = 'पंगासियस खाद्य दर निश्चित करण्यासाठी कृपया संवर्धन महिना निवडा.';
    return output;
  }

  const selectedRule = ruleOverride || findMatchingFeedingRule({
    species,
    cultureStage,
    averageWeight: numWeight,
    cultureMonth: cultureMonth ? Number(cultureMonth) : null,
    rulesList,
  });

  output.selectedRule = selectedRule;

  if (!selectedRule) {
    output.specialStatus = 'NO_RULE';
    output.message = 'Feeding rate unavailable: No verified predefined feeding rule is available for this species/stage/weight combination.';
    output.message_mr = 'खाद्य दर उपलब्ध नाही: या जात/अवस्था/वजन संयोजनासाठी प्रमाणित स्वयंचलित खाद्य दर उपलब्ध नाही.';
    return output;
  }

  output.feedingMethod = selectedRule.feeding_method;

  // Handle Special Non-Biomass Methods (Section 49)
  if (selectedRule.feeding_method === 'INITIAL_SPAWN_WEIGHT') {
    output.specialStatus = 'NEEDS_SPAWN_WEIGHT';
    output.message = 'Nursery feeding requires initial spawn-weight information.';
    output.message_mr = 'नर्सरी खाद्य गणनेसाठी सुरुवातीच्या स्पॉनचे वजन आवश्यक आहे.';
    output.ruleExplanation = `${species} → Nursery: ${selectedRule.notes || '4× to 8× initial spawn weight'}`;
    output.ruleExplanation_mr = `${species} → नर्सरी: ${selectedRule.notes_mr || 'सुरुवातीच्या स्पॉन वजनाच्या ४ ते ८ पट'}`;
    return output;
  }

  if (selectedRule.feeding_method === 'VERIFIED_PROTOCOL') {
    output.specialStatus = 'VERIFIED_PROTOCOL';
    output.message = 'Use a verified Magur feeding protocol for this culture condition.';
    output.message_mr = 'या पालन परिस्थितीसाठी प्रमाणित मागूर खाद्य पद्धत वापरा.';
    output.ruleExplanation = `${species}: ${selectedRule.notes || 'Verified protocol required'}`;
    output.ruleExplanation_mr = `${species}: ${selectedRule.notes_mr || 'प्रमाणित पद्धत आवश्यक'}`;
    return output;
  }

  if (selectedRule.feeding_method === 'FORAGE_BASED') {
    output.specialStatus = 'FORAGE_BASED';
    output.message = 'Grass Carp feeding should follow a verified forage/supplementary-feed schedule.';
    output.message_mr = 'ग्रास कार्पसाठी प्रमाणित चारा व पूरक खाद्य वेळापत्रक वापरा.';
    output.ruleExplanation = `${species}: ${selectedRule.notes || 'Forage-based protocol'}`;
    output.ruleExplanation_mr = `${species}: ${selectedRule.notes_mr || 'चारा व पूरक खाद्य वेळापत्रक'}`;
    return output;
  }

  if (selectedRule.feeding_rate === null || selectedRule.feeding_rate === undefined) {
    output.specialStatus = 'NO_RULE';
    output.message = 'Feeding rate unavailable: No verified predefined feeding rule is available for this species/stage/weight combination.';
    output.message_mr = 'खाद्य दर उपलब्ध नाही: या जात/अवस्था/वजन संयोजनासाठी प्रमाणित स्वयंचलित खाद्य दर उपलब्ध नाही.';
    return output;
  }

  // Predefined BIOMASS_PERCENT calculation
  const feedingRate = Number(selectedRule.feeding_rate);
  output.feedingRate = feedingRate;
  output.rateSource = 'AUTOMATIC_RULE';

  // Rule explanation string construction
  let rangeStr = selectedRule.rate_min && selectedRule.rate_max && selectedRule.rate_min !== selectedRule.rate_max
    ? `${selectedRule.rate_min}–${selectedRule.rate_max}%`
    : `${feedingRate}%`;

  if (selectedRule.min_weight !== null && selectedRule.max_weight !== null) {
    output.ruleExplanation = `${species} (${selectedRule.scientific_name || ''}) → Weight ${selectedRule.min_weight}–${selectedRule.max_weight}g → ${rangeStr} biomass/day`;
    output.ruleExplanation_mr = `${species} → वजन ${selectedRule.min_weight}–${selectedRule.max_weight} ग्रॅम → बायोमासच्या ${rangeStr}/दिवस`;
  } else if (selectedRule.min_month !== null && selectedRule.max_month !== null) {
    output.ruleExplanation = `${species} → Month ${selectedRule.min_month}–${selectedRule.max_month} → ${rangeStr} biomass/day`;
    output.ruleExplanation_mr = `${species} → महिना ${selectedRule.min_month}–${selectedRule.max_month} → बायोमासच्या ${rangeStr}/दिवस`;
  } else {
    output.ruleExplanation = `${species} → ${cultureStage} → ${rangeStr} biomass/day`;
    output.ruleExplanation_mr = `${species} → ${cultureStage} → बायोमासच्या ${rangeStr}/दिवस`;
  }

  // Compute Daily, Morning, Evening Feed, and Cost
  const dailyFeed = calculateDailyFeed(biomass, feedingRate);
  output.dailyFeed = dailyFeed;
  output.morningFeed = calculateMorningFeed(dailyFeed);
  output.eveningFeed = calculateEveningFeed(dailyFeed);
  output.feedCost = calculateFeedCost(dailyFeed, numPrice);
  output.dailyFeedCost = output.feedCost;
  output.feedPriceNum = numPrice;
  output.isValid = true;

  return output;
}
