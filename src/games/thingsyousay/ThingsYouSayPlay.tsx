import React, { useState, useEffect } from 'react';
import { Player } from '../../services/db';
import { getNonRepeatingPromptByMode } from './data/prompts';
import { ThingsYouSayConfig } from './ThingsYouSaySettings';
import { sound } from '../../services/soundboard';
import { haptics } from '../../services/haptics';
import { Play, Plus, Minus, Check, ArrowRight, MessageSquare, Sparkles, RefreshCw } from 'lucide-react';

interface ThingsYouSayPlayProps {
  sessionId?: string;
  player: Player;
  config: ThingsYouSayConfig;
  turnNumber: number;
  totalTurns: number;
  onTurnComplete: (earnedPoints: number, promptUsed: string) => void;
}

type TurnState = 'read_and_ready' | 'counting_down' | 'group_scoring';

export const ThingsYouSayPlay: React.FC<ThingsYouSayPlayProps> = ({
  sessionId = 'global',
  player,
  config,
  turnNumber,
  totalTurns,
  onTurnComplete,
}) => {
  const [turnState, setTurnState] = useState<TurnState>('read_and_ready');
  const [prompt, setPrompt] = useState<string>(() => getNonRepeatingPromptByMode(sessionId, config.mode));
  const [timeLeft, setTimeLeft] = useState<number>(config.timerSeconds);
  const [pointsToAward, setPointsToAward] = useState<number>(2);

  // 10s Blitz Timer Effect
  useEffect(() => {
    if (turnState !== 'counting_down') return;

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          sound.playBuzzer();
          haptics.heavy();
          setTurnState('group_scoring');
          return 0;
        }

        if (prev <= 4) {
          sound.playTick(true);
          haptics.light();
        } else {
          sound.playTick(false);
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [turnState]);

  const handleStartTimer = () => {
    sound.playSwipe();
    haptics.medium();
    setTimeLeft(config.timerSeconds);
    setTurnState('counting_down');
  };

  const handleConfirmPoints = () => {
    sound.playPop();
    haptics.success();
    onTurnComplete(pointsToAward, prompt);
  };

  // STEP 1: READ SITUATION & PREPARE (Timer DOES NOT start automatically!)
  if (turnState === 'read_and_ready') {
    return (
      <div className="w-full max-w-sm mx-auto neo-card-lg p-6 text-center space-y-6 bg-[#FEF08A] select-none my-auto">
        {/* Turn Header */}
        <div className="flex items-center justify-between">
          <span className="neo-badge bg-white text-[11px] font-black uppercase text-amber-950 flex items-center gap-1 shadow-[1px_1px_0px_#000]">
            <Sparkles className="w-3.5 h-3.5" /> Turn {turnNumber} of {totalTurns}
          </span>
          <span className="text-xs font-black px-2.5 py-0.5 rounded-lg border border-black bg-white shadow-[1px_1px_0px_#000]">
            {config.mode === 'in_bed' ? '🛏️ In Bed (18+)' : config.mode === 'mixed' ? '🔀 Mixed' : '🎉 Classic'} • {config.timerSeconds}s
          </span>
        </div>

        {/* Player Banner */}
        <div className="space-y-1">
          <div className="text-xs font-black uppercase tracking-wider text-gray-700">Hand phone to:</div>
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-2xl border-3 border-black bg-white shadow-[3px_3px_0px_#000]">
            <span className="text-3xl">{player.avatarEmoji}</span>
            <span className="text-2xl font-black">{player.name}</span>
          </div>
        </div>

        {/* The Prompt Card to Read in Peace */}
        <div className="p-5 rounded-2xl border-4 border-black bg-white space-y-2 shadow-[4px_4px_0px_#000] relative">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-800">
              Your Situation
            </span>
            <button
              onClick={() => {
                sound.playSwipe();
                setPrompt(getNonRepeatingPromptByMode(sessionId, config.mode));
              }}
              className="text-[10px] font-black text-gray-600 hover:text-black flex items-center gap-1 bg-gray-100 hover:bg-gray-200 px-2 py-0.5 rounded border border-black cursor-pointer transition-colors"
              title="Get another prompt"
            >
              <RefreshCw className="w-2.5 h-2.5" /> Skip
            </button>
          </div>
          <div className="text-2xl font-black text-[#18181B] leading-snug">
            "{prompt}"
          </div>
        </div>

        <p className="text-xs font-bold text-amber-950 leading-tight">
          Read carefully! Say as many as you can before the buzzer. The group will vote on how many count!
        </p>

        {/* Start Button */}
        <button
          onClick={handleStartTimer}
          className="w-full neo-btn py-4 bg-[#A7F3D0] hover:bg-[#86EFAC] text-xl font-black text-[#18181B] border-4 border-black shadow-[5px_5px_0px_#000] flex items-center justify-center gap-2"
        >
          <Play className="w-6 h-6 fill-black" />
          START ({config.timerSeconds}s) ⏱️
        </button>
      </div>
    );
  }

  // STEP 2: ACTIVE 10-SECOND BLITZ COUNTDOWN
  if (turnState === 'counting_down') {
    return (
      <div className="w-full max-w-sm mx-auto space-y-5 select-none pb-8 text-center my-auto">
        <div className="neo-card-lg p-6 bg-white border-4 border-black space-y-4 shadow-[6px_6px_0px_#000]">
          {/* Active Player */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border-2 border-black bg-[#FEF08A] text-xs font-black">
            <span>{player.avatarEmoji}</span>
            <span>{player.name} is shouting answers!</span>
          </div>

          {/* The Prompt */}
          <div className="text-2xl font-black text-[#18181B] leading-tight">
            "{prompt}"
          </div>

          {/* Giant Countdown Clock */}
          <div
            className={`text-8xl font-black tracking-tight tabular-nums font-mono py-2 transition-transform ${
              timeLeft <= 3 ? 'text-red-600 scale-110 animate-bounce' : 'text-[#18181B]'
            }`}
          >
            {timeLeft}s
          </div>

          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Say as many as you can! 🗣️
          </div>
        </div>
      </div>
    );
  }

  // STEP 3: GROUP SCORING & DECISION PHASE
  return (
    <div className="w-full max-w-sm mx-auto neo-card-lg p-6 text-center space-y-5 bg-white select-none my-auto shadow-[6px_6px_0px_#000]">
      <div className="text-5xl animate-bounce">⏱️</div>

      <div className="space-y-1">
        <div className="text-xs font-black uppercase tracking-wider text-red-600">Time's Up!</div>
        <h2 className="text-2xl font-black text-[#18181B]">Group Decision</h2>
        <p className="text-xs font-bold text-gray-600">
          How many accepted/funny things did <strong className="text-black">{player.name}</strong> say?
        </p>
      </div>

      <div className="p-3 bg-gray-50 rounded-2xl border-2 border-black italic text-xs font-black text-gray-700">
        "{prompt}"
      </div>

      {/* Point Stepper Selector */}
      <div className="p-4 rounded-2xl border-3 border-black bg-[#FEF08A] flex items-center justify-between shadow-[3px_3px_0px_#000]">
        <button
          onClick={() => {
            sound.playPop();
            setPointsToAward(p => Math.max(0, p - 1));
          }}
          className="w-12 h-12 rounded-xl border-2 border-black bg-white hover:bg-gray-100 flex items-center justify-center text-xl font-black active:scale-95"
        >
          <Minus className="w-6 h-6 stroke-[3]" />
        </button>

        <div className="text-center">
          <div className="text-4xl font-black text-[#18181B] font-mono">
            +{pointsToAward}
          </div>
          <div className="text-[10px] font-black uppercase text-amber-900">
            Points to Award
          </div>
        </div>

        <button
          onClick={() => {
            sound.playPop();
            setPointsToAward(p => Math.min(10, p + 1));
          }}
          className="w-12 h-12 rounded-xl border-2 border-black bg-white hover:bg-gray-100 flex items-center justify-center text-xl font-black active:scale-95"
        >
          <Plus className="w-6 h-6 stroke-[3]" />
        </button>
      </div>

      {/* Quick Points Preset Pills */}
      <div className="grid grid-cols-5 gap-1.5">
        {[0, 1, 2, 3, 4].map(num => (
          <button
            key={num}
            type="button"
            onClick={() => {
              sound.playPop();
              setPointsToAward(num);
            }}
            className={`py-1.5 text-xs font-black rounded-lg border-2 border-black transition-all ${
              pointsToAward === num
                ? 'bg-black text-white shadow-[2px_2px_0px_#888]'
                : 'bg-white hover:bg-gray-100 text-black'
            }`}
          >
            +{num}
          </button>
        ))}
      </div>

      {/* Next Turn Button */}
      <div className="pt-2">
        <button
          onClick={handleConfirmPoints}
          className="w-full neo-btn py-4 bg-[#A7F3D0] hover:bg-[#86EFAC] text-lg font-black text-[#18181B] border-3 border-black shadow-[4px_4px_0px_#000] flex items-center justify-center gap-2"
        >
          <Check className="w-6 h-6 stroke-[3]" />
          Award +{pointsToAward} &amp; Next Turn ➡️
        </button>
      </div>
    </div>
  );
};
