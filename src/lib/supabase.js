import { createClient } from '@supabase/supabase-js';
import { PREDEFINED_RULES } from '../constants/predefinedRules.js';

// Safe storage helpers for browser, SSR, and test environments
const memoryStorage = new Map();

const safeStorage = {
  getItem: (key) => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        return window.localStorage.getItem(key);
      } catch (e) {
        return memoryStorage.get(key) || null;
      }
    }
    return memoryStorage.get(key) || null;
  },
  setItem: (key, val) => {
    memoryStorage.set(key, String(val));
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(key, String(val));
      } catch (e) {
        // Fallback to memory
      }
    }
  },
  removeItem: (key) => {
    memoryStorage.delete(key);
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.removeItem(key);
      } catch (e) {
        // Fallback to memory
      }
    }
  }
};

// Retrieve credentials from Vite env or fallback storage
const getSavedCredentials = () => {
  const envUrl = typeof import.meta !== 'undefined' && import.meta.env ? (import.meta.env.VITE_SUPABASE_URL || '') : '';
  const envKey = typeof import.meta !== 'undefined' && import.meta.env ? (import.meta.env.VITE_SUPABASE_ANON_KEY || '') : '';

  const localUrl = safeStorage.getItem('aquaculture_supabase_url') || '';
  const localKey = safeStorage.getItem('aquaculture_supabase_key') || '';

  return {
    url: envUrl || localUrl,
    key: envKey || localKey,
  };
};

let supabaseClient = null;

export const initSupabaseClient = () => {
  const { url, key } = getSavedCredentials();
  if (url && key) {
    try {
      supabaseClient = createClient(url, key, {
        auth: { persistSession: true },
      });
      return supabaseClient;
    } catch (err) {
      console.warn('Failed to initialize Supabase client:', err);
      supabaseClient = null;
      return null;
    }
  }
  supabaseClient = null;
  return null;
};

// Initial run
initSupabaseClient();

export const isSupabaseConfigured = () => {
  const { url, key } = getSavedCredentials();
  return Boolean(url && key);
};

export const getSupabaseClient = () => {
  if (!supabaseClient) {
    initSupabaseClient();
  }
  return supabaseClient;
};

export const saveSupabaseCredentials = (url, key) => {
  if (url && key) {
    safeStorage.setItem('aquaculture_supabase_url', url.trim());
    safeStorage.setItem('aquaculture_supabase_key', key.trim());
    return initSupabaseClient();
  } else {
    safeStorage.removeItem('aquaculture_supabase_url');
    safeStorage.removeItem('aquaculture_supabase_key');
    supabaseClient = null;
    return null;
  }
};

export const getSupabaseConfig = () => {
  return getSavedCredentials();
};

/* ==========================================================================
   FEEDING RULES API (with local fallback)
   ========================================================================== */

export async function fetchFeedingRules() {
  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from('feeding_rules')
        .select('*')
        .eq('active', true)
        .order('priority', { ascending: false });

      if (!error && data && data.length > 0) {
        return { data, source: 'supabase' };
      }
    } catch (err) {
      console.warn('Supabase fetch rules error, falling back to local:', err);
    }
  }

  // Fallback to local predefined rules
  return { data: PREDEFINED_RULES, source: 'local' };
}

/* ==========================================================================
   FEED HISTORY API (Supabase + localStorage dual persistence)
   ========================================================================== */

const LOCAL_HISTORY_KEY = 'aquaculture_feed_history';

export function getLocalFeedHistory() {
  try {
    const raw = safeStorage.getItem(LOCAL_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Error reading local feed history:', err);
    return [];
  }
}

export function saveLocalFeedHistory(records) {
  try {
    safeStorage.setItem(LOCAL_HISTORY_KEY, JSON.stringify(records));
  } catch (err) {
    console.error('Error saving local feed history:', err);
  }
}

export async function fetchFeedHistory() {
  // Always fetch local first for immediate UI display
  const localRecords = getLocalFeedHistory();

  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from('feed_history')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        // Merge with local records (deduplicate by id)
        const recordMap = new Map();
        [...data, ...localRecords].forEach((r) => {
          if (r.id) recordMap.set(r.id, r);
        });
        const merged = Array.from(recordMap.values()).sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        );
        saveLocalFeedHistory(merged);
        return { data: merged, source: 'supabase' };
      }
    } catch (err) {
      console.warn('Supabase history fetch failed, using local:', err);
    }
  }

  return { data: localRecords, source: 'local' };
}

export async function saveFeedRecord(record) {
  const newRecord = {
    id: record.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'rec_' + Date.now()),
    created_at: record.created_at || new Date().toISOString(),
    species: record.species,
    scientific_name: record.scientific_name || '',
    culture_stage: record.culture_stage,
    culture_month: record.culture_month !== undefined ? record.culture_month : null,
    stocked: Number(record.stocked),
    survival_percent: Number(record.survival_percent),
    average_weight: Number(record.average_weight),
    surviving_fish: Number(record.surviving_fish),
    feeding_rate: Number(record.feeding_rate),
    feeding_method: record.feeding_method || 'BIOMASS_PERCENT',
    rate_source: record.rate_source, // 'AUTOMATIC_RULE' or 'FARMER_ENTERED'
    rule_explanation: record.rule_explanation || '',
    rule_explanation_mr: record.rule_explanation_mr || '',
    biomass: Number(record.biomass),
    daily_feed: Number(record.daily_feed),
    morning_feed: Number(record.morning_feed),
    evening_feed: Number(record.evening_feed),
    feed_price: Number(record.feed_price || 0),
    feed_cost: Number(record.feed_cost || 0),
    rule_id: record.rule_id || null,
    pond_id: record.pond_id || null,
    pond_name: record.pond_name || '',
    notes: record.notes || '',
  };

  // Save to local storage first
  const currentLocal = getLocalFeedHistory();
  const updatedLocal = [newRecord, ...currentLocal.filter(r => r.id !== newRecord.id)];
  saveLocalFeedHistory(updatedLocal);

  // If Supabase is connected, persist to PostgreSQL
  if (supabaseClient) {
    try {
      const { error } = await supabaseClient
        .from('feed_history')
        .insert([{
          id: newRecord.id,
          created_at: newRecord.created_at,
          species: newRecord.species,
          scientific_name: newRecord.scientific_name,
          culture_stage: newRecord.culture_stage,
          culture_month: newRecord.culture_month,
          stocked: newRecord.stocked,
          survival_percent: newRecord.survival_percent,
          average_weight: newRecord.average_weight,
          surviving_fish: newRecord.surviving_fish,
          feeding_rate: newRecord.feeding_rate,
          feeding_method: newRecord.feeding_method,
          rate_source: newRecord.rate_source,
          rule_explanation: newRecord.rule_explanation,
          biomass: newRecord.biomass,
          daily_feed: newRecord.daily_feed,
          morning_feed: newRecord.morning_feed,
          evening_feed: newRecord.evening_feed,
          feed_price: newRecord.feed_price,
          feed_cost: newRecord.feed_cost,
          rule_id: newRecord.rule_id,
          pond_id: newRecord.pond_id,
          pond_name: newRecord.pond_name,
          notes: newRecord.notes,
        }]);

      if (error) {
        console.warn('Supabase insert warning:', error);
      }
    } catch (err) {
      console.warn('Supabase insert error:', err);
    }
  }

  return newRecord;
}

export async function deleteFeedRecord(recordId) {
  // Delete from local
  const currentLocal = getLocalFeedHistory();
  const updated = currentLocal.filter((r) => r.id !== recordId);
  saveLocalFeedHistory(updated);

  // Delete from Supabase
  if (supabaseClient) {
    try {
      await supabaseClient
        .from('feed_history')
        .delete()
        .eq('id', recordId);
    } catch (err) {
      console.warn('Supabase delete error:', err);
    }
  }

  return true;
}

/* ==========================================================================
   POND MANAGEMENT API (Supabase + localStorage dual persistence)
   ========================================================================== */

const LOCAL_PONDS_KEY = 'aquaculture_ponds';

export function getLocalPonds() {
  try {
    const raw = safeStorage.getItem(LOCAL_PONDS_KEY);
    if (!raw) {
      // Seed 2 initial sample ponds for farmer convenience
      const initial = [
        {
          id: 'pond_1',
          name: 'Pond A1 - Talav 1',
          area_acres: 1.5,
          depth_feet: 5.5,
          species: 'Rohu',
          culture_stage: 'Rearing',
          stocking_count: 15000,
          survival_percent: 85,
          average_weight_g: 50,
          estimated_biomass_kg: 637.5,
          created_at: new Date().toISOString(),
        },
        {
          id: 'pond_2',
          name: 'Pond B2 - Talav 2',
          area_acres: 2.0,
          depth_feet: 6.0,
          species: 'Common Carp',
          culture_stage: 'Grow-out',
          stocking_count: 8000,
          survival_percent: 90,
          average_weight_g: 250,
          estimated_biomass_kg: 1800,
          created_at: new Date().toISOString(),
        }
      ];
      saveLocalPonds(initial);
      return initial;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading local ponds:', err);
    return [];
  }
}

export function saveLocalPonds(ponds) {
  try {
    safeStorage.setItem(LOCAL_PONDS_KEY, JSON.stringify(ponds));
  } catch (err) {
    console.error('Error saving local ponds:', err);
  }
}

export async function fetchPonds() {
  const localPonds = getLocalPonds();

  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from('ponds')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        saveLocalPonds(data);
        return { data, source: 'supabase' };
      }
    } catch (err) {
      console.warn('Supabase fetch ponds error:', err);
    }
  }

  return { data: localPonds, source: 'local' };
}

export async function savePondRecord(pond) {
  const isNew = !pond.id;
  const newPond = {
    id: pond.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'p_' + Date.now()),
    name: pond.name || 'Pond',
    area_acres: Number(pond.area_acres) || 0,
    depth_feet: Number(pond.depth_feet) || 0,
    species: pond.species || '',
    culture_stage: pond.culture_stage || '',
    stocking_count: Number(pond.stocking_count) || 0,
    survival_percent: Number(pond.survival_percent) || 0,
    average_weight_g: Number(pond.average_weight_g) || 0,
    estimated_biomass_kg: Number(pond.estimated_biomass_kg) || 0,
    notes: pond.notes || '',
    created_at: pond.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const currentLocal = getLocalPonds();
  const updated = isNew
    ? [newPond, ...currentLocal]
    : currentLocal.map((p) => (p.id === newPond.id ? newPond : p));
  saveLocalPonds(updated);

  if (supabaseClient) {
    try {
      await supabaseClient
        .from('ponds')
        .upsert([newPond]);
    } catch (err) {
      console.warn('Supabase upsert pond error:', err);
    }
  }

  return newPond;
}

export async function deletePondRecord(pondId) {
  const currentLocal = getLocalPonds();
  const updated = currentLocal.filter((p) => p.id !== pondId);
  saveLocalPonds(updated);

  if (supabaseClient) {
    try {
      await supabaseClient
        .from('ponds')
        .delete()
        .eq('id', pondId);
    } catch (err) {
      console.warn('Supabase delete pond error:', err);
    }
  }

  return true;
}
