/**
 * Auth API Tests — registration, login, refresh, logout, session management.
 * Uses supertest against the Express app (no real DB needed: mocked via jest).
 */
import request from 'supertest';
import app from '../app';

// ── Helpers ───────────────────────────────────────────────────────────────────

const validUser = {
  name: 'Test User',
  email: `test.${Date.now()}@vegu.test`,
  password: 'SecurePass123!',
};

// ── Registration ──────────────────────────────────────────────────────────────

describe('POST /api/auth/register', () => {
  it('rejects missing name', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'x@y.com', password: 'pass1234' });
    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
  });

  it('rejects invalid email', async () => {
    const res = await request(app).post('/api/auth/register').send({ name: 'Bob', email: 'not-an-email', password: 'pass1234' });
    expect(res.status).toBe(422);
  });

  it('rejects password shorter than 8 chars', async () => {
    const res = await request(app).post('/api/auth/register').send({ name: 'Bob', email: 'bob@test.com', password: 'short' });
    expect(res.status).toBe(422);
  });

  it('rejects empty body', async () => {
    const res = await request(app).post('/api/auth/register').send({});
    expect(res.status).toBe(422);
  });

  it('rejects SQL injection in email field', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Hacker',
      email: "' OR '1'='1",
      password: 'password123',
    });
    expect(res.status).toBe(422);
  });

  it('rejects XSS payload in name', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: '<script>alert(1)</script>',
      email: 'xss@test.com',
      password: 'password123',
    });
    // Should either reject (if validation strips HTML) or succeed but name is stored safely
    // The response must not reflect the script tag back unsafely
    if (res.status === 201) {
      expect(JSON.stringify(res.body)).not.toContain('<script>');
    }
  });

  it('returns 400 for oversized payload', async () => {
    const hugePayload = { name: 'A'.repeat(100000), email: 'big@test.com', password: 'pass1234' };
    const res = await request(app).post('/api/auth/register').send(hugePayload);
    // Either validation error or body too large
    expect([400, 413, 422]).toContain(res.status);
  });
});

// ── Login ─────────────────────────────────────────────────────────────────────

describe('POST /api/auth/login', () => {
  it('rejects missing credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.status).toBe(422);
  });

  it('rejects invalid email format', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'notanemail', password: 'pass' });
    expect(res.status).toBe(422);
  });

  it('returns 401 for non-existent user', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'doesnotexist@nowhere.com',
      password: 'wrongpassword',
    });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    // SECURITY: must not leak whether email exists or password is wrong
    expect(res.body.message).toBe('Invalid credentials');
  });

  it('does not expose which field was wrong (enumeration protection)', async () => {
    const wrongEmail = await request(app).post('/api/auth/login').send({ email: 'nobody@test.com', password: 'pass1234' });
    const wrongPass = await request(app).post('/api/auth/login').send({ email: validUser.email, password: 'wrongpassword' });
    // Both should return the exact same message to prevent user enumeration
    expect(wrongEmail.body.message).toBe(wrongPass.body.message);
  });
});

// ── Refresh token ─────────────────────────────────────────────────────────────

describe('POST /api/auth/refresh', () => {
  it('rejects missing refresh token', async () => {
    const res = await request(app).post('/api/auth/refresh').send({});
    expect(res.status).toBe(400);
  });

  it('rejects tampered/invalid refresh token', async () => {
    const res = await request(app).post('/api/auth/refresh').send({
      refreshToken: 'eyJhbGciOiJIUzI1NiJ9.tampered.signature',
    });
    expect(res.status).toBe(401);
  });

  it('rejects plaintext garbage as refresh token', async () => {
    const res = await request(app).post('/api/auth/refresh').send({ refreshToken: 'not.a.jwt' });
    expect(res.status).toBe(401);
  });
});

// ── Auth middleware ───────────────────────────────────────────────────────────

describe('Authentication middleware', () => {
  it('rejects requests with no token on protected route', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('rejects malformed bearer token', async () => {
    const res = await request(app).get('/api/auth/me').set('Authorization', 'Bearer INVALID.TOKEN.HERE');
    expect(res.status).toBe(401);
  });

  it('rejects Authorization header without Bearer prefix', async () => {
    const res = await request(app).get('/api/auth/me').set('Authorization', 'Token sometoken');
    expect(res.status).toBe(401);
  });

  it('rejects JWT with wrong signature', async () => {
    // Valid structure, wrong secret
    const fakeToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJmYWtlIiwicm9sZSI6IkFETUlOIiwiZW1haWwiOiJhZG1pbkB0ZXN0LmNvbSIsImlhdCI6MTcwMDAwMDAwMCwiZXhwIjo5OTk5OTk5OTk5fQ.wrongsignature';
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${fakeToken}`);
    expect(res.status).toBe(401);
  });
});

// ── Route protection ──────────────────────────────────────────────────────────

describe('Admin route protection', () => {
  it('rejects unauthenticated access to admin dashboard', async () => {
    const res = await request(app).get('/api/admin/dashboard');
    expect(res.status).toBe(401);
  });

  it('rejects unauthenticated access to admin users', async () => {
    const res = await request(app).get('/api/admin/users');
    expect(res.status).toBe(401);
  });

  it('rejects unauthenticated order placement', async () => {
    const res = await request(app).post('/api/orders').send({ addressId: 'x', paymentMethod: 'COD' });
    expect(res.status).toBe(401);
  });
});

// ── Input validation / injection ──────────────────────────────────────────────

describe('SQL injection protection', () => {
  it('handles SQL injection in login email', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: "admin@test.com'; DROP TABLE users; --",
      password: 'anything',
    });
    expect([401, 422]).toContain(res.status);
    // Must not return 500 (server crash / actual SQL execution)
    expect(res.status).not.toBe(500);
  });

  it('handles NoSQL injection attempt in login', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: { $gt: '' },
      password: { $gt: '' },
    });
    expect([400, 422]).toContain(res.status);
    expect(res.status).not.toBe(200);
  });
});

// ── CORS ──────────────────────────────────────────────────────────────────────

describe('CORS headers', () => {
  it('returns CORS headers for allowed origin', async () => {
    const res = await request(app)
      .options('/api/auth/login')
      .set('Origin', 'http://localhost:3000')
      .set('Access-Control-Request-Method', 'POST');
    expect(res.headers['access-control-allow-origin']).toBeDefined();
  });

  it('blocks unlisted origins', async () => {
    const res = await request(app)
      .get('/api/products')
      .set('Origin', 'https://evil-attacker.com');
    // CORS blocked — no allow-origin header for this origin
    expect(res.headers['access-control-allow-origin']).not.toBe('https://evil-attacker.com');
  });
});

// ── Health check ──────────────────────────────────────────────────────────────

describe('GET /health', () => {
  it('returns a health status object', async () => {
    const res = await request(app).get('/health');
    expect([200, 503]).toContain(res.status);
    expect(res.body).toHaveProperty('status');
    expect(res.body).toHaveProperty('timestamp');
    expect(res.body).toHaveProperty('db');
  });
});

// ── Rate limiting ─────────────────────────────────────────────────────────────

describe('Rate limiting', () => {
  it('responds with 429 after exceeding auth limit', async () => {
    // Send 16 requests (limit is 15) — at least one should be rate limited
    const requests = Array.from({ length: 16 }, () =>
      request(app).post('/api/auth/login').send({ email: 'spam@test.com', password: 'wrongpass' })
    );
    const responses = await Promise.all(requests);
    const statuses = responses.map(r => r.status);
    // At some point we should get a 429
    expect(statuses.some(s => s === 429)).toBe(true);
  }, 30000);
});

// ── Not found ─────────────────────────────────────────────────────────────────

describe('404 handling', () => {
  it('returns structured 404 for unknown routes', async () => {
    const res = await request(app).get('/api/nonexistent-route-xyz');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
