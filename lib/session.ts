import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

// Lazily resolve secret to avoid crashing builds when env is unset.
function getSecretKey(): Uint8Array {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    // In production, require the secret at runtime when we actually need it.
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'NEXTAUTH_SECRET is required in production. ' +
          'Generate one with: openssl rand -base64 32'
      );
    }
    // In non‑prod (dev/test/build), fall back to a deterministic dev secret.
    // This prevents build-time crashes while keeping production strict.
    return new TextEncoder().encode('insecure-development-secret');
  }
  return new TextEncoder().encode(secret);
}

export interface SessionData {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

/**
 * Create a new session token
 */
export async function createSession(userId: string, email: string): Promise<string> {
  const token = await new SignJWT({ userId, email })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d') // 7 days
    .sign(getSecretKey());

  return token;
}

/**
 * Verify and decode session token
 */
export async function verifySession(token: string): Promise<SessionData | null> {
  try {
    const verified = await jwtVerify(token, getSecretKey());
    const payload = verified.payload;
    
    // Validate payload has required fields
    if (
      typeof payload.userId === 'string' &&
      typeof payload.email === 'string' &&
      typeof payload.iat === 'number' &&
      typeof payload.exp === 'number'
    ) {
      return payload as unknown as SessionData;
    }
    
    return null;
  } catch (error) {
    console.error('Session verification failed:', error);
    return null;
  }
}

/**
 * Get current session from cookies
 */
export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;

  if (!token) {
    return null;
  }

  return verifySession(token);
}

/**
 * Set session cookie
 */
export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.set('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });
}

/**
 * Delete session cookie
 */
export async function deleteSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('session');
}

/**
 * Check if user is authenticated (for middleware)
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return session !== null;
}
