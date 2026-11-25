import React, { useState, useEffect } from 'react';
import { SentenceSubmission } from './SentenceCollectionPhase';
import { sound } from '../../services/soundboard';
import { haptics } from '../../services/haptics';
import { Clock, Play, Pause, Vote, MessageCircle, Bot } from 'lucide-react';

interface SentenceDebatePhaseProps {
  topic: string;
  mysterySubmission: SentenceSubmission;
  discussionSeconds: number;
  onReadyToVote: () => void;
}

export const SentenceDebatePhase: React.FC<SentenceDebatePhaseProps> = ({
  topic,
  mysterySubmission,
  discussionSeconds,
  onReadyToVote,
}) => {
  const [timeLeft, setTimeLeft] = useState<number>(discussionSeconds);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  useEffect(() => {
    if (isPaused || timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(interval);
          sound.playBuzzer();
          haptics.heavy();
          return 0;
        }
        if (t <= 5) {
          sound.playPop(1.5);
          haptics.light();
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaused, timeLeft]);

  return (
    <div className="w-full max-w-sm mx-auto space-y-4 select-none pb-12">
      {/* Top Bar with Timer */}
      <div className="flex items-center justify-between">
        <span className="neo-badge bg-[#DDD6FE] text-[11px] font-black uppercase text-purple-950">
          Debate &amp; Interrogate
        </span>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              sound.playPop();
              setIsPaused(p => !p);
            }}
            className="neo-btn neo-btn-sm py-1 px-2.5 bg-white text-xs font-black flex items-center gap-1"
          >
            {isPaused ? <Play className="w-3.5 h-3.5 fill-black" /> : <Pause className="w-3.5 h-3.5 fill-black" />}
            {isPaused ? 'Resume' : 'Pause'}
          </button>

          <div
            className={`px-3 py-1 rounded-xl border-2 border-black font-black text-sm tabular-nums ${
              timeLeft <= 10 ? 'bg-red-200 text-red-900 animate-pulse' : 'bg-[#FEF08A] text-[#18181B]'
            }`}
          >
            {timeLeft}s
          </div>
        </div>
      </div>

      {/* The Mystery Sentence Display Card */}
      <div className="neo-card-lg p-6 bg-gradient-to-br from-purple-100 via-pink-100 to-amber-100 border-4 border-black text-center space-y-3 shadow-[6px_6px_0px_#000]">
        <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full border-2 border-black bg-white text-[11px] font-black uppercase text-purple-950">
          Topic: {topic}
        </div>

        <div className="text-2xl font-black text-[#18181B] leading-snug py-2">
          "{mysterySubmission.sentence}"
        </div>

        <p className="text-xs font-bold text-gray-700 leading-tight">
          Who among you said this? Or was it synthesized by the AI?
        </p>
      </div>

      {/* Bluff & Interrogation Guidance */}
      <div className="neo-card p-4 bg-white border-3 border-black space-y-2.5 shadow-[3px_3px_0px_#000]">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-gray-800">
          <MessageCircle className="w-4 h-4 text-purple-600" />
          The Bluffing Objective
        </div>
        <div className="space-y-1.5 text-[11px] font-bold text-gray-700 leading-snug">
          <p>
            🎭 <strong className="text-black">If this is YOUR sentence:</strong> Keep a straight face! Deflect, accuse someone else, or claim it sounds like AI!
          </p>
          <p>
            🤖 <strong className="text-black">If it is the AI:</strong> Watch out! The AI is baiting you into accusing an innocent friend (-1 pt penalty if tricked)!
          </p>
        </div>
      </div>

      {/* Proceed to Voting Button */}
      <div className="pt-2">
        <button
          onClick={() => {
            sound.playPop();
            haptics.medium();
            onReadyToVote();
          }}
          className="w-full neo-btn py-4 bg-[#A7F3D0] hover:bg-[#86EFAC] text-lg font-black text-[#18181B] border-4 border-black shadow-[5px_5px_0px_#000] flex items-center justify-center gap-2"
        >
          <Vote className="w-5 h-5 stroke-[2.5]" />
          Cast Votes Now 🗳️
        </button>
      </div>
    </div>
  );
};
