import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  Image,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Dimensions,
  I18nManager,
  Modal,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as NavigationBar from 'expo-navigation-bar';
import * as Notifications from 'expo-notifications';
import Svg, { Path, Circle, Line } from 'react-native-svg';

// فرض اتجاه RTL للتطبيق بالكامل (يفضّل ضبطه أيضاً في app.json وإعادة تشغيل التطبيق)
I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

const { width } = Dimensions.get('window');

const COLORS = {
  ivory: '#F5F1E8',
  ivoryLight: '#FAF8F3',
  ivoryDark: '#E8DFD0',
  gold: '#8B7355',
  goldLight: '#C9B99A',
  charcoal: '#5C2029',
  ink: '#2B2622',
  // تباين أعلى مع الخلفيات الفاتحة (كانت #6B5B4F / #A99E8E)
  textMuted: '#4E4034',
  textSubtle: '#7A6A57',
  border: '#DDD5C4',
  white: '#FFFFFF',
};

// ---------- بيانات الصفحة ----------
const CATEGORIES = [
  { id: 'women', title: 'نساء', cta: 'اكتشفي المزيد', img: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=500&q=80' },
  { id: 'men', title: 'رجال', cta: 'اكتشف المزيد', img: 'https://images.unsplash.com/photo-1617137968427-85924c800a22?w=500&q=80' },
  { id: 'accessories', title: 'إكسسوارات', cta: 'اكتشف المزيد', img: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=500&q=80' },
  { id: 'jewelry', title: 'مجوهرات', cta: 'اكتشف المزيد', img: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=500&q=80' },
];

const PRODUCTS = [
  { id: 'p1', name: 'معطف كشمير طويل', price: '89,000 SDG', badge: 'جديد', img: 'https://images.unsplash.com/photo-1591561954557-26941169b49e?w=500&q=80' },
  { id: 'p2', name: 'حقيبة يد جلدية', price: '152,000 SDG', badge: null, img: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=500&q=80' },
  { id: 'p3', name: 'بدلة رسمية كلاسيكية', price: '220,000 SDG', badge: 'محدود', img: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=500&q=80' },
  { id: 'p4', name: 'خاتم ذهبي مرصع', price: '185,000 SDG', badge: null, img: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=500&q=80' },
];

const LOOKS = [
  { id: 'l1', title: 'الأناقة المسائية', season: 'خريف / شتاء 2026', img: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&q=80' },
  { id: 'l2', title: 'الكلاسيكية العصرية', season: 'مجموعة دائمة', img: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=600&q=80' },
  { id: 'l3', title: 'إطلالة الشارع', season: 'ربيع / صيف 2026', img: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&q=80' },
  { id: 'l4', title: 'الألوان المحايدة', season: 'تشكيلة حصرية', img: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1000&q=80' },
  { id: 'l5', title: 'تفاصيل الجلد', season: 'إكسسوارات فاخرة', img: 'https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?w=600&q=80' },
];

const NAV_LINKS = ['نساء', 'رجال', 'إكسسوارات', 'مجوهرات', 'القصة'];

const TRUST_ITEMS = [
  { title: 'توصيل مجاني', desc: 'على الطلبات فوق 50,000 SDG' },
  { title: 'ضمان أصالة', desc: 'شهادة مع كل قطعة' },
  { title: 'إرجاع سهل', desc: 'خلال 30 يوماً' },
  { title: 'تغليف فاخر', desc: 'هدايا حصرية مع كل طلب' },
];

// ---------- أيقونات خطية (SVG) راقية بدل الإيموجي ----------
const LineIcon = ({ name, size = 22, color = COLORS.ink, strokeWidth = 1.6 }) => {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: color,
    strokeWidth,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  };

  switch (name) {
    case 'menu':
      return (
        <Svg {...common}>
          <Line x1="3.5" y1="6.5" x2="20.5" y2="6.5" />
          <Line x1="3.5" y1="12" x2="20.5" y2="12" />
          <Line x1="3.5" y1="17.5" x2="20.5" y2="17.5" />
        </Svg>
      );
    case 'bag':
      return (
        <Svg {...common}>
          <Path d="M6 9.2 7.4 5h9.2l1.4 4.2" />
          <Path d="M6 9.2h12l-0.85 11a1.3 1.3 0 0 1-1.3 1.2H8.15a1.3 1.3 0 0 1-1.3-1.2L6 9.2z" />
          <Path d="M9.3 11.3a2.7 2.7 0 0 0 5.4 0" />
        </Svg>
      );
    case 'home':
      return (
        <Svg {...common}>
          <Path d="M3.5 11.5 12 4l8.5 7.5" />
          <Path d="M5.5 10v9.5a1 1 0 0 0 1 1H10v-6h4v6h3.5a1 1 0 0 0 1-1V10" />
        </Svg>
      );
    case 'search':
      return (
        <Svg {...common}>
          <Circle cx="11" cy="11" r="6.5" />
          <Line x1="20" y1="20" x2="16" y2="16" />
        </Svg>
      );
    case 'user':
      return (
        <Svg {...common}>
          <Circle cx="12" cy="8.2" r="3.8" />
          <Path d="M4.5 20c0.7-3.8 4-5.8 7.5-5.8s6.8 2 7.5 5.8" />
        </Svg>
      );
    case 'plus':
      return (
        <Svg {...common}>
          <Line x1="12" y1="5.5" x2="12" y2="18.5" />
          <Line x1="5.5" y1="12" x2="18.5" y2="12" />
        </Svg>
      );
    default:
      return null;
  }
};

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartCount] = useState(2);

  // شاشة ملء كاملة: إخفاء شريط الحالة العلوي وشريط التنقل السفلي للنظام
  const hideSystemBars = async () => {
    try {
      await NavigationBar.setVisibilityAsync('hidden');
      await NavigationBar.setBehaviorAsync('overlay-swipe');
    } catch (e) {
      // بعض الأجهزة/أوضاع التشغيل لا تدعم التحكم ببار التنقل، نتجاهل بهدوء
    }
  };

  useEffect(() => {
    hideSystemBars();
  }, []);

  // فتح أي Modal (زي القائمة الجانبية) بيعمل نافذة Android جديدة بتُرجع
  // إظهار أشرطة النظام تلقائياً، فلازم نطبّق الإخفاء تاني بعد كل فتح/قفل
  useEffect(() => {
    hideSystemBars();
  }, [menuOpen]);

  // إعادة فرض الوضع الغامر (immersive) دورياً، لأن Android بيرجّع إظهار
  // الأشرطة تلقائياً مع أي تفاعل نظام (سحبة، تنبيه، تغيير تركيز) مش بس فتح Modal
  useEffect(() => {
    const interval = setInterval(hideSystemBars, 2000);
    return () => clearInterval(interval);
  }, []);

  // طلب إذن الإشعارات بشكل غير مزعج عند أول فتح للتطبيق
  useEffect(() => {
    (async () => {
      try {
        const { status: existing } = await Notifications.getPermissionsAsync();
        if (existing !== 'granted') {
          await Notifications.requestPermissionsAsync();
        }
      } catch (e) {
        // لو رفض المستخدم أو فشل الطلب، لا نوقف التطبيق
      }
    })();
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar hidden translucent backgroundColor="transparent" style="dark" />
      {/* ===== Header ===== */}
      <View style={styles.navbar}>
        <TouchableOpacity onPress={() => setMenuOpen(true)} style={styles.menuBtn}>
          <LineIcon name="menu" size={28} color={COLORS.charcoal} />
        </TouchableOpacity>

        <View style={styles.brandWrap}>
          <Text style={styles.brand}>ATEEM</Text>
          <Text style={styles.tagline}>SUDAN · MODERN LUXURY</Text>
        </View>

        <View style={styles.navIcons}>
          <TouchableOpacity>
            <LineIcon name="bag" size={26} color={COLORS.charcoal} />
            {cartCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cartCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* ===== القائمة الجانبية ===== */}
      <Modal
        visible={menuOpen}
        transparent
        animationType="fade"
        onShow={hideSystemBars}
        onRequestClose={() => setMenuOpen(false)}
      >
        <TouchableOpacity style={styles.menuOverlay} activeOpacity={1} onPress={() => setMenuOpen(false)}>
          <View style={styles.menuPanel}>
            {[...NAV_LINKS, 'تواصل معنا'].map((link) => (
              <TouchableOpacity key={link} style={styles.menuLinkRow}>
                <Text style={styles.menuLinkText}>{link}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ===== Hero ===== */}
        <View style={styles.hero}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1575032617751-6ddec2089882?w=1400&q=90' }}
            style={styles.heroImage}
          />
          <View style={styles.floatingCard}>
            <Text style={styles.floatingLabel}>القطعة المميزة</Text>
            <Text style={styles.floatingTitle}>حقيبة كتف جلدية</Text>
            <Text style={styles.floatingPrice}>125,000 SDG</Text>
            <TouchableOpacity>
              <Text style={styles.floatingAdd}>أضف للسلة</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.heroText}>
            <View style={styles.heroLabelRow}>
              <View style={styles.heroLine} />
              <Text style={styles.heroLabel}>مجموعة خريف / شتاء 2026</Text>
            </View>
            <Text style={styles.heroTitle}>
              فنُّ{'\n'}
              <Text style={styles.heroTitleItalic}>الأناقة</Text>
            </Text>
            <Text style={styles.heroDesc}>
              اكتشف تشكيلتنا الجديدة التي تجمع بين الحرفية الدقيقة والروح العصرية. كل قطعة تروي قصة من التميز.
            </Text>
            <View style={styles.heroButtons}>
              <TouchableOpacity style={styles.btnPrimary}>
                <Text style={styles.btnPrimaryText}>اكتشف المجموعة</Text>
              </TouchableOpacity>
              <TouchableOpacity>
                <Text style={styles.btnText}>شاهد الفيديو</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ===== Categories ===== */}
        <View style={styles.section}>
          <View style={styles.categoriesGrid}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity key={cat.id} style={styles.categoryCard}>
                <Image source={{ uri: cat.img }} style={styles.categoryImage} />
                <View style={styles.categoryOverlay} />
                <View style={styles.categoryContent}>
                  <Text style={styles.categoryTitle}>{cat.title}</Text>
                  <Text style={styles.categoryCta}>{cat.cta} ←</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ===== New Arrivals ===== */}
        <View style={[styles.section, styles.sectionAlt]}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionLabel}>وصل حديثاً</Text>
              <Text style={styles.sectionTitle}>القطع الجديدة</Text>
            </View>
            <TouchableOpacity>
              <Text style={styles.viewAll}>عرض الكل ←</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.productsGrid}>
            {PRODUCTS.map((p) => (
              <TouchableOpacity key={p.id} style={styles.productCard}>
                <View style={styles.productImageWrap}>
                  <Image source={{ uri: p.img }} style={styles.productImage} />
                  {p.badge && (
                    <View style={[styles.productBadge, p.badge === 'محدود' && styles.productBadgeGold]}>
                      <Text style={styles.productBadgeText}>{p.badge}</Text>
                    </View>
                  )}
                  <TouchableOpacity style={styles.addToCartBtn}>
                    <LineIcon name="plus" size={16} color={COLORS.charcoal} strokeWidth={1.8} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.productName}>{p.name}</Text>
                <Text style={styles.productPrice}>{p.price}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ===== Lookbook ===== */}
        <View style={styles.lookbook}>
          <View style={styles.lookbookHeader}>
            <Text style={styles.lookLabel}>الإلهام</Text>
            <Text style={styles.lookTitle}>معرض الأزياء</Text>
            <Text style={styles.lookSubtitle}>رحلة بصرية عبر أرقى لحظات الموضة</Text>
          </View>

          {LOOKS.map((look, i) => (
            <TouchableOpacity key={look.id} style={styles.lookItem}>
              <Image source={{ uri: look.img }} style={styles.lookImage} />
              <View style={styles.lookOverlay}>
                <Text style={styles.lookNumber}>{String(i + 1).padStart(2, '0')}</Text>
                <Text style={styles.lookItemTitle}>{look.title}</Text>
                <Text style={styles.lookSeason}>{look.season}</Text>
              </View>
            </TouchableOpacity>
          ))}

          <TouchableOpacity style={styles.lookFooterBtn}>
            <Text style={styles.lookFooterBtnText}>استعرض المجموعة الكاملة</Text>
          </TouchableOpacity>
        </View>

        {/* ===== Craftsmanship ===== */}
        <View style={styles.craft}>
          <View style={styles.craftImageWrap}>
            <Image source={{ uri: 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=800&q=80' }} style={styles.craftImage} />
            <View style={styles.craftStat}>
              <Text style={styles.craftStatNumber}>102</Text>
              <Text style={styles.craftStatDesc}>ساعة من العمل اليدوي{'\n'}لكل قطعة</Text>
            </View>
          </View>
          <View style={styles.craftContent}>
            <Text style={styles.sectionLabel}>الحرفية</Text>
            <Text style={styles.craftHeading}>
              حيث يُصنع{'\n'}التميز <Text style={styles.heroTitleItalic}>بيدٍ</Text> واحدة
            </Text>
            <Text style={styles.craftParagraph}>
              نحافظ في ATEEM على معايير حرفية دقيقة في اختيار كل قطعة. كل منتج يمر بمراحل تدقيق متأنية، من اختيار أجود الأقمشة والجلود إلى أدق التفاصيل النهائية.
            </Text>
            <Text style={styles.craftParagraph}>
              نؤمن بأن الفخامة الحقيقية تكمن في التفاصيل التي لا تراها العين، لكنها تشعر بها الروح.
            </Text>
            <TouchableOpacity>
              <Text style={styles.craftLink}>اقرأ قصتنا ←</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ===== Editorial Banner ===== */}
        <View style={styles.editorial}>
          <Image source={{ uri: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=1400&q=80' }} style={styles.editorialImage} />
          <View style={styles.editorialOverlay}>
            <Text style={styles.editorialLabel}>الأناقة الخالدة</Text>
            <Text style={styles.editorialTitle}>
              أسلوبٌ يتجاوز{'\n'}
              <Text style={styles.heroTitleItalic}>المواسم</Text>
            </Text>
            <TouchableOpacity style={styles.editorialBtn}>
              <Text style={styles.editorialBtnText}>استكشف المجموعة الدائمة</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ===== Trust Badges ===== */}
        <View style={[styles.section, styles.sectionAlt]}>
          <View style={styles.trustGrid}>
            {TRUST_ITEMS.map((t) => (
              <View key={t.title} style={styles.trustItem}>
                <Text style={styles.trustTitle}>{t.title}</Text>
                <Text style={styles.trustDesc}>{t.desc}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ===== Newsletter (Compact Luxury Invitation) ===== */}
        <View style={styles.newsletterCard}>
          <Text style={styles.newsletterTitle}>كن أول من يكتشف الجديد</Text>
          <Text style={styles.newsletterDesc}>وصل أحدث المجموعات والعروض المختارة أولًا</Text>
          <View style={styles.newsletterRow}>
            <TextInput
              style={styles.newsletterInput}
              placeholder="بريدك الإلكتروني"
              placeholderTextColor={COLORS.textSubtle}
              keyboardType="email-address"
            />
            <TouchableOpacity style={styles.newsletterBtn}>
              <Text style={styles.newsletterBtnText}>اشترك</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ===== لمسة ختامية بسيطة جداً ===== */}
        <View style={styles.closingMark}>
          <Text style={styles.closingBrand}>ATEEM</Text>
          <Text style={styles.closingTagline}>Sudan · Modern Luxury</Text>
        </View>

      </ScrollView>

      {/* ===== Bottom Nav ===== */}
      {/* الترتيب هنا بديهي (هوم، بحث، متجر، شخصي)، وانعكاس RTL التلقائي
          هو اللي بيخلي "الهوم" يظهر أقصى اليمين و"الشخصي" أقصى الشمال فعلياً */}
      <View style={styles.bottomNav}>
        {[
          { key: 'home', icon: 'home', label: 'الهوم', active: true },
          { key: 'search', icon: 'search', label: 'بحث' },
          { key: 'store', icon: 'bag', label: 'المتجر' },
          { key: 'profile', icon: 'user', label: 'الشخصي' },
        ].map((item) => (
          <TouchableOpacity key={item.key} style={styles.bottomNavBtn}>
            <LineIcon
              name={item.icon}
              size={25}
              color={item.active ? COLORS.gold : COLORS.ink}
              strokeWidth={1.6}
            />
            <Text style={[styles.bottomNavText, item.active && styles.bottomNavActive]}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const CARD_GAP = 12;
const CARD_W = (width - 24 * 2 - CARD_GAP) / 2;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.ivory },
  scrollContent: { paddingBottom: 16 },

  // Navbar
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: COLORS.ivory,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  menuBtn: { width: 48, height: 48, alignItems: 'flex-start', justifyContent: 'center' },
  brandWrap: { alignItems: 'center' },
  brand: { fontSize: 26, letterSpacing: 4, color: COLORS.charcoal, fontWeight: '300' },
  tagline: { fontSize: 10, letterSpacing: 2.5, color: COLORS.gold, marginTop: 3 },
  navIcons: { flexDirection: 'row', alignItems: 'center', width: 48, height: 48, justifyContent: 'flex-end' },
  cartBadge: {
    position: 'absolute', top: -6, left: -8, backgroundColor: COLORS.charcoal,
    width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center',
  },
  cartBadgeText: { color: COLORS.ivory, fontSize: 10 },

  // Mobile menu
  menuOverlay: { flex: 1, backgroundColor: 'rgba(43,38,34,0.4)' },
  menuPanel: {
    marginTop: 70, alignSelf: 'center', width: '70%', backgroundColor: COLORS.ivoryLight,
    borderRadius: 8, paddingVertical: 10, paddingHorizontal: 22,
  },
  menuLinkRow: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  menuLinkText: { fontSize: 16, color: COLORS.ink },

  // Hero
  hero: { paddingBottom: 10 },
  heroImage: { width: '100%', height: 240 },
  floatingCard: {
    position: 'absolute', top: 150, left: 20, backgroundColor: COLORS.ivoryLight,
    padding: 16, maxWidth: 190, borderWidth: 1, borderColor: COLORS.ivoryDark,
  },
  floatingLabel: { fontSize: 9, letterSpacing: 1.5, color: COLORS.gold, textTransform: 'uppercase', marginBottom: 4 },
  floatingTitle: { fontSize: 15, color: COLORS.ink, marginBottom: 3 },
  floatingPrice: { fontSize: 13, color: COLORS.textMuted, marginBottom: 8 },
  floatingAdd: { fontSize: 10, letterSpacing: 1, color: COLORS.gold, textDecorationLine: 'underline' },

  heroText: { paddingHorizontal: 24, paddingTop: 60 },
  heroLabelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  heroLine: { width: 32, height: 1, backgroundColor: COLORS.gold, marginLeft: 10 },
  heroLabel: { color: COLORS.gold, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase' },
  heroTitle: { fontSize: 44, lineHeight: 46, color: COLORS.ink, fontWeight: '300', marginBottom: 16 },
  heroTitleItalic: { fontStyle: 'italic', color: COLORS.gold },
  heroDesc: { color: COLORS.textMuted, fontSize: 15, lineHeight: 24, marginBottom: 24 },
  heroButtons: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  btnPrimary: {
    backgroundColor: COLORS.charcoal, paddingVertical: 16, paddingHorizontal: 32,
    minHeight: 50, alignItems: 'center', justifyContent: 'center',
  },
  btnPrimaryText: { color: COLORS.ivory, fontSize: 12, letterSpacing: 1.5, textTransform: 'uppercase' },
  btnText: { color: COLORS.gold, fontSize: 12, letterSpacing: 1, textDecorationLine: 'underline' },

  // Sections generic
  section: { paddingHorizontal: 20, paddingVertical: 32 },
  sectionAlt: { backgroundColor: COLORS.ivory },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 },
  sectionLabel: { color: COLORS.gold, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 },
  sectionTitle: { fontSize: 26, color: COLORS.ink, fontWeight: '300' },
  viewAll: { color: COLORS.gold, fontSize: 12, letterSpacing: 1 },

  // Categories
  categoriesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: CARD_GAP, justifyContent: 'space-between' },
  categoryCard: { width: CARD_W, height: CARD_W * 1.3, overflow: 'hidden', marginBottom: CARD_GAP },
  categoryImage: { width: '100%', height: '100%' },
  categoryOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(43,38,34,0.34)' },
  categoryContent: { position: 'absolute', bottom: 14, right: 14, left: 14 },
  categoryTitle: { fontSize: 20, color: '#fff', fontWeight: '300', marginBottom: 4 },
  categoryCta: { fontSize: 10, letterSpacing: 1.5, color: 'rgba(255,255,255,0.85)' },

  // Products
  productsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: CARD_GAP, justifyContent: 'space-between' },
  productCard: { width: CARD_W, marginBottom: 20 },
  productImageWrap: { width: '100%', height: CARD_W * 1.3, backgroundColor: COLORS.ivoryDark, marginBottom: 10, position: 'relative' },
  productImage: { width: '100%', height: '100%' },
  productBadge: {
    position: 'absolute', top: 10, right: 10, backgroundColor: COLORS.charcoal,
    paddingVertical: 4, paddingHorizontal: 8,
  },
  productBadgeGold: { backgroundColor: COLORS.gold },
  productBadgeText: { color: COLORS.ivory, fontSize: 9, letterSpacing: 1 },
  addToCartBtn: {
    position: 'absolute', bottom: 10, left: 10, width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(245,241,232,0.92)', alignItems: 'center', justifyContent: 'center',
  },
  productName: { fontSize: 14, color: COLORS.ink, marginBottom: 3 },
  productPrice: { fontSize: 13, color: COLORS.gold },

  // Lookbook
  lookbook: { backgroundColor: COLORS.charcoal, paddingVertical: 40, paddingHorizontal: 20 },
  lookbookHeader: { alignItems: 'center', marginBottom: 30 },
  lookLabel: { color: COLORS.goldLight, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 },
  lookTitle: { color: COLORS.ivory, fontSize: 28, fontWeight: '300', marginBottom: 8 },
  lookSubtitle: { color: COLORS.goldLight, fontSize: 13 },
  lookItem: { height: 220, marginBottom: 14, overflow: 'hidden' },
  lookImage: { width: '100%', height: '100%' },
  lookOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0, top: 0, justifyContent: 'flex-end',
    padding: 18, backgroundColor: 'rgba(92,32,41,0.35)',
  },
  lookNumber: { position: 'absolute', top: 10, right: 16, fontSize: 40, color: 'rgba(245,241,232,0.2)' },
  lookItemTitle: { color: '#fff', fontSize: 18, fontWeight: '300', marginBottom: 4 },
  lookSeason: { color: COLORS.goldLight, fontSize: 10, letterSpacing: 1.5 },
  lookFooterBtn: {
    alignSelf: 'center', marginTop: 20, paddingVertical: 16, paddingHorizontal: 36,
    minHeight: 50, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(245,241,232,0.4)',
  },
  lookFooterBtnText: { color: COLORS.ivory, fontSize: 12, letterSpacing: 1.5 },

  // Craftsmanship
  craft: { paddingHorizontal: 20, paddingVertical: 40 },
  craftImageWrap: { position: 'relative', marginBottom: 40 },
  craftImage: { width: '100%', height: 320, borderRadius: 4 },
  craftStat: { position: 'absolute', bottom: -20, left: 10, backgroundColor: COLORS.charcoal, padding: 20 },
  craftStatNumber: { color: COLORS.ivory, fontSize: 36, fontWeight: '300' },
  craftStatDesc: { color: COLORS.goldLight, fontSize: 10, letterSpacing: 1, marginTop: 6, lineHeight: 16 },
  craftContent: {},
  craftHeading: { fontSize: 26, color: COLORS.ink, fontWeight: '300', lineHeight: 32, marginBottom: 16, marginTop: 8 },
  craftParagraph: { color: COLORS.textMuted, lineHeight: 24, marginBottom: 12 },
  craftLink: { color: COLORS.ink, fontSize: 12, letterSpacing: 1.5, marginTop: 10, textDecorationLine: 'underline' },

  // Editorial
  editorial: { height: 320, position: 'relative' },
  editorialImage: { width: '100%', height: '100%' },
  editorialOverlay: {
    ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(92,32,41,0.45)',
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30,
  },
  editorialLabel: { color: COLORS.goldLight, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 16 },
  editorialTitle: { color: '#fff', fontSize: 30, fontWeight: '300', textAlign: 'center', lineHeight: 36, marginBottom: 20 },
  editorialBtn: {
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', paddingVertical: 16, paddingHorizontal: 32,
    minHeight: 50, alignItems: 'center', justifyContent: 'center',
  },
  editorialBtnText: { color: '#fff', fontSize: 12, letterSpacing: 1.5 },

  // Trust
  trustGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  trustItem: { width: '48%', alignItems: 'center', marginBottom: 24 },
  trustTitle: { fontSize: 15, color: COLORS.ink, marginBottom: 4 },
  trustDesc: { fontSize: 10, color: COLORS.gold, letterSpacing: 1, textAlign: 'center' },

  // Newsletter (Compact Luxury Invitation Card)
  newsletterCard: {
    marginHorizontal: 20,
    marginVertical: 28,
    paddingVertical: 28,
    paddingHorizontal: 22,
    borderWidth: 1,
    borderColor: COLORS.goldLight,
    backgroundColor: COLORS.ivoryLight,
    alignItems: 'center',
  },
  newsletterTitle: { fontSize: 19, color: COLORS.ink, fontWeight: '300', marginBottom: 6, textAlign: 'center' },
  newsletterDesc: { color: COLORS.textMuted, fontSize: 13, textAlign: 'center', marginBottom: 18 },
  newsletterRow: { flexDirection: 'row', width: '100%', gap: 10 },
  newsletterInput: {
    flex: 1, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.ivory,
    paddingVertical: 12, paddingHorizontal: 14, textAlign: 'right', fontSize: 13,
  },
  newsletterBtn: {
    backgroundColor: COLORS.charcoal, paddingHorizontal: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  newsletterBtnText: { color: COLORS.ivory, fontSize: 12, letterSpacing: 1 },

  // Closing mark (بديل صغير جداً عن الـ Footer القديم)
  closingMark: { alignItems: 'center', paddingBottom: 8 },
  closingBrand: { fontSize: 14, letterSpacing: 3, color: COLORS.gold, fontWeight: '300' },
  closingTagline: { fontSize: 9, letterSpacing: 1.5, color: COLORS.textSubtle, marginTop: 4 },

  // Bottom nav
  bottomNav: {
    flexDirection: 'row', height: 60, backgroundColor: COLORS.ivory,
    borderTopWidth: 1, borderTopColor: 'rgba(139,115,85,0.25)',
  },
  bottomNavBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
  bottomNavText: { fontSize: 8.5, color: COLORS.ink, letterSpacing: 0.5 },
  bottomNavActive: { color: COLORS.gold },
});

