import React, { useState, useMemo } from 'react';
import { 
  History, 
  Download, 
  Trash2, 
  Eye, 
  Calendar, 
  Fish, 
  Layers, 
  Scale, 
  IndianRupee, 
  Sun, 
  Moon, 
  Search, 
  X,
  AlertCircle,
  ClipboardCheck,
  AlertTriangle,
  ArrowRight,
  Clock,
  Activity
} from 'lucide-react';
import { translations } from '../lib/translations';
import { exportFeedHistoryToCsv } from '../lib/exportCsv';
import { formatDisplayNumber } from '../lib/ruleEngine';
import { 
  SPECIES_LIST, 
  FEEDING_TRAY_OBSERVATIONS, 
  VANNAMEI_CRITICAL_CONDITIONS 
} from '../constants/speciesData';

export default function FeedHistory({
  lang,
  feedHistory = [],
  onDeleteRecord,
}) {
  const t = translations[lang] || translations.en;

  const [selectedSpeciesFilter, setSelectedSpeciesFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [detailRecord, setDetailRecord] = useState(null);
  const [recordToDelete, setRecordToDelete] = useState(null);

  // Filtered records
  const filteredRecords = useMemo(() => {
    return feedHistory.filter((rec) => {
      // Species filter
      if (selectedSpeciesFilter !== 'ALL' && rec.species !== selectedSpeciesFilter) {
        return false;
      }
      // Text search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchSpecies = (rec.species || '').toLowerCase().includes(query);
        const matchStage = (rec.culture_stage || '').toLowerCase().includes(query);
        const matchRule = (rec.rule_explanation || '').toLowerCase().includes(query);
        const matchReason = (rec.difference_reason || '').toLowerCase().includes(query);
        if (!matchSpecies && !matchStage && !matchRule && !matchReason) return false;
      }
      return true;
    });
  }, [feedHistory, selectedSpeciesFilter, searchQuery]);

  const handleExportCsv = () => {
    exportFeedHistoryToCsv(filteredRecords, lang);
  };

  const confirmDelete = async () => {
    if (recordToDelete) {
      await onDeleteRecord(recordToDelete.id);
      setRecordToDelete(null);
      if (detailRecord?.id === recordToDelete.id) {
        setDetailRecord(null);
      }
    }
  };

  // Helper to format tray observation
  const getTrayLabel = (trayId) => {
    if (!trayId || trayId === 'none') return null;
    const item = FEEDING_TRAY_OBSERVATIONS.find((o) => o.id === trayId);
    return item ? (lang === 'mr' ? item.label_mr : item.label) : trayId;
  };

  return (
    <div className="max-w-4xl mx-auto px-2.5 sm:px-6 py-3 sm:py-6 space-y-3.5 sm:space-y-5 pb-24 md:pb-8">
      
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-base sm:text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <History className="w-5 h-5 sm:w-6 sm:h-6 text-teal-600" />
            <span>{t.history.title}</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            {t.history.subtitle} ({feedHistory.length} {lang === 'mr' ? 'नोंदी' : 'records'})
          </p>
        </div>

        {/* CSV Export Button */}
        <button
          onClick={handleExportCsv}
          disabled={feedHistory.length === 0}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all duration-150 shadow-xs ${
            feedHistory.length > 0
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer active:scale-95'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          <Download className="w-4 h-4" />
          <span>{t.history.exportCsv}</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        {/* Search */}
        <div className="sm:col-span-7 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.history.searchPlaceholder}
            className="w-full h-11 pl-10 pr-4 rounded-xl bg-white border border-slate-300 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Species Filter Dropdown */}
        <div className="sm:col-span-5">
          <select
            value={selectedSpeciesFilter}
            onChange={(e) => setSelectedSpeciesFilter(e.target.value)}
            className="w-full h-11 px-3.5 rounded-xl bg-white border border-slate-300 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-xs cursor-pointer"
          >
            <option value="ALL">{t.history.allSpecies}</option>
            {SPECIES_LIST.map((sp) => (
              <option key={sp.id} value={sp.name}>
                {lang === 'mr' ? sp.name_mr : sp.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* MOBILE-FRIENDLY CARDS LIST */}
      {filteredRecords.length === 0 ? (
        <div className="text-center py-12 px-4 bg-white rounded-3xl border border-slate-200">
          <History className="w-12 h-12 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-medium text-slate-500">
            {t.history.noRecords}
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredRecords.map((rec) => {
            const dateStr = new Date(rec.created_at).toLocaleDateString(lang === 'mr' ? 'mr-IN' : 'en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            });
            const timeStr = new Date(rec.created_at).toLocaleTimeString(lang === 'mr' ? 'mr-IN' : 'en-IN', {
              hour: '2-digit',
              minute: '2-digit',
            });
            const isCustom = rec.rate_source === 'FARMER_ENTERED' || rec.species === 'Other / Custom';
            const hasActual = rec.actual_feed !== null && rec.actual_feed !== undefined && !isNaN(Number(rec.actual_feed));
            const calculatedVal = Number(rec.calculated_feed ?? rec.daily_feed);
            const confirmedVal = Number(rec.confirmed_feed ?? rec.daily_feed);
            const trayLabel = getTrayLabel(rec.tray_observation);

            return (
              <div
                key={rec.id}
                className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-card hover:shadow-card-hover transition-all space-y-3"
              >
                {/* Top row: Species & Stage & Session & Date */}
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-base sm:text-lg font-extrabold text-slate-900">
                        {rec.pond_name ? `${rec.pond_name} • ${rec.species}` : rec.species}
                      </span>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 font-semibold border border-teal-200/60">
                        {rec.culture_stage}
                      </span>
                      {rec.session && (
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-800 font-bold border border-sky-200/60 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-sky-600" />
                          <span>
                            {rec.session === 'morning' ? (lang === 'mr' ? 'सकाळ' : 'Morning')
                              : rec.session === 'evening' ? (lang === 'mr' ? 'संध्याकाळ' : 'Evening')
                              : rec.session.replace('_', ' ').toUpperCase()}
                          </span>
                        </span>
                      )}
                      {rec.culture_age_days && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-orange-50 text-orange-800 font-bold border border-orange-200/60">
                          {lang === 'mr' ? `दिवस ${rec.culture_age_days}` : `Day ${rec.culture_age_days}`}
                        </span>
                      )}
                    </div>
                    {rec.scientific_name && (
                      <p className="text-[11px] text-teal-700 italic">
                        {rec.scientific_name}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col items-end text-xs text-slate-400 font-medium shrink-0">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{dateStr}</span>
                    </div>
                    <span className="text-[10px] text-slate-400">{timeStr}</span>
                  </div>
                </div>

                {/* 3-TIER FEED ACCOUNTABILITY GRID (Feature 3) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-slate-50/90 rounded-xl p-3 border border-slate-200/80 text-xs">
                  {/* Tier 1: Calculated Feed Required */}
                  <div className="p-2 bg-white rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 font-semibold block uppercase">
                      {t.feedTracking?.calculatedRequired || (lang === 'mr' ? 'आवश्यक गणना केलेले' : 'Calculated Feed')}
                    </span>
                    <span className="text-base font-black text-slate-900 block mt-0.5">
                      {formatDisplayNumber(calculatedVal, 2)} kg
                    </span>
                  </div>

                  {/* Tier 2: Confirmed Feeding Quantity */}
                  <div className="p-2 bg-white rounded-lg border border-teal-200">
                    <span className="text-[10px] text-teal-700 font-semibold block uppercase">
                      {t.feedTracking?.confirmedQuantity || (lang === 'mr' ? 'निश्चित केलेले प्रमाण' : 'Confirmed Quantity')}
                    </span>
                    <span className="text-base font-black text-teal-900 block mt-0.5">
                      {formatDisplayNumber(confirmedVal, 2)} kg
                    </span>
                  </div>

                  {/* Tier 3: Actual Feed Given */}
                  <div className="p-2 bg-white rounded-lg border border-amber-200">
                    <span className="text-[10px] text-amber-800 font-semibold block uppercase">
                      {t.feedTracking?.actualGiven || (lang === 'mr' ? 'प्रत्यक्ष दिलेले खाद्य' : 'Actual Feed Given')}
                    </span>
                    {hasActual ? (
                      <span className="text-base font-black text-amber-950 block mt-0.5">
                        {formatDisplayNumber(rec.actual_feed, 2)} kg
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400 italic font-medium block mt-1">
                        {lang === 'mr' ? 'नोंदवलेले नाही' : 'Not recorded'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Live Difference & Actual Feed Cost Banner */}
                {hasActual ? (
                  <div className="flex items-center justify-between p-2.5 bg-emerald-50/70 border border-emerald-200/80 rounded-xl text-xs flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-emerald-950">
                        {t.feedTracking?.difference || (lang === 'mr' ? 'फरक:' : 'Difference:')}
                      </span>
                      <span className={`font-black px-2 py-0.5 rounded-md ${
                        rec.difference_kg > 0 ? 'bg-amber-100 text-amber-900' : rec.difference_kg < 0 ? 'bg-sky-100 text-sky-900' : 'bg-emerald-100 text-emerald-900'
                      }`}>
                        {rec.difference_kg >= 0 ? `+${formatDisplayNumber(rec.difference_kg, 2)}` : formatDisplayNumber(rec.difference_kg, 2)} kg
                        {rec.difference_percent !== null ? ` (${rec.difference_percent >= 0 ? '+' : ''}${formatDisplayNumber(rec.difference_percent, 1)}%)` : ''}
                      </span>
                      {rec.difference_reason && (
                        <span className="text-[11px] text-slate-500 italic truncate max-w-xs">
                          • "{rec.difference_reason}"
                        </span>
                      )}
                    </div>
                    <div className="text-right ml-auto">
                      <span className="text-slate-500 text-[11px] mr-1">{t.feedTracking?.actualCost || (lang === 'mr' ? 'प्रत्यक्ष खर्च:' : 'Actual Cost:')}</span>
                      <span className="font-extrabold text-emerald-900 text-sm">
                        ₹{formatDisplayNumber(rec.actual_feed_cost ?? rec.feed_cost, 0)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
                    <span className="italic">
                      {lang === 'mr' ? 'प्रत्यक्ष खाद्य नोंद उपलब्ध नाही' : 'Actual feed was not recorded for this entry'}
                    </span>
                    <span className="font-semibold text-slate-700">
                      {lang === 'mr' ? 'अंदाजित खर्च:' : 'Est Cost:'} ₹{formatDisplayNumber(rec.feed_cost, 0)}
                    </span>
                  </div>
                )}

                {/* Observation, Check-Tray & Environmental Override Badges */}
                {(rec.observation || rec.observation_method || trayLabel || rec.check_tray_feed_g || rec.environmental_override_reason || (rec.critical_conditions && rec.critical_conditions.length > 0)) && (
                  <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
                    {(rec.observation || trayLabel) && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 border border-teal-200/80 font-medium">
                        <ClipboardCheck className="w-3 h-3 text-teal-600" />
                        <span>{rec.observation || trayLabel}</span>
                      </span>
                    )}
                    {rec.check_tray_feed_g && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-orange-50 text-orange-900 border border-orange-200 font-medium">
                        <Scale className="w-3 h-3 text-orange-600" />
                        <span>{rec.check_tray_feed_g}g Tray ({rec.checking_interval_str || 'interval'})</span>
                      </span>
                    )}
                    {rec.environmental_override_reason && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-300 font-medium">
                        <Activity className="w-3 h-3 text-amber-700" />
                        <span>{rec.environmental_override_reason}</span>
                      </span>
                    )}
                    {rec.critical_conditions && rec.critical_conditions.length > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-50 text-rose-800 border border-rose-200 font-medium">
                        <AlertTriangle className="w-3 h-3 text-rose-600" />
                        <span>{rec.critical_conditions.length} {lang === 'mr' ? 'परिस्थिती' : 'conditions'}</span>
                      </span>
                    )}
                  </div>
                )}

                {/* Middle details row: Stocked, Survival, Avg Weight, Biomass */}
                <div className="grid grid-cols-4 gap-2 text-center text-xs py-1 border-t border-slate-100">
                  <div>
                    <span className="text-slate-400 block text-[10px]">{t.history.stocked}</span>
                    <span className="font-bold text-slate-800">
                      {formatDisplayNumber(rec.stocked, 0)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">{t.history.survival}</span>
                    <span className="font-bold text-slate-800">
                      {rec.survival_percent}%
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">{t.history.avgWeight}</span>
                    <span className="font-bold text-slate-800">
                      {formatDisplayNumber(rec.average_weight, 1)} g
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">{t.feedTracking?.estimatedBiomass || (lang === 'mr' ? 'जैवभार' : 'Biomass')}</span>
                    <span className="font-bold text-teal-800">
                      {formatDisplayNumber(rec.biomass, 1)} kg
                    </span>
                  </div>
                </div>

                {/* Bottom row: Feeding Rate & Actions */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 text-xs font-bold">
                      {rec.feeding_rate}% {isCustom ? (lang === 'mr' ? 'शेतकऱ्याने भरलेला दर' : 'manual rate') : (lang === 'mr' ? 'दर' : 'rate')}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setDetailRecord(rec)}
                      className="p-2 rounded-xl text-teal-700 hover:bg-teal-50 transition-colors cursor-pointer"
                      title={t.history.viewDetails}
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setRecordToDelete(rec)}
                      className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title={t.history.deleteRecord}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* DETAILS VIEW MODAL (Complete Section 14 Coverage) */}
      {detailRecord && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold text-slate-900">
                {t.history.detailsTitle}
              </h3>
              <button
                onClick={() => setDetailRecord(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs sm:text-sm">
              <div className="flex justify-between py-1 border-b">
                <span className="text-slate-500">{t.history.species}</span>
                <span className="font-bold text-slate-900">
                  {detailRecord.species} {detailRecord.scientific_name ? `(${detailRecord.scientific_name})` : ''}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="text-slate-500">{lang === 'mr' ? 'खाद्य सत्र:' : 'Feeding Session:'}</span>
                <span className="font-extrabold text-teal-800">
                  {detailRecord.session ? detailRecord.session.toUpperCase().replace('_', ' ') : (lang === 'mr' ? 'दैनिक' : 'Daily')}
                  {detailRecord.session_date ? ` (${detailRecord.session_date})` : ''}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="text-slate-500">{t.history.stage}</span>
                <span className="font-bold text-slate-900">{detailRecord.culture_stage}</span>
              </div>
              {detailRecord.culture_age_days && (
                <div className="flex justify-between py-1 border-b">
                  <span className="text-slate-500">{lang === 'mr' ? 'संवर्धन दिवस:' : 'Culture Age in Days:'}</span>
                  <span className="font-bold text-orange-800">{detailRecord.culture_age_days} {lang === 'mr' ? 'दिवस' : 'days'}</span>
                </div>
              )}
              {detailRecord.feed_type && (
                <div className="flex justify-between py-1 border-b">
                  <span className="text-slate-500">{lang === 'mr' ? 'खाद्य प्रकार:' : 'Feed Type:'}</span>
                  <span className="font-bold text-slate-900">{detailRecord.feed_type}</span>
                </div>
              )}
              <div className="flex justify-between py-1 border-b">
                <span className="text-slate-500">{t.history.stocked}</span>
                <span className="font-bold text-slate-900">{formatDisplayNumber(detailRecord.stocked, 0)}</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="text-slate-500">{t.history.survival}</span>
                <span className="font-bold text-slate-900">{detailRecord.survival_percent}%</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="text-slate-500">{t.calculator.survivingFish}</span>
                <span className="font-bold text-teal-800">{formatDisplayNumber(detailRecord.surviving_fish, 0)}</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="text-slate-500">{t.feedTracking?.estimatedBiomass || (lang === 'mr' ? 'अंदाजित जैवभार' : 'Estimated Biomass')}</span>
                <span className="font-bold text-teal-800">{formatDisplayNumber(detailRecord.biomass, 2)} kg</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="text-slate-500">{t.feedTracking?.referenceRate || (lang === 'mr' ? 'संदर्भित खाद्य दर' : 'Reference Feeding Rate')}</span>
                <span className="font-bold text-amber-700">{detailRecord.feeding_rate}%</span>
              </div>

              {/* Observation method & observation detail */}
              {(detailRecord.observation || detailRecord.observation_method) && (
                <div className="flex justify-between py-1 border-b">
                  <span className="text-slate-500">{lang === 'mr' ? 'निरीक्षण पद्धत व नोंद:' : 'Observation & Method:'}</span>
                  <span className="font-bold text-teal-900 text-right">
                    {detailRecord.observation || detailRecord.observation_method}
                    {detailRecord.mud_obscured ? ` • ${lang === 'mr' ? 'चिखलाने झाकलेले' : 'Mud obscured'}` : ''}
                    {detailRecord.is_magur_delayed_inspection ? ` • ${lang === 'mr' ? 'सकाळी ट्रे तपासणी' : 'Next-morning inspection'}` : ''}
                  </span>
                </div>
              )}

              {/* Vannamei Check-Tray Sample Grams */}
              {detailRecord.check_tray_feed_g && (
                <div className="flex justify-between py-1 border-b">
                  <span className="text-slate-500">{lang === 'mr' ? 'चेक-ट्रे नमुना खाद्य:' : 'Check-Tray Sample Feed:'}</span>
                  <span className="font-black text-orange-900">
                    {detailRecord.check_tray_feed_g} g ({detailRecord.checking_interval_str || 'interval'})
                  </span>
                </div>
              )}

              {/* Environmental Measurements & Overrides */}
              {(detailRecord.environmental_override_reason || detailRecord.dissolved_oxygen || detailRecord.water_temperature) && (
                <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-950 space-y-1">
                  <span className="font-bold block text-amber-900">
                    {lang === 'mr' ? 'पर्यावरणीय परिस्थिती व अधिलिखित नियम:' : 'Environmental Assessment & Overrides:'}
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-amber-900">
                    {detailRecord.dissolved_oxygen && (
                      <span>DO: <strong>{detailRecord.dissolved_oxygen} mg/L</strong> {detailRecord.is_fish_piping ? '(Piping!)' : ''}</span>
                    )}
                    {detailRecord.water_temperature && (
                      <span>Temp: <strong>{detailRecord.water_temperature}°C</strong></span>
                    )}
                  </div>
                  {detailRecord.environmental_override_reason && (
                    <p className="text-[11px] font-semibold text-amber-900 mt-0.5">
                      {detailRecord.environmental_override_reason}
                    </p>
                  )}
                </div>
              )}

              {/* Generic tray observation if present */}
              {detailRecord.tray_observation && detailRecord.tray_observation !== 'none' && !detailRecord.observation && (
                <div className="flex justify-between py-1 border-b">
                  <span className="text-slate-500">{t.feedTracking?.trayObservation || (lang === 'mr' ? 'खाद्य ट्रे निरीक्षण' : 'Feeding-Tray Observation')}</span>
                  <span className="font-bold text-teal-900">{getTrayLabel(detailRecord.tray_observation)}</span>
                </div>
              )}

              {/* 3-Tier Accountability in Detail Modal */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5 my-2">
                <div className="flex justify-between text-xs font-bold text-slate-700">
                  <span>{t.feedTracking?.calculatedRequired || (lang === 'mr' ? 'आवश्यक गणना केलेले खाद्य:' : 'Calculated Feed Required:')}</span>
                  <span className="text-slate-900">{formatDisplayNumber(detailRecord.calculated_feed ?? detailRecord.daily_feed, 2)} kg</span>
                </div>
                <div className="flex justify-between text-xs font-bold text-teal-800">
                  <span>{t.feedTracking?.confirmedQuantity || (lang === 'mr' ? 'निश्चित केलेले प्रमाण:' : 'Confirmed Feeding Quantity:')}</span>
                  <span>{formatDisplayNumber(detailRecord.confirmed_feed ?? detailRecord.daily_feed, 2)} kg</span>
                </div>
                <div className="flex justify-between text-xs font-black text-amber-950">
                  <span>{t.feedTracking?.actualGiven || (lang === 'mr' ? 'प्रत्यक्ष दिलेले खाद्य:' : 'Actual Feed Given:')}</span>
                  <span>
                    {detailRecord.actual_feed !== null && detailRecord.actual_feed !== undefined && !isNaN(Number(detailRecord.actual_feed))
                      ? `${formatDisplayNumber(detailRecord.actual_feed, 2)} kg`
                      : <span className="text-slate-400 font-normal italic">{lang === 'mr' ? 'नोंदवलेले नाही' : 'Not recorded'}</span>}
                  </span>
                </div>

                {detailRecord.difference_kg !== null && detailRecord.difference_kg !== undefined && !isNaN(Number(detailRecord.difference_kg)) && (
                  <div className="flex justify-between text-xs font-bold pt-1 border-t border-slate-200">
                    <span className="text-slate-700">{t.feedTracking?.difference || (lang === 'mr' ? 'फरक (kg / %):' : 'Difference:')}</span>
                    <span className="text-slate-900">
                      {detailRecord.difference_kg >= 0 ? `+${formatDisplayNumber(detailRecord.difference_kg, 2)}` : formatDisplayNumber(detailRecord.difference_kg, 2)} kg
                      {detailRecord.difference_percent !== null ? ` (${detailRecord.difference_percent >= 0 ? '+' : ''}${formatDisplayNumber(detailRecord.difference_percent, 1)}%)` : ''}
                    </span>
                  </div>
                )}
              </div>

              {/* Feed price & costs */}
              <div className="flex justify-between py-1 border-b">
                <span className="text-slate-500">{t.calculator.feedPriceLabel}</span>
                <span className="font-bold text-slate-800">₹{formatDisplayNumber(detailRecord.feed_price || 0, 0)}/kg</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="text-slate-500">{t.feedTracking?.actualCost || (lang === 'mr' ? 'प्रत्यक्ष खाद्य खर्च:' : 'Actual Feed Cost:')}</span>
                <span className="font-extrabold text-emerald-800">
                  ₹{formatDisplayNumber(detailRecord.actual_feed_cost ?? detailRecord.feed_cost, 0)}
                </span>
              </div>

              {detailRecord.difference_reason && (
                <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-950">
                  <span className="font-bold block text-amber-900 mb-0.5">{lang === 'mr' ? 'फरकाचे कारण:' : 'Reason for Difference:'}</span>
                  <span>{detailRecord.difference_reason}</span>
                </div>
              )}

              {detailRecord.rule_explanation && (
                <div className="p-3 bg-teal-50 rounded-xl border border-teal-100 text-xs">
                  <span className="font-semibold text-teal-900 block mb-0.5">
                    {t.calculator.whyRuleSelected}:
                  </span>
                  <span className="text-teal-800">
                    {lang === 'mr' ? (detailRecord.rule_explanation_mr || detailRecord.rule_explanation) : detailRecord.rule_explanation}
                  </span>
                </div>
              )}
            </div>

            <button
              onClick={() => setDetailRecord(null)}
              className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm transition-colors cursor-pointer"
            >
              {t.history.close}
            </button>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {recordToDelete && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertCircle className="w-6 h-6" />
              <h3 className="font-bold text-base text-slate-900">
                {t.history.deleteRecord}
              </h3>
            </div>
            <p className="text-sm text-slate-600">
              {t.history.confirmDelete}
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setRecordToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer"
              >
                {t.ponds.cancel}
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 cursor-pointer"
              >
                {t.history.deleteRecord}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
