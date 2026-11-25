import React, { useState } from 'react';
import { Player, commitRoundToSession } from '../../services/db';
import { EchoBluffSettings, EchoBluffConfig } from './EchoBluffSettings';
import { SentenceCollectionPhase, SentenceSubmission } from './SentenceCollectionPhase';
import { SentenceDebatePhase } from './SentenceDebatePhase';
import { SentenceVotingPhase } from './SentenceVotingPhase';
import { SentenceRevealPhase } from './SentenceRevealPhase';
import { computeEchoScores, EchoRoundResult } from './EchoScoringEngine';
import { getNonRepeatingTopic } from './data/topicsAndSentences';
import { sound } from '../../services/soundboard';
import { Trophy, RotateCcw, Home, Sparkles } from 'lucide-react';

interface EchoBluffGameProps {
  sessionId: string;
  players: Player[];
  onBackToHub: () => void;
}

type EchoStage = 'settings' | 'collecting' | 'debating' | 'voting' | 'revealing' | 'round_complete';

export const EchoBluffGame: React.FC<EchoBluffGameProps> = ({
  sessionId,
  players,
  onBackToHub,
}) => {
  const [stage, setStage] = useState<EchoStage>('settings');
  const [config, setConfig] = useState<EchoBluffConfig>(() => {
    try {
      const saved = localStorage.getItem('partypop_echobluff_config');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      discussionSeconds: 60,
      aiPointsPenalty: 1,
      aiCaughtBonus: 2,
      bluffSuccessBonus: 2,
    };
  });

  const handleConfigChange = (newConfig: EchoBluffConfig) => {
    setConfig(newConfig);
    try {
      localStorage.setItem('partypop_echobluff_config', JSON.stringify(newConfig));
    } catch {}
  };

  const [currentTopic, setCurrentTopic] = useState<string>('');
  const [allSubmissions, setAllSubmissions] = useState<SentenceSubmission[]>([]);
  const [mysterySubmission, setMysterySubmission] = useState<SentenceSubmission | null>(null);
  const [roundResult, setRoundResult] = useState<EchoRoundResult | null>(null);

  // Start fresh round
  const handleStartGame = () => {
    const topic = getNonRepeatingTopic(sessionId);
    setCurrentTopic(topic);
    setAllSubmissions([]);
    setMysterySubmission(null);
    setRoundResult(null);
    setStage('collecting');
  };

  // Called after all players wrote sentences + AI injected
  const handleAllSubmitted = (submissions: SentenceSubmission[], mysteryItem: SentenceSubmission) => {
    setAllSubmissions(submissions);
    setMysterySubmission(mysteryItem);
    setStage('debating');
  };

  // Called after voting completes
  const handleVotesComplete = (votes: Record<string, string>) => {
    if (!mysterySubmission) return;

    const result = computeEchoScores(players, mysterySubmission, votes, config);
    setRoundResult(result);
    setStage('revealing');
  };

  // Called after revealing true author -> commit to DB
  const handleProceedToStandings = async () => {
    if (!roundResult || !mysterySubmission) return;

    await commitRoundToSession(
      sessionId,
      'echo_bluff',
      `Echo Bluff (${currentTopic}): ${roundResult.outcomeTitle}`,
      roundResult.scoreDeltas,
      {
        topic: currentTopic,
        sentence: mysterySubmission.sentence,
        isAi: mysterySubmission.isAi,
        actualAuthor: roundResult.actualAuthorName,
      }
    );

    setStage('round_complete');
  };

  // 1. Settings Stage
  if (stage === 'settings') {
    return (
      <EchoBluffSettings
        config={config}
        onChange={handleConfigChange}
        onStart={handleStartGame}
        onBack={onBackToHub}
        playerCount={players.length}
      />
    );
  }

  // 2. Secret Writing Stage
  if (stage === 'collecting') {
    return (
      <SentenceCollectionPhase
        players={players}
        topic={currentTopic}
        onAllSubmitted={handleAllSubmitted}
      />
    );
  }

  // 3. Debate Stage
  if (stage === 'debating' && mysterySubmission) {
    return (
      <SentenceDebatePhase
        topic={currentTopic}
        mysterySubmission={mysterySubmission}
        discussionSeconds={config.discussionSeconds}
        onReadyToVote={() => setStage('voting')}
      />
    );
  }

  // 4. Voting Stage
  if (stage === 'voting' && mysterySubmission) {
    return (
      <SentenceVotingPhase
        players={players}
        mysterySubmission={mysterySubmission}
        onVotesComplete={handleVotesComplete}
      />
    );
  }

  // 5. Reveal Stage
  if (stage === 'revealing' && mysterySubmission && roundResult) {
    return (
      <SentenceRevealPhase
        players={players}
        mysterySubmission={mysterySubmission}
        roundResult={roundResult}
        onProceedToStandings={handleProceedToStandings}
      />
    );
  }

  // 6. Round Complete / Standings Screen
  const sortedPlayers = [...players].sort(
    (a, b) => ((roundResult?.scoreDeltas[b.id]) || 0) - ((roundResult?.scoreDeltas[a.id]) || 0)
  );

  return (
    <div className="w-full max-w-sm mx-auto space-y-5 select-none pb-12">
      <div className="text-center space-y-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 neo-card bg-[#DDD6FE] text-xs font-black uppercase text-purple-950">
          <Trophy className="w-4 h-4 text-purple-700" /> Echo Bluff Complete
        </div>
        <h2 className="text-2xl font-black text-[#18181B]">Round Standings</h2>
        <p className="text-xs font-bold text-gray-600">Points have been updated in your session tally!</p>
      </div>

      {/* Standings List */}
      <div className="space-y-2">
        {sortedPlayers.map((p, idx) => {
          const delta = (roundResult?.scoreDeltas[p.id]) || 0;

          return (
            <div
              key={p.id}
              className={`p-3.5 rounded-2xl border-3 border-black flex items-center justify-between shadow-[2px_2px_0px_#000] ${
                idx === 0 && delta > 0 ? 'bg-[#FEF08A]' : 'bg-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl font-black text-gray-500 w-5">#{idx + 1}</span>
                <span className="text-2xl">{p.avatarEmoji}</span>
                <div className="text-sm font-black text-[#18181B]">{p.name}</div>
              </div>

              <div
                className={`text-sm font-black px-3 py-1 rounded-xl border-2 border-black ${
                  delta > 0
                    ? 'bg-emerald-100 text-emerald-800'
                    : delta < 0
                    ? 'bg-red-100 text-red-600'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {delta > 0 ? `+${delta}` : delta} pts
              </div>
            </div>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div className="space-y-2.5 pt-2">
        <button
          onClick={handleStartGame}
          className="w-full neo-btn py-4 bg-[#FEF08A] hover:bg-[#FDE047] text-lg font-black text-[#18181B]"
        >
          Play Again (New Topic) 🔄
        </button>

        <button
          onClick={() => {
            sound.playPop();
            setStage('settings');
          }}
          className="w-full neo-btn py-3.5 bg-[#BAE6FD] hover:bg-[#93C5FD] text-sm font-black text-[#18181B] flex items-center justify-center gap-1.5"
        >
          ⚙️ Change Game Settings
        </button>

        <button
          onClick={() => {
            sound.playPop();
            onBackToHub();
          }}
          className="w-full neo-btn py-3 bg-white hover:bg-gray-50 text-sm font-black text-[#18181B]"
        >
          Switch Game / Back to Hub 🏠
        </button>
      </div>
    </div>
  );
};
