import React, { useState } from 'react';
import { Player } from '../../services/db';
import { SentenceSubmission } from './SentenceCollectionPhase';
import { EchoRoundResult } from './EchoScoringEngine';
import { sound } from '../../services/soundboard';
import { haptics } from '../../services/haptics';
import confetti from 'canvas-confetti';
import { Bot, Sparkles, Trophy, ArrowRight, Eye, ShieldAlert } from 'lucide-react';

interface SentenceRevealPhaseProps {
  players: Player[];
  mysterySubmission: SentenceSubmission;
  roundResult: EchoRoundResult;
  onProceedToStandings: () => void;
}

export const SentenceRevealPhase: React.FC<SentenceRevealPhaseProps> = ({
  players,
  mysterySubmission,
  roundResult,
  onProceedToStandings,
}) => {
  const [isRevealed, setIsRevealed] = useState<boolean>(false);

  const handleReveal = () => {
    setIsRevealed(true);
    if (roundResult.isAiAuthor && roundResult.outcomeTitle.includes('TRICKED')) {
      sound.playBuzzer();
      haptics.heavy();
    } else {
      sound.playFanfare();
      haptics.success();
      confetti({ particleCount: 90, spread: 75, origin: { y: 0.5 } });
    }
  };

  // Pre-Reveal Suspense Curtain
  if (!isRevealed) {
    return (
      <div className="w-full max-w-sm mx-auto space-y-6 select-none pb-12 text-center">
        <div className="p-6 rounded-3xl border-4 border-black bg-[#DDD6FE] shadow-[6px_6px_0px_#000] space-y-4">
          <div className="text-6xl animate-bounce">🎭</div>
          <h2 className="text-3xl font-black text-[#18181B]">Votes Are Locked!</h2>
          <p className="text-xs font-bold text-purple-950 leading-relaxed">
            All ballots are in. Is the sentence from one of your friends, or did the AI sneak in?
          </p>

          <div className="p-3 rounded-2xl border-3 border-black bg-white italic font-black text-sm">
            "{mysterySubmission.sentence}"
          </div>
        </div>

        <button
          onClick={handleReveal}
          className="w-full neo-btn py-5 bg-[#FEF08A] hover:bg-[#FDE047] text-xl font-black text-[#18181B] shadow-[5px_5px_0px_#000] flex items-center justify-center gap-2"
        >
          <Eye className="w-6 h-6 stroke-[3]" />
          Reveal True Author!
        </button>
      </div>
    );
  }

  // Revealed Outcome
  const authorPlayer = players.find(p => p.id === roundResult.actualAuthorId);

  return (
    <div className="w-full max-w-sm mx-auto space-y-5 select-none pb-12">
      {/* Big Outcome Banner */}
      <div
        className={`p-5 rounded-3xl border-4 border-black shadow-[6px_6px_0px_#000] text-center space-y-2 ${
          roundResult.isAiAuthor
            ? roundResult.outcomeTitle.includes('TRICKED')
              ? 'bg-[#FECDD3]'
              : 'bg-[#BAE6FD]'
            : 'bg-[#A7F3D0]'
        }`}
      >
        <div className="text-5xl">
          {roundResult.isAiAuthor ? '🤖' : authorPlayer?.avatarEmoji || '🎭'}
        </div>

        <h2 className="text-2xl font-black text-[#18181B] tracking-tight">
          {roundResult.outcomeTitle}
        </h2>

        <div className="p-2.5 rounded-xl border-2 border-black bg-white text-xs font-bold text-gray-800 leading-tight">
          {roundResult.outcomeDescription}
        </div>
      </div>

      {/* The Sentence Reminder */}
      <div className="p-3.5 rounded-2xl border-3 border-black bg-white shadow-[2px_2px_0px_#000] text-center">
        <div className="text-[10px] font-black uppercase text-gray-500">The Sentence Was</div>
        <div className="text-base font-black text-[#18181B] italic">"{mysterySubmission.sentence}"</div>
        <div className="text-xs font-bold text-purple-700 mt-1">
          True Author: <span className="font-black text-black">{roundResult.actualAuthorName}</span>
        </div>
      </div>

      {/* Ballot Votes Breakdown */}
      <div className="neo-card p-4 bg-white border-3 border-black space-y-2.5 shadow-[3px_3px_0px_#000]">
        <div className="text-xs font-black uppercase tracking-wider text-gray-800">
          Who Voted For Whom
        </div>
        <div className="space-y-1.5 text-xs font-bold">
          {players.map(p => {
            const suspectId = roundResult.votes[p.id];
            const suspectPlayer = players.find(s => s.id === suspectId);
            const suspectLabel = suspectId === 'ai' ? '🤖 The AI' : suspectPlayer ? `${suspectPlayer.avatarEmoji} ${suspectPlayer.name}` : 'Unknown';
            const delta = roundResult.scoreDeltas[p.id] || 0;

            return (
              <div
                key={p.id}
                className="p-2 rounded-xl border-2 border-black bg-gray-50 flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <span>{p.avatarEmoji}</span>
                  <span className="font-black text-[#18181B]">{p.name}</span>
                  <span className="text-gray-500 font-semibold">voted</span>
                  <span className="font-black text-purple-900">{suspectLabel}</span>
                </div>
                <div
                  className={`font-black text-xs px-2 py-0.5 rounded-lg border border-black ${
                    delta > 0
                      ? 'bg-emerald-100 text-emerald-900'
                      : delta < 0
                      ? 'bg-red-100 text-red-900'
                      : 'bg-white text-gray-600'
                  }`}
                >
                  {delta > 0 ? `+${delta}` : delta} pts
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Continue to Standings */}
      <div className="pt-2">
        <button
          onClick={onProceedToStandings}
          className="w-full neo-btn py-4 bg-[#FEF08A] hover:bg-[#FDE047] text-lg font-black text-[#18181B] shadow-[4px_4px_0px_#000] flex items-center justify-center gap-2"
        >
          View Standings &amp; Save Points <ArrowRight className="w-5 h-5 stroke-[3]" />
        </button>
      </div>
    </div>
  );
};
