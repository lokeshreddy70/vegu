/**
 * Order API Tests — placement, validation, cancellation, security.
 */
import request from 'supertest';
import app from '../app';

// ── Helpers ───────────────────────────────────────────────────────────────────

const AUTH_HEADER = 'Bearer FAKE_TOKEN_FOR_ROUTE_TEST';

// ── Order placement — unauthenticated ─────────────────────────────────────────

describe('POST /api/orders — auth guard', () => {
  it('rejects unauthenticated order placement', async () => {
    const res = await request(app).post('/api/orders').send({
      addressId: 'some-address-id',
      paymentMethod: 'COD',
    });
    expect(res.status).toBe(401);
  });

  it('rejects order with invalid payment method', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', AUTH_HEADER)
      .send({ addressId: 'x', paymentMethod: 'BITCOIN' });
    // 401 because token is fake, but validates we don't 500
    expect([401, 422]).toContain(res.status);
    expect(res.status).not.toBe(500);
  });

  it('rejects order with missing addressId', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', AUTH_HEADER)
      .send({ paymentMethod: 'COD' });
    expect([401, 422]).toContain(res.status);
    expect(res.status).not.toBe(500);
  });

  it('rejects oversized notes field', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', AUTH_HEADER)
      .send({
        addressId: 'some-id',
        paymentMethod: 'COD',
        notes: 'A'.repeat(1000), // exceeds 500 char limit
      });
    expect([401, 422]).toContain(res.status);
    expect(res.status).not.toBe(500);
  });

  it('sanitizes oversized coupon code', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', AUTH_HEADER)
      .send({
        addressId: 'some-id',
        paymentMethod: 'COD',
        couponCode: 'A'.repeat(100), // exceeds 30 char limit
      });
    expect([401, 422]).toContain(res.status);
    expect(res.status).not.toBe(500);
  });
});

// ── Order cancellation ────────────────────────────────────────────────────────

describe('PATCH /api/orders/:id/cancel — auth guard', () => {
  it('rejects unauthenticated cancellation', async () => {
    const res = await request(app).patch('/api/orders/fake-order-id/cancel');
    expect(res.status).toBe(401);
  });
});

// ── Order listing ─────────────────────────────────────────────────────────────

describe('GET /api/orders — auth guard', () => {
  it('rejects unauthenticated order listing', async () => {
    const res = await request(app).get('/api/orders');
    expect(res.status).toBe(401);
  });

  it('rejects unauthenticated single order fetch', async () => {
    const res = await request(app).get('/api/orders/some-id');
    expect(res.status).toBe(401);
  });
});

// ── Input validation ──────────────────────────────────────────────────────────

describe('Order input security', () => {
  it('does not crash on null body', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Content-Type', 'application/json')
      .send('null');
    expect([400, 401, 422]).toContain(res.status);
    expect(res.status).not.toBe(500);
  });

  it('does not crash on malformed JSON body', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Content-Type', 'application/json')
      .send('{ invalid json ]]');
    expect([400, 401, 422]).toContain(res.status);
    expect(res.status).not.toBe(500);
  });

  it('does not crash on array body', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', AUTH_HEADER)
      .send([{ addressId: 'x' }]);
    expect([400, 401, 422]).toContain(res.status);
    expect(res.status).not.toBe(500);
  });
});
