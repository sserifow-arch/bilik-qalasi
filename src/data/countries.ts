import type { T3 } from '../lib/types';

const t = (az: string, ru: string, en: string): T3 => ({ az, ru, en });

/** Bayraq oyunu üçün ölkələr (çətinlik sırası ilə) */
export const COUNTRIES: { flag: string; name: T3 }[] = [
  { flag: '🇦🇿', name: t('Azərbaycan', 'Азербайджан', 'Azerbaijan') },
  { flag: '🇹🇷', name: t('Türkiyə', 'Турция', 'Turkey') },
  { flag: '🇷🇺', name: t('Rusiya', 'Россия', 'Russia') },
  { flag: '🇬🇧', name: t('Böyük Britaniya', 'Великобритания', 'United Kingdom') },
  { flag: '🇺🇸', name: t('ABŞ', 'США', 'USA') },
  { flag: '🇫🇷', name: t('Fransa', 'Франция', 'France') },
  { flag: '🇩🇪', name: t('Almaniya', 'Германия', 'Germany') },
  { flag: '🇮🇹', name: t('İtaliya', 'Италия', 'Italy') },
  { flag: '🇯🇵', name: t('Yaponiya', 'Япония', 'Japan') },
  { flag: '🇨🇳', name: t('Çin', 'Китай', 'China') },
  { flag: '🇬🇪', name: t('Gürcüstan', 'Грузия', 'Georgia') },
  { flag: '🇰🇿', name: t('Qazaxıstan', 'Казахстан', 'Kazakhstan') },
  { flag: '🇺🇿', name: t('Özbəkistan', 'Узбекистан', 'Uzbekistan') },
  { flag: '🇺🇦', name: t('Ukrayna', 'Украина', 'Ukraine') },
  { flag: '🇪🇸', name: t('İspaniya', 'Испания', 'Spain') },
  { flag: '🇧🇷', name: t('Braziliya', 'Бразилия', 'Brazil') },
  { flag: '🇨🇦', name: t('Kanada', 'Канада', 'Canada') },
  { flag: '🇮🇳', name: t('Hindistan', 'Индия', 'India') },
  { flag: '🇰🇷', name: t('Cənubi Koreya', 'Южная Корея', 'South Korea') },
  { flag: '🇪🇬', name: t('Misir', 'Египет', 'Egypt') },
  { flag: '🇬🇷', name: t('Yunanıstan', 'Греция', 'Greece') },
  { flag: '🇮🇷', name: t('İran', 'Иран', 'Iran') },
  { flag: '🇦🇺', name: t('Avstraliya', 'Австралия', 'Australia') },
  { flag: '🇲🇽', name: t('Meksika', 'Мексика', 'Mexico') },
];
