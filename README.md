# ATEEM Store — تطبيق React Native أصلي (بدون Capacitor)

هذا مشروع مستقل من الصفر: تطبيق React Native حقيقي (واجهات أندرويد أصلية، مش WebView)، مع GitHub Actions يبني منه APK موقّع بنفس الـ keystore بتاعك.

## هيكل المشروع

```
ateem-native/
├── App.js                              ← كود التطبيق (نفس الصفحة الرئيسية اللي بنيناها)
├── app.json                            ← إعدادات المشروع (اسم الحزمة، الأيقونة، إلخ)
├── package.json
└── .github/workflows/build-apk-native.yml   ← الـ workflow الجديد
```

## الفرق عن اليمل القديم (Capacitor)

| | القديم (Capacitor) | الجديد (React Native) |
|---|---|---|
| طبيعة التطبيق | موقع HTML جوا WebView | عناصر واجهة أندرويد أصلية |
| توليد مشروع أندرويد | `npx cap add android` | `npx expo prebuild --platform android` |
| مصدر الواجهة | `index.html` | `App.js` |
| التوقيع والبناء بـ Gradle | نفس الفكرة | **نفس الفكرة بالضبط** (استخدمنا نفس الأسماء والخطوات) |

## الـ Secrets المطلوبة في GitHub (نفس الأسماء القديمة + واحد جديد)

في إعدادات الـ repo → Settings → Secrets and variables → Actions، لازم تكون موجودة:

- `KEYSTORE_BASE64` — ملف الـ `release.keystore` بترميز base64
- `KEYSTORE_PASSWORD`
- `KEY_ALIAS`
- `KEY_PASSWORD`
- `GOOGLE_SERVICES_JSON_BASE64` — **جديد**: ملف `google-services.json` (إعدادات Firebase) بترميز base64، بيتكتب في جذر المشروع قبل الـ prebuild عشان إشعارات الـ Push تشتغل. نفس محتوى `google-services-base64.txt` اللي عندك بالظبط — انسخه كامل والصقه كقيمة السيكرت.

نفس القيم اللي كانت مستخدمة في اليمل القديم تمام تشتغل هنا كمان — بما إنه نفس الـ keystore.

⚠️ لو الـ alias بتاعك اسمه فعلاً `ateemrelease` (زي اليمل القديم) تأكد إن قيمة سيكرت `KEY_ALIAS` هي بالظبط `ateemrelease`.

## التشغيل محلياً (اختياري، قبل الرفع لـ GitHub)

```bash
npm install
npx expo start          # للمعاينة السريعة عبر Expo Go (ملحوظة: التسجيل الصوتي
                         # عبر @react-native-voice/voice مش هيشتغل في Expo Go —
                         # محتاج build حقيقي زي اللي الـ workflow بيعمله)
# أو لتوليد مشروع أندرويد أصلي محلياً:
npx expo prebuild --platform android
```

## ملاحظات

- الأيقونة والـ splash screen مش معدّة لسه في `app.json` — لو عايز نفس شعار ATEEM اللي كان في اليمل القديم (الـ logo من ibb.co)، قلي أضيفه بنفس الطريقة (تحميل + توليد أيقونات عبر `expo prebuild` تلقائياً بيقرأ من `app.json → icon`).
- الخطوط العربية (IBM Plex Sans Arabic) والـ Cormorant Garamond لسه مش مضافة — نفس الملاحظة اللي كانت في README السابق.
- **الشات (`ChatOverlay.js`) بقى متكامل مع `App.js`**: زرار عائم (✦) فوق الـ bottom nav بيفتحه كـ Modal، والمنتجات بتتحمّل حقيقي من Odoo عبر نفس الـ Worker.
- **التسجيل الصوتي وقراءة الردود بصوت اتفعّلوا**: `@react-native-voice/voice` (تسجيل) + `expo-av` (تشغيل صوت الـ TTS القادم من `/tts` على الـ Worker). صلاحية الميكروفون بتتطلب lazy، بس أول ما العميل يدوس على 🎤 — مش عند فتح التطبيق.
- **إشعارات الـ Push اتفعّلت**: `expo-notifications` بياخد توكن الجهاز الحقيقي وقت تأكيد أي طلب (مش عند فتح التطبيق)، ومحتاج `google-services.json` (سيكرت `GOOGLE_SERVICES_JSON_BASE64` فوق) عشان يشتغل صح.
- `withImmersiveMode.js` كان موجود في المشروع بس مش متسجّل في `app.json`، فمكنش شغال خالص — دلوقتي مضاف في `plugins` عشان يشتغل فعلياً.
