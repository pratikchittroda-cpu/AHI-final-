/** Supporting content: daily rhythm, guidance, Agni-type check, landing copy. */
import type { ModuleId } from './modules';

export const SHLOKA = {
  sanskrit: 'समदोषः समाग्निश्च समधातुमलक्रियः ।\nप्रसन्नात्मेन्द्रियमनाः स्वस्थ इत्यभिधीयते ॥',
  english:
    'One whose doṣas, digestive fire, tissues and eliminations are in balance, and whose self, senses and mind are content — is called healthy.',
  source: 'Suśruta Saṃhitā · Sūtrasthāna 15.41',
};

export const DISCLAIMER =
  'AHI is a wellness screening, not a medical diagnosis. If you have symptoms that worry you, please see a qualified doctor or Vaidya.';

export interface Kala {
  from: number;
  to: number;
  dosha: 'Vāta' | 'Pitta' | 'Kapha';
  tip: string;
  short: string;
}

/** Six kālas of the day — each ruled by a doṣa. */
export const KALAS: Kala[] = [
  { from: 2, to: 6, dosha: 'Vāta', tip: 'Brahma muhūrta — rise, sit quietly, breathe.', short: 'Rise and sit quietly before dawn' },
  { from: 6, to: 10, dosha: 'Kapha', tip: 'Move your body and keep breakfast light.', short: 'Move the body, light breakfast' },
  { from: 10, to: 14, dosha: 'Pitta', tip: 'Main meal of the day — Agni is strongest.', short: 'Main meal — digestion is strongest' },
  { from: 14, to: 18, dosha: 'Vāta', tip: 'Creative, focused work; sip warm water.', short: 'Creative work, warm drinks' },
  { from: 18, to: 22, dosha: 'Kapha', tip: 'Wind down. Screens off by 21:30 and in bed by 22:00.', short: 'Light dinner and wind down' },
  { from: 22, to: 26, dosha: 'Pitta', tip: 'Deep sleep — the body repairs and digests.', short: 'Deep sleep while the body repairs' },
];

export function currentKala(date = new Date()): Kala {
  const h = date.getHours() + date.getMinutes() / 60;
  const hh = h < 2 ? h + 24 : h;
  return KALAS.find((k) => hh >= k.from && hh < k.to) ?? KALAS[4];
}

/** Position of "now" across the 02:00 → 02:00 kāla strip, 0–100. */
export function dayPosition(date = new Date()): number {
  const h = date.getHours() + date.getMinutes() / 60;
  return (((h < 2 ? h + 24 : h) - 2) / 24) * 100;
}

export interface RoutineItem {
  id: string;
  time: string;
  label: string;
  icon: string;
}

export const DEFAULT_ROUTINE: RoutineItem[] = [
  { id: 'wake', time: '06:00', label: 'Rise before sunrise', icon: 'sunny' },
  { id: 'tongue', time: '06:10', label: 'Tongue scraping and warm water', icon: 'water' },
  { id: 'abhyanga', time: '06:30', label: 'Abhyaṅga, 10 minutes', icon: 'leaf' },
  { id: 'lunch', time: '13:00', label: 'Main meal at midday', icon: 'restaurant' },
  { id: 'walk', time: '17:30', label: 'Evening walk', icon: 'walk' },
  { id: 'dinner', time: '19:30', label: 'Light dinner', icon: 'moon' },
  { id: 'sleep', time: '22:00', label: 'Screens off, in bed by 10 pm', icon: 'bed' },
];

export interface Tip {
  title: string;
  body: string;
}

/** Gentle, non-medical guidance shown for the lowest-scoring domains. */
const AGNI_TIPS: Tip[] = [
  { title: 'Make lunch the main meal', body: 'Digestion is strongest at midday. Keep dinner light, three hours before sleep.' },
  { title: 'Eat when truly hungry', body: 'Wait until the previous meal feels digested. Sip warm water rather than iced drinks.' },
];
const MALA_TIPS: Tip[] = [
  { title: 'A fixed morning time', body: 'Sit for the bowel at the same time each morning, after a glass of warm water. Never hold back natural urges.' },
  { title: 'Fibre, fluid and warmth', body: 'Cooked vegetables, a spoon of ghee and enough water through the day keep stools soft and regular.' },
];

export const GUIDANCE: Record<Exclude<ModuleId, 'prakriti'>, Tip[]> = {
  agni: AGNI_TIPS,
  nidra: [
    { title: 'Rest before ten', body: 'Warm milk with a pinch of nutmeg an hour before bed. Lights out by 22:00.' },
    { title: 'Same times, every night', body: 'Go to bed and wake at the same times, weekends included. Avoid long daytime naps.' },
  ],
  bala: [
    { title: 'Move at half capacity', body: 'Daily exercise to about half your strength (ardha-śakti) — brisk, steady, never exhausting.' },
    { title: 'Fresh, warm food', body: 'Favour freshly cooked meals at a comfortable temperature, and cut back on processed food.' },
  ],
  mala: MALA_TIPS,
  sara: [
    { title: 'Nourish every tissue', body: 'Wholesome meals with grains, pulses, milk or ghee build the dhātus over time, one after another.' },
    { title: 'Oil the body', body: 'A few minutes of warm-oil self-massage (abhyaṅga) before bathing nourishes skin and muscle.' },
  ],
  samhanana: [
    { title: 'Build endurance slowly', body: 'Walk, climb stairs or practise yoga a little more each week rather than all at once.' },
    { title: 'Respect the seasons', body: 'Dress and eat for the weather — warm in winter, cooling in summer — so the body is not strained.' },
  ],
  satmya: [
    { title: 'All six tastes', body: 'Include sweet, sour, salty, pungent, bitter and astringent foods across the day, not one taste only.' },
    { title: 'Eat with attention', body: 'Sit down, eat neither too fast nor too slow, and notice which foods leave you comfortable.' },
  ],
  sattva: [
    { title: 'Ten quiet minutes', body: 'A few minutes of prāṇāyāma, prayer or meditation each morning steadies the mind.' },
    { title: 'One thing at a time', body: 'Plan the day and finish one task before starting the next.' },
  ],
  vyadhi: [
    { title: 'Keep a steady rhythm', body: 'Regular sleep, meals and hygiene are the base of Bala and Ojas.' },
    { title: 'Recover fully', body: 'Rest well after illness before returning to full activity. If you fall ill often, see a Vaidya.' },
  ],
  'agni-detail': AGNI_TIPS,
  'mala-detail': MALA_TIPS,
};

export const GOALS = [
  { id: 'sleep', label: 'Deeper sleep', icon: 'moon' },
  { id: 'digest', label: 'Better digestion', icon: 'flame' },
  { id: 'calm', label: 'A calmer mind', icon: 'flower' },
  { id: 'energy', label: 'More energy', icon: 'flash' },
  { id: 'weight', label: 'Healthy weight', icon: 'body' },
  { id: 'immunity', label: 'Stronger immunity', icon: 'shield-checkmark' },
  { id: 'routine', label: 'Steady routine', icon: 'sunny' },
] as const;

export type GoalId = (typeof GOALS)[number]['id'];

export const DOSHAS = [
  { id: 'vata', name: 'Vāta', deva: 'वात', elements: 'Space · Air', color: '#5E7F86', dash: '2 4', text: 'Movement, breath and creativity. When disturbed: dryness, worry, irregular appetite and light sleep.' },
  { id: 'pitta', name: 'Pitta', deva: 'पित्त', elements: 'Fire · Water', color: '#9A7B34', dash: '6 3', text: 'Digestion, warmth and focus. When disturbed: acidity, irritability, inflamed skin and waking at night.' },
  { id: 'kapha', name: 'Kapha', deva: 'कफ', elements: 'Water · Earth', color: '#4E6B45', dash: '0', text: 'Structure, stamina and calm. When disturbed: heaviness, congestion, slow mornings and low drive.' },
];

export const HERBS = [
  { name: 'Tulasī', deva: 'तुलसी', latin: 'Ocimum tenuiflorum', text: 'Traditionally used to support breath and immunity.', bg: '#E9EEE3', leaves: 6, spread: 1 },
  { name: 'Aśvagandhā', deva: 'अश्वगन्धा', latin: 'Withania somnifera', text: 'Traditionally used for strength and restful sleep.', bg: '#DCE5D3', leaves: 5, spread: 1.25 },
  { name: 'Brāhmī', deva: 'ब्राह्मी', latin: 'Bacopa monnieri', text: 'Traditionally used for memory and a calm mind.', bg: '#E4E9DA', leaves: 7, spread: 0.7 },
  { name: 'Nimba', deva: 'निम्ब', latin: 'Azadirachta indica', text: 'Traditionally used for skin and to cool excess Pitta.', bg: '#D3DDC8', leaves: 7, spread: 0.85 },
];

/** "Additional classification of Agni type" from the AHI document. Yes / No answers. */
export const AGNI_TYPES = [
  {
    id: 'vishama', name: 'Viṣamāgni', dosha: 'Vāta',
    meaning: 'Irregular digestive fire — sometimes strong, sometimes weak.',
    items: ['My appetite varies greatly from day to day.', 'Sometimes digestion is good and sometimes poor.', 'Bloating and gas occur frequently.'],
    advice: 'Eat at fixed times, favour warm, cooked, lightly oily food, and avoid raw, cold and dry food.',
  },
  {
    id: 'tikshna', name: 'Tīkṣṇāgni', dosha: 'Pitta',
    meaning: 'Sharp digestive fire — intense hunger that burns quickly.',
    items: ['I become uncomfortable if meals are delayed.', 'I feel excessive hunger frequently.', 'I can digest large quantities of food rapidly.'],
    advice: 'Don’t skip or delay meals, favour cooling foods, and reduce very spicy, sour and fried food.',
  },
  {
    id: 'manda', name: 'Mandāgni', dosha: 'Kapha',
    meaning: 'Slow digestive fire — hunger builds slowly and food sits heavy.',
    items: ['Hunger develops slowly.', 'I often feel heaviness after meals.', 'Digestion takes a long time.'],
    advice: 'Eat only when truly hungry, keep meals light and warm, and use digestive spices like ginger.',
  },
  {
    id: 'sama', name: 'Samāgni', dosha: 'Balanced',
    meaning: 'Balanced digestive fire — the healthy state.',
    items: ['Hunger occurs regularly.', 'Digestion is comfortable.', 'Bowel habits are regular.', 'Energy remains stable.'],
    advice: 'Keep doing what you are doing — regular meals, moderate quantities, and a calm mind while eating.',
  },
];

export type AgniType = (typeof AGNI_TYPES)[number];
export interface AgniScored extends AgniType {
  yes: number;
  share: number;
}

export function classifyAgni(yesByKey: Record<string, boolean>): { primary: AgniScored | null; scored: AgniScored[] } {
  const scored = AGNI_TYPES.map((t) => {
    const yes = t.items.filter((_, i) => yesByKey[`${t.id}.${i}`]).length;
    return { ...t, yes, share: yes / t.items.length };
  });
  const best = Math.max(...scored.map((s) => s.share));
  if (best === 0) return { primary: null, scored };
  const top = scored.filter((s) => s.share === best);
  // If Samāgni ties with an imbalance type, report the imbalance — it is the actionable one.
  const nonSama = top.filter((t) => t.id !== 'sama');
  return { primary: nonSama[0] ?? top[0], scored };
}
