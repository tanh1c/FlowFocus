'use client';

import {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
} from 'react';
import YouTube, { YouTubeProps } from 'react-youtube';
import { Music } from '@/services/music';

// Minimal shape of the YouTube player instance we use.
// Keeps us type-safe without pulling the full YT typings.
interface YouTubePlayerInstance {
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead?: boolean) => void;
  setVolume: (vol: number) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
}

interface YouTubeEvent {
  target: YouTubePlayerInstance;
  data?: number;
}

interface MusicContextType {
  playlist: Music[];
  setPlaylist: (tracks: Music[]) => void;
  currentTrackIndex: number;
  setCurrentTrackIndex: (index: number) => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  volume: number;
  setVolume: (vol: number) => void;
  isMuted: boolean;
  setIsMuted: (muted: boolean) => void;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  handleSeek: (vals: number[]) => void;
  handleNext: () => void;
  handlePrevious: () => void;
  handleVolumeChange: (vals: number[]) => void;
  currentTrack: Music | undefined;
  isLooping: boolean;
  setIsLooping: (val: boolean) => void;
  isShuffling: boolean;
  setIsShuffling: (val: boolean) => void;
}

export interface MusicTimeContextType {
  currentTime: number;
  duration: number;
  progress: number;
}

const MusicContext = createContext<MusicContextType | null>(null);
const MusicTimeContext = createContext<MusicTimeContextType | null>(null);

export function MusicProvider({ children }: { children: React.ReactNode }) {
  const [playlist, setPlaylist] = useState<Music[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ytPlayerRef = useRef<YouTubePlayerInstance | null>(null);
  const ytSyncInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastTimeUpdate = useRef(0);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const currentTrack = playlist[currentTrackIndex];
  const isYoutube = currentTrack?.type === 'youtube';

  // ---------------------------------------------------------------
  // Declare callbacks BEFORE effects that consume them.
  // This avoids the classic "stale closure" bug where audio's
  // `onEnded` captures an older `handleNext` and ignores changes
  // in loop/shuffle state.
  // ---------------------------------------------------------------
  const handleSeek = useCallback(
    (vals: number[]) => {
      const val = vals[0];
      const newTime = (val / 100) * duration;

      if (isYoutube && ytPlayerRef.current) {
        ytPlayerRef.current.seekTo(newTime, true);
        setCurrentTime(newTime);
      } else if (audioRef.current && audioRef.current.duration > 0) {
        audioRef.current.currentTime = newTime;
        setCurrentTime(newTime);
      }
    },
    [duration, isYoutube]
  );

  const handleVolumeChange = useCallback((vals: number[]) => {
    const val = vals[0];
    setVolume(val);
    if (val > 0) setIsMuted(false);

    if (ytPlayerRef.current) {
      ytPlayerRef.current.setVolume(val);
    }
    if (audioRef.current) {
      audioRef.current.volume = val / 100;
    }
  }, []);

  const handlePrevious = useCallback(() => {
    if (currentTrackIndex > 0) {
      setCurrentTrackIndex((prev) => prev - 1);
    } else if (audioRef.current && audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
    } else {
      setCurrentTrackIndex(playlist.length - 1);
    }
    setIsPlaying(true);
  }, [currentTrackIndex, playlist.length]);

  const handleNext = useCallback(() => {
    if (isLooping) {
      handleSeek([0]);
      setIsPlaying(true);
      return;
    }

    if (isShuffling && playlist.length > 1) {
      let nextIdx = currentTrackIndex;
      while (nextIdx === currentTrackIndex) {
        nextIdx = Math.floor(Math.random() * playlist.length);
      }
      setCurrentTrackIndex(nextIdx);
    } else {
      if (currentTrackIndex < playlist.length - 1) {
        setCurrentTrackIndex((prev) => prev + 1);
      } else {
        setCurrentTrackIndex(0);
      }
    }
    setIsPlaying(true);
  }, [currentTrackIndex, playlist.length, isLooping, isShuffling, handleSeek]);

  // Stable ref to `handleNext` so event listeners never capture a stale one.
  const handleNextRef = useRef(handleNext);
  useEffect(() => {
    handleNextRef.current = handleNext;
  }, [handleNext]);

  // Sync audio playback
  useEffect(() => {
    if (isYoutube) {
      if (audioRef.current) audioRef.current.pause();
      if (ytPlayerRef.current) {
        try {
          if (isPlaying) ytPlayerRef.current.playVideo();
          else ytPlayerRef.current.pauseVideo();
        } catch {
          /* player not ready yet */
        }
      }
    } else {
      // The <YouTube> component is completely unmounted now.
      // Calling pauseVideo() on it would throw origin/src errors in widgetapi.js.
      ytPlayerRef.current = null;
      if (audioRef.current) {
        if (isPlaying) {
          audioRef.current.play().catch(() => setIsPlaying(false));
        } else {
          audioRef.current.pause();
        }
      }
    }
  }, [isPlaying, currentTrackIndex, playlist, isYoutube]);

  // Time update handler - throttled to ~250ms
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => {
      if (isYoutube) return;
      const now = performance.now();
      if (now - lastTimeUpdate.current < 250) return;
      lastTimeUpdate.current = now;
      setCurrentTime(audio.currentTime);
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
    };
    const onEnded = () => {
      if (isYoutube) return;
      // Use the ref so the latest loop/shuffle state is always honored.
      handleNextRef.current();
    };
    const onLoadedMetadata = () => {
      if (isYoutube) return;
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
    };
  }, [currentTrackIndex, playlist.length, isYoutube]);

  // For youtube player time sync
  useEffect(() => {
    if (!isYoutube || !isPlaying) return;

    // One-time duration fetch
    if (ytPlayerRef.current) {
      try {
        const d = ytPlayerRef.current.getDuration();
        if (d > 0) setDuration(d);
      } catch {
        /* not ready */
      }
    }

    // Sync actual time every 500ms
    ytSyncInterval.current = setInterval(() => {
      if (ytPlayerRef.current) {
        try {
          const time = ytPlayerRef.current.getCurrentTime();
          if (time !== undefined && !isNaN(time)) {
            setCurrentTime(time);
          }
        } catch {
          /* not ready */
        }
      }
    }, 500);

    return () => {
      if (ytSyncInterval.current) {
        clearInterval(ytSyncInterval.current);
        ytSyncInterval.current = null;
      }
    };
  }, [isYoutube, isPlaying]);

  const value = useMemo<MusicContextType>(
    () => ({
      playlist,
      setPlaylist,
      currentTrackIndex,
      setCurrentTrackIndex,
      isPlaying,
      setIsPlaying,
      volume,
      setVolume,
      isMuted,
      setIsMuted,
      audioRef,
      handleSeek,
      handleNext,
      handlePrevious,
      handleVolumeChange,
      currentTrack,
      isLooping,
      setIsLooping,
      isShuffling,
      setIsShuffling,
    }),
    [
      playlist,
      currentTrackIndex,
      isPlaying,
      volume,
      isMuted,
      currentTrack,
      handleSeek,
      handleNext,
      handlePrevious,
      handleVolumeChange,
      isLooping,
      isShuffling,
    ]
  );

  const timeValue = useMemo<MusicTimeContextType>(
    () => ({ currentTime, duration, progress }),
    [currentTime, duration, progress]
  );

  // YouTube player config (Bypass Chrome Throttling Rules)
  const ytOptions: YouTubeProps['opts'] = useMemo(
    () => ({
      height: '250',
      width: '250',
      playerVars: {
        autoplay: 1,
        controls: 0,
        disablekb: 1,
        fs: 0,
        modestbranding: 1,
        playsinline: 1,
        rel: 0,
        iv_load_policy: 3,
      },
    }),
    []
  );

  const onYtReady: YouTubeProps['onReady'] = useCallback(
    (event: YouTubeEvent) => {
      ytPlayerRef.current = event.target;
      event.target.setVolume(isMuted ? 0 : volume);
      if (isPlaying) {
        event.target.playVideo();
      }
    },
    [isMuted, volume, isPlaying]
  );

  const onYtStateChange: YouTubeProps['onStateChange'] = useCallback(
    (event: YouTubeEvent) => {
      // YT.PlayerState.PLAYING === 1
      if (event.data === 1) {
        try {
          const d = event.target.getDuration();
          if (d > 0) setDuration(d);
          const t = event.target.getCurrentTime();
          if (t !== undefined) setCurrentTime(t);
        } catch {
          /* not ready */
        }
      }
      // YT.PlayerState.ENDED === 0
      else if (event.data === 0) {
        handleNextRef.current();
      }
    },
    []
  );

  const playerElements = useMemo(
    () => (
      <>
        {currentTrack && !isYoutube && (
          <audio ref={audioRef} src={currentTrack.audioUrl} autoPlay={isPlaying} />
        )}
        {/* Hidden YouTube Player (On-screen but invisible to bypass browser background tab/iframe limits) */}
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.01] pointer-events-none w-[250px] h-[250px] overflow-hidden z-[-9999]">
          {isYoutube && currentTrack?.audioUrl && (
            <YouTube
              videoId={currentTrack.audioUrl}
              opts={ytOptions}
              onReady={onYtReady}
              onStateChange={onYtStateChange}
              className="w-full h-full"
            />
          )}
        </div>
      </>
    ),
    [currentTrack, isYoutube, isPlaying, ytOptions, onYtReady, onYtStateChange]
  );

  return (
    <MusicContext.Provider value={value}>
      <MusicTimeContext.Provider value={timeValue}>
        {playerElements}
        {children}
      </MusicTimeContext.Provider>
    </MusicContext.Provider>
  );
}

export function useMusic() {
  const ctx = useContext(MusicContext);
  if (!ctx) throw new Error('useMusic must be used within MusicProvider');
  return ctx;
}

export function useMusicTime() {
  const ctx = useContext(MusicTimeContext);
  if (!ctx) throw new Error('useMusicTime must be used within MusicProvider');
  return ctx;
}
