'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { NowPlayingBar } from '@/components/features/NowPlayingBar';
import { SoundMixer } from '@/components/features/SoundMixer';
import { Scene, SceneSelector } from '@/components/features/SceneSelector';
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
const CUSTOM_SCENE_STORAGE_KEY = 'beeziee-current-custom-scene-id';
const FILTER_STORAGE_KEY = 'beeziee-current-filter';
const PIXEL_STORAGE_KEY = 'beeziee-pixel-rendering';
const CUSTOM_SCENE_DB_NAME = 'beeziee-custom-scenes';
const CUSTOM_SCENE_STORE_NAME = 'scenes';
const CUSTOM_SCENE_MAX_SIZE = 10 * 1024 * 1024;

const VIDEO_EXTENSIONS = ['.mp4', '.webm'];
const PIXEL_SCENE_EXTENSIONS = ['.gif'];
const IMAGE_EXTENSIONS = ['.avif', '.webp', '.png', '.jpg', '.jpeg', '.gif'];

type CustomSceneRecord = {
  id: string;
  name: string;
  type: 'IMAGE' | 'GIF';
  blob: Blob;
  createdAt: number;
};

function hasAnyExtension(url: string, extensions: string[]) {
  const pathname = url.split('?')[0].toLowerCase();
  return extensions.some((extension) => pathname.endsWith(extension));
}

function openCustomSceneDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(CUSTOM_SCENE_DB_NAME, 1);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(CUSTOM_SCENE_STORE_NAME)) {
        db.createObjectStore(CUSTOM_SCENE_STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function readCustomSceneRecords(): Promise<CustomSceneRecord[]> {
  const db = await openCustomSceneDb();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(CUSTOM_SCENE_STORE_NAME, 'readonly');
    const request = transaction.objectStore(CUSTOM_SCENE_STORE_NAME).getAll();

    request.onsuccess = () => {
      const records = (request.result as CustomSceneRecord[]).sort((a, b) => b.createdAt - a.createdAt);
      resolve(records);
    };
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => db.close();
    transaction.onerror = () => {
      db.close();
      reject(transaction.error);
    };
  });
}

async function saveCustomSceneRecord(record: CustomSceneRecord): Promise<void> {
  const db = await openCustomSceneDb();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(CUSTOM_SCENE_STORE_NAME, 'readwrite');
    transaction.objectStore(CUSTOM_SCENE_STORE_NAME).put(record);

    transaction.oncomplete = () => {
      db.close();
      resolve();
    };
    transaction.onerror = () => {
      db.close();
      reject(transaction.error);
    };
  });
}

async function deleteCustomSceneRecord(id: string): Promise<void> {
  const db = await openCustomSceneDb();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(CUSTOM_SCENE_STORE_NAME, 'readwrite');
    transaction.objectStore(CUSTOM_SCENE_STORE_NAME).delete(id);

    transaction.oncomplete = () => {
      db.close();
      resolve();
    };
    transaction.onerror = () => {
      db.close();
      reject(transaction.error);
    };
  });
}

function customSceneRecordToScene(record: CustomSceneRecord, sceneUrl: string): Scene {
  return {
    _id: record.id,
    name: record.name,
    sceneUrl,
    thumbnail: sceneUrl,
    category: 'custom',
    type: record.type,
    isPremium: false,
    viewCount: 0,
    favoriteCount: 0,
  };
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

function preloadHoverSceneAsset(sceneUrl: string): Promise<void> {
  if (hasAnyExtension(sceneUrl, VIDEO_EXTENSIONS)) return Promise.resolve();
  return preloadSceneAsset(sceneUrl);
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
  const [customScenes, setCustomScenes] = useState<Scene[]>([]);
  const customSceneUrlsRef = useRef<Map<string, string>>(new Map());
  const currentCustomSceneIdRef = useRef<string | null>(null);
  const hoverPreloadTimeoutRef = useRef<number | null>(null);
  const hoverPreloadedScenesRef = useRef<Set<string>>(new Set());

  const { state: appState, toggleZenMode } = useApp();
  const { isPlaying, setIsPlaying } = useMusic();

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const savedScene = localStorage.getItem(SCENE_STORAGE_KEY);
      const savedCustomSceneId = localStorage.getItem(CUSTOM_SCENE_STORAGE_KEY);
      const savedFilter = localStorage.getItem(FILTER_STORAGE_KEY);
      const savedPixel = localStorage.getItem(PIXEL_STORAGE_KEY);

      currentCustomSceneIdRef.current = savedCustomSceneId;
      if (savedScene && !savedCustomSceneId) setCurrentScene(savedScene);
      if (savedFilter) setCurrentFilter(savedFilter);
      if (savedPixel === 'crisp-edges' || savedPixel === 'pixelated') {
        setPixelRendering(savedPixel);
      }
      setPreferencesLoaded(true);
    });

    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (preferencesLoaded && !currentCustomSceneIdRef.current) {
      localStorage.setItem(SCENE_STORAGE_KEY, currentScene);
    }
  }, [currentScene, preferencesLoaded]);
  useEffect(() => {
    if (preferencesLoaded) localStorage.setItem(FILTER_STORAGE_KEY, currentFilter);
  }, [currentFilter, preferencesLoaded]);
  useEffect(() => {
    if (preferencesLoaded) localStorage.setItem(PIXEL_STORAGE_KEY, pixelRendering);
  }, [pixelRendering, preferencesLoaded]);

  const loadCustomScenes = useCallback(async () => {
    const records = await readCustomSceneRecords();

    customSceneUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    customSceneUrlsRef.current.clear();

    const scenes = records.map((record) => {
      const sceneUrl = URL.createObjectURL(record.blob);
      customSceneUrlsRef.current.set(record.id, sceneUrl);
      return customSceneRecordToScene(record, sceneUrl);
    });

    setCustomScenes(scenes);

    const savedCustomSceneId = currentCustomSceneIdRef.current;
    if (!savedCustomSceneId) return scenes;

    const savedScene = scenes.find((scene) => scene._id === savedCustomSceneId);
    if (savedScene) {
      setCurrentScene(savedScene.sceneUrl);
      localStorage.setItem(SCENE_STORAGE_KEY, savedScene.sceneUrl);
    } else {
      currentCustomSceneIdRef.current = null;
      localStorage.removeItem(CUSTOM_SCENE_STORAGE_KEY);
    }

    return scenes;
  }, []);

  useEffect(() => {
    if (!preferencesLoaded) return;

    void loadCustomScenes();

    const customSceneUrls = customSceneUrlsRef.current;

    return () => {
      customSceneUrls.forEach((url) => URL.revokeObjectURL(url));
      customSceneUrls.clear();
    };
  }, [loadCustomScenes, preferencesLoaded]);

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
    async (scene: { _id?: string; sceneUrl: string; category?: string }) => {
      const isCustomScene = scene.category === 'custom' && !!scene._id;
      currentCustomSceneIdRef.current = isCustomScene ? scene._id! : null;

      if (isCustomScene) {
        localStorage.setItem(CUSTOM_SCENE_STORAGE_KEY, scene._id!);
      } else {
        localStorage.removeItem(CUSTOM_SCENE_STORAGE_KEY);
      }

      if (scene.sceneUrl === currentScene) return;

      setIsSceneLoading(true);
      await preloadSceneAsset(scene.sceneUrl);
      setCurrentScene(scene.sceneUrl);
      setIsSceneLoading(false);
    },
    [currentScene]
  );

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

  const handleCancelPreloadScene = useCallback(() => {
    if (!hoverPreloadTimeoutRef.current) return;
    window.clearTimeout(hoverPreloadTimeoutRef.current);
    hoverPreloadTimeoutRef.current = null;
  }, []);

  const handleUploadScene = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/')) throw new Error('Invalid scene file type');
      if (file.size > CUSTOM_SCENE_MAX_SIZE) throw new Error('Scene file is too large');

      const id = `custom-${Date.now()}-${typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2)}`;
      const record: CustomSceneRecord = {
        id,
        name: file.name.replace(/\.[^/.]+$/, '') || 'Custom Scene',
        type: file.type === 'image/gif' ? 'GIF' : 'IMAGE',
        blob: file,
        createdAt: Date.now(),
      };

      await saveCustomSceneRecord(record);
      const scenes = await loadCustomScenes();
      const uploadedScene = scenes.find((scene) => scene._id === id);
      if (uploadedScene) await handleSelectScene(uploadedScene);
    },
    [handleSelectScene, loadCustomScenes]
  );

  const handleDeleteCustomScene = useCallback(
    async (scene: Scene) => {
      await deleteCustomSceneRecord(scene._id);
      const sceneUrl = customSceneUrlsRef.current.get(scene._id);
      if (sceneUrl) {
        URL.revokeObjectURL(sceneUrl);
        customSceneUrlsRef.current.delete(scene._id);
      }

      setCustomScenes((prev) => prev.filter((item) => item._id !== scene._id));

      if (currentCustomSceneIdRef.current === scene._id) {
        currentCustomSceneIdRef.current = null;
        localStorage.removeItem(CUSTOM_SCENE_STORAGE_KEY);
        await handleSelectScene({ sceneUrl: defaultScene });
      }
    },
    [handleSelectScene]
  );

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

            <div className="relative mb-7 flex h-28 w-28 items-center justify-center">
              <div className="absolute inset-0 rounded-[1.75rem] border border-primary/20 bg-primary/5 shadow-[0_0_45px_rgba(52,211,153,0.16)] animate-pulse" />
              <div className="absolute -left-1 top-7 h-2 w-2 bg-primary/70 shadow-[0_0_12px_rgba(52,211,153,0.7)] animate-ping" />
              <div className="absolute right-3 top-2 h-1.5 w-1.5 bg-white/40 animate-pulse [animation-delay:200ms]" />
              <div className="absolute bottom-4 left-4 h-1.5 w-1.5 bg-primary/50 animate-pulse [animation-delay:450ms]" />

              <svg
                viewBox="0 0 112 112"
                role="img"
                aria-label="Pixel focus portal loading"
                className="relative h-24 w-24 drop-shadow-[0_0_24px_rgba(52,211,153,0.28)]"
                shapeRendering="crispEdges"
              >
                <rect x="18" y="26" width="76" height="62" rx="0" fill="rgba(2,6,23,0.92)" />
                <rect x="22" y="30" width="68" height="54" fill="rgba(15,23,42,0.95)" />
                <rect x="30" y="38" width="52" height="30" fill="rgba(6,78,59,0.65)" />
                <rect x="34" y="42" width="44" height="22" fill="rgba(52,211,153,0.18)" />
                <rect x="38" y="46" width="8" height="8" fill="#34d399" className="animate-pulse" />
                <rect x="50" y="46" width="8" height="8" fill="#a7f3d0" className="animate-pulse [animation-delay:150ms]" />
                <rect x="62" y="46" width="8" height="8" fill="#34d399" className="animate-pulse [animation-delay:300ms]" />
                <rect x="42" y="58" width="28" height="4" fill="rgba(167,243,208,0.85)" />
                <rect x="26" y="74" width="60" height="6" fill="rgba(255,255,255,0.14)" />
                <rect x="34" y="80" width="12" height="8" fill="rgba(52,211,153,0.8)" />
                <rect x="66" y="80" width="12" height="8" fill="rgba(52,211,153,0.8)" />
                <rect x="14" y="88" width="84" height="6" fill="rgba(255,255,255,0.08)" />

                <rect x="14" y="22" width="8" height="8" fill="rgba(52,211,153,0.55)" className="animate-pulse" />
                <rect x="88" y="18" width="6" height="6" fill="rgba(167,243,208,0.8)" className="animate-pulse [animation-delay:250ms]" />
                <rect x="94" y="54" width="8" height="8" fill="rgba(52,211,153,0.55)" className="animate-pulse [animation-delay:500ms]" />
                <rect x="8" y="58" width="6" height="6" fill="rgba(255,255,255,0.35)" className="animate-pulse [animation-delay:650ms]" />

                <rect x="74" y="18" width="12" height="12" fill="rgba(2,6,23,0.95)" />
                <rect x="76" y="16" width="8" height="4" fill="#34d399" />
                <rect x="76" y="22" width="4" height="4" fill="#a7f3d0" />
                <rect x="82" y="22" width="4" height="4" fill="#a7f3d0" />
                <rect x="78" y="30" width="6" height="4" fill="rgba(52,211,153,0.85)" className="animate-pulse" />
              </svg>
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
        onCancelPreloadScene={handleCancelPreloadScene}
        pixelRendering={pixelRendering}
        onPixelRenderingChange={setPixelRendering}
        customScenes={customScenes}
        onUploadScene={handleUploadScene}
        onDeleteCustomScene={handleDeleteCustomScene}
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
