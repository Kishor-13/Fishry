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
    id: 'vannamei',
    name: 'Vannamei shrimp / Pacific white shrimp',
    name_mr: 'व्हॅनामेई कोळंबी / पॅसिफिक व्हाईट श्रिम्प',
    scientific_name: 'Litopenaeus vannamei',
    category: 'Crustacean',
    allowStages: ['Grow-out'],
    needsMonth: false,
    needsCultureAge: true,
    method: 'BIOMASS_PERCENT',
    isCrustacean: true,
    isVannamei: true,
  },
  {
    id: 'freshwater_prawn',
    name: 'Giant Freshwater Prawn / Giant River Prawn',
    name_mr: 'गोड्या पाण्यातील महा-कोळंबी (जायंट रिव्हर प्रॉन)',
    scientific_name: 'Macrobrachium rosenbergii',
    category: 'Freshwater crustacean',
    allowStages: ['Hatchery (Larvae)', 'Nursery (PL/Juveniles)', 'Grow-out', 'Broodstock'],
    needsMonth: false,
    method: 'BIOMASS_PERCENT',
    isCrustacean: true,
    isFreshwaterPrawn: true,
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

// ==============================================================================
// FEATURE 1: VANNAMEI SHRIMP (Litopenaeus vannamei) REFERENCE FEEDING SCHEDULE
// Source: Supplied Reference Table (Culture days 1–120)
// ==============================================================================
export const VANNAMEI_FEEDING_SCHEDULE = [
  { min_day: 1, max_day: 7, ref_weight_min: 0.02, ref_weight_max: 0.4, rate_min: 35.0, rate_max: 60.0, is_range: true, desc: '60–35% body weight/day' },
  { min_day: 8, max_day: 14, ref_weight: 0.7, rate: 8.0, is_range: false, desc: '8% body weight/day' },
  { min_day: 15, max_day: 21, ref_weight: 1.2, rate: 7.0, is_range: false, desc: '7% body weight/day' },
  { min_day: 22, max_day: 28, ref_weight: 2.0, rate: 6.0, is_range: false, desc: '6% body weight/day' },
  { min_day: 29, max_day: 35, ref_weight: 3.1, rate: 5.0, is_range: false, desc: '5% body weight/day' },
  { min_day: 36, max_day: 42, ref_weight: 4.4, rate: 4.5, is_range: false, desc: '4.5% body weight/day' },
  { min_day: 43, max_day: 49, ref_weight: 5.8, rate: 4.2, is_range: false, desc: '4.2% body weight/day' },
  { min_day: 50, max_day: 56, ref_weight: 7.5, rate: 3.4, is_range: false, desc: '3.4% body weight/day' },
  { min_day: 57, max_day: 63, ref_weight: 9.2, rate: 3.0, is_range: false, desc: '3.0% body weight/day' },
  { min_day: 64, max_day: 70, ref_weight: 10.9, rate: 2.7, is_range: false, desc: '2.7% body weight/day' },
  { min_day: 71, max_day: 77, ref_weight: 12.6, rate: 2.6, is_range: false, desc: '2.6% body weight/day' },
  { min_day: 78, max_day: 84, ref_weight: 14.5, rate: 2.5, is_range: false, desc: '2.5% body weight/day' },
  { min_day: 85, max_day: 91, ref_weight: 16.6, rate: 2.4, is_range: false, desc: '2.4% body weight/day' },
  { min_day: 92, max_day: 98, ref_weight: 18.7, rate: 2.2, is_range: false, desc: '2.2% body weight/day' },
  { min_day: 99, max_day: 105, ref_weight: 20.8, rate: 2.0, is_range: false, desc: '2.0% body weight/day' },
  { min_day: 106, max_day: 112, ref_weight: 22.9, rate: 1.9, is_range: false, desc: '1.9% body weight/day' },
  { min_day: 113, max_day: 120, ref_weight: 25.0, rate: 1.8, is_range: false, desc: '1.8% body weight/day' },
];

// Feeding-Tray Observations (Shared observation choices)
export const FEEDING_TRAY_OBSERVATIONS = [
  {
    id: 'none',
    label: 'No observation available',
    label_mr: 'निरीक्षण उपलब्ध नाही',
    vannamei_adjustment: 0,
    vannamei_action: 'NONE',
    vannamei_guidance: 'No tray observation provided. Use reference calculation as starting point.',
    vannamei_guidance_mr: 'ट्रे निरीक्षण उपलब्ध नाही. संदर्भ गणनेचा आधार घेऊन परिस्थितीनुसार विचार करा.',
    prawn_guidance: 'No observation available. Rely on sampled appetite and verified farm protocol.',
    prawn_guidance_mr: 'निरीक्षण उपलब्ध नाही. प्रमाणित पद्धतीनुसार निर्णय घ्या.',
  },
  {
    id: 'consumed',
    label: 'Feed completely consumed',
    label_mr: 'खाद्य पूर्णपणे संपले',
    vannamei_adjustment: 7.5, // 5–10% increase proposed
    vannamei_min_adj: 5,
    vannamei_max_adj: 10,
    vannamei_action: 'INCREASE_5_10',
    vannamei_guidance: 'Feed completely consumed in all trays: Increase the next feeding by 5–10%.',
    vannamei_guidance_mr: 'ट्रेमधील खाद्य पूर्णपणे संपले आहे: पुढील जेवणात ५–१०% वाढ करावी.',
    prawn_guidance: 'Complete consumption observed. Review possible increase based on verified protocol.',
    prawn_guidance_mr: 'खाद्य पूर्णपणे संपले. प्रमाणित पद्धतीनुसार आहारात वाढ करण्याचा विचार करू शकता.',
  },
  {
    id: 'small_remaining',
    label: 'Small amount remaining (5–10%)',
    label_mr: 'कमी प्रमाणात शिल्लक (५–१०%)',
    vannamei_adjustment: -15, // 10–20% reduction proposed
    vannamei_min_adj: -20,
    vannamei_max_adj: -10,
    vannamei_action: 'REDUCE_10_20',
    vannamei_guidance: '5–10% feed remaining: Reduce the next feeding by 10–20%.',
    vannamei_guidance_mr: '५–१०% खाद्य शिल्लक आहे: पुढील जेवणात १०–२०% कपात करावी.',
    prawn_guidance: 'Small amount remaining. Maintain caution and avoid increasing the ration.',
    prawn_guidance_mr: 'थोड्या प्रमाणात खाद्य शिल्लक. आहारात वाढ करणे टाळा.',
  },
  {
    id: 'moderate_remaining',
    label: 'Moderate amount remaining (10–20%)',
    label_mr: 'मध्यम प्रमाणात शिल्लक (१०–२०%)',
    vannamei_adjustment: -40, // 30–50% reduction proposed
    vannamei_min_adj: -50,
    vannamei_max_adj: -30,
    vannamei_action: 'REDUCE_30_50',
    vannamei_guidance: '10–20% feed remaining: Reduce the next feeding by 30–50%.',
    vannamei_guidance_mr: '१०–२०% खाद्य शिल्लक आहे: पुढील जेवणात ३०–५०% कपात करावी.',
    prawn_guidance: 'Moderate leftovers observed. Excessive leftovers justify reducing the next ration.',
    prawn_guidance_mr: 'मध्यम प्रमाणात खाद्य शिल्लक. पुढील जेवणातील खाद्य प्रमाण कमी करावे.',
  },
  {
    id: 'large_remaining',
    label: 'Large amount remaining (>50%)',
    label_mr: 'मोठ्या प्रमाणात शिल्लक (>५०%)',
    vannamei_adjustment: -100, // Stop next meal
    vannamei_action: 'STOP_NEXT_MEAL',
    vannamei_guidance: 'More than 50% feed remaining: Stop the next meal and assess pond conditions.',
    vannamei_guidance_mr: '५०% पेक्षा जास्त खाद्य शिल्लक: पुढील जेवण त्वरित थांबवा आणि पाण्याची गुणवत्ता तपासा.',
    prawn_guidance: 'Heavy uneaten feed observed. Stop or severely cut feeding and inspect water quality immediately.',
    prawn_guidance_mr: 'खूप जास्त खाद्य शिल्लक. तात्काळ खाद्य थांबवा आणि पाण्याचे नमुने तपासा.',
  },
];

// Vannamei Critical Pond Conditions
export const VANNAMEI_CRITICAL_CONDITIONS = [
  {
    id: 'low_do_surfacing',
    label: 'Shrimp surfacing due to low dissolved oxygen',
    label_mr: 'कमी ऑक्सिजनमुळे कोळंबी पाण्यावर येणे',
    action: 'STOP_1_2_DAYS',
    priority: 1, // Highest conservatism
    reduction_percent: 100,
    guidance: 'Stop feeding for 1–2 days, start emergency aeration, and assess water quality.',
    guidance_mr: '१–२ दिवस खाद्य देणे पूर्णपणे थांबवा, तात्काळ वायुवीजन (aeration) सुरू करा आणि पाण्याची गुणवत्ता तपासा.',
  },
  {
    id: 'temp_extreme',
    label: 'Temperature below 22°C or above 36°C',
    label_mr: 'तापमान २२°C पेक्षा कमी किंवा ३६°C पेक्षा जास्त',
    action: 'STOP_MEAL',
    priority: 2,
    reduction_percent: 100,
    guidance: 'Stop feeding following source reference until water temperature returns to normal range (26–32°C).',
    guidance_mr: 'तापमान सामान्य मर्यादेत (२६–३२°C) येईपर्यंत संदर्भाच्या मार्गदर्शक सूचनेनुसार खाद्य देणे थांबवा.',
  },
  {
    id: 'wind_heavy_rain',
    label: 'Windy conditions or heavy rain',
    label_mr: 'वादळी वारे किंवा मुसळधार पाऊस',
    action: 'CANCEL_MEAL',
    priority: 3,
    reduction_percent: 100,
    guidance: 'Cancel the meal. Heavy rain and high winds disrupt feeding response and lower salinity/pH.',
    guidance_mr: 'सदर वेळेचे खाद्य रद्द करा. वादळ आणि पावसामुळे खाण्याचा प्रतिसाद कमी होतो.',
  },
  {
    id: 'algal_bloom',
    label: 'Thick algal bloom',
    label_mr: 'पाण्यावर शेवाळाचा जाड थर (Algal Bloom)',
    action: 'REDUCE_50',
    priority: 4,
    reduction_percent: 50,
    guidance: 'Reduce feeding by 50% to prevent dissolved oxygen depletion.',
    guidance_mr: 'रात्रीच्या वेळी ऑक्सिजनची कमतरता टाळण्यासाठी खाद्य ५०% कमी करा.',
  },
  {
    id: 'water_exchange',
    label: 'Water exchange in progress',
    label_mr: 'पाणी बदल चालू असताना',
    action: 'REDUCE_50',
    priority: 5,
    reduction_percent: 50,
    guidance: 'Reduce feeding by 50% during water exchange.',
    guidance_mr: 'पाणी बदलण्याच्या काळात खाद्य ५०% कमी करा.',
  },
  {
    id: 'chemical_application',
    label: 'Chemical / mineral application',
    label_mr: 'औषध किंवा खनिजे टाकल्यास',
    action: 'REDUCE_50',
    priority: 6,
    reduction_percent: 50,
    guidance: 'Reduce feeding by 50% during chemical/mineral application.',
    guidance_mr: 'औषध किंवा रसायन उपचाराच्या वेळी खाद्य ५०% कमी करा.',
  },
  {
    id: 'high_ph_fluctuation',
    label: 'High pH fluctuation (>0.5 day/night change)',
    label_mr: 'पीएच (pH) मध्ये जास्त चढ-उतार',
    action: 'REDUCE_50',
    priority: 7,
    reduction_percent: 50,
    guidance: 'Reduce feeding by 50% during unstable pH conditions.',
    guidance_mr: 'पीएचमधील चढ-उतार स्थिर होईपर्यंत खाद्य ५०% कमी करा.',
  },
  {
    id: 'moulting',
    label: 'Moulting period (Peak ecdysis)',
    label_mr: 'कात टाकण्याचा काळ (Moulting)',
    action: 'REDUCE_50',
    priority: 8,
    reduction_percent: 50,
    guidance: 'Reduce feeding by 50% during peak moulting as soft-shell shrimp feed less.',
    guidance_mr: 'कात टाकताना कोळंबी कमी खाते, त्यामुळे खाद्य ५०% कमी करा.',
  },
  {
    id: 'black_gill',
    label: 'Black gill condition observed',
    label_mr: 'काळी कल्ले (Black Gill) आजार दिसल्यास',
    action: 'REDUCE_30_50',
    priority: 9,
    reduction_percent: 40,
    guidance: 'Reduce feeding by 30–50% and inspect pond bottom and gill health.',
    guidance_mr: 'खाद्य ३०–५०% कमी करा आणि तळ्याचा तळ व कल्ल्यांचे आरोग्य तपासा.',
  },
  {
    id: 'temp_fluctuation',
    label: 'Temperature fluctuation / extremes (22–25°C or 33–35°C)',
    label_mr: 'तापमानातील चढ-उतार (२२–२५°C किंवा ३३–३५°C)',
    action: 'REDUCE_30_50',
    priority: 10,
    reduction_percent: 30,
    guidance: 'Apply source stated reduction guidance: reduce feeding by 30–50% due to suboptimal temperature.',
    guidance_mr: 'संदर्भ मार्गदर्शक सूचनेनुसार: कमी किंवा जास्त तापमानामुळे खाद्य ३०–५०% कमी करा.',
  },
];

// Giant Freshwater Prawn (Macrobrachium rosenbergii) Stages and FAO Guidance
export const FRESHWATER_PRAWN_STAGES = [
  {
    id: 'Hatchery (Larvae)',
    name: 'Hatchery (Larvae)',
    name_mr: 'हॅचरी (अळ्या / लार्व्हा)',
    isHatchery: true,
    faoSource: 'FAO Fisheries Technical Paper 428 (Freshwater Prawn Hatchery Manual)',
    guidance: 'Hatchery feeding protocol required. Larval feeding follows stage development (Zoea I–XI) with live Artemia nauplii and prepared egg custard. Do not apply grow-out biomass percentages.',
    guidance_mr: 'हॅचरी खाद्य पद्धत आवश्यक. अळ्यांना (झोइआ १-११) आर्टेमिया आणि विशेष अंड्याचे खाद्य आवश्यक असते. बायोमास टक्केवारी लागू करू नका.',
  },
  {
    id: 'Nursery (PL/Juveniles)',
    name: 'Nursery (PL/Juveniles)',
    name_mr: 'नर्सरी (पोस्ट-लार्व्हा / लहान पिले)',
    isNursery: true,
    faoSource: 'FAO Manual Section 7 (Nursery Management)',
    rate_min: 10.0,
    rate_max: 20.0,
    guidance: 'Broad FAO reference: approximately 10–20% of total prawn biomass per day. Confirm or select a rate using locally verified nursery protocol.',
    guidance_mr: 'विस्तृत FAO संदर्भ: एकूण बायोमासच्या अंदाजे १०–२०% दररोज. स्थानिक प्रमाणित नर्सरी पद्धतीनुसार दर निश्चित करा.',
  },
  {
    id: 'Grow-out',
    name: 'Grow-out',
    name_mr: 'ग्रो-आऊट (मुख्य संवर्धन)',
    isGrowout: true,
    faoSource: 'FAO Manual Section 8 (Grow-out Feeding Management)',
    guidance: 'Broad FAO examples: Smaller juveniles ~10–20% biomass/day; progressively lower rates as prawns grow; near harvest ~2% biomass/day. Confirm rate for current size.',
    guidance_mr: 'विस्तृत FAO संदर्भ: लहान पिलांसाठी ~१०–२०%; वाढीनुसार दर कमी होतो; काढणीजवळ ~२% बायोमास/दिवस. सध्याच्या आकारासाठी दर निश्चित करा.',
  },
  {
    id: 'Broodstock',
    name: 'Broodstock',
    name_mr: 'ब्रूडस्टॉक (प्रजनन कोळंबी)',
    isBroodstock: true,
    faoSource: 'FAO Manual Section 5 (Broodstock Management)',
    rate_min: 1.0,
    rate_max: 3.0,
    guidance: 'FAO reference range: 1–3% of total biomass per day. Fresh feeds (squid, mussel, fish) contain 70–80% moisture; do not assume fresh-feed weight is equivalent to dry pellet weight.',
    guidance_mr: 'FAO संदर्भ श्रेणी: १–३% बायोमास/दिवस. ताज्या खाद्यामध्ये ७०–८०% पाणी असते; ताज्या खाद्याचे वजन सुक्या गोळी खाद्यासारखे समजू नका.',
  },
];

// ==============================================================================
// OBSERVATION METHODS & SPECIES MAPPING
// ==============================================================================
export const OBSERVATION_METHODS = [
  { id: 'floating_feed', name: 'Floating Pellets (Surface)', name_mr: 'तरंगणाऱ्या गोळ्या (पृष्ठभाग)' },
  { id: 'submerged_tray', name: 'Submerged Tray / Feeding Bag', name_mr: 'बुडवलेला ट्रे / खाद्य पिशवी' },
  { id: 'suspended_tray', name: 'Mid-Water / Suspended Tray (Rohu)', name_mr: 'मध्य-स्तरावरील लटकवलेला ट्रे (रोहू)' },
  { id: 'bottom_tray', name: 'Bottom Submerged Tray (Mrigal, Common Carp)', name_mr: 'तळातील बुडवलेला ट्रे (म्रिगल, कॉमन कार्प)' },
  { id: 'green_fodder_frame', name: 'Green Fodder Floating Corral (Grass Carp)', name_mr: 'तरंगता हिरवा चारा कोठा (ग्रास कार्प)' },
  { id: 'vannamei_check_tray', name: 'Vannamei Check-Tray Monitoring', name_mr: 'व्हॅनामेई चेक-ट्रे देखरेख' },
  { id: 'prawn_feed_tray', name: 'Freshwater Prawn Feed Tray', name_mr: 'गोड्या पाण्यातील कोळंबी खाद्य ट्रे' },
];

// Attach property aliases for backward compatibility
OBSERVATION_METHODS.FLOATING_FEED = 'floating_feed';
OBSERVATION_METHODS.SUBMERGED_TRAY = 'submerged_tray';
OBSERVATION_METHODS.SUSPENDED_TRAY = 'suspended_tray';
OBSERVATION_METHODS.BOTTOM_TRAY = 'bottom_tray';
OBSERVATION_METHODS.GREEN_FODDER_FRAME = 'green_fodder_frame';
OBSERVATION_METHODS.VANNAMEI_CHECK_TRAY = 'vannamei_check_tray';
OBSERVATION_METHODS.PRAWN_FEED_TRAY = 'prawn_feed_tray';

export function getSpeciesDefaultObservationMethod(speciesId) {
  const sp = (speciesId || '').toLowerCase();
  if (sp.includes('catla')) return 'floating_feed';
  if (sp.includes('tilapia')) return 'floating_feed';
  if (sp.includes('pangasius')) return 'floating_feed';
  if (sp.includes('rohu')) return 'submerged_tray';
  if (sp.includes('mrigal')) return 'bottom_tray';
  if (sp.includes('common_carp') || sp.includes('common carp')) return 'bottom_tray';
  if (sp.includes('magur')) return 'submerged_tray';
  if (sp.includes('grass_carp') || sp.includes('grass carp')) return 'green_fodder_frame';
  if (sp.includes('vannamei')) return 'vannamei_check_tray';
  if (sp.includes('prawn') || sp.includes('macrobrachium')) return 'prawn_feed_tray';
  return 'floating_feed';
}

// ==============================================================================
// 1. FLOATING-FEED OBSERVATION RULES (Tilapia, Pangasius, Catla)
// User-provided proposed reference rules (not officially validated universal prescriptions).
// ==============================================================================
export const FLOATING_FEED_OBSERVATIONS = [
  {
    id: 'none',
    label: 'No observation recorded yet',
    label_mr: 'अद्याप कोणतेही निरीक्षण नोंदवलेले नाही',
    interpretation: 'No observation available',
    interpretation_mr: 'निरीक्षण उपलब्ध नाही',
    action: 'NONE',
    proposed_adjustment: 0,
    adjustmentPercent: 0,
    guidance: 'No observation recorded. Maintain calculated baseline.',
    guidance_mr: 'कोणतेही निरीक्षण नाही. गणना केलेले मूळ प्रमाण कायम ठेवा.',
  },
  {
    id: 'cleared_under_10min',
    label: 'Feed cleared in less than 10 minutes',
    label_mr: '१० मिनिटांपेक्षा कमी वेळेत खाद्य संपले',
    interpretation: 'Vigorous feeding; possible insufficient ration',
    interpretation_mr: 'तीव्र भूक व जलद खाणे; खाद्य अपुरे असण्याची शक्यता',
    action: 'SUGGEST_INCREASE_5_10',
    proposed_adjustment: 7.5,
    adjustmentPercent: 10, // Max of 5-10% range or 7.5% mid
    min_adj: 5,
    max_adj: 10,
    guidance: 'Suggest reviewing a 5–10% increase for the corresponding next-day session.',
    guidance_mr: 'पुढील दिवसाच्या संबंधित वेळेसाठी खाद्यात ५–१०% वाढ करण्याचा विचार सुचवला जातो.',
  },
  {
    id: 'cleared_15_30min',
    label: 'Feed finishes within 15–30 minutes',
    label_mr: '१५–३० मिनिटांत खाद्य संपले',
    interpretation: 'Appropriate feeding response',
    interpretation_mr: 'योग्य खाद्य प्रतिसाद',
    action: 'MAINTAIN',
    proposed_adjustment: 0,
    adjustmentPercent: 0,
    min_adj: 0,
    max_adj: 0,
    guidance: 'Appropriate feeding response. Maintain current ration.',
    guidance_mr: 'योग्य खाद्य प्रतिसाद. सध्याचे खाद्य प्रमाण कायम ठेवा.',
  },
  {
    id: 'remains_5_10pct_30min',
    label: '5–10% pellets remain after 30 minutes',
    label_mr: '३० मिनिटांनंतर ५–१०% गोळ्या शिल्लक',
    interpretation: 'Possible satiety or stress',
    interpretation_mr: 'माशांचे पोट भरलेले असणे किंवा ताण असण्याची शक्यता',
    action: 'SUGGEST_REDUCE_10_15',
    proposed_adjustment: -12.5,
    adjustmentPercent: -12.5,
    min_adj: -15,
    max_adj: -10,
    guidance: 'Suggest a 10–15% reduction for the corresponding next-day session.',
    guidance_mr: 'पुढील दिवसाच्या संबंधित वेळेसाठी खाद्यात १०–१५% कपात सुचवली जाते.',
  },
  {
    id: 'remains_over_20pct_30min',
    label: 'More than 20% remains after 30 minutes',
    label_mr: '३० मिनिटांनंतर २०% पेक्षा जास्त खाद्य शिल्लक',
    interpretation: 'Possible overfeeding or water-quality stress',
    interpretation_mr: 'जास्त खाद्य किंवा पाण्याच्या गुणवत्तेचा ताण असण्याची शक्यता',
    action: 'SUGGEST_REDUCE_30_50',
    proposed_adjustment: -40,
    adjustmentPercent: -40,
    min_adj: -50,
    max_adj: -30,
    guidance: 'Flag condition and propose a 30–50% reduction for the corresponding next-day session.',
    guidance_mr: 'परिस्थिती लक्षात घेऊन पुढील दिवसाच्या संबंधित वेळेसाठी ३०–५०% कपात प्रस्तावित करा.',
  },
  {
    id: 'fish_ignore_or_deep',
    label: 'Fish ignore pellets or remain unusually deep',
    label_mr: 'मासे खाद्याकडे दुर्लक्ष करतात किंवा असामान्यपणे तळाशी राहतात',
    interpretation: 'Possible oxygen, health or environmental problem',
    interpretation_mr: 'ऑक्सिजनची कमतरता, आरोग्य किंवा पर्यावरणाची समस्या असण्याची शक्यता',
    action: 'STOP_MEAL',
    proposed_adjustment: -100,
    adjustmentPercent: -100,
    guidance: 'Recommend stopping the meal and checking water quality; alert farmer to aeration where appropriate.',
    guidance_mr: 'सदर जेवण थांबवा आणि पाण्याची गुणवत्ता तपासा; आवश्यक असल्यास तात्काळ वायुवीजन (aeration) सुरू करा.',
  },
  {
    id: 'unclassified_floating',
    label: 'Unclassified observation (e.g. 10–15 min or 15–20% remaining)',
    label_mr: 'अवर्गीकृत निरीक्षण (उदा. १०–१५ मिनिटे किंवा १५–२०% शिल्लक)',
    interpretation: 'Observation falls in gap range; farmer review required',
    interpretation_mr: 'निरीक्षण श्रेणीबाहेर आहे; शेतकऱ्याने स्वतः पडताळणी करावी',
    action: 'FARMER_REVIEW',
    proposed_adjustment: 0,
    adjustmentPercent: 0,
    guidance: 'Observation falls in unclassified gap range. Request farmer review and retain current safe baseline pending confirmation.',
    guidance_mr: 'निरीक्षण अवर्गीकृत श्रेणीत येते. शेतकऱ्याने स्वतः परिस्थिती तपासावी आणि खात्री होईपर्यंत मूळ सुरक्षित प्रमाण कायम ठेवावे.',
  },
];

// ==============================================================================
// 2. SUBMERGED TRAY OR FEEDING-BAG OBSERVATION RULES (Rohu, Mrigal, Common Carp, Magur)
// User-provided proposed reference rules (checked after 2–3 hours).
// ==============================================================================
export const SUBMERGED_TRAY_OBSERVATIONS = [
  {
    id: 'none',
    label: 'No observation recorded yet',
    label_mr: 'अद्याप कोणतेही निरीक्षण नोंदवलेले नाही',
    interpretation: 'No observation available',
    interpretation_mr: 'निरीक्षण उपलब्ध नाही',
    action: 'NONE',
    proposed_adjustment: 0,
    adjustmentPercent: 0,
    guidance: 'No observation recorded. Maintain calculated baseline.',
    guidance_mr: 'कोणतेही निरीक्षण नाही. गणना केलेले मूळ प्रमाण कायम ठेवा.',
  },
  {
    id: 'tray_clean',
    label: 'Tray completely clean',
    label_mr: 'ट्रे पूर्णपणे स्वच्छ / खाद्य पूर्ण संपले',
    interpretation: 'High feeding activity',
    interpretation_mr: 'अतिशय चांगला खाद्य प्रतिसाद',
    action: 'SUGGEST_INCREASE_5_10',
    proposed_adjustment: 7.5,
    adjustmentPercent: 10, // Max of 5-10% range or 7.5% mid
    min_adj: 5,
    max_adj: 10,
    guidance: 'Suggest reviewing a 5–10% increase for the corresponding next-day session.',
    guidance_mr: 'पुढील दिवसाच्या संबंधित वेळेसाठी खाद्यात ५–१०% वाढ करण्याचा विचार सुचवला जातो.',
  },
  {
    id: 'tray_thin_layer_under_10pct',
    label: 'Thin layer or crumbs, less than 10% remaining',
    label_mr: 'बारीक थर किंवा तुकडे, १०% पेक्षा कमी शिल्लक',
    interpretation: 'Appropriate feeding',
    interpretation_mr: 'योग्य खाद्य प्रमाण',
    action: 'MAINTAIN',
    proposed_adjustment: 0,
    adjustmentPercent: 0,
    min_adj: 0,
    max_adj: 0,
    guidance: 'Appropriate feeding. Maintain current ration.',
    guidance_mr: 'योग्य खाद्य प्रमाण. सध्याचे प्रमाण कायम ठेवा.',
  },
  {
    id: 'tray_10_25pct_remaining',
    label: '10–25% feed remaining',
    label_mr: '१०–२५% खाद्य शिल्लक',
    interpretation: 'Possible overfeeding or temperature-related reduction in appetite',
    interpretation_mr: 'जास्त खाद्य किंवा तापमानामुळे भूक मंदावण्याची शक्यता',
    action: 'SUGGEST_REDUCE_20_30',
    proposed_adjustment: -25,
    adjustmentPercent: -25,
    min_adj: -30,
    max_adj: -20,
    guidance: 'Suggest a 20–30% reduction for the corresponding next-day session.',
    guidance_mr: 'पुढील दिवसाच्या संबंधित वेळेसाठी खाद्यात २०–३०% कपात सुचवली जाते.',
  },
  {
    id: 'tray_over_50pct_or_foul',
    label: 'More than 50% remaining or foul dough',
    label_mr: '५०% पेक्षा जास्त खाद्य शिल्लक किंवा खाद्य कुजलेले/घाण वास',
    interpretation: 'Possible water-quality or health problem',
    interpretation_mr: 'पाण्याची गुणवत्ता बिघडणे किंवा आरोग्याची समस्या',
    action: 'STOP_MEAL',
    proposed_adjustment: -100,
    adjustmentPercent: -100,
    guidance: 'Flag condition, advise removing old feed and assessing pond before next meal.',
    guidance_mr: 'परिस्थिती गंभीर; शिल्लक जुने खाद्य काढून टाका आणि पुढील जेवणापूर्वी तळ्याची पाहणी करा.',
  },
  {
    id: 'tray_unclassified_25_50pct',
    label: 'Unclassified range (25–50% remaining)',
    label_mr: 'अवर्गीकृत श्रेणी (२५–५०% शिल्लक)',
    interpretation: 'Unclassified observation; farmer review required',
    interpretation_mr: 'अवर्गीकृत निरीक्षण; शेतकऱ्याने स्वतः पडताळणी करावी',
    action: 'FARMER_REVIEW',
    proposed_adjustment: 0,
    adjustmentPercent: 0,
    guidance: 'Do not invent a rule for the unclassified 25–50% range. Review pond and appetite; retain safe baseline pending confirmation.',
    guidance_mr: '२५–५०% अवर्गीकृत श्रेणीसाठी कोणताही स्वयंचलित नियम लागू केलेला नाही. तळ्याची पाहणी करा आणि खात्री होईपर्यंत सुरक्षित प्रमाण ठेवा.',
  },
];

// ==============================================================================
// 3. GRASS CARP GREEN FODDER OBSERVATION RULES
// Green-fodder monitoring using floating frame/corral.
// ==============================================================================
export const GREEN_FODDER_OBSERVATIONS = [
  {
    id: 'none',
    label: 'No fodder observation recorded',
    label_mr: 'चाऱ्याचे निरीक्षण नोंदवलेले नाही',
    interpretation: 'No observation available',
    interpretation_mr: 'निरीक्षण उपलब्ध नाही',
    action: 'NONE',
    proposed_adjustment: 0,
    adjustmentPercent: 0,
    guidance: 'Continue normal fodder feeding.',
    guidance_mr: 'नेहमीप्रमाणे चारा देणे सुरू ठेवा.',
  },
  {
    id: 'fodder_cleared',
    label: 'Green fodder completely cleared (< 10 hours)',
    label_mr: 'हिरवा चारा पूर्णपणे संपला (< १० तास)',
    interpretation: 'High forage appetite; adequate consumption',
    interpretation_mr: 'चाऱ्याची भूक उत्तम; योग्य वापर',
    action: 'MAINTAIN_OR_INCREASE',
    proposed_adjustment: 0,
    adjustmentPercent: 0,
    guidance: 'Green fodder well consumed. Maintain or review providing fresh fodder as needed.',
    guidance_mr: 'हिरवा चारा चांगल्या प्रकारे खाल्ला गेला आहे. गरजेनुसार ताजा चारा उपलब्ध करा.',
  },
  {
    id: 'fodder_normal',
    label: 'Normal consumption, small leftover crumbs',
    label_mr: 'सामान्य वापर, थोडेफार उरलेले तुकडे',
    interpretation: 'Satisfactory consumption',
    interpretation_mr: 'समाधानकारक वापर',
    action: 'MAINTAIN',
    proposed_adjustment: 0,
    adjustmentPercent: 0,
    guidance: 'Normal fodder feeding response. Maintain current fodder ration.',
    guidance_mr: 'चारा खाण्याचा प्रतिसाद योग्य आहे. सध्याचे प्रमाण चालू ठेवा.',
  },
  {
    id: 'fodder_remains_over_12h',
    label: 'Green fodder remains after 12 hours',
    label_mr: '१२ तासांनंतरही हिरवा चारा शिल्लक आहे',
    interpretation: 'Possible satiety, poor water quality, or over-rationing',
    interpretation_mr: 'पोट भरलेले असणे, पाण्याची गुणवत्ता खराब असणे किंवा जास्त चारा दिलेला असणे',
    action: 'FLAG_DO_NOT_ADD_FRESH',
    proposed_adjustment: -100,
    adjustmentPercent: -100,
    isFlagged: true,
    guidance: 'Green fodder remains after 12 hours. Do not add fresh fodder until pond condition is reviewed. Remove decomposing fodder to preserve dissolved oxygen.',
    guidance_mr: '१२ तासांनंतरही चारा शिल्लक आहे. परिस्थितीची पाहणी करेपर्यंत नवीन ताजा चारा टाकू नका. विरघळलेला ऑक्सिजन टिकवण्यासाठी कुजणारा चारा पाण्यातून बाहेर काढा.',
  },
];

// ==============================================================================
// 4. VANNAMEI CHECK-TRAY RATE TABLE (By average shrimp body weight)
// Formula: Tray feed (g) = feed distributed in that session (kg) × tray rate (g/kg).
// ==============================================================================
export const VANNAMEI_CHECK_TRAY_RATES = [
  { min_weight: 1.5, max_weight: 4.0, rate_g_per_kg: 1.0, interval_str: '2 hours 30 minutes', interval_minutes: 150 },
  { min_weight: 5.0, max_weight: 8.0, rate_g_per_kg: 2.0, interval_str: '2 hours', interval_minutes: 120 },
  { min_weight: 9.0, max_weight: 13.0, rate_g_per_kg: 3.0, interval_str: '2 hours', interval_minutes: 120 },
  { min_weight: 14.0, max_weight: 22.0, rate_g_per_kg: 4.0, interval_str: '2 hours', interval_minutes: 120 },
  { min_weight: 23.0, max_weight: 33.0, rate_g_per_kg: 5.0, interval_str: '1 hour 30 minutes', interval_minutes: 90 },
];

export const VANNAMEI_INITIAL_RESPONSE_NOTE = {
  en: 'Observe shrimp initial feed response before 30 seconds after feed broadcasting (distinct from the 1.5–2.5h tray retrieval interval). Check-tray quantity is a monitoring sample and must NOT be added to pond daily feed as extra feed.',
  mr: 'खाद्य टाकल्यानंतर ३० सेकंदांच्या आत कोळंबीचा सुरुवातीचा प्रतिसाद तपासा (हे १.५–२.५ तासांच्या ट्रे काढण्याच्या वेळेपेक्षा वेगळे आहे). ट्रेमधील खाद्य हा केवळ नमुना आहे, तो तळ्याच्या दैनिक खाद्यात अतिरिक्त म्हणून जोडू नका.',
  toString() {
    return this.en;
  }
};

// Vannamei Faecal and Sand Indicators
export const VANNAMEI_FAECAL_INDICATORS = {
  length: [
    { id: 'short', label: 'Short faecal length', label_mr: 'लहान विष्ठा लांबी', interpretation: 'Proper feeding response', interpretation_mr: 'योग्य खाद्य प्रतिसाद' },
    { id: 'long', label: 'Full / long faeces', label_mr: 'लांब / पूर्ण विष्ठा', interpretation: 'Possible overfeeding', interpretation_mr: 'जास्त खाद्य असण्याची शक्यता' },
  ],
  colour: [
    { id: 'feed_coloured', label: 'Feed-coloured faeces', label_mr: 'खाद्याच्या रंगाची विष्ठा', interpretation: 'Proper feeding response', interpretation_mr: 'योग्य खाद्य प्रतिसाद' },
    { id: 'dark', label: 'Black / dark-brown faeces', label_mr: 'काळी / गडद तपकिरी विष्ठा', interpretation: 'Possible underfeeding (natural forage/detritus ingestion)', interpretation_mr: 'कमी खाद्य असण्याची शक्यता (तळातील गाळ/नैसर्गिक घटक खाणे)' },
  ],
  sand: [
    { id: 'none', label: 'No sand or stones', label_mr: 'वाळू किंवा खडे नाहीत', interpretation: 'Normal tray condition', interpretation_mr: 'सामान्य स्थिती' },
    { id: 'present', label: 'Sand or small stones in tray', label_mr: 'ट्रेमध्ये वाळू किंवा लहान खडे आढळले', interpretation: 'Possible underfeeding indicator (shrimp actively foraging bottom sediment)', interpretation_mr: 'कमी खाद्याचे संभाव्य लक्षण (कोळंबी तळातील वाळू/गाळात अन्न शोधत आहे)' },
  ],
};

// ==============================================================================
// 5. FEEDING SESSIONS DEFINITIONS
// Strict session-wise mapping: Each session only learns from the same session previous day.
// ==============================================================================
export const DEFAULT_SESSIONS = [
  { id: 'morning', label: 'Morning session', label_mr: 'सकाळचे सत्र', default_time: '08:00 AM', default_percent: 50 },
  { id: 'evening', label: 'Evening session', label_mr: 'संध्याकाळचे सत्र', default_time: '05:00 PM', default_percent: 50 },
];

export const VANNAMEI_SESSIONS = [
  { id: '7_am', label: 'Session 1: 7:00 AM (Morning)', label_mr: 'सत्र १: सकाळी ७:०० (सकाळ)', time: '7:00 AM', default_percent: 25 },
  { id: '11_am', label: 'Session 2: 11:00 AM (Late morning)', label_mr: 'सत्र २: सकाळी ११:०० (दुपारपूर्व)', time: '11:00 AM', default_percent: 25 },
  { id: '4_pm', label: 'Session 3: 4:00 PM (Afternoon)', label_mr: 'सत्र ३: दुपारी ४:०० (दुपार)', time: '4:00 PM', default_percent: 25 },
  { id: '8_pm', label: 'Session 4: 8:00 PM (Evening/Night)', label_mr: 'सत्र ४: रात्री ८:०० (रात्र)', time: '8:00 PM', default_percent: 25 },
];

export const TILAPIA_EXTENDED_SESSIONS = [
  { id: 'session_1', label: 'Meal 1 (Early Morning - 8:00 AM)', label_mr: 'जेवण १ (सकाळी ८:००)', default_percent: 25 },
  { id: 'session_2', label: 'Meal 2 (Midday - 11:30 AM)', label_mr: 'जेवण २ (दुपारी ११:३०)', default_percent: 25 },
  { id: 'session_3', label: 'Meal 3 (Afternoon - 2:30 PM)', label_mr: 'जेवण ३ (दुपारी २:३०)', default_percent: 25 },
  { id: 'session_4', label: 'Meal 4 (Evening - 5:30 PM)', label_mr: 'जेवण ४ (संध्याकाळी ५:३०)', default_percent: 25 },
];

// ==============================================================================
// 6. ENVIRONMENTAL OVERRIDES REFERENCE RULES
// Safety precedence hierarchy: Critical distress > Species-specific > General > Base.
// ==============================================================================
export const ENVIRONMENTAL_CONFIG = {
  // Dissolved Oxygen (mg/L)
  DO: {
    CRITICAL_THRESHOLD: 3.0,
    STRESS_MAX: 5.0,
    MAGUR_LOW_THRESHOLD: 2.0,
  },
  // Temperature (°C)
  TEMP: {
    EXTREME_HIGH: 32.0,
    OPTIMAL_MIN: 26.0,
    OPTIMAL_MAX: 31.0,
    MILD_LOW_MIN: 20.0,
    MILD_LOW_MAX: 25.0,
    MODERATE_LOW_MIN: 15.0,
    MODERATE_LOW_MAX: 20.0,
    CRITICAL_COLD: 14.0,
  },
  // Warmest hours feeding note
  WARMEST_HOURS_GUIDANCE: {
    en: 'Water temperature is 15–20°C: Feeding response is severely reduced. Restrict feeding to 50–75% reduction and feed only during the warmest hours of the day (typically 12:00 PM – 2:00 PM).',
    mr: 'पाण्याचे तापमान १५–२०°C आहे: भूक खूप मंदावते. खाद्यात ५०–७५% कपात करा आणि केवळ दिवसाच्या सर्वात उबदार वेळेतच (दुपारी १२:०० ते २:०० दरम्यान) खाद्य द्या.',
  },
};


