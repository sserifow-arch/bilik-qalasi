# Test imza açarı

`test-key.jks` yalnız telefonda sınaq üçündür (parol: `android`). Bu açar gizli deyil, Google Play üçün istifadə etməyin.

Hər APK eyni açarla imzalandığı üçün yeni versiyalar köhnənin üzərinə problemsiz quraşdırılır və uşaqların məlumatları itmir.

**Google Play üçün:** sizə verilmiş `brainy-kids-release.jks` faylını base64 formatına çevirin və GitHub-da **Settings → Secrets and variables → Actions** bölməsinə üç sirr əlavə edin:
- `ANDROID_KEYSTORE_B64` — base64 formatında açar faylı
- `ANDROID_KEYSTORE_PASSWORD` — açarın parolu
- `ANDROID_KEY_ALIAS` — `brainykids`

Bundan sonra GitHub tətbiqi avtomatik olaraq həqiqi açarla imzalayacaq.
