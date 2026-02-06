import fs from 'node:fs/promises';
import path from 'node:path';

const requiredEnv = [
  'DATABASE_URL',
  'NEXTAUTH_SECRET',
  'ADMIN_EMAIL',
  'ADMIN_PASSWORD',
  'BASE_URL',
  'NEXTAUTH_URL',
];

const defaultValues = {
  NEXTAUTH_SECRET: [
    'your-nextauth-secret-change-this-to-something-secure',
    'change-this-nextauth-secret-to-something-secure',
  ],
  ADMIN_EMAIL: ['admin@example.com', 'admin@ccframe.local'],
  ADMIN_PASSWORD: ['change-this-password', 'admin123', 'admin123456'],
};

const localStorageDirs = [
  path.join('public', 'uploads'),
  path.join('private', 'uploads'),
];

function isBlank(value) {
  return !value || value.trim().length === 0;
}

function logWarn(message) {
  console.warn(`WARN: ${message}`);
}

function logError(message) {
  console.error(`ERROR: ${message}`);
}

function isLocalhostUrl(value) {
  try {
    const parsed = new URL(value);
    return (
      parsed.hostname === 'localhost' ||
      parsed.hostname === '127.0.0.1' ||
      parsed.hostname === '::1'
    );
  } catch {
    return false;
  }
}

async function main() {
  const isProd = process.env.NODE_ENV === 'production';
  let hasError = false;

  const missing = requiredEnv.filter((key) => isBlank(process.env[key]));
  if (missing.length) {
    logError(`Missing required env: ${missing.join(', ')}`);
    hasError = true;
  }

  for (const [key, badValues] of Object.entries(defaultValues)) {
    const value = process.env[key];
    if (!value) continue;
    if (badValues.includes(value)) {
      const msg = `${key} is using a default value`;
      if (isProd) {
        logError(msg);
        hasError = true;
      } else {
        logWarn(msg);
      }
    }
  }

  if (isProd) {
    const baseUrl = process.env.BASE_URL || '';
    const nextAuthUrl = process.env.NEXTAUTH_URL || '';
    if (baseUrl && !baseUrl.startsWith('https://') && !isLocalhostUrl(baseUrl)) {
      logError('BASE_URL should be https:// in production (localhost is the only exception)');
      hasError = true;
    }
    if (nextAuthUrl && !nextAuthUrl.startsWith('https://') && !isLocalhostUrl(nextAuthUrl)) {
      logError('NEXTAUTH_URL should be https:// in production (localhost is the only exception)');
      hasError = true;
    }
  }

  const nextAuthSecret = process.env.NEXTAUTH_SECRET || '';
  if (nextAuthSecret && nextAuthSecret.length < 32) {
    const message = 'NEXTAUTH_SECRET should be at least 32 characters';
    if (isProd) {
      logError(message);
      hasError = true;
    } else {
      logWarn(message);
    }
  }

  const adminPassword = process.env.ADMIN_PASSWORD || '';
  if (adminPassword && adminPassword.length < 8) {
    const message = 'ADMIN_PASSWORD should be at least 8 characters';
    if (isProd) {
      logError(message);
      hasError = true;
    } else {
      logWarn(message);
    }
  }

  if ((process.env.STORAGE_PROVIDER || 'local') === 'local') {
    for (const dir of localStorageDirs) {
      try {
        await fs.access(dir);
      } catch {
        logWarn(`Missing storage dir: ${dir}`);
      }
    }
  }

  const nodeMajor = Number(process.versions.node.split('.')[0]);
  if (Number.isNaN(nodeMajor) || nodeMajor < 18) {
    logError(`Node.js 18+ required, current: ${process.versions.node}`);
    hasError = true;
  }

  if (hasError) {
    process.exit(1);
  }

  console.log('Preflight OK');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
