# ATEEM STORE — تطبيق أندرويد (APK)

هذا المشروع هو "غلاف" (wrapper) تطبيق أندرويد لمتجرك المنشور فعلياً على:
https://www.ateem-store.com

التطبيق لا يحتوي على كود الموقع نفسه — هو فقط يفتح موقعك الحي داخل تطبيق أندرويد حقيقي
(بدون شريط عنوان المتصفح، مع أيقونة خاصة، وشاشة بداية Splash Screen).

---

## المتطلبات قبل البدء (تثبت مرة واحدة على جهازك)

1. **Node.js** (نسخة 18 أو أحدث) — من https://nodejs.org
2. **Android Studio** — من https://developer.android.com/studio
   - بعد التثبيت، افتحه مرة واحدة ودعه ينزّل Android SDK تلقائياً (هياخد وقت أول مرة)
3. **Java JDK 17** — عادة بييجي مدمج مع Android Studio، مفيش داعي تنزله بشكل منفصل

---

## خطوات البناء (خطوة بخطوة)

### 1) افتح Terminal / CMD داخل مجلد المشروع ده وثبّت الحزم:
```bash
npm install
```

### 2) أضف منصة أندرويد:
```bash
npx cap add android
```

### 3) زامن الإعدادات:
```bash
npx cap sync android
```

### 4) افتح المشروع في Android Studio:
```bash
npx cap open android
```

### 5) من داخل Android Studio:
- انتظر حتى ينتهي "Gradle Sync" (يظهر أسفل الشاشة)
- من القائمة العلوية: **Build → Build Bundle(s) / APK(s) → Build APK(s)**
- بعد الانتهاء، هتظهر رسالة فيها رابط **locate** — اضغط عليه لتفتح مجلد الملف
- ملف الـ APK هيكون هنا تقريباً:
  `android/app/build/outputs/apk/debug/app-debug.apk`

انسخ الملف ده لموبايلك أو ارفعه، وثبته مباشرة (هتحتاج تفعّل "السماح بمصادر غير معروفة" في إعدادات الأندرويد أول مرة).

---

## قبل النشر النهائي (على Google Play أو للتوزيع الرسمي)

الملف اللي هتحصل عليه بالخطوات فوق هو نسخة **Debug** (للتجربة فقط).
للنشر الرسمي، لازم تعمل:
1. **Build → Generate Signed Bundle / APK** بدل الخطوة 5
2. تنشئ Keystore (مفتاح توقيع رقمي) وتحتفظ بيه في مكان آمن جداً — لو ضاع مش هتقدر تحدّث التطبيق تاني على Google Play
3. تختار **release** بدل **debug**

---

## تخصيص الأيقونة وشاشة البداية (Splash Screen)

بعد `npx cap add android`، الأيقونات هتكون في:
```
android/app/src/main/res/mipmap-*/
```
استبدلها بشعار ATEEM. أسهل طريقة: استخدم موقع
https://icon.kitchen أو الأداة المدمجة في Android Studio
(**Right click على app → New → Image Asset**) وارفع شعار ATEEM من الموقع.

---

## ملاحظات مهمة خاصة بمتجرك

- **نظام الدفع "الدفع عند الاستلام"**: سيعمل بشكل طبيعي داخل التطبيق لأنه مجرد صفحة ويب عادية، لا يحتاج أي إعداد إضافي.
- **زر الرجوع في أندرويد**: Capacitor يتعامل معه تلقائياً (بيرجع للصفحة اللي قبلها داخل الموقع بدل ما يقفل التطبيق).
- **الإشعارات (Push Notifications)**: غير مفعّلة في هذا الإعداد الأساسي. لو حبيت تضيفها لاحقاً (مثلاً لإشعار العميل بحالة الطلب)، ده يحتاج خطوة إضافية (Firebase Cloud Messaging) — قولّي لو حبيت أساعدك فيها بعدين.
- **تحديثات الموقع**: أي تعديل تعمله على موقع Odoo (منتجات، أسعار، تصميم) هيظهر تلقائياً في التطبيق فوراً — لأن التطبيق بيعرض الموقع الحي، مش نسخة مجمّدة منه.

---

## وضع ملء الشاشة الكامل (بدون شريط حالة وبدون بار تنقل أندرويد)

اتعمل التالي بالفعل جاهز في المشروع:
- `capacitor.config.ts`: تفعيل `overlaysWebView: true` بحيث الويب فيو يمتد كامل الشاشة خلف شريط الحالة.
- `www/index.html`: كود بيخفي شريط الحالة (Status Bar) تلقائياً بمجرد فتح التطبيق، ويفضل مخفي حتى بعد الانتقال لموقع المتجر.

**خطوة إضافية لازم تعملها بعد `npx cap add android`** (لإخفاء بار التنقل السفلي في أندرويد كمان — ده مش بيتحكم فيه Capacitor من الإعدادات، لازم سطرين كود في الجافا):

1. افتح الملف:
   `android/app/src/main/java/com/ateem/store/MainActivity.java`

2. استبدل محتواه بالكامل بده:
```java
package com.ateem.store;

import android.os.Bundle;
import android.view.View;
import android.view.WindowManager;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    getWindow().addFlags(WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS);
    hideSystemUI();
  }

  @Override
  public void onWindowFocusChanged(boolean hasFocus) {
    super.onWindowFocusChanged(hasFocus);
    if (hasFocus) {
      hideSystemUI();
    }
  }

  private void hideSystemUI() {
    View decorView = getWindow().getDecorView();
    decorView.setSystemUiVisibility(
        View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
      | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
      | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
      | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
      | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
      | View.SYSTEM_UI_FLAG_FULLSCREEN);
  }
}
```

3. احفظ الملف واعمل `npx cap sync android` تاني، وابني الـ APK زي المعتاد.

بعد الخطوة دي: التطبيق هيفتح ملء الشاشة بالكامل من غير شريط حالة ومن غير بار تنقل أندرويد، والويب سايت هيتعرض لوحده كامل الشاشة زي ما طلبت.

---

## لو واجهتك أي مشكلة

المشاكل الشائعة:
- **"SDK not found"** → افتح Android Studio → Settings → Languages & Frameworks → Android SDK، وتأكد إن مسار SDK محدد صح
- **"Gradle sync failed"** → غالباً مشكلة اتصال إنترنت أثناء أول مرة (Gradle بيحمّل ملفات إضافية)، جرب تاني مع نت أقوى
