'use client';

import React, { useState, useEffect } from 'react';
import { useActionState } from 'react';
import { login, registerPatient } from '@/actions/auth';
import { Stethoscope, ShieldAlert, Building2, Landmark, ShieldCheck, Mic, MicOff, CheckCircle2, XCircle } from 'lucide-react';
import ConnectivityStatus from '@/components/ConnectivityStatus';
import { useLanguage } from '@/contexts/LanguageContext';
import { useVoice } from '@/hooks/useVoice';

export default function LoginClient() {
  const { locale, setLocale, t } = useLanguage();
  const { isListening, transcript, startListening, stopListening, speak } = useVoice();
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [selectedRole, setSelectedRole] = useState('PATIENT');
  const [phoneInput, setPhoneInput] = useState('9876543210');
  const [nameInput, setNameInput] = useState('');
  const [voiceNameCandidate, setVoiceNameCandidate] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en');

  const [loginState, loginFormAction, isLoginPending] = useActionState(
    async (prevState: any, formData: FormData) => {
      const res = await login(formData);
      return res;
    },
    null
  );

  const [regState, regFormAction, isRegPending] = useActionState(
    async (prevState: any, formData: FormData) => {
      const res = await registerPatient(formData);
      return res;
    },
    null
  );

  const setRolePreset = (role: string, phone: string) => {
    setSelectedRole(role);
    setPhoneInput(phone);
  };

  // Handle voice speech arrival for name in registration
  useEffect(() => {
    if (!isListening && transcript && tab === 'register') {
      const recognized = transcript.trim();
      setVoiceNameCandidate(recognized);
      const confirmText = selectedLanguage === 'ta'
        ? `நீங்கள் "${recognized}" என்று கூறினீர்கள். இது சரிதானா?`
        : selectedLanguage === 'hi'
        ? `आपने कहा "${recognized}"। क्या यह सही है?`
        : selectedLanguage === 'mr'
        ? `तुम्ही म्हणालात "${recognized}". हे बरोबर आहे का?`
        : `You said "${recognized}". Is this correct?`;
      speak(confirmText, selectedLanguage);
    }
  }, [isListening, transcript, tab, selectedLanguage]);

  const handleStartVoiceName = () => {
    const askText = selectedLanguage === 'ta'
      ? 'உங்கள் பெயர் என்ன?'
      : selectedLanguage === 'hi'
      ? 'आपका नाम क्या है?'
      : selectedLanguage === 'mr'
      ? 'तुमचे नाव काय आहे?'
      : 'What is your name?';
    speak(askText, selectedLanguage);
    startListening();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-50 text-slate-800">
      <div className="w-full max-w-lg bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-teal-600 text-white font-bold text-2xl shadow-md mb-2">
            A
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">AarogNex</h1>
          <p className="text-xs text-slate-500 font-medium">Healthcare Coordination & Triage Platform</p>
          <div className="mt-2 flex justify-center">
            <ConnectivityStatus />
          </div>
        </div>

        {/* Tab switch */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl mb-6 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setTab('login')}
            className={`py-2 rounded-lg transition-all ${
              tab === 'login' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Sign In / Quick Role Access
          </button>
          <button
            type="button"
            onClick={() => setTab('register')}
            className={`py-2 rounded-lg transition-all ${
              tab === 'register' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            New Patient Registration
          </button>
        </div>

        {tab === 'login' ? (
          <form action={loginFormAction} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                Select Your Role
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {/* Patient */}
                <label className="cursor-pointer">
                  <input
                    type="radio"
                    name="role"
                    value="PATIENT"
                    className="peer sr-only"
                    checked={selectedRole === 'PATIENT'}
                    onChange={() => setSelectedRole('PATIENT')}
                  />
                  <div className="p-3 rounded-xl border-2 border-slate-200 peer-checked:border-teal-600 peer-checked:bg-teal-50 hover:bg-slate-50 transition-all text-center">
                    <Stethoscope size={20} className="mx-auto mb-1 text-teal-600 w-5 h-5" />
                    <span className="font-bold text-slate-800 block text-xs">Patient</span>
                    <span className="text-[10px] text-slate-500">Healthcare Assistant</span>
                  </div>
                </label>

                {/* Hospital Staff */}
                <label className="cursor-pointer">
                  <input
                    type="radio"
                    name="role"
                    value="HOSPITAL_STAFF"
                    className="peer sr-only"
                    checked={selectedRole === 'HOSPITAL_STAFF'}
                    onChange={() => setSelectedRole('HOSPITAL_STAFF')}
                  />
                  <div className="p-3 rounded-xl border-2 border-slate-200 peer-checked:border-blue-600 peer-checked:bg-blue-50 hover:bg-slate-50 transition-all text-center">
                    <Building2 size={20} className="mx-auto mb-1 text-blue-600 w-5 h-5" />
                    <span className="font-bold text-slate-800 block text-xs">Hospital Staff</span>
                    <span className="text-[10px] text-slate-500">Emergency Handover</span>
                  </div>
                </label>

                {/* Government Health Authority */}
                <label className="cursor-pointer">
                  <input
                    type="radio"
                    name="role"
                    value="GOVERNMENT_HEALTH_AUTHORITY"
                    className="peer sr-only"
                    checked={selectedRole === 'GOVERNMENT_HEALTH_AUTHORITY'}
                    onChange={() => setSelectedRole('GOVERNMENT_HEALTH_AUTHORITY')}
                  />
                  <div className="p-3 rounded-xl border-2 border-slate-200 peer-checked:border-emerald-600 peer-checked:bg-emerald-50 hover:bg-slate-50 transition-all text-center">
                    <Landmark size={20} className="mx-auto mb-1 text-emerald-600 w-5 h-5" />
                    <span className="font-bold text-slate-800 block text-xs">Govt. Authority</span>
                    <span className="text-[10px] text-slate-500">Regional Analytics</span>
                  </div>
                </label>

                {/* Platform Admin */}
                <label className="cursor-pointer">
                  <input
                    type="radio"
                    name="role"
                    value="PLATFORM_ADMIN"
                    className="peer sr-only"
                    checked={selectedRole === 'PLATFORM_ADMIN'}
                    onChange={() => setSelectedRole('PLATFORM_ADMIN')}
                  />
                  <div className="p-3 rounded-xl border-2 border-slate-200 peer-checked:border-indigo-600 peer-checked:bg-indigo-50 hover:bg-slate-50 transition-all text-center">
                    <ShieldCheck size={20} className="mx-auto mb-1 text-indigo-600 w-5 h-5" />
                    <span className="font-bold text-slate-800 block text-xs">Platform Admin</span>
                    <span className="text-[10px] text-slate-500">Security & Logs</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Quick-fill Role Shortcuts */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-[11px] space-y-1.5">
              <span className="font-bold text-slate-600 uppercase tracking-wider block text-[10px]">
                Test Credentials & Quick Preset
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setRolePreset('PATIENT', '9876543210')}
                  className="px-2 py-1 bg-white border rounded text-left hover:bg-slate-100"
                >
                  <span className="font-bold block text-teal-700">Patient</span>
                  <span className="text-slate-500">9876543210</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRolePreset('HOSPITAL_STAFF', '9876543211')}
                  className="px-2 py-1 bg-white border rounded text-left hover:bg-slate-100"
                >
                  <span className="font-bold block text-blue-700">Staff</span>
                  <span className="text-slate-500">9876543211</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRolePreset('GOVERNMENT_HEALTH_AUTHORITY', '9876543212')}
                  className="px-2 py-1 bg-white border rounded text-left hover:bg-slate-100"
                >
                  <span className="font-bold block text-emerald-700">Govt. Authority</span>
                  <span className="text-slate-500">9876543212</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRolePreset('PLATFORM_ADMIN', '9876543213')}
                  className="px-2 py-1 bg-white border rounded text-left hover:bg-slate-100"
                >
                  <span className="font-bold block text-indigo-700">Platform Admin</span>
                  <span className="text-slate-500">9876543213</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                required
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                placeholder="Enter 10-digit mobile number"
                className="w-full px-3 py-2.5 border-2 border-slate-200 rounded-xl text-sm focus:outline-hidden focus:border-teal-600 font-mono"
              />
            </div>

            {loginState?.error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold">
                {loginState.error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoginPending}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm py-3.5 rounded-xl shadow-md transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isLoginPending ? 'Signing in...' : 'Sign In / Enter Assistant'}
            </button>
          </form>
        ) : (
          <form action={regFormAction} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                  Full Name
                </label>
                <button
                  type="button"
                  onClick={handleStartVoiceName}
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-lg border flex items-center gap-1 cursor-pointer transition-colors ${
                    isListening ? 'bg-red-500 text-white animate-pulse border-red-600' : 'bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100'
                  }`}
                >
                  {isListening ? <Mic size={12} /> : <MicOff size={12} />}
                  <span>{isListening ? 'Listening...' : 'Speak Name'}</span>
                </button>
              </div>
              <input
                type="text"
                name="name"
                required
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="e.g. Ramesh Patil"
                className="w-full px-3 py-2.5 border-2 border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-teal-600"
              />

              {/* Spoken voice confirmation prompt */}
              {voiceNameCandidate && (
                <div className="mt-2 p-2.5 bg-teal-50 border border-teal-200 rounded-xl text-xs flex items-center justify-between gap-2 animate-in fade-in">
                  <div className="leading-tight">
                    <span className="text-[10px] text-teal-800 uppercase font-bold block">Voice Confirmation</span>
                    <span className="font-semibold text-slate-800">&ldquo;{voiceNameCandidate}&rdquo; - Correct?</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setNameInput(voiceNameCandidate);
                        setVoiceNameCandidate(null);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs cursor-pointer shadow-2xs"
                    >
                      ✓ Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => setVoiceNameCandidate(null)}
                      className="px-2 py-1 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs cursor-pointer"
                    >
                      ✕ No
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  name="phone"
                  required
                  placeholder="e.g. 9823000000"
                  className="w-full px-3 py-2.5 border-2 border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-teal-600 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Age
                </label>
                <input
                  type="number"
                  name="age"
                  placeholder="e.g. 35"
                  className="w-full px-3 py-2.5 border-2 border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-teal-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Gender
                </label>
                <select
                  name="gender"
                  className="w-full px-3 py-2.5 border-2 border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-teal-600 bg-white"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Language
                </label>
                <select
                  name="preferredLanguage"
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="w-full px-3 py-2.5 border-2 border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-teal-600 bg-white"
                >
                  <option value="en">English</option>
                  <option value="hi">Hindi (हिंदी)</option>
                  <option value="mr">Marathi (मराठी)</option>
                  <option value="ta">Tamil (தமிழ்)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Emergency Contact Phone
              </label>
              <input
                type="tel"
                name="emergencyContact"
                placeholder="Relative / Caregiver phone"
                className="w-full px-3 py-2.5 border-2 border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-teal-600 font-mono"
              />
            </div>

            {regState?.error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold">
                {regState.error}
              </div>
            )}

            <button
              type="submit"
              disabled={isRegPending}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm py-3.5 rounded-xl shadow-md transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isRegPending ? 'Setting up profile...' : 'Register & Start'}
            </button>
          </form>
        )}

        <div className="mt-6 pt-4 border-t border-slate-100 text-center text-[11px] text-slate-400">
          AarogNex Healthcare Assistant • Safe, Simple & Confidential
        </div>
      </div>
    </div>
  );
}
