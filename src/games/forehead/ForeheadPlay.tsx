import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Player } from '../../services/db';
import { getNonRepeatingWordFromDeck } from './data/charadesWords';
import { useDeviceTilt, TiltAction } from './useDeviceTilt';
import { sound } from '../../services/soundboard';
import { haptics } from '../../services/haptics';
import confetti from 'canvas-confetti';
import { RotateCw, Check, ArrowRight, Smartphone, Sparkles, Volume2 } from 'lucide-react';

interface ForeheadPlayProps {
  sessionId: string;
  player: Player;
  roundSeconds: number;
  selectedDecks: string[];
  turnNumber: number;
  totalTurns: number;
  onTurnComplete: (earnedPoints: number, guessedWords: string[]) => void;
}

type TurnState = 'handoff' | 'rotate_device' | 'countdown' | 'playing' | 'turn_summary';

export const ForeheadPlay: React.FC<ForeheadPlayProps> = ({
  sessionId,
  player,
  roundSeconds,
  selectedDecks,
  turnNumber,
  totalTurns,
  onTurnComplete,
}) => {
  const [turnState, setTurnState] = useState<TurnState>('handoff');
  const [countdown, setCountdown] = useState<number>(3);
  const [secondsLeft, setSecondsLeft] = useState<number>(roundSeconds);
  const [currentWord, setCurrentWord] = useState<string>('');
  const [guessedWords, setGuessedWords] = useState<string[]>([]);
  const [flashFeedback, setFlashFeedback] = useState<'correct' | 'pass' | null>(null);

  // Check if currently in landscape
  const checkIsLandscape = useCallback(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth > window.innerHeight;
  }, []);

  // Pick next unique non-repeating word from session deck
  const nextWord = useCallback(() => {
    const word = getNonRepeatingWordFromDeck(sessionId, selectedDecks);
    setCurrentWord(word);
  }, [sessionId, selectedDecks]);

  // Handle Correct Guess
  const handleCorrect = useCallback(() => {
    sound.playSuccess();
    haptics.success();
    setFlashFeedback('correct');
    setGuessedWords(prev => [...prev, currentWord]);

    setTimeout(() => {
      setFlashFeedback(null);
      nextWord();
    }, 450);
  }, [currentWord, nextWord]);

  // Handle Skip / Pass
  const handlePass = useCallback(() => {
    sound.playPass();
    haptics.warning();
    setFlashFeedback('pass');

    setTimeout(() => {
      setFlashFeedback(null);
      nextWord();
    }, 450);
  }, [nextWord]);

  // Tilt Sensor Hook
  const { requestSensorPermission } = useDeviceTilt({
    onCorrect: handleCorrect,
    onPass: handlePass,
    enabled: turnState === 'playing' && flashFeedback === null,
  });

  // Handoff -> Check Landscape or prompt rotation
  const handleStartTurn = async () => {
    sound.playPop();
    haptics.light();
    await requestSensorPermission();
    if (checkIsLandscape()) {
      setCountdown(3);
      setTurnState('countdown');
    } else {
      setTurnState('rotate_device');
    }
  };

  // Monitor orientation while waiting in 'rotate_device' state
  useEffect(() => {
    if (turnState !== 'rotate_device') return;

    const handleResize = () => {
      if (checkIsLandscape()) {
        sound.playPop();
        haptics.medium();
        setCountdown(3);
        setTurnState('countdown');
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [turnState, checkIsLandscape]);

  // 3-2-1 Countdown before action begins
  useEffect(() => {
    if (turnState !== 'countdown') return;

    if (countdown > 0) {
      sound.playTick(true);
      const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      // Start playing
      nextWord();
      setSecondsLeft(roundSeconds);
      setGuessedWords([]);
      sound.playSuccess();
      setTurnState('playing');
    }
  }, [turnState, countdown, nextWord, roundSeconds]);

  // In-Game Countdown Timer
  useEffect(() => {
    if (turnState !== 'playing') return;

    const timer = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          sound.playBuzzer();
          haptics.heavy();
          setTurnState('turn_summary');
          return 0;
        }

        if (prev <= 5) {
          sound.playTick(true);
          haptics.light();
        } else if (prev % 10 === 0) {
          sound.playTick(false);
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [turnState]);

  // 1. HANDOFF CURTAIN SCREEN
  if (turnState === 'handoff') {
    return (
      <div className="w-full max-w-sm mx-auto neo-card-lg p-6 text-center space-y-6 bg-[#FEF08A] select-none my-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border-2 border-black text-xs font-black uppercase">
          <Sparkles className="w-3.5 h-3.5 text-yellow-600" /> Turn {turnNumber} of {totalTurns}
        </div>

        <div className="space-y-1">
          <div className="text-xs font-black uppercase tracking-wider text-gray-700">Hand phone to:</div>
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl border-3 border-black bg-white shadow-[4px_4px_0px_#000] my-2">
            <span className="text-3xl">{player.avatarEmoji}</span>
            <span className="text-2xl font-black">{player.name}</span>
          </div>
        </div>

        <div className="p-3 bg-white/70 rounded-xl border-2 border-black text-left text-xs font-bold text-gray-800 space-y-1.5">
          <div className="flex items-center gap-1.5 font-black text-black">
            <Smartphone className="w-4 h-4 text-blue-600" /> How to Play:
          </div>
          <div>1. Hold phone horizontally against forehead facing your friends.</div>
          <div>2. Friends act out or describe the word without saying it!</div>
          <div>3. <b>Tilt Back (Up)</b> = Correct (+1 pt)</div>
          <div>4. <b>Tilt Forward (Down)</b> = Skip / Pass (0 pts)</div>
        </div>

        <button
          onClick={handleStartTurn}
          className="w-full neo-btn py-4 bg-[#A7F3D0] hover:bg-[#86EFAC] text-lg font-black text-[#18181B]"
        >
          I’m Ready! Place on Forehead 🎯
        </button>
      </div>
    );
  }

  // 1.5 ROTATE DEVICE TO HORIZONTAL / LANDSCAPE SCREEN
  if (turnState === 'rotate_device') {
    return (
      <div className="w-full max-w-sm mx-auto neo-card-lg p-6 text-center space-y-5 bg-[#C4B5FD] select-none my-auto animate-pop">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-white border-3 border-black flex items-center justify-center shadow-[4px_4px_0px_#000] animate-bounce">
          <RotateCw className="w-10 h-10 text-purple-600 animate-spin" style={{ animationDuration: '3s' }} />
        </div>

        <div className="space-y-2">
          <div className="text-xs font-black uppercase tracking-wider text-purple-900">Step 2: Orientation</div>
          <h2 className="text-2xl font-black text-[#18181B] leading-snug">
            Turn Phone to Horizontal (Landscape) 🔄
          </h2>
          <p className="text-xs font-bold text-purple-950 px-2 leading-relaxed">
            Forehead Pop works in horizontal mode so your friends can clearly read the word while you hold it to your forehead.
          </p>
        </div>

        <div className="p-3 bg-white/80 rounded-xl border-2 border-black text-xs font-black text-gray-800">
          Turn your phone sideways now! The game will automatically begin once rotated.
        </div>

        <button
          onClick={() => {
            sound.playPop();
            setCountdown(3);
            setTurnState('countdown');
          }}
          className="w-full neo-btn py-3.5 bg-white hover:bg-gray-100 text-sm font-black text-[#18181B]"
        >
          Already Sideways? Tap to Start 🚀
        </button>
      </div>
    );
  }

  // 2. COUNTDOWN SCREEN
  if (turnState === 'countdown') {
    return (
      <div className="w-full max-w-md mx-auto neo-card-lg p-8 text-center space-y-4 bg-[#BAE6FD] select-none my-auto">
        <div className="text-xs font-black uppercase tracking-wider text-blue-900">
          Place Phone on Forehead Facing Friends!
        </div>
        <div className="text-8xl font-black my-4 font-mono animate-bounce text-[#18181B]">
          {countdown > 0 ? countdown : 'GO!'}
        </div>
        <p className="text-xs font-bold text-gray-700">Friends, get ready to act or describe!</p>
      </div>
    );
  }

  // 3. PLAYING SCREEN (Landscape optimized)
  if (turnState === 'playing') {
    const isFlashingCorrect = flashFeedback === 'correct';
    const isFlashingPass = flashFeedback === 'pass';

    return (
      <div
        className={`fixed inset-0 z-50 flex flex-col justify-between p-4 transition-colors select-none ${
          isFlashingCorrect
            ? 'bg-[#86EFAC]'
            : isFlashingPass
            ? 'bg-[#FEF08A]'
            : 'bg-[#FFFDF7]'
        }`}
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between z-10">
          <div className="neo-badge bg-white text-xs font-black">
            {player.name}'s Turn • {guessedWords.length} pts
          </div>
          <div
            className={`px-4 py-1.5 rounded-full border-2 border-black font-mono font-black text-base shadow-[2px_2px_0px_#000] ${
              secondsLeft <= 5 ? 'bg-red-500 text-white animate-pulse' : 'bg-white text-black'
            }`}
          >
            ⏱️ {secondsLeft}s
          </div>
        </div>

        {/* Center: The Active Word (sized for wide landscape viewing) */}
        <div className="flex-1 flex flex-col items-center justify-center text-center px-4 my-auto relative z-10 pointer-events-none">
          {isFlashingCorrect ? (
            <div className="space-y-2 animate-pop">
              <div className="text-5xl sm:text-6xl md:text-7xl font-black text-emerald-950">CORRECT! 🎉</div>
              <div className="text-xl font-bold text-emerald-800">+1 Point</div>
            </div>
          ) : isFlashingPass ? (
            <div className="space-y-2 animate-pop">
              <div className="text-5xl sm:text-6xl md:text-7xl font-black text-amber-950">PASSED ⏩</div>
              <div className="text-xl font-bold text-amber-800">Next Word...</div>
            </div>
          ) : (
            <div className="space-y-3 max-w-4xl w-full">
              <div className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-wide text-[#18181B] leading-none uppercase break-words px-2">
                {currentWord}
              </div>
              <div className="inline-block px-4 py-1.5 rounded-full border-2 border-black bg-white text-xs sm:text-sm font-black text-gray-700 shadow-[2px_2px_0px_#000]">
                Tilt Back / Up: Correct 🟢 • Tilt Down: Pass 🟡
              </div>
            </div>
          )}
        </div>

        {/* Manual Tap Fallback Zones (Left = Pass, Right = Correct) for Accessibility & Testing */}
        <div className="absolute inset-0 flex z-0 pointer-events-auto">
          <div
            onClick={handlePass}
            className="w-1/4 h-full cursor-pointer hover:bg-black/5 active:bg-black/10 transition-colors flex items-end p-4"
            title="Tap left to Pass"
          >
            <span className="text-[10px] font-black uppercase text-gray-400 bg-white/70 px-2 py-1 rounded border border-black/20">
              Tap: Pass
            </span>
          </div>
          <div className="w-2/4 h-full" />
          <div
            onClick={handleCorrect}
            className="w-1/4 h-full cursor-pointer hover:bg-black/5 active:bg-black/10 transition-colors flex items-end justify-end p-4"
            title="Tap right for Correct"
          >
            <span className="text-[10px] font-black uppercase text-gray-400 bg-white/70 px-2 py-1 rounded border border-black/20">
              Tap: Correct
            </span>
          </div>
        </div>

        {/* Bottom subtle indicator */}
        <div className="text-center pb-1 z-10 pointer-events-none">
          <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">
            Tilt phone back to score • Tilt down to pass
          </span>
        </div>
      </div>
    );
  }

  // 4. TURN SUMMARY SCREEN
  return (
    <div className="w-full max-w-sm mx-auto neo-card-lg p-6 text-center space-y-5 bg-white select-none my-auto">
      <div className="text-4xl">⏱️</div>
      <div className="space-y-1">
        <div className="text-xs font-black uppercase tracking-wider text-gray-500">Time's Up!</div>
        <h2 className="text-2xl font-black text-[#18181B]">{player.name} scored</h2>
        <div className="text-5xl font-black text-emerald-600 font-mono my-2">
          +{guessedWords.length} pts
        </div>
      </div>

      {/* Words Guessed List */}
      <div className="neo-card p-3 bg-gray-50 max-h-40 overflow-y-auto text-left space-y-1">
        <div className="text-[11px] font-black uppercase text-gray-500 mb-1">
          Guessed ({guessedWords.length}):
        </div>
        {guessedWords.length > 0 ? (
          guessedWords.map((w, i) => (
            <div key={i} className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
              <span className="text-emerald-600 font-black">✓</span> {w}
            </div>
          ))
        ) : (
          <div className="text-xs text-gray-500 italic">No words guessed this turn</div>
        )}
      </div>

      <button
        onClick={() => {
          sound.playPop();
          haptics.medium();
          onTurnComplete(guessedWords.length, guessedWords);
        }}
        className="w-full neo-btn py-4 bg-[#FEF08A] hover:bg-[#FDE047] text-lg font-black text-[#18181B]"
      >
        {turnNumber < totalTurns ? 'Pass to Next Player ➡️' : 'Complete Game & Standings 🏆'}
      </button>
    </div>
  );
};
