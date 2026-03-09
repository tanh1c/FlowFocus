'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import {
  Heart, Gamepad2, Trophy, CircleHelp, Menu, BarChart3, Settings,
  X, Clock, CheckCircle2,
  Flame, Target, Zap, Wind, Brain, Dices, Star, TrendingUp,
  Monitor, Palette, Bell, Info, Sparkles
} from 'lucide-react';
import { Tooltip } from 'antd';
import { cn } from '@/lib/utils';
import { useApp } from '@/contexts/AppContext';
import { scenesData, type Scene } from '@/components/features/SceneSelector';

interface HeaderProps {
  onMenuClick?: () => void;
  onSelectScene?: (scene: Scene) => void;
}

type ActiveDropdown = 'favorites' | 'games' | 'achieve' | 'help' | 'stats' | 'settings' | 'pets' | null;

// --- Smart Clock & Quote Widget ---
function SmartClockWidget() {
  const [time, setTime] = useState(new Date());
  const [view, setView] = useState<'clock' | 'quote'>('clock');

  // Quote State
  const [quote, setQuote] = useState('');
  const [quoteColor, setQuoteColor] = useState('#ffffff');
  const [quoteAlign, setQuoteAlign] = useState<'left' | 'center' | 'right'>('right');
  const [quoteSize, setQuoteSize] = useState(32);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editQuoteStr, setEditQuoteStr] = useState('');

  // Built-in cool quotes
  const PRESET_QUOTES = [
    "Focus on being productive, not busy.",
    "Do something today that your future self will thank you for.",
    "The secret of your future is hidden in your daily routine.",
    "Small disciplines repeated with consistency every day lead to great achievements.",
    "Don't stop when you're tired. Stop when you're done."
  ];

  const PRESET_COLORS = ['#ffffff', '#fca5a5', '#bef264', '#67e8f9', '#c084fc', '#fde047'];

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // ... rest of useEffect
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('beeziee-quote-settings');
        if (saved) {
          const parsed = JSON.parse(saved);
          setQuote(parsed.text || PRESET_QUOTES[0]);
          setQuoteColor(parsed.color || '#ffffff');
          setQuoteAlign(parsed.align || 'right');
          setQuoteSize(parsed.size || 32);
        } else {
          setQuote(PRESET_QUOTES[0]);
        }
      } catch (e) {
        setQuote(PRESET_QUOTES[0]);
      }
    }
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const saveSettings = (updates: any) => {
    const newSettings = { text: quote, color: quoteColor, align: quoteAlign, size: quoteSize, ...updates };
    if (updates.text !== undefined) setQuote(updates.text);
    if (updates.color !== undefined) setQuoteColor(updates.color);
    if (updates.align !== undefined) setQuoteAlign(updates.align);
    if (updates.size !== undefined) setQuoteSize(updates.size);

    localStorage.setItem('beeziee-quote-settings', JSON.stringify(newSettings));
  };

  const handleCustomQuoteSubmit = () => {
    if (editQuoteStr.trim()) saveSettings({ text: editQuoteStr.trim() });
    setEditQuoteStr('');
  };

  const toggleView = () => {
    setView(v => v === 'clock' ? 'quote' : 'clock');
    setIsSettingsOpen(false); // close settings when switching
  };

  return (
    <div className="group relative pointer-events-auto flex items-center justify-end bg-transparent pt-10 pr-12 z-[60]">

      {/* Container that sizes itself based on its active children */}
      <div className="relative flex items-center justify-end transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]">

        {/* Hover Switch Options (Bottom Navigation) */}
        <div className="absolute right-6 -bottom-6 flex items-center justify-center h-8 px-2.5 rounded-full bg-transparent transition-all duration-300 z-10 group/nav gap-1.5 pointer-events-auto">

          {/* Pagination Dots */}
          <button
            onClick={() => { setView('clock'); setIsSettingsOpen(false); }}
            className="flex items-center justify-center w-5 h-full transition-colors group/dot"
            title="Clock View"
          >
            <div className={cn(
              "h-1.5 rounded-full transition-all duration-500",
              view === 'clock' ? "w-4 bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" : "w-1.5 bg-white/40 group-hover/dot:bg-white/70"
            )} />
          </button>

          <button
            onClick={() => setView('quote')}
            className="flex items-center justify-center w-5 h-full transition-colors group/dot"
            title="Quote View"
          >
            <div className={cn(
              "h-1.5 rounded-full transition-all duration-500",
              view === 'quote' ? "w-4 bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" : "w-1.5 bg-white/40 group-hover/dot:bg-white/70"
            )} />
          </button>

        </div>

        {/* Clock View */}
        <div
          onClick={toggleView}
          className={cn(
            "flex flex-col items-end justify-center cursor-pointer transition-all duration-500 ease-in-out",
            view === 'clock' ? "relative opacity-100 scale-100 w-[200px] lg:w-[280px]" : "absolute opacity-0 scale-90 pointer-events-none w-[200px] lg:w-[280px]"
          )}
        >
          <span
            className="text-[36px] lg:text-[48px] font-bold tracking-wider text-white leading-none pb-2 pr-1"
            style={{ textShadow: "0 4px 20px rgba(0,0,0,0.6)" }}
          >
            {mounted ? time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
          </span>
          <span
            className="text-[11px] lg:text-[13px] uppercase font-bold text-white/70 tracking-[0.3em] pr-1"
            style={{ textShadow: "0 2px 10px rgba(0,0,0,0.8)" }}
          >
            {mounted ? time.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' }) : '...'}
          </span>
        </div>

        {/* Quote View */}
        <div
          className={cn(
            "flex flex-col items-end transition-all duration-500 ease-in-out pt-6 pr-6 w-[320px] lg:w-[500px]",
            view === 'quote' ? "relative opacity-100 scale-100" : "absolute opacity-0 scale-90 pointer-events-none"
          )}
        >
          {/* Quote Display Area */}
          <div
            className="relative w-full flex flex-col items-end group/quote cursor-pointer"
            onClick={(e) => { e.stopPropagation(); setIsSettingsOpen(true); }}
          >
            <p
              className={cn(
                "font-bold font-serif italic leading-tight w-full text-balance transition-all hover:opacity-80",
                quoteAlign === 'left' ? "text-left" : quoteAlign === 'center' ? "text-center" : "text-right"
              )}
              style={{
                color: quoteColor,
                fontSize: `${quoteSize}px`,
                textShadow: "0 4px 24px rgba(0,0,0,0.8), 0 2px 10px rgba(0,0,0,0.5)",
                lineHeight: "1.3"
              }}
            >
              "{quote}"
            </p>

            {/* Highly visible Customize Pill revealed on quote hover - using pt-3 as an invisible bridge for seamless hover */}
            <div className="absolute top-full right-0 pt-3 w-full flex justify-end opacity-0 group-hover/quote:opacity-100 transition-all duration-300 translate-y-2 group-hover/quote:translate-y-0 pointer-events-none group-hover/quote:pointer-events-auto">
              <button
                className="flex items-center gap-1.5 px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-full border border-white/20 text-white/80 hover:text-white hover:bg-black/60 shadow-lg text-xs font-semibold tracking-wide"
              >
                <Settings size={14} className="animate-[spin_4s_linear_infinite]" />
                Customize Quote
              </button>
            </div>
          </div>

          {/* Quote Settings Popover */}
          <div className={cn(
            "absolute top-[calc(100%+24px)] right-6 w-[380px] bg-[#0c0c0e]/95 backdrop-blur-3xl border border-white/15 rounded-2xl p-5 shadow-[0_10px_40px_rgba(0,0,0,0.8)] transition-all duration-300 origin-top-right z-50",
            isSettingsOpen ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-95 pointer-events-none"
          )}>
            <div className="flex justify-between items-center mb-5">
              <h4 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
                <Settings size={16} className="text-white/60" />
                Quote Settings
              </h4>
              <button onClick={() => setIsSettingsOpen(false)} className="text-white/40 hover:text-white bg-white/5 hover:bg-white/20 p-1.5 rounded-full transition-colors">
                <X size={14} />
              </button>
            </div>

            <div className="space-y-6 pb-2 px-2 -mx-2 max-h-[340px] overflow-y-auto overscroll-contain pointer-events-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">

              {/* Custom Input */}
              <div className="space-y-2.5">
                <label className="text-[10px] uppercase font-bold text-white/50 tracking-wider">Custom Quote</label>
                <div className="flex gap-2">
                  <input
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-white/40 transition-all placeholder-white/20 shadow-inner"
                    placeholder="Type your own inspiration..."
                    value={editQuoteStr}
                    onChange={e => setEditQuoteStr(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleCustomQuoteSubmit(); }}
                  />
                  <button
                    onClick={handleCustomQuoteSubmit}
                    className="px-4 bg-white/15 hover:bg-white/30 text-white rounded-xl transition-all shadow-sm text-sm font-bold active:scale-95"
                  >
                    Set
                  </button>
                </div>
              </div>

              {/* Presets */}
              <div className="space-y-2.5">
                <label className="text-[10px] uppercase font-bold text-white/50 tracking-wider">Inspirations</label>
                <div className="flex flex-col gap-2">
                  {PRESET_QUOTES.map((pq, idx) => (
                    <button
                      key={idx}
                      onClick={() => saveSettings({ text: pq })}
                      className="text-left px-3.5 py-2.5 rounded-xl bg-white/5 border border-transparent hover:border-white/10 hover:bg-white/10 text-white/70 hover:text-white transition-all text-[13px] leading-relaxed italic"
                    >
                      "{pq}"
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-[1fr_auto] gap-4">
                {/* Color */}
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-white/50 tracking-wider">Color</label>
                  <div className="flex flex-wrap gap-2 p-1 -ml-1 -mt-1">
                    {PRESET_COLORS.map(c => (
                      <button
                        key={c} onClick={() => saveSettings({ color: c })}
                        className={cn("w-6 h-6 rounded-full border-2 transition-all", quoteColor === c ? "border-white scale-125 shadow-[0_0_12px_rgba(255,255,255,0.4)]" : "border-transparent opacity-60 hover:opacity-100")}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>

                {/* Alignment */}
                <div className="space-y-2 min-w-max">
                  <label className="text-[10px] uppercase font-bold text-white/50 tracking-wider">Align</label>
                  <div className="flex gap-1 bg-white/5 p-1 rounded-lg">
                    {(['left', 'center', 'right'] as const).map(align => (
                      <button
                        key={align} onClick={() => saveSettings({ align })}
                        className={cn("px-2 py-1 rounded transition-colors text-xs font-semibold capitalize", quoteAlign === align ? "bg-white/20 text-white" : "text-white/40 hover:text-white/80")}
                      >
                        {align}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Font Size */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-[10px] uppercase font-bold text-white/50 tracking-wider">Size</label>
                  <span className="text-[10px] text-white/50">{quoteSize}px</span>
                </div>
                <input
                  type="range" min="16" max="48" step="2"
                  value={quoteSize}
                  onChange={e => saveSettings({ size: Number(e.target.value) })}
                  className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
                />
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// --- Dropdown wrapper ---
function Dropdown({ isOpen, onClose, children, className }: {
  isOpen: boolean; onClose: () => void; children: React.ReactNode; className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div ref={ref} className={cn(
      "absolute top-full mt-3 right-0 z-[60] bg-black/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden",
      "animate-in fade-in slide-in-from-top-2 duration-200",
      className
    )}>
      {children}
    </div>
  );
}

// --- Favorites Panel ---
function FavoritesPanel({ onSelectScene }: { onSelectScene?: (scene: Scene) => void }) {
  const { state, toggleFavoriteScene } = useApp();
  const favorites = scenesData.filter(s => state.favoriteSceneIds.includes(s._id));

  return (
    <div className="w-[320px] p-5">
      <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
        <Heart size={16} className="text-red-400" /> Favorite Scenes
      </h3>
      {favorites.length === 0 ? (
        <p className="text-xs text-white/30 text-center py-4 italic">No favorites yet. Heart a scene to save it here.</p>
      ) : (
        <div className="space-y-1.5 max-h-[280px] overflow-y-auto overscroll-contain pointer-events-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {favorites.map(scene => (
            <div key={scene._id}
              onClick={() => onSelectScene?.(scene)}
              className="flex items-center gap-3 bg-white/5 hover:bg-white/10 rounded-xl px-3 py-2.5 transition-all group cursor-pointer">
              <div className="w-10 h-7 rounded-md overflow-hidden shrink-0 bg-white/5">
                <img src={scene.thumbnail} alt={scene.name} className="w-full h-full object-cover" />
              </div>
              <span className="text-sm text-white/70 flex-1 truncate">{scene.name}</span>
              <button onClick={(e) => { e.stopPropagation(); toggleFavoriteScene(scene._id); }}
                className="text-white/20 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// --- Games Panel ---
function GamesPanel() {
  const [breathPhase, setBreathPhase] = useState<'idle' | 'inhale' | 'hold' | 'exhale'>('idle');
  const [breathCount, setBreathCount] = useState(0);
  const [diceResult, setDiceResult] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startBreathing = () => {
    setBreathPhase('inhale');
    setBreathCount(0);
    runCycle(0);
  };

  const runCycle = (count: number) => {
    if (count >= 4) { setBreathPhase('idle'); return; }
    setBreathPhase('inhale');
    timerRef.current = setTimeout(() => {
      setBreathPhase('hold');
      timerRef.current = setTimeout(() => {
        setBreathPhase('exhale');
        timerRef.current = setTimeout(() => {
          setBreathCount(count + 1);
          runCycle(count + 1);
        }, 4000);
      }, 4000);
    }, 4000);
  };

  const stopBreathing = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setBreathPhase('idle');
    setBreathCount(0);
  };

  const rollDice = () => {
    setIsRolling(true);
    let rolls = 0;
    const interval = setInterval(() => {
      setDiceResult(Math.floor(Math.random() * 6) + 1);
      rolls++;
      if (rolls > 10) { clearInterval(interval); setIsRolling(false); }
    }, 80);
  };

  useEffect(() => { return () => { if (timerRef.current) clearTimeout(timerRef.current); }; }, []);

  return (
    <div className="w-[340px] p-5">
      <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
        <Gamepad2 size={16} className="text-purple-400" /> Focus Games
      </h3>
      <div className="space-y-3">
        {/* Breathing Exercise */}
        <div className="bg-white/5 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-2">
            <Wind size={14} className="text-cyan-400" />
            <span className="text-xs font-medium text-white/70">Box Breathing</span>
          </div>
          {breathPhase === 'idle' ? (
            <button onClick={startBreathing} className="w-full py-2 rounded-lg bg-cyan-500/15 text-cyan-400 text-xs font-medium hover:bg-cyan-500/25 transition-all">
              Start (4 cycles)
            </button>
          ) : (
            <div className="text-center">
              <div className={cn("text-lg font-bold mb-1 transition-all duration-1000",
                breathPhase === 'inhale' && "text-cyan-400 scale-110",
                breathPhase === 'hold' && "text-amber-400",
                breathPhase === 'exhale' && "text-emerald-400 scale-95",
              )}>
                {breathPhase === 'inhale' ? 'Breathe In...' : breathPhase === 'hold' ? 'Hold...' : 'Breathe Out...'}
              </div>
              <p className="text-[10px] text-white/30 mb-2">Cycle {breathCount + 1} / 4</p>
              <button onClick={stopBreathing} className="text-xs text-white/30 hover:text-white/60 transition-colors">Stop</button>
            </div>
          )}
        </div>
        {/* Dice Roll */}
        <div className="bg-white/5 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-2">
            <Dices size={14} className="text-amber-400" />
            <span className="text-xs font-medium text-white/70">Decision Dice</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={rollDice} disabled={isRolling}
              className="flex-1 py-2 rounded-lg bg-amber-500/15 text-amber-400 text-xs font-medium hover:bg-amber-500/25 transition-all disabled:opacity-50">
              {isRolling ? 'Rolling...' : 'Roll'}
            </button>
            {diceResult !== null && (
              <span className={cn("text-2xl font-bold tabular-nums", isRolling ? "text-white/30 animate-pulse" : "text-amber-400")}>
                {diceResult}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Achieve Panel ---
const achieveIcons: Record<string, React.ReactNode> = {
  Flame: <Flame size={16} />, Target: <Target size={16} />, Zap: <Zap size={16} />,
  Star: <Star size={16} />, Brain: <Brain size={16} />, TrendingUp: <TrendingUp size={16} />,
  Crown: <Trophy size={16} />, // Using Trophy as fallback for Crown if not imported, or replace with Lucide Crown if available
};

function AchievePanel() {
  const { achievements } = useApp();

  return (
    <div className="w-[340px] p-5">
      <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
        <Trophy size={16} className="text-yellow-400" /> Achievements
      </h3>
      <div className="space-y-1.5 max-h-[320px] overflow-y-auto overscroll-contain pointer-events-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {achievements.map((a) => (
          <div key={a.id} className={cn("flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all",
            a.unlocked ? "bg-white/5" : "bg-white/[0.02] opacity-50"
          )}>
            <div className={cn("shrink-0", a.unlocked ? a.color : "text-white/20")}>{achieveIcons[a.icon] || <Target size={16} />}</div>
            <div className="flex-1 min-w-0">
              <p className={cn("text-sm font-medium", a.unlocked ? "text-white/80" : "text-white/30")}>{a.label}</p>
              <p className="text-[10px] text-white/30">{a.desc}</p>
            </div>
            {a.unlocked && <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />}
          </div>
        ))}
      </div>
      <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
        <span className="text-[10px] text-white/30">{achievements.filter(a => a.unlocked).length}/{achievements.length} unlocked</span>
        <div className="w-20 h-1.5 bg-white/5 rounded-full overflow-hidden">
          <div className="h-full bg-yellow-500/60 rounded-full transition-all" style={{ width: `${(achievements.filter(a => a.unlocked).length / achievements.length) * 100}%` }} />
        </div>
      </div>
    </div>
  );
}

// --- Help Panel ---
function HelpPanel() {
  const shortcuts = [
    { keys: ['Space'], action: 'Play / Pause music' },
    { keys: ['F'], action: 'Toggle fullscreen' },
    { keys: ['M'], action: 'Open mixer' },
    { keys: ['T'], action: 'Open timer' },
    { keys: ['N'], action: 'Open notes' },
    { keys: ['B'], action: 'Open task board' },
    { keys: ['S'], action: 'Open scenes' },
    { keys: ['Z'], action: 'Toggle Zen Mode' },
    { keys: ['Esc'], action: 'Close active panel' },
  ];

  return (
    <div className="w-[340px] p-5">
      <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
        <CircleHelp size={16} className="text-cyan-400" /> Quick Guide
      </h3>
      <div className="space-y-1 mb-3">
        <p className="text-[10px] text-white/30 uppercase tracking-wider font-bold mb-2">Keyboard Shortcuts</p>
        {shortcuts.map((s, i) => (
          <div key={i} className="flex items-center justify-between py-1.5">
            <span className="text-xs text-white/50">{s.action}</span>
            <div className="flex gap-1">
              {s.keys.map(k => (
                <kbd key={k} className="px-2 py-0.5 bg-white/10 border border-white/10 rounded-md text-[10px] text-white/60 font-mono">{k}</kbd>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="pt-3 border-t border-white/5">
        <div className="flex items-center gap-2 text-white/30">
          <Info size={12} />
          <span className="text-[10px]">Hover scene card to see heart button</span>
        </div>
      </div>
    </div>
  );
}

// --- Stats Panel ---
function StatsPanel() {
  const { state, getTodayFocusMinutes, getWeeklyAverage, levelInfo } = useApp();

  const fmtMins = (m: number) => {
    const h = Math.floor(m / 60);
    const mins = m % 60;
    return h > 0 ? `${h}h ${mins}m` : `${mins}m`;
  };

  const stats = [
    { label: 'Focus Time Today', value: fmtMins(getTodayFocusMinutes()), icon: <Clock size={16} />, color: 'text-blue-400' },
    { label: 'Tasks Completed', value: state.todayTasksCompleted.toString(), icon: <CheckCircle2 size={16} />, color: 'text-emerald-400' },
    { label: 'Current Streak', value: `${state.streak.current} day${state.streak.current !== 1 ? 's' : ''}`, icon: <Flame size={16} />, color: 'text-orange-400' },
    { label: 'Weekly Average', value: fmtMins(getWeeklyAverage()), icon: <TrendingUp size={16} />, color: 'text-purple-400' },
  ];

  return (
    <div className="w-[340px] p-5">
      <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
        <BarChart3 size={16} className="text-blue-400" /> Focus Stats
      </h3>

      {/* Level Card */}
      <div className="bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-xl p-4 border border-white/10 mb-4 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
          <Trophy size={64} className="text-white" />
        </div>
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-1">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-white/60">Current Rank</p>
              <p className="text-2xl font-bold text-white shadow-sm">{levelInfo.title}</p>
            </div>
            <div className="text-right">
              <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-white/50">{levelInfo.level}</span>
              <p className="text-[10px] text-white/40 -mt-1 uppercase font-bold">Level</p>
            </div>
          </div>

          <div className="mt-3">
            <div className="flex justify-between text-[10px] text-white/50 mb-1 font-medium">
              <span>{Math.floor(levelInfo.currentXP)} XP</span>
              <span>{Math.floor(levelInfo.nextLevelXP)} XP</span>
            </div>
            <div className="h-2 bg-black/40 rounded-full overflow-hidden border border-white/5">
              <div
                className="h-full bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(168,85,247,0.5)]"
                style={{ width: `${levelInfo.progress}%` }}
              />
            </div>
            <p className="text-[9px] text-white/30 mt-1 text-center">
              {Math.floor(levelInfo.nextLevelXP - levelInfo.currentXP)} XP to next level
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {stats.map((s, i) => (
          <div key={i} className="flex flex-col gap-1.5 bg-white/5 rounded-xl p-3 border border-white/5 hover:bg-white/10 transition-colors">
            <span className={s.color}>{s.icon}</span>
            <div>
              <p className="text-[10px] text-white/30 uppercase tracking-wider font-bold mb-0.5">{s.label}</p>
              <p className="text-base font-bold text-white tabular-nums">{s.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Settings Panel ---
function SettingsPanel() {
  const { state, updateSettings } = useApp();
  const { settings } = state;

  return (
    <div className="w-[340px] p-5">
      <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
        <Settings size={16} className="text-white/60" /> Settings
      </h3>
      <div className="space-y-3">
        {[
          { label: 'Autoplay Scenes', desc: 'Auto-transition between scenes', key: 'autoplayScenes' as const, icon: <Monitor size={14} /> },
          { label: 'Notifications', desc: 'Timer & task reminders', key: 'notifications' as const, icon: <Bell size={14} /> },
          { label: 'Dark Overlay', desc: 'Dim background for focus', key: 'darkOverlay' as const, icon: <Palette size={14} /> },
          { label: 'Glass Mode', desc: 'Transparent frosted UI panels', key: 'glassMode' as const, icon: <Palette size={14} /> },
        ].map((s) => (
          <div key={s.key} className="flex items-center gap-3 bg-white/5 rounded-xl px-3 py-3">
            <span className="text-white/40">{s.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-base text-white/70 tracking-tight">{s.label}</p>
              <p className="text-xs text-white/30">{s.desc}</p>
            </div>
            <button onClick={() => updateSettings({ [s.key]: !settings[s.key] })}
              className={cn("w-10 h-5.5 rounded-full p-0.5 transition-all duration-200",
                settings[s.key] ? "bg-primary/60" : "bg-white/10"
              )}>
              <div className={cn("w-4.5 h-4.5 rounded-full bg-white shadow-sm transition-transform duration-200",
                settings[s.key] ? "translate-x-[18px]" : "translate-x-0"
              )} />
            </button>
          </div>
        ))}

        {/* Dark Overlay Opacity Slider */}
        {settings.darkOverlay && (
          <div className="bg-white/5 rounded-xl px-3 py-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-white/40">Overlay Opacity</span>
              <span className="text-sm text-white/60 tabular-nums font-medium">{settings.darkOverlayOpacity}%</span>
            </div>
            <input type="range" min={10} max={80} value={settings.darkOverlayOpacity}
              onChange={(e) => updateSettings({ darkOverlayOpacity: Number(e.target.value) })}
              className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md"
            />
          </div>
        )}
      </div>
      <div className="mt-3 pt-3 border-t border-white/5">
        <p className="text-[10px] text-white/20 text-center">Focus Flow v1.0</p>
      </div>
    </div>
  );
}

// --- Main Header ---
export function Header({ onMenuClick, onSelectScene }: HeaderProps) {
  const [activeDropdown, setActiveDropdown] = useState<ActiveDropdown>(null);
  const [petActive, setPetActive] = useState(false);

  useEffect(() => {
    const handler = (e: any) => setPetActive(e.detail);
    window.addEventListener('pets-menu-state', handler);
    return () => window.removeEventListener('pets-menu-state', handler);
  }, []);

  const toggle = (id: ActiveDropdown) => setActiveDropdown(prev => prev === id ? null : id);
  const close = () => setActiveDropdown(null);

  const navButtons: { id: ActiveDropdown | 'pets'; Icon: any; label: string }[] = [
    { id: 'favorites', Icon: Heart, label: 'Favorites' },
    { id: 'games', Icon: Gamepad2, label: 'Games' },
    { id: 'achieve', Icon: Trophy, label: 'Achieve' },
    { id: 'pets', Icon: Sparkles, label: 'Pets' },
    { id: 'help', Icon: CircleHelp, label: 'Help' },
  ];

  return (
    <>
      <header className="fixed h-14 top-4 left-6 right-6 flex items-center z-50 justify-between pointer-events-none">
        {/* Logo */}
        <div className="flex items-center gap-3 cursor-pointer pointer-events-auto">
          <span className="text-white lg:text-4xl text-2xl font-dancing font-bold tracking-wide drop-shadow-md pt-2">
            Focus Flow
          </span>
        </div>

        {/* Top Right Widget (Clock / Calendar / Quote) */}
        <div className="pointer-events-auto animate-in fade-in slide-in-from-right-4 duration-500">
          <SmartClockWidget />
        </div>
      </header>

      {/* Bottom Right Actions */}
      <div className={cn(
        "fixed bottom-6 right-6 z-50",
        "flex items-center p-1.5 gap-2 pointer-events-auto",
        "bg-black/90 backdrop-blur-2xl border border-white/10 rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.5)]",
        "animate-in fade-in slide-in-from-bottom-4 duration-500"
      )}>
        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-1.5">
          {navButtons.map(({ id, Icon, label }) => {
            const isActive = id === 'pets' ? petActive : activeDropdown === id;
            return (
              <div key={id} className="relative flex">
                <button
                  onClick={() => {
                    if (id === 'pets') {
                      window.dispatchEvent(new CustomEvent('toggle-focus-pets'));
                      if (activeDropdown) close();
                    } else {
                      toggle(id as ActiveDropdown);
                      if (petActive) window.dispatchEvent(new CustomEvent('close-focus-pets'));
                    }
                  }}
                  aria-label={label}
                  className={cn(
                    "flex flex-row items-center justify-center h-10 rounded-full overflow-hidden transition-all duration-400 ease-[cubic-bezier(0.34,1.56,0.64,1)] group/btn",
                    isActive
                      ? "bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.4)]"
                      : "text-white/60 hover:text-white hover:bg-white/10 active:scale-95"
                  )}
                >
                  <div className="shrink-0 flex items-center justify-center w-10 h-10">
                    <Icon size={18} className={cn(
                      "transition-colors duration-300",
                      isActive ? "text-black" : "group-hover/btn:text-white"
                    )} />
                  </div>
                  {/* Expanding Label */}
                  <div className={cn(
                    "flex items-center whitespace-nowrap overflow-hidden transition-all duration-400 font-semibold tracking-wide text-xs",
                    isActive ? "max-w-[100px] opacity-100 pr-4" : "max-w-0 opacity-0 group-hover/btn:max-w-[100px] group-hover/btn:opacity-100 group-hover/btn:pr-4"
                  )}>
                    {label}
                  </div>
                </button>

                {id !== 'pets' && (
                  <Dropdown isOpen={isActive} onClose={close} className="!top-auto bottom-[calc(100%+12px)] right-0 origin-bottom-right">
                    {id === 'favorites' && <FavoritesPanel onSelectScene={onSelectScene} />}
                    {id === 'games' && <GamesPanel />}
                    {id === 'achieve' && <AchievePanel />}
                    {id === 'help' && <HelpPanel />}
                  </Dropdown>
                )}
              </div>
            );
          })}
        </div>

        {/* Separator */}
        <div className="hidden lg:block w-px h-6 bg-white/10 mx-1" />

        {/* Common Actions */}
        <div className="flex items-center gap-1.5">
          {([
            { id: 'stats' as ActiveDropdown, Icon: BarChart3, label: 'Stats' },
            { id: 'settings' as ActiveDropdown, Icon: Settings, label: 'Settings' },
          ]).map(({ id, Icon, label }) => {
            const isActive = activeDropdown === id;
            return (
              <div key={id} className="relative flex">
                <button
                  onClick={() => toggle(id)}
                  aria-label={label}
                  className={cn(
                    "flex flex-row items-center justify-center h-10 rounded-full overflow-hidden transition-all duration-400 ease-[cubic-bezier(0.34,1.56,0.64,1)] group/btn",
                    isActive
                      ? "bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.4)]"
                      : "text-white/60 hover:text-white hover:bg-white/10 active:scale-95"
                  )}
                >
                  <div className="shrink-0 flex items-center justify-center w-10 h-10">
                    <Icon size={18} className={cn(
                      "transition-colors duration-300",
                      isActive ? "text-black" : "group-hover/btn:text-white"
                    )} />
                  </div>
                  {/* Expanding Label */}
                  <div className={cn(
                    "flex items-center whitespace-nowrap overflow-hidden transition-all duration-400 font-semibold tracking-wide text-xs",
                    isActive ? "max-w-[100px] opacity-100 pr-4" : "max-w-0 opacity-0 group-hover/btn:max-w-[100px] group-hover/btn:opacity-100 group-hover/btn:pr-4"
                  )}>
                    {label}
                  </div>
                </button>

                <Dropdown isOpen={isActive} onClose={close} className="!top-auto bottom-[calc(100%+12px)] right-0 origin-bottom-right">
                  {id === 'stats' && <StatsPanel />}
                  {id === 'settings' && <SettingsPanel />}
                </Dropdown>
              </div>
            );
          })}
        </div>

        {/* Mobile Menu */}
        <div className="lg:hidden relative flex">
          <Tooltip title="Menu" placement="top" mouseEnterDelay={0.1}>
            <button
              onClick={onMenuClick}
              className="flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 text-white/60 hover:text-white hover:bg-white/10 active:scale-95 group"
            >
              <Menu size={20} className="group-hover:text-white" />
            </button>
          </Tooltip>
        </div>
      </div>
    </>
  );
}
