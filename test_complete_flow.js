import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
  url: 'http://localhost:3000',
});

global.window = dom.window;
global.document = dom.window.document;
Object.defineProperty(global, 'navigator', {
  value: dom.window.navigator,
  configurable: true,
  writable: true,
});
global.localStorage = dom.window.localStorage;

import { calculateFeed } from './src/services/calculationService.js';
import { calculateFcr } from './src/utils/calculations.js';
import { findMatchingFeedingRule } from './src/services/feedingRuleService.js';
import { PREDEFINED_RULES } from './src/data/predefinedRules.js';
import { SPECIES_LIST, CULTURE_STAGES } from './src/data/speciesData.js';
import { translations } from './src/data/translations.js';
import { loginUser, registerUser, loginAsDemoFarmer, loginAsGuest, logoutUser, getCurrentUser } from './src/services/authService.js';

console.log('================================================================');
console.log('   FULL END-TO-END APPLICATION FLOW VERIFICATION');
console.log('================================================================\n');

let pass = 0;
let fail = 0;

function check(cond, title, details = '') {
  if (cond) {
    console.log(`[PASS] ${title} ${details ? '(' + details + ')' : ''}`);
    pass++;
  } else {
    console.error(`[FAIL] ${title} ${details ? '(' + details + ')' : ''}`);
    fail++;
  }
}

async function runFullVerification() {
  // -------------------------------------------------------------
  // FLOW 1: AUTHENTICATION & SESSION PERSISTENCE
  // -------------------------------------------------------------
  console.log('--- FLOW 1: Authentication & User Session ---');
  logoutUser();
  check(getCurrentUser() === null, 'Session starts empty');

  // 1.1 Demo Farmer Login
  const demoFarmer = loginAsDemoFarmer();
  check(demoFarmer.name === 'Ramesh Patil', '1-Click Demo Login authenticates Ramesh Patil');
  check(demoFarmer.mobile === '9876543210', 'Demo mobile is 9876543210');
  check(getCurrentUser()?.name === 'Ramesh Patil', 'Demo session persisted in storage');

  // 1.2 Logout
  logoutUser();
  check(getCurrentUser() === null, 'Logout successfully destroys session');

  // 1.3 New Farmer Registration
  const newFarmer = await registerUser({
    name: 'Kishor Ghadge',
    mobile: '9822001122',
    password: 'securePass123',
    farmName: 'Kishor Aqua Baramati',
  });
  check(newFarmer.success === true, 'New farmer registration succeeds');
  check(newFarmer.user.mobile === '9822001122', 'New farmer mobile stored');
  check(getCurrentUser()?.name === 'Kishor Ghadge', 'Auto-logged in after registration');

  // 1.4 Re-login with newly registered credentials
  logoutUser();
  const reLogin = await loginUser({ mobile: '9822001122', password: 'securePass123' });
  check(reLogin.success === true, 'Login with registered credentials succeeds');
  check(reLogin.user.name === 'Kishor Ghadge', 'User name matches session');

  // 1.5 Invalid credentials rejection
  logoutUser();
  const badLogin = await loginUser({ mobile: '9822001122', password: 'wrongPassword' });
  check(badLogin.success === false, 'Wrong password rejected safely');

  // -------------------------------------------------------------
  // FLOW 2: SPECIES & CULTURE STAGE MASTER DATA
  // -------------------------------------------------------------
  console.log('\n--- FLOW 2: Species & Culture Stage Master Data ---');
  check(SPECIES_LIST.length === 9, 'All 9 required species present', `count: ${SPECIES_LIST.length}`);
  check(CULTURE_STAGES.length === 3, 'All 3 standard culture stages present (Nursery, Rearing, Grow-out)', `count: ${CULTURE_STAGES.length}`);
  check(PREDEFINED_RULES.length >= 17, 'Complete ICAR-CIFA feeding rules seeded', `rules count: ${PREDEFINED_RULES.length}`);

  // -------------------------------------------------------------
  // FLOW 3: AUTOMATIC FEED CALCULATION ENGINE
  // -------------------------------------------------------------
  console.log('\n--- FLOW 3: Automatic Feed Calculation Engine ---');

  // Case 3.1: Rohu Rearing (Section 28 Spec)
  // 10,000 stocked, 85% survival = 8,500 fish. 50g average weight = 425 kg biomass.
  // Rate = 7%. Daily Feed = 29.75 kg. Morning/Evening 50:50 = 14.88 kg each. Feed cost at ₹40 = ₹1,190.
  const rohuRule = findMatchingFeedingRule({ species: 'Rohu', cultureStage: 'Rearing', averageWeight: 50 });
  check(rohuRule !== null, 'Rohu Rearing rule matched automatically');
  check(rohuRule?.feeding_rate === 7, 'Rohu Rearing feeding rate is 7%');

  const rohuCalc = calculateFeed({
    species: 'Rohu',
    cultureStage: 'Rearing',
    stocked: 10000,
    survivalPercent: 85,
    averageWeight: 50,
    feedPrice: 40,
    matchedRule: rohuRule,
  });
  check(rohuCalc.isValid === true, 'Rohu calculation is valid');
  check(rohuCalc.survivingFish === 8500, 'Surviving fish = 8,500');
  check(rohuCalc.biomass === 425, 'Biomass = 425 kg');
  check(rohuCalc.dailyFeed === 29.75, 'Daily feed = 29.75 kg');
  check(rohuCalc.morningFeed === 14.875, 'Morning 50% split = 14.875 kg');
  check(rohuCalc.eveningFeed === 14.875, 'Evening 50% split = 14.875 kg');
  check(rohuCalc.dailyFeedCost === 1190, 'Daily feed cost at ₹40/kg = ₹1,190');
  check(rohuCalc.rateSource === 'AUTOMATIC_RULE', 'Rate source is AUTOMATIC_RULE');

  // Case 3.2: Common Carp Weight-based rule priority (35g in 10-90g range -> 10%)
  const carpRule = findMatchingFeedingRule({ species: 'Common Carp', cultureStage: 'All', averageWeight: 35 });
  check(carpRule?.feeding_rate === 10, 'Common Carp 35g automatically matches 10% rate');

  // Case 3.3: Tilapia Weight-based rule priority (25g in 10-40g range -> 7%)
  const tilapiaRule = findMatchingFeedingRule({ species: 'Tilapia', cultureStage: 'All', averageWeight: 25 });
  check(tilapiaRule?.feeding_rate === 7, 'Tilapia 25g automatically matches 7% rate');

  // Case 3.4: Pangasius Month-based rule (Month 1 -> 5%, Month 4 -> 3%, Month 7 -> 2%)
  const pangM1 = findMatchingFeedingRule({ species: 'Pangasius', cultureStage: 'All', cultureMonth: 1 });
  const pangM4 = findMatchingFeedingRule({ species: 'Pangasius', cultureStage: 'All', cultureMonth: 4 });
  const pangM7 = findMatchingFeedingRule({ species: 'Pangasius', cultureStage: 'All', cultureMonth: 7 });
  check(pangM1?.feeding_rate === 5, 'Pangasius Month 1 rate = 5%');
  check(pangM4?.feeding_rate === 3, 'Pangasius Month 4 rate = 3%');
  check(pangM7?.feeding_rate === 2, 'Pangasius Month 7 rate = 2%');

  // Case 3.5: Other / Custom Species Manual Feeding Rate Exception
  const customCalc = calculateFeed({
    species: 'Other / Custom',
    cultureStage: 'Grow-out',
    stocked: 5000,
    survivalPercent: 90,
    averageWeight: 100,
    feedPrice: 42,
    manualRate: 3,
  });
  check(customCalc.isValid === true, 'Custom calculation is valid');
  check(customCalc.survivingFish === 4500, 'Custom surviving fish = 4,500');
  check(customCalc.biomass === 450, 'Custom biomass = 450 kg');
  check(customCalc.dailyFeed === 13.5, 'Custom daily feed = 13.5 kg at 3%');
  check(customCalc.rateSource === 'FARMER_ENTERED', 'Custom rate source marked FARMER_ENTERED');

  // Case 3.6: Special protocol handling
  const nurserySpawn = findMatchingFeedingRule({ species: 'Rohu', cultureStage: 'Nursery' });
  check(nurserySpawn?.feeding_method === 'INITIAL_SPAWN_WEIGHT', 'IMC Nursery flags INITIAL_SPAWN_WEIGHT');

  const magurRule = findMatchingFeedingRule({ species: 'Magur', cultureStage: 'All' });
  check(magurRule?.feeding_method === 'VERIFIED_PROTOCOL', 'Magur flags VERIFIED_PROTOCOL');

  const grassCarpRule = findMatchingFeedingRule({ species: 'Grass Carp', cultureStage: 'All' });
  check(grassCarpRule?.feeding_method === 'FORAGE_BASED', 'Grass Carp flags FORAGE_BASED');

  // -------------------------------------------------------------
  // FLOW 4: FCR (FEED CONVERSION RATIO) MODULE
  // -------------------------------------------------------------
  console.log('\n--- FLOW 4: FCR (Feed Conversion Ratio) Calculation ---');
  // Formula: FCR = Total Actual Feed Given ÷ Net Biomass Gain (Final Biomass - Initial Biomass)
  // Test: Initial = 500kg, Final = 1500kg -> Net Gain = 1000kg. Feed = 1500kg -> FCR = 1.50 (Good)
  const fcrRes = calculateFcr(1500, 500, 1500);
  check(fcrRes.isValid === true, 'FCR calculation is valid');
  check(fcrRes.netGain === 1000, 'Net biomass gain = 1,000 kg');
  check(fcrRes.fcr === 1.5, 'FCR = 1.50 (1500 ÷ 1000)');

  // Test negative gain rejection
  const badFCR = calculateFcr(500, 1000, 900);
  check(badFCR.isValid === false, 'Negative or zero net biomass gain is rejected');

  // -------------------------------------------------------------
  // FLOW 5: BILINGUAL INTEGRITY (ENGLISH + MARATHI)
  // -------------------------------------------------------------
  console.log('\n--- FLOW 5: Bilingual Integrity (English + मराठी) ---');
  check(Boolean(translations.mr.appTitle), 'Marathi app title present', translations.mr.appTitle);
  check(Boolean(translations.en.appTitle), 'English app title present', translations.en.appTitle);
  check(Boolean(translations.mr.calculator.dailyFeed), 'Marathi daily feed label present');
  check(Boolean(translations.mr.calculator.morningFeed), 'Marathi morning feed label present');
  check(Boolean(translations.mr.calculator.eveningFeed), 'Marathi evening feed label present');
  check(Boolean(translations.mr.nav.calculator), 'Marathi nav label present');
  check(Boolean(translations.mr.auth.loginTitle), 'Marathi login title present');

  console.log('\n================================================================');
  console.log(`TOTAL E2E CHECKS: ${pass + fail}`);
  console.log(`PASSED: ${pass}`);
  console.log(`FAILED: ${fail}`);
  console.log('================================================================');

  if (fail > 0) process.exit(1);
  process.exit(0);
}

runFullVerification().catch((err) => {
  console.error('Flow test error:', err);
  process.exit(1);
});
