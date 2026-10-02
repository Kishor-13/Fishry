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
  Layers
} from 'lucide-react';
import { SPECIES_LIST, CULTURE_STAGES } from '../data/speciesData';
import { calculateFeed } from '../services/calculationService';
import { formatNumber, formatDisplayNumber } from '../utils/formatting';
import { translations } from '../data/translations';

export default function FeedCalculator({
  lang,
  rulesList,
  onSaveRecord,
}) {
  const t = translations[lang];

  // Farmer Observation Inputs
  const [selectedSpeciesId, setSelectedSpeciesId] = useState('rohu');
  const [cultureStage, setCultureStage] = useState('Rearing');
  const [stocked, setStocked] = useState('10000');
  const [survivalPercent, setSurvivalPercent] = useState('85');
  const [averageWeight, setAverageWeight] = useState('50');
  const [feedPrice, setFeedPrice] = useState('40');
  const [cultureMonth, setCultureMonth] = useState('1');
  const [manualRate, setManualRate] = useState('');

  // UI state
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Find species object
  const currentSpeciesObj = useMemo(() => {
    return SPECIES_LIST.find((s) => s.id === selectedSpeciesId) || SPECIES_LIST[0];
  }, [selectedSpeciesId]);

  const isCustomSpecies = currentSpeciesObj.id === 'custom';

  // Handle Species Change: CRITICAL CUSTOM SPECIES RULE (Section 3)
  const handleSpeciesChange = (newSpeciesId) => {
    setSelectedSpeciesId(newSpeciesId);
    setIsSaved(false);

    const newObj = SPECIES_LIST.find((s) => s.id === newSpeciesId);
    if (!newObj?.isCustom) {
      // Switched to predefined: clear manual feeding-rate field & value
      setManualRate('');
    } else {
      // Switched to custom: prompt or initialize empty for farmer
      if (!manualRate) {
        setManualRate('');
      }
    }
  };

  // Real-time calculation calculation hook
  const calculationResult = useMemo(() => {
    return calculateFeed({
      species: currentSpeciesObj.name,
      isCustom: isCustomSpecies,
      cultureStage,
      stocked,
      survivalPercent,
      averageWeight,
      feedPrice,
      cultureMonth: currentSpeciesObj.needsMonth ? cultureMonth : null,
      manualRate: isCustomSpecies ? manualRate : null,
      rulesList,
    });
  }, [
    currentSpeciesObj,
    isCustomSpecies,
    cultureStage,
    stocked,
    survivalPercent,
    averageWeight,
    feedPrice,
    cultureMonth,
    manualRate,
    rulesList,
  ]);

  // Reset saved toast when inputs change
  useEffect(() => {
    setIsSaved(false);
  }, [selectedSpeciesId, cultureStage, stocked, survivalPercent, averageWeight, feedPrice, cultureMonth, manualRate]);

  // Quick Preset Sample Loader (For convenient verification of Section 28 & 29)
  const loadRohuPreset = () => {
    setSelectedSpeciesId('rohu');
    setCultureStage('Rearing');
    setStocked('10000');
    setSurvivalPercent('85');
    setAverageWeight('50');
    setFeedPrice('40');
    setManualRate('');
  };

  const loadCustomPreset = () => {
    setSelectedSpeciesId('custom');
    setCultureStage('Grow-out');
    setStocked('5000');
    setSurvivalPercent('90');
    setAverageWeight('100');
    setFeedPrice('40');
    setManualRate('3');
  };

  const handleReset = () => {
    setSelectedSpeciesId('rohu');
    setCultureStage('Rearing');
    setStocked('');
    setSurvivalPercent('');
    setAverageWeight('');
    setFeedPrice('');
    setCultureMonth('1');
    setManualRate('');
    setIsSaved(false);
  };

  const handleSave = async () => {
    if (!calculationResult.isValid || isSaving) return;

    setIsSaving(true);
    try {
      await onSaveRecord({
        species: currentSpeciesObj.name,
        scientific_name: currentSpeciesObj.scientific_name,
        culture_stage: cultureStage,
        culture_month: currentSpeciesObj.needsMonth ? Number(cultureMonth) : null,
        stocked: Number(stocked),
        survival_percent: Number(survivalPercent),
        average_weight: Number(averageWeight),
        surviving_fish: calculationResult.survivingFish,
        feeding_rate: calculationResult.feedingRate,
        feeding_method: calculationResult.rule?.feeding_method || (isCustomSpecies ? 'MANUAL' : 'BIOMASS_PERCENT'),
        rate_source: calculationResult.rateSource,
        rule_explanation: calculationResult.ruleExplanation,
        rule_explanation_mr: calculationResult.ruleExplanation_mr,
        biomass: calculationResult.biomass,
        daily_feed: calculationResult.dailyFeed,
        morning_feed: calculationResult.morningFeed,
        evening_feed: calculationResult.eveningFeed,
        feed_price: Number(feedPrice) || 0,
        feed_cost: calculationResult.dailyFeedCost,
        rule_id: calculationResult.rule?.id || null,
      });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 4000);
    } catch (err) {
      console.error('Error saving record:', err);
    } finally {
      setIsSaving(false);
    }
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
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <span className="text-[11px] font-semibold text-slate-400">
            {lang === 'mr' ? 'उदाहरणे:' : 'Examples:'}
          </span>
          <button
            onClick={loadRohuPreset}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 transition-colors"
            title="Load Section 28 Rohu Example (8,500 fish, 425kg biomass, 29.75kg feed)"
          >
            {lang === 'mr' ? 'रोहू उदाहरण (Sec 28)' : 'Rohu (Sec 28)'}
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

      {/* Main Two-Column Layout on Desktop, Single Column on Mobile */}
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
              className="text-xs font-medium text-slate-400 hover:text-slate-700 flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{t.calculator.resetBtn}</span>
            </button>
          </div>

          <div className="space-y-4 text-left">
            
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
                onChange={(e) => setCultureStage(e.target.value)}
                className="w-full h-12 px-3.5 pr-8 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-semibold text-sm sm:text-base focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all cursor-pointer shadow-xs"
              >
                {CULTURE_STAGES.map((st) => (
                  <option key={st.id} value={st.id}>
                    {lang === 'mr' ? st.name_mr : st.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Conditional Input: Culture Period / Month (for Pangasius) */}
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
                      className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all ${
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

            {/* 3. Number Stocked */}
            <div>
              <label htmlFor="stockedInput" className="block text-xs sm:text-sm font-bold text-slate-800 mb-1.5">
                {t.calculator.stockedLabel} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="stockedInput"
                  name="stockedInput"
                  type="number"
                  inputMode="numeric"
                  value={stocked}
                  onChange={(e) => setStocked(e.target.value)}
                  placeholder={t.calculator.stockedPlaceholder}
                  min="1"
                  step="1"
                  className="w-full h-12 px-3.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-bold text-base sm:text-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all shadow-xs"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 uppercase pointer-events-none">
                  {lang === 'mr' ? 'नग' : 'fish'}
                </span>
              </div>
              {/* Quick Stock Chips */}
              <div className="flex items-center gap-1.5 pt-1.5 flex-wrap">
                {['2000', '5000', '10000', '20000'].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setStocked(val)}
                    className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold border transition-all ${
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
                {t.calculator.stockedHelp}
              </p>
            </div>

            {/* 4. Survival % & 5. Average Weight (2-col grid on larger screens) */}
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
                {/* Quick Survival Chips */}
                <div className="flex items-center gap-1.5 pt-1.5 flex-wrap">
                  {['75', '80', '85', '90', '95'].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setSurvivalPercent(val)}
                      className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold border transition-all ${
                        survivalPercent === val
                          ? 'bg-teal-600 text-white border-teal-700 shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                      }`}
                    >
                      {val}%
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-slate-500 mt-1 ml-0.5">
                  {t.calculator.survivalHelp}
                </p>
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
                {/* Quick Weight Chips */}
                <div className="flex items-center gap-1.5 pt-1.5 flex-wrap">
                  {['10', '25', '50', '100', '250', '500'].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setAverageWeight(val)}
                      className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold border transition-all ${
                        averageWeight === val
                          ? 'bg-teal-600 text-white border-teal-700 shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                      }`}
                    >
                      {val}g
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-slate-500 mt-1 ml-0.5">
                  {t.calculator.weightHelp}
                </p>
              </div>

            </div>

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
              {/* Quick Price Chips */}
              <div className="flex items-center gap-1.5 pt-1.5 flex-wrap">
                {['35', '40', '42.5', '45', '50'].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setFeedPrice(val)}
                    className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold border transition-all ${
                      feedPrice === val
                        ? 'bg-teal-600 text-white border-teal-700 shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                    }`}
                  >
                    ₹{val}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-500 mt-1 ml-0.5">
                {t.calculator.feedPriceHelp}
              </p>
            </div>

            {/* CRITICAL EXCEPTION: OTHER / CUSTOM MANUAL FEEDING RATE (Section 3 & 10) */}
            {isCustomSpecies && (
              <div className="p-4 bg-amber-50 border-2 border-amber-400 rounded-2xl space-y-2 animate-fadeIn">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
                  <label htmlFor="manualRateInput" className="block text-sm font-extrabold text-amber-950">
                    {t.calculator.manualRateLabel} <span className="text-red-500">*</span>
                  </label>
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
                    className="w-full h-12 px-3.5 rounded-xl bg-white border-2 border-amber-400 text-amber-950 font-extrabold text-lg focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-sm"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-base font-extrabold text-amber-700 pointer-events-none">
                    %
                  </span>
                </div>

                <div className="text-xs text-amber-900 font-medium space-y-0.5 pt-1">
                  <p className="font-semibold text-amber-800">
                    {t.calculator.manualRateEnteredByFarmer}
                  </p>
                  <p className="text-[11px] text-amber-700">
                    {lang === 'mr' ? 'स्रोत: ' : 'Source: '}
                    <span className="font-bold underline">{t.calculator.sourceFarmerEntered}</span>
                  </p>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* RIGHT COLUMN: CALCULATED RESULTS & EXPLANATION */}
        <div className="lg:col-span-6 space-y-4">
          
          {/* Main Calculation Card */}
          <div className="bg-gradient-to-br from-teal-900 via-teal-800 to-emerald-950 rounded-3xl p-5 sm:p-7 text-white shadow-card-hover border border-teal-700/50 relative overflow-hidden">
            
            {/* Card Background Glow */}
            <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 w-56 h-56 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Card Header & Auto-Badge */}
            <div className="flex items-center justify-between gap-2 border-b border-teal-700/60 pb-3.5 mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-300" />
                <span className="text-sm sm:text-base font-bold text-white tracking-wide">
                  {t.calculator.resultsTitle}
                </span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-200 border border-teal-400/30 text-[11px] font-semibold">
                {isCustomSpecies ? t.calculator.sourceFarmerEntered : (lang === 'mr' ? 'स्वयंचलित' : 'Automatic')}
              </span>
            </div>

            {/* Handling Special Cases & Incomplete Form */}
            {calculationResult.isIncomplete ? (
              <div className="py-12 px-4 text-center space-y-2">
                <Info className="w-10 h-10 text-teal-300/60 mx-auto" />
                <p className="text-sm font-semibold text-teal-100 max-w-xs mx-auto">
                  {t.calculator.incompleteForm}
                </p>
              </div>
            ) : calculationResult.specialStatus === 'NEEDS_SPAWN_WEIGHT' ? (
              /* Section 18: Nursery spawn weight alert */
              <div className="py-6 px-4 bg-teal-950/60 rounded-2xl border border-amber-400/40 space-y-3">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-amber-300 text-sm sm:text-base">
                      {t.calculator.nurserySpawnNote}
                    </h4>
                    <p className="text-xs text-teal-100/90 mt-1 leading-relaxed">
                      {t.calculator.nurserySpawnSubnote}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-teal-800 text-xs">
                  <div>
                    <span className="text-teal-300">{t.calculator.survivingFish}:</span>
                    <p className="font-bold text-white text-base">
                      {formatDisplayNumber(calculationResult.survivingFish, 0)} {t.calculator.fishCount}
                    </p>
                  </div>
                  <div>
                    <span className="text-teal-300">{t.calculator.averageBiomass}:</span>
                    <p className="font-bold text-white text-base">
                      {formatDisplayNumber(calculationResult.biomass, 2)} kg
                    </p>
                  </div>
                </div>
              </div>
            ) : calculationResult.specialStatus === 'VERIFIED_PROTOCOL' ? (
              /* Section 24: Magur Verified Protocol alert */
              <div className="py-6 px-4 bg-teal-950/60 rounded-2xl border border-amber-400/40 space-y-3">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-amber-300 text-sm sm:text-base">
                      {t.calculator.magurProtocolNote}
                    </h4>
                    <p className="text-xs text-teal-100/90 mt-1 leading-relaxed">
                      {t.calculator.magurProtocolSubnote}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-teal-800 text-xs">
                  <div>
                    <span className="text-teal-300">{t.calculator.survivingFish}:</span>
                    <p className="font-bold text-white text-base">
                      {formatDisplayNumber(calculationResult.survivingFish, 0)} {t.calculator.fishCount}
                    </p>
                  </div>
                  <div>
                    <span className="text-teal-300">{t.calculator.averageBiomass}:</span>
                    <p className="font-bold text-white text-base">
                      {formatDisplayNumber(calculationResult.biomass, 2)} kg
                    </p>
                  </div>
                </div>
              </div>
            ) : calculationResult.specialStatus === 'FORAGE_BASED' ? (
              /* Section 25: Grass Carp Forage Alert */
              <div className="py-6 px-4 bg-teal-950/60 rounded-2xl border border-amber-400/40 space-y-3">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-amber-300 text-sm sm:text-base">
                      {t.calculator.grassCarpForageNote}
                    </h4>
                    <p className="text-xs text-teal-100/90 mt-1 leading-relaxed">
                      {t.calculator.grassCarpForageSubnote}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-teal-800 text-xs">
                  <div>
                    <span className="text-teal-300">{t.calculator.survivingFish}:</span>
                    <p className="font-bold text-white text-base">
                      {formatDisplayNumber(calculationResult.survivingFish, 0)} {t.calculator.fishCount}
                    </p>
                  </div>
                  <div>
                    <span className="text-teal-300">{t.calculator.averageBiomass}:</span>
                    <p className="font-bold text-white text-base">
                      {formatDisplayNumber(calculationResult.biomass, 2)} kg
                    </p>
                  </div>
                </div>
              </div>
            ) : calculationResult.specialStatus === 'NO_RULE' ? (
              /* Section 26: No Valid Rule Alert */
              <div className="py-6 px-4 bg-rose-950/40 rounded-2xl border border-rose-500/40 space-y-2">
                <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto" />
                <h4 className="font-bold text-rose-300 text-center text-sm">
                  {t.calculator.noRuleFound}
                </h4>
              </div>
            ) : (
              /* PRIMARY SUCCESS CALCULATION VIEW */
              <div className="space-y-4">
                
                {/* 1. Primary Highlight: Daily Feed Requirement */}
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
                  
                  {/* Morning Feed (50%) */}
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

                  {/* Evening Feed (50%) */}
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

                {/* 3. Biomass & Surviving Fish Overview */}
                <div className="grid grid-cols-3 gap-2 bg-black/20 rounded-2xl p-3 border border-white/10 text-center">
                  
                  {/* Surviving Fish */}
                  <div>
                    <span className="text-[10px] text-teal-300 block uppercase font-medium">
                      {t.calculator.survivingFish}
                    </span>
                    <span className="text-sm sm:text-base font-extrabold text-white">
                      {formatDisplayNumber(calculationResult.survivingFish, 0)}
                    </span>
                    <span className="text-[10px] text-teal-400 block">{t.calculator.fishCount}</span>
                  </div>

                  {/* Average Biomass */}
                  <div className="border-x border-white/10">
                    <span className="text-[10px] text-teal-300 block uppercase font-medium">
                      {t.calculator.averageBiomass}
                    </span>
                    <span className="text-sm sm:text-base font-extrabold text-white">
                      {formatDisplayNumber(calculationResult.biomass, 2)}
                    </span>
                    <span className="text-[10px] text-teal-400 block">kg</span>
                  </div>

                  {/* Feeding Rate */}
                  <div>
                    <span className="text-[10px] text-teal-300 block uppercase font-medium">
                      {t.calculator.feedingRate}
                    </span>
                    <span className="text-sm sm:text-base font-extrabold text-amber-300">
                      {formatDisplayNumber(calculationResult.feedingRate, 2)}%
                    </span>
                    <span className="text-[10px] text-teal-400 block">{isCustomSpecies ? 'manual' : 'auto'}</span>
                  </div>

                </div>

              </div>
            )}

          </div>

          {/* Section 14: SHOW WHY THE RATE WAS SELECTED */}
          {calculationResult.isValid && (
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-teal-600" />
                  <span>{t.calculator.whyRuleSelected}</span>
                </span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
                  {isCustomSpecies ? t.calculator.sourceFarmerEntered : t.calculator.sourceAutomaticRule}
                </span>
              </div>

              {isCustomSpecies ? (
                /* Custom species explanation */
                <div className="text-xs text-slate-700 space-y-1">
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-500">{t.calculator.manualRateLabel}:</span>
                    <span className="font-bold text-slate-900">{calculationResult.feedingRate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-500">{lang === 'mr' ? 'स्रोत' : 'Source'}:</span>
                    <span className="font-bold text-amber-700">{t.calculator.sourceFarmerEntered}</span>
                  </div>
                </div>
              ) : (
                /* Predefined species explanation */
                <div className="text-xs text-slate-700 space-y-1.5">
                  <div>
                    <span className="text-slate-500 font-medium block">
                      {lang === 'mr' ? 'स्वयंचलित नियम:' : 'Automatic Rule:'}
                    </span>
                    <span className="font-bold text-teal-900 text-sm">
                      {lang === 'mr' ? calculationResult.ruleExplanation_mr : calculationResult.ruleExplanation}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                    <span className="text-slate-500">{t.calculator.selectedWorkingValue}:</span>
                    <span className="font-black text-teal-700 text-sm">
                      {calculationResult.feedingRate}%
                    </span>
                  </div>

                  {calculationResult.rule?.source && (
                    <div className="text-[11px] text-slate-400">
                      <span className="font-medium">{t.calculator.ruleSource}: </span>
                      <span>{calculationResult.rule.source}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Action: Save Calculation to Feed History */}
          <div className="flex flex-col gap-2">
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

          {/* Section 27: PERMANENT SAFETY / SCIENTIFIC NOTE */}
          <div className="bg-sky-50/90 border border-sky-200 rounded-2xl p-4 text-sky-950 text-xs space-y-1 shadow-xs">
            <div className="flex items-center gap-1.5 font-bold text-sky-900">
              <Info className="w-4 h-4 text-sky-600 shrink-0" />
              <span>{t.calculator.scientificNoteTitle}</span>
            </div>
            <p className="leading-relaxed text-sky-900/90">
              {t.calculator.scientificNote}
            </p>
          </div>

        </div>

      </div>

      {/* MOBILE STICKY FLOATING SUMMARY BAR (Visible only on mobile devices when calculation is valid) */}
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
                {calculationResult.feedingRate}% दर • {formatDisplayNumber(calculationResult.survivingFish, 0)} मासे
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

    </div>
  );
}
