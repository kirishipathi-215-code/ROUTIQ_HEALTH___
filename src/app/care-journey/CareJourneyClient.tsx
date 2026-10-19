"use client";

import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getAIService } from '@/services/AIService';
import { startCareJourney } from '@/actions/journey';
import { useVoice } from '@/hooks/useVoice';
import { FileUp, Mic, MicOff, Send, CheckCircle2, ArrowRight, AlertCircle } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

export default function CareJourneyClient() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const { isListening, transcript, startListening, stopListening, speak } = useVoice();
  
  const [manualText, setManualText] = useState('');
  const [loading, setLoading] = useState(false);
  const [clarification, setClarification] = useState('');
  const [steps, setSteps] = useState<{title: string, desc: string}[] | null>(null);

  const processAdvice = async (text: string) => {
    if (!text.trim()) return;

    setLoading(true);
    try {
      const ai = getAIService();
      const response = await ai.processInput(text, 'JOURNEY');
      if (response.intent === 'journey_steps' && response.data) {
        setSteps(response.data);
        setClarification('');
        speak("Here are your next steps.", response.response_language);
        await startCareJourney({ 
          facilityId: searchParams.get('fid'), 
          originalRequest: text, 
          detectedNeed: response.data.map((s: any) => s.title).join(', ') 
        });
      } else {
        setClarification(response.response_text);
        speak(response.response_text, response.response_language);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleSubmit = () => {
    if (manualText.trim()) {
      processAdvice(manualText);
      setManualText('');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 p-4">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Care Journey Tracker</h1>

      {!steps ? (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center">
          <h2 className="text-lg font-bold text-gray-800 mb-2 text-center">Post-Consultation</h2>
          <p className="text-sm text-gray-500 mb-6 text-center">What did the doctor advise? Speak or type the instructions, or upload a prescription.</p>

          {clarification && (
            <div className="w-full mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm flex items-start gap-2 animate-in fade-in">
              <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
              <span>{clarification}</span>
            </div>
          )}

          <button
            onClick={isListening ? stopListening : startListening}
            className={`w-24 h-24 rounded-full flex flex-col items-center justify-center transition-all shadow-lg mb-6 ${
              isListening 
                ? 'bg-red-500 hover:bg-red-600 animate-pulse text-white' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {isListening ? <Mic size={32} /> : <MicOff size={32} />}
          </button>

          {transcript && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg w-full text-center">
              <p className="italic text-gray-700">"{transcript}"</p>
              {!isListening && (
                <button onClick={() => processAdvice(transcript)} className="mt-2 text-blue-600 font-bold text-sm">
                  Analyze Instructions
                </button>
              )}
            </div>
          )}

          <div className="w-full flex gap-2 mb-4">
            <input 
              type="text" 
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="e.g. Get a blood test..."
              className="flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-blue-600 outline-none bg-white"
            />
            <button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg flex items-center justify-center transition-colors">
              <Send size={20} />
            </button>
          </div>

          <div className="relative flex items-center w-full my-4">
            <div className="flex-grow border-t border-gray-200"></div>
            <span className="flex-shrink-0 mx-4 text-gray-400 text-sm font-medium">OR</span>
            <div className="flex-grow border-t border-gray-200"></div>
          </div>

          <button className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 text-gray-600 p-4 rounded-xl hover:bg-gray-50 transition-colors">
            <FileUp />
            <span className="font-semibold">Upload Prescription</span>
          </button>

          {loading && (
             <div className="mt-6 flex flex-col items-center text-blue-600">
               <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600 mb-2"></div>
               <p className="font-medium text-sm">Analyzing doctor's advice...</p>
             </div>
          )}
        </div>
      ) : (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-100">
          <h2 className="text-xl font-bold text-blue-900 mb-6">Your Next Steps</h2>
          
          <div className="relative border-l-2 border-blue-100 ml-4 space-y-8">
            {steps.map((step, idx) => (
              <div key={idx} className="relative pl-6">
                <div className="absolute -left-2 top-0 bg-blue-600 text-white p-1 rounded-full shadow-md z-10">
                  <ArrowRight size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 text-lg">{step.title}</h3>
                  <p className="text-gray-500 mt-1">{step.desc}</p>
                </div>
              </div>
            ))}

            <div className="relative pl-6 opacity-50">
              <div className="absolute -left-2 top-0 bg-gray-300 text-white p-1 rounded-full shadow-md z-10">
                <CheckCircle2 size={16} />
              </div>
              <div>
                <h3 className="font-bold text-gray-800 text-lg">Journey Complete</h3>
                <p className="text-gray-500 mt-1">Go home and rest.</p>
              </div>
            </div>
          </div>

          <button onClick={() => setSteps(null)} className="w-full mt-8 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl border transition-colors">
            Update Instructions
          </button>
        </div>
      )}
    </div>
  );
}
