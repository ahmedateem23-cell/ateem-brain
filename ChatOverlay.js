import React, { useState, useRef, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Linking,
  KeyboardAvoidingView,
  Platform,
  Animated,
  PermissionsAndroid,
  Alert,
} from 'react-native';
import { Audio } from 'expo-av';
import Voice from '@react-native-voice/voice';
import * as Notifications from 'expo-notifications';
import { COLORS } from './colors';
/* ═══ ATEEM Concierge — نسخة React Native من chat.html ═══
   نفس الشخصية، نفس منطق الطلب الحقيقي عبر Odoo، نفس الـ Worker proxy.
   بدون واجهة WebView خالص — عناصر RN أصلية (Modal/ScrollView/TextInput).

   الآن فيه تسجيل صوتي (@react-native-voice/voice) وقراءة الردود
   بصوت عالٍ (ElevenLabs TTS عبر الـ Worker + expo-av للتشغيل).

   لسه ناقص عن قصد:
   - إشعار Push وقت تأكيد الطلب (fcmToken) — يحتاج expo-notifications
     مع إعداد Firebase؛ ملف google-services.json وصل، بس السلك لسه
     مش موصول (getNativeFcmToken() تحت بترجع null لحد ما نفعّله). */

const ATEEM_PROXY_URL = 'https://ateem-proxy.ahmedatim23.workers.dev/';
const GROQ_MODEL = 'openai/gpt-oss-120b';
// ⚠️ افتراض: الـ Worker فيه مسار /tts بياخد { text } ويرجّع صوت MP3 خام
// (زي ما بيحصل في chat.html الأصلي عبر ElevenLabs). لو المسار الفعلي
// مختلف عندك في الـ Worker، بدّل القيمة دي بس ومفيش حاجة تانية تتغيّر.
const ATEEM_TTS_PATH = 'tts';

const ATEEM_POLICY_TEXT = `
سياسات متجر ATEEM:
- التوصيل: داخل المدن الرئيسية 2-4 أيام عمل، وباقي المناطق 4-7 أيام عمل.
- الاستبدال: خلال 14 يومًا من تاريخ الاستلام بشرط الحالة الأصلية مع الفاتورة.
- الترجيع: خلال 7 أيام من الاستلام للمنتجات غير المستخدمة.
`;

const WELCOME_TEXT = '✦ أهلاً بك في ATEEM ✦\nأنا مستشارك الشخصي هنا، بأقدر أساعدك بشنو؟';
const QUICK_REPLIES = ['أحدث المنتجات', 'عطور فاخرة', 'إطلالة نسائية', 'سياسة التوصيل'];

function nowTime() {
  return new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
}

function fmtPrice(p) {
  return (Number(p.price) || 0).toLocaleString('en-US') + ' ' + (p.currency || 'SDG');
}

function slugFallbackUrl(name) {
  return 'https://ateem-store.odoo.com/shop?search=' + encodeURIComponent(name || '');
}

/* بيطبّع شكل المنتج القادم من /odoo-products لنفس الشكل اللي كان
   البرومبت والبطاقات في chat.html بتستخدمه. */
function normalizeProduct(p) {
  return {
    id: String(p.id),
    name: p.name || '',
    category: (Array.isArray(p.category) ? p.category[1] : p.category) || 'عام',
    price: Number(p.price) || 0,
    currency: 'SDG',
    description: p.description || '',
    img: p.image || '',
    url: slugFallbackUrl(p.name),
  };
}

function describeVariants(p) {
  if (!p.description) return '';
  const text = String(p.description).replace(/<[^>]+>/g, ' ').replace(/\s{2,}/g, ' ').trim();
  if (!text) return '';
  return 'الوصف: ' + text.slice(0, 220);
}

function buildSystemPrompt(products) {
  const productLines = products
    .map((p) => {
      const variants = describeVariants(p);
      return `- [${p.id}] ${p.name} | الفئة: ${p.category} | السعر: ${fmtPrice(p)}${variants ? ' | ' + variants : ''}`;
    })
    .join('\n');

  return `أنت "ATEEM Concierge" — المستشار الشخصي لعملاء براند ATEEM للملابس الفاخرة، وهو براند مختلط يخدم الرجال والنساء والفتيات بنفس القدر من الاهتمام.
مهمتك ليست خدمة عملاء عادية — مهمتك تقديم تجربة شخصية راقية، وكأن لكل عميل خيّاطه الشخصي في تليفونه.

الشخصية والأسلوب:
- راقٍ، واثق، مختصر، دافئ. جملك قصيرة وأنيقة — لا تتجاوز عادةً 3-4 أسطر.
- فصحى راقية ممزوجة بلمسة سودانية خفيفة طبيعية، بلا تكلّف.
- استخدمي رمز 💎 مرة واحدة فقط في كامل المحادثة — راجعي الرسائل السابقة في السياق، وإن كنتِ استخدمتيه من قبل في هذه المحادثة فلا تكرريه أبداً.
- ممنوع تماماً عبارات مثل "يا فندم" أو "تمت العملية بنجاح" أو أي صياغة جافة رسمية. بدلاً من "تم إضافة المنتج للسلة" قولي مثلاً "تم، أضفت ليك القميص الأسود مقاس M للسلة 💎".
- عدّلي لطفك حسب سياق الحديث: مع سيدة أو فتاة كوني ألطف وأكثر رقّة في اختيار الكلمات، ومع رجل التزمي برقي مباشر ودافئ. لا تفترضي جنس العميل إلا إذا اتضح من كلامه.
- الهدوء والثقة سمة العلامة — بلا علامات تعجب كثيرة وبلا لغة تسويقية صاخبة.

قائمة المنتجات المتوفرة حالياً في المتجر (تُقرأ تلقائياً من مخزون ATEEM الفعلي عبر Odoo، ولا تحتوي إلا على المنتجات الظاهرة والمتاحة الآن):
${productLines || '(تعذّر تحميل القائمة الآن — إن سُئلت عن منتج معيّن، اعتذري بلطف واقترحي على العميل المحاولة خلال قليل أو تصفّح المتجر مباشرة)'}
${ATEEM_POLICY_TEXT}

تعليمات الترشيح والاقتراح:
- رشّحي دائماً من هذه القائمة فقط، ولا تخترعي أبداً منتجاً أو مقاساً أو لوناً أو سعراً غير مذكور فيها — فرّقي بدقة بين المقاس والسعر واللون كما وردت بالضبط.
- عندما يذكر العميل مناسبة أو لوناً أو ذوقاً معيّناً، رشّحي 3 منتجات كحد أقصى في الرسالة الواحدة، لا أكثر — الجودة لا الكمية.
- عند ترشيح منتج اذكري رمزه [id] بين أقواس مربعة ليظهر تلقائياً كبطاقة أنيقة بصورته وسعره ورابط شرائه داخل المحادثة.
- تنسيق اللبس: إذا كان لدى العميل منتج معيّن، اقترحي معه قطعة مكمّلة موجودة فعلياً في القائمة أعلاه بذكر اسمها (مثال: "القميص ده بيمشي معاه بنطلون [اسم المنتج الفعلي من القائمة]") — لا تخترعي أرقام منتجات غير موجودة.
- إذا سأل العميل عن مقاس أو لون منتج معيّن ولم يكن مذكوراً أمامه في القائمة، أخبريه بلطف أنك ستتأكدين له بدل تخمين الإجابة.
- افهمي احتياج العميل أولاً (المناسبة، الذوق، الميزانية) قبل أن تقترحي، بدلاً من عرض كل شيء دفعة واحدة.
- إن لم تعرفي إجابة سؤال معيّن بثقة، لا تخمّني — قولي بالضبط: "لحظة بوصلِك مع مستشار ATEEM شخصي عشان نساعدك أفضل".

تعليمات إتمام الطلب والدفع:
- إذا أبدى العميل رغبته الجدية بالشراء، اجمعي منه بأسلوب محادثة طبيعي ومختصر، على مراحل قصيرة لا دفعة واحدة: الاسم الكامل، المنتج المطلوب (مع المقاس واللون إن وُجدا ضمن خيارات المنتج)، العنوان الكامل، رقم الهاتف، وطريقة الدفع المفضّلة (تحويل بنكي / فوري / الدفع عند الاستلام).
- بمجرد اكتمال كل البيانات وتأكيد العميل النهائي على الطلب، أرسلي رسالة تأكيد قصيرة وراقية بأسلوبك الخاص (بدون عبارات جافة)، ثم أضيفي في نهاية نفس الرسالة (بعدها مباشرة، بدون أي نص إضافي بعده) وسماً مخفياً بهذا الشكل بالضبط:
[ORDER_JSON]{"name":"...","product_id":"...","product":"...","size":"...","color":"...","address":"...","phone":"...","payment_method":"..."}[/ORDER_JSON]
- قيمة product_id يجب أن تكون رقم المنتج [id] بالضبط كما ورد في قائمة المنتجات أعلاه (نفس الرقم اللي بين الأقواس المربعة) — لا تكتبي اسم المنتج فيه، هذا الحقل رقمي فقط.
- قيمة payment_method يجب أن تكون واحدة بالضبط من: "bankak" (تحويل بنكك) أو "fawry" (فوري) أو "cod" (عند الاستلام). استخدمي "" لأي حقل غير متوفر (كاللون/المقاس إن لم يذكره العميل أو لم يكن للمنتج). لا تُرسلي هذا الوسم إلا مرة واحدة لكل طلب مكتمل ومؤكد فعلياً من العميل.

القواعد الذهبية:
- ممنوع إرسال "عروض عامة" أو صياغات موجّهة للجميع — كل اقتراح يجب أن يبدو مبنياً على ما قاله هذا العميل تحديداً في هذه المحادثة.
- تذكّري خلال هذه المحادثة نفسها كل ما يذكره العميل عن اسمه، مقاسه المفضل، الألوان التي يميل لها، وآخر منتج تحدثتما عنه، واستخدمي ذلك بشكل طبيعي في بقية الرد دون تكراره حرفياً.`;
}

function extractOrderJson(text) {
  const match = text.match(/\[ORDER_JSON\]([\s\S]*?)\[\/ORDER_JSON\]/);
  if (!match) return { displayText: text, orderData: null };
  let orderData = null;
  try { orderData = JSON.parse(match[1]); } catch (e) { orderData = null; }
  const displayText = text.replace(match[0], '').trim();
  return { displayText, orderData };
}

function extractProductIds(text, products) {
  const idsFound = [];
  const cleanText = text
    .replace(/\[([a-z0-9-]+)\]/gi, (m, id) => {
      if (products.find((p) => p.id === id)) idsFound.push(id);
      return '';
    })
    .replace(/\s{2,}/g, ' ')
    .trim();
  return { cleanText, ids: [...new Set(idsFound)].slice(0, 3) };
}

async function fetchProductDetail(productId) {
  const resp = await fetch(ATEEM_PROXY_URL + 'odoo-product-detail?id=' + encodeURIComponent(productId));
  const data = await resp.json();
  if (!data.ok) throw new Error(data.error || 'product detail failed');
  return data.product;
}

function matchOrderVariant(product, size, color) {
  if (!product.variants || !product.variants.length) return null;
  if (product.variants.length === 1) return product.variants[0];
  const norm = (s) => String(s || '').trim().toLowerCase();
  const wantedSize = norm(size);
  const wantedColor = norm(color);
  const candidates = product.variants.filter((v) => {
    const values = Object.values(v.values || {}).map(norm);
    const sizeOk = !wantedSize || values.includes(wantedSize);
    const colorOk = !wantedColor || values.includes(wantedColor);
    return sizeOk && colorOk;
  });
  return candidates.length ? candidates[0] : null;
}

// بيطلب صلاحية الإشعارات (لو لسه ملهاش رد) وبيرجّع توكن FCM الحقيقي
// للجهاز — بيتنادى بس وقت تأكيد طلب فعلي (مش عند فتح التطبيق ولا فتح
// الشات)، عشان العميل ميتفاجئش بطلب صلاحية قبل ما يحتاجها فعلاً.
async function getNativeFcmToken() {
  try {
    const existing = await Notifications.getPermissionsAsync();
    let finalStatus = existing.status;
    if (finalStatus !== 'granted') {
      const requested = await Notifications.requestPermissionsAsync();
      finalStatus = requested.status;
    }
    if (finalStatus !== 'granted') return null;

    const tokenData = await Notifications.getDevicePushTokenAsync();
    return tokenData?.data || null;
  } catch (e) {
    console.warn('ATEEM: تعذّر الحصول على توكن الإشعارات (تأكد من تركيب expo-notifications وربط google-services.json):', e);
    return null;
  }
}

async function sendFallbackTelegramNotification(order) {
  try {
    await fetch(ATEEM_PROXY_URL + 'telegram-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order),
    });
  } catch (e) {
    console.warn('Fallback telegram-order notification failed:', e);
  }
}

async function submitOdooOrder(order) {
  try {
    if (!order.product_id) throw new Error('product_id missing from ORDER_JSON');
    const product = await fetchProductDetail(order.product_id);
    const variant = matchOrderVariant(product, order.size, order.color);
    if (!variant) throw new Error('no matching variant for the requested size/color');
    if (variant.stock !== null && variant.stock !== undefined && variant.stock <= 0) {
      throw new Error('selected variant is out of stock');
    }
    const meta = [order.size, order.color].filter(Boolean).join(' / ');
    const fcmToken = await getNativeFcmToken();

    const resp = await fetch(ATEEM_PROXY_URL + 'odoo-create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer: { name: order.name, phone: order.phone, address: order.address },
        items: [{ sku: variant.id, qty: 1, price: variant.price, name: product.name, meta }],
        paymentMethod: order.payment_method,
        fcmToken,
      }),
    });
    const data = await resp.json();
    if (!data.ok) throw new Error(data.error || 'order creation failed');

    if (fcmToken && order.phone) {
      fetch(ATEEM_PROXY_URL + 'register-device', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: order.phone, fcmToken }),
      }).catch(() => {});
    }
    return data;
  } catch (e) {
    console.warn('ATEEM: real Odoo order failed, falling back to raw notification:', e);
    await sendFallbackTelegramNotification(order);
    return null;
  }
}

let msgIdCounter = 0;
function nextMsgId() {
  msgIdCounter += 1;
  return 'm' + msgIdCounter;
}

/* يحوّل صوت الرد (MP3 من الـ Worker) لـ data URI عشان expo-av
   يقدر يشغّله مباشرة من غير ما نكتب ملف مؤقت على الجهاز. */
function blobToDataUri(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function fetchTtsAudio(text) {
  const resp = await fetch(ATEEM_PROXY_URL + ATEEM_TTS_PATH, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, language: 'ar', voice_settings: { language_code: 'ar' } }),
  });
  if (!resp.ok) throw new Error('TTS request failed: ' + resp.status);
  const blob = await resp.blob();
  return blobToDataUri(blob);
}

export default function ChatOverlay({ visible, onClose, products }) {
  const normalizedProducts = (products || []).map(normalizeProduct);

  const [messages, setMessages] = useState([
    { id: nextMsgId(), role: 'bot', text: WELCOME_TEXT, time: nowTime(), productIds: [] },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const conversationHistory = useRef([]);
  const scrollRef = useRef(null);

  // ===== قراءة الردود بصوت (TTS) =====
  const soundRef = useRef(null);
  const [playingId, setPlayingId] = useState(null); // id الرسالة اللي بتتشغّل دلوقتي
  const [loadingTtsId, setLoadingTtsId] = useState(null); // id الرسالة اللي بيتجهّز صوتها
  const [autoRead, setAutoRead] = useState(false); // قراءة كل رد جديد تلقائياً

  // ===== التسجيل الصوتي (STT) =====
  const [isRecording, setIsRecording] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(true);
  const recognizedTextRef = useRef('');
  const micPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 150);
    }
  }, [visible]);

  // إعداد وضع الصوت مرة واحدة (يسمح بالتشغيل حتى لو الجهاز على صامت)
  useEffect(() => {
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    }).catch(() => {});
  }, []);

  // مستمعو مكتبة التعرّف على الصوت
  useEffect(() => {
    Voice.onSpeechStart = () => setIsRecording(true);
    Voice.onSpeechPartialResults = (e) => {
      const text = e.value && e.value[0];
      if (text) setInput(text);
    };
    Voice.onSpeechResults = (e) => {
      const text = e.value && e.value[0];
      if (text) {
        recognizedTextRef.current = text;
        setInput(text);
      }
    };
    Voice.onSpeechEnd = () => {
      setIsRecording(false);
      const finalText = recognizedTextRef.current.trim();
      recognizedTextRef.current = '';
      if (finalText) {
        setTimeout(() => handleSend(finalText), 200);
      }
    };
    Voice.onSpeechError = (e) => {
      setIsRecording(false);
      recognizedTextRef.current = '';
      console.warn('ATEEM voice recognition error:', e?.error);
    };

    return () => {
      Voice.destroy().then(Voice.removeAllListeners).catch(() => {});
      soundRef.current?.unloadAsync().catch(() => {});
    };
  }, []);

  // نبضة بصرية بسيطة على زر الميكروفون أثناء التسجيل
  useEffect(() => {
    if (!isRecording) {
      micPulse.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(micPulse, { toValue: 1.25, duration: 500, useNativeDriver: true }),
        Animated.timing(micPulse, { toValue: 1, duration: 500, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [isRecording]);

  // بيطلب صلاحية الميكروفون بس أول ما العميل يدوس على زرار المايك —
  // مفيش أي طلب صلاحية عند فتح التطبيق ولا فتح الشات. لو رفض، بنوريه
  // رسالة لطيفة بدل ما نفشل بصمت.
  async function ensureMicPermission() {
    if (Platform.OS === 'android') {
      try {
        const already = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
        if (already) return true;
        const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO, {
          title: 'إذن استخدام الميكروفون',
          message: 'يحتاج ATEEM الوصول لميكروفونك عشان يسمعك ويرد عليك بالكلام.',
          buttonPositive: 'سماح',
          buttonNegative: 'إلغاء',
        });
        return result === PermissionsAndroid.RESULTS.GRANTED;
      } catch (e) {
        return false;
      }
    }
    // iOS: نافذة النظام بتتحكم فيها نصوص Info.plist (تحت)، وبتظهر بس
    // لما نستدعي الدالة دي، يعني بالظبط لحظة الدوس على المايك.
    try {
      const { status } = await Audio.requestPermissionsAsync();
      return status === 'granted';
    } catch (e) {
      return false;
    }
  }

  async function toggleRecording() {
    if (isRecording) {
      try { await Voice.stop(); } catch (e) { /* ignore */ }
      setIsRecording(false);
      return;
    }
    const granted = await ensureMicPermission();
    if (!granted) {
      Alert.alert(
        'الميكروفون غير مفعّل',
        'فعّل صلاحية الميكروفون لـ ATEEM من إعدادات جهازك عشان تقدر تستخدم التسجيل الصوتي.'
      );
      return;
    }
    try {
      setInput('');
      recognizedTextRef.current = '';
      await Voice.start('ar-SA');
    } catch (e) {
      setVoiceSupported(false);
      console.warn('ATEEM: تعذّر بدء التسجيل الصوتي (تأكد من تركيب @react-native-voice/voice):', e);
    }
  }

  async function playTTS(id, text) {
    if (!text) return;
    // لو نفس الرسالة بتتشغّل حالياً، الزرار يوقفها بدل ما يعيد تشغيلها
    if (playingId === id) {
      try { await soundRef.current?.stopAsync(); } catch (e) { /* ignore */ }
      setPlayingId(null);
      return;
    }
    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync().catch(() => {});
        soundRef.current = null;
      }
      setLoadingTtsId(id);
      const dataUri = await fetchTtsAudio(text);
      const { sound } = await Audio.Sound.createAsync({ uri: dataUri }, { shouldPlay: true });
      soundRef.current = sound;
      setLoadingTtsId(null);
      setPlayingId(id);
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish || status.error) setPlayingId(null);
      });
    } catch (e) {
      setLoadingTtsId(null);
      setPlayingId(null);
      console.warn('ATEEM: تعذّر تشغيل قراءة الرد بصوت:', e);
    }
  }

  async function askGroq(userMessage) {
    conversationHistory.current.push({ role: 'user', content: userMessage });
    const MAX_HISTORY = 8;
    const trimmedHistory = conversationHistory.current.slice(-MAX_HISTORY);

    const response = await fetch(ATEEM_PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [{ role: 'system', content: buildSystemPrompt(normalizedProducts) }, ...trimmedHistory],
        max_tokens: 350,
        temperature: 0.7,
      }),
    });
    if (!response.ok) {
      const e = await response.json().catch(() => ({}));
      throw new Error(e.error?.message || `HTTP ${response.status}`);
    }
    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content?.trim() || 'عذراً، لم أتمكن من الرد الآن.';
    conversationHistory.current.push({ role: 'assistant', content: reply });
    return reply;
  }

  async function handleSend(overrideText) {
    const msg = (overrideText ?? input).trim();
    if (!msg || sending) return;
    setInput('');
    setSending(true);

    setMessages((prev) => [...prev, { id: nextMsgId(), role: 'user', text: msg, time: nowTime() }]);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);

    try {
      const reply = await askGroq(msg);
      const { displayText, orderData } = extractOrderJson(reply);
      const { cleanText, ids } = extractProductIds(displayText, normalizedProducts);
      const botId = nextMsgId();
      setMessages((prev) => [
        ...prev,
        { id: botId, role: 'bot', text: cleanText, time: nowTime(), productIds: ids },
      ]);
      if (autoRead) playTTS(botId, cleanText);
      if (orderData) submitOdooOrder(orderData);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        { id: nextMsgId(), role: 'error', text: e.message || 'تعذّر الاتصال بالخادم', time: nowTime(), retryText: msg },
      ]);
    } finally {
      setSending(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
    }
  }

  function renderProductCard(id) {
    const p = normalizedProducts.find((x) => x.id === id);
    if (!p) return null;
    return (
      <TouchableOpacity
        key={id}
        style={cs.productCard}
        activeOpacity={0.85}
        onPress={() => p.url && Linking.openURL(p.url)}
      >
        {!!p.img && <Text style={cs.productCardImgPlaceholder}> </Text>}
        <View style={cs.productCardImgWrap}>
          {p.img ? (
            <ChatProductImage uri={p.img} />
          ) : null}
        </View>
        <View style={cs.productCardInfo}>
          <Text style={cs.productCardName} numberOfLines={1}>{p.name}</Text>
          <Text style={cs.productCardCat} numberOfLines={1}>{p.category}</Text>
          <Text style={cs.productCardPrice}>{fmtPrice(p)}</Text>
        </View>
        <Text style={cs.productCardBtn}>عرض المنتج</Text>
      </TouchableOpacity>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={cs.backdrop}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={cs.panelWrap}
        >
          <View style={cs.panel}>
            {/* ===== Header ===== */}
            <View style={cs.header}>
              <View style={cs.headerContent}>
                <View style={cs.logoWrap}>
                  <Text style={cs.logoText}>A</Text>
                </View>
                <View>
                  <Text style={cs.title}>ATEEM Concierge</Text>
                  <View style={cs.subRow}>
                    <View style={cs.statusDot} />
                    <Text style={cs.subText}>متصل الآن</Text>
                  </View>
                </View>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <TouchableOpacity
                  style={[cs.autoReadBtn, autoRead && cs.autoReadBtnActive]}
                  onPress={() => setAutoRead((v) => !v)}
                  activeOpacity={0.8}
                >
                  <Text style={[cs.autoReadBtnText, autoRead && cs.autoReadBtnTextActive]}>
                    {autoRead ? '🔊' : '🔇'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={cs.closeBtn} onPress={onClose} activeOpacity={0.8}>
                  <Text style={cs.closeBtnText}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* ===== Messages ===== */}
            <ScrollView
              ref={scrollRef}
              style={cs.chatBody}
              contentContainerStyle={cs.chatBodyContent}
              showsVerticalScrollIndicator={false}
            >
              {messages.map((m) => (
                <View key={m.id} style={{ marginBottom: 10 }}>
                  {m.role === 'user' && (
                    <View style={cs.userWrap}>
                      <View style={cs.userBubble}>
                        <Text style={cs.userText}>{m.text}</Text>
                      </View>
                      <Text style={cs.timeUser}>{m.time}</Text>
                    </View>
                  )}
                  {m.role === 'bot' && (
                    <View style={cs.botWrap}>
                      <View style={cs.botBubble}>
                        <Text style={cs.botText}>{m.text}</Text>
                      </View>
                      <View style={cs.botMetaRow}>
                        {!!m.text && (
                          <TouchableOpacity
                            style={cs.ttsBtn}
                            onPress={() => playTTS(m.id, m.text)}
                            activeOpacity={0.7}
                          >
                            {loadingTtsId === m.id ? (
                              <ActivityIndicator size="small" color={COLORS.gold} />
                            ) : (
                              <Text style={cs.ttsBtnText}>{playingId === m.id ? '⏹' : '🔊'}</Text>
                            )}
                          </TouchableOpacity>
                        )}
                        <Text style={cs.timeBot}>{m.time}</Text>
                      </View>
                      {m.productIds && m.productIds.length > 0 && (
                        <View style={cs.productsWrap}>
                          {m.productIds.map((id) => renderProductCard(id))}
                        </View>
                      )}
                    </View>
                  )}
                  {m.role === 'error' && (
                    <View style={cs.botWrap}>
                      <View style={cs.errorBubble}>
                        <Text style={cs.errorText}>⚠️ تعذّر الاتصال بالخادم</Text>
                        <Text style={cs.errorDetail}>{m.text}</Text>
                        <TouchableOpacity onPress={() => handleSend(m.retryText)}>
                          <Text style={cs.retryText}>إعادة المحاولة</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
              ))}
              {sending && (
                <View style={cs.botWrap}>
                  <View style={[cs.botBubble, { flexDirection: 'row', alignItems: 'center' }]}>
                    <ActivityIndicator size="small" color={COLORS.charcoal} />
                  </View>
                </View>
              )}
              {messages.length <= 1 && (
                <View style={cs.quickWrap}>
                  {QUICK_REPLIES.map((r) => (
                    <TouchableOpacity key={r} style={cs.quickChip} onPress={() => handleSend(r)}>
                      <Text style={cs.quickChipText}>{r}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </ScrollView>

            {/* ===== Input ===== */}
            <View style={cs.inputRow}>
              <Animated.View style={{ transform: [{ scale: micPulse }] }}>
                <TouchableOpacity
                  style={[cs.micBtn, isRecording && cs.micBtnActive]}
                  onPress={toggleRecording}
                  disabled={sending}
                  activeOpacity={0.8}
                >
                  <Text style={[cs.micBtnText, isRecording && cs.micBtnTextActive]}>
                    {isRecording ? '●' : '🎤'}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
              <TextInput
                style={cs.input}
                value={input}
                onChangeText={setInput}
                placeholder={isRecording ? 'بنسمعك...' : 'اكتب رسالتك هنا...'}
                placeholderTextColor={COLORS.textSubtle}
                editable={!sending}
                onSubmitEditing={() => handleSend()}
                returnKeyType="send"
                textAlign="right"
              />
              <TouchableOpacity style={cs.sendBtn} onPress={() => handleSend()} disabled={sending} activeOpacity={0.8}>
                <Text style={cs.sendBtnText}>➤</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

// صورة المنتج جوّه الشات — مكوّن صغير منفصل عشان لو الرابط فشل يخفي
// نفسه بهدوء بدل ما يسيب مساحة فاضية مكسورة.
function ChatProductImage({ uri }) {
  const [failed, setFailed] = useState(false);
  const { Image } = require('react-native');
  if (failed) return null;
  return (
    <Image
      source={{ uri }}
      style={{ width: '100%', height: '100%', borderRadius: 12 }}
      onError={() => setFailed(true)}
    />
  );
}

const cs = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(58,20,28,0.4)', justifyContent: 'flex-end' },
  panelWrap: { paddingHorizontal: 12, paddingBottom: 24 },
  panel: {
    backgroundColor: COLORS.ivoryLight,
    borderRadius: 24,
    overflow: 'hidden',
    height: '78%',
    borderWidth: 1,
    borderColor: 'rgba(184,147,106,0.25)',
  },

  header: {
    backgroundColor: COLORS.charcoal,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(201,164,100,0.35)',
  },
  headerContent: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoWrap: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.5)',
  },
  logoText: { color: COLORS.goldLight, fontWeight: '600', fontSize: 15 },
  title: { color: '#fff', fontSize: 15, fontWeight: '600' },
  subRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  statusDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: COLORS.goldLight, marginLeft: 4 },
  subText: { color: COLORS.goldLight, fontSize: 9, letterSpacing: 0.5 },
  closeBtn: {
    width: 26, height: 26, borderRadius: 13,
    borderWidth: 1.2, borderColor: 'rgba(201,164,100,0.5)',
    alignItems: 'center', justifyContent: 'center',
  },
  closeBtnText: { color: COLORS.goldLight, fontSize: 12 },

  // زرار قراءة كل الردود تلقائياً (في الهيدر)
  autoReadBtn: {
    width: 26, height: 26, borderRadius: 13,
    borderWidth: 1.2, borderColor: 'rgba(201,164,100,0.5)',
    alignItems: 'center', justifyContent: 'center',
  },
  autoReadBtnActive: { backgroundColor: 'rgba(201,164,100,0.25)' },
  autoReadBtnText: { fontSize: 12 },
  autoReadBtnTextActive: {},

  chatBody: { flex: 1, backgroundColor: COLORS.ivoryLight },
  chatBodyContent: { padding: 14, paddingBottom: 6 },

  userWrap: { alignItems: 'flex-start', maxWidth: '88%', alignSelf: 'flex-start' },
  userBubble: {
    backgroundColor: COLORS.charcoal,
    paddingVertical: 10, paddingHorizontal: 14,
    borderRadius: 18, borderTopLeftRadius: 4,
  },
  userText: { color: '#fff', fontSize: 13.5, lineHeight: 20, textAlign: 'right' },
  timeUser: { fontSize: 9, color: COLORS.textSubtle, marginTop: 2, paddingHorizontal: 4 },

  botWrap: { alignItems: 'flex-end', maxWidth: '92%', alignSelf: 'flex-end' },
  botBubble: {
    backgroundColor: '#fff',
    paddingVertical: 10, paddingHorizontal: 14,
    borderRadius: 18, borderTopRightRadius: 4,
    borderWidth: 1, borderColor: COLORS.border,
  },
  botText: { color: COLORS.ink, fontSize: 13.5, lineHeight: 20, textAlign: 'right' },
  botMetaRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6, marginTop: 2 },
  timeBot: { fontSize: 9, color: COLORS.textSubtle, paddingHorizontal: 4 },
  ttsBtn: { width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },
  ttsBtnText: { fontSize: 13, color: COLORS.gold },

  errorBubble: {
    backgroundColor: '#FBEAEA', borderWidth: 1, borderColor: '#E8B7B7',
    borderRadius: 14, padding: 12, maxWidth: '92%',
  },
  errorText: { color: '#8A2E2E', fontSize: 12.5, fontWeight: '600', textAlign: 'right' },
  errorDetail: { color: '#8A2E2E', fontSize: 10.5, opacity: 0.75, marginTop: 4, textAlign: 'right' },
  retryText: { color: COLORS.charcoal, fontSize: 12, marginTop: 8, textDecorationLine: 'underline', textAlign: 'right' },

  quickWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6, justifyContent: 'flex-end' },
  quickChip: {
    borderWidth: 1.2, borderColor: 'rgba(201,164,100,0.4)', backgroundColor: '#fff',
    paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20,
  },
  quickChipText: { fontSize: 11, color: COLORS.ink },

  productsWrap: { marginTop: 6, gap: 8, width: '100%' },
  productCard: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 10,
    backgroundColor: '#fff', borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 14, padding: 8,
  },
  productCardImgPlaceholder: { width: 0, height: 0 },
  productCardImgWrap: { width: 48, height: 48, borderRadius: 12, backgroundColor: COLORS.ivoryDark, overflow: 'hidden' },
  productCardInfo: { flex: 1 },
  productCardName: { fontSize: 12.5, color: COLORS.ink, fontWeight: '600', textAlign: 'right' },
  productCardCat: { fontSize: 10, color: COLORS.textSubtle, textAlign: 'right', marginTop: 1 },
  productCardPrice: { fontSize: 12, color: COLORS.gold, textAlign: 'right', marginTop: 2 },
  productCardBtn: { fontSize: 10, color: COLORS.charcoal, textDecorationLine: 'underline' },

  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 12, paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: COLORS.border,
    backgroundColor: '#fff',
  },
  input: {
    flex: 1, backgroundColor: COLORS.ivory, borderRadius: 22,
    paddingHorizontal: 16, paddingVertical: 10, fontSize: 13.5, color: COLORS.ink,
  },
  micBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: COLORS.ivory, borderWidth: 1, borderColor: COLORS.border,
    alignItems: 'center', justifyContent: 'center',
  },
  micBtnActive: { backgroundColor: COLORS.charcoal, borderColor: COLORS.charcoal },
  micBtnText: { fontSize: 16, color: COLORS.ink },
  micBtnTextActive: { color: '#fff' },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.charcoal,
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtnText: { color: '#fff', fontSize: 16, transform: [{ scaleX: -1 }] },
});
