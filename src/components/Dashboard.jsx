import React, { useState } from 'react';
import { 
  Scale, 
  IndianRupee, 
  Waves, 
  ClipboardList, 
  ArrowRight, 
  Sparkles, 
  Calendar, 
  CheckCircle,
  Lightbulb,
  X,
  Plus,
  Calculator,
  AlertCircle,
  Info,
  Clock,
  ChevronRight
} from 'lucide-react';
import { translations } from '../lib/translations';
import { formatDisplayNumber } from '../lib/ruleEngine';

export default function Dashboard({
  lang,
  feedHistory = [],
  ponds = [],
  onNavigateToCalculator,
  onNavigateToHistory,
  onNavigateToPonds,
  onNavigateToFCR,
  onCalculateForPond,
}) {
  const t = translations[lang];

  // Interactive popup modals: 'today_feed' | 'today_cost' | 'feed_records_empty' | null
  const [activeModal, setActiveModal] = useState(null);

  // Calculate today's totals
  const todayStr = new Date().toISOString().split('T')[0];
  const todayRecords = feedHistory.filter((r) => {
    if (!r.created_at) return false;
    return r.created_at.startsWith(todayStr);
  });

  const todayFeedKg = todayRecords.reduce((acc, curr) => acc + (Number(curr.daily_feed) || 0), 0);
  const todayFeedCost = todayRecords.reduce((acc, curr) => acc + (Number(curr.feed_cost) || 0), 0);
  const todayMorningKg = todayRecords.reduce((acc, curr) => acc + (Number(curr.morning_feed) || 0), 0);
  const todayEveningKg = todayRecords.reduce((acc, curr) => acc + (Number(curr.evening_feed) || 0), 0);

  const displayFeedKg = todayFeedKg;
  const displayFeedCost = todayFeedCost;

  const recentRecords = feedHistory.slice(0, 3);

  // Check which ponds have been fed today
  const fedPondIds = new Set(todayRecords.map((r) => String(r.pond_id)).filter(Boolean));

  return (
    <div className="space-y-4 sm:space-y-6 max-w-5xl mx-auto px-2.5 sm:px-4 py-3 sm:py-6">
      
      {/* Banner / Welcome */}
      <div className="bg-gradient-to-br from-teal-700 via-teal-800 to-emerald-900 rounded-2xl sm:rounded-3xl p-4 sm:p-7 text-white shadow-card relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-48 h-48 bg-white/5 rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 sm:gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 backdrop-blur-md text-teal-200 text-[11px] font-semibold">
              <Sparkles className="w-3 h-3" />
              <span>{t.maharashtraNote}</span>
            </div>
            <h2 className="text-lg sm:text-2xl font-extrabold tracking-tight text-white leading-snug">
              {t.dashboard.title}
            </h2>
            <p className="text-teal-100 text-xs sm:text-sm max-w-xl font-normal leading-relaxed">
              {t.dashboard.subtitle}
            </p>
          </div>

          {/* Prominent Action Button: Calculate Today's Feed */}
          <button
            onClick={onNavigateToCalculator}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl sm:rounded-2xl bg-amber-400 hover:bg-amber-300 active:scale-98 text-slate-950 font-extrabold text-sm sm:text-base shadow-lg shadow-amber-950/20 transition-all duration-150 cursor-pointer"
          >
            <span>{t.dashboard.calculateTodayFeed}</span>
            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {/* 4 Farmer Overview Metric Cards (All Clickable with Instant Views) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        
        {/* 1. Today's Feed -> Click to View Breakdown / Calculate */}
        <div 
          onClick={() => setActiveModal('today_feed')}
          className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-5 border border-teal-100/80 shadow-xs hover:shadow-card hover:border-teal-400 transition-all cursor-pointer group active:scale-98"
          title={lang === 'mr' ? 'आजचे खाद्य तपशील पहा' : "View Today's Feed Breakdown"}
        >
          <div className="flex items-center justify-between mb-1 sm:mb-2">
            <span className="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider group-hover:text-teal-700 transition-colors">
              {t.dashboard.todayFeed}
            </span>
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0 group-hover:bg-teal-600 group-hover:text-white transition-colors">
              <Scale className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="text-lg sm:text-3xl font-extrabold text-teal-900 tracking-tight">
            {formatDisplayNumber(displayFeedKg, 2)}{' '}
            <span className="text-xs sm:text-sm font-semibold text-slate-500">kg</span>
          </div>
          <p className="text-[10px] sm:text-[11px] text-teal-600 font-medium mt-1 truncate flex items-center justify-between">
            <span>{todayRecords.length > 0 ? (lang === 'mr' ? 'तपशील पहा' : 'View details') : (lang === 'mr' ? 'माहिती पहा' : 'View info')}</span>
            <span className="text-teal-400 font-bold group-hover:translate-x-0.5 transition-transform">→</span>
          </p>
        </div>

        {/* 2. Today's Feed Cost -> Click to View Cost Breakdown */}
        <div 
          onClick={() => setActiveModal('today_cost')}
          className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-5 border border-emerald-100/80 shadow-xs hover:shadow-card hover:border-emerald-400 transition-all cursor-pointer group active:scale-98"
          title={lang === 'mr' ? 'दैनिक खर्च तपशील पहा' : 'View Daily Cost Breakdown'}
        >
          <div className="flex items-center justify-between mb-1 sm:mb-2">
            <span className="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider group-hover:text-emerald-700 transition-colors">
              {t.dashboard.todayCost}
            </span>
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <IndianRupee className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="text-lg sm:text-3xl font-extrabold text-emerald-900 tracking-tight truncate">
            ₹{formatDisplayNumber(displayFeedCost, 0)}
          </div>
          <p className="text-[10px] sm:text-[11px] text-emerald-600 font-medium mt-1 truncate flex items-center justify-between">
            <span>{lang === 'mr' ? 'खर्च तपशील' : 'Cost details'}</span>
            <span className="text-emerald-400 font-bold group-hover:translate-x-0.5 transition-transform">→</span>
          </p>
        </div>

        {/* 3. Saved Ponds -> Click to Open Pond Management */}
        <div 
          onClick={onNavigateToPonds}
          className="bg-white rounded-2xl p-4 sm:p-5 border border-sky-100/80 shadow-card hover:shadow-card-hover hover:border-sky-400 transition-all cursor-pointer group active:scale-98"
          title={lang === 'mr' ? 'तळे व्यवस्थापन उघडा' : 'Open Pond Management'}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider group-hover:text-sky-700 transition-colors">
              {t.dashboard.savedPonds}
            </span>
            <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center group-hover:bg-sky-600 group-hover:text-white transition-colors">
              <Waves className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-sky-900 tracking-tight">
            {ponds.length}
          </div>
          <p className="text-[11px] text-sky-600 font-medium mt-1 flex items-center justify-between">
            <span>{lang === 'mr' ? 'तळी पहा / जोडा' : 'Manage ponds'}</span>
            <span className="text-sky-400 font-bold group-hover:translate-x-0.5 transition-transform">→</span>
          </p>
        </div>

        {/* 4. Feed Records -> Click to Open Feed History */}
        <div 
          onClick={() => {
            if (feedHistory.length > 0) {
              onNavigateToHistory();
            } else {
              setActiveModal('feed_records_empty');
            }
          }}
          className="bg-white rounded-2xl p-4 sm:p-5 border border-amber-100/80 shadow-card hover:shadow-card-hover hover:border-amber-400 transition-all cursor-pointer group active:scale-98"
          title={lang === 'mr' ? 'खाद्य इतिहास पहा' : 'View Feed History'}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider group-hover:text-amber-700 transition-colors">
              {t.dashboard.feedRecords}
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <ClipboardList className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-900 tracking-tight">
            {feedHistory.length}
          </div>
          <p className="text-[11px] text-amber-600 font-medium mt-1 flex items-center justify-between">
            <span>{feedHistory.length > 0 ? (lang === 'mr' ? 'नोंदी पहा' : 'View logs') : (lang === 'mr' ? 'माहिती पहा' : 'View info')}</span>
            <span className="text-amber-400 font-bold group-hover:translate-x-0.5 transition-transform">→</span>
          </p>
        </div>

      </div>

      {/* QUICK POND FEEDING BAR (Direct Action for Farmer Ponds) */}
      {ponds && ponds.length > 0 ? (
        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200/90 shadow-card space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Waves className="w-5 h-5 text-sky-600" />
              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                {lang === 'mr' ? 'माझी तळी - थेट खाद्य गणना' : 'My Ponds - Direct Daily Feeding'}
              </h3>
            </div>
            <button
              onClick={onNavigateToPonds}
              className="text-xs font-bold text-sky-700 hover:text-sky-900 flex items-center gap-1 cursor-pointer"
            >
              <span>{lang === 'mr' ? 'सर्व तळी व्यवस्थापित करा' : 'Manage All Ponds'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {ponds.map((p) => {
              const isFedToday = fedPondIds.has(String(p.id));
              return (
                <div
                  key={p.id}
                  className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                    isFedToday
                      ? 'bg-emerald-50/50 border-emerald-200'
                      : 'bg-slate-50 border-slate-200/80 hover:border-teal-300 hover:shadow-xs'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-900 text-sm truncate">{p.name}</h4>
                      {isFedToday ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          <span>{lang === 'mr' ? 'आज नोंद झाली' : 'Fed Today'}</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">
                          {lang === 'mr' ? 'प्रलंबित' : 'Pending'}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">
                      {p.species || 'Fish'} • {formatDisplayNumber(p.stocking_count, 0)} {lang === 'mr' ? 'मासे' : 'fish'} • {p.average_weight_g || 0}g
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => onCalculateForPond && onCalculateForPond(p)}
                    className="w-full py-2 px-3 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-98 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                  >
                    <Calculator className="w-3.5 h-3.5" />
                    <span>{lang === 'mr' ? 'खाद्य गणना करा' : 'Calculate Daily Feed'}</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-auto" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Empty State Guidance for New Farmers */
        <div className="bg-gradient-to-r from-sky-50 via-teal-50 to-emerald-50 rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-teal-200/60 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="text-base font-extrabold text-teal-950 flex items-center gap-2">
              <Waves className="w-5 h-5 text-teal-600" />
              <span>{lang === 'mr' ? 'पहिले तळे नोंदवा' : 'Register Your First Pond'}</span>
            </h4>
            <p className="text-xs sm:text-sm text-teal-900/80 max-w-lg">
              {lang === 'mr'
                ? 'तळे नोंदवल्यास मत्स्य संख्या व वजनानुसार रोजचे खाद्य १-क्लिकमध्ये आपोआप मोजता येते.'
                : 'Add your fish pond to automatically calculate daily feed with 1-click based on fish count and weight.'}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onNavigateToPonds(true)}
              className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-98 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{lang === 'mr' ? 'तळे जोडा' : 'Add Pond'}</span>
            </button>
            <button
              onClick={onNavigateToCalculator}
              className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-bold text-xs sm:text-sm transition-all cursor-pointer"
            >
              <span>{lang === 'mr' ? 'थेट कॅल्क्युलेटर' : 'Direct Calculator'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Recent Calculations Section */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-teal-600" />
            <span>{t.dashboard.quickSummaryTitle}</span>
          </h3>
          {feedHistory.length > 0 && (
            <button
              onClick={onNavigateToHistory}
              className="text-xs sm:text-sm font-semibold text-teal-700 hover:text-teal-900 flex items-center gap-1 cursor-pointer"
            >
              <span>{t.dashboard.viewAllHistory}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {recentRecords.length === 0 ? (
          <div className="text-center py-8 px-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <Scale className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-500 font-medium max-w-md mx-auto">
              {t.dashboard.noRecentCalculations}
            </p>
            <button
              onClick={onNavigateToCalculator}
              className="mt-3 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs transition-colors cursor-pointer"
            >
              {t.dashboard.calculateTodayFeed}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {recentRecords.map((rec) => (
              <div
                key={rec.id}
                onClick={onNavigateToHistory}
                className="p-4 rounded-2xl bg-gradient-to-b from-slate-50 to-white border border-slate-200 hover:border-teal-300 hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-900 text-sm group-hover:text-teal-700 transition-colors">
                    {rec.pond_name ? `${rec.pond_name} (${rec.species})` : rec.species}
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-teal-100/70 text-teal-800 font-medium">
                    {rec.culture_stage}
                  </span>
                </div>

                <div className="flex items-baseline justify-between mt-2 pt-2 border-t border-slate-100">
                  <div>
                    <span className="text-xs text-slate-500">{t.calculator.dailyFeed}:</span>
                    <div className="text-base font-bold text-teal-900">
                      {formatDisplayNumber(rec.daily_feed, 2)} kg
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-500">{t.calculator.dailyFeedCost}:</span>
                    <div className="text-base font-bold text-emerald-800">
                      ₹{formatDisplayNumber(rec.feed_cost, 0)}
                    </div>
                  </div>
                </div>

                <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>{new Date(rec.created_at).toLocaleDateString(lang === 'mr' ? 'mr-IN' : 'en-IN')}</span>
                  <span className="font-medium text-teal-700">{rec.feeding_rate}% {lang === 'mr' ? 'दर' : 'rate'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Best Practices Cards for Farmers */}
      <div className="bg-amber-50/70 border border-amber-200/70 rounded-3xl p-5 sm:p-6 text-amber-950">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="w-5 h-5 text-amber-600" />
          <h4 className="font-bold text-sm sm:text-base text-amber-900">
            {t.dashboard.keyTipsTitle}
          </h4>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs sm:text-sm">
          <div className="p-3 bg-white/80 rounded-xl border border-amber-200/50">
            <span className="font-bold text-amber-800">1. {lang === 'mr' ? 'वेळ विभागणी' : 'Split Feeding'}:</span> {t.dashboard.tip1}
          </div>
          <div className="p-3 bg-white/80 rounded-xl border border-amber-200/50">
            <span className="font-bold text-amber-800">2. {lang === 'mr' ? 'ऑक्सिजन सुरक्षितता' : 'Oxygen Safety'}:</span> {t.dashboard.tip2}
          </div>
          <div 
            onClick={onNavigateToFCR}
            className="p-3 bg-white/80 hover:bg-white hover:border-amber-400 hover:shadow-xs rounded-xl border border-amber-200/50 cursor-pointer transition-all group"
            title={lang === 'mr' ? 'FCR मॉड्युल उघडा' : 'Open FCR Module'}
          >
            <span className="font-bold text-amber-800">3. {lang === 'mr' ? 'FCR चे तत्त्व' : 'FCR Principle'}:</span> {t.dashboard.tip3}
            <span className="inline-block text-[11px] text-amber-600 font-bold ml-1 group-hover:underline">
              {lang === 'mr' ? 'FCR गणना →' : 'Calculate FCR →'}
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: TODAY'S FEED & COST BREAKDOWN                                      */}
      {/* ========================================================================= */}
      {(activeModal === 'today_feed' || activeModal === 'today_cost') && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                {activeModal === 'today_feed' ? (
                  <Scale className="w-5 h-5 text-teal-600" />
                ) : (
                  <IndianRupee className="w-5 h-5 text-emerald-600" />
                )}
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  {activeModal === 'today_feed'
                    ? (lang === 'mr' ? 'आजचे दैनिक खाद्य तपशील' : "Today's Feed Details")
                    : (lang === 'mr' ? 'आजचा अंदाजित खाद्य खर्च' : "Today's Feed Cost Details")}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Summary Highlights */}
            <div className="grid grid-cols-2 gap-3 p-3 bg-teal-50/70 rounded-2xl border border-teal-100 text-center">
              <div>
                <span className="text-[11px] text-teal-800 font-medium block">
                  {lang === 'mr' ? 'आजचे एकूण खाद्य' : 'Total Feed Today'}
                </span>
                <span className="text-xl font-extrabold text-teal-950">
                  {formatDisplayNumber(todayFeedKg, 2)} kg
                </span>
              </div>
              <div>
                <span className="text-[11px] text-emerald-800 font-medium block">
                  {lang === 'mr' ? 'एकूण खर्च' : 'Total Feed Cost'}
                </span>
                <span className="text-xl font-extrabold text-emerald-950">
                  ₹{formatDisplayNumber(todayFeedCost, 0)}
                </span>
              </div>
            </div>

            {/* Morning / Evening Split if fed */}
            {todayFeedKg > 0 && (
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 bg-amber-50/80 rounded-xl border border-amber-200/70">
                  <span className="text-amber-800 font-semibold block">{t.calculator.morningSplit}:</span>
                  <span className="font-bold text-slate-800 text-sm">{formatDisplayNumber(todayMorningKg, 2)} kg</span>
                </div>
                <div className="p-2.5 bg-indigo-50/80 rounded-xl border border-indigo-200/70">
                  <span className="text-indigo-800 font-semibold block">{t.calculator.eveningSplit}:</span>
                  <span className="font-bold text-slate-800 text-sm">{formatDisplayNumber(todayEveningKg, 2)} kg</span>
                </div>
              </div>
            )}

            {/* List of today's records or prompt to calculate */}
            {todayRecords.length > 0 ? (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {lang === 'mr' ? 'आज नोंदवलेली तळी:' : 'Logged Today by Pond:'}
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {todayRecords.map((r) => (
                    <div key={r.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-900 block">{r.pond_name || r.species}</span>
                        <span className="text-slate-500">{r.species} • {r.culture_stage} ({r.feeding_rate}%)</span>
                      </div>
                      <div className="text-right">
                        <span className="font-extrabold text-teal-900 block">{formatDisplayNumber(r.daily_feed, 2)} kg</span>
                        <span className="text-emerald-700 font-semibold">₹{formatDisplayNumber(r.feed_cost, 0)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-4 bg-slate-50 rounded-2xl text-center space-y-2 border border-dashed border-slate-200">
                <Clock className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-xs text-slate-600 font-medium">
                  {lang === 'mr'
                    ? 'आजच्या तारखेसाठी अद्याप कोणतीही खाद्य गणना झालेली नाही.'
                    : 'No feed has been calculated for today yet.'}
                </p>
              </div>
            )}

            {/* Actions in modal */}
            <div className="pt-2 flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={() => {
                  setActiveModal(null);
                  onNavigateToCalculator();
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Calculator className="w-4 h-4" />
                <span>{lang === 'mr' ? 'नवीन खाद्य गणना करा' : 'Calculate Feed Now'}</span>
              </button>
              {todayRecords.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveModal(null);
                    onNavigateToHistory();
                  }}
                  className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                >
                  <span>{lang === 'mr' ? 'इतिहास पहा' : 'View History'}</span>
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: FEED RECORDS GUIDANCE                                              */}
      {/* ========================================================================= */}
      {activeModal === 'feed_records_empty' && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 text-center">
            <ClipboardList className="w-12 h-12 text-amber-500 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-slate-900">
                {lang === 'mr' ? 'अद्याप नोंदी नाहीत' : 'No Feed Records Yet'}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {lang === 'mr'
                  ? 'जेव्हा तुम्ही खाद्य कॅल्क्युलेटरमध्ये गणना करून "जतन करा" बटण दाबाल, तेव्हा सर्व नोंदी येथे संग्रहित होतील.'
                  : 'Whenever you calculate feed in the Feed Calculator and click "Save", your records will be stored here.'}
              </p>
            </div>
            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  setActiveModal(null);
                  onNavigateToCalculator();
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Calculator className="w-4 h-4" />
                <span>{lang === 'mr' ? 'पहिली खाद्य गणना करा' : 'Calculate First Feed'}</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="py-2 text-xs font-semibold text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {lang === 'mr' ? 'बंद करा' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
