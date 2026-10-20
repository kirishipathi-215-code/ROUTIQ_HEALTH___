import prisma from '@/lib/prisma';
import { PrismaClient, Facility } from '@prisma/client';
import { AIResponse } from './AIService';
import { RuleEngine } from './RuleEngine';


export interface MatchRequest {
  aiData: AIResponse;
  userLatitude?: number;
  userLongitude?: number;
  confirmed?: boolean;
}

export interface MatchResult {
  facility: Facility;
  distanceKm: number;
  estimatedTimeMin: number;
  matchScore: number;
  reasons: string[];
}

export class MatchingEngine {
  static async findFacilities(request: MatchRequest): Promise<MatchResult[]> {
    const { aiData, userLatitude, userLongitude, confirmed } = request;

    // PART 3 & PART 11 HEALTHCARE INTENT GATE
    if (!aiData || aiData.is_healthcare_related === false) {
      console.warn('[MATCHING] Blocked: Input is not healthcare related. Matching rejected.');
      return [];
    }

    if (aiData.requires_confirmation && confirmed !== true) {
      console.warn('[MATCHING] Blocked: User confirmation missing. Matching rejected.');
      return [];
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log(`[MATCHING] allowed = true, intent = ${aiData.intent}, need = ${aiData.healthcare_need}`);
    }

    let requiredTypes: string[] = [];
    let requiresEmergency = false;
    let requiresTrauma = false;

    if (aiData.intent === 'emergency') {
      const emergencyRules = RuleEngine.evaluateEmergency(aiData);
      requiresEmergency = emergencyRules.requiresEmergencyCare;
      requiresTrauma = emergencyRules.requiresTraumaCare;
      requiredTypes = ['DISTRICT_HOSPITAL', 'PRIVATE', 'MEDICAL_COLLEGE', 'PHC'];
    } else {
      // Normal flow
      if (aiData.service_category === 'specialist_follow_up') {
        requiredTypes = ['DISTRICT_HOSPITAL', 'PRIVATE', 'MEDICAL_COLLEGE', 'CLINIC'];
      } else {
        requiredTypes = ['PHC', 'CHC', 'CLINIC', 'DISTRICT_HOSPITAL', 'PRIVATE'];
      }
    }

    const facilities = await prisma.facility.findMany({ include: { specialists: true } });
    
    let matches: MatchResult[] = [];

    for (const facility of facilities) {
      if (requiredTypes.length > 0 && !requiredTypes.includes(facility.type)) continue;

      // Filtering strictly required capabilities
      if (requiresEmergency && !facility.emergencyCare) continue;
      if (requiresTrauma && !facility.traumaCare) continue;

      // Scoring
      let score = 0;
      const reasons: string[] = [];

      if (facility.availabilityStatus === 'AVAILABLE') {
        score += 50;
        reasons.push('Currently available');
      } else if (facility.availabilityStatus === 'UNAVAILABLE' && aiData.intent === 'emergency') {
        // Discard unavailable facilities for emergencies if possible
        continue;
      }

      // Exact capability matches
      if (aiData.intent === 'emergency') {
        if (facility.emergencyCare) reasons.push('Emergency care available');
        if (requiresTrauma && facility.traumaCare) reasons.push('Required capability available (Trauma)');
        if (facility.icu) reasons.push('ICU available');
      } else {
        reasons.push('Suitable option for your need');
      }

      // Specialist matching
      if (aiData.intent !== 'emergency' && aiData.service_category === 'specialist_follow_up' && aiData.healthcare_need) {
        const requiredSpecialty = aiData.healthcare_need.toLowerCase();
        // @ts-ignore - dynamic include
        const hasSpecialist = facility.specialists?.some((s: any) => s.specialty.toLowerCase().includes(requiredSpecialty) || requiredSpecialty.includes(s.specialty.toLowerCase()));
        
        if (hasSpecialist) {
          // @ts-ignore
          const isAvail = facility.specialists.find((s: any) => s.specialty.toLowerCase().includes(requiredSpecialty) || requiredSpecialty.includes(s.specialty.toLowerCase()))?.isAvailable;
          if (isAvail) {
            score += 30;
            reasons.push('Specialist available');
          } else {
            score += 10;
            reasons.push('Specialist on staff (currently unavailable)');
          }
        }
      }

      // Distance and ETA (simulated if no GPS)
      // For demo, if userLocation is missing, assume Nashik center (20.0, 73.78)
      const uLat = userLatitude ?? 20.0;
      const uLng = userLongitude ?? 73.78;

      const distanceKm = this.calculateDistance(uLat, uLng, facility.latitude, facility.longitude);
      const estimatedTimeMin = Math.round(distanceKm * 2.5); // very rough estimate

      // Distance penalty
      score -= distanceKm * 2;
      
      reasons.push(`Distance: ${distanceKm.toFixed(1)} km`);
      reasons.push(`ETA: ~${estimatedTimeMin} mins`);

      matches.push({
        facility,
        distanceKm: parseFloat(distanceKm.toFixed(1)),
        estimatedTimeMin,
        matchScore: score,
        reasons
      });
    }

    // Sort by score descending
    matches.sort((a, b) => b.matchScore - a.matchScore);

    return matches;
  }

  // Haversine formula
  private static calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
}



