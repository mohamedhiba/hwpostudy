'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import type { Session } from 'next-auth';

// Define a typed session to use in our component
interface ExtendedSession extends Session {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    totalStudyTime: number;
    totalTasksDone: number;
  }
}

export type TimerState = 'idle' | 'running' | 'paused' | 'completed';
export type TimerMode = 'focus' | 'shortBreak' | 'longBreak';

// Define default timer durations
const DEFAULT_DURATIONS = {
  focus: 25 * 60, // 25 minutes
  shortBreak: 5 * 60, // 5 minutes
  longBreak: 15 * 60 // 15 minutes
};

export const TIMER_MODES = {
  focus: { label: 'Focus', duration: DEFAULT_DURATIONS.focus },
  shortBreak: { label: 'Short Break', duration: DEFAULT_DURATIONS.shortBreak },
  longBreak: { label: 'Long Break', duration: DEFAULT_DURATIONS.longBreak },
};

// Define interfaces for shared session types
interface SharedSessionParticipant {
  id: string;
  userId: string;
  sessionId: string;
  joinedAt: string;
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

interface SharedSessionData {
  id: string;
  name: string;
  creatorId: string;
  timerMode: string;
  duration: number;
  startTime: string | null;
  endTime: string | null;
  isActive: boolean;
  inviteCode: string;
  createdAt: string;
  participants: SharedSessionParticipant[];
  creator: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

interface TimerContextType {
  mode: TimerMode;
  state: TimerState;
  sessionId: string | null;
  timeRemaining: number;
  completedSessions: number;
  progress: number;
  isSharedSession: boolean;
  sharedSessionData: SharedSessionData | null;
  elapsedTime: number;
  durations: typeof DEFAULT_DURATIONS;
  setMode: (mode: TimerMode) => void;
  setState: (state: TimerState) => void;
  setTimeRemaining: (time: number | ((prev: number) => number)) => void;
  startTimer: () => Promise<void>;
  pauseTimer: () => void;
  resetTimer: () => Promise<void>;
  saveProgress: () => Promise<void>;
  endSession: () => Promise<void>;
  createSharedSession: (name: string) => Promise<void>;
  joinSharedSession: (inviteCode: string) => Promise<void>;
  leaveSharedSession: () => void;
  updateDuration: (mode: TimerMode, minutes: number) => void;
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

export function TimerProvider({ children }: { children: ReactNode }) {
  // Use type assertion for the session
  const { data: session, status } = useSession() as { 
    data: ExtendedSession | null;
    status: "loading" | "authenticated" | "unauthenticated";
  };
  
  const [mode, setMode] = useState<TimerMode>('focus');
  const [state, setState] = useState<TimerState>('idle');
  const [timeRemaining, setTimeRemaining] = useState(TIMER_MODES.focus.duration);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [progress, setProgress] = useState(100);
  const [lastUpdateTime, setLastUpdateTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  
  // For shared sessions
  const [isSharedSession, setIsSharedSession] = useState(false);
  const [sharedSessionData, setSharedSessionData] = useState<SharedSessionData | null>(null);
  
  // For customizable durations
  const [durations, setDurations] = useState(() => {
    // Try to load custom durations from localStorage
    if (typeof window !== 'undefined') {
      try {
        const savedDurations = localStorage.getItem('timerDurations');
        if (savedDurations) {
          return JSON.parse(savedDurations);
        }
      } catch (error) {
        console.error('Error loading timer durations from localStorage:', error);
      }
    }
    return DEFAULT_DURATIONS;
  });

  // Define all functions first using useCallback
  // Start a new session (API call)
  const startSession = useCallback(async () => {
    if (!session?.user.id) {
      console.error('Cannot start session - User not authenticated');
      return; // Only proceed if authenticated
    }
    
    try {
      console.log('Starting session with mode:', mode);
      const response = await fetch('/api/sessions/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode })
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Session started successfully:', data);
        setSessionId(data.id);
      } else {
        const errorText = await response.text();
        console.error(`Failed to start session: ${response.status} - ${errorText}`);
        alert(`Failed to start session: ${errorText}`);
      }
    } catch (error) {
      console.error('Error starting session:', error);
      alert('Error starting session. Check console for details.');
    }
  }, [mode, session?.user.id]);
  
  // Save current progress without ending session
  const saveProgress = useCallback(async () => {
    if (!session?.user.id) {
      console.error('Cannot save progress - User not authenticated');
      return;
    }
    
    try {
      // Calculate time spent in minutes
      const totalSeconds = TIMER_MODES[mode].duration;
      const timeSpent = Math.floor((totalSeconds - timeRemaining) / 60);
      
      if (timeSpent <= 0) return; // Don't save if no time spent
      
      console.log('Saving progress:', { mode, minutes: timeSpent });
      const response = await fetch('/api/sessions/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          minutes: timeSpent,
          sessionId
        })
      });
      
      if (!response.ok) {
        console.error('Failed to save progress:', await response.text());
      } else {
        console.log('Progress saved successfully');
        // Reset elapsed time counter after successful save
        setElapsedTime(0);
      }
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  }, [mode, sessionId, session?.user.id, timeRemaining, elapsedTime]);
  
  // End the current session (API call)
  const endSession = useCallback(async () => {
    if (!sessionId || !session?.user.id) return;
    
    try {
      // Calculate time spent in minutes
      const totalSeconds = TIMER_MODES[mode].duration;
      const timeSpent = Math.floor((totalSeconds - timeRemaining) / 60);
      
      if (timeSpent <= 0) return; // Don't save if no time spent
      
      const response = await fetch('/api/sessions/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          duration: timeSpent
        })
      });
      
      if (response.ok) {
        // Update completed sessions if this was a focus session
        if (mode === 'focus') {
          setCompletedSessions(prev => prev + 1);
        }
        
        // Reset session ID
        setSessionId(null);
      } else {
        console.error('Failed to end session:', await response.text());
      }
    } catch (error) {
      console.error('Error ending session:', error);
    }
  }, [mode, sessionId, session?.user.id, timeRemaining]);

  // Define other functions (with useCallback if they depend on state variables)
  // Create a new shared session
  const createSharedSession = useCallback(async (name: string) => {
    if (!session?.user.id) return;
    
    try {
      const response = await fetch('/api/shared-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          timerMode: mode,
          duration: TIMER_MODES[mode].duration
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setSharedSessionData(data);
        setIsSharedSession(true);
      } else {
        alert(await response.text());
      }
    } catch (error) {
      console.error('Error creating shared session:', error);
    }
  }, [mode, session?.user.id]);
  
  // Join an existing shared session
  const joinSharedSession = useCallback(async (inviteCode: string) => {
    if (!session?.user.id) return;
    
    try {
      const response = await fetch('/api/shared-sessions/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteCode })
      });
      
      if (response.ok) {
        const data = await response.json();
        setSharedSessionData(data);
        setIsSharedSession(true);
        
        // Update the timer mode if needed
        setMode(data.timerMode as TimerMode);
        setTimeRemaining(data.duration);
      } else {
        alert(await response.text());
      }
    } catch (error) {
      console.error('Error joining shared session:', error);
    }
  }, [session?.user.id]);
  
  // Leave a shared session
  const leaveSharedSession = useCallback(() => {
    if (sharedSessionData) {
      fetch(`/api/shared-sessions/${sharedSessionData.id}`, { method: 'DELETE' })
        .then(() => {
          setIsSharedSession(false);
          setSharedSessionData(null);
        })
        .catch(error => {
          console.error('Error leaving shared session:', error);
        });
    }
  }, [sharedSessionData]);
  
  // Start the timer
  const startTimer = useCallback(async () => {
    if (state === 'completed') {
      return;
    }
    
    // Start session tracking if not already started and this is a focus session
    if (!sessionId && mode === 'focus' && !isSharedSession) {
      await startSession();
    }
    
    setState('running');
  }, [state, sessionId, mode, isSharedSession, startSession]);
  
  // Pause the timer
  const pauseTimer = useCallback(() => {
    if (state === 'running') {
      setState('paused');
    }
  }, [state]);
  
  // Reset the timer
  const resetTimer = useCallback(async () => {
    // If we have a session ID, end it first
    if (sessionId) {
      await endSession();
    }
    
    // Update state based on current mode
    setTimeRemaining(TIMER_MODES[mode].duration);
    setState('idle');
    setElapsedTime(0);
  }, [mode, sessionId, endSession]);

  // Function to update a specific duration
  const updateDuration = useCallback((timerMode: TimerMode, minutes: number) => {
    // Ensure minutes is within reasonable bounds (1 to 60 minutes)
    const validMinutes = Math.max(1, Math.min(60, minutes));
    const seconds = validMinutes * 60;
    
    setDurations((prev: typeof DEFAULT_DURATIONS) => {
      const newDurations = { ...prev };
      newDurations[timerMode] = seconds;
      return newDurations;
    });
    
    // If we're currently in this mode, update the time remaining
    if (mode === timerMode && (state === 'idle' || state === 'completed')) {
      setTimeRemaining(seconds);
    }
  }, [mode, state]);
  
  // Now define effects that use these functions

  // Auto-transition between timer states
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    let transitionDelay: NodeJS.Timeout | null = null;
    let autoStartDelay: NodeJS.Timeout | null = null;
    
    if (state === 'running') {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          // When timer reaches zero
          if (prev <= 1) {
            setState('completed');
            
            // Play sound
            if (typeof window !== 'undefined') {
              const audio = new Audio('/notification.mp3');
              audio.play().catch(error => console.error('Failed to play notification sound:', error));
              
              // Show browser notification
              if ('Notification' in window && Notification.permission === 'granted') {
                new Notification(`${mode.charAt(0).toUpperCase() + mode.slice(1)} session complete!`, {
                  body: mode === 'focus' ? 'Take a break!' : 'Time to focus!',
                  icon: '/favicon.ico'
                });
              }
            }
            
            // If this was a focus session, save progress
            if (mode === 'focus' && !isSharedSession) {
              saveProgress();
            }
            
            // Auto-transition to next mode after delay
            transitionDelay = setTimeout(() => {
              if (mode === 'focus') {
                // After focus session, go to short break
                setMode('shortBreak');
                setTimeRemaining(TIMER_MODES.shortBreak.duration);
              } else if (mode === 'shortBreak' || mode === 'longBreak') {
                // After break, go back to focus
                setMode('focus');
                setTimeRemaining(TIMER_MODES.focus.duration);
                
                // Automatically start the next session after a break
                autoStartDelay = setTimeout(() => {
                  setState('running');
                  // Start a new session
                  if (!isSharedSession) {
                    startSession();
                  }
                }, 1500); // Give a short 1.5 second delay before starting
              }
            }, 3000); // Give user 3 seconds to see the completion message
            
            return 0;
          }
          return prev - 1;
        });
        
        // Increment elapsed time
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
      if (transitionDelay) clearTimeout(transitionDelay);
      if (autoStartDelay) clearTimeout(autoStartDelay);
    };
  }, [state, mode, isSharedSession, saveProgress, startSession]);
  
  // Auto-save progress every 5 minutes during focus mode
  useEffect(() => {
    // Only auto-save during focus sessions
    if (state !== 'running' || mode !== 'focus' || isSharedSession) {
      return;
    }
    
    // Create an interval to save progress every 5 minutes (300 seconds)
    const autoSaveInterval = setInterval(() => {
      // Only save if we've accumulated at least 1 minute of time
      if (elapsedTime >= 60) {
        console.log('Auto-saving study progress...');
        saveProgress();
      }
    }, 5 * 60 * 1000); // 5 minutes
    
    return () => clearInterval(autoSaveInterval);
  }, [state, mode, elapsedTime, isSharedSession]);
  
  // Save state to localStorage when it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stateToSave = {
        mode,
        state,
        sessionId,
        timeRemaining,
        completedSessions,
        progress,
        lastUpdateTime: Date.now(),
        elapsedTime
      };
      
      localStorage.setItem('timerState', JSON.stringify(stateToSave));
    }
  }, [mode, state, sessionId, timeRemaining, completedSessions, progress, elapsedTime]);
  
  // Update progress based on time remaining
  useEffect(() => {
    if (state === 'idle' || state === 'completed') {
      setProgress(100);
      return;
    }
    
    const totalTime = TIMER_MODES[mode].duration;
    const currentProgress = (timeRemaining / totalTime) * 100;
    setProgress(currentProgress);
  }, [timeRemaining, mode, state]);
  
  // Update TIMER_MODES when durations change
  useEffect(() => {
    TIMER_MODES.focus.duration = durations.focus;
    TIMER_MODES.shortBreak.duration = durations.shortBreak;
    TIMER_MODES.longBreak.duration = durations.longBreak;
    
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('timerDurations', JSON.stringify(durations));
    }
  }, [durations]);
  
  // Initialize from localStorage if available
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedState = localStorage.getItem('timerState');
        if (savedState) {
          const parsedState = JSON.parse(savedState);
          
          // Only restore state if it's not too old (1 day max)
          const now = Date.now();
          const lastUpdate = parsedState.lastUpdateTime || 0;
          const isRecent = (now - lastUpdate) < (24 * 60 * 60 * 1000); // 24 hours
          
          if (isRecent) {
            setMode(parsedState.mode || 'focus');
            setState(parsedState.state || 'idle');
            setSessionId(parsedState.sessionId || null);
            setCompletedSessions(parsedState.completedSessions || 0);
            setTimeRemaining(parsedState.timeRemaining || TIMER_MODES.focus.duration);
            setProgress(parsedState.progress || 100);
            setLastUpdateTime(parsedState.lastUpdateTime || null);
            setElapsedTime(parsedState.elapsedTime || 0);
          }
        }
      } catch (e) {
        console.error('Failed to restore timer state', e);
      }
    }
  }, []);
  
  const value = {
    mode,
    state,
    sessionId,
    timeRemaining,
    completedSessions,
    progress,
    isSharedSession,
    sharedSessionData,
    elapsedTime,
    durations,
    setMode,
    setState,
    setTimeRemaining,
    startTimer,
    pauseTimer,
    resetTimer,
    saveProgress,
    endSession,
    createSharedSession,
    joinSharedSession,
    leaveSharedSession,
    updateDuration,
  };
  
  return (
    <TimerContext.Provider value={value}>
      {children}
    </TimerContext.Provider>
  );
}

export function useTimer() {
  const context = useContext(TimerContext);
  if (context === undefined) {
    throw new Error('useTimer must be used within a TimerProvider');
  }
  return context;
} 