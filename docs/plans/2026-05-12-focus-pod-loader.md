# Focus Pod Loader Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Upgrade the existing branded loading screen into a polished Focus Pod loader that matches the app's dark glass UI and restrained emerald accent color.

**Architecture:** Keep the existing hydration-safe preference loading flow unchanged. Replace only the visual markup inside the `!preferencesLoaded` overlay in `src/app/page.tsx`. Use Tailwind classes only; do not add new assets, CSS files, dependencies, or extra state.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Tailwind CSS, existing `font-display`, `bg-primary`, glass/dark/neon design tokens.

---

### Task 1: Replace loader markup with restrained Focus Pod design

**Files:**
- Modify: `src/app/page.tsx:199-216`

**Step 1: Confirm test script status**

Run:
```bash
npm test
```

Expected: fails with missing `test` script because `package.json` does not define one. Continue with lint/build/manual verification.

**Step 2: Locate the current loader block**

In `src/app/page.tsx`, find:

```tsx
{!preferencesLoaded && (
  <div className="absolute inset-0 z-[80] flex items-center justify-center bg-black">
    ...
  </div>
)}
```

Only replace this block. Do not change the `preferencesLoaded` state flow or background rendering logic.

**Step 3: Replace with Focus Pod loader**

Use this exact markup:

```tsx
{!preferencesLoaded && (
  <div className="absolute inset-0 z-[80] flex items-center justify-center overflow-hidden bg-black">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(52,211,153,0.12),transparent_42%)]" />
    <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.04),transparent_35%,rgba(0,0,0,0.65))]" />

    <div className="relative flex w-[min(88vw,420px)] flex-col items-center rounded-[2rem] border border-white/10 bg-black/70 px-8 py-10 text-center shadow-[0_24px_80px_rgba(0,0,0,0.65)] backdrop-blur-2xl">
      <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-b from-white/10 to-transparent opacity-60" />
      <div className="absolute -top-20 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />

      <div className="relative mb-7 flex h-24 w-24 items-center justify-center">
        <div className="absolute inset-0 rounded-full border border-primary/20 shadow-[0_0_35px_rgba(52,211,153,0.16)]" />
        <div className="absolute inset-2 rounded-full border border-white/10" />
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary/80 animate-spin" />
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/15 bg-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.16)] backdrop-blur-xl">
          <div className="h-5 w-5 rounded-lg bg-primary shadow-[0_0_22px_rgba(52,211,153,0.55)]" />
        </div>
      </div>

      <div className="relative space-y-3">
        <p className="font-display text-2xl font-bold tracking-[0.32em] text-white drop-shadow-[0_0_18px_rgba(52,211,153,0.28)]">
          FOCUS FLOW
        </p>
        <p className="text-[11px] uppercase tracking-[0.38em] text-white/45">
          Preparing your focus space
        </p>
      </div>

      <div className="relative mt-7 flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-primary/90 shadow-[0_0_10px_rgba(52,211,153,0.65)] animate-pulse" />
        <span className="h-1.5 w-1.5 rounded-full bg-white/30 animate-pulse [animation-delay:150ms]" />
        <span className="h-1.5 w-1.5 rounded-full bg-white/20 animate-pulse [animation-delay:300ms]" />
      </div>
    </div>
  </div>
)}
```

Design constraints:
- Keep color palette mostly black/white/emerald.
- Do not add strong blue/purple/pink gradients.
- Keep the effect subtle and consistent with existing `glass-card`, Header, Sidebar, and SceneSelector styling.

**Step 4: Verify source lint**

Because a temporary `.claude/worktrees/...` directory may make full `npm run lint` scan unrelated files, first run:

```bash
npx eslint src
```

Expected: 0 errors. Existing warnings may remain.

If full lint is safe in the current workspace, also run:

```bash
npm run lint
```

Expected: 0 errors, unless unrelated temporary worktree files are still being scanned.

**Step 5: Verify production build**

Run:
```bash
npm run build
```

Expected: build succeeds. Existing warnings about multiple lockfiles/module type may remain.

**Step 6: Manual verification**

Run:
```bash
npm run dev
```

Manual checks:
1. Reload the page with a saved non-default scene.
2. Confirm the default scene does not flash.
3. Confirm the loader appears as a dark glass Focus Flow pod with subtle emerald accents.
4. Confirm there are no loud multicolor gradients.
5. Confirm saved scene appears after preferences load.
6. Confirm browser console has no hydration mismatch.

**Step 7: Commit**

Only commit if explicitly requested by the user.

```bash
git add src/app/page.tsx docs/plans/2026-05-12-focus-pod-loader.md
git commit -m "style: refine loading screen to match focus flow theme"
```
