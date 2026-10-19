"use client";

import { useState } from 'react';
import { Database, BrainCircuit, Route as RouteIcon, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AdminClient() {
  const [activeTab, setActiveTab] = useState<'JOURNEY' | 'RESOURCE' | 'AI'>('AI');

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="bg-slate-900 text-white p-4 shadow-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/">
            <ArrowLeft className="text-slate-300 hover:text-white" />
          </Link>
          <h1 className="text-xl font-bold">Admin Demo</h1>
        </div>
        <Link
          href="/admin-dashboard"
          className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg font-semibold shadow-xs"
        >
          Open Platform Console →
        </Link>
      </header>

      <div className="flex border-b border-gray-200 bg-white shadow-sm">
        <button 
          onClick={() => setActiveTab('AI')}
          className={`flex-1 py-4 flex flex-col items-center gap-1 font-semibold text-sm border-b-2 transition-colors ${activeTab === 'AI' ? 'border-purple-600 text-purple-700' : 'border-transparent text-gray-500'}`}
        >
          <BrainCircuit size={20} /> AI Data
        </button>
        <button 
          onClick={() => setActiveTab('RESOURCE')}
          className={`flex-1 py-4 flex flex-col items-center gap-1 font-semibold text-sm border-b-2 transition-colors ${activeTab === 'RESOURCE' ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500'}`}
        >
          <Database size={20} /> Resources
        </button>
        <button 
          onClick={() => setActiveTab('JOURNEY')}
          className={`flex-1 py-4 flex flex-col items-center gap-1 font-semibold text-sm border-b-2 transition-colors ${activeTab === 'JOURNEY' ? 'border-green-600 text-green-700' : 'border-transparent text-gray-500'}`}
        >
          <RouteIcon size={20} /> Journeys
        </button>
      </div>

      <main className="flex-1 p-4">
        {activeTab === 'AI' && (
          <div className="animate-in fade-in duration-300">
            <div className="bg-white rounded-xl shadow border p-4 mb-4">
              <span className="text-xs font-bold bg-purple-100 text-purple-700 px-2 py-1 rounded mb-2 inline-block">EMERGENCY MODE</span>
              <p className="font-medium text-gray-800 italic mb-2">"अपघात झाला आहे. रुग्ण बेशुद्ध आहे."</p>
              <pre className="bg-slate-50 p-3 rounded-lg border font-mono text-xs text-slate-700 overflow-x-auto">{`{
  "intent": "emergency",
  "incident_type": "accident",
  "consciousness": "unconscious",
  "bleeding": "none",
  "urgency": "critical"
}`}</pre>
            </div>

            <div className="bg-white rounded-xl shadow border p-4">
              <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded mb-2 inline-block">NORMAL MODE</span>
              <p className="font-medium text-gray-800 italic mb-2">"माझ्या किडनीच्या समस्येसाठी फॉलोअप हवा आहे."</p>
              <pre className="bg-slate-50 p-3 rounded-lg border font-mono text-xs text-slate-700 overflow-x-auto">{`{
  "intent": "healthcare_navigation",
  "healthcare_need": "kidney_follow_up",
  "service_category": "specialist_follow_up"
}`}</pre>
            </div>
          </div>
        )}

        {activeTab === 'RESOURCE' && (
          <div className="animate-in fade-in duration-300 bg-white rounded-xl shadow border overflow-hidden">
            <table className="w-full text-sm text-left text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                <tr>
                  <th className="px-4 py-3">Facility</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="px-4 py-3 font-medium text-gray-900">Nashik Civil</td>
                  <td className="px-4 py-3">District Hosp.</td>
                  <td className="px-4 py-3 text-green-600 font-bold">Available</td>
                </tr>
                <tr className="border-b">
                  <td className="px-4 py-3 font-medium text-gray-900">Trimbakeshwar</td>
                  <td className="px-4 py-3">PHC</td>
                  <td className="px-4 py-3 text-green-600 font-bold">Available</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-gray-900">Sanjeevani</td>
                  <td className="px-4 py-3">Private</td>
                  <td className="px-4 py-3 text-red-600 font-bold">Full</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'JOURNEY' && (
          <div className="animate-in fade-in duration-300">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-white p-4 rounded-xl shadow border border-l-4 border-l-green-500">
                <div className="text-sm text-gray-500">Total</div>
                <div className="text-2xl font-bold">1,248</div>
              </div>
              <div className="bg-white p-4 rounded-xl shadow border border-l-4 border-l-red-500">
                <div className="text-sm text-gray-500">Emergency</div>
                <div className="text-2xl font-bold">86</div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl shadow border">
              <ul className="space-y-3">
                <li className="text-sm border-b pb-2"><span className="font-bold text-gray-700">Kidney Follow-up</span> - Completed</li>
                <li className="text-sm border-b pb-2"><span className="font-bold text-red-600">Accident Response</span> - Route Active</li>
                <li className="text-sm"><span className="font-bold text-gray-700">General Checkup</span> - Completed</li>
              </ul>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
