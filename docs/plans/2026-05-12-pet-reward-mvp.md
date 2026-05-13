# Pet Reward MVP Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add the first pet gamification loop: focus/task rewards, chest drops, food inventory, chest opening, and pet feeding rewards without introducing pet ownership/gacha yet.

**Architecture:** Extend the existing `AppContext` state because it already owns coins, focus sessions, task rewards, pet status, skills, and localStorage persistence. Add a small reward/inventory model, then surface it in `FocusPets` with a compact inventory/chest UI and reward notifications. Keep the implementation local-only and backwards-compatible with existing saved state.

**Tech Stack:** Next.js App Router, React 19, TypeScript, existing `AppContext` localStorage persistence, existing `FocusPets` panel UI, Tailwind CSS classes.

---

### Task 1: Extend AppContext reward state and actions

**Files:**
- Modify: `src/contexts/AppContext.tsx:14-438`

**Step 1: Confirm test script status**

Run:
```bash
npm test
```

Expected: fails with missing `test` script because `package.json` has no `test` script. Continue with lint/build/manual verification.

**Step 2: Add reward types**

Near the existing interfaces in `AppContext.tsx`, add:

```tsx
type ChestType = 'common' | 'rare';
type FoodType = 'basicSnack' | 'focusBerry';

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
```

**Step 3: Extend `AppState`**

Add fields to `AppState`:

```tsx
inventory: InventoryState;
rewardEvents: RewardEvent[];
```

**Step 4: Extend `DEFAULT_STATE`**

Add defaults:

```tsx
inventory: {
  chests: { common: 0, rare: 0 },
  food: { basicSnack: 0, focusBerry: 0 },
},
rewardEvents: [],
```

**Step 5: Merge persisted inventory safely**

In `loadState()`, extend the returned object so old localStorage does not break:

```tsx
inventory: {
  chests: { ...DEFAULT_STATE.inventory.chests, ...parsed?.inventory?.chests },
  food: { ...DEFAULT_STATE.inventory.food, ...parsed?.inventory?.food },
},
rewardEvents: Array.isArray(parsed?.rewardEvents) ? parsed.rewardEvents : DEFAULT_STATE.rewardEvents,
```

Keep existing merges for settings/streak/petStatus/skills.

**Step 6: Add context actions**

Extend `AppContextType` with:

```tsx
openChest: (type: ChestType) => void;
useFood: (type: FoodType) => void;
clearRewardEvents: () => void;
```

**Step 7: Add reward event helper inside `AppProvider`**

Inside `AppProvider`, before actions, add:

```tsx
const createRewardEvent = (label: string, detail: string): RewardEvent => ({
  id: `${Date.now()}-${Math.random()}`,
  label,
  detail,
  timestamp: Date.now(),
});
```

**Step 8: Update focus rewards**

In `recordFocusSession`, keep existing coin/skills logic, but add chest/food reward chances:

- Existing: `coins: prev.coins + durationMinutes`
- Add common chest if duration >= 25.
- Add rare chest if duration >= 50.
- Add one `focusBerry` if duration >= 25.
- Add reward event summarizing focus reward.

Minimal logic:

```tsx
const earnedCommonChest = durationMinutes >= 25;
const earnedRareChest = durationMinutes >= 50;
const earnedFocusBerry = durationMinutes >= 25;
```

Then merge into returned state:

```tsx
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
```

**Step 9: Update task rewards**

In `recordTaskCompletion`, keep existing +5 coins and consistency XP. Add a simple chance-free food reward every task:

```tsx
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
```

**Step 10: Add `openChest` action**

Inside `AppProvider`, add:

```tsx
const openChest = useCallback((type: ChestType) => {
  setState(prev => {
    if ((prev.inventory.chests[type] ?? 0) <= 0) return prev;

    const isRare = type === 'rare';
    const coinReward = isRare ? 40 : 15;
    const basicSnackReward = isRare ? 2 : 1;
    const focusBerryReward = isRare ? 2 : 0;

    return {
      ...prev,
      coins: prev.coins + coinReward,
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
        createRewardEvent(isRare ? 'Rare chest opened' : 'Common chest opened', `+${coinReward} coins · +${basicSnackReward} snack${focusBerryReward ? ` · +${focusBerryReward} berry` : ''}`),
        ...prev.rewardEvents,
      ].slice(0, 5),
    };
  });
}, []);
```

Use deterministic rewards for MVP; do not add random gacha yet.

**Step 11: Add `useFood` action**

Add:

```tsx
const useFood = useCallback((type: FoodType) => {
  setState(prev => {
    if ((prev.inventory.food[type] ?? 0) <= 0) return prev;

    const isFocusBerry = type === 'focusBerry';
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
      rewardEvents: [
        createRewardEvent(isFocusBerry ? 'Fed Focus Berry' : 'Fed Basic Snack', isFocusBerry ? '+20 fullness · +10 happiness · +25 focus XP' : '+15 fullness · +5 happiness'),
        ...prev.rewardEvents,
      ].slice(0, 5),
    };
  });
}, []);
```

**Step 12: Add `clearRewardEvents` action**

Add:

```tsx
const clearRewardEvents = useCallback(() => {
  setState(prev => ({ ...prev, rewardEvents: [] }));
}, []);
```

**Step 13: Include actions in context value**

Add `openChest`, `useFood`, `clearRewardEvents` to the returned context value and dependency array.

**Step 14: Verify source lint**

Run:
```bash
npx eslint src
```

Expected: 0 errors. Existing warnings may remain.

---

### Task 2: Add inventory/chest UI to FocusPets panel

**Files:**
- Modify: `src/components/features/FocusPets.tsx:1-714`

**Step 1: Update context destructuring**

Change:

```tsx
const { state, feedPet, interactPet } = useApp();
```

to:

```tsx
const { state, feedPet, interactPet, openChest, useFood, clearRewardEvents } = useApp();
```

**Step 2: Add icons**

Extend the existing lucide import with icons:

```tsx
Gift, PackageOpen, Apple, Sparkles, X
```

Only use icons that render in the new UI.

**Step 3: Add reward event strip**

Inside the Tamagotchi dashboard in `FocusPets`, after the coin/feed/play row and before stat bars, render recent reward events if any:

```tsx
{state.rewardEvents.length > 0 && (
  <div className="relative z-10 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-2">
    <div className="mb-1 flex items-center justify-between">
      <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-emerald-300">
        <Sparkles size={10} /> Rewards
      </span>
      <button onClick={clearRewardEvents} className="text-white/35 hover:text-white/70">
        <X size={10} />
      </button>
    </div>
    <div className="flex flex-col gap-1">
      {state.rewardEvents.slice(0, 2).map(event => (
        <div key={event.id} className="flex justify-between gap-2 text-[10px] text-white/65">
          <span className="font-semibold text-white/80">{event.label}</span>
          <span className="truncate text-right">{event.detail}</span>
        </div>
      ))}
    </div>
  </div>
)}
```

Keep it compact so the pet panel does not become too tall.

**Step 4: Add chest buttons**

After the stat/skills section and before the Codachi button, add a compact inventory section:

```tsx
<div className="z-10 grid grid-cols-2 gap-2">
  <button
    onClick={() => openChest('common')}
    disabled={(state.inventory.chests.common ?? 0) <= 0}
    className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-left transition-all hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-35"
  >
    <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-white/70">
      <PackageOpen size={12} className="text-emerald-300" /> Common
    </span>
    <span className="text-xs font-black text-white">{state.inventory.chests.common ?? 0}</span>
  </button>
  <button
    onClick={() => openChest('rare')}
    disabled={(state.inventory.chests.rare ?? 0) <= 0}
    className="flex items-center justify-between rounded-xl border border-yellow-400/20 bg-yellow-400/10 px-3 py-2 text-left transition-all hover:bg-yellow-400/15 disabled:cursor-not-allowed disabled:opacity-35"
  >
    <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-yellow-300">
      <Gift size={12} /> Rare
    </span>
    <span className="text-xs font-black text-yellow-200">{state.inventory.chests.rare ?? 0}</span>
  </button>
</div>
```

**Step 5: Add food buttons**

Below chest buttons, add:

```tsx
<div className="z-10 grid grid-cols-2 gap-2">
  <button
    onClick={() => useFood('basicSnack')}
    disabled={(state.inventory.food.basicSnack ?? 0) <= 0}
    className="flex items-center justify-between rounded-xl border border-orange-400/20 bg-orange-400/10 px-3 py-2 transition-all hover:bg-orange-400/15 disabled:cursor-not-allowed disabled:opacity-35"
  >
    <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-orange-300">
      <Apple size={12} /> Snack
    </span>
    <span className="text-xs font-black text-orange-100">{state.inventory.food.basicSnack ?? 0}</span>
  </button>
  <button
    onClick={() => useFood('focusBerry')}
    disabled={(state.inventory.food.focusBerry ?? 0) <= 0}
    className="flex items-center justify-between rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 transition-all hover:bg-emerald-400/15 disabled:cursor-not-allowed disabled:opacity-35"
  >
    <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-emerald-300">
      <Sparkles size={12} /> Berry
    </span>
    <span className="text-xs font-black text-emerald-100">{state.inventory.food.focusBerry ?? 0}</span>
  </button>
</div>
```

**Step 6: Keep existing Feed/Play buttons**

Do not remove existing coin-based Feed or Play buttons. The new food inventory supplements them.

**Step 7: Verify source lint**

Run:
```bash
npx eslint src
```

Expected: 0 errors. Existing warnings may remain.

---

### Task 3: Full verification and manual test

**Files:**
- No changes unless verification finds an issue caused by this feature.

**Step 1: Build**

Run:
```bash
npm run build
```

Expected: build succeeds. Existing Next.js warnings may remain.

**Step 2: Manual browser test**

Run:
```bash
npm run dev
```

Manual checks:
1. Complete a task in TaskBoard. Confirm pet panel shows +5 coins, +1 Basic Snack, and a reward event.
2. Complete a 25-minute focus session if practical, or temporarily test with shorter timer if the UI allows. Confirm Common Chest and Focus Berry reward.
3. Open Common Chest. Confirm chest count decreases, coins/food increase, and reward event appears.
4. Use Basic Snack. Confirm snack count decreases and fullness/happiness increase.
5. Use Focus Berry. Confirm berry count decreases, fullness/happiness/focus skill increase.
6. Reload page. Confirm inventory/chests/reward events persist from localStorage.
7. Existing Feed/Play buttons still work.

**Step 3: Commit**

Only commit if explicitly requested by the user.

```bash
git add src/contexts/AppContext.tsx src/components/features/FocusPets.tsx docs/plans/2026-05-12-pet-reward-mvp.md
git commit -m "feat: add pet reward inventory loop"
```
