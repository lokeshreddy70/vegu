# VEGU Android Phase 2 Plan (Implemented + Next)

## Implemented in repo

- Capacitor config added: frontend/capacitor.config.ts
- Mobile runtime helper added: frontend/src/lib/mobileRuntime.ts
- Android scripts added in frontend/package.json
- Play Store release checklist added

## Next execution steps

1. Install dependencies in frontend
2. Add Android platform with Capacitor
3. Sync Android project
4. Configure native manifest permissions
5. Build signed AAB

## Commands

From frontend folder:

- npm install
- npx cap add android
- npx cap sync android
- npm run cap:open

## Mandatory native files to verify after `cap add android`

- android/app/src/main/AndroidManifest.xml
- android/app/build.gradle
- android/app/proguard-rules.pro

## Production hardening after first Android build

- Disable web contents debugging in release
- Add network security config only if needed
- Verify notification channel setup
- Verify background location usage policy text if enabled

## Rollout strategy

1. Internal testing track
2. Closed testing track
3. Production staged rollout (5%, 20%, 50%, 100%)
