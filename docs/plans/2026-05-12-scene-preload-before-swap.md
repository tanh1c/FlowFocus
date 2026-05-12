# Scene Preload Before Swap Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Improve perceived scene switching speed by preloading selected scenes before swapping the active background, then optionally preloading scene assets on card hover.

**Architecture:** Keep the currently visible scene rendered while the newly selected scene loads in the background. After the new image/video can render, update `currentScene` so the visual swap happens only when ready. Add a lightweight hover preload in `SceneSelector` that warms the browser cache without changing app state.

**Tech Stack:** Next.js App Router, React 19, TypeScript, browser `Image` and `HTMLVideoElement` preload APIs, Tailwind CSS.

---

### Task 1: Add scene preload helper and preload-before-swap

**Files:**
- Modify: `src/app/page.tsx:17-240`

**Step 1: Confirm test script status**

Run:
```bash
npm test
```

Expected: fails with missing `test` script because `package.json` does not define one. Continue with lint/build/manual verification.

**Step 2: Add helper types/constants near the existing storage keys**

In `src/app/page.tsx`, below the storage keys, add:

```tsx
const VIDEO_EXTENSIONS = ['.mp4', '.webm'];
const PIXEL_SCENE_EXTENSIONS = ['.gif'];
const IMAGE_EXTENSIONS = ['.avif', '.webp', '.png', '.jpg', '.jpeg', '.gif'];

function hasAnyExtension(url: string, extensions: string[]) {
  const pathname = url.split('?')[0].toLowerCase();
  return extensions.some((extension) => pathname.endsWith(extension));
}
```

Do not over-generalize beyond current scene URL needs.

**Step 3: Add preload helper**

Below `hasAnyExtension`, add:

```tsx
function preloadSceneAsset(sceneUrl: string): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();

  if (hasAnyExtension(sceneUrl, VIDEO_EXTENSIONS)) {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        video.removeAttribute('src');
        video.load();
        resolve();
      };

      video.preload = 'auto';
      video.muted = true;
      video.playsInline = true;
      video.oncanplay = finish;
      video.onerror = finish;
      video.src = sceneUrl;
      video.load();
      window.setTimeout(finish, 7000);
    });
  }

  if (hasAnyExtension(sceneUrl, IMAGE_EXTENSIONS)) {
    return new Promise((resolve) => {
      const image = new Image();
      image.onload = () => resolve();
      image.onerror = () => resolve();
      image.src = sceneUrl;
    });
  }

  return Promise.resolve();
}
```

Important behavior:
- Resolve on error rather than blocking scene switching forever.
- Use a timeout for video so very slow video URLs do not leave users stuck.
- Do not add retries or caching maps yet; browser cache is enough for this iteration.

**Step 4: Replace scene type checks to reuse helpers**

Replace:

```tsx
const isVideoScene =
  currentScene.endsWith('.mp4') || currentScene.endsWith('.webm');
const isPixelScene =
  currentScene.includes('github.com/user-attachments') ||
  currentScene.endsWith('.gif');
```

with:

```tsx
const isVideoScene = hasAnyExtension(currentScene, VIDEO_EXTENSIONS);
const isPixelScene =
  currentScene.includes('github.com/user-attachments') ||
  hasAnyExtension(currentScene, PIXEL_SCENE_EXTENSIONS);
```

**Step 5: Add scene loading state**

Inside `HomeContent`, after `preferencesLoaded`, add:

```tsx
const [isSceneLoading, setIsSceneLoading] = useState(false);
```

**Step 6: Update scene selection handler**

Replace the existing `handleSelectScene` with:

```tsx
const handleSelectScene = useCallback(
  async (scene: { sceneUrl: string }) => {
    if (scene.sceneUrl === currentScene) return;

    setIsSceneLoading(true);
    await preloadSceneAsset(scene.sceneUrl);
    setCurrentScene(scene.sceneUrl);
    setIsSceneLoading(false);
  },
  [currentScene]
);
```

This keeps the current scene visible until the new one is ready.

**Step 7: Add a small scene-loading overlay**

After the initial `!preferencesLoaded` loader block and before the dark overlay block, add:

```tsx
{preferencesLoaded && isSceneLoading && (
  <div className="pointer-events-none absolute inset-x-0 top-8 z-[55] flex justify-center">
    <div className="flex items-center gap-3 rounded-full border border-white/10 bg-black/75 px-5 py-3 text-xs uppercase tracking-[0.24em] text-white/60 shadow-[0_12px_40px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
      <span className="h-2 w-2 rounded-full bg-primary shadow-[0_0_12px_rgba(52,211,153,0.75)] animate-pulse" />
      Loading scene
    </div>
  </div>
)}
```

Keep it lightweight and non-interactive.

**Step 8: Verify source lint**

Run:
```bash
npx eslint src
```

Expected: 0 errors. Existing warnings may remain.

**Step 9: Verify production build**

Run:
```bash
npm run build
```

Expected: build succeeds. Existing warnings may remain.

**Step 10: Manual verification**

Run:
```bash
npm run dev
```

Manual checks:
1. Open the scene selector.
2. Select a large image scene.
3. Confirm the old scene remains visible while the new scene loads.
4. Confirm the small `Loading scene` overlay appears during load.
5. Confirm the app swaps to the new scene after preload.
6. Select a video scene and confirm it also swaps after `canplay` or timeout.
7. Confirm no hydration mismatch appears in the console.

---

### Task 2: Add preload-on-hover for scene cards

**Files:**
- Modify: `src/components/features/SceneSelector.tsx:21-30`
- Modify: `src/components/features/SceneSelector.tsx:820-900`
- Modify: `src/app/page.tsx:228-237`

**Step 1: Add optional preload callback prop**

In `src/components/features/SceneSelector.tsx`, update `SceneSelectorProps`:

```tsx
interface SceneSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectScene?: (scene: Scene) => void;
  onPreloadScene?: (scene: Scene) => void;
  currentScene?: string;
  currentFilter: string;
  onSelectFilter: (filter: string) => void;
  pixelRendering?: 'crisp-edges' | 'pixelated';
  onPixelRenderingChange?: (v: 'crisp-edges' | 'pixelated') => void;
}
```

**Step 2: Destructure the prop**

In the `SceneSelector` function parameter destructuring, include:

```tsx
onPreloadScene,
```

**Step 3: Add hover/focus preload to scene buttons**

Find the scene card `<button>` in `SceneSelector.tsx` around the scene grid. Add:

```tsx
onMouseEnter={() => onPreloadScene?.(scene)}
onFocus={() => onPreloadScene?.(scene)}
```

Do not add mobile-specific touch preloading yet.

**Step 4: Add preload callback in HomeContent**

In `src/app/page.tsx`, after `handleSelectScene`, add:

```tsx
const handlePreloadScene = useCallback((scene: { sceneUrl: string }) => {
  void preloadSceneAsset(scene.sceneUrl);
}, []);
```

**Step 5: Pass callback to SceneSelector**

Update the `SceneSelector` usage in `src/app/page.tsx`:

```tsx
<SceneSelector
  ...
  onSelectScene={handleSelectScene}
  onPreloadScene={handlePreloadScene}
  ...
/>
```

**Step 6: Verify source lint**

Run:
```bash
npx eslint src
```

Expected: 0 errors. Existing warnings may remain.

**Step 7: Verify production build**

Run:
```bash
npm run build
```

Expected: build succeeds.

**Step 8: Manual verification**

Run:
```bash
npm run dev
```

Manual checks:
1. Open scene selector.
2. Hover a scene card for a short time.
3. Click that same scene.
4. Confirm scene swap feels faster than cold select.
5. Confirm no visual changes happen on hover except existing card hover styles.
6. Confirm keyboard focus still works and does not throw errors.

**Step 9: Commit**

Only commit if explicitly requested by the user.

```bash
git add src/app/page.tsx src/components/features/SceneSelector.tsx docs/plans/2026-05-12-scene-preload-before-swap.md
git commit -m "perf: preload scenes before background swap"
```
