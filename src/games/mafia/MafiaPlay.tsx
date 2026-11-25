import React, { useState, useEffect } from 'react';
import { Player } from '../../services/db';
import {
  MafiaRoleDefinition,
  PlayerRoleAssignment,
  assignMafiaRoles,
} from './data/mafiaRoles';
import { MafiaConfig } from './MafiaSettings';
import { sound } from '../../services/soundboard';
import { haptics } from '../../services/haptics';
import confetti from 'canvas-confetti';
import {
  Moon,
  Sun,
  Shield,
  Search,
  Skull,
  Eye,
  EyeOff,
  Clock,
  Play,
  Pause,
  AlertTriangle,
  Check,
  ArrowRight,
  Heart,
} from 'lucide-react';

interface MafiaPlayProps {
  players: Player[];
  config: MafiaConfig;
  onGameComplete: (scoreDeltas: Record<string, number>, summary: string) => void;
}

type MafiaPhase =
  | 'role_reveal'
  | 'night_intro'
  | 'night_action_pass'
  | 'morning_result'
  | 'day_discussion'
  | 'day_vote'
  | 'game_over';

export const MafiaPlay: React.FC<MafiaPlayProps> = ({
  players,
  config,
  onGameComplete,
}) => {
  const [phase, setPhase] = useState<MafiaPhase>('role_reveal');

  // Role assignments: playerId -> PlayerRoleAssignment
  const [roles, setRoles] = useState<Record<string, PlayerRoleAssignment>>(() =>
    assignMafiaRoles(players, config.includeJester)
  );

  // Initial role reveal state
  const [revealIndex, setRevealIndex] = useState<number>(0);
  const [isRevealed, setIsRevealed] = useState<boolean>(false);

  // Night turn state
  const [nightPlayerIndex, setNightPlayerIndex] = useState<number>(0);
  const [nightActionRevealed, setNightActionRevealed] = useState<boolean>(false);
  const [mafiaKillTarget, setMafiaKillTarget] = useState<string | null>(null);
  const [doctorHealTarget, setDoctorHealTarget] = useState<string | null>(null);
  const [detectiveInquiryResult, setDetectiveInquiryResult] = useState<{
    targetName: string;
    isGuilty: boolean;
  } | null>(null);

  // Morning & Day states
  const [nightVictimId, setNightVictimId] = useState<string | null>(null);
  const [doctorSavedSomeone, setDoctorSavedSomeone] = useState<boolean>(false);
  const [discussionSecondsLeft, setDiscussionSecondsLeft] = useState<number>(
    config.discussionSeconds
  );
  const [isTimerPaused, setIsTimerPaused] = useState<boolean>(false);

  // Day Vote & Elimination
  const [dayEliminatedId, setDayEliminatedId] = useState<string | null>(null);

  // Game Winner: 'town' | 'mafia' | 'jester' | null
  const [winner, setWinner] = useState<'town' | 'mafia' | 'jester' | null>(null);

  // Living players list
  const livingPlayers = players.filter(p => roles[p.id]?.isAlive);

  // Helper to check win conditions
  const checkWinCondition = (currentRoles: Record<string, PlayerRoleAssignment>): 'town' | 'mafia' | null => {
    const living = Object.values(currentRoles).filter(r => r.isAlive);
    const livingMafia = living.filter(r => r.role.team === 'mafia');
    const livingTown = living.filter(r => r.role.team !== 'mafia');

    if (livingMafia.length === 0) {
      return 'town';
    }
    if (livingMafia.length >= livingTown.length) {
      return 'mafia';
    }
    return null;
  };

  // 1. ROLE REVEAL HANDLERS
  const handleNextReveal = () => {
    sound.playPop();
    setIsRevealed(false);
    if (revealIndex < players.length - 1) {
      setRevealIndex(i => i + 1);
    } else {
      sound.playFanfare();
      setPhase('night_intro');
    }
  };

  // 2. NIGHT ACTIONS HANDLERS
  const handleStartNightPass = () => {
    sound.playPop();
    setNightPlayerIndex(0);
    setNightActionRevealed(false);
    setMafiaKillTarget(null);
    setDoctorHealTarget(null);
    setDetectiveInquiryResult(null);
    setPhase('night_action_pass');
  };

  const handleNextNightTurn = () => {
    sound.playPop();
    setNightActionRevealed(false);
    setDetectiveInquiryResult(null);

    if (nightPlayerIndex < livingPlayers.length - 1) {
      setNightPlayerIndex(i => i + 1);
    } else {
      // Night resolves!
      let victimId: string | null = null;
      let saved = false;

      if (mafiaKillTarget) {
        if (doctorHealTarget && doctorHealTarget === mafiaKillTarget) {
          saved = true;
          victimId = null;
        } else {
          victimId = mafiaKillTarget;
        }
      }

      setNightVictimId(victimId);
      setDoctorSavedSomeone(saved);

      const updatedRoles = { ...roles };
      if (victimId && updatedRoles[victimId]) {
        updatedRoles[victimId].isAlive = false;
        setRoles(updatedRoles);
      }

      const win = checkWinCondition(updatedRoles);
      if (win) {
        setWinner(win);
        sound.playFanfare();
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 } });
        setPhase('game_over');
      } else {
        sound.playBuzzer();
        setPhase('morning_result');
      }
    }
  };

  // 3. MORNING & DAY TIMER
  useEffect(() => {
    if (phase !== 'day_discussion' || isTimerPaused) return;

    const interval = setInterval(() => {
      setDiscussionSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          sound.playBuzzer();
          haptics.heavy();
          setPhase('day_vote');
          return 0;
        }
        if (prev <= 5) {
          sound.playTick(true);
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [phase, isTimerPaused]);

  // 4. DAY VOTE HANDLERS
  const handleDayVote = (eliminatedId: string | 'skip') => {
    sound.playBuzzer();
    haptics.heavy();

    if (eliminatedId === 'skip') {
      setDayEliminatedId(null);
      // Start next night
      setPhase('night_intro');
      return;
    }

    setDayEliminatedId(eliminatedId);
    const eliminatedRole = roles[eliminatedId];

    // Jester win check!
    if (eliminatedRole && eliminatedRole.role.type === 'jester') {
      sound.playFanfare();
      confetti({ particleCount: 150, spread: 90, origin: { y: 0.5 } });
      setWinner('jester');
      setPhase('game_over');
      return;
    }

    const updatedRoles = { ...roles };
    if (updatedRoles[eliminatedId]) {
      updatedRoles[eliminatedId].isAlive = false;
      setRoles(updatedRoles);
    }

    const win = checkWinCondition(updatedRoles);
    if (win) {
      sound.playFanfare();
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 } });
      setWinner(win);
      setPhase('game_over');
    } else {
      // Continue to next night cycle
      setTimeout(() => {
        setPhase('night_intro');
      }, 2500);
    }
  };

  // 5. CALCULATE FINAL SCORES
  const calculateFinalScores = (): Record<string, number> => {
    const scores: Record<string, number> = {};
    players.forEach(p => (scores[p.id] = 0));

    if (winner === 'town') {
      players.forEach(p => {
        if (roles[p.id]?.role.team === 'town') scores[p.id] = 3;
      });
    } else if (winner === 'mafia') {
      players.forEach(p => {
        if (roles[p.id]?.role.team === 'mafia') scores[p.id] = 4;
      });
    } else if (winner === 'jester') {
      players.forEach(p => {
        if (roles[p.id]?.role.type === 'jester') scores[p.id] = 5;
      });
    }

    return scores;
  };

  // ==========================================
  // PHASE 1: ROLE REVEAL
  // ==========================================
  if (phase === 'role_reveal') {
    const currentPlayer = players[revealIndex];
    const playerAssignment = roles[currentPlayer.id];
    const roleDef = playerAssignment.role;

    // If Mafia, find other mafia members
    const otherMafia = players.filter(
      p => p.id !== currentPlayer.id && roles[p.id]?.role.type === 'mafia'
    );

    return (
      <div className="w-full max-w-sm mx-auto neo-card-lg p-6 text-center space-y-6 bg-white select-none my-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FEE2E2] border-2 border-black text-xs font-black uppercase text-red-950">
          Secret Role Check ({revealIndex + 1}/{players.length})
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
              Only <b>{currentPlayer.name}</b> should look at the screen!
            </p>
            <button
              onClick={() => {
                sound.playPop();
                haptics.medium();
                setIsRevealed(true);
              }}
              className="w-full neo-btn py-4 bg-[#BAE6FD] hover:bg-[#93C5FD] text-base font-black text-[#18181B] flex items-center justify-center gap-2"
            >
              <Eye className="w-5 h-5" /> Tap to Reveal Secret Role
            </button>
          </div>
        ) : (
          <div className="space-y-4 animate-pop">
            <div
              className="p-5 rounded-3xl border-4 border-black space-y-2 shadow-[4px_4px_0px_#000]"
              style={{ backgroundColor: roleDef.color }}
            >
              <div className="text-5xl animate-bounce">{roleDef.emoji}</div>
              <div className="text-xs font-black uppercase tracking-wider text-gray-700">
                Your Secret Role
              </div>
              <div className="text-3xl font-black text-[#18181B] tracking-tight">{roleDef.name}</div>
              <p className="text-xs font-bold text-gray-800 leading-relaxed pt-1">
                {roleDef.description}
              </p>

              {roleDef.type === 'mafia' && otherMafia.length > 0 && (
                <div className="p-2 rounded-xl border-2 border-red-900 bg-red-200 text-xs font-black text-red-950 mt-2">
                  🐺 Fellow Mafia: {otherMafia.map(m => `${m.avatarEmoji} ${m.name}`).join(', ')}
                </div>
              )}
            </div>

            <button
              onClick={handleNextReveal}
              className="w-full neo-btn py-4 bg-[#FEF08A] hover:bg-[#FDE047] text-base font-black text-[#18181B] flex items-center justify-center gap-2"
            >
              <EyeOff className="w-5 h-5" />
              {revealIndex < players.length - 1 ? 'Hide & Pass to Next Player ➡️' : 'Night Falls... 🌙'}
            </button>
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // PHASE 2: NIGHT INTRO
  // ==========================================
  if (phase === 'night_intro') {
    return (
      <div className="w-full max-w-sm mx-auto neo-card-lg p-6 text-center space-y-6 bg-[#0F172A] text-white border-4 border-black select-none my-auto shadow-[6px_6px_0px_#000]">
        <div className="text-6xl animate-pulse">🌙</div>
        <div className="space-y-2">
          <div className="text-xs font-black uppercase tracking-wider text-indigo-400">
            Night Cycle Begins
          </div>
          <h2 className="text-3xl font-black tracking-tight text-white">Night Falls in Town</h2>
          <p className="text-xs font-bold text-slate-300 leading-relaxed">
            Everyone in the room close your eyes! Pass the phone secretly to each player when called.
          </p>
        </div>

        <div className="p-3 bg-slate-800/80 rounded-2xl border-2 border-slate-700 text-xs font-bold text-slate-300">
          🤫 Keep total silence! No whispering or gesturing!
        </div>

        <button
          onClick={handleStartNightPass}
          className="w-full neo-btn py-4 bg-[#FEF08A] hover:bg-[#FDE047] text-base font-black text-[#18181B] flex items-center justify-center gap-2 shadow-[4px_4px_0px_#000]"
        >
          Begin Secret Night Actions 🤫
        </button>
      </div>
    );
  }

  // ==========================================
  // PHASE 3: NIGHT ACTION PASS
  // ==========================================
  if (phase === 'night_action_pass') {
    const currentPlayer = livingPlayers[nightPlayerIndex];
    const roleDef = roles[currentPlayer.id].role;

    return (
      <div className="w-full max-w-sm mx-auto neo-card-lg p-6 text-center space-y-5 bg-white select-none my-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 text-white text-xs font-black uppercase">
          <Moon className="w-3.5 h-3.5 text-indigo-400" /> Night Turn ({nightPlayerIndex + 1}/{livingPlayers.length})
        </div>

        <div className="space-y-1">
          <div className="text-xs font-black uppercase tracking-wider text-gray-500">Secretly Pass To:</div>
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl border-3 border-black bg-[#FEF08A] shadow-[4px_4px_0px_#000] my-2">
            <span className="text-3xl">{currentPlayer.avatarEmoji}</span>
            <span className="text-2xl font-black">{currentPlayer.name}</span>
          </div>
        </div>

        {!nightActionRevealed ? (
          <div className="space-y-3 pt-2">
            <p className="text-xs font-bold text-gray-600">
              Take the phone silently. Make sure no one is peeking!
            </p>
            <button
              onClick={() => {
                sound.playPop();
                haptics.light();
                setNightActionRevealed(true);
              }}
              className="w-full neo-btn py-4 bg-[#BAE6FD] hover:bg-[#93C5FD] text-base font-black text-[#18181B] flex items-center justify-center gap-2"
            >
              <Eye className="w-5 h-5" /> Open My Eyes (Secret)
            </button>
          </div>
        ) : (
          <div className="space-y-4 animate-pop text-left">
            {/* MAFIA ACTION */}
            {roleDef.type === 'mafia' && (
              <div className="space-y-3">
                <div className="p-3 bg-red-100 rounded-2xl border-2 border-red-500 text-red-950">
                  <div className="text-sm font-black flex items-center gap-1.5">
                    🐺 MAFIA STRIKE: Choose 1 victim to eliminate tonight!
                  </div>
                </div>

                <div className="space-y-1.5 max-h-[220px] overflow-y-auto">
                  {livingPlayers.map(p => (
                    <button
                      key={p.id}
                      onClick={() => {
                        sound.playPop();
                        setMafiaKillTarget(p.id);
                      }}
                      className={`w-full p-2.5 rounded-xl border-2 border-black flex items-center justify-between text-xs font-black transition-all ${
                        mafiaKillTarget === p.id
                          ? 'bg-red-500 text-white shadow-[2px_2px_0px_#000]'
                          : 'bg-white hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span>{p.avatarEmoji}</span>
                        <span>{p.name}</span>
                        {p.id === currentPlayer.id && <span className="text-[10px] text-gray-500">(You)</span>}
                      </div>
                      {mafiaKillTarget === p.id && <span>🎯 Target</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* DOCTOR ACTION */}
            {roleDef.type === 'doctor' && (
              <div className="space-y-3">
                <div className="p-3 bg-emerald-100 rounded-2xl border-2 border-emerald-500 text-emerald-950">
                  <div className="text-sm font-black flex items-center gap-1.5">
                    💉 DOCTOR HEAL: Choose 1 player to protect from elimination!
                  </div>
                </div>

                <div className="space-y-1.5 max-h-[220px] overflow-y-auto">
                  {livingPlayers.map(p => (
                    <button
                      key={p.id}
                      onClick={() => {
                        sound.playPop();
                        setDoctorHealTarget(p.id);
                      }}
                      className={`w-full p-2.5 rounded-xl border-2 border-black flex items-center justify-between text-xs font-black transition-all ${
                        doctorHealTarget === p.id
                          ? 'bg-emerald-500 text-white shadow-[2px_2px_0px_#000]'
                          : 'bg-white hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span>{p.avatarEmoji}</span>
                        <span>{p.name}</span>
                      </div>
                      {doctorHealTarget === p.id && <span>🛡️ Protected</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* DETECTIVE ACTION */}
            {roleDef.type === 'detective' && (
              <div className="space-y-3">
                <div className="p-3 bg-sky-100 rounded-2xl border-2 border-sky-500 text-sky-950">
                  <div className="text-sm font-black flex items-center gap-1.5">
                    🕵️ DETECTIVE INVESTIGATION: Pick 1 suspect to inspect!
                  </div>
                </div>

                {!detectiveInquiryResult ? (
                  <div className="space-y-1.5 max-h-[220px] overflow-y-auto">
                    {livingPlayers
                      .filter(p => p.id !== currentPlayer.id)
                      .map(p => (
                        <button
                          key={p.id}
                          onClick={() => {
                            sound.playPop();
                            haptics.medium();
                            const targetRole = roles[p.id].role;
                            setDetectiveInquiryResult({
                              targetName: p.name,
                              isGuilty: targetRole.team === 'mafia',
                            });
                          }}
                          className="w-full p-2.5 rounded-xl border-2 border-black bg-white hover:bg-gray-50 flex items-center justify-between text-xs font-black"
                        >
                          <div className="flex items-center gap-2">
                            <span>{p.avatarEmoji}</span>
                            <span>{p.name}</span>
                          </div>
                          <span>Inspect 🔍</span>
                        </button>
                      ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl border-3 border-black text-center space-y-1 bg-white">
                    <div className="text-xs font-black uppercase text-gray-500">
                      Inquiry Result for {detectiveInquiryResult.targetName}:
                    </div>
                    <div
                      className={`text-2xl font-black ${
                        detectiveInquiryResult.isGuilty ? 'text-red-600' : 'text-emerald-600'
                      }`}
                    >
                      {detectiveInquiryResult.isGuilty ? '🚨 GUILTY (Mafia)!' : '🕊️ INNOCENT (Town)!'}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* VILLAGER / JESTER (Peaceful Sleep) */}
            {(roleDef.type === 'villager' || roleDef.type === 'jester') && (
              <div className="p-6 rounded-2xl border-3 border-black bg-slate-50 text-center space-y-2">
                <div className="text-4xl animate-bounce">💤</div>
                <div className="text-base font-black text-[#18181B]">You are sleeping peacefully...</div>
                <p className="text-xs font-bold text-gray-600">
                  Nothing for you to do tonight. Sleep tight and listen closely for sounds!
                </p>
              </div>
            )}

            <button
              onClick={handleNextNightTurn}
              className="w-full neo-btn py-4 bg-[#FEF08A] hover:bg-[#FDE047] text-base font-black text-[#18181B] flex items-center justify-center gap-2 mt-3"
            >
              <EyeOff className="w-5 h-5" />
              {nightPlayerIndex < livingPlayers.length - 1 ? 'Close Eyes & Pass Phone ➡️' : 'Morning Arrives! ☀️'}
            </button>
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // PHASE 4: MORNING RESULT
  // ==========================================
  if (phase === 'morning_result') {
    const victim = players.find(p => p.id === nightVictimId);

    return (
      <div className="w-full max-w-sm mx-auto neo-card-lg p-6 text-center space-y-6 bg-white select-none my-auto">
        <div className="text-5xl animate-bounce">☀️</div>
        <div className="space-y-1">
          <div className="text-xs font-black uppercase tracking-wider text-amber-600">Town Wakes Up</div>
          <h2 className="text-2xl font-black text-[#18181B]">Morning Announcement</h2>
        </div>

        {doctorSavedSomeone ? (
          <div className="p-4 rounded-2xl border-3 border-black bg-[#A7F3D0] text-emerald-950 space-y-1 shadow-[3px_3px_0px_#000]">
            <div className="text-3xl">🎉</div>
            <div className="text-lg font-black">A Medical Miracle!</div>
            <p className="text-xs font-bold">
              The Doctor successfully protected the target! Nobody died last night!
            </p>
          </div>
        ) : victim ? (
          <div className="p-4 rounded-2xl border-3 border-black bg-[#FECDD3] text-red-950 space-y-1.5 shadow-[3px_3px_0px_#000]">
            <div className="text-3xl">💀</div>
            <div className="text-xs font-black uppercase text-red-800">Tragedy in the Night</div>
            <div className="text-xl font-black">
              {victim.avatarEmoji} {victim.name} was eliminated!
            </div>
            <p className="text-[11px] font-bold text-red-900">
              They can no longer speak, vote, or participate in discussions.
            </p>
          </div>
        ) : (
          <div className="p-4 rounded-2xl border-3 border-black bg-gray-50 text-gray-800 text-xs font-bold">
            The night passed in peace. Nobody was eliminated.
          </div>
        )}

        <button
          onClick={() => {
            sound.playPop();
            setDiscussionSecondsLeft(config.discussionSeconds);
            setPhase('day_discussion');
          }}
          className="w-full neo-btn py-4 bg-[#FEF08A] hover:bg-[#FDE047] text-base font-black text-[#18181B] flex items-center justify-center gap-2"
        >
          <Clock className="w-5 h-5" /> Start Daytime Discussion ({config.discussionSeconds}s)
        </button>
      </div>
    );
  }

  // ==========================================
  // PHASE 5: DAY DISCUSSION TIMER
  // ==========================================
  if (phase === 'day_discussion') {
    return (
      <div className="w-full max-w-sm mx-auto neo-card-lg p-6 text-center space-y-6 bg-white select-none my-auto">
        <div className="flex items-center justify-between">
          <span className="neo-badge bg-[#FEF08A] text-xs font-black uppercase">Daytime Discussion</span>
          <button
            onClick={() => {
              sound.playPop();
              setIsTimerPaused(p => !p);
            }}
            className="p-1.5 rounded-xl border-2 border-black bg-gray-100"
          >
            {isTimerPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          </button>
        </div>

        <div className="space-y-1">
          <div className="text-xs font-black uppercase tracking-wider text-gray-500">Timer Remaining</div>
          <div
            className={`text-7xl font-mono font-black tabular-nums animate-pulse ${
              discussionSecondsLeft <= 10 ? 'text-red-600' : 'text-[#18181B]'
            }`}
          >
            {discussionSecondsLeft}s
          </div>
          <p className="text-xs font-bold text-gray-600">
            Discuss who acted suspicious during the night! Accuse suspects and defend yourselves!
          </p>
        </div>

        {/* Living players reminder */}
        <div className="p-3 bg-gray-50 rounded-2xl border-2 border-black text-left space-y-1.5">
          <span className="text-[10px] font-black uppercase text-gray-500">
            Living Townspeople ({livingPlayers.length}):
          </span>
          <div className="flex flex-wrap gap-1.5">
            {livingPlayers.map(p => (
              <span
                key={p.id}
                className="px-2.5 py-1 rounded-xl border border-black bg-white text-xs font-black flex items-center gap-1"
              >
                <span>{p.avatarEmoji}</span>
                <span>{p.name}</span>
              </span>
            ))}
          </div>
        </div>

        <button
          onClick={() => {
            sound.playBuzzer();
            haptics.heavy();
            setPhase('day_vote');
          }}
          className="w-full neo-btn py-4 bg-[#FECDD3] hover:bg-[#FDA4AF] text-base font-black text-red-950 flex items-center justify-center gap-2"
        >
          <AlertTriangle className="w-5 h-5 stroke-[2.5]" />
          Proceed to Trial & Voting ⚖️
        </button>
      </div>
    );
  }

  // ==========================================
  // PHASE 6: DAY VOTE
  // ==========================================
  if (phase === 'day_vote') {
    return (
      <div className="w-full max-w-sm mx-auto neo-card-lg p-6 text-center space-y-5 bg-white select-none my-auto">
        <div className="text-4xl animate-bounce">⚖️</div>
        <div className="space-y-1">
          <div className="text-xs font-black uppercase tracking-wider text-indigo-700">Town Trial</div>
          <h2 className="text-2xl font-black text-[#18181B]">Who gets Eliminated?</h2>
          <p className="text-xs font-bold text-gray-600">
            Vote together as a town. Tap the player with the most votes or choose Skip:
          </p>
        </div>

        <div className="space-y-2 max-h-[250px] overflow-y-auto">
          {livingPlayers.map(p => (
            <button
              key={p.id}
              onClick={() => handleDayVote(p.id)}
              className="w-full p-3 rounded-2xl border-3 border-black bg-gray-50 hover:bg-red-50 flex items-center justify-between text-left shadow-[2px_2px_0px_#000] active:translate-y-0.5"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">{p.avatarEmoji}</span>
                <span className="text-sm font-black text-[#18181B]">{p.name}</span>
              </div>
              <span className="text-xs font-black text-red-700">Eliminate 💀</span>
            </button>
          ))}
        </div>

        <button
          onClick={() => handleDayVote('skip')}
          className="w-full neo-btn py-3 bg-gray-100 hover:bg-gray-200 text-xs font-black text-gray-700 border-2 border-black"
        >
          🕊️ Skip Vote (No One Eliminated)
        </button>
      </div>
    );
  }

  // ==========================================
  // PHASE 7: GAME OVER
  // ==========================================
  const finalScores = calculateFinalScores();

  return (
    <div className="w-full max-w-sm mx-auto neo-card-lg p-6 text-center space-y-5 bg-white select-none my-auto">
      <div className="text-5xl animate-bounce">
        {winner === 'town' ? '🕊️' : winner === 'mafia' ? '🐺' : '🃏'}
      </div>

      <div className="space-y-1">
        <div className="text-xs font-black uppercase tracking-wider text-indigo-700">Game Over</div>
        <h2 className="text-3xl font-black text-[#18181B] tracking-tight">
          {winner === 'town'
            ? 'Townspeople Victory!'
            : winner === 'mafia'
            ? 'Mafia Dominates!'
            : 'Jester Solo Victory!'}
        </h2>
        <p className="text-xs font-bold text-gray-600">
          {winner === 'town'
            ? 'All Mafia members were eliminated!'
            : winner === 'mafia'
            ? 'The Mafia equaled or outnumbered the town!'
            : 'The Jester successfully tricked the town into eliminating them!'}
        </p>
      </div>

      {/* Roster & Role Reveal */}
      <div className="space-y-1.5 text-left">
        <span className="text-[11px] font-black uppercase text-gray-500">True Identities:</span>
        <div className="space-y-1.5 max-h-[220px] overflow-y-auto">
          {players.map(p => {
            const role = roles[p.id].role;
            const pts = finalScores[p.id] || 0;
            return (
              <div
                key={p.id}
                className="p-2.5 rounded-xl border-2 border-black flex items-center justify-between shadow-[1px_1px_0px_#000]"
                style={{ backgroundColor: role.color }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">{p.avatarEmoji}</span>
                  <div>
                    <div className="text-xs font-black text-[#18181B]">{p.name}</div>
                    <div className="text-[10px] font-bold text-gray-700">
                      {role.emoji} {role.name}
                    </div>
                  </div>
                </div>

                <div className="text-xs font-black px-2 py-0.5 rounded-lg border border-black bg-white font-mono">
                  +{pts} pts
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <button
        onClick={() => {
          sound.playPop();
          onGameComplete(finalScores, `Mafia Game (${winner?.toUpperCase()} Victory)`);
        }}
        className="w-full neo-btn py-4 bg-[#FEF08A] hover:bg-[#FDE047] text-base font-black text-[#18181B] flex items-center justify-center gap-2"
      >
        Commit Points & Return to Hub <ArrowRight className="w-5 h-5 stroke-[3]" />
      </button>
    </div>
  );
};
