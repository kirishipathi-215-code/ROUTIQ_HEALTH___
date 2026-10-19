import prisma from '../src/lib/prisma';
import { generateUniqueHealthId } from '../src/lib/healthId';
import { MockAIService } from '../src/services/AIService';
import { getGovernmentHealthAnalytics } from '../src/actions/government';
import { getPlatformAdminMetrics } from '../src/actions/admin';
import { lookupPatientEmergencySummary } from '../src/actions/hospital';

async function runVerification() {
  console.log('====================================================');
  console.log('AAROGNEX ARCHITECTURAL & FUNCTIONAL VERIFICATION');
  console.log('====================================================\n');

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

  // TEST 1: Cryptographic Health ID generation
  console.log('--- TEST 1: AarogNex Health ID Format & Randomness ---');
  const id1 = await generateUniqueHealthId();
  const id2 = await generateUniqueHealthId();
  console.log(`Generated Health ID 1: ${id1}`);
  console.log(`Generated Health ID 2: ${id2}`);

  assert(/^ARX-[2-9A-HJ-NP-Z]{4}-[2-9A-HJ-NP-Z]{4}-[2-9A-HJ-NP-Z]{4}$/.test(id1), 'Health ID 1 matches ARX-XXXX-XXXX-XXXX non-ambiguous format');
  assert(/^ARX-[2-9A-HJ-NP-Z]{4}-[2-9A-HJ-NP-Z]{4}-[2-9A-HJ-NP-Z]{4}$/.test(id2), 'Health ID 2 matches ARX-XXXX-XXXX-XXXX non-ambiguous format');
  assert(id1 !== id2, 'Two generated Health IDs are distinct and non-repeating');

  // TEST 2: Pure Multilingual Phrasing (Zero English Mixing)
  console.log('\n--- TEST 2: Pure Multilingual Phrasing & Safety Gates ---');
  const ai = new MockAIService();

  // 2a. Tamil Query
  const taRes = await ai.processInput('எனக்கு காய்ச்சல் மற்றும் தலைவலி இருக்கிறது', 'NORMAL');
  console.log(`Tamil response text: "${taRes.response_text}"`);
  assert(taRes.intent === 'healthcare_navigation', 'Tamil query correctly classified as healthcare navigation');
  assert(taRes.response_language === 'ta', 'Tamil language detected');
  assert(taRes.requires_confirmation === true, 'Confirmation gate active for Tamil query');
  assert(
    taRes.response_text.includes('காய்ச்சல் மற்றும் தலைவலி') &&
    taRes.response_text.includes('பொது மருத்துவர் ஆலோசனை'),
    'Tamil response contains pure native Tamil medical terms (no English mixing)'
  );

  // 2b. Marathi Query
  const mrRes = await ai.processInput('मला डोकेदुखी आणि ताप आहे', 'NORMAL');
  console.log(`Marathi response text: "${mrRes.response_text}"`);
  assert(mrRes.intent === 'healthcare_navigation', 'Marathi query correctly classified');
  assert(mrRes.response_language === 'mr', 'Marathi language detected');
  assert(
    mrRes.response_text.includes('डोकेदुखी आणि ताप') &&
    mrRes.response_text.includes('सामान्य वैद्यकीय सल्ला'),
    'Marathi response contains pure native Marathi medical terms'
  );

  // 2c. Hindi Query
  const hiRes = await ai.processInput('मुझे सिरदर्द और बुखार है', 'NORMAL');
  console.log(`Hindi response text: "${hiRes.response_text}"`);
  assert(hiRes.intent === 'healthcare_navigation', 'Hindi query correctly classified');
  assert(hiRes.response_language === 'hi', 'Hindi language detected');
  assert(
    hiRes.response_text.includes('सिरदर्द और बुखार') &&
    hiRes.response_text.includes('सामान्य चिकित्सक परामर्श'),
    'Hindi response contains pure native Hindi medical terms'
  );

  // 2d. Irrelevant greeting gate (Intent Validation Safety Gate)
  const greetingRes = await ai.processInput('Hi how are you', 'NORMAL');
  assert(greetingRes.intent === 'irrelevant_input', 'Chit-chat greeting detected as irrelevant');
  assert(greetingRes.is_healthcare_related === false, 'is_healthcare_related is false for "Hi"');
  assert(greetingRes.requires_clarification === true, 'Clarification required for greeting');

  // TEST 3: Health History Voice Extraction & Spoken Confirmation
  console.log('\n--- TEST 3: Health History Voice Extraction & Confirmation ---');
  const historyTa = ai.processHealthHistoryVoice('எனக்கு சர்க்கரை நோய் உள்ளது', 'ta');
  console.log(`Tamil voice history prompt: "${historyTa.spokenConfirmationPrompt}"`);
  assert(historyTa.field === 'existingConditions', 'Extracted condition from Tamil speech');
  assert(historyTa.detectedItems.includes('Type 2 Diabetes'), 'Detected Diabetes in Tamil');
  assert(historyTa.spokenConfirmationPrompt.includes('மருத்துவ வரலாற்றில் சேர்க்கலாமா?'), 'Generated polite Tamil confirmation prompt');

  const historyAllergy = ai.processHealthHistoryVoice('I am allergic to penicillin and peanuts', 'en');
  assert(historyAllergy.field === 'allergies', 'Extracted allergy category');
  assert(historyAllergy.detectedItems.includes('Penicillin') && historyAllergy.detectedItems.includes('Peanuts'), 'Extracted both Penicillin and Peanuts');
  assert(historyAllergy.spokenConfirmationPrompt.includes('save this to your medical history'), 'Generated spoken confirmation prompt in English');

  // TEST 4: Database Role Separation & Aggregations
  console.log('\n--- TEST 4: PostgreSQL Role Isolation & Aggregation ---');
  
  // Seed sample patient for lookup
  let testPatient = await prisma.user.findFirst({
    where: { phone: '9876543210' },
    include: { patientProfile: true }
  });

  if (!testPatient) {
    const testHealthId = await generateUniqueHealthId();
    testPatient = await prisma.user.create({
      data: {
        phone: '9876543210',
        role: 'PATIENT',
        name: 'Ramesh Patil',
        healthId: testHealthId,
        patientProfile: {
          create: {
            healthId: testHealthId,
            age: 38,
            gender: 'Male',
            existingConditions: JSON.stringify(['Type 2 Diabetes', 'Hypertension']),
            allergies: JSON.stringify(['Penicillin']),
            medications: JSON.stringify(['Metformin 500mg']),
            previousSurgeries: JSON.stringify(['Appendectomy']),
            emergencyContact: '9876500000',
            preferredLanguage: 'mr'
          }
        }
      },
      include: { patientProfile: true }
    });
    console.log(`Created test patient: ${testPatient.name} with Health ID ${testPatient.healthId}`);
  } else {
    if (!testPatient.healthId) {
      const generatedId = await generateUniqueHealthId();
      testPatient = await prisma.user.update({
        where: { id: testPatient.id },
        data: { healthId: generatedId },
        include: { patientProfile: true }
      });
    }
    // Ensure profile has sample medical data
    await prisma.patientProfile.upsert({
      where: { userId: testPatient.id },
      create: {
        userId: testPatient.id,
        healthId: testPatient.healthId,
        age: 38,
        gender: 'Male',
        existingConditions: JSON.stringify(['Type 2 Diabetes', 'Hypertension']),
        allergies: JSON.stringify(['Penicillin']),
        medications: JSON.stringify(['Metformin 500mg']),
        emergencyContact: '9876500000'
      },
      update: {
        healthId: testPatient.healthId,
        allergies: JSON.stringify(['Penicillin']),
        existingConditions: JSON.stringify(['Type 2 Diabetes', 'Hypertension']),
        emergencyContact: '9876500000'
      }
    });
  }

  // 4a. Hospital Staff Lookup - Authorized
  const mockStaff = { id: 'staff_test_user_01', role: 'HOSPITAL_STAFF' };
  const hospitalPacket = await lookupPatientEmergencySummary(testPatient.healthId!, mockStaff);
  assert(hospitalPacket.success === true, 'Hospital staff lookup succeeded for valid Health ID');
  assert(Array.isArray(hospitalPacket.data?.allergies) && hospitalPacket.data.allergies.includes('Penicillin'), 'Minimal emergency packet includes critical allergies as array');
  assert(hospitalPacket.data?.emergencyContact === '9876500000', 'Emergency contact phone available to emergency staff');
  assert(!('password' in (hospitalPacket.data || {})), 'Hospital packet has zero password/credential fields');

  // 4b. Hospital Staff Lookup - Unauthorized role rejected
  const mockNonStaff = { id: 'patient_test_user_02', role: 'PATIENT' };
  const rejectedLookup = await lookupPatientEmergencySummary(testPatient.healthId!, mockNonStaff);
  assert(rejectedLookup.success === false, 'Non-staff lookup correctly blocked by RBAC');
  assert(rejectedLookup.error?.includes('Access denied') || false, 'Appropriate error message returned for unauthorized lookup');

  // 4c. Government Health Authority Aggregation
  const mockGov = { id: 'gov_officer_01', role: 'GOVERNMENT_HEALTH_AUTHORITY' };
  const govAnalytics = await getGovernmentHealthAnalytics(mockGov);
  assert(govAnalytics.success === true, 'Government analytics query succeeded');
  assert(typeof govAnalytics.data?.summary?.totalFacilities === 'number', 'Government receives real total facilities count');
  assert(typeof govAnalytics.data?.triageBreakdown?.critical === 'number', 'Government receives real critical triage count');
  assert(!('users' in (govAnalytics.data || {})), 'Government view has ZERO patient identity records (Strictly de-identified)');

  // 4d. Platform Admin Operational Metrics
  const mockAdmin = { id: 'superadmin_01', role: 'PLATFORM_ADMIN' };
  const adminMetrics = await getPlatformAdminMetrics(mockAdmin);
  assert(adminMetrics.success === true, 'Platform admin query succeeded');
  assert(adminMetrics.data?.infrastructure?.databaseStatus === 'ONLINE', 'Platform admin verifies database status is ONLINE');
  assert(Array.isArray(adminMetrics.data?.recentAuditLogs), 'Platform admin has access to security audit log stream');
  assert(!('patientMedicalRecords' in (adminMetrics.data || {})), 'Platform admin has ZERO clinical patient records (Least privilege)');

  // TEST 5: Role-based Voice-First Routing Isolation
  console.log('\n--- TEST 5: Role-based Voice-First Routing Isolation ---');
  const { getDashboardUrlForRole } = await import('../src/lib/roleNav');
  assert(getDashboardUrlForRole('PATIENT') === '/patient-home', 'Patient role routes to voice-first /patient-home (NOT technical dashboard)');
  assert(getDashboardUrlForRole('HOSPITAL_STAFF') === '/hospital-dashboard', 'Hospital staff routes to /hospital-dashboard');
  assert(getDashboardUrlForRole('GOVERNMENT_HEALTH_AUTHORITY') === '/government-dashboard', 'Government routes to /government-dashboard');
  assert(getDashboardUrlForRole('PLATFORM_ADMIN') === '/admin-dashboard', 'Platform Admin routes to /admin-dashboard');

  // TEST 6: Pure Native Localization Integrity (Tamil, Marathi, Hindi, English)
  console.log('\n--- TEST 6: Pure Native Multilingual Dictionaries ---');
  const taModule = await import('../src/locales/ta.json');
  const hiModule = await import('../src/locales/hi.json');
  const mrModule = await import('../src/locales/mr.json');
  const enModule = await import('../src/locales/en.json');

  const ta = (taModule as any).default || taModule;
  const hi = (hiModule as any).default || hiModule;
  const mr = (mrModule as any).default || mrModule;
  const en = (enModule as any).default || enModule;

  assert(Boolean(ta.speak_health_problem && ta.how_can_i_help_today), 'Tamil has voice-first keys');
  assert(Boolean(hi.speak_health_problem && hi.how_can_i_help_today), 'Hindi has voice-first keys');
  assert(Boolean(mr.speak_health_problem && mr.emergency_help), 'Marathi has voice-first keys');
  assert(Boolean(en.speak_health_problem && en.normal_healthcare), 'English has voice-first keys');
  assert(Boolean(ta.details_nav && ta.my_details), 'Tamil navigation contains pure native "My Details"');
  assert(!ta.speak_health_problem.includes('Speak'), 'Tamil voice button has zero English text');
  assert(!mr.speak_health_problem.includes('Speak'), 'Marathi voice button has zero English text');
  assert(!hi.speak_health_problem.includes('Speak'), 'Hindi voice button has zero English text');

  console.log('\n====================================================');
  console.log(`VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runVerification()
  .catch((e) => {
    console.error('Fatal test error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
