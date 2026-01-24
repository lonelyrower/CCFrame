import { test, expect } from '@playwright/test';

test.describe('API Endpoints', () => {
  test('GET /api/photos with isPublic=true should return photos', async ({ request }) => {
    const response = await request.get('/api/photos?isPublic=true');

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('photos');
    expect(Array.isArray(data.photos)).toBe(true);
  });

  test('GET /api/tags should return tags', async ({ request }) => {
    const response = await request.get('/api/tags');

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
  });

  test('GET /api/albums should return albums', async ({ request }) => {
    const response = await request.get('/api/albums');

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
  });

  test('GET /api/series should return series', async ({ request }) => {
    const response = await request.get('/api/series');

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
  });

  test('GET /api/site-copy should return site copy', async ({ request }) => {
    const response = await request.get('/api/site-copy');

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toBeDefined();
  });

  test('GET /api/photos without auth should only return public photos', async ({ request }) => {
    const response = await request.get('/api/photos?isPublic=true');

    expect(response.status()).toBe(200);

    const data = await response.json();
    // All returned photos should be public
    data.photos.forEach((photo: { isPublic: boolean }) => {
      expect(photo.isPublic).toBe(true);
    });
  });

  test('protected API routes should return 401 without auth', async ({ request }) => {
    // POST to photos should require auth
    const postResponse = await request.post('/api/photos', {
      data: { title: 'Test' },
    });
    expect(postResponse.status()).toBe(401);

    // DELETE should require auth
    const deleteResponse = await request.delete('/api/photos/test-id');
    expect(deleteResponse.status()).toBe(401);
  });

  test('POST /api/auth/login with invalid credentials should return error', async ({ request }) => {
    const response = await request.post('/api/auth/login', {
      data: {
        email: 'invalid@example.com',
        password: 'wrongpassword',
      },
    });

    // Should be 401 or similar error status
    expect(response.status()).toBeGreaterThanOrEqual(400);
  });
});
