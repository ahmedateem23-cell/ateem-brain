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
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFonts, PlayfairDisplay_700Bold, PlayfairDisplay_600SemiBold } from '@expo-google-fonts/playfair-display';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';
import ChatOverlay from './ChatOverlay';
import { COLORS } from './colors';
import { THEME } from './theme';

// فرض اتجاه RTL للتطبيق بالكامل
I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

const { width } = Dimensions.get('window');

// ---------- الاتصال بالمتجر الحقيقي عبر الـ Worker ----------
const ATEEM_PROXY_URL = 'https://ateem-proxy.ahmedatim23.workers.dev/';

// أقصى عدد منتجات يُعرض في قسم "القطع الجديدة" بالصفحة الرئيسية —
// باقي منتجات المتجر بيوصلها العميل من "عرض الكل" أو تبويب "المتجر"،
// مش من الصفحة الرئيسية عشان تفضل خفيفة ومركّزة.
const NEW_ARRIVALS_LIMIT = 6;

const CATEGORIES = [
  { id: 'women', title: 'نساء', cta: 'اكتشفي المزيد', img: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=500&q=80' },
  { id: 'men', title: 'رجال', cta: 'اكتشف المزيد', img: 'https://images.unsplash.com/photo-1617137968427-85924c800a22?w=500&q=80' },
  { id: 'accessories', title: 'إكسسوارات', cta: 'اكتشف المزيد', img: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=500&q=80' },
  { id: 'jewelry', title: 'مجوهرات', cta: 'اكتشف المزيد', img: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=500&q=80' },
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

const Icon = ({ children, size = 24, color = COLORS.charcoal }) => (
  <Text style={{ fontSize: size, color }}>{children}</Text>
);

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
          <Icon size={26}>☰</Icon>
        </TouchableOpacity>

        <View style={styles.brandWrap}>
          <Text style={styles.brand}>ATEEM</Text>
          <Text style={styles.tagline}>SUDAN · MODERN LUXURY</Text>
        </View>

        <TouchableOpacity style={styles.iconBtn}>
          <Icon size={26}>🛍️</Icon>
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
        <View style={styles.hero}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=900&q=80' }}
            style={styles.heroImage}
          />
          <View style={styles.floatingCard}>
            <Text style={styles.floatingLabel}>القطعة المميزة</Text>
            <Text style={styles.floatingTitle}>حقيبة ظهر جلدية فاخرة</Text>
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
              اكتشف تشكيلتنا الجديدة التي تجمع بين الحرفية الدقيقة والروح العصرية.
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
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionLabel}>وصل حديثاً</Text>
              <Text style={styles.sectionTitle}>القطع الجديدة</Text>
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
            <View style={styles.productsGrid}>
              {newArrivals.map((p) => (
                <TouchableOpacity key={p.id} style={styles.productCard}>
                  <View style={styles.productImageWrap}>
                    <Image source={{ uri: p.image }} style={styles.productImage} />
                    {p.badge && (
                      <View style={[styles.productBadge, p.isBestSeller && styles.productBadgeGold]}>
                        <Text style={styles.productBadgeText}>{p.badge}</Text>
                      </View>
                    )}
                    <TouchableOpacity style={styles.addToCartBtn}>
                      <Icon size={16}>+</Icon>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.productName}>{p.name}</Text>
                  <Text style={styles.productPrice}>{fmtOdooPrice(p)}</Text>
                </TouchableOpacity>
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
          <Text style={styles.notifyIcon}>🔔</Text>
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

      {/* ===== Bottom Nav الجديد ===== */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.bottomNavBtn}>
          <Icon size={24} color={COLORS.gold}>🏠</Icon>
          <Text style={[styles.bottomNavText, styles.bottomNavActive]}>الرئيسية</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.bottomNavBtn}>
          <Icon size={24}>🔍</Icon>
          <Text style={styles.bottomNavText}>بحث</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.bottomNavBtn}>
          <Icon size={24}>🛒</Icon>
          <Text style={styles.bottomNavText}>المتجر</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.bottomNavBtn} onPress={() => setChatOpen(true)}>
          <View style={styles.bottomNavBotIconWrap}>
            <Image source={require('./assets/bot-avatar.png')} style={styles.bottomNavBotIcon} resizeMode="cover" />
          </View>
          <Text style={styles.bottomNavText}>المستشار</Text>
        </TouchableOpacity>
      </View>

      <ChatOverlay
        visible={chatOpen}
        onClose={() => setChatOpen(false)}
        products={products}
      />
    </SafeAreaView>
  );
}

const CARD_GAP = 12;
const CARD_W = (width - 24 * 2 - CARD_GAP) / 2;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: THEME.background },
  scrollContent: { paddingBottom: 24 },

  // Navbar — ارتفاع مُصغّر شوية (paddingVertical 16 → 12) عشان الهيدر
  // ما ياخدش مساحة زيادة عن اللازم فوق الشاشة.
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: THEME.background,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
  },
  iconBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  brandWrap: { alignItems: 'center' },
  brand: { fontFamily: THEME.fontHeading, fontSize: 24, letterSpacing: 3, color: COLORS.burgundy },
  tagline: { fontFamily: THEME.fontBody, fontSize: 8, letterSpacing: 2, color: COLORS.gold, marginTop: 3 },
  cartBadge: {
    position: 'absolute', top: 2, left: 2, backgroundColor: COLORS.burgundy,
    width: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center',
  },
  cartBadgeText: { color: COLORS.white, fontSize: 9, fontFamily: THEME.fontBody },

  // Mobile menu
  menuOverlay: { flex: 1, backgroundColor: 'rgba(26,26,26,0.4)' },
  menuPanel: {
    marginTop: 90, alignSelf: 'center', width: '72%', backgroundColor: THEME.card,
    borderRadius: 12, paddingVertical: 10, paddingHorizontal: 22,
  },
  menuLinkRow: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: THEME.border },
  menuLinkText: { fontFamily: THEME.fontBody, fontSize: 16, color: THEME.textPrimary },

  // Hero — الارتفاع اتقلّل من 380 لـ 300 عشان البانر يبقى متناسق مع
  // باقي السكشنز، مش مسيطر على الشاشة الأولى بالكامل.
  hero: { paddingBottom: 10 },
  heroImage: { width: '100%', height: 300 },
  floatingCard: {
    position: 'absolute', top: 260, left: 20, backgroundColor: THEME.card,
    padding: 16, maxWidth: 200, borderRadius: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 10, elevation: 4,
  },
  floatingLabel: { fontFamily: THEME.fontBody, fontSize: 9, letterSpacing: 1.5, color: COLORS.gold, textTransform: 'uppercase', marginBottom: 4 },
  floatingTitle: { fontFamily: THEME.fontHeading, fontSize: 15, color: THEME.textPrimary, marginBottom: 3 },
  floatingPrice: { fontFamily: THEME.fontBody, fontSize: 13, color: THEME.textPrice, marginBottom: 8 },
  floatingAdd: { fontFamily: THEME.fontBody, fontSize: 10, letterSpacing: 1, color: COLORS.gold, textDecorationLine: 'underline' },

  heroText: { paddingHorizontal: 24, paddingTop: 28 },
  heroLabelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  heroLine: { width: 32, height: 1, backgroundColor: COLORS.gold, marginLeft: 10 },
  heroLabel: { fontFamily: THEME.fontBody, color: COLORS.gold, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase' },
  heroTitle: { fontFamily: THEME.fontHeading, fontSize: 42, lineHeight: 48, color: THEME.textPrimary, marginBottom: 16 },
  heroTitleItalic: { fontStyle: 'italic', color: COLORS.burgundy },
  heroDesc: { fontFamily: THEME.fontBody, color: THEME.textSecondary, fontSize: 15, lineHeight: 24, marginBottom: 24 },
  heroButtons: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  btnPrimary: { backgroundColor: COLORS.burgundy, paddingVertical: 14, paddingHorizontal: 28 },
  btnPrimaryText: { fontFamily: THEME.fontBody, color: COLORS.white, fontSize: 12, letterSpacing: 1.5, textTransform: 'uppercase' },
  btnText: { fontFamily: THEME.fontBody, color: COLORS.gold, fontSize: 12, letterSpacing: 1, textDecorationLine: 'underline' },

  // Sections
  section: { paddingHorizontal: 20, paddingVertical: 36 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 },
  sectionLabel: { fontFamily: THEME.fontBody, color: COLORS.gold, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 },
  sectionTitle: { fontFamily: THEME.fontHeading, fontSize: 26, color: THEME.textPrimary },
  viewAll: { fontFamily: THEME.fontBody, color: COLORS.gold, fontSize: 12, letterSpacing: 1 },

  // Categories
  categoriesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: CARD_GAP, justifyContent: 'space-between' },
  categoryCard: { width: CARD_W, height: CARD_W * 1.3, overflow: 'hidden', marginBottom: CARD_GAP, borderRadius: 4 },
  categoryImage: { width: '100%', height: '100%' },
  categoryOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(107,30,46,0.35)' },
  categoryContent: { position: 'absolute', bottom: 14, right: 14, left: 14 },
  categoryTitle: { fontFamily: THEME.fontHeading, fontSize: 20, color: '#fff', marginBottom: 4 },
  categoryCta: { fontFamily: THEME.fontBody, fontSize: 10, letterSpacing: 1.5, color: 'rgba(255,255,255,0.9)' },

  // Products
  productsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: CARD_GAP, justifyContent: 'space-between' },
  productCard: { width: CARD_W, marginBottom: 20, backgroundColor: THEME.card, borderRadius: 8, padding: 8 },
  productImageWrap: { width: '100%', height: CARD_W * 1.2, backgroundColor: THEME.background, marginBottom: 10, position: 'relative', borderRadius: 6, overflow: 'hidden' },
  productImage: { width: '100%', height: '100%' },
  productBadge: {
    position: 'absolute', top: 10, right: 10, backgroundColor: COLORS.burgundy,
    paddingVertical: 4, paddingHorizontal: 8,
  },
  productBadgeGold: { backgroundColor: COLORS.gold },
  productBadgeText: { fontFamily: THEME.fontBody, color: COLORS.white, fontSize: 9, letterSpacing: 1 },
  addToCartBtn: {
    position: 'absolute', bottom: 10, left: 10, width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.95)', alignItems: 'center', justifyContent: 'center',
  },
  productName: { fontFamily: THEME.fontBody, fontSize: 14, color: THEME.textPrimary, marginBottom: 3 },
  productPrice: { fontFamily: THEME.fontBody, fontSize: 13, color: THEME.textPrice },
  productsStateWrap: { paddingVertical: 30, alignItems: 'center' },
  productsStateText: { fontFamily: THEME.fontBody, color: THEME.textSecondary, fontSize: 13, textAlign: 'center', paddingHorizontal: 20 },

  // Lookbook (فوتوغرافي، بيسيب overlay غامق للوضوح فوق الصور)
  lookbook: { backgroundColor: COLORS.charcoal, paddingVertical: 50, paddingHorizontal: 20 },
  lookbookHeader: { alignItems: 'center', marginBottom: 30 },
  lookLabel: { fontFamily: THEME.fontBody, color: COLORS.gold, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 },
  lookTitle: { fontFamily: THEME.fontHeading, color: COLORS.white, fontSize: 28, marginBottom: 8 },
  lookSubtitle: { fontFamily: THEME.fontBody, color: COLORS.gold, fontSize: 13 },
  lookItem: { height: 220, marginBottom: 14, overflow: 'hidden', borderRadius: 4 },
  lookImage: { width: '100%', height: '100%' },
  lookOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0, top: 0, justifyContent: 'flex-end',
    padding: 18, backgroundColor: 'rgba(107,30,46,0.35)',
  },
  lookNumber: { position: 'absolute', top: 10, right: 16, fontFamily: THEME.fontHeading, fontSize: 40, color: 'rgba(245,239,230,0.2)' },
  lookItemTitle: { fontFamily: THEME.fontHeading, color: '#fff', fontSize: 18, marginBottom: 4 },
  lookSeason: { fontFamily: THEME.fontBody, color: COLORS.gold, fontSize: 10, letterSpacing: 1.5 },
  lookFooterBtn: {
    alignSelf: 'center', marginTop: 20, paddingVertical: 14, paddingHorizontal: 36,
    borderWidth: 1, borderColor: 'rgba(245,239,230,0.4)',
  },
  lookFooterBtnText: { fontFamily: THEME.fontBody, color: COLORS.white, fontSize: 12, letterSpacing: 1.5 },

  // Craftsmanship
  craft: { paddingHorizontal: 20, paddingVertical: 50 },
  craftImageWrap: { position: 'relative', marginBottom: 40 },
  craftImage: { width: '100%', height: 320, borderRadius: 4 },
  craftStat: { position: 'absolute', bottom: -20, left: 10, backgroundColor: COLORS.burgundy, padding: 20 },
  craftStatNumber: { fontFamily: THEME.fontHeading, color: COLORS.white, fontSize: 36 },
  craftStatDesc: { fontFamily: THEME.fontBody, color: COLORS.gold, fontSize: 10, letterSpacing: 1, marginTop: 6, lineHeight: 16 },
  craftContent: {},
  craftHeading: { fontFamily: THEME.fontHeading, fontSize: 26, color: THEME.textPrimary, lineHeight: 34, marginBottom: 16, marginTop: 8 },
  craftParagraph: { fontFamily: THEME.fontBody, color: THEME.textSecondary, lineHeight: 24, marginBottom: 12 },
  craftLink: { fontFamily: THEME.fontBody, color: COLORS.burgundy, fontSize: 12, letterSpacing: 1.5, marginTop: 10, textDecorationLine: 'underline' },

  // Editorial
  editorial: { height: 320, position: 'relative' },
  editorialImage: { width: '100%', height: '100%' },
  editorialOverlay: {
    ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(107,30,46,0.5)',
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30,
  },
  editorialLabel: { fontFamily: THEME.fontBody, color: COLORS.gold, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 16 },
  editorialTitle: { fontFamily: THEME.fontHeading, color: '#fff', fontSize: 30, textAlign: 'center', lineHeight: 38, marginBottom: 20 },
  editorialBtn: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.7)', paddingVertical: 14, paddingHorizontal: 32 },
  editorialBtnText: { fontFamily: THEME.fontBody, color: '#fff', fontSize: 12, letterSpacing: 1.5 },

  // Trust
  trustGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  trustItem: { width: '48%', alignItems: 'center', marginBottom: 24 },
  trustTitle: { fontFamily: THEME.fontHeading, fontSize: 15, color: THEME.textPrimary, marginBottom: 4 },
  trustDesc: { fontFamily: THEME.fontBody, fontSize: 10, color: COLORS.gold, letterSpacing: 1, textAlign: 'center' },

  // إشعارات (تنظيم وحجم أصغر، خلفية عاجية موحّدة)
  notifyCard: {
    marginHorizontal: 20, marginTop: 10, marginBottom: 30,
    backgroundColor: THEME.card, borderRadius: 12, padding: 20,
    alignItems: 'center', borderWidth: 1, borderColor: THEME.border,
  },
  notifyIcon: { fontSize: 22, marginBottom: 6 },
  notifyTitle: { fontFamily: THEME.fontHeading, fontSize: 17, color: THEME.textPrimary, marginBottom: 4, textAlign: 'center' },
  notifyDesc: { fontFamily: THEME.fontBody, fontSize: 11.5, color: THEME.textSecondary, textAlign: 'center', marginBottom: 14, lineHeight: 17 },
  notifyRow: { flexDirection: 'row', width: '100%', gap: 8 },
  notifyInput: {
    flex: 1, borderWidth: 1, borderColor: THEME.border, backgroundColor: THEME.background,
    borderRadius: 8, paddingVertical: 10, paddingHorizontal: 14, fontFamily: THEME.fontBody, fontSize: 12.5, textAlign: 'right', color: THEME.textPrimary,
  },
  notifyBtn: { backgroundColor: COLORS.gold, borderRadius: 8, paddingVertical: 10, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center' },
  notifyBtnText: { fontFamily: THEME.fontBody, color: COLORS.burgundy, fontSize: 12, fontWeight: '600' },

  // Bottom nav — flexDirection صريح 'row-reverse' بدل ما نعتمد على مرآة
  // I18nManager التلقائية للـ 'row': forceRTL(true) محتاج إعادة تحميل
  // كاملة للتطبيق (native reload) عشان يتفعّل فعليًا، وده مش مضمون كل
  // مرة في Expo Go. الـ row-reverse بيضمن نفس الترتيب البصري المطلوب
  // (الرئيسية يمين، المستشار يسار) بغض النظر عن حالة الـ RTL native.
  bottomNav: {
    flexDirection: 'row-reverse', height: 68, backgroundColor: THEME.card,
    borderTopWidth: 1, borderTopColor: THEME.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 10,
  },
  bottomNavBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
  bottomNavText: { fontFamily: THEME.fontBody, fontSize: 10, color: THEME.textSecondary, letterSpacing: 0.3 },
  bottomNavActive: { color: COLORS.gold, fontWeight: '600' },
  // شعار الروبوت في البار السفلي: كبّرناه (30 → 36) وحطّيناه جوه دائرة
  // بخلفية وبرواز ذهبي خفيف — نفس مبدأ التباين اللي طبّقناه في هيدر
  // الشات، عشان يبان بوضوح وجودة أعلى بدل ما يفضل نقطة صغيرة باهتة.
  bottomNavBotIconWrap: {
    width: 36, height: 36, borderRadius: 18,
    borderWidth: 1.2, borderColor: COLORS.gold,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
    backgroundColor: THEME.background,
  },
  bottomNavBotIcon: { width: 36, height: 36 },
});
