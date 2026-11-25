import React from 'react';
import { CHARADES_DECKS, CharadeDeck } from './data/charadesWords';
import { sound } from '../../services/soundboard';
import { haptics } from '../../services/haptics';
import { Sparkles, Clock, Check, ArrowLeft } from 'lucide-react';

export interface ForeheadConfig {
  selectedDecks: string[];
  roundSeconds: number;
}

interface ForeheadSettingsProps {
  config: ForeheadConfig;
  onChange: (config: ForeheadConfig) => void;
  onStart: () => void;
  onBack: () => void;
  playerCount: number;
}

export const ForeheadSettings: React.FC<ForeheadSettingsProps> = ({
  config,
  onChange,
  onStart,
  onBack,
  playerCount,
}) => {
  const toggleDeck = (deckId: string) => {
    sound.playPop();
    haptics.light();
    let updated: string[];
    if (config.selectedDecks.includes(deckId)) {
      if (config.selectedDecks.length === 1) return; // Keep at least one deck
      updated = config.selectedDecks.filter(id => id !== deckId);
    } else {
      updated = [...config.selectedDecks, deckId];
    }
    onChange({ ...config, selectedDecks: updated });
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6 pb-24 select-none">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => {
            sound.playPop();
            onBack();
          }}
          className="neo-btn neo-btn-sm px-3 py-1.5 bg-white text-xs font-black"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back
        </button>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 neo-card bg-[#A7F3D0] text-xs font-black uppercase">
          <Sparkles className="w-4 h-4" /> Forehead Pop! Settings
        </div>
      </div>

      {/* Deck Selection */}
      <div className="neo-card p-4 space-y-3 bg-white">
        <label className="text-sm font-black text-[#18181B]">
          🎭 Word Categories <span className="text-xs text-gray-500 font-bold">(Select 1 or more)</span>
        </label>

        <div className="space-y-2.5">
          {CHARADES_DECKS.map(deck => {
            const isSelected = config.selectedDecks.includes(deck.id);
            return (
              <button
                key={deck.id}
                type="button"
                onClick={() => toggleDeck(deck.id)}
                style={{ backgroundColor: isSelected ? deck.color : '#FFFFFF' }}
                className={`w-full p-3.5 rounded-2xl border-3 border-black text-left flex items-center justify-between transition-all ${
                  isSelected ? 'shadow-[3px_3px_0px_#000] scale-[1.01]' : 'opacity-70 hover:opacity-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{deck.emoji}</span>
                  <div>
                    <div className="text-sm font-black text-[#18181B]">{deck.name}</div>
                    <div className="text-[11px] font-semibold text-gray-700">{deck.description}</div>
                  </div>
                </div>
                <div
                  className={`w-6 h-6 rounded-full border-2 border-black flex items-center justify-center ${
                    isSelected ? 'bg-black text-white' : 'bg-transparent'
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Per-Player Timer */}
      <div className="neo-card p-4 space-y-3 bg-white">
        <label className="text-sm font-black text-[#18181B] flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-blue-500" /> Time Per Player
        </label>
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: '45s', val: 45 },
            { label: '60s', val: 60 },
            { label: '90s', val: 90 },
            { label: '120s', val: 120 },
          ].map(t => (
            <button
              key={t.val}
              type="button"
              onClick={() => {
                sound.playPop();
                onChange({ ...config, roundSeconds: t.val });
              }}
              className={`py-2.5 rounded-xl border-2 border-black text-xs font-black ${
                config.roundSeconds === t.val ? 'bg-[#FEF08A] shadow-[2px_2px_0px_#000]' : 'bg-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <p className="text-[11px] font-bold text-gray-500">
          Every player will get 1 turn ({playerCount} total turns). Points add to session total!
        </p>
      </div>

      {/* Start Button */}
      <button
        onClick={() => {
          sound.playPop();
          haptics.medium();
          onStart();
        }}
        className="w-full neo-btn py-4 bg-[#FEF08A] hover:bg-[#FDE047] text-lg font-black text-[#18181B]"
      >
        Start Game → First Player Turn 🚀
      </button>
    </div>
  );
};
