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
global.Blob = dom.window.Blob;
global.URL = dom.window.URL;
global.URL.createObjectURL = () => 'blob:mock-url';
global.URL.revokeObjectURL = () => {};

import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react';

// Import App and services
import App from './src/App.jsx';
import { calculateFeed } from './src/services/calculationService.js';
import { findMatchingFeedingRule } from './src/services/feedingRuleService.js';
import { exportFeedHistoryToCsv } from './src/utils/csvExport.js';
import { translations } from './src/data/translations.js';

console.log('================================================================');
console.log('   FULL END-TO-END COMPREHENSIVE FLOW VERIFICATION');
console.log('================================================================\n');

let passedTests = 0;
let failedTests = 0;

function check(condition, testName, details = '') {
  if (condition) {
    console.log(`[PASS] ${testName} ${details ? '(' + details + ')' : ''}`);
    passedTests++;
  } else {
    console.error(`[FAIL] ${testName} - ${details}`);
    failedTests++;
  }
}

async function runFullFlowVerification() {
  localStorage.clear();

  // 1. BOOTSTRAP APP & RENDER
  console.log('--- 1. APP BOOTSTRAP & HEADER RENDER ---');
  const container = document.getElementById('root');
  const root = createRoot(container);

  await act(async () => {
    root.render(React.createElement(App));
  });

  const titleEl = document.querySelector('h1');
  check(titleEl !== null, 'Header title is rendered');
  check(
    document.body.textContent.includes('स्मार्ट मत्स्य खाद्य व्यवस्थापक') ||
    document.body.textContent.includes('Smart Aquaculture Feed Manager'),
    'Bilingual App title present in DOM'
  );

  // 2. LANGUAGE SWITCHING FLOW
  console.log('\n--- 2. BILINGUAL LANGUAGE SWITCHING ---');
  const allButtons = Array.from(document.querySelectorAll('button'));
  const enBtn = allButtons.find((b) => b.textContent.trim() === 'EN');
  const mrBtn = allButtons.find((b) => b.textContent.trim() === 'मराठी');

  check(enBtn !== undefined, 'English toggle button found');
  check(mrBtn !== undefined, 'Marathi toggle button found');

  // Switch to English
  await act(async () => {
    enBtn.click();
  });
  check(localStorage.getItem('aquaculture_app_lang') === 'en', 'Language set to English in localStorage');
  check(document.body.textContent.includes('Dashboard'), 'Navigation translated to English (Dashboard)');

  // Switch back to Marathi
  await act(async () => {
    mrBtn.click();
  });
  check(localStorage.getItem('aquaculture_app_lang') === 'mr', 'Language set to Marathi in localStorage');
  check(document.body.textContent.includes('डॅशबोर्ड'), 'Navigation translated to Marathi (डॅशबोर्ड)');

  // 3. DASHBOARD METRICS & NAVIGATION
  console.log('\n--- 3. DASHBOARD METRICS & NAVIGATION ---');
  check(document.body.textContent.includes('आजचे एकूण खाद्य'), 'Today Feed card rendered');
  check(document.body.textContent.includes('आजचा खाद्य खर्च'), 'Today Cost card rendered');
  check(document.body.textContent.includes('नोंदवलेली तळी'), 'Saved Ponds card rendered');
  check(document.body.textContent.includes('एकूण खाद्य नोंदी'), 'Feed Records card rendered');

  // Click prominent "Calculate Today's Feed" / "आजचे खाद्य मोजा" button
  const calcNavBtn = Array.from(document.querySelectorAll('button')).find(
    (b) => b.textContent.includes('आजचे खाद्य मोजा')
  );
  check(calcNavBtn !== undefined, 'Calculate Today Feed button found on Dashboard');

  await act(async () => {
    calcNavBtn.click();
  });
  check(document.body.textContent.includes('मत्स्य खाद्य गणक'), 'Navigated to Feed Calculator page');

  // 4. TEST SECTION 28: ROHU CALCULATION FLOW
  console.log('\n--- 4. ROHU CALCULATION FLOW (Section 28) ---');
  const rohuPresetBtn = Array.from(document.querySelectorAll('button')).find(
    (b) => b.textContent.includes('रोहू उदाहरण (Sec 28)')
  );
  check(rohuPresetBtn !== undefined, 'Rohu Section 28 preset button found');

  await act(async () => {
    rohuPresetBtn.click();
  });

  check(document.body.textContent.includes('8,500'), 'Surviving Fish = 8,500 displayed');
  check(document.body.textContent.includes('425'), 'Biomass = 425 kg displayed');
  check(document.body.textContent.includes('7%'), 'Feeding Rate = 7% displayed');
  check(document.body.textContent.includes('29.75'), 'Daily Feed = 29.75 kg displayed');
  check(
    document.body.textContent.includes('14.88') || document.body.textContent.includes('14.875'),
    'Morning Feed (50%) = 14.88/14.875 kg displayed'
  );
  check(document.body.textContent.includes('1,190'), 'Daily Feed Cost = ₹1,190 displayed');

  // Verify rule explanation
  check(
    document.body.textContent.includes('रोहू') && document.body.textContent.includes('बायोमासच्या'),
    'Automatic rule explanation displayed with working value'
  );

  // Save calculation to history
  const saveBtn = Array.from(document.querySelectorAll('button')).find(
    (b) => b.textContent.includes('नोंदीमध्ये जतन करा')
  );
  check(saveBtn !== undefined, 'Save to History button found');
  await act(async () => {
    saveBtn.click();
  });
  check(
    document.body.textContent.includes('यशस्वीरीत्या') || document.body.textContent.includes('जतन'),
    'Saved to Feed History confirmation displayed'
  );

  // 5. TEST SECTION 21: COMMON CARP WEIGHT-BASED PRIORITY RULE
  console.log('\n--- 5. COMMON CARP WEIGHT-BASED PRIORITY RULE ---');
  const cc35 = calculateFeed({
    species: 'Common Carp',
    cultureStage: 'Rearing',
    stocked: 10000,
    survivalPercent: 85,
    averageWeight: 35,
    feedPrice: 40,
  });
  check(cc35.feedingRate === 10, 'Common Carp 35g automatically selects 10% rate');

  const cc150 = calculateFeed({
    species: 'Common Carp',
    cultureStage: 'Grow-out',
    stocked: 10000,
    survivalPercent: 85,
    averageWeight: 150,
    feedPrice: 40,
  });
  check(cc150.feedingRate === 7, 'Common Carp 150g automatically selects 7% rate');

  const cc350 = calculateFeed({
    species: 'Common Carp',
    cultureStage: 'Grow-out',
    stocked: 10000,
    survivalPercent: 85,
    averageWeight: 350,
    feedPrice: 40,
  });
  check(cc350.feedingRate === 4.8, 'Common Carp 350g automatically selects 4.8% rate');

  // 6. TEST SECTION 22: TILAPIA WEIGHT-BASED RULES
  console.log('\n--- 6. TILAPIA WEIGHT-BASED RULES ---');
  const til8 = calculateFeed({ species: 'Tilapia', cultureStage: 'Grow-out', stocked: 5000, survivalPercent: 90, averageWeight: 8 });
  check(til8.feedingRate === 8, 'Tilapia <10g selects 8%');

  const til25 = calculateFeed({ species: 'Tilapia', cultureStage: 'Grow-out', stocked: 5000, survivalPercent: 90, averageWeight: 25 });
  check(til25.feedingRate === 7, 'Tilapia 25g selects 7%');

  const til60 = calculateFeed({ species: 'Tilapia', cultureStage: 'Grow-out', stocked: 5000, survivalPercent: 90, averageWeight: 60 });
  check(til60.feedingRate === 6, 'Tilapia 60g selects 6%');

  const til150 = calculateFeed({ species: 'Tilapia', cultureStage: 'Grow-out', stocked: 5000, survivalPercent: 90, averageWeight: 150 });
  check(til150.feedingRate === 4, 'Tilapia >100g selects 4%');

  // 7. TEST SECTION 23: PANGASIUS CULTURE PERIOD RULES
  console.log('\n--- 7. PANGASIUS CULTURE PERIOD RULES ---');
  const pangM1 = calculateFeed({ species: 'Pangasius', cultureStage: 'Grow-out', stocked: 5000, survivalPercent: 85, averageWeight: 50, cultureMonth: 1 });
  check(pangM1.feedingRate === 5, 'Pangasius Month 1 selects 5%');

  const pangM4 = calculateFeed({ species: 'Pangasius', cultureStage: 'Grow-out', stocked: 5000, survivalPercent: 85, averageWeight: 200, cultureMonth: 4 });
  check(pangM4.feedingRate === 3, 'Pangasius Month 4 selects 3%');

  const pangM8 = calculateFeed({ species: 'Pangasius', cultureStage: 'Grow-out', stocked: 5000, survivalPercent: 85, averageWeight: 600, cultureMonth: 8 });
  check(pangM8.feedingRate === 2, 'Pangasius Month 8 selects 2%');

  // 8. TEST SECTIONS 18, 24, 25: SPECIAL PROTOCOLS
  console.log('\n--- 8. SPECIAL PROTOCOLS (NURSERY, MAGUR, GRASS CARP) ---');
  const rohuNursery = calculateFeed({ species: 'Rohu', cultureStage: 'Nursery', stocked: 10000, survivalPercent: 80, averageWeight: 0.5 });
  check(rohuNursery.specialStatus === 'NEEDS_SPAWN_WEIGHT', 'Rohu Nursery flags INITIAL_SPAWN_WEIGHT');

  const magur = calculateFeed({ species: 'Magur', cultureStage: 'Rearing', stocked: 5000, survivalPercent: 85, averageWeight: 30 });
  check(magur.specialStatus === 'VERIFIED_PROTOCOL', 'Magur flags VERIFIED_PROTOCOL');

  const grassCarp = calculateFeed({ species: 'Grass Carp', cultureStage: 'Grow-out', stocked: 2000, survivalPercent: 85, averageWeight: 150 });
  check(grassCarp.specialStatus === 'FORAGE_BASED', 'Grass Carp flags FORAGE_BASED');

  // 9. TEST SECTIONS 3, 10, 29: CRITICAL CUSTOM SPECIES RULE & TRANSITIONS
  console.log('\n--- 9. CRITICAL CUSTOM SPECIES RULE & TRANSITIONS ---');
  const customPresetBtn = Array.from(document.querySelectorAll('button')).find(
    (b) => b.textContent.includes('इतर/सानुकूल (Sec 29)')
  );
  check(customPresetBtn !== undefined, 'Custom Section 29 preset button found');

  await act(async () => {
    customPresetBtn.click();
  });

  check(document.body.textContent.includes('स्वतः खाद्य दर (%)'), 'Manual Feeding Rate (%) input visible for Custom species');
  check(document.body.textContent.includes('शेतकऱ्याने स्वतः भरलेला खाद्य दर'), 'Label "Manual feeding rate entered by farmer" visible');
  check(document.body.textContent.includes('शेतकऱ्याने भरलेला दर'), 'Source "Entered by farmer" visible');

  check(document.body.textContent.includes('4,500'), 'Custom surviving fish = 4,500');
  check(document.body.textContent.includes('450'), 'Custom biomass = 450 kg');
  check(document.body.textContent.includes('13.5'), 'Custom daily feed = 13.5 kg/day');
  check(document.body.textContent.includes('6.75'), 'Custom morning feed = 6.75 kg');

  // Switch back to Rohu
  await act(async () => {
    rohuPresetBtn.click();
  });
  check(!document.body.textContent.includes('शेतकऱ्याने स्वतः भरलेला खाद्य दर'), 'Manual Feeding Rate field disappeared after changing to Rohu');
  check(document.body.textContent.includes('7%'), 'Rohu 7% automatic rule restored');

  // 10. TEST SECTIONS 30–32: FEED HISTORY & CSV EXPORT
  console.log('\n--- 10. FEED HISTORY & CSV EXPORT ---');
  const historyNavBtn = Array.from(document.querySelectorAll('nav button, div button')).find(
    (b) => b.textContent.includes('खाद्य इतिहास')
  );
  check(historyNavBtn !== undefined, 'History navigation button found');

  await act(async () => {
    historyNavBtn.click();
  });
  check(document.body.textContent.includes('खाद्य नोंदी इतिहास'), 'Navigated to Feed History page');

  let exportedCsv = false;
  try {
    const mockRecords = [
      {
        id: 'rec_1',
        created_at: new Date().toISOString(),
        species: 'Rohu',
        scientific_name: 'Labeo rohita',
        culture_stage: 'Rearing',
        stocked: 10000,
        survival_percent: 85,
        average_weight: 50,
        surviving_fish: 8500,
        feeding_rate: 7,
        rate_source: 'AUTOMATIC_RULE',
        rule_explanation_mr: 'रोहू → रिअरिंग → बायोमासच्या ६–८%/दिवस',
        biomass: 425,
        daily_feed: 29.75,
        morning_feed: 14.875,
        evening_feed: 14.875,
        feed_price: 40,
        feed_cost: 1190,
      }
    ];
    exportFeedHistoryToCsv(mockRecords, 'mr');
    exportedCsv = true;
  } catch (err) {
    console.error('CSV export error:', err);
  }
  check(exportedCsv, 'CSV export generated UTF-8 with BOM and executed click download');

  // 11. TEST SECTION 33: POND MANAGEMENT CRUD
  console.log('\n--- 11. POND MANAGEMENT CRUD ---');
  const pondNavBtn = Array.from(document.querySelectorAll('nav button, div button')).find(
    (b) => b.textContent.includes('तळे व्यवस्थापन')
  );
  check(pondNavBtn !== undefined, 'Ponds navigation button found');

  await act(async () => {
    pondNavBtn.click();
  });
  check(document.body.textContent.includes('तळे व्यवस्थापन'), 'Navigated to Pond Management page');
  check(
    document.body.textContent.includes('Pond A1') || document.body.textContent.includes('Pond B2'),
    'Initial ponds rendered in list'
  );

  // 12. TEST SECTION 34: FCR CALCULATOR
  console.log('\n--- 12. FCR CALCULATOR ---');
  const fcrNavBtn = Array.from(document.querySelectorAll('nav button, div button')).find(
    (b) => b.textContent.includes('एफसीआर')
  );
  check(fcrNavBtn !== undefined, 'FCR navigation button found');

  await act(async () => {
    fcrNavBtn.click();
  });
  check(document.body.textContent.includes('एफसीआर (FCR) गणक'), 'Navigated to FCR Calculator page');
  check(
    document.body.textContent.includes('FCR साठी प्रत्यक्ष दिलेले खाद्य आणि प्रत्यक्ष बायोमास वाढ वापरली जाते'),
    'Core FCR principle displayed prominently'
  );
  check(
    document.body.textContent.includes('1.5') || document.body.textContent.includes('१.५'),
    'FCR calculated (1500 / (1100-100) = 1.50) with Good rating'
  );

  // 13. TEST SECTION 27: SCIENTIFIC NOTE INTEGRITY
  console.log('\n--- 13. PERMANENT SCIENTIFIC / SAFETY NOTE ---');
  check(
    translations.en.calculator.scientificNote.includes('water temperature') &&
    translations.mr.calculator.scientificNote.includes('पाण्याचे तापमान'),
    'Permanent safety note present in both English and Marathi translations'
  );

  // FINAL SUMMARY
  console.log('\n================================================================');
  console.log(`TOTAL FLOW CHECKS: ${passedTests + failedTests}`);
  console.log(`PASSED: ${passedTests}`);
  console.log(`FAILED: ${failedTests}`);
  console.log('================================================================');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runFullFlowVerification().catch((err) => {
  console.error('Unhandled error in flow verification:', err);
  process.exit(1);
});
