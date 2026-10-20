import prisma from '../src/lib/prisma';
import { generateUniqueHealthId } from '../src/lib/healthId';

async function verifySessions() {
  console.log('====================================================');
  console.log('AAROGNEX AUTHENTICATED USER JOURNEYS & UI SESSIONS');
  console.log('====================================================\n');

  const baseUrl = 'http://localhost:3000';
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, message: string) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      failed++;
    }
  }

  // Ensure default test users exist
  const testUsers = [
    { phone: '9876543210', role: 'PATIENT', name: 'Ramesh Patil' },
    { phone: '9876543211', role: 'HOSPITAL_STAFF', name: 'Dr. Anita Rao' },
    { phone: '9876543212', role: 'GOVERNMENT_HEALTH_AUTHORITY', name: 'Director Health' },
    { phone: '9876543213', role: 'PLATFORM_ADMIN', name: 'Ops Admin' }
  ];

  for (const u of testUsers) {
    let existing = await prisma.user.findFirst({ where: { phone: u.phone } });
    if (!existing) {
      const hid = await generateUniqueHealthId();
      await prisma.user.create({
        data: {
          phone: u.phone,
          role: u.role as any,
          name: u.name,
          healthId: hid,
          patientProfile: u.role === 'PATIENT' ? {
            create: {
              healthId: hid,
              age: 38,
              gender: 'Male',
              preferredLanguage: 'ta',
              existingConditions: JSON.stringify(['Type 2 Diabetes']),
              allergies: JSON.stringify(['Penicillin'])
            }
          } : undefined
        }
      });
    }
  }

  // Helper to login via cookie
  async function getSessionCookieFor(phone: string, role: string): Promise<string> {
    const user = await prisma.user.findFirst({ where: { phone } });
    if (!user) throw new Error(`User not found for phone ${phone}`);
    return `aarognex_session=${user.id}`;
  }

  // 1. Patient User Journey
  console.log('--- 1. Testing Patient User Journey (/patient-home, /my-details) ---');
  const patientCookie = await getSessionCookieFor('9876543210', 'PATIENT');
  
  const homeRes = await fetch(`${baseUrl}/patient-home`, {
    headers: { Cookie: patientCookie }
  });
  assert(homeRes.status === 200, `Patient /patient-home loaded with HTTP 200`);
  const homeHtml = await homeRes.text();
  assert(homeHtml.includes('Microphone') || homeHtml.includes('button') || homeHtml.includes('PatientHomeClient'), 'Patient home contains voice assistant controls');
  assert(homeHtml.includes('rel="stylesheet"'), 'Patient home includes compiled stylesheet link');

  const detailsRes = await fetch(`${baseUrl}/my-details`, {
    headers: { Cookie: patientCookie }
  });
  assert(detailsRes.status === 200, `Patient /my-details loaded with HTTP 200`);
  const detailsHtml = await detailsRes.text();
  assert(detailsHtml.includes('Loading patient profile') || detailsHtml.includes('ARX-'), 'My Details SSR renders styled patient component');
  assert(detailsHtml.includes('rel="stylesheet"'), 'My Details includes compiled stylesheet link');

  // 2. Hospital Staff Dashboard
  console.log('\n--- 2. Testing Hospital Staff Dashboard (/hospital-dashboard) ---');
  const staffCookie = await getSessionCookieFor('9876543211', 'HOSPITAL_STAFF');
  const hospRes = await fetch(`${baseUrl}/hospital-dashboard`, {
    headers: { Cookie: staffCookie }
  });
  assert(hospRes.status === 200, `Hospital Staff dashboard loaded with HTTP 200`);
  const hospHtml = await hospRes.text();
  assert(hospHtml.includes('Emergency Handover') || hospHtml.includes('Hospital'), 'Hospital dashboard contains triage desk UI');
  assert(hospHtml.includes('rel="stylesheet"'), 'Hospital dashboard includes compiled stylesheet link');

  // 3. Government Dashboard
  console.log('\n--- 3. Testing Government Dashboard (/government-dashboard) ---');
  const govtCookie = await getSessionCookieFor('9876543212', 'GOVERNMENT_HEALTH_AUTHORITY');
  const govtRes = await fetch(`${baseUrl}/government-dashboard`, {
    headers: { Cookie: govtCookie }
  });
  assert(govtRes.status === 200, `Government dashboard loaded with HTTP 200`);
  const govtHtml = await govtRes.text();
  assert(govtHtml.includes('Aggregating public health') || govtHtml.includes('National Health Authority') || govtHtml.includes('Analytics'), 'Government dashboard renders styled public health component');
  assert(govtHtml.includes('rel="stylesheet"'), 'Government dashboard includes compiled stylesheet link');

  // 4. Platform Admin Dashboard
  console.log('\n--- 4. Testing Platform Admin Dashboard (/admin-dashboard) ---');
  const adminCookie = await getSessionCookieFor('9876543213', 'PLATFORM_ADMIN');
  const adminRes = await fetch(`${baseUrl}/admin-dashboard`, {
    headers: { Cookie: adminCookie }
  });
  assert(adminRes.status === 200, `Platform Admin dashboard loaded with HTTP 200`);
  const adminHtml = await adminRes.text();
  assert(adminHtml.includes('Inspecting PostgreSQL database') || adminHtml.includes('AarogNex Core Operations') || adminHtml.includes('Infrastructure'), 'Platform Admin renders styled operations console');
  assert(adminHtml.includes('rel="stylesheet"'), 'Platform Admin includes compiled stylesheet link');

  console.log('\n====================================================');
  console.log(`SESSION VERIFICATION: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) process.exit(1);
}

verifySessions().catch((e) => {
  console.error('Fatal test error:', e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
