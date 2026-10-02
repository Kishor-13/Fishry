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
  AlertCircle
} from 'lucide-react';
import { translations } from '../lib/translations';
import { exportFeedHistoryToCsv } from '../lib/exportCsv';
import { formatDisplayNumber } from '../lib/ruleEngine';
import { SPECIES_LIST } from '../constants/speciesData';

export default function FeedHistory({
  lang,
  feedHistory = [],
  onDeleteRecord,
}) {
  const t = translations[lang];

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
        if (!matchSpecies && !matchStage && !matchRule) return false;
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

      {/* MOBILE-FRIENDLY CARDS LIST (Section 31) */}
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
            const isCustom = rec.rate_source === 'FARMER_ENTERED' || rec.species === 'Other / Custom';

            return (
              <div
                key={rec.id}
                className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-card hover:shadow-card-hover transition-all"
              >
                {/* Top row: Species & Stage & Date */}
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base sm:text-lg font-extrabold text-slate-900">
                        {rec.species}
                      </span>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 font-semibold border border-teal-200/60">
                        {rec.culture_stage}
                      </span>
                    </div>
                    {rec.scientific_name && (
                      <p className="text-[11px] text-teal-700 italic">
                        {rec.scientific_name}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{dateStr}</span>
                  </div>
                </div>

                {/* Primary Daily Feed and Cost Highlight */}
                <div className="grid grid-cols-2 gap-3 bg-teal-50/60 rounded-xl p-3 mb-3 border border-teal-100/80">
                  <div>
                    <span className="text-[11px] text-slate-500 font-medium block">
                      {t.history.dailyFeed}
                    </span>
                    <span className="text-lg sm:text-xl font-black text-teal-900">
                      {formatDisplayNumber(rec.daily_feed, 2)} kg{t.calculator.perDay}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[11px] text-slate-500 font-medium block">
                      {t.history.cost}
                    </span>
                    <span className="text-lg sm:text-xl font-black text-emerald-800">
                      ₹{formatDisplayNumber(rec.feed_cost, 0)}{t.calculator.perDay}
                    </span>
                  </div>
                </div>

                {/* Middle details row: Stocked, Survival, Avg Weight */}
                <div className="grid grid-cols-3 gap-2 text-center text-xs py-1 border-b border-slate-100 mb-3">
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
                </div>

                {/* Bottom row: Feeding Rate & Source badge + Actions */}
                <div className="flex items-center justify-between gap-2 pt-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 text-xs font-bold">
                      {rec.feeding_rate}% {isCustom ? (lang === 'mr' ? 'शेतकऱ्याने भरलेला दर' : 'manual rate') : (lang === 'mr' ? 'स्वयंचलित दर' : 'automatic rate')}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setDetailRecord(rec)}
                      className="p-2 rounded-xl text-teal-700 hover:bg-teal-50 transition-colors"
                      title={t.history.viewDetails}
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setRecordToDelete(rec)}
                      className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 transition-colors"
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

      {/* DETAILS VIEW MODAL */}
      {detailRecord && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold text-slate-900">
                {t.history.detailsTitle}
              </h3>
              <button
                onClick={() => setDetailRecord(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs sm:text-sm">
              <div className="flex justify-between py-1 border-b">
                <span className="text-slate-500">{t.history.species}</span>
                <span className="font-bold text-slate-900">{detailRecord.species}</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="text-slate-500">{t.history.stage}</span>
                <span className="font-bold text-slate-900">{detailRecord.culture_stage}</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="text-slate-500">{t.history.stocked}</span>
                <span className="font-bold text-slate-900">{formatDisplayNumber(detailRecord.stocked, 0)} fish</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="text-slate-500">{t.history.survival}</span>
                <span className="font-bold text-slate-900">{detailRecord.survival_percent}%</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="text-slate-500">{t.calculator.survivingFish}</span>
                <span className="font-bold text-teal-800">{formatDisplayNumber(detailRecord.surviving_fish, 0)} fish</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="text-slate-500">{t.calculator.averageBiomass}</span>
                <span className="font-bold text-teal-800">{formatDisplayNumber(detailRecord.biomass, 2)} kg</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="text-slate-500">{t.calculator.feedingRate}</span>
                <span className="font-bold text-amber-700">{detailRecord.feeding_rate}%</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="text-slate-500">{t.calculator.dailyFeed}</span>
                <span className="font-bold text-teal-900">{formatDisplayNumber(detailRecord.daily_feed, 2)} kg</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="text-slate-500">{t.calculator.morningFeed}</span>
                <span className="font-bold text-amber-800">{formatDisplayNumber(detailRecord.morning_feed, 2)} kg</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="text-slate-500">{t.calculator.eveningFeed}</span>
                <span className="font-bold text-sky-800">{formatDisplayNumber(detailRecord.evening_feed, 2)} kg</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="text-slate-500">{t.calculator.dailyFeedCost}</span>
                <span className="font-bold text-emerald-800">₹{formatDisplayNumber(detailRecord.feed_cost, 0)}</span>
              </div>

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
              className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm transition-colors"
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
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200"
              >
                {t.ponds.cancel}
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-700"
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
