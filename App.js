import React, { useState, useEffect, useRef } from 'react';
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
  Animated,
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
const HERO_ASPECT_RATIO = 1536 / 1024;
// الصورة الجديدة بدون نص/زر مطبوع فيها، فمفيش داعي لعامل تصغير
// (crop) — بنعرضها كاملة زي ما هي.
const HERO_HEIGHT_FACTOR = 1;
// هامش أفقي أصغر شوية من قبل (14→10) عشان البانر ياخد مساحة أكبر
// من عرض الشاشة، بدون ما يلامس حواف الإطار تماماً.
const HERO_MARGIN = 10;
const HERO_WIDTH = width - HERO_MARGIN * 2;
const HERO_HEIGHT = (HERO_WIDTH / HERO_ASPECT_RATIO) * HERO_HEIGHT_FACTOR;

// ---------- الاتصال بالمتجر الحقيقي عبر الـ Worker ----------
const ATEEM_PROXY_URL = 'https://ateem-proxy.ahmedatim23.workers.dev/';

// أقصى عدد منتجات يُعرض في قسم "القطع الجديدة" بالصفحة الرئيسية —
// باقي منتجات المتجر بيوصلها العميل من "عرض الكل" أو تبويب "المتجر"،
// مش من الصفحة الرئيسية عشان تفضل خفيفة ومركّزة.
const NEW_ARRIVALS_LIMIT = 4;

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
  { id: 'l1', title: 'أناقة الرجل', season: 'خريف / شتاء 2026', img: require('./assets/lookbook-men.png') },
  { id: 'l2', title: 'أسلوب متكامل', season: 'مجموعة دائمة', img: require('./assets/lookbook-women.png') },
  { id: 'l3', title: 'التفاصيل تصنع الفخامة', season: 'إكسسوارات فاخرة', img: require('./assets/lookbook-accessories.png') },
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

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartCount] = useState(2);
  const [chatOpen, setChatOpen] = useState(false);

  // نبضة "تنفّس" خفيفة ومستمرة لزرار البوت العائم — بتلفت النظر من
  // غير ما تزعج، وبتوقف تلقائيًا وقت ما الشات يفتح (مفيش داعي البوت
  // يفضل بينبض وهو أصلاً مفتوح قدام العميل).
  const botPulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (chatOpen) {
      botPulse.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(botPulse, { toValue: 1.08, duration: 1100, useNativeDriver: true }),
        Animated.timing(botPulse, { toValue: 1, duration: 1100, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [chatOpen]);

  // ضغطة سريعة (bounce): انكماش خفيف ثم ارتداد لحجم أكبر شوية من
  // الأصلي قبل ما يرجع طبيعي — إحساس "حي" لحظة الفتح، بدل ما يفتح
  // الشات فجأة من غير أي رد فعل بصري من الزرار نفسه.
  const botBounce = useRef(new Animated.Value(1)).current;
  function handleBotPress() {
    Animated.sequence([
      Animated.timing(botBounce, { toValue: 0.85, duration: 90, useNativeDriver: true }),
      Animated.spring(botBounce, { toValue: 1, friction: 4, tension: 120, useNativeDriver: true }),
    ]).start();
    setChatOpen(true);
  }

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
          <MenuIcon size={26} color={COLORS.gold} />
        </TouchableOpacity>

        <View style={styles.brandWrap}>
          <Text style={styles.brand}>ATEEM</Text>
          <Text style={styles.tagline}>SUDAN · MODERN LUXURY</Text>
        </View>

        <TouchableOpacity style={styles.iconBtn}>
          <CartIcon size={26} color={COLORS.gold} />
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
            <View style={styles.heroCtaWrap} pointerEvents="box-none">
              <TouchableOpacity style={styles.heroCtaBtn} activeOpacity={0.85}>
                <Text style={styles.heroCtaBtnText}>اكتشف المجموعة</Text>
                <Text style={styles.heroCtaBtnArrow}>‹</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ===== Quick Categories (icon row) ===== */}
        <View style={styles.quickCatWrap}>
          <View style={styles.quickCatCard}>
            {QUICK_CATEGORIES.map((cat, i) => (
              <React.Fragment key={cat.id}>
                <TouchableOpacity style={styles.quickCatItem} activeOpacity={0.7}>
                  <View style={styles.quickCatIconWrap}>
                    <cat.Icon size={18} color={COLORS.burgundy} />
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
                    <HeartIcon size={13} color={COLORS.burgundy} />
                  </TouchableOpacity>
                  <View style={styles.featuredBadge}>
                    <Text style={styles.featuredBadgeText}>{p.badge}</Text>
                  </View>
                </View>
                <Text style={styles.featuredTitle} numberOfLines={2}>{p.title}</Text>
                <Text style={styles.featuredSubtitle}>{p.subtitle}</Text>
                <Text style={styles.featuredPrice}>{p.price}</Text>
                <TouchableOpacity style={styles.featuredAddBtn}>
                  <Text style={styles.featuredAddBtnText}>أضف للسلة</Text>
                  <BagsIcon size={12} color={COLORS.burgundy} />
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
                      <HeartIcon size={13} color={COLORS.burgundy} />
                    </TouchableOpacity>
                    {p.badge && (
                      <View style={styles.featuredBadge}>
                        <Text style={styles.featuredBadgeText}>{p.badge}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.featuredTitle} numberOfLines={2}>{p.name}</Text>
                  <Text style={styles.featuredSubtitle} numberOfLines={1}>{p.description || ''}</Text>
                  <Text style={styles.featuredPrice}>{fmtOdooPrice(p)}</Text>
                  <TouchableOpacity style={styles.featuredAddBtn}>
                    <Text style={styles.featuredAddBtnText}>أضف للسلة</Text>
                    <BagsIcon size={12} color={COLORS.burgundy} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* ===== Lookbook ===== */}
        <View style={styles.lookbook}>
          <View style={styles.lookbookHeader}>
            <Text style={styles.lookTitle}>LOOKBOOK — قصص من الأناقة</Text>
          </View>

          {LOOKS.map((look) => (
            <TouchableOpacity key={look.id} style={styles.lookItem}>
              <Image source={look.img} style={styles.lookImage} />
              <View style={styles.lookOverlay}>
                <Text style={styles.lookItemTitle}>{look.title}</Text>
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
          <HomeIcon size={20} color={COLORS.burgundy} />
          <Text style={[styles.bottomNavText, styles.bottomNavActive]}>الرئيسية</Text>
          <View style={styles.bottomNavIndicator} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.bottomNavBtn}>
          <GridIcon size={19} color={THEME.textSecondary} />
          <Text style={styles.bottomNavText}>المنتجات</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.bottomNavBtn}>
          <SearchIcon size={20} color={THEME.textSecondary} />
          <Text style={styles.bottomNavText}>بحث</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.bottomNavBtn}>
          <ProfileIcon size={20} color={THEME.textSecondary} />
          <Text style={styles.bottomNavText}>حسابي</Text>
        </TouchableOpacity>
      </View>

      {/* ===== زر المستشار العائم — منفصل عن الشريط السفلي، متراكب
          فوقه قليلاً من الجهة اليسرى للشاشة (ثابت بصريًا زي التصميم
          المرجعي، بغض النظر عن اتجاه RTL). ===== */}
      <Animated.View
        style={[styles.floatingBotAnchor, { transform: [{ scale: Animated.multiply(botPulse, botBounce) }] }]}
      >
        <TouchableOpacity
          style={styles.floatingBot}
          onPress={handleBotPress}
          activeOpacity={0.85}
        >
          <Image source={require('./assets/bot-avatar.png')} style={styles.floatingBotImage} resizeMode="cover" />
        </TouchableOpacity>
      </Animated.View>

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
const CARD_GAP = 14;
const CARD_W = (width - 20 * 2 - CARD_GAP) / 2;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: THEME.background },
  scrollContent: { paddingBottom: 24 },

  // Quick categories — دواير أصغر شوية (56→48) وبادينج رأسي أقل
  // (18→13) لمظهر أرشق، مع الحفاظ على نفس البنية (كارت أبيض عائم،
  // فواصل رفيعة بين العناصر).
  quickCatWrap: { paddingHorizontal: 20, marginTop: 8, marginBottom: 4 },
  quickCatCard: {
    flexDirection: 'row-reverse',
    backgroundColor: THEME.card,
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
  },
  quickCatItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  quickCatIconWrap: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: THEME.background,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 5,
  },
  quickCatLabel: { fontFamily: THEME.fontBody, fontSize: 11, color: THEME.textPrimary },
  quickCatDivider: { width: 1, height: 24, backgroundColor: THEME.border, alignSelf: 'center' },

  // Navbar — بادينج رأسي أقل (12→9) وأيقونات أصغر شوية لمظهر أرشق
  // (44→38)، وخط الشعار مخفّض نقطة وحدة (24→22) عشان يفضل متناسق
  // مع الهيدر الأقصر.
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 10,
    backgroundColor: COLORS.burgundy,
  },
  iconBtn: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  brandWrap: { alignItems: 'center' },
  brand: { fontFamily: THEME.fontHeading, fontSize: 23, letterSpacing: 2.5, color: COLORS.gold },
  tagline: { fontFamily: THEME.fontBody, fontSize: 9, letterSpacing: 1.5, color: COLORS.gold, marginTop: 3 },
  cartBadge: {
    position: 'absolute', top: 0, left: 0, backgroundColor: COLORS.gold,
    width: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center',
  },
  cartBadgeText: { color: COLORS.burgundy, fontSize: 8.5, fontFamily: THEME.fontBodySemiBold },

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
  hero: { paddingHorizontal: HERO_MARGIN, paddingBottom: 8, paddingTop: 16 },
  heroImageWrap: { borderRadius: 14, overflow: 'hidden' },
  heroBannerImage: { width: '100%', height: HERO_HEIGHT },
  // زر "اكتشف المجموعة" — عائم أسفل منتصف البانر، بخلفية عنابية
  // ونص ذهبي، بظل خفيف يبرزه فوق الصورة. مكان مميز وواضح للضغط.
  heroCtaWrap: {
    position: 'absolute', left: 0, right: 0, bottom: 10,
    alignItems: 'center',
  },
  heroCtaBtn: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 5,
    backgroundColor: COLORS.burgundy,
    paddingVertical: 9, paddingHorizontal: 20,
    borderRadius: 22,
    borderWidth: 1, borderColor: 'rgba(201,169,97,0.5)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 6,
  },
  heroCtaBtnText: { fontFamily: THEME.fontBodySemiBold, color: COLORS.gold, fontSize: 12.5, letterSpacing: 0.5 },
  heroCtaBtnArrow: { fontFamily: THEME.fontBodySemiBold, color: COLORS.gold, fontSize: 14 },
  heroTitleItalic: { fontStyle: 'italic', color: COLORS.burgundy },

  // Sections
  section: { paddingHorizontal: 20, paddingVertical: 20 },
  sectionHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 },
  sectionLabel: { fontFamily: THEME.fontBody, color: COLORS.gold, fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 5 },
  sectionTitle: { fontFamily: THEME.fontHeading, fontSize: 19, color: THEME.textPrimary },
  sectionTitleSmall: { fontSize: 19 },
  sectionTitleUnderline: { width: 52, height: 3, borderRadius: 2, backgroundColor: COLORS.gold, marginTop: 8 },
  viewAll: { fontFamily: THEME.fontBody, color: COLORS.gold, fontSize: 12 },

  // Featured Products
  featuredGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: CARD_GAP, justifyContent: 'space-between' },
  featuredCard: { marginBottom: 18, backgroundColor: 'transparent', borderRadius: 0, padding: 0 },
  featuredImageWrap: {
    width: '100%', aspectRatio: 1.1, backgroundColor: THEME.background,
    marginBottom: 10, position: 'relative', borderRadius: 14, overflow: 'hidden',
  },
  featuredImage: { width: '100%', height: '100%' },
  featuredHeartBtn: {
    position: 'absolute', top: 10, left: 10, width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.92)', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2,
  },
  featuredBadge: {
    position: 'absolute', top: 10, right: 10, backgroundColor: COLORS.burgundy,
    paddingVertical: 3, paddingHorizontal: 9, borderRadius: 20,
  },
  featuredBadgeText: { fontFamily: THEME.fontBody, color: COLORS.white, fontSize: 9.5 },
  // minHeight على العنوان والوصف يضمن إن السعر والزرار يفضلوا على نفس
  // الارتفاع بين بطاقة وبطاقة، حتى لو العنوان سطر واحد في بطاقة وسطرين
  // في التانية (نفس مبدأ محاذاة الشبكة في المواصفة).
  featuredTitle: {
    fontFamily: THEME.fontBodySemiBold, fontSize: 13.5, color: THEME.textPrimary,
    marginBottom: 4, lineHeight: 18, minHeight: 36,
  },
  featuredSubtitle: {
    fontFamily: THEME.fontBody, fontSize: 11, color: THEME.textSecondary,
    marginBottom: 6, lineHeight: 15, minHeight: 15,
  },
  featuredPrice: { fontFamily: THEME.fontBodySemiBold, fontSize: 14.5, color: THEME.textPrice, marginBottom: 9 },
  featuredAddBtn: {
    flexDirection: 'row', gap: 5,
    backgroundColor: COLORS.gold, borderRadius: 10, height: 38,
    alignItems: 'center', justifyContent: 'center',
  },
  featuredAddBtnText: { fontFamily: THEME.fontBodySemiBold, color: COLORS.burgundy, fontSize: 12.5 },

  // ملاحظة: بطاقة "القطع الجديدة" بقت تستخدم بالضبط نفس ستايلات
  // "منتجات مميزة" (featuredCard/featuredImageWrap/...) فوق — مفيش
  // ستايل منفصل ليها، عشان تبقى البطاقتان متطابقتين تمامًا زي المطلوب.
  productsStateWrap: { paddingVertical: 30, alignItems: 'center' },
  productsStateText: { fontFamily: THEME.fontBody, color: THEME.textSecondary, fontSize: 13, textAlign: 'center', paddingHorizontal: 20 },

  // شريط المميزات — بدون صندوق ملوّن: أيقونة داخل دائرة فاتحة اللون
  // فوق سطر نص، على خلفية الصفحة مباشرة، زي المرجع (صورة 1).
  featureBarWrap: { paddingHorizontal: 20, marginTop: 6, marginBottom: 8 },
  featureBar: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  featureItem: { flex: 1, alignItems: 'center', justifyContent: 'flex-start', gap: 6 },
  featureIconWrap: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(107,30,46,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  featureItemText: { fontFamily: THEME.fontBody, color: THEME.textPrimary, fontSize: 11, textAlign: 'center' },
  featureDivider: { width: 1, height: 24, backgroundColor: 'rgba(107,30,46,0.14)', alignSelf: 'center', marginTop: 6 },

  // Lookbook
  lookbook: { backgroundColor: COLORS.burgundy, paddingVertical: 40, paddingHorizontal: 20 },
  lookbookHeader: { alignItems: 'center', marginBottom: 22 },
  lookTitle: { fontFamily: THEME.fontHeading, color: COLORS.gold, fontSize: 20, textAlign: 'center' },
  lookItem: {
    height: 140, marginBottom: 14, overflow: 'hidden', borderRadius: 16,
  },
  lookImage: { width: '100%', height: '100%' },
  lookOverlay: {
    ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'flex-end',
    paddingHorizontal: 18, backgroundColor: 'rgba(30,10,14,0.28)',
  },
  lookItemTitle: {
    fontFamily: THEME.fontHeading, color: '#fff', fontSize: 12.5, textAlign: 'right',
  },
  lookSeason: { fontFamily: THEME.fontBody, color: THEME.textSecondary, fontSize: 10, letterSpacing: 1, textAlign: 'right' },
  lookUnderline: { width: 36, height: 2, backgroundColor: COLORS.gold, marginTop: 8 },
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

  // إشعارات: خلفية عنابي (بدل الأبيض المسطّح) مع لمسات دهبية وبيضاء —
  // توزيع ألوان أغنى يتماشى مع هوية البراند، وارتفاع أقل (padding/margin
  // مخفّضين) عشان الكارت يبقى أرشق.
  notifyCard: {
    marginHorizontal: 20, marginTop: 4, marginBottom: 24,
    backgroundColor: COLORS.burgundy, borderRadius: 14, padding: 16,
    alignItems: 'center',
  },
  notifyTitle: { fontFamily: THEME.fontHeading, fontSize: 16, color: COLORS.white, marginBottom: 3, textAlign: 'center' },
  notifyDesc: { fontFamily: THEME.fontBody, fontSize: 11, color: 'rgba(255,255,255,0.75)', textAlign: 'center', marginBottom: 12, lineHeight: 16 },
  notifyRow: { flexDirection: 'row', width: '100%', gap: 8 },
  notifyInput: {
    flex: 1, borderWidth: 1, borderColor: COLORS.gold, backgroundColor: COLORS.white,
    borderRadius: 8, paddingVertical: 9, paddingHorizontal: 14, fontFamily: THEME.fontBody, fontSize: 12.5, textAlign: 'right', color: THEME.textPrimary,
  },
  notifyBtn: { backgroundColor: COLORS.gold, borderRadius: 8, paddingVertical: 9, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center' },
  notifyBtnText: { fontFamily: THEME.fontBodySemiBold, color: COLORS.burgundy, fontSize: 12 },

  // Bottom nav — ارتفاع أقل (68→58) لمظهر أرشق، مع تصغير أيقونة
  // الروبوت بما يتناسب (46→40) عشان تفضل متوازنة بصريًا مع باقي
  // الأيقونات الأصغر جنبها.
  bottomNav: {
    flexDirection: 'row-reverse', height: 56, backgroundColor: THEME.card,
    borderTopWidth: 1, borderTopColor: THEME.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 10,
  },
  bottomNavBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3 },
  bottomNavText: { fontFamily: THEME.fontBody, fontSize: 9.5, color: THEME.textSecondary, letterSpacing: 0.2 },
  bottomNavActive: { color: COLORS.burgundy, fontFamily: THEME.fontBodySemiBold },
  bottomNavIndicator: { width: 16, height: 2, borderRadius: 1, backgroundColor: COLORS.burgundy, marginTop: 1 },

  // زر المستشار العائم — فوق الشريط السفلي بمسافة فاصلة واضحة، من
  // الجهة اليسرى للشاشة، بغض النظر عن اتجاه RTL (left ثابتة قصدًا).
  // خصائص التموضع (absolute/bottom/left) لازم تكون على العنصر الخارجي
  // (floatingBotAnchor) مش على الزر نفسه، لأن الزر بقى متلفوف جوه
  // Animated.View بدون ستايل تموضع — لو الـ absolute فضلت على الزر
  // جوه، الـ View الملفوف حواليه بيبقى سياق تموضع جديد والزر بيتحرك
  // من مكانه الثابت المفروض.
  floatingBotAnchor: {
    position: 'absolute',
    bottom: 70,
    left: 14,
  },
  floatingBot: {
    width: 54, height: 54, borderRadius: 27,
    backgroundColor: THEME.card,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.18, shadowRadius: 8, elevation: 10,
  },
  floatingBotImage: { width: 54, height: 54 },
});
