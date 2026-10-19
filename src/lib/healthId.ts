import crypto from 'crypto';
import prisma from '@/lib/prisma';

/**
 * Generates a cryptographically secure, non-guessable, non-sequential AarogNex Health ID.
 * Format: ARX-XXXX-XXXX-XXXX
 *
 * Rules:
 * - Does NOT contain phone number, DOB, Aadhaar, or any personal data
 * - Excludes ambiguous characters (0, O, 1, I) to prevent transcription mistakes
 * - Uses Node.js crypto.randomBytes for cryptographic strength
 */
const CHARSET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

export function generateHealthIdString(): string {
  const bytes = crypto.randomBytes(12);
  let chars = '';
  for (let i = 0; i < 12; i++) {
    chars += CHARSET[bytes[i] % CHARSET.length];
  }
  return `ARX-${chars.slice(0, 4)}-${chars.slice(4, 8)}-${chars.slice(8, 12)}`;
}

/**
 * Generates a guaranteed-unique Health ID verified against the database.
 */
export async function generateUniqueHealthId(): Promise<string> {
  let isUnique = false;
  let healthId = '';
  let attempts = 0;

  while (!isUnique && attempts < 10) {
    attempts++;
    healthId = generateHealthIdString();
    const existing = await prisma.user.findUnique({
      where: { healthId }
    });
    if (!existing) {
      isUnique = true;
    }
  }

  if (!isUnique) {
    throw new Error('Failed to generate unique Health ID after multiple attempts');
  }

  return healthId;
}