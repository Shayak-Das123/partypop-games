import React from 'react';
import { sound } from '../../services/soundboard';
import { ArrowLeft, Play, Clock, Sparkles, MessageSquare, Sliders, Flame } from 'lucide-react';
import { ThingsYouSayMode } from './data/prompts';

export interface ThingsYouSayConfig {
  timerSeconds: number; // default 10
  mode: ThingsYouSayMode; // default 'classic'
}

interface ThingsYouSaySettingsProps {
  config: ThingsYouSayConfig;
  onChange: (config: ThingsYouSayConfig) => void;
  onStart: () => void;
  onBack: () => void;
  playerCount: number;
}

export const ThingsYouSaySettings: React.FC<ThingsYouSaySettingsProps> = ({
  config,
  onChange,
  onStart,
  onBack,
  playerCount,
}) => {
  const TIMER_PRESETS = [5, 10, 15, 20, 30];

  const MODES: { id: ThingsYouSayMode; title: string; desc: string; badge: string; icon: string; bg: string }[] = [
    {
      id: 'classic',
      title: 'Classic Party',
      desc: 'Super easy, funny everyday situations for all ages (80+ prompts)',
      badge: 'All Ages',
      icon: '🎉',
      bg: '#FEF08A',
    },
    {
      id: 'in_bed',
      title: 'In Bed Edition (18+)',
      desc: 'Double-entendre cheeky situations: "Things you can say in [X] AND in bed!" (120+ prompts)',
      badge: '120+ Prompts',
      icon: '🛏️',
      bg: '#FECDD3',
    },
    {
      id: 'mixed',
      title: 'Mixed Chaos',
      desc: 'Shuffles classic everyday prompts and "In Bed" prompts together (200+ prompts)',
      badge: 'Huge Deck',
      icon: '🔀',
      bg: '#E0E7FF',
    },
  ];

  return (
    <div className="w-full max-w-sm mx-auto space-y-5 select-none pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => {
            sound.playPop();
            onBack();
          }}
          className="neo-btn neo-btn-sm bg-white p-2 text-black flex items-center gap-1 font-black cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 stroke-[3]" /> Back
        </button>
        <span className="neo-badge bg-[#FEF08A] text-[11px] font-black uppercase text-amber-950">
          Game 6 Setup
        </span>
      </div>

      {/* Title */}
      <div className="text-center space-y-1">
        <div className="text-4xl animate-bounce">💬</div>
        <h2 className="text-3xl font-black text-[#18181B] tracking-tight">Things You Can Say</h2>
        <p className="text-xs font-bold text-gray-600">
          Shout out funny things you can say before the buzzer runs out!
        </p>
      </div>

      {/* Settings Options */}
      <div className="space-y-4">
        {/* Game Mode Selection */}
        <div className="neo-card p-4 bg-white space-y-3 shadow-[4px_4px_0px_#000]">
          <label className="text-xs font-black uppercase tracking-wider flex items-center justify-between text-gray-800">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-purple-600" />
              Game Mode
            </span>
            <span className="text-[10px] font-black px-2 py-0.5 rounded bg-gray-100 border border-black">
              {config.mode === 'in_bed' ? '120+ In Bed Deck' : config.mode === 'mixed' ? '200+ Deck' : 'Easy Classic'}
            </span>
          </label>

          <div className="space-y-2">
            {MODES.map(m => {
              const active = config.mode === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    sound.playPop();
                    onChange({ ...config, mode: m.id });
                  }}
                  className={`w-full p-3 rounded-2xl border-3 border-black text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                    active
                      ? 'shadow-[3px_3px_0px_#000] translate-x-0.5'
                      : 'bg-gray-50 hover:bg-gray-100 opacity-80'
                  }`}
                  style={{ backgroundColor: active ? m.bg : undefined }}
                >
                  <span className="text-2xl mt-0.5">{m.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-black text-[#18181B]">{m.title}</span>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full border border-black bg-white">
                        {m.badge}
                      </span>
                    </div>
                    <p className="text-[11px] font-bold text-gray-700 leading-tight mt-0.5">
                      {m.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Blitz Countdown Duration */}
        <div className="neo-card p-4 bg-white space-y-3 shadow-[4px_4px_0px_#000]">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5 text-gray-800">
              <Clock className="w-4 h-4 text-amber-600" />
              Blitz Timer Duration
            </label>
            <span className="text-sm font-black px-2.5 py-0.5 rounded-lg border-2 border-black bg-[#FEF08A] shadow-[1px_1px_0px_#000]">
              {config.timerSeconds}s
            </span>
          </div>
          <p className="text-[11px] font-bold text-gray-500 leading-tight">
            Read your situation first at your own pace, then tap start!
          </p>

          {/* Quick preset buttons */}
          <div className="grid grid-cols-5 gap-1.5 pt-1">
            {TIMER_PRESETS.map(sec => (
              <button
                key={sec}
                type="button"
                onClick={() => {
                  sound.playPop();
                  onChange({ ...config, timerSeconds: sec });
                }}
                className={`py-2 text-xs font-black rounded-xl border-2 border-black transition-all cursor-pointer ${
                  config.timerSeconds === sec
                    ? 'bg-[#FEF08A] shadow-[2px_2px_0px_#000]'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                {sec}s
              </button>
            ))}
          </div>

          {/* Interactive slider for any custom timer (5s to 45s) */}
          <div className="pt-2 border-t border-gray-100 space-y-1">
            <div className="flex items-center justify-between text-[11px] font-black text-gray-600">
              <span className="flex items-center gap-1">
                <Sliders className="w-3.5 h-3.5" /> Custom Timer:
              </span>
              <span>{config.timerSeconds} seconds</span>
            </div>
            <input
              type="range"
              min="5"
              max="45"
              step="1"
              value={config.timerSeconds}
              onChange={(e) => {
                onChange({ ...config, timerSeconds: parseInt(e.target.value, 10) });
              }}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>
        </div>

        {/* How It Plays Box */}
        <div className="neo-card p-4 bg-[#FEF3C7] space-y-2 border-3 border-black shadow-[3px_3px_0px_#000]">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-amber-900" />
            <div className="text-xs font-black text-amber-950 uppercase">
              Group Decides the Points!
            </div>
          </div>
          <p className="text-xs font-bold text-amber-950 leading-relaxed">
            Shout out funny, clever things as fast as you can within {config.timerSeconds}s. Friends vote on how many funny answers they accept and award points!
          </p>
        </div>
      </div>

      {/* Start Button */}
      <div className="space-y-2 pt-2">
        <button
          onClick={() => {
            sound.playFanfare();
            onStart();
          }}
          className="w-full neo-btn py-4 bg-[#FEF08A] hover:bg-[#FDE047] text-lg font-black text-[#18181B] flex items-center justify-center gap-2 shadow-[4px_4px_0px_#000] cursor-pointer"
        >
          <Play className="w-6 h-6 fill-black" />
          Start Game ({playerCount} Players)
        </button>
      </div>
    </div>
  );
};
