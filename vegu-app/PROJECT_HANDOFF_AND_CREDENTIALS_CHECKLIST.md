# VEGU Project Handoff and Credentials Checklist

Updated: 2026-07-04

## 1) Current Production Endpoints

- Backend production alias: https://vegu-backend.vercel.app
- Frontend production alias (expected): https://frontend-jet-sigma-69.vercel.app
- Latest frontend deployment URL (from recent deploy): add the latest `vercel --prod` URL here after final deploy completes.

## 2) Android Build Artifacts

Generated artifacts:

- AAB (Play Console upload):
  - `frontend/android/app/build/outputs/bundle/release/app-release.aab`
- APK (device/internal testing):
  - `frontend/android/app/build/outputs/apk/release/app-release-unsigned.apk`

Notes:

- `app-release-unsigned.apk` is unsigned; sign with upload keystore for distribution.
- For Play Console, upload signed AAB.

## 3) Legal and Compliance (Implemented)

- Privacy Policy updated for customer + rider scope.
- Terms & Conditions expanded for customer/rider/vendor/store/admin usage.
- Rider Safety and Compliance policy added for Play review context.
- Account deletion flow implemented for data deletion compliance:
  - API: `DELETE /api/auth/me`
  - UI: Account page -> Delete Account

## 4) Backend-Frontend Connectivity

Required frontend env:

- `NEXT_PUBLIC_API_URL=https://vegu-backend.vercel.app`

If this value is wrong, auth and `/api/*` integration will fail.

## 5) Database and Infra Checklist

This repository uses PostgreSQL via Prisma for backend data.

Verify:

- Backend health endpoint reports DB connected.
- Prisma schema is up to date.
- Production database has all required tables and indexes.

Suggested checks:

1. Run backend health endpoint.
2. Run Prisma generate/migrate status in backend.
3. Confirm admin, customer, rider login/read/write paths.

## 6) Credentials Rotation Checklist

For security, rotate all credentials before final public launch.

Rotate these values in platform secrets, not source files:

- Backend:
  - `DATABASE_URL`
  - `JWT_ACCESS_SECRET`
  - `JWT_REFRESH_SECRET`
  - Payment provider keys (Razorpay/Stripe if enabled)
  - Firebase admin credentials (if configured server-side)
- Frontend:
  - `NEXT_PUBLIC_API_URL`
  - Any public map/API keys used in client
- Deploy:
  - Vercel project/env tokens
  - Git provider tokens/webhooks
- Mobile:
  - Android upload keystore passwords
  - Push messaging credentials (`google-services.json` / FCM as applicable)

## 7) Android Signing Files

Create and keep out of git:

- `frontend/android/keystore.properties`
- upload keystore `.jks`

Template provided:

- `frontend/android/keystore.properties.example`

## 8) Release Commands

From `vegu-app/frontend`:

- `npm run android:prepare`
- `npm run android:bundle`
- `npm run android:apk`

From `vegu-app/backend`:

- `npm run build`

## 9) Play Store Submission Checklist

- Internal testing upload with signed AAB.
- Data safety form completed.
- Privacy policy URL configured.
- Account deletion path documented.
- Content rating completed.
- App access instructions provided if any protected areas exist.
- Store listing assets/screenshots/final description uploaded.

## 10) Source Structure Quick Map

- Backend API: `vegu-app/backend/src`
- Frontend (Next.js): `vegu-app/frontend/src`
- Android wrapper: `vegu-app/frontend/android`
- Prisma schema: `vegu-app/backend/prisma/schema.prisma`
- Release checklist: `vegu-app/PLAYSTORE_RELEASE_CHECKLIST.md`

## 11) What Still Needs Manual Ownership

- Final credential rotation by owner.
- Signed keystore generation/storage by owner.
- Play Console organization and policy declarations by owner account.
- Optional enterprise expansion modules (multi-store operations dashboard, warehouse workflows, etc.) in phased implementation plan.
