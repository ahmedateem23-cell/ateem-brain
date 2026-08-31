/**
 * Config plugin: يفرض وضع Immersive Fullscreen (إخفاء شريط الحالة وشريط
 * التنقل) على مستوى الكود الأصلي (MainActivity)، بدل الاعتماد فقط على
 * استدعاءات JS اللي بترجع تتلغي كل ما تفتح نافذة جديدة (زي Modal).
 *
 * بيشتغل عن طريق تعديل MainActivity وقت "expo prebuild" عشان يضيف
 * onWindowFocusChanged اللي بيعيد فرض الـ immersive flags تلقائياً في كل
 * مرة النافذة تسترجع التركيز (يعني كمان بعد إغلاق القائمة الجانبية).
 */
const { withMainActivity } = require('expo/config-plugins');

const MARKER = 'withImmersiveModeMarker';

function withImmersiveMode(config) {
  return withMainActivity(config, (config) => {
    let contents = config.modResults.contents;
    const isKotlin = config.modResults.language === 'kt';

    if (contents.includes(MARKER)) {
      return config;
    }

    if (isKotlin) {
      if (!contents.includes('import android.view.View')) {
        contents = contents.replace(/(package [^\n]+\n)/, `$1\nimport android.view.View\n`);
      }
      const method = `
  // ${MARKER}
  private fun enableImmersiveMode() {
    window.decorView.systemUiVisibility = (
      View.SYSTEM_UI_FLAG_LAYOUT_STABLE
      or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
      or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
      or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
      or View.SYSTEM_UI_FLAG_FULLSCREEN
      or View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
    )
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
      if (!contents.includes('import android.view.View;')) {
        contents = contents.replace(/(package [^\n]+;\n)/, `$1\nimport android.view.View;\n`);
      }
      const method = `
  // ${MARKER}
  private void enableImmersiveMode() {
    getWindow().getDecorView().setSystemUiVisibility(
      View.SYSTEM_UI_FLAG_LAYOUT_STABLE
      | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
      | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
      | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
      | View.SYSTEM_UI_FLAG_FULLSCREEN
      | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
    );
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
}

module.exports = withImmersiveMode;
