import { 
  evaluateEnvironmentalOverrides,
  calculateVannameiCheckTray,
  lookupPreviousSessionObservation,
  calculateSessionFeedPlan,
  calculateFeed
} from './src/services/calculationService.js';
import { 
  SPECIES_LIST,
  FLOATING_FEED_OBSERVATIONS,
  SUBMERGED_TRAY_OBSERVATIONS,
  GREEN_FODDER_OBSERVATIONS,
  VANNAMEI_CHECK_TRAY_RATES,
  VANNAMEI_SESSIONS,
  DEFAULT_SESSIONS
} from './src/constants/speciesData.js';
import { translations } from './src/lib/translations.js';
import { exportFeedHistoryToCsv } from './src/lib/exportCsv.js';
import { calculateFeedDifference } from './src/utils/calculations.js';

console.log('================================================================');
console.log('FISHRY — NEW FINFISH & CRUSTACEAN INTEGRATION VERIFICATION SUITE');
console.log('Testing Sections 1 through 9 of the Final Development Prompt');
console.log('================================================================\n');

let pass = 0;
let fail = 0;

function assert(cond, msg) {
  if (cond) {
    console.log(`[PASS] ${msg}`);
    pass++;
  } else {
    console.error(`[FAIL] ${msg}`);
    fail++;
  }
}

// ============================================================================
// 1. FINFISH OBSERVATION METHODS & UNCLASSIFIED GAP HANDLING
// ============================================================================
console.log('--- 1. Species-Specific Observation Methods ---');

// Floating feed observations
const floatingFast = FLOATING_FEED_OBSERVATIONS.find(o => o.id === 'cleared_under_10min');
assert(floatingFast && (floatingFast.adjustmentPercent === 10 || floatingFast.proposed_adjustment === 7.5), 'Floating feed cleared < 10m suggests +5-10% increase');

const floatingNormal = FLOATING_FEED_OBSERVATIONS.find(o => o.id === 'cleared_15_30min');
assert(floatingNormal && (floatingNormal.adjustmentPercent === 0 || floatingNormal.proposed_adjustment === 0), 'Floating feed finishes 15-30m maintains current ration');

const floatingSatiety = FLOATING_FEED_OBSERVATIONS.find(o => o.id === 'remains_5_10pct_30min');
assert(floatingSatiety && (floatingSatiety.adjustmentPercent === -12.5 || floatingSatiety.proposed_adjustment === -12.5), 'Floating feed 5-10% remains suggests -10-15% reduction');

const floatingOverfeed = FLOATING_FEED_OBSERVATIONS.find(o => o.id === 'remains_over_20pct_30min');
assert(floatingOverfeed && (floatingOverfeed.adjustmentPercent === -40 || floatingOverfeed.proposed_adjustment === -40), 'Floating feed > 20% remains suggests -30-50% reduction');

const floatingHalt = FLOATING_FEED_OBSERVATIONS.find(o => o.id === 'fish_ignore_or_deep');
assert(floatingHalt && (floatingHalt.adjustmentPercent === -100 || floatingHalt.proposed_adjustment === -100), 'Fish ignore pellets suggests halting meal and checking water quality');

const floatingGap = FLOATING_FEED_OBSERVATIONS.find(o => o.id === 'unclassified_floating');
assert(floatingGap && (floatingGap.adjustmentPercent === 0 || floatingGap.proposed_adjustment === 0), 'Unclassified floating feed gap (10-15m / 15-20%) does NOT invent extra thresholds, keeps safe baseline');

// Submerged tray observations
const trayClean = SUBMERGED_TRAY_OBSERVATIONS.find(o => o.id === 'tray_clean');
assert(trayClean && (trayClean.adjustmentPercent === 10 || trayClean.proposed_adjustment === 7.5), 'Submerged tray clean suggests +5-10% increase');

const trayCrumbs = SUBMERGED_TRAY_OBSERVATIONS.find(o => o.id === 'tray_thin_layer_under_10pct');
assert(trayCrumbs && (trayCrumbs.adjustmentPercent === 0 || trayCrumbs.proposed_adjustment === 0), 'Submerged tray crumbs < 10% maintains ration');

const trayOverfeed = SUBMERGED_TRAY_OBSERVATIONS.find(o => o.id === 'tray_10_25pct_remaining');
assert(trayOverfeed && (trayOverfeed.adjustmentPercent === -25 || trayOverfeed.proposed_adjustment === -25), 'Submerged tray 10-25% remaining suggests -20-30% reduction');

const trayFoul = SUBMERGED_TRAY_OBSERVATIONS.find(o => o.id === 'tray_over_50pct_or_foul');
assert(trayFoul && (trayFoul.adjustmentPercent === -100 || trayFoul.proposed_adjustment === -100), 'Submerged tray > 50% remaining / foul dough flags condition and stops feed');

const trayGap = SUBMERGED_TRAY_OBSERVATIONS.find(o => o.id === 'tray_unclassified_25_50pct');
assert(trayGap && (trayGap.adjustmentPercent === 0 || trayGap.proposed_adjustment === 0), 'Unclassified submerged tray gap (25-50% range) does NOT invent extra percentage, retains safe baseline');

// Grass carp green fodder
const fodder12h = GREEN_FODDER_OBSERVATIONS.find(o => o.id === 'fodder_remains_over_12h');
assert(fodder12h && (fodder12h.adjustmentPercent === -100 || fodder12h.isFlagged === true), 'Grass carp green fodder remaining > 12h flags condition and stops fresh fodder');

// ============================================================================
// 2. STRICT SESSION-WISE ADJUSTMENT LOGIC (SECTION 3)
// ============================================================================
console.log('\n--- 2. Strict Session-wise Adjustment Logic ---');

const historyLog = [
  {
    id: 'rec_1',
    created_at: '2026-10-15T07:30:00Z',
    session_date: '2026-10-15',
    session: 'morning',
    species: 'Rohu',
    observation: 'Tray completely clean',
    proposed_adjustment_percent: 10,
  },
  {
    id: 'rec_2',
    created_at: '2026-10-15T16:30:00Z',
    session_date: '2026-10-15',
    session: 'evening',
    species: 'Rohu',
    observation: '10–25% feed remaining',
    proposed_adjustment_percent: -25,
  },
  {
    id: 'rec_magur_evening',
    created_at: '2026-10-15T19:00:00Z',
    session_date: '2026-10-15',
    session: 'evening',
    species: 'Magur (Clarias batrachus)',
    is_magur_delayed_inspection: true,
    observation: 'More than 50% remaining or foul dough',
    proposed_adjustment_percent: -100,
  }
];

// Day 2 Morning inquiry: MUST look up Day 1 Morning ONLY
const d2MorningObs = lookupPreviousSessionObservation(historyLog, {
  species: 'Rohu',
  session: 'morning',
  currentDate: '2026-10-16'
});
assert(d2MorningObs && d2MorningObs.session === 'morning', 'Day 2 Morning matches Day 1 Morning');
assert(d2MorningObs && d2MorningObs.proposed_adjustment_percent === 10, 'Day 2 Morning gets +10% from Day 1 Morning (+10%)');

// Day 2 Evening inquiry: MUST look up Day 1 Evening ONLY
const d2EveningObs = lookupPreviousSessionObservation(historyLog, {
  species: 'Rohu',
  session: 'evening',
  currentDate: '2026-10-16'
});
assert(d2EveningObs && d2EveningObs.session === 'evening', 'Day 2 Evening matches Day 1 Evening');
assert(d2EveningObs && d2EveningObs.proposed_adjustment_percent === -25, 'Day 2 Evening gets -25% from Day 1 Evening (-25%)');

// Verify: Morning observation NEVER adjusts Evening session
const crossCheckMorningToEvening = lookupPreviousSessionObservation([historyLog[0]], {
  species: 'Rohu',
  session: 'evening',
  currentDate: '2026-10-16'
});
assert(crossCheckMorningToEvening === null, 'Morning observation NEVER adjusts Evening session (No cross-adjustment)');

// Verify: Evening observation NEVER adjusts next Morning session
const crossCheckEveningToMorning = lookupPreviousSessionObservation([historyLog[1]], {
  species: 'Rohu',
  session: 'morning',
  currentDate: '2026-10-16'
});
assert(crossCheckEveningToMorning === null, 'Evening observation NEVER adjusts Morning session (No cross-adjustment)');

// Magur Delayed Inspection check: Next-morning inspection informs Evening session only
const magurMorningLookup = lookupPreviousSessionObservation([historyLog[2]], {
  species: 'Magur (Clarias batrachus)',
  session: 'morning',
  currentDate: '2026-10-16'
});
assert(magurMorningLookup === null, 'Magur next-morning inspection does NOT adjust morning session ration');

const magurEveningLookup = lookupPreviousSessionObservation([historyLog[2]], {
  species: 'Magur (Clarias batrachus)',
  session: 'evening',
  currentDate: '2026-10-16'
});
assert(magurEveningLookup !== null && magurEveningLookup.session === 'evening', 'Magur next-morning inspection informs next evening session recommendation');

// ============================================================================
// 3. ENVIRONMENTAL OVERRIDES & SAFETY HIERARCHY (SECTION 4)
// ============================================================================
console.log('\n--- 3. Environmental Overrides & Safety Hierarchy ---');

// 3.1 Normal DO (> 5.0 mg/L)
const doNormal = evaluateEnvironmentalOverrides({
  speciesId: 'rohu',
  dissolvedOxygen: '6.5',
  waterTemperature: '28'
});
assert(!doNormal.hasOverride, 'DO > 5.0 mg/L and 28°C applies no override');

// 3.2 Moderate DO stress (3.0–5.0 mg/L) -> 35% reduction
const doModerate = evaluateEnvironmentalOverrides({
  speciesId: 'rohu',
  dissolvedOxygen: '4.0',
  waterTemperature: '28'
});
assert(doModerate.hasOverride && doModerate.adjustmentPercent === -35, 'DO 4.0 mg/L proposes 25-50% reduction (35% mid)');

// 3.3 Critical DO (< 3.0 mg/L) or Piping -> Stop feeding
const doCritical = evaluateEnvironmentalOverrides({
  speciesId: 'rohu',
  dissolvedOxygen: '2.5',
  waterTemperature: '28'
});
assert(doCritical.isCritical && doCritical.adjustmentPercent === -100, 'DO < 3.0 mg/L triggers Critical Warning and stops feeding (-100%)');

const pipingCritical = evaluateEnvironmentalOverrides({
  speciesId: 'rohu',
  isFishPiping: true,
  dissolvedOxygen: '5.5'
});
assert(pipingCritical.isCritical && pipingCritical.adjustmentPercent === -100, 'Fish piping at surface triggers Critical Warning and stops feeding (-100%)');

// 3.4 Magur air-breathing exception: below 2.0 mg/L proposes 30% reduction when NOT piping
const magurException = evaluateEnvironmentalOverrides({
  speciesId: 'magur',
  dissolvedOxygen: '1.8',
  isFishPiping: false,
  waterTemperature: '28'
});
assert(magurException.hasOverride && magurException.adjustmentPercent === -30, 'Magur below 2.0 mg/L without piping gets 30% reduction exception');

// Safety requirement: Magur exception NOT applied when fish are piping/distressed
const magurPiping = evaluateEnvironmentalOverrides({
  speciesId: 'magur',
  dissolvedOxygen: '1.8',
  isFishPiping: true,
  waterTemperature: '28'
});
assert(magurPiping.isCritical && magurPiping.adjustmentPercent === -100, 'Safety requirement: Magur piping triggers critical stop (-100%), exception blocked');

// 3.5 Temperature overrides
const tempHigh = evaluateEnvironmentalOverrides({
  speciesId: 'rohu',
  waterTemperature: '34'
});
assert(tempHigh.hasOverride && tempHigh.adjustmentPercent === -25, 'Water temp > 32°C proposes 20-30% reduction (25% mid)');

const tempColdCarp = evaluateEnvironmentalOverrides({
  speciesId: 'rohu',
  waterTemperature: '12'
});
assert(tempColdCarp.hasOverride && tempColdCarp.code === 'COLD_CARP_MAINTENANCE', 'Carp below 14°C proposes maintenance diet 0.5% BW once every 2-3 days');

const tempColdTilapia = evaluateEnvironmentalOverrides({
  speciesId: 'tilapia',
  waterTemperature: '12'
});
assert(tempColdTilapia.isCritical && tempColdTilapia.adjustmentPercent === -100, 'Tilapia below 14°C halts feeding (-100%)');

const tempColdPangasius = evaluateEnvironmentalOverrides({
  speciesId: 'pangasius',
  waterTemperature: '12'
});
assert(tempColdPangasius.isCritical && tempColdPangasius.adjustmentPercent === -100, 'Pangasius below 14°C halts feeding (-100%)');

// 3.6 Weather, handling, chemical treatment
const overcast = evaluateEnvironmentalOverrides({
  speciesId: 'rohu',
  weatherCondition: 'overcast_heavy_rain'
});
assert(overcast.hasOverride && overcast.adjustmentPercent === -50, 'Continuous overcast or heavy rain proposes 50% reduction');

const netted = evaluateEnvironmentalOverrides({
  speciesId: 'rohu',
  handlingCondition: 'recently_netted'
});
assert(netted.hasOverride && netted.code === 'HANDLING_FASTING_GUIDANCE', 'After netting/sampling displays reviewable fasting guidance');

const chemical = evaluateEnvironmentalOverrides({
  speciesId: 'rohu',
  isChemicalTreatment: true
});
assert(chemical.hasOverride && chemical.code === 'TREATMENT_FASTING_GUIDANCE', 'Chemical/therapeutic treatment displays fasting guidance for confirmation');

// ============================================================================
// 4. PRESERVE DAILY FEED ALLOCATION & SESSION FEED PLANNING (SECTION 5)
// ============================================================================
console.log('\n--- 4. Daily Feed Allocation & Session Plan ---');

// Example: Daily requirement 1.0 kg (1000g), two equal sessions
const planRohuMorning = calculateSessionFeedPlan({
  dailyBaseFeed: 1.0,
  speciesId: 'rohu',
  session: 'morning',
  previousObservation: {
    observation: '10–25% feed remaining',
    proposed_adjustment_percent: -25
  },
  environmentalOverride: { hasOverride: false }
});
assert(planRohuMorning.baseSessionFeed === 0.5, 'Morning baseline = 0.5 kg (500g)');
assert(planRohuMorning.proposedQuantity === 0.375, 'Morning proposed feed = 0.375 kg (-25% from 500g)');
assert(planRohuMorning.precedenceLevel === 4, 'Precedence level 4 (Observation Adjustment)');

// Evening baseline remains independent (never silently changed)
const planRohuEvening = calculateSessionFeedPlan({
  dailyBaseFeed: 1.0,
  speciesId: 'rohu',
  session: 'evening',
  previousObservation: null,
  environmentalOverride: { hasOverride: false }
});
assert(planRohuEvening.baseSessionFeed === 0.5, 'Evening baseline remains 0.5 kg (no silent increase to compensate for morning)');
assert(planRohuEvening.proposedQuantity === 0.5, 'Evening proposed quantity = 0.5 kg');

// Critical environment override overrides observation
const planOverridden = calculateSessionFeedPlan({
  dailyBaseFeed: 1.0,
  speciesId: 'rohu',
  session: 'morning',
  previousObservation: {
    observation: 'Tray completely clean',
    proposed_adjustment_percent: 10
  },
  environmentalOverride: {
    hasOverride: true,
    isCritical: true,
    adjustmentPercent: -100,
    reason: 'Critical oxygen stress'
  }
});
assert(planOverridden.proposedQuantity === 0, 'Critical environmental warning takes precedence over positive observation (+10% clean tray -> 0kg stop)');
assert(planOverridden.precedenceLevel === 1, 'Precedence level 1 (Critical Distress / Dangerous Warning)');

// Daily ration cannot be silently increased beyond calculated baseline without protocol
const planIncreaseCap = calculateSessionFeedPlan({
  dailyBaseFeed: 1.0,
  speciesId: 'rohu',
  session: 'morning',
  previousObservation: {
    observation: 'Tray completely clean',
    proposed_adjustment_percent: 10
  },
  environmentalOverride: { hasOverride: false }
});
assert(planIncreaseCap.proposedQuantity === 0.55, 'Morning proposed quantity with +10% is 0.55 kg');
assert(planIncreaseCap.baseSessionFeed === 0.5, 'Morning baseline is 0.5 kg');

// ============================================================================
// 5. VANNAMEI SHRIMP 4 DAILY SESSIONS & CHECK-TRAY CALCULATION (SECTION 6)
// ============================================================================
console.log('\n--- 5. Vannamei Shrimp 4 Sessions & Check-Tray Calculations ---');

// Verify 4 daily sessions
assert(VANNAMEI_SESSIONS.length === 4, 'Vannamei has exactly 4 daily feeding sessions');
assert(VANNAMEI_SESSIONS[0].time === '7:00 AM', 'Session 1 is 7:00 AM');
assert(VANNAMEI_SESSIONS[1].time === '11:00 AM', 'Session 2 is 11:00 AM');
assert(VANNAMEI_SESSIONS[2].time === '4:00 PM', 'Session 3 is 4:00 PM');
assert(VANNAMEI_SESSIONS[3].time === '8:00 PM', 'Session 4 is 8:00 PM');

// Check-tray rate table verification:
// Formula: Tray feed (g) = session feed (kg) * tray rate (g/kg)
// Example from user prompt: 20 kg session feed * 3 g/kg (9-13g shrimp) = 60 g per tray
const tray9to13 = calculateVannameiCheckTray(20, 10.5);
assert(tray9to13.trayRatePerKg === 3.0, 'Average weight 10.5g tray rate is 3.0 g/kg');
assert(tray9to13.trayFeedG === 60, '20 kg planned feed * 3 g/kg = 60 g per tray (matches user prompt example)');
assert(tray9to13.checkingInterval === '2 hours', 'Checking interval is 2 hours');

const tray1to4 = calculateVannameiCheckTray(10, 2.5);
assert(tray1to4.trayRatePerKg === 1.0 && tray1to4.trayFeedG === 10, '2.5g shrimp: 10 kg * 1.0 g/kg = 10 g per tray');
assert(tray1to4.checkingInterval === '2 hours 30 minutes', '2.5g shrimp checking interval is 2 hours 30 minutes');

const tray23to33 = calculateVannameiCheckTray(15, 28.0);
assert(tray23to33.trayRatePerKg === 5.0 && tray23to33.trayFeedG === 75, '28g shrimp: 15 kg * 5.0 g/kg = 75 g per tray');
assert(tray23to33.checkingInterval === '1 hour 30 minutes', '28g shrimp checking interval is 1 hour 30 minutes');

// ============================================================================
// 6. GIANT FRESHWATER PRAWN INDEPENDENCE (SECTION 6E)
// ============================================================================
console.log('\n--- 6. Giant Freshwater Prawn Rules Independence ---');

// Prawn does NOT use Vannamei schedule or automatic percentage adjustments
const prawn = SPECIES_LIST.find(s => s.id === 'freshwater_prawn');
assert(prawn && prawn.category === 'Freshwater crustacean', 'Giant Freshwater Prawn is distinct category');
assert(prawn.scientific_name === 'Macrobrachium rosenbergii', 'Scientific name is Macrobrachium rosenbergii');

// Check tray for prawn does not apply
const prawnTray = calculateVannameiCheckTray(10, 0);
assert(prawnTray.trayFeedG === 0, 'calculateVannameiCheckTray returns 0 for 0 weight or outside Vannamei');

// ============================================================================
// 7. ACTUAL FEED TRACKING & CSV EXPORT COMPATIBILITY (SECTION 7 & 8)
// ============================================================================
console.log('\n--- 7. Actual Feed Tracking & CSV Export Compatibility ---');

const dummyRecords = [
  {
    id: 'rec_full',
    created_at: '2026-10-16T08:00:00Z',
    species: 'Rohu',
    culture_stage: 'Grow-out',
    biomass: 425,
    feeding_rate: 7,
    daily_feed: 29.75,
    session: 'morning',
    session_baseline_feed: 14.88,
    observation_method: 'submerged_tray',
    observation: 'Tray completely clean',
    environmental_override_reason: 'Normal - no override applied',
    check_tray_feed_g: null,
    confirmed_feed: 15.0,
    actual_feed: 15.5,
    difference_kg: 0.62,
    difference_percent: 4.17,
    feed_price: 40,
    actual_feed_cost: 620,
    feed_cost: 1190,
    difference_reason: 'Good appetite',
  },
  {
    id: 'rec_old',
    created_at: '2026-09-01T08:00:00Z',
    species: 'Catla',
    culture_stage: 'Rearing',
    biomass: 200,
    feeding_rate: 6,
    daily_feed: 12.0,
    feed_price: 40,
    feed_cost: 480,
    // Older record has no actual_feed, session, or new observation fields
  }
];

let generatedCsv = '';
const originalBlob = global.Blob;
const originalUrl = global.URL;
try {
  global.Blob = class {
    constructor(content) {
      generatedCsv = content.join('');
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

  // Verify all new columns exist
  assert(generatedCsv.includes('Feeding Session'), 'CSV has "Feeding Session" column');
  assert(generatedCsv.includes('Observation Method'), 'CSV has "Observation Method" column');
  assert(generatedCsv.includes('Environmental Overrides'), 'CSV has "Environmental Overrides" column');
  assert(generatedCsv.includes('Check-Tray Sample (g)'), 'CSV has "Check-Tray Sample (g)" column');
  assert(generatedCsv.includes('Calculated Feed Required (kg)'), 'CSV has "Calculated Feed Required (kg)" column');
  assert(generatedCsv.includes('Actual Feed Given (kg)'), 'CSV has "Actual Feed Given (kg)" column');
  assert(generatedCsv.includes('Actual Feed Cost (₹)'), 'CSV has "Actual Feed Cost (₹)" column');

  // Verify older record shows "Not recorded" / safe defaults without crashing
  assert(generatedCsv.includes('Not recorded'), 'Older record correctly outputs "Not recorded"');
  assert(generatedCsv.includes('Catla'), 'Older record data preserved');
} finally {
  global.Blob = originalBlob;
  global.URL = originalUrl;
}

// ============================================================================
// 8. BILINGUAL INTEGRITY (ENGLISH & MARATHI)
// ============================================================================
console.log('\n--- 8. Bilingual Integrity ---');

assert(translations.en.observation !== undefined, 'English observation translations exist');
assert(translations.mr.observation !== undefined, 'Marathi observation translations exist');
assert(translations.en.environmental !== undefined, 'English environmental translations exist');
assert(translations.mr.environmental !== undefined, 'Marathi environmental translations exist');
assert(translations.mr.observation.floatingFeed !== undefined, 'Marathi: तरंगते खाद्य निरीक्षण');
assert(translations.mr.observation.submergedTray !== undefined, 'Marathi: बुडविलेला ट्रे निरीक्षण');
assert(translations.mr.environmental.dissolvedOxygen !== undefined, 'Marathi: विद्राव्य प्राणवायू');

console.log('\n================================================================');
console.log(`TOTAL NEW INTEGRATION TESTS: ${pass + fail}`);
console.log(`PASSED: ${pass}`);
console.log(`FAILED: ${fail}`);
console.log('================================================================\n');

if (fail > 0) {
  process.exit(1);
} else {
  console.log('ALL NEW INTEGRATION TESTS PASSED 100%!\n');
}
