import React, { useState } from 'react';
import { Player } from '../../services/db';
import { sound } from '../../services/soundboard';
import { haptics } from '../../services/haptics';
import { Shield, Check, Vote, ArrowRight, AlertTriangle } from 'lucide-react';

interface FakeArtistBallotProps {
  players: Player[];
  playerColorMap: Map<string, string>;
  onCompleteBallot: (
    accusedPlayerId: string,
    voteCounts: Record<string, number>,
    votes: Record<string, string>
  ) => void;
}

export const FakeArtistBallot: React.FC<FakeArtistBallotProps> = ({
  players,
  playerColorMap,
  onCompleteBallot,
}) => {
  const [currentVoterIndex, setCurrentVoterIndex] = useState<number>(0);
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const [collectedVotes, setCollectedVotes] = useState<Record<string, string>>({});
  const [isPrivacyCurtain, setIsPrivacyCurtain] = useState<boolean>(true);
  const [isTallyPhase, setIsTallyPhase] = useState<boolean>(false);

  const activeVoter = players[currentVoterIndex];
  const isLastVote = currentVoterIndex === players.length - 1;

  const handleSelectTarget = (targetId: string) => {
    sound.playPop();
    haptics.light();
    setSelectedTargetId(targetId);
  };

  const handleConfirmVote = () => {
    if (!selectedTargetId) return;

    sound.playPop();
    haptics.medium();

    const updatedVotes = {
      ...collectedVotes,
      [activeVoter.id]: selectedTargetId,
    };
    setCollectedVotes(updatedVotes);

    if (isLastVote) {
      sound.playFanfare();
      setIsTallyPhase(true);
    } else {
      setSelectedTargetId(null);
      setCurrentVoterIndex(idx => idx + 1);
      setIsPrivacyCurtain(true);
    }
  };

  // Compute tally when in tally phase
  const computeTally = () => {
    const counts: Record<string, number> = {};
    players.forEach(p => (counts[p.id] = 0));
    Object.values(collectedVotes).forEach(targetId => {
      if (counts[targetId] !== undefined) {
        counts[targetId]++;
      }
    });

    let maxVotes = 0;
    Object.values(counts).forEach(c => {
      if (c > maxVotes) maxVotes = c;
    });

    const topCandidates = Object.keys(counts).filter(
      pid => counts[pid] === maxVotes && maxVotes > 0
    );

    return { counts, maxVotes, topCandidates };
  };

  // 1. TALLY REVEAL SCREEN
  if (isTallyPhase) {
    const { counts, maxVotes, topCandidates } = computeTally();
    const sortedPlayers = [...players].sort((a, b) => (counts[b.id] || 0) - (counts[a.id] || 0));
    const isTie = topCandidates.length > 1;

    return (
      <div className="w-full max-w-sm mx-auto neo-card-lg p-6 text-center space-y-5 bg-white select-none my-auto">
        <div className="text-4xl animate-bounce">📊</div>

        <div className="space-y-1">
          <span className="neo-badge bg-[#E0E7FF] text-xs font-black uppercase text-indigo-950">
            Ballot Tally Complete
          </span>
          <h2 className="text-2xl font-black text-[#18181B]">The Votes Are In!</h2>
          <p className="text-xs font-bold text-gray-500">
            {players.length} secret ballots counted
          </p>
        </div>

        {/* Vote Counts List */}
        <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
          {sortedPlayers.map(p => {
            const pVotes = counts[p.id] || 0;
            const pColor = playerColorMap.get(p.id) || '#000';
            const isTop = topCandidates.includes(p.id);

            return (
              <div
                key={p.id}
                className={`p-2.5 rounded-xl border-2 border-black flex items-center justify-between text-xs font-black transition-all ${
                  isTop && !isTie
                    ? 'bg-[#FEF08A] shadow-[2px_2px_0px_#000]'
                    : isTop && isTie
                    ? 'bg-[#FED7AA] shadow-[2px_2px_0px_#000]'
                    : 'bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{p.avatarEmoji}</span>
                  <span className="text-[#18181B] font-extrabold">{p.name}</span>
                  <span
                    className="w-3 h-3 rounded-full border border-black inline-block"
                    style={{ backgroundColor: pColor }}
                    title="Player drawing color"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`px-2 py-0.5 rounded-lg border border-black text-xs font-mono font-black ${
                      pVotes > 0 ? 'bg-white text-black' : 'bg-transparent text-gray-400'
                    }`}
                  >
                    {pVotes} {pVotes === 1 ? 'vote' : 'votes'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Verdict / Action */}
        {!isTie && topCandidates.length > 0 ? (
          <div className="space-y-3 pt-2">
            {(() => {
              const accused = players.find(p => p.id === topCandidates[0]);
              return (
                <>
                  <div className="p-3 rounded-2xl border-3 border-black bg-[#FEF3C7] text-amber-950 space-y-1 shadow-[2px_2px_0px_#000]">
                    <div className="text-xs font-black uppercase text-amber-800">Most Accused</div>
                    <div className="text-lg font-black flex items-center justify-center gap-2">
                      <span>{accused?.avatarEmoji}</span>
                      <span>{accused?.name}</span>
                      <span className="text-xs font-bold text-gray-700">({maxVotes} votes)</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      sound.playBuzzer();
                      haptics.heavy();
                      onCompleteBallot(topCandidates[0], counts, collectedVotes);
                    }}
                    className="w-full neo-btn py-4 bg-[#A7F3D0] hover:bg-[#86EFAC] text-base font-black text-[#18181B] flex items-center justify-center gap-2"
                  >
                    Accuse {accused?.name} 🎯
                  </button>
                </>
              );
            })()}
          </div>
        ) : isTie ? (
          <div className="space-y-2.5 pt-2">
            <div className="p-3 rounded-2xl border-3 border-black bg-[#FED7AA] text-amber-950 space-y-1">
              <div className="flex items-center justify-center gap-1 text-xs font-black uppercase text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-700" /> Tie Detected! ({maxVotes} votes each)
              </div>
              <p className="text-[11px] font-bold text-amber-900">
                Room consensus: choose which tied player to accuse:
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {topCandidates.map(candidateId => {
                const cand = players.find(p => p.id === candidateId);
                return (
                  <button
                    key={candidateId}
                    onClick={() => {
                      sound.playBuzzer();
                      haptics.heavy();
                      onCompleteBallot(candidateId, counts, collectedVotes);
                    }}
                    className="w-full neo-btn py-3 bg-[#FEF08A] hover:bg-[#FDE047] text-sm font-black text-[#18181B] flex items-center justify-between px-4"
                  >
                    <span className="flex items-center gap-2">
                      <span>{cand?.avatarEmoji}</span>
                      <span>Accuse {cand?.name}</span>
                    </span>
                    <span>🎯</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  // 2. PRIVACY HANDOFF SCREEN
  if (isPrivacyCurtain) {
    return (
      <div className="w-full max-w-sm mx-auto neo-card-lg p-6 text-center space-y-6 bg-[#FEF08A] select-none my-auto">
        <div className="w-16 h-16 mx-auto rounded-full border-3 border-black bg-white flex items-center justify-center shadow-[3px_3px_0px_#000]">
          <Shield className="w-8 h-8 text-yellow-700" />
        </div>

        <div className="space-y-1">
          <div className="text-xs font-black uppercase tracking-wider text-gray-700">
            Confidential Ballot ({currentVoterIndex + 1}/{players.length})
          </div>
          <div className="text-2xl font-black text-[#18181B]">Pass phone to:</div>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl border-3 border-black bg-white shadow-[3px_3px_0px_#000] my-2">
            <span className="text-3xl">{activeVoter.avatarEmoji}</span>
            <span className="text-2xl font-black">{activeVoter.name}</span>
          </div>
        </div>

        <p className="text-xs font-bold text-gray-700">
          Make sure no one is peeking at your screen before tapping unlock!
        </p>

        <button
          onClick={() => {
            sound.playPop();
            haptics.light();
            setIsPrivacyCurtain(false);
          }}
          className="w-full neo-btn py-4 bg-[#A7F3D0] hover:bg-[#86EFAC] text-lg font-black text-[#18181B]"
        >
          I am {activeVoter.name} → Vote 🗳️
        </button>
      </div>
    );
  }

  // 3. VOTING SCREEN FOR CURRENT PLAYER
  const candidateList = players.filter(p => p.id !== activeVoter.id);

  return (
    <div className="w-full max-w-sm mx-auto space-y-4 select-none pb-12">
      {/* Header */}
      <div className="text-center space-y-1">
        <span className="neo-badge bg-[#E0E7FF] text-xs font-black uppercase text-indigo-950">
          Vote {currentVoterIndex + 1} of {players.length}
        </span>
        <h2 className="text-2xl font-black text-[#18181B]">
          Who does {activeVoter.name} suspect?
        </h2>
        <p className="text-xs font-bold text-gray-500">
          Pick who you think is the Fake Artist based on the drawing strokes:
        </p>
      </div>

      {/* Target Candidates List */}
      <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
        {candidateList.map(candidate => {
          const isSelected = selectedTargetId === candidate.id;
          const candidateColor = playerColorMap.get(candidate.id) || '#000';

          return (
            <button
              key={candidate.id}
              type="button"
              onClick={() => handleSelectTarget(candidate.id)}
              className={`w-full p-3.5 rounded-2xl border-3 border-black flex items-center justify-between transition-all ${
                isSelected
                  ? 'bg-[#FEF08A] shadow-[4px_4px_0px_#000] scale-[1.02]'
                  : 'bg-white hover:bg-gray-50 shadow-[2px_2px_0px_#000]'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{candidate.avatarEmoji}</span>
                <div className="text-left">
                  <div className="text-base font-extrabold text-[#18181B]">{candidate.name}</div>
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-500">
                    <span
                      className="w-2.5 h-2.5 rounded-full border border-black inline-block"
                      style={{ backgroundColor: candidateColor }}
                    />
                    <span>Stroke Color</span>
                  </div>
                </div>
              </div>
              <div
                className={`w-7 h-7 rounded-full border-2 border-black flex items-center justify-center ${
                  isSelected ? 'bg-black text-white' : 'bg-transparent'
                }`}
              >
                {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
              </div>
            </button>
          );
        })}
      </div>

      {/* Confirm Vote Button */}
      <div className="pt-2">
        <button
          disabled={!selectedTargetId}
          onClick={handleConfirmVote}
          className={`w-full neo-btn py-4 text-base font-black text-[#18181B] flex items-center justify-center gap-2 ${
            selectedTargetId
              ? 'bg-[#A7F3D0] hover:bg-[#86EFAC]'
              : 'bg-gray-200 opacity-50 cursor-not-allowed'
          }`}
        >
          {isLastVote ? 'Submit Final Vote → Tally 📊' : 'Submit & Pass to Next ➡️'}
        </button>
      </div>
    </div>
  );
};
