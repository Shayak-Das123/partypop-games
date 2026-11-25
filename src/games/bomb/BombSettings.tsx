import React from 'react';
import { sound } from '../../services/soundboard';
import { ArrowLeft, Play, Flame, Dices, Award, Zap, Sliders } from 'lucide-react';

export interface BombConfig {
  minSeconds: number; // default 5
  maxSeconds: number; // default 15
  hideTimerDigits: boolean; // default true
  penaltyPoints: number; // default 3
  survivorPoints: number; // default 1
}

interface BombSettingsProps {
  config: BombConfig;
  onChange: (config: BombConfig) => void;
  onStart: () => void;
  onBack: () => void;
  playerCount: number;
}

export const BombSettings: React.FC<BombSettingsProps> = ({
  config,
  onChange,
  onStart,
  onBack,
  playerCount,
}) => {
  const PRESETS = [
    { label: '⚡ Sudden Death', min: 1, max: 7, desc: '1s - 7s ultra fast panic! Answer in a flash!' },
    { label: '🔥 Hyper Rush', min: 1, max: 10, desc: '1s - 10s high adrenaline reflexes' },
    { label: '🎲 Standard Chaos', min: 5, max: 15, desc: '5s - 15s purely random every pass (Default)' },
    { label: '🧘 Thinker', min: 10, max: 25, desc: '10s - 25s more answering time' },
  ];

  const isCurrentPreset = (min: number, max: number) =>
    config.minSeconds === min && config.maxSeconds === max;

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
        <span className="neo-badge bg-[#FED7AA] text-[11px] font-black uppercase text-amber-950">
          Game 3 Setup
        </span>
      </div>

      {/* Title */}
      <div className="text-center space-y-1">
        <div className="text-4xl animate-bounce">💣</div>
        <h2 className="text-3xl font-black text-[#18181B] tracking-tight">Tick-Tick-BOOM!</h2>
        <p className="text-xs font-bold text-gray-600">
          Pass the bomb in <span className="text-red-600 font-black">ANY order</span>! The phone detects your handoff motion!
        </p>
      </div>

      {/* Settings Card */}
      <div className="space-y-4">
        {/* Secret Timer Duration Range */}
        <div className="neo-card p-4 bg-white space-y-3 shadow-[4px_4px_0px_#000]">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5 text-gray-800">
              <Dices className="w-4 h-4 text-orange-600" />
              Secret Timer Range
            </label>
            <span className="text-xs font-black px-2.5 py-0.5 rounded-lg border-2 border-black bg-[#FEF08A] shadow-[1px_1px_0px_#000]">
              {config.minSeconds}s – {config.maxSeconds}s
            </span>
          </div>
          <p className="text-[11px] font-bold text-gray-500 leading-tight">
            Every time the phone is physically passed, a new secret countdown is randomly picked!
          </p>

          {/* Preset Buttons */}
          <div className="space-y-1.5 pt-1">
            {PRESETS.map(preset => {
              const active = isCurrentPreset(preset.min, preset.max);
              return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    sound.playPop();
                    onChange({
                      ...config,
                      minSeconds: preset.min,
                      maxSeconds: preset.max,
                    });
                  }}
                  className={`w-full p-2.5 rounded-xl border-2 border-black text-left flex items-center justify-between transition-all cursor-pointer ${
                    active
                      ? 'bg-[#FEF08A] shadow-[2px_2px_0px_#000] font-black'
                      : 'bg-gray-50 hover:bg-gray-100 font-bold text-gray-700'
                  }`}
                >
                  <div>
                    <div className="text-xs font-black">{preset.label}</div>
                    <div className="text-[10px] text-gray-500">{preset.desc}</div>
                  </div>
                  <span className="text-xs font-black px-2 py-0.5 rounded border border-black bg-white shadow-[1px_1px_0px_#000]">
                    {preset.min}s - {preset.max}s
                  </span>
                </button>
              );
            })}
          </div>

          {/* Custom Sliders */}
          <div className="pt-2 border-t-2 border-gray-100 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-black text-gray-700">
              <span className="flex items-center gap-1">
                <Sliders className="w-3.5 h-3.5 text-gray-500" /> Custom Min Seconds:
              </span>
              <span>{config.minSeconds}s</span>
            </div>
            <input
              type="range"
              min="1"
              max="15"
              step="1"
              value={config.minSeconds}
              onChange={(e) => {
                const min = parseInt(e.target.value, 10);
                onChange({
                  ...config,
                  minSeconds: min,
                  maxSeconds: Math.max(min + 2, config.maxSeconds),
                });
              }}
              className="w-full accent-amber-500"
            />

            <div className="flex items-center justify-between text-[11px] font-black text-gray-700 pt-1">
              <span className="flex items-center gap-1">
                <Sliders className="w-3.5 h-3.5 text-gray-500" /> Custom Max Seconds:
              </span>
              <span>{config.maxSeconds}s</span>
            </div>
            <input
              type="range"
              min={config.minSeconds + 2}
              max="35"
              step="1"
              value={config.maxSeconds}
              onChange={(e) => {
                const max = parseInt(e.target.value, 10);
                onChange({
                  ...config,
                  maxSeconds: max,
                });
              }}
              className="w-full accent-amber-500"
            />
          </div>
        </div>

        {/* Feature Explainer */}
        <div className="neo-card p-4 bg-[#FEF3C7] space-y-2 border-3 border-black shadow-[3px_3px_0px_#000]">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-900" />
            <div className="text-xs font-black text-amber-950 uppercase">
              Physical Shake &amp; Motion Passing
            </div>
          </div>
          <p className="text-xs font-bold text-amber-950 leading-relaxed">
            Answer the topic out loud and physically pass the phone to <b>anyone in the room</b>! The accelerometer detects the pass, resets the timer, and brings up the next topic.
          </p>
        </div>

        {/* Scoring Rules */}
        <div className="neo-card p-4 bg-white space-y-2 shadow-[3px_3px_0px_#000]">
          <div className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5 text-gray-800">
            <Award className="w-4 h-4 text-amber-600" />
            Points Mechanics
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs font-black">
            <div className="p-2.5 rounded-xl border-2 border-black bg-red-100 text-red-900 text-center">
              💥 Bomb Loser: -{config.penaltyPoints} pts
            </div>
            <div className="p-2.5 rounded-xl border-2 border-black bg-emerald-100 text-emerald-900 text-center">
              🛡️ Survivors: +{config.survivorPoints} pt each
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
          className="w-full neo-btn py-4 bg-[#FEF08A] hover:bg-[#FDE047] text-lg font-black text-[#18181B] flex items-center justify-center gap-2 shadow-[4px_4px_0px_#000] cursor-pointer"
        >
          <Play className="w-6 h-6 fill-black" />
          Arm the Bomb ({playerCount} Players)
        </button>
      </div>
    </div>
  );
};
