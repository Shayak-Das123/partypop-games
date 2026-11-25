import React, { useState, useRef, useEffect } from 'react';
import { Player } from '../../services/db';
import { ArtPromptCard, PLAYER_DRAWING_COLORS } from './data/artWords';
import { FakeArtistConfig } from './FakeArtistSettings';
import { FakeArtistCanvas, DrawStroke } from './FakeArtistCanvas';
import { FakeArtistBallot } from './FakeArtistBallot';
import { sound } from '../../services/soundboard';
import { haptics } from '../../services/haptics';
import confetti from 'canvas-confetti';
import { Eye, EyeOff, Sparkles, Check, AlertTriangle, HelpCircle, Trophy, ArrowRight, Undo2 } from 'lucide-react';

interface FakeArtistPlayProps {
  players: Player[];
  card: ArtPromptCard;
  fakeArtistId: string;
  config: FakeArtistConfig;
  onGameComplete: (scoreDeltas: Record<string, number>, strokes: DrawStroke[]) => void;
  onPlayAgain: (scoreDeltas: Record<string, number>, strokes: DrawStroke[]) => void;
}

type PlayPhase = 'secret_reveal' | 'drawing' | 'artwork_review' | 'voting' | 'fake_guess' | 'results';

/**
 * Dedicated ArtworkReviewCanvas renders the complete canvas at native DPR
 * without interactive event handlers so players can examine the drawing.
 */
const ArtworkReviewCanvas: React.FC<{ strokes: DrawStroke[] }> = ({ strokes }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const render = () => {
      const rect = container.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      strokes.forEach(stroke => {
        if (stroke.points.length < 2) return;
        ctx.beginPath();
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = Math.max(3.5 * dpr, 4);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
        for (let i = 1; i < stroke.points.length; i++) {
          ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
        }
        ctx.stroke();
      });
    };

    render();
    const ro = new ResizeObserver(render);
    ro.observe(container);
    return () => ro.disconnect();
  }, [strokes]);

  return (
    <div
      ref={containerRef}
      className="relative w-full flex-1 min-h-0 bg-white rounded-2xl md:rounded-3xl border-3 md:border-4 border-black shadow-[4px_4px_0px_#000] overflow-hidden"
      style={{
        backgroundImage: 'radial-gradient(#CBD5E1 1.5px, transparent 1.5px)',
        backgroundSize: '24px 24px',
      }}
    >
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
};

export const FakeArtistPlay: React.FC<FakeArtistPlayProps> = ({
  players,
  card,
  fakeArtistId,
  config,
  onGameComplete,
  onPlayAgain,
}) => {
  const [phase, setPhase] = useState<PlayPhase>('secret_reveal');
  const [revealIndex, setRevealIndex] = useState<number>(0);
  const [isRevealed, setIsRevealed] = useState<boolean>(false);

  // Drawing state
  const [currentRound, setCurrentRound] = useState<number>(0);
  const [drawingPlayerIndex, setDrawingPlayerIndex] = useState<number>(0);
  const [strokes, setStrokes] = useState<DrawStroke[]>([]);
  const [stylusMode, setStylusMode] = useState<boolean>(config.stylusMode);

  // Voting state
  const [accusedPlayerId, setAccusedPlayerId] = useState<string | null>(null);
  const [fakeArtistGuessedWord, setFakeArtistGuessedWord] = useState<boolean>(false);

  // Map each player to a unique drawing color
  const playerColorMap = new Map<string, string>();
  players.forEach((p, idx) => {
    playerColorMap.set(p.id, PLAYER_DRAWING_COLORS[idx % PLAYER_DRAWING_COLORS.length]);
  });

  // 1. Secret Reveal handlers
  const handleRevealNext = () => {
    sound.playPop();
    setIsRevealed(false);
    if (revealIndex < players.length - 1) {
      setRevealIndex(i => i + 1);
    } else {
      sound.playFanfare();
      setPhase('drawing');
    }
  };

  // 2. Stroke Finished handler (Auto-advance on stroke lift!)
  const handleStrokeFinished = (stroke: DrawStroke) => {
    const updatedStrokes = [...strokes, stroke];
    setStrokes(updatedStrokes);

    if (drawingPlayerIndex < players.length - 1) {
      setDrawingPlayerIndex(i => i + 1);
    } else {
      // Completed a full round of players!
      if (currentRound < config.roundsCount - 1) {
        sound.playSuccess();
        setCurrentRound(r => r + 1);
        setDrawingPlayerIndex(0);
      } else {
        // All rounds completed! Transition to artwork review instead of abruptly voting
        sound.playFanfare();
        setPhase('artwork_review');
      }
    }
  };

  const handleUndoLastStroke = () => {
    if (strokes.length === 0) return;
    setStrokes(prev => prev.slice(0, -1));
    if (drawingPlayerIndex > 0) {
      setDrawingPlayerIndex(i => i - 1);
    } else if (currentRound > 0) {
      setCurrentRound(r => r - 1);
      setDrawingPlayerIndex(players.length - 1);
    }
  };

  // 3. Voting & Outcome resolution
  const handleVoteSubmit = (votedId: string) => {
    sound.playBuzzer();
    haptics.heavy();
    setAccusedPlayerId(votedId);

    if (votedId === fakeArtistId) {
      // The room caught the Fake Artist! Now Fake Artist has 1 guess to steal the win!
      setPhase('fake_guess');
    } else {
      // Room voted for an innocent artist! Fake Artist wins!
      setPhase('results');
    }
  };

  const handleFakeGuessResult = (guessedCorrectly: boolean) => {
    if (guessedCorrectly) {
      sound.playFanfare();
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.5 } });
      setFakeArtistGuessedWord(true);
    } else {
      sound.playSuccess();
      setFakeArtistGuessedWord(false);
    }
    setPhase('results');
  };

  // Calculate scores
  const scoreDeltas: Record<string, number> = {};
  players.forEach(p => (scoreDeltas[p.id] = 0));

  const fakeCaught = accusedPlayerId === fakeArtistId;
  const fakeEscaped = !fakeCaught;
  const fakeStoleWin = fakeCaught && fakeArtistGuessedWord;

  if (fakeEscaped || fakeStoleWin) {
    // Fake Artist wins +3 points
    scoreDeltas[fakeArtistId] = 3;
  } else {
    // Innocent Artists win +2 points each
    players.forEach(p => {
      if (p.id !== fakeArtistId) {
        scoreDeltas[p.id] = 2;
      }
    });
  }

  // PHASE 1: SECRET REVEAL
  if (phase === 'secret_reveal') {
    const currentPlayer = players[revealIndex];
    const isFake = currentPlayer.id === fakeArtistId;

    return (
      <div className="w-full h-full flex-1 flex flex-col items-center justify-center min-h-0 overflow-y-auto py-2">
        <div className="w-full max-w-sm mx-auto neo-card-lg p-6 text-center space-y-6 bg-white select-none my-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E0E7FF] border-2 border-black text-xs font-black uppercase text-indigo-950">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> Secret Role Check ({revealIndex + 1}/{players.length})
        </div>

        <div className="space-y-1">
          <div className="text-xs font-black uppercase tracking-wider text-gray-500">Pass Phone To:</div>
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl border-3 border-black bg-[#FEF08A] shadow-[4px_4px_0px_#000] my-2">
            <span className="text-3xl">{currentPlayer.avatarEmoji}</span>
            <span className="text-2xl font-black">{currentPlayer.name}</span>
          </div>
        </div>

        {!isRevealed ? (
          <div className="space-y-3 pt-2">
            <p className="text-xs font-bold text-gray-600">
              Make sure only <b>{currentPlayer.name}</b> can see the screen!
            </p>
            <button
              onClick={() => {
                sound.playPop();
                haptics.medium();
                setIsRevealed(true);
              }}
              className="w-full neo-btn py-4 bg-[#BAE6FD] hover:bg-[#93C5FD] text-base font-black text-[#18181B] flex items-center justify-center gap-2"
            >
              <Eye className="w-5 h-5" /> Tap to Reveal Secret
            </button>
          </div>
        ) : (
          <div className="space-y-4 animate-pop">
            <div className="p-4 rounded-2xl border-3 border-black bg-gray-50 space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-gray-500">Category</span>
              <div className="text-lg font-black text-indigo-900">{card.category}</div>

              {isFake ? (
                <div className="p-3 rounded-xl border-2 border-red-500 bg-red-100 text-red-950 space-y-1 animate-shake">
                  <div className="text-sm font-black flex items-center justify-center gap-1">
                    <AlertTriangle className="w-4 h-4 text-red-600" /> YOU ARE THE FAKE ARTIST!
                  </div>
                  <p className="text-xs font-bold text-red-900">
                    You don't know the word! Pretend you do, draw convincing strokes, and try to guess what everyone is drawing!
                  </p>
                </div>
              ) : (
                <div className="p-3 rounded-xl border-2 border-emerald-500 bg-emerald-100 text-emerald-950 space-y-0.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800">
                    Secret Word to Draw
                  </span>
                  <div className="text-3xl font-black text-emerald-950 font-mono tracking-wider">
                    {card.word}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={handleRevealNext}
              className="w-full neo-btn py-4 bg-[#FEF08A] hover:bg-[#FDE047] text-base font-black text-[#18181B] flex items-center justify-center gap-2"
            >
              <EyeOff className="w-5 h-5" />
              {revealIndex < players.length - 1 ? 'Hide & Pass to Next Player ➡️' : 'All Set! Start Drawing 🎨'}
            </button>
          </div>
        )}
        </div>
      </div>
    );
  }

  // PHASE 2: DRAWING CANVAS
  if (phase === 'drawing') {
    const activePlayer = players[drawingPlayerIndex];
    const activeColor = playerColorMap.get(activePlayer.id) || '#000000';

    return (
      <div className="w-full h-full flex-1 flex flex-col min-h-0 overflow-hidden">
        <FakeArtistCanvas
          activePlayer={activePlayer}
          playerColor={activeColor}
          roundIndex={currentRound}
          totalRounds={config.roundsCount}
          existingStrokes={strokes}
          stylusMode={stylusMode}
          onToggleStylusMode={() => setStylusMode(s => !s)}
          onStrokeFinished={handleStrokeFinished}
          onUndoLastStroke={handleUndoLastStroke}
          canUndo={strokes.length > 0}
        />
      </div>
    );
  }

  // PHASE 2.5: ARTWORK REVIEW (Inspect drawing before voting)
  if (phase === 'artwork_review') {
    return (
      <div className="w-full h-full flex-1 flex flex-col min-h-0 overflow-hidden select-none space-y-2">
        {/* Top Review Header */}
        <div className="neo-card p-2.5 sm:p-3 bg-white border-3 border-black flex items-center justify-between shadow-[3px_3px_0px_#000] flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-2xl sm:text-3xl">🎨</span>
            <div>
              <div className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-indigo-700">
                Drawing Finished!
              </div>
              <h2 className="text-sm sm:text-base font-black text-[#18181B] leading-tight">
                Inspect The Masterpiece
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {strokes.length > 0 && (
              <button
                onClick={() => {
                  sound.playPass();
                  handleUndoLastStroke();
                  setPhase('drawing');
                }}
                className="px-2.5 py-1.5 rounded-xl border-2 border-black bg-rose-100 hover:bg-rose-200 text-rose-950 text-xs font-black flex items-center gap-1 shadow-[2px_2px_0px_#000] active:translate-y-0.5 transition-all cursor-pointer"
                title="Undo last stroke and resume drawing"
              >
                <Undo2 className="w-3.5 h-3.5" />
                <span>Undo</span>
              </button>
            )}

            <button
              onClick={() => {
                sound.playPop();
                setPhase('voting');
              }}
              className="neo-btn px-3 sm:px-4 py-1.5 sm:py-2 bg-[#FEF08A] hover:bg-[#FDE047] text-xs sm:text-sm font-black text-[#18181B] flex items-center gap-1 shadow-[2px_2px_0px_#000] cursor-pointer"
            >
              <span>Continue to Voting 🗳️</span>
              <ArrowRight className="w-4 h-4 stroke-[3]" />
            </button>
          </div>
        </div>

        {/* Full Finished Canvas */}
        <ArtworkReviewCanvas strokes={strokes} />

        {/* Bottom Legend showing Player Names and Assigned Stroke Colors */}
        <div className="neo-card p-2 sm:p-2.5 bg-white border-2 border-black shadow-[2px_2px_0px_#000] flex-shrink-0">
          <div className="text-[10px] font-black uppercase text-gray-500 mb-1.5 flex items-center justify-between">
            <span>Color Legend (Who Drew What):</span>
            <span className="text-indigo-600 font-extrabold">{strokes.length} Strokes on Canvas</span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {players.map(p => {
              const pColor = playerColorMap.get(p.id) || '#000';
              return (
                <div
                  key={p.id}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border-2 border-black bg-gray-50 text-xs font-black shadow-[1px_1px_0px_#000]"
                >
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-black inline-block flex-shrink-0"
                    style={{ backgroundColor: pColor }}
                  />
                  <span>{p.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // PHASE 3: VOTING (Who was the Fake Artist?)
  if (phase === 'voting') {
    // If more than 6 players: run confidential pass-and-play voting ballot like Imposter game!
    if (players.length > 6) {
      return (
        <div className="w-full h-full flex-1 flex flex-col items-center justify-center min-h-0 overflow-y-auto py-2">
          <FakeArtistBallot
            players={players}
            playerColorMap={playerColorMap}
            onCompleteBallot={(accusedId) => handleVoteSubmit(accusedId)}
          />
        </div>
      );
    }

    // <= 6 players: Quick open-room pointing accusation
    return (
      <div className="w-full h-full flex-1 flex flex-col items-center justify-center min-h-0 overflow-y-auto py-2">
        <div className="w-full max-w-sm mx-auto neo-card-lg p-6 text-center space-y-5 bg-white select-none my-auto">
          <div className="text-4xl animate-bounce">🕵️</div>
          <div className="space-y-1">
            <div className="text-xs font-black uppercase tracking-wider text-indigo-700">Art Complete!</div>
            <h2 className="text-2xl font-black text-[#18181B]">Who is the Fake Artist?</h2>
            <p className="text-xs font-bold text-gray-600">
              Count down "3, 2, 1..." and point at the suspect! Tap who the room accuses:
            </p>
          </div>

          <div className="space-y-2 pt-1 max-h-[300px] overflow-y-auto">
            {players.map(p => {
              const pColor = playerColorMap.get(p.id) || '#000';
              return (
                <button
                  key={p.id}
                  onClick={() => handleVoteSubmit(p.id)}
                  className="w-full p-3 rounded-2xl border-3 border-black bg-gray-50 hover:bg-[#E0E7FF] text-left flex items-center justify-between shadow-[2px_2px_0px_#000] active:translate-y-0.5 transition-all"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">{p.avatarEmoji}</span>
                    <span className="text-sm font-black text-[#18181B]">{p.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-black inline-block"
                      style={{ backgroundColor: pColor }}
                    />
                    <span className="text-xs font-bold text-gray-500">Accuse 🎯</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // PHASE 4: FAKE ARTIST STEAL GUESS
  if (phase === 'fake_guess') {
    const fakePlayer = players.find(p => p.id === fakeArtistId);

    return (
      <div className="w-full h-full flex-1 flex flex-col items-center justify-center min-h-0 overflow-y-auto py-2">
        <div className="w-full max-w-sm mx-auto neo-card-lg p-6 text-center space-y-5 bg-[#FEF3C7] border-4 border-black select-none my-auto">
          <div className="text-4xl animate-bounce">🚨</div>
          <div className="space-y-1">
            <div className="text-xs font-black uppercase tracking-wider text-amber-900">Caught!</div>
            <h2 className="text-2xl font-black text-amber-950">
              {fakePlayer?.name} was the Fake Artist!
            </h2>
            <p className="text-xs font-bold text-amber-900">
              BUT the Fake Artist gets ONE last chance to guess the secret word for a dramatic steal!
            </p>
          </div>

          <div className="p-4 rounded-2xl border-3 border-black bg-white space-y-1 text-center shadow-[3px_3px_0px_#000]">
            <span className="text-[10px] font-black uppercase text-gray-500">Secret Category</span>
            <div className="text-lg font-black text-indigo-900">{card.category}</div>
          </div>

          <div className="space-y-2.5 pt-2">
            <div className="text-xs font-bold text-gray-700">Did {fakePlayer?.name} guess the exact word ({card.word})?</div>
            <button
              onClick={() => handleFakeGuessResult(true)}
              className="w-full neo-btn py-3.5 bg-[#A7F3D0] hover:bg-[#86EFAC] text-sm font-black text-[#18181B] flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4 stroke-[3]" /> YES! They Guessed It! (+3 pts Fake)
            </button>
            <button
              onClick={() => handleFakeGuessResult(false)}
              className="w-full neo-btn py-3.5 bg-[#FECDD3] hover:bg-[#FDA4AF] text-sm font-black text-red-950 flex items-center justify-center gap-1.5"
            >
              ❌ No, They Had No Idea! (+2 pts Artists)
            </button>
          </div>
        </div>
      </div>
    );
  }

  // PHASE 5: RESULTS SCREEN
  const fakePlayer = players.find(p => p.id === fakeArtistId);
  const accusedPlayer = players.find(p => p.id === accusedPlayerId);

  return (
    <div className="w-full h-full flex-1 flex flex-col items-center justify-center min-h-0 overflow-y-auto py-2">
      <div className="w-full max-w-sm mx-auto neo-card-lg p-6 text-center space-y-5 bg-white select-none my-auto">
        <div className="text-4xl animate-bounce">
          {fakeEscaped || fakeStoleWin ? '🎭' : '🎨'}
        </div>

        <div className="space-y-1">
          <div className="text-xs font-black uppercase tracking-wider text-indigo-700">Round Over</div>
          <h2 className="text-2xl font-black text-[#18181B]">
            {fakeEscaped
              ? 'Fake Artist Escaped Unnoticed!'
              : fakeStoleWin
              ? 'Fake Artist Stole the Victory!'
              : 'The Artists Win!'}
          </h2>
          <p className="text-xs font-bold text-gray-600">
            The secret word was <span className="font-black text-indigo-700 font-mono text-sm underline">{card.word}</span>
          </p>
        </div>

        {/* Recap Box */}
        <div className="p-3.5 rounded-2xl border-3 border-black bg-gray-50 text-left space-y-1.5 text-xs font-bold shadow-[2px_2px_0px_#000]">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">The Fake Artist:</span>
            <span className="font-black text-red-700">{fakePlayer?.avatarEmoji} {fakePlayer?.name}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">The Accused:</span>
            <span className="font-black">{accusedPlayer?.avatarEmoji} {accusedPlayer?.name}</span>
          </div>
        </div>

        {/* Points Awarded List */}
        <div className="space-y-1.5 text-left">
          <span className="text-[11px] font-black uppercase text-gray-500">Points Awarded:</span>
          <div className="space-y-1">
            {players.map(p => {
              const pts = scoreDeltas[p.id] || 0;
              return (
                <div
                  key={p.id}
                  className="px-3 py-2 rounded-xl border-2 border-black flex items-center justify-between bg-white text-xs font-black"
                >
                  <div className="flex items-center gap-2">
                    <span>{p.avatarEmoji}</span>
                    <span>{p.name}</span>
                    {p.id === fakeArtistId && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-100 text-red-900 border border-red-300">
                        Fake
                      </span>
                    )}
                  </div>
                  <span className={pts > 0 ? 'text-emerald-700 font-mono' : 'text-gray-400 font-mono'}>
                    +{pts} pts
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-1">
          <button
            onClick={() => {
              sound.playFanfare();
              onPlayAgain(scoreDeltas, strokes);
            }}
            className="w-full neo-btn py-3.5 bg-[#A7F3D0] hover:bg-[#86EFAC] text-base font-black text-[#18181B] flex items-center justify-center gap-2 shadow-[3px_3px_0px_#000]"
          >
            Play Another Round 🎨 🔁
          </button>
          <button
            onClick={() => {
              sound.playPop();
              onGameComplete(scoreDeltas, strokes);
            }}
            className="w-full neo-btn py-3 bg-[#FEF08A] hover:bg-[#FDE047] text-sm font-black text-[#18181B] flex items-center justify-center gap-2"
          >
            Save Points & Return to Hub <ArrowRight className="w-5 h-5 stroke-[3]" />
          </button>
        </div>
      </div>
    </div>
  );
};
