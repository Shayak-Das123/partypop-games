import React, { useState } from 'react';
import { Player, commitRoundToSession } from '../../services/db';
import { MafiaSettings, MafiaConfig } from './MafiaSettings';
import { MafiaPlay } from './MafiaPlay';

interface MafiaGameProps {
  sessionId: string;
  players: Player[];
  onBackToHub: () => void;
}

type MafiaStage = 'settings' | 'playing';

export const MafiaGame: React.FC<MafiaGameProps> = ({
  sessionId,
  players,
  onBackToHub,
}) => {
  const [stage, setStage] = useState<MafiaStage>('settings');
  const [config, setConfig] = useState<MafiaConfig>(() => {
    try {
      const saved = localStorage.getItem('partypop_mafia_config');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      discussionSeconds: 90,
      includeJester: false,
    };
  });

  const handleConfigChange = (newConfig: MafiaConfig) => {
    setConfig(newConfig);
    try {
      localStorage.setItem('partypop_mafia_config', JSON.stringify(newConfig));
    } catch {}
  };

  const handleStartGame = () => {
    setStage('playing');
  };

  const handleGameComplete = async (
    scoreDeltas: Record<string, number>,
    summary: string
  ) => {
    await commitRoundToSession(
      sessionId,
      'mafia',
      summary,
      scoreDeltas,
      {
        playerCount: players.length,
        includeJester: config.includeJester,
      }
    );

    onBackToHub();
  };

  if (stage === 'settings') {
    return (
      <MafiaSettings
        config={config}
        onChange={handleConfigChange}
        onStart={handleStartGame}
        onBack={onBackToHub}
        playerCount={players.length}
      />
    );
  }

  return (
    <MafiaPlay
      players={players}
      config={config}
      onGameComplete={handleGameComplete}
    />
  );
};
