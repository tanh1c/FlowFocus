'use client';

import { useMusic } from '@/contexts/MusicContext';
import { Play, Pause } from 'lucide-react';

export function NowPlayingBar() {
  const { currentTrack, isPlaying, setIsPlaying } = useMusic();

  if (!currentTrack) return null;

  return (
    <div className="fixed bottom-6 left-6 z-30 flex items-center gap-3">
      {/* Album art - spinning disc */}
      <div className="relative shrink-0">
        <div
          className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/20 shadow-lg"
          style={isPlaying ? { animation: 'spin-slow 4s linear infinite' } : undefined}
        >
          <img
            src={currentTrack.image}
            alt={currentTrack.name}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        {/* Center dot for vinyl effect */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-2.5 h-2.5 rounded-full bg-black/80 border border-white/20" />
        </div>
      </div>

      {/* Track info */}
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-semibold truncate leading-tight font-sans drop-shadow-md">
          {currentTrack.name}
        </p>
        <p className="text-white/60 text-xs truncate font-sans drop-shadow-md">
          {currentTrack.author}
        </p>
      </div>

      {/* Play/Pause button */}
      <button
        onClick={() => setIsPlaying(!isPlaying)}
        className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 text-white transition-all active:scale-95"
      >
        {isPlaying ? (
          <Pause size={16} fill="currentColor" strokeWidth={0} />
        ) : (
          <Play size={16} fill="currentColor" strokeWidth={0} className="ml-0.5" />
        )}
      </button>
    </div>
  );
}
