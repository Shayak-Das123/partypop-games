import React from 'react';
import { sound } from '../../services/soundboard';
import { ArrowLeft, Play, Shield, Users, AlertTriangle, Sparkles, BookOpen } from 'lucide-react';
import { ResistanceConfig, RESISTANCE_MATRIX } from './resistanceData';

interface ResistanceSettingsProps {
  playerCount: number;
  config: ResistanceConfig;
  onChange: (config: ResistanceConfig) => void;
  onStart: () => void;
  onBack: () => void;
  onViewRules: () => void;
}

export const ResistanceSettings: React.FC<ResistanceSettingsProps> = ({
  playerCount,
  config,
  onChange,
  onStart,
  onBack,
  onViewRules,
}) => {
  // Fallback to closest valid player count (5-10)
  const clampedCount = Math.max(5, Math.min(10, playerCount));
  const matrix = RESISTANCE_MATRIX[clampedCount] || RESISTANCE_MATRIX[5];

  return (
    <div className="w-full max-w-md mx-auto space-y-4 select-none pb-12 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => {
            sound.playPop();
            onBack();
          }}
          className="neo-btn neo-btn-sm bg-white p-2 text-black flex items-center gap-1 font-black shadow-[2px_2px_0px_#000]"
        >
          <ArrowLeft className="w-4 h-4 stroke-[3]" /> Back
        </button>

        <button
          onClick={() => {
            sound.playPop();
            onViewRules();
          }}
          className="neo-btn neo-btn-sm bg-[#FEF08A] hover:bg-[#FDE047] py-1.5 px-3 text-amber-950 flex items-center gap-1.5 text-xs font-black shadow-[2px_2px_0px_#000]"
        >
          <BookOpen className="w-3.5 h-3.5 stroke-[2.5]" />
          Rules Guide
        </button>
      </div>

      {/* Title */}
      <div className="text-center space-y-1">
        <div className="text-4xl animate-bounce">🛡️</div>
        <h2 className="text-3xl font-black text-[#18181B] tracking-tight">The Resistance</h2>
        <p className="text-xs font-bold text-gray-600">
          Match setup &amp; team balance configuration
        </p>
      </div>

      {/* Player Count Balance Matrix Card */}
      <div className="neo-card p-4 bg-white space-y-3 border-4 border-black shadow-[4px_4px_0px_#000]">
        <div className="flex items-center justify-between text-xs font-black">
          <span className="flex items-center gap-1.5 text-gray-800">
            <Users className="w-4 h-4 text-indigo-600" />
            {playerCount} Players Connected
          </span>
          <span className="px-2.5 py-1 rounded-xl border-2 border-black bg-[#E0E7FF] text-indigo-950 text-xs font-black shadow-[1px_1px_0px_#000]">
            {matrix.resistanceCount} Resistance vs {matrix.spyCount} Spies
          </span>
        </div>

        {/* 5 Missions Requirement Bar */}
        <div className="space-y-1.5 pt-1">
          <div className="text-[10px] font-black uppercase tracking-wider text-gray-500">
            Official 5-Mission Operative Requirements:
          </div>
          <div className="grid grid-cols-5 gap-1.5 text-center">
            {matrix.missions.map((m, idx) => (
              <div
                key={idx}
                className="p-2 rounded-xl border-2 border-black bg-gray-50 flex flex-col items-center shadow-[1px_1px_0px_#000]"
              >
                <span className="text-[9px] font-black text-gray-500">M{idx + 1}</span>
                <span className="text-sm font-black text-indigo-950">{m.playersRequired}p</span>
                {m.failsRequired > 1 ? (
                  <span className="text-[8px] font-black text-red-600 leading-none mt-0.5">2 fails</span>
                ) : (
                  <span className="text-[8px] font-bold text-gray-400 leading-none mt-0.5">1 fail</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {playerCount < 5 && (
          <div className="p-2.5 rounded-xl border-2 border-red-500 bg-red-50 text-red-950 text-xs font-bold flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <span>
              Resistance strictly requires <strong>at least 5 players</strong>. Add more players in the roster!
            </span>
          </div>
        )}
      </div>

      {/* Commander Mode Toggle */}
      <div className="neo-card p-4 bg-white space-y-2 border-4 border-black shadow-[4px_4px_0px_#000]">
        <div className="flex items-center justify-between">
          <label className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5 text-gray-800">
            <Sparkles className="w-4 h-4 text-amber-500" />
            Commander &amp; Assassin Roles
          </label>
          <button
            type="button"
            onClick={() => {
              sound.playPop();
              onChange({ ...config, commanderMode: !config.commanderMode });
            }}
            className={`px-3 py-1.5 text-xs font-black rounded-xl border-2 border-black transition-all ${
              config.commanderMode
                ? 'bg-[#A7F3D0] text-emerald-950 shadow-[2px_2px_0px_#000]'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            {config.commanderMode ? 'ON (Merlin)' : 'OFF (Standard)'}
          </button>
        </div>
        <p className="text-xs font-bold text-gray-600 leading-snug">
          Commander knows all spies. If Resistance wins 3 missions, the Assassin gets 1 chance to assassinate the Commander to steal victory!
        </p>
      </div>

      {/* Quick Summary Card */}
      <div className="p-3.5 rounded-2xl border-2 border-dashed border-gray-400 bg-amber-50/70 text-xs font-bold text-amber-950 space-y-1">
        <div className="font-black flex items-center gap-1.5">
          <span>💡 Quick Recap:</span>
        </div>
        <p className="leading-snug">
          Leaders nominate mission squads &rarr; the whole room votes openly &rarr; chosen squad passes the phone to vote secret Success/Sabotage &rarr; first to 3 points wins!
        </p>
      </div>

      {/* Start Game Button */}
      <div className="pt-2">
        <button
          onClick={() => {
            sound.playSecretReveal();
            onStart();
          }}
          className="w-full neo-btn py-4 bg-[#E0E7FF] hover:bg-[#C7D2FE] text-lg font-black text-[#18181B] flex items-center justify-center gap-2 shadow-[4px_4px_0px_#000] active:scale-[0.98]"
        >
          <Play className="w-6 h-6 fill-black" />
          Start The Resistance ({playerCount} Players)
        </button>
      </div>
    </div>
  );
};
