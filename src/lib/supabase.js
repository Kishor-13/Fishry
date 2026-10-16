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
   FEED HISTORY API (Supabase + localStorage dual persistence, scoped by farmer)
   ========================================================================== */

const LOCAL_HISTORY_KEY = 'aquaculture_feed_history';

export function getLocalFeedHistory(farmerId = null) {
  try {
    const key = farmerId ? `${LOCAL_HISTORY_KEY}_${farmerId}` : LOCAL_HISTORY_KEY;
    const raw = safeStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Error reading local feed history:', err);
    return [];
  }
}

export function saveLocalFeedHistory(records, farmerId = null) {
  try {
    const key = farmerId ? `${LOCAL_HISTORY_KEY}_${farmerId}` : LOCAL_HISTORY_KEY;
    safeStorage.setItem(key, JSON.stringify(records));
  } catch (err) {
    console.error('Error saving local feed history:', err);
  }
}

export async function fetchFeedHistory(farmerId = null) {
  const localRecords = getLocalFeedHistory(farmerId);

  if (supabaseClient) {
    try {
      let query = supabaseClient
        .from('feed_history')
        .select('*')
        .order('created_at', { ascending: false });

      if (farmerId) {
        query = query.eq('farmer_id', farmerId);
      }

      const { data, error } = await query;

      if (!error && data) {
        const recordMap = new Map();
        [...data, ...localRecords].forEach((r) => {
          if (r.id) recordMap.set(r.id, r);
        });
        const merged = Array.from(recordMap.values()).sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        );
        saveLocalFeedHistory(merged, farmerId);
        return { data: merged, source: 'supabase' };
      }
    } catch (err) {
      console.warn('Supabase history fetch failed, using local:', err);
    }
  }

  return { data: localRecords, source: 'local' };
}

export async function saveFeedRecord(record, farmerId = null) {
  const actualFarmerId = farmerId || record.farmer_id || null;
  const newRecord = {
    id: record.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'rec_' + Date.now()),
    farmer_id: actualFarmerId,
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
    calculated_feed: Number(record.calculated_feed ?? record.daily_feed),
    confirmed_feed: Number(record.confirmed_feed ?? record.daily_feed),
    actual_feed: (record.actual_feed !== null && record.actual_feed !== undefined && record.actual_feed !== '' && !isNaN(Number(record.actual_feed))) ? Number(record.actual_feed) : null,
    difference_kg: (record.difference_kg !== null && record.difference_kg !== undefined && !isNaN(Number(record.difference_kg))) ? Number(record.difference_kg) : null,
    difference_percent: (record.difference_percent !== null && record.difference_percent !== undefined && !isNaN(Number(record.difference_percent))) ? Number(record.difference_percent) : null,
    actual_feed_cost: (record.actual_feed_cost !== null && record.actual_feed_cost !== undefined && !isNaN(Number(record.actual_feed_cost))) ? Number(record.actual_feed_cost) : null,
    difference_reason: record.difference_reason || '',
    tray_observation: record.tray_observation || '',
    critical_conditions: Array.isArray(record.critical_conditions) ? record.critical_conditions : [],
    culture_age_days: (record.culture_age_days !== null && record.culture_age_days !== undefined && record.culture_age_days !== '') ? Number(record.culture_age_days) : null,
    feed_type: record.feed_type || '',
    morning_feed: Number(record.morning_feed),
    evening_feed: Number(record.evening_feed),
    feed_price: Number(record.feed_price || 0),
    feed_cost: Number(record.feed_cost || 0),
    rule_id: record.rule_id || null,
    pond_id: record.pond_id || null,
    pond_name: record.pond_name || '',
    notes: record.notes || '',

    // Finfish & Crustacean Integration Fields
    session: record.session || 'morning',
    session_date: record.session_date || (record.created_at ? record.created_at.split('T')[0] : new Date().toISOString().split('T')[0]),
    session_baseline_feed: (record.session_baseline_feed !== null && record.session_baseline_feed !== undefined && !isNaN(Number(record.session_baseline_feed))) ? Number(record.session_baseline_feed) : null,
    observation_method: record.observation_method || '',
    observation: record.observation || record.tray_observation || '',
    proposed_adjustment_percent: (record.proposed_adjustment_percent !== null && record.proposed_adjustment_percent !== undefined && !isNaN(Number(record.proposed_adjustment_percent))) ? Number(record.proposed_adjustment_percent) : 0,
    observation_guidance: record.observation_guidance || '',
    observation_guidance_mr: record.observation_guidance_mr || '',
    mud_obscured: Boolean(record.mud_obscured),
    is_magur_delayed_inspection: Boolean(record.is_magur_delayed_inspection),
    check_tray_feed_g: (record.check_tray_feed_g !== null && record.check_tray_feed_g !== undefined && !isNaN(Number(record.check_tray_feed_g))) ? Number(record.check_tray_feed_g) : null,
    check_tray_rate_g_per_kg: (record.check_tray_rate_g_per_kg !== null && record.check_tray_rate_g_per_kg !== undefined && !isNaN(Number(record.check_tray_rate_g_per_kg))) ? Number(record.check_tray_rate_g_per_kg) : null,
    checking_interval_str: record.checking_interval_str || '',
    faecal_length: record.faecal_length || '',
    faecal_colour: record.faecal_colour || '',
    sand_present: Boolean(record.sand_present),
    dissolved_oxygen: (record.dissolved_oxygen !== null && record.dissolved_oxygen !== undefined && record.dissolved_oxygen !== '' && !isNaN(Number(record.dissolved_oxygen))) ? Number(record.dissolved_oxygen) : null,
    is_fish_piping: Boolean(record.is_fish_piping),
    water_temperature: (record.water_temperature !== null && record.water_temperature !== undefined && record.water_temperature !== '' && !isNaN(Number(record.water_temperature))) ? Number(record.water_temperature) : null,
    weather_condition: record.weather_condition || 'normal',
    handling_condition: record.handling_condition || 'none',
    is_chemical_treatment: Boolean(record.is_chemical_treatment),
    environmental_override_reason: record.environmental_override_reason || '',
  };

  // Save to local storage first
  const currentLocal = getLocalFeedHistory(actualFarmerId);
  const updatedLocal = [newRecord, ...currentLocal.filter(r => r.id !== newRecord.id)];
  saveLocalFeedHistory(updatedLocal, actualFarmerId);

  // If Supabase is connected, persist to PostgreSQL
  if (supabaseClient) {
    try {
      const payload = {
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
        calculated_feed: newRecord.calculated_feed,
        confirmed_feed: newRecord.confirmed_feed,
        actual_feed: newRecord.actual_feed,
        difference_kg: newRecord.difference_kg,
        difference_percent: newRecord.difference_percent,
        actual_feed_cost: newRecord.actual_feed_cost,
        difference_reason: newRecord.difference_reason,
        tray_observation: newRecord.tray_observation,
        critical_conditions: newRecord.critical_conditions,
        culture_age_days: newRecord.culture_age_days,
        feed_type: newRecord.feed_type,
        morning_feed: newRecord.morning_feed,
        evening_feed: newRecord.evening_feed,
        feed_price: newRecord.feed_price,
        feed_cost: newRecord.feed_cost,
        rule_id: newRecord.rule_id,
        pond_id: newRecord.pond_id,
        pond_name: newRecord.pond_name,
        notes: newRecord.notes,
      };
      if (newRecord.farmer_id) {
        payload.farmer_id = newRecord.farmer_id;
      }

      const { error } = await supabaseClient
        .from('feed_history')
        .insert([payload]);

      if (error) {
        console.warn('Supabase insert warning:', error);
      }
    } catch (err) {
      console.warn('Supabase insert error:', err);
    }
  }

  return newRecord;
}

export async function deleteFeedRecord(recordId, farmerId = null) {
  // Delete from local
  const currentLocal = getLocalFeedHistory(farmerId);
  const updated = currentLocal.filter((r) => r.id !== recordId);
  saveLocalFeedHistory(updated, farmerId);

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
   POND MANAGEMENT API (Supabase + localStorage dual persistence, scoped by farmer)
   ========================================================================== */

const LOCAL_PONDS_KEY = 'aquaculture_ponds';

export function getLocalPonds(farmerId = null) {
  try {
    const key = farmerId ? `${LOCAL_PONDS_KEY}_${farmerId}` : LOCAL_PONDS_KEY;
    const raw = safeStorage.getItem(key);
    if (!raw) {
      return []; // Clean empty list for every new farmer!
    }
    const parsed = JSON.parse(raw);
    // Filter out any legacy sample ponds
    const cleaned = Array.isArray(parsed) 
      ? parsed.filter(p => p.id !== 'pond_1' && p.id !== 'pond_2')
      : [];
    if (cleaned.length !== (parsed ? parsed.length : 0)) {
      saveLocalPonds(cleaned, farmerId);
    }
    return cleaned;
  } catch (err) {
    console.error('Error reading local ponds:', err);
    return [];
  }
}

export function saveLocalPonds(ponds, farmerId = null) {
  try {
    const key = farmerId ? `${LOCAL_PONDS_KEY}_${farmerId}` : LOCAL_PONDS_KEY;
    safeStorage.setItem(key, JSON.stringify(ponds));
  } catch (err) {
    console.error('Error saving local ponds:', err);
  }
}

export async function fetchPonds(farmerId = null) {
  const localPonds = getLocalPonds(farmerId);

  if (supabaseClient) {
    try {
      let query = supabaseClient
        .from('ponds')
        .select('*')
        .order('created_at', { ascending: false });

      if (farmerId) {
        query = query.eq('farmer_id', farmerId);
      }

      const { data, error } = await query;

      if (!error && data) {
        // Filter out legacy sample ponds if any
        const cleaned = data.filter(p => p.id !== 'pond_1' && p.id !== 'pond_2');
        saveLocalPonds(cleaned, farmerId);
        return { data: cleaned, source: 'supabase' };
      }
    } catch (err) {
      console.warn('Supabase fetch ponds error:', err);
    }
  }

  return { data: localPonds, source: 'local' };
}

export async function savePondRecord(pond, farmerId = null) {
  const actualFarmerId = farmerId || pond.farmer_id || null;
  const isNew = !pond.id;
  const newPond = {
    id: pond.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'p_' + Date.now()),
    farmer_id: actualFarmerId,
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

  const currentLocal = getLocalPonds(actualFarmerId);
  const updated = isNew
    ? [newPond, ...currentLocal]
    : currentLocal.map((p) => (p.id === newPond.id ? newPond : p));
  saveLocalPonds(updated, actualFarmerId);

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

export async function deletePondRecord(pondId, farmerId = null) {
  const currentLocal = getLocalPonds(farmerId);
  const updated = currentLocal.filter((p) => p.id !== pondId);
  saveLocalPonds(updated, farmerId);

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
