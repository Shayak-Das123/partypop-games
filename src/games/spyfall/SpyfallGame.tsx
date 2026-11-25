import React, { useState } from 'react';
import { Player, commitRoundToSession } from '../../services/db';
import { SpyfallRules } from './SpyfallRules';
import { SpyfallSettings } from './SpyfallSettings';
import { SpyfallPlay } from './SpyfallPlay';
import { SpyfallConfig, SpyfallLocation, SPYFALL_LOCATIONS } from './spyfallData';
import { getNonRepeatingItem } from '../../services/sessionDeckManager';

interface SpyfallGameProps {
  sessionId: string;
  players: Player[];
  onBackToHub: () => void;
}

type Stage = 'rules' | 'settings' | 'playing';

export const SpyfallGame: React.FC<SpyfallGameProps> = ({
  sessionId,
  players,
  onBackToHub,
}) => {
  // First page is the dedicated 3-page How to Play / Rules Guide!
  const [stage, setStage] = useState<Stage>('rules');
  const [config, setConfig] = useState<SpyfallConfig>(() => {
    try {
      const saved = localStorage.getItem('partypop_spyfall_config');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      timerMinutes: 6,
    };
  });

  const [location, setLocation] = useState<SpyfallLocation>(SPYFALL_LOCATIONS[0]);
  const [spyPlayerId, setSpyPlayerId] = useState<string>('');
  const [playerRoles, setPlayerRoles] = useState<Record<string, string>>({});

  const handleConfigChange = (newConfig: SpyfallConfig) => {
    setConfig(newConfig);
    try {
      localStorage.setItem('partypop_spyfall_config', JSON.stringify(newConfig));
    } catch {}
  };

  const setupRound = () => {
    // Pick random location (non-repeating in session)
    const randomLoc = getNonRepeatingItem(sessionId, 'spyfall_locations', SPYFALL_LOCATIONS, loc => loc.id);
    // Pick random spy
    const randomSpy = players[Math.floor(Math.random() * players.length)].id;

    // Distribute roles
    const shuffledRoles = [...randomLoc.roles].sort(() => Math.random() - 0.5);
    const assignedRoles: Record<string, string> = {};

    let roleIdx = 0;
    players.forEach(p => {
      if (p.id !== randomSpy) {
        assignedRoles[p.id] = shuffledRoles[roleIdx % shuffledRoles.length];
        roleIdx++;
      } else {
        assignedRoles[p.id] = 'The Spy 🕵️';
      }
    });

    setLocation(randomLoc);
    setSpyPlayerId(randomSpy);
    setPlayerRoles(assignedRoles);
  };

  const handleStartGame = () => {
    setupRound();
    setStage('playing');
  };

  const handleGameComplete = async (scoreDeltas: Record<string, number>) => {
    await commitRoundToSession(
      sessionId,
      'spyfall',
      `Spyfall: ${location.name}`,
      scoreDeltas,
      {
        locationId: location.id,
        locationName: location.name,
        spyPlayerId,
      }
    );
    onBackToHub();
  };

  const handlePlayAgain = async (scoreDeltas: Record<string, number>) => {
    await commitRoundToSession(
      sessionId,
      'spyfall',
      `Spyfall: ${location.name}`,
      scoreDeltas,
      {
        locationId: location.id,
        locationName: location.name,
        spyPlayerId,
      }
    );

    setupRound();
    setStage('playing');
  };

  if (stage === 'rules') {
    return (
      <div className="w-full h-full flex-1 flex flex-col min-h-0 overflow-y-auto">
        <SpyfallRules
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
        <SpyfallSettings
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
      <SpyfallPlay
        players={players}
        location={location}
        spyPlayerId={spyPlayerId}
        playerRoles={playerRoles}
        config={config}
        onGameComplete={handleGameComplete}
        onPlayAgain={handlePlayAgain}
      />
    </div>
  );
};
