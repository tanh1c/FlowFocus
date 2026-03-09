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

type PanelType = 'mixer' | 'scene' | 'timer' | 'youtube' | 'tasks' | 'notes'; // Removed '| null'

const defaultScene = '/scenes/city-architecture-landscape-digital-art.avif';

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
  const [isMounted, setIsMounted] = useState(false);
  const { state: appState, toggleZenMode } = useApp();
  const { isPlaying, setIsPlaying } = useMusic();

  // Load preferences on mount
  useEffect(() => {
    setIsMounted(true);
    const savedScene = localStorage.getItem('beeziee-current-scene');
    if (savedScene) setCurrentScene(savedScene);

    const savedFilter = localStorage.getItem('beeziee-current-filter');
    if (savedFilter) setCurrentFilter(savedFilter);

    const savedPixel = localStorage.getItem('beeziee-pixel-rendering') as 'crisp-edges' | 'pixelated';
    if (savedPixel) setPixelRendering(savedPixel);
  }, []);

  // Save preferences on change
  useEffect(() => {
    if (isMounted) localStorage.setItem('beeziee-current-scene', currentScene);
  }, [currentScene, isMounted]);
  useEffect(() => {
    if (isMounted) localStorage.setItem('beeziee-current-filter', currentFilter);
  }, [currentFilter, isMounted]);
  useEffect(() => {
    if (isMounted) localStorage.setItem('beeziee-pixel-rendering', pixelRendering);
  }, [pixelRendering, isMounted]);

  const togglePanel = (panel: PanelType) => {
    setActivePanels((prev) =>
      prev.includes(panel)
        ? prev.filter((p) => p !== panel)
        : [...prev, panel]
    );
  };

  const closePanel = (panel: PanelType) => {
    setActivePanels((prev) => prev.filter((p) => p !== panel));
  };

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  // --- Global Keyboard Shortcuts ---
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Skip if user is typing in an input/textarea
    const tag = (e.target as HTMLElement).tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement).isContentEditable) return;

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
        setActivePanels(prev => prev.length > 0 ? prev.slice(0, -1) : prev);
        break;
      case 'z':
        toggleZenMode();
        break;
    }
  }, [isPlaying, setIsPlaying, toggleZenMode]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black" suppressHydrationWarning>
      {/* Background Scene */}
      {(currentScene.endsWith('.mp4') || currentScene.endsWith('.webm')) ? (
        <video
          autoPlay loop muted playsInline
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: currentFilter, transition: 'filter 0.5s ease' }}
          src={currentScene}
        />
      ) : (currentScene.includes('github.com/user-attachments') || currentScene.endsWith('.gif')) ? (
        // Pixel GIF — use <img> so image-rendering:pixelated takes effect
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
        <img
          src={currentScene}
          alt="scene"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: currentFilter, transition: 'filter 0.5s ease' }}
        />
      )}

      {/* Dark Overlay - controlled by Settings */}
      {appState.settings.darkOverlay && (
        <div
          className="absolute inset-0 bg-black pointer-events-none z-[5] transition-opacity duration-500"
          style={{ opacity: appState.settings.darkOverlayOpacity / 100 }}
        />
      )}

      {/* Header - z-index 50 */}
      {/* Header - z-index 50 */}
      <div className={`transition-opacity duration-500 ${appState.settings.zenMode ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        <Header
          onMenuClick={() => console.log('Menu clicked')}
          onSelectScene={(scene) => setCurrentScene(scene.sceneUrl)}
        />
      </div>

      {/* Sidebar - z-index 40 */}
      <div className={`transition-opacity duration-500 ${appState.settings.zenMode ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
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
        onSelectScene={(scene) => setCurrentScene(scene.sceneUrl)}
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

      <div className={`transition-opacity duration-500 ${appState.settings.zenMode ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        <FocusPets />
      </div>

      <div className={`transition-opacity duration-500 ${appState.settings.zenMode ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
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
