'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getPatientHealthProfile, updatePatientHealthHistory } from '@/actions/health';
import { logout } from '@/actions/auth';
import { useLanguage } from '@/contexts/LanguageContext';
import { useVoice } from '@/hooks/useVoice';
import { MockAIService } from '@/services/AIService';
import LanguageSelector from '@/components/LanguageSelector';
import PatientNavigation from '@/components/PatientNavigation';
import { 
  ArrowLeft, 
  Copy, 
  Check, 
  Plus, 
  Trash2, 
  ShieldCheck, 
  AlertCircle, 
  Pill, 
  Activity, 
  Scissors, 
  HeartHandshake,
  LogOut
} from 'lucide-react';

export default function MyDetailsClient({ user }: { user: any }) {
  const router = useRouter();
  const { locale, t } = useLanguage();
  const { isListening, transcript, isSpeaking, startListening, stopListening, speak } = useVoice();
  const aiService = new MockAIService();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  // Modal for adding history items
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeCategory, setActiveCategory] = useState<'conditions' | 'allergies' | 'medications' | 'surgeries'>('conditions');
  const [inputVal, setInputVal] = useState('');
  const [pendingVoiceItem, setPendingVoiceItem] = useState<{ field: string; items: string[]; prompt: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    const res = await getPatientHealthProfile();
    if (!res.success) {
      router.push('/login');
      return;
    }
    setProfile(res.data);
    setLoading(false);
  };

  // Voice transcript processing for health history
  useEffect(() => {
    if (transcript && transcript.trim().length > 0) {
      setInputVal(transcript);
      const parsed = aiService.processHealthHistoryVoice(transcript, locale);
      setPendingVoiceItem({
        field: parsed.field,
        items: parsed.detectedItems,
        prompt: parsed.spokenConfirmationPrompt
      });
      speak(parsed.spokenConfirmationPrompt, locale);
    }
  }, [transcript]);

  const copyHealthId = () => {
    if (!profile?.healthId) return;
    navigator.clipboard.writeText(profile.healthId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveItem = async () => {
    if (!profile) return;
    setSaving(true);
    setMessage(null);

    const itemsToAdd = pendingVoiceItem ? pendingVoiceItem.items : [inputVal.trim()].filter(Boolean);
    if (itemsToAdd.length === 0) {
      setSaving(false);
      return;
    }

    let updatedConditions = [...profile.existingConditions];
    let updatedAllergies = [...profile.allergies];
    let updatedMedications = [...profile.medications];
    let updatedSurgeries = [...profile.previousSurgeries];

    const target = pendingVoiceItem ? pendingVoiceItem.field : activeCategory;

    if (target === 'allergies' || target === 'allergy') {
      itemsToAdd.forEach(item => { if (!updatedAllergies.includes(item)) updatedAllergies.push(item); });
    } else if (target === 'medications' || target === 'medication') {
      itemsToAdd.forEach(item => { if (!updatedMedications.includes(item)) updatedMedications.push(item); });
    } else if (target === 'previousSurgeries' || target === 'surgeries') {
      itemsToAdd.forEach(item => { if (!updatedSurgeries.includes(item)) updatedSurgeries.push(item); });
    } else {
      itemsToAdd.forEach(item => { if (!updatedConditions.includes(item)) updatedConditions.push(item); });
    }

    const res = await updatePatientHealthHistory({
      existingConditions: updatedConditions,
      allergies: updatedAllergies,
      medications: updatedMedications,
      previousSurgeries: updatedSurgeries
    });

    if (res.success) {
      setMessage('Updated successfully');
      setProfile({
        ...profile,
        existingConditions: updatedConditions,
        allergies: updatedAllergies,
        medications: updatedMedications,
        previousSurgeries: updatedSurgeries
      });
      setInputVal('');
      setPendingVoiceItem(null);
      setTimeout(() => {
        setShowAddModal(false);
        setMessage(null);
      }, 1000);
    } else {
      setMessage('Failed: ' + res.error);
    }
    setSaving(false);
  };

  const handleRemoveItem = async (category: string, itemToRemove: string) => {
    if (!profile) return;
    let updatedConditions = [...profile.existingConditions];
    let updatedAllergies = [...profile.allergies];
    let updatedMedications = [...profile.medications];
    let updatedSurgeries = [...profile.previousSurgeries];

    if (category === 'allergies') {
      updatedAllergies = updatedAllergies.filter(i => i !== itemToRemove);
    } else if (category === 'medications') {
      updatedMedications = updatedMedications.filter(i => i !== itemToRemove);
    } else if (category === 'surgeries') {
      updatedSurgeries = updatedSurgeries.filter(i => i !== itemToRemove);
    } else {
      updatedConditions = updatedConditions.filter(i => i !== itemToRemove);
    }

    const res = await updatePatientHealthHistory({
      existingConditions: updatedConditions,
      allergies: updatedAllergies,
      medications: updatedMedications,
      previousSurgeries: updatedSurgeries
    });

    if (res.success) {
      setProfile({
        ...profile,
        existingConditions: updatedConditions,
        allergies: updatedAllergies,
        medications: updatedMedications,
        previousSurgeries: updatedSurgeries
      });
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500 font-medium">
        Loading details...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-24">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Link 
              href="/patient-home" 
              className="p-1 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              aria-label="Back to Home"
            >
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="font-extrabold text-slate-900 text-base leading-tight">
                {t('my_details') || 'My Details'}
              </h1>
              <p className="text-[11px] text-teal-700 font-medium leading-none">
                {t('patient_profile') || 'Patient Profile'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <LanguageSelector compact={true} />
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Logout"
              title={t('logout') || 'Logout'}
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 pt-5 space-y-5">
        
        {/* AarogNex Health ID Card */}
        <section className="bg-gradient-to-br from-teal-900 via-teal-800 to-emerald-900 text-white rounded-3xl p-5 shadow-lg relative overflow-hidden space-y-3.5">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-teal-200">
                AarogNex
              </span>
              <h2 className="text-lg font-black tracking-tight">
                {t('health_id') || 'AarogNex Health ID'}
              </h2>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-teal-500/20 border border-teal-300/30 text-teal-100 text-[10px] font-bold">
              Patient
            </span>
          </div>

          {/* Token Box */}
          <div className="bg-black/30 border border-white/15 rounded-2xl p-3.5 flex items-center justify-between gap-2 backdrop-blur-xs">
            <div>
              <div className="text-[9px] uppercase tracking-wider text-teal-200 font-medium">Your Health ID</div>
              <div className="text-xl sm:text-2xl font-mono font-bold tracking-wider text-white select-all">
                {profile?.healthId || 'Generating...'}
              </div>
            </div>
            <button
              onClick={copyHealthId}
              className="px-3 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1 cursor-pointer shrink-0"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              <span>{copied ? t('copied') || 'Copied' : t('copy_id') || 'Copy'}</span>
            </button>
          </div>

          {/* Simple Usage Info */}
          <p className="text-[11px] text-teal-100/90 leading-relaxed pt-0.5">
            {t('health_id_share_info') || 'Share this ID with hospital staff when visiting a clinic or hospital.'}
          </p>
        </section>

        {/* Patient Demographics Card */}
        <section className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            {t('patient_profile') || 'Personal Information'}
          </h3>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <span className="text-[10px] text-slate-500 block">Name</span>
              <span className="font-bold text-slate-900 text-sm">{profile?.name || 'Patient'}</span>
            </div>

            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <span className="text-[10px] text-slate-500 block">Age / Gender</span>
              <span className="font-bold text-slate-900 text-sm">
                {profile?.age ? `${profile.age} yrs` : 'N/A'} / {profile?.gender || 'N/A'}
              </span>
            </div>

            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <span className="text-[10px] text-slate-500 block">{t('emergency_contact') || 'Emergency Contact'}</span>
              <span className="font-bold text-slate-900 text-sm font-mono">{profile?.emergencyContact || 'Not Set'}</span>
            </div>

            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <span className="text-[10px] text-slate-500 block">Preferred Language</span>
              <span className="font-bold text-slate-900 text-sm uppercase">{locale}</span>
            </div>
          </div>
        </section>

        {/* Medical History Section */}
        <section className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {t('medical_history') || 'Medical History'}
              </h3>
              <p className="text-[11px] text-slate-500">
                Shared strictly during admission with doctors.
              </p>
            </div>
            <button
              onClick={() => {
                setInputVal('');
                setPendingVoiceItem(null);
                setShowAddModal(true);
              }}
              className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Plus size={14} />
              <span>{t('edit_history') || 'Add / Edit'}</span>
            </button>
          </div>

          {/* 4 Health History Categories */}
          <div className="space-y-3 text-xs">
            {/* Allergies */}
            <div className="p-3 rounded-xl bg-rose-50/60 border border-rose-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-rose-900 flex items-center gap-1.5">
                  <AlertCircle size={14} className="text-rose-600" />
                  {t('allergies') || 'Critical Allergies'}
                </span>
                <span className="text-[10px] text-rose-600 font-semibold">({profile?.allergies?.length || 0})</span>
              </div>
              {profile?.allergies?.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {profile.allergies.map((item: string, idx: number) => (
                    <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-100 border border-rose-200 text-rose-900 font-medium">
                      {item}
                      <button onClick={() => handleRemoveItem('allergies', item)} className="text-rose-500 hover:text-rose-800 ml-0.5 font-bold cursor-pointer">×</button>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-slate-400 italic">No allergies registered.</p>
              )}
            </div>

            {/* Existing Conditions */}
            <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-900 flex items-center gap-1.5">
                  <Activity size={14} className="text-amber-600" />
                  {t('existing_conditions') || 'Existing Conditions'}
                </span>
                <span className="text-[10px] text-amber-600 font-semibold">({profile?.existingConditions?.length || 0})</span>
              </div>
              {profile?.existingConditions?.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {profile.existingConditions.map((item: string, idx: number) => (
                    <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-100 border border-amber-200 text-amber-900 font-medium">
                      {item}
                      <button onClick={() => handleRemoveItem('conditions', item)} className="text-amber-600 hover:text-amber-900 ml-0.5 font-bold cursor-pointer">×</button>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-slate-400 italic">No conditions registered.</p>
              )}
            </div>

            {/* Current Medications */}
            <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-blue-900 flex items-center gap-1.5">
                  <Pill size={14} className="text-blue-600" />
                  {t('medications') || 'Current Medications'}
                </span>
                <span className="text-[10px] text-blue-600 font-semibold">({profile?.medications?.length || 0})</span>
              </div>
              {profile?.medications?.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {profile.medications.map((item: string, idx: number) => (
                    <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-100 border border-blue-200 text-blue-900 font-medium">
                      {item}
                      <button onClick={() => handleRemoveItem('medications', item)} className="text-blue-600 hover:text-blue-900 ml-0.5 font-bold cursor-pointer">×</button>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-slate-400 italic">No medications listed.</p>
              )}
            </div>

            {/* Previous Surgeries */}
            <div className="p-3 rounded-xl bg-purple-50/60 border border-purple-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-purple-900 flex items-center gap-1.5">
                  <Scissors size={14} className="text-purple-600" />
                  {t('surgeries') || 'Previous Surgeries'}
                </span>
                <span className="text-[10px] text-purple-600 font-semibold">({profile?.previousSurgeries?.length || 0})</span>
              </div>
              {profile?.previousSurgeries?.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {profile.previousSurgeries.map((item: string, idx: number) => (
                    <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-100 border border-purple-200 text-purple-900 font-medium">
                      {item}
                      <button onClick={() => handleRemoveItem('surgeries', item)} className="text-purple-600 hover:text-purple-900 ml-0.5 font-bold cursor-pointer">×</button>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-slate-400 italic">No surgeries recorded.</p>
              )}
            </div>
          </div>
        </section>

        {/* Simple Privacy Banner */}
        <section className="bg-slate-100/80 rounded-2xl p-4 text-[11px] text-slate-600 border border-slate-200 leading-relaxed">
          {t('privacy_simple_notice') || '🔒 Private & Secure. Only shared with authorized doctors during emergency admission.'}
        </section>
      </main>

      {/* Voice & Text Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-5 border border-slate-100 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Add to Medical History</h3>
                <p className="text-[11px] text-slate-500">Speak in your language or type below.</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-700 font-bold text-base cursor-pointer">✕</button>
            </div>

            {/* Category tabs */}
            <div className="grid grid-cols-4 gap-1 bg-slate-100 p-1 rounded-xl text-[11px]">
              {(['conditions', 'allergies', 'medications', 'surgeries'] as const).map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`py-1.5 rounded-lg font-bold capitalize transition-all ${
                    activeCategory === cat ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                  }`}
                >
                  {cat === 'conditions' ? 'Condition' : cat === 'allergies' ? 'Allergy' : cat === 'medications' ? 'Medicine' : 'Surgery'}
                </button>
              ))}
            </div>

            {/* Voice input button */}
            <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-center">
              <button
                type="button"
                onClick={isListening ? stopListening : startListening}
                className={`w-14 h-14 rounded-full flex items-center justify-center text-xl transition-all shadow-md cursor-pointer ${
                  isListening ? 'bg-red-600 text-white animate-pulse' : 'bg-teal-600 hover:bg-teal-700 text-white'
                }`}
              >
                {isListening ? '⏹' : '🎙'}
              </button>
              <span className="mt-2 text-xs font-bold text-slate-700">
                {isListening ? 'Listening...' : 'Tap mic and speak'}
              </span>
            </div>

            {/* Text input */}
            <div>
              <input
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="e.g. Type 2 Diabetes, Penicillin"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-hidden focus:border-teal-600"
              />
            </div>

            {/* Spoken voice confirmation prompt */}
            {pendingVoiceItem && (
              <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 text-xs space-y-1">
                <div className="font-bold text-teal-900 flex items-center gap-1">
                  <span>🔊 Voice Confirmation:</span>
                  {isSpeaking && <span className="text-[10px] animate-pulse font-normal">(Speaking...)</span>}
                </div>
                <p className="text-slate-700 italic">&ldquo;{pendingVoiceItem.prompt}&rdquo;</p>
              </div>
            )}

            {message && (
              <div className="text-xs text-center font-bold text-teal-700">{message}</div>
            )}

            {/* Modal Actions */}
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveItem}
                disabled={saving || (!inputVal && !pendingVoiceItem)}
                className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs disabled:opacity-50 transition-all cursor-pointer"
              >
                {saving ? 'Saving...' : '✓ Confirm & Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Patient Bottom Navigation */}
      <PatientNavigation />
    </div>
  );
}
