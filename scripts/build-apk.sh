#!/usr/bin/env bash
set -e

if [ ! -f "$(which java)" ]; then
  echo "Error: Java (JDK 17+) is required to build the Android APK"
  exit 1
fi

if [ ! -d "android" ]; then
  echo "No android/ directory found. Run: npx cap add android"
  exit 1
fi

echo "=== Building web assets ==="
VITE_APP_ENV=mobile npm run build

echo "=== Syncing Capacitor ==="
npx cap sync android

echo "=== Building Android APK ==="
cd android && ./gradlew assembleDebug

echo "=== Copying APK to public/ ==="
cd ..
cp android/app/build/outputs/apk/debug/app-debug.apk public/receiptflow.apk

echo "=== Done ==="
echo "APK ready at: public/receiptflow.apk"
echo "Deploy the repo to make it available at /receiptflow.apk"
