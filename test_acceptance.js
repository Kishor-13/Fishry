import { calculateFeed } from './src/services/calculationService.js';
import { findMatchingFeedingRule } from './src/services/feedingRuleService.js';
import { calculateFeedDifference } from './src/utils/calculations.js';
import { translations } from './src/lib/translations.js';
import { exportFeedHistoryToCsv } from './src/lib/exportCsv.js';
import { 
  SPECIES_LIST, 
  VANNAMEI_FEEDING_SCHEDULE, 
  FEEDING_TRAY_OBSERVATIONS, 
  VANNAMEI_CRITICAL_CONDITIONS,
  FRESHWATER_PRAWN_STAGES
} from './src/constants/speciesData.js';

console.log('================================================================');
console.log('FISHRY SMART AQUACULTURE FEED MANAGER - COMPLETE ACCEPTANCE TESTS');
console.log('Features 1, 2, 3 & Existing Finfish Safeguards Verification');
console.log('================================================================\n');

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`[PASS] ${message}`);
    passCount++;
  } else {
    console.error(`[FAIL] ${message}`);
    failCount++;
  }
}

// ==========================================================================
// SECTION 1: EXISTING FINFISH RULES (PRESERVATION VERIFICATION)
// ==========================================================================
console.log('--- SECTION 1: Existing Finfish Rules Preservation ---');

// 1.1 Rohu Rearing Month 2 (7% working rate)
const rohuResult = calculateFeed({
  species: 'Rohu',
  cultureStage: 'Rearing',
  rearingPeriod: 'month_2',
  stocked: 10000,
  survivalPercent: 85,
  averageWeight: 50,
  feedPrice: 40,
});
assert(rohuResult.isValid === true, 'Rohu calculation is valid');
assert(rohuResult.survivingFish === 8500, `Surviving fish = ${rohuResult.survivingFish} (expected 8500)`);
assert(rohuResult.biomass === 425, `Biomass = ${rohuResult.biomass} kg (expected 425)`);
assert(rohuResult.feedingRate === 7, `Feeding rate = ${rohuResult.feedingRate}% (expected 7%)`);
assert(rohuResult.calculatedFeed === 29.75, `Calculated feed = ${rohuResult.calculatedFeed} kg (expected 29.75)`);
assert(rohuResult.dailyFeedCost === 1190, `Daily feed cost = ₹${rohuResult.dailyFeedCost} (expected ₹1190)`);

// 1.2 Common Carp Weight-Based Rule
const ccRule = findMatchingFeedingRule({
  species: 'Common Carp',
  cultureStage: 'Rearing',
  averageWeight: 35,
});
assert(ccRule !== null && ccRule.feeding_rate === 10, 'Common Carp 35g rule is 10% (weight-based priority)');

// 1.3 Tilapia Weight-Based Rule
const tilapiaRule = findMatchingFeedingRule({
  species: 'Tilapia',
  cultureStage: 'Grow-out',
  averageWeight: 25,
});
assert(tilapiaRule !== null && tilapiaRule.feeding_rate === 7, 'Tilapia 25g rule is 7% (FAO Tilapia schedule)');

// 1.4 IMC Nursery Spawn Rule
const nurseryResult = calculateFeed({
  species: 'Rohu',
  cultureStage: 'Nursery',
  stocked: 1200000,
  survivalPercent: 100,
  manualRate: 400,
});
assert(nurseryResult.isValid === true, 'IMC Nursery calculation is valid');
assert(nurseryResult.biomass === 1.8, `IMC Nursery 1.2M spawn biomass = ${nurseryResult.biomass} kg (expected 1.8 kg)`);
assert(nurseryResult.calculatedFeed === 7.2, `IMC Nursery 400% feed = ${nurseryResult.calculatedFeed} kg (expected 7.2 kg)`);

// 1.5 Magur verified protocol
const magurResult = calculateFeed({
  species: 'Magur',
  cultureStage: 'Rearing',
  stocked: 5000,
  survivalPercent: 85,
  averageWeight: 40,
});
assert(magurResult.specialStatus === 'VERIFIED_PROTOCOL', 'Magur correctly flags verified protocol');

// 1.6 Grass Carp forage schedule
const grassCarpResult = calculateFeed({
  species: 'Grass Carp',
  cultureStage: 'Grow-out',
  stocked: 2000,
  survivalPercent: 85,
  averageWeight: 200,
});
assert(grassCarpResult.specialStatus === 'FORAGE_BASED', 'Grass Carp correctly flags forage-based schedule');

// ==========================================================================
// SECTION 2: FEATURE 1 — VANNAMEI SHRIMP (Litopenaeus vannamei)
// ==========================================================================
console.log('\n--- SECTION 2: Feature 1 — Vannamei Shrimp ---');

// 2.1 Species metadata
const vannameiSpecies = SPECIES_LIST.find((s) => s.id === 'vannamei');
assert(vannameiSpecies !== undefined, 'Vannamei shrimp is in SPECIES_LIST');
assert(vannameiSpecies.scientific_name === 'Litopenaeus vannamei', 'Vannamei scientific name matches Litopenaeus vannamei');
assert(vannameiSpecies.category === 'Crustacean', 'Vannamei category is Crustacean');

// 2.2 Days 1–7 Range Rule (Does NOT silently convert 60–35% into an arbitrary fixed percentage)
const vannameiDay4 = calculateFeed({
  species: 'Vannamei shrimp',
  cultureStage: 'Grow-out',
  cultureAge: 4,
  stocked: 50000,
  survivalPercent: 80,
  averageWeight: 0.2, // 0.02–0.4g
  feedPrice: 65,
});
assert(vannameiDay4.requiresManualRate === true, 'Days 1–7 requires manual/confirmed rate (range 60–35%)');
assert(vannameiDay4.applicableRange?.min === 35 && vannameiDay4.applicableRange?.max === 60, 'Days 1–7 reference range is 35–60%');

// Provide farmer confirmed rate of 40% for Day 4
const vannameiDay4Confirmed = calculateFeed({
  species: 'Vannamei shrimp',
  cultureStage: 'Grow-out',
  cultureAge: 4,
  stocked: 50000,
  survivalPercent: 80,
  averageWeight: 0.2,
  feedPrice: 65,
  manualRate: 40,
});
assert(vannameiDay4Confirmed.isValid === true, 'Vannamei Day 4 with confirmed rate is valid');
assert(vannameiDay4Confirmed.biomass === 8, `Day 4 biomass = ${vannameiDay4Confirmed.biomass} kg (expected 8 kg)`);
assert(vannameiDay4Confirmed.calculatedFeed === 3.2, `Day 4 calculated feed = ${vannameiDay4Confirmed.calculatedFeed} kg (expected 3.2 kg)`);

// 2.3 Days 29–35 Reference Schedule (Day 30: 3.1g, 5.0% BW/day)
const vannameiDay30 = calculateFeed({
  species: 'Vannamei shrimp',
  cultureStage: 'Grow-out',
  cultureAge: 30,
  stocked: 50000,
  survivalPercent: 85,
  averageWeight: 3.1,
  feedPrice: 65,
});
assert(vannameiDay30.isValid === true, 'Vannamei Day 30 calculation is valid');
assert(vannameiDay30.survivingFish === 42500, `Surviving shrimp = ${vannameiDay30.survivingFish} (expected 42500)`);
assert(vannameiDay30.biomass === 131.75, `Biomass = ${vannameiDay30.biomass} kg (expected 131.75 kg)`);
assert(vannameiDay30.feedingRate === 5.0, `Feeding rate = ${vannameiDay30.feedingRate}% (expected 5.0%)`);
assert(vannameiDay30.calculatedFeed === 6.5875, `Calculated feed = ${vannameiDay30.calculatedFeed} kg (expected 6.5875 kg)`);

// 2.4 Outside 1–120 days table: Reference rate is unavailable (Does NOT invent missing values)
const vannameiDay125 = calculateFeed({
  species: 'Vannamei shrimp',
  cultureStage: 'Grow-out',
  cultureAge: 125,
  stocked: 50000,
  survivalPercent: 85,
  averageWeight: 26,
});
assert(vannameiDay125.isValid === false && vannameiDay125.specialStatus === 'NO_RULE', 'Culture age > 120 days flags reference rate unavailable');

// 2.5 Feeding-Tray Observations
// Observation: Feed completely consumed -> Proposed increase 5–10% (+7.5%)
const vannameiTrayConsumed = calculateFeed({
  species: 'Vannamei shrimp',
  cultureStage: 'Grow-out',
  cultureAge: 30,
  stocked: 50000,
  survivalPercent: 85,
  averageWeight: 3.1,
  trayObservation: 'consumed',
});
assert(vannameiTrayConsumed.proposedAdjustment?.action === 'INCREASE_5_10', 'Feed completely consumed suggests 5–10% increase');
assert(vannameiTrayConsumed.proposedAdjustment?.proposedFeed > vannameiTrayConsumed.calculatedFeed, 'Proposed feed is increased');

// Observation: Large amount remaining (>50%) -> Stop next meal (0 kg)
const vannameiTrayLarge = calculateFeed({
  species: 'Vannamei shrimp',
  cultureStage: 'Grow-out',
  cultureAge: 30,
  stocked: 50000,
  survivalPercent: 85,
  averageWeight: 3.1,
  trayObservation: 'large_remaining',
});
assert(vannameiTrayLarge.proposedAdjustment?.action === 'STOP_NEXT_MEAL', 'Large remaining feed suggests stopping next meal');
assert(vannameiTrayLarge.proposedAdjustment?.proposedFeed === 0, 'Proposed adjusted feed is 0 kg');

// 2.6 Critical Conditions: Conservative Prioritization (No Blind Stacking)
// When both "Low DO surfacing" (priority 1, 100% stop) and "Thick algal bloom" (priority 4, 50% reduce) apply:
const vannameiMultiCondition = calculateFeed({
  species: 'Vannamei shrimp',
  cultureStage: 'Grow-out',
  cultureAge: 30,
  stocked: 50000,
  survivalPercent: 85,
  averageWeight: 3.1,
  criticalConditions: ['algal_bloom', 'low_do_surfacing'],
});
assert(vannameiMultiCondition.proposedAdjustment?.action === 'STOP_1_2_DAYS', 'Prioritizes most conservative action (Low DO stop)');
assert(vannameiMultiCondition.proposedAdjustment?.proposedFeed === 0, 'Proposed feed is stopped (0 kg) rather than stacking reductions');

// Single condition: Moulting period -> reduce by 50%
const vannameiMoulting = calculateFeed({
  species: 'Vannamei shrimp',
  cultureStage: 'Grow-out',
  cultureAge: 30,
  stocked: 50000,
  survivalPercent: 85,
  averageWeight: 3.1,
  criticalConditions: ['moulting'],
});
assert(vannameiMoulting.proposedAdjustment?.action === 'REDUCE_50', 'Moulting period proposes 50% reduction');
assert(vannameiMoulting.proposedAdjustment?.proposedFeed === Number((vannameiDay30.calculatedFeed * 0.5).toFixed(3)), 'Proposed feed is reduced by 50%');

// ==========================================================================
// SECTION 3: FEATURE 2 — GIANT FRESHWATER PRAWN (Macrobrachium rosenbergii)
// ==========================================================================
console.log('\n--- SECTION 3: Feature 2 — Giant Freshwater Prawn ---');

// 3.1 Species metadata
const prawnSpecies = SPECIES_LIST.find((s) => s.id === 'freshwater_prawn');
assert(prawnSpecies !== undefined, 'Giant Freshwater Prawn is in SPECIES_LIST');
assert(prawnSpecies.scientific_name === 'Macrobrachium rosenbergii', 'Prawn scientific name matches Macrobrachium rosenbergii');
assert(prawnSpecies.category === 'Freshwater crustacean', 'Prawn category is Freshwater crustacean');

// 3.2 Hatchery Larvae: Separate hatchery mode, does NOT apply grow-out biomass %
const prawnHatchery = calculateFeed({
  species: 'Giant Freshwater Prawn',
  cultureStage: 'Hatchery (Larvae)',
  stocked: 100000,
});
assert(prawnHatchery.specialStatus === 'VERIFIED_PROTOCOL', 'Hatchery correctly flags verified protocol requirement');
assert(prawnHatchery.message.includes('Hatchery feeding protocol required'), 'Displays Hatchery feeding protocol required');
assert(prawnHatchery.feedingMethod === 'VERIFIED_PROTOCOL', 'Does not apply grow-out biomass percentage');

// 3.3 Nursery PL/Juveniles: Displays 10–20% broad FAO reference, farmer confirms rate
const prawnNurseryNoRate = calculateFeed({
  species: 'Giant Freshwater Prawn',
  cultureStage: 'Nursery (PL/Juveniles)',
  stocked: 20000,
  survivalPercent: 80,
  averageWeight: 0.5,
});
assert(prawnNurseryNoRate.requiresManualRate === true, 'Prawn Nursery requires farmer confirmed rate');
assert(prawnNurseryNoRate.applicableRange?.min === 10 && prawnNurseryNoRate.applicableRange?.max === 20, 'Displays FAO 10–20% reference range');

const prawnNurseryConfirmed = calculateFeed({
  species: 'Giant Freshwater Prawn',
  cultureStage: 'Nursery (PL/Juveniles)',
  stocked: 20000,
  survivalPercent: 80,
  averageWeight: 0.5,
  manualRate: 15, // Confirmed 15% within 10–20%
});
assert(prawnNurseryConfirmed.isValid === true, 'Prawn Nursery with confirmed rate is valid');
assert(prawnNurseryConfirmed.biomass === 8, `Biomass = ${prawnNurseryConfirmed.biomass} kg (expected 8 kg)`);
assert(prawnNurseryConfirmed.calculatedFeed === 1.2, `Calculated feed = ${prawnNurseryConfirmed.calculatedFeed} kg (expected 1.2 kg)`);

// 3.4 Grow-out: Size-based broad FAO examples, farmer confirmed rate
const prawnGrowout = calculateFeed({
  species: 'Giant Freshwater Prawn',
  cultureStage: 'Grow-out',
  stocked: 10000,
  survivalPercent: 80,
  averageWeight: 25,
  manualRate: 3.5,
  feedPrice: 55,
});
assert(prawnGrowout.isValid === true, 'Prawn Grow-out calculation is valid');
assert(prawnGrowout.survivingFish === 8000, `Surviving prawns = ${prawnGrowout.survivingFish} (expected 8000)`);
assert(prawnGrowout.biomass === 200, `Biomass = ${prawnGrowout.biomass} kg (expected 200 kg)`);
assert(prawnGrowout.calculatedFeed === 7.0, `Calculated feed = ${prawnGrowout.calculatedFeed} kg (expected 7.0 kg)`);
assert(prawnGrowout.feedCost === 385, `Feed cost = ₹${prawnGrowout.feedCost} (expected ₹385)`);

// 3.5 Broodstock: 1–3% FAO reference, fresh feed moisture note
const prawnBroodstock = calculateFeed({
  species: 'Giant Freshwater Prawn',
  cultureStage: 'Broodstock',
  stocked: 200, // broodstock count
  survivalPercent: 95,
  averageWeight: 80,
  manualRate: 2.0,
  feedType: 'fresh',
});
assert(prawnBroodstock.isValid === true, 'Prawn Broodstock calculation is valid');
assert(prawnBroodstock.applicableRange?.min === 1 && prawnBroodstock.applicableRange?.max === 3, 'Broodstock reference range is 1–3%');
assert(prawnBroodstock.warningText.includes('70–80%'), 'Explains fresh-feed moisture is not equivalent to dry pellets');

// 3.6 Prawn Tray Management: Does not blindly reuse Vannamei percentages
assert(prawnGrowout.proposedAdjustment?.note.includes('Do not automatically reuse Vannamei'), 'Prawn tray management warns not to reuse Vannamei percentage adjustments');

// ==========================================================================
// SECTION 4: FEATURE 3 — CALCULATED VS ACTUAL FEED TRACKING
// ==========================================================================
console.log('\n--- SECTION 4: Feature 3 — Calculated vs Confirmed vs Actual Feed ---');

// 4.1 Basic accountability difference calculation
// Case A: Farmer gave less feed (Actual = 25 kg, Calculated = 29.75 kg, Price = 40)
const diffLess = calculateFeedDifference(25, 29.75, 40);
assert(diffLess.differenceKg === -4.75, `Difference kg = ${diffLess.differenceKg} (expected -4.75)`);
assert(diffLess.differencePercent === -15.97, `Difference % = ${diffLess.differencePercent}% (expected -15.97%)`);
assert(diffLess.actualFeedCost === 1000, `Actual feed cost = ₹${diffLess.actualFeedCost} (expected ₹1000)`);

// Case B: Farmer gave more feed (Actual = 35 kg, Calculated = 29.75 kg, Price = 40)
const diffMore = calculateFeedDifference(35, 29.75, 40);
assert(diffMore.differenceKg === 5.25, `Difference kg = ${diffMore.differenceKg} (expected +5.25)`);
assert(diffMore.differencePercent === 17.65, `Difference % = ${diffMore.differencePercent}% (expected +17.65%)`);
assert(diffMore.actualFeedCost === 1400, `Actual feed cost = ₹${diffMore.actualFeedCost} (expected ₹1400)`);

// Case C: Calculated is zero -> percentage is null ("Not applicable")
const diffZeroCalc = calculateFeedDifference(5, 0, 40);
assert(diffZeroCalc.differencePercent === null, 'When calculated feed is 0, difference percent is null (Not applicable)');

// 4.2 History preservation: older records without actual feed show "Not recorded" in CSV
const dummyRecords = [
  {
    id: 'rec_old',
    created_at: '2026-01-01T10:00:00Z',
    species: 'Rohu',
    culture_stage: 'Rearing',
    daily_feed: 29.75,
    calculated_feed: 29.75,
    confirmed_feed: 29.75,
    actual_feed: null, // Older record
    difference_kg: null,
    difference_percent: null,
    actual_feed_cost: null,
    feed_price: 40,
    feed_cost: 1190,
  },
  {
    id: 'rec_new',
    created_at: '2026-10-11T10:00:00Z',
    species: 'Vannamei shrimp',
    culture_stage: 'Grow-out',
    daily_feed: 6.59,
    calculated_feed: 6.59,
    confirmed_feed: 6.59,
    actual_feed: 6.0,
    difference_kg: -0.59,
    difference_percent: -8.95,
    actual_feed_cost: 390,
    feed_price: 65,
    feed_cost: 428,
  }
];

// Test CSV Generation without browser error
let csvOutput = '';
const originalBlob = global.Blob;
const originalUrl = global.URL;
try {
  global.Blob = class {
    constructor(content) {
      csvOutput = content.join('');
    }
  };
  global.URL = {
    createObjectURL: () => 'blob:mock',
    revokeObjectURL: () => {},
  };
  global.document = {
    createElement: () => ({ setAttribute: () => {}, click: () => {} }),
    body: { appendChild: () => {}, removeChild: () => {} },
  };

  exportFeedHistoryToCsv(dummyRecords, 'en');
  assert(csvOutput.includes('Calculated Feed Required (kg)'), 'CSV headers include Calculated Feed Required');
  assert(csvOutput.includes('Confirmed Feeding Quantity (kg)'), 'CSV headers include Confirmed Feeding Quantity');
  assert(csvOutput.includes('Actual Feed Given (kg)'), 'CSV headers include Actual Feed Given');
  assert(csvOutput.includes('Actual Feed Cost (₹)'), 'CSV headers include Actual Feed Cost (₹)');
  assert(csvOutput.includes('Not recorded'), 'Older records output "Not recorded" in CSV');
} finally {
  global.Blob = originalBlob;
  global.URL = originalUrl;
}

// ==========================================================================
// SECTION 5: BILINGUAL TRANSLATION SYSTEM
// ==========================================================================
console.log('\n--- SECTION 5: Bilingual Translation Verification ---');

// Check translations for new suggested labels
assert(translations.mr.feedTracking?.calculatedRequired === 'आवश्यक गणना केलेले खाद्य', 'Marathi label: आवश्यक गणना केलेले खाद्य');
assert(translations.mr.feedTracking?.confirmedQuantity === 'निश्चित केलेले खाद्य प्रमाण', 'Marathi label: निश्चित केलेले खाद्य प्रमाण');
assert(translations.mr.feedTracking?.actualGiven === 'प्रत्यक्ष दिलेले खाद्य', 'Marathi label: प्रत्यक्ष दिलेले खाद्य');
assert(translations.mr.feedTracking?.difference === 'फरक', 'Marathi label: फरक');
assert(translations.mr.feedTracking?.actualCost === 'प्रत्यक्ष खाद्य खर्च', 'Marathi label: प्रत्यक्ष खाद्य खर्च');
assert(translations.mr.feedTracking?.trayObservation === 'खाद्य ट्रे निरीक्षण', 'Marathi label: खाद्य ट्रे निरीक्षण');
assert(translations.mr.feedTracking?.estimatedBiomass === 'अंदाजित जैवभार', 'Marathi label: अंदाजित जैवभार');
assert(translations.mr.feedTracking?.referenceRate === 'संदर्भित खाद्य दर', 'Marathi label: संदर्भित खाद्य दर');

console.log(`\n================================================================`);
console.log(`TOTAL ACCEPTANCE TESTS: ${passCount + failCount}`);
console.log(`PASSED: ${passCount}`);
console.log(`FAILED: ${failCount}`);
console.log(`================================================================`);

if (failCount > 0) {
  process.exit(1);
} else {
  console.log('ALL ACCEPTANCE TESTS PASSED SUCCESSFULLY!\n');
}
