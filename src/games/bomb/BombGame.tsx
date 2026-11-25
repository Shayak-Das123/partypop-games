import React, { useState } from 'react';
import { Player, commitRoundToSession } from '../../services/db';
import { BombSettings, BombConfig } from './BombSettings';
import { BombPlay } from './BombPlay';
import { sound } from '../../services/soundboard';
import confetti from 'canvas-confetti';
import { Trophy, RotateCcw, Home, Bomb } from 'lucide-react';

interface BombGameProps {
  sessionId: string;
  players: Player[];
  onBackToHub: () => void;
}

type BombStage = 'settings' | 'playing' | 'round_complete';

export const BombGame: React.FC<BombGameProps> = ({
  sessionId,
  players,
  onBackToHub,
}) => {
  const [stage, setStage] = useState<BombStage>('settings');
  const [config, setConfig] = useState<BombConfig>(() => {
    try {
      const saved = localStorage.getItem('partypop_bomb_config');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      minSeconds: 5,
      maxSeconds: 15,
      hideTimerDigits: true,
      penaltyPoints: 3,
      survivorPoints: 1,
    };
  });

  const handleConfigChange = (newConfig: BombConfig) => {
    setConfig(newConfig);
    try {
      localStorage.setItem('partypop_bomb_config', JSON.stringify(newConfig));
    } catch {}
  };

  const [explodedPlayer, setExplodedPlayer] = useState<Player | null>(null);
  const [roundScores, setRoundScores] = useState<Record<string, number>>({});

  const handleStartGame = () => {
    setExplodedPlayer(null);
    setRoundScores({});
    setStage('playing');
  };

  const handleRoundEnd = async (loser: Player, survivors: Player[]) => {
    setExplodedPlayer(loser);

    const scoresDelta: Record<string, number> = {};
    scoresDelta[loser.id] = -config.penaltyPoints;
    survivors.forEach(s => {
      scoresDelta[s.id] = config.survivorPoints;
    });

    setRoundScores(scoresDelta);

    sound.playFanfare();
    confetti({ particleCount: 75, spread: 70, origin: { y: 0.6 } });

    // Commit round scores to centralized session database
    await commitRoundToSession(
      sessionId,
      'bomb',
      `Tick-Tick-BOOM! (Exploded on ${loser.name})`,
      scoresDelta,
      {
        explodedPlayerId: loser.id,
        minSeconds: config.minSeconds,
        maxSeconds: config.maxSeconds,
        hideTimerDigits: config.hideTimerDigits,
      }
    );

    setStage('round_complete');
  };

  // 1. Settings Stage
  if (stage === 'settings') {
    return (
      <BombSettings
        config={config}
        onChange={handleConfigChange}
        onStart={handleStartGame}
        onBack={onBackToHub}
        playerCount={players.length}
      />
    );
  }

  // 2. Playing Stage
  if (stage === 'playing') {
    return (
      <BombPlay
        sessionId={sessionId}
        players={players}
        config={config}
        onRoundEnd={handleRoundEnd}
      />
    );
  }

  // 3. Round Complete / Standings Screen
  const sortedPlayers = [...players].sort((a, b) => (roundScores[b.id] || 0) - (roundScores[a.id] || 0));

  return (
    <div className="w-full max-w-sm mx-auto space-y-5 select-none pb-12">
      <div className="text-center space-y-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 neo-card bg-[#FECDD3] text-xs font-black uppercase text-red-950">
          <Bomb className="w-4 h-4 text-red-600" /> Blast Results
        </div>
        <h2 className="text-2xl font-black text-[#18181B]">Round Concluded!</h2>
        <p className="text-xs font-bold text-gray-600">Scores have been committed to session standings.</p>
      </div>

      {/* Loser Card */}
      {explodedPlayer && (
        <div className="p-4 rounded-2xl border-3 border-black bg-red-100 flex items-center justify-between shadow-[3px_3px_0px_#000]">
          <div className="flex items-center gap-3">
            <span className="text-3xl animate-bounce">💥</span>
            <div>
              <div className="text-[10px] font-black uppercase tracking-wider text-red-700">Exploded Player</div>
              <div className="text-base font-black text-[#18181B] flex items-center gap-1">
                <span>{explodedPlayer.avatarEmoji}</span>
                <span>{explodedPlayer.name}</span>
              </div>
            </div>
          </div>
          <div className="text-sm font-black px-3 py-1 rounded-xl border-2 border-black bg-white text-red-600">
            -{config.penaltyPoints} pt
          </div>
        </div>
      )}

      {/* Standings List */}
      <div className="space-y-2">
        <div className="text-xs font-black uppercase tracking-wider text-gray-500 px-1">
          Round Score Deltas
        </div>
        {sortedPlayers.map((p, idx) => {
          const delta = roundScores[p.id] || 0;
          const isLoser = p.id === explodedPlayer?.id;

          return (
            <div
              key={p.id}
              className={`p-3 rounded-2xl border-3 border-black flex items-center justify-between shadow-[2px_2px_0px_#000] ${
                isLoser ? 'bg-red-50' : 'bg-emerald-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-base font-black text-gray-500 w-5">#{idx + 1}</span>
                <span className="text-2xl">{p.avatarEmoji}</span>
                <div className="text-sm font-black text-[#18181B]">{p.name}</div>
              </div>

              <div
                className={`text-sm font-black px-3 py-1 rounded-xl border-2 border-black ${
                  delta >= 0 ? 'bg-white text-emerald-700' : 'bg-white text-red-600'
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
