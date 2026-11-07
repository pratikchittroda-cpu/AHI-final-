import { t } from '../i18n';
import { MODULES, PRAKRITI, ALL_MODULES, type AhiModule, type DoshaId, type IndexId, type ModuleId } from '../data/modules';

/** answers[moduleId][questionId] = option index */
export type ModuleAnswers = Record<string, number>;
export type Answers = Partial<Record<ModuleId, ModuleAnswers>>;
export type Scores = Partial<Record<ModuleId, number>>;

export type BandKey = 'excellent' | 'good' | 'mild' | 'moderate' | 'severe';
export type Tone = 'good' | 'watch' | 'care';

export interface Band {
  key: BandKey;
  min: number;
  label: string;
  short: string;
  sanskrit: string;
  tone: Tone;
  text: string;
}

/** Interpretation bands from the AHI document (81–100 … 0–20). */
export const BANDS: Band[] = [
  { key: 'excellent', min: 81, label: 'Excellent', short: 'Excellent', sanskrit: 'Sama', tone: 'good', text: 'Well balanced. Keep your rhythm steady.' },
  { key: 'good', min: 61, label: 'Good', short: 'Good', sanskrit: 'Prāya Sama', tone: 'good', text: 'Mostly balanced, with a little room to steady your routine.' },
  { key: 'mild', min: 41, label: 'Mild Imbalance', short: 'Mild Imbalance', sanskrit: 'Alpa Vikṛti', tone: 'watch', text: 'A mild imbalance — gently reversible with a steady daily routine.' },
  { key: 'moderate', min: 21, label: 'Moderate Disturbance', short: 'Moderate Disturbance', sanskrit: 'Madhyama Vikṛti', tone: 'care', text: 'A noticeable disturbance. A daily routine helps; consider seeing a Vaidya.' },
  { key: 'severe', min: 0, label: 'Severe Disturbance', short: 'Severe Disturbance', sanskrit: 'Guru Vikṛti', tone: 'care', text: 'A significant disturbance. Please consult a qualified Vaidya or doctor.' },
];

/** The band for a score. A module with its own interpretation labels (the in-depth questionnaires) uses them. */
export function bandFor(score: number, mod?: AhiModule): Band {
  const s = Math.round(score);
  const i = Math.max(0, BANDS.findIndex((b) => s >= b.min));
  const band = BANDS[i];
  const own = mod?.bandLabels?.[i];
  return own ? { ...band, label: own, short: own } : band;
}

/** Lowest and highest possible raw sums for a module. */
export function bounds(mod: AhiModule) {
  let min = 0;
  let max = 0;
  for (const q of mod.questions) {
    const pts = q.options.map((o) => o.points);
    min += Math.min(...pts);
    max += Math.max(...pts);
  }
  return { min, max };
}

/** 0–100 from a raw sum between min and max. */
export function normalise(sum: number, min: number, max: number): number {
  return max === min ? 0 : Math.round(((sum - min) / (max - min)) * 100);
}

export function moduleProgress(mod: AhiModule, answers: ModuleAnswers = {}) {
  const answered = mod.questions.filter((q) => answers[q.id] !== undefined).length;
  return { answered, total: mod.questions.length, complete: answered === mod.questions.length };
}

export function isComplete(mod: AhiModule, answers: ModuleAnswers = {}): boolean {
  return mod.questions.every((q) => answers[q.id] !== undefined);
}

function rawSum(mod: AhiModule, answers: ModuleAnswers): number | null {
  let sum = 0;
  for (const q of mod.questions) {
    const idx = answers[q.id];
    if (idx === undefined || !q.options[idx]) return null;
    sum += q.options[idx].points;
  }
  return sum;
}

/** Score 0–100 for an index or in-depth module, or null until every question is answered. */
export function scoreModule(mod: AhiModule, answers: ModuleAnswers = {}): number | null {
  if (mod.kind === 'prakriti') return null;
  const sum = rawSum(mod, answers);
  if (sum === null) return null;
  const { min, max } = bounds(mod);
  return normalise(sum, min, max);
}

/** In-depth questionnaires: a 0–100 score for each domain, with its raw points. */
export function domainScores(mod: AhiModule, answers: ModuleAnswers = {}) {
  const map = new Map<string, { sum: number; min: number; max: number }>();
  for (const q of mod.questions) {
    const key = q.domain ?? q.section ?? mod.en;
    const pts = q.options.map((o) => o.points);
    const cur = map.get(key) ?? { sum: 0, min: 0, max: 0 };
    const idx = answers[q.id];
    cur.sum += idx === undefined ? 0 : q.options[idx].points;
    cur.min += Math.min(...pts);
    cur.max += Math.max(...pts);
    map.set(key, cur);
  }
  return [...map.entries()].map(([domain, v]) => ({ domain, raw: v.sum, max: v.max, score: normalise(v.sum, v.min, v.max) }));
}

export function scoreAll(answers: Answers): Scores {
  const out: Scores = {};
  ALL_MODULES.forEach((m) => {
    const s = scoreModule(m, answers[m.id]);
    if (s !== null) out[m.id] = s;
  });
  return out;
}

/** Composite AHI across the nine index domains; null until all nine are scored. */
export function composite(scores: Scores): number | null {
  let total = 0;
  for (const m of MODULES) {
    const s = scores[m.id];
    if (s === undefined) return null;
    total += s * (m.weight ?? 1 / MODULES.length);
  }
  return Math.round(total);
}

/** How many of the nine index domains are scored. */
export function completedCount(scores: Scores): number {
  return MODULES.filter((m) => scores[m.id] !== undefined).length;
}

/** The lowest-scoring index domains, for gentle guidance. */
export function weakest(scores: Scores, n = 2): IndexId[] {
  return MODULES.filter((m) => scores[m.id] !== undefined)
    .sort((a, b) => (scores[a.id] ?? 0) - (scores[b.id] ?? 0))
    .slice(0, n)
    .map((m) => m.id as IndexId);
}

/* ------------------------------------------------------------------ */
/* Prakṛti                                                             */
/* ------------------------------------------------------------------ */
export interface PrakritiResult {
  shares: Record<DoshaId, number>; // percentage of the total, sums to 100
  raw: Record<DoshaId, number>; // 9–36 each
  leading: DoshaId[]; // one doṣa, two (dual) or three (balanced)
  name: string; // e.g. "Vāta", "Vāta–Pitta", "Sama (balanced)"
}

export const DOSHA_NAME: Record<DoshaId, string> = { vata: 'Vāta', pitta: 'Pitta', kapha: 'Kapha' };

/**
 * Prakṛti from the 27 trait questions: each doṣa's points (9–36) as a share of
 * the total. A doṣa within 5 points of the leading share counts as co-leading.
 */
export function prakritiResult(answers: ModuleAnswers = {}): PrakritiResult | null {
  if (!isComplete(PRAKRITI, answers)) return null;
  const raw: Record<DoshaId, number> = { vata: 0, pitta: 0, kapha: 0 };
  for (const q of PRAKRITI.questions) {
    if (q.dosha) raw[q.dosha] += q.options[answers[q.id]].points;
  }
  const total = raw.vata + raw.pitta + raw.kapha;
  const ids: DoshaId[] = ['vata', 'pitta', 'kapha'];
  const pct = ids.map((id) => (raw[id] / total) * 100);
  const shares = { vata: Math.round(pct[0]), pitta: Math.round(pct[1]), kapha: 0 } as Record<DoshaId, number>;
  shares.kapha = 100 - shares.vata - shares.pitta;
  const sorted = [...ids].sort((a, b) => raw[b] - raw[a]);
  const top = (raw[sorted[0]] / total) * 100;
  const leading = sorted.filter((id) => top - (raw[id] / total) * 100 < 5);
  const name = leading.length === 3 ? t('Sama (balanced)') : leading.map((id) => DOSHA_NAME[id]).join('–');
  return { shares, raw, leading, name };
}
