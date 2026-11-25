import React from 'react';
import { sound } from '../../services/soundboard';
import { ArrowLeft, Play, Clock, MapPin, Eye, BookOpen, AlertCircle, Sparkles } from 'lucide-react';
import { SpyfallConfig, SPYFALL_LOCATIONS } from './spyfallData';

interface SpyfallSettingsProps {
  playerCount: number;
  config: SpyfallConfig;
  onChange: (config: SpyfallConfig) => void;
  onStart: () => void;
  onBack: () => void;
  onViewRules: () => void;
}

export const SpyfallSettings: React.FC<SpyfallSettingsProps> = ({
  playerCount,
  config,
  onChange,
  onStart,
  onBack,
  onViewRules,
}) => {
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
        <div className="text-4xl animate-bounce">📍</div>
        <h2 className="text-3xl font-black text-[#18181B] tracking-tight">Spyfall</h2>
        <p className="text-xs font-bold text-gray-600">
          Match setup &amp; investigation duration configuration
        </p>
      </div>

      {/* Timer Setting Card */}
      <div className="neo-card p-4 bg-white space-y-3 border-4 border-black shadow-[4px_4px_0px_#000]">
        <div className="flex items-center justify-between">
          <label className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5 text-gray-800">
            <Clock className="w-4 h-4 text-sky-600" />
            Investigation Timer
          </label>
          <span className="text-xs font-black px-2.5 py-0.5 rounded-lg border-2 border-black bg-[#BAE6FD] text-sky-950 shadow-[1px_1px_0px_#000]">
            {config.timerMinutes} Minutes
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2 pt-1">
          {[5, 6, 8].map(mins => (
            <button
              key={mins}
              type="button"
              onClick={() => {
                sound.playPop();
                onChange({ ...config, timerMinutes: mins });
              }}
              className={`py-2.5 text-xs font-black rounded-xl border-2 border-black transition-all ${
                config.timerMinutes === mins
                  ? 'bg-[#BAE6FD] shadow-[2px_2px_0px_#000] scale-[1.02]'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              {mins} Minutes
            </button>
          ))}
        </div>
      </div>

      {/* Locations Pack Badge */}
      <div className="neo-card p-4 bg-white border-4 border-black space-y-2 shadow-[4px_4px_0px_#000]">
        <div className="flex items-center justify-between text-xs font-black text-indigo-950">
          <span className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-indigo-700" />
            Location Database
          </span>
          <span className="px-2.5 py-1 rounded-xl border-2 border-black bg-[#E0E7FF] text-indigo-950 text-xs font-black shadow-[1px_1px_0px_#000]">
            {SPYFALL_LOCATIONS.length} Kolkata &amp; Global Spots
          </span>
        </div>
        <p className="text-xs font-bold text-gray-600 leading-snug">
          Includes Eden Gardens, Howrah Bridge, Airplane, Casino, Space Station, Submarine, Indian Wedding, and more!
        </p>
      </div>

      {/* Strategic Tip Reminder */}
      <div className="p-3.5 rounded-2xl border-2 border-dashed border-gray-400 bg-yellow-50 text-xs font-bold text-yellow-950 space-y-1">
        <div className="font-black flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-600" /> Pro Tip for Innocents:
        </div>
        <p className="leading-snug">
          Never give away the obvious location details (like "How high in the sky are we?") or the Spy will steal the win! Ask subtle questions only insiders would know!
        </p>
      </div>

      {/* Start Game Button */}
      <div className="pt-2">
        <button
          onClick={() => {
            sound.playSecretReveal();
            onStart();
          }}
          className="w-full neo-btn py-4 bg-[#BAE6FD] hover:bg-[#93C5FD] text-lg font-black text-[#18181B] flex items-center justify-center gap-2 shadow-[4px_4px_0px_#000] active:scale-[0.98]"
        >
          <Play className="w-6 h-6 fill-black" />
          Start Spyfall ({playerCount} Players)
        </button>
      </div>
    </div>
  );
};
