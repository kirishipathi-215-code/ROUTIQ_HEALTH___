"use server";

import prisma from '@/lib/prisma';
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

function toStringVal(val?: string | string[] | null): string | undefined {
  if (val === undefined || val === null) return undefined;
  if (Array.isArray(val)) return JSON.stringify(val);
  return val;
}

export async function getPatientHealthProfile() {
  const user = await getSessionUser();
  if (!user) {
    return { success: false, error: 'Unauthorized: No active session' };
  }

  // Patients can view their own profile
  if (user.role !== 'PATIENT' && user.role !== 'AMBULANCE_HELPER') {
    await logAuditEvent({
      userId: user.id,
      userRole: user.role,
      action: 'UNAUTHORIZED_PROFILE_ACCESS',
      recordType: 'HEALTH_RECORD',
      status: 'DENIED',
      details: 'Non-patient attempted access to personal health profile'
    });
    return { success: false, error: 'Access denied: Only patients can access their personal health records' };
  }

  const profile = await prisma.patientProfile.findUnique({
    where: { userId: user.id }
  });

  await logAuditEvent({
    userId: user.id,
    userRole: user.role,
    action: 'VIEW_OWN_HEALTH_PROFILE',
    recordType: 'HEALTH_RECORD',
    recordId: user.healthId,
    status: 'SUCCESS'
  });

  return {
    success: true,
    data: {
      id: user.id,
      name: user.name,
      phone: user.phone,
      healthId: user.healthId,
      role: user.role,
      age: profile?.age || null,
      gender: profile?.gender || null,
      bloodGroup: profile?.bloodGroup || null,
      emergencyContact: profile?.emergencyContact || null,
      preferredLanguage: profile?.preferredLanguage || 'en',
      existingConditions: toArray(profile?.existingConditions),
      allergies: toArray(profile?.allergies),
      medications: toArray(profile?.medications),
      previousSurgeries: toArray(profile?.previousSurgeries)
    }
  };
}

export async function updatePatientHealthHistory(data: {
  existingConditions?: string | string[];
  allergies?: string | string[];
  medications?: string | string[];
  previousSurgeries?: string | string[];
  emergencyContact?: string;
  bloodGroup?: string;
  age?: number;
}) {
  const user = await getSessionUser();
  if (!user || user.role !== 'PATIENT') {
    return { success: false, error: 'Unauthorized: Only patients can update their health history' };
  }

  const condStr = toStringVal(data.existingConditions);
  const allergyStr = toStringVal(data.allergies);
  const medStr = toStringVal(data.medications);
  const surgStr = toStringVal(data.previousSurgeries);

  const updatedProfile = await prisma.patientProfile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      healthId: user.healthId,
      existingConditions: condStr,
      allergies: allergyStr,
      medications: medStr,
      previousSurgeries: surgStr,
      emergencyContact: data.emergencyContact,
      bloodGroup: data.bloodGroup,
      age: data.age
    },
    update: {
      existingConditions: condStr,
      allergies: allergyStr,
      medications: medStr,
      previousSurgeries: surgStr,
      emergencyContact: data.emergencyContact,
      bloodGroup: data.bloodGroup,
      age: data.age
    }
  });

  await logAuditEvent({
    userId: user.id,
    userRole: user.role,
    action: 'UPDATE_HEALTH_HISTORY',
    recordType: 'HEALTH_RECORD',
    recordId: user.healthId,
    status: 'SUCCESS',
    details: 'Patient updated health history details'
  });

  return { success: true, profile: updatedProfile };
}

export async function updatePatientLanguage(preferredLanguage: string) {
  const user = await getSessionUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  if (['en', 'hi', 'mr', 'ta'].includes(preferredLanguage)) {
    try {
      await prisma.patientProfile.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          healthId: user.healthId,
          preferredLanguage
        },
        update: {
          preferredLanguage
        }
      });
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  return { success: false, error: 'Invalid language code' };
}