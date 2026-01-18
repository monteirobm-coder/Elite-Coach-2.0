
import React, { useRef, useState, useEffect } from 'react';
import { UserProfile, HRZones, PersonalRecords } from '../types';
import { X, User, Heart, Weight, Ruler, Activity, Camera, Trophy, Flame, Percent, Save, Edit2, RotateCcw, Loader2 } from 'lucide-react';

interface ProfileProps {
  profile: UserProfile;
  onUpdate: (profile: UserProfile) => Promise<void>;
  onClose: () => void;
}

const Profile: React.FC<ProfileProps> = ({ profile, onUpdate, onClose }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<UserProfile>(profile);

  // Atualiza formData se profile mudar externamente (ex: carregamento inicial)
  useEffect(() => {
    setFormData(profile);
  }, [profile]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setFormData(prev => ({ ...prev, photoUrl: base64String }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdate(formData);
      setIsEditing(false);
    } catch (err) {
      console.error("Erro ao salvar:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData(profile);
    setIsEditing(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof UserProfile] as any),
          [child]: type === 'number' ? parseFloat(value) || 0 : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'number' ? parseFloat(value) || 0 : value
      }));
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  const getBpm = (pct: number) => Math.round((pct / 100) * formData.lactateThresholdHR);

  const zones = [
    { label: 'Z5', key: 'z4High', nextKey: null, color: 'bg-rose-600', desc: 'Esforço Máximo', isZ5: true },
    { label: 'Z4', key: 'z3High', nextKey: 'z4High', color: 'bg-orange-500', desc: 'Limiar Anaeróbico' },
    { label: 'Z3', key: 'z2High', nextKey: 'z3High', color: 'bg-yellow-500', desc: 'Aeróbico / Cardio' },
    { label: 'Z2', key: 'z1High', nextKey: 'z2High', color: 'bg-emerald-500', desc: 'Resistência / Fat Burn' },
    { label: 'Z1', key: 'z1Low', nextKey: 'z1High', color: 'bg-blue-500', desc: 'Recuperação' },
  ];

  const inputClasses = "bg-slate-900/80 border border-slate-700 rounded-lg py-1.5 px-3 text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all w-full";

  return (
    <div className="animate-in fade-in zoom-in-95 duration-300 space-y-6 pb-20 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-2xl font-bold">Perfil do Atleta</h3>
          <p className="text-slate-500 text-sm">Dados sincronizados com histórico na nuvem.</p>
        </div>
        <div className="flex gap-3">
          {!isEditing ? (
            <button 
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-emerald-900/20"
            >
              <Edit2 size={16} /> Editar Perfil
            </button>
          ) : (
            <>
              <button 
                onClick={handleCancel}
                disabled={isSaving}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-5 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
              >
                <RotateCcw size={16} /> Cancelar
              </button>
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-emerald-900/40 disabled:opacity-50 min-w-[120px] justify-center"
              >
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {isSaving ? 'Salvando...' : 'Salvar'}
              </button>
            </>
          )}
          <button onClick={onClose} className="p-2.5 bg-slate-800 rounded-full hover:bg-slate-700 text-slate-400 transition-all">
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar: Foto, Nome, Experiência e PRs */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass p-8 rounded-3xl flex flex-col items-center text-center relative overflow-hidden">
            <div className="relative group mb-6">
              <div className="w-44 h-44 rounded-full border-4 border-emerald-500 p-1 overflow-hidden shadow-2xl shadow-emerald-500/30 bg-slate-800">
                {formData.photoUrl ? (
                  <img src={formData.photoUrl} alt="Avatar" className="w-full h-full object-cover rounded-full" />
                ) : (
                  <img src={`https://picsum.photos/seed/${formData.name}/200/200`} alt="Avatar" className="w-full h-full object-cover rounded-full" />
                )}
              </div>
              {isEditing && (
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-4 right-4 p-3.5 bg-emerald-500 text-white rounded-full shadow-lg hover:scale-110 transition-all z-10 border-4 border-slate-900"
                  title="Alterar Foto"
                >
                  <Camera size={20} />
                </button>
              )}
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handlePhotoUpload} 
              />
            </div>

            {isEditing ? (
              <div className="w-full space-y-4">
                <div className="text-left">
                  <label className="text-[10px] uppercase font-black text-slate-500 mb-1 block">Nome Completo</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={inputClasses}
                  />
                </div>
                <div className="text-left">
                  <label className="text-[10px] uppercase font-black text-slate-500 mb-1 block">Nível</label>
                  <select 
                    name="experience"
                    value={formData.experience}
                    onChange={handleChange}
                    className={inputClasses}
                  >
                     <option value="Iniciante">Iniciante</option>
                     <option value="Intermediário">Intermediário</option>
                     <option value="Avançado">Avançado</option>
                     <option value="Elite">Elite</option>
                  </select>
                </div>
              </div>
            ) : (
              <>
                <h4 className="text-2xl font-bold">{formData.name}</h4>
                <span className="px-4 py-1.5 bg-emerald-500/10 text-emerald-500 rounded-full text-[10px] font-black mt-3 uppercase tracking-widest">{formData.experience}</span>
              </>
            )}
            
            <div className="mt-8 w-full space-y-3">
              <div className="flex flex-col gap-1 p-4 bg-slate-900/50 rounded-2xl border border-slate-800 text-left">
                 <span className="text-slate-500 text-[10px] uppercase font-black">Data de Nascimento</span>
                 {isEditing ? (
                   <input
                    type="date"
                    name="birthDate"
                    value={formData.birthDate}
                    onChange={handleChange}
                    className="bg-transparent text-white font-bold outline-none w-full"
                   />
                 ) : (
                   <span className="font-bold">{formatDate(formData.birthDate)}</span>
                 )}
              </div>
            </div>
          </div>

          {/* Recordes Pessoais */}
          <div className="glass p-6 rounded-3xl">
            <h5 className="font-bold text-lg mb-6 flex items-center gap-2"><Trophy size={18} className="text-emerald-500" /> Recordes Pessoais</h5>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: '5 KM', key: 'k5' },
                { label: '10 KM', key: 'k10' },
                { label: '21 KM', key: 'k21' },
                { label: '42 KM', key: 'k42' },
              ].map(pr => (
                <div key={pr.key} className={`p-4 rounded-2xl border transition-all ${isEditing ? 'bg-slate-900 border-emerald-500/30' : 'bg-slate-900/50 border-slate-800'} flex flex-col items-center`}>
                  <span className="text-[10px] text-slate-500 uppercase font-black mb-1">{pr.label}</span>
                  {isEditing ? (
                    <input
                      type="text"
                      name={`prs.${pr.key}`}
                      value={formData.prs[pr.key as keyof PersonalRecords]}
                      onChange={handleChange}
                      placeholder="--:--"
                      className="w-full bg-transparent text-center font-black text-emerald-500 outline-none"
                    />
                  ) : (
                    <span className={`text-lg font-black ${formData.prs[pr.key as keyof PersonalRecords] === '--:--' ? 'text-slate-700' : 'text-white'}`}>
                      {formData.prs[pr.key as keyof PersonalRecords]}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Conteúdo Principal: Biometria, Limiares e Zonas de FC */}
        <div className="lg:col-span-8 space-y-6">
          <div className="glass p-8 rounded-3xl">
             <h5 className="font-bold text-lg mb-6 flex items-center gap-2"><Activity size={20} className="text-emerald-500" /> Biometria e Fisiologia</h5>
             <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
               {[
                 { label: 'Altura', key: 'height', icon: Ruler, unit: 'cm' },
                 { label: 'Peso', key: 'weight', icon: Weight, unit: 'kg' },
                 { label: 'Gordura', key: 'bodyFat', icon: Percent, unit: '%' },
                 { label: 'VO2 Max', key: 'vo2Max', icon: Activity, unit: '' },
                 { label: 'FC Repouso', key: 'restingHR', icon: Heart, unit: 'bpm' },
                 { label: 'FC Máxima', key: 'maxHR', icon: Heart, unit: 'bpm' },
               ].map(bio => (
                 <div key={bio.key} className={`p-5 rounded-2xl border transition-all ${isEditing ? 'bg-slate-900 border-emerald-500/30' : 'bg-slate-900/50 border-slate-800'}`}>
                    <div className="text-slate-500 mb-2 flex items-center gap-1.5 text-[10px] uppercase font-black">
                      <bio.icon size={14} className={bio.key.includes('HR') ? 'text-rose-500' : ''} /> {bio.label}
                    </div>
                    {isEditing ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step={bio.key === 'bodyFat' || bio.key === 'vo2Max' ? "0.1" : "1"}
                          name={bio.key}
                          value={formData[bio.key as keyof UserProfile] as number}
                          onChange={handleChange}
                          className="w-full bg-transparent text-2xl font-black text-emerald-500 outline-none"
                        />
                        <span className="text-xs text-slate-600">{bio.unit}</span>
                      </div>
                    ) : (
                      <div className="text-2xl font-black">
                        {formData[bio.key as keyof UserProfile] as number} 
                        <span className="text-sm font-normal text-slate-500 ml-1">{bio.unit}</span>
                      </div>
                    )}
                 </div>
               ))}
             </div>

             <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-5 pt-8 border-t border-slate-800">
               <div className={`p-5 rounded-2xl border transition-all ${isEditing ? 'bg-emerald-500/10 border-emerald-500/50' : 'bg-emerald-500/5 border-emerald-500/10'}`}>
                 <div className="text-emerald-500/70 mb-2 flex items-center gap-1.5 text-[10px] uppercase font-black"><Flame size={16} /> Limiar Lactato (Pace)</div>
                 {isEditing ? (
                   <input
                    type="text"
                    name="lactateThresholdPace"
                    value={formData.lactateThresholdPace}
                    onChange={handleChange}
                    className="text-3xl font-black bg-transparent text-emerald-500 outline-none w-full"
                   />
                 ) : (
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-emerald-400">{formData.lactateThresholdPace}</span>
                        <span className="text-xs text-emerald-500/50 font-bold">min/km</span>
                    </div>
                 )}
               </div>
               <div className={`p-5 rounded-2xl border transition-all ${isEditing ? 'bg-emerald-500/10 border-emerald-500/50' : 'bg-emerald-500/5 border-emerald-500/10'}`}>
                 <div className="text-emerald-500/70 mb-2 flex items-center gap-1.5 text-[10px] uppercase font-black"><Heart size={16} /> FC Limiar</div>
                 {isEditing ? (
                   <input
                    type="number"
                    name="lactateThresholdHR"
                    value={formData.lactateThresholdHR}
                    onChange={handleChange}
                    className="text-3xl font-black bg-transparent text-emerald-500 outline-none w-full"
                   />
                 ) : (
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-emerald-400">{formData.lactateThresholdHR}</span>
                        <span className="text-xs text-emerald-500/50 font-bold">bpm</span>
                    </div>
                 )}
               </div>
             </div>
          </div>

          {/* Zonas de FC Automatizadas */}
          <div className="glass p-8 rounded-3xl">
            <div className="flex justify-between items-center mb-8">
              <h5 className="font-bold text-lg flex items-center gap-2"><Heart size={20} className="text-rose-500" /> Zonas de Frequência Cardíaca (Limiar de Lactato)</h5>
              {isEditing && <span className="text-[10px] font-bold text-slate-500 uppercase">Edite os % para customizar</span>}
            </div>
            <div className="space-y-3">
              {zones.map((zone) => {
                const lowPct = zone.isZ5 ? formData.hrZones.z4High : (zone.key === 'z1Low' ? formData.hrZones.z1Low : formData.hrZones[zone.key as keyof HRZones] as number);
                const highPct = zone.isZ5 ? 110 : (formData.hrZones[zone.nextKey as keyof HRZones] as number);
                
                const lowBpm = getBpm(lowPct);
                const highBpm = getBpm(highPct);

                return (
                  <div key={zone.label} className={`flex items-center gap-5 p-4 rounded-2xl border transition-all ${isEditing ? 'bg-slate-900 border-emerald-500/30' : 'bg-slate-950/40 border-slate-800/50'}`}>
                    <div className={`w-14 h-10 ${zone.color} rounded-xl flex items-center justify-center font-black text-white text-xs shadow-lg`}>
                      {zone.label}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            {isEditing ? (
                              <div className="flex items-center gap-1">
                                {!zone.isZ5 && zone.key === 'z1Low' ? (
                                  <input 
                                    type="number" 
                                    value={formData.hrZones.z1Low}
                                    onChange={(e) => handleChange({ target: { name: 'hrZones.z1Low', value: e.target.value, type: 'number' }} as any)}
                                    className="bg-slate-800 border border-emerald-500/30 rounded px-1.5 py-0.5 text-xs font-bold text-emerald-400 w-12 outline-none"
                                  />
                                ) : (
                                  <span className="text-xs font-bold text-slate-400">{lowPct}%</span>
                                )}
                                <span>-</span>
                                {!zone.isZ5 ? (
                                  <input 
                                    type="number" 
                                    value={formData.hrZones[zone.nextKey as keyof HRZones] as number}
                                    onChange={(e) => handleChange({ target: { name: `hrZones.${zone.nextKey}`, value: e.target.value, type: 'number' }} as any)}
                                    className="bg-slate-800 border border-emerald-500/30 rounded px-1.5 py-0.5 text-xs font-bold text-emerald-400 w-12 outline-none"
                                  />
                                ) : (
                                  <span className="text-xs font-bold text-slate-400">MAX</span>
                                )}
                                <span className="text-[10px] text-slate-600 font-bold">%</span>
                              </div>
                            ) : (
                              <span className="text-xs font-black text-slate-500">{zone.isZ5 ? `> ${lowPct}%` : `${lowPct}% - ${highPct}%`}</span>
                            )}
                          </div>
                          <span className="text-base font-bold text-slate-200">
                             {zone.isZ5 ? `> ${lowBpm}` : `${lowBpm} - ${highBpm}`} <span className="text-[10px] text-slate-500 font-normal ml-1 tracking-tighter">bpm</span>
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{zone.desc}</span>
                      </div>
                      <div className="w-full h-1 bg-slate-800 mt-2 rounded-full overflow-hidden">
                        <div className={`h-full ${zone.color} opacity-40`} style={{ width: '100%' }}></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
