# Scene Hover Preload Optimization Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Remove hover lag for live video scenes by preventing heavy video preload on hover while keeping click-time preload-before-swap behavior.

**Architecture:** Keep `preloadSceneAsset()` as the click-time preload path for both images and videos. Add a separate hover preload path that only preloads lightweight image/GIF scenes, debounces hover intent, and caches already-hover-preloaded URLs. Scene cards call hover preload only after a short hover/focus delay.

**Tech Stack:** Next.js App Router, React 19, TypeScript, browser `Image`/`video` APIs, Tailwind CSS.

---

### Task 1: Add image-only hover preload behavior in HomeContent

**Files:**
- Modify: `src/app/page.tsx:17-170`

**Step 1: Confirm test script status**

Run:
```bash
npm test
```

Expected: fails with missing `test` script because `package.json` has no `test` script. Continue with lint/build/manual verification.

**Step 2: Add `useRef` import**

Update the React import in `src/app/page.tsx`:

```tsx
import { useState, useEffect, useCallback, useRef } from 'react';
```

**Step 3: Add hover preload helper**

Below `preloadSceneAsset`, add:

```tsx
function preloadHoverSceneAsset(sceneUrl: string): Promise<void> {
  if (hasAnyExtension(sceneUrl, VIDEO_EXTENSIONS)) return Promise.resolve();
  return preloadSceneAsset(sceneUrl);
}
```

This keeps hover preload image-only while click preload still supports video.

**Step 4: Add refs for debounce/cache**

Inside `HomeContent`, after `isSceneLoading` state, add:

```tsx
const hoverPreloadTimeoutRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);
const hoverPreloadedScenesRef = useRef<Set<string>>(new Set());
```

**Step 5: Replace hover preload callback**

Replace current `handlePreloadScene` with:

```tsx
const handlePreloadScene = useCallback((scene: { sceneUrl: string }) => {
  if (hoverPreloadTimeoutRef.current) {
    window.clearTimeout(hoverPreloadTimeoutRef.current);
  }

  if (hoverPreloadedScenesRef.current.has(scene.sceneUrl)) return;

  hoverPreloadTimeoutRef.current = window.setTimeout(() => {
    if (hoverPreloadedScenesRef.current.has(scene.sceneUrl)) return;
    hoverPreloadedScenesRef.current.add(scene.sceneUrl);
    void preloadHoverSceneAsset(scene.sceneUrl);
  }, 250);
}, []);
```

**Step 6: Add cancel callback**

After `handlePreloadScene`, add:

```tsx
const handleCancelPreloadScene = useCallback(() => {
  if (!hoverPreloadTimeoutRef.current) return;
  window.clearTimeout(hoverPreloadTimeoutRef.current);
  hoverPreloadTimeoutRef.current = null;
}, []);
```

This prevents quick mouse passes across the scene grid from scheduling many preloads.

**Step 7: Pass cancel callback to SceneSelector**

Update the `SceneSelector` usage:

```tsx
onPreloadScene={handlePreloadScene}
onCancelPreloadScene={handleCancelPreloadScene}
```

**Step 8: Verify source lint**

Run:
```bash
npx eslint src
```

Expected: 0 errors. Existing warnings may remain.

---

### Task 2: Wire hover leave cancellation in SceneSelector

**Files:**
- Modify: `src/components/features/SceneSelector.tsx:21-30`
- Modify: `src/components/features/SceneSelector.tsx:636-645`
- Modify: `src/components/features/SceneSelector.tsx:825-831`

**Step 1: Add optional cancel prop**

Update `SceneSelectorProps`:

```tsx
onPreloadScene?: (scene: Scene) => void;
onCancelPreloadScene?: () => void;
```

**Step 2: Destructure cancel prop**

In `SceneSelector` parameter destructuring, include:

```tsx
onCancelPreloadScene,
```

**Step 3: Add mouse leave and blur handlers**

On the scene card button that already has `onMouseEnter` and `onFocus`, add:

```tsx
onMouseLeave={onCancelPreloadScene}
onBlur={onCancelPreloadScene}
```

Keep existing click and hover behavior unchanged.

**Step 4: Verify source lint**

Run:
```bash
npx eslint src
```

Expected: 0 errors. Existing warnings may remain.

---

### Task 3: Full verification

**Files:**
- No code changes unless verification finds a bug caused by this task.

**Step 1: Run production build**

Run:
```bash
npm run build
```

Expected: build succeeds. Existing Next.js warnings about multiple lockfiles/module type may remain.

**Step 2: Manual browser verification**

Run:
```bash
npm run dev
```

Manual checks:
1. Open the scene selector and hover quickly across several video/live scene cards.
2. Confirm hover feels smooth and does not freeze/lag.
3. Open Network tab and confirm hover over `.mp4/.webm` scenes does not start video downloads.
4. Hover over image scenes and confirm image requests may still start after ~250ms.
5. Click a video/live scene and confirm current scene stays visible while `Loading scene` appears.
6. Confirm video scene swaps after it reaches `canplay` or the 7s timeout.
7. Confirm browser console has no hydration mismatch.

**Step 3: Commit**

Only commit if explicitly requested by the user.

```bash
git add src/app/page.tsx src/components/features/SceneSelector.tsx docs/plans/2026-05-12-scene-hover-preload-optimization.md
git commit -m "perf: avoid video preloads on scene hover"
```
