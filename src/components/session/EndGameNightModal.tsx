import React, { useState, useEffect } from 'react';
import { Session, computeAllPlayerProfiles, archiveSession } from '../../services/db';
import { sound } from '../../services/soundboard';
import confetti from 'canvas-confetti';
import { Trophy, Award, Sparkles, X, RotateCcw, CheckCircle, Camera } from 'lucide-react';
import { SessionMemoriesModal } from './SessionMemoriesModal';

interface EndGameNightModalProps {
  session: Session;
  onClose: () => void;
  onStartNewSession: () => void;
}

export const EndGameNightModal: React.FC<EndGameNightModalProps> = ({
  session,
  onClose,
  onStartNewSession,
}) => {
  const [isMemoriesOpen, setIsMemoriesOpen] = useState<boolean>(false);

  const sortedPlayers = [...session.players].sort(
    (a, b) => (session.cumulativeScores[b.id] || 0) - (session.cumulativeScores[a.id] || 0)
  );

  const profiles = computeAllPlayerProfiles(session);
  const profilesMap = new Map(profiles.map(p => [p.playerId, p]));

  useEffect(() => {
    sound.playFanfare();
    confetti({
      particleCount: 150,
      spread: 90,
      origin: { y: 0.4 },
    });
    const interval = setTimeout(() => {
      confetti({
        particleCount: 80,
        angle: 60,
        spread: 60,
        origin: { x: 0 },
      });
      confetti({
        particleCount: 80,
        angle: 120,
        spread: 60,
        origin: { x: 1 },
      });
    }, 400);

    return () => clearTimeout(interval);
  }, []);

  const handleFinishTonight = async () => {
    sound.playSuccess();
    await archiveSession(session.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in select-none">
      <div className="w-full max-w-md bg-[#FFFDF7] border-4 border-black rounded-3xl p-5 space-y-4 shadow-[10px_10px_0px_#000] max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-black pb-3">
          <div className="flex items-center gap-2">
            <span className="text-3xl animate-bounce">🏆</span>
            <div>
              <h2 className="text-xl font-black text-[#18181B] leading-none">Game Night Finale</h2>
              <p className="text-[11px] font-bold text-gray-500">
                {session.title} • {session.history.length} Rounds Played
              </p>
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

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* PODIUM (Top 3) */}
          {sortedPlayers.length >= 2 ? (
            <div className="pt-4 pb-2 px-1">
              <div className="grid grid-cols-3 gap-2 items-end text-center">
                {/* 2nd Place */}
                {sortedPlayers[1] && (
                  <div className="flex flex-col items-center">
                    <div className="text-xl">🥈</div>
                    <div className="text-2xl -mt-1">{sortedPlayers[1].avatarEmoji}</div>
                    <div className="text-xs font-black truncate max-w-full text-gray-800">
                      {sortedPlayers[1].name}
                    </div>
                    <div className="w-full bg-[#E2E8F0] border-3 border-black rounded-t-xl pt-3 pb-2 mt-1 shadow-[2px_2px_0px_#000]">
                      <div className="text-xs font-mono font-black text-gray-800">
                        {session.cumulativeScores[sortedPlayers[1].id] || 0}
                      </div>
                      <div className="text-[9px] font-black uppercase text-gray-500">2nd</div>
                    </div>
                  </div>
                )}

                {/* 1st Place */}
                {sortedPlayers[0] && (
                  <div className="flex flex-col items-center">
                    <div className="text-2xl animate-pulse">👑</div>
                    <div className="text-3xl -mt-1">{sortedPlayers[0].avatarEmoji}</div>
                    <div className="text-xs font-black truncate max-w-full text-amber-950 font-extrabold">
                      {sortedPlayers[0].name}
                    </div>
                    <div className="w-full bg-[#FEF08A] border-3 border-black rounded-t-xl pt-5 pb-2 mt-1 shadow-[3px_3px_0px_#000]">
                      <div className="text-sm font-mono font-black text-amber-950">
                        {session.cumulativeScores[sortedPlayers[0].id] || 0} pts
                      </div>
                      <div className="text-[10px] font-black uppercase text-amber-900">Champion 🥇</div>
                    </div>
                  </div>
                )}

                {/* 3rd Place */}
                {sortedPlayers[2] && (
                  <div className="flex flex-col items-center">
                    <div className="text-xl">🥉</div>
                    <div className="text-2xl -mt-1">{sortedPlayers[2].avatarEmoji}</div>
                    <div className="text-xs font-black truncate max-w-full text-amber-900">
                      {sortedPlayers[2].name}
                    </div>
                    <div className="w-full bg-[#FED7AA] border-3 border-black rounded-t-xl pt-2 pb-2 mt-1 shadow-[2px_2px_0px_#000]">
                      <div className="text-xs font-mono font-black text-amber-950">
                        {session.cumulativeScores[sortedPlayers[2].id] || 0}
                      </div>
                      <div className="text-[9px] font-black uppercase text-amber-800">3rd</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : null}

          {/* Complete Standings List */}
          <div className="space-y-2">
            <div className="text-xs font-black uppercase tracking-wider text-gray-500 px-1 flex items-center justify-between">
              <span>Final Standings</span>
              <span>Total Points</span>
            </div>

            {sortedPlayers.map((p, idx) => {
              const pts = session.cumulativeScores[p.id] || 0;
              const prof = profilesMap.get(p.id);

              return (
                <div
                  key={p.id}
                  className={`p-3 rounded-2xl border-3 border-black flex items-center justify-between shadow-[2px_2px_0px_#000] ${
                    idx === 0
                      ? 'bg-[#FEF08A]'
                      : idx === 1
                      ? 'bg-slate-100'
                      : idx === 2
                      ? 'bg-amber-100'
                      : 'bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm font-black text-gray-500 w-5">#{idx + 1}</span>
                    <span className="text-2xl">{p.avatarEmoji}</span>
                    <div>
                      <div className="text-sm font-black text-[#18181B] leading-snug">{p.name}</div>
                      {prof && (
                        <div className="text-[10px] font-black text-gray-600 flex items-center gap-1">
                          <span>{prof.primaryEmoji}</span>
                          <span>{prof.primaryTitle}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-base font-black px-3 py-1 rounded-xl border-2 border-black bg-white font-mono shadow-[1px_1px_0px_#000]">
                    {pts} pts
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 border-t-2 border-black space-y-2">
          <button
            onClick={() => {
              sound.playPop();
              setIsMemoriesOpen(true);
            }}
            className="w-full neo-btn py-3 bg-[#FEF08A] hover:bg-[#FDE047] text-xs font-black text-amber-950 flex items-center justify-center gap-1.5 shadow-[2px_2px_0px_#000]"
          >
            <Camera className="w-4 h-4 text-amber-900" />
            📸 Save Tonight’s Memories (Photos &amp; YouTube Videos)
          </button>

          <button
            onClick={() => {
              sound.playPop();
              onStartNewSession();
            }}
            className="w-full neo-btn py-3.5 bg-[#A7F3D0] hover:bg-[#86EFAC] text-sm font-black text-[#18181B] flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4 stroke-[3]" /> Start A Fresh Game Night
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleFinishTonight}
              className="neo-btn neo-btn-sm py-2.5 bg-gray-100 hover:bg-gray-200 text-xs font-black text-gray-800 flex items-center justify-center gap-1"
            >
              <CheckCircle className="w-3.5 h-3.5" /> Archive Night
            </button>
            <button
              onClick={() => {
                sound.playPop();
                onClose();
              }}
              className="neo-btn neo-btn-sm py-2.5 bg-white hover:bg-gray-50 text-xs font-black text-[#18181B]"
            >
              Back to Hub 🏠
            </button>
          </div>
        </div>
      </div>

      {isMemoriesOpen && (
        <SessionMemoriesModal
          session={session}
          onClose={() => setIsMemoriesOpen(false)}
        />
      )}
    </div>
  );
};
