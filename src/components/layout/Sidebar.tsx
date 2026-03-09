'use client';

import { Tooltip } from 'antd';
import {
  SlidersVertical,
  ImageIcon,
  Clock,
  Youtube,
  PanelsTopLeft,
  StickyNote,
  Maximize,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarItem {
  id: string;
  icon: React.ReactNode;
  tooltip: string;
  onClick?: () => void;
}

interface SidebarProps {
  onMixerClick?: () => void;
  onSceneClick?: () => void;
  onTimerClick?: () => void;
  onYoutubeClick?: () => void;
  onTasksClick?: () => void;
  onNotesClick?: () => void;
  onFullscreenClick?: () => void;
  activePanel?: string | null;
}

export function Sidebar({
  onMixerClick,
  onSceneClick,
  onTimerClick,
  onYoutubeClick,
  onTasksClick,
  onNotesClick,
  onFullscreenClick,
  activePanel,
}: SidebarProps) {
  const items: SidebarItem[] = [
    {
      id: 'mixer',
      icon: <SlidersVertical size={22} />,
      tooltip: 'Mixer',
      onClick: onMixerClick,
    },
    {
      id: 'scene',
      icon: <ImageIcon size={22} />,
      tooltip: 'Scenes',
      onClick: onSceneClick,
    },
    {
      id: 'timer',
      icon: <Clock size={22} />,
      tooltip: 'Timer',
      onClick: onTimerClick,
    },
    {
      id: 'youtube',
      icon: <Youtube size={22} />,
      tooltip: 'YouTube',
      onClick: onYoutubeClick,
    },
    {
      id: 'tasks',
      icon: <PanelsTopLeft size={22} />,
      tooltip: 'Tasks',
      onClick: onTasksClick,
    },
    {
      id: 'notes',
      icon: <StickyNote size={22} />,
      tooltip: 'Notes',
      onClick: onNotesClick,
    },
    {
      id: 'fullscreen',
      icon: <Maximize size={22} />,
      tooltip: 'Expand',
      onClick: onFullscreenClick,
    },
  ];

  return (
    <div className="fixed top-1/2 left-6 -translate-y-1/2 z-40 group">
      {/* 
        Hover Expanding Container 
        Width changes from 64px (collapsed) to 200px (expanded)
      */}
      <div className={cn(
        "flex flex-col items-start gap-2 p-2",
        "bg-black/90 backdrop-blur-2xl border border-white/10 rounded-[2rem] shadow-[0_8px_32px_rgba(0,0,0,0.5)]",
        "transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]", // Spring-like easing
        "w-[64px] group-hover:w-[190px] overflow-hidden"
      )}>
        {items.map((item) => {
          const isActive = activePanel === item.id;
          return (
            <button
              key={item.id}
              onClick={item.onClick}
              className={cn(
                "relative flex items-center gap-3 w-full rounded-full transition-all duration-300",
                "hover:bg-white/10 active:scale-95",
                isActive ? "bg-white/15" : ""
              )}
            >
              {/* Icon Container */}
              <div className={cn(
                "shrink-0 flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 z-10",
                isActive
                  ? "bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.4)] scale-100"
                  : "text-white/60 group-hover:text-white/80"
              )}>
                {item.icon}
              </div>

              {/* Text Label - Fades in on hover */}
              <span className={cn(
                "whitespace-nowrap text-sm font-semibold tracking-wide transition-all duration-300",
                "opacity-0 -translate-x-4",
                "group-hover:opacity-100 group-hover:translate-x-0",
                isActive ? "text-white drop-shadow-md" : "text-white/60"
              )}>
                {item.tooltip}
              </span>

              {/* Active Dot */}
              {isActive && (
                <span className="absolute right-4 w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_white] opacity-0 group-hover:opacity-100 transition-opacity delay-100" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
