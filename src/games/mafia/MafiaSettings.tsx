import React from 'react';
import { sound } from '../../services/soundboard';
import { ArrowLeft, Play, Clock, Skull, Shield, Check } from 'lucide-react';

export interface MafiaConfig {
  discussionSeconds: number; // 60, 90, 120, 180 (default 90)
  includeJester: boolean;
}

interface MafiaSettingsProps {
  config: MafiaConfig;
  onChange: (config: MafiaConfig) => void;
  onStart: () => void;
  onBack: () => void;
  playerCount: number;
}

export const MafiaSettings: React.FC<MafiaSettingsProps> = ({
  config,
  onChange,
  onStart,
  onBack,
  playerCount,
}) => {
  const TIMER_OPTIONS = [60, 90, 120, 180];
  const mafiaCount = playerCount >= 7 ? 2 : 1;

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
        <span className="neo-badge bg-[#FEE2E2] text-[11px] font-black uppercase text-red-950">
          Game 8 Setup
        </span>
      </div>

      {/* Title */}
      <div className="text-center space-y-1">
        <div className="text-4xl animate-bounce">🐺</div>
        <h2 className="text-3xl font-black text-[#18181B] tracking-tight">Mafia</h2>
        <p className="text-xs font-bold text-gray-600">
          The ultimate party social deduction game with automated night moderation!
        </p>
      </div>

      {/* Settings Card */}
      <div className="space-y-4">
        {/* Discussion Timer */}
        <div className="neo-card p-4 bg-white space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5 text-gray-800">
              <Clock className="w-4 h-4 text-red-600" />
              Daytime Discussion Timer
            </label>
            <span className="text-xs font-black px-2 py-0.5 rounded-lg border-2 border-black bg-[#FEE2E2]">
              {config.discussionSeconds}s
            </span>
          </div>
          <div className="grid grid-cols-4 gap-1.5 pt-1">
            {TIMER_OPTIONS.map(sec => (
              <button
                key={sec}
                type="button"
                onClick={() => {
                  sound.playPop();
                  onChange({ ...config, discussionSeconds: sec });
                }}
                className={`py-2 text-xs font-black rounded-xl border-2 border-black transition-all ${
                  config.discussionSeconds === sec
                    ? 'bg-[#FEE2E2] shadow-[2px_2px_0px_#000]'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                {sec}s
              </button>
            ))}
          </div>
        </div>

        {/* Jester Toggle */}
        <div className="neo-card p-4 bg-white space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5 text-gray-800">
              <span className="text-base">🃏</span>
              Include Jester / Fool
            </label>
            <button
              type="button"
              onClick={() => {
                sound.playPop();
                onChange({ ...config, includeJester: !config.includeJester });
              }}
              className={`px-3 py-1 text-xs font-black rounded-xl border-2 border-black transition-all ${
                config.includeJester
                  ? 'bg-[#DDD6FE] shadow-[2px_2px_0px_#000]'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {config.includeJester ? 'ENABLED 🃏' : 'DISABLED'}
            </button>
          </div>
          <p className="text-[11px] font-bold text-gray-500 leading-snug">
            The Jester wins solo if they manage to get voted out during the daytime trial!
          </p>
        </div>

        {/* Roles Distribution Breakdown */}
        <div className="neo-card p-4 bg-gray-50 space-y-2.5 border-3 border-black">
          <div className="text-xs font-black uppercase text-gray-700 flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-indigo-600" /> Roles for {playerCount} Players
          </div>
          <div className="grid grid-cols-2 gap-1.5 text-xs font-black">
            <div className="p-2 rounded-xl border-2 border-black bg-red-100 text-red-950">
              🐺 {mafiaCount} Mafia
            </div>
            <div className="p-2 rounded-xl border-2 border-black bg-sky-100 text-sky-950">
              🕵️ 1 Detective
            </div>
            {playerCount >= 4 && (
              <div className="p-2 rounded-xl border-2 border-black bg-emerald-100 text-emerald-950">
                💉 1 Doctor
              </div>
            )}
            <div className="p-2 rounded-xl border-2 border-black bg-amber-100 text-amber-950">
              🧑‍🌾 Villagers
            </div>
          </div>
        </div>
      </div>

      {/* Start Button */}
      <div className="pt-2">
        <button
          onClick={() => {
            sound.playFanfare();
            onStart();
          }}
          className="w-full neo-btn py-4 bg-[#FEE2E2] hover:bg-[#FECDD3] text-lg font-black text-red-950 flex items-center justify-center gap-2 shadow-[4px_4px_0px_#000]"
        >
          <Play className="w-6 h-6 fill-red-950" />
          Start Mafia Night ({playerCount} Players)
        </button>
      </div>
    </div>
  );
};
