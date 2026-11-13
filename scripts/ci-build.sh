#!/usr/bin/env bash
# GitHub Actions: testlər, yığılma, imzalama. Çıxış ci.log faylına yazılır.
set -euo pipefail
step() { echo; echo "=================== $* ==================="; }

step "npm install"
npm install --no-audit --no-fund

step "Testlər"
npm test

step "TypeScript"
npm run typecheck

step "Veb yığılma"
npm run build

step "Android"
npx cap add android
npx cap sync android

step "İkonlar və versiya"
node icons/make-icons.cjs
RES=android/app/src/main/res
rm -rf $RES/mipmap-anydpi-v26
for d in mdpi hdpi xhdpi xxhdpi xxxhdpi; do
  cp icons/mipmap-$d/ic_launcher.png $RES/mipmap-$d/ic_launcher.png
  cp icons/mipmap-$d/ic_launcher.png $RES/mipmap-$d/ic_launcher_round.png
done
sed -i "s/versionCode [0-9]*/versionCode ${RUN_NUMBER}/; s/versionName \"[^\"]*\"/versionName \"2.0.${RUN_NUMBER}\"/" android/app/build.gradle

step "Gradle release"
cd android
chmod +x gradlew
./gradlew assembleRelease bundleRelease --no-daemon
cd ..

step "İmza"
BT=$ANDROID_HOME/build-tools/$(ls $ANDROID_HOME/build-tools | sort -V | tail -1)
APK=android/app/build/outputs/apk/release/app-release-unsigned.apk
AAB=android/app/build/outputs/bundle/release/app-release.aab
ls -la android/app/build/outputs/apk/release/ android/app/build/outputs/bundle/release/ || true
if [ -n "${KS_B64:-}" ]; then
  echo "$KS_B64" | base64 -d > release.jks
else
  echo "Sınaq açarı ilə imzalanır (signing/test-key.jks)"
  cp signing/test-key.jks release.jks
  KS_PASS=android
  KS_ALIAS=brainykids
fi
$BT/zipalign -p -f 4 $APK aligned.apk
$BT/apksigner sign --ks release.jks --ks-pass pass:$KS_PASS --key-pass pass:$KS_PASS --ks-key-alias $KS_ALIAS --out BrainyKids.apk aligned.apk
$BT/apksigner verify BrainyKids.apk
jarsigner -keystore release.jks -storepass $KS_PASS -keypass $KS_PASS $AAB $KS_ALIAS
cp $AAB BrainyKids.aab
rm -f release.jks aligned.apk
ls -la BrainyKids.*
step "HAZIRDIR"
