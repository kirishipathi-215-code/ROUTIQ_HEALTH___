export function getDashboardUrlForRole(role: string): string {
  switch (role) {
    case 'PATIENT':
      return '/patient-home';
    case 'HOSPITAL_STAFF':
      return '/hospital-dashboard';
    case 'GOVERNMENT_HEALTH_AUTHORITY':
      return '/government-dashboard';
    case 'PLATFORM_ADMIN':
      return '/admin-dashboard';
    case 'AMBULANCE_HELPER':
      return '/patient-home';
    default:
      return '/patient-home';
  }
}
