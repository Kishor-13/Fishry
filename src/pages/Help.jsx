import React from 'react';
import { 
  BookOpen, 
  Scale, 
  Thermometer, 
  ShieldCheck, 
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import { translations } from '../data/translations';

export default function Help({ lang }) {
  const t = translations[lang];
  const isMr = lang === 'mr';

  return (
    <div className="max-w-4xl mx-auto px-2.5 sm:px-6 py-3 sm:py-6 space-y-3.5 sm:space-y-6 pb-24 md:pb-8">
      
      {/* Header */}
      <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
        <h2 className="text-base sm:text-xl font-extrabold text-slate-900 flex items-center gap-2">
          <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-teal-600" />
          <span>{t.help.title}</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
          {t.help.subtitle}
        </p>
      </div>

      {/* ICAR-CIFA Standard Feeding Reference Table */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-card space-y-4">
        <h3 className="font-bold text-slate-900 text-base flex items-center gap-2 border-b pb-3">
          <Scale className="w-5 h-5 text-teal-600" />
          <span>{t.help.tableTitle}</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-200 text-slate-600 font-bold bg-slate-50">
                <th className="py-2.5 px-3 rounded-l-xl">{isMr ? 'माशांची जात' : 'Species'}</th>
                <th className="py-2.5 px-3">{isMr ? 'संवर्धन टप्पा / वजन' : 'Culture Stage / Weight'}</th>
                <th className="py-2.5 px-3">{isMr ? 'प्रमाणित खाद्य दर' : 'Feeding Rate'}</th>
                <th className="py-2.5 px-3 rounded-r-xl">{isMr ? 'संदर्भ / पद्धत' : 'Method / Source'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              <tr className="hover:bg-teal-50/50">
                <td className="py-3 px-3 font-bold text-slate-900">Rohu / Catla / Mrigal</td>
                <td className="py-3 px-3">Nursery (स्पॉन / फ्राय)</td>
                <td className="py-3 px-3 text-amber-700 font-bold">4× to 8× Spawn Wt</td>
                <td className="py-3 px-3 text-slate-500">INITIAL_SPAWN_WEIGHT</td>
              </tr>
              <tr className="hover:bg-teal-50/50">
                <td className="py-3 px-3 font-bold text-slate-900">Rohu / Catla / Mrigal</td>
                <td className="py-3 px-3">Rearing (फिंगरलिंग)</td>
                <td className="py-3 px-3 text-teal-700 font-bold">6–8% (Default: 7%)</td>
                <td className="py-3 px-3 text-slate-500">BIOMASS_PERCENT</td>
              </tr>
              <tr className="hover:bg-teal-50/50">
                <td className="py-3 px-3 font-bold text-slate-900">Rohu / Catla / Mrigal</td>
                <td className="py-3 px-3">Grow-out (मोठे मासे)</td>
                <td className="py-3 px-3 text-teal-700 font-bold">2–3% (Default: 2.5%)</td>
                <td className="py-3 px-3 text-slate-500">BIOMASS_PERCENT</td>
              </tr>
              <tr className="hover:bg-teal-50/50">
                <td className="py-3 px-3 font-bold text-slate-900">Common Carp</td>
                <td className="py-3 px-3">1–10 g / 10–90 g</td>
                <td className="py-3 px-3 text-teal-700 font-bold">20% / 10%</td>
                <td className="py-3 px-3 text-slate-500">Weight-based Priority</td>
              </tr>
              <tr className="hover:bg-teal-50/50">
                <td className="py-3 px-3 font-bold text-slate-900">Common Carp</td>
                <td className="py-3 px-3">100–200 g / 200–500 g</td>
                <td className="py-3 px-3 text-teal-700 font-bold">7% / 4.8%</td>
                <td className="py-3 px-3 text-slate-500">Weight-based Priority</td>
              </tr>
              <tr className="hover:bg-teal-50/50">
                <td className="py-3 px-3 font-bold text-slate-900">Tilapia</td>
                <td className="py-3 px-3">&lt;10 g / 10–40 g</td>
                <td className="py-3 px-3 text-teal-700 font-bold">8% / 7%</td>
                <td className="py-3 px-3 text-slate-500">FAO Tilapia Schedule</td>
              </tr>
              <tr className="hover:bg-teal-50/50">
                <td className="py-3 px-3 font-bold text-slate-900">Tilapia</td>
                <td className="py-3 px-3">40–100 g / &gt;100 g</td>
                <td className="py-3 px-3 text-teal-700 font-bold">6% / 4%</td>
                <td className="py-3 px-3 text-slate-500">FAO Tilapia Schedule</td>
              </tr>
              <tr className="hover:bg-teal-50/50">
                <td className="py-3 px-3 font-bold text-slate-900">Pangasius</td>
                <td className="py-3 px-3">Month 1–2 / 3–5 / 6+</td>
                <td className="py-3 px-3 text-teal-700 font-bold">5% / 3% / 2%</td>
                <td className="py-3 px-3 text-slate-500">Culture Period Rules</td>
              </tr>
              <tr className="hover:bg-teal-50/50">
                <td className="py-3 px-3 font-bold text-slate-900">Magur</td>
                <td className="py-3 px-3">All Stages</td>
                <td className="py-3 px-3 text-amber-700 font-bold">Verified Protocol</td>
                <td className="py-3 px-3 text-slate-500">VERIFIED_PROTOCOL</td>
              </tr>
              <tr className="hover:bg-teal-50/50">
                <td className="py-3 px-3 font-bold text-slate-900">Grass Carp</td>
                <td className="py-3 px-3">All Stages</td>
                <td className="py-3 px-3 text-emerald-700 font-bold">Forage & Weeds</td>
                <td className="py-3 px-3 text-slate-500">FORAGE_BASED</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Environmental & Practical Guidelines */}
      <div className="bg-amber-50/80 border border-amber-200 rounded-3xl p-5 sm:p-6 space-y-3">
        <h3 className="font-bold text-amber-950 text-base flex items-center gap-2">
          <Thermometer className="w-5 h-5 text-amber-600" />
          <span>{t.help.tipsTitle}</span>
        </h3>
        <ul className="space-y-2 text-xs sm:text-sm text-amber-950/90 leading-relaxed list-disc list-inside">
          <li><strong>{isMr ? 'खाद्य पोत्यांचे व्यवस्थापन' : 'Bag Tracking'}:</strong> {t.help.tipFeedBags}</li>
          <li><strong>{isMr ? 'चेक ट्रे तपासणी' : 'Check Tray Inspection'}:</strong> {t.help.tipTray}</li>
          <li><strong>{isMr ? 'पहाटेचे ऑक्सिजन संकट' : 'Dissolved Oxygen Stress'}:</strong> {t.help.tipOxygen}</li>
        </ul>
      </div>
    </div>
  );
}
