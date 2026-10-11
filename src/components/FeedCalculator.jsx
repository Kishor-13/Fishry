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
  Sliders,
  CheckSquare,
  Square,
  ClipboardCheck,
  ArrowDownRight,
  ArrowUpRight,
  Minus,
  Check
} from 'lucide-react';
import { 
  SPECIES_LIST, 
  CULTURE_STAGES, 
  IMC_NURSERY_REFERENCE, 
  IMC_REARING_PERIODS, 
  IMC_GROWOUT_PHASES,
  VANNAMEI_FEEDING_SCHEDULE,
  FEEDING_TRAY_OBSERVATIONS,
  VANNAMEI_CRITICAL_CONDITIONS,
  FRESHWATER_PRAWN_STAGES
} from '../constants/speciesData';
import { calculateFeed } from '../services/calculationService';
import { calculateFeedDifference } from '../utils/calculations';
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

  // Feature 1 (Vannamei) & Feature 2 (Freshwater Prawn) Inputs
  const [cultureAge, setCultureAge] = useState('30');
  const [feedType, setFeedType] = useState('pellet');
  const [trayObservation, setTrayObservation] = useState('none');
  const [criticalConditions, setCriticalConditions] = useState([]);

  // Feature 3: Feed Accountability State
  const [confirmedFeed, setConfirmedFeed] = useState('');
  const [isConfirmedManuallySet, setIsConfirmedManuallySet] = useState(false);
  const [actualFeed, setActualFeed] = useState('');
  const [differenceReason, setDifferenceReason] = useState('');

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
  const isVannamei = currentSpeciesObj.id === 'vannamei';
  const isFreshwaterPrawn = currentSpeciesObj.id === 'freshwater_prawn';

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
    setIsConfirmedManuallySet(false);
    setConfirmedFeed('');
    setActualFeed('');
    setDifferenceReason('');
    setTrayObservation('none');
    setCriticalConditions([]);

    const newObj = SPECIES_LIST.find((s) => s.id === newSpeciesId);
    if (newObj?.id === 'vannamei') {
      setCultureStage('Grow-out');
      setCultureAge('30');
      setAverageWeight('3.1');
      setFeedPrice('65');
      setManualRate('');
    } else if (newObj?.id === 'freshwater_prawn') {
      setCultureStage('Grow-out');
      setFeedType('pellet');
      setAverageWeight('25');
      setFeedPrice('55');
      setManualRate('3.5');
    } else if (!newObj?.isCustom && newObj?.id !== 'magur' && newObj?.id !== 'grass_carp') {
      if (cultureStage === 'Nursery' && newObj?.category === 'IMC') {
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
    setIsConfirmedManuallySet(false);
    setConfirmedFeed('');
    if (newStage === 'Nursery' && isIMC) {
      setAverageWeight('');
      setManualRate('');
    } else if (newStage === 'Rearing' && isIMC) {
      setRearingPeriod('month_1');
      setManualRate('9');
    } else if (newStage === 'Grow-out' && isIMC) {
      setGrowoutPhase('initial');
      setManualRate('5.5');
    } else if (isFreshwaterPrawn) {
      if (newStage === 'Hatchery (Larvae)') {
        setManualRate('');
      } else if (newStage === 'Nursery (PL/Juveniles)') {
        setManualRate('15');
      } else if (newStage === 'Broodstock') {
        setManualRate('2.0');
      } else {
        setManualRate('3.5');
      }
    } else {
      setManualRate('');
    }
  };

  // Handle Vannamei Culture Age Change
  const handleCultureAgeChange = (val) => {
    setCultureAge(val);
    const ageNum = Number(val);
    if (!isNaN(ageNum) && ageNum >= 1 && ageNum <= 120) {
      const scheduleItem = VANNAMEI_FEEDING_SCHEDULE.find((s) => ageNum >= s.min_day && ageNum <= s.max_day);
      if (scheduleItem && !scheduleItem.is_range && scheduleItem.ref_weight) {
        if (!averageWeight || averageWeight === '0.2' || averageWeight === '0.7' || averageWeight === '3.1' || averageWeight === '14.5') {
          setAverageWeight(String(scheduleItem.ref_weight));
        }
      }
    }
  };

  // Toggle Critical Condition
  const toggleCriticalCondition = (conditionId) => {
    setCriticalConditions((prev) => 
      prev.includes(conditionId) 
        ? prev.filter((id) => id !== conditionId)
        : [...prev, conditionId]
    );
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
      cultureAge: isVannamei ? cultureAge : null,
      feedType,
      trayObservation,
      criticalConditions,
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
    isVannamei,
    cultureAge,
    feedType,
    trayObservation,
    criticalConditions,
  ]);

  // Keep Confirmed Feeding Quantity synchronized if farmer hasn't manually overridden it
  useEffect(() => {
    if (!isConfirmedManuallySet && calculationResult.isValid) {
      const recommendedVal = calculationResult.proposedAdjustment?.proposedFeed !== undefined
        ? calculationResult.proposedAdjustment.proposedFeed
        : calculationResult.dailyFeed;
      setConfirmedFeed(String(recommendedVal));
    }
  }, [calculationResult, isConfirmedManuallySet]);

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
    cultureAge,
    trayObservation,
    criticalConditions,
  ]);

  // Live Feed Difference Calculation (Feature 3)
  const feedAccountability = useMemo(() => {
    const calculatedFeedKg = calculationResult.calculatedFeed || calculationResult.dailyFeed || 0;
    const actualFeedKg = actualFeed !== '' && !isNaN(Number(actualFeed)) && Number(actualFeed) >= 0
      ? Number(actualFeed)
      : null;
    const price = Number(feedPrice) || 0;

    if (actualFeedKg === null) {
      return {
        hasActual: false,
        actualFeedKg: null,
        calculatedFeedKg,
        differenceKg: null,
        differencePercent: null,
        actualFeedCost: null,
      };
    }

    const diff = calculateFeedDifference(actualFeedKg, calculatedFeedKg, price);
    return {
      hasActual: true,
      actualFeedKg,
      calculatedFeedKg,
      ...diff,
    };
  }, [calculationResult, actualFeed, feedPrice]);

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
    setTrayObservation('none');
    setCriticalConditions([]);
    setIsConfirmedManuallySet(false);
    setConfirmedFeed('');
    setActualFeed('');
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
    setTrayObservation('none');
    setCriticalConditions([]);
    setIsConfirmedManuallySet(false);
    setConfirmedFeed('');
    setActualFeed('');
  };

  const loadVannameiPreset = () => {
    setSelectedPondId('');
    setSelectedSpeciesId('vannamei');
    setCultureStage('Grow-out');
    setCultureAge('30');
    setStocked('50000');
    setSurvivalPercent('85');
    setAverageWeight('3.1');
    setFeedPrice('65');
    setManualRate('');
    setTrayObservation('consumed');
    setCriticalConditions([]);
    setIsConfirmedManuallySet(false);
    setConfirmedFeed('');
    setActualFeed('');
  };

  const loadFreshwaterPrawnPreset = () => {
    setSelectedPondId('');
    setSelectedSpeciesId('freshwater_prawn');
    setCultureStage('Grow-out');
    setStocked('10000');
    setSurvivalPercent('80');
    setAverageWeight('25');
    setFeedPrice('55');
    setManualRate('3.5');
    setFeedType('pellet');
    setTrayObservation('small_remaining');
    setCriticalConditions([]);
    setIsConfirmedManuallySet(false);
    setConfirmedFeed('');
    setActualFeed('');
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
    setTrayObservation('none');
    setCriticalConditions([]);
    setIsConfirmedManuallySet(false);
    setConfirmedFeed('');
    setActualFeed('');
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
    setCultureAge('30');
    setFeedType('pellet');
    setTrayObservation('none');
    setCriticalConditions([]);
    setConfirmedFeed('');
    setIsConfirmedManuallySet(false);
    setActualFeed('');
    setDifferenceReason('');
    setIsSaved(false);
  };

  const handleSave = async () => {
    if (!calculationResult.isValid || isSaving) return;

    const selectedPondObj = ponds.find((p) => String(p.id) === String(selectedPondId));

    const calculatedFeedNum = calculationResult.calculatedFeed || calculationResult.dailyFeed || 0;
    const finalConfirmedFeed = confirmedFeed !== '' && !isNaN(Number(confirmedFeed))
      ? Number(confirmedFeed)
      : (calculationResult.proposedAdjustment?.proposedFeed ?? calculationResult.dailyFeed);

    const finalActualFeed = (actualFeed !== '' && !isNaN(Number(actualFeed)) && Number(actualFeed) >= 0)
      ? Number(actualFeed)
      : null;

    const diffKg = finalActualFeed !== null
      ? Number((finalActualFeed - calculatedFeedNum).toFixed(3))
      : null;

    const diffPercent = (finalActualFeed !== null && calculatedFeedNum > 0)
      ? Number((((finalActualFeed - calculatedFeedNum) / calculatedFeedNum) * 100).toFixed(2))
      : null;

    const actualCost = finalActualFeed !== null
      ? Number((finalActualFeed * (Number(feedPrice) || 0)).toFixed(2))
      : null;

    setIsSaving(true);
    try {
      await onSaveRecord({
        species: currentSpeciesObj.name,
        scientific_name: currentSpeciesObj.scientific_name,
        culture_stage: cultureStage,
        culture_month: currentSpeciesObj.needsMonth ? Number(cultureMonth) : null,
        culture_age_days: isVannamei ? Number(cultureAge) : null,
        feed_type: isFreshwaterPrawn ? feedType : 'pellet',
        tray_observation: trayObservation,
        critical_conditions: criticalConditions,
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

        // Feature 3: Feed accountability fields
        calculated_feed: calculatedFeedNum,
        confirmed_feed: finalConfirmedFeed,
        actual_feed: finalActualFeed,
        difference_kg: diffKg,
        difference_percent: diffPercent,
        actual_feed_cost: actualCost,
        difference_reason: differenceReason || '',
      });
      setIsSaved(true);
      setSavedModalInfo({
        pondName: selectedPondObj ? selectedPondObj.name : currentSpeciesObj.name,
        dailyFeed: finalConfirmedFeed,
        calculatedFeed: calculatedFeedNum,
        confirmedFeed: finalConfirmedFeed,
        actualFeed: finalActualFeed,
        differenceKg: diffKg,
        differencePercent: diffPercent,
        morningFeed: calculationResult.morningFeed,
        eveningFeed: calculationResult.eveningFeed,
        dailyCost: actualCost ?? calculationResult.dailyFeedCost,
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
            title="Rohu Rearing Example (8,500 fish, 425kg biomass, 29.75kg feed)"
          >
            {lang === 'mr' ? 'रोहू रिअरिंग' : 'Rohu'}
          </button>
          <button
            onClick={loadImcNurseryPreset}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 transition-colors"
            title="IMC Nursery Example (1.2M spawn, 1.8kg initial biomass, 7.2kg feed)"
          >
            {lang === 'mr' ? 'नर्सरी' : 'Nursery'}
          </button>
          <button
            onClick={loadVannameiPreset}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-900 border border-orange-200 transition-colors"
            title="Vannamei Shrimp Example (Day 30, 3.1g, 5% reference rate)"
          >
            {lang === 'mr' ? 'व्हॅनामेई' : 'Vannamei'}
          </button>
          <button
            onClick={loadFreshwaterPrawnPreset}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 transition-colors"
            title="Giant Freshwater Prawn Example (Grow-out, 25g, 3.5% confirmed rate)"
          >
            {lang === 'mr' ? 'महा-कोळंबी' : 'Prawn (FAO)'}
          </button>
          <button
            onClick={loadCustomPreset}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition-colors"
            title="Custom Species Example (3% manual rate)"
          >
            {lang === 'mr' ? 'इतर/सानुकूल' : 'Custom'}
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
                      {p.name} ({p.species || 'Fish'} • {formatDisplayNumber(p.stocking_count, 0)} {lang === 'mr' ? 'नग' : 'count'} • {p.average_weight_g || 0}g)
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* 1. Species Dropdown */}
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
                  {currentSpeciesObj.scientific_name} • {currentSpeciesObj.category || 'Finfish'}
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
                {isFreshwaterPrawn ? (
                  FRESHWATER_PRAWN_STAGES.map((st) => (
                    <option key={st.id} value={st.id}>
                      {lang === 'mr' ? st.name_mr : st.name}
                    </option>
                  ))
                ) : (
                  CULTURE_STAGES.map((st) => (
                    <option key={st.id} value={st.id}>
                      {lang === 'mr' ? st.name_mr : st.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* FRESHWATER PRAWN FEED TYPE SELECTOR (Broodstock / Prawn) */}
            {isFreshwaterPrawn && (
              <div className="p-3.5 bg-sky-50/70 border border-sky-200 rounded-2xl space-y-2 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-sky-950">
                    {lang === 'mr' ? 'खाद्य प्रकार (Feed Type)' : 'Feed Type'}
                  </label>
                  <span className="text-[10px] text-sky-700 bg-white px-2 py-0.5 rounded-full border border-sky-200 font-semibold">
                    FAO FTP 428
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFeedType('pellet')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      feedType === 'pellet'
                        ? 'bg-sky-600 text-white border-sky-700 shadow-xs'
                        : 'bg-white text-slate-800 border-sky-200 hover:bg-sky-100/60'
                    }`}
                  >
                    {lang === 'mr' ? 'गोळी खाद्य (Pellet Feed)' : 'Pellet Feed (Dry)'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setFeedType('fresh')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      feedType === 'fresh'
                        ? 'bg-sky-600 text-white border-sky-700 shadow-xs'
                        : 'bg-white text-slate-800 border-sky-200 hover:bg-sky-100/60'
                    }`}
                  >
                    {lang === 'mr' ? 'ताजे खाद्य (Fresh / Trash Fish)' : 'Fresh Feed (Molluscs/Fish)'}
                  </button>
                </div>
                {feedType === 'fresh' && (
                  <p className="text-[11px] text-sky-800 font-medium">
                    {lang === 'mr'
                      ? '⚠️ टीप: ताज्या खाद्यात ७०–८०% पाणी असते; त्याचे वजन सुक्या गोळी खाद्यासारखे नसते.'
                      : '⚠️ Note: Fresh feed contains 70–80% moisture; do not assume fresh-feed weight is equivalent to dry pellet weight.'}
                  </p>
                )}
              </div>
            )}

            {/* VANNAMEI CULTURE AGE IN DAYS (Culture days 1–120) */}
            {isVannamei && (
              <div className="p-3.5 bg-orange-50/70 border border-orange-200 rounded-2xl space-y-2 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <label htmlFor="cultureAgeInput" className="block text-xs font-bold text-orange-950 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-orange-600" />
                    <span>{lang === 'mr' ? 'संवर्धन दिवस (Culture Days 1–120)' : 'Culture Age in Days (1–120)'} <span className="text-red-500">*</span></span>
                  </label>
                  <span className="text-[11px] font-bold text-orange-800 bg-white px-2 py-0.5 rounded-md border border-orange-200">
                    {lang === 'mr' ? 'संदर्भ वेळापत्रक' : 'Reference Schedule'}
                  </span>
                </div>
                <div className="relative">
                  <input
                    id="cultureAgeInput"
                    name="cultureAgeInput"
                    type="number"
                    min="1"
                    max="120"
                    value={cultureAge}
                    onChange={(e) => handleCultureAgeChange(e.target.value)}
                    placeholder="e.g. 30"
                    className="w-full h-11 px-3.5 rounded-xl bg-white border border-orange-300 text-slate-900 font-bold text-base focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-xs"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-orange-700 pointer-events-none">
                    {lang === 'mr' ? 'दिवस' : 'days'}
                  </span>
                </div>
                {/* Age quick chips */}
                <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                  {['5', '14', '28', '35', '49', '63', '84', '105', '120'].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handleCultureAgeChange(val)}
                      className={`px-2 py-0.5 rounded-md text-[11px] font-bold border transition-all cursor-pointer ${
                        String(cultureAge) === val
                          ? 'bg-orange-600 text-white border-orange-700 shadow-xs'
                          : 'bg-white text-orange-900 border-orange-200 hover:bg-orange-100'
                      }`}
                    >
                      D{val}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-orange-900 leading-snug">
                  {lang === 'mr'
                    ? '१–७ दिवसांसाठी संदर्भ दर ६०–३५% आहे. १२० दिवसांपेक्षा जास्त वय असल्यास संदर्भ दर उपलब्ध नसतो.'
                    : 'Days 1–7 reference rate is 60–35% body weight/day. Beyond 120 days, reference rate is unavailable.'}
                </p>
              </div>
            )}

            {/* SPECIFIC SUB-STAGE / PERIOD CONTROLS (IMC Rearing & Growout) */}
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
              </div>
            )}

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
              </div>
            )}

            {/* PANGASIUS CULTURE PERIOD / MONTH */}
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
              </div>
            )}

            {/* 3. Number Stocked */}
            <div>
              <label htmlFor="stockedInput" className="block text-xs sm:text-sm font-bold text-slate-800 mb-1.5">
                {isIMCNursery 
                  ? (t.calculator.nurserySpawnLabel || (lang === 'mr' ? 'साठवणूक केलेल्या स्पॉनची संख्या' : 'Number of Spawn Stocked'))
                  : isVannamei
                  ? (lang === 'mr' ? 'साठवणूक केलेली कोळंबी (PL Count)' : 'Number of Shrimp Stocked (PL Count)')
                  : (cultureStage === 'Broodstock' && isFreshwaterPrawn)
                  ? (lang === 'mr' ? 'ब्रूडस्टॉक कोळंबी संख्या' : 'Number of Broodstock Prawns')
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
                  placeholder={isIMCNursery ? '1200000' : isVannamei ? '50000' : t.calculator.stockedPlaceholder}
                  min="1"
                  step="1"
                  className="w-full h-12 px-3.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-bold text-base sm:text-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all shadow-xs"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 uppercase pointer-events-none">
                  {isIMCNursery ? (lang === 'mr' ? 'स्पॉन' : 'spawn') : isVannamei || isFreshwaterPrawn ? (lang === 'mr' ? 'कोळंबी' : 'prawn') : (lang === 'mr' ? 'नग' : 'fish')}
                </span>
              </div>

              {/* Quick Stock Chips */}
              <div className="flex items-center gap-1.5 pt-1.5 flex-wrap">
                {(isIMCNursery 
                  ? ['500000', '1000000', '1200000', '2000000'] 
                  : isVannamei 
                  ? ['20000', '50000', '100000', '200000']
                  : ['2000', '5000', '10000', '20000']
                ).map((val) => (
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
            </div>

            {/* 4. Survival % & 5. Average Weight (2-col grid) */}
            {isIMCNursery ? (
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
                    : 'Spawn are extremely small; accurate average spawn weight is difficult to measure. Average weight input is not required.'}
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

                {/* Average Fish/Shrimp Weight (g) */}
                <div>
                  <label htmlFor="averageWeightInput" className="block text-xs sm:text-sm font-bold text-slate-800 mb-1.5">
                    {isVannamei || isFreshwaterPrawn 
                      ? (lang === 'mr' ? 'सरासरी वजन (ग्रॅम)' : 'Average Shrimp/Prawn Weight (g)') 
                      : t.calculator.weightLabel} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="averageWeightInput"
                      name="averageWeightInput"
                      type="number"
                      inputMode="decimal"
                      value={averageWeight}
                      onChange={(e) => setAverageWeight(e.target.value)}
                      placeholder={isVannamei ? '3.1' : t.calculator.weightPlaceholder}
                      min="0.01"
                      step="0.1"
                      className="w-full h-12 px-3.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-bold text-base sm:text-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all shadow-xs"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 uppercase pointer-events-none">
                      {lang === 'mr' ? 'ग्रॅम' : 'g'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 pt-1.5 flex-wrap">
                    {(isVannamei 
                      ? ['0.4', '1.2', '3.1', '7.5', '14.5', '25.0'] 
                      : ['10', '25', '50', '100', '250', '500']
                    ).map((val) => (
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
                {['40', '45', '55', '65', '75', '85'].map((val) => (
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

            {/* SPECIES-SPECIFIC FEEDING RATE SECTIONS */}

            {/* VANNAMEI DAYS 1–7 CONFIRMATION / RATE SELECTION */}
            {isVannamei && Number(cultureAge) >= 1 && Number(cultureAge) <= 7 && (
              <div className="p-4 bg-orange-50 border-2 border-orange-400 rounded-2xl space-y-3 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-ping" />
                    <span className="text-xs font-black text-orange-950 uppercase tracking-wider">
                      {lang === 'mr' ? 'व्हॅनामेई दिवस १–७ संदर्भ श्रेणी' : 'VANNAMEI DAYS 1–7 REFERENCE RANGE'}
                    </span>
                  </div>
                  {renderFeedingModeBadge('MANUAL')}
                </div>

                <div className="text-xs text-orange-950 bg-white/90 p-3 rounded-xl border border-orange-200 space-y-1">
                  <span className="font-bold block text-orange-900">
                    ⚠️ {lang === 'mr' ? 'संदर्भ दर: ६०–३५% बायोमास/दिवस' : 'Reference Rate: 60–35% Body Weight/Day'}
                  </span>
                  <p className="leading-relaxed text-[11px] text-orange-900/90">
                    {lang === 'mr' 
                      ? 'पहिल्या आठवड्यासाठी ६०–३५% अशी संदर्भ श्रेणी आहे. कोणताही मनमानी स्थिर दर लागू न करता, या संदर्भातील दर निश्चित करा किंवा स्वतः भरा.'
                      : 'The first week uses a 60–35% body weight/day reference range. Do not assume an arbitrary fixed rate; select or enter your confirmed rate.'}
                  </p>
                </div>

                <div>
                  <label htmlFor="manualRateInput" className="block text-xs font-extrabold text-orange-950 mb-1">
                    {lang === 'mr' ? 'निश्चित केलेला खाद्य दर (%)' : 'Confirmed Feeding Rate (%)'} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="manualRateInput"
                      name="manualRateInput"
                      type="number"
                      inputMode="decimal"
                      value={manualRate}
                      onChange={(e) => setManualRate(e.target.value)}
                      placeholder="e.g. 45"
                      min="1"
                      step="1"
                      className="w-full h-12 px-3.5 rounded-xl bg-white border-2 border-orange-400 text-orange-950 font-black text-lg focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-xs"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-base font-extrabold text-orange-700 pointer-events-none">
                      %
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 pt-1.5">
                    <span className="text-[11px] text-orange-800 font-semibold">{lang === 'mr' ? 'त्वरित श्रेणी:' : 'Range presets:'}</span>
                    {['60', '50', '40', '35'].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setManualRate(val)}
                        className={`px-2 py-0.5 rounded-md text-[11px] font-bold border transition-all cursor-pointer ${
                          manualRate === val ? 'bg-orange-600 text-white border-orange-700' : 'bg-white text-orange-900 border-orange-300'
                        }`}
                      >
                        {val}%
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* FRESHWATER PRAWN FAO MANUAL RATE SELECTION */}
            {isFreshwaterPrawn && (
              <div className="p-4 bg-emerald-50 border-2 border-emerald-400 rounded-2xl space-y-3 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                    <span className="text-xs font-black text-emerald-950 uppercase tracking-wider">
                      {lang === 'mr' ? 'FAO महा-कोळंबी खाद्य दर' : 'FAO PRAWN FEEDING RATE'}
                    </span>
                  </div>
                  {renderFeedingModeBadge('MANUAL')}
                </div>

                <div className="text-xs text-emerald-950 bg-white/90 p-3 rounded-xl border border-emerald-200 space-y-1">
                  <span className="font-bold block text-emerald-900">
                    📘 {cultureStage === 'Nursery (PL/Juveniles)' 
                      ? (lang === 'mr' ? 'नर्सरी संदर्भ: १०–२०% बायोमास/दिवस' : 'Nursery Reference: 10–20% Biomass/Day')
                      : cultureStage === 'Broodstock'
                      ? (lang === 'mr' ? 'ब्रूडस्टॉक संदर्भ: १–३% बायोमास/दिवस' : 'Broodstock Reference: 1–3% Biomass/Day')
                      : (lang === 'mr' ? 'ग्रो-आऊट संदर्भ: आकारावर आधारित (~१०-२०% लहान; ~२% काढणीजवळ)' : 'Grow-out Reference: Size-based (~10-20% small; ~2% near harvest)')
                    }
                  </span>
                  <p className="leading-relaxed text-[11px] text-emerald-900/90">
                    {lang === 'mr'
                      ? 'FAO मार्गदर्शिकेनुसार कोणताही सार्वत्रिक स्थिर दर गृहीत न धरता, स्थानिक प्रमाणित पद्धत व खाण्याच्या प्रतिसादानुसार दर निश्चित करा.'
                      : 'Following the FAO manual, confirm a feeding rate using a locally verified protocol and observed feeding response.'}
                  </p>
                </div>

                {cultureStage !== 'Hatchery (Larvae)' && (
                  <div>
                    <label htmlFor="manualRateInput" className="block text-xs font-extrabold text-emerald-950 mb-1">
                      {lang === 'mr' ? 'निश्चित केलेला खाद्य दर (%)' : 'Confirmed Feeding Rate (%)'} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        id="manualRateInput"
                        name="manualRateInput"
                        type="number"
                        inputMode="decimal"
                        value={manualRate}
                        onChange={(e) => setManualRate(e.target.value)}
                        placeholder="e.g. 3.5"
                        min="0.1"
                        step="0.1"
                        className="w-full h-12 px-3.5 rounded-xl bg-white border-2 border-emerald-400 text-emerald-950 font-black text-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
                      />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-base font-extrabold text-emerald-700 pointer-events-none">
                        %
                      </span>
                    </div>
                    {/* Quick Suggestions for Prawn */}
                    <div className="flex items-center gap-1.5 pt-1.5 flex-wrap">
                      <span className="text-[11px] text-emerald-800 font-semibold">{lang === 'mr' ? 'संदर्भ दर:' : 'Presets:'}</span>
                      {(cultureStage === 'Broodstock' 
                        ? ['1.0', '1.5', '2.0', '2.5', '3.0']
                        : cultureStage === 'Nursery (PL/Juveniles)'
                        ? ['10.0', '12.0', '15.0', '18.0', '20.0']
                        : ['2.0', '3.0', '3.5', '5.0', '8.0', '12.0']
                      ).map((val) => (
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
                )}
              </div>
            )}

            {/* IMC NURSERY MANUAL RATE SELECTION */}
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

                <div className="bg-white/80 border border-amber-200 rounded-xl p-3 space-y-1.5 text-xs text-amber-950">
                  <span className="font-extrabold text-amber-900 block flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5 text-amber-700" />
                    <span>{t.calculator.nurseryRefTitle || (lang === 'mr' ? 'नर्सरी संदर्भ खाद्य आधार' : 'Reference Nursery Feeding Basis')}</span>
                  </span>
                  <div className="grid grid-cols-2 gap-2 pt-1 font-medium">
                    <div className="bg-amber-100/60 p-2 rounded-lg">
                      <span className="block text-[11px] text-amber-800">{lang === 'mr' ? 'पहिले ५ दिवस:' : 'First 5 days:'}</span>
                      <span className="font-bold text-sm text-amber-950">400%</span>
                    </div>
                    <div className="bg-amber-100/60 p-2 rounded-lg">
                      <span className="block text-[11px] text-amber-800">{lang === 'mr' ? '५ दिवसांनंतर:' : 'After first 5 days:'}</span>
                      <span className="font-bold text-sm text-amber-950">800%</span>
                    </div>
                  </div>
                </div>

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
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setManualRate('400')}
                      className={`py-2 px-2.5 rounded-xl font-bold text-xs border transition-all cursor-pointer ${
                        manualRate === '400'
                          ? 'bg-amber-600 text-white border-amber-700 shadow-sm'
                          : 'bg-white hover:bg-amber-100/80 text-amber-900 border-amber-300'
                      }`}
                    >
                      {lang === 'mr' ? 'पहिले ५ दिवस (४००%)' : 'First 5 days (400%)'}
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
                      {lang === 'mr' ? '५ दिवसांनंतर (८००%)' : 'After 5 days (800%)'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* MAGUR MANUAL RATE UI */}
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
                </div>
              </div>
            )}

            {/* GRASS CARP SPECIAL METHOD / MANUAL UI */}
            {isGrassCarp && (
              <div className="p-4 bg-emerald-50 border-2 border-emerald-400 rounded-2xl space-y-3 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-emerald-700" />
                    <span className="text-xs font-black text-emerald-950 uppercase tracking-wider">
                      {lang === 'mr' ? 'खाद्य मोड: विशेष / मॅन्युअल' : 'FEEDING MODE: MANUAL'}
                    </span>
                  </div>
                  {renderFeedingModeBadge('MANUAL')}
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
                </div>
              </div>
            )}

            {/* OTHER / CUSTOM SPECIES MANUAL RATE */}
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

            {/* FEEDING-TRAY MANAGEMENT OBSERVATION (Shared Choices) */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="traySelect" className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <ClipboardCheck className="w-4 h-4 text-teal-600" />
                  <span>{t.feedTracking?.trayObservation || (lang === 'mr' ? 'खाद्य ट्रे निरीक्षण' : 'Feeding-Tray Observation')}</span>
                </label>
                <span className="text-[10px] text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                  {lang === 'mr' ? '५ पर्याय' : '5 Choices'}
                </span>
              </div>
              <select
                id="traySelect"
                value={trayObservation}
                onChange={(e) => setTrayObservation(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl bg-white border border-slate-300 text-slate-900 font-semibold text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-xs cursor-pointer"
              >
                {FEEDING_TRAY_OBSERVATIONS.map((obs) => (
                  <option key={obs.id} value={obs.id}>
                    {lang === 'mr' ? obs.label_mr : obs.label}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500 leading-snug">
                {isVannamei 
                  ? (lang === 'mr' 
                      ? 'ट्रे निरीक्षणानुसार पुढील आहारासाठी समायोजन मार्गदर्शन दर्शवले जाईल.'
                      : 'Observation provides proposed adjustment guidance for the next meal.')
                  : isFreshwaterPrawn
                  ? (lang === 'mr'
                      ? 'FAO मार्गदर्शक: शिल्लक खाद्यानुसार सावधगिरी बाळगा. व्हॅनामेईची टक्केवारी येथे वापरू नका.'
                      : 'FAO Guidance: Complete consumption justifies reviewing an increase, while leftovers justify reducing ration.')
                  : (lang === 'mr'
                      ? 'खाद्य वाया जाणे रोखण्यासाठी ट्रे निरीक्षणाची नोंद ठेवा.'
                      : 'Log tray consumption to monitor appetite and prevent overfeeding.')
                }
              </p>
            </div>

            {/* VANNAMEI CRITICAL POND CONDITIONS (Section 6) */}
            {isVannamei && (
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>{lang === 'mr' ? 'तळ्यातील गंभीर परिस्थिती (Critical Conditions)' : 'Critical Pond Conditions'}</span>
                  </label>
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                    {lang === 'mr' ? 'रूढीवादी प्राधान्य' : 'Conservative Priority'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600">
                  {lang === 'mr' 
                    ? 'अनेक परिस्थिती लागू असल्यास सर्वात सुरक्षित (रूढीवादी) कृतीला प्राधान्य दिले जाईल (कपातींची आंधळी बेरीज केली जाणार नाही).'
                    : 'When multiple conditions apply, the system prioritizes the most conservative appropriate action without blind stacking.'}
                </p>

                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {VANNAMEI_CRITICAL_CONDITIONS.map((cond) => {
                    const isChecked = criticalConditions.includes(cond.id);
                    return (
                      <div
                        key={cond.id}
                        onClick={() => toggleCriticalCondition(cond.id)}
                        className={`p-2.5 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${
                          isChecked
                            ? 'bg-amber-50 border-amber-300 text-amber-950 font-bold shadow-xs'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="mt-0.5 shrink-0 text-teal-600">
                          {isChecked ? <CheckSquare className="w-4 h-4 text-amber-600" /> : <Square className="w-4 h-4 text-slate-300" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="block text-xs font-bold leading-tight">
                            {lang === 'mr' ? cond.label_mr : cond.label}
                          </span>
                          <span className="block text-[10px] text-slate-500 mt-0.5">
                            {lang === 'mr' ? cond.guidance_mr : cond.guidance}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>
        </div>

        {/* RIGHT COLUMN: CALCULATED RESULTS & FEED ACCOUNTABILITY */}
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
              </div>
            ) : (
              /* PRIMARY SUCCESS VIEW */
              <div className="space-y-4">
                
                {/* 1. Daily Feed Requirement */}
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/15 shadow-inner">
                  <div className="flex items-center justify-between text-xs text-teal-200 font-semibold mb-1">
                    <span>{t.feedTracking?.calculatedRequired || (lang === 'mr' ? 'आवश्यक गणना केलेले खाद्य' : 'Calculated Feed Required')}</span>
                    <span className="bg-amber-400 text-slate-950 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                      {t.calculator.perDay}
                    </span>
                  </div>
                  <div className="text-3xl sm:text-4xl font-black text-amber-300 tracking-tight flex items-baseline gap-2">
                    <span>{formatDisplayNumber(calculationResult.calculatedFeed || calculationResult.dailyFeed, 2)}</span>
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

          {/* PROPOSED ADJUSTMENT / CONDITION-BASED GUIDANCE CARD */}
          {calculationResult.proposedAdjustment && calculationResult.proposedAdjustment.reason && (
            <div className="bg-amber-50/90 border border-amber-300 rounded-2xl p-4 text-xs space-y-2 animate-fadeIn shadow-xs">
              <div className="flex items-center justify-between border-b border-amber-200/80 pb-2">
                <span className="font-extrabold text-amber-950 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>{lang === 'mr' ? 'मार्गदर्शन व प्रस्तावित समायोजन' : 'Observation Guidance & Proposed Adjustment'}</span>
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-200/80 text-amber-900">
                  {calculationResult.proposedAdjustment.action}
                </span>
              </div>
              <p className="text-amber-900 leading-snug">
                {lang === 'mr' ? calculationResult.proposedAdjustment.reason_mr : calculationResult.proposedAdjustment.reason}
              </p>
              <div className="p-2.5 bg-white/80 rounded-xl border border-amber-200 flex items-center justify-between font-bold text-amber-950">
                <span>{lang === 'mr' ? 'प्रस्तावित खाद्य प्रमाण:' : 'Proposed Adjusted Quantity:'}</span>
                <span className="text-sm text-amber-900 font-extrabold">
                  {formatDisplayNumber(calculationResult.proposedAdjustment.proposedFeed, 2)} kg
                </span>
              </div>
              <p className="text-[10px] text-amber-800/80 italic">
                {lang === 'mr' 
                  ? '* हे केवळ मार्गदर्शक मूल्य आहे. खालील रकान्यात अंतिम खाद्य प्रमाण स्वतः तपासा व निश्चित करा.'
                  : '* This is guidance based on observations. Farmer confirmation is required below.'}
              </p>
            </div>
          )}

          {/* ========================================================================= */}
          {/* FEATURE 3: CALCULATED VS CONFIRMED VS ACTUAL FEED ACCOUNTABILITY TRACKING */}
          {/* ========================================================================= */}
          {calculationResult.isValid && (
            <div className="bg-white rounded-3xl p-5 sm:p-6 border-2 border-teal-600/30 shadow-card space-y-4 animate-fadeIn">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Scale className="w-5 h-5 text-teal-700" />
                  <h4 className="font-extrabold text-slate-900 text-sm sm:text-base">
                    {t.feedTracking?.title || (lang === 'mr' ? 'खाद्य जबाबदारी व प्रत्यक्ष ट्रॅकिंग' : 'Feed Accountability & Tracking')}
                  </h4>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
                  {lang === 'mr' ? '३-टप्पे ट्रॅकिंग' : '3-Tier Tracking'}
                </span>
              </div>

              {/* Step 1: Calculated Feed Required (Fishry Estimated) */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700">
                    1. {t.feedTracking?.calculatedRequired || (lang === 'mr' ? 'आवश्यक गणना केलेले खाद्य' : 'Calculated Feed Required')}:
                  </span>
                  <span className="font-mono text-slate-500 font-medium">Fishry Estimate</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-black text-slate-900">
                    {formatDisplayNumber(calculationResult.calculatedFeed || calculationResult.dailyFeed, 2)}{' '}
                    <span className="text-xs font-normal text-slate-500">kg/day</span>
                  </span>
                  {calculationResult.feedPriceNum > 0 && (
                    <span className="text-xs font-semibold text-slate-500">
                      ≈ ₹{formatDisplayNumber(calculationResult.dailyFeedCost, 0)}
                    </span>
                  )}
                </div>
              </div>

              {/* Step 2: Confirmed Feeding Quantity (Farmer Decision after reviews) */}
              <div className="p-3 bg-teal-50/60 rounded-2xl border border-teal-200 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <label htmlFor="confirmedFeedInput" className="font-bold text-teal-950 flex items-center gap-1.5">
                    <span>2. {t.feedTracking?.confirmedQuantity || (lang === 'mr' ? 'निश्चित केलेले खाद्य प्रमाण' : 'Confirmed Feeding Quantity')}</span>
                    <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[11px] text-teal-700 font-semibold bg-white px-2 py-0.5 rounded-md border border-teal-200">
                    {isConfirmedManuallySet ? (lang === 'mr' ? 'समायोजित' : 'Custom') : (lang === 'mr' ? 'शिफारस' : 'Recommended')}
                  </span>
                </div>
                <div className="relative">
                  <input
                    id="confirmedFeedInput"
                    name="confirmedFeedInput"
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    min="0"
                    value={confirmedFeed}
                    onChange={(e) => {
                      setConfirmedFeed(e.target.value);
                      setIsConfirmedManuallySet(true);
                    }}
                    placeholder={`e.g. ${calculationResult.dailyFeed}`}
                    className="w-full h-11 px-3.5 rounded-xl bg-white border border-teal-300 text-slate-900 font-bold text-base focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-xs"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-teal-700 pointer-events-none">
                    kg
                  </span>
                </div>
                <p className="text-[11px] text-teal-800/90 leading-tight">
                  {lang === 'mr'
                    ? 'निरीक्षणे व हवामान तपासून तुम्ही ठरवलेले प्रमाण. हे गणना केलेल्या प्रमाणापेक्षा वेगळे असू शकते.'
                    : 'The quantity you decide to feed after reviewing observations and conditions.'}
                </p>
              </div>

              {/* Step 3: Actual Feed Given (Manual Farmer Entry) */}
              <div className="p-3.5 bg-amber-50/70 rounded-2xl border-2 border-amber-300 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <label htmlFor="actualFeedInput" className="font-extrabold text-amber-950 flex items-center gap-1.5">
                    <span>3. {t.feedTracking?.actualGiven || (lang === 'mr' ? 'प्रत्यक्ष दिलेले खाद्य' : 'Actual Feed Given')}</span>
                    <span className="text-amber-700 font-normal">({lang === 'mr' ? 'खाद्य दिल्यानंतर भरा' : 'Post-feeding entry'})</span>
                  </label>
                  <span className="text-[10px] font-bold text-amber-800 bg-white px-2 py-0.5 rounded-md border border-amber-300 uppercase">
                    {lang === 'mr' ? 'शेतकरी नोंद' : 'Manual Entry'}
                  </span>
                </div>

                <div className="relative">
                  <input
                    id="actualFeedInput"
                    name="actualFeedInput"
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    min="0"
                    value={actualFeed}
                    onChange={(e) => setActualFeed(e.target.value)}
                    placeholder={lang === 'mr' ? 'प्रत्यक्ष दिलेले खाद्य भरा (उदा. 28.5 kg)' : 'Enter actual feed given (e.g. 28.5 kg)'}
                    className="w-full h-12 px-3.5 rounded-xl bg-white border-2 border-amber-400 text-slate-900 font-black text-lg focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-xs"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-amber-800 uppercase pointer-events-none">
                    kg
                  </span>
                </div>

                {/* Quick copy buttons if actual was equal to confirmed or calculated */}
                <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                  <span className="text-[11px] text-amber-900 font-semibold">{lang === 'mr' ? 'द्रुत नोंद:' : 'Quick copy:'}</span>
                  <button
                    type="button"
                    onClick={() => setActualFeed(String(confirmedFeed || calculationResult.dailyFeed))}
                    className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 cursor-pointer"
                  >
                    = {lang === 'mr' ? 'निश्चित प्रमाण' : 'Confirmed'} ({confirmedFeed || calculationResult.dailyFeed} kg)
                  </button>
                  <button
                    type="button"
                    onClick={() => setActualFeed(String(calculationResult.calculatedFeed || calculationResult.dailyFeed))}
                    className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 cursor-pointer"
                  >
                    = {lang === 'mr' ? 'गणना प्रमाण' : 'Calculated'} ({calculationResult.calculatedFeed || calculationResult.dailyFeed} kg)
                  </button>
                </div>
              </div>

              {/* LIVE DIFFERENCE & COST DISPLAY (When actual feed is entered) */}
              {feedAccountability.hasActual ? (
                <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
                    <span>{t.feedTracking?.difference || (lang === 'mr' ? 'फरक व खर्च विश्लेषण' : 'Difference & Cost')}</span>
                    <span className={`px-2 py-0.5 rounded-md text-[11px] font-extrabold ${
                      feedAccountability.differenceKg > 0 
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' 
                        : feedAccountability.differenceKg < 0 
                        ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40' 
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    }`}>
                      {feedAccountability.differenceKg > 0 
                        ? (lang === 'mr' ? '+ जास्त दिले' : '+ Fed More') 
                        : feedAccountability.differenceKg < 0 
                        ? (lang === 'mr' ? '- कमी दिले' : '- Fed Less') 
                        : (lang === 'mr' ? 'अचूक समान' : 'Exact Match')}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Difference kg & % */}
                    <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                      <span className="text-[11px] text-slate-400 block font-medium">
                        {t.feedTracking?.difference || (lang === 'mr' ? 'फरक (kg / %)' : 'Difference (kg / %)')}
                      </span>
                      <div className="text-xl font-black text-amber-300 tracking-tight flex items-baseline gap-1 mt-0.5">
                        <span>{feedAccountability.differenceKg >= 0 ? `+${feedAccountability.differenceKg}` : feedAccountability.differenceKg}</span>
                        <span className="text-xs text-slate-400 font-normal">kg</span>
                      </div>
                      <span className="text-[11px] text-slate-300 block mt-0.5">
                        {feedAccountability.differencePercent !== null 
                          ? `${feedAccountability.differencePercent >= 0 ? `+${feedAccountability.differencePercent}` : feedAccountability.differencePercent}%`
                          : (lang === 'mr' ? 'लागू नाही' : 'Not applicable')}
                      </span>
                    </div>

                    {/* Actual Feed Cost */}
                    <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                      <span className="text-[11px] text-slate-400 block font-medium">
                        {t.feedTracking?.actualCost || (lang === 'mr' ? 'प्रत्यक्ष खाद्य खर्च' : 'Actual Feed Cost')}
                      </span>
                      <div className="text-xl font-black text-emerald-400 tracking-tight mt-0.5">
                        ₹{formatDisplayNumber(feedAccountability.actualFeedCost, 0)}
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {feedAccountability.actualFeedKg} kg × ₹{Number(feedPrice) || 0}/kg
                      </span>
                    </div>
                  </div>

                  {/* Optional Reason for Difference */}
                  <div className="space-y-1 pt-1">
                    <label htmlFor="reasonInput" className="block text-xs font-medium text-slate-300">
                      {t.feedTracking?.differenceReason || (lang === 'mr' ? 'फरकाचे कारण (पर्यायी)' : 'Reason for Difference (Optional)')}:
                    </label>
                    <input
                      id="reasonInput"
                      type="text"
                      value={differenceReason}
                      onChange={(e) => setDifferenceReason(e.target.value)}
                      placeholder={lang === 'mr' ? 'उदा. खाण्याचा चांगला प्रतिसाद, ढगाळ वातावरण, साठा संपला' : 'e.g. Good appetite, cloudy weather, bag stock limit'}
                      className="w-full h-9 px-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 text-xs focus:outline-none focus:ring-1 focus:ring-teal-400"
                    />
                    {/* Quick reason tags */}
                    <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                      {(lang === 'mr' 
                        ? ['चांगला प्रतिसाद', 'कमी भूक', 'ढगाळ वातावरण', 'साठा संपला', 'तपासणी शिल्लक']
                        : ['High appetite', 'Low appetite', 'Cloudy/rainy', 'Stock limit', 'Tray leftovers']
                      ).map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => setDifferenceReason(tag)}
                          className="px-2 py-0.5 rounded-md text-[10px] bg-white/10 hover:bg-white/20 text-slate-300 border border-white/10 cursor-pointer"
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-400 leading-tight border-t border-slate-800 pt-2">
                    {lang === 'mr'
                      ? 'ऋण फरक (-) म्हणजे गणनेपेक्षा कमी खाद्य दिले गेले. धन फरक (+) म्हणजे जास्त दिले गेले. दोन्ही स्थिती आपोआप चूक किंवा बरोबर मानल्या जात नाहीत.'
                      : 'A negative difference means less feed was given than calculated. A positive difference means more was given. Neither situation is classified as correct or incorrect.'}
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-center">
                  <span className="text-xs text-slate-500">
                    {lang === 'mr' 
                      ? '💡 प्रत्यक्ष खाद्य दिल्यानंतर वर "प्रत्यक्ष दिलेले खाद्य" नोंदवा. यामुळे फरक व प्रत्यक्ष खर्च मोजला जाईल.'
                      : '💡 Enter actual feed given above after feeding to calculate difference and actual cost.'}
                  </span>
                </div>
              )}

            </div>
          )}

          {/* TRANSPARENCY OF BIOMASS CALCULATION */}
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
              </div>
            ) : (
              <div className="text-xs text-slate-700 space-y-1.5 pt-1">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                    <span className="text-slate-500 block text-[11px]">{lang === 'mr' ? 'जिवंत संख्या:' : 'Surviving Count:'}</span>
                    <span className="font-bold text-slate-900">
                      {formatDisplayNumber(calculationResult.survivingFish, 0)} {isVannamei || isFreshwaterPrawn ? (lang === 'mr' ? 'कोळंबी' : 'prawn') : (lang === 'mr' ? 'मासे' : 'fish')}
                    </span>
                    <span className="block text-[10px] text-slate-400 mt-0.5">
                      {stocked || 0} × {survivalPercent || 0}% ÷ 100
                    </span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                    <span className="text-slate-500 block text-[11px]">{t.feedTracking?.estimatedBiomass || (lang === 'mr' ? 'अंदाजित जैवभार' : 'Estimated Biomass')}:</span>
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

          {/* WHY THE RATE WAS SELECTED & FEEDING MODE */}
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
                  <span className="text-slate-500 font-medium">{t.feedTracking?.referenceRate || (lang === 'mr' ? 'संदर्भित खाद्य दर:' : 'Reference Feeding Rate:')}</span>
                  <span className="font-bold text-sky-800 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200">
                    {calculationResult.applicableRange.min === calculationResult.applicableRange.max 
                      ? `${calculationResult.applicableRange.min}% BW/day`
                      : `${calculationResult.applicableRange.min}–${calculationResult.applicableRange.max}% BW/day`}
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

          {/* CONTEXTUAL WARNING SYSTEM */}
          {calculationResult.warningText && (
            <div className="bg-amber-50/90 border border-amber-300 rounded-2xl p-4 text-xs space-y-1.5 shadow-xs animate-fadeIn">
              <div className="flex items-center gap-1.5 font-extrabold text-amber-950">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  {calculationResult.warningType === 'IMC_NURSERY' ? (t.calculator.imcNurseryWarningTitle || 'MANUAL FEEDING REQUIRED')
                    : calculationResult.warningType === 'VANNAMEI' ? (lang === 'mr' ? 'व्हॅनामेई संदर्भ सूचना' : 'VANNAMEI REFERENCE GUIDANCE')
                    : calculationResult.warningType === 'FRESHWATER_PRAWN' ? (lang === 'mr' ? 'FAO महा-कोळंबी सूचना' : 'FAO PRAWN FEEDING GUIDANCE')
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

          {/* GENERAL FEEDING WARNING (ALWAYS DISPLAYED AFTER FEED CALCULATION) */}
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
                  {formatDisplayNumber(confirmedFeed || calculationResult.dailyFeed, 2)} kg
                </span>
              </div>
              <p className="text-[10px] text-teal-200/80 truncate">
                {actualFeed ? `${lang === 'mr' ? 'प्रत्यक्ष:' : 'Actual:'} ${actualFeed}kg • ` : ''}
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

            {/* Quick Numbers Card with 3-tier Accountability */}
            <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-3.5 space-y-2 text-left text-xs">
              <div className="flex items-center justify-between border-b border-emerald-200/60 pb-1.5">
                <span className="text-slate-600">{t.feedTracking?.calculatedRequired || (lang === 'mr' ? 'गणना केलेले खाद्य:' : 'Calculated Feed:')}</span>
                <span className="font-bold text-slate-900">{formatDisplayNumber(savedModalInfo.calculatedFeed, 2)} kg</span>
              </div>
              <div className="flex items-center justify-between border-b border-emerald-200/60 pb-1.5">
                <span className="text-slate-600">{t.feedTracking?.confirmedQuantity || (lang === 'mr' ? 'निश्चित केलेले प्रमाण:' : 'Confirmed Quantity:')}</span>
                <span className="font-extrabold text-teal-900">{formatDisplayNumber(savedModalInfo.confirmedFeed, 2)} kg</span>
              </div>
              <div className="flex items-center justify-between border-b border-emerald-200/60 pb-1.5">
                <span className="text-slate-600">{t.feedTracking?.actualGiven || (lang === 'mr' ? 'प्रत्यक्ष दिलेले खाद्य:' : 'Actual Feed Given:')}</span>
                <span className="font-black text-emerald-950">
                  {savedModalInfo.actualFeed !== null ? `${formatDisplayNumber(savedModalInfo.actualFeed, 2)} kg` : (lang === 'mr' ? 'नोंदवलेले नाही' : 'Not recorded')}
                </span>
              </div>
              {savedModalInfo.differenceKg !== null && (
                <div className="flex items-center justify-between pt-0.5 text-xs">
                  <span className="text-slate-600">{t.feedTracking?.difference || (lang === 'mr' ? 'फरक:' : 'Difference:')}</span>
                  <span className="font-bold text-slate-900">
                    {savedModalInfo.differenceKg >= 0 ? `+${savedModalInfo.differenceKg}` : savedModalInfo.differenceKg} kg
                    {savedModalInfo.differencePercent !== null ? ` (${savedModalInfo.differencePercent >= 0 ? `+${savedModalInfo.differencePercent}` : savedModalInfo.differencePercent}%)` : ''}
                  </span>
                </div>
              )}
              {savedModalInfo.dailyCost > 0 && (
                <div className="flex items-center justify-between pt-1 text-xs text-emerald-900 font-extrabold border-t border-emerald-200/80">
                  <span>{lang === 'mr' ? 'खर्च:' : 'Cost:'}</span>
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
