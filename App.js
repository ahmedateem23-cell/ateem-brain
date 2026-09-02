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
  Modal,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Svg, { Path } from 'react-native-svg';
import {
  MensIcon, WomensIcon, ShoesIcon, BagsIcon,
  MenuIcon, CartIcon, SearchIcon, HomeIcon, HeartIcon, ProfileIcon, GridIcon,
  HeadsetIcon, ShieldIcon, TruckIcon,
} from './CategoryIcons';
import { useFonts, PlayfairDisplay_700Bold, PlayfairDisplay_600SemiBold } from '@expo-google-fonts/playfair-display';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';
import ChatOverlay from './ChatOverlay';
import { COLORS } from './colors';
import { THEME } from './theme';

// ملاحظة RTL: ما بنستخدم I18nManager.forceRTL هون قصداً — الاستدعاء
// ده بيتطبّق فعليًا بعد إعادة تشغيل native كاملة للتطبيق، مش فوراً،
// وده كان بيسبب انعكاس مزدوج (النظام بيقلب + كودنا اليدوي بيقلب
// كمان) بين فتحة وأخرى للتطبيق. بدل كده، كل اتجاه RTL هنا يدوي
// وصريح: flexDirection: 'row-reverse' وtextAlign: 'right' في كل
// مكان محتاج، وده بيضمن نفس الشكل دايمًا بغض النظر عن حالة النظام.

const { width } = Dimensions.get('window');

// نسبة أبعاد صورة البانر الأصلية (989×441). بنحسب الارتفاع بالبكسل
// مباشرة بدل الاعتماد على style aspectRatio جوا ScrollView (بيتصرف
// أحيانًا بشكل غير متوقع). HERO_HEIGHT_FACTOR بيسمح نقلل الارتفاع
// شوية عن كامل النسبة الأصلية لمظهر أرشق (بيعمل قصّ خفيف متماثل من
// فوق وتحت الصورة، مش من الجنبين، فالنص والعناصر الجانبية بتفضل
// ظاهرة). جرّب قيم بين 0.8–1 لو حابب تظبطها أكتر.
const HERO_ASPECT_RATIO = 989 / 441;
const HERO_HEIGHT_FACTOR = 1.12;
// هامش أفقي بسيط بين البانر وحواف الشاشة (زي التصميم المرجعي، مش
// full-bleed). الارتفاع محسوب على أساس عرض البانر الفعلي (عرض
// الشاشة ناقص الهامشين) مش عرض الشاشة كامل.
const HERO_MARGIN = 20;
const HERO_WIDTH = width - HERO_MARGIN * 2;
const HERO_HEIGHT = (HERO_WIDTH / HERO_ASPECT_RATIO) * HERO_HEIGHT_FACTOR;

// ---------- الاتصال بالمتجر الحقيقي عبر الـ Worker ----------
const ATEEM_PROXY_URL = 'https://ateem-proxy.ahmedatim23.workers.dev/';

// أقصى عدد منتجات يُعرض في قسم "القطع الجديدة" بالصفحة الرئيسية —
// باقي منتجات المتجر بيوصلها العميل من "عرض الكل" أو تبويب "المتجر"،
// مش من الصفحة الرئيسية عشان تفضل خفيفة ومركّزة.
const NEW_ARRIVALS_LIMIT = 6;

// شريط الفئات السريع (دواير أيقونات) — الترتيب هنا من اليمين لليسار
// بصريًا (رجالية أول عنصر يفضل أقصى اليمين) لأننا بنستخدم row-reverse
// صريح بدل الاعتماد على تفعيل RTL التلقائي.
const QUICK_CATEGORIES = [
  { id: 'men', title: 'رجالية', Icon: MensIcon },
  { id: 'women', title: 'نسائية', Icon: WomensIcon },
  { id: 'shoes', title: 'الأحذية', Icon: ShoesIcon },
  { id: 'bags', title: 'الحقائب', Icon: BagsIcon },
];

// منتجات مميزة (يدوية/ثابتة) — مطابقة لتصميم البانر المرجعي: قلب
// مفضّلة، بادج فئة (نسائية/رجالية)، وصف قصير، زرار ذهبي كامل العرض.
const FEATURED_PRODUCTS = [
  {
    id: 'featured-bag',
    title: 'حقيبة يد أنيقة',
    subtitle: 'تصميم عصري بلمسة فاخرة',
    price: '125,000 SDG',
    badge: 'نسائية',
    img: require('./assets/featured-bag.png'),
  },
  {
    id: 'featured-shirt',
    title: 'قميص رسمي',
    subtitle: 'راحة وأناقة في كل تفاصيل',
    price: '95,000 SDG',
    badge: 'رجالية',
    img: require('./assets/featured-shirt.png'),
  },
];

const LOOKS = [
  { id: 'l1', title: 'الأناقة المسائية', season: 'خريف / شتاء 2026', img: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&q=80' },
  { id: 'l2', title: 'الكلاسيكية العصرية', season: 'مجموعة دائمة', img: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=600&q=80' },
  { id: 'l3', title: 'إطلالة الشارع', season: 'ربيع / صيف 2026', img: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&q=80' },
  { id: 'l4', title: 'الألوان المحايدة', season: 'تشكيلة حصرية', img: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1000&q=80' },
  { id: 'l5', title: 'تفاصيل الجلد', season: 'إكسسوارات فاخرة', img: 'https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?w=600&q=80' },
];

// أيقونة شارة "ضمان الجودة" — بنفس ستايل الخط (line-art) المستخدم في
// باقي أيقونات CategoryIcons، معرّفة هنا محلياً لأنها عنصر إضافي جديد.
function BadgeIcon({ size = 26, color = '#6B1E2E' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <Path
        d="M32 6c9 0 16 7 16 16s-7 16-16 16-16-7-16-16S23 6 32 6Z"
        stroke={color} strokeWidth={2.5} strokeLinejoin="round"
      />
      <Path
        d="M24 20l6 6 11-11"
        stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"
      />
      <Path
        d="M25 33 19 55l7-4 5 5 4-13M39 33l6 22-7-4-5 5-4-13"
        stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"
      />
    </Svg>
  );
}

const NAV_LINKS = ['نساء', 'رجال', 'إكسسوارات', 'مجوهرات', 'القصة'];

// شريط المميزات القصير (دعم متواصل / دفع آمن / توصيل سريع / ضمان الجودة)
const FEATURE_ITEMS = [
  { id: 'support', title: 'دعم متواصل', Icon: HeadsetIcon },
  { id: 'payment', title: 'دفع آمن', Icon: ShieldIcon },
  { id: 'delivery', title: 'توصيل سريع', Icon: TruckIcon },
  { id: 'quality', title: 'ضمان الجودة', Icon: BadgeIcon },
];

const TRUST_ITEMS = [
  { title: 'توصيل مجاني', desc: 'على الطلبات فوق 50,000 SDG' },
  { title: 'ضمان أصالة', desc: 'شهادة مع كل قطعة' },
  { title: 'إرجاع سهل', desc: 'خلال 30 يوماً' },
  { title: 'تغليف فاخر', desc: 'هدايا حصرية مع كل طلب' },
];

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartCount] = useState(2);
  const [chatOpen, setChatOpen] = useState(false);

  const [fontsLoaded] = useFonts({
    PlayfairDisplay_700Bold,
    PlayfairDisplay_600SemiBold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadProducts() {
      setProductsLoading(true);
      setProductsError(false);
      try {
        const res = await fetch(ATEEM_PROXY_URL + 'odoo-products');
        const data = await res.json();
        if (!data.ok || !Array.isArray(data.products)) throw new Error('bad payload');
        if (!cancelled) setProducts(data.products);
      } catch (e) {
        if (!cancelled) { setProducts([]); setProductsError(true); }
      } finally {
        if (!cancelled) setProductsLoading(false);
      }
    }
    loadProducts();
    return () => { cancelled = true; };
  }, []);

  function fmtOdooPrice(p) {
    const n = Number(p.price) || 0;
    return n.toLocaleString('en-US') + ' ' + (p.currency || 'SDG');
  }

  if (!fontsLoaded) {
    return (
      <SafeAreaView style={[styles.safe, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color={COLORS.gold} size="large" />
      </SafeAreaView>
    );
  }

  // قسم "القطع الجديدة" بيعرض أول NEW_ARRIVALS_LIMIT بس، مش المتجر
  // كامل — الترتيب جاي من الـ Worker نفسه (الأحدث والأكثر مبيعاً أولاً).
  const newArrivals = products.slice(0, NEW_ARRIVALS_LIMIT);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" backgroundColor={THEME.background} />

      {/* ===== Header ===== */}
      <View style={styles.navbar}>
        <TouchableOpacity onPress={() => setMenuOpen(true)} style={styles.iconBtn}>
          <MenuIcon size={24} color={COLORS.gold} />
        </TouchableOpacity>

        <View style={styles.brandWrap}>
          <Text style={styles.brand}>ATEEM</Text>
          <Text style={styles.tagline}>SUDAN · MODERN LUXURY</Text>
        </View>

        <TouchableOpacity style={styles.iconBtn}>
          <CartIcon size={24} color={COLORS.gold} />
          {cartCount > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* ===== القائمة الجانبية ===== */}
      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
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
        {/* الصورة مصمّمة كاملة (نص + عناصر) خارج الكود، فمفيش تراكب
            نصوص منفصل هنا — بس زرار شفاف فوق مكان "اكتشف المجموعة"
            المطبوع في الصورة عشان يفضل قابل للضغط. الارتفاع محسوب
            بالبكسل (HERO_HEIGHT) بدل aspectRatio عشان يفضل ثابت
            ومتوقع جوا ScrollView. */}
        <View style={styles.hero}>
          <View style={styles.heroImageWrap}>
            <Image
              source={require('./assets/hero-banner.jpg')}
              style={styles.heroBannerImage}
              resizeMode="cover"
            />
            <TouchableOpacity style={styles.heroBannerCtaHit} activeOpacity={0.7}>
              {/* منطقة ضغط فوق "اكتشف المجموعة" — بدون نص، الصورة كافية */}
            </TouchableOpacity>
          </View>
        </View>

        {/* ===== Quick Categories (icon row) ===== */}
        <View style={styles.quickCatWrap}>
          <View style={styles.quickCatCard}>
            {QUICK_CATEGORIES.map((cat, i) => (
              <React.Fragment key={cat.id}>
                <TouchableOpacity style={styles.quickCatItem} activeOpacity={0.7}>
                  <View style={styles.quickCatIconWrap}>
                    <cat.Icon size={22} color={COLORS.burgundy} />
                  </View>
                  <Text style={styles.quickCatLabel}>{cat.title}</Text>
                </TouchableOpacity>
                {i < QUICK_CATEGORIES.length - 1 && <View style={styles.quickCatDivider} />}
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* ===== Featured Products ===== */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={[styles.sectionTitle, styles.sectionTitleSmall]}>منتجات مميزة</Text>
              <View style={styles.sectionTitleUnderline} />
            </View>
            <TouchableOpacity>
              <Text style={styles.viewAll}>عرض الكل ←</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.featuredGrid}>
            {FEATURED_PRODUCTS.map((p) => (
              <View key={p.id} style={[styles.featuredCard, { width: CARD_W }]}>
                <View style={styles.featuredImageWrap}>
                  <Image source={p.img} style={styles.featuredImage} resizeMode="cover" />
                  <TouchableOpacity style={styles.featuredHeartBtn}>
                    <HeartIcon size={15} color={COLORS.burgundy} />
                  </TouchableOpacity>
                  <View style={styles.featuredBadge}>
                    <Text style={styles.featuredBadgeText}>{p.badge}</Text>
                  </View>
                </View>
                <Text style={styles.featuredTitle}>{p.title}</Text>
                <Text style={styles.featuredSubtitle}>{p.subtitle}</Text>
                <Text style={styles.featuredPrice}>{p.price}</Text>
                <TouchableOpacity style={styles.featuredAddBtn}>
                  <Text style={styles.featuredAddBtnText}>أضف للسلة</Text>
                  <BagsIcon size={14} color={COLORS.burgundy} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        {/* ===== شريط المميزات (دعم متواصل / دفع آمن / توصيل سريع) ===== */}
        <View style={styles.featureBarWrap}>
          <View style={styles.featureBar}>
            {FEATURE_ITEMS.map((f, i) => (
              <React.Fragment key={f.id}>
                <View style={styles.featureItem}>
                  <View style={styles.featureIconWrap}>
                    <f.Icon size={17} color={COLORS.burgundy} />
                  </View>
                  <Text style={styles.featureItemText}>{f.title}</Text>
                </View>
                {i < FEATURE_ITEMS.length - 1 && <View style={styles.featureDivider} />}
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* ===== New Arrivals ===== */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>القطع الجديدة</Text>
              <View style={styles.sectionTitleUnderline} />
            </View>
            <TouchableOpacity>
              <Text style={styles.viewAll}>عرض الكل ←</Text>
            </TouchableOpacity>
          </View>

          {productsLoading && (
            <View style={styles.productsStateWrap}>
              <ActivityIndicator color={COLORS.gold} />
            </View>
          )}
          {!productsLoading && productsError && (
            <View style={styles.productsStateWrap}>
              <Text style={styles.productsStateText}>تعذّر تحميل المنتجات الآن — تأكد من اتصالك وحاول مجدداً.</Text>
            </View>
          )}
          {!productsLoading && !productsError && products.length === 0 && (
            <View style={styles.productsStateWrap}>
              <Text style={styles.productsStateText}>لا توجد منتجات منشورة حالياً.</Text>
            </View>
          )}
          {!productsLoading && !productsError && newArrivals.length > 0 && (
            <View style={styles.featuredGrid}>
              {newArrivals.map((p) => (
                <View key={p.id} style={[styles.featuredCard, { width: CARD_W }]}>
                  <View style={styles.featuredImageWrap}>
                    <Image source={{ uri: p.image }} style={styles.featuredImage} resizeMode="cover" />
                    <TouchableOpacity style={styles.featuredHeartBtn}>
                      <HeartIcon size={15} color={COLORS.burgundy} />
                    </TouchableOpacity>
                    {p.badge && (
                      <View style={styles.featuredBadge}>
                        <Text style={styles.featuredBadgeText}>{p.badge}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.featuredTitle} numberOfLines={2}>{p.name}</Text>
                  <Text style={styles.featuredPrice}>{fmtOdooPrice(p)}</Text>
                  <TouchableOpacity style={styles.featuredAddBtn}>
                    <Text style={styles.featuredAddBtnText}>أضف للسلة</Text>
                    <BagsIcon size={14} color={COLORS.burgundy} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
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
              نحافظ في ATEEM على معايير حرفية دقيقة في اختيار كل قطعة، من أجود الأقمشة والجلود إلى أدق التفاصيل.
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
        <View style={styles.section}>
          <View style={styles.trustGrid}>
            {TRUST_ITEMS.map((t) => (
              <View key={t.title} style={styles.trustItem}>
                <Text style={styles.trustTitle}>{t.title}</Text>
                <Text style={styles.trustDesc}>{t.desc}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ===== إشعارات (بديل النشرة القديمة) ===== */}
        <View style={styles.notifyCard}>
          <Text style={styles.notifyTitle}>كن أول من يعلم</Text>
          <Text style={styles.notifyDesc}>اشترك لتصلك إشعارات المجموعات الجديدة والعروض الحصرية</Text>
          <View style={styles.notifyRow}>
            <TextInput
              style={styles.notifyInput}
              placeholder="بريدك الإلكتروني"
              placeholderTextColor={THEME.textSecondary}
              keyboardType="email-address"
            />
            <TouchableOpacity style={styles.notifyBtn}>
              <Text style={styles.notifyBtnText}>اشتراك</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* ===== Bottom Nav ===== */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.bottomNavBtn}>
          <HomeIcon size={22} color={COLORS.burgundy} />
          <Text style={[styles.bottomNavText, styles.bottomNavActive]}>الرئيسية</Text>
          <View style={styles.bottomNavIndicator} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.bottomNavBtn}>
          <GridIcon size={21} color={THEME.textSecondary} />
          <Text style={styles.bottomNavText}>المنتجات</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.bottomNavBtn}>
          <SearchIcon size={22} color={THEME.textSecondary} />
          <Text style={styles.bottomNavText}>بحث</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.bottomNavBtn}>
          <ProfileIcon size={22} color={THEME.textSecondary} />
          <Text style={styles.bottomNavText}>حسابي</Text>
        </TouchableOpacity>
      </View>

      {/* ===== زر المستشار العائم — منفصل عن الشريط السفلي، متراكب
          فوقه قليلاً من الجهة اليسرى للشاشة (ثابت بصريًا زي التصميم
          المرجعي، بغض النظر عن اتجاه RTL). ===== */}
      <TouchableOpacity
        style={styles.floatingBot}
        onPress={() => setChatOpen(true)}
        activeOpacity={0.85}
      >
        <Image source={require('./assets/bot-avatar.png')} style={styles.floatingBotImage} resizeMode="cover" />
      </TouchableOpacity>

      <ChatOverlay
        visible={chatOpen}
        onClose={() => setChatOpen(false)}
        products={products}
      />
    </SafeAreaView>
  );
}

// عرض وفراغ موحّدان بين "منتجات مميزة" و"القطع الجديدة" — نفس القيمة
// بالضبط في القسمين عشان تبقى البطاقات متطابقة تمامًا بين الأقسام.
const CARD_GAP = 16;
const CARD_W = (width - 20 * 2 - CARD_GAP) / 2;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: THEME.background },
  scrollContent: { paddingBottom: 24 },

  // Quick categories — دواير أصغر شوية (56→48) وبادينج رأسي أقل
  // (18→13) لمظهر أرشق، مع الحفاظ على نفس البنية (كارت أبيض عائم،
  // فواصل رفيعة بين العناصر).
  quickCatWrap: { paddingHorizontal: 20, marginTop: 4, marginBottom: 4 },
  quickCatCard: {
    flexDirection: 'row-reverse',
    backgroundColor: THEME.card,
    borderRadius: 26,
    paddingVertical: 18,
    paddingHorizontal: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 3,
  },
  quickCatItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  quickCatIconWrap: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: THEME.background,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 7,
  },
  quickCatLabel: { fontFamily: THEME.fontBody, fontSize: 15, color: THEME.textPrimary },
  quickCatDivider: { width: 1, height: 24, backgroundColor: THEME.border, alignSelf: 'center' },

  // Navbar — بادينج رأسي أقل (12→9) وأيقونات أصغر شوية لمظهر أرشق
  // (44→38)، وخط الشعار مخفّض نقطة وحدة (24→22) عشان يفضل متناسق
  // مع الهيدر الأقصر.
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 18,
    backgroundColor: COLORS.burgundy,
  },
  iconBtn: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  brandWrap: { alignItems: 'center' },
  brand: { fontFamily: THEME.fontHeading, fontSize: 22, letterSpacing: 3, color: COLORS.gold },
  tagline: { fontFamily: THEME.fontBody, fontSize: 11, letterSpacing: 2, color: 'rgba(245,239,230,0.7)', marginTop: 3 },
  cartBadge: {
    position: 'absolute', top: 0, left: 0, backgroundColor: COLORS.gold,
    width: 19, height: 19, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
  },
  cartBadgeText: { color: COLORS.burgundy, fontSize: 9, fontFamily: THEME.fontBodySemiBold },

  // Mobile menu
  menuOverlay: { flex: 1, backgroundColor: 'rgba(26,26,26,0.4)' },
  menuPanel: {
    marginTop: 80, alignSelf: 'center', width: '72%', backgroundColor: THEME.card,
    borderRadius: 12, paddingVertical: 10, paddingHorizontal: 22,
  },
  menuLinkRow: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: THEME.border },
  menuLinkText: { fontFamily: THEME.fontBody, fontSize: 16, color: THEME.textPrimary },

  // Hero — الارتفاع محسوب بالبكسل (HERO_HEIGHT أعلى الملف) بدل
  // aspectRatio، وده بيضمن ثبات الشكل بدل ما يعتمد على حساب Yoga
  // الداخلي جوا ScrollView. HERO_HEIGHT_FACTOR بيقلل الارتفاع شوية
  // (قصّ متماثل من فوق وتحت) لمظهر أرشق بدون ما يأثر على عرض النص.
  hero: { paddingHorizontal: HERO_MARGIN, paddingBottom: 10, paddingTop: 21 },
  heroImageWrap: { borderRadius: 17, overflow: 'hidden' },
  heroBannerImage: { width: '100%', height: HERO_HEIGHT },
  heroBannerCtaHit: {
    position: 'absolute', left: '9%', top: '58%', width: '24%', height: '16%',
  },
  heroTitleItalic: { fontStyle: 'italic', color: COLORS.burgundy },

  // Sections
  section: { paddingHorizontal: 20, paddingVertical: 24 },
  sectionHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 30 },
  sectionLabel: { fontFamily: THEME.fontBody, color: COLORS.gold, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 },
  sectionTitle: { fontFamily: THEME.fontHeading, fontSize: 26, color: THEME.textPrimary },
  sectionTitleSmall: { fontSize: 26 },
  sectionTitleUnderline: { width: 74, height: 4, borderRadius: 4, backgroundColor: COLORS.gold, marginTop: 11 },
  viewAll: { fontFamily: THEME.fontBody, color: COLORS.gold, fontSize: 15 },

  // Featured Products
  featuredGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: CARD_GAP, justifyContent: 'space-between' },
  featuredCard: { marginBottom: 26, backgroundColor: 'transparent', borderRadius: 0, padding: 0 },
  featuredImageWrap: {
    width: '100%', aspectRatio: 1.15, backgroundColor: THEME.background,
    marginBottom: 15, position: 'relative', borderRadius: 17, overflow: 'hidden',
  },
  featuredImage: { width: '100%', height: '100%' },
  featuredHeartBtn: {
    position: 'absolute', top: 10, left: 10, width: 30, height: 30, borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.92)', alignItems: 'center', justifyContent: 'center',
  },
  featuredBadge: {
    position: 'absolute', top: 10, right: 10, backgroundColor: COLORS.burgundy,
    paddingVertical: 4, paddingHorizontal: 11, borderRadius: 20,
  },
  featuredBadgeText: { fontFamily: THEME.fontBody, color: COLORS.white, fontSize: 10 },
  featuredTitle: { fontFamily: THEME.fontBodySemiBold, fontSize: 17, color: THEME.textPrimary, marginBottom: 7, lineHeight: 22 },
  featuredSubtitle: { fontFamily: THEME.fontBody, fontSize: 13, color: THEME.textSecondary, marginBottom: 10, lineHeight: 18 },
  featuredPrice: { fontFamily: THEME.fontBodySemiBold, fontSize: 20, color: THEME.textPrice, marginBottom: 15 },
  featuredAddBtn: {
    flexDirection: 'row', gap: 6,
    backgroundColor: COLORS.gold, borderRadius: 15, height: 54,
    alignItems: 'center', justifyContent: 'center',
  },
  featuredAddBtnText: { fontFamily: THEME.fontBodySemiBold, color: COLORS.burgundy, fontSize: 15.5 },

  // ملاحظة: بطاقة "القطع الجديدة" بقت تستخدم بالضبط نفس ستايلات
  // "منتجات مميزة" (featuredCard/featuredImageWrap/...) فوق — مفيش
  // ستايل منفصل ليها، عشان تبقى البطاقتان متطابقتين تمامًا زي المطلوب.
  productsStateWrap: { paddingVertical: 30, alignItems: 'center' },
  productsStateText: { fontFamily: THEME.fontBody, color: THEME.textSecondary, fontSize: 13, textAlign: 'center', paddingHorizontal: 20 },

  // شريط المميزات — بدون صندوق ملوّن: أيقونة داخل دائرة فاتحة اللون
  // فوق سطر نص، على خلفية الصفحة مباشرة، زي المرجع (صورة 1).
  featureBarWrap: { paddingHorizontal: 20, marginTop: 2, marginBottom: 6 },
  featureBar: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  featureItem: { flex: 1, alignItems: 'center', justifyContent: 'flex-start', gap: 6 },
  featureIconWrap: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(107,30,46,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  featureItemText: { fontFamily: THEME.fontBody, color: THEME.textPrimary, fontSize: 10.5, textAlign: 'center' },
  featureDivider: { width: 1, height: 26, backgroundColor: 'rgba(107,30,46,0.14)', alignSelf: 'center', marginTop: 6 },

  // Lookbook
  lookbook: { backgroundColor: COLORS.charcoal, paddingVertical: 46, paddingHorizontal: 20 },
  lookbookHeader: { alignItems: 'center', marginBottom: 28 },
  lookLabel: { fontFamily: THEME.fontBody, color: COLORS.gold, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 },
  lookTitle: { fontFamily: THEME.fontHeading, color: COLORS.white, fontSize: 27, marginBottom: 8 },
  lookSubtitle: { fontFamily: THEME.fontBody, color: COLORS.gold, fontSize: 13 },
  lookItem: { height: 210, marginBottom: 14, overflow: 'hidden', borderRadius: 4 },
  lookImage: { width: '100%', height: '100%' },
  lookOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0, top: 0, justifyContent: 'flex-end',
    padding: 18, backgroundColor: 'rgba(107,30,46,0.35)',
  },
  lookNumber: { position: 'absolute', top: 10, right: 16, fontFamily: THEME.fontHeading, fontSize: 38, color: 'rgba(245,239,230,0.2)' },
  lookItemTitle: { fontFamily: THEME.fontHeading, color: '#fff', fontSize: 18, marginBottom: 4 },
  lookSeason: { fontFamily: THEME.fontBody, color: COLORS.gold, fontSize: 10, letterSpacing: 1.5 },
  lookFooterBtn: {
    alignSelf: 'center', marginTop: 18, paddingVertical: 13, paddingHorizontal: 34,
    borderWidth: 1, borderColor: 'rgba(245,239,230,0.4)',
  },
  lookFooterBtnText: { fontFamily: THEME.fontBody, color: COLORS.white, fontSize: 12, letterSpacing: 1.5 },

  // Craftsmanship
  craft: { paddingHorizontal: 20, paddingVertical: 46 },
  craftImageWrap: { position: 'relative', marginBottom: 38 },
  craftImage: { width: '100%', height: 300, borderRadius: 4 },
  craftStat: { position: 'absolute', bottom: -18, left: 10, backgroundColor: COLORS.burgundy, padding: 18 },
  craftStatNumber: { fontFamily: THEME.fontHeading, color: COLORS.white, fontSize: 34 },
  craftStatDesc: { fontFamily: THEME.fontBody, color: COLORS.gold, fontSize: 10, letterSpacing: 1, marginTop: 6, lineHeight: 16 },
  craftContent: {},
  craftHeading: { fontFamily: THEME.fontHeading, fontSize: 25, color: THEME.textPrimary, lineHeight: 33, marginBottom: 15, marginTop: 8 },
  craftParagraph: { fontFamily: THEME.fontBody, color: THEME.textSecondary, lineHeight: 23, marginBottom: 12 },
  craftLink: { fontFamily: THEME.fontBody, color: COLORS.burgundy, fontSize: 12, letterSpacing: 1.5, marginTop: 10, textDecorationLine: 'underline' },

  // Editorial
  editorial: { height: 300, position: 'relative' },
  editorialImage: { width: '100%', height: '100%' },
  editorialOverlay: {
    ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(107,30,46,0.5)',
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30,
  },
  editorialLabel: { fontFamily: THEME.fontBody, color: COLORS.gold, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 15 },
  editorialTitle: { fontFamily: THEME.fontHeading, color: '#fff', fontSize: 28, textAlign: 'center', lineHeight: 36, marginBottom: 18 },
  editorialBtn: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.7)', paddingVertical: 13, paddingHorizontal: 30 },
  editorialBtnText: { fontFamily: THEME.fontBody, color: '#fff', fontSize: 12, letterSpacing: 1.5 },

  // Trust
  trustGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  trustItem: { width: '48%', alignItems: 'center', marginBottom: 22 },
  trustTitle: { fontFamily: THEME.fontHeading, fontSize: 15, color: THEME.textPrimary, marginBottom: 4 },
  trustDesc: { fontFamily: THEME.fontBody, fontSize: 10, color: COLORS.gold, letterSpacing: 1, textAlign: 'center' },

  // إشعارات
  notifyCard: {
    marginHorizontal: 20, marginTop: 8, marginBottom: 26,
    backgroundColor: THEME.card, borderRadius: 12, padding: 18,
    alignItems: 'center', borderWidth: 1, borderColor: THEME.border,
  },
  notifyTitle: { fontFamily: THEME.fontHeading, fontSize: 16, color: THEME.textPrimary, marginBottom: 4, textAlign: 'center' },
  notifyDesc: { fontFamily: THEME.fontBody, fontSize: 11.5, color: THEME.textSecondary, textAlign: 'center', marginBottom: 13, lineHeight: 17 },
  notifyRow: { flexDirection: 'row', width: '100%', gap: 8 },
  notifyInput: {
    flex: 1, borderWidth: 1, borderColor: THEME.border, backgroundColor: THEME.background,
    borderRadius: 8, paddingVertical: 10, paddingHorizontal: 14, fontFamily: THEME.fontBody, fontSize: 12.5, textAlign: 'right', color: THEME.textPrimary,
  },
  notifyBtn: { backgroundColor: COLORS.gold, borderRadius: 8, paddingVertical: 10, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center' },
  notifyBtnText: { fontFamily: THEME.fontBodySemiBold, color: COLORS.burgundy, fontSize: 12 },

  // Bottom nav — ارتفاع أقل (68→58) لمظهر أرشق، مع تصغير أيقونة
  // الروبوت بما يتناسب (46→40) عشان تفضل متوازنة بصريًا مع باقي
  // الأيقونات الأصغر جنبها.
  bottomNav: {
    flexDirection: 'row-reverse', height: 58, backgroundColor: THEME.card,
    borderTopWidth: 1, borderTopColor: THEME.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 10,
  },
  bottomNavBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3 },
  bottomNavText: { fontFamily: THEME.fontBody, fontSize: 9.5, color: THEME.textSecondary, letterSpacing: 0.3 },
  bottomNavActive: { color: COLORS.burgundy, fontFamily: THEME.fontBodySemiBold },
  bottomNavIndicator: { width: 18, height: 2, borderRadius: 1, backgroundColor: COLORS.burgundy, marginTop: 1 },

  // زر المستشار العائم — فوق الشريط السفلي (ارتفاعه 58) بمسافة فاصلة
  // واضحة (16px) عشان ما يتداخلوش، من الجهة اليسرى للشاشة، بغض النظر
  // عن اتجاه RTL (left ثابتة قصدًا).
  floatingBot: {
    position: 'absolute',
    bottom: 74,
    left: 14,
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: THEME.card,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.18, shadowRadius: 8, elevation: 10,
  },
  floatingBotImage: { width: 60, height: 60 },
});
