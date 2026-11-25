import React, { useState, useEffect } from 'react';
import { Player } from '../../services/db';
import { sound } from '../../services/soundboard';
import { haptics } from '../../services/haptics';
import { Play, Pause, RotateCcw, Plus, Vote, Sparkles } from 'lucide-react';

interface DiscussionTimerProps {
  initialSeconds: number;
  players: Player[];
  startingPlayer: Player;
  onProceedToVote: () => void;
}

export const DiscussionTimer: React.FC<DiscussionTimerProps> = ({
  initialSeconds,
  players,
  startingPlayer,
  onProceedToVote,
}) => {
  const [secondsLeft, setSecondsLeft] = useState<number>(initialSeconds);
  const [isRunning, setIsRunning] = useState<boolean>(true);

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          sound.playBuzzer();
          haptics.heavy();
          return 0;
        }

        // Ticking audio in final 10s
        if (prev <= 10) {
          sound.playTick(true);
          haptics.light();
        } else if (prev % 15 === 0) {
          sound.playTick(false);
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning]);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins}:${remainder.toString().padStart(2, '0')}`;
  };

  const toggleRun = () => {
    sound.playPop();
    setIsRunning(!isRunning);
  };

  const addTime = (extra: number) => {
    sound.playPop();
    setSecondsLeft(s => s + extra);
  };

  const resetTimer = () => {
    sound.playPop();
    setSecondsLeft(initialSeconds);
    setIsRunning(false);
  };

  const isLowTime = secondsLeft <= 15 && secondsLeft > 0;

  return (
    <div className="w-full max-w-sm mx-auto space-y-6 text-center select-none">
      {/* Starting Speaker Banner */}
      <div className="neo-card p-4 bg-gradient-to-r from-amber-50 to-yellow-100 space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border-2 border-black text-xs font-black uppercase text-amber-800">
          <Sparkles className="w-3.5 h-3.5 text-amber-600" /> First Clue
        </div>
        <div className="text-xl font-extrabold text-[#18181B] flex items-center justify-center gap-2">
          <span>{startingPlayer.avatarEmoji}</span>
          <span>{startingPlayer.name} speaks first!</span>
        </div>
        <p className="text-xs font-semibold text-gray-600">
          Say one word or short sentence about your word. Go in circle!
        </p>
      </div>

      {/* Chunky Countdown Clock */}
      <div
        className={`neo-card-lg p-8 transition-colors ${
          secondsLeft === 0
            ? 'bg-[#FECDD3] border-red-600'
            : isLowTime
            ? 'bg-orange-100 animate-pulse-slow'
            : 'bg-[#BAE6FD]'
        }`}
      >
        <div className="text-xs font-black uppercase tracking-widest text-gray-700">Discussion Timer</div>
        <div className="text-6xl font-black tracking-tight my-2 text-[#18181B] font-mono">
          {formatTime(secondsLeft)}
        </div>
        <div className="text-xs font-bold text-gray-600">
          {secondsLeft === 0 ? 'Time is up! Question suspects.' : isRunning ? 'Debating who the imposter is...' : 'Timer Paused'}
        </div>
      </div>

      {/* Timer Controls */}
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={toggleRun}
          className={`neo-btn py-3 px-6 text-base font-black ${
            isRunning ? 'bg-[#FED7AA]' : 'bg-[#A7F3D0]'
          }`}
        >
          {isRunning ? (
            <>
              <Pause className="w-5 h-5 mr-1.5" /> Pause
            </>
          ) : (
            <>
              <Play className="w-5 h-5 mr-1.5" /> Resume
            </>
          )}
        </button>

        <button
          onClick={() => addTime(30)}
          className="neo-btn neo-btn-sm py-3 px-4 bg-white text-xs font-bold"
          title="Add 30 seconds"
        >
          <Plus className="w-4 h-4 mr-1" /> +30s
        </button>

        <button
          onClick={resetTimer}
          className="neo-btn neo-btn-sm py-3 px-3 bg-white text-xs font-bold"
          title="Reset timer"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Proceed to Vote Action */}
      <div className="pt-4">
        <button
          onClick={() => {
            sound.playPop();
            haptics.medium();
            onProceedToVote();
          }}
          className="w-full neo-btn py-4 bg-[#FECDD3] hover:bg-[#FDA4AF] text-lg font-black text-[#18181B] flex items-center justify-center gap-2"
        >
          <Vote className="w-6 h-6" /> Continue to Secret Vote →
        </button>
      </div>
    </div>
  );
};
