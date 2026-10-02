import { getSupabaseClient } from '../lib/supabase.js';

const AUTH_USER_KEY = 'aquaculture_auth_user';
const REGISTERED_USERS_KEY = 'aquaculture_registered_users';

// Pre-seeded demo farmer
export const DEFAULT_DEMO_USER = {
  id: 'farmer_demo_1',
  name: 'Ramesh Patil',
  name_mr: 'रमेश पाटील',
  mobile: '9876543210',
  farmName: 'Patil Aquaculture Farm',
  role: 'farmer',
  createdAt: new Date().toISOString(),
};

/**
 * Normalizes an Indian phone number to 10 clean digits.
 * Handles '+91', '91', leading '0', spaces, and dashes.
 */
export function normalizeMobile(mobile) {
  if (!mobile) return '';
  let digits = String(mobile).replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    digits = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith('0')) {
    digits = digits.slice(1);
  }
  return digits.slice(-10);
}

export function getInitialRegisteredUsers() {
  try {
    const raw = localStorage.getItem(REGISTERED_USERS_KEY);
    if (!raw) {
      const initial = [
        {
          id: DEFAULT_DEMO_USER.id,
          name: DEFAULT_DEMO_USER.name,
          mobile: DEFAULT_DEMO_USER.mobile,
          password: 'farmer123',
          farmName: DEFAULT_DEMO_USER.farmName,
          createdAt: DEFAULT_DEMO_USER.createdAt,
        }
      ];
      localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading registered users:', err);
    return [];
  }
}

export function getCurrentUser() {
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.error('Error reading auth user:', err);
    return null;
  }
}

/**
 * Checks whether a given mobile number is registered in Supabase or local storage.
 */
export async function checkMobileExists(mobile) {
  const cleanMobile = normalizeMobile(mobile);
  if (!cleanMobile || cleanMobile.length !== 10) return false;

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('farmers')
        .select('id')
        .eq('mobile', cleanMobile)
        .limit(1);

      if (!error && data && data.length > 0) {
        return true;
      }
    } catch (err) {
      console.warn('Supabase checkMobileExists error:', err);
    }
  }

  const users = getInitialRegisteredUsers();
  return users.some((u) => u.mobile === cleanMobile);
}

export async function loginUser({ mobile, password }) {
  const cleanMobile = normalizeMobile(mobile);
  const supabase = getSupabaseClient();

  // 1. If Supabase is connected, verify against Supabase PostgreSQL
  if (supabase) {
    try {
      // 1a. Try secure RPC login_farmer
      const { data: rpcData, error: rpcError } = await supabase.rpc('login_farmer', {
        p_mobile: cleanMobile,
        p_password: password,
      });

      if (!rpcError && rpcData && rpcData.length > 0) {
        const u = rpcData[0];
        const sessionUser = {
          id: u.id,
          name: u.name,
          mobile: u.mobile,
          farmName: u.farm_name || `${u.name}'s Farm`,
          isGuest: false,
          source: 'supabase',
        };
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(sessionUser));
        return { success: true, user: sessionUser };
      }

      // 1b. Fallback: direct table check in case RPC function had a search_path/pgcrypto error
      const { data: farmerRow, error: tableErr } = await supabase
        .from('farmers')
        .select('id, name, mobile, farm_name, password_hash')
        .eq('mobile', cleanMobile)
        .maybeSingle();

      if (!tableErr && farmerRow) {
        // Direct password match (for fallback / unhashed seeds)
        if (farmerRow.password_hash === password) {
          const sessionUser = {
            id: farmerRow.id,
            name: farmerRow.name,
            mobile: farmerRow.mobile,
            farmName: farmerRow.farm_name || `${farmerRow.name}'s Farm`,
            isGuest: false,
            source: 'supabase',
          };
          localStorage.setItem(AUTH_USER_KEY, JSON.stringify(sessionUser));
          return { success: true, user: sessionUser };
        } else {
          return {
            success: false,
            error: 'INCORRECT_PASSWORD',
            cleanMobile,
          };
        }
      }
    } catch (err) {
      console.warn('Supabase login check failed, checking local:', err);
    }
  }

  // 2. Offline / local fallback
  const users = getInitialRegisteredUsers();
  const user = users.find((u) => u.mobile === cleanMobile);

  if (user) {
    if (user.password === password) {
      const sessionUser = {
        id: user.id,
        name: user.name,
        mobile: user.mobile,
        farmName: user.farmName || 'Fish Farm',
        isGuest: false,
        source: 'local',
      };
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(sessionUser));
      return { success: true, user: sessionUser };
    } else {
      return {
        success: false,
        error: 'INCORRECT_PASSWORD',
        cleanMobile,
      };
    }
  }

  // 3. User was not found at all
  return {
    success: false,
    error: 'MOBILE_NOT_REGISTERED',
    cleanMobile,
  };
}

export async function registerUser({ name, mobile, password, farmName }) {
  const cleanMobile = normalizeMobile(mobile);
  const supabase = getSupabaseClient();
  let supabaseId = null;

  // Check if mobile already exists
  const exists = await checkMobileExists(cleanMobile);
  if (exists) {
    return {
      success: false,
      error: 'MOBILE_ALREADY_REGISTERED',
      cleanMobile,
    };
  }

  // 1. If Supabase is connected, register to Supabase PostgreSQL database
  if (supabase) {
    try {
      // 1a. Try secure RPC function
      const { data, error } = await supabase.rpc('register_farmer', {
        p_name: name.trim(),
        p_mobile: cleanMobile,
        p_password: password,
        p_farm_name: farmName?.trim() || `${name}'s Farm`,
      });

      if (!error && data && data.length > 0) {
        supabaseId = data[0].id;
      } else if (error) {
        console.warn('Supabase register_farmer RPC failed, trying direct insert:', error.message);
        // 1b. Direct table fallback if RPC had pgcrypto error
        const { data: insData, error: insErr } = await supabase
          .from('farmers')
          .insert([{
            name: name.trim(),
            mobile: cleanMobile,
            password_hash: password,
            farm_name: farmName?.trim() || `${name}'s Farm`,
          }])
          .select('id')
          .maybeSingle();

        if (!insErr && insData) {
          supabaseId = insData.id;
        }
      }
    } catch (err) {
      console.warn('Supabase registration error, saving locally:', err);
    }
  }

  // 2. Save locally for offline persistence
  const users = getInitialRegisteredUsers();
  const existingIndex = users.findIndex((u) => u.mobile === cleanMobile);

  const newUser = {
    id: supabaseId || 'farmer_' + Date.now(),
    name: name.trim(),
    mobile: cleanMobile,
    password,
    farmName: farmName?.trim() || `${name}'s Pond`,
    createdAt: new Date().toISOString(),
  };

  if (existingIndex >= 0) {
    users[existingIndex] = newUser;
  } else {
    users.push(newUser);
  }
  localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(users));

  const sessionUser = {
    id: newUser.id,
    name: newUser.name,
    mobile: newUser.mobile,
    farmName: newUser.farmName,
    isGuest: false,
    source: supabaseId ? 'supabase' : 'local',
  };
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(sessionUser));
  return { success: true, user: sessionUser };
}

export function loginAsDemoFarmer() {
  const sessionUser = {
    id: DEFAULT_DEMO_USER.id,
    name: DEFAULT_DEMO_USER.name,
    mobile: DEFAULT_DEMO_USER.mobile,
    farmName: DEFAULT_DEMO_USER.farmName,
    isGuest: false,
    source: 'demo',
  };
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(sessionUser));
  return sessionUser;
}

export function loginAsGuest() {
  const guestUser = {
    id: 'guest_' + Date.now(),
    name: 'Guest Farmer',
    mobile: '',
    farmName: 'My Pond',
    isGuest: true,
    source: 'guest',
  };
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(guestUser));
  return guestUser;
}

export function logoutUser() {
  localStorage.removeItem(AUTH_USER_KEY);
}
