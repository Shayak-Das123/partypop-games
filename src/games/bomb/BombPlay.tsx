import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Player } from '../../services/db';
import { BombConfig } from './BombSettings';
import { BOMB_PROMPTS } from './data/bombPrompts';
import { sound } from '../../services/soundboard';
import { haptics } from '../../services/haptics';
import { useDeviceMotionPass } from './useDeviceMotionPass';
import { getNonRepeatingItem } from '../../services/sessionDeckManager';
import { Flame, Pause, Play, Dices, Sparkles, AlertTriangle, ArrowRight } from 'lucide-react';

interface BombPlayProps {
  sessionId?: string;
  players: Player[];
  config: BombConfig;
  onRoundEnd: (explodedPlayer: Player, survivors: Player[]) => void;
}

function getRandomTurnSeconds(min: number, max: number): number {
  const actualMin = Math.max(1, min);
  const actualMax = Math.max(actualMin, max);
  return Math.floor(Math.random() * (actualMax - actualMin + 1)) + actualMin;
}

export const BombPlay: React.FC<BombPlayProps> = ({
  sessionId = 'global',
  players,
  config,
  onRoundEnd,
}) => {
  // Purely random secret countdown duration on round start
  const [turnDuration, setTurnDuration] = useState<number>(() => {
    return getRandomTurnSeconds(config.minSeconds, config.maxSeconds);
  });

  const [timeLeft, setTimeLeft] = useState<number>(turnDuration);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isExploded, setIsExploded] = useState<boolean>(false);
  const [passCount, setPassCount] = useState<number>(0);
  const [justPassedFeedback, setJustPassedFeedback] = useState<boolean>(false);

  // Non-repeating prompt from BOMB_PROMPTS
  const [currentPrompt, setCurrentPrompt] = useState<string>(() => {
    return getNonRepeatingItem(sessionId, 'bomb_prompts', BOMB_PROMPTS);
  });

  // Accusation state after explosion
  const [selectedExplodedPlayer, setSelectedExplodedPlayer] = useState<Player | null>(null);

  // Handle sudden surprise explosion
  const handleExplode = useCallback(() => {
    setIsExploded(true);
    sound.playExplosion();
    haptics.heavy();
  }, []);

  // Pass bomb (triggers upon physical motion/shake or manual tap)
  const handlePass = useCallback(() => {
    if (isExploded) return;

    sound.playWhooshPass();
    haptics.medium();

    // Roll fresh random secret timer for next player
    const newRandomDuration = getRandomTurnSeconds(config.minSeconds, config.maxSeconds);
    setTurnDuration(newRandomDuration);
    setTimeLeft(newRandomDuration);

    // Advance to next non-repeating prompt
    setCurrentPrompt(getNonRepeatingItem(sessionId, 'bomb_prompts', BOMB_PROMPTS));
    setPassCount(c => c + 1);

    // Visual pass flare
    setJustPassedFeedback(true);
    setTimeout(() => setJustPassedFeedback(false), 350);
  }, [isExploded, sessionId, config.minSeconds, config.maxSeconds]);

  // Motion sensor hook for physical shake / pass detection
  const { requestMotionPermission } = useDeviceMotionPass({
    onPass: handlePass,
    enabled: !isExploded && !isPaused,
    cooldownMs: 1100,
  });

  // Request sensor permission on first mount if needed
  useEffect(() => {
    requestMotionPermission();
  }, [requestMotionPermission]);

  // Secret internal timer (counts down secretly until boom!)
  useEffect(() => {
    if (isExploded || isPaused) return;

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        const next = Math.max(0, +(prev - 0.1).toFixed(1));
        if (next <= 0) {
          clearInterval(interval);
          handleExplode();
        }
        return next;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isExploded, isPaused, handleExplode]);

  // Urgent rapid ticking audio loop (plays consistent intense psychological tension, NOT tied to time left)
  useEffect(() => {
    if (isExploded || isPaused) return;

    // Fast urgent ticking at ~170 BPM to build immense adrenaline & panic
    const tickInterval = setInterval(() => {
      sound.playUrgentBombTick(1.0 + (Math.random() * 0.15 - 0.07));
    }, 350);

    return () => clearInterval(tickInterval);
  }, [isExploded, isPaused, passCount]);

  // 1. EXPLOSION & ACCUSATION SCREEN
  if (isExploded) {
    if (!selectedExplodedPlayer) {
      return (
        <div className="w-full max-w-sm mx-auto space-y-5 select-none pb-12 text-center animate-shake my-auto">
          {/* Explosion Headline */}
          <div className="p-6 rounded-3xl border-4 border-black bg-[#FECDD3] space-y-3 shadow-[6px_6px_0px_#000]">
            <div className="text-7xl animate-bounce">💥</div>
            <h2 className="text-4xl font-black text-red-600 uppercase tracking-tight">BOOM!</h2>
            <p className="text-base font-black text-[#18181B]">
              The bomb blew up!
            </p>
            <div className="p-3 bg-white rounded-2xl border-2 border-black text-xs font-bold text-gray-800">
              Whose hands was the bomb in when it exploded?
            </div>
          </div>

          {/* Player Selection Grid */}
          <div className="neo-card p-4 bg-white border-3 border-black space-y-3 shadow-[4px_4px_0px_#000]">
            <div className="text-xs font-black uppercase tracking-wider text-gray-600">
              Tap the player who got caught:
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {players.map(p => (
                <button
                  key={p.id}
                  onClick={() => {
                    sound.playPop();
                    haptics.heavy();
                    setSelectedExplodedPlayer(p);
                  }}
                  className="p-3 rounded-2xl border-3 border-black bg-rose-50 hover:bg-rose-100 flex items-center gap-2 text-left shadow-[2px_2px_0px_#000] active:translate-y-0.5 transition-all"
                >
                  <span className="text-2xl">{p.avatarEmoji}</span>
                  <span className="text-sm font-black text-[#18181B] truncate">{p.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      );
    }

    // Player Selected -> Show Score Breakdown & Continue
    const loser = selectedExplodedPlayer;
    const survivors = players.filter(p => p.id !== loser.id);

    return (
      <div className="w-full max-w-sm mx-auto space-y-6 select-none pb-12 text-center my-auto animate-pop">
        <div className="p-6 rounded-3xl border-4 border-black bg-[#FECDD3] space-y-3 shadow-[6px_6px_0px_#000]">
          <div className="text-6xl">💥💀</div>
          <h2 className="text-3xl font-black text-red-600 uppercase">Detonated On:</h2>
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl border-3 border-black bg-white shadow-[3px_3px_0px_#000]">
            <span className="text-3xl">{loser.avatarEmoji}</span>
            <span className="text-2xl font-black">{loser.name}</span>
          </div>

          <div className="p-3 bg-white/90 rounded-2xl border-2 border-black text-xs font-black text-gray-900 space-y-1">
            <div className="text-red-600">🚨 {loser.name} loses {config.penaltyPoints} points (-{config.penaltyPoints})</div>
            <div className="text-emerald-700">🛡️ All {survivors.length} survivors gain +{config.survivorPoints} point</div>
          </div>
        </div>

        <button
          onClick={() => {
            sound.playPop();
            onRoundEnd(loser, survivors);
          }}
          className="w-full neo-btn py-4 bg-[#FEF08A] hover:bg-[#FDE047] text-lg font-black text-[#18181B] shadow-[4px_4px_0px_#000] flex items-center justify-center gap-2"
        >
          <span>View Standings & Standings</span>
          <ArrowRight className="w-5 h-5 stroke-[3]" />
        </button>
      </div>
    );
  }

  // 2. ACTIVE TICKING BOMB SCREEN
  return (
    <div
      className={`w-full max-w-sm mx-auto space-y-4 select-none pb-10 transition-colors duration-200 ${
        justPassedFeedback ? 'bg-emerald-50 rounded-3xl' : ''
      }`}
    >
      {/* Top Controls & Pass Counter */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="neo-badge bg-[#FED7AA] text-[11px] font-black uppercase text-amber-950 flex items-center gap-1 shadow-[2px_2px_0px_#000]">
            <Dices className="w-3.5 h-3.5" /> Pass #{passCount}
          </span>
          <span className="text-[10px] font-black px-2.5 py-1 rounded-full border-2 border-black bg-white shadow-[1px_1px_0px_#000]">
            Pass in Any Order!
          </span>
        </div>
        <button
          onClick={() => {
            sound.playPop();
            setIsPaused(p => !p);
          }}
          className="neo-btn neo-btn-sm py-1 px-3 bg-white text-xs font-black flex items-center gap-1 shadow-[2px_2px_0px_#000]"
        >
          {isPaused ? <Play className="w-3.5 h-3.5 fill-black" /> : <Pause className="w-3.5 h-3.5 fill-black" />}
          {isPaused ? 'Resume' : 'Pause'}
        </button>
      </div>

      {/* Main Panic Centerpiece: Giant Shaking Animated Bomb with Burning Sparking Fuse */}
      <div className="neo-card p-6 bg-gradient-to-b from-amber-50 to-orange-100 border-4 border-black text-center space-y-4 shadow-[6px_6px_0px_#000] relative overflow-hidden">
        {/* Urgent Adrenaline Banner */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border-2 border-black bg-red-500 text-white text-xs font-black uppercase tracking-wider animate-pulse shadow-[2px_2px_0px_#000]">
            <Flame className="w-4 h-4 fill-white" /> TICK TICK TICK... IT’S GOING TO BLOW!
          </div>
          <div className="text-xs font-extrabold text-amber-950">
            Say an answer &amp; pass the phone before it blasts!
          </div>
        </div>

        {/* The Animated Bomb Illustration with Real-time Tremor & Lit Fuse */}
        <div className="relative w-48 h-48 mx-auto flex items-center justify-center my-1">
          {/* Animated Sparks Particles */}
          <div className="absolute top-0 right-10 w-8 h-8 pointer-events-none">
            <span className="absolute -top-1 right-2 text-yellow-400 text-lg animate-ping">✨</span>
            <span className="absolute top-1 right-5 text-orange-500 text-sm animate-bounce" style={{ animationDuration: '0.4s' }}>🔥</span>
            <span className="absolute top-3 right-0 text-red-500 text-xs animate-ping" style={{ animationDuration: '0.3s' }}>💥</span>
          </div>

          {/* SVG Bomb with burning rope and trembling animation */}
          <svg
            viewBox="0 0 200 200"
            className="w-44 h-44 drop-shadow-[0_8px_12px_rgba(0,0,0,0.3)] animate-tremor"
            style={{
              animation: 'tremble 0.14s infinite alternate ease-in-out',
            }}
          >
            <style>{`
              @keyframes tremble {
                0% { transform: translate(-2px, 1px) rotate(-1.5deg); }
                50% { transform: translate(1px, -2px) rotate(1deg); }
                100% { transform: translate(2px, 2px) rotate(2deg); }
              }
              @keyframes fuseBurn {
                0% { transform: scale(1); filter: drop-shadow(0 0 6px #F59E0B); }
                50% { transform: scale(1.3); filter: drop-shadow(0 0 14px #EF4444); }
                100% { transform: scale(0.9); filter: drop-shadow(0 0 8px #F97316); }
              }
            `}</style>

            {/* Fuse rope */}
            <path
              d="M 100 50 Q 120 20 145 25"
              fill="none"
              stroke="#78350F"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray="4 2"
            />

            {/* Lit burning fuse spark */}
            <g
              transform="translate(145, 25)"
              style={{
                animation: 'fuseBurn 0.25s infinite alternate ease-in-out',
                transformOrigin: '145px 25px',
              }}
            >
              <circle cx="0" cy="0" r="10" fill="#EF4444" />
              <circle cx="0" cy="0" r="6" fill="#F59E0B" />
              <circle cx="0" cy="0" r="3" fill="#FEF08A" />
            </g>

            {/* Bomb neck / collar */}
            <rect
              x="86"
              y="44"
              width="28"
              height="14"
              rx="4"
              fill="#27272A"
              stroke="#000"
              strokeWidth="3"
            />

            {/* Round bomb sphere */}
            <circle
              cx="100"
              cy="116"
              r="68"
              fill="#18181B"
              stroke="#000000"
              strokeWidth="5"
            />

            {/* Glossy light reflection highlight */}
            <ellipse
              cx="78"
              cy="86"
              rx="20"
              ry="10"
              transform="rotate(-35 78 86)"
              fill="#FFFFFF"
              opacity="0.35"
            />

            {/* Dangerous skull / hazard symbol on bomb */}
            <text
              x="100"
              y="130"
              textAnchor="middle"
              fontSize="34"
              fill="#EF4444"
              className="select-none font-black"
            >
              ☠️
            </text>
          </svg>
        </div>

        {/* The Current Topic Prompt */}
        <div className="p-4 rounded-2xl border-3 border-black bg-white shadow-[3px_3px_0px_#000] space-y-1">
          <div className="text-[10px] font-black uppercase tracking-wider text-amber-900 flex items-center justify-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            Say 1 Answer Fast &amp; Pass:
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#18181B] leading-tight">
            "{currentPrompt}"
          </div>
        </div>
      </div>

      {/* Physical Pass Instruction */}
      <div className="p-3.5 rounded-2xl border-3 border-black bg-white text-center shadow-[3px_3px_0px_#000] space-y-1">
        <div className="text-xs font-black text-gray-900 flex items-center justify-center gap-1.5">
          <span className="text-xl animate-bounce">🤝</span>
          <span>Shout your answer &amp; <b>PASS the phone</b>!</span>
        </div>
        <p className="text-[10px] font-bold text-gray-500">
          Motion sensors detect the handoff &amp; secretly reset the timer
        </p>
      </div>
    </div>
  );
};
