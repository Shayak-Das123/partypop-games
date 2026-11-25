import React from 'react';
import { sound } from '../../services/soundboard';
import { ArrowLeft, Play, AlertTriangle, Clock, Award } from 'lucide-react';

export interface WordTrapConfig {
  turnSeconds: number; // default 60
  trapCount: number; // 3, 4, or 5 (default 5)
  trapPenalty: number; // default 1
  pointPerWord: number; // default 1
}

interface WordTrapSettingsProps {
  config: WordTrapConfig;
  onChange: (config: WordTrapConfig) => void;
  onStart: () => void;
  onBack: () => void;
  playerCount: number;
}

export const WordTrapSettings: React.FC<WordTrapSettingsProps> = ({
  config,
  onChange,
  onStart,
  onBack,
  playerCount,
}) => {
  const TIMER_OPTIONS = [30, 45, 60, 90, 120];
  const TRAP_COUNT_OPTIONS = [3, 4, 5];

  return (
    <div className="w-full max-w-sm mx-auto space-y-5 select-none pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => {
            sound.playPop();
            onBack();
          }}
          className="neo-btn neo-btn-sm bg-white p-2 text-black flex items-center gap-1 font-black"
        >
          <ArrowLeft className="w-4 h-4 stroke-[3]" /> Back
        </button>
        <span className="neo-badge bg-[#FECDD3] text-[11px] font-black uppercase text-red-950">
          Game 5 Setup
        </span>
      </div>

      {/* Title */}
      <div className="text-center space-y-1">
        <div className="text-4xl animate-bounce">🚨</div>
        <h2 className="text-3xl font-black text-[#18181B] tracking-tight">Word Trap</h2>
        <p className="text-xs font-bold text-gray-600">
          Describe the secret word without saying any of the forbidden silence words!
        </p>
      </div>

      {/* Settings Card */}
      <div className="space-y-4">
        {/* Turn Duration */}
        <div className="neo-card p-4 bg-white space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5 text-gray-800">
              <Clock className="w-4 h-4 text-red-600" />
              Turn Time Limit
            </label>
            <span className="text-xs font-black px-2 py-0.5 rounded-lg border-2 border-black bg-[#FECDD3]">
              {config.turnSeconds}s
            </span>
          </div>
          <div className="grid grid-cols-5 gap-1 pt-1">
            {TIMER_OPTIONS.map(sec => (
              <button
                key={sec}
                type="button"
                onClick={() => {
                  sound.playPop();
                  onChange({ ...config, turnSeconds: sec });
                }}
                className={`py-2 text-xs font-black rounded-xl border-2 border-black transition-all ${
                  config.turnSeconds === sec
                    ? 'bg-[#FECDD3] shadow-[2px_2px_0px_#000]'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                {sec}s
              </button>
            ))}
          </div>
        </div>

        {/* Silence / Trap Words Count */}
        <div className="neo-card p-4 bg-white space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5 text-gray-800">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              Forbidden Words to Avoid
            </label>
            <span className="text-xs font-black px-2 py-0.5 rounded-lg border-2 border-black bg-[#FEF08A]">
              {config.trapCount || 5} Words
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 pt-1">
            {TRAP_COUNT_OPTIONS.map(count => (
              <button
                key={count}
                type="button"
                onClick={() => {
                  sound.playPop();
                  onChange({ ...config, trapCount: count });
                }}
                className={`py-2.5 text-xs font-black rounded-xl border-2 border-black transition-all ${
                  (config.trapCount || 5) === count
                    ? 'bg-[#FEF08A] shadow-[2px_2px_0px_#000]'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                {count} Words
              </button>
            ))}
          </div>
        </div>

        {/* Scoring Matrix */}
        <div className="neo-card p-4 bg-white space-y-2">
          <div className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5 text-gray-800">
            <Award className="w-4 h-4 text-amber-600" />
            Points Mechanics
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs font-black">
            <div className="p-2.5 rounded-xl border-2 border-black bg-emerald-100 text-emerald-900 text-center">
              🎉 Guessed Word: +{config.pointPerWord} pt
            </div>
            <div className="p-2.5 rounded-xl border-2 border-black bg-red-100 text-red-900 text-center">
              🚨 Trap Buzzer: -{config.trapPenalty} pt
            </div>
          </div>
        </div>
      </div>

      {/* Start Button */}
      <div className="space-y-2 pt-2">
        <button
          onClick={() => {
            sound.playFanfare();
            onStart();
          }}
          className="w-full neo-btn py-4 bg-[#FECDD3] hover:bg-[#FDA4AF] text-lg font-black text-[#18181B] flex items-center justify-center gap-2 shadow-[4px_4px_0px_#000]"
        >
          <Play className="w-6 h-6 fill-black" />
          Start Word Trap ({playerCount} Players)
        </button>
      </div>
    </div>
  );
};
