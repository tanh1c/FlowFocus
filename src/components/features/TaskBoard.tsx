'use client';

import { useState, useRef, useEffect } from 'react';
import {
    Plus, Trash2, Circle, GripVertical, Pencil, Check,
    LayoutGrid, Calendar as CalendarIcon, ListTodo, BarChart3,
    Clock, Flag, X, Flame, Zap, Target,
    CheckCircle2, CircleDot, Timer
} from 'lucide-react';
import { Calendar as AntCalendar, DatePicker as AntDatePicker, ConfigProvider, theme as antTheme } from 'antd';
import { Calendar as ShadcnCalendar } from '@/components/ui/calendar';
import {
    DndContext, closestCenter, PointerSensor, useSensor, useSensors,
    type DragEndEvent, DragOverlay, type DragStartEvent,
    useDroppable,
} from '@dnd-kit/core';
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import dayjs, { type Dayjs } from 'dayjs';
import { SlidePanel } from '../ui/SlidePanel';
import { cn } from '@/lib/utils';
import { useApp } from '@/contexts/AppContext';

// --- Types ---
type TaskStatus = 'todo' | 'inProgress' | 'done';
type TaskPriority = 'low' | 'medium' | 'high';
type TabType = 'board' | 'calendar' | 'events' | 'dashboard';
type CalendarVariant = 'antd' | 'shadcn';

interface Task {
    id: string;
    text: string;
    status: TaskStatus;
    priority: TaskPriority;
    createdAt: number;
    dueDate?: string;
}

interface TaskBoardProps {
    isOpen: boolean;
    onClose: () => void;
}
// --- Config ---
const TASKS_STORAGE_KEY = 'beeziee-tasks';
const statusConfig: Record<TaskStatus, { label: string; icon: React.ReactNode; color: string; bg: string; border: string }> = {
    todo: { label: 'To Do', icon: <Circle size={15} />, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    inProgress: { label: 'In Progress', icon: <CircleDot size={15} />, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
    done: { label: 'Done', icon: <CheckCircle2 size={15} />, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
};

const priorityConfig: Record<TaskPriority, { label: string; color: string; icon: React.ReactNode }> = {
    low: { label: 'Low', color: 'text-sky-400', icon: <Flag size={13} /> },
    medium: { label: 'Med', color: 'text-amber-400', icon: <Zap size={13} /> },
    high: { label: 'High', color: 'text-red-400', icon: <Flame size={13} /> },
};

const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'board', label: 'Board', icon: <LayoutGrid size={16} /> },
    { id: 'calendar', label: 'Calendar', icon: <CalendarIcon size={16} /> },
    { id: 'events', label: 'Events', icon: <ListTodo size={16} /> },
    { id: 'dashboard', label: 'Dashboard', icon: <BarChart3 size={16} /> },
];

const darkThemeConfig = {
    algorithm: antTheme.darkAlgorithm,
    token: {
        colorPrimary: '#f59e0b',
        colorBgContainer: 'transparent',
        colorBgElevated: '#1a1a1a',
        colorBorder: 'rgba(255,255,255,0.1)',
        colorText: 'rgba(255,255,255,0.85)',
        colorTextSecondary: 'rgba(255,255,255,0.45)',
        borderRadius: 12,
        fontSize: 13,
    },
};
// --- Draggable Task Card with inline edit ---
function DraggableTaskCard({ task, onCycle, onDelete, onEdit }: {
    task: Task; onCycle: (id: string) => void; onDelete: (id: string) => void;
    onEdit: (id: string, text: string) => void;
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(task.text);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => { if (isEditing) inputRef.current?.focus(); }, [isEditing]);

    const saveEdit = () => {
        if (editText.trim() && editText.trim() !== task.text) onEdit(task.id, editText.trim());
        setIsEditing(false);
    };

    const priority = priorityConfig[task.priority];
    const status = statusConfig[task.status];
    const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 };

    return (
        <div ref={setNodeRef} style={style}
            className={cn("group bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/15 rounded-xl p-3.5 transition-all", isDragging && "shadow-xl ring-1 ring-white/20")}
        >
            <div className="flex items-start gap-2.5">
                <div {...attributes} {...listeners} className="shrink-0 mt-1 cursor-grab active:cursor-grabbing text-white/15 hover:text-white/40 transition-colors">
                    <GripVertical size={14} />
                </div>
                <button onClick={() => onCycle(task.id)} className="shrink-0 mt-0.5 hover:scale-110 transition-transform">
                    <span className={status.color}>{status.icon}</span>
                </button>
                <div className="flex-1 min-w-0">
                    {isEditing ? (
                        <input ref={inputRef} value={editText} onChange={e => setEditText(e.target.value)}
                            onBlur={saveEdit} onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setIsEditing(false); }}
                            className="w-full bg-white/10 border border-white/20 rounded-lg px-2 py-1 text-sm text-white focus:outline-none focus:border-white/40"
                        />
                    ) : (
                        <p onDoubleClick={() => setIsEditing(true)}
                            className={cn("text-sm text-white/85 leading-snug cursor-text", task.status === 'done' && "line-through text-white/30")}>{task.text}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                        <span className={cn("flex items-center gap-1 text-xs font-medium", priority.color)}>{priority.icon} {priority.label}</span>
                        {task.dueDate && <span className="flex items-center gap-1 text-xs text-white/40"><Clock size={12} /> {dayjs(task.dueDate).format('MMM D')}</span>}
                    </div>
                </div>
                <div className="flex flex-col gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-all">
                    <button onClick={() => { setEditText(task.text); setIsEditing(true); }} className="text-white/30 hover:text-white p-1 rounded-lg hover:bg-white/10"><Pencil size={12} /></button>
                    <button onClick={() => onDelete(task.id)} className="text-white/30 hover:text-red-400 p-1 rounded-lg hover:bg-white/5"><Trash2 size={12} /></button>
                </div>
            </div>
        </div>
    );
}

// --- Static Task Card (for calendar/events) ---
function TaskCard({ task, onCycle, onDelete, onEdit }: {
    task: Task; onCycle: (id: string) => void; onDelete: (id: string) => void;
    onEdit: (id: string, text: string) => void;
}) {
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(task.text);
    const inputRef = useRef<HTMLInputElement>(null);
    useEffect(() => { if (isEditing) inputRef.current?.focus(); }, [isEditing]);
    const saveEdit = () => { if (editText.trim() && editText.trim() !== task.text) onEdit(task.id, editText.trim()); setIsEditing(false); };
    const priority = priorityConfig[task.priority];
    const status = statusConfig[task.status];
    return (
        <div className="group bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/15 rounded-xl p-3.5 transition-all">
            <div className="flex items-start gap-3">
                <button onClick={() => onCycle(task.id)} className="shrink-0 mt-0.5 hover:scale-110 transition-transform"><span className={status.color}>{status.icon}</span></button>
                <div className="flex-1 min-w-0">
                    {isEditing ? (
                        <input ref={inputRef} value={editText} onChange={e => setEditText(e.target.value)}
                            onBlur={saveEdit} onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setIsEditing(false); }}
                            className="w-full bg-white/10 border border-white/20 rounded-lg px-2 py-1 text-sm text-white focus:outline-none focus:border-white/40" />
                    ) : (
                        <p onDoubleClick={() => setIsEditing(true)} className={cn("text-sm text-white/85 leading-snug cursor-text", task.status === 'done' && "line-through text-white/30")}>{task.text}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                        <span className={cn("flex items-center gap-1 text-xs font-medium", priority.color)}>{priority.icon} {priority.label}</span>
                        {task.dueDate && <span className="flex items-center gap-1 text-xs text-white/40"><Clock size={12} /> {dayjs(task.dueDate).format('MMM D')}</span>}
                    </div>
                </div>
                <div className="flex flex-col gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-all">
                    <button onClick={() => { setEditText(task.text); setIsEditing(true); }} className="text-white/30 hover:text-white p-1 rounded-lg hover:bg-white/10"><Pencil size={12} /></button>
                    <button onClick={() => onDelete(task.id)} className="text-white/30 hover:text-red-400 p-1 rounded-lg hover:bg-white/5"><Trash2 size={12} /></button>
                </div>
            </div>
        </div>
    );
}
// --- Droppable Column ---
function DroppableColumn({ status, children }: { status: TaskStatus; children: React.ReactNode }) {
    const { setNodeRef, isOver } = useDroppable({ id: status });
    const config = statusConfig[status];
    return (
        <div ref={setNodeRef} className={cn("flex flex-col rounded-2xl border p-4 transition-all", config.bg, config.border, isOver && "ring-2 ring-white/20 bg-white/5")}>
            {children}
        </div>
    );
}

// --- Board View with DnD ---
function BoardView({ tasks, onCycle, onDelete, onAdd, onEdit, onMoveTask }: {
    tasks: Task[]; onCycle: (id: string) => void; onDelete: (id: string) => void;
    onAdd: (status: TaskStatus) => void; onEdit: (id: string, text: string) => void;
    onMoveTask: (taskId: string, newStatus: TaskStatus) => void;
}) {
    const columns: TaskStatus[] = ['todo', 'inProgress', 'done'];
    const [activeId, setActiveId] = useState<string | null>(null);
    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

    const handleDragStart = (event: DragStartEvent) => setActiveId(String(event.active.id));

    const handleDragEnd = (event: DragEndEvent) => {
        setActiveId(null);
        const { active, over } = event;
        if (!over) return;
        const taskId = String(active.id);
        const overId = String(over.id);
        // Dropped on a column
        if (['todo', 'inProgress', 'done'].includes(overId)) {
            onMoveTask(taskId, overId as TaskStatus);
            return;
        }
        // Dropped on another task — move to that task's column
        const overTask = tasks.find(t => t.id === overId);
        if (overTask) onMoveTask(taskId, overTask.status);
    };

    const activeTask = activeId ? tasks.find(t => t.id === activeId) : null;

    return (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-3 gap-4 h-full">
                {columns.map((status) => {
                    const config = statusConfig[status];
                    const items = tasks.filter(t => t.status === status);
                    return (
                        <DroppableColumn key={status} status={status}>
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <span className={config.color}>{config.icon}</span>
                                    <span className={cn("text-xs font-bold uppercase tracking-wider", config.color)}>{config.label}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-white/30 bg-white/5 px-2 py-0.5 rounded-full tabular-nums">{items.length}</span>
                                    <button onClick={() => onAdd(status)} className="text-white/30 hover:text-white hover:bg-white/10 rounded-lg p-1 transition-all">
                                        <Plus size={15} />
                                    </button>
                                </div>
                            </div>
                            <SortableContext items={items.map(t => t.id)} strategy={verticalListSortingStrategy}>
                                <div className="flex-1 overflow-y-auto space-y-2.5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                                    {items.length === 0 ? (
                                        <p className="text-xs text-white/15 text-center py-8 italic">Drop tasks here</p>
                                    ) : items.map(task => (
                                        <DraggableTaskCard key={task.id} task={task} onCycle={onCycle} onDelete={onDelete} onEdit={onEdit} />
                                    ))}
                                </div>
                            </SortableContext>
                        </DroppableColumn>
                    );
                })}
            </div>
            <DragOverlay>
                {activeTask && (
                    <div className="bg-black/90 border border-white/20 rounded-xl p-3.5 shadow-2xl ring-2 ring-primary/30 w-[260px]">
                        <p className="text-sm text-white/85">{activeTask.text}</p>
                    </div>
                )}
            </DragOverlay>
        </DndContext>
    );
}
// --- Calendar View with antd/shadcn toggle ---
function CalendarView({ tasks, selectedDate, onDateSelect, onCycle, onDelete, onEdit, calendarVariant, onVariantChange }: {
    tasks: Task[]; selectedDate: string; onDateSelect: (date: string) => void;
    onCycle: (id: string) => void; onDelete: (id: string) => void; onEdit: (id: string, text: string) => void;
    calendarVariant: CalendarVariant; onVariantChange: (v: CalendarVariant) => void;
}) {
    const getTasksForDate = (dateStr: string) => tasks.filter(t => t.dueDate === dateStr);
    const selectedTasks = getTasksForDate(selectedDate);

    return (
        <div className="flex gap-4 h-full">
            <div className="w-[340px] shrink-0 flex flex-col gap-3">
                {/* Variant toggle */}
                <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1 self-start">
                    {(['antd', 'shadcn'] as CalendarVariant[]).map(v => (
                        <button key={v} onClick={() => onVariantChange(v)}
                            className={cn("px-3 py-1 rounded-lg text-xs font-medium transition-all",
                                calendarVariant === v ? "bg-white/10 text-white" : "text-white/40 hover:text-white/60"
                            )}>{v === 'antd' ? 'Ant Design' : 'Shadcn'}</button>
                    ))}
                </div>

                {calendarVariant === 'antd' ? (
                    <ConfigProvider theme={darkThemeConfig}>
                        <AntCalendar fullscreen={false} value={dayjs(selectedDate)}
                            onSelect={(date) => onDateSelect(date.format('YYYY-MM-DD'))}
                            fullCellRender={(current, info) => {
                                if (info.type !== 'date') return info.originNode;
                                const dateStr = current.format('YYYY-MM-DD');
                                const isSelected = dateStr === selectedDate;
                                const isToday = current.isSame(dayjs(), 'day');
                                const isCurrentMonth = current.month() === dayjs(selectedDate).month();
                                const dayTasks = getTasksForDate(dateStr);
                                return (
                                    <div className={cn("flex flex-col items-center justify-center py-1 mx-auto rounded-lg w-9 h-10 transition-all cursor-pointer",
                                        isSelected && "bg-primary/25 ring-1 ring-primary/50",
                                        isToday && !isSelected && "bg-white/10 font-bold",
                                        !isCurrentMonth && "opacity-30",
                                        !isSelected && !isToday && "hover:bg-white/5",
                                    )}>
                                        <span className={cn("text-xs", isSelected ? "text-primary font-bold" : "text-white/70")}>{current.date()}</span>
                                        {dayTasks.length > 0 && (
                                            <div className="flex gap-0.5 mt-0.5">
                                                {dayTasks.slice(0, 3).map((t, i) => (
                                                    <div key={i} className={cn("w-1.5 h-1.5 rounded-full", statusConfig[t.status].color.replace('text-', 'bg-'))} />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            }}
                        />
                    </ConfigProvider>
                ) : (
                    <div className="bg-white/5 rounded-2xl border border-white/5 p-3">
                        <ShadcnCalendar mode="single"
                            selected={new Date(selectedDate + 'T00:00:00')}
                            onSelect={(date) => { if (date) onDateSelect(dayjs(date).format('YYYY-MM-DD')); }}
                            className="!bg-transparent [--cell-size:2.5rem] w-full [&_*]:!bg-transparent [&_.rdp-today]:!bg-white/10 [&_[data-selected-single=true]]:!bg-amber-500/25 [&_[data-selected-single=true]]:!text-amber-300"
                            classNames={{
                                month_caption: "flex h-10 w-full items-center justify-center text-sm font-semibold text-white/70",
                                weekday: "text-white/30 flex-1 select-none rounded-md text-xs font-medium",
                                day: "group/day relative aspect-square h-full w-full select-none p-0 text-center",
                            }}
                            modifiers={{ hasTasks: (date) => getTasksForDate(dayjs(date).format('YYYY-MM-DD')).length > 0 }}
                            modifiersClassNames={{ hasTasks: '!font-bold !text-amber-300' }}
                        />
                    </div>
                )}
            </div>

            {/* Task list for selected date */}
            <div className="flex-1 flex flex-col min-w-0">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-white/70">{dayjs(selectedDate).format('dddd, MMMM D, YYYY')}</h3>
                    <span className="text-xs text-white/30 bg-white/5 px-2 py-1 rounded-full">{selectedTasks.length} task{selectedTasks.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="flex-1 overflow-y-auto space-y-2.5 [&::-webkit-scrollbar]:hidden">
                    {selectedTasks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-white/20">
                            <CalendarIcon size={32} className="mb-3 opacity-50" />
                            <p className="text-sm">No tasks for this day</p>
                        </div>
                    ) : selectedTasks.map(task => (
                        <TaskCard key={task.id} task={task} onCycle={onCycle} onDelete={onDelete} onEdit={onEdit} />
                    ))}
                </div>
            </div>
        </div>
    );
}
// --- Events View ---
function EventsView({ tasks }: { tasks: Task[] }) {
    const sorted = [...tasks].sort((a, b) => b.createdAt - a.createdAt);
    const grouped = sorted.reduce<Record<string, Task[]>>((acc, task) => {
        const date = dayjs(task.createdAt).format('MMM D, YYYY');
        (acc[date] ||= []).push(task);
        return acc;
    }, {});
    return (
        <div className="flex flex-col gap-5 h-full overflow-y-auto [&::-webkit-scrollbar]:hidden">
            {Object.keys(grouped).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-white/20">
                    <ListTodo size={32} className="mb-3 opacity-50" /><p className="text-sm">No events yet</p>
                </div>
            ) : Object.entries(grouped).map(([date, items]) => (
                <div key={date}>
                    <div className="flex items-center gap-2.5 mb-3">
                        <div className="w-2 h-2 rounded-full bg-primary/60" />
                        <span className="text-xs font-bold text-white/50 uppercase tracking-wider">{date}</span>
                        <div className="flex-1 h-px bg-white/5" />
                    </div>
                    <div className="space-y-2 pl-5 border-l border-white/5 ml-[3px]">
                        {items.map(task => (
                            <div key={task.id} className="flex items-center gap-3 bg-white/5 hover:bg-white/8 rounded-xl p-3 transition-all">
                                <span className={statusConfig[task.status].color}>{statusConfig[task.status].icon}</span>
                                <span className={cn("flex-1 text-sm text-white/70 truncate", task.status === 'done' && "line-through text-white/30")}>{task.text}</span>
                                <span className={cn("flex items-center gap-1 text-xs", priorityConfig[task.priority].color)}>{priorityConfig[task.priority].icon}</span>
                                {task.dueDate && <span className="text-xs text-white/25">{dayjs(task.dueDate).format('MMM D')}</span>}
                                <span className="text-xs text-white/20">{dayjs(task.createdAt).format('h:mm A')}</span>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

// --- Dashboard View ---
function DashboardView({ tasks }: { tasks: Task[] }) {
    const total = tasks.length;
    const todo = tasks.filter(t => t.status === 'todo').length;
    const inProgress = tasks.filter(t => t.status === 'inProgress').length;
    const done = tasks.filter(t => t.status === 'done').length;
    const high = tasks.filter(t => t.priority === 'high' && t.status !== 'done').length;
    const completionRate = total > 0 ? Math.round((done / total) * 100) : 0;
    const overdue = tasks.filter(t => t.dueDate && dayjs(t.dueDate).isBefore(dayjs(), 'day') && t.status !== 'done').length;
    const stats = [
        { label: 'Total Tasks', value: total, icon: <Target size={18} />, color: 'text-white/70', bg: 'bg-white/5' },
        { label: 'To Do', value: todo, icon: <Circle size={18} />, color: 'text-blue-400', bg: 'bg-blue-500/10' },
        { label: 'In Progress', value: inProgress, icon: <Timer size={18} />, color: 'text-amber-400', bg: 'bg-amber-500/10' },
        { label: 'Completed', value: done, icon: <CheckCircle2 size={18} />, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    ];
    return (
        <div className="flex flex-col gap-5 h-full overflow-y-auto [&::-webkit-scrollbar]:hidden">
            <div className="grid grid-cols-4 gap-3">
                {stats.map(s => (
                    <div key={s.label} className={cn("rounded-2xl border border-white/5 p-4 flex flex-col gap-2.5", s.bg)}>
                        <div className={cn("flex items-center gap-2", s.color)}>{s.icon}<span className="text-xs font-bold uppercase tracking-wider">{s.label}</span></div>
                        <span className="text-3xl font-bold text-white tabular-nums">{s.value}</span>
                    </div>
                ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/5 rounded-2xl border border-white/5 p-4">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-white/40 uppercase tracking-wider">Completion Rate</span>
                        <span className="text-lg font-bold text-white tabular-nums">{completionRate}%</span>
                    </div>
                    <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-500" style={{ width: `${completionRate}%` }} />
                    </div>
                    {overdue > 0 && <p className="text-xs text-red-400/70 mt-2.5 flex items-center gap-1"><Clock size={12} /> {overdue} overdue</p>}
                </div>
                <div className={cn("rounded-2xl border p-4", high > 0 ? "bg-red-500/5 border-red-500/10" : "bg-white/5 border-white/5")}>
                    <div className="flex items-center gap-2 mb-3">
                        <Flame size={16} className={high > 0 ? "text-red-400" : "text-white/30"} />
                        <span className={cn("text-xs font-bold uppercase tracking-wider", high > 0 ? "text-red-400" : "text-white/30")}>High Priority ({high})</span>
                    </div>
                    {high === 0 ? <p className="text-xs text-white/20 italic">No urgent tasks</p> : (
                        <div className="space-y-2">
                            {tasks.filter(t => t.priority === 'high' && t.status !== 'done').map(t => (
                                <div key={t.id} className="flex items-center gap-2.5 text-sm text-white/60">
                                    <span className={statusConfig[t.status].color}>{statusConfig[t.status].icon}</span>
                                    <span className="truncate">{t.text}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
// --- Main Component ---
export function TaskBoard({ isOpen, onClose }: TaskBoardProps) {
    const { recordTaskCompletion } = useApp();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [initialized, setInitialized] = useState(false);

    // Load tasks on mount
    useEffect(() => {
        const saved = localStorage.getItem(TASKS_STORAGE_KEY);
        if (saved) {
            try {
                setTasks(JSON.parse(saved));
            } catch (e) {
                console.error('Failed to parse tasks', e);
            }
        }
        setInitialized(true);
    }, []);

    // Save tasks on change
    useEffect(() => {
        if (initialized) {
            localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
        }
    }, [tasks, initialized]);
    const [activeTab, setActiveTab] = useState<TabType>('board');
    const [showAddModal, setShowAddModal] = useState(false);
    const [addToStatus, setAddToStatus] = useState<TaskStatus>('todo');
    const [calendarVariant, setCalendarVariant] = useState<CalendarVariant>('antd');

    // Add task form
    const [newText, setNewText] = useState('');
    const [newPriority, setNewPriority] = useState<TaskPriority>('medium');
    const [newDueDate, setNewDueDate] = useState<Dayjs | null>(null);

    const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'));

    const addTask = () => {
        if (!newText.trim()) return;
        const dueDate = newDueDate ? newDueDate.format('YYYY-MM-DD') : undefined;
        const task: Task = {
            id: Date.now().toString(),
            text: newText.trim(),
            status: addToStatus,
            priority: newPriority,
            createdAt: Date.now(),
            dueDate,
        };
        setTasks(prev => [...prev, task]);
        setNewText(''); setNewPriority('medium'); setNewDueDate(null);
        setShowAddModal(false);
    };

    const deleteTask = (id: string) => setTasks(prev => prev.filter(t => t.id !== id));
    const editTask = (id: string, text: string) => setTasks(prev => prev.map(t => t.id === id ? { ...t, text } : t));
    const cycleStatus = (id: string) => {
        setTasks(prev => prev.map(t => {
            if (t.id !== id) return t;
            const order: TaskStatus[] = ['todo', 'inProgress', 'done'];
            const newStatus = order[(order.indexOf(t.status) + 1) % order.length];
            if (newStatus === 'done' && t.status !== 'done') recordTaskCompletion();
            return { ...t, status: newStatus };
        }));
    };
    const moveTask = (taskId: string, newStatus: TaskStatus) => {
        setTasks(prev => prev.map(t => {
            if (t.id !== taskId) return t;
            if (newStatus === 'done' && t.status !== 'done') recordTaskCompletion();
            return { ...t, status: newStatus };
        }));
    };
    const openAddModal = (status: TaskStatus = 'todo') => { setAddToStatus(status); setShowAddModal(true); };

    return (
        <SlidePanel isOpen={isOpen} onClose={onClose} title="Task Board" position="center" draggable size="wide">
            <div className="flex flex-col h-full">
                {/* Tab Bar */}
                <div className="flex items-center gap-1.5 px-5 pt-3 pb-2.5 border-b border-white/5 shrink-0">
                    {tabs.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                            className={cn("flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all",
                                activeTab === tab.id ? "bg-white/10 text-white border border-white/10" : "text-white/40 hover:text-white/60 hover:bg-white/5"
                            )}>{tab.icon}{tab.label}</button>
                    ))}
                    <div className="flex-1" />
                    <button onClick={() => openAddModal()}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-primary/20 text-primary hover:bg-primary/30 border border-primary/20 transition-all">
                        <Plus size={16} /> Add Task
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden p-5">
                    {activeTab === 'board' && <BoardView tasks={tasks} onCycle={cycleStatus} onDelete={deleteTask} onAdd={openAddModal} onEdit={editTask} onMoveTask={moveTask} />}
                    {activeTab === 'calendar' && <CalendarView tasks={tasks} selectedDate={selectedDate} onDateSelect={setSelectedDate} onCycle={cycleStatus} onDelete={deleteTask} onEdit={editTask} calendarVariant={calendarVariant} onVariantChange={setCalendarVariant} />}
                    {activeTab === 'events' && <EventsView tasks={tasks} />}
                    {activeTab === 'dashboard' && <DashboardView tasks={tasks} />}
                </div>
                {/* Add Task Modal */}
                {showAddModal && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-3xl">
                        <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 w-[400px] shadow-2xl max-h-[90%] overflow-y-auto [&::-webkit-scrollbar]:hidden">
                            <div className="flex items-center justify-between mb-5">
                                <h3 className="text-base font-semibold text-white">New Task</h3>
                                <button onClick={() => setShowAddModal(false)} className="text-white/30 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-all"><X size={18} /></button>
                            </div>
                            <div className="space-y-4">
                                <input type="text" value={newText} onChange={e => setNewText(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && addTask()} placeholder="What needs to be done?" autoFocus
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none focus:border-white/25 transition-all" />

                                {/* Status */}
                                <div>
                                    <label className="text-xs font-bold text-white/30 uppercase tracking-wider mb-2 block">Status</label>
                                    <div className="flex gap-2">
                                        {(['todo', 'inProgress', 'done'] as TaskStatus[]).map(s => (
                                            <button key={s} onClick={() => setAddToStatus(s)}
                                                className={cn("flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium border transition-all",
                                                    addToStatus === s ? cn(statusConfig[s].bg, statusConfig[s].border, statusConfig[s].color) : "bg-white/5 border-white/5 text-white/30 hover:bg-white/10"
                                                )}>{statusConfig[s].icon} {statusConfig[s].label}</button>
                                        ))}
                                    </div>
                                </div>

                                {/* Priority */}
                                <div>
                                    <label className="text-xs font-bold text-white/30 uppercase tracking-wider mb-2 block">Priority</label>
                                    <div className="flex gap-2">
                                        {(['low', 'medium', 'high'] as TaskPriority[]).map(p => (
                                            <button key={p} onClick={() => setNewPriority(p)}
                                                className={cn("flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium border transition-all",
                                                    newPriority === p ? cn("bg-white/10 border-white/15", priorityConfig[p].color) : "bg-white/5 border-white/5 text-white/30 hover:bg-white/10"
                                                )}>{priorityConfig[p].icon} {priorityConfig[p].label}</button>
                                        ))}
                                    </div>
                                </div>

                                {/* Due Date */}
                                <div>
                                    <label className="text-xs font-bold text-white/30 uppercase tracking-wider mb-2 block">Due Date</label>
                                    <ConfigProvider theme={darkThemeConfig}>
                                        <AntDatePicker value={newDueDate} onChange={(date) => setNewDueDate(date)}
                                            className="w-full" placeholder="Select due date" format="MMM D, YYYY" allowClear
                                            getPopupContainer={(trigger) => trigger.parentElement || document.body} />
                                    </ConfigProvider>
                                </div>

                                <button onClick={addTask} disabled={!newText.trim()}
                                    className="w-full py-3 rounded-xl bg-primary/20 text-primary font-medium text-sm hover:bg-primary/30 border border-primary/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed">
                                    Add Task
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </SlidePanel>
    );
}