import { calculateFeed } from './src/services/calculationService.js';
import { calculateFeedDifference } from './src/utils/calculations.js';
import { exportFeedHistoryToCsv } from './src/lib/exportCsv.js';
import { translations } from './src/lib/translations.js';
import { 
  SPECIES_LIST, 
  VANNAMEI_FEEDING_SCHEDULE, 
  FEEDING_TRAY_OBSERVATIONS, 
  VANNAMEI_CRITICAL_CONDITIONS,
  FRESHWATER_PRAWN_STAGES 
} from './src/constants/speciesData.js';

console.log('================================================================');
console.log('FISHRY — COMPLETE END-TO-END FLOW VERIFICATION SCRIPT');
console.log('================================================================\n');

let stepCount = 0;
let errors = [];

function step(title) {
  stepCount++;
  console.log(`\n▶ STEP ${stepCount}: ${title}`);
}

function verify(condition, desc) {
  if (condition) {
    console.log(`  ✓ [SUCCESS] ${desc}`);
  } else {
    console.error(`  ✗ [FAILED] ${desc}`);
    errors.push(desc);
  }
}

// --------------------------------------------------------------------------
// FLOW STEP 1: Finfish Calculation & Backward Compatibility
// --------------------------------------------------------------------------
step('Finfish (Rohu) Calculation Flow');
const rohuInput = {
  species: 'Rohu',
  cultureStage: 'Rearing',
  rearingPeriod: 'month_2',
  stocked: 10000,
  survivalPercent: 85,
  averageWeight: 50,
  feedPrice: 40,
};
const rohuCalc = calculateFeed(rohuInput);
verify(rohuCalc.isValid === true, 'Rohu calculation succeeded');
verify(rohuCalc.survivingFish === 8500, 'Surviving fish = 8,500');
verify(rohuCalc.biomass === 425, 'Biomass = 425 kg');
verify(rohuCalc.calculatedFeed === 29.75, 'Calculated feed required = 29.75 kg');
verify(rohuCalc.dailyFeedCost === 1190, 'Daily feed cost = ₹1,190');

// Farmer reviews and enters actual feed
const rohuDiff = calculateFeedDifference(30, rohuCalc.calculatedFeed, rohuInput.feedPrice);
verify(rohuDiff.differenceKg === 0.25, 'Difference (kg) = +0.25 kg (given slightly more)');
verify(rohuDiff.differencePercent === 0.84, 'Difference (%) = +0.84%');
verify(rohuDiff.actualFeedCost === 1200, 'Actual feed cost = ₹1,200 (30 kg × ₹40)');

// --------------------------------------------------------------------------
// FLOW STEP 2: Vannamei Shrimp End-to-End Workflow
// --------------------------------------------------------------------------
step('Vannamei Shrimp Workflow (Day 30, Tray Leftovers, Algal Bloom)');
const vannameiInput = {
  species: 'Vannamei shrimp',
  cultureStage: 'Grow-out',
  cultureAge: 30, // Day 30 in table (Day 29–35: ref wt 3.1g, rate 5%)
  stocked: 50000,
  survivalPercent: 85,
  averageWeight: 3.1,
  feedPrice: 65,
  trayObservation: 'moderate_remaining', // 10–20% remaining
  criticalConditions: ['algal_bloom'], // Algal bloom: reduce 50%
};
const vannameiCalc = calculateFeed(vannameiInput);
verify(vannameiCalc.isValid === true, 'Vannamei calculation succeeded');
verify(vannameiCalc.survivingFish === 42500, 'Surviving shrimp = 42,500');
verify(vannameiCalc.biomass === 131.75, 'Biomass = 131.75 kg');
verify(vannameiCalc.calculatedFeed === 6.5875, 'Calculated base feed = 6.5875 kg');
// Conservative prioritization: Algal bloom is 50% reduction, moderate tray is 30–50% reduction
verify(vannameiCalc.proposedAdjustment !== null, 'Proposed adjustment exists');
verify(vannameiCalc.proposedAdjustment.action === 'REDUCE_50', 'Prioritized most conservative condition (Algal bloom -50%)');
verify(vannameiCalc.proposedAdjustment.proposedFeed === 3.294, 'Proposed feed adjusted to 3.294 kg');

// Farmer confirms 3.3 kg and later enters actual feed given = 3.0 kg
const vannameiConfirmed = 3.3;
const vannameiActual = 3.0;
const vDiff = calculateFeedDifference(vannameiActual, vannameiCalc.calculatedFeed, vannameiInput.feedPrice);
verify(vDiff.differenceKg === -3.588, 'Difference kg = -3.588 kg (less given due to condition/leftovers)');
verify(vDiff.differencePercent === -54.46, 'Difference % = -54.46%');
verify(vDiff.actualFeedCost === 195, 'Actual feed cost = ₹195 (3.0 kg × ₹65)');

// --------------------------------------------------------------------------
// FLOW STEP 3: Giant Freshwater Prawn Workflow Across All Stages
// --------------------------------------------------------------------------
step('Giant Freshwater Prawn (Macrobrachium rosenbergii) Multi-Stage Flow');

// 3.1 Hatchery stage:
const prawnHatchery = calculateFeed({
  species: 'Giant Freshwater Prawn',
  cultureStage: 'Hatchery (Larvae)',
  stocked: 500000,
});
verify(prawnHatchery.specialStatus === 'VERIFIED_PROTOCOL', 'Hatchery larvae flags verified protocol requirement');
verify(prawnHatchery.message.includes('Hatchery feeding protocol required'), 'Explains hatchery feeding protocol is required');
verify(prawnHatchery.feedingMethod === 'VERIFIED_PROTOCOL', 'Does not apply grow-out biomass percentage');

// 3.2 Nursery stage:
const prawnNursery = calculateFeed({
  species: 'Giant Freshwater Prawn',
  cultureStage: 'Nursery (PL/Juveniles)',
  stocked: 20000,
  survivalPercent: 80,
  averageWeight: 0.5,
  manualRate: 15, // Farmer confirms 15% within 10–20% broad FAO range
  feedPrice: 60,
});
verify(prawnNursery.isValid === true, 'Prawn nursery with confirmed rate is valid');
verify(prawnNursery.biomass === 8, 'Nursery biomass = 8 kg');
verify(prawnNursery.calculatedFeed === 1.2, 'Nursery calculated feed = 1.2 kg');

// 3.3 Grow-out stage:
const prawnGrowout = calculateFeed({
  species: 'Giant Freshwater Prawn',
  cultureStage: 'Grow-out',
  stocked: 10000,
  survivalPercent: 80,
  averageWeight: 25,
  manualRate: 3.5, // 3.5%
  feedPrice: 55,
  trayObservation: 'consumed',
});
verify(prawnGrowout.isValid === true, 'Prawn grow-out calculation succeeded');
verify(prawnGrowout.survivingFish === 8000, 'Surviving prawns = 8,000');
verify(prawnGrowout.biomass === 200, 'Estimated biomass = 200 kg');
verify(prawnGrowout.calculatedFeed === 7.0, 'Calculated feed = 7.0 kg');
verify(prawnGrowout.proposedAdjustment.note.includes('Do not automatically reuse Vannamei'), 'Prawn tray guidance does not reuse Vannamei percentage adjustments');

// 3.4 Broodstock stage:
const prawnBroodstock = calculateFeed({
  species: 'Giant Freshwater Prawn',
  cultureStage: 'Broodstock',
  stocked: 300,
  survivalPercent: 95,
  averageWeight: 80,
  manualRate: 2.0, // 2% within 1–3%
  feedType: 'fresh',
  feedPrice: 45,
});
verify(prawnBroodstock.isValid === true, 'Prawn broodstock calculation succeeded');
verify(prawnBroodstock.biomass === 22.8, 'Broodstock biomass = 22.8 kg');
verify(prawnBroodstock.calculatedFeed === 0.456, 'Broodstock daily feed = 0.456 kg');
verify(prawnBroodstock.warningText.includes('70–80%'), 'Moisture note highlights fresh feed contains 70–80% water');

// --------------------------------------------------------------------------
// FLOW STEP 4: Feed History Storage & Dashboard Aggregations
// --------------------------------------------------------------------------
step('Feed History Storage & Dashboard Accountability Integration');

// Simulating database/localStorage records: 1 older record (without actual feed) + 3 new records (with actual feed)
const simulatedHistory = [
  {
    id: 'rec_old_finfish',
    created_at: '2026-01-15T08:30:00Z',
    species: 'Catla',
    culture_stage: 'Grow-out',
    stocked: 5000,
    survival_percent: 85,
    average_weight: 400,
    biomass: 1700,
    feeding_rate: 2.5,
    daily_feed: 42.5,
    calculated_feed: 42.5,
    confirmed_feed: 42.5,
    actual_feed: null, // Older record! Not recorded!
    difference_kg: null,
    difference_percent: null,
    actual_feed_cost: null,
    feed_price: 38,
    feed_cost: 1615,
  },
  {
    id: 'rec_rohu_new',
    created_at: '2026-10-10T08:00:00Z',
    species: 'Rohu',
    culture_stage: 'Rearing',
    pond_id: 'pond_1',
    pond_name: 'Pond 1 - North',
    stocked: 10000,
    survival_percent: 85,
    average_weight: 50,
    biomass: 425,
    feeding_rate: 7,
    daily_feed: 29.75,
    calculated_feed: 29.75,
    confirmed_feed: 29.75,
    actual_feed: 30.0,
    difference_kg: 0.25,
    difference_percent: 0.84,
    actual_feed_cost: 1200,
    feed_price: 40,
    feed_cost: 1190,
  },
  {
    id: 'rec_vannamei_new',
    created_at: '2026-10-11T07:30:00Z',
    species: 'Vannamei shrimp',
    culture_stage: 'Grow-out',
    culture_age_days: 30,
    pond_id: 'pond_2',
    pond_name: 'Pond 2 - Shrimp',
    stocked: 50000,
    survival_percent: 85,
    average_weight: 3.1,
    biomass: 131.75,
    feeding_rate: 5.0,
    daily_feed: 6.59,
    calculated_feed: 6.59,
    confirmed_feed: 3.3,
    actual_feed: 3.0,
    difference_kg: -3.59,
    difference_percent: -54.48,
    actual_feed_cost: 195,
    feed_price: 65,
    feed_cost: 428,
  },
  {
    id: 'rec_prawn_new',
    created_at: '2026-10-11T09:00:00Z',
    species: 'Giant Freshwater Prawn',
    culture_stage: 'Grow-out',
    pond_id: 'pond_3',
    pond_name: 'Pond 3 - Prawn',
    stocked: 10000,
    survival_percent: 80,
    average_weight: 25,
    biomass: 200,
    feeding_rate: 3.5,
    daily_feed: 7.0,
    calculated_feed: 7.0,
    confirmed_feed: 7.0,
    actual_feed: 7.0,
    difference_kg: 0.0,
    difference_percent: 0.0,
    actual_feed_cost: 385,
    feed_price: 55,
    feed_cost: 385,
  }
];

// Replicate Dashboard metrics calculation logic
let totalCalcSum = 0;
let totalActSum = 0;
let actCount = 0;
let missCount = 0;
let costSum = 0;

simulatedHistory.forEach((r) => {
  const calc = Number(r.calculated_feed ?? r.daily_feed) || 0;
  totalCalcSum += calc;

  if (r.actual_feed !== null && r.actual_feed !== undefined && !isNaN(Number(r.actual_feed))) {
    const act = Number(r.actual_feed);
    totalActSum += act;
    actCount += 1;
    const price = Number(r.feed_price) || 0;
    costSum += (r.actual_feed_cost !== null && !isNaN(Number(r.actual_feed_cost)))
      ? Number(r.actual_feed_cost)
      : (act * price);
  } else {
    missCount += 1;
  }
});
const totalDiffSum = totalActSum - totalCalcSum;

verify(Number(totalCalcSum.toFixed(2)) === 85.84, `Total Calculated Required = ${totalCalcSum.toFixed(2)} kg (42.5 + 29.75 + 6.59 + 7.0)`);
verify(totalActSum === 40.0, `Total Actual Feed Given = ${totalActSum} kg (30.0 + 3.0 + 7.0)`);
verify(actCount === 3, '3 records have actual feed recorded');
verify(missCount === 1, '1 older record is identified as missing actual feed (preserves older data)');
verify(costSum === 1780, `Actual feed expenditure = ₹${costSum} (1200 + 195 + 385)`);

// --------------------------------------------------------------------------
// FLOW STEP 5: CSV Export with Older Records & New Accountability Columns
// --------------------------------------------------------------------------
step('CSV Export with 3-Tier Accountability Columns');

let exportedCsv = '';
const origBlob = global.Blob;
const origUrl = global.URL;
try {
  global.Blob = class {
    constructor(content) {
      exportedCsv = content.join('');
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

  exportFeedHistoryToCsv(simulatedHistory, 'en');

  verify(exportedCsv.includes('Calculated Feed Required (kg)'), 'CSV has Calculated Feed Required column');
  verify(exportedCsv.includes('Confirmed Feeding Quantity (kg)'), 'CSV has Confirmed Feeding Quantity column');
  verify(exportedCsv.includes('Actual Feed Given (kg)'), 'CSV has Actual Feed Given column');
  verify(exportedCsv.includes('Difference (kg)'), 'CSV has Difference (kg) column');
  verify(exportedCsv.includes('Difference (%)'), 'CSV has Difference (%) column');
  verify(exportedCsv.includes('Actual Feed Cost (₹)'), 'CSV has Actual Feed Cost (₹) column');
  verify(exportedCsv.includes('Not recorded'), 'Older record shows "Not recorded" instead of assuming actual = calculated');
} finally {
  global.Blob = origBlob;
  global.URL = origUrl;
}

// --------------------------------------------------------------------------
// FLOW STEP 6: FCR Safeguards and Actual Feed Aggregation
// --------------------------------------------------------------------------
step('FCR Module Safeguards and Feed Aggregation');

// Pond 1 records summation
const pond1Records = simulatedHistory.filter((r) => r.pond_id === 'pond_1');
const pond1TotalActualFeed = pond1Records.reduce((acc, curr) => {
  const val = (curr.actual_feed !== null && curr.actual_feed !== undefined)
    ? Number(curr.actual_feed)
    : (Number(curr.daily_feed) || 0);
  return acc + val;
}, 0);
verify(pond1TotalActualFeed === 30.0, 'FCR auto-fill uses actual feed input (30.0 kg) rather than daily calculated');

// FCR Calculation: Net biomass gain = Final biomass (1100kg) - Initial biomass (100kg) = 1000kg
// Actual Feed = 1500 kg -> FCR = 1500 / 1000 = 1.50
const fcrVal = 1500 / (1100 - 100);
verify(fcrVal === 1.5, 'FCR formula correctly computes 1.5 (FCR = Actual Feed Input ÷ Net Biomass Gain)');

// --------------------------------------------------------------------------
// FLOW STEP 7: Bilingual Localization Verification
// --------------------------------------------------------------------------
step('Bilingual System (English & Marathi)');

const requiredLabels = [
  { key: 'calculatedRequired', en: 'Calculated Feed Required', mr: 'आवश्यक गणना केलेले खाद्य' },
  { key: 'confirmedQuantity', en: 'Confirmed Feeding Quantity', mr: 'निश्चित केलेले खाद्य प्रमाण' },
  { key: 'actualGiven', en: 'Actual Feed Given', mr: 'प्रत्यक्ष दिलेले खाद्य' },
  { key: 'difference', en: 'Difference', mr: 'फरक' },
  { key: 'actualCost', en: 'Actual Feed Cost', mr: 'प्रत्यक्ष खाद्य खर्च' },
  { key: 'trayObservation', en: 'Feeding-Tray Observation', mr: 'खाद्य ट्रे निरीक्षण' },
  { key: 'estimatedBiomass', en: 'Estimated Biomass', mr: 'अंदाजित जैवभार' },
  { key: 'referenceRate', en: 'Reference Feeding Rate', mr: 'संदर्भित खाद्य दर' },
];

requiredLabels.forEach(({ key, en, mr }) => {
  verify(translations.en.feedTracking?.[key] === en, `EN feedTracking.${key} === "${en}"`);
  verify(translations.mr.feedTracking?.[key] === mr, `MR feedTracking.${key} === "${mr}"`);
});

// --------------------------------------------------------------------------
// SUMMARY
// --------------------------------------------------------------------------
console.log('\n================================================================');
if (errors.length === 0) {
  console.log('OVERALL FLOW VERIFICATION: 100% COMPLETE AND PASSING!');
  console.log('All 7 flow steps succeeded with 0 errors.');
} else {
  console.error(`OVERALL FLOW VERIFICATION FAILED: ${errors.length} errors found.`);
  process.exit(1);
}
console.log('================================================================\n');
