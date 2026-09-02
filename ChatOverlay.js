import React, { useState, useRef, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  Image,
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
import { Ionicons } from '@expo/vector-icons';
import Voice from '@react-native-voice/voice';
import * as Notifications from 'expo-notifications';
import { COLORS } from './colors';
import { THEME } from './theme';

const ATEEM_PROXY_URL = 'https://ateem-proxy.ahmedatim23.workers.dev/';
const GROQ_MODEL = 'openai/gpt-oss-120b';
const ATEEM_TTS_PATH = 'tts';

const ATEEM_POLICY_TEXT = `
سياسات متجر ATEEM:
- التوصيل: داخل المدن الرئيسية 2-4 أيام عمل، وباقي المناطق 4-7 أيام عمل.
- الاستبدال: خلال 14 يومًا من تاريخ الاستلام بشرط الحالة الأصلية مع الفاتورة.
- الترجيع: خلال 7 أيام من الاستلام للمنتجات غير المستخدمة.
`;

const WELCOME_TEXT = 'أهلاً بك في ATEEM — أنا مستشارك الشخصي هنا، بأقدر أساعدك بشنو؟';
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
- استخدمي رمز 💎 مرة واحدة فقط في كامل المحادثة.
- ممنوع تماماً عبارات جافة رسمية.
- عدّلي لطفك حسب سياق الحديث دون افتراض جنس العميل إلا إذا اتضح من كلامه.

قائمة المنتجات المتوفرة حالياً في المتجر:
${productLines || '(تعذّر تحميل القائمة الآن — إن سُئلت عن منتج معيّن، اعتذري بلطف واقترحي على العميل المحاولة خلال قليل)'}
${ATEEM_POLICY_TEXT}

تعليمات الترشيح والاقتراح:
- رشّحي دائماً من هذه القائمة فقط، ولا تخترعي أبداً منتجاً أو مقاساً أو لوناً أو سعراً غير مذكور فيها.
- رشّحي 3 منتجات كحد أقصى في الرسالة الواحدة.
- عند ترشيح منتج اذكري رمزه [id] بين أقواس مربعة ليظهر تلقائياً كبطاقة.
- إن لم تعرفي إجابة سؤال بثقة، قولي: "لحظة بوصلِك مع مستشار ATEEM شخصي عشان نساعدك أفضل".

تعليمات إتمام الطلب والدفع:
- اجمعي: الاسم الكامل، المنتج (مع المقاس واللون إن وُجدا)، العنوان الكامل، رقم الهاتف، وطريقة الدفع.
- صياغة رسالة إغلاق الطلب تختلف حسب طريقة الدفع، وهذا فرق جوهري يجب الالتزام به بدقة تامة:
  • الدفع عند الاستلام (cod): الطلب يتأكد فوراً في نظامنا فعلياً، فاكتبي رسالة تأكيد صريحة، مثل: "تم تأكيد طلبك، وجاري تجهيزه الآن 💎".
  • الدفع الإلكتروني (bankak أو fawry): الطلب يبقى معلّقاً حتى يتحقق فريقنا يدوياً من وصول المبلغ فعلياً — ممنوع نهائياً كتابة "تم تأكيد طلبك" أو أي صياغة توحي بأن الطلب مؤكد. اكتبي بدلاً من ذلك شيئاً مثل: "استلمنا طلبك بنجاح، وبمجرد التأكد من وصول المبلغ سيصلك تأكيد فوري 💎". العميل سيستلم رسالة تأكيد حقيقية تلقائياً بعد التحقق الفعلي، فلا تَعِديه بتأكيد فوري لم يحدث بعد.
- بعد رسالة الإغلاق (أياً كانت صياغتها حسب الحالة أعلاه)، أضيفي مباشرة بعدها وسماً مخفياً بهذا الشكل بالضبط:
[ORDER_JSON]{"name":"...","product_id":"...","product":"...","size":"...","color":"...","qty":"...","address":"...","phone":"...","payment_method":"..."}[/ORDER_JSON]
- قيمة qty رقم صحيح موجب (الكمية المطلوبة). لو العميل لم يذكر كمية، استخدمي "1".
- قيمة product_id رقمية فقط (نفس [id] بالضبط).
- payment_method: "bankak" أو "fawry" أو "cod". استخدمي "" للحقول غير المتوفرة.
- لا تُرسلي هذا الوسم إلا مرة واحدة لكل طلب مكتمل ومؤكد فعلياً.

القواعد الذهبية:
- كل اقتراح مبني على ما قاله هذا العميل تحديداً في هذه المحادثة.
- تذكّري اسم العميل ومقاسه وألوانه المفضلة خلال المحادثة نفسها.`;
}

// استخراج [ORDER_JSON]...[/ORDER_JSON] من رد الموديل. الحالة العادية:
// الوسمين موجودين بالكامل، فبنستخرج الـ JSON ونشيل الوسم بالكامل من
// النص المعروض للعميل. لو الموديل حاد عن الصيغة (وسم ناقص/مشوّه) بننزل
// لخطة احتياطية تحت بدل ما نسيب JSON خام يظهر للعميل.
function extractOrderJson(text) {
  const match = text.match(/\[ORDER_JSON\]([\s\S]*?)\[\/ORDER_JSON\]/);
  if (match) {
    let orderData = null;
    try { orderData = JSON.parse(match[1]); } catch (e) { orderData = null; }
    const displayText = text.replace(match[0], '').trim();
    return { displayText, orderData };
  }

  // خطة احتياطية: لو الوسم ناقص أو مشوّه لكن الموديل لسه سايب جسم JSON
  // فيه "product_id" ظاهر في النص، ندوّر عليه كـ كتلة {...} ونشيله من
  // النص المعروض حتى لو معندناش وسم صحيح بالكامل نعتمد عليه. مفيش براces
  // متداخلة في شكل ORDER_JSON فالـ regex البسيط ده كافي وآمن.
  const looseJsonMatch = text.match(/\{[^{}]*"product_id"[^{}]*\}/);
  if (looseJsonMatch) {
    let orderData = null;
    try { orderData = JSON.parse(looseJsonMatch[0]); } catch (e) { orderData = null; }
    const displayText = text
      .replace(looseJsonMatch[0], '')
      .replace(/\[\/?ORDER_JSON\]/g, '')
      .replace(/\s{2,}/g, ' ')
      .trim();
    return { displayText, orderData };
  }

  // مفيش JSON خالص، بس ممكن يكون فيه وسوم فاضية (بلا محتوى) اتسابت
  // بالغلط — بنشيلها تحسبًا فقط، النص الأصلي بيفضل زي ما هو غير كده.
  const cleanedText = text.replace(/\[\/?ORDER_JSON\]/g, '').trim();
  return { displayText: cleanedText, orderData: null };
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

// تطبيع نص عربي قبل المقارنة: بيشيل التشكيل، التطويل، والمسافات
// الصفرية (زي اللي بتتلزق أحيانًا من نسخ/لصق)، وبيوحّد المسافات
// المتكررة — عشان فرق بسيط في الكتابة (تشكيل، مسافة زيادة) ما يفشّلش
// مطابقة صحيحة فعليًا.
function normalizeArabic(s) {
  return String(s || '')
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '') // تشكيل
    .replace(/\u0640/g, '') // تطويل
    .replace(/[\u200B-\u200F\uFEFF]/g, '') // مسافات/علامات صفرية
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function matchOrderVariant(product, size, color) {
  if (!product.variants || !product.variants.length) return null;
  if (product.variants.length === 1) return product.variants[0];
  const wantedSize = normalizeArabic(size);
  const wantedColor = normalizeArabic(color);
  const candidates = product.variants.filter((v) => {
    const values = Object.values(v.values || {}).map(normalizeArabic);
    const sizeOk = !wantedSize || values.some((val) => val === wantedSize);
    // اللون: مطابقة أكثر تسامحًا (احتواء في أي اتجاه) لأن وصف العميل
    // أو الموديل ممكن يكون أوسع أو أضيق من اسم الخاصية في Odoo بالظبط
    // (مثال: "أخضر زمردي" من العميل مقابل "أخضر" في Odoo، أو العكس).
    const colorOk = !wantedColor || values.some((val) => val === wantedColor || val.includes(wantedColor) || wantedColor.includes(val));
    return sizeOk && colorOk;
  });
  return candidates.length ? candidates[0] : null;
}

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
    console.warn('ATEEM: تعذّر الحصول على توكن الإشعارات:', e);
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
    if (!variant) {
      // بدل رسالة خطأ عمياء: نسرد التركيبات المتاحة فعليًا على المنتج
      // في Odoo عشان السبب الحقيقي يبان فورًا في تليجرام من غير ما
      // حد يحتاج يدخل يخمّن يدويًا.
      const available = (product.variants || [])
        .map((v) => Object.values(v.values || {}).join('/'))
        .filter(Boolean)
        .join('، ') || '(المنتج مفيهوش أي variants أصلاً)';
      throw new Error(
        `مفيش تطابق لمقاس="${order.size || ''}" لون="${order.color || ''}" — التركيبات المتاحة فعليًا: ${available}`
      );
    }
    if (variant.stock !== null && variant.stock !== undefined && variant.stock <= 0) {
      throw new Error('الكمية المتاحة للتركيبة المطلوبة صفر (نفذ المخزون)');
    }
    const meta = [order.size, order.color].filter(Boolean).join(' / ');
    const qty = Math.max(1, parseInt(order.qty, 10) || 1);
    const fcmToken = await getNativeFcmToken();

    const resp = await fetch(ATEEM_PROXY_URL + 'odoo-create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer: { name: order.name, phone: order.phone, address: order.address },
        items: [{ sku: variant.id, qty, price: variant.price, name: product.name, meta }],
        paymentMethod: order.payment_method,
        fcmToken,
      }),
    });
    const data = await resp.json();
    if (!data.ok) throw new Error('فشل الإنشاء في Odoo: ' + (data.error || 'سبب غير معروف'));

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
    // نلزق السبب الحقيقي في الطلب نفسه قبل ما نبعته للـ fallback —
    // worker.js بيعرضه في رسالة تليجرام بدل ما يفضل غامض زي قبل كده.
    await sendFallbackTelegramNotification({ ...order, debug_reason: e.message || String(e) });
    return null;
  }
}

let msgIdCounter = 0;
function nextMsgId() {
  msgIdCounter += 1;
  return 'm' + msgIdCounter;
}

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
  if (!resp.ok) {
    const errBody = await resp.text().catch(() => '');
    throw new Error(`TTS request failed: HTTP ${resp.status} ${errBody.slice(0, 150)}`);
  }
  const blob = await resp.blob();
  if (!blob || blob.size === 0) {
    throw new Error('TTS returned empty audio');
  }
  return blobToDataUri(blob);
}

export default function ChatOverlay({ visible, onClose, products }) {
  const normalizedProducts = (products || []).map(normalizeProduct);

  const [messages, setMessages] = useState([
    { id: nextMsgId(), role: 'bot', text: WELCOME_TEXT, time: nowTime(), productIds: [], isWelcome: true },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const conversationHistory = useRef([]);
  const scrollRef = useRef(null);

  const soundRef = useRef(null);
  const [playingId, setPlayingId] = useState(null);
  const [loadingTtsId, setLoadingTtsId] = useState(null);

  const [isRecording, setIsRecording] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(true);
  const recognizedTextRef = useRef('');
  const micPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 150);
    }
  }, [visible]);

  useEffect(() => {
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
      allowsRecordingIOS: false,
    }).catch((e) => console.warn('ATEEM: تعذّر ضبط وضع الصوت:', e));
  }, []);

  // مستمع إشعارات الـ Push: طول ما الشات (المكوّن) شغّال، أي إشعار
  // "order_confirmed" جاي من الـ Worker (بعد تأكيد أحمد للطلب من تليجرام)
  // بيتحوّل تلقائيًا لرسالة بوت جوه الشات — العميل بيشوف التأكيد وهو
  // فاتح الشات من غير ما يحتاج يقفل ويفتح التطبيق تاني. التنظيف تحت في
  // return بيشيل المستمع عند تفكيك المكوّن عشان مفيش تسريب ذاكرة.
  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener((notification) => {
      const data = notification.request?.content?.data;
      if (data && data.type === 'order_confirmed') {
        const orderName = data.orderName || '';
        setMessages((prev) => [
          ...prev,
          {
            id: nextMsgId(),
            role: 'bot',
            text: `🎉 تم تأكيد طلبك بنجاح! رقم الطلب: ${orderName}`,
            time: nowTime(),
            productIds: [],
          },
        ]);
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
      }
    });

    return () => {
      Notifications.removeNotificationSubscription(subscription);
    };
  }, []);

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
      console.warn('ATEEM: تعذّر بدء التسجيل الصوتي:', e);
    }
  }

  // ملاحظة: أضفنا Alert بالخطأ الحقيقي عشان تعرف سبب فشل الصوت
  // بالظبط (رابط /tts خطأ، أو الـ Worker بيرجّع خطأ) بدل ما يفشل بصمت.
  async function playTTS(id, text) {
    if (!text) return;
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
      const { sound } = await Audio.Sound.createAsync({ uri: dataUri }, { shouldPlay: true, volume: 1.0 });
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
      Alert.alert('تعذّر تشغيل الصوت', String(e.message || e));
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
        // 350 كانت قليلة: أي رد بيتضمن نص التأكيد + وسم [ORDER_JSON]
        // الكامل كان بيتقطع قبل ما يخلّص، وده سبب تسريب الـ JSON الخام
        // للعميل ورسائل نصها مبتور (شوف ملاحظات الباگات في ذاكرة المشروع).
        max_tokens: 800,
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
        <View style={cs.productCardImgWrap}>
          {p.img ? <ChatProductImage uri={p.img} /> : null}
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
                <View style={cs.logoImgWrap}>
                  <Image source={require('./assets/bot-avatar.png')} style={cs.logoImg} />
                </View>
                <View>
                  <Text style={cs.title}>ATEEM Concierge</Text>
                  <View style={cs.subRow}>
                    <View style={cs.statusDot} />
                    <Text style={cs.subText}>متصل الآن</Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity style={cs.closeBtn} onPress={onClose} activeOpacity={0.8}>
                <Text style={cs.closeBtnText}>✕</Text>
              </TouchableOpacity>
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
                  {m.role === 'bot' && m.isWelcome && (
                    <View style={cs.welcomeWrap}>
                      <Text style={cs.welcomeText}>{WELCOME_TEXT}</Text>
                    </View>
                  )}
                  {m.role === 'bot' && !m.isWelcome && (
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
                    <ActivityIndicator size="small" color={COLORS.burgundy} />
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
                  <Ionicons
                    name={isRecording ? 'mic' : 'mic-outline'}
                    size={20}
                    color={isRecording ? COLORS.white : THEME.textPrimary}
                  />
                </TouchableOpacity>
              </Animated.View>
              <TextInput
                style={cs.input}
                value={input}
                onChangeText={setInput}
                placeholder={isRecording ? 'بنسمعك...' : 'اكتب رسالتك هنا...'}
                placeholderTextColor={THEME.textSecondary}
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
  backdrop: { flex: 1, backgroundColor: 'rgba(26,26,26,0.45)', justifyContent: 'flex-end' },
  panelWrap: { paddingHorizontal: 8, paddingBottom: 12 },
  panel: {
    backgroundColor: THEME.background,
    borderRadius: 20,
    overflow: 'hidden',
    height: '92%',
    borderWidth: 1,
    borderColor: THEME.border,
  },

  header: {
    backgroundColor: COLORS.burgundy,
    paddingHorizontal: 16,
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1.5,
    borderBottomColor: COLORS.gold,
  },
  headerContent: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  // صورة البوت في الهيدر: مصغّرة شوية عن قبل (58→46) عشان تتماشى مع
  // هيدر أرشق، من غير إطار ذهبي — الخلفية الفاتحة + الظل كافيين للتباين.
  logoImgWrap: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: THEME.background,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  logoImg: {
    width: 42, height: 42, borderRadius: 21,
  },
  title: { fontFamily: THEME.fontHeading, color: COLORS.white, fontSize: 15 },
  // 'row-reverse' + gap صريحين (بدل الاعتماد على RTL التلقائي) عشان
  // النقطة الذهبية والنص "متصل الآن" ما يتراكبوش بغض النظر عن حالة
  // I18nManager وقت الفتح. مكانها تحت العنوان مباشرة — مناسب لهيدر
  // أرشق من غير ما ياخد مساحة أفقية إضافية.
  subRow: { flexDirection: 'row-reverse', alignItems: 'center', marginTop: 2, gap: 5 },
  statusDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: COLORS.gold },
  subText: { fontFamily: THEME.fontBody, color: COLORS.gold, fontSize: 10, letterSpacing: 0.5 },
  closeBtn: {
    width: 28, height: 28, borderRadius: 14,
    borderWidth: 1.2, borderColor: COLORS.gold,
    alignItems: 'center', justifyContent: 'center',
  },
  closeBtnText: { color: COLORS.gold, fontSize: 13 },

  chatBody: { flex: 1, backgroundColor: THEME.background },
  chatBodyContent: { padding: 14, paddingBottom: 6 },

  // رسالة الترحيب: سطر مركزي أنيق بلا بطاقة ولا حدود — نص راقٍ قصير
  // بخط العناوين، بيبان مميز عن رسايل الشات العادية بمجرد كبر خطه
  // وتوسيطه، من غير أي زخرفة إضافية.
  welcomeWrap: { alignItems: 'center', width: '100%', marginBottom: 6, paddingHorizontal: 12, paddingTop: 4 },
  welcomeText: { fontFamily: THEME.fontHeading, fontSize: 15.5, color: COLORS.burgundy, textAlign: 'center', lineHeight: 24 },

  userWrap: { alignItems: 'flex-start', maxWidth: '88%', alignSelf: 'flex-start' },
  userBubble: {
    backgroundColor: COLORS.burgundy,
    paddingVertical: 10, paddingHorizontal: 14,
    borderRadius: 18, borderTopLeftRadius: 4,
  },
  userText: { fontFamily: THEME.fontBody, color: COLORS.white, fontSize: 13.5, lineHeight: 21, textAlign: 'right' },
  timeUser: { fontFamily: THEME.fontBody, fontSize: 9, color: THEME.textSecondary, marginTop: 2, paddingHorizontal: 4 },

  botWrap: { alignItems: 'flex-end', maxWidth: '92%', alignSelf: 'flex-end' },
  botBubble: {
    backgroundColor: THEME.card,
    paddingVertical: 10, paddingHorizontal: 14,
    borderRadius: 18, borderTopRightRadius: 4,
    borderWidth: 1, borderColor: THEME.border,
  },
  botText: { fontFamily: THEME.fontBody, color: THEME.textPrimary, fontSize: 13.5, lineHeight: 21, textAlign: 'right' },
  botMetaRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6, marginTop: 2 },
  timeBot: { fontFamily: THEME.fontBody, fontSize: 9, color: THEME.textSecondary, paddingHorizontal: 4 },
  ttsBtn: { width: 22, height: 22, alignItems: 'center', justifyContent: 'center' },
  ttsBtnText: { fontSize: 14, color: COLORS.gold },

  errorBubble: {
    backgroundColor: '#FBEAEA', borderWidth: 1, borderColor: '#E8B7B7',
    borderRadius: 14, padding: 12, maxWidth: '92%',
  },
  errorText: { fontFamily: THEME.fontBody, color: '#8A2E2E', fontSize: 12.5, fontWeight: '600', textAlign: 'right' },
  errorDetail: { fontFamily: THEME.fontBody, color: '#8A2E2E', fontSize: 10.5, opacity: 0.75, marginTop: 4, textAlign: 'right' },
  retryText: { fontFamily: THEME.fontBody, color: COLORS.burgundy, fontSize: 12, marginTop: 8, textDecorationLine: 'underline', textAlign: 'right' },

  quickWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6, justifyContent: 'flex-end' },
  quickChip: {
    borderWidth: 1.2, borderColor: COLORS.gold, backgroundColor: THEME.card,
    paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20,
  },
  quickChipText: { fontFamily: THEME.fontBody, fontSize: 11, color: THEME.textPrimary },

  productsWrap: { marginTop: 6, gap: 8, width: '100%' },
  productCard: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 10,
    backgroundColor: THEME.card, borderWidth: 1, borderColor: THEME.border,
    borderRadius: 14, padding: 8,
  },
  productCardImgWrap: { width: 48, height: 48, borderRadius: 12, backgroundColor: THEME.background, overflow: 'hidden' },
  productCardInfo: { flex: 1 },
  productCardName: { fontFamily: THEME.fontBody, fontSize: 12.5, color: THEME.textPrimary, fontWeight: '600', textAlign: 'right' },
  productCardCat: { fontFamily: THEME.fontBody, fontSize: 10, color: THEME.textSecondary, textAlign: 'right', marginTop: 1 },
  productCardPrice: { fontFamily: THEME.fontBody, fontSize: 12, color: THEME.textPrice, textAlign: 'right', marginTop: 2 },
  productCardBtn: { fontFamily: THEME.fontBody, fontSize: 10, color: COLORS.burgundy, textDecorationLine: 'underline' },

  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 12, paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: THEME.border,
    backgroundColor: THEME.card,
  },
  input: {
    flex: 1, backgroundColor: THEME.background, borderRadius: 22,
    paddingHorizontal: 16, paddingVertical: 10, fontFamily: THEME.fontBody, fontSize: 13.5, color: THEME.textPrimary,
  },
  micBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: THEME.background, borderWidth: 1, borderColor: THEME.border,
    alignItems: 'center', justifyContent: 'center',
  },
  micBtnActive: { backgroundColor: COLORS.burgundy, borderColor: COLORS.burgundy },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: COLORS.burgundy,
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtnText: { color: COLORS.white, fontSize: 17, transform: [{ scaleX: -1 }] },
});
