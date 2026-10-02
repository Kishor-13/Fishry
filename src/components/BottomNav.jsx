import { Home, Calculator, History, Waves, Scale, BookOpen } from 'lucide-react';
import { translations } from '../data/translations';

export default function BottomNav({ activeTab, setActiveTab, lang }) {
  const t = translations[lang];

  const navItems = [
    { id: 'dashboard', label: t.nav.dashboard, shortLabel: lang === 'mr' ? 'डॅशबोर्ड' : 'Home', icon: Home },
    { id: 'ponds', label: t.nav.ponds, shortLabel: lang === 'mr' ? 'तळी' : 'Ponds', icon: Waves },
    { id: 'calculator', label: t.nav.calculator, shortLabel: lang === 'mr' ? 'खाद्य गणक' : 'Calc', icon: Calculator, isPrimary: true },
    { id: 'history', label: t.nav.history, shortLabel: lang === 'mr' ? 'इतिहास' : 'History', icon: History },
    { id: 'fcr', label: t.nav.fcr, shortLabel: 'FCR', icon: Scale },
    { id: 'help', label: t.nav.help, shortLabel: lang === 'mr' ? 'मदत' : 'Help', icon: BookOpen },
  ];

  return (
    <>
      {/* Mobile Bottom Navigation Bar with Safe Area Inset */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200/80 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] px-1 pt-1 pb-[max(env(safe-area-inset-bottom),0.375rem)]">
        <div className="grid grid-cols-6 items-center">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`relative flex flex-col items-center justify-center py-1 px-0.5 rounded-xl transition-all duration-150 active:scale-95 ${
                  isActive
                    ? 'text-teal-700 font-extrabold'
                    : 'text-slate-500 hover:text-slate-800 font-medium'
                }`}
              >
                {/* Active indicator bar */}
                {isActive && (
                  <span className="absolute -top-1 w-6 h-1 bg-teal-600 rounded-full" />
                )}
                
                {/* Primary center button styling for calculator */}
                {item.isPrimary ? (
                  <div className={`p-1.5 rounded-2xl -mt-2 mb-0.5 shadow-md transition-all ${
                    isActive 
                      ? 'bg-teal-600 text-white shadow-teal-600/30 scale-105' 
                      : 'bg-teal-700 text-white shadow-teal-800/20'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                ) : (
                  <Icon className={`w-4 h-4 mb-0.5 transition-colors ${isActive ? 'text-teal-600' : 'text-slate-400'}`} />
                )}
                
                <span className="text-[9.5px] leading-tight truncate max-w-full text-center tracking-tight font-semibold">
                  {item.shortLabel}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Desktop/Tablet Horizontal Navigation Bar */}
      <div className="hidden md:block bg-white border-b border-slate-200 sticky top-[57px] z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex space-x-1 py-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-150 ${
                    isActive
                      ? 'bg-teal-50 text-teal-800 border border-teal-200/80 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-teal-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="text-xs text-teal-800/80 font-medium bg-teal-50/80 px-3 py-1 rounded-full border border-teal-100">
            {t.maharashtraNote}
          </div>
        </div>
      </div>
    </>
  );
}
