import React from 'react';
import Svg, { Path } from 'react-native-svg';

// أيقونات مخصصة (line-art) بستايل موحّد: stroke بدون fill، عرض خط
// 2.5–3.5، viewBox ثابت 64×64. كل أيقونة بتاخد size و color زي أي
// أيقونة مكتبة عادية.

export function MensIcon({ size = 26, color = '#6B1E2E' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <Path
        d="M22 10 14 16 8 29l8 5 4-7v27h24V27l4 7 8-5-6-13-8-6-6 7h-8l-6-7Z"
        stroke={color} strokeWidth={2.5} strokeLinejoin="round"
      />
      <Path
        d="M28 17v8h8v-8M20 31h24M32 25v29"
        stroke={color} strokeWidth={2.5} strokeLinecap="round"
      />
    </Svg>
  );
}

export function WomensIcon({ size = 26, color = '#6B1E2E' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <Path
        d="M24 10c1 5 3 8 8 8s7-3 8-8l6 3-5 12 11 29H12l11-29-5-12 6-3Z"
        stroke={color} strokeWidth={2.5} strokeLinejoin="round"
      />
      <Path
        d="M24 10c0 5 3 8 8 8s8-3 8-8M23 25h18M32 18v36M18 54h28"
        stroke={color} strokeWidth={2.5} strokeLinecap="round"
      />
    </Svg>
  );
}

export function ShoesIcon({ size = 26, color = '#6B1E2E' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <Path
        d="M13 39c8-2 13-8 17-19 1-3 5-4 7-1l5 10c2 4 6 7 11 8l7 2c3 1 4 4 3 7-1 3-4 5-8 5H16c-7 0-10-9-3-12Z"
        stroke={color} strokeWidth={2.5} strokeLinejoin="round"
      />
      <Path
        d="M30 22c2 4 5 6 9 7M24 51h31"
        stroke={color} strokeWidth={2.5} strokeLinecap="round"
      />
    </Svg>
  );
}

export function BagsIcon({ size = 26, color = '#6B1E2E' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <Path
        d="M14 24h36l3 30H11l3-30Z"
        stroke={color} strokeWidth={2.5} strokeLinejoin="round"
      />
      <Path
        d="M22 24v-5c0-6 4-10 10-10s10 4 10 10v5M22 34c3 3 6 4 10 4s7-1 10-4M27 24v4M37 24v4"
        stroke={color} strokeWidth={2.5} strokeLinecap="round"
      />
    </Svg>
  );
}

export function MenuIcon({ size = 26, color = '#1A1A1A' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <Path d="M12 20h40M12 32h40M12 44h40" stroke={color} strokeWidth={3} strokeLinecap="round" />
    </Svg>
  );
}

export function CartIcon({ size = 26, color = '#1A1A1A' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <Path d="M14 22h36l-4 26H18l-4-26Z" stroke={color} strokeWidth={2.5} strokeLinejoin="round" />
      <Path d="M22 22v-4c0-6 4-10 10-10s10 4 10 10v4" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
    </Svg>
  );
}

export function SearchIcon({ size = 26, color = '#1A1A1A' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <Path d="M46 46 58 58M28 46c9.9 0 18-8.1 18-18S37.9 10 28 10 10 18.1 10 28s8.1 18 18 18Z"
        stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function HomeIcon({ size = 26, color = '#1A1A1A' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <Path d="M10 28 32 10l22 18M16 24v28h32V24" stroke={color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
    </Svg>
  );
}

export function HeartIcon({ size = 18, color = '#6B1E2E' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <Path d="M32 54S8 40 8 22c0-8 6-14 13-14 5 0 9 3 11 7 2-4 6-7 11-7 7 0 13 6 13 14 0 18-24 32-24 32Z"
        stroke={color} strokeWidth={2.5} strokeLinejoin="round" />
    </Svg>
  );
}

export function PlusIcon({ size = 16, color = '#1A1A1A' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <Path d="M32 12v40M12 32h40" stroke={color} strokeWidth={3.5} strokeLinecap="round" />
    </Svg>
  );
}

export function ProfileIcon({ size = 22, color = '#1A1A1A' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <Path d="M32 32c7 0 12-6 12-13S39 6 32 6 20 12 20 19s5 13 12 13Z"
        stroke={color} strokeWidth={2.5} strokeLinejoin="round" />
      <Path d="M10 56c2-12 11-19 22-19s20 7 22 19"
        stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function HeadsetIcon({ size = 22, color = '#1A1A1A' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <Path
        d="M12 34v-4c0-11 9-20 20-20s20 9 20 20v4"
        stroke={color} strokeWidth={2.5} strokeLinecap="round"
      />
      <Path
        d="M10 34h6v14h-6a4 4 0 0 1-4-4v-6a4 4 0 0 1 4-4ZM54 34h-6v14h6a4 4 0 0 0 4-4v-6a4 4 0 0 0-4-4Z"
        stroke={color} strokeWidth={2.5} strokeLinejoin="round"
      />
      <Path
        d="M48 48v2c0 4-4 7-9 7h-5"
        stroke={color} strokeWidth={2.5} strokeLinecap="round"
      />
    </Svg>
  );
}

export function ShieldIcon({ size = 22, color = '#1A1A1A' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <Path
        d="M32 8l20 7v15c0 14-8.5 23-20 26-11.5-3-20-12-20-26V15l20-7Z"
        stroke={color} strokeWidth={2.5} strokeLinejoin="round"
      />
      <Path
        d="M23 32l6 6 12-13"
        stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"
      />
    </Svg>
  );
}

export function TruckIcon({ size = 22, color = '#1A1A1A' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <Path
        d="M6 18h30v26H6V18ZM36 26h12l10 10v8H36V26Z"
        stroke={color} strokeWidth={2.5} strokeLinejoin="round"
      />
      <Path
        d="M17 52a5 5 0 1 0 0-10 5 5 0 0 0 0 10ZM45 52a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z"
        stroke={color} strokeWidth={2.5}
      />
    </Svg>
  );
}

export function GridIcon({ size = 22, color = '#1A1A1A' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <Path
        d="M10 10h18v18H10V10ZM36 10h18v18H36V10ZM10 36h18v18H10V36ZM36 36h18v18H36V36Z"
        stroke={color} strokeWidth={2.5} strokeLinejoin="round"
      />
    </Svg>
  );
}
