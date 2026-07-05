# VEGU Production Deployment Guide

## System Architecture

- customer-app: `vegu-app/frontend` (customer, rider and admin experiences)
- operations-system: `vegu-app/vegu-operations` (store/staff desktop portal)
- backend: `vegu-app/backend` (shared API, auth, business workflows)
- database: PostgreSQL managed by Prisma schema in `vegu-app/backend/prisma/schema.prisma`

All clients use the same secure backend and database with role-based access controls.

## Deploy Targets

1. Backend API: Railway / Render / Azure App Service / Vercel server
2. Customer + Rider + Admin frontend: Vercel (Next.js)
3. Operations web portal: Vercel/Netlify (Vite app)
4. Database: Neon / Supabase / managed PostgreSQL

## Required Environment Variables

Backend (`vegu-app/backend/.env`):

- `DATABASE_URL`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `FRONTEND_URL`
- `OPERATIONS_URL`

Customer frontend (`vegu-app/frontend/.env.production`):

- `NEXT_PUBLIC_API_URL=https://<backend-domain>`

Operations frontend (`vegu-app/vegu-operations/.env`):

- `VITE_API_URL=https://<backend-domain>`

## Build and Validation

Backend:

```bash
cd vegu-app/backend
npm install
npm run db:push
npm run db:seed
npm run build
```

Customer/Rider/Admin frontend:

```bash
cd vegu-app/frontend
npm install
npm run build
```

Operations frontend:

```bash
cd vegu-app/vegu-operations
npm install
npm run build
```

## Admin Bootstrap Flow

1. Login as admin in admin panel.
2. Create stores via admin API (`/api/admin/stores`).
3. Create staff accounts via admin API (`/api/admin/staff`).
4. Assign store and role to each staff member.
5. Staff sign in using operations portal (`/api/operations/auth/login`).

## Security Controls

- JWT access + refresh token architecture
- Dedicated operations auth endpoints
- Role checks on operations and admin routes
- Store-scoped queries for non-global staff
- Password reset tokens with hashing and expiry
- Activity log records for operations stage transitions

## Multi-Store Design

Store isolation is handled using `storeId` on products, orders, vendors, and staff profiles.

- Admin/Owner: global visibility
- Store Manager / Inventory / Packing / Support: scoped visibility by assigned store

## Operational Order Flow

`CUSTOMER_ORDERED -> STORE_RECEIVED -> STORE_ACCEPTED -> PACKING_STARTED -> PACKED -> BARCODE_GENERATED -> RIDER_ASSIGNED -> OUT_FOR_DELIVERY -> DELIVERED`

API endpoint for updates:

- `PATCH /api/operations/orders/:id/stage`

## Documentation Update Map

- Backend architecture: `vegu-app/backend/src`
- Prisma schema + migrations: `vegu-app/backend/prisma`
- Customer/Rider/Admin web app: `vegu-app/frontend/src/app`
- Operations portal: `vegu-app/vegu-operations/src`
