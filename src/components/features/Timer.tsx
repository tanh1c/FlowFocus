'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Maximize2,
  Minimize2,
  X,
  MoreHorizontal,
  Flame
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useApp } from '@/contexts/AppContext';

type TimerMode = 'pomodoro' | 'stopwatch';

interface TimerProps {
  className?: string;
  onClose?: () => void;
}

export function Timer({ className, onClose }: TimerProps) {
  const { recordFocusSession, failFocusSession, state, updateSettings } = useApp();
  const [mode, setMode] = useState<TimerMode>('pomodoro');
  const [timeRemaining, setTimeRemaining] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [sessionFailed, setSessionFailed] = useState(false);

  const [pomodoroDuration, setPomodoroDuration] = useState(25);
  const [showSettings, setShowSettings] = useState(false);
  const [appearance, setAppearance] = useState({ color: '#ffffff', scale: 1, fontIndex: 0 });
  const [activeSettingsTab, setActiveSettingsTab] = useState<'general' | 'appearance'>('general');

  const FONT_OPTIONS = [
    { name: 'Minimal', class: 'font-sans font-bold tracking-tighter', style: {} },
    { name: 'Minimal Light', class: 'font-sans font-light tracking-tight', style: {} },
    { name: 'Serif', class: 'font-serif font-bold tracking-tight', style: {} },
    { name: 'Serif Cond', class: 'font-serif font-black tracking-[-0.08em]', style: {} },
    { name: 'Handwritten', class: 'font-normal tracking-wide text-2xl', style: { fontFamily: 'var(--font-dancing)' } },
  ];
  const activeFont = FONT_OPTIONS[appearance.fontIndex] || FONT_OPTIONS[0];

  // Dragging State
  const [isDragging, setIsDragging] = useState(false);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const timerRef = useRef<HTMLDivElement>(null);

  // Timer Logic
  const sessionRecorded = useRef(false);
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && timeRemaining > 0) {
      sessionRecorded.current = false;
      interval = setInterval(() => {
        setTimeRemaining((prev) => prev - 1);
      }, 1000);
    } else if (timeRemaining === 0 && !sessionRecorded.current) {
      setIsRunning(false);
      if (mode === 'pomodoro') {
        recordFocusSession(pomodoroDuration);
        sessionRecorded.current = true;
      }
    }
    return () => clearInterval(interval);
  }, [isRunning, timeRemaining, mode, pomodoroDuration, recordFocusSession]);

  // Strict Mode Logic (Visibility Change)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && isRunning && state.settings.strictMode && mode === 'pomodoro') {
        setIsRunning(false);
        setSessionFailed(true);
        failFocusSession(pomodoroDuration); // Penalty: lose coins and break streak
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isRunning, state.settings.strictMode, mode, pomodoroDuration, failFocusSession]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleTimer = () => {
    if (sessionFailed) {
      setSessionFailed(false);
      setTimeRemaining(mode === 'pomodoro' ? pomodoroDuration * 60 : 0);
    }
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setSessionFailed(false);
    setTimeRemaining(mode === 'pomodoro' ? pomodoroDuration * 60 : 0);
  };

  const changeMode = (newMode: TimerMode) => {
    setMode(newMode);
    setIsRunning(false);
    setSessionFailed(false);
    setTimeRemaining(newMode === 'pomodoro' ? pomodoroDuration * 60 : 0);
  };

  const saveSettings = (newDuration: number) => {
    setPomodoroDuration(newDuration);
    if (mode === 'pomodoro') {
      setIsRunning(false);
      setTimeRemaining(newDuration * 60);
    }
    setShowSettings(false);
  };

  // Drag Handlers
  useEffect(() => {
    if (!isDragging) return;
    const handleMouseMove = (e: MouseEvent) => {
      setPos({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y,
      });
    };
    const handleMouseUp = () => setIsDragging(false);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!timerRef.current) return;
    if ((e.target as HTMLElement).closest('button')) return;

    const rect = timerRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    setPos({
      x: rect.left,
      y: rect.top,
    });
    setIsDragging(true);
  };

  if (isExpanded) {
    return (
      <div
        className="fixed inset-0 z-[100] flex flex-col items-center justify-center pointer-events-none animate-in fade-in zoom-in-95 duration-300"
      >

        {/* Interactive Container */}
        <div className="flex flex-col items-center gap-8 pointer-events-auto group relative">

          {/* Settings Modal Overlay */}
          {showSettings && (
            <div className="absolute inset-0 z-[200] flex items-center justify-center p-4" onClick={() => setShowSettings(false)}>
              <div
                className="w-full max-w-sm bg-[#0a0a0a]/90 backdrop-blur-3xl border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="relative px-8 pt-6 pb-2 text-center">
                  <h3 className="text-lg font-medium text-white/90 tracking-wide">Settings</h3>
                  <button
                    onClick={() => setShowSettings(false)}
                    className="absolute right-6 top-6 p-2 text-white/30 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-all"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Tabs */}
                <div className="px-8 mt-4">
                  <div className="flex p-1 bg-white/5 rounded-full relative">
                    {/* Animated background for active tab could be complex, using simple conditional class for now */}
                    <button
                      onClick={() => setActiveSettingsTab('general')}
                      className={cn(
                        "flex-1 py-2.5 text-xs font-bold rounded-full transition-all duration-300 tracking-wider",
                        activeSettingsTab === 'general' ? "bg-white text-black shadow-lg" : "text-white/40 hover:text-white"
                      )}
                    >
                      GENERAL
                    </button>
                    <button
                      onClick={() => setActiveSettingsTab('appearance')}
                      className={cn(
                        "flex-1 py-2.5 text-xs font-bold rounded-full transition-all duration-300 tracking-wider",
                        activeSettingsTab === 'appearance' ? "bg-white text-black shadow-lg" : "text-white/40 hover:text-white"
                      )}
                    >
                      APPEARANCE
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-8 min-h-[300px]">
                  {activeSettingsTab === 'general' ? (
                    <div className="space-y-8 animate-in slide-in-from-right-4 duration-300 fade-in">
                      <div className="space-y-4">
                        <label className="text-xs text-white/40 font-bold tracking-[0.2em] uppercase block text-center">Focus Duration</label>

                        <div className="flex items-center justify-center gap-6">
                          <button
                            onClick={() => {
                              const newVal = Math.max(1, pomodoroDuration - 1);
                              setPomodoroDuration(newVal);
                              if (mode === 'pomodoro' && !isRunning) setTimeRemaining(newVal * 60);
                            }}
                            className="w-12 h-12 rounded-full border border-white/10 bg-white/5 text-white flex items-center justify-center hover:bg-white/20 hover:scale-105 active:scale-95 transition-all text-xl"
                          >
                            -
                          </button>

                          <div className="flex flex-col items-center w-24">
                            <span className="text-4xl font-bold text-white tabular-nums tracking-tight">
                              {pomodoroDuration}
                            </span>
                            <span className="text-xs text-white/30 font-medium uppercase tracking-wider mt-1">
                              Minutes
                            </span>
                          </div>

                          <button
                            onClick={() => {
                              const newVal = Math.min(120, pomodoroDuration + 1);
                              setPomodoroDuration(newVal);
                              if (mode === 'pomodoro' && !isRunning) setTimeRemaining(newVal * 60);
                            }}
                            className="w-12 h-12 rounded-full border border-white/10 bg-white/5 text-white flex items-center justify-center hover:bg-white/20 hover:scale-105 active:scale-95 transition-all text-xl"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Precise Time Setting */}
                      <div className="space-y-6 pt-6 mt-6 border-t border-white/10">
                        <label className="text-xs text-white/40 font-bold tracking-[0.2em] uppercase block text-center">Precise Time</label>
                        <div className="flex items-center justify-center gap-2">
                          {/* Hours */}
                          <div className="flex flex-col items-center">
                            <input
                              type="number"
                              min="0"
                              max="23"
                              value={Math.floor(timeRemaining / 3600)}
                              onChange={(e) => {
                                const h = Math.max(0, Math.min(23, parseInt(e.target.value) || 0));
                                const m = Math.floor((timeRemaining % 3600) / 60);
                                const s = timeRemaining % 60;
                                const total = h * 3600 + m * 60 + s;
                                setTimeRemaining(total);
                                setPomodoroDuration(Math.round(total / 60));
                              }}
                              className="w-16 h-14 bg-white/5 border border-white/10 rounded-xl text-white text-center font-mono text-2xl font-bold focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none leading-none"
                            />
                            <span className="text-[10px] text-white/30 mt-1.5 uppercase tracking-wider">hrs</span>
                          </div>

                          <span className="text-2xl text-white/20 font-bold pb-5">:</span>

                          {/* Minutes */}
                          <div className="flex flex-col items-center">
                            <input
                              type="number"
                              min="0"
                              max="59"
                              value={Math.floor((timeRemaining % 3600) / 60)}
                              onChange={(e) => {
                                const h = Math.floor(timeRemaining / 3600);
                                const m = Math.max(0, Math.min(59, parseInt(e.target.value) || 0));
                                const s = timeRemaining % 60;
                                const total = h * 3600 + m * 60 + s;
                                setTimeRemaining(total);
                                setPomodoroDuration(Math.round(total / 60));
                              }}
                              className="w-16 h-14 bg-white/5 border border-white/10 rounded-xl text-white text-center font-mono text-2xl font-bold focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none leading-none"
                            />
                            <span className="text-[10px] text-white/30 mt-1.5 uppercase tracking-wider">min</span>
                          </div>

                          <span className="text-2xl text-white/20 font-bold pb-5">:</span>

                          {/* Seconds */}
                          <div className="flex flex-col items-center">
                            <input
                              type="number"
                              min="0"
                              max="59"
                              value={timeRemaining % 60}
                              onChange={(e) => {
                                const h = Math.floor(timeRemaining / 3600);
                                const m = Math.floor((timeRemaining % 3600) / 60);
                                const s = Math.max(0, Math.min(59, parseInt(e.target.value) || 0));
                                const total = h * 3600 + m * 60 + s;
                                setTimeRemaining(total);
                                setPomodoroDuration(Math.round(total / 60));
                              }}
                              className="w-16 h-14 bg-white/5 border border-white/10 rounded-xl text-white text-center font-mono text-2xl font-bold focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none leading-none"
                            />
                            <span className="text-[10px] text-white/30 mt-1.5 uppercase tracking-wider">sec</span>
                          </div>
                        </div>
                      </div>

                      {/* Strict Mode Toggle */}
                      <div className="pt-6 mt-6 border-t border-white/10 flex items-center justify-between px-2">
                        <div>
                          <label className="text-xs text-white/90 font-bold block mb-1 flex items-center gap-1.5">
                            Strict Mode
                            <Flame size={12} className={cn("transition-colors duration-500", state.settings.strictMode ? "text-red-400" : "text-white/20")} />
                          </label>
                          <p className="text-[10px] text-white/40 leading-tight max-w-[200px]">Leaving this tab while timer is running will fail the session and break your streak!</p>
                        </div>
                        <button
                          onClick={() => updateSettings({ strictMode: !state.settings.strictMode })}
                          className={cn(
                            "relative w-12 h-6 rounded-full transition-all duration-300",
                            state.settings.strictMode ? "bg-red-500/80 shadow-[0_0_15px_rgba(239,68,68,0.5)]" : "bg-white/10 hover:bg-white/20"
                          )}
                        >
                          <div className={cn(
                            "absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-300",
                            state.settings.strictMode ? "translate-x-6" : "translate-x-0"
                          )} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-8 animate-in slide-in-from-right-4 duration-300 fade-in">
                      {/* Color Picker */}
                      <div className="space-y-4">
                        <label className="text-xs text-white/40 font-bold tracking-[0.2em] uppercase block text-center">Accent Color</label>
                        <div className="flex justify-center gap-4 flex-wrap">
                          {['#ffffff', '#34d399', '#60a5fa', '#f472b6', '#fbbf24', '#f87171'].map((c) => (
                            <button
                              key={c}
                              onClick={() => setAppearance(prev => ({ ...prev, color: c }))}
                              className={cn(
                                "w-10 h-10 rounded-full transition-all duration-300",
                                appearance.color === c
                                  ? "scale-110 ring-2 ring-white ring-offset-4 ring-offset-[#0a0a0a] shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                                  : "hover:scale-105 hover:opacity-80 scale-90 opacity-60"
                              )}
                              style={{ backgroundColor: c }}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Typography Settings */}
                      <div className="space-y-4 pt-1">
                        <label className="text-xs text-white/40 font-bold tracking-[0.2em] uppercase block text-center">Style</label>
                        <div className="grid grid-cols-2 gap-2 px-2">
                          {FONT_OPTIONS.map((f, i) => (
                            <button
                              key={i}
                              onClick={() => setAppearance(prev => ({ ...prev, fontIndex: i }))}
                              className={cn(
                                "flex items-center justify-center h-10 px-2 rounded-xl border transition-all truncate",
                                appearance.fontIndex === i
                                  ? "border-white bg-white/10 text-white shadow-md cursor-default"
                                  : "border-white/10 bg-black/40 text-white/50 hover:bg-white/5 hover:text-white"
                              )}
                              style={f.style}
                            >
                              <span className={cn(f.class, f.name === 'Handwritten' ? "text-lg -mt-1" : "text-sm")}>{f.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Size Slider */}
                      <div className="space-y-4 pt-2">
                        <div className="flex justify-between items-end px-2">
                          <label className="text-xs text-white/40 font-bold tracking-[0.2em] uppercase">Scale</label>
                          <span className="text-xs font-mono text-white/70 bg-white/10 px-2 py-0.5 rounded text-[10px]">{appearance.scale.toFixed(1)}x</span>
                        </div>
                        <div className="relative h-6 flex items-center">
                          <div className="absolute w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-white transition-all duration-200"
                              style={{ width: `${((appearance.scale - 0.5) / 1) * 100}%` }}
                            />
                          </div>
                          <input
                            type="range"
                            min="0.5"
                            max="1.5"
                            step="0.1"
                            value={appearance.scale}
                            onChange={(e) => setAppearance(prev => ({ ...prev, scale: parseFloat(e.target.value) }))}
                            className="absolute w-full h-full opacity-0 cursor-pointer"
                          />
                          <div
                            className="w-4 h-4 rounded-full bg-white shadow-lg pointer-events-none absolute transition-all duration-200"
                            style={{ left: `${((appearance.scale - 0.5) / 1) * 100}%`, transform: 'translateX(-50%)' }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* Top Controls Row - Auto Hide */}
          <div
            className={cn(
              "flex items-center gap-4 transition-all duration-500 ease-out",
              !showSettings && "opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0"
            )}
          >
            {/* Mode Toggle Pill */}
            <div className="flex p-1 bg-black/40 backdrop-blur-md rounded-full border border-white/10">
              <button
                onClick={() => changeMode('pomodoro')}
                className={cn(
                  "px-6 py-2 rounded-full text-sm font-bold tracking-wider transition-all",
                  mode === 'pomodoro' ? "bg-white text-black shadow-lg" : "text-white/70 hover:text-white"
                )}
              >
                POMODORO
              </button>
              <button
                onClick={() => changeMode('stopwatch')}
                className={cn(
                  "px-6 py-2 rounded-full text-sm font-bold tracking-wider transition-all",
                  mode === 'stopwatch' ? "bg-white text-black shadow-lg" : "text-white/70 hover:text-white"
                )}
              >
                STOPWATCH
              </button>
            </div>

            {/* Minimize Button */}
            <button
              onClick={() => setIsExpanded(false)}
              className="p-3 bg-black/40 backdrop-blur-md rounded-full text-white/70 hover:text-white hover:bg-black/60 border border-white/10 transition-all"
            >
              <Minimize2 size={20} />
            </button>
          </div>

          <div
            className={cn(
              "leading-none select-none tabular-nums transition-colors duration-500 text-[10rem] md:text-[14rem]",
              activeFont.class
            )}
            style={{
              ...activeFont.style,
              color: appearance.color,
              transform: activeFont.name === 'Serif Cond'
                ? `scale(${appearance.scale}) scaleY(1.15)`
                : `scale(${appearance.scale})`,
              textShadow: '0 8px 24px rgba(0,0,0,0.6)',
            }}
          >
            {sessionFailed ? (
              <span className="text-red-500 drop-shadow-[0_0_30px_rgba(239,68,68,0.8)] animate-pulse uppercase tracking-[0.1em] text-[6rem] md:text-[8rem]">
                FAILED
              </span>
            ) : (
              formatTime(timeRemaining)
            )}
          </div>

          {/* Bottom Controls - Auto Hide */}
          <div
            className={cn(
              "flex items-center gap-6 transition-all duration-500 ease-out",
              !showSettings && "opacity-0 group-hover:opacity-100 -translate-y-2 group-hover:translate-y-0"
            )}
          >
            <button
              onClick={resetTimer}
              className="w-14 h-14 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-black/60 transition-all active:scale-95"
            >
              <RotateCcw size={20} />
            </button>

            <button
              onClick={toggleTimer}
              className="w-24 h-24 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-[0_0_50px_rgba(255,255,255,0.3)]"
            >
              {isRunning ? (
                <Pause size={48} fill="currentColor" strokeWidth={0} />
              ) : (
                <Play size={48} fill="currentColor" strokeWidth={0} className="ml-2" />
              )}
            </button>

            {/* Settings Button */}
            <button
              onClick={() => setShowSettings(true)}
              className="w-14 h-14 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-black/60 transition-all active:scale-95"
            >
              <MoreHorizontal size={20} />
            </button>
          </div>

        </div>
      </div>
    );
  }

  // Mini Widget (Pill)
  return (
    <div
      ref={timerRef}
      onMouseDown={handleMouseDown}
      className={cn(
        "fixed z-[60] flex items-center gap-5 pl-2 pr-5 py-2",
        "bg-[#111111]/90 backdrop-blur-xl border border-white/5 shadow-2xl",
        "rounded-full transition-transform active:scale-[0.99]",
        isDragging ? "cursor-grabbing" : "cursor-grab",
        className
      )}
      style={
        pos
          ? { left: pos.x, top: pos.y, transform: 'none' }
          : { top: '2rem', left: '50%', transform: 'translateX(-50%)' }
      }
    >
      {/* Play/Pause Button */}
      <button
        onClick={toggleTimer}
        className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all group shrink-0"
      >
        {isRunning ? (
          <Pause size={18} fill="currentColor" />
        ) : (
          <Play size={18} fill="currentColor" />
        )}
      </button>

      {/* Time & Info */}
      <div className="flex flex-col gap-0.5 min-w-[3.5rem]">
        {sessionFailed ? (
          <span className="text-xl font-bold font-mono leading-none tracking-wider text-red-500 tabular-nums animate-pulse">
            FAILED
          </span>
        ) : (
          <span
            className={cn("text-2xl leading-none tabular-nums text-white", activeFont.class)}
            style={activeFont.style}
          >
            {formatTime(timeRemaining)}
          </span>
        )}
        <span className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">
          {mode}
        </span>
      </div>

      {/* Sessions Dots */}
      <div className="flex gap-1.5 px-2">
        {[1, 2, 3, 4].map((i) => {
          // Calculate completed sessions today for Pomodoro cycle (1 cycle = 4 sessions)
          const todayStr = new Date().toISOString().split('T')[0];
          const completedToday = state.focusSessions.filter(s => s.completed && s.date === todayStr).length;
          const currentCycleCount = completedToday % 4;
          const isCompleted = i <= currentCycleCount || (completedToday > 0 && currentCycleCount === 0);

          return (
            <div
              key={i}
              className={cn(
                "w-1.5 h-1.5 rounded-full transition-all duration-500",
                isCompleted
                  ? "bg-primary shadow-[0_0_8px_rgba(52,211,153,0.8)] scale-110"
                  : "bg-white/20"
              )}
            />
          );
        })}
      </div>

      {/* Divider */}
      <div className="w-px h-8 bg-white/10 mx-1" />

      {/* Actions */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => setIsExpanded(true)}
          className="p-2 text-white/40 hover:text-white transition-colors rounded-full hover:bg-white/5"
        >
          <Maximize2 size={16} />
        </button>
        <button
          onClick={onClose}
          className="p-2 text-white/40 hover:text-white transition-colors rounded-full hover:bg-white/5"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
