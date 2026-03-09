// ========================================
// Type Definitions
// ========================================

export interface Scene {
  id: string;
  name: string;
  image: string;
  type: 'static' | 'live';
}

export interface Track {
  id: string;
  title: string;
  artist?: string;
  duration: number;
  src: string;
  coverImage?: string;
}

export interface Mood {
  id: string;
  name: string;
  icon: string;
  tracks: Track[];
}

export interface Sound {
  id: string;
  name: string;
  icon: string;
  src: string;
  volume: number;
  isPlaying: boolean;
}

export interface TimerSettings {
  focusDuration: number; // in minutes
  shortBreakDuration: number;
  longBreakDuration: number;
  sessionsBeforeLongBreak: number;
}

export interface TimerState {
  mode: 'focus' | 'shortBreak' | 'longBreak';
  timeRemaining: number; // in seconds
  isRunning: boolean;
  currentSession: number;
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  createdAt: Date;
  completedAt?: Date;
}

export interface Note {
  id: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserStats {
  totalFocusTime: number; // in minutes
  sessionsCompleted: number;
  tasksCompleted: number;
  streak: number;
}

// Component Props Types
export interface IconButtonProps {
  icon: React.ReactNode;
  onClick?: () => void;
  tooltip?: string;
  isActive?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export interface PanelProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  position?: 'left' | 'right';
  title?: string;
}
