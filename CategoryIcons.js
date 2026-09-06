import React from 'react';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

// كل الأيقونات هنا بنفس أسلوب BadgeIcon الموجود في App.js: خطوط
// (line-art) بدون تعبئة (fill="none")، strokeWidth ثابت 2.5،
// strokeLinecap و strokeLinejoin دايمًا "round"، وviewBox موحّد
// 0 0 64 64 عشان كل الأيقونات تتماشى مع بعض بصريًا بغض النظر عن
// حجم العرض (size) اللي بيتحدد وقت الاستخدام.

const DEFAULT_COLOR = '#1A1A1A';
const STROKE = 2.5;

// ---------- فئات (Quick Categories) ----------

export function MensIcon({ size = 24, color = DEFAULT_COLOR }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <Path
        d="M22 10 L28 8 H36 L42 10 L52 18 L45 26 L40 22 V54 H24 V22 L19 26 L12 18 Z"
        stroke={color} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round"
      />
    </Svg>
  );
}

export function WomensIcon({ size = 24, color = DEFAULT_COLOR }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <Path
        d="M32 8 C35 8 37 11 36 14 C35 16.5 33.5 17.5 32 17.5 C30.5 17.5 29 16.5 28 14 C27 11 29 8 32 8 Z"
        stroke={color} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round"
      />
      <Path
        d="M26.5 17 L18 26 L23 32 L26 28 L22 56 H42 L38 28 L41 32 L46 26 L37.5 17"
        stroke={color} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round"
      />
    </Svg>
  );
}

export function ShoesIcon({ size = 24, color = DEFAULT_COLOR }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <Path
        d="M8 44 V33 C8 29 10 26 14 25 L22 22 C25 21 28 22 30 24 L37 30 C39 32 42 33 45 33 H48 C52 33 56 35 56 38 C56 41.5 52.5 44 48 44 H8 Z"
        stroke={color} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round"
      />
      <Path
        d="M25 25 L29 21 M29 27.5 L33 23.5"
        stroke={color} strokeWidth={STROKE - 0.5} strokeLinecap="round" strokeLinejoin="round"
      />
    </Svg>
  );
}

export function BagsIcon({ size = 24, color = DEFAULT_COLOR }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <Path
        d="M24 26 C24 18 27.5 13 32 13 C36.5 13 40 18 40 26"
        stroke={color} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round"
      />
      <Path
        d="M18 26 H46 L43 52 H21 L18 26 Z"
        stroke={color} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round"
      />
    </Svg>
  );
}

// ---------- هيدر / تنقّل ----------

export function MenuIcon({ size = 24, color = DEFAULT_COLOR }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <Path
        d="M10 18 H54 M10 32 H54 M10 46 H54"
        stroke={color} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round"
      />
    </Svg>
  );
}

export function CartIcon({ size = 24, color = DEFAULT_COLOR }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <Path
        d="M8 10 H15 L20 38 H46 L52 18 H18"
        stroke={color} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round"
      />
      <Circle cx={23} cy={48} r={4} stroke={color} strokeWidth={STROKE} />
      <Circle cx={43} cy={48} r={4} stroke={color} strokeWidth={STROKE} />
    </Svg>
  );
}

export function SearchIcon({ size = 24, color = DEFAULT_COLOR }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <Circle cx={27} cy={27} r={14} stroke={color} strokeWidth={STROKE} />
      <Path
        d="M37 37 L53 53"
        stroke={color} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round"
      />
    </Svg>
  );
}

export function HomeIcon({ size = 24, color = DEFAULT_COLOR }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <Path
        d="M9 30 L32 10 L55 30 M16 26 V54 H48 V26"
        stroke={color} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round"
      />
      <Rect x={27} y={38} width={10} height={16} rx={1.5} stroke={color} strokeWidth={STROKE} strokeLinejoin="round" />
    </Svg>
  );
}

export function HeartIcon({ size = 24, color = DEFAULT_COLOR }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <Path
        d="M32 54 C32 54 10 40 10 24 C10 16.5 16 10 23 10 C27 10 30 12 32 16 C34 12 37 10 41 10 C48 10 54 16.5 54 24 C54 40 32 54 32 54 Z"
        stroke={color} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round"
      />
    </Svg>
  );
}

export function ProfileIcon({ size = 24, color = DEFAULT_COLOR }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <Circle cx={32} cy={22} r={10} stroke={color} strokeWidth={STROKE} />
      <Path
        d="M12 54 C12 42 20 36 32 36 C44 36 52 42 52 54"
        stroke={color} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round"
      />
    </Svg>
  );
}

export function GridIcon({ size = 24, color = DEFAULT_COLOR }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <Rect x={9} y={9} width={19} height={19} rx={3} stroke={color} strokeWidth={STROKE} strokeLinejoin="round" />
      <Rect x={36} y={9} width={19} height={19} rx={3} stroke={color} strokeWidth={STROKE} strokeLinejoin="round" />
      <Rect x={9} y={36} width={19} height={19} rx={3} stroke={color} strokeWidth={STROKE} strokeLinejoin="round" />
      <Rect x={36} y={36} width={19} height={19} rx={3} stroke={color} strokeWidth={STROKE} strokeLinejoin="round" />
    </Svg>
  );
}

// ---------- شريط المميزات (Feature bar) ----------

export function HeadsetIcon({ size = 24, color = DEFAULT_COLOR }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <Path
        d="M14 34 V30 C14 18 22 10 32 10 C42 10 50 18 50 30 V34"
        stroke={color} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round"
      />
      <Rect x={9} y={32} width={11} height={17} rx={4} stroke={color} strokeWidth={STROKE} strokeLinejoin="round" />
      <Rect x={44} y={32} width={11} height={17} rx={4} stroke={color} strokeWidth={STROKE} strokeLinejoin="round" />
      <Path
        d="M44 44 V48 C44 52 41 54 37 54 H33"
        stroke={color} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round"
      />
    </Svg>
  );
}

export function ShieldIcon({ size = 24, color = DEFAULT_COLOR }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <Path
        d="M32 8 L52 16 V29 C52 43 44 51.5 32 57 C20 51.5 12 43 12 29 V16 Z"
        stroke={color} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round"
      />
    </Svg>
  );
}

export function TruckIcon({ size = 24, color = DEFAULT_COLOR }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <Path
        d="M6 20 H36 V42 H6 Z"
        stroke={color} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round"
      />
      <Path
        d="M36 28 H47 L54 35 V42 H36 Z"
        stroke={color} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round"
      />
      <Circle cx={17} cy={46} r={5} stroke={color} strokeWidth={STROKE} />
      <Circle cx={44} cy={46} r={5} stroke={color} strokeWidth={STROKE} />
    </Svg>
  );
}
