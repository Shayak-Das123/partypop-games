import React, { useState } from 'react';
import { Player, commitRoundToSession } from '../../services/db';
import { ForeheadSettings, ForeheadConfig } from './ForeheadSettings';
import { ForeheadPlay } from './ForeheadPlay';
import { sound } from '../../services/soundboard';
import confetti from 'canvas-confetti';
import { Trophy, RotateCcw, Home } from 'lucide-react';

interface ForeheadGameProps {
  sessionId: string;
  players: Player[];
  onBackToHub: () => void;
}

type ForeheadStage = 'settings' | 'playing_turns' | 'game_complete';

export const ForeheadGame: React.FC<ForeheadGameProps> = ({
  sessionId,
  players,
  onBackToHub,
}) => {
  const [stage, setStage] = useState<ForeheadStage>('settings');
  const [config, setConfig] = useState<ForeheadConfig>(() => {
    try {
      const saved = localStorage.getItem('partypop_forehead_config');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      selectedDecks: ['actions', 'bollywood'],
      roundSeconds: 60,
    };
  });

  const handleConfigChange = (newConfig: ForeheadConfig) => {
    setConfig(newConfig);
    try {
      localStorage.setItem('partypop_forehead_config', JSON.stringify(newConfig));
    } catch {}
  };

  const [activePlayerIndex, setActivePlayerIndex] = useState<number>(0);
  const [turnScores, setTurnScores] = useState<Record<string, number>>({});
  const [wordsGuessedPerPlayer, setWordsGuessedPerPlayer] = useState<Record<string, string[]>>({});

  const handleStartGame = () => {
    setActivePlayerIndex(0);
    setTurnScores({});
    setWordsGuessedPerPlayer({});
    setStage('playing_turns');
  };

  const handleTurnComplete = async (earnedPoints: number, guessedWords: string[]) => {
    const currentPlayer = players[activePlayerIndex];
    const updatedScores = {
      ...turnScores,
      [currentPlayer.id]: earnedPoints,
    };
    const updatedWords = {
      ...wordsGuessedPerPlayer,
      [currentPlayer.id]: guessedWords,
    };

    setTurnScores(updatedScores);
    setWordsGuessedPerPlayer(updatedWords);

    if (activePlayerIndex < players.length - 1) {
      // Advance to next player
      setActivePlayerIndex(i => i + 1);
    } else {
      // All players completed their turns! Commit scores to centralized session store
      sound.playFanfare();
      confetti({ particleCount: 100, spread: 80, origin: { y: 0.5 } });

      await commitRoundToSession(
        sessionId,
        'forehead_pop',
        `Forehead Pop! Round (${players.length} players)`,
        updatedScores,
        {
          wordsGuessed: updatedWords,
          decks: config.selectedDecks,
        }
      );

      setStage('game_complete');
    }
  };

  // 1. Settings Stage
  if (stage === 'settings') {
    return (
      <ForeheadSettings
        config={config}
        onChange={handleConfigChange}
        onStart={handleStartGame}
        onBack={onBackToHub}
        playerCount={players.length}
      />
    );
  }

  // 2. Playing Turns Stage
  if (stage === 'playing_turns') {
    const currentPlayer = players[activePlayerIndex];
    return (
      <ForeheadPlay
        key={currentPlayer.id}
        sessionId={sessionId}
        player={currentPlayer}
        roundSeconds={config.roundSeconds}
        selectedDecks={config.selectedDecks}
        turnNumber={activePlayerIndex + 1}
        totalTurns={players.length}
        onTurnComplete={handleTurnComplete}
      />
    );
  }

  // 3. Game Complete / Round Summary Screen
  const sortedStandings = [...players].sort((a, b) => (turnScores[b.id] || 0) - (turnScores[a.id] || 0));

  return (
    <div className="w-full max-w-sm mx-auto space-y-5 select-none pb-12">
      <div className="text-center space-y-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 neo-card bg-[#FEF08A] text-xs font-black uppercase">
          <Trophy className="w-4 h-4 text-amber-600" /> Round Results
        </div>
        <h2 className="text-2xl font-black text-[#18181B]">Forehead Pop! Complete</h2>
        <p className="text-xs font-bold text-gray-600">Points have been added to your session tally!</p>
      </div>

      {/* Leaderboard of this round */}
      <div className="space-y-2">
        {sortedStandings.map((p, idx) => {
          const pts = turnScores[p.id] || 0;
          return (
            <div
              key={p.id}
              className={`p-3.5 rounded-2xl border-3 border-black flex items-center justify-between shadow-[2px_2px_0px_#000] ${
                idx === 0 ? 'bg-[#FEF08A]' : 'bg-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl font-black text-gray-500 w-5">#{idx + 1}</span>
                <span className="text-2xl">{p.avatarEmoji}</span>
                <div>
                  <div className="text-sm font-black text-[#18181B]">{p.name}</div>
                  <div className="text-[11px] font-semibold text-gray-600">
                    {wordsGuessedPerPlayer[p.id]?.length || 0} words guessed
                  </div>
                </div>
              </div>

              <div className="text-base font-black px-3 py-1 rounded-xl border-2 border-black bg-white">
                +{pts} pts
              </div>
            </div>
          );
        })}
      </div>

      {/* Next Actions */}
      <div className="space-y-2.5 pt-2">
        <button
          onClick={handleStartGame}
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
