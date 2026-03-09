'use client';

import { useState, useEffect, useRef } from 'react';
import { Sparkles, Info, Settings2, RotateCcw, ChevronLeft, Globe, Shuffle, Coins, Heart, Utensils, Zap } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { cn } from '@/lib/utils';

// ─── Pet Definitions ─────────────────────────────────────────────────────────
// skins: all available skin names found in /public/pets/<type>/
const PET_DEFS = {
    cat: { skins: ['cat'], size: 70, speed: 1.1, actions: ['idle', 'walk', 'run'], iconSize: 62, bottomShift: 0.26 },
    dog: { skins: ['akita', 'black', 'brown', 'red', 'white'], size: 44, speed: 0.8, actions: ['idle', 'walk', 'run', 'swipe', 'with_ball', 'lie'] },
    fox: { skins: ['red', 'white'], size: 44, speed: 1.2, actions: ['idle', 'walk', 'run', 'swipe', 'with_ball', 'lie'] },
    panda: { skins: ['black', 'brown'], size: 48, speed: 0.5, actions: ['idle', 'walk', 'run', 'swipe', 'with_ball', 'lie'] },
    crab: { skins: ['red'], size: 40, speed: 0.6, actions: ['idle', 'walk', 'run', 'swipe', 'with_ball'] },
    clippy: { skins: ['black', 'brown', 'green', 'yellow'], size: 40, speed: 1.0, actions: ['idle', 'walk', 'run', 'swipe', 'with_ball'] },
    cockatiel: { skins: ['brown', 'gray'], size: 40, speed: 1.5, actions: ['idle', 'walk', 'run', 'swipe', 'with_ball'] },
    chicken: { skins: ['white'], size: 40, speed: 1.0, actions: ['idle', 'walk', 'run', 'swipe', 'with_ball'] },
    deno: { skins: ['green'], size: 40, speed: 1.1, actions: ['idle', 'walk', 'run', 'swipe', 'with_ball'] },
    horse: { skins: ['black', 'brown', 'magical', 'paint_beige', 'paint_black', 'paint_brown', 'socks_beige', 'socks_black', 'socks_brown', 'warrior', 'white'], size: 50, speed: 1.6, actions: ['idle', 'walk', 'run', 'swipe', 'with_ball', 'stand'] },
    mod: { skins: ['purple'], size: 40, speed: 1.0, actions: ['idle', 'walk', 'run', 'swipe', 'with_ball'] },
    morph: { skins: ['purple'], size: 40, speed: 0.9, actions: ['idle', 'walk', 'run', 'swipe', 'with_ball'] },
    rat: { skins: ['brown', 'gray', 'white'], size: 40, speed: 1.3, actions: ['idle', 'walk', 'run', 'swipe', 'with_ball'] },
    rocky: { skins: ['gray'], size: 40, speed: 0.7, actions: ['idle', 'walk', 'run', 'swipe'] },
    'rubber-duck': { skins: ['yellow'], size: 40, speed: 0.8, actions: ['idle', 'walk', 'run', 'swipe', 'with_ball'] },
    skeleton: { skins: ['blue', 'brown', 'green', 'orange', 'pink', 'purple', 'red', 'warrior', 'white', 'yellow'], size: 40, speed: 1.0, actions: ['idle', 'walk', 'run', 'swipe', 'with_ball', 'stand'] },
    snail: { skins: ['brown'], size: 36, speed: 0.2, actions: ['idle', 'walk', 'run', 'swipe', 'with_ball'] },
    snake: { skins: ['green'], size: 40, speed: 0.6, actions: ['idle', 'walk', 'run', 'swipe', 'with_ball'] },
    totoro: { skins: ['gray'], size: 56, speed: 0.5, actions: ['idle', 'walk', 'lie'] },
    turtle: { skins: ['green', 'orange'], size: 44, speed: 0.3, actions: ['idle', 'walk', 'run', 'swipe', 'with_ball', 'lie'] },
    zappy: { skins: ['yellow'], size: 40, speed: 1.4, actions: ['idle', 'walk', 'run', 'swipe', 'with_ball'] },
};

type PetType = keyof typeof PET_DEFS | 'codachi';

const randomSkin = (type: Exclude<PetType, 'codachi'>) => {
    const skins = PET_DEFS[type as keyof typeof PET_DEFS].skins;
    return skins[Math.floor(Math.random() * skins.length)];
};

const getPetUrl = (type: PetType, state: string, skin?: string) => {
    if (type === 'codachi') return '';
    // cat: cat_<action>.gif
    if (type === 'cat') return `/pets/cat/cat_${state}.gif`;
    const def = PET_DEFS[type as keyof typeof PET_DEFS];
    const s = skin || def.skins[0];
    return `/pets/${type}/${s}_${state}_8fps.gif`;
};

// ─── State Interface ──────────────────────────────────────────────────────────
interface PetState {
    id: string;
    type: PetType;
    skin: string;        // resolved skin name
    x: number;
    direction: 1 | -1;
    monsterIdx?: number;
    eggIdx?: number;
}

// ─── Skin label prettifier ────────────────────────────────────────────────────
const labelSkin = (s: string) => s.replace(/_/g, ' ');

// Skin swatch colors (best-effort mapping)
const SKIN_COLORS: Record<string, string> = {
    akita: '#c8a87a', black: '#333', brown: '#7b4f2e', red: '#c0392b', white: '#ddd',
    gray: '#888', green: '#2ecc71', orange: '#e67e22', yellow: '#f1c40f', blue: '#3498db',
    pink: '#e91e8a', purple: '#9b59b6', warrior: '#c0392b', magical: '#a29bfe',
    paint_beige: '#e8d5b0', paint_black: '#2d2d2d', paint_brown: '#8b5e3c',
    socks_beige: '#ddd0b3', socks_black: '#2d2d2d', socks_brown: '#7b4f2e',
};

// ─── SinglePet Component ──────────────────────────────────────────────────────
function SinglePet({ pet, onRemove, scale, speed }: {
    pet: PetState,
    onRemove: (id: string) => void,
    scale: number,
    speed: number
}) {
    const xRef = useRef(pet.x);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const [direction, setDirection] = useState(pet.direction);
    const [state, setState] = useState<string>('idle');
    const [saying, setSaying] = useState<string | null>(null);
    const isCodachi = pet.type === 'codachi';
    const petConfig = isCodachi
        ? { size: 48, speed: 0.5, actions: ['idle', 'walk'], skins: [] }
        : (PET_DEFS[pet.type as keyof typeof PET_DEFS] ?? { size: 44, speed: 1.0, actions: ['idle', 'walk'], skins: [] });
    const [codachiStage, setCodachiStage] = useState(0);
    const [effect, setEffect] = useState<string | null>(null);

    // Codachi Evolution Engine
    useEffect(() => {
        if (!isCodachi || codachiStage >= 3) return;
        const evolve = () => {
            setEffect(codachiStage === 0 ? 'dust1' : 'buff1');
            setTimeout(() => {
                setEffect(null);
                setCodachiStage(prev => prev + 1);
            }, 1000);
        };
        const times = [10000, 20000, 30000];
        const timer = setTimeout(evolve, times[codachiStage] / speed);
        return () => clearTimeout(timer);
    }, [isCodachi, codachiStage, speed]);

    const actualBaseSize = isCodachi ? (56 + codachiStage * 12) : petConfig.size;
    const actualSize = actualBaseSize * scale;
    const actualBaseSpeed = isCodachi ? (codachiStage === 0 ? 0 : 0.4 + codachiStage * 0.2) : petConfig.speed;
    const groundAdjust = isCodachi ? 0 : (((petConfig as any).bottomShift || 0) * actualSize);

    let petUrl = '';
    if (isCodachi) {
        petUrl = codachiStage === 0
            ? `/pets/codachi/egg${pet.eggIdx}.gif`
            : `/pets/codachi/m${pet.monsterIdx}d${codachiStage}.gif`;
    } else {
        petUrl = getPetUrl(pet.type, state, pet.skin);
    }

    // Dragging
    const [isDragging, setIsDragging] = useState(false);
    const dragStartRel = useRef<{ x: number, y: number } | null>(null);
    const [yOffset, setYOffset] = useState(0);

    useEffect(() => {
        if (isDragging) return;

        let lastTime = performance.now();
        let animFrame: number;
        let currentDir = direction;
        let currentState = state;

        // Fall from air
        if (yOffset > 0) {
            const fallInterval = setInterval(() => {
                setYOffset(prev => {
                    const np = prev - 4;
                    if (np <= 0) { clearInterval(fallInterval); return 0; }
                    return np;
                });
            }, 16);
            return () => clearInterval(fallInterval);
        }

        // Movement loop
        const animate = (time: number) => {
            const dt = time - lastTime;
            lastTime = time;
            if (currentState === 'walk' || currentState === 'run') {
                const speedMult = currentState === 'run' ? 1.5 : 1;
                xRef.current += currentDir * (dt / 10) * (actualBaseSpeed * speed) * speedMult;
                let bounced = false;
                if (xRef.current <= 0) { xRef.current = 0; currentDir = 1; bounced = true; }
                else if (xRef.current >= window.innerWidth - actualSize) { xRef.current = window.innerWidth - actualSize; currentDir = -1; bounced = true; }
                if (wrapperRef.current) wrapperRef.current.style.left = `${xRef.current}px`;
                if (bounced) setDirection(currentDir);
            }
            animFrame = requestAnimationFrame(animate);
        };
        animFrame = requestAnimationFrame(animate);

        // AI loop
        const changeState = () => {
            const r = Math.random();
            let nextState = 'idle';
            if (isCodachi && codachiStage === 0) {
                nextState = 'idle';
            } else {
                if (r > 0.8 && petConfig.actions.includes('run')) {
                    nextState = 'run';
                    currentDir = (currentState === 'walk' || currentState === 'run') && Math.random() > 0.2 ? currentDir : (Math.random() > 0.5 ? 1 : -1);
                } else if (r > 0.5) {
                    nextState = 'walk';
                    currentDir = (currentState === 'walk' || currentState === 'run') && Math.random() > 0.2 ? currentDir : (Math.random() > 0.5 ? 1 : -1);
                } else if (r > 0.35 && petConfig.actions.includes('swipe')) {
                    nextState = 'swipe';
                } else if (r > 0.25 && petConfig.actions.includes('lie')) {
                    nextState = 'lie';
                } else if (r > 0.15 && petConfig.actions.includes('stand')) {
                    nextState = 'stand';
                } else if (r > 0.05 && petConfig.actions.includes('with_ball')) {
                    nextState = 'with_ball';
                } else {
                    nextState = 'idle';
                }
            }
            currentState = nextState;
            setState(currentState);
            setDirection(currentDir);
            if (Math.random() > 0.8 && (currentState === 'idle' || currentState === 'lie')) {
                setSaying(currentState === 'lie' ? 'Zzz...' : (isCodachi && codachiStage === 0 ? '...' : '!'));
                setTimeout(() => setSaying(null), 3000);
            }
            setTimeout(changeState, 2000 + Math.random() * 5000);
        };
        const timeout = setTimeout(changeState, Math.random() * 2000);

        return () => {
            cancelAnimationFrame(animFrame);
            clearTimeout(timeout);
        };
    }, [isDragging, yOffset, codachiStage]);

    useEffect(() => {
        const handleGlobalMouseMove = (e: MouseEvent) => {
            if (isDragging && dragStartRel.current) {
                xRef.current = e.clientX - dragStartRel.current.x;
                if (wrapperRef.current) wrapperRef.current.style.left = `${xRef.current}px`;
                const bottomY = window.innerHeight - 80;
                const newYOffset = Math.max(0, bottomY - e.clientY - dragStartRel.current.y);
                setYOffset(newYOffset);
            }
        };
        const handleGlobalMouseUp = () => { if (isDragging) setIsDragging(false); };
        if (isDragging) {
            window.addEventListener('mousemove', handleGlobalMouseMove);
            window.addEventListener('mouseup', handleGlobalMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleGlobalMouseMove);
            window.removeEventListener('mouseup', handleGlobalMouseUp);
        };
    }, [isDragging]);

    const handleMouseDown = (e: React.MouseEvent) => {
        e.stopPropagation();
        setState(petConfig.actions.includes('swipe') ? 'swipe' : 'idle');
        setSaying('!');
        setTimeout(() => setSaying(null), 1000);
        setIsDragging(true);
        const rect = (e.target as HTMLElement).getBoundingClientRect();
        dragStartRel.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    return (
        <div
            ref={wrapperRef}
            className="absolute z-20 pointer-events-auto"
            style={{ left: xRef.current, bottom: 80 + yOffset - groundAdjust }}
            title="Double click to dismiss, drag to move"
            onDoubleClick={() => onRemove(pet.id)}
            onMouseDown={handleMouseDown}
        >
            {saying && (
                <div className="absolute -top-6 left-1/2 bg-white/10 backdrop-blur-md rounded-lg px-2 py-0.5 text-[10px] text-white font-medium whitespace-nowrap shadow-sm border border-white/20 pointer-events-none" style={{ transform: 'translateX(-50%)' }}>
                    {saying}
                </div>
            )}
            {effect && (
                <img
                    src={`/pets/codachi/${effect}.gif`}
                    className="absolute inset-x-0 bottom-0 pointer-events-none z-10 mx-auto"
                    style={{ filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.8))' }}
                />
            )}
            <img
                src={petUrl}
                style={{
                    width: actualSize, height: actualSize,
                    imageRendering: 'pixelated',
                    filter: isDragging ? 'drop-shadow(0 10px 10px rgba(0,0,0,0.5))' : 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
                    transform: `scaleX(${direction})`
                }}
                className={isDragging ? 'cursor-grabbing' : 'cursor-grab'}
                draggable={false}
            />
        </div>
    );
}

// ─── Main FocusPets Panel ─────────────────────────────────────────────────────
export function FocusPets() {
    const { state, feedPet, interactPet } = useApp();
    const [pets, setPets] = useState<PetState[]>([]);
    const [spawnMenuOpen, setSpawnMenuOpen] = useState(false);
    const [showSettings, setShowSettings] = useState(false);

    useEffect(() => {
        window.dispatchEvent(new CustomEvent('pets-menu-state', { detail: spawnMenuOpen }));
    }, [spawnMenuOpen]);

    useEffect(() => {
        const toggleHandler = () => setSpawnMenuOpen(p => !p);
        const closeHandler = () => setSpawnMenuOpen(false);
        window.addEventListener('toggle-focus-pets', toggleHandler);
        window.addEventListener('close-focus-pets', closeHandler);
        return () => {
            window.removeEventListener('toggle-focus-pets', toggleHandler);
            window.removeEventListener('close-focus-pets', closeHandler);
        };
    }, []);

    // Skin picker state: which pet type is being color-picked
    const [skinPickType, setSkinPickType] = useState<Exclude<PetType, 'codachi'> | null>(null);

    // Settings (size/speed per profile)
    const [petSettings, setPetSettings] = useState<Record<string, { scale: number, speed: number }>>({ global: { scale: 1, speed: 1 } });
    const [selectedProfile, setSelectedProfile] = useState<string>('global');

    useEffect(() => {
        const saved = localStorage.getItem('beeziee_pet_settings');
        if (saved) { try { setPetSettings(JSON.parse(saved)); } catch (_) { } }
    }, []);

    const updateSetting = (key: 'scale' | 'speed', val: number) => {
        setPetSettings(prev => {
            const next = { ...prev };
            if (!next[selectedProfile]) next[selectedProfile] = { scale: 1, speed: 1 };
            next[selectedProfile][key] = val;
            localStorage.setItem('beeziee_pet_settings', JSON.stringify(next));
            return next;
        });
    };

    const resetSettings = () => {
        setPetSettings(prev => {
            const next = { ...prev };
            if (selectedProfile === 'global') next.global = { scale: 1, speed: 1 };
            else delete next[selectedProfile];
            localStorage.setItem('beeziee_pet_settings', JSON.stringify(next));
            return next;
        });
    };

    const currentSettings = petSettings[selectedProfile] || { scale: 1, speed: 1 };

    useEffect(() => {
        const w = typeof window !== 'undefined' ? window.innerWidth : 1000;
        setPets([
            { id: '1', type: 'dog', skin: 'akita', x: w / 2 - 100, direction: 1 },
            { id: '2', type: 'fox', skin: 'red', x: w / 2 + 100, direction: -1 },
        ]);
    }, []);

    const handleRemove = (id: string) => setPets(prev => prev.filter(p => p.id !== id));

    const spawnPet = (type: PetType, specificSkin?: string) => {
        const w = typeof window !== 'undefined' ? window.innerWidth : 1000;
        const newPet: PetState = {
            id: Date.now().toString() + Math.random(),
            type,
            skin: type === 'codachi' ? '' : (specificSkin || randomSkin(type as Exclude<PetType, 'codachi'>)),
            x: w / 2 + (Math.random() * 200 - 100),
            direction: Math.random() > 0.5 ? 1 : -1,
        };
        if (type === 'codachi') {
            newPet.monsterIdx = Math.floor(Math.random() * 6) + 1;
            newPet.eggIdx = Math.floor(Math.random() * 3) + 1;
        }
        setPets(prev => [...prev, newPet]);
        setSpawnMenuOpen(false);
        setSkinPickType(null);
    };

    const petTypes = Object.keys(PET_DEFS) as Exclude<PetType, 'codachi'>[];

    return (
        <>
            {/* Pet canvas */}
            <div className="fixed inset-0 pointer-events-none z-[19]">
                {pets.filter(pet => pet.type === 'codachi' || (pet.type in PET_DEFS)).map(pet => {
                    const petScale = (petSettings.global?.scale || 1) * (petSettings[pet.type]?.scale || 1);
                    const petSpeed = (petSettings.global?.speed || 1) * (petSettings[pet.type]?.speed || 1);
                    return <SinglePet key={pet.id} pet={pet} onRemove={handleRemove} scale={petScale} speed={petSpeed} />;
                })}
            </div>

            {/* Spawn / Control Panel (bottom-right) */}
            <div className="fixed bottom-[86px] right-6 z-[60] flex flex-col items-end gap-2 pointer-events-none">
                {spawnMenuOpen && (
                    <div className="bg-black/65 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl flex flex-col gap-3 w-[360px] pointer-events-auto origin-bottom-right animate-in fade-in zoom-in-95 duration-200">

                        {/* Header */}
                        <div className="flex justify-between items-center px-1">
                            <h4 className="text-xs text-white/90 uppercase tracking-widest font-bold flex items-center gap-1.5">
                                {(showSettings || skinPickType) && (
                                    <button onClick={() => { setShowSettings(false); setSkinPickType(null); }} className="hover:text-white transition-colors" title="Back">
                                        <ChevronLeft size={14} className="-ml-1" />
                                    </button>
                                )}
                                {showSettings ? 'Settings' : skinPickType ? `${skinPickType} · Color` : 'Pets'}
                            </h4>
                            <div className="flex items-center gap-2 text-white/40">
                                {!showSettings && !skinPickType && (
                                    <button onClick={() => setShowSettings(true)} className="hover:text-white transition-colors" title="Settings">
                                        <Settings2 size={14} />
                                    </button>
                                )}
                                <div className="group/info relative flex items-center">
                                    <Info size={14} className="hover:text-white transition-colors cursor-help" />
                                    <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-xl text-[10px] text-white/70 opacity-0 group-hover/info:opacity-100 transition-opacity pointer-events-none z-50">
                                        Pets & Assets by <b>tonybaloney/vscode-pets</b> and contributors.
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── Settings Panel ──────────────────────────────── */}
                        {showSettings && (
                            <div className="flex flex-col gap-3">
                                {/* Profile icon row */}
                                <div className="flex gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full">
                                    <button onClick={() => setSelectedProfile('global')} className={`w-10 h-10 shrink-0 rounded-xl border transition-all flex items-center justify-center ${selectedProfile === 'global' ? 'bg-white/20 border-white/40' : 'bg-white/5 border-white/5 hover:bg-white/10'}`} title="Global">
                                        <Globe size={18} className="text-white/80" />
                                    </button>
                                    {petTypes.map(type => (
                                        <button key={type} onClick={() => setSelectedProfile(type)} className={`w-10 h-10 shrink-0 rounded-xl border transition-all flex items-center justify-center group/pb ${selectedProfile === type ? 'bg-white/20 border-white/40' : 'bg-white/5 border-white/5 hover:bg-white/10'}`} title={`${type} Profile`}>
                                            <img src={getPetUrl(type, 'idle')} className="w-6 h-6 object-contain group-hover/pb:scale-110 transition-transform" style={{ imageRendering: 'pixelated' }} />
                                        </button>
                                    ))}
                                </div>

                                <div className="flex flex-col gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-bold text-white/80 uppercase tracking-widest truncate">
                                            {selectedProfile === 'global' ? 'Global' : selectedProfile}
                                        </span>
                                        <button onClick={resetSettings} className="text-[10px] text-white/40 hover:text-white flex items-center gap-1 transition-colors shrink-0">
                                            <RotateCcw size={10} /> Reset
                                        </button>
                                    </div>
                                    {(['scale', 'speed'] as const).map(key => (
                                        <div key={key} className="flex flex-col gap-1.5 mt-1">
                                            <div className="flex justify-between text-[11px] text-white/70 font-medium">
                                                <span>{key === 'scale' ? 'Size' : 'Speed'} Multiplier</span>
                                                <span className="text-white/40">{currentSettings[key].toFixed(1)}x</span>
                                            </div>
                                            <input
                                                type="range" min={key === 'scale' ? '0.5' : '0'} max="3" step="0.1"
                                                value={currentSettings[key]}
                                                onChange={e => updateSetting(key, parseFloat(e.target.value))}
                                                className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ── Skin Picker Panel ───────────────────────────── */}
                        {!showSettings && skinPickType && (
                            <div className="flex flex-col gap-2">
                                <p className="text-[10px] text-white/50 px-1">Click a color to spawn. <span className="text-white/30">Click <Shuffle size={9} className="inline" /> for random.</span></p>
                                <div className="grid grid-cols-5 gap-2">
                                    {/* Random button */}
                                    <button
                                        onClick={() => spawnPet(skinPickType)}
                                        className="col-span-1 h-10 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                                        title="Random skin"
                                    >
                                        <Shuffle size={14} className="text-white/70" />
                                    </button>
                                    {PET_DEFS[skinPickType].skins.map(skin => {
                                        const skinScale = ((PET_DEFS[skinPickType] as any).skinScales?.[skin]) ?? 1;
                                        return (
                                            <button
                                                key={skin}
                                                onClick={() => spawnPet(skinPickType, skin)}
                                                className="h-10 rounded-xl border border-white/10 hover:border-white/40 transition-all hover:scale-105 active:scale-95 flex flex-col items-center justify-center gap-0.5 overflow-hidden group/sk px-1"
                                                title={labelSkin(skin)}
                                            >
                                                <img
                                                    src={getPetUrl(skinPickType, 'idle', skin)}
                                                    className="w-6 h-6 object-contain transition-transform group-hover/sk:brightness-110"
                                                    style={{ imageRendering: 'pixelated', transform: `scale(${skinScale})` }}
                                                />
                                            </button>
                                        );
                                    })}
                                </div>
                                {/* Skin labels */}
                                <div className="flex flex-wrap gap-1 mt-1 px-0.5">
                                    {PET_DEFS[skinPickType].skins.map(skin => (
                                        <span key={skin} className="text-[9px] text-white/40 bg-white/5 rounded px-1 py-0.5">{labelSkin(skin)}</span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ── Main Spawn Grid ─────────────────────────────── */}
                        {!showSettings && !skinPickType && (
                            <>
                                {/* ── Tamagotchi Dashboard ─────────────────────── */}
                                <div className="flex flex-col gap-2.5 p-3.5 bg-black/40 border border-white/10 rounded-xl shadow-inner relative overflow-hidden">
                                    {/* Glass reflection */}
                                    <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

                                    <div className="flex items-center justify-between z-10">
                                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-yellow-400/10 border border-yellow-400/20 rounded-lg">
                                            <Coins size={14} className="text-yellow-400" />
                                            <span className="text-xs font-bold text-yellow-500 tabular-nums shadow-sm">{Math.floor(state.coins ?? 0)}</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={feedPet}
                                                disabled={(state.coins ?? 0) < 10}
                                                className="text-[10px] px-2.5 py-1.5 bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/30 hover:border-orange-500/50 text-orange-400 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg flex items-center gap-1.5 transition-all font-bold tracking-wide shadow-sm"
                                            >
                                                <Utensils size={10} /> Feed (10)
                                            </button>
                                            <button
                                                onClick={interactPet}
                                                className="text-[10px] px-2.5 py-1.5 bg-pink-500/20 hover:bg-pink-500/30 border border-pink-500/30 hover:border-pink-500/50 text-pink-400 rounded-lg flex items-center gap-1.5 transition-all font-bold tracking-wide shadow-sm active:scale-95"
                                            >
                                                <Heart size={10} className="fill-pink-400/50" /> Play
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mt-1 z-10">
                                        {/* Hunger */}
                                        <div className="flex flex-col gap-1.5">
                                            <div className="flex justify-between items-center text-[9px] text-white/50 uppercase font-black tracking-widest">
                                                <span>Fullness</span> <span className={(state.petStatus?.hunger ?? 100) < 30 ? 'text-red-400 animate-pulse' : 'text-orange-300'}>{Math.floor(state.petStatus?.hunger ?? 100)}%</span>
                                            </div>
                                            <div className="w-full h-1.5 bg-black/50 rounded-full overflow-hidden border border-white/5 shadow-inner">
                                                <div
                                                    className={cn("h-full transition-all duration-500", (state.petStatus?.hunger ?? 100) < 30 ? "bg-red-500" : "bg-gradient-to-r from-orange-500 to-amber-400")}
                                                    style={{ width: `${state.petStatus?.hunger ?? 100}%` }}
                                                />
                                            </div>
                                        </div>
                                        {/* Happiness */}
                                        <div className="flex flex-col gap-1.5">
                                            <div className="flex justify-between items-center text-[9px] text-white/50 uppercase font-black tracking-widest">
                                                <span>Happiness</span> <span className={(state.petStatus?.happiness ?? 100) < 30 ? 'text-blue-400' : 'text-pink-300'}>{Math.floor(state.petStatus?.happiness ?? 100)}%</span>
                                            </div>
                                            <div className="w-full h-1.5 bg-black/50 rounded-full overflow-hidden border border-white/5 shadow-inner">
                                                <div
                                                    className={cn("h-full transition-all duration-500", (state.petStatus?.happiness ?? 100) < 30 ? "bg-blue-500" : "bg-gradient-to-r from-pink-500 to-rose-400")}
                                                    style={{ width: `${state.petStatus?.happiness ?? 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Skills preview */}
                                    <div className="mt-2 pt-2.5 border-t border-white/10 flex justify-between z-10">
                                        <div className="flex flex-col items-center gap-0.5">
                                            <span className="text-[8px] text-white/30 font-bold uppercase tracking-wider">Focus</span>
                                            <span className="text-[10px] text-emerald-400 font-bold font-mono bg-emerald-400/10 px-1.5 py-0.5 rounded">{state.skills?.focus ?? 0}</span>
                                        </div>
                                        <div className="flex flex-col items-center gap-0.5">
                                            <span className="text-[8px] text-white/30 font-bold uppercase tracking-wider">Memory</span>
                                            <span className="text-[10px] text-blue-400 font-bold font-mono bg-blue-400/10 px-1.5 py-0.5 rounded">{state.skills?.consistency ?? 0}</span>
                                        </div>
                                        <div className="flex flex-col items-center gap-0.5">
                                            <span className="text-[8px] text-white/30 font-bold uppercase tracking-wider">Endurance</span>
                                            <span className="text-[10px] text-purple-400 font-bold font-mono bg-purple-400/10 px-1.5 py-0.5 rounded">{state.skills?.endurance ?? 0}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Codachi special button */}
                                <button
                                    onClick={() => spawnPet('codachi')}
                                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 border border-emerald-500/30 hover:border-emerald-500/50 transition-all group/codachi"
                                >
                                    <div className="relative">
                                        <img src="/pets/codachi/egg1.gif" className="w-5 h-5 object-contain drop-shadow group-hover/codachi:animate-bounce" style={{ imageRendering: 'pixelated' }} />
                                        <img src="/pets/codachi/dust1.gif" className="w-5 h-5 absolute inset-0 opacity-0 group-hover/codachi:opacity-100 transition-opacity" style={{ imageRendering: 'pixelated' }} />
                                    </div>
                                    <span className="text-xs font-bold text-emerald-400 group-hover/codachi:text-emerald-300">Hatch a Codachi</span>
                                </button>

                                {/* Pet grid – all 20 pets, no scroll */}
                                <div className="grid grid-cols-5 gap-3">
                                    {petTypes.map(type => {
                                        const hasMultipleSkins = PET_DEFS[type].skins.length > 1;
                                        return (
                                            <div key={type} className="relative group/cell flex flex-col items-center gap-1">
                                                {/* Main spawn button (random skin) */}
                                                <button
                                                    onClick={() => spawnPet(type)}
                                                    className="w-full h-12 rounded-xl bg-white/5 hover:bg-white/12 border border-white/8 hover:border-white/25 transition-all flex items-center justify-center hover:scale-105 active:scale-95 group/petbtn"
                                                    title={`${type} (random skin)`}
                                                >
                                                    <img
                                                        src={getPetUrl(type, 'idle')}
                                                        style={{ width: (PET_DEFS[type] as any).iconSize ?? 32, height: (PET_DEFS[type] as any).iconSize ?? 32, imageRendering: 'pixelated' }}
                                                        className="object-contain drop-shadow transition-transform group-hover/petbtn:scale-110"
                                                    />
                                                </button>
                                                {/* Color pick dot */}
                                                {hasMultipleSkins && (
                                                    <button
                                                        onClick={e => { e.stopPropagation(); setSkinPickType(type); }}
                                                        className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-black/60 hover:bg-black/80 border border-white/20 hover:border-white/50 transition-all flex items-center justify-center z-10 shadow"
                                                        title={`Pick ${type} color`}
                                                    >
                                                        <div className="w-2 h-2 rounded-full" style={{ background: SKIN_COLORS[PET_DEFS[type].skins[0]] || '#aaa' }} />
                                                    </button>
                                                )}
                                                {/* Pet name label */}
                                                <span className="text-[8px] text-white/35 truncate w-full text-center leading-none">{type}</span>
                                            </div>
                                        );
                                    })}
                                </div>

                                <p className="text-[9px] text-white/30 text-center -mt-1">Click = random skin · <svg xmlns="http://www.w3.org/2000/svg" className="inline h-2.5 w-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="2" /></svg> = pick color</p>

                                {pets.length > 0 && (
                                    <button
                                        onClick={() => { setPets([]); setShowSettings(false); setSkinPickType(null); setSpawnMenuOpen(false); }}
                                        className="text-[11px] font-semibold text-red-400/80 hover:text-red-400 py-1.5 w-full text-center bg-white/5 hover:bg-white/10 rounded-xl transition-colors border border-white/5"
                                    >
                                        Clear All Pets
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                )}

            </div>
        </>
    );
}
