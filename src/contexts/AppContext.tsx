'use client';

import { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';

// --- Types ---
export interface FocusSession {
  id: string;
  durationMinutes: number;
  completed: boolean;
  date: string; // YYYY-MM-DD
  timestamp: number;
}

interface AppSettings {
  darkOverlay: boolean;
  darkOverlayOpacity: number;
  autoplayScenes: boolean;
  notifications: boolean;
  zenMode: boolean;
  glassMode: boolean;
  strictMode: boolean;
}

interface AppState {
  favoriteSceneIds: string[];
  focusSessions: FocusSession[];
  totalTasksCompleted: number;
  todayTasksCompleted: number;
  todayTasksDate: string;
  streak: { current: number; lastActiveDate: string };
  settings: AppSettings;
  unlockedAchievements: string[];
  coins: number;
  petStatus: {
    hunger: number;
    happiness: number;
    lastFed: number;
    lastInteracted: number;
  };
  skills: Record<string, number>;
}

export interface AchievementDef {
  id: string;
  label: string;
  desc: string;
  icon: string;
  color: string;
}

const ACHIEVEMENT_DEFS: AchievementDef[] = [
  { id: 'first-focus', label: 'First Focus', desc: 'Complete your first focus session', icon: 'Flame', color: 'text-orange-400' },
  { id: 'five-tasks', label: '5 Tasks Done', desc: 'Complete 5 tasks total', icon: 'Target', color: 'text-blue-400' },
  { id: 'speed-demon', label: 'Speed Demon', desc: 'Complete 3 tasks in one day', icon: 'Zap', color: 'text-amber-400' },
  { id: 'streak-master', label: 'Streak Master', desc: 'Reach a 7-day streak', icon: 'Star', color: 'text-yellow-400' },
  { id: 'deep-focus', label: 'Deep Focus', desc: 'Complete a 60min+ session', icon: 'Brain', color: 'text-purple-400' },
  { id: 'consistent', label: 'Consistent', desc: 'Complete 30 tasks total', icon: 'TrendingUp', color: 'text-emerald-400' },
  { id: 'master-mind', label: 'Master Mind', desc: 'Reach Level 10', icon: 'Crown', color: 'text-yellow-500' },
];

// --- Level System ---
const BASE_XP = 1000; // XP needed for level 2
const XP_MULTIPLIER = 1.5; // XP scaling factor

export interface LevelInfo {
  level: number;
  title: string;
  currentXP: number;
  nextLevelXP: number;
  progress: number; // 0-100
}

function calculateLevel(xp: number): LevelInfo {
  let level = 1;
  let xpForNext = BASE_XP;
  let xpForCurrent = 0;

  // Simple geometric progression for levels
  // Lv 1: 0-1000
  // Lv 2: 1000-2500 (1500 gap)
  // Lv 3: 2500-4750 (2250 gap)
  while (xp >= xpForNext) {
    level++;
    const gap = (xpForNext - xpForCurrent) * XP_MULTIPLIER;
    xpForCurrent = xpForNext;
    xpForNext = Math.floor(xpForCurrent + gap);
  }

  const titles = [
    'Novice', 'Beginner', 'Apprentice', 'Initiate', 'Adept',
    'Scholar', 'Expert', 'Master', 'Grandmaster', 'Legend', 'Divine'
  ];
  const title = titles[Math.min(level - 1, titles.length - 1)] || 'Cosmic Entity';

  return {
    level,
    title,
    currentXP: xp,
    nextLevelXP: xpForNext,
    progress: Math.min(100, Math.max(0, ((xp - xpForCurrent) / (xpForNext - xpForCurrent)) * 100))
  };
}

// --- Achievement condition checkers ---
function checkAchievementCondition(id: string, state: AppState): boolean {
  switch (id) {
    case 'first-focus': return state.focusSessions.filter(s => s.completed).length >= 1;
    case 'five-tasks': return state.totalTasksCompleted >= 5;
    case 'speed-demon': return state.todayTasksCompleted >= 3;
    case 'streak-master': return state.streak.current >= 7;
    case 'deep-focus': return state.focusSessions.some(s => s.completed && s.durationMinutes >= 60);
    case 'consistent': return state.totalTasksCompleted >= 30;
    // We need to calculate XP here to check level, but 'state' doesn't store computed XP.
    // Ideally, we pass the calculated level into this function or compute XP on the fly.
    // For simplicity, let's rely on the recordTask/recordSession to check this separately or approximate.
    // Actually, let's check level via XP calculation:
    case 'master-mind': {
      const totalFocusMins = state.focusSessions.filter(s => s.completed).reduce((sum, s) => sum + s.durationMinutes, 0);
      const xp = (totalFocusMins * 10) + (state.totalTasksCompleted * 100);
      return calculateLevel(xp).level >= 10;
    }
    default: return false;
  }
}

// --- Defaults ---
const today = () => new Date().toISOString().split('T')[0];

const DEFAULT_STATE: AppState = {
  favoriteSceneIds: [],
  focusSessions: [],
  totalTasksCompleted: 0,
  todayTasksCompleted: 0,
  todayTasksDate: today(),
  streak: { current: 0, lastActiveDate: '' },
  settings: { darkOverlay: false, darkOverlayOpacity: 40, autoplayScenes: true, notifications: false, zenMode: false, glassMode: false, strictMode: false },
  unlockedAchievements: [],
  coins: 0,
  petStatus: {
    hunger: 100,
    happiness: 100,
    lastFed: Date.now(),
    lastInteracted: Date.now(),
  },
  skills: { focus: 0, endurance: 0, consistency: 0 },
};

const STORAGE_KEY = 'beeziee-app-state';

function loadState(): AppState {
  if (typeof window === 'undefined') return DEFAULT_STATE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_STATE,
      ...parsed,
      settings: { ...DEFAULT_STATE.settings, ...parsed?.settings },
      streak: { ...DEFAULT_STATE.streak, ...parsed?.streak },
      petStatus: { ...DEFAULT_STATE.petStatus, ...parsed?.petStatus },
      skills: { ...DEFAULT_STATE.skills, ...parsed?.skills }
    };
  } catch { return DEFAULT_STATE; }
}

function saveState(state: AppState) {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { }
}

// --- Context ---
interface AppContextType {
  state: AppState;
  toggleFavoriteScene: (sceneId: string) => void;
  isFavoriteScene: (sceneId: string) => boolean;
  recordFocusSession: (durationMinutes: number) => void;
  failFocusSession: (durationMinutes: number) => void;
  recordTaskCompletion: () => void;
  updateSettings: (partial: Partial<AppSettings>) => void;
  achievements: (AchievementDef & { unlocked: boolean })[];
  getTodayFocusMinutes: () => number;
  getWeeklyAverage: () => number;
  toggleZenMode: () => void;
  levelInfo: LevelInfo;
  feedPet: () => void;
  interactPet: () => void;
  spendCoins: (amount: number) => boolean;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(DEFAULT_STATE);
  const [initialized, setInitialized] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const loaded = loadState();
    // Reset today counters if date changed
    if (loaded.todayTasksDate !== today()) {
      loaded.todayTasksCompleted = 0;
      loaded.todayTasksDate = today();
    }
    setState(loaded);
    setInitialized(true);
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    if (initialized) saveState(state);
  }, [state, initialized]);

  // Apply glass mode CSS variable
  useEffect(() => {
    const root = document.documentElement;
    if (state.settings.glassMode) {
      root.style.setProperty('--glass-bg', 'var(--glass-bg-transparent, rgba(255,255,255,0.05))');
    } else {
      root.style.removeProperty('--glass-bg');
    }
  }, [state.settings.glassMode]);

  // --- Streak logic ---
  const updateStreak = useCallback((current: AppState): AppState['streak'] => {
    const t = today();
    const { lastActiveDate, current: cur } = current.streak;
    if (lastActiveDate === t) return current.streak; // already active today
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    if (lastActiveDate === yesterdayStr) return { current: cur + 1, lastActiveDate: t };
    return { current: 1, lastActiveDate: t }; // streak broken, start fresh
  }, []);

  // --- Check achievements ---
  const checkAndUnlock = useCallback((s: AppState): string[] => {
    const newUnlocked = [...s.unlockedAchievements];
    for (const def of ACHIEVEMENT_DEFS) {
      if (!newUnlocked.includes(def.id) && checkAchievementCondition(def.id, s)) {
        newUnlocked.push(def.id);
      }
    }
    return newUnlocked;
  }, []);

  // --- Pet Mechanics ---
  const calculatePetDecay = (petStatus: AppState['petStatus']) => {
    const now = Date.now();
    const hoursSinceFed = (now - petStatus.lastFed) / (1000 * 60 * 60);
    const hoursSinceInt = (now - petStatus.lastInteracted) / (1000 * 60 * 60);

    return {
      hunger: Math.max(0, petStatus.hunger - hoursSinceFed * 5), // Lose 5 hunger per hour
      happiness: Math.max(0, petStatus.happiness - hoursSinceInt * 5),
    };
  };

  const feedPet = useCallback(() => {
    setState(prev => {
      if (prev.coins < 10) return prev; // Costs 10 coins to feed
      return {
        ...prev,
        coins: prev.coins - 10,
        petStatus: { ...prev.petStatus, hunger: Math.min(100, prev.petStatus.hunger + 30), lastFed: Date.now() }
      };
    });
  }, []);

  const interactPet = useCallback(() => {
    setState(prev => ({
      ...prev,
      petStatus: { ...prev.petStatus, happiness: Math.min(100, prev.petStatus.happiness + 20), lastInteracted: Date.now() }
    }));
  }, []);

  const spendCoins = useCallback((amount: number) => {
    let success = false;
    setState(prev => {
      if (prev.coins >= amount) {
        success = true;
        return { ...prev, coins: prev.coins - amount };
      }
      return prev;
    });
    return success;
  }, []);

  // --- Actions ---
  const toggleFavoriteScene = useCallback((sceneId: string) => {
    setState(prev => {
      const ids = prev.favoriteSceneIds.includes(sceneId)
        ? prev.favoriteSceneIds.filter(id => id !== sceneId)
        : [...prev.favoriteSceneIds, sceneId];
      return { ...prev, favoriteSceneIds: ids };
    });
  }, []);

  const isFavoriteScene = useCallback((sceneId: string) => {
    return state.favoriteSceneIds.includes(sceneId);
  }, [state.favoriteSceneIds]);

  const recordFocusSession = useCallback((durationMinutes: number) => {
    setState(prev => {
      const session: FocusSession = {
        id: Date.now().toString(),
        durationMinutes,
        completed: true,
        date: today(),
        timestamp: Date.now(),
      };
      const decayedPet = calculatePetDecay(prev.petStatus);
      const next = {
        ...prev,
        focusSessions: [...prev.focusSessions, session],
        streak: updateStreak(prev),
        coins: prev.coins + durationMinutes, // 1 min = 1 coin
        petStatus: {
          ...prev.petStatus,
          hunger: decayedPet.hunger,
          happiness: Math.min(100, decayedPet.happiness + (durationMinutes / 5)), // Boost happiness
        },
        skills: {
          ...prev.skills,
          focus: (prev.skills.focus || 0) + durationMinutes * 10,
          endurance: (prev.skills.endurance || 0) + (durationMinutes >= 60 ? 500 : 0)
        }
      };
      next.unlockedAchievements = checkAndUnlock(next);
      return next;
    });
  }, [updateStreak, checkAndUnlock]);

  const failFocusSession = useCallback((durationMinutes: number) => {
    setState(prev => {
      const session: FocusSession = {
        id: Date.now().toString(),
        durationMinutes,
        completed: false,
        date: today(),
        timestamp: Date.now(),
      };

      // Strict Mode penalty: Break the streak by resetting it
      const brokenStreak = { current: 0, lastActiveDate: '' };

      return {
        ...prev,
        focusSessions: [...prev.focusSessions, session],
        streak: brokenStreak,
      };
    });
  }, []);

  const recordTaskCompletion = useCallback(() => {
    setState(prev => {
      const t = today();
      const todayCount = prev.todayTasksDate === t ? prev.todayTasksCompleted + 1 : 1;
      const next = {
        ...prev,
        totalTasksCompleted: prev.totalTasksCompleted + 1,
        todayTasksCompleted: todayCount,
        todayTasksDate: t,
        streak: updateStreak(prev),
        coins: prev.coins + 5, // Task reward
        skills: {
          ...prev.skills,
          consistency: (prev.skills.consistency || 0) + 50
        }
      };
      next.unlockedAchievements = checkAndUnlock(next);
      return next;
    });
  }, [updateStreak, checkAndUnlock]);

  const updateSettings = useCallback((partial: Partial<AppSettings>) => {
    setState(prev => ({ ...prev, settings: { ...prev.settings, ...partial } }));
  }, []);

  const toggleZenMode = useCallback(() => {
    setState(prev => ({
      ...prev,
      settings: { ...prev.settings, zenMode: !prev.settings.zenMode }
    }));
  }, []);

  // --- Computed ---
  const achievements = useMemo(() =>
    ACHIEVEMENT_DEFS.map(def => ({ ...def, unlocked: state.unlockedAchievements.includes(def.id) })),
    [state.unlockedAchievements]
  );

  const getTodayFocusMinutes = useCallback(() => {
    const t = today();
    return state.focusSessions.filter(s => s.date === t && s.completed).reduce((sum, s) => sum + s.durationMinutes, 0);
  }, [state.focusSessions]);

  const getWeeklyAverage = useCallback(() => {
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekStr = weekAgo.toISOString().split('T')[0];
    const weekSessions = state.focusSessions.filter(s => s.date >= weekStr && s.completed);
    const totalMins = weekSessions.reduce((sum, s) => sum + s.durationMinutes, 0);
    return Math.round(totalMins / 7);
  }, [state.focusSessions]);

  const levelInfo = useMemo(() => {
    const totalFocusMins = state.focusSessions.filter(s => s.completed).reduce((sum, s) => sum + s.durationMinutes, 0);
    const xp = (totalFocusMins * 10) + (state.totalTasksCompleted * 100);
    return calculateLevel(xp);
  }, [state.focusSessions, state.totalTasksCompleted]);

  const value = useMemo<AppContextType>(() => ({
    state,
    toggleFavoriteScene,
    isFavoriteScene,
    recordFocusSession,
    failFocusSession,
    recordTaskCompletion,
    updateSettings,
    achievements,
    getTodayFocusMinutes,
    getWeeklyAverage,
    toggleZenMode,
    levelInfo,
    feedPet,
    interactPet,
    spendCoins,
  }), [state, toggleFavoriteScene, isFavoriteScene, recordFocusSession, failFocusSession, recordTaskCompletion, updateSettings, achievements, getTodayFocusMinutes, getWeeklyAverage, toggleZenMode, levelInfo, feedPet, interactPet, spendCoins]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
