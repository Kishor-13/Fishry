import { 
  calculateSurvivingFish, 
  calculateBiomass, 
  calculateDailyFeed, 
  calculateMorningFeed, 
  calculateEveningFeed, 
  calculateFeedCost 
} from '../utils/calculations.js';
import { findMatchingFeedingRule } from './feedingRuleService.js';
import { IMC_NURSERY_REFERENCE, IMC_REARING_PERIODS, IMC_GROWOUT_PHASES } from '../constants/speciesData.js';

/**
 * Standardized Calculation Contract
 * 
 * calculateFeed(input, ruleOverride)
 */
export function calculateFeed(input, ruleOverride = null) {
  const {
    species = '',
    isCustom = false,
    cultureStage = '',
    rearingPeriod = 'month_1',
    growoutPhase = 'initial',
    stocked = '',
    survivalPercent = '85',
    averageWeight = '',
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
    feedingMode: 'AUTOMATIC', // 'AUTOMATIC' | 'MANUAL' | 'REFERENCE_ASSUMPTION'
    selectedRule: null,
    rule: null, // Alias for backward compatibility
    applicableRange: null, // { min: number, max: number }

    // Biomass consideration details
    biomassBasis: 'NORMAL_SURVIVAL_WEIGHT', // 'PROJECT_ASSUMPTION' | 'NORMAL_SURVIVAL_WEIGHT'
    biomassConsideration: '',
    biomassConsideration_mr: '',
    biomassFormulaStr: '',
    biomassFormulaStr_mr: '',

    // Contextual warning & notes
    warningType: 'GENERAL', // 'IMC_NURSERY' | 'IMC_REARING' | 'IMC_GROWOUT' | 'MAGUR' | 'GRASS_CARP' | 'CUSTOM' | 'GENERAL'
    warningText: '',
    warningText_mr: '',
    generalWarning: 'This is an estimated feed requirement based on the information entered and the selected feeding rule/reference. Actual feeding should be adjusted according to appetite, uneaten feed, growth, water quality, temperature, dissolved oxygen, stocking density, fish health, feed quality and other culture conditions.',
    generalWarning_mr: 'ही भरलेल्या माहितीवर आणि निवडलेल्या नियमावर/संदर्भावर आधारित अंदाजित खाद्य गरज आहे. प्रत्यक्ष खाद्य देताना माशांची भूक, शिल्लक खाद्य, वाढ, पाण्याची गुणवत्ता, तापमान, विरघळलेला ऑक्सिजन, मत्स्य घनता, माशांचे आरोग्य, खाद्याचा दर्जा आणि इतर संवर्धन परिस्थितीनुसार योग्य बदल करावा.',

    // Status & Validation helpers
    isValid: false,
    isIncomplete: false,
    requiresManualRate: false,
    specialStatus: null, // 'NEEDS_SPAWN_WEIGHT' | 'VERIFIED_PROTOCOL' | 'FORAGE_BASED' | 'NO_RULE' | 'NEEDS_MONTH'
    message: '',
    message_mr: '',
    ruleExplanation: '',
    ruleExplanation_mr: '',
  };

  const spLower = (species || '').toLowerCase();
  const isIMC = ['rohu', 'catla', 'mrigal'].includes(spLower);
  const stageLower = (cultureStage || '').toLowerCase();
  const isIMCNursery = isIMC && stageLower === 'nursery';
  const isCustomSpecies = Boolean(isCustom || species === 'Other / Custom' || spLower === 'other / custom');
  const isMagur = spLower === 'magur';
  const isGrassCarp = spLower === 'grass carp' || spLower === 'grass_carp';

  const numStocked = Number(stocked);
  const numSurvival = Number(survivalPercent);
  const numWeight = Number(averageWeight);
  const numPrice = Number(feedPrice) || 0;
  output.feedPriceNum = numPrice;

  // ===============================================================
  // 1. IMC NURSERY STAGE (SECTION 2 & 13)
  // ===============================================================
  if (isIMCNursery) {
    output.biomassBasis = 'PROJECT_ASSUMPTION';
    output.warningType = 'IMC_NURSERY';
    output.feedingMode = 'MANUAL';
    output.feedingMethod = 'MANUAL';
    output.rateSource = 'FARMER_ENTERED';
    output.applicableRange = { min: 400.0, max: 800.0 };

    output.biomassConsideration = 'Biomass consideration: Project assumption — 1 million spawn = 1.5 kg';
    output.biomassConsideration_mr = 'बायोमास विचार: प्रकल्प गृहीतक — १० लाख स्पॉन = १.५ किलो';

    output.warningText = 'Average spawn weight is difficult to measure accurately at nursery stage. Fishry therefore does not automatically determine a normal biomass-based feeding percentage.\n\nBiomass consideration: Project assumption — 1 million spawn = 1.5 kg.\n\nReference: First 5 days — 400% of initial biomass; After first 5 days — 800% of initial biomass.\n\nUse a verified feeding protocol and adjust according to feeding response and culture conditions.';
    output.warningText_mr = 'नर्सरी टप्प्यावर स्पॉनचे सरासरी वजन अचूक मोजणे कठीण असते. त्यामुळे Fishry स्वयंचलित बायोमास टक्केवारी ठरवत नाही.\n\nबायोमास विचार: प्रकल्प गृहीतक — १० लाख स्पॉन = १.५ किलो.\n\nसंदर्भ: पहिले ५ दिवस — सुरुवातीच्या बायोमासच्या ४००%; ५ दिवसांनंतर — ८००%.\n\nप्रमाणित खाद्य पद्धत वापरा आणि खाद्य प्रतिसाद व परिस्थितीनुसार योग्य दर ठरवा.';

    // Check stocked
    if (!stocked || isNaN(numStocked) || numStocked <= 0) {
      output.isIncomplete = true;
      output.message = 'Enter the number of spawn stocked to calculate initial biomass.';
      output.message_mr = 'सुरुवातीचा बायोमास मोजण्यासाठी साठवणूक केलेल्या स्पॉनची संख्या भरा.';
      return output;
    }

    // Formula: Initial biomass (kg) = Number of spawn × 1.5 / 1,000,000
    const initialBiomass = (numStocked * IMC_NURSERY_REFERENCE.BIOMASS_PER_MILLION_SPAWN_KG) / IMC_NURSERY_REFERENCE.SPAWN_PER_KG_BIOMASS;
    output.survivingFish = numStocked;
    output.biomass = initialBiomass;

    output.biomassFormulaStr = `Initial biomass = ${numStocked.toLocaleString()} spawn × 1.5 ÷ 1,000,000 = ${initialBiomass.toFixed(2)} kg`;
    output.biomassFormulaStr_mr = `सुरुवातीचा बायोमास = ${numStocked.toLocaleString()} स्पॉन × १.५ ÷ १०,००,००० = ${initialBiomass.toFixed(2)} किलो`;

    // Manual feeding selection is required
    const numManualRate = Number(manualRate);
    if (!manualRate || isNaN(numManualRate) || numManualRate <= 0) {
      output.isIncomplete = true;
      output.requiresManualRate = true;
      output.specialStatus = 'NEEDS_SPAWN_WEIGHT';
      output.message = 'Manual feeding rate is required for IMC Nursery. Select reference rate (400% or 800%) or enter your verified rate.';
      output.message_mr = 'नर्सरीसाठी मॅन्युअल खाद्य दर आवश्यक आहे. संदर्भ दर (४००% किंवा ८००%) निवडा किंवा स्वतःचा दर भरा.';
      return output;
    }

    // Manual rate provided
    output.feedingRate = numManualRate;
    output.ruleExplanation = `${species} Nursery: Initial biomass ${initialBiomass.toFixed(2)} kg (Project assumption) → Selected Rate ${numManualRate}% (Manual)`;
    output.ruleExplanation_mr = `${species} नर्सरी: सुरुवातीचा बायोमास ${initialBiomass.toFixed(2)} किलो (प्रकल्प गृहीतक) → निवडलेला दर ${numManualRate}% (मॅन्युअल)`;

    // Normal feed calculation formula (Biomass × Rate / 100)
    const dailyFeed = calculateDailyFeed(initialBiomass, numManualRate);
    output.dailyFeed = dailyFeed;
    output.morningFeed = calculateMorningFeed(dailyFeed);
    output.eveningFeed = calculateEveningFeed(dailyFeed);
    output.feedCost = calculateFeedCost(dailyFeed, numPrice);
    output.dailyFeedCost = output.feedCost;
    output.isValid = true;
    return output;
  }

  // ===============================================================
  // 2. NORMAL FISH VALIDATION (REARING, GROW-OUT, OTHER SPECIES)
  // ===============================================================
  if (!species || !cultureStage || !stocked || !survivalPercent || !averageWeight) {
    output.isIncomplete = true;
    output.message = 'Enter the required observations to see the calculation.';
    output.message_mr = 'गणना पाहण्यासाठी आवश्यक माहिती भरा.';
    return output;
  }

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

  // Normal Biomass Calculation
  const survivingFish = calculateSurvivingFish(numStocked, numSurvival);
  const biomass = calculateBiomass(survivingFish, numWeight);
  output.survivingFish = survivingFish;
  output.biomass = biomass;
  output.biomassBasis = 'NORMAL_SURVIVAL_WEIGHT';
  output.biomassConsideration = 'Biomass consideration: Surviving fish = Stocked × Survival % ÷ 100; Biomass = Surviving fish × Avg Weight ÷ 1,000';
  output.biomassConsideration_mr = 'बायोमास विचार: जिवंत मासे = साठवणूक × सर्व्हायव्हल % ÷ १००; बायोमास = जिवंत मासे × सरासरी वजन ÷ १,०००';
  output.biomassFormulaStr = `Surviving: ${survivingFish.toLocaleString()} fish | Biomass: ${biomass.toFixed(2)} kg`;
  output.biomassFormulaStr_mr = `जिवंत: ${survivingFish.toLocaleString()} मासे | बायोमास: ${biomass.toFixed(2)} किलो`;

  // ===============================================================
  // 3. OTHER / CUSTOM SPECIES (SECTION 10)
  // ===============================================================
  if (isCustomSpecies) {
    output.warningType = 'CUSTOM';
    output.feedingMode = 'MANUAL';
    output.feedingMethod = 'MANUAL';
    output.rateSource = 'FARMER_ENTERED';
    output.warningText = 'Fishry does not have a predefined feeding rule for this species. Enter a feeding rate based on a verified culture/feed protocol.';
    output.warningText_mr = 'या माशाच्या जातीसाठी Fishry कडे पूर्व-निर्धारित खाद्य नियम उपलब्ध नाही. प्रमाणित संवर्धन/खाद्य पद्धतीनुसार स्वतः खाद्य दर भरा.';

    const numManualRate = Number(manualRate);
    if (!manualRate || isNaN(numManualRate) || numManualRate <= 0) {
      output.isIncomplete = true;
      output.requiresManualRate = true;
      output.message = 'Manual feeding rate must be greater than 0%.';
      output.message_mr = 'स्वतः भरलेला खाद्य दर ०% पेक्षा जास्त असावा.';
      return output;
    }

    output.feedingRate = numManualRate;
    output.ruleExplanation = `Manual Feeding Rate: ${numManualRate}% (Source: Entered by farmer)`;
    output.ruleExplanation_mr = `स्वतः खाद्य दर: ${numManualRate}% (स्रोत: शेतकऱ्याने भरलेला दर)`;

    const dailyFeed = calculateDailyFeed(biomass, numManualRate);
    output.dailyFeed = dailyFeed;
    output.morningFeed = calculateMorningFeed(dailyFeed);
    output.eveningFeed = calculateEveningFeed(dailyFeed);
    output.feedCost = calculateFeedCost(dailyFeed, numPrice);
    output.dailyFeedCost = output.feedCost;
    output.isValid = true;
    return output;
  }

  // ===============================================================
  // 4. MAGUR (SECTION 8) - MANUAL MODE ONLY
  // ===============================================================
  if (isMagur) {
    output.warningType = 'MAGUR';
    output.feedingMode = 'MANUAL';
    output.feedingMethod = 'MANUAL';
    output.rateSource = 'FARMER_ENTERED';
    output.specialStatus = 'VERIFIED_PROTOCOL';
    output.warningText = 'No universal automatic feeding rate is applied for Magur. Use a verified culture/feed protocol and enter the appropriate rate manually.';
    output.warningText_mr = 'मागूरसाठी कोणताही सार्वत्रिक स्वयंचलित खाद्य दर लागू केलेला नाही. प्रमाणित संवर्धन/खाद्य पद्धत वापरा आणि योग्य दर स्वतः भरा.';

    const numManualRate = Number(manualRate);
    if (!manualRate || isNaN(numManualRate) || numManualRate <= 0) {
      output.isIncomplete = true;
      output.requiresManualRate = true;
      output.message = 'No universal automatic feeding rate is applied for Magur. Enter/select a verified feeding rate manually.';
      output.message_mr = 'मागूरसाठी कोणताही स्वयंचलित दर नाही. प्रमाणित पद्धतीनुसार मॅन्युअल खाद्य दर भरा.';
      return output;
    }

    output.feedingRate = numManualRate;
    output.ruleExplanation = `Magur: ${numManualRate}% manual feeding rate (Source: Farmer verified protocol)`;
    output.ruleExplanation_mr = `मागूर: ${numManualRate}% मॅन्युअल दर (स्रोत: शेतकऱ्याने प्रमाणित पद्धतीनुसार भरलेला)`;

    const dailyFeed = calculateDailyFeed(biomass, numManualRate);
    output.dailyFeed = dailyFeed;
    output.morningFeed = calculateMorningFeed(dailyFeed);
    output.eveningFeed = calculateEveningFeed(dailyFeed);
    output.feedCost = calculateFeedCost(dailyFeed, numPrice);
    output.dailyFeedCost = output.feedCost;
    output.isValid = true;
    return output;
  }

  // ===============================================================
  // 5. GRASS CARP (SECTION 9) - SPECIAL FEEDING METHOD / MANUAL
  // ===============================================================
  if (isGrassCarp) {
    output.warningType = 'GRASS_CARP';
    output.feedingMode = 'MANUAL';
    output.feedingMethod = 'FORAGE_BASED';
    output.rateSource = 'FARMER_ENTERED';
    output.specialStatus = 'FORAGE_BASED';
    output.warningText = 'Grass Carp feeding depends on forage/vegetation availability and culture conditions. Fishry does not apply a universal automatic pellet feeding percentage.';
    output.warningText_mr = 'ग्रास कार्पचे खाद्य वनस्पती/चाऱ्याची उपलब्धता आणि संवर्धन परिस्थितीवर अवलंबून असते. Fishry स्वयंचलित गोळी खाद्य दर लागू करत नाही.';

    const numManualRate = Number(manualRate);
    if (!manualRate || isNaN(numManualRate) || numManualRate <= 0) {
      output.isIncomplete = true;
      output.requiresManualRate = true;
      output.message = 'Grass Carp feeding depends on forage availability. Enter a manual supplementary pellet rate if given.';
      output.message_mr = 'ग्रास कार्पचे खाद्य चाऱ्यावर अवलंबून असते. पूरक गोळी खाद्यासाठी मॅन्युअल दर भरा.';
      return output;
    }

    output.feedingRate = numManualRate;
    output.ruleExplanation = `Grass Carp: ${numManualRate}% supplementary feed (Special forage-based method)`;
    output.ruleExplanation_mr = `ग्रास कार्प: ${numManualRate}% पूरक खाद्य दर (विशेष चारा पद्धत)`;

    const dailyFeed = calculateDailyFeed(biomass, numManualRate);
    output.dailyFeed = dailyFeed;
    output.morningFeed = calculateMorningFeed(dailyFeed);
    output.eveningFeed = calculateEveningFeed(dailyFeed);
    output.feedCost = calculateFeedCost(dailyFeed, numPrice);
    output.dailyFeedCost = output.feedCost;
    output.isValid = true;
    return output;
  }

  // ===============================================================
  // 6. PANGASIUS (SECTION 7) - MONTH-BASED AUTOMATIC
  // ===============================================================
  if (spLower === 'pangasius') {
    if (cultureMonth === null || cultureMonth === '' || cultureMonth === undefined) {
      output.specialStatus = 'NEEDS_MONTH';
      output.message = 'Please specify the Culture Period / Month to determine the Pangasius feeding rate.';
      output.message_mr = 'पंगासियस खाद्य दर निश्चित करण्यासाठी कृपया संवर्धन महिना निवडा.';
      return output;
    }
  }

  // ===============================================================
  // 7. IMC REARING STAGE (SECTION 3) - RANGE-BASED REFERENCE
  // ===============================================================
  if (isIMC && stageLower === 'rearing') {
    output.warningType = 'IMC_REARING';
    output.feedingMode = 'REFERENCE_ASSUMPTION';
    output.rateSource = manualRate ? 'FARMER_ENTERED' : 'REFERENCE_ASSUMPTION';
    output.warningText = 'The displayed rate is a reference starting range, not a fixed prescription. Adjust according to fish growth, water quality, plankton availability and feeding response.';
    output.warningText_mr = 'दर्शविलेला दर ही संदर्भासाठी सुरुवातीची श्रेणी आहे, अंतिम बंधनकारक नियम नाही. माशांची वाढ, पाण्याची गुणवत्ता, प्लॅवक उपलब्धता आणि खाण्याचा प्रतिसाद यानुसार योग्य दर निवडा.';

    // Identify rearing period
    let activePeriod = rearingPeriod || 'month_1';
    if (!rearingPeriod && cultureMonth) {
      const m = Number(cultureMonth);
      if (m <= 1) activePeriod = 'month_1';
      else if (m === 2) activePeriod = 'month_2';
      else activePeriod = 'later';
    }

    const periodConfig = IMC_REARING_PERIODS.find((p) => p.id === activePeriod) || IMC_REARING_PERIODS[0];
    output.applicableRange = { min: periodConfig.rate_min, max: periodConfig.rate_max };

    // Select rate: user entered or reference default
    const numManualRate = (manualRate !== null && manualRate !== '' && !isNaN(Number(manualRate)) && Number(manualRate) > 0)
      ? Number(manualRate)
      : periodConfig.default_rate;

    output.feedingRate = numManualRate;
    output.ruleExplanation = `${species} → Rearing (${periodConfig.label}): ${periodConfig.rate_min}–${periodConfig.rate_max}% BW/day (Selected: ${numManualRate}%)`;
    output.ruleExplanation_mr = `${species} → रिअरिंग (${periodConfig.label_mr}): ${periodConfig.rate_min}–${periodConfig.rate_max}% बायोमास/दिवस (निवडलेला दर: ${numManualRate}%)`;

    const dailyFeed = calculateDailyFeed(biomass, numManualRate);
    output.dailyFeed = dailyFeed;
    output.morningFeed = calculateMorningFeed(dailyFeed);
    output.eveningFeed = calculateEveningFeed(dailyFeed);
    output.feedCost = calculateFeedCost(dailyFeed, numPrice);
    output.dailyFeedCost = output.feedCost;
    output.isValid = true;
    return output;
  }

  // ===============================================================
  // 8. IMC GROW-OUT STAGE (SECTION 4) - STAGE-BASED REFERENCE
  // ===============================================================
  if (isIMC && stageLower === 'grow-out') {
    output.warningType = 'IMC_GROWOUT';
    output.feedingMode = 'REFERENCE_ASSUMPTION';
    output.rateSource = manualRate ? 'FARMER_ENTERED' : 'REFERENCE_ASSUMPTION';
    output.warningText = 'The displayed rate is a reference starting range. Monitor feeding response and adjust according to culture conditions.';
    output.warningText_mr = 'दर्शविलेला दर ही संदर्भासाठी सुरुवातीची श्रेणी आहे. खाण्याचा प्रतिसाद तपासा आणि संवर्धन परिस्थितीनुसार योग्य दर ठरवा.';

    // Identify growout phase
    let activePhase = growoutPhase || 'initial';
    if (!growoutPhase && numWeight > 0) {
      if (numWeight < 250) activePhase = 'initial';
      else if (numWeight <= 700) activePhase = 'mid';
      else activePhase = 'final';
    }

    const phaseConfig = IMC_GROWOUT_PHASES.find((p) => p.id === activePhase) || IMC_GROWOUT_PHASES[0];
    output.applicableRange = { min: phaseConfig.rate_min, max: phaseConfig.rate_max };

    // Select rate: user entered or reference default
    const numManualRate = (manualRate !== null && manualRate !== '' && !isNaN(Number(manualRate)) && Number(manualRate) > 0)
      ? Number(manualRate)
      : phaseConfig.default_rate;

    output.feedingRate = numManualRate;
    output.ruleExplanation = `${species} → Grow-out (${phaseConfig.label}): ${phaseConfig.rate_min}–${phaseConfig.rate_max}% BW/day (Selected: ${numManualRate}%)`;
    output.ruleExplanation_mr = `${species} → ग्रो-आऊट (${phaseConfig.label_mr}): ${phaseConfig.rate_min}–${phaseConfig.rate_max}% बायोमास/दिवस (निवडलेला दर: ${numManualRate}%)`;

    const dailyFeed = calculateDailyFeed(biomass, numManualRate);
    output.dailyFeed = dailyFeed;
    output.morningFeed = calculateMorningFeed(dailyFeed);
    output.eveningFeed = calculateEveningFeed(dailyFeed);
    output.feedCost = calculateFeedCost(dailyFeed, numPrice);
    output.dailyFeedCost = output.feedCost;
    output.isValid = true;
    return output;
  }

  // ===============================================================
  // 9. GENERAL PREDEFINED RULE DETERMINATION (COMMON CARP, TILAPIA, PANGASIUS)
  // ===============================================================
  const matchedRule = ruleOverride || findMatchingFeedingRule({
    species,
    cultureStage,
    averageWeight: numWeight,
    cultureMonth: cultureMonth ? Number(cultureMonth) : null,
    rulesList,
  });

  output.selectedRule = matchedRule;
  output.rule = matchedRule; // Alias for backward compatibility

  if (!matchedRule) {
    output.specialStatus = 'NO_RULE';
    output.message = 'Feeding rate unavailable: No verified predefined feeding rule is available for this species/stage/weight combination.';
    output.message_mr = 'खाद्य दर उपलब्ध नाही: या जात/अवस्था/वजन संयोजनासाठी प्रमाणित स्वयंचलित खाद्य दर उपलब्ध नाही.';
    return output;
  }

  output.feedingMethod = matchedRule.feeding_method;
  output.feedingMode = matchedRule.feeding_mode || 'AUTOMATIC';

  // Tilapia Range handling
  if (spLower === 'tilapia' && matchedRule.rate_min && matchedRule.rate_max) {
    output.feedingMode = 'REFERENCE_ASSUMPTION';
    output.applicableRange = { min: matchedRule.rate_min, max: matchedRule.rate_max };
    output.warningText = 'Reference feeding range based on fish weight. Adjust rate according to feeding response.';
    output.warningText_mr = 'माशांच्या वजनावर आधारित संदर्भ खाद्य श्रेणी. खाद्य प्रतिसादानुसार योग्य दर निवडा.';
  }

  // Common Carp / Pangasius rate
  let feedingRate = Number(matchedRule.feeding_rate);
  if (manualRate !== null && manualRate !== '' && !isNaN(Number(manualRate)) && Number(manualRate) > 0) {
    feedingRate = Number(manualRate);
    output.feedingMode = 'MANUAL';
    output.rateSource = 'FARMER_ENTERED';
  } else {
    output.rateSource = matchedRule.feeding_mode === 'REFERENCE_ASSUMPTION' ? 'REFERENCE_ASSUMPTION' : 'AUTOMATIC_RULE';
  }

  output.feedingRate = feedingRate;

  // Rule explanation string construction
  let rangeStr = matchedRule.rate_min && matchedRule.rate_max && matchedRule.rate_min !== matchedRule.rate_max
    ? `${matchedRule.rate_min}–${matchedRule.rate_max}%`
    : `${feedingRate}%`;

  if (matchedRule.min_weight !== null && matchedRule.max_weight !== null) {
    output.ruleExplanation = `${species} (${matchedRule.scientific_name || ''}) → Weight ${matchedRule.min_weight}–${matchedRule.max_weight}g → ${rangeStr} body weight/day (Selected: ${feedingRate}%)`;
    output.ruleExplanation_mr = `${species} → वजन ${matchedRule.min_weight}–${matchedRule.max_weight} ग्रॅम → ${rangeStr} बायोमास/दिवस (निवडलेला: ${feedingRate}%)`;
  } else if (matchedRule.min_month !== null && matchedRule.max_month !== null) {
    output.ruleExplanation = `${species} → Month ${matchedRule.min_month}–${matchedRule.max_month} → ${rangeStr} body weight/day (Selected: ${feedingRate}%)`;
    output.ruleExplanation_mr = `${species} → महिना ${matchedRule.min_month}–${matchedRule.max_month} → ${rangeStr} बायोमास/दिवस (निवडलेला: ${feedingRate}%)`;
  } else {
    output.ruleExplanation = `${species} → ${cultureStage} → ${rangeStr} body weight/day (Selected: ${feedingRate}%)`;
    output.ruleExplanation_mr = `${species} → ${cultureStage} → ${rangeStr} बायोमास/दिवस (निवडलेला: ${feedingRate}%)`;
  }

  // Compute Daily, Morning, Evening Feed, and Cost
  const dailyFeed = calculateDailyFeed(biomass, feedingRate);
  output.dailyFeed = dailyFeed;
  output.morningFeed = calculateMorningFeed(dailyFeed);
  output.eveningFeed = calculateEveningFeed(dailyFeed);
  output.feedCost = calculateFeedCost(dailyFeed, numPrice);
  output.dailyFeedCost = output.feedCost;
  output.isValid = true;

  return output;
}
