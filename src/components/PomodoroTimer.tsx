'use client';

import { useState, useEffect, Fragment } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { FiPlay, FiPause, FiRefreshCw, FiClock, FiCheckCircle, FiSave, FiUsers, FiLink, FiArrowRight, FiCheck, FiSettings, FiX } from 'react-icons/fi';
import Link from 'next/link';
import { useTimer, TIMER_MODES, TimerMode } from '@/context/TimerContext';
import type { Session } from 'next-auth';
import { Button } from '@/components/ui/button';

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

export default function PomodoroTimer() {
  // Use type assertion for the session
  const { data: session, status } = useSession() as { 
    data: ExtendedSession | null;
    status: "loading" | "authenticated" | "unauthenticated";
  };
  
  // Use the timer context
  const { 
    mode, 
    state, 
    setState, 
    timeRemaining, 
    progress, 
    startTimer, 
    pauseTimer, 
    resetTimer,
    saveProgress,
    sessionId,
    isSharedSession,
    setMode: switchMode,
    sharedSessionData,
    createSharedSession,
    joinSharedSession,
    leaveSharedSession,
    elapsedTime,
    completedSessions,
    durations,
    updateDuration
  } = useTimer();
  
  // UI state for shared sessions
  const [showCreateSession, setShowCreateSession] = useState(false);
  const [showJoinSession, setShowJoinSession] = useState(false);
  const [sessionName, setSessionName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  
  // Settings state
  const [showSettings, setShowSettings] = useState(false);
  const [focusDuration, setFocusDuration] = useState(() => Math.floor(durations.focus / 60));
  const [shortBreakDuration, setShortBreakDuration] = useState(() => Math.floor(durations.shortBreak / 60));
  const [longBreakDuration, setLongBreakDuration] = useState(() => Math.floor(durations.longBreak / 60));
  
  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Format elapsed time
  const formatElapsedTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };
  
  // Handle creating a shared session
  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionName.trim()) {
      alert('Please enter a session name');
      return;
    }
    
    try {
      await resetTimer();
      await createSharedSession(sessionName);
      setSessionName('');
      setShowCreateSession(false);
    } catch (error) {
      console.error('Failed to create shared session:', error);
    }
  };
  
  // Handle joining a shared session
  const handleJoinSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) {
      alert('Please enter an invite code');
      return;
    }
    
    try {
      await resetTimer();
      await joinSharedSession(inviteCode);
      setInviteCode('');
      setShowJoinSession(false);
    } catch (error) {
      console.error('Failed to join shared session:', error);
    }
  };
  
  // Handle leaving a shared session
  const handleLeaveSession = () => {
    if (window.confirm('Are you sure you want to leave this shared session?')) {
      leaveSharedSession();
    }
  };
  
  // Update durations when they change in the context
  useEffect(() => {
    setFocusDuration(Math.floor(durations.focus / 60));
    setShortBreakDuration(Math.floor(durations.shortBreak / 60));
    setLongBreakDuration(Math.floor(durations.longBreak / 60));
  }, [durations]);

  // Save timer settings
  const saveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateDuration('focus', focusDuration);
    updateDuration('shortBreak', shortBreakDuration);
    updateDuration('longBreak', longBreakDuration);
    setShowSettings(false);
  };
  
  // Render auth prompt for unauthenticated users
  if (status === 'unauthenticated') {
    return (
      <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold mb-2">Sign in to use the Pomodoro Timer</h3>
        <p className="mb-4">Track your study sessions and earn points for consistency.</p>
        <Button onClick={() => signIn()}>Sign In</Button>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center">
      {!session?.user ? (
        <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-2">Sign in to use the Pomodoro Timer</h3>
          <p className="mb-4">Track your study sessions and earn points for consistency.</p>
          <Button onClick={() => signIn()}>Sign In</Button>
        </div>
      ) : (
        <Fragment>
          <div className={`relative w-80 h-80 sm:w-96 sm:h-96 md:w-[400px] md:h-[400px] ${
            isSharedSession ? 'lg:w-[450px] lg:h-[450px]' : 'lg:w-[420px] lg:h-[420px]'
          }`}>
            {/* Progress Ring */}
            <svg className="w-full h-full" viewBox="0 0 100 100">
              <circle 
                className="text-gray-200 stroke-current" 
                strokeWidth="4"
                fill="transparent" 
                r="42" 
                cx="50" 
                cy="50" 
              />
              <circle 
                className={`${
                  mode === 'focus' ? 'text-purple-500' : 
                  mode === 'shortBreak' ? 'text-teal-500' : 'text-blue-500'
                } stroke-current transform -rotate-90 origin-center transition-all duration-1000 ease-linear`}
                strokeWidth="5"
                strokeDasharray={`${2 * Math.PI * 42}`} 
                strokeDashoffset={`${((100 - progress) / 100) * (2 * Math.PI * 42)}`}
                strokeLinecap="round"
                fill="transparent" 
                r="42" 
                cx="50" 
                cy="50" 
              />
            </svg>
            
            {/* Timer Display in center of ring */}
            <div className="absolute top-0 left-0 w-full h-full flex flex-col items-center justify-center">
              <div className="text-6xl font-mono font-bold tracking-wider text-gray-800">
                {formatTime(timeRemaining)}
              </div>
              <div className="text-lg text-gray-700 mt-2 font-medium">
                {TIMER_MODES[mode].label}
              </div>
              {state === 'running' && (
                <div className="text-sm text-purple-600 mt-2 animate-pulse flex items-center font-medium">
                  <FiClock className="inline mr-1" /> In progress...
                </div>
              )}
              {state === 'completed' && (
                <div className="text-sm text-green-600 mt-2 flex items-center font-medium">
                  <FiCheckCircle className="inline mr-1" /> Completed!
                </div>
              )}
              
              {/* Elapsed time display */}
              <div className="text-sm text-gray-700 mt-2">
                Elapsed: {formatElapsedTime(elapsedTime)}
              </div>
              
              {/* Shared session participants */}
              {isSharedSession && sharedSessionData?.participants && (
                <div className="text-sm text-purple-500 mt-2 flex items-center">
                  <FiUsers className="inline mr-1" /> 
                  {sharedSessionData.participants.length} participants
                </div>
              )}
              
              {/* Sessions completed counter */}
              <div className="text-sm text-gray-700 mt-2">
                {completedSessions} sessions completed today
              </div>
            </div>
          </div>
          
          {/* Timer Mode Tabs */}
          <div className="flex space-x-2 my-4">
            {Object.entries(TIMER_MODES).map(([key, { label }]) => (
              <button
                key={key}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  mode === key as TimerMode 
                    ? "bg-purple-600 text-white hover:bg-purple-700" 
                    : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
                }`}
                onClick={() => switchMode(key as TimerMode)}
              >
                {label}
              </button>
            ))}
          </div>
          
          {/* Timer Controls */}
          <div className="flex flex-wrap justify-center items-center gap-3 mt-2 mb-6">
            <button
              className="rounded-full h-12 w-12 flex items-center justify-center shadow-md bg-purple-600 text-white hover:bg-purple-700 transition-colors"
              onClick={state !== 'running' ? startTimer : pauseTimer}
              disabled={showSettings}
              aria-label={state !== 'running' ? "Start Timer" : "Pause Timer"}
            >
              {state !== 'running' ? <FiPlay className="h-5 w-5" /> : <FiPause className="h-5 w-5" />}
            </button>
            
            <button
              className="rounded-full h-12 w-12 flex items-center justify-center shadow-md bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
              onClick={() => {
                if (window.confirm('Are you sure you want to reset the timer? Any unsaved progress will be lost.')) {
                  resetTimer();
                }
              }}
              disabled={showSettings}
              aria-label="Reset Timer"
            >
              <FiRefreshCw className="h-5 w-5" />
            </button>
            
            {/* End Session Button */}
            {sessionId && !isSharedSession && (
              <button
                onClick={() => {
                  if (window.confirm('End this session and save your progress?')) {
                    saveProgress().then(() => resetTimer());
                  }
                }}
                disabled={showSettings}
                className="flex items-center gap-2 px-4 py-2 h-12 shadow-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              >
                <FiCheck className="h-5 w-5" />
                End Session
              </button>
            )}
            
            {(state === 'running' || state === 'paused') && !isSharedSession && (
              <button
                onClick={saveProgress}
                disabled={showSettings}
                className="flex items-center gap-2 px-4 py-2 h-12 shadow-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              >
                <FiSave className="h-5 w-5" />
                Save Progress
              </button>
            )}

            <button
              className="rounded-full h-12 w-12 flex items-center justify-center shadow-md bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
              onClick={() => setShowSettings(!showSettings)}
              aria-label="Timer Settings"
            >
              <FiSettings className="h-4 w-4" />
            </button>
          </div>
          
          {/* Session counter */}
          <div className="mt-2 text-center text-gray-400">
            <span className="font-medium text-purple-400">{completedSessions}</span> sessions completed today
          </div>
          
          {/* Shared Sessions Controls */}
          <div className="mt-6 pt-4 border-t border-gray-700">
            {isSharedSession ? (
              <div className="flex flex-col gap-2">
                <div className="text-sm text-gray-300 mb-2">
                  <strong>Invite Code:</strong> {sharedSessionData?.inviteCode}
                </div>
                
                <button
                  className="rounded-full h-12 w-12 flex items-center justify-center shadow-md bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
                  onClick={() => {
                    navigator.clipboard.writeText(sharedSessionData?.inviteCode || '');
                    alert(`Invite code copied: ${sharedSessionData?.inviteCode}`);
                  }}
                  aria-label="Copy Invite Code"
                >
                  <FiLink className="h-4 w-4" />
                </button>
                
                <button
                  className="rounded-full h-12 w-12 flex items-center justify-center shadow-md bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
                  onClick={handleLeaveSession}
                  aria-label="Leave Session"
                >
                  <FiX className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {/* Create Session Form */}
                {showCreateSession ? (
                  <form onSubmit={handleCreateSession} className="flex flex-col gap-2">
                    <input
                      type="text"
                      placeholder="Session Name"
                      value={sessionName}
                      onChange={e => setSessionName(e.target.value)}
                      className="px-3 py-2 bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="flex-1 bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-md transition-colors"
                      >
                        Create
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowCreateSession(false)}
                        className="flex-1 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-md transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : showJoinSession ? (
                  <form onSubmit={handleJoinSession} className="flex flex-col gap-2">
                    <input
                      type="text"
                      placeholder="Invite Code"
                      value={inviteCode}
                      onChange={e => setInviteCode(e.target.value)}
                      className="px-3 py-2 bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="flex-1 bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-md transition-colors"
                      >
                        Join
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowJoinSession(false)}
                        className="flex-1 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-md transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowCreateSession(true)}
                      className="flex-1 flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md transition-colors shadow-md"
                    >
                      <FiUsers className="h-5 w-5" /> Create Shared Session
                    </button>
                    <button
                      onClick={() => setShowJoinSession(true)}
                      className="flex-1 flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-md transition-colors shadow-md"
                    >
                      <FiArrowRight className="h-5 w-5" /> Join Session
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Settings Modal */}
          {showSettings && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full">
                <h3 className="text-xl font-semibold text-purple-400 mb-4">Timer Settings</h3>
                
                <form onSubmit={saveSettings} className="space-y-4">
                  <div>
                    <label className="block text-gray-300 mb-1">Focus Duration (minutes)</label>
                    <input 
                      type="number" 
                      min="1" 
                      max="60" 
                      value={focusDuration}
                      onChange={e => setFocusDuration(parseInt(e.target.value) || 25)}
                      className="w-full px-3 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      title="Focus Duration in minutes"
                      aria-label="Focus Duration in minutes"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-300 mb-1">Short Break Duration (minutes)</label>
                    <input 
                      type="number" 
                      min="1" 
                      max="30" 
                      value={shortBreakDuration}
                      onChange={e => setShortBreakDuration(parseInt(e.target.value) || 5)}
                      className="w-full px-3 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      title="Short Break Duration in minutes"
                      aria-label="Short Break Duration in minutes"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-300 mb-1">Long Break Duration (minutes)</label>
                    <input 
                      type="number" 
                      min="1" 
                      max="60" 
                      value={longBreakDuration}
                      onChange={e => setLongBreakDuration(parseInt(e.target.value) || 15)}
                      className="w-full px-3 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      title="Long Break Duration in minutes"
                      aria-label="Long Break Duration in minutes"
                    />
                  </div>
                  
                  <div className="flex gap-3 pt-2">
                    <button 
                      type="submit"
                      className="flex-1 bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-md transition-colors"
                    >
                      Save Settings
                    </button>
                    
                    <button 
                      type="button"
                      onClick={() => setShowSettings(false)}
                      className="flex-1 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-md transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </Fragment>
      )}
    </div>
  );
} 