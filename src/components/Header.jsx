import React from 'react';
import { 
  Fish, 
  HelpCircle, 
  User, 
  LogOut 
} from 'lucide-react';
import { translations } from '../data/translations';

export default function Header({
  lang,
  setLang,
  onOpenHelpModal,
  currentUser,
  onLogout,
}) {
  const t = translations[lang];

  const toggleLanguage = (newLang) => {
    setLang(newLang);
    localStorage.setItem('aquaculture_app_lang', newLang);
  };

  return (
    <header className="sticky top-0 z-30 bg-gradient-to-r from-teal-800 via-teal-700 to-emerald-800 text-white shadow-md border-b border-teal-600/30">
      <div className="max-w-7xl mx-auto px-3 py-2 sm:px-6 flex items-center justify-between">
        
        {/* Brand / Title */}
        <div className="flex items-center space-x-1.5 sm:space-x-2 min-w-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner shrink-0">
            <Fish className="w-4 h-4 sm:w-6 sm:h-6 text-teal-200 animate-pulse" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xs sm:text-base md:text-lg font-extrabold leading-tight tracking-tight text-white truncate">
              <span className="sm:hidden">{lang === 'mr' ? 'मत्स्य खाद्य व्यवस्थापक' : 'Aquaculture Feed'}</span>
              <span className="hidden sm:inline">{lang === 'mr' ? t.appTitle : 'Smart Aquaculture Feed Manager'}</span>
            </h1>
            <p className="text-[9px] sm:text-xs text-teal-100/80 font-medium truncate hidden xs:block">
              {lang === 'mr' ? 'Smart Aquaculture Feed Manager' : t.appMarathiTitle}
            </p>
          </div>
        </div>

        {/* Controls: User Info + Language Switch + Help */}
        <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">

          {/* Logged in Farmer Badge */}
          {currentUser && (
            <div className="flex items-center gap-1 bg-teal-950/40 border border-teal-400/20 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-xl text-xs">
              <User className="w-3 h-3 text-teal-300 shrink-0" />
              <span className="font-semibold text-teal-100 text-[11px] sm:text-xs max-w-[65px] sm:max-w-[120px] truncate">
                {currentUser.name.split(' ')[0]}
              </span>
              <button
                onClick={onLogout}
                className="text-teal-200 hover:text-rose-300 p-0.5 rounded transition-colors ml-0.5"
                title={t.auth?.logout || 'Logout'}
              >
                <LogOut className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Bilingual Language Switcher (English | मराठी) */}
          <div className="flex items-center bg-teal-950/60 rounded-xl p-0.5 border border-teal-500/30 shadow-inner">
            <button
              onClick={() => toggleLanguage('en')}
              className={`px-1.5 py-0.5 sm:px-2.5 sm:py-1 text-[10px] sm:text-xs font-bold rounded-lg transition-all duration-150 ${
                lang === 'en'
                  ? 'bg-white text-teal-900 shadow-sm'
                  : 'text-teal-200 hover:text-white'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => toggleLanguage('mr')}
              className={`px-1.5 py-0.5 sm:px-2.5 sm:py-1 text-[10px] sm:text-xs font-bold rounded-lg transition-all duration-150 ${
                lang === 'mr'
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'text-teal-200 hover:text-white'
              }`}
            >
              मराठी
            </button>
          </div>

          {/* Help Button */}
          <button
            onClick={onOpenHelpModal}
            className="p-1 sm:p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-teal-100 transition-colors"
            title={t.nav.help}
          >
            <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

      </div>
    </header>
  );
}
