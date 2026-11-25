import React from 'react';
import { sound } from '../../services/soundboard';
import { ArrowLeft, Play, Palette, PenTool, Layers } from 'lucide-react';

export interface FakeArtistConfig {
  roundsCount: number; // 1, 2, or 3 rounds (default 2)
  stylusMode: boolean; // default true for tablet/stylus
}

interface FakeArtistSettingsProps {
  config: FakeArtistConfig;
  onChange: (config: FakeArtistConfig) => void;
  onStart: () => void;
  onBack: () => void;
  playerCount: number;
}

export const FakeArtistSettings: React.FC<FakeArtistSettingsProps> = ({
  config,
  onChange,
  onStart,
  onBack,
  playerCount,
}) => {
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
        <span className="neo-badge bg-[#E0E7FF] text-[11px] font-black uppercase text-indigo-950">
          Game 7 Setup
        </span>
      </div>

      {/* Title */}
      <div className="text-center space-y-1">
        <div className="text-4xl animate-bounce">🎨</div>
        <h2 className="text-3xl font-black text-[#18181B] tracking-tight">Fake Artist</h2>
        <p className="text-xs font-bold text-gray-600">
          Everyone draws one stroke of the secret word. The Fake Artist doesn't know what they're drawing!
        </p>
      </div>

      {/* Settings Card */}
      <div className="space-y-4">
        {/* Rounds Count */}
        <div className="neo-card p-4 bg-white space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5 text-gray-800">
              <Layers className="w-4 h-4 text-indigo-600" />
              Drawing Rounds
            </label>
            <span className="text-xs font-black px-2 py-0.5 rounded-lg border-2 border-black bg-[#E0E7FF]">
              {config.roundsCount} {config.roundsCount === 1 ? 'Round' : 'Rounds'}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 pt-1">
            {[1, 2, 3].map(rounds => (
              <button
                key={rounds}
                type="button"
                onClick={() => {
                  sound.playPop();
                  onChange({ ...config, roundsCount: rounds });
                }}
                className={`py-2.5 text-xs font-black rounded-xl border-2 border-black transition-all ${
                  config.roundsCount === rounds
                    ? 'bg-[#E0E7FF] shadow-[2px_2px_0px_#000]'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                {rounds} {rounds === 1 ? 'Stroke Each' : 'Strokes Each'}
              </button>
            ))}
          </div>
        </div>

        {/* Stylus / Tablet Mode Toggle */}
        <div className="neo-card p-4 bg-white space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5 text-gray-800">
              <PenTool className="w-4 h-4 text-emerald-600" />
              Stylus Mode (Tablet / Pen)
            </label>
            <button
              type="button"
              onClick={() => {
                sound.playPop();
                onChange({ ...config, stylusMode: !config.stylusMode });
              }}
              className={`px-3 py-1 text-xs font-black rounded-xl border-2 border-black transition-all ${
                config.stylusMode
                  ? 'bg-[#A7F3D0] shadow-[2px_2px_0px_#000]'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {config.stylusMode ? 'ON (Pen / Finger)' : 'OFF'}
            </button>
          </div>
          <p className="text-[11px] font-bold text-gray-500 leading-snug">
            Automatically advances to the next player as soon as you finish your stroke and lift your pen or finger!
          </p>
        </div>

        {/* Rules Summary */}
        <div className="neo-card p-4 bg-[#FEF3C7] space-y-2 border-3 border-black text-amber-950">
          <div className="flex items-center gap-1.5 text-xs font-black uppercase">
            <Palette className="w-4 h-4 text-amber-800" /> How It Plays
          </div>
          <p className="text-xs font-bold leading-relaxed">
            1. Pass phone to see the secret word. The Fake Artist only sees the category!<br />
            2. Each player draws 1 continuous stroke in their assigned color.<br />
            3. Lifting the pen/finger passes the canvas to the next player.<br />
            4. At the end, {playerCount > 6 ? `cast secret pass-and-play voting ballots (${playerCount} players > 6)` : 'point together at the Fake Artist'}! If caught, they get one guess to steal the win!
          </p>
        </div>
      </div>

      {/* Start Button */}
      <div className="pt-2">
        <button
          onClick={() => {
            sound.playFanfare();
            onStart();
          }}
          className="w-full neo-btn py-4 bg-[#E0E7FF] hover:bg-[#C7D2FE] text-lg font-black text-[#18181B] flex items-center justify-center gap-2 shadow-[4px_4px_0px_#000]"
        >
          <Play className="w-6 h-6 fill-black" />
          Start Fake Artist ({playerCount} Players)
        </button>
      </div>
    </div>
  );
};
