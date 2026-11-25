import React, { useState } from 'react';
import { Session, Player } from '../../services/db';
import { sound } from '../../services/soundboard';
import { haptics } from '../../services/haptics';
import { Trophy, ArrowRight, Flame, Bot, Smartphone, ShieldAlert, Scale, Flag, Palette, Moon, Camera } from 'lucide-react';
import { ScoreAdjustModal } from './ScoreAdjustModal';
import { EndGameNightModal } from './EndGameNightModal';
import { GamePreviewModal } from './GamePreviewModal';
import { SessionMemoriesModal } from './SessionMemoriesModal';

export type SelectableGameId =
  | 'imposter'
  | 'forehead_pop'
  | 'bomb'
  | 'echo_bluff'
  | 'word_trap'
  | 'things_to_say'
  | 'fake_artist'
  | 'mafia'
  | 'resistance'
  | 'spyfall';

interface GameHubProps {
  session: Session;
  onSelectGame: (gameId: SelectableGameId) => void;
  onOpenRoster: () => void;
  onOpenAwards: () => void;
  onStartNewSession: () => void;
}

export const GameHub: React.FC<GameHubProps> = ({
  session,
  onSelectGame,
  onOpenRoster,
  onOpenAwards,
  onStartNewSession,
}) => {
  const [isScoreAdjustOpen, setIsScoreAdjustOpen] = useState<boolean>(false);
  const [isEndNightOpen, setIsEndNightOpen] = useState<boolean>(false);
  const [isMemoriesOpen, setIsMemoriesOpen] = useState<boolean>(false);
  const [previewGameId, setPreviewGameId] = useState<SelectableGameId | null>(null);

  const handleCardClick = (gameId: SelectableGameId) => {
    sound.playPop();
    haptics.light();
    setPreviewGameId(gameId);
  };

  const leader = session.players.length > 0
    ? session.players.reduce((best, p) =>
        (session.cumulativeScores[p.id] || 0) > (session.cumulativeScores[best.id] || 0) ? p : best,
        session.players[0]
      )
    : null;
  const maxScore = leader ? (session.cumulativeScores[leader.id] || 0) : 0;

  const totalMemoriesCount = (session.photos?.length || 0) + (session.videoLinks?.length || 0);

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 pb-20 select-none">
      {/* Modals */}
      {previewGameId && (
        <GamePreviewModal
          gameId={previewGameId}
          onProceed={() => {
            const chosen = previewGameId;
            setPreviewGameId(null);
            onSelectGame(chosen);
          }}
          onClose={() => setPreviewGameId(null)}
        />
      )}

      {isScoreAdjustOpen && (
        <ScoreAdjustModal
          session={session}
          onClose={() => setIsScoreAdjustOpen(false)}
        />
      )}

      {isEndNightOpen && (
        <EndGameNightModal
          session={session}
          onClose={() => setIsEndNightOpen(false)}
          onStartNewSession={onStartNewSession}
        />
      )}

      {isMemoriesOpen && (
        <SessionMemoriesModal
          session={session}
          onClose={() => setIsMemoriesOpen(false)}
        />
      )}

      {/* Session Hero Banner */}
      <div className="neo-card p-4 bg-gradient-to-br from-amber-50 via-yellow-100 to-amber-100 border-3 border-black space-y-3">
        <div className="flex items-center justify-between">
          <span className="neo-badge bg-white text-[11px] font-black uppercase text-amber-900">
            Active Party Session
          </span>
          <span className="text-xs font-bold text-gray-600">
            {session.history.length} rounds played
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <div className="text-xl font-black text-[#18181B]">{session.title}</div>
            <div className="text-xs font-bold text-gray-600">
              {session.players.length} players connected
            </div>
          </div>

          {leader && maxScore > 0 && (
            <div className="text-right">
              <div className="text-[10px] font-black uppercase text-amber-800">Leading 👑</div>
              <div className="text-sm font-black text-[#18181B] flex items-center gap-1">
                <span>{leader.avatarEmoji}</span>
                <span>{leader.name} ({maxScore} pts)</span>
              </div>
            </div>
          )}
        </div>

        {/* Action quick links */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={() => {
              sound.playPop();
              onOpenRoster();
            }}
            className="neo-btn neo-btn-sm py-2 bg-white text-xs font-black text-[#18181B]"
          >
            👥 Manage Roster
          </button>
          <button
            onClick={() => {
              sound.playPop();
              onOpenAwards();
            }}
            className="neo-btn neo-btn-sm py-2 bg-[#FED7AA] text-xs font-black text-amber-950"
          >
            🏆 Session Awards
          </button>
          <button
            onClick={() => {
              sound.playPop();
              setIsScoreAdjustOpen(true);
            }}
            className="neo-btn neo-btn-sm py-2 bg-[#BAE6FD] hover:bg-[#93C5FD] text-xs font-black text-sky-950 flex items-center justify-center gap-1"
          >
            <Scale className="w-3.5 h-3.5" /> Adjust Points
          </button>
          <button
            onClick={() => {
              sound.playPop();
              setIsMemoriesOpen(true);
            }}
            className="neo-btn neo-btn-sm py-2 bg-[#FEF08A] hover:bg-[#FDE047] text-xs font-black text-amber-950 flex items-center justify-center gap-1"
          >
            <Camera className="w-3.5 h-3.5" /> Memories ({totalMemoriesCount})
          </button>
          <button
            onClick={() => {
              sound.playPop();
              setIsEndNightOpen(true);
            }}
            className="col-span-2 neo-btn neo-btn-sm py-2.5 bg-[#FECDD3] hover:bg-[#FDA4AF] text-xs font-black text-red-950 flex items-center justify-center gap-1 shadow-[2px_2px_0px_#000]"
          >
            <Flag className="w-3.5 h-3.5" /> 🏁 End Game Night &amp; Final Scores
          </button>
        </div>
      </div>

      {/* Game Selection Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-black uppercase tracking-wider text-gray-500">
            Choose a Game to Play (10 Party Games)
          </span>
          <span className="text-[11px] font-bold text-gray-400 hidden sm:inline">
            Optimized for Tablet &amp; Mobile
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

        {/* 1. THE IMPOSTER */}
        <div
          onClick={() => handleCardClick('imposter')}
          className="neo-card-lg p-5 bg-[#FECDD3] hover:bg-[#FDA4AF] cursor-pointer transition-all active:scale-[0.99] border-4 border-black space-y-3 shadow-[5px_5px_0px_#000]"
        >
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 rounded-2xl border-3 border-black bg-white flex items-center justify-center text-2xl shadow-[2px_2px_0px_#000]">
              🕵️
            </div>
            <span className="neo-badge bg-white text-[10px] font-black text-red-800">
              SOCIAL DEDUCTION
            </span>
          </div>

          <div>
            <h3 className="text-2xl font-black text-[#18181B] tracking-tight">The Imposter</h3>
            <p className="text-xs font-bold text-gray-800 mt-1 leading-snug">
              Everyone gets a secret word except the Imposters. Give clues, spot the liar, and vote them out!
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5 text-[10px] font-black text-gray-700">
            <span className="px-2 py-0.5 rounded-md border border-black bg-white/70">📦 670+ 1-Word Words</span>
            <span className="px-2 py-0.5 rounded-md border border-black bg-white/70">🎭 Undercover Mode</span>
            <span className="px-2 py-0.5 rounded-md border border-black bg-white/70">🃏 Jester &amp; Assistant</span>
          </div>

          <button
            type="button"
            className="w-full neo-btn py-3 bg-[#FEF08A] text-sm font-black text-[#18181B] flex items-center justify-center gap-1.5"
          >
            Play Imposter <ArrowRight className="w-4 h-4 stroke-[3]" />
          </button>
        </div>

        {/* 2. FOREHEAD POP! (Charades) */}
        <div
          onClick={() => handleCardClick('forehead_pop')}
          className="neo-card-lg p-5 bg-[#A7F3D0] hover:bg-[#86EFAC] cursor-pointer transition-all active:scale-[0.99] border-4 border-black space-y-3 shadow-[5px_5px_0px_#000]"
        >
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 rounded-2xl border-3 border-black bg-white flex items-center justify-center text-2xl shadow-[2px_2px_0px_#000]">
              📱
            </div>
            <span className="neo-badge bg-white text-[10px] font-black text-emerald-900">
              DUMB CHARADES &amp; TILT
            </span>
          </div>

          <div>
            <h3 className="text-2xl font-black text-[#18181B] tracking-tight">Forehead Pop!</h3>
            <p className="text-xs font-bold text-gray-800 mt-1 leading-snug">
              Place the phone on your forehead! Friends act out words — tilt UP for correct, tilt DOWN to pass!
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5 text-[10px] font-black text-gray-700">
            <span className="px-2 py-0.5 rounded-md border border-black bg-white/70">🎬 Bollywood Cinema</span>
            <span className="px-2 py-0.5 rounded-md border border-black bg-white/70">🍕 Action Verbs</span>
            <span className="px-2 py-0.5 rounded-md border border-black bg-white/70">⚡ Phone Gyroscope</span>
          </div>

          <button
            type="button"
            className="w-full neo-btn py-3 bg-[#FEF08A] text-sm font-black text-[#18181B] flex items-center justify-center gap-1.5"
          >
            Play Forehead Pop! <ArrowRight className="w-4 h-4 stroke-[3]" />
          </button>
        </div>

        {/* 3. TICK-TICK-BOOM! */}
        <div
          onClick={() => handleCardClick('bomb')}
          className="neo-card-lg p-5 bg-[#FED7AA] hover:bg-[#FDBA74] cursor-pointer transition-all active:scale-[0.99] border-4 border-black space-y-3 shadow-[5px_5px_0px_#000]"
        >
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 rounded-2xl border-3 border-black bg-white flex items-center justify-center text-2xl shadow-[2px_2px_0px_#000]">
              💣
            </div>
            <span className="neo-badge bg-white text-[10px] font-black text-amber-950">
              PANICKED PASS &amp; PLAY
            </span>
          </div>

          <div>
            <h3 className="text-2xl font-black text-[#18181B] tracking-tight">Tick-Tick-BOOM!</h3>
            <p className="text-xs font-bold text-gray-800 mt-1 leading-snug">
              Name 3 items and pass! The bomb is completely silent with no visible timer — until it suddenly explodes with a loud blast!
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5 text-[10px] font-black text-gray-700">
            <span className="px-2 py-0.5 rounded-md border border-black bg-white/70">🤫 Silent Countdown</span>
            <span className="px-2 py-0.5 rounded-md border border-black bg-white/70">💥 Sudden Blast Sound</span>
            <span className="px-2 py-0.5 rounded-md border border-black bg-white/70">🎲 Purely Random Timer</span>
          </div>

          <button
            type="button"
            className="w-full neo-btn py-3 bg-[#FEF08A] text-sm font-black text-[#18181B] flex items-center justify-center gap-1.5"
          >
            Play Tick-Tick-BOOM! <ArrowRight className="w-4 h-4 stroke-[3]" />
          </button>
        </div>

        {/* 4. ECHO BLUFF */}
        <div
          onClick={() => handleCardClick('echo_bluff')}
          className="neo-card-lg p-5 bg-[#DDD6FE] hover:bg-[#C4B5FD] cursor-pointer transition-all active:scale-[0.99] border-4 border-black space-y-3 shadow-[5px_5px_0px_#000]"
        >
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 rounded-2xl border-3 border-black bg-white flex items-center justify-center text-2xl shadow-[2px_2px_0px_#000]">
              🎭
            </div>
            <span className="neo-badge bg-white text-[10px] font-black text-purple-950">
              AI BLUFF &amp; DEBATE
            </span>
          </div>

          <div>
            <h3 className="text-2xl font-black text-[#18181B] tracking-tight">Echo Bluff</h3>
            <p className="text-xs font-bold text-gray-800 mt-1 leading-snug">
              Everyone writes a secret sentence on a topic. The AI injects a fake human sentence. Debate, bluff, and vote — but beware the AI trap!
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5 text-[10px] font-black text-gray-700">
            <span className="px-2 py-0.5 rounded-md border border-black bg-white/70">📚 600+ 1-Word Topics</span>
            <span className="px-2 py-0.5 rounded-md border border-black bg-white/70">🤖 AI Imposter Sentence</span>
            <span className="px-2 py-0.5 rounded-md border border-black bg-white/70">⚖️ Master Bluff Points</span>
          </div>

          <button
            type="button"
            className="w-full neo-btn py-3 bg-[#FEF08A] text-sm font-black text-[#18181B] flex items-center justify-center gap-1.5"
          >
            Play Echo Bluff <ArrowRight className="w-4 h-4 stroke-[3]" />
          </button>
        </div>

        {/* 5. WORD TRAP (Taboo Relay) */}
        <div
          onClick={() => handleCardClick('word_trap')}
          className="neo-card-lg p-5 bg-[#FECDD3] hover:bg-[#FDA4AF] cursor-pointer transition-all active:scale-[0.99] border-4 border-black space-y-3 shadow-[5px_5px_0px_#000]"
        >
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 rounded-2xl border-3 border-black bg-white flex items-center justify-center text-2xl shadow-[2px_2px_0px_#000]">
              🚨
            </div>
            <span className="neo-badge bg-white text-[10px] font-black text-red-950">
              TABOO &amp; TRAP BUZZER
            </span>
          </div>

          <div>
            <h3 className="text-2xl font-black text-[#18181B] tracking-tight">Word Trap</h3>
            <p className="text-xs font-bold text-gray-800 mt-1 leading-snug">
              Describe the secret word without saying any of the 3 forbidden trap words! Everyone knows the traps and watches to slam the buzzer!
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5 text-[10px] font-black text-gray-700">
            <span className="px-2 py-0.5 rounded-md border border-black bg-white/70">🚫 100+ Trap Cards</span>
            <span className="px-2 py-0.5 rounded-md border border-black bg-white/70">🚨 Live Trap Buzzer (-1)</span>
            <span className="px-2 py-0.5 rounded-md border border-black bg-white/70">👀 Open Room Vision</span>
          </div>

          <button
            type="button"
            className="w-full neo-btn py-3 bg-[#FEF08A] text-sm font-black text-[#18181B] flex items-center justify-center gap-1.5"
          >
            Play Word Trap <ArrowRight className="w-4 h-4 stroke-[3]" />
          </button>
        </div>

        {/* 6. THINGS YOU CAN SAY */}
        <div
          onClick={() => handleCardClick('things_to_say')}
          className="neo-card-lg p-5 bg-[#FEF08A] hover:bg-[#FDE047] cursor-pointer transition-all active:scale-[0.99] border-4 border-black space-y-3 shadow-[5px_5px_0px_#000]"
        >
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 rounded-2xl border-3 border-black bg-white flex items-center justify-center text-2xl shadow-[2px_2px_0px_#000]">
              💬
            </div>
            <span className="neo-badge bg-white text-[10px] font-black text-amber-950">
              DOUBLE-MEANING BLITZ
            </span>
          </div>

          <div>
            <h3 className="text-2xl font-black text-[#18181B] tracking-tight">Things You Can Say...</h3>
            <p className="text-xs font-bold text-gray-800 mt-1 leading-snug">
              Hilarious, cute &amp; double-meaning situations! Read the prompt, start the 10-second timer, say as many as you can, and the group votes on points!
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5 text-[10px] font-black text-gray-700">
            <span className="px-2 py-0.5 rounded-md border border-black bg-white/70">⏱️ 10s Blitz Timer</span>
            <span className="px-2 py-0.5 rounded-md border border-black bg-white/70">🎭 80+ Cheeky Situations</span>
            <span className="px-2 py-0.5 rounded-md border border-black bg-white/70">🗳️ Group Points Decision</span>
          </div>

          <button
            type="button"
            className="w-full neo-btn py-3 bg-[#FEF08A] text-sm font-black text-[#18181B] flex items-center justify-center gap-1.5"
          >
            Play Things You Can Say <ArrowRight className="w-4 h-4 stroke-[3]" />
          </button>
        </div>

        {/* 7. FAKE ARTIST */}
        <div
          onClick={() => handleCardClick('fake_artist')}
          className="neo-card-lg p-5 bg-[#E0E7FF] hover:bg-[#C7D2FE] cursor-pointer transition-all active:scale-[0.99] border-4 border-black space-y-3 shadow-[5px_5px_0px_#000]"
        >
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 rounded-2xl border-3 border-black bg-white flex items-center justify-center text-2xl shadow-[2px_2px_0px_#000]">
              🎨
            </div>
            <span className="neo-badge bg-white text-[10px] font-black text-indigo-950">
              TABLET &amp; STYLUS DRAWING
            </span>
          </div>

          <div>
            <h3 className="text-2xl font-black text-[#18181B] tracking-tight">Fake Artist</h3>
            <p className="text-xs font-bold text-gray-800 mt-1 leading-snug">
              Everyone draws one stroke of the secret word. The Fake Artist doesn't know the word! Stylus mode auto-advances to the next player as soon as you lift the pen!
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5 text-[10px] font-black text-gray-700">
            <span className="px-2 py-0.5 rounded-md border border-black bg-white/70">✏️ Stylus &amp; Touch Ready</span>
            <span className="px-2 py-0.5 rounded-md border border-black bg-white/70">⚡ Auto-Next on Lift</span>
            <span className="px-2 py-0.5 rounded-md border border-black bg-white/70">🌈 Vivid Player Colors</span>
          </div>

          <button
            type="button"
            className="w-full neo-btn py-3 bg-[#FEF08A] text-sm font-black text-[#18181B] flex items-center justify-center gap-1.5"
          >
            Play Fake Artist <ArrowRight className="w-4 h-4 stroke-[3]" />
          </button>
        </div>

        {/* 8. MAFIA */}
        <div
          onClick={() => handleCardClick('mafia')}
          className="neo-card-lg p-5 bg-[#FEE2E2] hover:bg-[#FECDD3] cursor-pointer transition-all active:scale-[0.99] border-4 border-black space-y-3 shadow-[5px_5px_0px_#000]"
        >
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 rounded-2xl border-3 border-black bg-white flex items-center justify-center text-2xl shadow-[2px_2px_0px_#000]">
              🐺
            </div>
            <span className="neo-badge bg-white text-[10px] font-black text-red-950">
              SOCIAL DEDUCTION CLASSIC
            </span>
          </div>

          <div>
            <h3 className="text-2xl font-black text-[#18181B] tracking-tight">Mafia</h3>
            <p className="text-xs font-bold text-gray-800 mt-1 leading-snug">
              Automated pass-and-play night cycle! Mafia strikes, Detective inspects suspects, Doctor protects, and Town debates and votes in the morning!
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5 text-[10px] font-black text-gray-700">
            <span className="px-2 py-0.5 rounded-md border border-black bg-white/70">🌙 Automated Night Cycle</span>
            <span className="px-2 py-0.5 rounded-md border border-black bg-white/70">🕵️ Detective &amp; Doctor</span>
            <span className="px-2 py-0.5 rounded-md border border-black bg-white/70">🃏 Optional Jester</span>
          </div>

          <button
            type="button"
            className="w-full neo-btn py-3 bg-[#FEF08A] text-sm font-black text-[#18181B] flex items-center justify-center gap-1.5"
          >
            Play Mafia <ArrowRight className="w-4 h-4 stroke-[3]" />
          </button>
        </div>

        {/* 9. THE RESISTANCE */}
        <div
          onClick={() => handleCardClick('resistance')}
          className="neo-card-lg p-5 bg-[#E0E7FF] hover:bg-[#C7D2FE] cursor-pointer transition-all active:scale-[0.99] border-4 border-black space-y-3 shadow-[5px_5px_0px_#000]"
        >
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 rounded-2xl border-3 border-black bg-white flex items-center justify-center text-2xl shadow-[2px_2px_0px_#000]">
              🛡️
            </div>
            <span className="neo-badge bg-white text-[10px] font-black text-indigo-950">
              REVOLT &amp; DEDUCTION
            </span>
          </div>

          <div>
            <h3 className="text-2xl font-black text-[#18181B] tracking-tight">The Resistance</h3>
            <p className="text-xs font-bold text-gray-800 mt-1 leading-snug">
              Unmask the imperial spies! Leaders propose mission teams, the room votes, and operatives cast secret pass/sabotage cards!
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5 text-[10px] font-black text-gray-700">
            <span className="px-2 py-0.5 rounded-md border border-black bg-white/70">👥 5-10 Players</span>
            <span className="px-2 py-0.5 rounded-md border border-black bg-white/70">👁️ Commander &amp; Assassin</span>
            <span className="px-2 py-0.5 rounded-md border border-black bg-white/70">💥 Anonymous Sabotage</span>
          </div>

          <button
            type="button"
            className="w-full neo-btn py-3 bg-[#FEF08A] text-sm font-black text-[#18181B] flex items-center justify-center gap-1.5"
          >
            Play The Resistance <ArrowRight className="w-4 h-4 stroke-[3]" />
          </button>
        </div>

        {/* 10. SPYFALL */}
        <div
          onClick={() => handleCardClick('spyfall')}
          className="neo-card-lg p-5 bg-[#BAE6FD] hover:bg-[#93C5FD] cursor-pointer transition-all active:scale-[0.99] border-4 border-black space-y-3 shadow-[5px_5px_0px_#000]"
        >
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 rounded-2xl border-3 border-black bg-white flex items-center justify-center text-2xl shadow-[2px_2px_0px_#000]">
              📍
            </div>
            <span className="neo-badge bg-white text-[10px] font-black text-sky-950">
              LOCATION BLUFFING
            </span>
          </div>

          <div>
            <h3 className="text-2xl font-black text-[#18181B] tracking-tight">Spyfall</h3>
            <p className="text-xs font-bold text-gray-800 mt-1 leading-snug">
              Everyone knows the secret location and their role except ONE clueless Spy. Ask subtle questions, spot the bluff, or guess the spot!
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5 text-[10px] font-black text-gray-700">
            <span className="px-2 py-0.5 rounded-md border border-black bg-white/70">🏏 Kolkata &amp; Global Spots</span>
            <span className="px-2 py-0.5 rounded-md border border-black bg-white/70">⏱️ Investigation Timer</span>
            <span className="px-2 py-0.5 rounded-md border border-black bg-white/70">🎯 Spy Location Steal</span>
          </div>

          <button
            type="button"
            className="w-full neo-btn py-3 bg-[#FEF08A] text-sm font-black text-[#18181B] flex items-center justify-center gap-1.5"
          >
            Play Spyfall <ArrowRight className="w-4 h-4 stroke-[3]" />
          </button>
        </div>
      </div>
      </div>
    </div>
  );
};
