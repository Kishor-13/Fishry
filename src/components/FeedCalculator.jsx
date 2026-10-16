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
  Check,
  Wind,
  Droplets,
  Thermometer,
  Activity,
  ShieldAlert,
  AlertOctagon,
  Eye
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
  FRESHWATER_PRAWN_STAGES,
  OBSERVATION_METHODS,
  FLOATING_FEED_OBSERVATIONS,
  SUBMERGED_TRAY_OBSERVATIONS,
  GREEN_FODDER_OBSERVATIONS,
  VANNAMEI_CHECK_TRAY_RATES,
  VANNAMEI_INITIAL_RESPONSE_NOTE,
  VANNAMEI_FAECAL_INDICATORS,
  DEFAULT_SESSIONS,
  VANNAMEI_SESSIONS,
  TILAPIA_EXTENDED_SESSIONS,
  getSpeciesDefaultObservationMethod
} from '../constants/speciesData';
import { 
  calculateFeed,
  evaluateEnvironmentalOverrides,
  calculateVannameiCheckTray,
  lookupPreviousSessionObservation,
  calculateSessionFeedPlan 
} from '../services/calculationService';
import { calculateFeedDifference } from '../utils/calculations';
import { formatDisplayNumber } from '../lib/ruleEngine';
import { translations } from '../lib/translations';

export default function FeedCalculator({
  lang,
  rulesList,
  ponds = [],
  initialPondId = null,
  feedHistory = [],
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

  // Strict Session-wise State (Section 3)
  const [selectedSession, setSelectedSession] = useState('morning');
  const [sessionDate, setSessionDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [isExtendedTilapiaSchedule, setIsExtendedTilapiaSchedule] = useState(false);

  // Finfish & Crustacean Observation Method & Options (Section 2)
  const [observationMethod, setObservationMethod] = useState(() => getSpeciesDefaultObservationMethod('rohu'));
  const [floatingObs, setFloatingObs] = useState('none');
  const [submergedObs, setSubmergedObs] = useState('none');
  const [fodderObs, setFodderObs] = useState('none');
  const [commonCarpMudObscured, setCommonCarpMudObscured] = useState(false);
  const [magurDelayedInspection, setMagurDelayedInspection] = useState(false);

  // Vannamei Check-Tray specific indicators (Section 6)
  const [vannameiFaecalLength, setVannameiFaecalLength] = useState('short');
  const [vannameiFaecalColour, setVannameiFaecalColour] = useState('feed_coloured');
  const [vannameiSandPresent, setVannameiSandPresent] = useState(false);

  // Environmental Assessment State (Section 4)
  const [dissolvedOxygen, setDissolvedOxygen] = useState('');
  const [isFishPiping, setIsFishPiping] = useState(false);
  const [waterTemperature, setWaterTemperature] = useState('');
  const [weatherCondition, setWeatherCondition] = useState('normal');
  const [handlingCondition, setHandlingCondition] = useState('none');
  const [isChemicalTreatment, setIsChemicalTreatment] = useState(false);
  const [showEnvironmentalPanel, setShowEnvironmentalPanel] = useState(false);

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
        setObservationMethod(getSpeciesDefaultObservationMethod(matchedSpecies.id));
        if (matchedSpecies.id === 'vannamei') {
          setSelectedSession('7_am');
        } else {
          setSelectedSession('morning');
        }
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
    setFloatingObs('none');
    setSubmergedObs('none');
    setFodderObs('none');
    setCriticalConditions([]);
    setCommonCarpMudObscured(false);
    setMagurDelayedInspection(false);

    const defaultObs = getSpeciesDefaultObservationMethod(newSpeciesId);
    setObservationMethod(defaultObs);

    const newObj = SPECIES_LIST.find((s) => s.id === newSpeciesId);
    if (newObj?.id === 'vannamei') {
      setCultureStage('Grow-out');
      setCultureAge('30');
      setAverageWeight('3.1');
      setFeedPrice('65');
      setManualRate('');
      setSelectedSession('7_am');
    } else {
      setSelectedSession('morning');
      if (newObj?.id === 'freshwater_prawn') {
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

  // Look up previous matching session observation (Section 3: Strict Day-to-Day Mapping)
  const previousSessionObs = useMemo(() => {
    return lookupPreviousSessionObservation(feedHistory, {
      species: currentSpeciesObj.name,
      pondId: selectedPondId,
      session: selectedSession,
      currentDate: sessionDate
    });
  }, [feedHistory, currentSpeciesObj.name, selectedPondId, selectedSession, sessionDate]);

  // Evaluate environmental conditions using safety hierarchy (Section 4)
  const environmentalEval = useMemo(() => {
    return evaluateEnvironmentalOverrides({
      speciesId: currentSpeciesObj.id,
      dissolvedOxygen,
      waterTemperature,
      isFishPiping,
      weatherCondition,
      handlingCondition,
      isChemicalTreatment
    });
  }, [
    currentSpeciesObj.id,
    dissolvedOxygen,
    waterTemperature,
    isFishPiping,
    weatherCondition,
    handlingCondition,
    isChemicalTreatment
  ]);

  // Strict session-wise feed plan (Daily baseline preserved; session allocated transparently) (Section 3 & 5)
  const sessionPlan = useMemo(() => {
    const dailyBase = calculationResult.dailyFeed || 0;
    return calculateSessionFeedPlan({
      dailyBaseFeed: dailyBase,
      speciesId: currentSpeciesObj.id,
      session: selectedSession,
      isExtendedTilapia: isExtendedTilapiaSchedule,
      previousObservation: previousSessionObs,
      environmentalOverride: environmentalEval
    });
  }, [
    calculationResult.dailyFeed,
    currentSpeciesObj.id,
    selectedSession,
    isExtendedTilapiaSchedule,
    previousSessionObs,
    environmentalEval
  ]);

  // Vannamei Check-Tray calculation (Tray feed g = session feed kg * tray rate g/kg) (Section 6)
  const vannameiTrayCalc = useMemo(() => {
    if (!isVannamei) return null;
    const sessionPlannedKg = (sessionPlan && sessionPlan.proposedQuantity !== undefined)
      ? sessionPlan.proposedQuantity
      : (sessionPlan?.baseSessionFeed || 0);
    const avgWeightG = Number(averageWeight) || 0;
    return calculateVannameiCheckTray(sessionPlannedKg, avgWeightG);
  }, [isVannamei, sessionPlan, averageWeight]);

  // Active observation detail
  const activeObservationData = useMemo(() => {
    if (observationMethod === 'floating_feed') {
      const found = FLOATING_FEED_OBSERVATIONS.find(o => o.id === floatingObs);
      return found ? {
        id: found.id,
        label: found.label,
        label_mr: found.label_mr,
        action: found.action,
        action_mr: found.action_mr,
        adjustmentPercent: found.adjustmentPercent,
        guidance: found.action,
        guidance_mr: found.action_mr
      } : null;
    }
    if (observationMethod === 'green_fodder_frame') {
      const found = GREEN_FODDER_OBSERVATIONS.find(o => o.id === fodderObs);
      return found ? {
        id: found.id,
        label: found.label,
        label_mr: found.label_mr,
        action: found.action,
        action_mr: found.action_mr,
        adjustmentPercent: found.adjustmentPercent,
        guidance: found.action,
        guidance_mr: found.action_mr
      } : null;
    }
    // Default submerged or suspended tray
    const found = SUBMERGED_TRAY_OBSERVATIONS.find(o => o.id === submergedObs);
    return found ? {
      id: found.id,
      label: found.label,
      label_mr: found.label_mr,
      action: found.action,
      action_mr: found.action_mr,
      adjustmentPercent: found.adjustmentPercent,
      guidance: found.action,
      guidance_mr: found.action_mr
    } : null;
  }, [observationMethod, floatingObs, submergedObs, fodderObs]);

  // Keep Confirmed Feeding Quantity synchronized if farmer hasn't manually overridden it
  useEffect(() => {
    if (!isConfirmedManuallySet && calculationResult.isValid && sessionPlan) {
      const recommendedVal = sessionPlan.proposedQuantity !== undefined
        ? sessionPlan.proposedQuantity
        : sessionPlan.baseSessionFeed;
      setConfirmedFeed(String(recommendedVal));
    }
  }, [calculationResult, sessionPlan, isConfirmedManuallySet]);

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
    selectedSession,
    sessionDate,
    observationMethod,
    floatingObs,
    submergedObs,
    fodderObs,
    dissolvedOxygen,
    isFishPiping,
    waterTemperature,
    weatherCondition,
    handlingCondition,
    isChemicalTreatment,
    trayObservation,
    criticalConditions,
  ]);

  // Live Feed Difference Calculation (Section 7)
  const feedAccountability = useMemo(() => {
    const plannedSessionKg = (sessionPlan && sessionPlan.baseSessionFeed > 0)
      ? sessionPlan.baseSessionFeed
      : (calculationResult.calculatedFeed || calculationResult.dailyFeed || 0);

    const actualFeedKg = actualFeed !== '' && !isNaN(Number(actualFeed)) && Number(actualFeed) >= 0
      ? Number(actualFeed)
      : null;
    const price = Number(feedPrice) || 0;

    if (actualFeedKg === null) {
      return {
        hasActual: false,
        actualFeedKg: null,
        calculatedFeedKg: plannedSessionKg,
        differenceKg: null,
        differencePercent: null,
        actualFeedCost: null,
      };
    }

    const diff = calculateFeedDifference(actualFeedKg, plannedSessionKg, price);
    return {
      hasActual: true,
      actualFeedKg,
      calculatedFeedKg: plannedSessionKg,
      ...diff,
    };
  }, [calculationResult, sessionPlan, actualFeed, feedPrice]);

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
    setSelectedSession('morning');
    setObservationMethod('submerged_tray');
    setFloatingObs('none');
    setSubmergedObs('none');
    setFodderObs('none');
    setCommonCarpMudObscured(false);
    setMagurDelayedInspection(false);
    setDissolvedOxygen('');
    setIsFishPiping(false);
    setWaterTemperature('');
    setWeatherCondition('normal');
    setHandlingCondition('none');
    setIsChemicalTreatment(false);
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
    setSelectedSession('morning');
    setObservationMethod('floating_feed');
    setFloatingObs('none');
    setSubmergedObs('none');
    setFodderObs('none');
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
    setSelectedSession('7_am');
    setObservationMethod('vannamei_check_tray');
    setTrayObservation('consumed');
    setCriticalConditions([]);
    setDissolvedOxygen('6.2');
    setIsFishPiping(false);
    setWaterTemperature('29');
    setWeatherCondition('normal');
    setHandlingCondition('none');
    setIsChemicalTreatment(false);
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
    setSelectedSession('morning');
    setObservationMethod('submerged_tray');
    setSubmergedObs('crumbs_under_10_percent');
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
    setSelectedSession('morning');
    setObservationMethod('submerged_tray');
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
    setSelectedSession('morning');
    setObservationMethod('submerged_tray');
    setFloatingObs('none');
    setSubmergedObs('none');
    setFodderObs('none');
    setCommonCarpMudObscured(false);
    setMagurDelayedInspection(false);
    setVannameiFaecalLength('short');
    setVannameiFaecalColour('feed_coloured');
    setVannameiSandPresent(false);
    setDissolvedOxygen('');
    setIsFishPiping(false);
    setWaterTemperature('');
    setWeatherCondition('normal');
    setHandlingCondition('none');
    setIsChemicalTreatment(false);
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

    const plannedSessionKg = (sessionPlan && sessionPlan.baseSessionFeed > 0)
      ? sessionPlan.baseSessionFeed
      : (calculationResult.calculatedFeed || calculationResult.dailyFeed || 0);

    const finalConfirmedFeed = confirmedFeed !== '' && !isNaN(Number(confirmedFeed))
      ? Number(confirmedFeed)
      : (sessionPlan?.proposedQuantity ?? plannedSessionKg);

    const finalActualFeed = (actualFeed !== '' && !isNaN(Number(actualFeed)) && Number(actualFeed) >= 0)
      ? Number(actualFeed)
      : null;

    const diffKg = finalActualFeed !== null
      ? Number((finalActualFeed - plannedSessionKg).toFixed(3))
      : null;

    const diffPercent = (finalActualFeed !== null && plannedSessionKg > 0)
      ? Number((((finalActualFeed - plannedSessionKg) / plannedSessionKg) * 100).toFixed(2))
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

        // Strict Session-wise fields (Section 3)
        session: selectedSession,
        session_date: sessionDate,
        session_baseline_feed: plannedSessionKg,
        proposed_feed: sessionPlan?.proposedQuantity ?? plannedSessionKg,

        // Species-specific observation fields (Section 2)
        observation_method: observationMethod,
        observation: activeObservationData?.label || (trayObservation !== 'none' ? trayObservation : ''),
        proposed_adjustment_percent: activeObservationData?.adjustmentPercent || 0,
        observation_guidance: activeObservationData?.guidance || '',
        observation_guidance_mr: activeObservationData?.guidance_mr || '',
        mud_obscured: currentSpeciesObj.id === 'common_carp' ? commonCarpMudObscured : false,
        is_magur_delayed_inspection: currentSpeciesObj.id === 'magur' ? magurDelayedInspection : false,

        // Vannamei Check-tray details (Section 6)
        check_tray_feed_g: vannameiTrayCalc?.trayFeedG ?? null,
        check_tray_rate_g_per_kg: vannameiTrayCalc?.trayRatePerKg ?? null,
        checking_interval_str: vannameiTrayCalc?.checkingInterval ?? '',
        faecal_length: isVannamei ? vannameiFaecalLength : '',
        faecal_colour: isVannamei ? vannameiFaecalColour : '',
        sand_present: isVannamei ? vannameiSandPresent : false,

        // Environmental assessment & override fields (Section 4)
        dissolved_oxygen: dissolvedOxygen ? Number(dissolvedOxygen) : null,
        is_fish_piping: isFishPiping,
        water_temperature: waterTemperature ? Number(waterTemperature) : null,
        weather_condition: weatherCondition,
        handling_condition: handlingCondition,
        is_chemical_treatment: isChemicalTreatment,
        environmental_override_reason: environmentalEval?.reason || '',

        // Feature 3: Feed accountability fields (Preserve existing keys)
        calculated_feed: plannedSessionKg,
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
        session: selectedSession,
        sessionDate,
        dailyFeed: calculationResult.dailyFeed,
        sessionBaseFeed: plannedSessionKg,
        proposedFeed: sessionPlan?.proposedQuantity ?? plannedSessionKg,
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

            {/* ========================================================================= */}
            {/* SECTION 3: STRICT FEEDING SESSION & DAY-TO-DAY MAPPING */}
            {/* ========================================================================= */}
            <div className="p-4 bg-gradient-to-br from-sky-50/90 to-teal-50/70 border-2 border-teal-500/40 rounded-2xl space-y-3">
              <div className="flex items-center justify-between border-b border-teal-200/60 pb-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-teal-700" />
                  <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    {t.observation?.sessionSchedule || (lang === 'mr' ? 'खाद्य सत्र व दैनिक मॅपिंग' : 'Feeding Session & Day-to-Day Mapping')}
                  </span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-teal-100 text-teal-900 border border-teal-300">
                  {lang === 'mr' ? 'सत्र-आधारित' : 'Strict Session-wise'}
                </span>
              </div>

              {/* Session Date & Tilapia Extended Schedule Toggle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div>
                  <label htmlFor="sessionDateInput" className="block text-[11px] font-bold text-slate-700 mb-1">
                    {lang === 'mr' ? 'सत्र तारीख:' : 'Feeding Date:'}
                  </label>
                  <input
                    id="sessionDateInput"
                    type="date"
                    value={sessionDate}
                    onChange={(e) => setSessionDate(e.target.value)}
                    className="w-full h-9 px-3 rounded-xl bg-white border border-slate-300 text-slate-900 font-semibold text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                {currentSpeciesObj.id === 'tilapia' && (
                  <div className="flex flex-col justify-end">
                    <button
                      type="button"
                      onClick={() => setIsExtendedTilapiaSchedule(!isExtendedTilapiaSchedule)}
                      className={`h-9 px-3 rounded-xl font-bold text-[11px] border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        isExtendedTilapiaSchedule
                          ? 'bg-teal-600 text-white border-teal-700 shadow-xs'
                          : 'bg-white text-teal-900 border-teal-300 hover:bg-teal-50'
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>{isExtendedTilapiaSchedule ? (lang === 'mr' ? '३–४ वेळा वेळापत्रक सक्रिय' : '3–4 Meals Active') : (lang === 'mr' ? '३–४ वेळा वेळापत्रक निवडा' : 'Enable 3–4 Meals/Day')}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Session Buttons */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                  {lang === 'mr' ? 'सक्रिय सत्र निवडा (या सत्रासाठी खाद्य मोजा):' : 'Select Active Feeding Session:'}
                </label>
                <div className={`grid gap-2 ${isVannamei || (currentSpeciesObj.id === 'tilapia' && isExtendedTilapiaSchedule) ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-2'}`}>
                  {isVannamei ? (
                    VANNAMEI_SESSIONS.map((sess) => (
                      <button
                        key={sess.id}
                        type="button"
                        onClick={() => setSelectedSession(sess.id)}
                        className={`p-2.5 rounded-xl text-center border transition-all cursor-pointer ${
                          selectedSession === sess.id
                            ? 'bg-teal-600 text-white border-teal-700 shadow-xs'
                            : 'bg-white text-slate-800 border-slate-200 hover:bg-teal-50/60'
                        }`}
                      >
                        <span className="block text-xs font-black truncate">
                          {sess.time}
                        </span>
                        <span className={`block text-[10px] mt-0.5 ${selectedSession === sess.id ? 'text-teal-100' : 'text-slate-500'}`}>
                          {lang === 'mr' ? sess.label_mr : sess.label} (25%)
                        </span>
                      </button>
                    ))
                  ) : currentSpeciesObj.id === 'tilapia' && isExtendedTilapiaSchedule ? (
                    TILAPIA_EXTENDED_SESSIONS.map((sess) => (
                      <button
                        key={sess.id}
                        type="button"
                        onClick={() => setSelectedSession(sess.id)}
                        className={`p-2.5 rounded-xl text-center border transition-all cursor-pointer ${
                          selectedSession === sess.id
                            ? 'bg-teal-600 text-white border-teal-700 shadow-xs'
                            : 'bg-white text-slate-800 border-slate-200 hover:bg-teal-50/60'
                        }`}
                      >
                        <span className="block text-xs font-black truncate">
                          {sess.time}
                        </span>
                        <span className={`block text-[10px] mt-0.5 ${selectedSession === sess.id ? 'text-teal-100' : 'text-slate-500'}`}>
                          {lang === 'mr' ? sess.label_mr : sess.label} (25%)
                        </span>
                      </button>
                    ))
                  ) : (
                    DEFAULT_SESSIONS.map((sess) => (
                      <button
                        key={sess.id}
                        type="button"
                        onClick={() => setSelectedSession(sess.id)}
                        className={`p-2.5 rounded-xl text-center border transition-all cursor-pointer ${
                          selectedSession === sess.id
                            ? 'bg-teal-600 text-white border-teal-700 shadow-xs'
                            : 'bg-white text-slate-800 border-slate-200 hover:bg-teal-50/60'
                        }`}
                      >
                        <span className="block text-xs font-black truncate flex items-center justify-center gap-1">
                          {sess.id === 'morning' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                          <span>{lang === 'mr' ? sess.label_mr : sess.label}</span>
                        </span>
                        <span className={`block text-[10px] mt-0.5 ${selectedSession === sess.id ? 'text-teal-100' : 'text-slate-500'}`}>
                          {sess.time} • 50%
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Magur Next-Morning Tray Inspection Checkbox */}
              {isMagur && (
                <div className="p-2.5 bg-amber-50/90 border border-amber-300 rounded-xl text-xs space-y-1">
                  <label className="flex items-start gap-2 cursor-pointer font-bold text-amber-950">
                    <input
                      type="checkbox"
                      checked={magurDelayedInspection}
                      onChange={(e) => setMagurDelayedInspection(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-amber-400 text-teal-600 focus:ring-teal-500"
                    />
                    <span>
                      {t.observation?.magurDelayedInspection || (lang === 'mr' ? 'माकूर रात्रकालीन आहाराची पुढील सकाळी ट्रे तपासणी' : 'Next-morning tray inspection for previous evening feeding')}
                    </span>
                  </label>
                  <p className="text-[11px] text-amber-900/90 pl-6">
                    {lang === 'mr'
                      ? 'ही तपासणी मागील संध्याकाळच्या आहाराचे निरीक्षण म्हणून नोंदवली जाते, ज्यामुळे पुढील संध्याकाळचे प्रमाण समायोजित होते (सकाळचा आहार प्रभावित होत नाही).'
                      : 'Recorded as an observation of previous evening meal; informs next evening recommendation only (never morning ration).'}
                  </p>
                </div>
              )}

              {/* Previous Session Observation Banner (Strict session isolation) */}
              <div className={`p-3 rounded-xl border text-xs space-y-1 ${
                previousSessionObs
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                  : 'bg-white/80 border-slate-200 text-slate-600'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="font-extrabold flex items-center gap-1.5">
                    {previousSessionObs ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Info className="w-4 h-4 text-slate-400" />}
                    <span>{t.observation?.prevSessionObs || (lang === 'mr' ? 'मागील जुळणाऱ्या सत्राचे निरीक्षण' : 'Previous Matching Session Observation')}</span>
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-slate-200">
                    {selectedSession.toUpperCase().replace('_', ' ')}
                  </span>
                </div>
                {previousSessionObs ? (
                  <div>
                    <p className="font-bold text-emerald-900">
                      {previousSessionObs.observation} {previousSessionObs.proposed_adjustment_percent ? `(${previousSessionObs.proposed_adjustment_percent >= 0 ? '+' : ''}${previousSessionObs.proposed_adjustment_percent}%)` : ''}
                    </p>
                    <p className="text-[11px] text-emerald-800">
                      {lang === 'mr'
                        ? `नोंद: ${previousSessionObs.session_date} च्या ${previousSessionObs.session} सत्रावरून. कठोर नियम: हे केवळ आजच्या या सत्रासाठी लागू होते.`
                        : `Learned strictly from ${previousSessionObs.session_date} ${previousSessionObs.session} session. Strictly informs this session only.`}
                    </p>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500">
                    {t.observation?.noPrevObsFound || (lang === 'mr' ? 'या सत्रासाठी कालचे निरीक्षण उपलब्ध नाही. मानक आधारभूत प्रमाण लागू राहील.' : 'No prior observation for this session on previous day. Baseline ration applied pending new observation.')}
                  </p>
                )}
              </div>
            </div>

            {/* ========================================================================= */}
            {/* SECTION 2: SPECIES-SPECIFIC OBSERVATION SYSTEM */}
            {/* ========================================================================= */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-teal-600" />
                  <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    {t.observation?.methodTitle || (lang === 'mr' ? 'प्रजाती-अनुरूप निरीक्षण पद्धत' : 'Species-Specific Observation System')}
                  </span>
                </div>
                <span className="text-[10px] text-teal-800 font-bold bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                  {currentSpeciesObj.name}
                </span>
              </div>

              {/* Observation Method Selector */}
              <div>
                <label htmlFor="obsMethodSelect" className="block text-xs font-bold text-slate-800 mb-1">
                  {lang === 'mr' ? 'निरीक्षण पद्धत:' : 'Monitoring Method:'}
                </label>
                <select
                  id="obsMethodSelect"
                  value={observationMethod}
                  onChange={(e) => setObservationMethod(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-white border border-slate-300 text-slate-900 font-semibold text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  {OBSERVATION_METHODS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {lang === 'mr' ? m.name_mr : m.name}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-500 mt-1">
                  {observationMethod === 'floating_feed' && (lang === 'mr' ? 'टिळापिया, पंगासियस आणि कतलासाठी पृष्ठभागावरील तरंगत्या गोळ्यांचे निरीक्षण.' : 'Surface floating-pellet monitoring for Tilapia, Pangasius, and Catla.')}
                  {observationMethod === 'submerged_tray' && (lang === 'mr' ? 'रोहू, म्रिगल, कॉमन कार्प आणि मागूरसाठी बुडविलेल्या ट्रेचे २–३ तासांनी निरीक्षण.' : 'Submerged sinking-feed tray monitoring after 2–3 hours for carps and catfish.')}
                  {observationMethod === 'suspended_tray' && (lang === 'mr' ? 'रोहूसाठी मध्य-स्तरावरील लटकवलेला ट्रे.' : 'Suspended mid-water tray monitoring suitable for column feeders like Rohu.')}
                  {observationMethod === 'green_fodder_frame' && (lang === 'mr' ? 'ग्रास कार्पसाठी तरंगता हिरवा चारा फ्रेम/कोठा.' : 'Floating green-fodder corral for Grass Carp.')}
                  {observationMethod === 'vannamei_check_tray' && (lang === 'mr' ? 'व्हॅनामेई कोळंबीसाठी वजनानुसार चेक-ट्रे प्रमाण व विष्ठा निरीक्षण.' : 'Avanti Feeds body-weight check-tray protocol for Vannamei shrimp.')}
                </p>
              </div>

              {/* A. FLOATING FEED OBSERVATION CHOICES */}
              {observationMethod === 'floating_feed' && (
                <div className="space-y-2 pt-1">
                  <label htmlFor="floatingObsSelect" className="block text-xs font-bold text-teal-950">
                    {t.observation?.floatingFeedObs || (lang === 'mr' ? 'तरंगते खाद्य निरीक्षण (प्रसारणानंतर):' : 'Floating-Feed Pellet Observation:')}
                  </label>
                  <select
                    id="floatingObsSelect"
                    value={floatingObs}
                    onChange={(e) => setFloatingObs(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl bg-white border border-teal-300 text-slate-900 font-bold text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="none">{lang === 'mr' ? '-- निरीक्षण निवडा --' : '-- Select Observation --'}</option>
                    {FLOATING_FEED_OBSERVATIONS.map((obs) => (
                      <option key={obs.id} value={obs.id}>
                        {lang === 'mr' ? obs.label_mr : obs.label}
                      </option>
                    ))}
                  </select>
                  {floatingObs !== 'none' && activeObservationData && (
                    <div className="p-2.5 bg-teal-50 border border-teal-200 rounded-xl text-xs space-y-1">
                      <div className="flex items-center justify-between font-bold text-teal-950">
                        <span>{lang === 'mr' ? 'प्रस्तावित कृती:' : 'Proposed Action:'}</span>
                        <span className="text-teal-800 font-black">{activeObservationData.action}</span>
                      </div>
                      {floatingObs === 'unclassified_floating' && (
                        <p className="text-[11px] text-amber-900 font-medium">
                          {lang === 'mr'
                            ? '⚠️ १०–१५ मिनिटे किंवा १५–२०% शिल्लक खाद्य ही अवर्गीकृत श्रेणी आहे. कोणताही मनमानी दर न लावता शेतकऱ्याने निर्णय घ्यावा; सुरक्षित आधारभूत प्रमाण कायम राहील.'
                            : '⚠️ Unclassified gap range (10–15 min or 15–20% uneaten). Farmer review required; safe baseline retained pending confirmation.'}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* B. SUBMERGED / SUSPENDED TRAY OBSERVATION CHOICES */}
              {(observationMethod === 'submerged_tray' || observationMethod === 'suspended_tray') && (
                <div className="space-y-2 pt-1">
                  <label htmlFor="submergedObsSelect" className="block text-xs font-bold text-teal-950">
                    {t.observation?.submergedTrayObs || (lang === 'mr' ? 'बुडविलेला ट्रे निरीक्षण (२–३ तासांनंतर):' : 'Submerged Tray Observation (after 2–3h):')}
                  </label>
                  <select
                    id="submergedObsSelect"
                    value={submergedObs}
                    onChange={(e) => setSubmergedObs(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl bg-white border border-teal-300 text-slate-900 font-bold text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="none">{lang === 'mr' ? '-- निरीक्षण निवडा --' : '-- Select Observation --'}</option>
                    {SUBMERGED_TRAY_OBSERVATIONS.map((obs) => (
                      <option key={obs.id} value={obs.id}>
                        {lang === 'mr' ? obs.label_mr : obs.label}
                      </option>
                    ))}
                  </select>
                  {submergedObs !== 'none' && activeObservationData && (
                    <div className="p-2.5 bg-teal-50 border border-teal-200 rounded-xl text-xs space-y-1">
                      <div className="flex items-center justify-between font-bold text-teal-950">
                        <span>{lang === 'mr' ? 'प्रस्तावित कृती:' : 'Proposed Action:'}</span>
                        <span className="text-teal-800 font-black">{activeObservationData.action}</span>
                      </div>
                      {submergedObs === 'unclassified_submerged' && (
                        <p className="text-[11px] text-amber-900 font-medium">
                          {lang === 'mr'
                            ? '⚠️ २५–५०% शिल्लक खाद्य ही अवर्गीकृत श्रेणी आहे. कोणताही मनमानी दर न लावता शेतकऱ्याने निर्णय घ्यावा; सुरक्षित आधारभूत प्रमाण कायम राहील.'
                            : '⚠️ Unclassified 25–50% remaining range. Farmer review required; safe baseline retained.'}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Common Carp Mud Obscured Checkbox */}
                  {currentSpeciesObj.id === 'common_carp' && (
                    <div className="p-2.5 bg-amber-50/80 border border-amber-300 rounded-xl text-xs space-y-1">
                      <label className="flex items-center gap-2 cursor-pointer font-bold text-amber-950">
                        <input
                          type="checkbox"
                          checked={commonCarpMudObscured}
                          onChange={(e) => setCommonCarpMudObscured(e.target.checked)}
                          className="h-4 w-4 rounded border-amber-400 text-teal-600 focus:ring-teal-500"
                        />
                        <span>{t.observation?.mudObscured || (lang === 'mr' ? 'चिखलामुळे शिल्लक खाद्य अस्पष्ट दिसत आहे' : 'Mud/silt obscures uneaten feed')}</span>
                      </label>
                      <p className="text-[10px] text-amber-900/90 pl-6">
                        {lang === 'mr'
                          ? 'कॉमन कार्प तळाशी अन्न शोधताना चिखल ढवळून टाकते, ज्यामुळे शिल्लक खाद्य झाकले जाऊ शकते.'
                          : 'Common carp bottom foraging stirs up mud which can obscure uneaten feed on trays.'}
                      </p>
                    </div>
                  )}

                  {/* Magur Sinking Feed Reminder */}
                  {isMagur && (
                    <p className="text-[11px] text-amber-900 font-semibold bg-amber-50 p-2 rounded-lg border border-amber-200">
                      ⚠️ {lang === 'mr' ? 'मागूर सूचना: उच्च प्रथिनयुक्त न खाल्लेले बुडणारे खाद्य पाणी दूषित होण्यापूर्वी काढून टाका.' : 'Catfish note: Promptly remove uneaten high-protein sinking feed to avoid water fouling.'}
                    </p>
                  )}
                </div>
              )}

              {/* C. GREEN FODDER OBSERVATION (Grass Carp) */}
              {observationMethod === 'green_fodder_frame' && (
                <div className="space-y-2 pt-1">
                  <label htmlFor="fodderObsSelect" className="block text-xs font-bold text-emerald-950">
                    {t.observation?.greenFodderObs || (lang === 'mr' ? 'हिरवा चारा फ्रेम निरीक्षण (१२ तासांनंतर):' : 'Green Fodder Frame Observation:')}
                  </label>
                  <select
                    id="fodderObsSelect"
                    value={fodderObs}
                    onChange={(e) => setFodderObs(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl bg-white border border-emerald-300 text-slate-900 font-bold text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="none">{lang === 'mr' ? '-- निरीक्षण निवडा --' : '-- Select Observation --'}</option>
                    {GREEN_FODDER_OBSERVATIONS.map((obs) => (
                      <option key={obs.id} value={obs.id}>
                        {lang === 'mr' ? obs.label_mr : obs.label}
                      </option>
                    ))}
                  </select>
                  {fodderObs === 'fodder_remains_over_12h' && (
                    <div className="p-3 bg-rose-50 border-2 border-rose-300 rounded-xl text-xs space-y-1 text-rose-950 font-bold">
                      <div className="flex items-center gap-1.5 text-rose-700">
                        <AlertOctagon className="w-4 h-4 shrink-0" />
                        <span>{lang === 'mr' ? 'गंभीर सूचना: १२ तासांनंतरही चारा शिल्लक!' : 'Alert: Fodder Remains After 12 Hours!'}</span>
                      </div>
                      <p className="text-[11px] text-rose-900 font-medium">
                        {lang === 'mr'
                          ? 'तळ्याची स्थिती तपासेपर्यंत नवीन ताजा चारा टाकू नका. पूरक गोळी खाद्याचे वेगळे निरीक्षण करा.'
                          : 'Flagged condition: Do not add fresh green fodder until pond condition is reviewed. Monitor supplementary pellets separately.'}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* D. VANNAMEI CHECK-TRAY SPECIFIC CALCULATIONS & INDICATORS */}
              {isVannamei && (
                <div className="space-y-3 pt-2 border-t border-slate-200">
                  {/* Tray Feed Grams & Interval Calculation Card */}
                  {vannameiTrayCalc && (
                    <div className="p-3 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-300 rounded-xl text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-orange-950 flex items-center gap-1">
                          <Scale className="w-3.5 h-3.5 text-orange-700" />
                          <span>{t.observation?.checkTrayGrams || (lang === 'mr' ? 'चेक-ट्रे खाद्य नमुना:' : 'Check-Tray Feed Sample:')}</span>
                        </span>
                        <span className="text-base font-black text-orange-950 bg-white px-2.5 py-0.5 rounded-lg border border-orange-300">
                          {vannameiTrayCalc.trayFeedG} g / tray
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-orange-900 border-t border-orange-200/70 pt-1">
                        <span>{lang === 'mr' ? 'तपासणी वेळ:' : 'Checking Interval:'} <strong className="font-bold">{vannameiTrayCalc.checkingInterval}</strong></span>
                        <span className="text-[10px] text-orange-800">({vannameiTrayCalc.trayRatePerKg} g/kg feed)</span>
                      </div>
                      <p className="text-[10px] text-orange-900/80 italic leading-snug">
                        {lang === 'mr'
                          ? '* हा ट्रे नमुना केवळ निरीक्षणासाठी आहे. तळ्याच्या दैनंदिन आहारात अतिरिक्त खाद्य म्हणून जोडला जात नाही.'
                          : '* Tray quantity is a monitoring sample only; not added to the pond\'s daily feed requirement as extra feed.'}
                      </p>
                    </div>
                  )}

                  {/* Initial Response Note */}
                  <div className="p-2 bg-blue-50/80 border border-blue-200 rounded-lg text-[11px] text-blue-900">
                    <strong>ℹ️ {lang === 'mr' ? 'सुरुवातीचा प्रतिसाद:' : 'Initial Response:'}</strong>{' '}
                    {lang === 'mr'
                      ? (VANNAMEI_INITIAL_RESPONSE_NOTE?.mr || VANNAMEI_INITIAL_RESPONSE_NOTE?.en)
                      : (VANNAMEI_INITIAL_RESPONSE_NOTE?.en || VANNAMEI_INITIAL_RESPONSE_NOTE?.mr)}
                  </div>

                  {/* Faecal Length & Colour & Sand Indicators */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label htmlFor="faecalLenSelect" className="block text-[11px] font-bold text-slate-700 mb-1">
                        {lang === 'mr' ? 'विष्ठा लांबी:' : 'Faecal Length:'}
                      </label>
                      <select
                        id="faecalLenSelect"
                        value={vannameiFaecalLength}
                        onChange={(e) => setVannameiFaecalLength(e.target.value)}
                        className="w-full h-9 px-2 rounded-lg bg-white border border-slate-300 text-xs font-semibold"
                      >
                        <option value="short">{lang === 'mr' ? 'लहान (योग्य आहार)' : 'Short (Proper feeding)'}</option>
                        <option value="long">{lang === 'mr' ? 'लांब/पूर्ण (संभाव्य अतिखाद्य)' : 'Long/Full (Possible overfeeding)'}</option>
                        <option value="normal">{lang === 'mr' ? 'सामान्य' : 'Normal'}</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="faecalColSelect" className="block text-[11px] font-bold text-slate-700 mb-1">
                        {lang === 'mr' ? 'विष्ठा रंग:' : 'Faecal Colour:'}
                      </label>
                      <select
                        id="faecalColSelect"
                        value={vannameiFaecalColour}
                        onChange={(e) => setVannameiFaecalColour(e.target.value)}
                        className="w-full h-9 px-2 rounded-lg bg-white border border-slate-300 text-xs font-semibold"
                      >
                        <option value="feed_coloured">{lang === 'mr' ? 'खाद्यासारखा (योग्य)' : 'Feed-coloured (Proper)'}</option>
                        <option value="dark_brown">{lang === 'mr' ? 'गडद तपकिरी/काळा (संभाव्य कमी)' : 'Dark-brown/black (Underfeed)'}</option>
                        <option value="normal">{lang === 'mr' ? 'सामान्य' : 'Normal'}</option>
                      </select>
                    </div>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800">
                    <input
                      type="checkbox"
                      checked={vannameiSandPresent}
                      onChange={(e) => setVannameiSandPresent(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                    />
                    <span>{t.observation?.sandPresent || (lang === 'mr' ? 'ट्रेमध्ये वाळू किंवा लहान खडे आढळले (संभाव्य कमी अन्नाचे लक्षण)' : 'Sand or small pebbles in tray (Possible underfeeding indicator)')}</span>
                  </label>
                </div>
              )}

              {/* Shared Generic Tray Observation Dropdown */}
              <div className="pt-2 border-t border-slate-200">
                <label htmlFor="traySelect" className="block text-xs font-bold text-slate-800 mb-1">
                  {t.feedTracking?.trayObservation || (lang === 'mr' ? 'खाद्य शिल्लक स्थिती (सर्वसामान्य):' : 'Tray Consumption Status:')}
                </label>
                <select
                  id="traySelect"
                  value={trayObservation}
                  onChange={(e) => setTrayObservation(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-white border border-slate-300 text-slate-900 font-semibold text-xs focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
                >
                  {FEEDING_TRAY_OBSERVATIONS.map((obs) => (
                    <option key={obs.id} value={obs.id}>
                      {lang === 'mr' ? obs.label_mr : obs.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* SECTION 4: ENVIRONMENTAL ASSESSMENT & OVERRIDE SAFETY HIERARCHY */}
            {/* ========================================================================= */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowEnvironmentalPanel(!showEnvironmentalPanel)}
                  className="flex items-center gap-2 text-left font-black text-xs text-slate-900 uppercase tracking-wider cursor-pointer hover:text-teal-700"
                >
                  <Activity className="w-4 h-4 text-teal-600" />
                  <span>{t.environmental?.title || (lang === 'mr' ? 'पर्यावरणीय मूल्यमापन व सुरक्षित नियम' : 'Environmental Assessment & Overrides')}</span>
                  <span className="text-[10px] text-slate-400 font-normal">({showEnvironmentalPanel ? (lang === 'mr' ? 'बंद करा' : 'Hide') : (lang === 'mr' ? 'पहा / भरा' : 'Show')})</span>
                </button>
                {environmentalEval?.hasOverride ? (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    environmentalEval.isCritical
                      ? 'bg-rose-100 text-rose-900 border border-rose-300'
                      : 'bg-amber-100 text-amber-900 border border-amber-300'
                  }`}>
                    {environmentalEval.isCritical ? (lang === 'mr' ? '⚠️ आहार थांबवा' : '⚠️ Halt Meal') : `${environmentalEval.adjustmentPercent}% ${lang === 'mr' ? 'कपात' : 'Cut'}`}
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                    {lang === 'mr' ? 'सामान्य' : 'Normal'}
                  </span>
                )}
              </div>

              {/* Collapsible Content */}
              {showEnvironmentalPanel && (
                <div className="space-y-3 pt-2 border-t border-slate-200 animate-fadeIn">
                  {/* Dissolved Oxygen & Fish Piping */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div>
                      <label htmlFor="doInput" className="block text-[11px] font-bold text-slate-700 mb-1">
                        {t.environmental?.dissolvedOxygen || (lang === 'mr' ? 'विद्राव्य प्राणवायू (DO mg/L):' : 'Dissolved Oxygen (DO mg/L):')}
                      </label>
                      <input
                        id="doInput"
                        type="number"
                        step="0.1"
                        min="0"
                        value={dissolvedOxygen}
                        onChange={(e) => setDissolvedOxygen(e.target.value)}
                        placeholder="e.g. 5.5"
                        className="w-full h-9 px-3 rounded-xl bg-white border border-slate-300 text-slate-900 font-bold text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>

                    <div className="flex items-center pt-5">
                      <label className="flex items-center gap-2 cursor-pointer font-bold text-rose-900 text-xs">
                        <input
                          type="checkbox"
                          checked={isFishPiping}
                          onChange={(e) => setIsFishPiping(e.target.checked)}
                          className="h-4 w-4 rounded border-rose-400 text-rose-600 focus:ring-rose-500"
                        />
                        <span>{t.environmental?.fishPiping || (lang === 'mr' ? 'मासे पृष्ठभागावर हवेसाठी धडपडत आहेत' : 'Fish piping/gasping at surface')}</span>
                      </label>
                    </div>
                  </div>

                  {/* Water Temperature */}
                  <div>
                    <label htmlFor="tempInput" className="block text-[11px] font-bold text-slate-700 mb-1">
                      {t.environmental?.temperature || (lang === 'mr' ? 'पाण्याचे तापमान (°C):' : 'Water Temperature (°C):')}
                    </label>
                    <input
                      id="tempInput"
                      type="number"
                      step="0.5"
                      value={waterTemperature}
                      onChange={(e) => setWaterTemperature(e.target.value)}
                      placeholder="e.g. 28.0"
                      className="w-full h-9 px-3 rounded-xl bg-white border border-slate-300 text-slate-900 font-bold text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  {/* Weather, Handling, Chemical Treatment */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div>
                      <label htmlFor="weatherSelect" className="block text-[11px] font-bold text-slate-700 mb-1">
                        {t.environmental?.weather || (lang === 'mr' ? 'हवामान स्थिती:' : 'Weather Condition:')}
                      </label>
                      <select
                        id="weatherSelect"
                        value={weatherCondition}
                        onChange={(e) => setWeatherCondition(e.target.value)}
                        className="w-full h-9 px-2 rounded-lg bg-white border border-slate-300 text-xs font-semibold"
                      >
                        <option value="normal">{lang === 'mr' ? 'सामान्य सूर्यप्रकाश / सौम्य' : 'Normal / Sunny'}</option>
                        <option value="overcast_heavy_rain">{lang === 'mr' ? 'सतत ढगाळ किंवा मुसळधार पाऊस' : 'Continuous Overcast / Heavy Rain'}</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="handlingSelect" className="block text-[11px] font-bold text-slate-700 mb-1">
                        {t.environmental?.handling || (lang === 'mr' ? 'मासे हाताळणी / जाळे ओढणे:' : 'Handling / Netting:')}
                      </label>
                      <select
                        id="handlingSelect"
                        value={handlingCondition}
                        onChange={(e) => setHandlingCondition(e.target.value)}
                        className="w-full h-9 px-2 rounded-lg bg-white border border-slate-300 text-xs font-semibold"
                      >
                        <option value="none">{lang === 'mr' ? 'काहीही नाही' : 'None'}</option>
                        <option value="recently_netted">{lang === 'mr' ? 'आज जाळे ओढले / नमुना घेतला' : 'Recently netted / sampled / harvested'}</option>
                      </select>
                    </div>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800">
                    <input
                      type="checkbox"
                      checked={isChemicalTreatment}
                      onChange={(e) => setIsChemicalTreatment(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                    />
                    <span>{t.environmental?.treatmentDay || (lang === 'mr' ? 'आज रासायनिक किंवा औषधी उपचार केले आहेत' : 'Chemical or therapeutic treatment day')}</span>
                  </label>
                </div>
              )}

              {/* Transparent Safety Hierarchy Status Banner (Section 4) */}
              <div className="p-3 bg-white border border-slate-200 rounded-xl text-xs space-y-1">
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span className="text-slate-500 uppercase tracking-wider">
                    {lang === 'mr' ? 'पारदर्शक सुरक्षा प्राधान्यक्रम:' : 'Safety Override Precedence:'}
                  </span>
                  <span className="font-extrabold text-teal-800">
                    {sessionPlan?.hierarchyName || 'Fishry Base'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-800 font-semibold leading-snug">
                  {environmentalEval?.hasOverride 
                    ? environmentalEval.reason 
                    : (lang === 'mr' 
                        ? 'कोणताही पर्यावरणीय अधिलिखित नियम लागू नाही (आदर्श स्थिती गृहीत न धरता; आधारभूत गणना सक्रिय).' 
                        : 'No environmental override applied (not assuming ideal conditions; baseline calculation active).')}
                </p>
              </div>
            </div>

            {/* VANNAMEI CRITICAL POND CONDITIONS (Preserved from existing scope) */}
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

                {/* 2. Feeding Sessions Breakdown */}
                {isVannamei ? (
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-teal-200 block uppercase tracking-wider">
                      {lang === 'mr' ? 'व्हॅनामेई ४ दैनिक सत्रे (प्रत्येकी २५%):' : 'Vannamei 4 Daily Sessions (25% each):'}
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {VANNAMEI_SESSIONS.map((sess) => {
                        const sessKg = (calculationResult.calculatedFeed || calculationResult.dailyFeed || 0) * 0.25;
                        const trayG = vannameiTrayCalc ? Math.round(sessKg * vannameiTrayCalc.trayRatePerKg) : 0;
                        const isCurrent = selectedSession === sess.id;
                        return (
                          <div
                            key={sess.id}
                            className={`p-2.5 rounded-xl border text-center transition-all ${
                              isCurrent
                                ? 'bg-amber-400/20 border-amber-300 text-amber-200 shadow-xs'
                                : 'bg-white/5 border-white/10 text-white'
                            }`}
                          >
                            <span className="block text-[11px] font-bold text-teal-200">{sess.time}</span>
                            <span className="block text-sm font-extrabold">{formatDisplayNumber(sessKg, 2)} kg</span>
                            <span className="block text-[10px] text-amber-300">Tray: {trayG}g</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
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
                )}

                {/* Active Selected Session Card */}
                {sessionPlan && (
                  <div className="p-3 bg-white/10 rounded-2xl border border-white/20 text-xs space-y-1.5">
                    <div className="flex items-center justify-between text-teal-200 font-bold">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-amber-300" />
                        <span>{lang === 'mr' ? 'निवडलेले सक्रिय सत्र:' : 'Selected Session Plan:'} {selectedSession.toUpperCase().replace('_', ' ')}</span>
                      </span>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-teal-500/30 text-teal-100 border border-teal-400/40">
                        {sessionPlan.hierarchyName}
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between text-white font-extrabold">
                      <span className="text-[11px] text-teal-100">{lang === 'mr' ? 'सत्र आधारभूत / प्रस्तावित:' : 'Session Base / Proposed:'}</span>
                      <span className="text-lg text-amber-300">
                        {formatDisplayNumber(sessionPlan.baseSessionFeed, 2)} kg → {formatDisplayNumber(sessionPlan.proposedQuantity, 2)} kg
                      </span>
                    </div>
                    <p className="text-[10px] text-teal-100/90 leading-tight">
                      {sessionPlan.reason}
                    </p>
                  </div>
                )}

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
                    1. {t.feedTracking?.calculatedRequired || (lang === 'mr' ? 'आवश्यक गणना केलेले खाद्य (सत्र आधारभूत)' : 'Calculated Feed Required (Session Baseline)')}:
                  </span>
                  <span className="font-mono text-slate-500 font-medium">
                    {selectedSession.toUpperCase().replace('_', ' ')}
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-2xl font-black text-slate-900">
                      {formatDisplayNumber(sessionPlan?.baseSessionFeed ?? (calculationResult.calculatedFeed || calculationResult.dailyFeed), 2)}{' '}
                      <span className="text-xs font-normal text-slate-500">kg/session</span>
                    </span>
                    <span className="block text-[11px] text-slate-500 mt-0.5">
                      {lang === 'mr' ? 'दैनिक एकूण:' : 'Daily baseline:'} {formatDisplayNumber(calculationResult.calculatedFeed || calculationResult.dailyFeed, 2)} kg/day
                    </span>
                  </div>
                  {calculationResult.feedPriceNum > 0 && (
                    <span className="text-xs font-semibold text-slate-500 text-right">
                      ≈ ₹{formatDisplayNumber(((sessionPlan?.baseSessionFeed || 0) * (Number(feedPrice) || 0)), 0)}
                      <span className="block text-[10px] text-slate-400">
                        ({lang === 'mr' ? 'दैनिक ₹' : 'Daily ₹'}{formatDisplayNumber(calculationResult.dailyFeedCost, 0)})
                      </span>
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
                {lang === 'mr' ? 'सत्र नोंद यशस्वीरित्या जतन झाली!' : 'Feed Record Logged Successfully!'}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {savedModalInfo.pondName} • {savedModalInfo.species} • <strong className="text-teal-700 font-bold">{savedModalInfo.session?.toUpperCase().replace('_', ' ')}</strong> ({savedModalInfo.sessionDate})
              </p>
            </div>

            {/* Quick Numbers Card with 3-tier Accountability */}
            <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-3.5 space-y-2 text-left text-xs">
              <div className="flex items-center justify-between border-b border-emerald-200/60 pb-1.5">
                <span className="text-slate-600">{t.feedTracking?.calculatedRequired || (lang === 'mr' ? 'सत्र आधारभूत खाद्य:' : 'Session Base Feed:')}</span>
                <span className="font-bold text-slate-900">{formatDisplayNumber(savedModalInfo.sessionBaseFeed, 2)} kg <span className="text-[10px] text-slate-400 font-normal">({lang === 'mr' ? 'दैनिक' : 'daily'} {formatDisplayNumber(savedModalInfo.dailyFeed, 2)}kg)</span></span>
              </div>
              <div className="flex items-center justify-between border-b border-emerald-200/60 pb-1.5">
                <span className="text-slate-600">{lang === 'mr' ? 'प्रस्तावित / निश्चित प्रमाण:' : 'Proposed / Confirmed:'}</span>
                <span className="font-extrabold text-teal-900">{formatDisplayNumber(savedModalInfo.proposedFeed, 2)} kg → {formatDisplayNumber(savedModalInfo.confirmedFeed, 2)} kg</span>
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
