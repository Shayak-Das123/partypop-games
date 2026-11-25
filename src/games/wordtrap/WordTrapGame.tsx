import React, { useState } from 'react';
import { Player, commitRoundToSession } from '../../services/db';
import { WordTrapSettings, WordTrapConfig } from './WordTrapSettings';
import { WordTrapPlay } from './WordTrapPlay';
import { sound } from '../../services/soundboard';
import confetti from 'canvas-confetti';
import { Trophy, Ban } from 'lucide-react';

interface WordTrapGameProps {
  sessionId: string;
  players: Player[];
  onBackToHub: () => void;
}

type WordTrapStage = 'settings' | 'playing_turns' | 'game_complete';

export const WordTrapGame: React.FC<WordTrapGameProps> = ({
  sessionId,
  players,
  onBackToHub,
}) => {
  const [stage, setStage] = useState<WordTrapStage>('settings');
  const [config, setConfig] = useState<WordTrapConfig>(() => {
    try {
      const saved = localStorage.getItem('partypop_wordtrap_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...parsed,
          trapCount: parsed.trapCount || 5,
        };
      }
    } catch {}
    return {
      turnSeconds: 60,
      trapCount: 5,
      trapPenalty: 1,
      pointPerWord: 1,
    };
  });

  const handleConfigChange = (newConfig: WordTrapConfig) => {
    setConfig(newConfig);
    try {
      localStorage.setItem('partypop_wordtrap_config', JSON.stringify(newConfig));
    } catch {}
  };

  const [activePlayerIndex, setActivePlayerIndex] = useState<number>(0);
  const [turnScores, setTurnScores] = useState<Record<string, number>>({});
  const [wordsGuessedPerPlayer, setWordsGuessedPerPlayer] = useState<Record<string, string[]>>({});
  const [trapsHitPerPlayer, setTrapsHitPerPlayer] = useState<Record<string, number>>({});

  const handleStartGame = () => {
    setActivePlayerIndex(0);
    setTurnScores({});
    setWordsGuessedPerPlayer({});
    setTrapsHitPerPlayer({});
    setStage('playing_turns');
  };

  const handleTurnComplete = async (earnedPoints: number, guessedWords: string[], trapsHit: number) => {
    const currentPlayer = players[activePlayerIndex];
    const updatedScores = {
      ...turnScores,
      [currentPlayer.id]: earnedPoints,
    };
    const updatedWords = {
      ...wordsGuessedPerPlayer,
      [currentPlayer.id]: guessedWords,
    };
    const updatedTraps = {
      ...trapsHitPerPlayer,
      [currentPlayer.id]: trapsHit,
    };

    setTurnScores(updatedScores);
    setWordsGuessedPerPlayer(updatedWords);
    setTrapsHitPerPlayer(updatedTraps);

    if (activePlayerIndex < players.length - 1) {
      setActivePlayerIndex(i => i + 1);
    } else {
      sound.playFanfare();
      confetti({ particleCount: 100, spread: 80, origin: { y: 0.5 } });

      await commitRoundToSession(
        sessionId,
        'word_trap',
        `Word Trap Round (${players.length} players)`,
        updatedScores,
        {
          wordsGuessed: updatedWords,
          trapsHit: updatedTraps,
          turnSeconds: config.turnSeconds,
        }
      );

      setStage('game_complete');
    }
  };

  // 1. Settings Stage
  if (stage === 'settings') {
    return (
      <WordTrapSettings
        config={config}
        onChange={handleConfigChange}
        onStart={handleStartGame}
        onBack={onBackToHub}
        playerCount={players.length}
      />
    );
  }

  // 2. Playing Turns Stage (with key to ensure fresh handoff every turn!)
  if (stage === 'playing_turns') {
    const currentPlayer = players[activePlayerIndex];
    return (
      <WordTrapPlay
        key={currentPlayer.id}
        sessionId={sessionId}
        player={currentPlayer}
        config={config}
        turnNumber={activePlayerIndex + 1}
        totalTurns={players.length}
        onTurnComplete={handleTurnComplete}
      />
    );
  }

  // 3. Game Complete / Standings
  const sortedPlayers = [...players].sort((a, b) => (turnScores[b.id] || 0) - (turnScores[a.id] || 0));

  return (
    <div className="w-full max-w-sm mx-auto space-y-5 select-none pb-12">
      <div className="text-center space-y-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 neo-card bg-[#FECDD3] text-xs font-black uppercase text-red-950">
          <Ban className="w-4 h-4 text-red-600" /> Word Trap Results
        </div>
        <h2 className="text-2xl font-black text-[#18181B]">Round Standings</h2>
        <p className="text-xs font-bold text-gray-600">Points have been added to session tally!</p>
      </div>

      {/* Standings List */}
      <div className="space-y-2">
        {sortedPlayers.map((p, idx) => {
          const pts = turnScores[p.id] || 0;
          const guessedCount = wordsGuessedPerPlayer[p.id]?.length || 0;
          const trapsCount = trapsHitPerPlayer[p.id] || 0;

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
                    {guessedCount} words • {trapsCount} traps
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

      {/* Action Buttons */}
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
