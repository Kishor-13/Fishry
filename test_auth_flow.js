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

import { loginUser, registerUser, loginAsDemoFarmer, loginAsGuest, logoutUser, getCurrentUser, getInitialRegisteredUsers } from './src/services/authService.js';

console.log('================================================================');
console.log('   LOGIN & AUTHENTICATION FLOW VERIFICATION');
console.log('================================================================\n');

let pass = 0;
let fail = 0;

function check(cond, msg) {
  if (cond) {
    console.log(`[PASS] ${msg}`);
    pass++;
  } else {
    console.error(`[FAIL] ${msg}`);
    fail++;
  }
}

async function runAuthTests() {
  localStorage.clear();

  // Test 1: Initial unauthenticated state
  console.log('--- 1. Initial State: Unauthenticated ---');
  check(getCurrentUser() === null, 'No user logged in initially');
  const initialUsers = getInitialRegisteredUsers();
  check(initialUsers.length >= 1, 'Default demo farmer seeded in registry');
  check(initialUsers[0].mobile === '9876543210', 'Demo farmer mobile is 9876543210');

  // Test 2: Auth Service Invalid Login
  console.log('\n--- 2. Invalid Credentials Rejection ---');
  const invalidRes = await loginUser({ mobile: '9999999999', password: 'wrongpassword' });
  check(invalidRes.success === false, 'Invalid credentials rejected by auth service');

  // Test 3: Demo Farmer Login
  console.log('\n--- 3. Demo Farmer Login (Ramesh Patil) ---');
  const demoUser = loginAsDemoFarmer();
  check(demoUser !== null, 'Demo farmer logged in');
  check(demoUser.name === 'Ramesh Patil', 'Demo farmer name is Ramesh Patil');
  check(demoUser.mobile === '9876543210', 'Demo farmer mobile matches');
  check(getCurrentUser() !== null, 'Session user is now stored in localStorage');

  // Test 4: Logout Flow
  console.log('\n--- 4. Logout Flow ---');
  logoutUser();
  check(getCurrentUser() === null, 'Session cleared upon logout');

  // Test 4b: Guest Login
  console.log('\n--- 4b. Guest Login Flow ---');
  const guest = loginAsGuest();
  check(guest.isGuest === true, 'Guest user generated');
  check(getCurrentUser()?.isGuest === true, 'Guest session saved');
  logoutUser();

  // Test 5: Register New Farmer
  console.log('\n--- 5. Register New Farmer with Mobile & Password ---');
  const regRes = await registerUser({
    name: 'Ganesh Shinde',
    mobile: '9123456789',
    password: 'shinde_secure',
    farmName: 'Shinde Fishery Pune',
  });
  check(regRes.success === true, 'New farmer registered successfully');
  check(regRes.user.mobile === '9123456789', 'Mobile number saved correctly');

  // Test 6: Login with newly registered credentials
  logoutUser();
  const newLoginRes = await loginUser({ mobile: '9123456789', password: 'shinde_secure' });
  check(newLoginRes.success === true, 'Login with new mobile and password succeeded');
  check(newLoginRes.user.name === 'Ganesh Shinde', 'User name matches');

  console.log('\n================================================================');
  console.log(`TOTAL AUTH CHECKS: ${pass + fail}`);
  console.log(`PASSED: ${pass}`);
  console.log(`FAILED: ${fail}`);
  console.log('================================================================');

  if (fail > 0) process.exit(1);
  process.exit(0);
}

runAuthTests().catch((err) => {
  console.error('Auth test failed:', err);
  process.exit(1);
});
