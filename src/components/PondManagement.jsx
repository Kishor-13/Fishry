import React, { useState } from 'react';
import { 
  Waves, 
  Plus, 
  Edit, 
  Trash2, 
  X, 
  Save, 
  Fish, 
  Layers, 
  Scale, 
  Compass, 
  AlertCircle 
} from 'lucide-react';
import { translations } from '../lib/translations';
import { SPECIES_LIST, CULTURE_STAGES } from '../constants/speciesData';
import { formatDisplayNumber } from '../lib/ruleEngine';

export default function PondManagement({
  lang,
  ponds = [],
  onSavePond,
  onDeletePond,
}) {
  const t = translations[lang];

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPond, setEditingPond] = useState(null);
  const [pondToDelete, setPondToDelete] = useState(null);

  // Form states
  const [name, setName] = useState('');
  const [areaAcres, setAreaAcres] = useState('');
  const [depthFeet, setDepthFeet] = useState('');
  const [species, setSpecies] = useState('Rohu');
  const [cultureStage, setCultureStage] = useState('Rearing');
  const [stockingCount, setStockingCount] = useState('');
  const [survivalPercent, setSurvivalPercent] = useState('85');
  const [averageWeightG, setAverageWeightG] = useState('');
  const [notes, setNotes] = useState('');

  const openAddModal = () => {
    setEditingPond(null);
    setName(`Pond ${ponds.length + 1}`);
    setAreaAcres('');
    setDepthFeet('');
    setSpecies('Rohu');
    setCultureStage('Rearing');
    setStockingCount('');
    setSurvivalPercent('85');
    setAverageWeightG('');
    setNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (pond) => {
    setEditingPond(pond);
    setName(pond.name);
    setAreaAcres(pond.area_acres || '');
    setDepthFeet(pond.depth_feet || '');
    setSpecies(pond.species || 'Rohu');
    setCultureStage(pond.culture_stage || 'Rearing');
    setStockingCount(pond.stocking_count || '');
    setSurvivalPercent(pond.survival_percent || '85');
    setAverageWeightG(pond.average_weight_g || '');
    setNotes(pond.notes || '');
    setIsModalOpen(true);
  };

  const handleSubmitPond = async (e) => {
    e.preventDefault();

    const numStock = Number(stockingCount) || 0;
    const numSurv = Number(survivalPercent) || 0;
    const numWeight = Number(averageWeightG) || 0;

    // Estimated Biomass: (Stocking × Survival% / 100) × Weight / 1000
    const estimatedBiomass = ((numStock * numSurv) / 100 * numWeight) / 1000;

    const pondData = {
      id: editingPond?.id,
      name: name.trim() || 'Pond',
      area_acres: Number(areaAcres) || 0,
      depth_feet: Number(depthFeet) || 0,
      species,
      culture_stage: cultureStage,
      stocking_count: numStock,
      survival_percent: numSurv,
      average_weight_g: numWeight,
      estimated_biomass_kg: estimatedBiomass,
      notes,
    };

    await onSavePond(pondData);
    setIsModalOpen(false);
  };

  const confirmDelete = async () => {
    if (pondToDelete) {
      await onDeletePond(pondToDelete.id);
      setPondToDelete(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-2.5 sm:px-6 py-3 sm:py-6 space-y-3.5 sm:space-y-5 pb-24 md:pb-8">
      
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-base sm:text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Waves className="w-5 h-5 sm:w-6 sm:h-6 text-teal-600" />
            <span>{t.ponds.title}</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            {t.ponds.subtitle}
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-bold text-xs sm:text-sm transition-all duration-150 shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{t.ponds.addPond}</span>
        </button>
      </div>

      {/* Independent Note Banner (Section 33) */}
      <div className="p-3 bg-teal-50 border border-teal-200 rounded-2xl text-xs text-teal-900 font-medium">
        {t.ponds.independentNote}
      </div>

      {/* Ponds Grid */}
      {ponds.length === 0 ? (
        <div className="text-center py-12 px-4 bg-white rounded-3xl border border-slate-200">
          <Waves className="w-12 h-12 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-medium text-slate-500">
            {t.ponds.noPonds}
          </p>
          <button
            onClick={openAddModal}
            className="mt-3 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs"
          >
            {t.ponds.addPond}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ponds.map((pond) => {
            const biomassKg = pond.estimated_biomass_kg || 
              (((Number(pond.stocking_count) * Number(pond.survival_percent)) / 100 * Number(pond.average_weight_g)) / 1000);

            return (
              <div
                key={pond.id}
                className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-card hover:shadow-card-hover transition-all space-y-3"
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900">
                      {pond.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-teal-700 font-semibold">
                        {pond.species}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="text-xs text-slate-500">
                        {pond.culture_stage}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(pond)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-teal-700 hover:bg-teal-50"
                      title={t.ponds.edit}
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setPondToDelete(pond)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50"
                      title={t.ponds.delete}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-3 gap-2 bg-slate-50 rounded-xl p-3 text-center text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">{t.ponds.area}</span>
                    <span className="font-bold text-slate-800">{pond.area_acres} ac</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">{t.ponds.depth}</span>
                    <span className="font-bold text-slate-800">{pond.depth_feet} ft</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">{t.ponds.survival}</span>
                    <span className="font-bold text-teal-800">{pond.survival_percent}%</span>
                  </div>
                </div>

                {/* Estimated Biomass & Stocking */}
                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                  <span className="text-slate-500">
                    {t.ponds.stockingCount}: <strong className="text-slate-800">{formatDisplayNumber(pond.stocking_count, 0)}</strong>
                  </span>
                  <span className="text-teal-900 font-extrabold text-sm">
                    {formatDisplayNumber(biomassKg, 1)} kg <span className="text-[10px] font-normal text-slate-400">biomass</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ADD / EDIT POND MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                {editingPond ? t.ponds.modalEditTitle : t.ponds.modalAddTitle}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitPond} className="space-y-3.5 text-xs sm:text-sm">
              <div>
                <label className="block font-bold text-slate-800 mb-1">{t.ponds.pondName} *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">{t.ponds.area}</label>
                  <input
                    type="number"
                    step="0.1"
                    value={areaAcres}
                    onChange={(e) => setAreaAcres(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">{t.ponds.depth}</label>
                  <input
                    type="number"
                    step="0.5"
                    value={depthFeet}
                    onChange={(e) => setDepthFeet(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">{t.ponds.species}</label>
                  <select
                    value={species}
                    onChange={(e) => setSpecies(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 font-semibold focus:ring-2 focus:ring-teal-500"
                  >
                    {SPECIES_LIST.map((sp) => (
                      <option key={sp.id} value={sp.name}>
                        {lang === 'mr' ? sp.name_mr : sp.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">{t.ponds.cultureStage}</label>
                  <select
                    value={cultureStage}
                    onChange={(e) => setCultureStage(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 font-semibold focus:ring-2 focus:ring-teal-500"
                  >
                    {CULTURE_STAGES.map((st) => (
                      <option key={st.id} value={st.id}>
                        {lang === 'mr' ? st.name_mr : st.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">{t.ponds.stockingCount}</label>
                  <input
                    type="number"
                    value={stockingCount}
                    onChange={(e) => setStockingCount(e.target.value)}
                    className="w-full h-10 px-2 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-teal-500 text-center"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">{t.ponds.survival}</label>
                  <input
                    type="number"
                    max="100"
                    min="1"
                    value={survivalPercent}
                    onChange={(e) => setSurvivalPercent(e.target.value)}
                    className="w-full h-10 px-2 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-teal-500 text-center"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">{t.ponds.avgWeight}</label>
                  <input
                    type="number"
                    step="0.5"
                    value={averageWeightG}
                    onChange={(e) => setAverageWeightG(e.target.value)}
                    className="w-full h-10 px-2 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-teal-500 text-center"
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl font-bold text-xs bg-slate-100 text-slate-700 hover:bg-slate-200"
                >
                  {t.ponds.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl font-bold text-xs bg-teal-600 text-white hover:bg-teal-700 flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>{t.ponds.savePond}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {pondToDelete && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertCircle className="w-6 h-6" />
              <h3 className="font-bold text-base text-slate-900">
                {t.ponds.delete}
              </h3>
            </div>
            <p className="text-sm text-slate-600">
              {t.ponds.confirmDelete}
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setPondToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200"
              >
                {t.ponds.cancel}
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-700"
              >
                {t.ponds.delete}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
