import React from 'react';
import { 
  X, 
  BookOpen, 
  HelpCircle, 
  CheckCircle, 
  Info, 
  Thermometer, 
  Droplet, 
  Scale, 
  ShieldCheck 
} from 'lucide-react';
import { translations } from '../lib/translations';

export default function HelpModal({ isOpen, onClose, lang }) {
  if (!isOpen) return null;
  const t = translations[lang];
  const isMr = lang === 'mr';

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                {t.help.title}
              </h3>
              <p className="text-xs text-slate-500">
                {t.help.subtitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content sections */}
        <div className="space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
          
          {/* Reference Table Summary */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
            <h4 className="font-bold text-slate-900 text-sm mb-2 flex items-center gap-2">
              <Scale className="w-4 h-4 text-teal-600" />
              <span>{t.help.tableTitle}</span>
            </h4>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                    <th className="py-1.5 pr-2">{isMr ? 'माशांची जात' : 'Species'}</th>
                    <th className="py-1.5 px-2">{isMr ? 'टप्पा / वजन' : 'Stage / Weight'}</th>
                    <th className="py-1.5 pl-2">{isMr ? 'खाद्य दर' : 'Feeding Rate'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  <tr>
                    <td className="py-1.5 pr-2 font-bold text-slate-800">Rohu / Catla / Mrigal</td>
                    <td className="py-1.5 px-2">Rearing Stage</td>
                    <td className="py-1.5 pl-2 text-teal-700 font-bold">6–8% (def: 7%)</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 pr-2 font-bold text-slate-800">Rohu / Catla / Mrigal</td>
                    <td className="py-1.5 px-2">Grow-out Stage</td>
                    <td className="py-1.5 pl-2 text-teal-700 font-bold">2–3% (def: 2.5%)</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 pr-2 font-bold text-slate-800">Common Carp</td>
                    <td className="py-1.5 px-2">1–10 g / 10–90 g</td>
                    <td className="py-1.5 pl-2 text-teal-700 font-bold">20% / 10%</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 pr-2 font-bold text-slate-800">Common Carp</td>
                    <td className="py-1.5 px-2">100–200 g / 200–500 g</td>
                    <td className="py-1.5 pl-2 text-teal-700 font-bold">7% / 4.8%</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 pr-2 font-bold text-slate-800">Tilapia</td>
                    <td className="py-1.5 px-2">&lt;10 g / 10–40 g</td>
                    <td className="py-1.5 pl-2 text-teal-700 font-bold">8% / 7%</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 pr-2 font-bold text-slate-800">Tilapia</td>
                    <td className="py-1.5 px-2">40–100 g / &gt;100 g</td>
                    <td className="py-1.5 pl-2 text-teal-700 font-bold">6% / 4%</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 pr-2 font-bold text-slate-800">Pangasius</td>
                    <td className="py-1.5 px-2">Month 1–2 / 3–5 / 6+</td>
                    <td className="py-1.5 pl-2 text-teal-700 font-bold">5% / 3% / 2%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Environmental Adjustments Checklist */}
          <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200 space-y-2">
            <h4 className="font-bold text-amber-900 text-sm flex items-center gap-2">
              <Thermometer className="w-4 h-4 text-amber-600" />
              <span>{isMr ? 'वातावरणानुसार खाद्याचे समायोजन' : 'Weather & Water Adjustments'}</span>
            </h4>
            <div className="space-y-1.5 text-xs text-amber-950 font-medium">
              <p>• {t.help.tipTray}</p>
              <p>• {t.help.tipOxygen}</p>
              <p>• {t.help.tipFeedBags}</p>
            </div>
          </div>

          {/* Scientific Disclaimer */}
          <div className="bg-teal-50 rounded-2xl p-4 border border-teal-200 text-xs text-teal-950">
            <div className="flex items-center gap-2 font-bold text-teal-900 mb-1">
              <ShieldCheck className="w-4 h-4 text-teal-700" />
              <span>{isMr ? 'शास्त्रीय मार्गदर्शक तत्त्वे' : 'Scientific Framework'}</span>
            </div>
            <p className="leading-relaxed">
              {t.calculator.scientificNote}
            </p>
          </div>

        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full py-3 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-md transition-colors"
        >
          {t.history.close}
        </button>

      </div>
    </div>
  );
}
