import React, { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { moduleById, type ModuleId } from '../data/modules';
import { completedCount, composite, isComplete, prakritiResult, scoreAll, type Answers, type PrakritiResult, type Scores } from '../lib/scoring';
import type { GoalId } from '../data/content';
import type { Lang } from '../i18n';
import { setAppLanguage } from '../i18n/data';
import { applyScriptFonts, loadScriptFonts } from '../i18n/fonts';

/**
 * App state, saved on the device with AsyncStorage (localStorage on web).
 * There is no backend: the profile is local and optional.
 */
// v2: the nine-domain question bank (answers from the five-tracker v1 bank are not compatible).
const KEY = 'ahi.v5.state.v2';
const today = () => new Date().toISOString().slice(0, 10);

export interface Profile {
  name: string;
  contact?: string;
  goals: GoalId[];
  wake: string;
}

export interface Snapshot {
  at: string;
  composite: number;
  scores: Scores;
}

interface Persisted {
  profile: Profile | null;
  answers: Answers; // completed attempts only
  drafts: Answers; // the attempt in progress, per module
  scores: Scores;
  history: Snapshot[]; // composite snapshots, newest first
  routine: { date: string; done: Record<string, boolean> };
  plan: Record<string, boolean>; // tips added from "This week, gently"
  agni: { id: string; name: string; at: string } | null;
  lang: Lang;
}

const initial: Persisted = {
  profile: null,
  answers: {},
  drafts: {},
  scores: {},
  history: [],
  routine: { date: today(), done: {} },
  plan: {},
  agni: null,
  lang: 'en',
};

interface AhiValue extends Persisted {
  ready: boolean;
  composite: number | null;
  completed: number;
  prakriti: PrakritiResult | null;
  fontsEpoch: number;
  setProfile: (p: Partial<Profile>) => void;
  signOut: () => void;
  setDraftAnswer: (moduleId: ModuleId, questionId: string, optionIndex: number) => void;
  discardDraft: (moduleId: ModuleId) => void;
  commitModule: (moduleId: ModuleId) => boolean;
  toggleRoutine: (id: string) => void;
  togglePlan: (id: string) => void;
  saveAgni: (agni: { id: string; name: string }) => void;
  setLang: (lang: Lang) => void;
  resetAll: () => Promise<void>;
}

const Ctx = createContext<AhiValue | null>(null);

export function AhiProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<Persisted>(initial);
  const [ready, setReady] = useState(false);
  // Bumped when a language's fonts finish loading, so every screen redraws in them.
  const [fontsEpoch, setFontsEpoch] = useState(0);
  // Latest state for commitModule, which must read the current draft synchronously.
  const stateRef = useRef(state);
  useLayoutEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Fetch the chosen script's fonts the first time a language is used.
  useEffect(() => {
    let alive = true;
    loadScriptFonts(state.lang)
      .then((fresh) => alive && fresh && setFontsEpoch((n) => n + 1))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [state.lang]);

  // Hydrate once on launch.
  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (!raw) return;
        const saved = JSON.parse(raw) as Partial<Persisted>;
        const merged: Persisted = { ...initial, ...saved };
        if (merged.routine.date !== today()) merged.routine = { date: today(), done: {} };
        merged.scores = scoreAll(merged.answers);
        setState(merged);
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  // Persist on every change (debounced).
  useEffect(() => {
    if (!ready) return undefined;
    const t = setTimeout(() => {
      AsyncStorage.setItem(KEY, JSON.stringify(state)).catch(() => {});
    }, 250);
    return () => clearTimeout(t);
  }, [state, ready]);

  const setProfile = useCallback((p: Partial<Profile>) => {
    setState((s) => ({ ...s, profile: { name: '', goals: [], wake: '06:00', ...s.profile, ...p } }));
  }, []);

  const signOut = useCallback(() => setState((s) => ({ ...s, profile: null })), []);

  const setDraftAnswer = useCallback((moduleId: ModuleId, questionId: string, optionIndex: number) => {
    setState((s) => ({
      ...s,
      drafts: { ...s.drafts, [moduleId]: { ...(s.drafts[moduleId] ?? {}), [questionId]: optionIndex } },
    }));
  }, []);

  const discardDraft = useCallback((moduleId: ModuleId) => {
    setState((s) => {
      const drafts = { ...s.drafts };
      delete drafts[moduleId];
      return { ...s, drafts };
    });
  }, []);

  /** Moves a finished draft into answers, rescoring the module and the composite. False if anything is unanswered. */
  const commitModule = useCallback((moduleId: ModuleId) => {
    const mod = moduleById(moduleId);
    const draft = stateRef.current.drafts[moduleId];
    if (!mod || !draft || !isComplete(mod, draft)) return false;
    setState((s) => {
      const answers = { ...s.answers, [moduleId]: draft };
      const drafts = { ...s.drafts };
      delete drafts[moduleId];
      const scores = scoreAll(answers);
      // Only an index domain changes the composite, so only those add a history snapshot.
      const c = mod.kind === 'index' ? composite(scores) : null;
      const history = c === null ? s.history : [{ at: new Date().toISOString(), composite: c, scores }, ...s.history].slice(0, 36);
      return { ...s, answers, drafts, scores, history };
    });
    return true;
  }, []);

  const toggleRoutine = useCallback((id: string) => {
    setState((s) => {
      const r = s.routine.date === today() ? s.routine : { date: today(), done: {} };
      return { ...s, routine: { ...r, done: { ...r.done, [id]: !r.done[id] } } };
    });
  }, []);

  const togglePlan = useCallback((id: string) => setState((s) => ({ ...s, plan: { ...s.plan, [id]: !s.plan[id] } })), []);

  const saveAgni = useCallback(
    (agni: { id: string; name: string }) => setState((s) => ({ ...s, agni: { ...agni, at: new Date().toISOString() } })),
    [],
  );

  const setLang = useCallback((lang: Lang) => setState((s) => ({ ...s, lang })), []);

  const resetAll = useCallback(async () => {
    await AsyncStorage.removeItem(KEY).catch(() => {});
    // Keep the chosen language: resetting data should not switch the app back to English.
    setState((s) => ({ ...initial, routine: { date: today(), done: {} }, lang: s.lang }));
  }, []);

  const value = useMemo<AhiValue>(
    () => ({
      ...state,
      ready,
      composite: composite(state.scores),
      completed: completedCount(state.scores),
      fontsEpoch,
      prakriti: prakritiResult(state.answers.prakriti),
      setProfile,
      signOut,
      setDraftAnswer,
      discardDraft,
      commitModule,
      toggleRoutine,
      togglePlan,
      saveAgni,
      setLang,
      resetAll,
    }),
    [state, ready, fontsEpoch, setProfile, signOut, setDraftAnswer, discardDraft, commitModule, toggleRoutine, togglePlan, saveAgni, setLang, resetAll],
  );

  // The language must be current before any screen renders its text.
  setAppLanguage(state.lang);
  applyScriptFonts(state.lang);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAhi(): AhiValue {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAhi must be used inside AhiProvider');
  return v;
}
