"use server";

import { MatchingEngine, MatchRequest, MatchResult } from '@/services/MatchingEngine';

export async function findMatch(request: MatchRequest): Promise<MatchResult[]> {
  if (!request.aiData?.is_healthcare_related) {
    console.warn('[SERVER_ACTION] findMatch blocked: Not healthcare related.');
    return [];
  }
  return MatchingEngine.findFacilities(request);
}
