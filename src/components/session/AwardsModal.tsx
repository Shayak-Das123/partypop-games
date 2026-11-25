import React, { useEffect, useState } from 'react';
import { Session, computeAllPlayerProfiles, computeSessionAwards } from '../../services/db';
import { sound } from '../../services/soundboard';
import confetti from 'canvas-confetti';
import { Trophy, Award, X, Sparkles, Tag, Users } from 'lucide-react';

interface AwardsModalProps {
  session: Session;
  onClose: () => void;
}

export const AwardsModal: React.FC<AwardsModalProps> = ({ session, onClose }) => {
  const profiles = computeAllPlayerProfiles(session);
  const topAwards = computeSessionAwards(session);
  const [tab, setTab] = useState<'profiles' | 'podium'>('profiles');

  useEffect(() => {
    sound.playFanfare();
    confetti({ particleCount: 75, spread: 65, origin: { y: 0.5 } });
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 select-none">
      <div className="w-full max-w-md neo-card-lg bg-[#FFFDF7] p-5 space-y-4 animate-pop max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-500" />
            <div>
              <h2 className="text-xl font-black text-[#18181B]">Player Tags &amp; Awards</h2>
              <p className="text-[10px] font-bold text-gray-500">
                {session.history.length} rounds analyzed
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              sound.playPop();
              onClose();
            }}
            className="w-8 h-8 rounded-full border-2 border-black bg-white flex items-center justify-center active:bg-gray-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 gap-2 bg-gray-100 p-1 rounded-xl border-2 border-black">
          <button
            onClick={() => {
              sound.playPop();
              setTab('profiles');
            }}
            className={`py-1.5 rounded-lg text-xs font-black transition-all ${
              tab === 'profiles' ? 'bg-[#FEF08A] border-2 border-black shadow-[2px_2px_0px_#000]' : 'text-gray-600'
            }`}
          >
            🏷️ All Player Tags ({profiles.length})
          </button>
          <button
            onClick={() => {
              sound.playPop();
              setTab('podium');
            }}
            className={`py-1.5 rounded-lg text-xs font-black transition-all ${
              tab === 'podium' ? 'bg-[#A7F3D0] border-2 border-black shadow-[2px_2px_0px_#000]' : 'text-gray-600'
            }`}
          >
            👑 Top Trophies
          </button>
        </div>

        {/* Profiles Content: Tags & Performance for EVERY Player */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {tab === 'profiles' ? (
            profiles.length > 0 ? (
              profiles.map(p => (
                <div
                  key={p.playerId}
                  className="p-3.5 rounded-2xl border-3 border-black bg-white shadow-[3px_3px_0px_#000] space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{p.avatarEmoji}</span>
                      <div>
                        <div className="text-base font-black text-[#18181B]">{p.playerName}</div>
                        <div className="inline-flex items-center gap-1 text-xs font-black text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-300">
                          <span>{p.primaryEmoji}</span>
                          <span>{p.primaryTitle}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-base font-black font-mono px-2.5 py-1 rounded-xl border-2 border-black bg-[#FEF08A]">
                        {p.totalScore} pts
                      </div>
                    </div>
                  </div>

                  <p className="text-xs font-bold text-gray-700 italic bg-amber-50/60 p-2 rounded-xl border border-amber-200">
                    "{p.summary}"
                  </p>

                  {/* Player Tags */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {p.tags.map((t, idx) => (
                      <span
                        key={idx}
                        className="neo-badge bg-[#E0E7FF] text-[#3730A3] text-[10px] font-black"
                      >
                        <Tag className="w-2.5 h-2.5 mr-0.5" /> {t}
                      </span>
                    ))}
                  </div>

                  {/* Micro Performance Stats */}
                  <div className="grid grid-cols-3 gap-1 pt-1 text-center text-[10px] font-bold text-gray-600 border-t border-black/10">
                    <div>
                      <span className="text-black font-black">{p.stats.imposterCorrectVotes}</span> correct votes
                    </div>
                    <div>
                      <span className="text-black font-black">{p.stats.charadesWordsGuessed}</span> charades
                    </div>
                    <div>
                      <span className="text-black font-black">{p.stats.timesEliminated}</span> eliminated
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-xs font-bold text-gray-500">
                No players in this session.
              </div>
            )
          ) : (
            /* Podium Trophies */
            <div className="space-y-3">
              {topAwards.length > 0 ? (
                topAwards.map(award => (
                  <div
                    key={award.id}
                    className="p-4 rounded-2xl border-3 border-black bg-gradient-to-r from-amber-50 to-yellow-100 shadow-[3px_3px_0px_#000] space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border-2 border-black bg-white text-xs font-black">
                        <span>{award.emoji}</span>
                        <span>{award.title}</span>
                      </div>
                      <span className="text-xs font-black text-amber-900 bg-amber-200/70 px-2 py-0.5 rounded-md border border-amber-800">
                        {award.score}
                      </span>
                    </div>

                    <div className="text-xl font-black text-[#18181B]">{award.recipientName}</div>
                    <p className="text-xs font-semibold text-gray-700">{award.description}</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-xs font-bold text-gray-500">
                  Play more rounds to unlock session trophies!
                </div>
              )}
            </div>
          )}
        </div>

        <button
          onClick={() => {
            sound.playPop();
            onClose();
          }}
          className="w-full neo-btn py-3.5 bg-[#FEF08A] hover:bg-[#FDE047] text-base font-black text-[#18181B]"
        >
          Back to Party! 🚀
        </button>
      </div>
    </div>
  );
};
