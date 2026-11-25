import React from 'react';
import { sound } from '../../services/soundboard';
import { ArrowLeft, Play, Bot, Award, Clock } from 'lucide-react';

export interface EchoBluffConfig {
  discussionSeconds: number; // default 60
  aiPointsPenalty: number; // default 1 (lost when fooled by AI)
  aiCaughtBonus: number; // default 2 (gained when catching AI)
  bluffSuccessBonus: number; // default 2 (gained by author when room is fooled)
}

interface EchoBluffSettingsProps {
  config: EchoBluffConfig;
  onChange: (config: EchoBluffConfig) => void;
  onStart: () => void;
  onBack: () => void;
  playerCount: number;
}

export const EchoBluffSettings: React.FC<EchoBluffSettingsProps> = ({
  config,
  onChange,
  onStart,
  onBack,
  playerCount,
}) => {
  const TIMER_OPTIONS = [30, 45, 60, 90];

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
        <span className="neo-badge bg-[#DDD6FE] text-[11px] font-black uppercase text-purple-950">
          Game 4 Setup
        </span>
      </div>

      {/* Title */}
      <div className="text-center space-y-1">
        <div className="text-4xl animate-bounce">🎭</div>
        <h2 className="text-3xl font-black text-[#18181B] tracking-tight">Echo Bluff</h2>
        <p className="text-xs font-bold text-gray-600">
          Secret sentence bluff with an AI imposter in the mix!
        </p>
      </div>

      {/* Settings Cards */}
      <div className="space-y-4">
        {/* Discussion Timer */}
        <div className="neo-card p-4 bg-white space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5 text-gray-800">
              <Clock className="w-4 h-4 text-purple-600" />
              Debate Timer
            </label>
            <span className="text-xs font-black px-2 py-0.5 rounded-lg border-2 border-black bg-[#DDD6FE]">
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
                    ? 'bg-[#DDD6FE] shadow-[2px_2px_0px_#000]'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                {sec}s
              </button>
            ))}
          </div>
        </div>

        {/* AI & Bluff Mechanics summary card */}
        <div className="neo-card p-4 bg-[#F5D0FE] space-y-3 border-3 border-black">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-purple-900" />
            <div className="text-xs font-black text-purple-950 uppercase">
              The AI Imposter Rules
            </div>
          </div>
          <p className="text-xs font-bold text-purple-950 leading-relaxed">
            The game secretly adds 1 deceptive AI sentence. If the AI tricks you into framing a friend, everyone who voted for that friend loses <span className="underline font-black text-red-700">1 point</span>!
          </p>
        </div>

        {/* Scoring Matrix */}
        <div className="neo-card p-4 bg-white space-y-2">
          <div className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5 text-gray-800">
            <Award className="w-4 h-4 text-amber-600" />
            Points System
          </div>
          <div className="space-y-1.5 text-[11px] font-black">
            <div className="p-2 rounded-xl border-2 border-black bg-emerald-100 text-emerald-950 flex justify-between">
              <span>🎭 Successful Human Bluff</span>
              <span>+{config.bluffSuccessBonus} pts</span>
            </div>
            <div className="p-2 rounded-xl border-2 border-black bg-blue-100 text-blue-950 flex justify-between">
              <span>🤖 Room Catches AI</span>
              <span>+{config.aiCaughtBonus} pts</span>
            </div>
            <div className="p-2 rounded-xl border-2 border-black bg-purple-100 text-purple-950 flex justify-between">
              <span>🕵️ Room Catches Human Author</span>
              <span>+1 pt / voter</span>
            </div>
            <div className="p-2 rounded-xl border-2 border-black bg-red-100 text-red-950 flex justify-between">
              <span>💀 Fooled by AI into Blaming Friend</span>
              <span>-{config.aiPointsPenalty} pt / voter</span>
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
          className="w-full neo-btn py-4 bg-[#DDD6FE] hover:bg-[#C4B5FD] text-lg font-black text-[#18181B] flex items-center justify-center gap-2 shadow-[4px_4px_0px_#000]"
        >
          <Play className="w-6 h-6 fill-black" />
          Pick Topic &amp; Write ({playerCount} Players)
        </button>
      </div>
    </div>
  );
};
