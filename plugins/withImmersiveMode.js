/**
 * Config plugin: يفرض وضع Immersive Fullscreen كامل (إخفاء شريط الحالة
 * العلوي وشريط التنقل السفلي معًا) على مستوى الكود الأصلي (MainActivity)،
 * بدل الاعتماد على استدعاءات JS اللي بترجع تتلغي كل ما تفتح نافذة جديدة
 * (زي Modal).
 *
 * ملاحظة مهمة (تحديث): النسخة القديمة من البلجن ده كانت بتستخدم
 * View.SYSTEM_UI_FLAG_* (systemUiVisibility) — وده API متروك رسميًا من
 * جوجل من Android 11 (API 30)، وبيتعارض جزئيًا مع edgeToEdgeEnabled على
 * Android 15+ (API 35)، والنتيجة كانت شريط أسود فاضي بدل إخفاء نضيف.
 * النسخة دي بتستخدم WindowInsetsController بدلاً منه — الـ API الرسمي
 * الحديث المتوافق مع edge-to-edge، وبيدّي نفس سلوك "immersive sticky"
 * (البار بيرجع يظهر مؤقتًا لو المستخدم عمل swipe من الحافة، وبعدين
 * بيختفي تاني لوحده).
 *
 * بيشتغل عن طريق تعديل MainActivity وقت "expo prebuild" عشان يضيف
 * onWindowFocusChanged اللي بيعيد فرض وضع الإخفاء تلقائياً في كل مرة
 * النافذة تسترجع التركيز (يعني كمان بعد إغلاق القائمة الجانبية أو الشات).
 *
 * بيتأكد كمان إن androidx.core موجودة في android/app/build.gradle
 * (WindowInsetsControllerCompat محتاجها) — لو مش موجودة، بيضيفها تلقائيًا.
 */
const { withMainActivity, withAppBuildGradle } = require('expo/config-plugins');

const MARKER = 'withImmersiveModeMarker';
const CORE_DEP = 'androidx.core:core-ktx:1.13.1';

function withImmersiveMode(config) {
  config = withMainActivity(config, (config) => {
    let contents = config.modResults.contents;
    const isKotlin = config.modResults.language === 'kt';

    if (contents.includes(MARKER)) {
      return config;
    }

    if (isKotlin) {
      if (!contents.includes('import androidx.core.view.WindowCompat')) {
        contents = contents.replace(
          /(package [^\n]+\n)/,
          `$1
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
`
        );
      }
      const method = `
  // ${MARKER}
  private fun enableImmersiveMode() {
    WindowCompat.setDecorFitsSystemWindows(window, false)
    val controller = WindowInsetsControllerCompat(window, window.decorView)
    controller.hide(WindowInsetsCompat.Type.systemBars())
    controller.systemBarsBehavior = WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
  }

  override fun onWindowFocusChanged(hasFocus: Boolean) {
    super.onWindowFocusChanged(hasFocus)
    if (hasFocus) {
      enableImmersiveMode()
    }
  }
`;
      const lastBrace = contents.lastIndexOf('}');
      contents = contents.slice(0, lastBrace) + method + '\n' + contents.slice(lastBrace);
    } else {
      if (!contents.includes('import androidx.core.view.WindowCompat;')) {
        contents = contents.replace(
          /(package [^\n]+;\n)/,
          `$1
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
`
        );
      }
      const method = `
  // ${MARKER}
  private void enableImmersiveMode() {
    WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
    WindowInsetsControllerCompat controller = new WindowInsetsControllerCompat(getWindow(), getWindow().getDecorView());
    controller.hide(WindowInsetsCompat.Type.systemBars());
    controller.setSystemBarsBehavior(WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
  }

  @Override
  public void onWindowFocusChanged(boolean hasFocus) {
    super.onWindowFocusChanged(hasFocus);
    if (hasFocus) {
      enableImmersiveMode();
    }
  }
`;
      const lastBrace = contents.lastIndexOf('}');
      contents = contents.slice(0, lastBrace) + method + '\n' + contents.slice(lastBrace);
    }

    config.modResults.contents = contents;
    return config;
  });

  // WindowInsetsControllerCompat جايه من androidx.core — بنتأكد إنها
  // مضافة في dependencies بتاعة android/app/build.gradle، لأنها مش
  // مضمونة تكون موجودة تلقائيًا في كل مشاريع Expo/RN.
  config = withAppBuildGradle(config, (config) => {
    let contents = config.modResults.contents;
    if (!contents.includes('androidx.core:core')) {
      contents = contents.replace(
        /dependencies\s*\{/,
        `dependencies {\n    implementation("${CORE_DEP}")`
      );
      config.modResults.contents = contents;
    }
    return config;
  });

  return config;
}

module.exports = withImmersiveMode;
