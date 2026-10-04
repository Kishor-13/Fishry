import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calculator, 
  Fish, 
  Scale, 
  Sun, 
  Moon, 
  IndianRupee, 
  Info, 
  AlertTriangle, 
  CheckCircle2, 
  Save, 
  RotateCcw,
  Sparkles,
  HelpCircle,
  Clock,
  Layers,
  Waves,
  Home,
  ArrowRight,
  X,
  ChevronRight,
  BookOpen,
  Calendar,
  AlertCircle,
  Sliders
} from 'lucide-react';
import { 
  SPECIES_LIST, 
  CULTURE_STAGES, 
  IMC_NURSERY_REFERENCE, 
  IMC_REARING_PERIODS, 
  IMC_GROWOUT_PHASES 
} from '../constants/speciesData';
import { calculateFeed } from '../services/calculationService';
import { formatDisplayNumber } from '../lib/ruleEngine';
import { translations } from '../lib/translations';

export default function FeedCalculator({
  lang,
  rulesList,
  ponds = [],
  initialPondId = null,
  onSaveRecord,
  onNavigateToDashboard,
  onNavigateToHistory,
  onNavigateToPonds,
}) {
  const t = translations[lang] || translations.en;

  // Farmer Observation Inputs
  const [selectedPondId, setSelectedPondId] = useState(initialPondId || '');
  const [selectedSpeciesId, setSelectedSpeciesId] = useState('rohu');
  const [cultureStage, setCultureStage] = useState('Rearing');
  const [rearingPeriod, setRearingPeriod] = useState('month_1');
  const [growoutPhase, setGrowoutPhase] = useState('initial');
  const [stocked, setStocked] = useState('');
  const [survivalPercent, setSurvivalPercent] = useState('85');
  const [averageWeight, setAverageWeight] = useState('');
  const [feedPrice, setFeedPrice] = useState('40');
  const [cultureMonth, setCultureMonth] = useState('1');
  const [manualRate, setManualRate] = useState('');

  // UI state
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedModalInfo, setSavedModalInfo] = useState(null);

  // If initialPondId changes, auto-load that pond
  useEffect(() => {
    if (initialPondId && ponds && ponds.length > 0) {
      handlePondSelect(initialPondId);
    }
  }, [initialPondId, ponds]);

  // Find species object
  const currentSpeciesObj = useMemo(() => {
    return SPECIES_LIST.find((s) => s.id === selectedSpeciesId) || SPECIES_LIST[0];
  }, [selectedSpeciesId]);

  const isIMC = currentSpeciesObj.category === 'IMC';
  const isNursery = cultureStage === 'Nursery';
  const isIMCNursery = isIMC && isNursery;
  const isIMCRearing = isIMC && cultureStage === 'Rearing';
  const isIMCGrowout = isIMC && cultureStage === 'Grow-out';
  const isMagur = currentSpeciesObj.id === 'magur';
  const isGrassCarp = currentSpeciesObj.id === 'grass_carp';
  const isCustomSpecies = currentSpeciesObj.id === 'custom';

  // Handle Pond Selection
  const handlePondSelect = (pondId) => {
    setSelectedPondId(pondId);
    setIsSaved(false);

    if (!pondId) return;

    const p = ponds.find((item) => String(item.id) === String(pondId));
    if (p) {
      const matchedSpecies = SPECIES_LIST.find(
        (s) => s.name.toLowerCase() === (p.species || '').toLowerCase() || s.id === (p.species || '').toLowerCase()
      );
      if (matchedSpecies) {
        setSelectedSpeciesId(matchedSpecies.id);
      } else if (p.species) {
        setSelectedSpeciesId('custom');
      }

      if (p.culture_stage) setCultureStage(p.culture_stage);
      if (p.stocking_count) setStocked(String(p.stocking_count));
      if (p.survival_percent) setSurvivalPercent(String(p.survival_percent));
      if (p.average_weight_g) setAverageWeight(String(p.average_weight_g));
    }
  };

  // Handle Species Change
  const handleSpeciesChange = (newSpeciesId) => {
    setSelectedSpeciesId(newSpeciesId);
    setIsSaved(false);

    const newObj = SPECIES_LIST.find((s) => s.id === newSpeciesId);
    if (!newObj?.isCustom && newObj?.id !== 'magur' && newObj?.id !== 'grass_carp') {
      if (cultureStage === 'Nursery' && newObj?.category === 'IMC') {
        // Keep or set empty for nursery manual input
        setManualRate('');
      } else {
        setManualRate('');
      }
    } else {
      setManualRate('');
    }
  };

  // Handle Culture Stage Change
  const handleStageChange = (newStage) => {
    setCultureStage(newStage);
    setIsSaved(false);
    if (newStage === 'Nursery' && isIMC) {
      setAverageWeight('');
      setManualRate('');
    } else if (newStage === 'Rearing' && isIMC) {
      setRearingPeriod('month_1');
      setManualRate('9');
    } else if (newStage === 'Grow-out' && isIMC) {
      setGrowoutPhase('initial');
      setManualRate('5.5');
    } else {
      setManualRate('');
    }
  };

  // Real-time calculation hook
  const calculationResult = useMemo(() => {
    return calculateFeed({
      species: currentSpeciesObj.name,
      isCustom: isCustomSpecies,
      cultureStage,
      rearingPeriod,
      growoutPhase,
      stocked,
      survivalPercent,
      averageWeight: isIMCNursery ? null : averageWeight,
      feedPrice,
      cultureMonth: currentSpeciesObj.needsMonth ? cultureMonth : null,
      manualRate,
      rulesList,
    });
  }, [
    currentSpeciesObj,
    isCustomSpecies,
    cultureStage,
    rearingPeriod,
    growoutPhase,
    stocked,
    survivalPercent,
    averageWeight,
    isIMCNursery,
    feedPrice,
    cultureMonth,
    manualRate,
    rulesList,
  ]);

  // Reset saved toast when inputs change
  useEffect(() => {
    setIsSaved(false);
  }, [
    selectedSpeciesId,
    cultureStage,
    rearingPeriod,
    growoutPhase,
    stocked,
    survivalPercent,
    averageWeight,
    feedPrice,
    cultureMonth,
    manualRate,
  ]);

  // Quick Preset Sample Loaders
  const loadRohuRearingPreset = () => {
    setSelectedPondId('');
    setSelectedSpeciesId('rohu');
    setCultureStage('Rearing');
    setRearingPeriod('month_2'); // 6–8% range, 7% working rate
    setStocked('10000');
    setSurvivalPercent('85');
    setAverageWeight('50');
    setFeedPrice('40');
    setManualRate('7');
  };

  const loadImcNurseryPreset = () => {
    setSelectedPondId('');
    setSelectedSpeciesId('rohu');
    setCultureStage('Nursery');
    setStocked('1200000');
    setSurvivalPercent('100');
    setAverageWeight('');
    setFeedPrice('40');
    setManualRate('400'); // First 5 days (400%)
  };

  const loadCustomPreset = () => {
    setSelectedPondId('');
    setSelectedSpeciesId('custom');
    setCultureStage('Grow-out');
    setStocked('5000');
    setSurvivalPercent('90');
    setAverageWeight('100');
    setFeedPrice('40');
    setManualRate('3');
  };

  const handleReset = () => {
    setSelectedPondId('');
    setSelectedSpeciesId('rohu');
    setCultureStage('Rearing');
    setRearingPeriod('month_1');
    setGrowoutPhase('initial');
    setStocked('');
    setSurvivalPercent('85');
    setAverageWeight('');
    setFeedPrice('40');
    setCultureMonth('1');
    setManualRate('');
    setIsSaved(false);
  };

  const handleSave = async () => {
    if (!calculationResult.isValid || isSaving) return;

    const selectedPondObj = ponds.find((p) => String(p.id) === String(selectedPondId));

    setIsSaving(true);
    try {
      await onSaveRecord({
        species: currentSpeciesObj.name,
        scientific_name: currentSpeciesObj.scientific_name,
        culture_stage: cultureStage,
        culture_month: currentSpeciesObj.needsMonth ? Number(cultureMonth) : null,
        stocked: Number(stocked),
        survival_percent: Number(survivalPercent),
        average_weight: Number(averageWeight || 0),
        surviving_fish: calculationResult.survivingFish,
        feeding_rate: calculationResult.feedingRate,
        feeding_method: calculationResult.selectedRule?.feeding_method || calculationResult.feedingMethod || 'BIOMASS_PERCENT',
        rate_source: calculationResult.rateSource,
        rule_explanation: calculationResult.ruleExplanation,
        rule_explanation_mr: calculationResult.ruleExplanation_mr,
        biomass: calculationResult.biomass,
        daily_feed: calculationResult.dailyFeed,
        morning_feed: calculationResult.morningFeed,
        evening_feed: calculationResult.eveningFeed,
        feed_price: Number(feedPrice) || 0,
        feed_cost: calculationResult.dailyFeedCost,
        rule_id: calculationResult.selectedRule?.id || null,
        pond_id: selectedPondId || null,
        pond_name: selectedPondObj ? selectedPondObj.name : '',
      });
      setIsSaved(true);
      setSavedModalInfo({
        pondName: selectedPondObj ? selectedPondObj.name : currentSpeciesObj.name,
        dailyFeed: calculationResult.dailyFeed,
        morningFeed: calculationResult.morningFeed,
        eveningFeed: calculationResult.eveningFeed,
        dailyCost: calculationResult.dailyFeedCost,
        species: currentSpeciesObj.name,
      });
      setTimeout(() => setIsSaved(false), 4000);
    } catch (err) {
      console.error('Error saving record:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Helper for Feeding Mode Badge
  const renderFeedingModeBadge = (mode, isDark = false) => {
    if (mode === 'AUTOMATIC') {
      return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-all ${
          isDark 
            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40 shadow-xs' 
            : 'bg-emerald-50 text-emerald-800 border-emerald-300'
        }`}>
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>🟢 {t.calculator.modeAutomatic || (lang === 'mr' ? 'स्वयंचलित' : 'Automatic')}</span>
        </span>
      );
    }
    if (mode === 'REFERENCE_ASSUMPTION') {
      return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-all ${
          isDark 
            ? 'bg-sky-500/20 text-sky-200 border-sky-400/40 shadow-xs' 
            : 'bg-sky-50 text-sky-800 border-sky-300'
        }`}>
          <span className="w-2 h-2 rounded-full bg-sky-400" />
          <span>🔵 {t.calculator.modeReference || (lang === 'mr' ? 'संदर्भ / गृहीतक' : 'Reference / Assumption')}</span>
        </span>
      );
    }
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-all ${
        isDark 
          ? 'bg-amber-500/20 text-amber-200 border-amber-400/40 shadow-xs' 
          : 'bg-amber-50 text-amber-900 border-amber-300'
      }`}>
        <span className="w-2 h-2 rounded-full bg-amber-500" />
        <span>🟠 {t.calculator.modeManual || (lang === 'mr' ? 'मॅन्युअल' : 'Manual')}</span>
      </span>
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-2.5 sm:px-6 py-3 sm:py-6 space-y-4 sm:space-y-6 pb-28 lg:pb-6">
      
      {/* Header & Quick Preset Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Calculator className="w-6 h-6 text-teal-600" />
            <span>{t.calculator.title}</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            {t.tagline}
          </p>
        </div>

        {/* Quick Preload Test Buttons */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto flex-wrap">
          <span className="text-[11px] font-semibold text-slate-400">
            {lang === 'mr' ? 'उदाहरणे:' : 'Examples:'}
          </span>
          <button
            onClick={loadRohuRearingPreset}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 transition-colors"
            title="Load Section 28 Rohu Rearing Example (8,500 fish, 425kg biomass, 29.75kg feed)"
          >
            {lang === 'mr' ? 'रोहू रिअरिंग (Sec 28)' : 'Rohu (Sec 28)'}
          </button>
          <button
            onClick={loadImcNurseryPreset}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 transition-colors"
            title="Load Section 2 IMC Nursery Example (1.2M spawn, 1.8kg initial biomass, 7.2kg feed)"
          >
            {lang === 'mr' ? 'नर्सरी (Sec 2)' : 'Nursery (Sec 2)'}
          </button>
          <button
            onClick={loadCustomPreset}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition-colors"
            title="Load Section 29 Custom Species Example (3% manual rate)"
          >
            {lang === 'mr' ? 'इतर/सानुकूल (Sec 29)' : 'Custom (Sec 29)'}
          </button>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: FARMER OBSERVATION INPUTS */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-card space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Fish className="w-5 h-5 text-teal-600" />
              <span>{lang === 'mr' ? 'शेतकऱ्याची निरीक्षणे' : 'Pond Observations'}</span>
            </h3>
            <button
              onClick={handleReset}
              className="text-xs font-medium text-slate-400 hover:text-slate-700 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{t.calculator.resetBtn}</span>
            </button>
          </div>

          <div className="space-y-4 text-left">
            
            {/* Optional: Select From Saved Ponds */}
            {ponds && ponds.length > 0 && (
              <div className="p-3.5 bg-gradient-to-r from-sky-50 to-teal-50/70 border border-sky-200 rounded-2xl space-y-1.5 shadow-xs">
                <div className="flex items-center justify-between">
                  <label htmlFor="pondSelect" className="block text-xs font-extrabold text-sky-950 flex items-center gap-1.5">
                    <Waves className="w-4 h-4 text-sky-600" />
                    <span>{lang === 'mr' ? 'नोंदवलेले तळे निवडा (माहिती आपोआप भरा)' : 'Select Saved Pond (Auto-fill)'}</span>
                  </label>
                  {selectedPondId && (
                    <button
                      type="button"
                      onClick={() => handleReset()}
                      className="text-[11px] text-sky-700 font-bold hover:underline cursor-pointer"
                    >
                      {lang === 'mr' ? 'तळे रद्द करा' : 'Clear Pond'}
                    </button>
                  )}
                </div>
                <select
                  id="pondSelect"
                  value={selectedPondId}
                  onChange={(e) => handlePondSelect(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl bg-white border border-sky-300 text-slate-900 font-bold text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-xs cursor-pointer"
                >
                  <option value="">
                    {lang === 'mr' ? '-- तळे निवडा किंवा खाली स्वतः भरा --' : '-- Choose a Pond or Enter Observations Below --'}
                  </option>
                  {ponds.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.species || 'Fish'} • {formatDisplayNumber(p.stocking_count, 0)} {lang === 'mr' ? 'मासे' : 'fish'} • {p.average_weight_g || 0}g)
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* 1. Fish Species Dropdown */}
            <div>
              <label htmlFor="speciesSelect" className="block text-xs sm:text-sm font-bold text-slate-800 mb-1.5">
                {t.calculator.speciesLabel} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  id="speciesSelect"
                  name="speciesSelect"
                  value={selectedSpeciesId}
                  onChange={(e) => handleSpeciesChange(e.target.value)}
                  className="w-full h-12 px-3.5 pr-8 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-semibold text-sm sm:text-base focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all cursor-pointer shadow-xs"
                >
                  {SPECIES_LIST.map((sp) => (
                    <option key={sp.id} value={sp.id}>
                      {lang === 'mr' ? sp.name_mr : sp.name}
                      {sp.scientific_name ? ` (${sp.scientific_name})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              {currentSpeciesObj.scientific_name && (
                <p className="text-[11px] text-teal-800/80 font-medium italic mt-1 ml-0.5">
                  {currentSpeciesObj.scientific_name}
                </p>
              )}
            </div>

            {/* 2. Culture Stage Dropdown */}
            <div>
              <label htmlFor="cultureStageSelect" className="block text-xs sm:text-sm font-bold text-slate-800 mb-1.5">
                {t.calculator.cultureStageLabel} <span className="text-red-500">*</span>
              </label>
              <select
                id="cultureStageSelect"
                name="cultureStageSelect"
                value={cultureStage}
                onChange={(e) => handleStageChange(e.target.value)}
                className="w-full h-12 px-3.5 pr-8 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-semibold text-sm sm:text-base focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all cursor-pointer shadow-xs"
              >
                {CULTURE_STAGES.map((st) => (
                  <option key={st.id} value={st.id}>
                    {lang === 'mr' ? st.name_mr : st.name}
                  </option>
                ))}
              </select>
            </div>

            {/* SPECIFIC SUB-STAGE / PERIOD CONTROLS */}

            {/* IMC REARING PERIOD SELECTOR (Section 3) */}
            {isIMCRearing && (
              <div className="p-3.5 bg-sky-50/80 border border-sky-200 rounded-2xl space-y-2 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-sky-950 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-sky-600" />
                    <span>{t.calculator.rearingPeriodLabel || (lang === 'mr' ? 'रिअरिंग कालावधी' : 'Rearing Period')} <span className="text-red-500">*</span></span>
                  </label>
                  <span className="text-[11px] font-bold text-sky-700 bg-white px-2 py-0.5 rounded-md border border-sky-200">
                    {lang === 'mr' ? 'संदर्भ श्रेणी' : 'Reference Range'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {IMC_REARING_PERIODS.map((period) => (
                    <button
                      key={period.id}
                      type="button"
                      onClick={() => {
                        setRearingPeriod(period.id);
                        setManualRate(String(period.default_rate));
                      }}
                      className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                        rearingPeriod === period.id
                          ? 'bg-sky-600 text-white border-sky-700 shadow-xs'
                          : 'bg-white text-slate-800 border-sky-200 hover:bg-sky-100/60'
                      }`}
                    >
                      <span className="block text-xs font-extrabold truncate">
                        {lang === 'mr' ? period.label_mr : period.label}
                      </span>
                      <span className={`block text-[11px] font-semibold mt-0.5 ${
                        rearingPeriod === period.id ? 'text-sky-100' : 'text-sky-700 font-bold'
                      }`}>
                        {period.rate_min}–{period.rate_max}% BW
                      </span>
                    </button>
                  ))}
                </div>

                <p className="text-[11px] text-sky-800 leading-snug">
                  {lang === 'mr' 
                    ? '⚠️ संदर्भ खाद्य श्रेणी: दर्शविलेला दर संदर्भासाठी आहे. प्रत्यक्ष खाद्य माशांची वाढ व पाण्याच्या गुणवत्तेनुसार निवडा.'
                    : '⚠️ Reference feeding range: Adjust rate according to fish growth, water quality, and appetite.'}
                </p>
              </div>
            )}

            {/* IMC GROW-OUT PHASE SELECTOR (Section 4) */}
            {isIMCGrowout && (
              <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-2xl space-y-2 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-emerald-600" />
                    <span>{t.calculator.growoutPhaseLabel || (lang === 'mr' ? 'ग्रो-आऊट टप्पा / स्थिती' : 'Grow-out Stage / Phase')} <span className="text-red-500">*</span></span>
                  </label>
                  <span className="text-[11px] font-bold text-emerald-700 bg-white px-2 py-0.5 rounded-md border border-emerald-200">
                    {lang === 'mr' ? 'संदर्भ श्रेणी' : 'Reference Range'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {IMC_GROWOUT_PHASES.map((phase) => (
                    <button
                      key={phase.id}
                      type="button"
                      onClick={() => {
                        setGrowoutPhase(phase.id);
                        setManualRate(String(phase.default_rate));
                      }}
                      className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                        growoutPhase === phase.id
                          ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                          : 'bg-white text-slate-800 border-emerald-200 hover:bg-emerald-100/60'
                      }`}
                    >
                      <span className="block text-xs font-extrabold truncate">
                        {lang === 'mr' ? phase.label_mr : phase.label}
                      </span>
                      <span className={`block text-[11px] font-semibold mt-0.5 ${
                        growoutPhase === phase.id ? 'text-emerald-100' : 'text-emerald-700 font-bold'
                      }`}>
                        {phase.rate_min}–{phase.rate_max}% BW
                      </span>
                    </button>
                  ))}
                </div>

                <p className="text-[11px] text-emerald-800 leading-snug">
                  {lang === 'mr' 
                    ? '⚠️ संदर्भ खाद्य श्रेणी: दर्शविलेला दर संदर्भासाठी सुरुवातीची श्रेणी आहे. खाद्य प्रतिसाद तपासा.'
                    : '⚠️ Reference feeding range: Monitor feeding response and adjust according to culture conditions.'}
                </p>
              </div>
            )}

            {/* PANGASIUS CULTURE PERIOD / MONTH (Section 7) */}
            {currentSpeciesObj.needsMonth && (
              <div className="p-3.5 bg-sky-50/70 border border-sky-200 rounded-2xl space-y-1.5 animate-fadeIn">
                <label className="block text-xs sm:text-sm font-bold text-sky-950 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-sky-600" />
                  <span>{t.calculator.cultureMonthLabel} <span className="text-red-500">*</span></span>
                </label>
                <div className="grid grid-cols-3 gap-2 pt-1">
                  {[
                    { val: '1', label: lang === 'mr' ? '१-२ महिने (५%)' : 'M 1–2 (5%)' },
                    { val: '3', label: lang === 'mr' ? '३-५ महिने (३%)' : 'M 3–5 (3%)' },
                    { val: '6', label: lang === 'mr' ? '६+ महिने (२%)' : 'M 6+ (2%)' },
                  ].map((btn) => (
                    <button
                      key={btn.val}
                      type="button"
                      onClick={() => setCultureMonth(btn.val)}
                      className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        (cultureMonth === btn.val || (btn.val === '1' && Number(cultureMonth) <= 2) || (btn.val === '3' && Number(cultureMonth) >= 3 && Number(cultureMonth) <= 5) || (btn.val === '6' && Number(cultureMonth) >= 6))
                          ? 'bg-sky-600 text-white border-sky-700 shadow-sm'
                          : 'bg-white text-sky-900 border-sky-200 hover:bg-sky-100'
                      }`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-sky-700 font-medium">
                  {t.calculator.cultureMonthHelp}
                </p>
              </div>
            )}

            {/* 3. Number Stocked (Or Initial Spawn for IMC Nursery) */}
            <div>
              <label htmlFor="stockedInput" className="block text-xs sm:text-sm font-bold text-slate-800 mb-1.5">
                {isIMCNursery 
                  ? (t.calculator.nurserySpawnLabel || (lang === 'mr' ? 'साठवणूक केलेल्या स्पॉनची संख्या' : 'Number of Spawn Stocked'))
                  : t.calculator.stockedLabel} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="stockedInput"
                  name="stockedInput"
                  type="number"
                  inputMode="numeric"
                  value={stocked}
                  onChange={(e) => setStocked(e.target.value)}
                  placeholder={isIMCNursery ? '1200000' : t.calculator.stockedPlaceholder}
                  min="1"
                  step="1"
                  className="w-full h-12 px-3.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-bold text-base sm:text-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all shadow-xs"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 uppercase pointer-events-none">
                  {isIMCNursery ? (lang === 'mr' ? 'स्पॉन' : 'spawn') : (lang === 'mr' ? 'नग' : 'fish')}
                </span>
              </div>

              {/* Quick Stock Chips */}
              <div className="flex items-center gap-1.5 pt-1.5 flex-wrap">
                {(isIMCNursery ? ['500000', '1000000', '1200000', '2000000'] : ['2000', '5000', '10000', '20000']).map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setStocked(val)}
                    className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                      stocked === val
                        ? 'bg-teal-600 text-white border-teal-700 shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                    }`}
                  >
                    {Number(val).toLocaleString()}
                  </button>
                ))}
              </div>

              <p className="text-[11px] text-slate-500 mt-1 ml-0.5">
                {isIMCNursery 
                  ? (lang === 'mr' ? 'सुरुवातीचा बायोमास: १० लाख स्पॉन = १.५ किलो (प्रकल्प गृहीतक)' : 'Initial biomass calculation: 1 million spawn = 1.5 kg (project assumption)')
                  : t.calculator.stockedHelp}
              </p>
            </div>

            {/* 4. Survival % & 5. Average Weight (2-col grid) */}
            {isIMCNursery ? (
              /* IMC Nursery: Average spawn weight is practically difficult to measure; NOT required! (Section 2 & 13) */
              <div className="p-3.5 bg-amber-50/70 border border-amber-300/80 rounded-2xl space-y-1.5 animate-fadeIn">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-amber-700 shrink-0" />
                  <span className="text-xs font-extrabold text-amber-950">
                    {lang === 'mr' ? 'स्पॉन वजन: आवश्यक नाही' : 'Spawn Weight: Not Required'}
                  </span>
                </div>
                <p className="text-xs text-amber-900 leading-relaxed">
                  {lang === 'mr' 
                    ? 'स्पॉन अत्यंत लहान असल्याने नर्सरी टप्प्यावर सरासरी वजन मोजणे कठीण असते. Fishry यासाठी सरासरी वजन विचारत नाही.'
                    : 'Spawn are extremely small; accurate average spawn weight is difficult/inconvenient to measure. Average weight input is not required for this stage.'}
                </p>
                <div className="pt-1 text-[11px] text-amber-950 font-semibold border-t border-amber-200">
                  <span>{lang === 'mr' ? 'प्रकल्प गृहीतक:' : 'Project Assumption:'} </span>
                  <span className="font-bold underline">1,000,000 spawn = 1.5 kg initial biomass</span>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Survival % */}
                <div>
                  <label htmlFor="survivalPercentInput" className="block text-xs sm:text-sm font-bold text-slate-800 mb-1.5">
                    {t.calculator.survivalLabel} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="survivalPercentInput"
                      name="survivalPercentInput"
                      type="number"
                      inputMode="decimal"
                      value={survivalPercent}
                      onChange={(e) => setSurvivalPercent(e.target.value)}
                      placeholder={t.calculator.survivalPlaceholder}
                      min="1"
                      max="100"
                      step="0.5"
                      className="w-full h-12 px-3.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-bold text-base sm:text-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all shadow-xs"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm font-extrabold text-slate-400 pointer-events-none">
                      %
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 pt-1.5 flex-wrap">
                    {['75', '80', '85', '90', '95'].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setSurvivalPercent(val)}
                        className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                          survivalPercent === val
                            ? 'bg-teal-600 text-white border-teal-700 shadow-xs'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                        }`}
                      >
                        {val}%
                      </button>
                    ))}
                  </div>
                </div>

                {/* Average Fish Weight (g) */}
                <div>
                  <label htmlFor="averageWeightInput" className="block text-xs sm:text-sm font-bold text-slate-800 mb-1.5">
                    {t.calculator.weightLabel} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="averageWeightInput"
                      name="averageWeightInput"
                      type="number"
                      inputMode="decimal"
                      value={averageWeight}
                      onChange={(e) => setAverageWeight(e.target.value)}
                      placeholder={t.calculator.weightPlaceholder}
                      min="0.1"
                      step="0.1"
                      className="w-full h-12 px-3.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-bold text-base sm:text-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all shadow-xs"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 uppercase pointer-events-none">
                      {lang === 'mr' ? 'ग्रॅम' : 'g'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 pt-1.5 flex-wrap">
                    {['10', '25', '50', '100', '250', '500'].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setAverageWeight(val)}
                        className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                          averageWeight === val
                            ? 'bg-teal-600 text-white border-teal-700 shadow-xs'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                        }`}
                      >
                        {val}g
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 6. Feed Price per kg (₹/kg) */}
            <div>
              <label htmlFor="feedPriceInput" className="block text-xs sm:text-sm font-bold text-slate-800 mb-1.5">
                {t.calculator.feedPriceLabel}
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold pointer-events-none">
                  ₹
                </div>
                <input
                  id="feedPriceInput"
                  name="feedPriceInput"
                  type="number"
                  inputMode="decimal"
                  value={feedPrice}
                  onChange={(e) => setFeedPrice(e.target.value)}
                  placeholder={t.calculator.feedPricePlaceholder}
                  min="0"
                  step="0.5"
                  className="w-full h-12 pl-8 pr-12 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-bold text-base sm:text-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all shadow-xs"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 pointer-events-none">
                  /kg
                </span>
              </div>
              <div className="flex items-center gap-1.5 pt-1.5 flex-wrap">
                {['35', '40', '42.5', '45', '50'].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setFeedPrice(val)}
                    className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                      feedPrice === val
                        ? 'bg-teal-600 text-white border-teal-700 shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                    }`}
                  >
                    ₹{val}
                  </button>
                ))}
              </div>
            </div>

            {/* FEEDING RATE UI SECTION */}

            {/* A. IMC NURSERY MANUAL RATE SELECTION (Section 2) */}
            {isIMCNursery && (
              <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50/50 border-2 border-amber-400 rounded-2xl space-y-3 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
                    <span className="text-xs font-black text-amber-950 uppercase tracking-wider">
                      {lang === 'mr' ? 'खाद्य दर: [ मॅन्युअल निवड ]' : 'Feeding Rate: [ MANUAL SELECTION ]'}
                    </span>
                  </div>
                  {renderFeedingModeBadge('MANUAL')}
                </div>

                {/* Reference Nursery Basis Display */}
                <div className="bg-white/80 border border-amber-200 rounded-xl p-3 space-y-1.5 text-xs text-amber-950">
                  <span className="font-extrabold text-amber-900 block flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5 text-amber-700" />
                    <span>{t.calculator.nurseryRefTitle || (lang === 'mr' ? 'नर्सरी संदर्भ खाद्य आधार' : 'Reference Nursery Feeding Basis')}</span>
                  </span>
                  <div className="grid grid-cols-2 gap-2 pt-1 font-medium">
                    <div className="bg-amber-100/60 p-2 rounded-lg">
                      <span className="block text-[11px] text-amber-800">{lang === 'mr' ? 'पहिले ५ दिवस:' : 'First 5 days:'}</span>
                      <span className="font-bold text-sm text-amber-950">400%</span>
                      <span className="block text-[10px] text-amber-700">{lang === 'mr' ? 'सुरुवातीच्या बायोमासच्या' : 'of initial biomass'}</span>
                    </div>
                    <div className="bg-amber-100/60 p-2 rounded-lg">
                      <span className="block text-[11px] text-amber-800">{lang === 'mr' ? '५ दिवसांनंतर:' : 'After first 5 days:'}</span>
                      <span className="font-bold text-sm text-amber-950">800%</span>
                      <span className="block text-[10px] text-amber-700">{lang === 'mr' ? 'सुरुवातीच्या बायोमासच्या' : 'of initial biomass'}</span>
                    </div>
                  </div>
                </div>

                {/* Quick Selection Chips for Reference Rates */}
                <div>
                  <span className="block text-[11px] font-bold text-amber-900 mb-1.5">
                    {lang === 'mr' ? 'त्वरित संदर्भ दर निवडा किंवा खाली स्वतः भरा:' : 'Quick reference selection or enter manual rate below:'}
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setManualRate('400')}
                      className={`py-2 px-2.5 rounded-xl font-bold text-xs border transition-all cursor-pointer ${
                        manualRate === '400'
                          ? 'bg-amber-600 text-white border-amber-700 shadow-sm'
                          : 'bg-white hover:bg-amber-100/80 text-amber-900 border-amber-300'
                      }`}
                    >
                      {t.calculator.nurseryQuick400 || (lang === 'mr' ? 'पहिले ५ दिवस (४००%)' : 'First 5 days (400%)')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setManualRate('800')}
                      className={`py-2 px-2.5 rounded-xl font-bold text-xs border transition-all cursor-pointer ${
                        manualRate === '800'
                          ? 'bg-amber-600 text-white border-amber-700 shadow-sm'
                          : 'bg-white hover:bg-amber-100/80 text-amber-900 border-amber-300'
                      }`}
                    >
                      {t.calculator.nurseryQuick800 || (lang === 'mr' ? '५ दिवसांनंतर (८००%)' : 'After 5 days (800%)')}
                    </button>
                  </div>
                </div>

                {/* Manual Rate Input */}
                <div>
                  <label htmlFor="manualRateInput" className="block text-xs font-extrabold text-amber-950 mb-1">
                    {lang === 'mr' ? 'निवडलेला / स्वतः भरलेला खाद्य दर (%)' : 'Selected / Manual Feeding Rate (%)'} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="manualRateInput"
                      name="manualRateInput"
                      type="number"
                      inputMode="decimal"
                      value={manualRate}
                      onChange={(e) => setManualRate(e.target.value)}
                      placeholder="e.g. 400"
                      min="1"
                      step="1"
                      className="w-full h-12 px-3.5 rounded-xl bg-white border-2 border-amber-400 text-amber-950 font-black text-lg focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-xs"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-base font-extrabold text-amber-700 pointer-events-none">
                      %
                    </span>
                  </div>
                </div>

                {/* Section 2 Contextual Warning */}
                <div className="p-3 bg-amber-100/80 border border-amber-300 rounded-xl space-y-1 text-xs text-amber-950">
                  <div className="flex items-center gap-1.5 font-bold text-amber-900">
                    <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>{t.calculator.imcNurseryWarningTitle || (lang === 'mr' ? 'मॅन्युअल खाद्य दर आवश्यक' : 'Manual Feeding Selection Required')}</span>
                  </div>
                  <p className="leading-relaxed text-[11px] text-amber-900/90">
                    {lang === 'mr'
                      ? 'स्पॉनचे सरासरी वजन अचूक मोजणे कठीण असल्याने प्रमाणित पद्धत वापरा आणि खाद्य प्रतिसाद व परिस्थितीनुसार दर समायोजित करा.'
                      : 'Spawn average weight is difficult to measure accurately at this stage. Use a verified feeding protocol and adjust according to feeding response and culture conditions.'}
                  </p>
                </div>
              </div>
            )}

            {/* B. MAGUR MANUAL RATE UI (Section 8) */}
            {isMagur && (
              <div className="p-4 bg-amber-50 border-2 border-amber-400 rounded-2xl space-y-3 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span className="text-xs font-black text-amber-950 uppercase tracking-wider">
                      {lang === 'mr' ? 'खाद्य मोड: मॅन्युअल' : 'FEEDING MODE: MANUAL'}
                    </span>
                  </div>
                  {renderFeedingModeBadge('MANUAL')}
                </div>

                <div className="text-xs text-amber-950 bg-white/80 p-3 rounded-xl border border-amber-200 space-y-1">
                  <span className="font-bold block text-amber-900">
                    ⚠️ {t.calculator.magurWarningTitle || 'MANUAL FEEDING REQUIRED'}
                  </span>
                  <p className="leading-relaxed text-[11px] text-amber-900/90">
                    {lang === 'mr' 
                      ? 'मागूरसाठी कोणताही सार्वत्रिक स्वयंचलित खाद्य दर लागू केलेला नाही. प्रमाणित संवर्धन/खाद्य पद्धतीनुसार स्वतः योग्य दर भरा.'
                      : 'No universal automatic feeding rate is applied for Magur. Enter/select a feeding rate according to your verified culture/feed protocol.'}
                  </p>
                </div>

                <div>
                  <label htmlFor="manualRateInput" className="block text-xs font-extrabold text-amber-950 mb-1">
                    {t.calculator.manualRateLabel} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="manualRateInput"
                      name="manualRateInput"
                      type="number"
                      inputMode="decimal"
                      value={manualRate}
                      onChange={(e) => setManualRate(e.target.value)}
                      placeholder="e.g. 5.0"
                      min="0.1"
                      step="0.1"
                      className="w-full h-12 px-3.5 rounded-xl bg-white border-2 border-amber-400 text-amber-950 font-black text-lg focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-xs"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-base font-extrabold text-amber-700 pointer-events-none">
                      %
                    </span>
                  </div>
                  {/* Quick Suggestions for Magur */}
                  <div className="flex items-center gap-1.5 pt-1.5">
                    <span className="text-[11px] text-amber-800 font-semibold">{lang === 'mr' ? 'उदा.' : 'e.g.'}:</span>
                    {['3.0', '4.0', '5.0', '6.0'].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setManualRate(val)}
                        className={`px-2 py-0.5 rounded-md text-[11px] font-bold border transition-all cursor-pointer ${
                          manualRate === val ? 'bg-amber-600 text-white border-amber-700' : 'bg-white text-amber-900 border-amber-300'
                        }`}
                      >
                        {val}%
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* C. GRASS CARP SPECIAL METHOD / MANUAL UI (Section 9) */}
            {isGrassCarp && (
              <div className="p-4 bg-emerald-50 border-2 border-emerald-400 rounded-2xl space-y-3 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-emerald-700" />
                    <span className="text-xs font-black text-emerald-950 uppercase tracking-wider">
                      {lang === 'mr' ? 'खाद्य मोड: विशेष / मॅन्युअल' : 'FEEDING MODE: MANUAL / SPECIAL METHOD'}
                    </span>
                  </div>
                  {renderFeedingModeBadge('MANUAL')}
                </div>

                <div className="text-xs text-emerald-950 bg-white/80 p-3 rounded-xl border border-emerald-200 space-y-1">
                  <span className="font-bold block text-emerald-900">
                    ⚠️ {t.calculator.grassCarpWarningTitle || 'SPECIAL FEEDING METHOD'}
                  </span>
                  <p className="leading-relaxed text-[11px] text-emerald-900/90">
                    {lang === 'mr'
                      ? 'ग्रास कार्पचे खाद्य वनस्पती/चाऱ्याची उपलब्धता, माशांचा आकार व परिस्थितीवर अवलंबून असते. Fishry स्वयंचलित गोळी खाद्य दर लागू करत नाही.'
                      : 'Grass Carp feeding depends on forage/vegetation availability, fish size, culture conditions and feeding response. Fishry does not apply a universal automatic pellet feeding rate.'}
                  </p>
                </div>

                <div>
                  <label htmlFor="manualRateInput" className="block text-xs font-extrabold text-emerald-950 mb-1">
                    {lang === 'mr' ? 'पूरक गोळी खाद्य दर (%)' : 'Supplementary Pellet Feed Rate (%)'} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="manualRateInput"
                      name="manualRateInput"
                      type="number"
                      inputMode="decimal"
                      value={manualRate}
                      onChange={(e) => setManualRate(e.target.value)}
                      placeholder="e.g. 2.5"
                      min="0.1"
                      step="0.1"
                      className="w-full h-12 px-3.5 rounded-xl bg-white border-2 border-emerald-400 text-emerald-950 font-black text-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-base font-extrabold text-emerald-700 pointer-events-none">
                      %
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 pt-1.5">
                    <span className="text-[11px] text-emerald-800 font-semibold">{lang === 'mr' ? 'उदा.' : 'e.g.'}:</span>
                    {['1.5', '2.0', '2.5', '3.0'].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setManualRate(val)}
                        className={`px-2 py-0.5 rounded-md text-[11px] font-bold border transition-all cursor-pointer ${
                          manualRate === val ? 'bg-emerald-600 text-white border-emerald-700' : 'bg-white text-emerald-900 border-emerald-300'
                        }`}
                      >
                        {val}%
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* D. OTHER / CUSTOM SPECIES MANUAL RATE (Section 10) */}
            {isCustomSpecies && (
              <div className="p-4 bg-amber-50 border-2 border-amber-400 rounded-2xl space-y-3 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
                    <label htmlFor="manualRateInput" className="block text-xs font-black text-amber-950 uppercase tracking-wider">
                      {t.calculator.manualRateLabel} <span className="text-red-500">*</span>
                    </label>
                  </div>
                  {renderFeedingModeBadge('MANUAL')}
                </div>

                <div className="text-xs text-amber-950 bg-white/80 p-3 rounded-xl border border-amber-200 space-y-1">
                  <span className="font-bold block text-amber-900">
                    ⚠️ {t.calculator.customWarningTitle || 'MANUAL RATE REQUIRED'}
                  </span>
                  <p className="leading-relaxed text-[11px] text-amber-900/90">
                    {lang === 'mr'
                      ? 'या माशाच्या जातीसाठी Fishry कडे पूर्व-निर्धारित खाद्य नियम उपलब्ध नाही. प्रमाणित संवर्धन/खाद्य पद्धतीनुसार स्वतः दर भरा.'
                      : 'Fishry does not have a predefined feeding rule for this species. Enter a feeding rate based on a verified culture/feed protocol.'}
                  </p>
                </div>

                <div className="relative">
                  <input
                    id="manualRateInput"
                    name="manualRateInput"
                    type="number"
                    inputMode="decimal"
                    value={manualRate}
                    onChange={(e) => setManualRate(e.target.value)}
                    placeholder={t.calculator.manualRatePlaceholder}
                    min="0.1"
                    step="0.1"
                    className="w-full h-12 px-3.5 rounded-xl bg-white border-2 border-amber-400 text-amber-950 font-black text-lg focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-xs"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-base font-extrabold text-amber-700 pointer-events-none">
                    %
                  </span>
                </div>
              </div>
            )}

            {/* E. IMC REARING & GROWOUT RATE ADJUSTMENT */}
            {(isIMCRearing || isIMCGrowout) && (
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700">
                    {lang === 'mr' ? 'खाद्य दर समायोजन (पर्यायी)' : 'Rate Selection / Adjustment (Optional)'}
                  </span>
                  <span className="font-semibold text-slate-500">
                    {lang === 'mr' ? 'लागू श्रेणी:' : 'Range:'} {calculationResult.applicableRange?.min}–{calculationResult.applicableRange?.max}%
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    inputMode="decimal"
                    value={manualRate}
                    onChange={(e) => setManualRate(e.target.value)}
                    placeholder={`e.g. ${calculationResult.feedingRate || 5.0}`}
                    min="0.1"
                    step="0.1"
                    className="w-full h-11 px-3.5 rounded-xl bg-white border border-slate-300 text-slate-900 font-bold text-base focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-xs"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm font-extrabold text-slate-400 pointer-events-none">
                    %
                  </span>
                </div>
                {/* Range boundary chips */}
                {calculationResult.applicableRange && (
                  <div className="flex items-center gap-1.5 pt-1">
                    <span className="text-[11px] text-slate-500 font-medium">{lang === 'mr' ? 'श्रेणी दर:' : 'Range presets:'}</span>
                    {[
                      calculationResult.applicableRange.min,
                      Number(((calculationResult.applicableRange.min + calculationResult.applicableRange.max) / 2).toFixed(1)),
                      calculationResult.applicableRange.max,
                    ].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setManualRate(String(val))}
                        className={`px-2 py-0.5 rounded-md text-[11px] font-bold border transition-all cursor-pointer ${
                          String(manualRate) === String(val)
                            ? 'bg-teal-600 text-white border-teal-700'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        {val}%
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>

        {/* RIGHT COLUMN: CALCULATED RESULTS & TRANSPARENCY */}
        <div className="lg:col-span-6 space-y-4">
          
          {/* Main Calculation Card */}
          <div className="bg-gradient-to-br from-teal-900 via-teal-800 to-emerald-950 rounded-3xl p-5 sm:p-7 text-white shadow-card-hover border border-teal-700/50 relative overflow-hidden">
            
            {/* Background Glow */}
            <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 w-56 h-56 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Card Header & Feeding Mode Badge */}
            <div className="flex items-center justify-between gap-2 border-b border-teal-700/60 pb-3.5 mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-300" />
                <span className="text-sm sm:text-base font-bold text-white tracking-wide">
                  {t.calculator.resultsTitle}
                </span>
              </div>
              {renderFeedingModeBadge(calculationResult.feedingMode, true)}
            </div>

            {/* Incomplete Form or Missing Manual Rate */}
            {calculationResult.isIncomplete ? (
              <div className="py-10 px-4 text-center space-y-3">
                <Info className="w-10 h-10 text-teal-300/60 mx-auto" />
                <p className="text-sm font-semibold text-teal-100 max-w-sm mx-auto leading-relaxed">
                  {lang === 'mr' ? calculationResult.message_mr || calculationResult.message : calculationResult.message || t.calculator.incompleteForm}
                </p>
                {isIMCNursery && (
                  <div className="p-3 bg-white/10 rounded-xl max-w-xs mx-auto text-xs text-teal-200">
                    <span className="font-bold block text-white">{lang === 'mr' ? 'बायोमास विचार:' : 'Biomass Consideration:'}</span>
                    <span>{lang === 'mr' ? '१० लाख स्पॉन = १.५ किलो' : '1 million spawn = 1.5 kg initial biomass'}</span>
                  </div>
                )}
              </div>
            ) : (
              /* PRIMARY SUCCESS VIEW */
              <div className="space-y-4">
                
                {/* 1. Daily Feed Requirement */}
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/15 shadow-inner">
                  <div className="flex items-center justify-between text-xs text-teal-200 font-semibold mb-1">
                    <span>{t.calculator.dailyFeed}</span>
                    <span className="bg-amber-400 text-slate-950 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                      {t.calculator.perDay}
                    </span>
                  </div>
                  <div className="text-3xl sm:text-4xl font-black text-amber-300 tracking-tight flex items-baseline gap-2">
                    <span>{formatDisplayNumber(calculationResult.dailyFeed, 2)}</span>
                    <span className="text-base sm:text-lg font-bold text-white">kg / day</span>
                  </div>
                  
                  {/* Daily Feed Cost */}
                  {calculationResult.feedPriceNum > 0 && (
                    <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between text-xs sm:text-sm">
                      <span className="text-teal-200">{t.calculator.dailyFeedCost}:</span>
                      <span className="font-extrabold text-emerald-300 text-base sm:text-lg">
                        ₹{formatDisplayNumber(calculationResult.dailyFeedCost, 0)} {t.calculator.perDay}
                      </span>
                    </div>
                  )}
                </div>

                {/* 2. Morning / Evening 50-50 Split Cards */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Morning Feed */}
                  <div className="bg-white/5 rounded-2xl p-3 sm:p-4 border border-white/10">
                    <div className="flex items-center gap-1.5 text-xs text-amber-200 font-semibold mb-1">
                      <Sun className="w-4 h-4 text-amber-300" />
                      <span>{t.calculator.morningFeed}</span>
                    </div>
                    <div className="text-xl sm:text-2xl font-bold text-white">
                      {formatDisplayNumber(calculationResult.morningFeed, 2)} <span className="text-xs font-normal text-teal-200">kg</span>
                    </div>
                    <span className="text-[10px] text-teal-300">7:00 – 8:00 AM</span>
                  </div>

                  {/* Evening Feed */}
                  <div className="bg-white/5 rounded-2xl p-3 sm:p-4 border border-white/10">
                    <div className="flex items-center gap-1.5 text-xs text-sky-200 font-semibold mb-1">
                      <Moon className="w-4 h-4 text-sky-300" />
                      <span>{t.calculator.eveningFeed}</span>
                    </div>
                    <div className="text-xl sm:text-2xl font-bold text-white">
                      {formatDisplayNumber(calculationResult.eveningFeed, 2)} <span className="text-xs font-normal text-teal-200">kg</span>
                    </div>
                    <span className="text-[10px] text-teal-300">4:00 – 5:00 PM</span>
                  </div>
                </div>

                {/* 3. Biomass & Rate Summary Bar */}
                <div className="grid grid-cols-3 gap-2 bg-black/20 rounded-2xl p-3 border border-white/10 text-center">
                  <div>
                    <span className="text-[10px] text-teal-300 block uppercase font-medium">
                      {isIMCNursery ? (lang === 'mr' ? 'स्पॉन संख्या' : 'Spawn Count') : t.calculator.survivingFish}
                    </span>
                    <span className="text-sm sm:text-base font-extrabold text-white">
                      {formatDisplayNumber(calculationResult.survivingFish, 0)}
                    </span>
                    <span className="text-[10px] text-teal-400 block">{isIMCNursery ? (lang === 'mr' ? 'स्पॉन' : 'spawn') : t.calculator.fishCount}</span>
                  </div>

                  <div className="border-x border-white/10">
                    <span className="text-[10px] text-teal-300 block uppercase font-medium">
                      {isIMCNursery ? (lang === 'mr' ? 'सुरुवातीचा बायोमास' : 'Initial Biomass') : t.calculator.averageBiomass}
                    </span>
                    <span className="text-sm sm:text-base font-extrabold text-white">
                      {formatDisplayNumber(calculationResult.biomass, 2)}
                    </span>
                    <span className="text-[10px] text-teal-400 block">kg</span>
                  </div>

                  <div>
                    <span className="text-[10px] text-teal-300 block uppercase font-medium">
                      {t.calculator.feedingRate}
                    </span>
                    <span className="text-sm sm:text-base font-extrabold text-amber-300">
                      {formatDisplayNumber(calculationResult.feedingRate, 2)}%
                    </span>
                    <span className="text-[10px] text-teal-400 block truncate">
                      {calculationResult.feedingMode === 'AUTOMATIC' ? 'auto' : calculationResult.feedingMode === 'REFERENCE_ASSUMPTION' ? 'ref' : 'manual'}
                    </span>
                  </div>
                </div>

              </div>
            )}

          </div>

          {/* SECTION 13: TRANSPARENCY OF BIOMASS CALCULATION */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-teal-600" />
                <span>{t.calculator.biomassConsideration || (lang === 'mr' ? 'बायोमास विचार व आधार' : 'Biomass Consideration')}</span>
              </span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                {calculationResult.biomassBasis === 'PROJECT_ASSUMPTION' 
                  ? (lang === 'mr' ? 'प्रकल्प गृहीतक' : 'Project Assumption') 
                  : (lang === 'mr' ? 'सर्व्हायव्हल व वजन' : 'Survival & Weight')}
              </span>
            </div>

            {calculationResult.biomassBasis === 'PROJECT_ASSUMPTION' ? (
              <div className="text-xs text-slate-700 space-y-2 pt-1">
                <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl space-y-1">
                  <p className="font-extrabold text-teal-950 text-sm">
                    {lang === 'mr' ? 'प्रकल्प गृहीतक — १० लाख स्पॉन = १.५ किलो' : 'Project assumption — 1 million spawn = 1.5 kg'}
                  </p>
                  <p className="text-slate-600">
                    {lang === 'mr' ? 'नर्सरी टप्प्यावर सुरुवातीचा बायोमास स्पॉनच्या संख्येवरून मोजला जातो.' : 'Initial biomass at nursery stage is calculated directly from spawn count.'}
                  </p>
                  <div className="pt-1.5 font-mono text-[11px] text-teal-900 font-bold border-t border-teal-200/70">
                    {lang === 'mr' ? calculationResult.biomassFormulaStr_mr : calculationResult.biomassFormulaStr}
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 italic">
                  {lang === 'mr' 
                    ? '* १.५ किलो हे मूल्य प्रकल्प संदर्भ गृहीतक आहे, सार्वत्रिक वैज्ञानिक स्थिर मूल्य नाही.'
                    : '* 1.5 kg is a stated project assumption, not labeled as a universal scientific constant.'}
                </p>
              </div>
            ) : (
              <div className="text-xs text-slate-700 space-y-1.5 pt-1">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                    <span className="text-slate-500 block text-[11px]">{lang === 'mr' ? 'जिवंत मासे:' : 'Surviving Fish:'}</span>
                    <span className="font-bold text-slate-900">
                      {formatDisplayNumber(calculationResult.survivingFish, 0)} {lang === 'mr' ? 'मासे' : 'fish'}
                    </span>
                    <span className="block text-[10px] text-slate-400 mt-0.5">
                      {stocked || 0} × {survivalPercent || 0}% ÷ 100
                    </span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                    <span className="text-slate-500 block text-[11px]">{lang === 'mr' ? 'एकूण बायोमास:' : 'Total Biomass:'}</span>
                    <span className="font-bold text-teal-900">
                      {formatDisplayNumber(calculationResult.biomass, 2)} kg
                    </span>
                    <span className="block text-[10px] text-slate-400 mt-0.5">
                      {formatDisplayNumber(calculationResult.survivingFish, 0)} × {averageWeight || 0}g ÷ 1,000
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 11 & 16: WHY THE RATE WAS SELECTED & FEEDING MODE */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-teal-600" />
                <span>{t.calculator.whyRuleSelected}</span>
              </span>
              {renderFeedingModeBadge(calculationResult.feedingMode)}
            </div>

            <div className="text-xs text-slate-700 space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">{lang === 'mr' ? 'खाद्य पद्धत / मोड:' : 'Feeding Mode:'}</span>
                <span className="font-extrabold text-slate-900">
                  {calculationResult.feedingMode === 'AUTOMATIC' 
                    ? (lang === 'mr' ? 'स्वयंचलित (Automatic)' : 'Automatic')
                    : calculationResult.feedingMode === 'REFERENCE_ASSUMPTION'
                    ? (lang === 'mr' ? 'संदर्भ / गृहीतक (Reference / Assumption)' : 'Reference / Assumption')
                    : (lang === 'mr' ? 'मॅन्युअल (Manual)' : 'Manual')}
                </span>
              </div>

              {calculationResult.applicableRange && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">{lang === 'mr' ? 'लागू संदर्भ श्रेणी:' : 'Applicable Reference Range:'}</span>
                  <span className="font-bold text-sky-800 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200">
                    {calculationResult.applicableRange.min}–{calculationResult.applicableRange.max}% BW/day
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">{t.calculator.selectedWorkingValue}:</span>
                <span className="font-black text-teal-800 text-sm">
                  {calculationResult.feedingRate !== null ? `${calculationResult.feedingRate}%` : '—'}
                </span>
              </div>

              {calculationResult.ruleExplanation && (
                <div className="pt-1 border-t border-slate-100">
                  <span className="text-slate-500 block text-[11px] mb-0.5">
                    {lang === 'mr' ? 'तपशीलवार आधार:' : 'Basis / Explanation:'}
                  </span>
                  <p className="font-bold text-slate-900 leading-snug">
                    {lang === 'mr' ? calculationResult.ruleExplanation_mr : calculationResult.ruleExplanation}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* SECTION 12: CONTEXTUAL WARNING SYSTEM */}
          {calculationResult.warningText && (
            <div className="bg-amber-50/90 border border-amber-300 rounded-2xl p-4 text-xs space-y-1.5 shadow-xs animate-fadeIn">
              <div className="flex items-center gap-1.5 font-extrabold text-amber-950">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  {calculationResult.warningType === 'IMC_NURSERY' ? (t.calculator.imcNurseryWarningTitle || 'MANUAL FEEDING REQUIRED')
                    : calculationResult.warningType === 'IMC_REARING' ? (t.calculator.imcRearingWarningTitle || 'REFERENCE FEEDING RANGE')
                    : calculationResult.warningType === 'IMC_GROWOUT' ? (t.calculator.imcGrowoutWarningTitle || 'REFERENCE FEEDING RANGE')
                    : calculationResult.warningType === 'MAGUR' ? (t.calculator.magurWarningTitle || 'MANUAL FEEDING REQUIRED')
                    : calculationResult.warningType === 'GRASS_CARP' ? (t.calculator.grassCarpWarningTitle || 'SPECIAL FEEDING METHOD')
                    : (t.calculator.customWarningTitle || 'MANUAL RATE REQUIRED')}
                </span>
              </div>
              <p className="leading-relaxed text-amber-900/90 whitespace-pre-line text-[11px]">
                {lang === 'mr' ? calculationResult.warningText_mr : calculationResult.warningText}
              </p>
            </div>
          )}

          {/* Action: Save Calculation to Feed History */}
          <div className="flex flex-col gap-2 pt-1">
            <button
              onClick={handleSave}
              disabled={!calculationResult.isValid || isSaving}
              className={`w-full py-4 px-6 rounded-2xl font-bold text-base flex items-center justify-center gap-2.5 shadow-md transition-all duration-150 cursor-pointer ${
                calculationResult.isValid && !isSaving
                  ? 'bg-teal-600 hover:bg-teal-700 text-white shadow-teal-700/20 active:scale-98'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
              }`}
            >
              {isSaving ? (
                <span>{t.calculator.saving}</span>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>{t.calculator.saveToHistory}</span>
                </>
              )}
            </button>

            {/* Saved Success Notification */}
            {isSaved && (
              <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 text-xs font-bold flex items-center gap-2 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{t.calculator.savedSuccess}</span>
              </div>
            )}
          </div>

          {/* SECTION 12: GENERAL FEEDING WARNING (ALWAYS DISPLAYED AFTER FEED CALCULATION) */}
          {calculationResult.isValid && (
            <div className="bg-sky-50/90 border border-sky-200 rounded-2xl p-4 text-sky-950 text-xs space-y-1.5 shadow-xs animate-fadeIn">
              <div className="flex items-center gap-1.5 font-bold text-sky-900">
                <AlertCircle className="w-4 h-4 text-sky-600 shrink-0" />
                <span>⚠️ {t.calculator.generalWarningTitle || 'IMPORTANT: Practical Feeding Adjustment'}</span>
              </div>
              <p className="leading-relaxed text-sky-900/90 text-[11px]">
                {lang === 'mr' ? calculationResult.generalWarning_mr : calculationResult.generalWarning}
              </p>
            </div>
          )}

        </div>

      </div>

      {/* MOBILE STICKY FLOATING SUMMARY BAR */}
      {calculationResult.isValid && (
        <div className="lg:hidden fixed bottom-[57px] left-0 right-0 z-30 px-3 py-2 bg-gradient-to-r from-teal-950 via-teal-900 to-emerald-950 text-white shadow-2xl border-t border-teal-500/40 backdrop-blur-md animate-slideUp">
          <div className="max-w-md mx-auto flex items-center justify-between gap-2.5">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] uppercase font-bold text-teal-300 tracking-wider shrink-0">
                  {lang === 'mr' ? 'दैनिक खाद्य:' : 'Daily:'}
                </span>
                <span className="text-base font-extrabold text-amber-300 truncate">
                  {formatDisplayNumber(calculationResult.dailyFeed, 2)} kg
                </span>
              </div>
              <p className="text-[10px] text-teal-200/80 truncate">
                {calculationResult.dailyFeedCost > 0 ? `₹${formatDisplayNumber(calculationResult.dailyFeedCost, 0)}/दिवस • ` : ''}
                {calculationResult.feedingRate}% दर • {formatDisplayNumber(calculationResult.biomass, 2)} kg बायोमास
              </p>
            </div>

            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-950/30 shrink-0 transition-all cursor-pointer"
            >
              {isSaving ? (
                <span>{t.calculator.saving}</span>
              ) : isSaved ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>{lang === 'mr' ? 'जतन केले!' : 'Saved!'}</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>{lang === 'mr' ? 'नोंद जतन करा' : 'Save'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* POST-CALCULATION SUCCESS & NEXT STEPS MODAL */}
      {savedModalInfo && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-extrabold text-slate-900">
                {lang === 'mr' ? 'दैनिक नोंद यशस्वीरित्या जतन झाली!' : 'Daily Feed Logged Successfully!'}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {savedModalInfo.pondName} • {savedModalInfo.species}
              </p>
            </div>

            {/* Quick Numbers Card */}
            <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-3.5 space-y-2 text-left">
              <div className="flex items-center justify-between">
                <span className="text-xs text-emerald-800 font-bold">{lang === 'mr' ? 'आजचे एकूण खाद्य:' : "Today's Total Feed:"}</span>
                <span className="text-base font-extrabold text-emerald-950">{formatDisplayNumber(savedModalInfo.dailyFeed, 2)} kg</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-emerald-200/60">
                <div>
                  <span className="text-slate-500 block">{lang === 'mr' ? 'सकाळ (५०%):' : 'Morning (50%):'}</span>
                  <span className="font-bold text-slate-800">{formatDisplayNumber(savedModalInfo.morningFeed, 2)} kg</span>
                </div>
                <div>
                  <span className="text-slate-500 block">{lang === 'mr' ? 'संध्याकाळ (५०%):' : 'Evening (50%):'}</span>
                  <span className="font-bold text-slate-800">{formatDisplayNumber(savedModalInfo.eveningFeed, 2)} kg</span>
                </div>
              </div>
              {savedModalInfo.dailyCost > 0 && (
                <div className="flex items-center justify-between pt-1 text-xs text-emerald-900 font-extrabold">
                  <span>{lang === 'mr' ? 'अंदाजित खर्च:' : 'Estimated Cost:'}</span>
                  <span>₹{formatDisplayNumber(savedModalInfo.dailyCost, 0)}</span>
                </div>
              )}
            </div>

            {/* Navigation Choices */}
            <div className="pt-2 space-y-2">
              <button
                type="button"
                onClick={() => {
                  setSavedModalInfo(null);
                  if (onNavigateToDashboard) onNavigateToDashboard();
                }}
                className="w-full py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-98 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
              >
                <Home className="w-4 h-4" />
                <span>{lang === 'mr' ? 'डॅशबोर्डवर जा (आजची स्थिती पहा)' : 'Go to Dashboard (View Today)'}</span>
                <ArrowRight className="w-4 h-4 ml-auto" />
              </button>

              {ponds && ponds.length > 1 && (
                <button
                  type="button"
                  onClick={() => {
                    setSavedModalInfo(null);
                    handleReset();
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 font-bold text-xs flex items-center justify-center gap-2 border border-sky-200 transition-all cursor-pointer"
                >
                  <Waves className="w-4 h-4" />
                  <span>{lang === 'mr' ? 'दुसऱ्या तळ्याची गणना करा' : 'Calculate for Another Pond'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setSavedModalInfo(null);
                  if (onNavigateToHistory) onNavigateToHistory();
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span>{lang === 'mr' ? 'खाद्य इतिहास पहा' : 'View Feed History'}</span>
              </button>

              <button
                type="button"
                onClick={() => setSavedModalInfo(null)}
                className="py-1 text-[11px] text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {lang === 'mr' ? 'येथेच राहा (कॅल्क्युलेटर)' : 'Stay on Calculator'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
