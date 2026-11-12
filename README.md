# 🤖 BRAINY KIDS

3–15 yaşlı uşaqlar üçün oyunlu təhsil tətbiqi. Azərbaycan, rus və ingilis dillərində işləyir, internet tələb etmir.

## 📥 Telefona quraşdırmaq
Bu linkdən həmişə ən son versiyanı endirə bilərsiniz:
**https://github.com/sserifow-arch/bilik-qalasi/releases/latest/download/BrainyKids.apk**

1. Linki telefonda Chrome ilə açın, `BrainyKids.apk` faylı enəcək.
2. Fayla basın. Telefon «naməlum mənbələr» barədə soruşsa, **İcazə ver** seçin, sonra **Quraşdır** basın.
3. Play Protect xəbərdarlığı çıxsa, **Yenə də quraşdır** seçin. Bu, tətbiq Play Marketdən olmadığı üçün normaldır.

Tətbiq köhnə «Bilik Qalası» tətbiqinin üzərinə yazılır, uşaqların profilləri və ulduzları köçürülür.

## Tətbiqdə nələr var
- **Qeydiyyat:** dil (AZ/RU/EN), ad və ya ləqəb, yaş (3–15), avatar. Bir telefonda bir neçə uşaq üçün ayrı profil.
- **4 yaş qrupu:** 3–5, 6–8, 9–12 və 13–15 yaş. Suallar, oyunların çətinliyi və variant sayı yaşa uyğun seçilir.
- **Sual bazası:** 328 hazır sual, hər biri 3 dildə, izahı ilə və 5 çətinlik səviyyəsində. Bundan əlavə, riyaziyyat, ardıcıllıq, zaman və məntiq sualları avtomatik yaradılır. Eyni suallar tez təkrarlanmır.
- **7 bilik bölməsi:** Ümumi biliklər, Azərbaycanı tanıyaq, Riyaziyyat, Məntiq, Rənglər və fiqurlar, Zaman və təqvim, Dil və sözlər.
- **Macəra xəritəsi:** 8 dünya. Hər dünyada 8 mərhələ və final tapşırığı var, mərhələlər ardıcıl açılır.
- **15 mini oyun:** düzgün cavabı seç, doğru/yanlış, uyğunlaşdır, rənginə görə ayır (sürüşdürmə ilə), yaddaş kartları, ədədləri sırala, ardıcıllıq, kölgə, fərqləri tap, puzzle yığ, bayraqlar, labirint, riyazi tapmacalar, əşyanı tap, artıq fiqur, çatışmayan hissə.
- **Mükafatlar:** XP, səviyyə, ulduz, sikkə, gündəlik seriya, 12 nailiyyət. Avatarlar səviyyə ilə açılır, aksesuarlar sikkə ilə alınır. Mükafatlar təkrar verilmir.
- **Günün tapşırığı və həftənin viktorinası:** həftəlik viktorina vaxtla oynanılır, yaş qrupu üzrə qaliblər cədvəli və «Həftənin çempionu» nişanı var. «demo» işarəli iştirakçılar nümunədir.
- **Valideyn bölməsi (PIN ilə):** vaxt, cavablar, faiz, güclü və zəif mövzular, həftəlik qrafik, gündəlik vaxt hədəfi, səs və musiqi, dil, profillərin idarəsi, tərəqqinin sıfırlanması.
- **Təhlükəsizlik:** reklam yoxdur, söhbət yoxdur, şəxsi məlumat toplanmır.

## Sual əlavə etmək
Suallar `content/questions/*.txt` fayllarındadır, hər sətirdə bir sual:
```
id|yaş qrupları (abcd)|çətinlik 1-5|şəkil|sual az ~ ru ~ en|düz cavab az~ru~en;səhv1;səhv2;səhv3|izah az ~ ru ~ en
```
`npm run questions` əmri faylları yoxlayır və `src/data/questions/*.json` bazasına çevirir. GitHub tətbiqi yığarkən bunu avtomatik edir.

## Texniki məlumat
- **Texnologiyalar:** React + TypeScript + Vite + Tailwind CSS. APK Capacitor ilə yığılır, iOS versiyası da mümkündür.
- **Yaddaş:** məlumatlar telefonun daimi yaddaşında saxlanılır (`@capacitor/preferences`). Saxlama ayrıca qatda yazılıb, ona görə gələcəkdə onlayn yarış üçün Firebase əlavə etmək asan olacaq.
- **Yığılma:** `npm test` (avtomatik testlər), `npm run typecheck`, `npm run build`. Hər push-dan sonra GitHub Actions imzalı **release** APK və Google Play üçün **AAB** faylı yığır.
