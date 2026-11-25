import React, { useState, useEffect } from 'react';
import { Player } from '../../services/db';
import { ImposterRole, ImposterRoundResult, calculateImposterScores } from './ScoringEngine';
import { WordItem } from './data/wordBank';
import { sound } from '../../services/soundboard';
import { haptics } from '../../services/haptics';
import confetti from 'canvas-confetti';
import {
  Skull,
  Award,
  HelpCircle,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';

interface RevealPhaseProps {
  players: Player[];
  roles: Record<string, ImposterRole>;
  votes: Record<string, string>;
  wordItem: WordItem;
  onFinishRound: (result: ImposterRoundResult) => void;
}

type RevealStep =
  | 'show_voted_out'       // Step 1: Shows who was voted out
  | 'reveal_role'          // Step 2: Reveals whether they were an Imposter/Innocent
  | 'redemption_timer'     // Step 3: 15-second guess timer (if imposter)
  | 'judge_guess'          // Step 4: Reveals secret word & host confirms if guess was right
  | 'final_scores';        // Step 5: Shows score breakdown & updated standings

export const RevealPhase: React.FC<RevealPhaseProps> = ({
  players,
  roles,
  votes,
  wordItem,
  onFinishRound,
}) => {
  const [step, setStep] = useState<RevealStep>('show_voted_out');
  const [imposterGuessedCorrectly, setImposterGuessedCorrectly] = useState<boolean>(false);
  const [roundResult, setRoundResult] = useState<ImposterRoundResult>(() =>
    calculateImposterScores({ players, roles, votes })
  );

  // 15-second Redemption Timer state
  const [guessSecondsLeft, setGuessSecondsLeft] = useState<number>(15);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(true);

  const eliminatedPlayer = players.find(p => p.id === roundResult.eliminatedId);
  const wasImposterEliminated = eliminatedPlayer && roles[eliminatedPlayer.id] === 'imposter';

  // Redemption Timer effect
  useEffect(() => {
    if (step !== 'redemption_timer' || !isTimerRunning) return;

    const timer = setInterval(() => {
      setGuessSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          sound.playBuzzer();
          haptics.heavy();
          return 0;
        }
        if (prev <= 5) {
          sound.playTick(true);
          haptics.light();
        } else {
          sound.playTick(false);
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [step, isTimerRunning]);

  // Step 1 -> Step 2
  const handleRevealRole = () => {
    sound.playTensionPulse();
    haptics.flutter();
    setStep('reveal_role');
  };

  // Step 2 -> Step 3 (or Step 5 if not imposter)
  const handleNextFromRole = () => {
    sound.playPop();
    if (wasImposterEliminated) {
      // Start 15s redemption timer
      setGuessSecondsLeft(15);
      setIsTimerRunning(true);
      setStep('redemption_timer');
    } else {
      // Skip directly to final scores
      finalizeScores(false);
    }
  };

  // Step 3 -> Step 4
  const handleProceedToJudge = () => {
    sound.playPop();
    setStep('judge_guess');
  };

  // Step 4: Host judges guess -> finalize scores
  const handleJudgeDecision = (correct: boolean) => {
    sound.playPop();
    setImposterGuessedCorrectly(correct);
    finalizeScores(correct);
  };

  const finalizeScores = (guessedCorrect: boolean) => {
    const finalRes = calculateImposterScores({
      players,
      roles,
      votes,
      imposterGuessedCorrectly: guessedCorrect,
    });
    setRoundResult(finalRes);

    if (wasImposterEliminated && !guessedCorrect) {
      sound.playFanfare();
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    } else {
      sound.playSuccess();
    }

    setStep('final_scores');
  };

  // STEP 1: Show who has been voted out
  if (step === 'show_voted_out') {
    return (
      <div className="w-full max-w-sm mx-auto neo-card-lg p-6 text-center space-y-6 bg-white select-none my-auto">
        <div className="w-16 h-16 mx-auto rounded-full border-3 border-black bg-[#FECDD3] flex items-center justify-center shadow-[3px_3px_0px_#000]">
          <Skull className="w-8 h-8 text-red-700" />
        </div>

        <div className="space-y-1">
          <div className="text-xs font-black uppercase tracking-wider text-gray-500">Voting Results</div>
          {roundResult.isTie ? (
            <div>
              <div className="text-3xl font-black text-[#18181B]">It's a Tie! ⚖️</div>
              <p className="text-xs font-bold text-gray-600 mt-2">
                Multiple players received the same highest vote count. Nobody is eliminated!
              </p>
            </div>
          ) : eliminatedPlayer ? (
            <div>
              <div className="text-sm font-bold text-gray-600">The group has voted out:</div>
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl border-3 border-black bg-[#FEF08A] shadow-[4px_4px_0px_#000] my-3">
                <span className="text-3xl">{eliminatedPlayer.avatarEmoji}</span>
                <span className="text-2xl font-black text-[#18181B]">{eliminatedPlayer.name}</span>
              </div>
              <p className="text-xs font-bold text-gray-600">
                Received {roundResult.voteCounts[eliminatedPlayer.id]} votes from the group.
              </p>
            </div>
          ) : (
            <div>
              <div className="text-2xl font-black">No votes cast</div>
            </div>
          )}
        </div>

        <button
          onClick={roundResult.isTie ? () => finalizeScores(false) : handleRevealRole}
          className="w-full neo-btn py-4 bg-[#FEF08A] hover:bg-[#FDE047] text-lg font-black text-[#18181B]"
        >
          {roundResult.isTie ? 'View Scores 📊' : 'Ask to Reveal Role 🔍'}
        </button>
      </div>
    );
  }

  // STEP 2: Show whether they were an Imposter or Innocent
  if (step === 'reveal_role') {
    const role = roundResult.eliminatedRole;
    const isImposter = role === 'imposter';

    return (
      <div className="w-full max-w-sm mx-auto neo-card-lg p-6 text-center space-y-6 bg-white select-none my-auto">
        <div
          className={`w-20 h-20 mx-auto rounded-full border-4 border-black flex items-center justify-center shadow-[4px_4px_0px_#000] ${
            isImposter ? 'bg-[#FECDD3]' : 'bg-[#A7F3D0]'
          }`}
        >
          {isImposter ? (
            <ShieldAlert className="w-10 h-10 text-red-600" />
          ) : (
            <ShieldCheck className="w-10 h-10 text-emerald-700" />
          )}
        </div>

        <div className="space-y-2">
          <div className="text-xs font-black uppercase tracking-wider text-gray-500">Identity Confirmed</div>
          <div className="text-2xl font-black text-[#18181B]">
            {eliminatedPlayer?.name} was...
          </div>
          <div
            className={`text-3xl font-black uppercase p-3 rounded-2xl border-3 border-black shadow-[3px_3px_0px_#000] ${
              isImposter ? 'bg-red-500 text-white' : 'bg-emerald-400 text-black'
            }`}
          >
            {isImposter ? 'AN IMPOSTER! 😈' : role === 'jester' ? 'THE JESTER! 🃏' : role === 'assistant' ? 'THE ASSISTANT! 🤝' : 'INNOCENT! 😇'}
          </div>
        </div>

        <button
          onClick={handleNextFromRole}
          className="w-full neo-btn py-4 bg-[#A7F3D0] hover:bg-[#86EFAC] text-lg font-black text-[#18181B]"
        >
          {isImposter ? 'Imposter Guess Chance → 🔮' : 'Continue to Standings → 📊'}
        </button>
      </div>
    );
  }

  // STEP 3: 15-second Imposter Redemption Guess Timer
  if (step === 'redemption_timer') {
    return (
      <div className="w-full max-w-sm mx-auto neo-card-lg p-6 text-center space-y-6 bg-white select-none my-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#DDD6FE] border-2 border-black text-xs font-black uppercase">
          <Sparkles className="w-3.5 h-3.5" /> Imposter Redemption
        </div>

        <div className="space-y-1">
          <div className="text-xl font-black text-[#18181B]">
            {eliminatedPlayer?.name}, guess the secret word!
          </div>
          <p className="text-xs font-semibold text-gray-600">
            If you guess the secret word out loud, you earn redemption points!
          </p>
        </div>

        {/* 15s Timer Display */}
        <div
          className={`neo-card p-6 border-3 border-black ${
            guessSecondsLeft <= 5 ? 'bg-[#FECDD3] animate-pulse-slow' : 'bg-[#BAE6FD]'
          }`}
        >
          <div className="text-xs font-black uppercase tracking-wider text-gray-600">Redemption Clock</div>
          <div className="text-6xl font-black font-mono my-2 text-[#18181B]">
            {guessSecondsLeft}s
          </div>
          <div className="text-xs font-bold text-gray-600">
            {guessSecondsLeft === 0 ? "Time's up!" : isTimerRunning ? 'Guess now!' : 'Paused'}
          </div>
        </div>

        {/* Controls: Pause / Resume / Reset */}
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => {
              sound.playPop();
              setIsTimerRunning(!isTimerRunning);
            }}
            className="neo-btn py-2.5 px-5 bg-[#FED7AA] text-sm font-bold"
          >
            {isTimerRunning ? (
              <>
                <Pause className="w-4 h-4 mr-1" /> Pause
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-1" /> Resume
              </>
            )}
          </button>
          <button
            onClick={() => {
              sound.playPop();
              setGuessSecondsLeft(15);
            }}
            className="neo-btn neo-btn-sm py-2.5 px-3 bg-white text-xs font-bold"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        <button
          onClick={handleProceedToJudge}
          className="w-full neo-btn py-3.5 bg-[#FEF08A] hover:bg-[#FDE047] text-base font-black text-[#18181B]"
        >
          Next → Reveal Secret Word 🗝️
        </button>
      </div>
    );
  }

  // STEP 4: Judge Guess & Reveal Actual Word
  if (step === 'judge_guess') {
    return (
      <div className="w-full max-w-sm mx-auto neo-card-lg p-6 text-center space-y-6 bg-white select-none my-auto">
        <div className="space-y-1">
          <div className="text-xs font-black uppercase tracking-wider text-gray-500">The Actual Secret Word</div>
          <div className="text-3xl font-black text-[#18181B] p-4 rounded-2xl border-3 border-black bg-[#A7F3D0] shadow-[3px_3px_0px_#000]">
            "{wordItem.word}"
          </div>
          <div className="text-xs font-bold text-gray-600 mt-1">Category: {wordItem.category.toUpperCase()}</div>
        </div>

        <div className="neo-card p-4 bg-gray-50 space-y-3">
          <div className="text-sm font-black text-[#18181B]">
            Did {eliminatedPlayer?.name} guess it correctly?
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleJudgeDecision(true)}
              className="neo-btn py-3 bg-[#A7F3D0] text-sm font-black"
            >
              ✓ Yes, Correct!
            </button>
            <button
              onClick={() => handleJudgeDecision(false)}
              className="neo-btn py-3 bg-[#FECDD3] text-sm font-black"
            >
              ✗ No, Wrong!
            </button>
          </div>
        </div>
      </div>
    );
  }

  // STEP 5: Final Scores & Detailed Breakdown
  return (
    <div className="w-full max-w-sm mx-auto space-y-4 select-none pb-12">
      <div className="text-center space-y-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 neo-card bg-[#FEF08A] text-xs font-black uppercase">
          <Award className="w-4 h-4" /> Round Summary
        </div>
        <h2 className="text-2xl font-black text-[#18181B]">Points Awarded</h2>
        <div className="text-xs font-bold text-gray-600">
          Secret Word was: <span className="font-black underline text-black">"{wordItem.word}"</span>
        </div>
      </div>

      {/* Players Points Delta List */}
      <div className="space-y-2">
        {players.map(p => {
          const delta = roundResult.scoreDeltas[p.id] || 0;
          const role = roles[p.id];
          const reason = roundResult.detailedReasons[p.id];

          return (
            <div
              key={p.id}
              className={`p-3 rounded-2xl border-3 border-black flex items-center justify-between shadow-[2px_2px_0px_#000] ${
                delta > 0 ? 'bg-emerald-50' : delta < 0 ? 'bg-red-50' : 'bg-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">{p.avatarEmoji}</span>
                <div>
                  <div className="text-sm font-extrabold text-[#18181B] flex items-center gap-1.5">
                    <span>{p.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded border border-black font-black uppercase bg-white">
                      {role}
                    </span>
                  </div>
                  <div className="text-[11px] font-semibold text-gray-600">{reason}</div>
                </div>
              </div>

              <div
                className={`text-base font-black px-2.5 py-1 rounded-xl border-2 border-black ${
                  delta > 0
                    ? 'bg-[#A7F3D0] text-emerald-900'
                    : delta < 0
                    ? 'bg-[#FECDD3] text-red-900'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {delta > 0 ? `+${delta}` : delta}
              </div>
            </div>
          );
        })}
      </div>

      {/* Finish & Commit to Session Button */}
      <div className="pt-2">
        <button
          onClick={() => {
            sound.playPop();
            onFinishRound(roundResult);
          }}
          className="w-full neo-btn py-4 bg-[#A7F3D0] hover:bg-[#86EFAC] text-lg font-black text-[#18181B]"
        >
          Commit Scores &amp; Standings → 🏆
        </button>
      </div>
    </div>
  );
};
