import React, { useState, useEffect } from 'react';
import { Player } from '../../services/db';
import { sound } from '../../services/soundboard';
import { haptics } from '../../services/haptics';
import confetti from 'canvas-confetti';
import {
  MapPin,
  Eye,
  EyeOff,
  Clock,
  Play,
  Pause,
  AlertTriangle,
  HelpCircle,
  Check,
  X,
  ArrowRight,
  Shield,
  Search,
  Sparkles,
  RotateCcw,
} from 'lucide-react';
import { SpyfallLocation, SpyfallConfig, SPYFALL_LOCATIONS } from './spyfallData';

interface SpyfallPlayProps {
  players: Player[];
  location: SpyfallLocation;
  spyPlayerId: string;
  playerRoles: Record<string, string>; // playerId -> role name
  config: SpyfallConfig;
  onGameComplete: (scoreDeltas: Record<string, number>) => void;
  onPlayAgain: (scoreDeltas: Record<string, number>) => void;
}

type SpyfallPhase =
  | 'card_peek'
  | 'investigation'
  | 'room_accusation'
  | 'spy_guess_location'
  | 'results';

export const SpyfallPlay: React.FC<SpyfallPlayProps> = ({
  players,
  location,
  spyPlayerId,
  playerRoles,
  config,
  onGameComplete,
  onPlayAgain,
}) => {
  const [phase, setPhase] = useState<SpyfallPhase>('card_peek');

  // Peek State
  const [peekIndex, setPeekIndex] = useState<number>(0);
  const [isCardRevealed, setIsCardRevealed] = useState<boolean>(false);

  // Investigation Timer State
  const [secondsLeft, setSecondsLeft] = useState<number>(config.timerMinutes * 60);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(true);
  const [currentQuestionerIndex, setCurrentQuestionerIndex] = useState<number>(0);
  const [showLocationRef, setShowLocationRef] = useState<boolean>(false);

  // Accusation & Guess State
  const [accusedPlayerId, setAccusedPlayerId] = useState<string | null>(null);
  const [spyGuessedLocationId, setSpyGuessedLocationId] = useState<string | null>(null);
  const [outcomeReason, setOutcomeReason] = useState<string>('');

  const spyPlayer = players.find(p => p.id === spyPlayerId);
  const currentQuestioner = players[currentQuestionerIndex % players.length];

  // 1. Timer countdown effect
  useEffect(() => {
    if (phase !== 'investigation' || !isTimerRunning) return;

    const timer = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          sound.playBuzzer();
          haptics.heavy();
          setPhase('room_accusation');
          setOutcomeReason('Time expired! The room must now hold a vote to catch the Spy!');
          return 0;
        }
        if (prev <= 10) {
          sound.playTick(true);
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phase, isTimerRunning]);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins}:${remainder < 10 ? '0' : ''}${remainder}`;
  };

  // 2. Card Peek Handlers
  const handlePeekNext = () => {
    sound.playPop();
    setIsCardRevealed(false);
    if (peekIndex < players.length - 1) {
      setPeekIndex(i => i + 1);
    } else {
      sound.playFanfare();
      // Pick random starting player for first question
      setCurrentQuestionerIndex(Math.floor(Math.random() * players.length));
      setPhase('investigation');
    }
  };

  // 3. Accusation Handlers
  const handleSelectAccused = (targetId: string) => {
    sound.playBuzzer();
    haptics.heavy();
    setAccusedPlayerId(targetId);

    if (targetId === spyPlayerId) {
      // Caught the Spy! But the Spy gets 1 last chance to guess the location!
      sound.playTensionPulse();
      setOutcomeReason('The room correctly identified the Spy! Now the Spy gets ONE guess to steal!');
      setPhase('spy_guess_location');
    } else {
      // Room accused an innocent! Spy wins!
      const innocent = players.find(p => p.id === targetId);
      sound.playSabotage();
      setOutcomeReason(`The room accused innocent ${innocent?.name}! The Spy escaped unnoticed!`);
      setPhase('results');
    }
  };

  // 4. Spy Location Guess Handlers
  const handleSpyLocationGuess = (locId: string) => {
    setSpyGuessedLocationId(locId);

    if (locId === location.id) {
      // Spy guessed correctly!
      sound.playSabotage();
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 } });
      setOutcomeReason(`The Spy correctly guessed the secret location (${location.name}) and stole the victory!`);
    } else {
      // Spy guessed wrong!
      const guessed = SPYFALL_LOCATIONS.find(l => l.id === locId);
      sound.playVictory();
      setOutcomeReason(`The Spy guessed "${guessed?.name}", which was WRONG! The Innocents win!`);
    }
    setPhase('results');
  };

  // Compute final scores
  const spyWon =
    spyGuessedLocationId === location.id ||
    (accusedPlayerId !== null && accusedPlayerId !== spyPlayerId) ||
    outcomeReason.includes('escaped unnoticed');

  const scoreDeltas: Record<string, number> = {};
  players.forEach(p => {
    if (p.id === spyPlayerId) {
      scoreDeltas[p.id] = spyWon ? 3 : 1;
    } else {
      scoreDeltas[p.id] = spyWon ? 1 : 2;
    }
  });

  // ===================== PHASE 1: CARD PEEK =====================
  if (phase === 'card_peek') {
    const activePlayer = players[peekIndex];
    const isSpy = activePlayer.id === spyPlayerId;
    const role = playerRoles[activePlayer.id] || 'Participant';

    return (
      <div className="w-full max-w-sm mx-auto neo-card-lg p-6 text-center space-y-6 bg-white select-none my-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#BAE6FD] border-2 border-black text-xs font-black uppercase text-sky-950">
          <MapPin className="w-3.5 h-3.5 text-sky-700" /> Secret Location Peek ({peekIndex + 1}/{players.length})
        </div>

        <div className="space-y-1">
          <div className="text-xs font-black uppercase tracking-wider text-gray-500">Pass Phone To:</div>
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl border-3 border-black bg-[#FEF08A] shadow-[4px_4px_0px_#000] my-2">
            <span className="text-3xl">{activePlayer.avatarEmoji}</span>
            <span className="text-2xl font-black">{activePlayer.name}</span>
          </div>
        </div>

        {!isCardRevealed ? (
          <div className="space-y-3 pt-2">
            <p className="text-xs font-bold text-gray-600">
              Make sure only <b>{activePlayer.name}</b> can see the screen!
            </p>
            <button
              onClick={() => {
                sound.playSecretReveal();
                haptics.medium();
                setIsCardRevealed(true);
              }}
              className="w-full neo-btn py-4 bg-[#BAE6FD] hover:bg-[#93C5FD] text-base font-black text-[#18181B] flex items-center justify-center gap-2"
            >
              <Eye className="w-5 h-5" /> Tap to Reveal Location
            </button>
          </div>
        ) : (
          <div className="space-y-4 animate-pop">
            {isSpy ? (
              <div className="p-4 rounded-2xl border-3 border-red-500 bg-red-100 text-red-950 space-y-2 text-left animate-shake">
                <div className="text-base font-black flex items-center gap-1.5 text-red-950">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  YOU ARE THE SPY!
                </div>
                <p className="text-xs font-bold text-red-900 leading-snug">
                  You have NO IDEA where anyone is! Listen carefully to everyone's questions and answers, blend in, and try to deduce the location!
                </p>
                <div className="p-2.5 rounded-xl border border-red-400 bg-white/70 text-xs font-black text-red-950">
                  💡 At any time, you can stop the game and guess the location to steal the win!
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl border-3 border-sky-500 bg-sky-50 text-sky-950 space-y-2 text-left">
                <span className="text-[10px] font-black uppercase tracking-wider text-sky-800">
                  Secret Location:
                </span>
                <div className="text-2xl font-black text-sky-950 flex items-center gap-2">
                  <span>{location.emoji}</span>
                  <span>{location.name}</span>
                </div>
                <div className="p-2.5 rounded-xl border border-sky-300 bg-white/80 space-y-0.5">
                  <span className="text-[10px] font-black uppercase text-gray-500">Your Assigned Role:</span>
                  <div className="text-sm font-black text-indigo-900">{role}</div>
                </div>
                <p className="text-[11px] font-bold text-sky-900 leading-snug">
                  Answer questions without saying the location directly so the Spy doesn't guess it!
                </p>
              </div>
            )}

            <button
              onClick={handlePeekNext}
              className="w-full neo-btn py-4 bg-[#FEF08A] hover:bg-[#FDE047] text-base font-black text-[#18181B] flex items-center justify-center gap-2"
            >
              <EyeOff className="w-5 h-5" />
              {peekIndex < players.length - 1 ? 'Hide & Pass to Next Player ➡️' : 'All Set! Start Investigation 🔍'}
            </button>
          </div>
        )}
      </div>
    );
  }

  // ===================== PHASE 2: INVESTIGATION TIMER =====================
  if (phase === 'investigation') {
    return (
      <div className="w-full max-w-sm mx-auto space-y-4 select-none pb-12">
        {/* Timer Card */}
        <div className="neo-card p-4 bg-white border-3 border-black text-center space-y-2 shadow-[4px_4px_0px_#000]">
          <div className="flex items-center justify-between text-xs font-black text-gray-500">
            <span className="uppercase tracking-wider">Investigation Clock</span>
            <button
              onClick={() => {
                sound.playPop();
                setIsTimerRunning(r => !r);
              }}
              className="p-1 rounded-lg border border-black bg-gray-100 flex items-center gap-1 text-[11px]"
            >
              {isTimerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              {isTimerRunning ? 'Pause' : 'Resume'}
            </button>
          </div>

          <div
            className={`text-5xl font-mono font-black tracking-tight ${
              secondsLeft <= 60 ? 'text-red-600 animate-pulse' : 'text-[#18181B]'
            }`}
          >
            {formatTime(secondsLeft)}
          </div>
        </div>

        {/* Current Questioner Turn Banner */}
        <div className="neo-card p-3.5 bg-[#FEF08A] border-3 border-black space-y-1.5 shadow-[3px_3px_0px_#000]">
          <div className="text-[10px] font-black uppercase tracking-wider text-amber-900">
            Current Questioner
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-lg font-black text-amber-950">
              <span>{currentQuestioner.avatarEmoji}</span>
              <span>{currentQuestioner.name}</span>
            </div>
            <button
              onClick={() => {
                sound.playPop();
                setCurrentQuestionerIndex(idx => (idx + 1) % players.length);
              }}
              className="neo-btn neo-btn-sm py-1.5 px-3 bg-white text-xs font-black text-black shadow-[1px_1px_0px_#000]"
            >
              Pass Questioner ➡️
            </button>
          </div>
          <p className="text-[11px] font-bold text-amber-950 leading-snug">
            <b>{currentQuestioner.name}</b> must ask ANY player ONE clever question about the location!
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-1">
          <button
            onClick={() => {
              sound.playBuzzer();
              haptics.heavy();
              setIsTimerRunning(false);
              setPhase('room_accusation');
            }}
            className="w-full neo-btn py-3.5 bg-[#FECDD3] hover:bg-[#FDA4AF] text-sm font-black text-red-950 flex items-center justify-center gap-2 shadow-[3px_3px_0px_#000]"
          >
            <AlertTriangle className="w-4 h-4 text-red-700" />
            Stop Clock &amp; Accuse a Suspect 🎯
          </button>

          <button
            onClick={() => {
              sound.playFanfare();
              haptics.heavy();
              setIsTimerRunning(false);
              setPhase('spy_guess_location');
            }}
            className="w-full neo-btn py-3 bg-[#A7F3D0] hover:bg-[#86EFAC] text-xs font-black text-emerald-950 flex items-center justify-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
            "I Am the Spy &amp; I Know the Location!" 📍
          </button>

          {/* Toggle All Locations Reference (Fair for Spy and Innocents) */}
          <button
            onClick={() => setShowLocationRef(s => !s)}
            className="w-full py-2 rounded-xl border border-black bg-gray-50 text-[11px] font-black text-gray-700 flex items-center justify-center gap-1"
          >
            <Search className="w-3.5 h-3.5" />
            {showLocationRef ? 'Hide Possible Locations' : `View All ${SPYFALL_LOCATIONS.length} Possible Locations`}
          </button>

          {showLocationRef && (
            <div className="neo-card p-3 bg-white border-2 border-black max-h-[180px] overflow-y-auto space-y-1">
              <div className="text-[10px] font-black uppercase text-gray-500">Possible Locations List:</div>
              <div className="grid grid-cols-2 gap-1 text-[11px] font-bold text-gray-800">
                {SPYFALL_LOCATIONS.map(loc => (
                  <span key={loc.id} className="truncate">
                    {loc.emoji} {loc.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ===================== PHASE 3: ROOM ACCUSATION =====================
  if (phase === 'room_accusation') {
    return (
      <div className="w-full max-w-sm mx-auto neo-card-lg p-5 text-center space-y-4 bg-white select-none my-auto">
        <div className="text-4xl animate-bounce">🕵️</div>
        <div className="space-y-1">
          <span className="neo-badge bg-[#FECDD3] text-xs font-black uppercase text-red-950">
            Room Accusation
          </span>
          <h2 className="text-2xl font-black text-[#18181B]">Who is the Spy?</h2>
          <p className="text-xs font-bold text-gray-600 leading-snug">
            Count down "3, 2, 1, POINT!" — tap the suspect the room votes to accuse:
          </p>
        </div>

        <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
          {players.map(p => (
            <button
              key={p.id}
              onClick={() => handleSelectAccused(p.id)}
              className="w-full p-3 rounded-2xl border-3 border-black bg-gray-50 hover:bg-rose-50 text-left flex items-center justify-between shadow-[2px_2px_0px_#000] active:translate-y-0.5"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">{p.avatarEmoji}</span>
                <span className="text-sm font-black text-[#18181B]">{p.name}</span>
              </div>
              <span className="text-xs font-bold text-red-600">Accuse 🎯</span>
            </button>
          ))}
        </div>

        <button
          onClick={() => {
            sound.playPop();
            setIsTimerRunning(true);
            setPhase('investigation');
          }}
          className="w-full py-2 text-xs font-black text-gray-500 hover:text-black"
        >
          Cancel &amp; Resume Timer ⏱️
        </button>
      </div>
    );
  }

  // ===================== PHASE 4: SPY GUESS LOCATION =====================
  if (phase === 'spy_guess_location') {
    return (
      <div className="w-full max-w-sm mx-auto space-y-3.5 select-none pb-12">
        <div className="neo-card p-4 bg-[#FEF08A] border-3 border-black text-center space-y-1 shadow-[3px_3px_0px_#000]">
          <div className="text-3xl animate-bounce">📍</div>
          <h2 className="text-xl font-black text-amber-950">The Spy's Location Guess!</h2>
          <p className="text-xs font-bold text-amber-900 leading-snug">
            {spyPlayer?.name} (The Spy) must pick where everyone is from the list below:
          </p>
        </div>

        {/* Location Selection Grid */}
        <div className="grid grid-cols-1 gap-2 max-h-[380px] overflow-y-auto pr-1">
          {SPYFALL_LOCATIONS.map(loc => (
            <button
              key={loc.id}
              onClick={() => handleSpyLocationGuess(loc.id)}
              className="p-3 rounded-2xl border-2 border-black bg-white hover:bg-[#BAE6FD] text-left flex items-center justify-between shadow-[2px_2px_0px_#000] active:scale-[0.99] transition-all"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">{loc.emoji}</span>
                <div>
                  <div className="text-sm font-black text-[#18181B]">{loc.name}</div>
                  <div className="text-[10px] font-bold text-gray-500">{loc.category}</div>
                </div>
              </div>
              <span className="text-xs font-black text-sky-800">Guess 🎯</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ===================== PHASE 5: RESULTS SCREEN =====================
  return (
    <div className="w-full max-w-sm mx-auto neo-card-lg p-6 text-center space-y-5 bg-white select-none my-auto">
      <div className="text-5xl animate-bounce">{spyWon ? '🕵️' : '🎉'}</div>

      <div className="space-y-1">
        <div className="text-xs font-black uppercase tracking-wider text-indigo-700">Investigation Closed</div>
        <h2 className="text-2xl font-black text-[#18181B]">
          {spyWon ? 'The Spy Wins!' : 'Innocents Win!'}
        </h2>
        <p className="text-xs font-bold text-gray-600 leading-snug">{outcomeReason}</p>
      </div>

      {/* Location & Spy Reveal Box */}
      <div className="p-3.5 rounded-2xl border-3 border-black bg-gray-50 text-left space-y-1.5 text-xs font-bold shadow-[2px_2px_0px_#000]">
        <div className="flex items-center justify-between">
          <span className="text-gray-600">The Secret Location:</span>
          <span className="font-black text-indigo-900">
            {location.emoji} {location.name}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-600">The Spy:</span>
          <span className="font-black text-red-700">
            {spyPlayer?.avatarEmoji} {spyPlayer?.name}
          </span>
        </div>
      </div>

      {/* Points Awarded List */}
      <div className="space-y-1.5 text-left">
        <span className="text-[11px] font-black uppercase text-gray-500">Points Awarded:</span>
        <div className="space-y-1 max-h-[180px] overflow-y-auto pr-1">
          {players.map(p => {
            const isSpy = p.id === spyPlayerId;
            const pts = scoreDeltas[p.id] || 0;
            return (
              <div
                key={p.id}
                className="px-3 py-2 rounded-xl border-2 border-black flex items-center justify-between bg-white text-xs font-black"
              >
                <div className="flex items-center gap-2">
                  <span>{p.avatarEmoji}</span>
                  <span>{p.name}</span>
                  {isSpy && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-100 text-red-900 border border-red-300">
                      Spy
                    </span>
                  )}
                </div>
                <span className="text-emerald-700 font-mono">+{pts} pts</span>
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
            onPlayAgain(scoreDeltas);
          }}
          className="w-full neo-btn py-3.5 bg-[#A7F3D0] hover:bg-[#86EFAC] text-base font-black text-[#18181B] flex items-center justify-center gap-2 shadow-[3px_3px_0px_#000]"
        >
          Play Another Location 📍 🔁
        </button>
        <button
          onClick={() => {
            sound.playPop();
            onGameComplete(scoreDeltas);
          }}
          className="w-full neo-btn py-3 bg-[#FEF08A] hover:bg-[#FDE047] text-sm font-black text-[#18181B] flex items-center justify-center gap-2"
        >
          Save Points & Return to Hub <ArrowRight className="w-5 h-5 stroke-[3]" />
        </button>
      </div>
    </div>
  );
};
