import React, { useState } from 'react';
import { Player, commitRoundToSession } from '../../services/db';
import { ThingsYouSaySettings, ThingsYouSayConfig } from './ThingsYouSaySettings';
import { ThingsYouSayPlay } from './ThingsYouSayPlay';
import { sound } from '../../services/soundboard';
import confetti from 'canvas-confetti';
import { Trophy, MessageSquare } from 'lucide-react';

interface ThingsYouSayGameProps {
  sessionId: string;
  players: Player[];
  onBackToHub: () => void;
}

type ThingsYouSayStage = 'settings' | 'playing_turns' | 'game_complete';

export const ThingsYouSayGame: React.FC<ThingsYouSayGameProps> = ({
  sessionId,
  players,
  onBackToHub,
}) => {
  const [stage, setStage] = useState<ThingsYouSayStage>('settings');
  const [config, setConfig] = useState<ThingsYouSayConfig>(() => {
    try {
      const saved = localStorage.getItem('partypop_thingsyousay_config');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      timerSeconds: 15,
      mode: 'classic',
    };
  });

  const handleConfigChange = (newConfig: ThingsYouSayConfig) => {
    setConfig(newConfig);
    try {
      localStorage.setItem('partypop_thingsyousay_config', JSON.stringify(newConfig));
    } catch {}
  };

  const [activePlayerIndex, setActivePlayerIndex] = useState<number>(0);
  const [turnScores, setTurnScores] = useState<Record<string, number>>({});
  const [promptsAnswered, setPromptsAnswered] = useState<Record<string, string>>({});

  const handleStartGame = () => {
    setActivePlayerIndex(0);
    setTurnScores({});
    setPromptsAnswered({});
    setStage('playing_turns');
  };

  const handleTurnComplete = async (earnedPoints: number, promptUsed: string) => {
    const currentPlayer = players[activePlayerIndex];
    const updatedScores = {
      ...turnScores,
      [currentPlayer.id]: earnedPoints,
    };
    const updatedPrompts = {
      ...promptsAnswered,
      [currentPlayer.id]: promptUsed,
    };

    setTurnScores(updatedScores);
    setPromptsAnswered(updatedPrompts);

    if (activePlayerIndex < players.length - 1) {
      setActivePlayerIndex(i => i + 1);
    } else {
      sound.playFanfare();
      confetti({ particleCount: 100, spread: 80, origin: { y: 0.5 } });

      await commitRoundToSession(
        sessionId,
        'things_to_say',
        `Things You Can Say (${config.mode === 'in_bed' ? 'In Bed 18+' : config.mode === 'mixed' ? 'Mixed' : 'Classic'})`,
        updatedScores,
        {
          prompts: updatedPrompts,
          timerSeconds: config.timerSeconds,
          mode: config.mode,
        }
      );

      setStage('game_complete');
    }
  };

  // 1. Settings Stage
  if (stage === 'settings') {
    return (
      <ThingsYouSaySettings
        config={config}
        onChange={handleConfigChange}
        onStart={handleStartGame}
        onBack={onBackToHub}
        playerCount={players.length}
      />
    );
  }

  // 2. Playing Turns Stage (with key to ensure clean handoff screen on each player turn!)
  if (stage === 'playing_turns') {
    const currentPlayer = players[activePlayerIndex];
    return (
      <ThingsYouSayPlay
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

  // 3. Game Complete / Standings Screen
  const sortedPlayers = [...players].sort((a, b) => (turnScores[b.id] || 0) - (turnScores[a.id] || 0));

  return (
    <div className="w-full max-w-sm mx-auto space-y-5 select-none pb-12">
      <div className="text-center space-y-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 neo-card bg-[#FEF08A] text-xs font-black uppercase text-amber-950">
          <Trophy className="w-4 h-4 text-amber-600" /> Round Results
        </div>
        <h2 className="text-2xl font-black text-[#18181B]">Things You Can Say!</h2>
        <p className="text-xs font-bold text-gray-600">Points have been added to session standings!</p>
      </div>

      {/* Standings List */}
      <div className="space-y-2">
        {sortedPlayers.map((p, idx) => {
          const pts = turnScores[p.id] || 0;
          const prompt = promptsAnswered[p.id] || '';

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
                  <div className="text-[11px] font-semibold text-gray-500 truncate max-w-[180px]">
                    "{prompt}"
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
          Play Again (New Prompts) 🔄
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
