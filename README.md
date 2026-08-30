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

## الـ Secrets المطلوبة في GitHub (نفس الأسماء القديمة)

في إعدادات الـ repo → Settings → Secrets and variables → Actions، لازم تكون موجودة:

- `KEYSTORE_BASE64` — ملف الـ `release.keystore` بترميز base64
- `KEYSTORE_PASSWORD`
- `KEY_ALIAS`
- `KEY_PASSWORD`

نفس القيم اللي كانت مستخدمة في اليمل القديم تمام تشتغل هنا كمان — بما إنه نفس الـ keystore.

⚠️ لو الـ alias بتاعك اسمه فعلاً `ateemrelease` (زي اليمل القديم) تأكد إن قيمة سيكرت `KEY_ALIAS` هي بالظبط `ateemrelease`.

## التشغيل محلياً (اختياري، قبل الرفع لـ GitHub)

```bash
npm install
npx expo start          # للمعاينة السريعة عبر Expo Go
# أو لتوليد مشروع أندرويد أصلي محلياً:
npx expo prebuild --platform android
```

## ملاحظات

- الأيقونة والـ splash screen مش معدّة لسه في `app.json` — لو عايز نفس شعار ATEEM اللي كان في اليمل القديم (الـ logo من ibb.co)، قلي أضيفه بنفس الطريقة (تحميل + توليد أيقونات عبر `expo prebuild` تلقائياً بيقرأ من `app.json → icon`).
- الخطوط العربية (IBM Plex Sans Arabic) والـ Cormorant Garamond لسه مش مضافة — نفس الملاحظة اللي كانت في README السابق.
- أي خطوات إضافية كانت في اليمل القديم (Firebase notifications، صلاحية المايكروفون، إلخ) اتشالت من هنا عشان نبدأ بأبسط نسخة شغالة. لو محتاج أي منها، قلي أضيفها.
