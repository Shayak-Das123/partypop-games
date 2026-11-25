import React, { useState } from 'react';
import { Player } from '../../services/db';
import { sound } from '../../services/soundboard';
import { haptics } from '../../services/haptics';
import { Vote, Check, Shield, User } from 'lucide-react';

interface VotingBallotProps {
  players: Player[];
  onCompleteVotes: (votes: Record<string, string>) => void;
}

export const VotingBallot: React.FC<VotingBallotProps> = ({ players, onCompleteVotes }) => {
  const [currentVoterIndex, setCurrentVoterIndex] = useState<number>(0);
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const [collectedVotes, setCollectedVotes] = useState<Record<string, string>>({});
  const [isPrivacyCurtain, setIsPrivacyCurtain] = useState<boolean>(true);

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
      onCompleteVotes(updatedVotes);
    } else {
      setSelectedTargetId(null);
      setCurrentVoterIndex(idx => idx + 1);
      setIsPrivacyCurtain(true); // Put up privacy screen for next person
    }
  };

  // Privacy handoff screen
  if (isPrivacyCurtain) {
    return (
      <div className="w-full max-w-sm mx-auto neo-card-lg p-6 text-center space-y-6 bg-[#FEF08A] select-none my-auto">
        <div className="w-16 h-16 mx-auto rounded-full border-3 border-black bg-white flex items-center justify-center shadow-[3px_3px_0px_#000]">
          <Shield className="w-8 h-8 text-yellow-700" />
        </div>

        <div className="space-y-1">
          <div className="text-xs font-black uppercase tracking-wider text-gray-700">Confidential Ballot</div>
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

  // Eligible targets (cannot vote for yourself)
  const candidateList = players.filter(p => p.id !== activeVoter.id);

  return (
    <div className="w-full max-w-sm mx-auto space-y-4 select-none pb-12">
      {/* Header */}
      <div className="text-center space-y-1">
        <span className="neo-badge bg-[#FECDD3] text-xs font-black">
          Vote {currentVoterIndex + 1} of {players.length}
        </span>
        <h2 className="text-2xl font-black text-[#18181B]">Who is {activeVoter.name} voting for?</h2>
        <p className="text-xs font-bold text-gray-500">Pick who you suspect is the Imposter</p>
      </div>

      {/* Target Candidates List */}
      <div className="space-y-2.5">
        {candidateList.map(candidate => {
          const isSelected = selectedTargetId === candidate.id;
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
                <span className="text-base font-extrabold text-[#18181B]">{candidate.name}</span>
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
          className={`w-full neo-btn py-4 text-base font-black text-[#18181B] ${
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
