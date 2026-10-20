"use server";

import prisma from '@/lib/prisma';
import type { EmergencyHandover } from '@prisma/client';
import { getSessionUser } from './auth';
import { logAuditEvent } from './audit';

function toArray(val?: string | null): string[] {
  if (!val) return [];
  try {
    const parsed = JSON.parse(val);
    if (Array.isArray(parsed)) return parsed;
  } catch {}
  return val.split(',').map(s => s.trim()).filter(Boolean);
}

export interface EmergencySummaryResponse {
  success: boolean;
  error?: string;
  data?: {
    healthId: string;
    patientName: string | null;
    age: number | null;
    gender: string | null;
    bloodGroup: string | null;
    emergencyContact: string | null;
    existingConditions: string[];
    allergies: string[];
    medications: string[];
    previousSurgeries: string[];
    latestEmergencyHandover?: EmergencyHandover | null;
  };
}

export async function lookupPatientEmergencySummary(
  healthId: string,
  internalCaller?: { id: string; role: string }
): Promise<EmergencySummaryResponse> {
  const staff = internalCaller ? (internalCaller as any) : await getSessionUser();

  if (!staff) {
    return { success: false, error: 'Authentication required. Please log in as Hospital Staff.' };
  }

  // Server-side RBAC check: only HOSPITAL_STAFF, GOVERNMENT_HEALTH_AUTHORITY, or PLATFORM_ADMIN
  if (
    staff.role !== 'HOSPITAL_STAFF' &&
    staff.role !== 'GOVERNMENT_HEALTH_AUTHORITY' &&
    staff.role !== 'PLATFORM_ADMIN'
  ) {
    await logAuditEvent({
      userId: staff.id,
      userRole: staff.role,
      action: 'UNAUTHORIZED_HOSPITAL_LOOKUP',
      recordType: 'HEALTH_RECORD',
      recordId: healthId,
      status: 'DENIED',
      details: 'Unauthorized role attempted patient Health ID lookup'
    });
    return { success: false, error: 'Access denied: Only authorized Hospital Staff can look up patient summaries.' };
  }

  if (!healthId || typeof healthId !== 'string') {
    return { success: false, error: 'A valid AarogNex Health ID is required.' };
  }

  const cleanHealthId = healthId.trim().toUpperCase();
  const patientUser = await prisma.user.findFirst({
    where: { healthId: cleanHealthId },
    include: {
      patientProfile: true,
      emergencyEvents: {
        orderBy: { startTime: 'desc' },
        take: 1,
        include: { facility: true }
      }
    }
  });

  if (!patientUser) {
    await logAuditEvent({
      userId: staff.id,
      userRole: staff.role,
      action: 'PATIENT_LOOKUP_NOT_FOUND',
      recordType: 'HEALTH_RECORD',
      recordId: cleanHealthId,
      status: 'FAILED',
      details: 'Health ID not found in system'
    });
    return { success: false, error: 'No patient record found for this Health ID.' };
  }

  const profile = patientUser.patientProfile;
  const recentHandover = await prisma.emergencyHandover.findFirst({
    where: { healthId: cleanHealthId },
    orderBy: { createdAt: 'desc' }
  });

  // Audit log success
  await logAuditEvent({
    userId: staff.id,
    userRole: staff.role,
    action: 'HOSPITAL_STAFF_VIEWED_EMERGENCY_SUMMARY',
    recordType: 'HEALTH_RECORD',
    recordId: cleanHealthId,
    status: 'SUCCESS',
    details: 'Minimum necessary clinical summary provided'
  });

  return {
    success: true,
    data: {
      healthId: cleanHealthId,
      patientName: patientUser.name,
      age: profile?.age || null,
      gender: profile?.gender || null,
      bloodGroup: profile?.bloodGroup || null,
      emergencyContact: profile?.emergencyContact || null,
      existingConditions: toArray(profile?.existingConditions),
      allergies: toArray(profile?.allergies),
      medications: toArray(profile?.medications),
      previousSurgeries: toArray(profile?.previousSurgeries),
      latestEmergencyHandover: recentHandover
    }
  };
}