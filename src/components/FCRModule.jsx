import React, { useState, useMemo } from 'react';
import { 
  Scale, 
  HelpCircle, 
  CheckCircle, 
  TrendingUp, 
  AlertTriangle, 
  Layers, 
  ArrowRight,
  ShieldCheck,
  Package,
  Waves
} from 'lucide-react';
import { translations } from '../lib/translations';
import { formatDisplayNumber } from '../lib/ruleEngine';

export default function FCRModule({ 
  lang, 
  ponds = [], 
  feedHistory = [], 
  onNavigateToCalculator 
}) {
  const t = translations[lang];

  const [selectedPondId, setSelectedPondId] = useState('');

  // Inputs
  const [feedGivenKg, setFeedGivenKg] = useState('1500');
  const [feedInputMode, setFeedInputMode] = useState('kg'); // 'kg' or 'bags' (1 bag = 40kg)
  const [feedBags, setFeedBags] = useState('37.5');
  const [initialBiomass, setInitialBiomass] = useState('100');
  const [finalBiomass, setFinalBiomass] = useState('1100');

  // Handle bag vs kg conversion
  const handleKgChange = (val) => {
    setFeedGivenKg(val);
    const num = Number(val) || 0;
    setFeedBags((num / 40).toFixed(1));
  };

  const handleBagsChange = (val) => {
    setFeedBags(val);
    const num = Number(val) || 0;
    setFeedGivenKg((num * 40).toString());
  };

  const handlePondSelect = (pId) => {
    setSelectedPondId(pId);
    if (!pId) return;

    const p = ponds.find((item) => String(item.id) === String(pId));
    if (p) {
      // 1. Initial Biomass: (Stocking Count * 10g) / 1000 or fallback
      const initBio = Math.round((Number(p.stocking_count || 1000) * 10) / 1000);
      setInitialBiomass(String(initBio > 0 ? initBio : 50));

      // 2. Final Biomass from pond's average weight & survival
      const finBio = Math.round(
        ((Number(p.stocking_count || 1000) * Number(p.survival_percent || 85)) / 100 * Number(p.average_weight_g || 100)) / 1000
      );
      setFinalBiomass(String(finBio > (initBio || 50) ? finBio : (initBio || 50) + 200));

      // 3. Sum of feed history for this pond
      const pondRecords = feedHistory.filter((r) => String(r.pond_id) === String(pId));
      if (pondRecords.length > 0) {
        const totalFeed = pondRecords.reduce((acc, curr) => acc + (Number(curr.daily_feed) || 0), 0);
        if (totalFeed > 0) {
          handleKgChange(totalFeed.toFixed(1));
        }
      }
    }
  };

  // Calculation
  const fcrResult = useMemo(() => {
    const feed = Number(feedGivenKg);
    const initBio = Number(initialBiomass);
    const finBio = Number(finalBiomass);

    if (isNaN(feed) || isNaN(initBio) || isNaN(finBio) || feed <= 0 || initBio < 0 || finBio <= 0) {
      return { isValid: false, message: t.fcr.errInputs };
    }

    // Net Biomass Gain = Final Biomass - Initial Biomass
    const netGain = finBio - initBio;
    if (netGain <= 0) {
      return { isValid: false, message: t.fcr.errPositiveGain, netGain };
    }

    // FCR = Total Actual Feed Given ÷ Net Biomass Gain
    const fcr = feed / netGain;

    let rating = 'good';
    let ratingText = t.fcr.ratingGood;
    let ratingColor = 'text-emerald-700 bg-emerald-50 border-emerald-300';

    if (fcr < 1.3) {
      rating = 'excellent';
      ratingText = t.fcr.ratingExcellent;
      ratingColor = 'text-teal-700 bg-teal-50 border-teal-300';
    } else if (fcr <= 1.6) {
      rating = 'good';
      ratingText = t.fcr.ratingGood;
      ratingColor = 'text-emerald-700 bg-emerald-50 border-emerald-300';
    } else if (fcr <= 1.9) {
      rating = 'average';
      ratingText = t.fcr.ratingAverage;
      ratingColor = 'text-amber-700 bg-amber-50 border-amber-300';
    } else {
      rating = 'high';
      ratingText = t.fcr.ratingHigh;
      ratingColor = 'text-rose-700 bg-rose-50 border-rose-300';
    }

    return {
      isValid: true,
      feedGiven: feed,
      netGain,
      fcr,
      rating,
      ratingText,
      ratingColor,
    };
  }, [feedGivenKg, initialBiomass, finalBiomass, t, lang]);

  return (
    <div className="max-w-4xl mx-auto px-2.5 sm:px-6 py-3 sm:py-6 space-y-4 sm:space-y-6 pb-24 md:pb-8">
      
      {/* Header */}
      <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
        <h2 className="text-base sm:text-xl font-extrabold text-slate-900 flex items-center gap-2">
          <Scale className="w-5 h-5 sm:w-6 sm:h-6 text-teal-600" />
          <span>{t.fcr.title}</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
          {t.fcr.subtitle}
        </p>
      </div>

      {/* CORE PRINCIPLE ALERT (Section 34) */}
      <div className="bg-emerald-50 border-2 border-emerald-400/80 rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-6 h-6 text-emerald-700 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-extrabold text-emerald-950 text-sm sm:text-base">
              {t.fcr.principleNote}
            </h4>
            <div className="mt-2 text-xs sm:text-sm font-medium text-emerald-900/90 space-y-1">
              <p className="font-mono bg-white/70 p-2 rounded-xl border border-emerald-200 inline-block">
                <strong>{t.fcr.formulaText}</strong>
              </p>
              <p className="text-emerald-800">
                {t.fcr.gainFormulaText}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* INPUT FORM */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-card space-y-4">
          <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2 border-b pb-3">
            <Package className="w-5 h-5 text-teal-600" />
            <span>{lang === 'mr' ? 'खाद्य व बायोमास नोंदी' : 'Feed & Harvest Data'}</span>
          </h3>

          <div className="space-y-4">
            
            {/* Optional: Load From Saved Pond */}
            {ponds && ponds.length > 0 && (
              <div className="p-3 bg-teal-50/70 border border-teal-200 rounded-2xl space-y-1.5 shadow-xs">
                <label className="block text-xs font-bold text-teal-950 flex items-center gap-1.5">
                  <Waves className="w-4 h-4 text-teal-600" />
                  <span>{lang === 'mr' ? 'नोंदवलेले तळे निवडा (माहिती आपोआप भरा)' : 'Auto-fill from Saved Pond'}</span>
                </label>
                <select
                  value={selectedPondId}
                  onChange={(e) => handlePondSelect(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-white border border-teal-300 text-slate-900 font-semibold text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-xs cursor-pointer"
                >
                  <option value="">
                    {lang === 'mr' ? '-- तळे निवडा किंवा खाली स्वतः भरा --' : '-- Choose a Pond or Enter Manually Below --'}
                  </option>
                  {ponds.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.species || 'Fish'} • {formatDisplayNumber(p.stocking_count, 0)} {lang === 'mr' ? 'मासे' : 'fish'})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Feed Given with kg/bags switch */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs sm:text-sm font-bold text-slate-800">
                  {t.fcr.feedGivenLabel} <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center text-xs bg-slate-100 p-0.5 rounded-lg border">
                  <button
                    type="button"
                    onClick={() => setFeedInputMode('kg')}
                    className={`px-2 py-0.5 rounded-md font-semibold ${feedInputMode === 'kg' ? 'bg-white text-teal-800 shadow-xs' : 'text-slate-500'}`}
                  >
                    kg
                  </button>
                  <button
                    type="button"
                    onClick={() => setFeedInputMode('bags')}
                    className={`px-2 py-0.5 rounded-md font-semibold ${feedInputMode === 'bags' ? 'bg-white text-teal-800 shadow-xs' : 'text-slate-500'}`}
                  >
                    {lang === 'mr' ? 'पोती (40kg)' : 'Bags (40kg)'}
                  </button>
                </div>
              </div>

              {feedInputMode === 'kg' ? (
                <div className="relative">
                  <input
                    type="number"
                    value={feedGivenKg}
                    onChange={(e) => handleKgChange(e.target.value)}
                    placeholder={t.fcr.feedGivenPlaceholder}
                    className="w-full h-12 px-3.5 rounded-xl border border-slate-300 font-bold text-base focus:ring-2 focus:ring-teal-500 shadow-xs"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    kg ({formatDisplayNumber(Number(feedGivenKg) / 40, 1)} {lang === 'mr' ? 'पोती' : 'bags'})
                  </span>
                </div>
              ) : (
                <div className="relative">
                  <input
                    type="number"
                    value={feedBags}
                    onChange={(e) => handleBagsChange(e.target.value)}
                    placeholder="e.g. 37.5"
                    className="w-full h-12 px-3.5 rounded-xl border border-slate-300 font-bold text-base focus:ring-2 focus:ring-teal-500 shadow-xs"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    {lang === 'mr' ? 'पोती' : 'bags'} ({formatDisplayNumber(Number(feedBags) * 40, 0)} kg)
                  </span>
                </div>
              )}
              <p className="text-[11px] text-slate-500 mt-1">
                {t.fcr.feedGivenHelp}
              </p>
            </div>

            {/* Initial Biomass */}
            <div>
              <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-1.5">
                {t.fcr.initialBiomassLabel} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={initialBiomass}
                  onChange={(e) => setInitialBiomass(e.target.value)}
                  placeholder={t.fcr.initialBiomassPlaceholder}
                  className="w-full h-12 px-3.5 rounded-xl border border-slate-300 font-bold text-base focus:ring-2 focus:ring-teal-500 shadow-xs"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  kg
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                {t.fcr.initialBiomassHelp}
              </p>
            </div>

            {/* Final Harvest Biomass */}
            <div>
              <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-1.5">
                {t.fcr.finalBiomassLabel} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={finalBiomass}
                  onChange={(e) => setFinalBiomass(e.target.value)}
                  placeholder={t.fcr.finalBiomassPlaceholder}
                  className="w-full h-12 px-3.5 rounded-xl border border-slate-300 font-bold text-base focus:ring-2 focus:ring-teal-500 shadow-xs"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  kg
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                {t.fcr.finalBiomassHelp}
              </p>
            </div>

          </div>
        </div>

        {/* CALCULATION RESULTS & RATING */}
        <div className="lg:col-span-6 space-y-4">
          
          <div className="bg-gradient-to-br from-teal-900 to-emerald-950 rounded-3xl p-6 text-white shadow-card-hover border border-teal-800 space-y-4">
            <div className="flex items-center justify-between border-b border-teal-800 pb-3">
              <span className="font-bold text-sm sm:text-base text-white">
                {t.fcr.resultTitle}
              </span>
              <span className="text-xs bg-teal-500/20 px-2.5 py-0.5 rounded-full text-teal-200 border border-teal-400/30">
                Formula Output
              </span>
            </div>

            {fcrResult.isValid ? (
              <div className="space-y-4">
                
                {/* Big FCR Value Display */}
                <div className="bg-white/10 rounded-2xl p-4 border border-white/10 text-center">
                  <span className="text-xs text-teal-200 uppercase font-semibold tracking-wider block mb-1">
                    Feed Conversion Ratio (FCR)
                  </span>
                  <div className="text-4xl sm:text-5xl font-black text-amber-300 tracking-tight">
                    {formatDisplayNumber(fcrResult.fcr, 2)}
                  </div>
                  <p className="text-xs text-teal-100 mt-1">
                    {lang === 'mr' ? `१ किलो मासळी वाढवण्यासाठी ${formatDisplayNumber(fcrResult.fcr, 2)} किलो खाद्य लागले.` : `Requires ${formatDisplayNumber(fcrResult.fcr, 2)} kg feed to produce 1 kg fish gain.`}
                  </p>
                </div>

                {/* Net Gain & Breakdown */}
                <div className="grid grid-cols-2 gap-3 bg-black/20 p-3 rounded-2xl text-center text-xs">
                  <div>
                    <span className="text-teal-300 block">{t.fcr.netGainLabel}</span>
                    <span className="text-lg font-bold text-white">
                      {formatDisplayNumber(fcrResult.netGain, 1)} kg
                    </span>
                  </div>
                  <div>
                    <span className="text-teal-300 block">{lang === 'mr' ? 'एकूण खाद्य' : 'Total Feed'}</span>
                    <span className="text-lg font-bold text-white">
                      {formatDisplayNumber(fcrResult.feedGiven, 1)} kg
                    </span>
                  </div>
                </div>

                {/* Evaluation Rating Badge */}
                <div className={`p-3.5 rounded-xl border font-bold text-xs sm:text-sm ${fcrResult.ratingColor}`}>
                  {fcrResult.ratingText}
                </div>

              </div>
            ) : (
              <div className="py-8 text-center text-teal-200 text-xs sm:text-sm">
                <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                <p>{fcrResult.message}</p>
              </div>
            )}
          </div>

          {/* Practical Aquaculture Tips */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-2 text-xs sm:text-sm text-slate-700">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-sm">
              <TrendingUp className="w-4 h-4 text-teal-600" />
              <span>{lang === 'mr' ? 'FCR सुधारण्याचे उपाय' : 'How to Achieve Lower FCR'}</span>
            </h4>
            <ul className="list-disc list-inside space-y-1 text-slate-600 leading-relaxed">
              <li>{lang === 'mr' ? 'खाद्य वाया जाणे रोखण्यासाठी ट्रे (फीडिंग ट्रे) द्वारे निरीक्षण करा.' : 'Use feeding check trays to prevent overfeeding and feed wastage.'}</li>
              <li>{lang === 'mr' ? 'पाण्याचे तापमान २०°C पेक्षा कमी किंवा ३४°C पेक्षा जास्त असताना खाद्य कमी करा.' : 'Reduce feed when water temperature is below 20°C or above 34°C.'}</li>
              <li>{lang === 'mr' ? 'दर १५ दिवसांनी नमुना वजन (सॅम्पलिंग) करूनच योग्य बायोमास मोजा.' : 'Conduct net sampling every 15 days to update average fish weights accurately.'}</li>
            </ul>
          </div>

        </div>

      </div>

    </div>
  );
}
