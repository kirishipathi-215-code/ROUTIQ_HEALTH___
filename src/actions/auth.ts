"use server";
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { generateUniqueHealthId } from '@/lib/healthId';
import { logAuditEvent } from './audit';
import { getDashboardUrlForRole } from '@/lib/roleNav';

export async function login(formData: FormData) {
  const phone = formData.get('phone') as string;
  const role = (formData.get('role') as string) || 'PATIENT';

  if (!phone) {
    return { error: 'Phone number is required' };
  }

  try {
    // Find or create user
    let user = await prisma.user.findUnique({
      where: { phone },
      include: { patientProfile: true }
    });

    if (!user) {
      // Generate Health ID for any new user
      const healthId = await generateUniqueHealthId();

      let defaultName = 'Demo Patient';
      if (role === 'HOSPITAL_STAFF') defaultName = 'Dr. Sharma (Staff)';
      else if (role === 'GOVERNMENT_HEALTH_AUTHORITY') defaultName = 'Govt. Health Officer (Nashik)';
      else if (role === 'PLATFORM_ADMIN') defaultName = 'System Administrator';
      else if (role === 'AMBULANCE_HELPER') defaultName = 'Demo Ambulance Helper';

      user = await prisma.user.create({
        data: {
          phone,
          role,
          name: defaultName,
          healthId
        },
        include: { patientProfile: true }
      });

      if (role === 'PATIENT') {
        await prisma.patientProfile.create({
          data: {
            userId: user.id,
            healthId,
            age: 30,
            gender: 'Other',
            preferredLanguage: 'en'
          }
        });
      }
    } else {
      // Ensure Health ID exists even for existing demo users
      if (!user.healthId) {
        const newHealthId = await generateUniqueHealthId();
        user = await prisma.user.update({
          where: { id: user.id },
          data: { healthId: newHealthId },
          include: { patientProfile: true }
        });

        if (user.patientProfile && !user.patientProfile.healthId) {
          await prisma.patientProfile.update({
            where: { userId: user.id },
            data: { healthId: newHealthId }
          });
        }
      }
    }

    // Set HTTP-only cookie
    (await cookies()).set('aarognex_session', user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    });

    // Log successful login (non-blocking)
    try {
      await logAuditEvent({
        userId: user.id,
        userRole: user.role,
        action: 'LOGIN',
        recordType: 'AUTH',
        status: 'SUCCESS',
        details: `Role: ${user.role}`
      });
    } catch {
      // Audit log failure must not block login
    }

    // Role-based redirection
    redirect(getDashboardUrlForRole(user.role));
  } catch (err: unknown) {
    // next/navigation redirect throws a special error — re-throw it
    if (
      err instanceof Error &&
      (err.message === 'NEXT_REDIRECT' || err.message.startsWith('NEXT_REDIRECT'))
    ) {
      throw err;
    }
    console.error('[login] DB error:', (err as Error)?.message ?? err);
    return { error: 'Unable to connect to the database. Please try again in a moment.' };
  }
}

export async function registerPatient(formData: FormData) {
  const name = formData.get('name') as string;
  const phone = formData.get('phone') as string;
  const ageStr = formData.get('age') as string;
  const gender = (formData.get('gender') as string) || 'Unspecified';
  const preferredLanguage = (formData.get('preferredLanguage') as string) || 'en';
  const emergencyContact = formData.get('emergencyContact') as string;

  if (!phone || !name) {
    return { error: 'Name and phone number are required' };
  }

  try {
    const existing = await prisma.user.findUnique({
      where: { phone }
    });

    if (existing) {
      return { error: 'A profile with this phone number already exists. Please log in.' };
    }

    const healthId = await generateUniqueHealthId();
    const age = ageStr ? parseInt(ageStr, 10) : undefined;

    const user = await prisma.user.create({
      data: {
        name,
        phone,
        role: 'PATIENT',
        healthId,
        patientProfile: {
          create: {
            healthId,
            age,
            gender,
            preferredLanguage,
            emergencyContact: emergencyContact || null
          }
        }
      }
    });

    // Set HTTP-only cookie
    (await cookies()).set('aarognex_session', user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    });

    // Log registration (non-blocking)
    try {
      await logAuditEvent({
        userId: user.id,
        userRole: 'PATIENT',
        action: 'REGISTER_PATIENT',
        recordType: 'AUTH',
        recordId: healthId,
        status: 'SUCCESS',
        details: 'New patient registered'
      });
    } catch {
      // Audit log failure must not block registration
    }

    redirect('/patient-home');
  } catch (err: unknown) {
    if (
      err instanceof Error &&
      (err.message === 'NEXT_REDIRECT' || err.message.startsWith('NEXT_REDIRECT'))
    ) {
      throw err;
    }
    console.error('[registerPatient] DB error:', (err as Error)?.message ?? err);
    return { error: 'Registration failed. Please check your connection and try again.' };
  }
}

export async function logout() {
  try {
    const user = await getSessionUser();
    if (user) {
      try {
        await logAuditEvent({
          userId: user.id,
          userRole: user.role,
          action: 'LOGOUT',
          recordType: 'AUTH',
          status: 'SUCCESS'
        });
      } catch {
        // Audit log failure must not block logout
      }
    }
  } catch {
    // Session lookup failure must not block logout
  }
  (await cookies()).delete('aarognex_session');
  redirect('/login');
}

export async function getSessionUser() {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('aarognex_session')?.value;
    if (!sessionId) return null;

    const user = await prisma.user.findUnique({
      where: { id: sessionId },
      include: { patientProfile: true }
    });
    return user;
  } catch {
    return null;
  }
}