import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Player } from '../../services/db';
import { TrapCard, getNonRepeatingTrapCard } from './data/trapWords';
import { WordTrapConfig } from './WordTrapSettings';
import { sound } from '../../services/soundboard';
import { haptics } from '../../services/haptics';
import { AlertTriangle, Check, ArrowRight, Ban, Play, Pause, Sparkles } from 'lucide-react';

interface WordTrapPlayProps {
  sessionId: string;
  player: Player;
  config: WordTrapConfig;
  turnNumber: number;
  totalTurns: number;
  onTurnComplete: (earnedPoints: number, guessedWords: string[], trapsHit: number) => void;
}

type TurnState = 'handoff' | 'countdown' | 'playing' | 'turn_summary';

export const WordTrapPlay: React.FC<WordTrapPlayProps> = ({
  sessionId,
  player,
  config,
  turnNumber,
  totalTurns,
  onTurnComplete,
}) => {
  const [turnState, setTurnState] = useState<TurnState>('handoff');
  const [countdown, setCountdown] = useState<number>(3);
  const [secondsLeft, setSecondsLeft] = useState<number>(config.turnSeconds);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  // Deck of non-repeating cards
  const [currentCard, setCurrentCard] = useState<TrapCard>(() => getNonRepeatingTrapCard(sessionId));

  const [guessedWords, setGuessedWords] = useState<string[]>([]);
  const [trapsHitCount, setTrapsHitCount] = useState<number>(0);
  const [flashFeedback, setFlashFeedback] = useState<'correct' | 'trap' | null>(null);

  const nextCard = useCallback(() => {
    setCurrentCard(getNonRepeatingTrapCard(sessionId));
  }, [sessionId]);

  // Handle Correct Guess
  const handleCorrect = () => {
    sound.playSuccess();
    haptics.success();
    setFlashFeedback('correct');
    setGuessedWords(prev => [...prev, currentCard.word]);

    setTimeout(() => {
      setFlashFeedback(null);
      nextCard();
    }, 400);
  };

  // Handle Trap Buzzer Hit (-1 pt)
  const handleTrapBuzzer = () => {
    sound.playBuzzer();
    haptics.heavy();
    setFlashFeedback('trap');
    setTrapsHitCount(c => c + 1);

    setTimeout(() => {
      setFlashFeedback(null);
      nextCard();
    }, 450);
  };

  // Handle Skip
  const handleSkip = () => {
    sound.playPass();
    haptics.light();
    nextCard();
  };

  // Handoff -> Start 3-2-1
  const handleStartTurn = () => {
    sound.playPop();
    setCountdown(3);
    setTurnState('countdown');
  };

  // 3-2-1 Countdown
  useEffect(() => {
    if (turnState !== 'countdown') return;

    if (countdown > 0) {
      sound.playTick(true);
      const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setSecondsLeft(config.turnSeconds);
      setGuessedWords([]);
      setTrapsHitCount(0);
      sound.playSuccess();
      setTurnState('playing');
    }
  }, [turnState, countdown, config.turnSeconds]);

  // Main In-Game Timer
  useEffect(() => {
    if (turnState !== 'playing' || isPaused) return;

    const interval = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
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

    return () => clearInterval(interval);
  }, [turnState, isPaused]);

  // Calculate Net Points for this turn
  const netPoints = Math.max(
    0,
    guessedWords.length * config.pointPerWord - trapsHitCount * config.trapPenalty
  );

  // 1. HANDOFF SCREEN
  if (turnState === 'handoff') {
    return (
      <div className="w-full max-w-sm mx-auto neo-card-lg p-6 text-center space-y-6 bg-[#FECDD3] select-none my-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border-2 border-black text-xs font-black uppercase text-red-950">
          <Sparkles className="w-3.5 h-3.5 text-red-600" /> Turn {turnNumber} of {totalTurns}
        </div>

        <div className="space-y-1">
          <div className="text-xs font-black uppercase tracking-wider text-gray-700">Clue Giver:</div>
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl border-3 border-black bg-white shadow-[4px_4px_0px_#000] my-2">
            <span className="text-3xl">{player.avatarEmoji}</span>
            <span className="text-2xl font-black">{player.name}</span>
          </div>
        </div>

        <div className="p-3 bg-white/80 rounded-xl border-2 border-black text-left text-xs font-bold text-gray-800 space-y-1.5">
          <div className="flex items-center gap-1.5 font-black text-red-950">
            <AlertTriangle className="w-4 h-4 text-red-600" /> How Word Trap Works:
          </div>
          <div>1. Describe the secret word <b>without saying any of the {config.trapCount || 5} silence words</b>.</div>
          <div>2. If you slip up and say a forbidden word, tap the <b>Trap Buzzer 🚨</b>!</div>
          <div>3. When your friends shout the correct word, tap <b>Guessed! 🎉</b>!</div>
        </div>

        <button
          onClick={handleStartTurn}
          className="w-full neo-btn py-4 bg-[#FEF08A] hover:bg-[#FDE047] text-lg font-black text-[#18181B]"
        >
          I’m Ready! Start Word Trap 🎯
        </button>
      </div>
    );
  }

  // 2. 3-2-1 COUNTDOWN SCREEN
  if (turnState === 'countdown') {
    return (
      <div className="w-full max-w-sm mx-auto neo-card-lg p-8 text-center space-y-4 bg-[#FECDD3] select-none my-auto">
        <div className="text-sm font-black uppercase tracking-wider text-red-950">
          Get Ready to Give Clues!
        </div>
        <div className="text-8xl font-black my-4 font-mono animate-bounce text-[#18181B]">
          {countdown > 0 ? countdown : 'GO!'}
        </div>
        <p className="text-xs font-bold text-red-900">Watch out for the forbidden traps!</p>
      </div>
    );
  }

  // 3. PLAYING SCREEN
  if (turnState === 'playing') {
    const isFlashingCorrect = flashFeedback === 'correct';
    const isFlashingTrap = flashFeedback === 'trap';
    const activeTraps = currentCard.traps.slice(0, config.trapCount || 5);

    return (
      <div
        className={`w-full max-w-sm mx-auto space-y-3.5 select-none pb-8 transition-colors ${
          isFlashingCorrect
            ? 'animate-pop'
            : isFlashingTrap
            ? 'animate-shake'
            : ''
        }`}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between">
          <div className="neo-badge bg-white text-xs font-black">
            {player.avatarEmoji} {player.name} • {guessedWords.length} pts
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                sound.playPop();
                setIsPaused(p => !p);
              }}
              className="neo-btn neo-btn-sm py-1 px-2.5 bg-white text-xs font-black flex items-center gap-1"
            >
              {isPaused ? <Play className="w-3.5 h-3.5 fill-black" /> : <Pause className="w-3.5 h-3.5 fill-black" />}
            </button>

            <div
              className={`px-3 py-1 rounded-xl border-2 border-black font-mono font-black text-sm tabular-nums ${
                secondsLeft <= 10 ? 'bg-red-500 text-white animate-pulse' : 'bg-[#FEF08A] text-black'
              }`}
            >
              ⏱️ {secondsLeft}s
            </div>
          </div>
        </div>

        {/* Card Display */}
        <div className="neo-card-lg p-5 bg-white border-4 border-black space-y-3 text-center shadow-[5px_5px_0px_#000]">
          {/* Target Word */}
          <div className="space-y-0.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-500">
              Secret Word to Describe
            </span>
            <div className="text-4xl font-black text-[#18181B] tracking-tight">
              {currentCard.word}
            </div>
          </div>

          {/* Forbidden Traps */}
          <div className="p-3.5 rounded-2xl border-3 border-black bg-[#FEE2E2] space-y-2">
            <div className="text-[11px] font-black uppercase tracking-wider text-red-700 flex items-center justify-center gap-1">
              <Ban className="w-3.5 h-3.5 text-red-600" />
              Forbidden Silence Words ({activeTraps.length})
            </div>
            <div className="flex flex-wrap justify-center gap-1.5">
              {activeTraps.map((trap, idx) => (
                <div
                  key={idx}
                  className="py-1.5 px-3 rounded-xl border-2 border-black bg-white text-xs font-black text-red-950 shadow-[1px_1px_0px_#000]"
                >
                  {trap}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-1">
          {/* Guessed Button */}
          <button
            onClick={handleCorrect}
            disabled={isPaused}
            className="w-full neo-btn py-4 bg-[#A7F3D0] hover:bg-[#86EFAC] text-lg font-black text-[#18181B] border-3 border-black shadow-[4px_4px_0px_#000] active:translate-x-1 active:translate-y-1 flex items-center justify-center gap-2"
          >
            <Check className="w-6 h-6 stroke-[3]" />
            Guessed Correctly! (+1)
          </button>

          {/* Big Red Trap Buzzer (Anyone can hit this!) */}
          <button
            onClick={handleTrapBuzzer}
            disabled={isPaused}
            className="w-full neo-btn py-4 bg-[#FECDD3] hover:bg-[#FDA4AF] text-lg font-black text-red-950 border-3 border-black shadow-[4px_4px_0px_#000] active:translate-x-1 active:translate-y-1 flex items-center justify-center gap-2"
          >
            <Ban className="w-6 h-6 text-red-600 stroke-[3]" />
            TRAP BUZZER! (Said a Trap Word)
          </button>

          {/* Skip Button */}
          <button
            onClick={handleSkip}
            disabled={isPaused}
            className="w-full neo-btn py-2.5 bg-gray-100 hover:bg-gray-200 text-xs font-black text-gray-700 border-2 border-black"
          >
            ⏩ Skip Word (0 pts)
          </button>
        </div>
      </div>
    );
  }

  // 4. TURN SUMMARY
  return (
    <div className="w-full max-w-sm mx-auto neo-card-lg p-6 text-center space-y-5 bg-white select-none my-auto">
      <div className="text-4xl animate-bounce">⏱️</div>
      <div className="space-y-1">
        <div className="text-xs font-black uppercase tracking-wider text-gray-500">Time's Up!</div>
        <h2 className="text-2xl font-black text-[#18181B]">{player.name}'s Round</h2>
        <div className="text-5xl font-black text-emerald-600 font-mono my-2">
          +{netPoints} pts
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs font-black">
        <div className="p-2.5 rounded-xl border-2 border-black bg-emerald-50 text-emerald-900">
          ✓ {guessedWords.length} Guessed
        </div>
        <div className="p-2.5 rounded-xl border-2 border-black bg-red-50 text-red-900">
          🚨 {trapsHitCount} Traps Hit
        </div>
      </div>

      <button
        onClick={() => {
          sound.playPop();
          haptics.medium();
          onTurnComplete(netPoints, guessedWords, trapsHitCount);
        }}
        className="w-full neo-btn py-4 bg-[#FEF08A] hover:bg-[#FDE047] text-lg font-black text-[#18181B]"
      >
        {turnNumber < totalTurns ? 'Pass to Next Player ➡️' : 'Complete Game & Standings 🏆'}
      </button>
    </div>
  );
};
