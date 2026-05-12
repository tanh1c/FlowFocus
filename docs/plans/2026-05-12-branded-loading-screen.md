# Branded Loading Screen Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the background/theme reload flash with a branded Focus Flow loading screen while saved scene preferences are loaded after hydration.

**Architecture:** Keep the app hydration-safe by rendering the same initial HTML on the server and client. Load saved scene/filter/pixel settings after mount, render the real background only after preferences are loaded, and show a branded overlay until that point. Avoid reading `localStorage` during render/lazy state initialization.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Tailwind CSS utility classes, existing `src/app/page.tsx` state flow.

---

### Task 1: Add branded loading screen state and rendering

**Files:**
- Modify: `src/app/page.tsx:38-195`

**Step 1: Confirm there is no test runner**

Run:
```bash
npm test
```

Expected: command is missing or fails because `package.json` has no `test` script. Use lint/build plus manual browser verification for this task.

**Step 2: Keep hydration-safe default state**

In `src/app/page.tsx`, keep these initial states as server-safe defaults:

```tsx
const [currentScene, setCurrentScene] = useState(defaultScene);
const [currentFilter, setCurrentFilter] = useState('none');
const [pixelRendering, setPixelRendering] = useState<'crisp-edges' | 'pixelated'>('crisp-edges');
const [preferencesLoaded, setPreferencesLoaded] = useState(false);
```

Do not read `localStorage` inside `useState` initializers.

**Step 3: Load preferences after mount**

Use the existing mount effect in `src/app/page.tsx`. It should read:

```tsx
useEffect(() => {
  const frame = requestAnimationFrame(() => {
    const savedScene = localStorage.getItem(SCENE_STORAGE_KEY);
    const savedFilter = localStorage.getItem(FILTER_STORAGE_KEY);
    const savedPixel = localStorage.getItem(PIXEL_STORAGE_KEY);

    if (savedScene) setCurrentScene(savedScene);
    if (savedFilter) setCurrentFilter(savedFilter);
    if (savedPixel === 'crisp-edges' || savedPixel === 'pixelated') {
      setPixelRendering(savedPixel);
    }
    setPreferencesLoaded(true);
  });

  return () => cancelAnimationFrame(frame);
}, []);
```

This avoids hydration mismatch and passes the React lint rule that blocks direct synchronous `setState` inside an effect.

**Step 4: Render background only after preferences load**

Keep the background media block guarded by:

```tsx
{preferencesLoaded && (...background media...)}
```

This prevents the default scene from appearing before saved preferences are loaded.

**Step 5: Add branded loading overlay**

Inside the root `<div className="relative h-screen...">`, after the background scene block and before other UI layers, add:

```tsx
{!preferencesLoaded && (
  <div className="absolute inset-0 z-[80] flex items-center justify-center bg-black">
    <div className="relative flex flex-col items-center gap-5 text-center">
      <div className="absolute h-32 w-32 rounded-full bg-primary/20 blur-3xl animate-pulse" />
      <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl border border-white/15 bg-white/10 shadow-[0_0_40px_rgba(52,211,153,0.25)] backdrop-blur-xl">
        <div className="h-10 w-10 rounded-2xl border-2 border-primary/30 border-t-primary animate-spin" />
      </div>
      <div className="relative space-y-2">
        <p className="font-display text-2xl font-bold tracking-[0.35em] text-white drop-shadow-[0_0_20px_rgba(52,211,153,0.35)]">
          FOCUS FLOW
        </p>
        <p className="text-xs uppercase tracking-[0.45em] text-white/45">
          Preparing your space
        </p>
      </div>
    </div>
  </div>
)}
```

Use only existing Tailwind classes and the existing `font-display` styling. Do not create a new component unless the page becomes hard to read.

**Step 6: Verify lint**

Run:
```bash
npm run lint
```

Expected: 0 errors. Existing warnings in unrelated files may remain.

**Step 7: Verify production build**

Run:
```bash
npm run build
```

Expected: build succeeds. Existing Next.js warnings about multiple lockfiles/module type may remain.

**Step 8: Manual browser verification**

Run dev server:
```bash
npm run dev
```

Manual checks:
1. Select a non-default scene, e.g. Botanic Garden.
2. Reload the page.
3. Confirm the branded Focus Flow loading screen appears first.
4. Confirm the default scene does not flash.
5. Confirm the saved scene appears after the loading screen.
6. Confirm browser console does not show hydration mismatch.
7. Change scene again and reload to confirm persistence still works.

**Step 9: Commit**

Only commit if requested by the user. If committing, stage only relevant files:

```bash
git add src/app/page.tsx docs/plans/2026-05-12-branded-loading-screen.md
git commit -m "fix: show branded loader while scene preferences hydrate"
```
