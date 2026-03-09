'use client';

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
    Plus, Trash2, Pin, PinOff, Search, LayoutGrid, List,
    Copy, Tag, StickyNote, X, Sparkles, FileText, Monitor, GripHorizontal
} from 'lucide-react';
import { SlidePanel } from '../ui/SlidePanel';
import { cn } from '@/lib/utils';

// --- Types ---
interface Note {
    id: string;
    title: string;
    content: string;
    pinned: boolean;
    pinnedToScreen: boolean;
    screenPos: { x: number; y: number };
    color: string;
    tags: string[];
    createdAt: number;
    updatedAt: number;
}

interface QuickNotesProps {
    isOpen: boolean;
    onClose: () => void;
}

// --- Config ---
const STORAGE_KEY = 'beeziee-quick-notes';
const STORAGE_VIEW_KEY = 'beeziee-quick-notes-view';

const noteColors = [
    { id: 'default', border: 'border-white/15', bg: 'bg-white/[0.06]', activeBg: 'bg-white/[0.10]', dot: 'bg-white/40', stickyBg: 'bg-[#1a1a2e]/90', stickyBorder: 'border-white/10' },
    { id: 'amber', border: 'border-amber-500/25', bg: 'bg-amber-500/[0.08]', activeBg: 'bg-amber-500/[0.14]', dot: 'bg-amber-400', stickyBg: 'bg-[#2a2010]/90', stickyBorder: 'border-amber-500/20' },
    { id: 'blue', border: 'border-blue-500/25', bg: 'bg-blue-500/[0.08]', activeBg: 'bg-blue-500/[0.14]', dot: 'bg-blue-400', stickyBg: 'bg-[#101a2e]/90', stickyBorder: 'border-blue-500/20' },
    { id: 'pink', border: 'border-pink-500/25', bg: 'bg-pink-500/[0.08]', activeBg: 'bg-pink-500/[0.14]', dot: 'bg-pink-400', stickyBg: 'bg-[#2a1020]/90', stickyBorder: 'border-pink-500/20' },
    { id: 'emerald', border: 'border-emerald-500/25', bg: 'bg-emerald-500/[0.08]', activeBg: 'bg-emerald-500/[0.14]', dot: 'bg-emerald-400', stickyBg: 'bg-[#102a1a]/90', stickyBorder: 'border-emerald-500/20' },
    { id: 'purple', border: 'border-purple-500/25', bg: 'bg-purple-500/[0.08]', activeBg: 'bg-purple-500/[0.14]', dot: 'bg-purple-400', stickyBg: 'bg-[#1a102e]/90', stickyBorder: 'border-purple-500/20' },
];

const tagPresets = ['work', 'personal', 'idea', 'todo', 'important', 'meeting'];
// --- Helpers ---
function loadNotes(): Note[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return parsed.map((n: Note) => ({
            ...n,
            pinnedToScreen: n.pinnedToScreen ?? false,
            screenPos: n.screenPos ?? { x: 100, y: 100 },
        }));
    } catch { return []; }
}

function saveNotes(notes: Note[]) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(notes)); } catch { /* quota exceeded */ }
}

function relativeTime(ts: number): string {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function wordCount(text: string): number {
    return text.trim() ? text.trim().split(/\s+/).length : 0;
}

function useAutoResize(ref: React.RefObject<HTMLTextAreaElement | null>, value: string) {
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        el.style.height = 'auto';
        el.style.height = el.scrollHeight + 'px';
    }, [ref, value]);
}
// --- Floating Sticky Note (pinned to screen) ---
function FloatingStickyNote({ note, onUpdate, onUnpin, onDelete }: {
    note: Note;
    onUpdate: (updates: Partial<Note>) => void;
    onUnpin: () => void;
    onDelete: () => void;
}) {
    const [isDragging, setIsDragging] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const dragRef = useRef<HTMLDivElement>(null);
    const offsetRef = useRef({ x: 0, y: 0 });
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const colorObj = noteColors.find(c => c.id === note.color) || noteColors[0];

    useAutoResize(textareaRef, note.content);

    useEffect(() => {
        if (confirmDelete) {
            const t = setTimeout(() => setConfirmDelete(false), 2000);
            return () => clearTimeout(t);
        }
    }, [confirmDelete]);

    useEffect(() => {
        if (!isDragging) return;
        const onMove = (e: MouseEvent) => {
            if (!dragRef.current) return;
            const x = Math.max(0, Math.min(window.innerWidth - 220, e.clientX - offsetRef.current.x));
            const y = Math.max(0, Math.min(window.innerHeight - 100, e.clientY - offsetRef.current.y));
            dragRef.current.style.left = x + 'px';
            dragRef.current.style.top = y + 'px';
        };
        const onUp = (e: MouseEvent) => {
            setIsDragging(false);
            if (dragRef.current) {
                onUpdate({ screenPos: { x: e.clientX - offsetRef.current.x, y: e.clientY - offsetRef.current.y } });
            }
        };
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
        return () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
    }, [isDragging, onUpdate]);

    const handleMouseDown = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('button, input, textarea')) return;
        const rect = dragRef.current!.getBoundingClientRect();
        offsetRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
        setIsDragging(true);
    };

    return (
        <div
            ref={dragRef}
            className={cn(
                "fixed z-50 w-[220px] rounded-2xl border backdrop-blur-xl shadow-2xl transition-shadow duration-200",
                colorObj.stickyBg, colorObj.stickyBorder,
                isDragging && "shadow-black/50 scale-[1.02]",
                !isDragging && "hover:shadow-xl"
            )}
            style={{ left: note.screenPos.x, top: note.screenPos.y }}
            onMouseDown={handleMouseDown}
        >
            {/* Drag handle */}
            <div className={cn("flex items-center justify-between px-3 pt-2.5 pb-1", isDragging ? "cursor-grabbing" : "cursor-grab")}>
                <div className="flex items-center gap-1.5">
                    <GripHorizontal size={10} className="text-white/20" />
                    {note.pinned && <Pin size={8} className="text-amber-400 fill-amber-400" />}
                </div>
                <div className="flex items-center gap-0.5">
                    <button onClick={(e) => { e.stopPropagation(); onUnpin(); }}
                        className="p-1 text-white/30 hover:text-white/70 transition-colors rounded-md hover:bg-white/10" title="Unpin from screen">
                        <PinOff size={10} />
                    </button>
                    <button onClick={(e) => {
                        e.stopPropagation();
                        if (confirmDelete) { onDelete(); setConfirmDelete(false); }
                        else setConfirmDelete(true);
                    }} className={cn("p-1 rounded-md transition-all", confirmDelete ? "text-red-400 bg-red-500/15 animate-pulse" : "text-white/30 hover:text-red-400 hover:bg-white/10")}>
                        {confirmDelete ? <X size={10} /> : <Trash2 size={10} />}
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="px-3 pb-2.5" onClick={() => setIsEditing(true)}>
                {isEditing ? (
                    <div className="flex flex-col gap-1">
                        <input value={note.title} onChange={e => onUpdate({ title: e.target.value })}
                            placeholder="Title"
                            className="bg-transparent text-xs font-semibold text-white/90 placeholder-white/25 focus:outline-none w-full" />
                        <textarea ref={textareaRef} value={note.content}
                            onChange={e => onUpdate({ content: e.target.value })}
                            onBlur={() => setIsEditing(false)}
                            placeholder="Write something..."
                            autoFocus
                            className="w-full bg-transparent text-[11px] text-white/75 placeholder-white/20 resize-none focus:outline-none min-h-[40px] leading-relaxed"
                            rows={3} />
                    </div>
                ) : (
                    <div className="cursor-text">
                        {note.title && <p className="text-xs font-semibold text-white/90 truncate mb-0.5">{note.title}</p>}
                        <p className={cn("text-[11px] leading-relaxed line-clamp-6",
                            note.content ? "text-white/65" : "text-white/25 italic"
                        )}>{note.content || "Click to edit..."}</p>
                    </div>
                )}
            </div>

            {/* Mini footer */}
            <div className="px-3 pb-2 flex items-center gap-1.5">
                {note.tags.slice(0, 2).map(tag => (
                    <span key={tag} className="px-1 py-px rounded text-[8px] font-medium text-white/30 bg-white/[0.05]">{tag}</span>
                ))}
                <span className="text-[8px] text-white/20 ml-auto">{relativeTime(note.updatedAt)}</span>
            </div>
        </div>
    );
}

// --- NoteCard (inside panel) ---
function NoteCard({ note, isEditing, isGrid, onEdit, onDelete, onPin, onSetColor, onDuplicate, onPinToScreen, onUpdateTitle, onUpdateContent, onToggleTag, textareaRef }: {
    note: Note; isEditing: boolean; isGrid: boolean;
    onEdit: () => void; onDelete: () => void; onPin: () => void;
    onSetColor: (color: string) => void; onDuplicate: () => void;
    onPinToScreen: () => void;
    onUpdateTitle: (title: string) => void; onUpdateContent: (content: string) => void;
    onToggleTag: (tag: string) => void;
    textareaRef: React.RefObject<HTMLTextAreaElement | null>;
}) {
    const [showTags, setShowTags] = useState(false);
    const [showColors, setShowColors] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const colorObj = noteColors.find(c => c.id === note.color) || noteColors[0];
    const popoverRef = useRef<HTMLDivElement>(null);

    useAutoResize(textareaRef, note.content);

    // Close popovers when card loses editing
    useEffect(() => {
        if (!isEditing) { setShowColors(false); setShowTags(false); }
    }, [isEditing]);

    // Click outside popover to close
    useEffect(() => {
        if (!showColors && !showTags) return;
        const handler = (e: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
                setShowColors(false);
                setShowTags(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [showColors, showTags]);

    useEffect(() => {
        if (confirmDelete) {
            const t = setTimeout(() => setConfirmDelete(false), 2000);
            return () => clearTimeout(t);
        }
    }, [confirmDelete]);

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirmDelete) { onDelete(); setConfirmDelete(false); }
        else setConfirmDelete(true);
    };

    return (
        <div
            onClick={onEdit}
            className={cn(
                "group relative rounded-2xl border p-3.5 transition-all duration-200 cursor-pointer",
                isEditing ? colorObj.activeBg : colorObj.bg,
                colorObj.border,
                isEditing && "ring-1 ring-white/20 shadow-lg",
                isGrid ? "min-h-[130px] flex flex-col" : "",
                !isEditing && "hover:border-white/25 hover:shadow-md",
                note.pinnedToScreen && "opacity-50 pointer-events-none"
            )}
        >
            {/* Pinned to screen indicator */}
            {note.pinnedToScreen && (
                <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/30 z-20">
                    <div className="flex items-center gap-1.5 text-white/50 text-[10px]">
                        <Monitor size={12} />
                        <span>On screen</span>
                    </div>
                </div>
            )}

            {/* Actions bar */}
            <div className={cn(
                "absolute top-2 right-2 flex items-center gap-0.5 transition-all duration-200 z-10",
                isEditing ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            )}>
                <button onClick={(e) => { e.stopPropagation(); setShowColors(!showColors); setShowTags(false); }}
                    className="w-5 h-5 rounded-full bg-gradient-to-br from-pink-400 via-blue-400 to-emerald-400 hover:scale-110 transition-transform opacity-70 hover:opacity-100" title="Color" />
                <button onClick={(e) => { e.stopPropagation(); setShowTags(!showTags); setShowColors(false); }}
                    className="p-1 text-white/35 hover:text-white/70 transition-colors rounded-lg hover:bg-white/10"><Tag size={11} /></button>
                <button onClick={(e) => { e.stopPropagation(); onPinToScreen(); }}
                    className={cn("p-1 transition-colors rounded-lg hover:bg-white/10", note.pinnedToScreen ? "text-primary" : "text-white/35 hover:text-primary")}
                    title="Pin to screen">
                    <Monitor size={11} />
                </button>
                <button onClick={(e) => { e.stopPropagation(); onPin(); }}
                    className={cn("p-1 transition-colors rounded-lg hover:bg-white/10", note.pinned ? "text-amber-400" : "text-white/35 hover:text-amber-400")}>
                    {note.pinned ? <PinOff size={11} /> : <Pin size={11} />}
                </button>
                <button onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
                    className="p-1 text-white/35 hover:text-white/70 transition-colors rounded-lg hover:bg-white/10"><Copy size={11} /></button>
                <button onClick={handleDelete}
                    className={cn("p-1 rounded-lg transition-all", confirmDelete ? "text-red-400 bg-red-500/10 animate-pulse" : "text-white/35 hover:text-red-400 hover:bg-white/10")}>
                    {confirmDelete ? <X size={11} /> : <Trash2 size={11} />}
                </button>
            </div>

            {/* Pin badge */}
            {note.pinned && !isEditing && (
                <div className="absolute top-2.5 left-3">
                    <Pin size={9} className="text-amber-400 fill-amber-400" />
                </div>
            )}

            {/* Color picker - absolute popover */}
            {showColors && (
                <div ref={popoverRef} className="absolute top-9 right-2 z-20 animate-in fade-in slide-in-from-top-1 duration-150" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-1 p-1.5 rounded-xl bg-black/80 backdrop-blur-xl border border-white/15 shadow-xl">
                        {noteColors.map(c => (
                            <button key={c.id} onClick={() => { onSetColor(c.id); setShowColors(false); }}
                                className={cn("w-6 h-6 rounded-full transition-all duration-150 hover:scale-110", c.dot,
                                    note.color === c.id && "ring-2 ring-white/40 ring-offset-1 ring-offset-black/80 scale-105"
                                )} />
                        ))}
                    </div>
                </div>
            )}

            {/* Tag selector - absolute popover */}
            {showTags && (
                <div ref={popoverRef} className="absolute top-9 right-2 z-20 animate-in fade-in slide-in-from-top-1 duration-150" onClick={e => e.stopPropagation()}>
                    <div className="flex flex-wrap gap-1 p-2 rounded-xl bg-black/80 backdrop-blur-xl border border-white/15 shadow-xl max-w-[200px]">
                        {tagPresets.map(tag => (
                            <button key={tag} onClick={() => onToggleTag(tag)}
                                className={cn("px-2 py-0.5 rounded-full text-[10px] font-medium border transition-all duration-150",
                                    note.tags.includes(tag)
                                        ? "bg-white/15 border-white/25 text-white"
                                        : "bg-white/[0.04] border-white/[0.08] text-white/35 hover:text-white/60 hover:border-white/15"
                                )}>{tag}</button>
                        ))}
                    </div>
                </div>
            )}

            {/* Content */}
            {isEditing ? (
                <div className="flex flex-col gap-1.5 flex-1">
                    <input value={note.title} onChange={e => onUpdateTitle(e.target.value)}
                        placeholder="Title" onClick={e => e.stopPropagation()}
                        className="bg-transparent text-sm font-semibold text-white/90 placeholder-white/25 focus:outline-none w-full pr-20" />
                    <textarea ref={textareaRef} value={note.content}
                        onChange={e => onUpdateContent(e.target.value)}
                        onClick={e => e.stopPropagation()}
                        placeholder="Write something..."
                        className="w-full bg-transparent text-[13px] text-white/75 placeholder-white/20 resize-none focus:outline-none min-h-[50px] leading-relaxed flex-1"
                        rows={isGrid ? 3 : 2} />
                </div>
            ) : (
                <div className={cn("flex flex-col gap-0.5", isGrid && "flex-1")}>
                    {note.title && <p className="text-sm font-semibold text-white/90 truncate pr-16">{note.title}</p>}
                    <p className={cn("text-[13px] leading-relaxed", isGrid ? "line-clamp-4" : "line-clamp-2",
                        note.content ? "text-white/60" : "text-white/25 italic"
                    )}>{note.content || "Empty note"}</p>
                </div>
            )}

            {/* Footer */}
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                {note.tags.map(tag => (
                    <span key={tag} className="px-1.5 py-px rounded-md bg-white/[0.06] text-[9px] font-medium text-white/40 border border-white/[0.06]">{tag}</span>
                ))}
                <div className="flex items-center gap-2 ml-auto">
                    {note.content.length > 0 && <span className="text-[9px] text-white/20">{wordCount(note.content)}w</span>}
                    <span className="text-[9px] text-white/25">{relativeTime(note.updatedAt)}</span>
                </div>
            </div>
        </div>
    );
}

// --- Main Component ---
export function QuickNotes({ isOpen, onClose }: QuickNotesProps) {
    const [notes, setNotes] = useState<Note[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
    const [filterTag, setFilterTag] = useState<string | null>(null);
    const [initialized, setInitialized] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setNotes(loadNotes());
        const savedView = localStorage.getItem(STORAGE_VIEW_KEY);
        if (savedView === 'grid' || savedView === 'list') setViewMode(savedView);
        setInitialized(true);
    }, []);

    useEffect(() => { if (initialized) saveNotes(notes); }, [notes, initialized]);
    useEffect(() => { if (initialized) localStorage.setItem(STORAGE_VIEW_KEY, viewMode); }, [viewMode, initialized]);

    useEffect(() => {
        if (editingId && textareaRef.current) {
            textareaRef.current.focus();
            textareaRef.current.selectionStart = textareaRef.current.value.length;
        }
    }, [editingId]);

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (!editingId) return;
            if ((e.target as HTMLElement).closest('[data-note-card]')) return;
            setEditingId(null);
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [editingId]);

    const addNote = useCallback(() => {
        const note: Note = {
            id: Date.now().toString(), title: '', content: '',
            pinned: false, pinnedToScreen: false, screenPos: { x: 150 + Math.random() * 200, y: 150 + Math.random() * 200 },
            color: 'default', tags: [], createdAt: Date.now(), updatedAt: Date.now(),
        };
        setNotes(prev => [note, ...prev]);
        setEditingId(note.id);
    }, []);

    const updateNote = useCallback((id: string, updates: Partial<Note>) => {
        setNotes(prev => prev.map(n => n.id === id ? { ...n, ...updates, updatedAt: Date.now() } : n));
    }, []);

    const deleteNote = useCallback((id: string) => {
        setNotes(prev => prev.filter(n => n.id !== id));
        if (editingId === id) setEditingId(null);
    }, [editingId]);

    const togglePin = useCallback((id: string) => {
        setNotes(prev => prev.map(n => n.id === id ? { ...n, pinned: !n.pinned } : n));
    }, []);

    const togglePinToScreen = useCallback((id: string) => {
        setNotes(prev => prev.map(n => n.id === id ? { ...n, pinnedToScreen: !n.pinnedToScreen } : n));
    }, []);

    const duplicateNote = useCallback((id: string) => {
        const original = notes.find(n => n.id === id);
        if (!original) return;
        setNotes(prev => [{ ...original, id: Date.now().toString(), pinned: false, pinnedToScreen: false, createdAt: Date.now(), updatedAt: Date.now() }, ...prev]);
    }, [notes]);

    const toggleTag = useCallback((id: string, tag: string) => {
        setNotes(prev => prev.map(n => {
            if (n.id !== id) return n;
            const tags = n.tags.includes(tag) ? n.tags.filter(t => t !== tag) : [...n.tags, tag];
            return { ...n, tags };
        }));
    }, []);

    useEffect(() => {
        if (!isOpen) return;
        const handleKey = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'n') { e.preventDefault(); addNote(); }
            if (e.key === 'Escape') { if (editingId) setEditingId(null); else onClose(); }
            if ((e.ctrlKey || e.metaKey) && e.key === 'f') { e.preventDefault(); searchRef.current?.focus(); }
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [isOpen, editingId, onClose, addNote]);

    const filteredNotes = useMemo(() => {
        let result = [...notes];
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(n => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q) || n.tags.some(t => t.includes(q)));
        }
        if (filterTag) result = result.filter(n => n.tags.includes(filterTag));
        return result.sort((a, b) => {
            if (a.pinned && !b.pinned) return -1;
            if (!a.pinned && b.pinned) return 1;
            return b.updatedAt - a.updatedAt;
        });
    }, [notes, searchQuery, filterTag]);

    const allTags = useMemo(() => [...new Set(notes.flatMap(n => n.tags))], [notes]);
    const pinnedCount = useMemo(() => notes.filter(n => n.pinned).length, [notes]);
    const screenNotes = useMemo(() => notes.filter(n => n.pinnedToScreen), [notes]);


    return (
        <>
            {/* Floating sticky notes on screen (always visible via portal) */}
            {typeof document !== 'undefined' && screenNotes.length > 0 && createPortal(
                <>
                    {screenNotes.map(note => (
                        <FloatingStickyNote
                            key={note.id}
                            note={note}
                            onUpdate={(updates) => updateNote(note.id, updates)}
                            onUnpin={() => togglePinToScreen(note.id)}
                            onDelete={() => deleteNote(note.id)}
                        />
                    ))}
                </>,
                document.body
            )}

            {/* Panel */}
            <SlidePanel isOpen={isOpen} onClose={onClose} title="Quick Notes" position="right" draggable>
                <div ref={panelRef} className="p-4 flex flex-col h-full gap-3">
                    {/* Toolbar */}
                    <div className="flex items-center gap-2 shrink-0">
                        <div className="flex-1 relative group/search">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 group-focus-within/search:text-white/50 transition-colors" />
                            <input ref={searchRef} value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Search notes..."
                                className="w-full bg-white/[0.06] border border-white/[0.10] rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/25 focus:bg-white/[0.08] transition-all duration-200" />
                            {searchQuery && (
                                <button onClick={() => setSearchQuery('')}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                                    <X size={12} />
                                </button>
                            )}
                        </div>
                        <button onClick={() => setViewMode(v => v === 'grid' ? 'list' : 'grid')}
                            className="p-2 text-white/35 hover:text-white/70 hover:bg-white/[0.08] rounded-xl border border-white/[0.10] transition-all duration-200"
                            title={viewMode === 'grid' ? 'List view' : 'Grid view'}>
                            {viewMode === 'grid' ? <List size={15} /> : <LayoutGrid size={15} />}
                        </button>
                        <button onClick={addNote}
                            className="p-2 text-primary hover:bg-primary/10 rounded-xl border border-primary/20 hover:border-primary/30 transition-all duration-200"
                            title="New note (Ctrl+N)">
                            <Plus size={15} />
                        </button>
                    </div>

                    {/* Tag filter chips */}
                    {allTags.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                            <button onClick={() => setFilterTag(null)}
                                className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-medium border transition-all duration-200",
                                    !filterTag ? "bg-white/10 border-white/20 text-white" : "bg-white/[0.04] border-white/[0.06] text-white/35 hover:text-white/55 hover:border-white/15"
                                )}>All ({notes.length})</button>
                            {allTags.map(tag => {
                                const count = notes.filter(n => n.tags.includes(tag)).length;
                                return (
                                    <button key={tag} onClick={() => setFilterTag(filterTag === tag ? null : tag)}
                                        className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-medium border transition-all duration-200",
                                            filterTag === tag ? "bg-white/10 border-white/20 text-white" : "bg-white/[0.04] border-white/[0.06] text-white/35 hover:text-white/55 hover:border-white/15"
                                        )}>{tag} ({count})</button>
                                );
                            })}
                        </div>
                    )}

                    {/* Notes list */}
                    <div className={cn(
                        "flex-1 overflow-y-auto custom-scrollbar",
                        viewMode === 'grid' ? "grid grid-cols-2 gap-2 auto-rows-min content-start" : "flex flex-col gap-2"
                    )}>
                        {filteredNotes.length === 0 ? (
                            <div className={cn("flex flex-col items-center justify-center py-16 text-white/25", viewMode === 'grid' && "col-span-2")}>
                                {searchQuery || filterTag ? (
                                    <>
                                        <Search size={26} className="mb-3 opacity-30" />
                                        <p className="text-sm font-medium text-white/30">No matching notes</p>
                                        <p className="text-xs mt-1 text-white/20">Try a different search term</p>
                                    </>
                                ) : (
                                    <>
                                        <div className="relative mb-4">
                                            <StickyNote size={32} className="opacity-25" />
                                            <Sparkles size={14} className="absolute -top-1 -right-1 text-primary/40" />
                                        </div>
                                        <p className="text-sm font-medium text-white/30">No notes yet</p>
                                        <p className="text-xs mt-1.5 text-white/20">Press <kbd className="px-1.5 py-0.5 rounded bg-white/[0.08] border border-white/10 text-[10px] font-mono">Ctrl+N</kbd> to create one</p>
                                    </>
                                )}
                            </div>
                        ) : filteredNotes.map(note => (
                            <div key={note.id} data-note-card>
                                <NoteCard
                                    note={note}
                                    isEditing={editingId === note.id}
                                    isGrid={viewMode === 'grid'}
                                    onEdit={() => setEditingId(editingId === note.id ? null : note.id)}
                                    onDelete={() => deleteNote(note.id)}
                                    onPin={() => togglePin(note.id)}
                                    onSetColor={(color) => updateNote(note.id, { color })}
                                    onDuplicate={() => duplicateNote(note.id)}
                                    onPinToScreen={() => togglePinToScreen(note.id)}
                                    onUpdateTitle={(title) => updateNote(note.id, { title })}
                                    onUpdateContent={(content) => updateNote(note.id, { content })}
                                    onToggleTag={(tag) => toggleTag(note.id, tag)}
                                    textareaRef={editingId === note.id ? textareaRef : { current: null }}
                                />
                            </div>
                        ))}
                    </div>

                    {/* Footer */}
                    <div className="flex justify-between items-center pt-2.5 border-t border-white/[0.08] text-[10px] text-white/25 shrink-0">
                        <span>{notes.length} note{notes.length !== 1 ? 's' : ''}</span>
                        <div className="flex items-center gap-3">
                            {screenNotes.length > 0 && (
                                <span className="flex items-center gap-1 text-primary/60">
                                    <Monitor size={8} />
                                    {screenNotes.length}
                                </span>
                            )}
                            {pinnedCount > 0 && (
                                <span className="flex items-center gap-1">
                                    <Pin size={8} className="text-amber-400/50" />
                                    {pinnedCount}
                                </span>
                            )}
                            <span className="flex items-center gap-1">
                                <FileText size={8} />
                                {notes.reduce((acc, n) => acc + wordCount(n.content), 0)}w
                            </span>
                        </div>
                    </div>
                </div>
            </SlidePanel>
        </>
    );
}
