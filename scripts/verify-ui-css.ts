async function verifyUICSS() {
  console.log('====================================================');
  console.log('AAROGNEX CSS PIPELINE & UI ROUTE VERIFICATION');
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

  // 1. Check Login Page HTML & CSS
  console.log('--- 1. Testing /login Route & Stylesheet Link ---');
  const loginRes = await fetch(`${baseUrl}/login`);
  assert(loginRes.status === 200, `/login returned HTTP 200 (actual: ${loginRes.status})`);
  const loginHtml = await loginRes.text();
  
  // Extract CSS link
  const cssMatch = loginHtml.match(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"/);
  assert(cssMatch !== null, 'Found <link rel="stylesheet"> in HTML head');
  
  if (cssMatch) {
    const cssPath = cssMatch[1];
    console.log(`Extracted CSS URL: ${cssPath}`);
    const cssRes = await fetch(`${baseUrl}${cssPath}`);
    assert(cssRes.status === 200, `CSS bundle returned HTTP 200 (actual: ${cssRes.status})`);
    
    const cssContent = await cssRes.text();
    console.log(`CSS bundle size: ${cssContent.length} bytes`);
    assert(cssContent.length > 50000, `CSS bundle contains substantial compiled stylesheet (>50KB)`);

    // Verify key Tailwind v4 design system classes
    const criticalClasses = [
      'bg-teal-600',
      'rounded-3xl',
      'shadow-xl',
      'border-slate-100',
      'text-slate-800',
      'font-bold',
      'grid-cols-2',
      'animate-pulse',
      'max-w-lg',
      'min-h-screen'
    ];

    for (const cls of criticalClasses) {
      assert(cssContent.includes(cls), `CSS includes critical utility class: .${cls}`);
    }
  }

  // 2. Check Other Key Routes
  console.log('\n--- 2. Testing Application Route Accessibility & Stylesheet Inclusion ---');
  const routesToTest = [
    { path: '/login', desc: 'Sign-in & registration portal' },
    { path: '/emergency', desc: 'Emergency intake & 108 dispatch' },
    { path: '/normal', desc: 'Normal healthcare intake' },
    { path: '/admin', desc: 'Admin demo interface' }
  ];

  for (const r of routesToTest) {
    const res = await fetch(`${baseUrl}${r.path}`);
    assert(res.status === 200, `${r.path} (${r.desc}) returned HTTP 200`);
    const html = await res.text();
    assert(html.includes('rel="stylesheet"'), `${r.path} includes stylesheet link tag`);
    assert(!html.includes('Internal Server Error'), `${r.path} contains no server errors`);
  }

  // 3. Authenticated / Role Protected Routes (Expect redirect or 200, not 500)
  console.log('\n--- 3. Testing Protected Role Routes ---');
  const protectedRoutes = [
    { path: '/patient-home', name: 'Patient Home (Voice-First)' },
    { path: '/my-details', name: 'Patient Details (Health ID)' },
    { path: '/records', name: 'Care Records' },
    { path: '/hospital-dashboard', name: 'Hospital Staff Dashboard' },
    { path: '/government-dashboard', name: 'Government Dashboard' },
    { path: '/admin-dashboard', name: 'Platform Admin Dashboard' }
  ];

  for (const p of protectedRoutes) {
    // With redirect: 'manual', we verify it either serves or safely redirects unauthorized requests to /login
    const res = await fetch(`${baseUrl}${p.path}`, { redirect: 'manual' });
    const isOkOrRedirect = res.status === 200 || res.status === 307 || res.status === 302 || res.status === 303;
    assert(isOkOrRedirect, `${p.path} (${p.name}) handled cleanly with status ${res.status} (no 500 crashes)`);
  }

  console.log('\n====================================================');
  console.log(`VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) process.exit(1);
}

verifyUICSS().catch((e) => {
  console.error('Fatal test error:', e);
  process.exit(1);
});
