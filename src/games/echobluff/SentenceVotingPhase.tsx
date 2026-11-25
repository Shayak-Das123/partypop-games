import React, { useState } from 'react';
import { Player } from '../../services/db';
import { SentenceSubmission } from './SentenceCollectionPhase';
import { sound } from '../../services/soundboard';
import { haptics } from '../../services/haptics';
import { Bot, Check, Eye, Lock } from 'lucide-react';

interface SentenceVotingPhaseProps {
  players: Player[];
  mysterySubmission: SentenceSubmission;
  onVotesComplete: (votes: Record<string, string>) => void;
}

export const SentenceVotingPhase: React.FC<SentenceVotingPhaseProps> = ({
  players,
  mysterySubmission,
  onVotesComplete,
}) => {
  const [currentVoterIndex, setCurrentVoterIndex] = useState<number>(0);
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [selectedSuspectId, setSelectedSuspectId] = useState<string | null>(null);
  const [votes, setVotes] = useState<Record<string, string>>({});

  const currentVoter = players[currentVoterIndex];

  const handleUnlock = () => {
    sound.playSwipe();
    haptics.medium();
    setIsUnlocked(true);
  };

  const handleConfirmVote = () => {
    if (!selectedSuspectId) return;

    sound.playPop();
    haptics.success();

    const updatedVotes = {
      ...votes,
      [currentVoter.id]: selectedSuspectId,
    };

    setVotes(updatedVotes);
    setSelectedSuspectId(null);
    setIsUnlocked(false);

    if (currentVoterIndex < players.length - 1) {
      setCurrentVoterIndex(i => i + 1);
    } else {
      // All votes in! Proceed to dramatic reveal
      onVotesComplete(updatedVotes);
    }
  };

  // Locked Privacy Screen
  if (!isUnlocked) {
    return (
      <div className="w-full max-w-sm mx-auto space-y-6 select-none pb-12 text-center">
        <div className="p-6 rounded-3xl border-4 border-black bg-[#DDD6FE] shadow-[6px_6px_0px_#000] space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl border-3 border-black bg-white flex items-center justify-center text-3xl shadow-[3px_3px_0px_#000]">
            🗳️
          </div>

          <div className="space-y-1">
            <span className="neo-badge bg-white text-[11px] font-black uppercase text-purple-950">
              Voter {currentVoterIndex + 1} of {players.length}
            </span>
            <h2 className="text-2xl font-black text-[#18181B]">Pass Phone to</h2>
            <div className="text-3xl font-black text-[#18181B] flex items-center justify-center gap-2 pt-1">
              <span>{currentVoter.avatarEmoji}</span>
              <span>{currentVoter.name}</span>
            </div>
          </div>

          <p className="text-xs font-bold text-purple-900 leading-relaxed">
            Vote in secret! Did a player write this, or was it the AI?
          </p>
        </div>

        <button
          onClick={handleUnlock}
          className="w-full neo-btn py-4 bg-[#FEF08A] hover:bg-[#FDE047] text-lg font-black text-[#18181B] shadow-[4px_4px_0px_#000] flex items-center justify-center gap-2"
        >
          <Eye className="w-5 h-5 stroke-[2.5]" />
          I am {currentVoter.name} (Cast Ballot)
        </button>
      </div>
    );
  }

  // Active Ballot Screen
  return (
    <div className="w-full max-w-sm mx-auto space-y-4 select-none pb-12">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{currentVoter.avatarEmoji}</span>
          <span className="text-sm font-black text-[#18181B]">{currentVoter.name}'s Ballot</span>
        </div>
        <span className="neo-badge bg-[#DDD6FE] text-[10px] font-black text-purple-950">
          {currentVoterIndex + 1} / {players.length}
        </span>
      </div>

      {/* Reminder of the Sentence */}
      <div className="p-3.5 rounded-2xl border-3 border-black bg-white shadow-[2px_2px_0px_#000] text-center space-y-1">
        <div className="text-[10px] font-black uppercase tracking-wider text-purple-900">
          The Mystery Sentence
        </div>
        <div className="text-sm font-black text-[#18181B] italic">
          "{mysterySubmission.sentence}"
        </div>
      </div>

      {/* Voting Options: Players + AI Option */}
      <div className="space-y-2">
        <div className="text-xs font-black uppercase tracking-wider text-gray-500 px-1">
          Who Do You Think Said It?
        </div>

        {/* Players List */}
        <div className="grid grid-cols-2 gap-2">
          {players.map(p => {
            const isSelected = selectedSuspectId === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  sound.playPop();
                  setSelectedSuspectId(p.id);
                }}
                className={`p-3 rounded-2xl border-3 border-black flex items-center gap-2.5 transition-all active:scale-[0.98] ${
                  isSelected
                    ? 'bg-[#FEF08A] shadow-[3px_3px_0px_#000] scale-[1.02]'
                    : 'bg-white hover:bg-gray-50 shadow-[2px_2px_0px_#000]'
                }`}
              >
                <span className="text-2xl">{p.avatarEmoji}</span>
                <span className="text-xs font-black text-[#18181B] truncate">{p.name}</span>
                {isSelected && <Check className="w-4 h-4 ml-auto text-black stroke-[3]" />}
              </button>
            );
          })}
        </div>

        {/* The AI Imposter Option (Full Width Highlighted) */}
        <button
          type="button"
          onClick={() => {
            sound.playPop();
            setSelectedSuspectId('ai');
          }}
          className={`w-full p-3.5 rounded-2xl border-3 border-black flex items-center justify-between transition-all active:scale-[0.98] ${
            selectedSuspectId === 'ai'
              ? 'bg-[#DDD6FE] shadow-[3px_3px_0px_#000] scale-[1.01]'
              : 'bg-gradient-to-r from-purple-100 to-indigo-100 hover:from-purple-200 hover:to-indigo-200 shadow-[2px_2px_0px_#000]'
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">🤖</span>
            <div className="text-left">
              <div className="text-xs font-black text-purple-950 uppercase tracking-wide">
                The AI (Mystery Bot)
              </div>
              <div className="text-[10px] font-bold text-purple-900">
                Nobody in the room said this!
              </div>
            </div>
          </div>
          {selectedSuspectId === 'ai' && <Check className="w-5 h-5 text-purple-950 stroke-[3]" />}
        </button>
      </div>

      {/* Confirm Button */}
      <div className="pt-2">
        <button
          onClick={handleConfirmVote}
          disabled={!selectedSuspectId}
          className={`w-full neo-btn py-4 text-base font-black flex items-center justify-center gap-2 shadow-[4px_4px_0px_#000] ${
            selectedSuspectId
              ? 'bg-[#A7F3D0] hover:bg-[#86EFAC] text-[#18181B]'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed border-gray-400 shadow-none'
          }`}
        >
          <Lock className="w-5 h-5 stroke-[2.5]" />
          Lock In Vote
        </button>
      </div>
    </div>
  );
};
