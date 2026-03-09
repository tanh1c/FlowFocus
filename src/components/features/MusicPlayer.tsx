'use client';

import { useState, useRef, useEffect } from 'react';
import { Slider } from '@/components/ui/slider';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { formatDuration } from '@/lib/utils';

interface MusicPlayerProps {
  audioSrc?: string;
  onPlayStateChange?: (isPlaying: boolean) => void;
}

export function MusicPlayer({ audioSrc, onPlayStateChange }: MusicPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration || 0);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
    };
  }, [audioSrc]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
    onPlayStateChange?.(!isPlaying);
  };

  const handleSeek = (value: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = value;
    setCurrentTime(value);
  };

  const handleVolumeChange = (value: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = value;
    setVolume(value);
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="w-full max-w-lg mb-0">
      <GlassCard rounded="full" className="px-6 py-2">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-4">
            {/* Play Button */}
            <button
              onClick={togglePlay}
              className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-black hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)]"
            >
              {isPlaying ? <Pause size={20} /> : <Play size={20} fill="currentColor" />}
            </button>

            {/* Skip Controls */}
            <button className="text-white/80 hover:text-white transition-all flex-shrink-0">
              <SkipBack size={18} fill="currentColor" />
            </button>
            <button className="text-white/80 hover:text-white transition-all flex-shrink-0">
              <SkipForward size={18} fill="currentColor" />
            </button>

            {/* Volume Control */}
            <div
              className="flex items-center gap-2 flex-shrink-0 group"
              onMouseEnter={() => setShowVolumeSlider(true)}
              onMouseLeave={() => setShowVolumeSlider(false)}
            >
              <button
                onClick={() => handleVolumeChange(volume > 0 ? 0 : 1)}
                className="text-white/80 hover:text-white transition-all"
              >
                {volume > 0 ? <Volume2 size={18} /> : <VolumeX size={18} />}
              </button>
              <div
                className={`transition-all duration-300 ${showVolumeSlider ? 'w-20 opacity-100' : 'w-0 opacity-0'
                  } overflow-hidden`}
              >
                <Slider
                  min={0}
                  max={1}
                  step={0.01}
                  value={[volume]}
                  onValueChange={(vals) => handleVolumeChange(vals[0])}
                />
              </div>
            </div>

            {/* Progress Slider */}
            <div className="flex-1 min-w-0">
              <Slider
                min={0}
                max={duration || 100}
                step={0.1}
                value={[currentTime]}
                onValueChange={(vals) => handleSeek(vals[0])}
              />
            </div>

            {/* Time Display */}
            <div
              className="text-white/90 text-sm font-medium flex-shrink-0"
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {formatDuration(currentTime)} / {formatDuration(duration)}
            </div>
          </div>
        </div>
      </GlassCard>

      <audio ref={audioRef} src={audioSrc} preload="metadata" />
    </div>
  );
}
