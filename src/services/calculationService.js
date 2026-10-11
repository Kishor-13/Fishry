import { 
  calculateSurvivingFish, 
  calculateBiomass, 
  calculateDailyFeed, 
  calculateMorningFeed, 
  calculateEveningFeed, 
  calculateFeedCost 
} from '../utils/calculations.js';
import { findMatchingFeedingRule } from './feedingRuleService.js';
import { 
  IMC_NURSERY_REFERENCE, 
  IMC_REARING_PERIODS, 
  IMC_GROWOUT_PHASES,
  VANNAMEI_FEEDING_SCHEDULE,
  FEEDING_TRAY_OBSERVATIONS,
  VANNAMEI_CRITICAL_CONDITIONS,
  FRESHWATER_PRAWN_STAGES 
} from '../constants/speciesData.js';

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
    cultureAge = null,
    feedType = 'pellet',
    trayObservation = 'none',
    criticalConditions = [],
  } = input || {};

  // Standard output contract
  const output = {
    survivingFish: 0,
    biomass: 0,
    feedingRate: null,
    dailyFeed: 0,
    calculatedFeed: 0, // Feature 3: Calculated Feed Required
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
    warningType: 'GENERAL', // 'IMC_NURSERY' | 'IMC_REARING' | 'IMC_GROWOUT' | 'MAGUR' | 'GRASS_CARP' | 'CUSTOM' | 'VANNAMEI' | 'FRESHWATER_PRAWN' | 'GENERAL'
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
    proposedAdjustment: null,
  };

  const spLower = (species || '').toLowerCase();
  const isIMC = ['rohu', 'catla', 'mrigal'].includes(spLower);
  const stageLower = (cultureStage || '').toLowerCase();
  const isIMCNursery = isIMC && stageLower === 'nursery';
  const isCustomSpecies = Boolean(isCustom || species === 'Other / Custom' || spLower === 'other / custom');
  const isMagur = spLower === 'magur';
  const isGrassCarp = spLower === 'grass carp' || spLower === 'grass_carp';
  const isVannamei = spLower.includes('vannamei') || spLower.includes('pacific white');
  const isFreshwaterPrawn = spLower.includes('freshwater prawn') || spLower.includes('macrobrachium') || spLower.includes('river prawn') || spLower.includes('महा-कोळंबी');

  const numStocked = Number(stocked);
  const numSurvival = Number(survivalPercent);
  const numWeight = Number(averageWeight);
  const numPrice = Number(feedPrice) || 0;
  output.feedPriceNum = numPrice;

  // ===============================================================
  // FEATURE 1: VANNAMEI SHRIMP (Litopenaeus vannamei)
  // Separate rules from finfish and freshwater prawn.
  // Age-based reference schedule (Days 1–120).
  // ===============================================================
  if (isVannamei) {
    output.scientific_name = 'Litopenaeus vannamei';
    output.category = 'Crustacean';
    output.warningType = 'VANNAMEI';
    output.biomassBasis = 'NORMAL_SURVIVAL_WEIGHT';
    output.rateSource = manualRate ? 'FARMER_ENTERED' : 'REFERENCE_ASSUMPTION';
    output.feedingMode = 'REFERENCE_ASSUMPTION';
    output.feedingMethod = 'BIOMASS_PERCENT';

    output.generalWarning = 'Vannamei reference schedule figures are reference guidance rather than universal prescriptions. Always adjust according to feeding-tray observations, water quality, and critical pond conditions.';
    output.generalWarning_mr = 'व्हॅनामेई संदर्भ वेळापत्रक ही मार्गदर्शक माहिती आहे, अंतिम नियम नाही. खाद्य ट्रे निरीक्षण, पाण्याची गुणवत्ता आणि तळ्यातील परिस्थितीनुसार प्रत्यक्ष खाद्य ठरवा.';

    // Check stocked
    if (!stocked || isNaN(numStocked) || numStocked <= 0) {
      output.isIncomplete = true;
      output.message = 'Enter number of shrimp post-larvae stocked.';
      output.message_mr = 'साठवणूक केलेल्या कोळंबीची संख्या भरा.';
      return output;
    }

    if (isNaN(numSurvival) || numSurvival <= 0 || numSurvival > 100) {
      output.message = 'Survival percentage must be between 1% and 100%.';
      output.message_mr = 'जिवंत राहण्याचे प्रमाण १% ते १००% दरम्यान असावे.';
      return output;
    }

    // Check culture age in days
    if (cultureAge === null || cultureAge === '' || cultureAge === undefined || isNaN(Number(cultureAge))) {
      output.isIncomplete = true;
      output.message = 'Enter culture age in days (1–120 days) to determine reference feeding rate.';
      output.message_mr = 'संदर्भ खाद्य दर निश्चित करण्यासाठी संवर्धन दिवस (१–१२० दिवस) भरा.';
      return output;
    }

    const ageDays = Number(cultureAge);
    if (ageDays < 1 || ageDays > 120) {
      output.specialStatus = 'NO_RULE';
      output.message = `Reference feeding rate unavailable: Culture age (${ageDays} days) falls outside the reference table (1–120 days). Enter a verified farm protocol rate.`;
      output.message_mr = `संदर्भ खाद्य दर उपलब्ध नाही: संवर्धन वय (${ageDays} दिवस) संदर्भ तक्त्याबाहेर (१–१२० दिवस) आहे. प्रमाणित संवर्धन दर स्वतः भरा.`;
      return output;
    }

    const scheduleItem = VANNAMEI_FEEDING_SCHEDULE.find((item) => ageDays >= item.min_day && ageDays <= item.max_day);
    if (!scheduleItem) {
      output.specialStatus = 'NO_RULE';
      output.message = `Reference feeding rate unavailable for day ${ageDays}.`;
      output.message_mr = `दिवस ${ageDays} साठी संदर्भ दर उपलब्ध नाही.`;
      return output;
    }

    // Determine average weight
    let effectiveWeight = numWeight;
    if (!effectiveWeight || isNaN(effectiveWeight) || effectiveWeight <= 0) {
      if (!scheduleItem.is_range && scheduleItem.ref_weight) {
        effectiveWeight = scheduleItem.ref_weight;
      } else {
        output.isIncomplete = true;
        output.message = `Average shrimp weight in grams is required for culture days 1–7 (Reference range: 0.02–0.4 g).`;
        output.message_mr = `१–७ दिवसांसाठी सरासरी वजन (ग्रॅम) आवश्यक आहे (संदर्भ श्रेणी: ०.०२–०.४ ग्रॅम).`;
        return output;
      }
    }

    // Surviving shrimp & biomass calculation
    const survivingShrimp = calculateSurvivingFish(numStocked, numSurvival);
    const biomass = calculateBiomass(survivingShrimp, effectiveWeight);
    output.survivingFish = survivingShrimp;
    output.biomass = biomass;
    output.biomassConsideration = 'Biomass consideration: Surviving shrimp = Stocked × Survival % ÷ 100; Biomass = Surviving shrimp × Avg Weight ÷ 1,000';
    output.biomassConsideration_mr = 'बायोमास विचार: जिवंत कोळंबी = साठवणूक × सर्व्हायव्हल % ÷ १००; बायोमास = जिवंत कोळंबी × सरासरी वजन ÷ १,०००';
    output.biomassFormulaStr = `Surviving: ${survivingShrimp.toLocaleString()} shrimp | Biomass: ${biomass.toFixed(2)} kg`;
    output.biomassFormulaStr_mr = `जिवंत: ${survivingShrimp.toLocaleString()} कोळंबी | बायोमास: ${biomass.toFixed(2)} किलो`;

    // Reference feeding rate determination
    let effectiveRate = null;
    if (scheduleItem.is_range) {
      // Days 1–7: Range 60–35% BW/day. Never silently convert to fixed arbitrary percentage.
      output.applicableRange = { min: scheduleItem.rate_min, max: scheduleItem.rate_max };
      const numManual = Number(manualRate);
      if (!manualRate || isNaN(numManual) || numManual <= 0) {
        output.isIncomplete = true;
        output.requiresManualRate = true;
        output.message = 'Culture days 1–7 reference rate is 60–35% body weight/day. Please confirm or enter your feeding rate within or according to this reference.';
        output.message_mr = '१–७ दिवसांसाठी संदर्भ दर ६०–३५% बायोमास/दिवस आहे. कृपया या संदर्भानुसार दर निवडा किंवा निश्चित करा.';
        return output;
      }
      effectiveRate = numManual;
      output.rateSource = 'FARMER_ENTERED';
      output.feedingMode = 'MANUAL';
      output.ruleExplanation = `Vannamei Days ${scheduleItem.min_day}–${scheduleItem.max_day} (Ref range: 60–35% BW/day) → Confirmed Rate: ${effectiveRate}% (Reference guidance)`;
      output.ruleExplanation_mr = `व्हॅनामेई दिवस ${scheduleItem.min_day}–${scheduleItem.max_day} (संदर्भ श्रेणी: ६०–३५% बायोमास/दिवस) → निश्चित दर: ${effectiveRate}% (मार्गदर्शक संदर्भ)`;
    } else {
      // Days 8–120: Specific reference rate
      output.applicableRange = { min: scheduleItem.rate, max: scheduleItem.rate };
      if (manualRate !== null && manualRate !== '' && !isNaN(Number(manualRate)) && Number(manualRate) > 0) {
        effectiveRate = Number(manualRate);
        output.rateSource = 'FARMER_ENTERED';
        output.feedingMode = 'MANUAL';
        output.ruleExplanation = `Vannamei Day ${ageDays} (Ref: ${scheduleItem.rate}% BW/day, ${scheduleItem.ref_weight}g) → Farmer Overridden Rate: ${effectiveRate}%`;
        output.ruleExplanation_mr = `व्हॅनामेई दिवस ${ageDays} (संदर्भ: ${scheduleItem.rate}%, ${scheduleItem.ref_weight} ग्रॅम) → शेतकऱ्याने निवडलेला दर: ${effectiveRate}%`;
      } else {
        effectiveRate = scheduleItem.rate;
        output.rateSource = 'AUTOMATIC_RULE';
        output.ruleExplanation = `Vannamei Day ${ageDays} Reference Table (Ref Avg Weight: ${scheduleItem.ref_weight}g) → Reference Feeding Rate: ${effectiveRate}% BW/day (Reference guidance)`;
        output.ruleExplanation_mr = `व्हॅनामेई दिवस ${ageDays} संदर्भ तक्ता (संदर्भ वजन: ${scheduleItem.ref_weight} ग्रॅम) → संदर्भित खाद्य दर: ${effectiveRate}% बायोमास/दिवस (मार्गदर्शक संदर्भ)`;
      }
    }

    output.feedingRate = effectiveRate;

    // Reference Feed Required (kg/day)
    const baseDailyFeed = calculateDailyFeed(biomass, effectiveRate);
    output.dailyFeed = baseDailyFeed;
    output.calculatedFeed = baseDailyFeed;
    output.morningFeed = calculateMorningFeed(baseDailyFeed);
    output.eveningFeed = calculateEveningFeed(baseDailyFeed);
    output.feedCost = calculateFeedCost(baseDailyFeed, numPrice);
    output.dailyFeedCost = output.feedCost;

    // Feeding-Tray and Critical-Condition Guidance Evaluation
    const trayObj = FEEDING_TRAY_OBSERVATIONS.find((o) => o.id === trayObservation) || FEEDING_TRAY_OBSERVATIONS[0];
    const activeConditions = (criticalConditions || []).map((cid) => VANNAMEI_CRITICAL_CONDITIONS.find((c) => c.id === cid)).filter(Boolean);

    // Prioritize most conservative appropriate action (no blind stacking)
    let mostConservativeCondition = null;
    if (activeConditions.length > 0) {
      const sorted = [...activeConditions].sort((a, b) => a.priority - b.priority);
      mostConservativeCondition = sorted[0];
    }

    let proposedFeed = baseDailyFeed;
    let proposedPercentAdj = 0;
    let adjustmentReason = '';
    let adjustmentReason_mr = '';
    let conditionAction = 'NONE';

    if (mostConservativeCondition && mostConservativeCondition.reduction_percent === 100) {
      proposedFeed = 0;
      proposedPercentAdj = -100;
      conditionAction = mostConservativeCondition.action;
      adjustmentReason = `Critical condition priority: ${mostConservativeCondition.label}. ${mostConservativeCondition.guidance}`;
      adjustmentReason_mr = `गंभीर परिस्थिती प्राधान्य: ${mostConservativeCondition.label_mr}. ${mostConservativeCondition.guidance_mr}`;
    } else if (trayObj.id === 'large_remaining') {
      proposedFeed = 0;
      proposedPercentAdj = -100;
      conditionAction = 'STOP_NEXT_MEAL';
      adjustmentReason = `Tray observation: ${trayObj.label}. ${trayObj.vannamei_guidance}`;
      adjustmentReason_mr = `खाद्य ट्रे निरीक्षण: ${trayObj.label_mr}. ${trayObj.vannamei_guidance_mr}`;
    } else if (mostConservativeCondition && mostConservativeCondition.reduction_percent === 50) {
      proposedFeed = baseDailyFeed * 0.5;
      proposedPercentAdj = -50;
      conditionAction = 'REDUCE_50';
      adjustmentReason = `Critical condition priority: ${mostConservativeCondition.label}. ${mostConservativeCondition.guidance}`;
      adjustmentReason_mr = `गंभीर परिस्थिती प्राधान्य: ${mostConservativeCondition.label_mr}. ${mostConservativeCondition.guidance_mr}`;
    } else if (trayObj.id === 'moderate_remaining') {
      proposedFeed = baseDailyFeed * 0.6;
      proposedPercentAdj = -40;
      conditionAction = 'REDUCE_30_50';
      adjustmentReason = `Tray observation: ${trayObj.label}. ${trayObj.vannamei_guidance}`;
      adjustmentReason_mr = `खाद्य ट्रे निरीक्षण: ${trayObj.label_mr}. ${trayObj.vannamei_guidance_mr}`;
    } else if (mostConservativeCondition && mostConservativeCondition.reduction_percent <= 40) {
      proposedFeed = baseDailyFeed * 0.6;
      proposedPercentAdj = -40;
      conditionAction = 'REDUCE_30_50';
      adjustmentReason = `Critical condition priority: ${mostConservativeCondition.label}. ${mostConservativeCondition.guidance}`;
      adjustmentReason_mr = `गंभीर परिस्थिती प्राधान्य: ${mostConservativeCondition.label_mr}. ${mostConservativeCondition.guidance_mr}`;
    } else if (trayObj.id === 'small_remaining') {
      proposedFeed = baseDailyFeed * 0.85;
      proposedPercentAdj = -15;
      conditionAction = 'REDUCE_10_20';
      adjustmentReason = `Tray observation: ${trayObj.label}. ${trayObj.vannamei_guidance}`;
      adjustmentReason_mr = `खाद्य ट्रे निरीक्षण: ${trayObj.label_mr}. ${trayObj.vannamei_guidance_mr}`;
    } else if (trayObj.id === 'consumed') {
      proposedFeed = baseDailyFeed * 1.075;
      proposedPercentAdj = 7.5;
      conditionAction = 'INCREASE_5_10';
      adjustmentReason = `Tray observation: ${trayObj.label}. ${trayObj.vannamei_guidance}`;
      adjustmentReason_mr = `खाद्य ट्रे निरीक्षण: ${trayObj.label_mr}. ${trayObj.vannamei_guidance_mr}`;
    }

    output.proposedAdjustment = {
      action: conditionAction,
      percent: proposedPercentAdj,
      proposedFeed: Number(proposedFeed.toFixed(3)),
      reason: adjustmentReason,
      reason_mr: adjustmentReason_mr,
      trayGuidance: trayObj.vannamei_guidance,
      trayGuidance_mr: trayObj.vannamei_guidance_mr,
      activeConditionsCount: activeConditions.length,
    };

    output.isValid = true;
    return output;
  }

  // ===============================================================
  // FEATURE 2: GIANT FRESHWATER PRAWN (Macrobrachium rosenbergii)
  // Source: FAO Fisheries Technical Paper 428
  // Separate rules from Vannamei and finfish.
  // ===============================================================
  if (isFreshwaterPrawn) {
    output.scientific_name = 'Macrobrachium rosenbergii';
    output.category = 'Freshwater crustacean';
    output.warningType = 'FRESHWATER_PRAWN';
    output.biomassBasis = 'NORMAL_SURVIVAL_WEIGHT';
    output.feedingMethod = 'BIOMASS_PERCENT';
    output.feedingMode = 'MANUAL';
    output.rateSource = manualRate ? 'FARMER_ENTERED' : 'REFERENCE_ASSUMPTION';

    output.generalWarning = 'FAO Freshwater Prawn Guidance: Adjust rates according to sampled size, feeding response, and water temperature. Fresh feed (trash fish, molluscs) moisture is not equivalent to dry pellets.';
    output.generalWarning_mr = 'FAO महा-कोळंबी मार्गदर्शक: कोळंबीचा आकार, खाण्याचा प्रतिसाद आणि पाण्याचे तापमान यानुसार दर ठरवा. ताज्या ओल्या खाद्यामधील पाण्याचे प्रमाण (७०-८०%) सुक्या गोळी खाद्यासारखे नसते.';

    const stageConfig = FRESHWATER_PRAWN_STAGES.find((s) => s.id === cultureStage) || FRESHWATER_PRAWN_STAGES[2]; // Default Grow-out

    // A. Hatchery larvae stage
    if (stageConfig.isHatchery) {
      output.specialStatus = 'VERIFIED_PROTOCOL';
      output.isIncomplete = true;
      output.feedingMode = 'MANUAL';
      output.feedingMethod = 'VERIFIED_PROTOCOL';
      output.warningText = 'Hatchery feeding protocol required.\n\nLarval feeding follows specialized Zoea stages (I–XI) using Artemia nauplii and prepared egg custard/diet. Do not apply grow-out biomass percentages to hatchery larvae.';
      output.warningText_mr = 'हॅचरी खाद्य पद्धत आवश्यक.\n\nअळ्यांच्या (झोइआ १-११) टप्प्यानुसार आर्टेमिया आणि विशेष अंड्याचे खाद्य वापरले जाते. अळ्यांना मुख्य संवर्धनाची बायोमास टक्केवारी लागू करू नका.';
      output.message = 'Hatchery feeding protocol required. Do not apply grow-out biomass percentages to hatchery larvae.';
      output.message_mr = 'हॅचरी खाद्य पद्धत आवश्यक. अळ्यांना ग्रो-आऊट बायोमास टक्केवारी लागू करू नका.';
      return output;
    }

    // Required inputs for Nursery, Grow-out, Broodstock
    if (!stocked || isNaN(numStocked) || numStocked <= 0) {
      output.isIncomplete = true;
      output.message = stageConfig.isBroodstock
        ? 'Enter the number of broodstock prawns.'
        : 'Enter the number of freshwater prawns stocked.';
      output.message_mr = stageConfig.isBroodstock
        ? 'ब्रूडस्टॉक कोळंबीची संख्या भरा.'
        : 'साठवणूक केलेल्या महा-कोळंबीची संख्या भरा.';
      return output;
    }

    if (isNaN(numSurvival) || numSurvival <= 0 || numSurvival > 100) {
      output.message = 'Survival percentage must be between 1% and 100%.';
      output.message_mr = 'जिवंत राहण्याचे प्रमाण १% ते १००% दरम्यान असावे.';
      return output;
    }

    if (isNaN(numWeight) || numWeight <= 0) {
      output.message = 'Average prawn weight in grams is required.';
      output.message_mr = 'कोळंबीचे सरासरी वजन (ग्रॅम) आवश्यक आहे.';
      return output;
    }

    const survivingPrawns = calculateSurvivingFish(numStocked, numSurvival);
    const biomass = calculateBiomass(survivingPrawns, numWeight);
    output.survivingFish = survivingPrawns;
    output.biomass = biomass;
    output.biomassConsideration = 'Biomass consideration: Surviving prawns = Stocked × Survival % ÷ 100; Biomass = Surviving prawns × Avg Weight ÷ 1,000';
    output.biomassConsideration_mr = 'बायोमास विचार: जिवंत कोळंबी = साठवणूक × सर्व्हायव्हल % ÷ १००; बायोमास = जिवंत कोळंबी × सरासरी वजन ÷ १,०००';
    output.biomassFormulaStr = `Surviving: ${survivingPrawns.toLocaleString()} prawns | Biomass: ${biomass.toFixed(2)} kg`;
    output.biomassFormulaStr_mr = `जिवंत: ${survivingPrawns.toLocaleString()} कोळंबी | बायोमास: ${biomass.toFixed(2)} किलो`;

    // B. Nursery post-larvae and juveniles
    if (stageConfig.isNursery) {
      output.applicableRange = { min: 10.0, max: 20.0 };
      output.warningText = 'FAO Nursery Reference: Approximately 10–20% of total prawn biomass per day. Adjust according to observed consumption and local verified protocol.';
      output.warningText_mr = 'FAO नर्सरी संदर्भ: एकूण बायोमासच्या अंदाजे १०–२०% दररोज. प्रत्यक्ष खाणे आणि स्थानिक प्रमाणित पद्धतीनुसार दर निवडा.';

      const numManual = Number(manualRate);
      if (!manualRate || isNaN(numManual) || numManual <= 0) {
        output.isIncomplete = true;
        output.requiresManualRate = true;
        output.message = 'Broad FAO reference for Nursery post-larvae/juveniles is 10–20% biomass/day. Select or enter your verified nursery feeding rate.';
        output.message_mr = 'नर्सरी पोस्ट-लार्व्हासाठी विस्तृत FAO संदर्भ दर १०–२०% बायोमास/दिवस आहे. स्थानिक प्रमाणित पद्धतीनुसार दर निवडा किंवा निश्चित करा.';
        return output;
      }

      output.feedingRate = numManual;
      output.ruleExplanation = `M. rosenbergii Nursery (FAO Reference: 10–20% BW/day) → Selected Rate: ${numManual}% (Farmer confirmed)`;
      output.ruleExplanation_mr = `महा-कोळंबी नर्सरी (FAO संदर्भ: १०–२०% बायोमास/दिवस) → निवडलेला दर: ${numManual}% (शेतकऱ्याने निश्चित केलेला)`;
    } else if (stageConfig.isBroodstock) {
      // D. Broodstock
      output.applicableRange = { min: 1.0, max: 3.0 };
      output.warningText = 'FAO Broodstock Reference: 1–3% of total biomass per day.\n\nNote: Fresh feed (trash fish, squid, mussel) moisture is approx 70–80%, compared to 10% in dry pellets. Do not assume fresh-feed weight is equivalent to dry pellet weight.';
      output.warningText_mr = 'FAO ब्रूडस्टॉक संदर्भ: १–३% बायोमास/दिवस.\n\nटीप: ताज्या खाद्यामध्ये ७०–८०% पाणी असते; ताज्या खाद्याचे वजन सुक्या गोळी खाद्यासारखे समजू नका.';

      const numManual = Number(manualRate);
      if (!manualRate || isNaN(numManual) || numManual <= 0) {
        output.isIncomplete = true;
        output.requiresManualRate = true;
        output.message = 'FAO Broodstock reference is 1–3% biomass/day. Confirm selected rate or use verified farm protocol.';
        output.message_mr = 'ब्रूडस्टॉकसाठी FAO संदर्भ दर १–३% बायोमास/दिवस आहे. तुमचा दर निश्चित करा किंवा प्रमाणित पद्धत वापरा.';
        return output;
      }

      output.feedingRate = numManual;
      output.ruleExplanation = `M. rosenbergii Broodstock (FAO Ref: 1–3% BW/day, Feed type: ${feedType}) → Confirmed Rate: ${numManual}%`;
      output.ruleExplanation_mr = `महा-कोळंबी ब्रूडस्टॉक (FAO संदर्भ: १–३%, खाद्य प्रकार: ${feedType}) → निश्चित दर: ${numManual}%`;
    } else {
      // C. Grow-out
      output.applicableRange = { min: 2.0, max: 20.0 };
      output.warningText = 'Broad FAO Grow-out Reference: Smaller juveniles ~10–20% biomass/day; progressively lower rates as size increases; near harvest ~2% may be reached. Confirm rate for current size.';
      output.warningText_mr = 'विस्तृत FAO ग्रो-आऊट संदर्भ: लहान पिले ~१०–२०%; वाढीनुसार दर कमी; काढणीजवळ ~२% दर. सध्याच्या कोळंबीच्या आकारानुसार दर निश्चित करा.';

      const numManual = Number(manualRate);
      if (!manualRate || isNaN(numManual) || numManual <= 0) {
        output.isIncomplete = true;
        output.requiresManualRate = true;
        output.message = 'FAO Grow-out reference: smaller juveniles ~10–20% biomass/day; larger prawns progressively lower; near harvest ~2%. Please enter or confirm feeding rate for your prawn size.';
        output.message_mr = 'FAO ग्रो-आऊट संदर्भ: लहान पिले ~१०–२०% बायोमास/दिवस; मोठी कोळंबी कमी दर; काढणीजवळ ~२%. तुमच्या कोळंबीच्या आकारानुसार दर निश्चित करा.';
        return output;
      }

      output.feedingRate = numManual;
      output.ruleExplanation = `M. rosenbergii Grow-out (Avg weight: ${numWeight}g) → Farmer Confirmed Rate: ${numManual}% BW/day (FAO Guidance)`;
      output.ruleExplanation_mr = `महा-कोळंबी ग्रो-आऊट (सरासरी वजन: ${numWeight} ग्रॅम) → शेतकऱ्याने निश्चित केलेला दर: ${numManual}% (FAO संदर्भ)`;
    }

    const dailyFeed = calculateDailyFeed(biomass, output.feedingRate);
    output.dailyFeed = dailyFeed;
    output.calculatedFeed = dailyFeed;
    output.morningFeed = calculateMorningFeed(dailyFeed);
    output.eveningFeed = calculateEveningFeed(dailyFeed);
    output.feedCost = calculateFeedCost(dailyFeed, numPrice);
    output.dailyFeedCost = output.feedCost;

    // Freshwater Prawn Tray Management guidance (Section 10)
    const trayObj = FEEDING_TRAY_OBSERVATIONS.find((o) => o.id === trayObservation) || FEEDING_TRAY_OBSERVATIONS[0];
    output.proposedAdjustment = {
      action: trayObj.id,
      trayGuidance: trayObj.prawn_guidance,
      trayGuidance_mr: trayObj.prawn_guidance_mr,
      proposedFeed: dailyFeed, // Farmer must review and confirm
      note: 'Do not automatically reuse Vannamei percentage adjustments. Confirm final quantity using verified prawn protocol.',
      note_mr: 'व्हॅनामेईचे टक्केवारी बदल महा-कोळंबीसाठी थेट लागू करू नका. प्रमाणित पद्धतीनुसार अंतिम प्रमाण निश्चित करा.',
    };

    output.isValid = true;
    return output;
  }

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
    output.calculatedFeed = dailyFeed;
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
    output.calculatedFeed = dailyFeed;
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
    output.calculatedFeed = dailyFeed;
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
    output.calculatedFeed = dailyFeed;
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
    output.calculatedFeed = dailyFeed;
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
    output.calculatedFeed = dailyFeed;
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
  output.calculatedFeed = dailyFeed;
  output.morningFeed = calculateMorningFeed(dailyFeed);
  output.eveningFeed = calculateEveningFeed(dailyFeed);
  output.feedCost = calculateFeedCost(dailyFeed, numPrice);
  output.dailyFeedCost = output.feedCost;
  output.isValid = true;

  return output;
}
