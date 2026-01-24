#!/usr/bin/env node
/**
 * Simple E2E API Tests
 * Tests API endpoints without requiring a browser
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

const tests = [];
let passed = 0;
let failed = 0;

function test(name, fn) {
  tests.push({ name, fn });
}

async function runTests() {
  console.log('🧪 Running E2E API Tests\n');
  console.log(`Base URL: ${BASE_URL}\n`);
  console.log('─'.repeat(50));

  for (const { name, fn } of tests) {
    try {
      await fn();
      console.log(`✅ ${name}`);
      passed++;
    } catch (error) {
      console.log(`❌ ${name}`);
      console.log(`   Error: ${error.message}\n`);
      failed++;
    }
  }

  console.log('─'.repeat(50));
  console.log(`\n📊 Results: ${passed} passed, ${failed} failed, ${tests.length} total\n`);
  
  process.exit(failed > 0 ? 1 : 0);
}

function expect(actual) {
  return {
    toBe(expected) {
      if (actual !== expected) {
        throw new Error(`Expected ${expected}, but got ${actual}`);
      }
    },
    toContain(expected) {
      if (!actual.includes(expected)) {
        throw new Error(`Expected "${actual}" to contain "${expected}"`);
      }
    },
    toBeTruthy() {
      if (!actual) {
        throw new Error(`Expected truthy value, but got ${actual}`);
      }
    },
    toBeGreaterThanOrEqual(expected) {
      if (actual < expected) {
        throw new Error(`Expected ${actual} to be >= ${expected}`);
      }
    }
  };
}

// ============= Test Cases =============

test('Homepage returns 200', async () => {
  const response = await fetch(BASE_URL);
  expect(response.status).toBe(200);
});

test('Homepage contains CCFrame title', async () => {
  const response = await fetch(BASE_URL);
  const html = await response.text();
  expect(html).toContain('CCFrame');
});

test('Photos page returns 200', async () => {
  const response = await fetch(`${BASE_URL}/photos`);
  expect(response.status).toBe(200);
});

test('Tags page returns 200', async () => {
  const response = await fetch(`${BASE_URL}/tags`);
  expect(response.status).toBe(200);
});

test('Series page returns 200', async () => {
  const response = await fetch(`${BASE_URL}/series`);
  expect(response.status).toBe(200);
});

test('Admin login page returns 200', async () => {
  const response = await fetch(`${BASE_URL}/admin/login`);
  expect(response.status).toBe(200);
});

test('API: GET /api/photos returns JSON', async () => {
  const response = await fetch(`${BASE_URL}/api/photos`);
  const contentType = response.headers.get('content-type');
  expect(contentType).toContain('application/json');
});

test('API: GET /api/albums returns JSON', async () => {
  const response = await fetch(`${BASE_URL}/api/albums`);
  const contentType = response.headers.get('content-type');
  expect(contentType).toContain('application/json');
});

test('API: GET /api/tags returns JSON', async () => {
  const response = await fetch(`${BASE_URL}/api/tags`);
  const contentType = response.headers.get('content-type');
  expect(contentType).toContain('application/json');
});

test('API: GET /api/series returns JSON', async () => {
  const response = await fetch(`${BASE_URL}/api/series`);
  const contentType = response.headers.get('content-type');
  expect(contentType).toContain('application/json');
});

test('API: POST /api/auth/login without credentials returns error', async () => {
  const response = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  });
  expect(response.status).toBeGreaterThanOrEqual(400);
});

test('Manifest.json exists and returns valid JSON', async () => {
  const response = await fetch(`${BASE_URL}/manifest.json`);
  expect(response.status).toBe(200);
  const data = await response.json();
  expect(data.name).toBeTruthy();
});

test('Non-existent page returns 404', async () => {
  const response = await fetch(`${BASE_URL}/non-existent-page-xyz`);
  expect(response.status).toBe(404);
});

// Run all tests
runTests();
