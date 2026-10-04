export const SPECIES_LIST = [
  {
    id: 'rohu',
    name: 'Rohu',
    name_mr: 'रोहू',
    scientific_name: 'Labeo rohita',
    category: 'IMC',
    allowStages: ['Nursery', 'Rearing', 'Grow-out'],
    needsMonth: false,
    method: 'BIOMASS_PERCENT',
  },
  {
    id: 'catla',
    name: 'Catla',
    name_mr: 'कटला',
    scientific_name: 'Catla catla',
    category: 'IMC',
    allowStages: ['Nursery', 'Rearing', 'Grow-out'],
    needsMonth: false,
    method: 'BIOMASS_PERCENT',
  },
  {
    id: 'mrigal',
    name: 'Mrigal',
    name_mr: 'मृगळ',
    scientific_name: 'Cirrhinus cirrhosus',
    category: 'IMC',
    allowStages: ['Nursery', 'Rearing', 'Grow-out'],
    needsMonth: false,
    method: 'BIOMASS_PERCENT',
  },
  {
    id: 'common_carp',
    name: 'Common Carp',
    name_mr: 'कॉमन कार्प',
    scientific_name: 'Cyprinus carpio',
    category: 'Exotic Carp',
    allowStages: ['Nursery', 'Rearing', 'Grow-out'],
    needsMonth: false,
    method: 'BIOMASS_PERCENT',
    isWeightBased: true,
  },
  {
    id: 'tilapia',
    name: 'Tilapia',
    name_mr: 'तिलापिया',
    scientific_name: 'Oreochromis spp.',
    category: 'Cichlid',
    allowStages: ['Nursery', 'Rearing', 'Grow-out'],
    needsMonth: false,
    method: 'BIOMASS_PERCENT',
    isWeightBased: true,
    hasRange: true,
  },
  {
    id: 'pangasius',
    name: 'Pangasius',
    name_mr: 'पंगासियस',
    scientific_name: 'Pangasianodon hypophthalmus',
    category: 'Catfish',
    allowStages: ['Nursery', 'Rearing', 'Grow-out'],
    needsMonth: true,
    method: 'BIOMASS_PERCENT',
  },
  {
    id: 'magur',
    name: 'Magur',
    name_mr: 'मागूर',
    scientific_name: 'Clarias batrachus',
    category: 'Catfish',
    allowStages: ['Nursery', 'Rearing', 'Grow-out'],
    needsMonth: false,
    method: 'MANUAL',
    isManual: true,
  },
  {
    id: 'grass_carp',
    name: 'Grass Carp',
    name_mr: 'ग्रास कार्प',
    scientific_name: 'Ctenopharyngodon idella',
    category: 'Exotic Carp',
    allowStages: ['Nursery', 'Rearing', 'Grow-out'],
    needsMonth: false,
    method: 'MANUAL',
    isManual: true,
  },
  {
    id: 'custom',
    name: 'Other / Custom',
    name_mr: 'इतर / सानुकूल',
    scientific_name: '',
    category: 'Custom',
    allowStages: ['Nursery', 'Rearing', 'Grow-out'],
    needsMonth: false,
    method: 'MANUAL',
    isCustom: true,
    isManual: true,
  },
];

export const CULTURE_STAGES = [
  { id: 'Nursery', name: 'Nursery', name_mr: 'नर्सरी' },
  { id: 'Rearing', name: 'Rearing', name_mr: 'रिअरिंग' },
  { id: 'Grow-out', name: 'Grow-out', name_mr: 'ग्रो-आऊट' },
];

export const FEEDING_MODES = {
  AUTOMATIC: 'AUTOMATIC',
  MANUAL: 'MANUAL',
  REFERENCE_ASSUMPTION: 'REFERENCE_ASSUMPTION',
};

export const FEEDING_METHODS = {
  BIOMASS_PERCENT: 'BIOMASS_PERCENT',
  INITIAL_SPAWN_WEIGHT: 'INITIAL_SPAWN_WEIGHT',
  VERIFIED_PROTOCOL: 'VERIFIED_PROTOCOL',
  FORAGE_BASED: 'FORAGE_BASED',
  MANUAL: 'MANUAL',
};

// IMC Nursery Project Assumption and Reference Feeding
export const IMC_NURSERY_REFERENCE = {
  SPAWN_PER_KG_BIOMASS: 1000000,
  BIOMASS_PER_MILLION_SPAWN_KG: 1.5,
  DAYS_1_TO_5_RATE: 400.0,
  DAYS_6_PLUS_RATE: 800.0,
};

// IMC Rearing Reference Ranges
export const IMC_REARING_PERIODS = [
  { id: 'month_1', label: 'First month', label_mr: 'पहिला महिना', rate_min: 8.0, rate_max: 10.0, default_rate: 9.0 },
  { id: 'month_2', label: 'Second month', label_mr: 'दुसरा महिना', rate_min: 6.0, rate_max: 8.0, default_rate: 7.0 },
  { id: 'later', label: 'Later stages', label_mr: 'पुढील टप्पे', rate_min: 5.0, rate_max: 6.0, default_rate: 5.5 },
];

// IMC Grow-out Reference Ranges
export const IMC_GROWOUT_PHASES = [
  { id: 'initial', label: 'Initial stage', label_mr: 'सुरुवातीचा टप्पा', rate_min: 5.0, rate_max: 6.0, default_rate: 5.5 },
  { id: 'mid', label: 'Mid stage', label_mr: 'मध्यम टप्पा', rate_min: 3.0, rate_max: 4.0, default_rate: 3.5 },
  { id: 'final', label: 'Final stage', label_mr: 'अंतिम टप्पा', rate_min: 2.0, rate_max: 3.0, default_rate: 2.5 },
];
