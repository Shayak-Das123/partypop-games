import React, { useState } from 'react';
import { Player, commitRoundToSession } from '../../services/db';
import { getNonRepeatingWord, WordItem } from './data/wordBank';
import { ImposterRole, ImposterRoundResult } from './ScoringEngine';
import { ImposterSettings, ImposterConfig } from './ImposterSettings';
import { SwipeCard } from './SwipeCard';
import { DiscussionTimer } from './DiscussionTimer';
import { VotingBallot } from './VotingBallot';
import { RevealPhase } from './RevealPhase';
import { sound } from '../../services/soundboard';
import { haptics } from '../../services/haptics';

interface ImposterGameProps {
  sessionId: string;
  players: Player[];
  onBackToHub: () => void;
}

type GameStage = 'settings' | 'card_peek' | 'discussion' | 'voting' | 'reveal' | 'round_over';

export const ImposterGame: React.FC<ImposterGameProps> = ({
  sessionId,
  players,
  onBackToHub,
}) => {
  const [stage, setStage] = useState<GameStage>('settings');
  const [config, setConfig] = useState<ImposterConfig>(() => {
    try {
      const saved = localStorage.getItem('partypop_imposter_config');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      categories: ['everyday_objects'],
      randomImposters: false,
      imposterCount: 1,
      timerSeconds: 120,
      undercoverMode: false,
      hintsEnabled: false,
      enableAssistant: false,
      enableJester: false,
    };
  });

  const handleConfigChange = (newConfig: ImposterConfig) => {
    setConfig(newConfig);
    try {
      localStorage.setItem('partypop_imposter_config', JSON.stringify(newConfig));
    } catch {}
  };

  const [activeWordItem, setActiveWordItem] = useState<WordItem | null>(null);
  const [playerRoles, setPlayerRoles] = useState<Record<string, ImposterRole>>({});
  const [peekIndex, setPeekIndex] = useState<number>(0);
  const [startingPlayer, setStartingPlayer] = useState<Player>(players[0]);
  const [submittedVotes, setSubmittedVotes] = useState<Record<string, string>>({});
  const [lastRoundResult, setLastRoundResult] = useState<ImposterRoundResult | null>(null);

  // Setup and Role Assignment
  const handleStartGame = () => {
    // 1. Pick secret word
    const word = getNonRepeatingWord(sessionId, config.categories);
    setActiveWordItem(word);

    // 2. Determine number of imposters (allow 1 imposter even with 2 players)
    const maxAllowed = Math.max(1, Math.floor(players.length / 2));
    let numImposters = Math.min(config.imposterCount, maxAllowed);
    if (config.randomImposters) {
      numImposters = Math.floor(Math.random() * maxAllowed) + 1;
    }

    // 3. Shuffle players to assign roles
    const shuffled = [...players].sort(() => Math.random() - 0.5);
    const assignedRoles: Record<string, ImposterRole> = {};

    players.forEach(p => (assignedRoles[p.id] = 'innocent'));

    // Assign Imposters
    for (let i = 0; i < numImposters; i++) {
      assignedRoles[shuffled[i].id] = 'imposter';
    }

    let currentIndex = numImposters;

    // Assign Assistant (if enabled and enough players)
    if (config.enableAssistant && currentIndex < shuffled.length - 1) {
      assignedRoles[shuffled[currentIndex].id] = 'assistant';
      currentIndex++;
    }

    // Assign Jester (if enabled and enough players)
    if (config.enableJester && currentIndex < shuffled.length) {
      assignedRoles[shuffled[currentIndex].id] = 'jester';
    }

    setPlayerRoles(assignedRoles);
    setPeekIndex(0);

    // Randomize starting speaker
    const randomSpeaker = players[Math.floor(Math.random() * players.length)];
    setStartingPlayer(randomSpeaker);

    setStage('card_peek');
  };

  // Card peek advance
  const handlePassToNext = () => {
    if (peekIndex < players.length - 1) {
      setPeekIndex(i => i + 1);
    } else {
      // All players have peeked -> start discussion timer
      sound.playSuccess();
      setStage('discussion');
    }
  };

  // Voting complete -> go to reveal phase
  const handleVotesComplete = (votes: Record<string, string>) => {
    setSubmittedVotes(votes);
    setStage('reveal');
  };

  // Reveal phase complete -> commit scores to session
  const handleFinishRound = async (result: ImposterRoundResult) => {
    setLastRoundResult(result);

    const imposterNames = players
      .filter(p => playerRoles[p.id] === 'imposter')
      .map(p => p.name)
      .join(', ');

    await commitRoundToSession(
      sessionId,
      'imposter',
      `Imposter Round (${activeWordItem?.word}) — Imposters: ${imposterNames}`,
      result.scoreDeltas,
      {
        votes: submittedVotes,
        imposterIds: players.filter(p => playerRoles[p.id] === 'imposter').map(p => p.id),
        roles: playerRoles,
        word: activeWordItem?.word,
      }
    );

    setStage('round_over');
  };

  // Play next round with same session players
  const handlePlayNextRound = () => {
    sound.playPop();
    handleStartGame();
  };

  // 1. Settings Stage
  if (stage === 'settings') {
    return (
      <ImposterSettings
        playerCount={players.length}
        config={config}
        onChange={handleConfigChange}
        onStart={handleStartGame}
        onBack={onBackToHub}
      />
    );
  }

  // 2. Card Peek Stage
  if (stage === 'card_peek' && activeWordItem) {
    const activePlayer = players[peekIndex];
    const imposterNames = players
      .filter(p => playerRoles[p.id] === 'imposter')
      .map(p => p.name);

    return (
      <SwipeCard
        player={activePlayer}
        role={playerRoles[activePlayer.id]}
        wordItem={activeWordItem}
        undercoverMode={config.undercoverMode}
        hintsEnabled={config.hintsEnabled}
        imposterNames={imposterNames}
        onPassToNext={handlePassToNext}
        isLastPlayer={peekIndex === players.length - 1}
      />
    );
  }

  // 3. Discussion Stage
  if (stage === 'discussion') {
    return (
      <DiscussionTimer
        initialSeconds={config.timerSeconds}
        players={players}
        startingPlayer={startingPlayer}
        onProceedToVote={() => setStage('voting')}
      />
    );
  }

  // 4. Voting Stage
  if (stage === 'voting') {
    return (
      <VotingBallot
        players={players}
        onCompleteVotes={handleVotesComplete}
      />
    );
  }

  // 5. Reveal Stage
  if (stage === 'reveal' && activeWordItem) {
    return (
      <RevealPhase
        players={players}
        roles={playerRoles}
        votes={submittedVotes}
        wordItem={activeWordItem}
        onFinishRound={handleFinishRound}
      />
    );
  }

  // 6. Round Over Screen
  return (
    <div className="w-full max-w-sm mx-auto neo-card-lg p-6 text-center space-y-6 bg-white select-none my-auto">
      <div className="text-4xl">🎉</div>
      <div className="space-y-1">
        <h2 className="text-2xl font-black text-[#18181B]">Round Complete!</h2>
        <p className="text-xs font-bold text-gray-600">
          Scores have been updated in your centralized session tally.
        </p>
      </div>

      <div className="space-y-2.5 pt-2">
        <button
          onClick={handlePlayNextRound}
          className="w-full neo-btn py-4 bg-[#FEF08A] hover:bg-[#FDE047] text-lg font-black text-[#18181B]"
        >
          Play Again (Same Settings) 🔄
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
