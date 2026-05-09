/**
 * k6 Load Test Suite — VEGU Platform
 * Run: k6 run k6-load-test.js
 * Ramp stages simulate real traffic patterns.
 *
 * Thresholds define SLOs (Service Level Objectives):
 *   - 95th percentile response time < 500ms
 *   - 99th percentile < 2000ms
 *   - Error rate < 2%
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// ── Config ────────────────────────────────────────────────────────────────────

const BASE_URL = __ENV.BASE_URL || 'https://vegu-backend.vercel.app';

// Custom metrics
const errorRate = new Rate('errors');
const loginDuration = new Trend('login_duration');
const orderDuration = new Trend('order_duration');
const productListDuration = new Trend('product_list_duration');
const authErrors = new Counter('auth_errors');

// ── Scenarios ─────────────────────────────────────────────────────────────────

export const options = {
  scenarios: {
    // Smoke test — 5 users, 1 minute
    smoke: {
      executor: 'constant-vus',
      vus: 5,
      duration: '1m',
      tags: { scenario: 'smoke' },
      exec: 'browseProducts',
    },
    // Load test — ramp to 50 users over 5 min, hold 5 min, ramp down
    load: {
      executor: 'ramping-vus',
      stages: [
        { duration: '2m', target: 10 },
        { duration: '3m', target: 50 },
        { duration: '5m', target: 50 },
        { duration: '2m', target: 0 },
      ],
      tags: { scenario: 'load' },
      exec: 'typicalUserJourney',
      startTime: '1m30s',
    },
    // Spike test — sudden burst to 200 users
    spike: {
      executor: 'ramping-vus',
      stages: [
        { duration: '30s', target: 5 },
        { duration: '10s', target: 200 },  // spike
        { duration: '1m', target: 200 },   // sustain spike
        { duration: '30s', target: 5 },    // recover
        { duration: '1m', target: 5 },     // verify recovery
      ],
      tags: { scenario: 'spike' },
      exec: 'browseProducts',
      startTime: '15m',
    },
    // Auth stress test — concurrent logins
    authStress: {
      executor: 'ramping-arrival-rate',
      startRate: 5,
      timeUnit: '1s',
      preAllocatedVUs: 30,
      maxVUs: 100,
      stages: [
        { duration: '2m', target: 20 },  // 20 logins/sec
        { duration: '3m', target: 20 },
        { duration: '1m', target: 0 },
      ],
      tags: { scenario: 'auth_stress' },
      exec: 'loginFlow',
      startTime: '25m',
    },
  },

  thresholds: {
    // Overall HTTP error rate < 2%
    'http_req_failed': ['rate<0.02'],
    // 95th percentile < 500ms
    'http_req_duration': ['p(95)<500', 'p(99)<2000'],
    // Login specifically < 1s p95
    'login_duration': ['p(95)<1000'],
    // Product listing < 300ms p95
    'product_list_duration': ['p(95)<300'],
    // Order placement < 2s p95
    'order_duration': ['p(95)<2000'],
  },
};

// ── Scenario functions ────────────────────────────────────────────────────────

export function browseProducts() {
  group('Browse Products', () => {
    // List products
    const listRes = http.get(`${BASE_URL}/api/products?page=1&limit=20`);
    const listOk = check(listRes, {
      'product list 200': (r) => r.status === 200,
      'product list has data': (r) => {
        try { return JSON.parse(r.body).data !== undefined; } catch { return false; }
      },
    });
    errorRate.add(!listOk);
    productListDuration.add(listRes.timings.duration);

    sleep(0.5);

    // Browse categories
    const catRes = http.get(`${BASE_URL}/api/categories`);
    check(catRes, { 'categories 200': (r) => r.status === 200 });

    sleep(0.3);

    // Health check
    const healthRes = http.get(`${BASE_URL}/health`);
    check(healthRes, {
      'health ok': (r) => r.status === 200,
      'db connected': (r) => {
        try { return JSON.parse(r.body).db === 'connected'; } catch { return false; }
      },
    });
  });

  sleep(Math.random() * 2 + 1); // 1-3 second think time
}

export function loginFlow() {
  group('Login Flow', () => {
    const payload = JSON.stringify({
      email: 'admin@vegu.app',
      password: 'VeguAdmin@2024',
    });
    const headers = { 'Content-Type': 'application/json' };

    const loginRes = http.post(`${BASE_URL}/api/auth/login`, payload, { headers });
    const loginOk = check(loginRes, {
      'login status is 200 or 401': (r) => [200, 401].includes(r.status),
      'login not 500': (r) => r.status !== 500,
      'login response time < 2s': (r) => r.timings.duration < 2000,
    });
    loginDuration.add(loginRes.timings.duration);

    if (!loginOk) authErrors.add(1);
    errorRate.add(loginRes.status >= 500);
  });

  sleep(1);
}

export function typicalUserJourney() {
  const headers = { 'Content-Type': 'application/json' };

  group('User Journey', () => {
    // 1. Browse products
    const productsRes = http.get(`${BASE_URL}/api/products?limit=10`);
    check(productsRes, { 'browse products': (r) => r.status === 200 });
    productListDuration.add(productsRes.timings.duration);
    sleep(1);

    // 2. Search
    const searchRes = http.get(`${BASE_URL}/api/products?search=tomato`);
    check(searchRes, { 'search products': (r) => r.status === 200 });
    sleep(0.5);

    // 3. View banners
    const bannerRes = http.get(`${BASE_URL}/api/banners`);
    check(bannerRes, { 'banners load': (r) => [200, 404].includes(r.status) });
    sleep(0.3);

    // 4. Attempt login
    const loginRes = http.post(`${BASE_URL}/api/auth/login`,
      JSON.stringify({ email: `user${__VU}@test.com`, password: 'password' }),
      { headers }
    );
    check(loginRes, {
      'login responds': (r) => r.status !== 500,
      'login within 2s': (r) => r.timings.duration < 2000,
    });
    loginDuration.add(loginRes.timings.duration);
    errorRate.add(loginRes.status >= 500);

    // 5. If logged in, try to fetch orders (401 is fine — user doesn't exist)
    if (loginRes.status === 200) {
      let token = '';
      try { token = JSON.parse(loginRes.body).data.accessToken; } catch { /* skip */ }
      if (token) {
        const ordersRes = http.get(`${BASE_URL}/api/orders`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        check(ordersRes, { 'orders fetch': (r) => r.status === 200 });
      }
    }

    sleep(Math.random() * 3 + 1);
  });
}

// ── Concurrent order stress (separate run) ────────────────────────────────────

export function orderStress() {
  // This tests race conditions in order placement.
  // Run standalone: k6 run --env SCENARIO=order k6-load-test.js
  const headers = { 'Content-Type': 'application/json' };

  group('Order Stress', () => {
    const loginRes = http.post(`${BASE_URL}/api/auth/login`,
      JSON.stringify({ email: 'customer@vegu.app', password: 'Customer@2024' }),
      { headers }
    );

    if (loginRes.status !== 200) {
      errorRate.add(1);
      return;
    }

    let token = '';
    try { token = JSON.parse(loginRes.body).data.accessToken; } catch { return; }

    const orderRes = http.post(`${BASE_URL}/api/orders`,
      JSON.stringify({ addressId: 'placeholder-address', paymentMethod: 'COD' }),
      { headers: { ...headers, Authorization: `Bearer ${token}` } }
    );

    const orderOk = check(orderRes, {
      'order not 500': (r) => r.status !== 500,
      'order responds fast': (r) => r.timings.duration < 3000,
    });
    orderDuration.add(orderRes.timings.duration);
    errorRate.add(!orderOk);
  });

  sleep(0.5);
}
