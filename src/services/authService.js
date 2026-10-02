import { getSupabaseClient } from '../lib/supabase.js';

const AUTH_USER_KEY = 'aquaculture_auth_user';
const REGISTERED_USERS_KEY = 'aquaculture_registered_users';

// Pre-seeded demo farmer
const DEFAULT_DEMO_USER = {
  id: 'farmer_demo_1',
  name: 'Ramesh Patil',
  name_mr: 'रमेश पाटील',
  mobile: '9876543210',
  farmName: 'Patil Aquaculture Farm',
  role: 'farmer',
  createdAt: new Date().toISOString(),
};

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

export async function loginUser({ mobile, password }) {
  const cleanMobile = (mobile || '').replace(/\D/g, '').slice(-10);
  const supabase = getSupabaseClient();

  // 1. If Supabase is connected, verify against Supabase PostgreSQL
  if (supabase) {
    try {
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
          farmName: u.farm_name || 'Fish Farm',
          isGuest: false,
          source: 'supabase',
        };
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(sessionUser));
        return { success: true, user: sessionUser };
      }
    } catch (err) {
      console.warn('Supabase login check failed, falling back to local:', err);
    }
  }

  // 2. Offline / local fallback
  const users = getInitialRegisteredUsers();
  const user = users.find(
    (u) => u.mobile === cleanMobile && u.password === password
  );

  if (user) {
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
  }

  return { success: false, error: 'INVALID_CREDENTIALS' };
}

export async function registerUser({ name, mobile, password, farmName }) {
  const cleanMobile = (mobile || '').replace(/\D/g, '').slice(-10);
  const supabase = getSupabaseClient();
  let supabaseId = null;

  // 1. If Supabase is connected, register to Supabase PostgreSQL database
  if (supabase) {
    try {
      const { data, error } = await supabase.rpc('register_farmer', {
        p_name: name.trim(),
        p_mobile: cleanMobile,
        p_password: password,
        p_farm_name: farmName?.trim() || `${name}'s Farm`,
      });

      if (!error && data && data.length > 0) {
        supabaseId = data[0].id;
      }
    } catch (err) {
      console.warn('Supabase registration error, saving locally:', err);
    }
  }

  // 2. Save locally for offline persistence
  const users = getInitialRegisteredUsers();
  const existing = users.find((u) => u.mobile === cleanMobile);
  if (existing) {
    existing.name = name || existing.name;
    existing.password = password;
    localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(users));
    const sessionUser = {
      id: supabaseId || existing.id,
      name: existing.name,
      mobile: existing.mobile,
      farmName: existing.farmName,
      isGuest: false,
    };
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(sessionUser));
    return { success: true, user: sessionUser };
  }

  const newUser = {
    id: supabaseId || 'farmer_' + Date.now(),
    name: name.trim(),
    mobile: cleanMobile,
    password,
    farmName: farmName?.trim() || `${name}'s Pond`,
    createdAt: new Date().toISOString(),
  };

  const updatedUsers = [...users, newUser];
  localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(updatedUsers));

  const sessionUser = {
    id: newUser.id,
    name: newUser.name,
    mobile: newUser.mobile,
    farmName: newUser.farmName,
    isGuest: false,
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
  };
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(guestUser));
  return guestUser;
}

export function logoutUser() {
  localStorage.removeItem(AUTH_USER_KEY);
}
