import React from 'react';
import { 
  Scale, 
  IndianRupee, 
  Waves, 
  ClipboardList, 
  ArrowRight, 
  Sparkles, 
  Calendar, 
  CheckCircle,
  Lightbulb
} from 'lucide-react';
import { translations } from '../lib/translations';
import { formatDisplayNumber } from '../lib/ruleEngine';

export default function Dashboard({
  lang,
  feedHistory = [],
  ponds = [],
  onNavigateToCalculator,
  onNavigateToHistory,
}) {
  const t = translations[lang];

  // Calculate today's totals
  const todayStr = new Date().toISOString().split('T')[0];
  const todayRecords = feedHistory.filter((r) => {
    if (!r.created_at) return false;
    return r.created_at.startsWith(todayStr);
  });

  const todayFeedKg = todayRecords.reduce((acc, curr) => acc + (Number(curr.daily_feed) || 0), 0);
  const todayFeedCost = todayRecords.reduce((acc, curr) => acc + (Number(curr.feed_cost) || 0), 0);

  // Fallback to latest record if today has no calculations yet for demonstrative preview
  const displayFeedKg = todayFeedKg > 0 ? todayFeedKg : (feedHistory[0]?.daily_feed || 0);
  const displayFeedCost = todayFeedCost > 0 ? todayFeedCost : (feedHistory[0]?.feed_cost || 0);

  const recentRecords = feedHistory.slice(0, 3);

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

      {/* 4 Farmer Overview Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        
        {/* Today's Feed */}
        <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-5 border border-teal-100/80 shadow-xs hover:shadow-card transition-all">
          <div className="flex items-center justify-between mb-1 sm:mb-2">
            <span className="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {t.dashboard.todayFeed}
            </span>
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
              <Scale className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="text-lg sm:text-3xl font-extrabold text-teal-900 tracking-tight">
            {formatDisplayNumber(displayFeedKg, 2)}{' '}
            <span className="text-xs sm:text-sm font-semibold text-slate-500">kg</span>
          </div>
          <p className="text-[10px] sm:text-[11px] text-teal-600 font-medium mt-0.5 truncate">
            {todayRecords.length > 0 ? (lang === 'mr' ? 'आजची नोंद' : 'Today logged') : (lang === 'mr' ? 'शेवटची नोंद' : 'Last logged')}
          </p>
        </div>

        {/* Today's Feed Cost */}
        <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-5 border border-emerald-100/80 shadow-xs hover:shadow-card transition-all">
          <div className="flex items-center justify-between mb-1 sm:mb-2">
            <span className="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {t.dashboard.todayCost}
            </span>
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <IndianRupee className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="text-lg sm:text-3xl font-extrabold text-emerald-900 tracking-tight truncate">
            ₹{formatDisplayNumber(displayFeedCost, 0)}
          </div>
          <p className="text-[10px] sm:text-[11px] text-emerald-600 font-medium mt-0.5 truncate">
            {lang === 'mr' ? 'अंदाजित दैनिक खर्च' : 'Estimated daily cost'}
          </p>
        </div>

        {/* Saved Ponds */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-sky-100/80 shadow-card hover:shadow-card-hover transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {t.dashboard.savedPonds}
            </span>
            <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center">
              <Waves className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-sky-900 tracking-tight">
            {ponds.length}
          </div>
          <p className="text-[11px] text-sky-600 font-medium mt-1">
            {lang === 'mr' ? 'सक्रिय तळी' : 'Active ponds'}
          </p>
        </div>

        {/* Feed Records */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-amber-100/80 shadow-card hover:shadow-card-hover transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {t.dashboard.feedRecords}
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <ClipboardList className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-900 tracking-tight">
            {feedHistory.length}
          </div>
          <p className="text-[11px] text-amber-600 font-medium mt-1">
            {lang === 'mr' ? 'एकूण जतन नोंदी' : 'Total logs stored'}
          </p>
        </div>

      </div>

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
              className="mt-3 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs transition-colors"
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
                    {rec.species}
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
          <div className="p-3 bg-white/80 rounded-xl border border-amber-200/50">
            <span className="font-bold text-amber-800">3. {lang === 'mr' ? 'FCR चे तत्त्व' : 'FCR Principle'}:</span> {t.dashboard.tip3}
          </div>
        </div>
      </div>

    </div>
  );
}
