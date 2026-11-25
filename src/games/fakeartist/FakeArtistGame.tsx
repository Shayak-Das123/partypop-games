import React, { useState } from 'react';
import { Player, commitRoundToSession } from '../../services/db';
import { FakeArtistSettings, FakeArtistConfig } from './FakeArtistSettings';
import { FakeArtistPlay } from './FakeArtistPlay';
import { ArtPromptCard, getNonRepeatingArtCard } from './data/artWords';
import { DrawStroke } from './FakeArtistCanvas';

interface FakeArtistGameProps {
  sessionId: string;
  players: Player[];
  onBackToHub: () => void;
}

type FakeArtistStage = 'settings' | 'playing';

export const FakeArtistGame: React.FC<FakeArtistGameProps> = ({
  sessionId,
  players,
  onBackToHub,
}) => {
  const [stage, setStage] = useState<FakeArtistStage>('settings');
  const [config, setConfig] = useState<FakeArtistConfig>(() => {
    try {
      const saved = localStorage.getItem('partypop_fakeartist_config');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      roundsCount: 2,
      stylusMode: true,
    };
  });

  const handleConfigChange = (newConfig: FakeArtistConfig) => {
    setConfig(newConfig);
    try {
      localStorage.setItem('partypop_fakeartist_config', JSON.stringify(newConfig));
    } catch {}
  };

  const [currentCard, setCurrentCard] = useState<ArtPromptCard>(() => getNonRepeatingArtCard(sessionId));
  const [fakeArtistId, setFakeArtistId] = useState<string>('');

  const handleStartGame = () => {
    // Pick random card and random Fake Artist (non-repeating in session)
    const randomCard = getNonRepeatingArtCard(sessionId);
    const randomFake = players[Math.floor(Math.random() * players.length)].id;
    setCurrentCard(randomCard);
    setFakeArtistId(randomFake);
    setStage('playing');
  };

  const handleGameComplete = async (
    scoreDeltas: Record<string, number>,
    strokes: DrawStroke[]
  ) => {
    await commitRoundToSession(
      sessionId,
      'fake_artist',
      `Fake Artist: ${currentCard.word} (${currentCard.category})`,
      scoreDeltas,
      {
        category: currentCard.category,
        word: currentCard.word,
        fakeArtistId,
        strokeCount: strokes.length,
      }
    );

    onBackToHub();
  };

  const handlePlayAgain = async (
    scoreDeltas: Record<string, number>,
    strokes: DrawStroke[]
  ) => {
    await commitRoundToSession(
      sessionId,
      'fake_artist',
      `Fake Artist: ${currentCard.word} (${currentCard.category})`,
      scoreDeltas,
      {
        category: currentCard.category,
        word: currentCard.word,
        fakeArtistId,
        strokeCount: strokes.length,
      }
    );

    // Pick new random card and new Fake Artist (non-repeating in session)
    const randomCard = getNonRepeatingArtCard(sessionId);
    const randomFake = players[Math.floor(Math.random() * players.length)].id;
    setCurrentCard(randomCard);
    setFakeArtistId(randomFake);
    setStage('playing');
  };

  if (stage === 'settings') {
    return (
      <div className="w-full h-full flex-1 flex flex-col min-h-0 overflow-y-auto">
        <FakeArtistSettings
          config={config}
          onChange={handleConfigChange}
          onStart={handleStartGame}
          onBack={onBackToHub}
          playerCount={players.length}
        />
      </div>
    );
  }

  return (
    <div className="w-full h-full flex-1 flex flex-col min-h-0 overflow-hidden">
      <FakeArtistPlay
        key={`${currentCard.word}-${fakeArtistId}`}
        players={players}
        card={currentCard}
        fakeArtistId={fakeArtistId}
        config={config}
        onGameComplete={handleGameComplete}
        onPlayAgain={handlePlayAgain}
      />
    </div>
  );
};
