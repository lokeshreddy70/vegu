# VEGU Play Store Release Checklist

## 1) Android Wrapper Setup

Run inside frontend folder:

- npm install
- npx cap sync android
- npx cap open android

If Android project does not exist yet:

- npx cap add android
- npx cap sync android

## 2) Required Android Manifest Permissions

Ensure these are present in android/app/src/main/AndroidManifest.xml:

- android.permission.INTERNET
- android.permission.ACCESS_NETWORK_STATE
- android.permission.ACCESS_FINE_LOCATION
- android.permission.ACCESS_COARSE_LOCATION
- android.permission.POST_NOTIFICATIONS
- android.permission.CAMERA
- android.permission.READ_MEDIA_IMAGES
- android.permission.FOREGROUND_SERVICE

Conditional (enable only when implemented and justified):

- android.permission.ACCESS_BACKGROUND_LOCATION
- android.permission.READ_EXTERNAL_STORAGE (legacy devices only)

## 3) Runtime Permission Strategy

Request on demand only:

- Location: when user taps Use current location or starts rider navigation
- Camera: when rider captures delivery proof
- Notifications: after onboarding or first meaningful event

Handle denied state:

- show actionable message
- provide Retry
- provide Open Settings deep link

## 4) Build Variant Requirements

In Android Studio:

- set applicationId to com.vegu.app
- set versionCode (increment each release)
- set versionName (semantic release)
- build type release with minify enabled once validated

## 5) Signing

- Create upload keystore
- Configure Play App Signing
- Keep keystore and passwords in secure secret manager
- Create `frontend/android/keystore.properties` from `frontend/android/keystore.properties.example`

## 6) Privacy and Policy

- Add privacy policy URL in Play Console
- Ensure in-app privacy policy route is reachable
- Document data collection: location, push tokens, profile, orders
- Ensure account deletion path exists: `DELETE /api/auth/me` (UI: Account page -> Delete Account)

## 7) QA Gates Before Upload

- Login persists across refresh/reopen
- Address current location works with fallback
- Rider delivery proof camera flow works
- Notifications can be sent from admin and received on device
- Checkout and payment fallback paths work on slow network
- No crashes in release build on Android 13 and Android 14

## 8) Release Commands

- npm run android:prepare
- npm run android:apk
- npm run android:bundle
- npx cap open android
- Build > Generate Signed Bundle/APK > Android App Bundle (AAB)

Upload the generated .aab to Play Console internal test first.
