"use server";

import prisma from '@/lib/prisma';

export interface AuditLogParams {
  userId?: string | null;
  userRole: string;
  action: string;
  recordType: 'HEALTH_RECORD' | 'EMERGENCY_EVENT' | 'CARE_JOURNEY' | 'FACILITY' | 'SYSTEM' | 'AUTH';
  recordId?: string | null;
  status: 'SUCCESS' | 'DENIED' | 'FAILED';
  details?: string | null; // Operational details only - NEVER sensitive clinical text
}

export async function logAuditEvent(params: AuditLogParams) {
  try {
    let validUserId = params.userId || null;
    if (validUserId) {
      const exists = await prisma.user.findUnique({
        where: { id: validUserId },
        select: { id: true }
      });
      if (!exists) validUserId = null;
    }

    await prisma.auditLog.create({
      data: {
        userId: validUserId,
        userRole: params.userRole,
        action: params.action,
        recordType: params.recordType,
        recordId: params.recordId || null,
        status: params.status,
        details: params.details || null,
        timestamp: new Date()
      }
    });
  } catch {
    // Non-blocking: audit failure should not crash primary operations
  }
}