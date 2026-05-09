/**
 * Security Tests — privilege escalation, path traversal, injection, IDOR.
 */
import request from 'supertest';
import app from '../app';

// ── Privilege escalation ──────────────────────────────────────────────────────

describe('Privilege escalation protection', () => {
  it('customer cannot access admin dashboard', async () => {
    // Even with a valid-looking customer token, admin routes must return 401/403
    const res = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', 'Bearer customer_token_here');
    expect([401, 403]).toContain(res.status);
  });

  it('customer cannot list all users', async () => {
    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', 'Bearer customer_token_here');
    expect([401, 403]).toContain(res.status);
  });

  it('unauthenticated user cannot access vendor routes', async () => {
    const res = await request(app).get('/api/vendor/orders');
    expect(res.status).toBe(401);
  });

  it('unauthenticated user cannot access rider routes', async () => {
    const res = await request(app).get('/api/rider/deliveries');
    expect(res.status).toBe(401);
  });
});

// ── Admin route enumeration ───────────────────────────────────────────────────

describe('Admin API lockdown', () => {
  const adminRoutes = [
    ['GET', '/api/admin/dashboard'],
    ['GET', '/api/admin/users'],
    ['GET', '/api/admin/vendors'],
    ['GET', '/api/admin/products'],
    ['GET', '/api/admin/orders'],
    ['GET', '/api/admin/analytics'],
    ['GET', '/api/admin/inventory'],
    ['GET', '/api/admin/coupons'],
    ['GET', '/api/admin/banners'],
    ['POST', '/api/admin/coupons'],
    ['POST', '/api/admin/banners'],
  ];

  test.each(adminRoutes)('%s %s requires authentication', async (method, path) => {
    const res = await (request(app) as unknown as Record<string, (path: string) => request.Test>)[method.toLowerCase()](path);
    expect([401, 403]).toContain(res.status);
    expect(res.status).not.toBe(200);
    expect(res.status).not.toBe(500);
  });
});

// ── Path traversal ────────────────────────────────────────────────────────────

describe('Path traversal protection', () => {
  it('does not process path traversal in product slug', async () => {
    const res = await request(app).get('/api/products/../../../etc/passwd');
    expect([400, 404]).toContain(res.status);
    expect(res.status).not.toBe(500);
  });

  it('does not crash on URL-encoded path traversal', async () => {
    const res = await request(app).get('/api/products/%2e%2e%2fetc%2fpasswd');
    expect([400, 404]).toContain(res.status);
  });
});

// ── XSS in query params ───────────────────────────────────────────────────────

describe('XSS injection in API params', () => {
  it('handles XSS in product search query', async () => {
    const res = await request(app).get('/api/products?search=<script>alert(1)</script>');
    expect(res.status).not.toBe(500);
    // Response body must not echo raw script tags
    expect(JSON.stringify(res.body)).not.toContain('<script>');
  });

  it('handles XSS in category filter', async () => {
    const res = await request(app).get('/api/products?categoryId="><img src=x onerror=alert(1)>');
    expect(res.status).not.toBe(500);
    expect(JSON.stringify(res.body)).not.toContain('onerror=');
  });
});

// ── HTTP method override ──────────────────────────────────────────────────────

describe('HTTP method security', () => {
  it('rejects PUT on endpoints that only accept PATCH', async () => {
    const res = await request(app).put('/api/auth/profile');
    // Should not match any route — 404 is expected
    expect([404, 405]).toContain(res.status);
  });
});

// ── Sensitive data exposure ───────────────────────────────────────────────────

describe('Sensitive data not exposed', () => {
  it('login response never contains password hash', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'admin@vegu.app',
      password: 'wrongpassword',
    });
    expect(JSON.stringify(res.body)).not.toContain('$2b$');  // bcrypt hash prefix
    expect(JSON.stringify(res.body)).not.toContain('password');
  });

  it('register response never contains password hash', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Test',
      email: `test${Date.now()}@security.test`,
      password: 'SecurePass123!',
    });
    expect(JSON.stringify(res.body)).not.toContain('$2b$');
    expect(JSON.stringify(res.body)).not.toMatch(/"password"/);
  });

  it('API never returns JWT secrets in response', async () => {
    const res = await request(app).get('/health');
    expect(JSON.stringify(res.body)).not.toContain('secret');
    expect(JSON.stringify(res.body)).not.toContain('SECRET');
  });
});

// ── Large payload DoS protection ──────────────────────────────────────────────

describe('Payload size limits', () => {
  it('rejects body larger than 1MB', async () => {
    const hugeBody = JSON.stringify({ data: 'x'.repeat(1.5 * 1024 * 1024) });
    const res = await request(app)
      .post('/api/auth/register')
      .set('Content-Type', 'application/json')
      .send(hugeBody);
    expect([400, 413]).toContain(res.status);
    expect(res.status).not.toBe(500);
  });
});

// ── IDOR — Insecure Direct Object Reference ───────────────────────────────────

describe('IDOR protection on orders', () => {
  it('unauthenticated user cannot access any order by ID', async () => {
    const res = await request(app).get('/api/orders/some-order-id-123');
    expect(res.status).toBe(401);
  });

  it('unauthenticated user cannot cancel any order', async () => {
    const res = await request(app).patch('/api/orders/some-order-id-123/cancel');
    expect(res.status).toBe(401);
  });
});
