'use client';

import { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SlidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  position?: 'left' | 'right' | 'center';
  className?: string;
  draggable?: boolean;
  size?: 'default' | 'wide';
}

export function SlidePanel({
  isOpen,
  onClose,
  children,
  title,
  position = 'right',
  className,
  draggable = false,
  size = 'default',
}: SlidePanelProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!draggable || !isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      setPos({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y,
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, draggable]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!draggable || !panelRef.current) return;

    // Prevent dragging if clicking on a button or slider
    if ((e.target as HTMLElement).tagName === 'BUTTON' || (e.target as HTMLElement).closest('button')) return;
    if ((e.target as HTMLElement).closest('.ant-slider')) return;
    if ((e.target as HTMLElement).closest('.sound-mixer-control-btn')) return;

    const rect = panelRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    setIsDragging(true);
  };

  return (
    <div
      ref={panelRef}
      className={cn(
        'glass-card flex flex-col rounded-3xl',
        size === 'wide' ? 'h-[85vh] max-h-[700px] w-[95vw] max-w-[900px]' : 'h-[80vh] max-h-[550px] w-[300px]',
        'transition-opacity duration-300',
        draggable
          ? 'fixed z-45'
          : cn(
            'fixed top-1/2 -translate-y-1/2 z-45',
            'transition-all duration-300 ease-out',
            position === 'center'
              ? 'left-1/2 -translate-x-1/2'
              : position === 'right' ? 'right-4 lg:right-6' : 'left-20 lg:left-24',
            isOpen
              ? position === 'center' ? 'scale-100 opacity-100' : 'translate-x-0'
              : position === 'center'
                ? 'scale-95 opacity-0'
                : position === 'right'
                  ? 'translate-x-8'
                  : '-translate-x-8'
          ),
        isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        draggable && isDragging && 'cursor-grabbing',
        className
      )}
      style={
        draggable && pos
          ? {
            left: pos.x,
            top: pos.y,
            right: 'auto',
            transform: 'none',
          }
          : draggable
            ? {
              left: position === 'center' ? '50%' : position === 'right' ? 'auto' : '5rem',
              right: position === 'right' ? '1.5rem' : 'auto',
              top: '50%',
              transform: position === 'center' ? 'translate(-50%, -50%)' : 'translateY(-50%)',
            }
            : undefined
      }
    >
      {/* macOS Traffic Lights (always visible when no title) */}
      {!title && (
        <div className="absolute top-4 left-4 z-20 flex items-center gap-1.5">
          <button onClick={onClose} onMouseDown={(e) => e.stopPropagation()} className="w-3 h-3 rounded-full bg-[#ff5f56] hover:bg-[#ff5f56]/80 transition-colors shadow-sm" />
          <button onClick={onClose} onMouseDown={(e) => e.stopPropagation()} className="w-3 h-3 rounded-full bg-[#ffbd2e] hover:bg-[#ffbd2e]/80 transition-colors shadow-sm" />
          <button onMouseDown={(e) => e.stopPropagation()} className="w-3 h-3 rounded-full bg-[#27c93f] hover:bg-[#27c93f]/80 transition-colors shadow-sm" />
        </div>
      )}

      {/* Header with macOS Traffic Lights */}
      {title && (
        <div
          className={cn(
            'flex items-center px-4 py-3 border-b border-white/10 shrink-0 relative bg-white/[0.02]',
            draggable && 'cursor-grab active:cursor-grabbing'
          )}
          onMouseDown={handleMouseDown}
        >
          <div className="flex items-center gap-1.5 absolute left-4 z-10">
            <button onClick={onClose} onMouseDown={(e) => e.stopPropagation()} className="w-3 h-3 rounded-full bg-[#ff5f56] hover:bg-[#ff5f56]/80 transition-colors shadow-sm" />
            <button onClick={onClose} onMouseDown={(e) => e.stopPropagation()} className="w-3 h-3 rounded-full bg-[#ffbd2e] hover:bg-[#ffbd2e]/80 transition-colors shadow-sm" />
            <button onMouseDown={(e) => e.stopPropagation()} className="w-3 h-3 rounded-full bg-[#27c93f] hover:bg-[#27c93f]/80 transition-colors shadow-sm" />
          </div>
          <h2 className="text-white/90 text-[13px] font-semibold tracking-wide w-full text-center pointer-events-none select-none">
            {title}
          </h2>
        </div>
      )}

      {/* Drag Handle (when no title) */}
      {!title && draggable && (
        <div
          className="absolute top-0 left-0 right-0 h-10 cursor-grab active:cursor-grabbing rounded-t-3xl z-10"
          onMouseDown={handleMouseDown}
        />
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {children}
      </div>
    </div>
  );
}
