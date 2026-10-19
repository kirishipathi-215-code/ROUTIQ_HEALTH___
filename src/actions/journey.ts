"use server";
import prisma from '@/lib/prisma';
import { getSessionUser } from './auth';
import { logAuditEvent } from './audit';

export async function endEmergencySession(data: any) {
  const user = await getSessionUser();
  if (!user) return { error: 'Not logged in' };

  // Fetch patient profile for emergency handover packet
  const profile = await prisma.patientProfile.findUnique({
    where: { userId: user.id }
  });

  const event = await prisma.emergencyEvent.create({
    data: {
      userId: user.id,
      incidentType: data.incident_type || 'unknown',
      consciousness: data.consciousness || 'unknown',
      bleeding: data.bleeding || 'unknown',
      breathing: data.breathing || 'unknown',
      urgency: data.urgency || 'high',
      facilityId: data.facilityId || null,
      distanceKm: data.distanceKm || null,
      etaMins: data.etaMins || null,
      status: 'ARRIVED',
      arrivalTime: new Date()
    }
  });

  // PART 8 & 9: Create minimal Emergency Handover Record
  const healthId = user.healthId || profile?.healthId || 'ARX-EMERGENCY';
  const handover = await prisma.emergencyHandover.create({
    data: {
      emergencyEventId: event.id,
      healthId,
      patientName: user.name,
      age: profile?.age || null,
      incidentType: data.incident_type || 'medical_emergency',
      consciousness: data.consciousness || 'UNKNOWN',
      bleeding: data.bleeding || 'UNKNOWN',
      breathing: data.breathing || 'UNKNOWN',
      requiredCare: (data.incident_type === 'accident' || data.consciousness === 'unconscious') ? 'Trauma Care & ICU' : 'Emergency Evaluation',
      recommendedFacilityId: data.facilityId || null,
      relevantMedicalHistory: profile?.existingConditions || 'None reported',
      allergies: profile?.allergies || 'No known allergies',
      status: 'HANDED_OVER',
      handedOverAt: new Date()
    }
  });

  await logAuditEvent({
    userId: user.id,
    userRole: user.role,
    action: 'EMERGENCY_HANDOVER_CREATED',
    recordType: 'EMERGENCY_EVENT',
    recordId: handover.id,
    status: 'SUCCESS',
    details: `Handover created for Health ID: ${healthId}`
  });

  return { 
    success: true, 
    eventId: event.id, 
    handoverId: handover.id,
    healthId 
  };
}

export async function startCareJourney(data: any) {
  const user = await getSessionUser();
  if (!user) return { error: 'Not logged in' };

  // Check if an active journey exists to prevent duplicate clicks
  const existing = await prisma.careJourney.findFirst({
    where: {
      userId: user.id,
      facilityId: data.facilityId,
      status: 'ACTIVE',
      type: 'NORMAL'
    },
    orderBy: { createdAt: 'desc' }
  });

  if (existing) {
    return { success: true, journeyId: existing.id };
  }

  const journey = await prisma.careJourney.create({
    data: {
      userId: user.id,
      type: 'NORMAL',
      status: 'ACTIVE',
      facilityId: data.facilityId,
      originalRequest: data.originalRequest || 'User requested care',
      detectedNeed: data.detectedNeed || 'General consultation',
      steps: {
        create: [
          { stepName: 'Consultation', status: 'COMPLETED', completedAt: new Date() },
          { stepName: 'Prescription/Labs', status: 'PENDING' },
          { stepName: 'Follow-up', status: 'PENDING' }
        ]
      }
    }
  });

  await logAuditEvent({
    userId: user.id,
    userRole: user.role,
    action: 'START_CARE_JOURNEY',
    recordType: 'CARE_JOURNEY',
    recordId: journey.id,
    status: 'SUCCESS',
    details: 'New care journey started'
  });

  return { success: true, journeyId: journey.id };
}