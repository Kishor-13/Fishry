import React, { useState } from 'react';
import { 
  Fish, 
  Phone, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  LogIn,
  UserPlus,
  HelpCircle
} from 'lucide-react';
import { translations } from '../data/translations';
import { loginUser, registerUser, loginAsDemoFarmer, loginAsGuest } from '../services/authService';

export default function Login({ lang, setLang, onLoginSuccess }) {
  const t = translations[lang];

  const [mode, setMode] = useState('login'); // 'login' or 'signup'
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [farmName, setFarmName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Switch language
  const toggleLanguage = (newLang) => {
    setLang(newLang);
    localStorage.setItem('aquaculture_app_lang', newLang);
  };

  const handleMobileChange = (e) => {
    // Only allow digits and max 10 digits
    const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
    setMobile(digits);
    setErrorMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    // Validation
    const cleanMobile = mobile.trim();
    if (cleanMobile.length !== 10) {
      setErrorMsg(t.auth.errMobile);
      return;
    }

    if (!password || password.length < 4) {
      setErrorMsg(t.auth.errPassword);
      return;
    }

    if (mode === 'signup' && !name.trim()) {
      setErrorMsg(t.auth.errName);
      return;
    }

    setIsLoading(true);

    try {
      if (mode === 'login') {
        const res = await loginUser({ mobile: cleanMobile, password });
        if (res.success) {
          onLoginSuccess(res.user);
        } else {
          setErrorMsg(t.auth.errInvalidCredentials);
        }
      } else {
        const res = await registerUser({
          name: name.trim(),
          mobile: cleanMobile,
          password,
          farmName: farmName.trim(),
        });
        if (res.success) {
          onLoginSuccess(res.user);
        } else {
          setErrorMsg(t.auth.errInvalidCredentials);
        }
      }
    } catch (err) {
      console.error('Auth error:', err);
      setErrorMsg('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = () => {
    const demoUser = loginAsDemoFarmer();
    onLoginSuccess(demoUser);
  };

  const handleGuestLogin = () => {
    const guestUser = loginAsGuest();
    onLoginSuccess(guestUser);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-900 via-teal-800 to-emerald-950 text-white flex flex-col justify-between py-6 px-4 sm:px-6 relative overflow-hidden">
      
      {/* Background Decorative Ripples */}
      <div className="absolute top-0 right-0 translate-x-12 -translate-y-12 w-72 h-72 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -translate-x-12 translate-y-12 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar with Language Switcher */}
      <div className="relative z-10 max-w-md w-full mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
            <Fish className="w-5 h-5 text-teal-300" />
          </div>
          <span className="text-xs font-bold text-teal-200 uppercase tracking-wider">
            {lang === 'mr' ? 'मत्स्य शेती' : 'Aquaculture'}
          </span>
        </div>

        {/* Language Switch */}
        <div className="flex items-center bg-teal-950/60 rounded-xl p-0.5 border border-teal-500/30">
          <button
            type="button"
            onClick={() => toggleLanguage('en')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
              lang === 'en' ? 'bg-white text-teal-950 shadow-sm' : 'text-teal-200'
            }`}
          >
            EN
          </button>
          <button
            type="button"
            onClick={() => toggleLanguage('mr')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
              lang === 'mr' ? 'bg-emerald-500 text-white shadow-sm' : 'text-teal-200'
            }`}
          >
            मराठी
          </button>
        </div>
      </div>

      {/* Main Card */}
      <div className="relative z-10 max-w-md w-full mx-auto my-auto py-6">
        
        {/* App Branding */}
        <div className="text-center mb-6 space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            {lang === 'mr' ? t.appTitle : 'Smart Aquaculture Feed Manager'}
          </h1>
          <p className="text-xs sm:text-sm text-teal-100/90 font-medium">
            {lang === 'mr' ? 'Smart Aquaculture Feed Manager' : t.appMarathiTitle}
          </p>
          <p className="text-[11px] text-teal-300/80 pt-1 font-normal">
            {t.maharashtraNote}
          </p>
        </div>

        {/* Auth Card Container */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 text-slate-900 shadow-2xl border border-teal-700/20 space-y-5">
          
          {/* Login / Register Tab Switcher */}
          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl">
            <button
              type="button"
              onClick={() => { setMode('login'); setErrorMsg(''); }}
              className={`py-2 text-xs sm:text-sm font-bold rounded-xl transition-all ${
                mode === 'login'
                  ? 'bg-white text-teal-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div className="flex items-center justify-center gap-1.5">
                <LogIn className="w-4 h-4" />
                <span>{lang === 'mr' ? 'लॉगिन' : 'Login'}</span>
              </div>
            </button>
            <button
              type="button"
              onClick={() => { setMode('signup'); setErrorMsg(''); }}
              className={`py-2 text-xs sm:text-sm font-bold rounded-xl transition-all ${
                mode === 'signup'
                  ? 'bg-white text-teal-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div className="flex items-center justify-center gap-1.5">
                <UserPlus className="w-4 h-4" />
                <span>{lang === 'mr' ? 'नवीन नोंदणी' : 'Register'}</span>
              </div>
            </button>
          </div>

          {/* Form Header */}
          <div className="text-left space-y-0.5">
            <h2 className="text-lg font-bold text-slate-900">
              {mode === 'login' ? t.auth.loginTitle : t.auth.signupTitle}
            </h2>
            <p className="text-xs text-slate-500">
              {mode === 'login' ? t.auth.loginSubtitle : t.auth.signupSubtitle}
            </p>
          </div>

          {/* Error Message Box */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold animate-fadeIn">
              {errorMsg}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            
            {/* If Register Mode: Name Input */}
            {mode === 'signup' && (
              <div className="space-y-1 animate-fadeIn">
                <label className="block text-xs font-bold text-slate-700">
                  {t.auth.nameLabel} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t.auth.namePlaceholder}
                    className="w-full h-12 pl-10 pr-3.5 rounded-xl border border-slate-300 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-xs"
                  />
                </div>
              </div>
            )}

            {/* Mobile Number Input with +91 Prefix */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">
                {t.auth.mobileLabel} <span className="text-red-500">*</span>
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3 flex items-center gap-1 text-slate-600 font-bold text-sm pointer-events-none border-r border-slate-300 pr-2">
                  <span>🇮🇳</span>
                  <span>+91</span>
                </div>
                <input
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  required
                  value={mobile}
                  onChange={handleMobileChange}
                  placeholder={t.auth.mobilePlaceholder}
                  className="w-full h-12 pl-20 pr-3.5 rounded-xl border border-slate-300 font-bold text-base sm:text-lg focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-xs tracking-wider"
                />
              </div>
              <p className="text-[11px] text-slate-400 ml-0.5">
                {lang === 'mr' ? '१० अंकी मोबाईल नंबर (उदा. 9876543210)' : '10-digit mobile number (e.g. 9876543210)'}
              </p>
            </div>

            {/* Password Input with Show/Hide toggle */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">
                {t.auth.passwordLabel} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t.auth.passwordPlaceholder}
                  className="w-full h-12 pl-10 pr-11 rounded-xl border border-slate-300 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-slate-600 font-medium">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded text-teal-600 focus:ring-teal-500"
                />
                <span>{t.auth.rememberMe}</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-13 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-base flex items-center justify-center gap-2 shadow-md shadow-teal-700/20 active:scale-98 transition-all cursor-pointer"
            >
              {isLoading ? (
                <span>Loading...</span>
              ) : (
                <>
                  <span>{mode === 'login' ? t.auth.loginBtn : t.auth.signupBtn}</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Login Option */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <button
              type="button"
              onClick={handleDemoLogin}
              className="w-full py-2.5 px-4 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300/80 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>{t.auth.demoLoginBtn}</span>
            </button>

            {/* Skip Login / Continue as Guest */}
            <button
              type="button"
              onClick={handleGuestLogin}
              className="w-full py-2 text-xs font-semibold text-slate-500 hover:text-teal-700 transition-colors cursor-pointer"
            >
              {t.auth.skipLogin}
            </button>
          </div>

        </div>

      </div>

      {/* Footer Note */}
      <div className="relative z-10 text-center text-xs text-teal-200/70 font-medium max-w-md mx-auto">
        <p>{t.tagline}</p>
      </div>

    </div>
  );
}
