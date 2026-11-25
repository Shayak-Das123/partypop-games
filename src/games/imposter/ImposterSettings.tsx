import React from 'react';
import { WordItem } from './data/wordBank';
import { sound } from '../../services/soundboard';
import { haptics } from '../../services/haptics';
import { Settings, Users, Sparkles, Clock, HelpCircle, Shuffle } from 'lucide-react';

export interface ImposterConfig {
  categories: WordItem['category'][];
  randomImposters: boolean;
  imposterCount: number;
  timerSeconds: number;
  undercoverMode: boolean;
  hintsEnabled: boolean;
  enableAssistant: boolean;
  enableJester: boolean;
}

interface ImposterSettingsProps {
  playerCount: number;
  config: ImposterConfig;
  onChange: (config: ImposterConfig) => void;
  onStart: () => void;
  onBack: () => void;
}

export const ImposterSettings: React.FC<ImposterSettingsProps> = ({
  playerCount,
  config,
  onChange,
  onStart,
  onBack,
}) => {
  const maxPossibleImposters = Math.max(1, Math.floor((playerCount - 1) / 2));

  const toggleCategory = (cat: WordItem['category']) => {
    sound.playPop();
    haptics.light();
    let updated: WordItem['category'][];
    if (config.categories.includes(cat)) {
      if (config.categories.length === 1) return; // keep at least 1
      updated = config.categories.filter(c => c !== cat);
    } else {
      updated = [...config.categories, cat];
    }
    onChange({ ...config, categories: updated });
  };

  const handleToggle = (key: keyof ImposterConfig) => {
    sound.playPop();
    haptics.light();
    onChange({ ...config, [key]: !config[key] });
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => {
            sound.playPop();
            onBack();
          }}
          className="neo-btn neo-btn-sm px-3 py-1.5 bg-white text-xs font-black"
        >
          ← Back
        </button>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 neo-card bg-[#FECDD3] text-xs font-black uppercase">
          <Settings className="w-4 h-4" /> Imposter Settings
        </div>
      </div>

      {/* 1. Category Selection */}
      <div className="neo-card p-4 space-y-3 bg-white">
        <div className="flex items-center justify-between">
          <label className="text-sm font-black text-[#18181B] flex items-center gap-1.5">
            📂 Word Categories <span className="text-xs text-gray-500 font-bold">(Select 1 or more)</span>
          </label>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          {[
            { id: 'everyday_objects', label: 'Everyday Objects', count: '400+ words', emoji: '📦', color: '#FEF08A' },
            { id: 'places', label: 'Places & Venues', count: '100+ words', emoji: '🗺️', color: '#BAE6FD' },
            { id: 'verbs', label: 'Actions & Verbs', count: '100+ words', emoji: '🏃', color: '#A7F3D0' },
            { id: 'animals', label: 'Animals & Creatures', count: '100+ words', emoji: '🦁', color: '#FED7AA' },
          ].map(cat => {
            const isSelected = config.categories.includes(cat.id as WordItem['category']);
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => toggleCategory(cat.id as WordItem['category'])}
                style={{ backgroundColor: isSelected ? cat.color : '#FFFFFF' }}
                className={`p-3 rounded-xl border-3 border-black text-left flex flex-col justify-between transition-all ${
                  isSelected ? 'shadow-[3px_3px_0px_#000] scale-[1.02]' : 'opacity-60 hover:opacity-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl">{cat.emoji}</span>
                  {isSelected && <span className="text-xs font-black">✓</span>}
                </div>
                <div>
                  <div className="text-xs font-black text-[#18181B] leading-tight">{cat.label}</div>
                  <div className="text-[10px] font-bold text-gray-600">{cat.count}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Imposter Count & Random Mode */}
      <div className="neo-card p-4 space-y-3 bg-white">
        <label className="text-sm font-black text-[#18181B] flex items-center gap-1.5">
          <Users className="w-4 h-4 text-red-500" /> Imposter Selection
        </label>

        {/* Random toggle */}
        <div
          onClick={() => handleToggle('randomImposters')}
          className="flex items-center justify-between p-3 rounded-xl border-2 border-black bg-pink-50 cursor-pointer"
        >
          <div>
            <div className="text-xs font-black text-[#18181B] flex items-center gap-1">
              <Shuffle className="w-3.5 h-3.5 text-pink-600" /> Random Amount of Imposters
            </div>
            <div className="text-[11px] font-semibold text-gray-600">
              Between 1 and {maxPossibleImposters} imposters (&lt; 50% players)
            </div>
          </div>
          <div
            className={`w-12 h-6 flex items-center rounded-full p-1 border-2 border-black cursor-pointer transition-colors ${
              config.randomImposters ? 'bg-[#A7F3D0]' : 'bg-gray-200'
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full border-2 border-black shadow-md transform transition-transform ${
                config.randomImposters ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </div>
        </div>

        {/* Manual selection when not random */}
        {!config.randomImposters && (
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs font-bold text-gray-700">Fixed Imposter Count:</span>
            <div className="flex gap-2">
              {Array.from({ length: maxPossibleImposters }, (_, i) => i + 1).map(count => (
                <button
                  key={count}
                  type="button"
                  onClick={() => {
                    sound.playPop();
                    onChange({ ...config, imposterCount: count });
                  }}
                  className={`w-9 h-9 rounded-lg border-2 border-black font-black text-sm ${
                    config.imposterCount === count ? 'bg-[#FECDD3] shadow-[2px_2px_0px_#000]' : 'bg-white'
                  }`}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 3. Timer & Undercover & Hints */}
      <div className="neo-card p-4 space-y-3 bg-white">
        <label className="text-sm font-black text-[#18181B] flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-blue-500" /> Discussion Timer
        </label>
        <div className="flex gap-2">
          {[
            { label: '1 Min', val: 60 },
            { label: '2 Mins', val: 120 },
            { label: '3 Mins', val: 180 },
            { label: '5 Mins', val: 300 },
          ].map(t => (
            <button
              key={t.val}
              type="button"
              onClick={() => {
                sound.playPop();
                onChange({ ...config, timerSeconds: t.val });
              }}
              className={`flex-1 py-2 rounded-xl border-2 border-black text-xs font-black ${
                config.timerSeconds === t.val ? 'bg-[#BAE6FD] shadow-[2px_2px_0px_#000]' : 'bg-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <hr className="border-t-2 border-black/10 my-2" />

        {/* Undercover Mode Toggle */}
        <div
          onClick={() => handleToggle('undercoverMode')}
          className="flex items-center justify-between p-3 rounded-xl border-2 border-black bg-purple-50 cursor-pointer"
        >
          <div>
            <div className="text-xs font-black text-[#18181B]">🎭 Undercover Mode (Imposter Doesn't Know)</div>
            <div className="text-[11px] font-semibold text-gray-600">
              Imposter gets a sister-word instead of knowing they're imposter!
            </div>
          </div>
          <div
            className={`w-12 h-6 flex items-center rounded-full p-1 border-2 border-black cursor-pointer transition-colors ${
              config.undercoverMode ? 'bg-[#A7F3D0]' : 'bg-gray-200'
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full border-2 border-black shadow-md transform transition-transform ${
                config.undercoverMode ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </div>
        </div>

        {/* Hints Toggle */}
        <div
          onClick={() => handleToggle('hintsEnabled')}
          className="flex items-center justify-between p-3 rounded-xl border-2 border-black bg-yellow-50 cursor-pointer"
        >
          <div>
            <div className="text-xs font-black text-[#18181B]">💡 Give Hints to Imposter</div>
            <div className="text-[11px] font-semibold text-gray-600">
              Imposters receive 1-word &amp; 2-word topic clues.
            </div>
          </div>
          <div
            className={`w-12 h-6 flex items-center rounded-full p-1 border-2 border-black cursor-pointer transition-colors ${
              config.hintsEnabled ? 'bg-[#A7F3D0]' : 'bg-gray-200'
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full border-2 border-black shadow-md transform transition-transform ${
                config.hintsEnabled ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </div>
        </div>
      </div>

      {/* 4. Special Roles (Assistant & Jester) */}
      <div className="neo-card p-4 space-y-3 bg-white">
        <label className="text-sm font-black text-[#18181B] flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-purple-600" /> Special Roles
        </label>

        {/* Assistant Toggle */}
        <div
          onClick={() => handleToggle('enableAssistant')}
          className="flex items-center justify-between p-3 rounded-xl border-2 border-black bg-emerald-50 cursor-pointer"
        >
          <div>
            <div className="text-xs font-black text-[#18181B]">🤝 The Assistant</div>
            <div className="text-[11px] font-semibold text-gray-600">
              Secretly knows &amp; protects the imposter for +1 point.
            </div>
          </div>
          <div
            className={`w-12 h-6 flex items-center rounded-full p-1 border-2 border-black cursor-pointer transition-colors ${
              config.enableAssistant ? 'bg-[#A7F3D0]' : 'bg-gray-200'
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full border-2 border-black shadow-md transform transition-transform ${
                config.enableAssistant ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </div>
        </div>

        {/* Jester Toggle */}
        <div
          onClick={() => handleToggle('enableJester')}
          className="flex items-center justify-between p-3 rounded-xl border-2 border-black bg-fuchsia-50 cursor-pointer"
        >
          <div>
            <div className="text-xs font-black text-[#18181B]">🃏 The Jester</div>
            <div className="text-[11px] font-semibold text-gray-600">
              Wants to get voted out for +2 points!
            </div>
          </div>
          <div
            className={`w-12 h-6 flex items-center rounded-full p-1 border-2 border-black cursor-pointer transition-colors ${
              config.enableJester ? 'bg-[#A7F3D0]' : 'bg-gray-200'
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full border-2 border-black shadow-md transform transition-transform ${
                config.enableJester ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </div>
        </div>
      </div>

      {/* Start Game Action */}
      <button
        onClick={() => {
          sound.playPop();
          haptics.medium();
          onStart();
        }}
        className="w-full neo-btn py-4 bg-[#FEF08A] hover:bg-[#FDE047] text-lg font-black text-[#18181B]"
      >
        Start Game → Peek Roles 🤫
      </button>
    </div>
  );
};
