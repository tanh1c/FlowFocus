'use client';

import { useState, useEffect, useCallback } from 'react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { NowPlayingBar } from '@/components/features/NowPlayingBar';
import { SoundMixer } from '@/components/features/SoundMixer';
import { SceneSelector } from '@/components/features/SceneSelector';
import { LandscapeWarning } from '@/components/layout/LandscapeWarning';
import { Timer } from '@/components/features/Timer';
import { TaskBoard } from '@/components/features/TaskBoard';
import { QuickNotes } from '@/components/features/QuickNotes';
import { FocusPets } from '@/components/features/FocusPets';
import { MusicProvider, useMusic } from '@/contexts/MusicContext';
import { AppProvider, useApp } from '@/contexts/AppContext';

type PanelType = 'mixer' | 'scene' | 'timer' | 'youtube' | 'tasks' | 'notes';

const defaultScene = '/scenes/city-architecture-landscape-digital-art.avif';

const SCENE_STORAGE_KEY = 'beeziee-current-scene';
const FILTER_STORAGE_KEY = 'beeziee-current-filter';
const PIXEL_STORAGE_KEY = 'beeziee-pixel-rendering';

const VIDEO_EXTENSIONS = ['.mp4', '.webm'];
const PIXEL_SCENE_EXTENSIONS = ['.gif'];
const IMAGE_EXTENSIONS = ['.avif', '.webp', '.png', '.jpg', '.jpeg', '.gif'];

function hasAnyExtension(url: string, extensions: string[]) {
  const pathname = url.split('?')[0].toLowerCase();
  return extensions.some((extension) => pathname.endsWith(extension));
}

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

export default function HomePage() {
  return (
    <>
      <LandscapeWarning />
      <MusicProvider>
        <AppProvider>
          <HomeContent />
        </AppProvider>
      </MusicProvider>
    </>
  );
}

function HomeContent() {
  const [activePanels, setActivePanels] = useState<PanelType[]>([]);
  const [currentScene, setCurrentScene] = useState(defaultScene);
  const [currentFilter, setCurrentFilter] = useState('none');
  const [pixelRendering, setPixelRendering] = useState<'crisp-edges' | 'pixelated'>('crisp-edges');
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);
  const [isSceneLoading, setIsSceneLoading] = useState(false);

  const { state: appState, toggleZenMode } = useApp();
  const { isPlaying, setIsPlaying } = useMusic();

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

  useEffect(() => {
    if (preferencesLoaded) localStorage.setItem(SCENE_STORAGE_KEY, currentScene);
  }, [currentScene, preferencesLoaded]);
  useEffect(() => {
    if (preferencesLoaded) localStorage.setItem(FILTER_STORAGE_KEY, currentFilter);
  }, [currentFilter, preferencesLoaded]);
  useEffect(() => {
    if (preferencesLoaded) localStorage.setItem(PIXEL_STORAGE_KEY, pixelRendering);
  }, [pixelRendering, preferencesLoaded]);

  // Stable callbacks so child components (Sidebar, SoundMixer, SceneSelector,
  // TaskBoard, QuickNotes, ...) don't re-render on every parent render.
  const togglePanel = useCallback((panel: PanelType) => {
    setActivePanels((prev) =>
      prev.includes(panel) ? prev.filter((p) => p !== panel) : [...prev, panel]
    );
  }, []);

  const closePanel = useCallback((panel: PanelType) => {
    setActivePanels((prev) => prev.filter((p) => p !== panel));
  }, []);

  const handleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }, []);

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

  const handlePreloadScene = useCallback((scene: { sceneUrl: string }) => {
    void preloadSceneAsset(scene.sceneUrl);
  }, []);

  // --- Global Keyboard Shortcuts ---
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Skip if user is typing in an input/textarea
      const tag = (e.target as HTMLElement).tagName;
      if (
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        (e.target as HTMLElement).isContentEditable
      )
        return;

      switch (e.key.toLowerCase()) {
        case ' ':
          e.preventDefault();
          setIsPlaying(!isPlaying);
          break;
        case 'f':
          handleFullscreen();
          break;
        case 'm':
          togglePanel('mixer');
          break;
        case 't':
          togglePanel('timer');
          break;
        case 'n':
          togglePanel('notes');
          break;
        case 'b':
          togglePanel('tasks');
          break;
        case 's':
          togglePanel('scene');
          break;
        case 'escape':
          // Close the most recently opened panel
          setActivePanels((prev) => (prev.length > 0 ? prev.slice(0, -1) : prev));
          break;
        case 'z':
          toggleZenMode();
          break;
      }
    },
    [isPlaying, setIsPlaying, toggleZenMode, togglePanel, handleFullscreen]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const isVideoScene = hasAnyExtension(currentScene, VIDEO_EXTENSIONS);
  const isPixelScene =
    currentScene.includes('github.com/user-attachments') ||
    hasAnyExtension(currentScene, PIXEL_SCENE_EXTENSIONS);

  return (
    <div
      className="relative h-screen w-screen overflow-hidden bg-black"
      suppressHydrationWarning
    >
      {/* Background Scene */}
      {preferencesLoaded && (
        isVideoScene ? (
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
            style={{ filter: currentFilter, transition: 'filter 0.5s ease' }}
            src={currentScene}
          />
        ) : isPixelScene ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={currentScene}
            alt="scene"
            className="absolute inset-0 w-full h-full object-cover"
            style={{
              filter: currentFilter,
              transition: 'filter 0.5s ease',
              imageRendering: pixelRendering,
            }}
          />
        ) : (
          // Static image — <img> lets browser apply hardware-accelerated decoding + better upscaling
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={currentScene}
            alt="scene"
            className="absolute inset-0 w-full h-full object-cover"
            style={{ filter: currentFilter, transition: 'filter 0.5s ease' }}
          />
        )
      )}

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

      {preferencesLoaded && isSceneLoading && (
        <div className="pointer-events-none absolute inset-x-0 top-8 z-[55] flex justify-center">
          <div className="flex items-center gap-3 rounded-full border border-white/10 bg-black/75 px-5 py-3 text-xs uppercase tracking-[0.24em] text-white/60 shadow-[0_12px_40px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
            <span className="h-2 w-2 rounded-full bg-primary shadow-[0_0_12px_rgba(52,211,153,0.75)] animate-pulse" />
            Loading scene
          </div>
        </div>
      )}

      {/* Dark Overlay - controlled by Settings */}
      {appState.settings.darkOverlay && (
        <div
          className="absolute inset-0 bg-black pointer-events-none z-[5] transition-opacity duration-500"
          style={{ opacity: appState.settings.darkOverlayOpacity / 100 }}
        />
      )}

      {/* Header - z-index 50 */}
      <div
        className={`transition-opacity duration-500 ${
          appState.settings.zenMode
            ? 'opacity-0 pointer-events-none'
            : 'opacity-100'
        }`}
      >
        <Header onSelectScene={handleSelectScene} />
      </div>

      {/* Sidebar - z-index 40 */}
      <div
        className={`transition-opacity duration-500 ${
          appState.settings.zenMode
            ? 'opacity-0 pointer-events-none'
            : 'opacity-100'
        }`}
      >
        <Sidebar
          activePanel={activePanels[activePanels.length - 1] || null}
          onMixerClick={() => togglePanel('mixer')}
          onSceneClick={() => togglePanel('scene')}
          onTimerClick={() => togglePanel('timer')}
          onYoutubeClick={() => togglePanel('youtube')}
          onTasksClick={() => togglePanel('tasks')}
          onNotesClick={() => togglePanel('notes')}
          onFullscreenClick={handleFullscreen}
        />
      </div>

      <SceneSelector
        isOpen={activePanels.includes('scene')}
        onClose={() => closePanel('scene')}
        currentScene={currentScene}
        currentFilter={currentFilter}
        onSelectFilter={setCurrentFilter}
        onSelectScene={handleSelectScene}
        onPreloadScene={handlePreloadScene}
        pixelRendering={pixelRendering}
        onPixelRenderingChange={setPixelRendering}
      />

      <SoundMixer
        isOpen={activePanels.includes('mixer')}
        onClose={() => closePanel('mixer')}
      />

      {activePanels.includes('timer') && (
        <Timer onClose={() => closePanel('timer')} />
      )}

      <TaskBoard
        isOpen={activePanels.includes('tasks')}
        onClose={() => closePanel('tasks')}
      />

      <QuickNotes
        isOpen={activePanels.includes('notes')}
        onClose={() => closePanel('notes')}
      />

      <div
        className={`transition-opacity duration-500 ${
          appState.settings.zenMode
            ? 'opacity-0 pointer-events-none'
            : 'opacity-100'
        }`}
      >
        <FocusPets />
      </div>

      <div
        className={`transition-opacity duration-500 ${
          appState.settings.zenMode
            ? 'opacity-0 pointer-events-none'
            : 'opacity-100'
        }`}
      >
        <NowPlayingBar />
      </div>

      {/* Zen Mode Indicator */}
      {appState.settings.zenMode && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white/20 text-sm font-light tracking-widest animate-pulse pointer-events-none select-none">
          ZEN MODE • PRESS Z TO EXIT
        </div>
      )}
    </div>
  );
}
