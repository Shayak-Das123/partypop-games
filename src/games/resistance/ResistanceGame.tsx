import React, { useState } from 'react';
import { Player, commitRoundToSession } from '../../services/db';
import { ResistanceRules } from './ResistanceRules';
import { ResistanceSettings } from './ResistanceSettings';
import { ResistancePlay } from './ResistancePlay';
import { ResistanceConfig, ResistanceRole, RESISTANCE_MATRIX } from './resistanceData';

interface ResistanceGameProps {
  sessionId: string;
  players: Player[];
  onBackToHub: () => void;
}

type Stage = 'rules' | 'settings' | 'playing';

export const ResistanceGame: React.FC<ResistanceGameProps> = ({
  sessionId,
  players,
  onBackToHub,
}) => {
  // First page is the dedicated 3-page How to Play / Rules Guide!
  const [stage, setStage] = useState<Stage>('rules');
  const [config, setConfig] = useState<ResistanceConfig>(() => {
    try {
      const saved = localStorage.getItem('partypop_resistance_config');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      commanderMode: true,
    };
  });

  const [roles, setRoles] = useState<Record<string, ResistanceRole>>({});

  const handleConfigChange = (newConfig: ResistanceConfig) => {
    setConfig(newConfig);
    try {
      localStorage.setItem('partypop_resistance_config', JSON.stringify(newConfig));
    } catch {}
  };

  const assignRoles = (totalPlayers: number, commanderMode: boolean) => {
    const clampedCount = Math.max(5, Math.min(10, totalPlayers));
    const matrix = RESISTANCE_MATRIX[clampedCount] || RESISTANCE_MATRIX[5];

    const shuffled = [...players].sort(() => Math.random() - 0.5);
    const newRoles: Record<string, ResistanceRole> = {};

    // Assign Spies
    for (let i = 0; i < matrix.spyCount; i++) {
      newRoles[shuffled[i].id] = 'spy';
    }

    // Assign Resistance
    for (let i = matrix.spyCount; i < shuffled.length; i++) {
      newRoles[shuffled[i].id] = 'resistance';
    }

    // If Commander mode enabled
    if (commanderMode) {
      // First spy becomes Assassin
      newRoles[shuffled[0].id] = 'assassin';
      // First resistance member becomes Commander
      newRoles[shuffled[matrix.spyCount].id] = 'commander';
    }

    return newRoles;
  };

  const handleStartGame = () => {
    const assigned = assignRoles(players.length, config.commanderMode);
    setRoles(assigned);
    setStage('playing');
  };

  const handleGameComplete = async (scoreDeltas: Record<string, number>) => {
    await commitRoundToSession(
      sessionId,
      'resistance',
      `The Resistance (${players.length} Players)`,
      scoreDeltas,
      {
        roles,
        commanderMode: config.commanderMode,
      }
    );
    onBackToHub();
  };

  const handlePlayAgain = async (scoreDeltas: Record<string, number>) => {
    await commitRoundToSession(
      sessionId,
      'resistance',
      `The Resistance (${players.length} Players)`,
      scoreDeltas,
      {
        roles,
        commanderMode: config.commanderMode,
      }
    );

    const assigned = assignRoles(players.length, config.commanderMode);
    setRoles(assigned);
    setStage('playing');
  };

  if (stage === 'rules') {
    return (
      <div className="w-full h-full flex-1 flex flex-col min-h-0 overflow-y-auto">
        <ResistanceRules
          playerCount={players.length}
          onProceed={() => setStage('settings')}
          onBack={onBackToHub}
        />
      </div>
    );
  }

  if (stage === 'settings') {
    return (
      <div className="w-full h-full flex-1 flex flex-col min-h-0 overflow-y-auto">
        <ResistanceSettings
          playerCount={players.length}
          config={config}
          onChange={handleConfigChange}
          onStart={handleStartGame}
          onBack={() => setStage('rules')}
          onViewRules={() => setStage('rules')}
        />
      </div>
    );
  }

  return (
    <div className="w-full h-full flex-1 flex flex-col min-h-0 overflow-y-auto">
      <ResistancePlay
        players={players}
        roles={roles}
        config={config}
        onGameComplete={handleGameComplete}
        onPlayAgain={handlePlayAgain}
      />
    </div>
  );
};
