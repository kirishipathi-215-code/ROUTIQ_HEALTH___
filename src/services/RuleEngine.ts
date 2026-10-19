import { AIResponse } from './AIService';

export interface EmergencyRulesOutput {
  requiresEmergencyCare: boolean;
  requiresTraumaCare: boolean;
  requiresIcu: boolean;
  urgencyLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  recommendedAction: string;
}

export class RuleEngine {
  static evaluateEmergency(aiData: AIResponse): EmergencyRulesOutput {
    // If not healthcare related, don't trigger emergency care
    if (aiData.is_healthcare_related === false) {
      return {
        requiresEmergencyCare: false,
        requiresTraumaCare: false,
        requiresIcu: false,
        urgencyLevel: 'LOW',
        recommendedAction: 'No emergency care indicated. Input is not healthcare related.'
      };
    }

    let requiresEmergencyCare = true; // By default for validated emergency mode
    let requiresTraumaCare = false;
    let requiresIcu = false;
    let urgencyLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM';

    // Rule: Unconscious patient
    if (aiData.consciousness === 'unconscious') {
      requiresTraumaCare = true;
      requiresIcu = true;
      urgencyLevel = 'CRITICAL';
    }

    // Rule: Accident
    if (aiData.incident_type === 'accident') {
      requiresTraumaCare = true;
      if (urgencyLevel !== 'CRITICAL') {
        urgencyLevel = 'HIGH';
      }
    }

    // Rule: Severe bleeding
    if (aiData.bleeding === 'severe') {
      requiresTraumaCare = true;
      requiresEmergencyCare = true;
      urgencyLevel = 'CRITICAL';
    }

    // Rule: Breathing difficulty
    if (aiData.breathing === 'difficult') {
      requiresIcu = true;
      urgencyLevel = 'CRITICAL';
    }
    
    // Rule: Chest pain / Cardiac
    if (aiData.incident_type === 'cardiac_emergency' || 
        aiData.injury_information?.toLowerCase().includes('chest pain') || 
        aiData.injury_information?.toLowerCase().includes('heart')) {
      requiresIcu = true;
      urgencyLevel = 'CRITICAL';
    }

    return {
      requiresEmergencyCare,
      requiresTraumaCare,
      requiresIcu,
      urgencyLevel,
      recommendedAction: 'Immediate admission to a facility with appropriate critical care capabilities.'
    };
  }
}