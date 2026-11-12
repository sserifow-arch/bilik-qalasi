import type { T3 } from '../lib/types';

/** Avatarlar: əsas avatarlar pulsuz, digərləri səviyyə ilə açılır */
export const AVATARS: { id: string; level: number }[] = [
  { id: '🦁', level: 1 }, { id: '🐼', level: 1 }, { id: '🐨', level: 1 }, { id: '🐰', level: 1 },
  { id: '🦊', level: 1 }, { id: '🐸', level: 1 }, { id: '🐵', level: 1 }, { id: '🐯', level: 1 },
  { id: '🦄', level: 3 }, { id: '🐲', level: 5 }, { id: '🦖', level: 7 }, { id: '🤖', level: 9 },
  { id: '🧑‍🚀', level: 12 }, { id: '🦸', level: 15 },
];

const t = (az: string, ru: string, en: string): T3 => ({ az, ru, en });
/** Sikkə ilə alınan aksesuarlar */
export const ACCESSORIES: { id: string; emoji: string; price: number; name: T3 }[] = [
  { id: 'bow', emoji: '🎀', price: 20, name: t('Bant', 'Бантик', 'Bow') },
  { id: 'cap', emoji: '🧢', price: 30, name: t('Kepka', 'Кепка', 'Cap') },
  { id: 'glasses', emoji: '🕶️', price: 40, name: t('Eynək', 'Очки', 'Sunglasses') },
  { id: 'hat', emoji: '🎩', price: 50, name: t('Şlyapa', 'Шляпа', 'Top hat') },
  { id: 'medal', emoji: '🏅', price: 70, name: t('Medal', 'Медаль', 'Medal') },
  { id: 'crown', emoji: '👑', price: 100, name: t('Tac', 'Корона', 'Crown') },
];
