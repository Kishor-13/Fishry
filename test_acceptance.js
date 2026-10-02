import { calculateFeed } from './src/services/calculationService.js';
import { findMatchingFeedingRule } from './src/services/feedingRuleService.js';
import { translations } from './src/data/translations.js';

console.log('================================================================');
console.log('SMART AQUACULTURE FEED MANAGER - ACCEPTANCE TESTS (Section 51)');
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

// --------------------------------------------------------------------------
// TEST 1 — Rohu Calculation
// Rohu, Rearing, 10,000 stocked, 85% survival, 50 g, ₹40/kg
// Expected: 8,500 fish, 425 kg biomass, 7% rate, 29.75 kg daily feed, 14.875 kg morning, 14.875 kg evening, ₹1,190 cost
// --------------------------------------------------------------------------
console.log('--- TEST 1: Rohu Calculation ---');
const rohuResult = calculateFeed({
  species: 'Rohu',
  cultureStage: 'Rearing',
  stocked: 10000,
  survivalPercent: 85,
  averageWeight: 50,
  feedPrice: 40,
});

assert(rohuResult.isValid === true, 'Calculation is marked valid');
assert(rohuResult.survivingFish === 8500, `Surviving fish = ${rohuResult.survivingFish} (expected 8500)`);
assert(rohuResult.biomass === 425, `Biomass = ${rohuResult.biomass} kg (expected 425)`);
assert(rohuResult.feedingRate === 7, `Feeding rate = ${rohuResult.feedingRate}% (expected 7%)`);
assert(rohuResult.dailyFeed === 29.75, `Daily feed = ${rohuResult.dailyFeed} kg (expected 29.75)`);
assert(rohuResult.morningFeed === 14.875, `Morning feed = ${rohuResult.morningFeed} kg (expected 14.875)`);
assert(rohuResult.eveningFeed === 14.875, `Evening feed = ${rohuResult.eveningFeed} kg (expected 14.875)`);
assert(rohuResult.feedCost === 1190, `Daily feed cost = ₹${rohuResult.feedCost} (expected ₹1190)`);
assert(rohuResult.rateSource === 'AUTOMATIC_RULE', 'Rate source is AUTOMATIC_RULE');

// --------------------------------------------------------------------------
// TEST 2 — Common Carp (Weight-based rule priority)
// Common Carp, 35 g
// Expected automatic rate: 10% (10–90 g rule takes priority over generic stage)
// --------------------------------------------------------------------------
console.log('\n--- TEST 2: Common Carp Weight-Based Rule ---');
const ccRule = findMatchingFeedingRule({
  species: 'Common Carp',
  cultureStage: 'Rearing',
  averageWeight: 35,
});

assert(ccRule !== null, 'Common Carp rule found');
assert(ccRule.feeding_rate === 10, `Common Carp 35g rate = ${ccRule?.feeding_rate}% (expected 10%)`);
assert(ccRule.priority === 50, 'Weight-based rule priority is 50');

// --------------------------------------------------------------------------
// TEST 3 — Tilapia (Weight-based rule)
// Tilapia, 25 g
// Expected automatic rate: 7% (10–40 g bracket)
// --------------------------------------------------------------------------
console.log('\n--- TEST 3: Tilapia Weight-Based Rule ---');
const tilapiaRule = findMatchingFeedingRule({
  species: 'Tilapia',
  cultureStage: 'Grow-out',
  averageWeight: 25,
});

assert(tilapiaRule !== null, 'Tilapia rule found');
assert(tilapiaRule.feeding_rate === 7, `Tilapia 25g rate = ${tilapiaRule?.feeding_rate}% (expected 7%)`);

// --------------------------------------------------------------------------
// TEST 4 — Custom Species
// Other / Custom, 5000 stocked, 90% survival, 100 g, 3% manual
// Expected: 4500 fish, 450 kg biomass, 13.5 kg/day, 6.75 morning, 6.75 evening
// --------------------------------------------------------------------------
console.log('\n--- TEST 4: Other / Custom Species ---');
const customResult = calculateFeed({
  species: 'Other / Custom',
  isCustom: true,
  cultureStage: 'Grow-out',
  stocked: 5000,
  survivalPercent: 90,
  averageWeight: 100,
  feedPrice: 40,
  manualRate: 3,
});

assert(customResult.isValid === true, 'Custom calculation is valid');
assert(customResult.survivingFish === 4500, `Surviving fish = ${customResult.survivingFish} (expected 4500)`);
assert(customResult.biomass === 450, `Biomass = ${customResult.biomass} kg (expected 450)`);
assert(customResult.feedingRate === 3, `Feeding rate = ${customResult.feedingRate}% (expected 3%)`);
assert(customResult.dailyFeed === 13.5, `Daily feed = ${customResult.dailyFeed} kg (expected 13.5)`);
assert(customResult.morningFeed === 6.75, `Morning feed = ${customResult.morningFeed} kg (expected 6.75)`);
assert(customResult.eveningFeed === 6.75, `Evening feed = ${customResult.eveningFeed} kg (expected 6.75)`);
assert(customResult.rateSource === 'FARMER_ENTERED', 'Rate source is FARMER_ENTERED');

// --------------------------------------------------------------------------
// TEST 5 — Change Custom -> Predefined Rule Selection
// findMatchingFeedingRule should ignore Other / Custom, but return Rohu rule when species changes
// --------------------------------------------------------------------------
console.log('\n--- TEST 5: Ignore Custom & Auto-detect Rohu ---');
const customRuleMatch = findMatchingFeedingRule({ species: 'Other / Custom' });
assert(customRuleMatch === null, 'Other / Custom returns null from rule database');

const switchedRohuRule = findMatchingFeedingRule({
  species: 'Rohu',
  cultureStage: 'Rearing',
  averageWeight: 50,
});
assert(switchedRohuRule !== null && switchedRohuRule.feeding_rate === 7, 'Rohu rule automatically determined as 7%');

// --------------------------------------------------------------------------
// TEST 6 — Invalid Survival (> 100)
// Survival = 120 -> Must show error
// --------------------------------------------------------------------------
console.log('\n--- TEST 6: Invalid Survival Validation ---');
const invalidSurvivalResult = calculateFeed({
  species: 'Rohu',
  cultureStage: 'Rearing',
  stocked: 10000,
  survivalPercent: 120,
  averageWeight: 50,
});

assert(invalidSurvivalResult.isValid === false, 'Invalid survival flagged as invalid');
assert(invalidSurvivalResult.message.includes('between 1% and 100%'), `Validation error: ${invalidSurvivalResult.message}`);

// --------------------------------------------------------------------------
// TEST 7 — Special Protocols & Missing Rules
// 1. Rohu Nursery -> Needs spawn weight
// 2. Magur -> Verified Protocol
// 3. Grass Carp -> Forage based
// 4. Missing rule -> "Feeding rate unavailable"
// --------------------------------------------------------------------------
console.log('\n--- TEST 7: Special Protocols & Unavailable Rates ---');
const nurseryResult = calculateFeed({
  species: 'Rohu',
  cultureStage: 'Nursery',
  stocked: 10000,
  survivalPercent: 80,
  averageWeight: 0.5,
});
assert(nurseryResult.specialStatus === 'NEEDS_SPAWN_WEIGHT', 'Rohu Nursery correctly requires spawn weight');

const magurResult = calculateFeed({
  species: 'Magur',
  cultureStage: 'Rearing',
  stocked: 5000,
  survivalPercent: 85,
  averageWeight: 40,
});
assert(magurResult.specialStatus === 'VERIFIED_PROTOCOL', 'Magur correctly flags verified protocol');

const grassCarpResult = calculateFeed({
  species: 'Grass Carp',
  cultureStage: 'Grow-out',
  stocked: 2000,
  survivalPercent: 85,
  averageWeight: 200,
});
assert(grassCarpResult.specialStatus === 'FORAGE_BASED', 'Grass Carp correctly flags forage-based schedule');

const unknownSpeciesResult = calculateFeed({
  species: 'Unknown Fish',
  cultureStage: 'Rearing',
  stocked: 5000,
  survivalPercent: 80,
  averageWeight: 50,
});
assert(unknownSpeciesResult.specialStatus === 'NO_RULE', 'Unknown species flags NO_RULE and does NOT invent a rate');

// --------------------------------------------------------------------------
// TEST 8 — Language Translations
// Verify major keys in both English and Marathi
// --------------------------------------------------------------------------
console.log('\n--- TEST 8: Bilingual System ---');
assert(translations.en.appTitle === 'Smart Aquaculture Feed Manager', 'English title verified');
assert(translations.mr.appTitle === 'स्मार्ट मत्स्य खाद्य व्यवस्थापक', 'Marathi title verified');
assert(translations.mr.calculator.dailyFeed === 'दैनंदिन खाद्य गरज', 'Marathi daily feed label verified');
assert(translations.mr.calculator.survivingFish === 'जिवंत मासळी', 'Marathi surviving fish label verified');
assert(translations.mr.calculator.manualRateLabel === 'स्वतः खाद्य दर (%)', 'Marathi manual rate label verified');

console.log(`\n================================================================`);
console.log(`TOTAL ACCEPTANCE TESTS: ${passCount + failCount}`);
console.log(`PASSED: ${passCount}`);
console.log(`FAILED: ${failCount}`);
console.log(`================================================================`);

if (failCount > 0) {
  process.exit(1);
}
