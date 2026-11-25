import React from 'react';
import { Session, manuallyAdjustPlayerScore } from '../../services/db';
import { sound } from '../../services/soundboard';
import { haptics } from '../../services/haptics';
import { X, Scale, Plus, Minus } from 'lucide-react';

interface ScoreAdjustModalProps {
  session: Session;
  onClose: () => void;
}

export const ScoreAdjustModal: React.FC<ScoreAdjustModalProps> = ({ session, onClose }) => {
  const handleAdjust = async (playerId: string, delta: number) => {
    if (delta > 0) {
      sound.playSuccess();
      haptics.light();
    } else {
      sound.playPop();
      haptics.light();
    }
    await manuallyAdjustPlayerScore(session.id, playerId, delta);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in select-none">
      <div className="w-full max-w-md bg-white border-4 border-black rounded-3xl p-5 space-y-4 shadow-[8px_8px_0px_#000] max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-black pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl border-2 border-black bg-[#FEF08A]">
              <Scale className="w-5 h-5 text-amber-950" />
            </div>
            <div>
              <h2 className="text-lg font-black text-[#18181B] leading-none">Score Adjuster</h2>
              <p className="text-[11px] font-bold text-gray-500">Fine-tune player points manually</p>
            </div>
          </div>
          <button
            onClick={() => {
              sound.playPop();
              onClose();
            }}
            className="p-1.5 rounded-xl border-2 border-black hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Players List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
          {session.players.map(player => {
            const currentScore = session.cumulativeScores[player.id] || 0;

            return (
              <div
                key={player.id}
                className="p-3 rounded-2xl border-3 border-black bg-gray-50 flex items-center justify-between gap-2 shadow-[2px_2px_0px_#000]"
              >
                {/* Player info */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-2xl">{player.avatarEmoji}</span>
                  <div className="truncate">
                    <div className="text-sm font-black text-[#18181B] truncate">{player.name}</div>
                    <div className="text-xs font-bold text-amber-800 font-mono">
                      {currentScore} pts
                    </div>
                  </div>
                </div>

                {/* Steppers */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleAdjust(player.id, -5)}
                    className="px-2 py-1 text-xs font-black rounded-lg border-2 border-black bg-rose-100 text-rose-950 hover:bg-rose-200 active:translate-y-0.5"
                    title="-5 points"
                  >
                    -5
                  </button>
                  <button
                    onClick={() => handleAdjust(player.id, -1)}
                    className="p-1.5 rounded-lg border-2 border-black bg-rose-200 text-rose-950 hover:bg-rose-300 active:translate-y-0.5"
                    title="-1 point"
                  >
                    <Minus className="w-3.5 h-3.5 stroke-[3]" />
                  </button>

                  <span className="w-8 text-center text-sm font-black font-mono">
                    {currentScore}
                  </span>

                  <button
                    onClick={() => handleAdjust(player.id, 1)}
                    className="p-1.5 rounded-lg border-2 border-black bg-emerald-200 text-emerald-950 hover:bg-emerald-300 active:translate-y-0.5"
                    title="+1 point"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  </button>
                  <button
                    onClick={() => handleAdjust(player.id, 5)}
                    className="px-2 py-1 text-xs font-black rounded-lg border-2 border-black bg-emerald-100 text-emerald-950 hover:bg-emerald-200 active:translate-y-0.5"
                    title="+5 points"
                  >
                    +5
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t-2 border-black">
          <button
            onClick={() => {
              sound.playPop();
              onClose();
            }}
            className="w-full neo-btn py-3 bg-[#FEF08A] hover:bg-[#FDE047] text-sm font-black text-[#18181B]"
          >
            Done Adjusting ✓
          </button>
        </div>
      </div>
    </div>
  );
};
