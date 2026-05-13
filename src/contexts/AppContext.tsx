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

type ChestType = 'common' | 'rare';
type FoodType = 'basicSnack' | 'focusBerry';
type OwnedPetType = string;
type DailyQuestType = 'focusMinutes' | 'completeTasks' | 'feedPet';

interface DailyQuestReward {
  coins?: number;
  commonChests?: number;
  rareChests?: number;
  basicSnack?: number;
  focusBerry?: number;
  petXp?: number;
}

interface DailyQuest {
  id: string;
  type: DailyQuestType;
  label: string;
  target: number;
  progress: number;
  claimed: boolean;
  reward: DailyQuestReward;
}

interface LevelUpEvent {
  id: string;
  petId: string;
  petType: string;
  level: number;
  timestamp: number;
}

interface ChestOpeningEvent {
  id: string;
  type: ChestType;
  coinReward: number;
  basicSnackReward: number;
  focusBerryReward: number;
  unlockedPetType?: string;
  unlockedSkinPetType?: string;
  unlockedSkin?: string;
  timestamp: number;
}

interface PetGrowthStats {
  focus: number;
  consistency: number;
  endurance: number;
}

interface OwnedPet {
  id: string;
  type: OwnedPetType;
  skin?: string;
  ownedSkins: string[];
  unlockedAt: number;
  source: 'starter' | 'commonChest' | 'rareChest';
  level: number;
  xp: number;
  hunger: number;
  happiness: number;
  stats: PetGrowthStats;
}

interface RewardEvent {
  id: string;
  label: string;
  detail: string;
  timestamp: number;
}

interface InventoryState {
  chests: Record<ChestType, number>;
  food: Record<FoodType, number>;
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
  inventory: InventoryState;
  rewardEvents: RewardEvent[];
  ownedPets: OwnedPet[];
  activePetId: string | null;
  dailyQuestsDate: string;
  dailyQuests: DailyQuest[];
  levelUpEvents: LevelUpEvent[];
  chestOpeningEvents: ChestOpeningEvent[];
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

const DEFAULT_PET_STATS: PetGrowthStats = { focus: 0, consistency: 0, endurance: 0 };

function withPetGrowthDefaults(pet: Pick<OwnedPet, 'id' | 'type' | 'unlockedAt' | 'source'> & Partial<OwnedPet>): OwnedPet {
  const xp = pet.xp ?? 0;
  const ownedSkins = Array.from(new Set([...(pet.ownedSkins ?? []), ...(pet.skin ? [pet.skin] : [])]));
  return {
    ...pet,
    ownedSkins,
    level: pet.level ?? calculateLevel(xp).level,
    xp,
    hunger: pet.hunger ?? 100,
    happiness: pet.happiness ?? 100,
    stats: { ...DEFAULT_PET_STATS, ...pet.stats },
  };
}

function addPetGrowth(
  pet: OwnedPet,
  changes: { xp?: number; hunger?: number; happiness?: number; stats?: Partial<PetGrowthStats> }
): OwnedPet {
  const xp = pet.xp + (changes.xp ?? 0);
  return {
    ...pet,
    xp,
    level: calculateLevel(xp).level,
    hunger: Math.min(100, Math.max(0, pet.hunger + (changes.hunger ?? 0))),
    happiness: Math.min(100, Math.max(0, pet.happiness + (changes.happiness ?? 0))),
    stats: {
      focus: pet.stats.focus + (changes.stats?.focus ?? 0),
      consistency: pet.stats.consistency + (changes.stats?.consistency ?? 0),
      endurance: pet.stats.endurance + (changes.stats?.endurance ?? 0),
    },
  };
}

const STARTER_PETS: OwnedPet[] = [
  withPetGrowthDefaults({ id: 'starter-dog', type: 'dog', skin: 'akita', unlockedAt: 0, source: 'starter' }),
  withPetGrowthDefaults({ id: 'starter-fox', type: 'fox', skin: 'red', unlockedAt: 0, source: 'starter' }),
];

const COMMON_PET_UNLOCK_POOL: OwnedPetType[] = ['panda', 'turtle', 'crab', 'chicken', 'rat'];
const RARE_PET_UNLOCK_POOL: OwnedPetType[] = [
  'cat', 'horse', 'totoro', 'cockatiel', 'skeleton', 'tanjiro', 'nezuko', 'shinobu', 'akaza',
  'ayaka', 'furina-genshin', 'furina', 'hilichurl-qiuqiuren', 'hu-tao', 'hu-tao-pet', 'hutao', 'keqing', 'klee',
  'lumine', 'nahida', 'paimon', 'rich-paimon', 'sandrone-marionette', 'shogun-dango', 'witch-klee', 'yoimiya',
  'arona-v1', 'atsuko-maid', 'frieren', 'makima', 'makima-the-control-devil', 'miko-serika',
  'plana', 'powerpet', 'reze', 'shiroko', 'yuuka',
  'blood-oath-asuna', 'broom-witch', 'chopper', 'chu-totoro', 'deku', 'gaara', 'gojo-satoru',
  'himiko', 'itachi', 'kid-goku-classic-actions', 'kirito', 'luffy-dressrosa-gear5', 'luffy-gear-5',
  'merry', 'nimbus', 'ninja-naru', 'sukuna', 'tiny-luffy', 'undine-asuna', 'yuji-itadori', 'yuuki-asuna',
  'aladin', 'albedo-real-comic', 'alien-x-pet', 'anya', 'apupepe', 'artoria-classic',
  'asterix', 'azuma', 'barbatos-rex', 'builder-pepe', 'chef', 'chispa',
  'clarry', 'claw-d', 'conan', 'crazy-frog', 'crimson-angel', 'custom-pet-18397bfb',
  'dario', 'dark-stewie', 'diana', 'dictator-mbappe', 'dobby', 'dudu-bubu',
  'endminguga', 'epstein', 'eren', 'feixue', 'freedom-mecha', 'fu',
  'gopher', 'grogu-jedi', 'grogu-kid', 'gutsy', 'hanabi', 'home-lander',
  'hornet', 'jack-the-drunk', 'jin-woo', 'jiyi', 'kdb-city', 'kia-mhalifa',
  'kingcr', 'kirby', 'kratos', 'labubu', 'liuying-swimsuit', 'mini-devil',
  'mini-sama', 'miss-minute', 'money-crab', 'moon-duo', 'mr-bean', 'muskie',
  'nezha-kid', 'noa', 'palantir-patrick', 'patch', 'pet-reference-robot', 'r2-vader',
  'rick', 'savage-codex-hacker', 'senku', 'shou-er-jiang', 'sonic-v2', 'sparklet',
  'spyfam-yor', 'starjotaro', 'sullyoon-meov', 'sun-wukong', 'teemo', 'the-knight',
  'trump', 'tuxterm', 'ultramarine', 'umaru', 'usagi', 'violet',
  'wojak-pet', 'xiaoba', 'xxxtentacion', 'zhenxun',
];
const PET_SKIN_UNLOCK_POOLS: Record<string, string[]> = {
  dog: ['akita', 'black', 'brown', 'red', 'white'],
  fox: ['red', 'white'],
  panda: ['black', 'brown'],
  turtle: ['green', 'orange'],
  rat: ['brown', 'gray', 'white'],
  horse: ['black', 'brown', 'magical', 'white'],
  skeleton: ['blue', 'brown', 'green', 'orange', 'pink', 'purple', 'red', 'white', 'yellow'],
  tanjiro: ['tanjiro'],
  nezuko: ['midouzi'],
  shinobu: ['shinobu'],
  akaza: ['akaza'],
  ayaka: ['ayaka'],
  'furina-genshin': ['furina-genshin'],
  furina: ['furina'],
  'hilichurl-qiuqiuren': ['hilichurl-qiuqiuren'],
  'hu-tao': ['hu-tao'],
  'hu-tao-pet': ['hu-tao-pet'],
  hutao: ['hutao'],
  keqing: ['keqing'],
  klee: ['klee'],
  lumine: ['lumine'],
  nahida: ['nahida'],
  paimon: ['paimon'],
  'rich-paimon': ['rich-paimon'],
  'sandrone-marionette': ['sandrone-marionette'],
  'shogun-dango': ['shogun-dango'],
  'witch-klee': ['witch-klee'],
  yoimiya: ['yoimiya'],
  'arona-v1': ['arona-v1'],
  'atsuko-maid': ['atsuko-maid'],
  frieren: ['frieren'],
  makima: ['makima'],
  'makima-the-control-devil': ['makima-the-control-devil'],
  'miko-serika': ['miko-serika'],
  plana: ['plana'],
  powerpet: ['powerpet'],
  reze: ['reze'],
  shiroko: ['shiroko'],
  yuuka: ['yuuka'],
  'blood-oath-asuna': ['blood-oath-asuna'],
  'broom-witch': ['broom-witch'],
  chopper: ['chopper'],
  'chu-totoro': ['chu-totoro'],
  deku: ['deku'],
  gaara: ['gaara'],
  'gojo-satoru': ['gojo-satoru'],
  himiko: ['himiko'],
  itachi: ['itachi'],
  'kid-goku-classic-actions': ['kid-goku-classic-actions'],
  kirito: ['kirito'],
  'luffy-dressrosa-gear5': ['luffy-dressrosa-gear5'],
  'luffy-gear-5': ['luffy-gear-5'],
  merry: ['merry'],
  nimbus: ['nimbus'],
  'ninja-naru': ['ninja-naru'],
  sukuna: ['sukuna'],
  'tiny-luffy': ['tiny-luffy'],
  'undine-asuna': ['undine-asuna'],
  'yuji-itadori': ['yuji-itadori'],
  'yuuki-asuna': ['yuuki-asuna'],
  aladin: ['aladin'],
  'albedo-real-comic': ['albedo-real-comic'],
  'alien-x-pet': ['alien-x-pet'],
  anya: ['anya'],
  apupepe: ['apupepe'],
  'artoria-classic': ['artoria-classic'],
  asterix: ['asterix'],
  azuma: ['azuma'],
  'barbatos-rex': ['barbatos-rex'],
  'builder-pepe': ['builder-pepe'],
  chef: ['chef'],
  chispa: ['chispa'],
  clarry: ['clarry'],
  'claw-d': ['claw-d'],
  conan: ['conan'],
  'crazy-frog': ['crazy-frog'],
  'crimson-angel': ['crimson-angel'],
  'custom-pet-18397bfb': ['custom-pet-18397bfb'],
  dario: ['dario'],
  'dark-stewie': ['dark-stewie'],
  diana: ['diana'],
  'dictator-mbappe': ['dictator-mbappe'],
  dobby: ['dobby'],
  'dudu-bubu': ['dudu-bubu'],
  endminguga: ['endminguga'],
  epstein: ['epstein'],
  eren: ['eren'],
  feixue: ['feixue'],
  'freedom-mecha': ['freedom-mecha'],
  fu: ['fu'],
  gopher: ['gopher'],
  'grogu-jedi': ['grogu-jedi'],
  'grogu-kid': ['grogu-kid'],
  gutsy: ['gutsy'],
  hanabi: ['hanabi'],
  'home-lander': ['home-lander'],
  hornet: ['hornet'],
  'jack-the-drunk': ['jack-the-drunk'],
  'jin-woo': ['jin-woo'],
  jiyi: ['jiyi'],
  'kdb-city': ['kdb-city'],
  'kia-mhalifa': ['kia-mhalifa'],
  kingcr: ['kingcr'],
  kirby: ['kirby'],
  kratos: ['kratos'],
  labubu: ['labubu'],
  'liuying-swimsuit': ['liuying-swimsuit'],
  'mini-devil': ['mini-devil'],
  'mini-sama': ['mini-sama'],
  'miss-minute': ['miss-minute'],
  'money-crab': ['money-crab'],
  'moon-duo': ['moon-duo'],
  'mr-bean': ['mr-bean'],
  muskie: ['muskie'],
  'nezha-kid': ['nezha-kid'],
  noa: ['noa'],
  'palantir-patrick': ['palantir-patrick'],
  patch: ['patch'],
  'pet-reference-robot': ['pet-reference-robot'],
  'r2-vader': ['r2-vader'],
  rick: ['rick'],
  'savage-codex-hacker': ['savage-codex-hacker'],
  senku: ['senku'],
  'shou-er-jiang': ['shou-er-jiang'],
  'sonic-v2': ['sonic-v2'],
  sparklet: ['sparklet'],
  'spyfam-yor': ['spyfam-yor'],
  starjotaro: ['starjotaro'],
  'sullyoon-meov': ['sullyoon-meov'],
  'sun-wukong': ['sun-wukong'],
  teemo: ['teemo'],
  'the-knight': ['the-knight'],
  trump: ['trump'],
  tuxterm: ['tuxterm'],
  ultramarine: ['ultramarine'],
  umaru: ['umaru'],
  usagi: ['usagi'],
  violet: ['violet'],
  'wojak-pet': ['wojak-pet'],
  xiaoba: ['xiaoba'],
  xxxtentacion: ['xxxtentacion'],
  zhenxun: ['zhenxun'],
};

function createDailyQuests(date: string): DailyQuest[] {
  return [
    {
      id: `${date}-focus`,
      type: 'focusMinutes',
      label: 'Focus for 25 minutes',
      target: 25,
      progress: 0,
      claimed: false,
      reward: { coins: 20, commonChests: 1 },
    },
    {
      id: `${date}-tasks`,
      type: 'completeTasks',
      label: 'Complete 2 tasks',
      target: 2,
      progress: 0,
      claimed: false,
      reward: { coins: 15, basicSnack: 1 },
    },
    {
      id: `${date}-feed`,
      type: 'feedPet',
      label: 'Feed a pet',
      target: 1,
      progress: 0,
      claimed: false,
      reward: { coins: 10, focusBerry: 1 },
    },
  ];
}

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
  inventory: {
    chests: { common: 0, rare: 0 },
    food: { basicSnack: 0, focusBerry: 0 },
  },
  rewardEvents: [],
  ownedPets: STARTER_PETS,
  activePetId: STARTER_PETS[0].id,
  dailyQuestsDate: today(),
  dailyQuests: createDailyQuests(today()),
  levelUpEvents: [],
  chestOpeningEvents: [],
};

const STORAGE_KEY = 'beeziee-app-state';

function loadState(): AppState {
  if (typeof window === 'undefined') return DEFAULT_STATE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw);
    const ownedPets = Array.isArray(parsed?.ownedPets) && parsed.ownedPets.length > 0
      ? parsed.ownedPets.map((pet: OwnedPet) => withPetGrowthDefaults(pet))
      : DEFAULT_STATE.ownedPets;
    const activePetId = ownedPets.some((pet: OwnedPet) => pet.id === parsed?.activePetId)
      ? parsed.activePetId
      : ownedPets[0]?.id ?? null;
    const currentDate = today();
    const dailyQuestsDate = parsed?.dailyQuestsDate === currentDate ? currentDate : currentDate;
    const dailyQuests = parsed?.dailyQuestsDate === currentDate && Array.isArray(parsed?.dailyQuests)
      ? parsed.dailyQuests
      : createDailyQuests(currentDate);

    return {
      ...DEFAULT_STATE,
      ...parsed,
      settings: { ...DEFAULT_STATE.settings, ...parsed?.settings },
      streak: { ...DEFAULT_STATE.streak, ...parsed?.streak },
      petStatus: { ...DEFAULT_STATE.petStatus, ...parsed?.petStatus },
      skills: { ...DEFAULT_STATE.skills, ...parsed?.skills },
      inventory: {
        chests: { ...DEFAULT_STATE.inventory.chests, ...parsed?.inventory?.chests },
        food: { ...DEFAULT_STATE.inventory.food, ...parsed?.inventory?.food },
      },
      rewardEvents: Array.isArray(parsed?.rewardEvents) ? parsed.rewardEvents : DEFAULT_STATE.rewardEvents,
      ownedPets,
      activePetId,
      dailyQuestsDate,
      dailyQuests,
      levelUpEvents: Array.isArray(parsed?.levelUpEvents) ? parsed.levelUpEvents : DEFAULT_STATE.levelUpEvents,
      chestOpeningEvents: Array.isArray(parsed?.chestOpeningEvents) ? parsed.chestOpeningEvents : DEFAULT_STATE.chestOpeningEvents,
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
  grantFocusReward: (durationMinutes: number) => void;
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
  openChest: (type: ChestType) => void;
  unlockPet: (source: OwnedPet['source']) => OwnedPet | null;
  equipPet: (petId: string) => void;
  equipPetSkin: (petId: string, skin: string) => void;
  useFood: (type: FoodType) => void;
  feedInventoryFood: (type: FoodType) => void;
  claimDailyQuest: (questId: string) => void;
  grantAdminTestRewards: () => void;
  clearRewardEvents: () => void;
  clearLevelUpEvents: () => void;
  clearChestOpeningEvents: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  // Start with SSR-safe defaults. We load the real state from localStorage
  // after mount to avoid hydration mismatches (localStorage doesn't exist
  // server-side, so the server and client would otherwise disagree on the
  // first rendered frame).
  const [state, setState] = useState<AppState>(DEFAULT_STATE);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const loaded = loadState();
    if (loaded.todayTasksDate !== today()) {
      loaded.todayTasksCompleted = 0;
      loaded.todayTasksDate = today();
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time client-only hydration.
    setState(loaded);
    setHydrated(true);
  }, []);

  // Debounced localStorage writes. Previously every single state change
  // synchronously serialized the whole app state to localStorage (which can
  // be expensive when typing/dragging sliders). Skip until after hydration
  // so we don't overwrite the user's data with defaults on the first tick.
  useEffect(() => {
    if (!hydrated) return;
    const handle = setTimeout(() => saveState(state), 300);
    return () => clearTimeout(handle);
  }, [state, hydrated]);

  // Apply glass mode CSS variable
  useEffect(() => {
    const root = document.documentElement;
    if (state.settings.glassMode) {
      root.style.setProperty('--glass-bg', 'var(--glass-bg-transparent, rgba(255,255,255,0.05))');
    } else {
      root.style.removeProperty('--glass-bg');
    }
  }, [state.settings.glassMode]);

  const createRewardEvent = (label: string, detail: string): RewardEvent => ({
    id: `${Date.now()}-${Math.random()}`,
    label,
    detail,
    timestamp: Date.now(),
  });

  const advanceDailyQuest = (quests: DailyQuest[], type: DailyQuestType, amount: number) =>
    quests.map(quest => quest.type === type && !quest.claimed
      ? { ...quest, progress: Math.min(quest.target, quest.progress + amount) }
      : quest
    );

  const formatQuestReward = (reward: DailyQuestReward) => [
    reward.coins ? `+${reward.coins} coins` : '',
    reward.commonChests ? `+${reward.commonChests} common chest` : '',
    reward.rareChests ? `+${reward.rareChests} rare chest` : '',
    reward.basicSnack ? `+${reward.basicSnack} snack` : '',
    reward.focusBerry ? `+${reward.focusBerry} berry` : '',
    reward.petXp ? `+${reward.petXp} pet XP` : '',
  ].filter(Boolean).join(' · ');

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

  const updateActivePetWithGrowth = (prev: AppState, changes: Parameters<typeof addPetGrowth>[1]) => {
    let levelUpEvent: LevelUpEvent | null = null;
    const ownedPets = prev.ownedPets.map(pet => {
      if (pet.id !== prev.activePetId) return pet;
      const nextPet = addPetGrowth(pet, changes);
      if (nextPet.level > pet.level) {
        levelUpEvent = {
          id: `${Date.now()}-${Math.random()}`,
          petId: pet.id,
          petType: pet.type,
          level: nextPet.level,
          timestamp: Date.now(),
        };
      }
      return nextPet;
    });

    return {
      ownedPets,
      levelUpEvents: levelUpEvent ? [levelUpEvent, ...prev.levelUpEvents].slice(0, 3) : prev.levelUpEvents,
    };
  };

  const feedPet = useCallback(() => {
    setState(prev => {
      if (prev.coins < 10) return prev; // Costs 10 coins to feed
      const petGrowth = updateActivePetWithGrowth(prev, { xp: 10, hunger: 30, happiness: 5 });
      return {
        ...prev,
        coins: prev.coins - 10,
        petStatus: { ...prev.petStatus, hunger: Math.min(100, prev.petStatus.hunger + 30), lastFed: Date.now() },
        dailyQuests: advanceDailyQuest(prev.dailyQuests, 'feedPet', 1),
        ownedPets: petGrowth.ownedPets,
        levelUpEvents: petGrowth.levelUpEvents,
      };
    });
  }, []);

  const interactPet = useCallback(() => {
    setState(prev => {
      const petGrowth = updateActivePetWithGrowth(prev, { xp: 10, happiness: 20 });
      return {
        ...prev,
        petStatus: { ...prev.petStatus, happiness: Math.min(100, prev.petStatus.happiness + 20), lastInteracted: Date.now() },
        ownedPets: petGrowth.ownedPets,
        levelUpEvents: petGrowth.levelUpEvents,
      };
    });
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

  const applyFocusReward = useCallback((prev: AppState, durationMinutes: number): AppState => {
    const decayedPet = calculatePetDecay(prev.petStatus);
    const earnedCommonChest = durationMinutes >= 25;
    const earnedRareChest = durationMinutes >= 50;
    const earnedFocusBerry = durationMinutes >= 25;

    const petGrowth = updateActivePetWithGrowth(prev, {
      xp: durationMinutes * 10,
      happiness: durationMinutes / 5,
      stats: {
        focus: durationMinutes * 10,
        endurance: durationMinutes >= 60 ? 500 : 0,
      },
    });

    const next = {
      ...prev,
      streak: updateStreak(prev),
      coins: prev.coins + durationMinutes,
      petStatus: {
        ...prev.petStatus,
        hunger: decayedPet.hunger,
        happiness: Math.min(100, decayedPet.happiness + (durationMinutes / 5)),
      },
      skills: {
        ...prev.skills,
        focus: (prev.skills.focus || 0) + durationMinutes * 10,
        endurance: (prev.skills.endurance || 0) + (durationMinutes >= 60 ? 500 : 0)
      },
      dailyQuests: advanceDailyQuest(prev.dailyQuests, 'focusMinutes', durationMinutes),
      ownedPets: petGrowth.ownedPets,
      levelUpEvents: petGrowth.levelUpEvents,
      inventory: {
        chests: {
          ...prev.inventory.chests,
          common: prev.inventory.chests.common + (earnedCommonChest ? 1 : 0),
          rare: prev.inventory.chests.rare + (earnedRareChest ? 1 : 0),
        },
        food: {
          ...prev.inventory.food,
          focusBerry: prev.inventory.food.focusBerry + (earnedFocusBerry ? 1 : 0),
        },
      },
      rewardEvents: [
        createRewardEvent('Focus reward', `+${durationMinutes} coins${earnedCommonChest ? ' · Common Chest' : ''}${earnedRareChest ? ' · Rare Chest' : ''}${earnedFocusBerry ? ' · Focus Berry' : ''}`),
        ...prev.rewardEvents,
      ].slice(0, 5),
    };
    next.unlockedAchievements = checkAndUnlock(next);
    return next;
  }, [updateStreak, checkAndUnlock]);

  const grantFocusReward = useCallback((durationMinutes: number) => {
    setState(prev => applyFocusReward(prev, durationMinutes));
  }, [applyFocusReward]);

  const recordFocusSession = useCallback((durationMinutes: number) => {
    setState(prev => {
      const session: FocusSession = {
        id: Date.now().toString(),
        durationMinutes,
        completed: true,
        date: today(),
        timestamp: Date.now(),
      };

      return applyFocusReward({
        ...prev,
        focusSessions: [...prev.focusSessions, session],
      }, durationMinutes);
    });
  }, [applyFocusReward]);

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
      const petGrowth = updateActivePetWithGrowth(prev, {
        xp: 50,
        happiness: 3,
        stats: { consistency: 50 },
      });
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
        },
        dailyQuests: advanceDailyQuest(prev.dailyQuests, 'completeTasks', 1),
        ownedPets: petGrowth.ownedPets,
        levelUpEvents: petGrowth.levelUpEvents,
        inventory: {
          ...prev.inventory,
          food: {
            ...prev.inventory.food,
            basicSnack: prev.inventory.food.basicSnack + 1,
          },
        },
        rewardEvents: [
          createRewardEvent('Task reward', '+5 coins · Basic Snack'),
          ...prev.rewardEvents,
        ].slice(0, 5),
      };
      next.unlockedAchievements = checkAndUnlock(next);
      return next;
    });
  }, [updateStreak, checkAndUnlock]);

  const getNextUnlockablePet = useCallback((ownedPets: OwnedPet[], source: OwnedPet['source']) => {
    const pool = source === 'rareChest' ? RARE_PET_UNLOCK_POOL : COMMON_PET_UNLOCK_POOL;
    const ownedTypes = new Set(ownedPets.map(pet => pet.type));
    const nextType = pool.find(type => !ownedTypes.has(type));
    if (!nextType) return null;

    return withPetGrowthDefaults({
      id: `${source}-${nextType}-${Date.now()}`,
      type: nextType,
      unlockedAt: Date.now(),
      source,
    });
  }, []);

  const getNextUnlockableSkin = useCallback((ownedPets: OwnedPet[]) => {
    for (const pet of ownedPets) {
      const pool = PET_SKIN_UNLOCK_POOLS[pet.type] ?? [];
      const nextSkin = pool.find(skin => !pet.ownedSkins.includes(skin));
      if (nextSkin) return { petId: pet.id, petType: pet.type, skin: nextSkin };
    }
    return null;
  }, []);

  const unlockPet = useCallback((source: OwnedPet['source']) => {
    if (source === 'starter') return null;

    let unlockedPet: OwnedPet | null = null;
    setState(prev => {
      const nextPet = getNextUnlockablePet(prev.ownedPets, source);
      if (!nextPet) return prev;
      unlockedPet = nextPet;

      return {
        ...prev,
        ownedPets: [...prev.ownedPets, nextPet],
        activePetId: nextPet.id,
        rewardEvents: [
          createRewardEvent('Pet unlocked', `${nextPet.type} joined your library`),
          ...prev.rewardEvents,
        ].slice(0, 5),
      };
    });
    return unlockedPet;
  }, [getNextUnlockablePet]);

  const openChest = useCallback((type: ChestType) => {
    setState(prev => {
      if ((prev.inventory.chests[type] ?? 0) <= 0) return prev;

      const isRare = type === 'rare';
      const coinReward = isRare ? 40 : 15;
      const basicSnackReward = isRare ? 2 : 1;
      const focusBerryReward = isRare ? 2 : 0;
      const petUnlockSource: OwnedPet['source'] = isRare ? 'rareChest' : 'commonChest';
      const unlockedPet = getNextUnlockablePet(prev.ownedPets, petUnlockSource);
      const unlockedSkin = unlockedPet ? null : getNextUnlockableSkin(prev.ownedPets);
      const nextOwnedPets = unlockedPet
        ? [...prev.ownedPets, unlockedPet]
        : unlockedSkin
          ? prev.ownedPets.map(pet => pet.id === unlockedSkin.petId ? { ...pet, ownedSkins: [...pet.ownedSkins, unlockedSkin.skin] } : pet)
          : prev.ownedPets;
      const rewardDetail = `+${coinReward} coins · +${basicSnackReward} snack${focusBerryReward ? ` · +${focusBerryReward} berry` : ''}${unlockedPet ? ` · ${unlockedPet.type} unlocked` : ''}${unlockedSkin ? ` · ${unlockedSkin.petType} ${unlockedSkin.skin} skin` : ''}`;

      return {
        ...prev,
        coins: prev.coins + coinReward,
        ownedPets: nextOwnedPets,
        activePetId: unlockedPet ? unlockedPet.id : prev.activePetId,
        inventory: {
          chests: {
            ...prev.inventory.chests,
            [type]: prev.inventory.chests[type] - 1,
          },
          food: {
            ...prev.inventory.food,
            basicSnack: prev.inventory.food.basicSnack + basicSnackReward,
            focusBerry: prev.inventory.food.focusBerry + focusBerryReward,
          },
        },
        rewardEvents: [
          createRewardEvent(isRare ? 'Rare chest opened' : 'Common chest opened', rewardDetail),
          ...prev.rewardEvents,
        ].slice(0, 5),
        chestOpeningEvents: [{
          id: `${Date.now()}-${Math.random()}`,
          type,
          coinReward,
          basicSnackReward,
          focusBerryReward,
          unlockedPetType: unlockedPet?.type,
          unlockedSkinPetType: unlockedSkin?.petType,
          unlockedSkin: unlockedSkin?.skin,
          timestamp: Date.now(),
        }, ...prev.chestOpeningEvents].slice(0, 3),
      };
    });
  }, [getNextUnlockablePet, getNextUnlockableSkin]);

  const equipPet = useCallback((petId: string) => {
    setState(prev => {
      const pet = prev.ownedPets.find(item => item.id === petId);
      if (!pet || prev.activePetId === petId) return prev;

      return {
        ...prev,
        activePetId: petId,
        rewardEvents: [
          createRewardEvent('Pet equipped', `${pet.type} is now active`),
          ...prev.rewardEvents,
        ].slice(0, 5),
      };
    });
  }, []);

  const equipPetSkin = useCallback((petId: string, skin: string) => {
    setState(prev => {
      const pet = prev.ownedPets.find(item => item.id === petId);
      if (!pet || !pet.ownedSkins.includes(skin) || pet.skin === skin) return prev;

      return {
        ...prev,
        ownedPets: prev.ownedPets.map(item => item.id === petId ? { ...item, skin } : item),
        rewardEvents: [
          createRewardEvent('Skin equipped', `${pet.type} / ${skin}`),
          ...prev.rewardEvents,
        ].slice(0, 5),
      };
    });
  }, []);

  const useFood = useCallback((type: FoodType) => {
    setState(prev => {
      if ((prev.inventory.food[type] ?? 0) <= 0) return prev;

      const isFocusBerry = type === 'focusBerry';
      const petGrowth = updateActivePetWithGrowth(prev, {
        xp: isFocusBerry ? 25 : 15,
        hunger: isFocusBerry ? 20 : 15,
        happiness: isFocusBerry ? 10 : 5,
        stats: { focus: isFocusBerry ? 25 : 0 },
      });
      return {
        ...prev,
        inventory: {
          ...prev.inventory,
          food: {
            ...prev.inventory.food,
            [type]: prev.inventory.food[type] - 1,
          },
        },
        petStatus: {
          ...prev.petStatus,
          hunger: Math.min(100, prev.petStatus.hunger + (isFocusBerry ? 20 : 15)),
          happiness: Math.min(100, prev.petStatus.happiness + (isFocusBerry ? 10 : 5)),
          lastFed: Date.now(),
          lastInteracted: isFocusBerry ? Date.now() : prev.petStatus.lastInteracted,
        },
        skills: {
          ...prev.skills,
          focus: (prev.skills.focus || 0) + (isFocusBerry ? 25 : 0),
        },
        dailyQuests: advanceDailyQuest(prev.dailyQuests, 'feedPet', 1),
        ownedPets: petGrowth.ownedPets,
        levelUpEvents: petGrowth.levelUpEvents,
        rewardEvents: [
          createRewardEvent(isFocusBerry ? 'Fed Focus Berry' : 'Fed Basic Snack', isFocusBerry ? '+20 fullness · +10 happiness · +25 focus XP' : '+15 fullness · +5 happiness'),
          ...prev.rewardEvents,
        ].slice(0, 5),
      };
    });
  }, []);

  const feedInventoryFood = useFood;

  const claimDailyQuest = useCallback((questId: string) => {
    setState(prev => {
      const quest = prev.dailyQuests.find(item => item.id === questId);
      if (!quest || quest.claimed || quest.progress < quest.target) return prev;

      const petGrowth = quest.reward.petXp
        ? updateActivePetWithGrowth(prev, { xp: quest.reward.petXp })
        : { ownedPets: prev.ownedPets, levelUpEvents: prev.levelUpEvents };

      return {
        ...prev,
        coins: prev.coins + (quest.reward.coins ?? 0),
        inventory: {
          chests: {
            ...prev.inventory.chests,
            common: prev.inventory.chests.common + (quest.reward.commonChests ?? 0),
            rare: prev.inventory.chests.rare + (quest.reward.rareChests ?? 0),
          },
          food: {
            ...prev.inventory.food,
            basicSnack: prev.inventory.food.basicSnack + (quest.reward.basicSnack ?? 0),
            focusBerry: prev.inventory.food.focusBerry + (quest.reward.focusBerry ?? 0),
          },
        },
        ownedPets: petGrowth.ownedPets,
        levelUpEvents: petGrowth.levelUpEvents,
        dailyQuests: prev.dailyQuests.map(item => item.id === questId ? { ...item, claimed: true } : item),
        rewardEvents: [
          createRewardEvent('Quest complete', formatQuestReward(quest.reward)),
          ...prev.rewardEvents,
        ].slice(0, 5),
      };
    });
  }, []);

  const grantAdminTestRewards = useCallback(() => {
    setState(prev => {
      const allPetTypes: OwnedPetType[] = [
        ...STARTER_PETS.map(pet => pet.type),
        ...COMMON_PET_UNLOCK_POOL,
        ...RARE_PET_UNLOCK_POOL,
      ];
      const ownedByType = new Map(prev.ownedPets.map(pet => [pet.type, pet]));
      const missingPets = allPetTypes
        .filter(type => !ownedByType.has(type))
        .map(type => withPetGrowthDefaults({
          id: `admin-${type}`,
          type,
          unlockedAt: Date.now(),
          source: COMMON_PET_UNLOCK_POOL.includes(type) ? 'commonChest' : 'rareChest',
        }));
      const ownedPets = [...prev.ownedPets, ...missingPets].map(pet => {
        const skinPool = PET_SKIN_UNLOCK_POOLS[pet.type] ?? [];
        const ownedSkins = Array.from(new Set([...pet.ownedSkins, ...skinPool, ...(pet.skin ? [pet.skin] : [])]));
        return { ...pet, ownedSkins };
      });

      return {
        ...prev,
        coins: prev.coins + 1000,
        inventory: {
          chests: {
            ...prev.inventory.chests,
            common: prev.inventory.chests.common + 10,
            rare: prev.inventory.chests.rare + 10,
          },
          food: {
            ...prev.inventory.food,
            basicSnack: prev.inventory.food.basicSnack + 25,
            focusBerry: prev.inventory.food.focusBerry + 25,
          },
        },
        ownedPets,
        activePetId: prev.activePetId ?? ownedPets[0]?.id ?? null,
        rewardEvents: [
          createRewardEvent('Admin test rewards', 'All pets, skins, coins, chests, and food granted'),
          ...prev.rewardEvents,
        ].slice(0, 5),
      };
    });
  }, []);

  const clearRewardEvents = useCallback(() => {
    setState(prev => ({ ...prev, rewardEvents: [] }));
  }, []);

  const clearLevelUpEvents = useCallback(() => {
    setState(prev => ({ ...prev, levelUpEvents: [] }));
  }, []);

  const clearChestOpeningEvents = useCallback(() => {
    setState(prev => ({ ...prev, chestOpeningEvents: [] }));
  }, []);

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
    grantFocusReward,
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
    openChest,
    unlockPet,
    equipPet,
    equipPetSkin,
    useFood,
    feedInventoryFood,
    claimDailyQuest,
    grantAdminTestRewards,
    clearRewardEvents,
    clearLevelUpEvents,
    clearChestOpeningEvents,
  }), [state, toggleFavoriteScene, isFavoriteScene, recordFocusSession, grantFocusReward, failFocusSession, recordTaskCompletion, updateSettings, achievements, getTodayFocusMinutes, getWeeklyAverage, toggleZenMode, levelInfo, feedPet, interactPet, spendCoins, openChest, unlockPet, equipPet, equipPetSkin, useFood, feedInventoryFood, claimDailyQuest, grantAdminTestRewards, clearRewardEvents, clearLevelUpEvents, clearChestOpeningEvents]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
