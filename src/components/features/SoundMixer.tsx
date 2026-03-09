'use client';

import { useState, useEffect, useRef } from 'react';
import { Slider } from '@/components/ui/slider';
import {
  Headphones,
  Coffee,
  Moon,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  Wind,
  CloudLightning,
  CloudRain,
  Bird,
  Loader2,
  Shuffle,
  VolumeX,
  ListMusic,
  X,
  Waves,
  Flame,
  TreeDeciduous,
  Keyboard,
  Plane,
  TrainFront,
  Users,
  Star,
  Fan,
  Umbrella,
  Droplets,
  Youtube,
  Plus,
  Repeat
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { fetchMusicByType } from '@/services/music';
import { useMusic, useMusicTime } from '@/contexts/MusicContext';
import { useApp } from '@/contexts/AppContext';

interface Mood {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  activeBg: string;
  activeBorder: string;
  activeGlow: string;
}

interface AmbientSound {
  id: string;
  name: string;
  icon: React.ReactNode;
  url: string;
}

function TimeControls({ handleSeek }: { handleSeek: (val: number[]) => void }) {
  const { progress, currentTime, duration } = useMusicTime();

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full px-1">
      <Slider
        min={0}
        max={100}
        step={0.1}
        value={[progress]}
        onValueChange={handleSeek}
        className="cursor-pointer"
      />
      <div className="flex justify-between text-[11px] text-white/90 font-bold mt-2 font-sans tracking-wide">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  );
}

interface SoundMixerProps {
  isOpen: boolean;
  onClose: () => void;
}

const moods: Mood[] = [
  { id: 'lofi', name: 'Lo-fi', icon: <Headphones size={20} />, color: 'text-purple-400', activeBg: 'bg-purple-500/20', activeBorder: 'border-purple-400/50', activeGlow: 'shadow-[0_0_20px_rgba(168,85,247,0.2)]' },
  { id: 'jazz', name: 'Jazz', icon: <Coffee size={20} />, color: 'text-amber-400', activeBg: 'bg-amber-500/20', activeBorder: 'border-amber-400/50', activeGlow: 'shadow-[0_0_20px_rgba(245,158,11,0.2)]' },
  { id: 'relax', name: 'Relax', icon: <Moon size={20} />, color: 'text-blue-400', activeBg: 'bg-blue-500/20', activeBorder: 'border-blue-400/50', activeGlow: 'shadow-[0_0_20px_rgba(59,130,246,0.2)]' },
];

const ambientSounds: AmbientSound[] = [
  { id: 'rain_forest', name: 'Rain Forest', icon: <TreeDeciduous size={16} />, url: 'https://assets.beeziee.com/sounds/rain_forest.mp3' },
  { id: 'summer_storm', name: 'Summer Storm', icon: <CloudLightning size={16} />, url: 'https://assets.beeziee.com/sounds/summer_storm.mp3' },
  { id: 'deepspace', name: 'Deep Space', icon: <Star size={16} />, url: 'https://assets.beeziee.com/sounds/deepspace.mp3' },
  { id: 'forest_night', name: 'Forest Night', icon: <Moon size={16} />, url: 'https://assets.beeziee.com/sounds/forest_night.mp3' },
  { id: 'people_talk', name: 'People Talk', icon: <Users size={16} />, url: 'https://assets.beeziee.com/sounds/people_talk_inside.mp3' },
  { id: 'window_rain', name: 'Window Rain', icon: <CloudRain size={16} />, url: 'https://assets.beeziee.com/sounds/window_rain.mp3' },
  { id: 'wind', name: 'Wind', icon: <Wind size={16} />, url: 'https://assets.beeziee.com/sounds/wind.mp3' },
  { id: 'rain_city', name: 'City Rain', icon: <Umbrella size={16} />, url: 'https://assets.beeziee.com/sounds/rain_city.mp3' },
  { id: 'waves', name: 'Waves', icon: <Waves size={16} />, url: 'https://assets.beeziee.com/sounds/waves.mp3' },
  { id: 'train', name: 'Train', icon: <TrainFront size={16} />, url: 'https://assets.beeziee.com/sounds/train.mp3' },
  { id: 'campfire', name: 'Campfire', icon: <Flame size={16} />, url: 'https://assets.beeziee.com/sounds/campfire.mp3' },
  { id: 'fan', name: 'Fan', icon: <Fan size={16} />, url: 'https://assets.beeziee.com/sounds/fan.mp3' },
  { id: 'fireplace', name: 'Fireplace', icon: <Flame size={16} />, url: 'https://assets.beeziee.com/sounds/fireplace.mp3' },
  { id: 'thunders', name: 'Thunders', icon: <CloudLightning size={16} />, url: 'https://assets.beeziee.com/sounds/thunders.mp3' },
  { id: 'keyboard', name: 'Keyboard', icon: <Keyboard size={16} />, url: 'https://assets.beeziee.com/sounds/keyboard.mp3' },
  { id: 'birds', name: 'Birds', icon: <Bird size={16} />, url: 'https://assets.beeziee.com/sounds/birds.mp3' },
  { id: 'river', name: 'River', icon: <Droplets size={16} />, url: 'https://assets.beeziee.com/sounds/river.mp3' },
  { id: 'underwater', name: 'Underwater', icon: <Waves size={16} />, url: 'https://assets.beeziee.com/sounds/underwater.mp3' },
  { id: 'airplane', name: 'Airplane', icon: <Plane size={16} />, url: 'https://assets.beeziee.com/sounds/airplane.mp3' },
];

export function SoundMixer({ isOpen, onClose }: SoundMixerProps) {
  const [activeMood, setActiveMood] = useState('lofi');
  const {
    isPlaying, setIsPlaying,
    volume, isMuted, setIsMuted,
    playlist, setPlaylist,
    currentTrackIndex, setCurrentTrackIndex,
    handleSeek, handleVolumeChange, handlePrevious, handleNext,
    currentTrack,
    isLooping, setIsLooping,
    isShuffling, setIsShuffling,
  } = useMusic();

  const [isLoading, setIsLoading] = useState(false);
  const [ytLink, setYtLink] = useState('');

  const handleYtSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ytLink.trim()) return;

    let videoId = '';
    try {
      if (ytLink.includes('youtu.be/')) {
        videoId = ytLink.split('youtu.be/')[1].split('?')[0];
      } else if (ytLink.includes('youtube.com/watch')) {
        videoId = new URL(ytLink).searchParams.get('v') || '';
      } else {
        videoId = ytLink.trim();
      }
    } catch {
      videoId = ytLink.trim();
    }

    if (videoId) {
      const customTrack = {
        _id: 'yt-' + videoId,
        name: 'YouTube Track',
        description: 'Custom YouTube Link',
        image: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
        audioUrl: videoId,
        author: 'YouTube',
        isPremium: false,
        deleted: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tags: [],
        type: 'youtube',
      };
      setPlaylist([customTrack, ...playlist]);
      setCurrentTrackIndex(0);
      setIsPlaying(true);
      setYtLink('');
    }
  };

  // Ambient Sounds State
  const [ambientVolumes, setAmbientVolumes] = useState<Record<string, number>>({});
  const ambientAudioRefs = useRef<Record<string, HTMLAudioElement>>({});

  /* Dragging Logic */
  const [isDragging, setIsDragging] = useState(false);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const dragStartPos = useRef<{ x: number; y: number } | null>(null);
  const dragOffset = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!panelRef.current) return;

      const newX = e.clientX - dragOffset.current.x;
      const newY = e.clientY - dragOffset.current.y;

      // Direct DOM update for performance
      panelRef.current.style.left = `${newX}px`;
      panelRef.current.style.top = `${newY}px`;
      panelRef.current.style.transform = 'none';

      dragStartPos.current = { x: newX, y: newY };
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      if (dragStartPos.current) {
        setPos(dragStartPos.current);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!panelRef.current) return;

    // Prevent dragging if clicking on a button or interactive element
    // Check if target is explicitly interactive or inside one
    const target = e.target as HTMLElement;
    if (target.tagName === 'BUTTON' || target.closest('button') || target.closest('.sound-mixer-control-btn') || target.closest('[role="slider"]')) return;

    const rect = panelRef.current.getBoundingClientRect();
    dragOffset.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };

    // Initialize drag start pos
    dragStartPos.current = { x: rect.left, y: rect.top }; // Current rect start

    setIsDragging(true);
  };

  // Handle Ambient Audio Updates
  useEffect(() => {
    ambientSounds.forEach((sound) => {
      const audio = ambientAudioRefs.current[sound.id];
      const vol = ambientVolumes[sound.id] || 0;

      if (audio) {
        audio.volume = vol / 100;
        if (vol > 0 && audio.paused) {
          audio.play().catch(e => console.error(`Error playing ${sound.name}`, e));
        } else if (vol === 0 && !audio.paused) {
          audio.pause();
        }
      }
    });
  }, [ambientVolumes]);

  // Fetch music when mood changes
  useEffect(() => {
    const loadMusic = async () => {
      setIsLoading(true);
      try {
        const musicData = await fetchMusicByType(activeMood);
        if (musicData && musicData.length > 0) {
          setPlaylist(musicData);
          setCurrentTrackIndex(0);
          setIsPlaying(false);
        } else {
          setPlaylist([]);
        }
      } catch (error) {
        console.error("Failed to load music", error);
        setPlaylist([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      loadMusic();
    }
  }, [activeMood, isOpen, setPlaylist, setCurrentTrackIndex, setIsPlaying]);

  const { state: appState } = useApp();
  const glassMode = appState.settings.glassMode;
  const nextTrack = playlist[(currentTrackIndex + 1) % playlist.length];

  return (
    <div
      ref={panelRef}
      className={cn(
        'glass-card fixed z-[100] flex flex-col rounded-3xl overflow-hidden',
        'h-[70vh] max-h-[34rem] w-[21rem]',
        isDragging ? 'shadow-[0_20px_50px_rgba(0,0,0,0.5)] cursor-grabbing' : 'shadow-2xl',
        !isDragging && 'transition-opacity duration-300',
        isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      )}
      style={{
        willChange: 'transform, opacity',
        ...(pos
          ? { left: pos.x, top: pos.y, transform: 'none' }
          : { right: '1.5rem', top: '50%', transform: 'translateY(-50%)' }
        ),
      }}
    >
      {/* Background Ambient Glow (for track art) - stays beneath title bar */}
      <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
        {currentTrack?.image && (
          <img
            src={currentTrack.image}
            alt="Mixer Background"
            referrerPolicy="no-referrer"
            className="absolute inset-0 opacity-20 z-0 transition-opacity duration-1000 object-cover w-full h-full"
            style={{ filter: 'blur(60px) saturate(1.5)' }}
          />
        )}
      </div>

      {/* macOS Title Bar */}
      <div
        className="flex items-center px-4 py-3 border-b border-white/10 shrink-0 relative bg-white/[0.02] cursor-grab active:cursor-grabbing z-10"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-1.5 absolute left-4 z-10">
          <button onClick={() => { setIsPlaying(false); onClose(); }} onMouseDown={(e) => e.stopPropagation()} className="w-3 h-3 rounded-full bg-[#ff5f56] hover:bg-[#ff5f56]/80 transition-colors shadow-sm" />
          <button onClick={() => { setIsPlaying(false); onClose(); }} onMouseDown={(e) => e.stopPropagation()} className="w-3 h-3 rounded-full bg-[#ffbd2e] hover:bg-[#ffbd2e]/80 transition-colors shadow-sm" />
          <button onMouseDown={(e) => e.stopPropagation()} className="w-3 h-3 rounded-full bg-[#27c93f] hover:bg-[#27c93f]/80 transition-colors shadow-sm" />
        </div>
        <h2 className="text-white/90 text-[13px] font-semibold tracking-wide w-full text-center pointer-events-none select-none">
          Sound Mixer
        </h2>
      </div>

      {/* Content Area */}
      <div className="relative z-10 flex flex-col min-h-0 flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto px-4 pt-4 pb-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] flex flex-col gap-6">

          {/* Moods Section */}
          <div className="shrink-0">
            <h3 className="text-[10px] font-bold text-white/70 uppercase tracking-widest mb-3 pl-1">
              Moods
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {moods.map((mood) => (
                <button
                  key={mood.id}
                  onClick={() => setActiveMood(mood.id)}
                  className={cn(
                    'group flex flex-col items-center justify-center gap-2 py-4 px-2 rounded-2xl transition-all duration-300 border relative overflow-hidden',
                    activeMood === mood.id
                      ? `${mood.activeBg} ${mood.activeBorder} ${mood.activeGlow}`
                      : 'bg-white/10 border-white/5 hover:bg-white/20 hover:border-white/20'
                  )}
                >
                  <div className={cn(
                    'p-2 rounded-full transition-all duration-300 relative z-10',
                    activeMood === mood.id ? `${mood.activeBg} ${mood.color} scale-110` : 'bg-white/10 text-white/90 group-hover:text-white'
                  )}>
                    {mood.icon}
                  </div>
                  <span className={cn(
                    'text-xs font-semibold max-w-full truncate relative z-10 font-sans',
                    activeMood === mood.id ? 'text-white' : 'text-white/90'
                  )}>
                    {mood.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* YouTube Custom Track Input */}
          <div className="shrink-0 bg-white/5 border border-white/5 p-3 rounded-2xl flex flex-col gap-2">
            <h3 className="text-[10px] font-bold text-white/70 uppercase tracking-widest pl-1 mb-1 flex items-center gap-1.5">
              <Youtube size={12} className="text-red-400" />
              Custom YouTube Audio
            </h3>
            <form onSubmit={handleYtSubmit} className="flex gap-2 relative z-20">
              <input
                type="text"
                placeholder="Paste YouTube link here..."
                value={ytLink}
                onChange={(e) => setYtLink(e.target.value)}
                onMouseDown={(e) => e.stopPropagation()} // Allow clicking inside
                className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-red-400/50 transition-colors"
              />
              <button
                type="submit"
                onMouseDown={(e) => e.stopPropagation()}
                disabled={!ytLink.trim()}
                className="bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 hover:border-red-500/50 disabled:opacity-50 disabled:cursor-not-allowed w-8 flex justify-center items-center rounded-xl transition-all"
              >
                <Plus size={16} />
              </button>
            </form>
          </div>

          {/* Now Playing Card */}
          <div className="bg-black/60 rounded-2xl p-4 border border-white/10 backdrop-blur-md relative group shrink-0 shadow-xl overflow-visible">
            {/* Loop Button (replaced Bee) */}
            <div className="absolute top-3 right-3 z-30">
              <button
                onClick={(e) => { e.stopPropagation(); setIsLooping(!isLooping); }}
                className={cn(
                  "p-1.5 rounded-full transition-all sound-mixer-control-btn active:scale-95",
                  isLooping ? "bg-primary/20 text-primary shadow-[0_0_15px_rgba(var(--primary),0.3)]" : "text-white/40 hover:text-white/80 hover:bg-white/10"
                )}
                title="Toggle Loop"
              >
                <Repeat size={14} />
              </button>
            </div>

            {isLoading ? (
              <div className="h-48 flex flex-col items-center justify-center gap-3 text-white/40">
                <Loader2 className="animate-spin" size={24} />
                <span className="text-xs font-sans">Loading tracks...</span>
              </div>
            ) : currentTrack ? (
              <>
                <div className="flex flex-col gap-4">
                  {/* Top Row: Art + Info */}
                  <div className="flex items-start gap-3 pr-8">
                    <div className={cn(
                      "w-16 h-16 rounded-xl flex items-center justify-center border border-white/10 transition-all duration-500 overflow-hidden relative shrink-0 shadow-lg",
                      isPlaying ? "shadow-primary/20" : "bg-white/5"
                    )}>
                      <img
                        src={currentTrack.image}
                        alt={currentTrack.name}
                        className={cn("w-full h-full object-cover transition-transform duration-[20s]", isPlaying ? "scale-110" : "scale-100")}
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col justify-center pt-1 gap-1">
                      <h4 className="text-white font-bold text-sm leading-snug line-clamp-2 font-sans drop-shadow-sm" title={currentTrack.name}>
                        {currentTrack.name}
                      </h4>
                      <p className="text-white/90 text-xs font-medium uppercase tracking-wide truncate font-sans" title={currentTrack.author}>
                        {currentTrack.author}
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <TimeControls handleSeek={handleSeek} />

                  {/* Controls Row */}
                  <div className="flex items-center justify-between px-1 pt-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); setIsShuffling(!isShuffling); }}
                      className={cn(
                        "transition-all p-1.5 rounded-full sound-mixer-control-btn active:scale-95",
                        isShuffling ? "text-primary bg-primary/20 shadow-[0_0_15px_rgba(var(--primary),0.3)]" : "text-white hover:text-white hover:bg-white/10"
                      )}
                      title="Toggle Shuffle"
                    >
                      <Shuffle size={15} />
                    </button>

                    <div className="flex items-center gap-4">
                      <button
                        onClick={handlePrevious}
                        className="text-white hover:text-white/80 transition-colors hover:scale-110 active:scale-95 sound-mixer-control-btn"
                      >
                        <SkipBack size={20} fill="currentColor" />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsPlaying(!isPlaying);
                        }}
                        className="w-11 h-11 flex-shrink-0 rounded-full flex items-center justify-center bg-white text-black hover:scale-105 active:scale-95 transition-all shadow-[0_0_15px_rgba(255,255,255,0.3)] hover:shadow-[0_0_20px_rgba(255,255,255,0.5)] sound-mixer-control-btn"
                      >
                        {isPlaying ? (
                          <Pause size={20} fill="currentColor" strokeWidth={0} />
                        ) : (
                          <Play size={20} fill="currentColor" strokeWidth={0} className="ml-0.5" />
                        )}
                      </button>

                      <button
                        onClick={handleNext}
                        className="text-white hover:text-white/80 transition-colors hover:scale-110 active:scale-95 sound-mixer-control-btn"
                      >
                        <SkipForward size={20} fill="currentColor" />
                      </button>
                    </div>

                    <div className="relative group/volume">
                      <button
                        onClick={() => {
                          if (isMuted || volume === 0) {
                            handleVolumeChange([80]);
                            setIsMuted(false);
                          } else {
                            setIsMuted(true);
                            handleVolumeChange([0]);
                          }
                        }}
                        className="text-white hover:text-white/80 transition-colors p-1.5 hover:bg-white/10 rounded-full sound-mixer-control-btn"
                      >
                        {isMuted || volume === 0 ? <VolumeX size={15} /> : <Volume2 size={15} />}
                      </button>

                      {/* Vertical Volume Slider Pop-up */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-3 bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-xl opacity-0 invisible group-hover/volume:opacity-100 group-hover/volume:visible transition-all duration-200 z-50 flex flex-col items-center gap-2 w-10 after:content-[''] after:absolute after:top-full after:left-0 after:w-full after:h-4 after:bg-transparent">
                        <div className="h-24 w-full flex justify-center">
                          <Slider
                            orientation="vertical"
                            min={0}
                            max={100}
                            step={1}
                            value={[isMuted ? 0 : volume]}
                            onValueChange={handleVolumeChange}
                            className="h-full w-2"
                          />
                        </div>
                        <span className="text-[10px] font-mono text-white/50 w-full text-center">{isMuted ? 0 : volume}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="h-48 flex items-center justify-center text-white/40 text-sm font-sans">
                No music available
              </div>
            )}
          </div>

          {/* Up Next List */}
          {playlist.length > 1 && (
            <div className="shrink-0">
              <p className="text-[10px] font-bold text-white/60 uppercase tracking-wider mb-2 pl-2">Up Next</p>
              <div className="flex flex-col gap-2 max-h-[180px] overflow-y-auto pr-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                {[...playlist.slice(currentTrackIndex + 1), ...playlist.slice(0, currentTrackIndex)].map((track, i) => {
                  const originalIndex = playlist.indexOf(track);
                  return (
                    <div
                      key={`${track.name}-${i}`}
                      className="flex items-center gap-3 bg-black/40 p-2.5 rounded-xl border border-white/10 group hover:bg-white/10 transition-colors hover:border-white/20 cursor-pointer"
                      onClick={() => {
                        setCurrentTrackIndex(originalIndex);
                        setIsPlaying(true);
                      }}
                    >
                      <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0 border border-white/10 relative">
                        {track.image && <img src={track.image} alt={track.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/40 transition-opacity">
                          <Play size={12} fill="white" className="text-white" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-xs font-semibold truncate font-sans">{track.name}</p>
                        <p className="text-white/50 text-[10px] truncate font-sans">{track.author}</p>
                      </div>
                      <ListMusic size={14} className="text-white/30 group-hover:text-white/70 transition-colors" />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Ambient Sounds */}
          <div className="shrink-0 pb-2">
            <h3 className="text-[10px] font-bold text-white/70 uppercase tracking-widest mb-3 pl-1">
              Ambient Layers
            </h3>
            <div className="flex flex-col gap-2">
              {ambientSounds.map((sound) => (
                <div key={sound.id} className="flex items-center justify-between p-3 bg-black/40 hover:bg-white/10 rounded-xl transition-colors border border-white/5 hover:border-white/20 group">
                  <div className="flex items-center gap-3 text-sm text-white group-hover:text-white transition-colors">
                    <span className="text-white/80 group-hover:text-primary transition-colors">{sound.icon}</span>
                    <span className="font-sans font-medium">{sound.name}</span>
                  </div>
                  {/* Audio Element */}
                  <audio
                    ref={(el) => {
                      if (el) ambientAudioRefs.current[sound.id] = el;
                    }}
                    src={sound.url}
                    loop
                  />
                  <div className="w-24">
                    <Slider
                      min={0}
                      max={100}
                      step={1}
                      value={[ambientVolumes[sound.id] || 0]}
                      onValueChange={(vals) => setAmbientVolumes(prev => ({ ...prev, [sound.id]: vals[0] }))}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
