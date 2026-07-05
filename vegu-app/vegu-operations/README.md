# VEGU Operations System

Standalone operations portal for store managers, inventory, packing and support teams.

## Features

- Operations-only login (`/api/operations/auth/login`)
- Forgot/reset password flow (`/api/operations/auth/forgot-password`, `/api/operations/auth/reset-password`)
- Role-scoped dashboard (`/api/operations/dashboard`)
- Order workflow updates (`/api/operations/orders/:id/stage`)
- Inventory visibility and stock updates
- Store, rider, vendor and support queue views

## Run

```bash
cd vegu-app/vegu-operations
npm install
npm run dev
```

## Environment

Create `.env` with:

```bash
VITE_API_URL=http://localhost:5000
```

## Roles Supported

- OWNER
- STORE_MANAGER
- INVENTORY_MANAGER
- PACKING_STAFF
- SUPPORT_STAFF
- ADMIN
