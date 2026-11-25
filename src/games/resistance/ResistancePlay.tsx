import React, { useState } from 'react';
import { Player } from '../../services/db';
import { sound } from '../../services/soundboard';
import { haptics } from '../../services/haptics';
import confetti from 'canvas-confetti';
import {
  Shield,
  Eye,
  EyeOff,
  Check,
  X,
  AlertTriangle,
  Sparkles,
  Users,
  ArrowRight,
  Flame,
  HelpCircle,
  RotateCcw,
  Trophy,
} from 'lucide-react';
import {
  ResistanceRole,
  ResistanceConfig,
  RESISTANCE_MATRIX,
  MissionConfig,
} from './resistanceData';

interface ResistancePlayProps {
  players: Player[];
  roles: Record<string, ResistanceRole>;
  config: ResistanceConfig;
  onGameComplete: (scoreDeltas: Record<string, number>) => void;
  onPlayAgain: (scoreDeltas: Record<string, number>) => void;
}

type ResistancePhase =
  | 'role_reveal'
  | 'proposal'
  | 'team_vote'
  | 'mission_action'
  | 'mission_reveal'
  | 'assassin_guess'
  | 'game_over';

export const ResistancePlay: React.FC<ResistancePlayProps> = ({
  players,
  roles,
  config,
  onGameComplete,
  onPlayAgain,
}) => {
  const [phase, setPhase] = useState<ResistancePhase>('role_reveal');

  // Role reveal state
  const [revealIndex, setRevealIndex] = useState<number>(0);
  const [isRoleRevealed, setIsRoleRevealed] = useState<boolean>(false);

  // Mission progression state
  const clampedCount = Math.max(5, Math.min(10, players.length));
  const matrix = RESISTANCE_MATRIX[clampedCount] || RESISTANCE_MATRIX[5];

  const [currentMissionIndex, setCurrentMissionIndex] = useState<number>(0);
  const [currentLeaderIndex, setCurrentLeaderIndex] = useState<number>(0);
  const [failedProposals, setFailedProposals] = useState<number>(0); // 0 to 5
  const [proposedTeamIds, setProposedTeamIds] = useState<string[]>([]);
  const [missionHistory, setMissionHistory] = useState<('success' | 'fail')[]>([]);

  // Mission action pass-and-play state
  const [activeOperativeVoteIndex, setActiveOperativeVoteIndex] = useState<number>(0);
  const [isOperativeCurtain, setIsOperativeCurtain] = useState<boolean>(true);
  const [collectedMissionCards, setCollectedMissionCards] = useState<('success' | 'fail')[]>([]);

  // Assassin guess state
  const [assassinGuessedCorrectly, setAssassinGuessedCorrectly] = useState<boolean>(false);
  const [spiesWonByAnarchy, setSpiesWonByAnarchy] = useState<boolean>(false);

  const activeLeader = players[currentLeaderIndex % players.length];
  const currentMission = matrix.missions[currentMissionIndex];

  // Helper arrays
  const spyIds = players.filter(p => roles[p.id] === 'spy' || roles[p.id] === 'assassin').map(p => p.id);
  const spyNames = players.filter(p => spyIds.includes(p.id)).map(p => p.name);
  const commanderId = players.find(p => roles[p.id] === 'commander')?.id;

  // 1. Role Reveal Handler
  const handleRevealNext = () => {
    sound.playPop();
    setIsRoleRevealed(false);
    if (revealIndex < players.length - 1) {
      setRevealIndex(i => i + 1);
    } else {
      sound.playFanfare();
      setPhase('proposal');
    }
  };

  // 2. Proposal Handlers
  const handleTogglePlayerSelection = (playerId: string) => {
    sound.playPop();
    haptics.light();
    if (proposedTeamIds.includes(playerId)) {
      setProposedTeamIds(prev => prev.filter(id => id !== playerId));
    } else {
      if (proposedTeamIds.length < currentMission.playersRequired) {
        setProposedTeamIds(prev => [...prev, playerId]);
      }
    }
  };

  const handleConfirmTeamProposal = () => {
    sound.playPop();
    haptics.medium();
    setPhase('team_vote');
  };

  // 3. Team Vote Handlers
  const handleTeamApproved = () => {
    sound.playSuccess();
    haptics.medium();
    setFailedProposals(0);
    setActiveOperativeVoteIndex(0);
    setIsOperativeCurtain(true);
    setCollectedMissionCards([]);
    setPhase('mission_action');
  };

  const handleTeamRejected = () => {
    sound.playBuzzer();
    haptics.heavy();
    const nextFailed = failedProposals + 1;
    setFailedProposals(nextFailed);
    setProposedTeamIds([]);
    setCurrentLeaderIndex(idx => (idx + 1) % players.length);

    if (nextFailed >= 5) {
      // 5 consecutive failed votes -> Spies win immediately!
      sound.playBuzzer();
      setSpiesWonByAnarchy(true);
      setPhase('game_over');
    } else {
      setPhase('proposal');
    }
  };

  // 4. Secret Mission Action (Operatives only)
  const activeOperativeId = proposedTeamIds[activeOperativeVoteIndex];
  const activeOperative = players.find(p => p.id === activeOperativeId);
  const isOperativeSpy = activeOperativeId && spyIds.includes(activeOperativeId);

  const handleCastMissionCard = (card: 'success' | 'fail') => {
    sound.playPop();
    haptics.medium();

    const updated = [...collectedMissionCards, card];
    setCollectedMissionCards(updated);

    if (activeOperativeVoteIndex < proposedTeamIds.length - 1) {
      setActiveOperativeVoteIndex(idx => idx + 1);
      setIsOperativeCurtain(true);
    } else {
      // All operatives have voted! Shuffle cards anonymously & proceed to reveal!
      sound.playFanfare();
      // Anonymously shuffle cards
      const shuffled = [...updated].sort(() => Math.random() - 0.5);
      setCollectedMissionCards(shuffled);
      setPhase('mission_reveal');
    }
  };

  // 5. Mission Reveal & Scoring
  const handleResolveMission = () => {
    const sabotageCount = collectedMissionCards.filter(c => c === 'fail').length;
    const isFailed = sabotageCount >= currentMission.failsRequired;
    const result: 'success' | 'fail' = isFailed ? 'fail' : 'success';

    if (result === 'success') {
      sound.playVictory();
    } else {
      sound.playSabotage();
    }

    const updatedHistory = [...missionHistory, result];
    setMissionHistory(updatedHistory);

    const resistanceWins = updatedHistory.filter(h => h === 'success').length;
    const spyWins = updatedHistory.filter(h => h === 'fail').length;

    if (spyWins >= 3) {
      sound.playBuzzer();
      setPhase('game_over');
    } else if (resistanceWins >= 3) {
      if (config.commanderMode && commanderId) {
        sound.playFanfare();
        setPhase('assassin_guess');
      } else {
        sound.playFanfare();
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 } });
        setPhase('game_over');
      }
    } else {
      // Move to next mission
      setCurrentMissionIndex(idx => idx + 1);
      setCurrentLeaderIndex(idx => (idx + 1) % players.length);
      setProposedTeamIds([]);
      setPhase('proposal');
    }
  };

  // 6. Assassin Guess Handler
  const handleAssassinGuess = (targetId: string) => {
    sound.playBuzzer();
    haptics.heavy();
    const correct = targetId === commanderId;
    setAssassinGuessedCorrectly(correct);
    if (!correct) {
      sound.playFanfare();
      confetti({ particleCount: 150, spread: 90, origin: { y: 0.5 } });
    }
    setPhase('game_over');
  };

  // Calculate Final Score Deltas
  const resistanceWins = missionHistory.filter(h => h === 'success').length;
  const spyWins = missionHistory.filter(h => h === 'fail').length;
  const resistanceWonGame =
    resistanceWins >= 3 && !assassinGuessedCorrectly && !spiesWonByAnarchy;

  const scoreDeltas: Record<string, number> = {};
  players.forEach(p => {
    const isSpy = spyIds.includes(p.id);
    if (resistanceWonGame) {
      scoreDeltas[p.id] = isSpy ? 1 : 3;
    } else {
      scoreDeltas[p.id] = isSpy ? 3 : 1;
    }
  });

  // ===================== PHASE 1: ROLE REVEAL =====================
  if (phase === 'role_reveal') {
    const currentPlayer = players[revealIndex];
    const role = roles[currentPlayer.id];
    const isSpy = spyIds.includes(currentPlayer.id);
    const isCommander = role === 'commander';
    const isAssassin = role === 'assassin';

    return (
      <div className="w-full max-w-sm mx-auto neo-card-lg p-6 text-center space-y-6 bg-white select-none my-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E0E7FF] border-2 border-black text-xs font-black uppercase text-indigo-950">
          <Shield className="w-3.5 h-3.5 text-indigo-600" /> Secret Identity Check ({revealIndex + 1}/{players.length})
        </div>

        <div className="space-y-1">
          <div className="text-xs font-black uppercase tracking-wider text-gray-500">Pass Phone To:</div>
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl border-3 border-black bg-[#FEF08A] shadow-[4px_4px_0px_#000] my-2">
            <span className="text-3xl">{currentPlayer.avatarEmoji}</span>
            <span className="text-2xl font-black">{currentPlayer.name}</span>
          </div>
        </div>

        {!isRoleRevealed ? (
          <div className="space-y-3 pt-2">
            <p className="text-xs font-bold text-gray-600">
              Make sure only <b>{currentPlayer.name}</b> can see the screen!
            </p>
            <button
              onClick={() => {
                sound.playSecretReveal();
                haptics.medium();
                setIsRoleRevealed(true);
              }}
              className="w-full neo-btn py-4 bg-[#BAE6FD] hover:bg-[#93C5FD] text-base font-black text-[#18181B] flex items-center justify-center gap-2"
            >
              <Eye className="w-5 h-5" /> Tap to Reveal Secret Role
            </button>
          </div>
        ) : (
          <div className="space-y-4 animate-pop">
            {isSpy ? (
              <div className="p-4 rounded-2xl border-3 border-red-500 bg-red-100 text-red-950 space-y-2 text-left">
                <div className="text-base font-black flex items-center gap-1.5 text-red-950">
                  <Flame className="w-5 h-5 text-red-600 fill-red-500" />
                  YOU ARE AN IMPERIAL SPY! {isAssassin && '🗡️ (Assassin)'}
                </div>
                <p className="text-xs font-bold text-red-900 leading-snug">
                  You know all your fellow spies. Work in the shadows to sabotage missions or cause 5 failed team votes!
                </p>
                <div className="p-2.5 rounded-xl border-2 border-red-400 bg-white/80 space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-red-800">
                    Your Fellow Spies in the Shadows:
                  </span>
                  <div className="text-sm font-black text-red-950">
                    {spyNames.join(', ')}
                  </div>
                </div>
              </div>
            ) : isCommander ? (
              <div className="p-4 rounded-2xl border-3 border-indigo-500 bg-indigo-100 text-indigo-950 space-y-2 text-left">
                <div className="text-base font-black flex items-center gap-1.5 text-indigo-950">
                  <Eye className="w-5 h-5 text-indigo-700" />
                  YOU ARE THE COMMANDER (Merlin)!
                </div>
                <p className="text-xs font-bold text-indigo-900 leading-snug">
                  You secretly know who all the spies are! Guide your team subtly. If you are too obvious, the Assassin will kill you at the end!
                </p>
                <div className="p-2.5 rounded-xl border-2 border-indigo-400 bg-white/80 space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-indigo-800">
                    Identified Spies:
                  </span>
                  <div className="text-sm font-black text-red-700">
                    {spyNames.join(', ')}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl border-3 border-emerald-500 bg-emerald-100 text-emerald-950 space-y-2 text-left">
                <div className="text-base font-black flex items-center gap-1.5 text-emerald-950">
                  <Shield className="w-5 h-5 text-emerald-600 fill-emerald-500" />
                  YOU ARE A LOYAL OPERATIVE!
                </div>
                <p className="text-xs font-bold text-emerald-900 leading-snug">
                  You fight for freedom! You do NOT know who anyone is. Trust your gut, approve clean teams, and pass 3 missions to win!
                </p>
                <div className="p-2.5 rounded-xl border border-emerald-400 bg-white/70 text-xs font-black text-emerald-950">
                  🔒 Reminder: Loyal members can never sabotage missions.
                </div>
              </div>
            )}

            <button
              onClick={handleRevealNext}
              className="w-full neo-btn py-4 bg-[#FEF08A] hover:bg-[#FDE047] text-base font-black text-[#18181B] flex items-center justify-center gap-2"
            >
              <EyeOff className="w-5 h-5" />
              {revealIndex < players.length - 1 ? 'Hide & Pass to Next Player ➡️' : 'All Roles Assigned! Start Game 🚀'}
            </button>
          </div>
        )}
      </div>
    );
  }

  // ===================== MISSION SCOREBOARD HEADER =====================
  const renderScoreboard = () => (
    <div className="neo-card p-3 bg-white border-3 border-black space-y-2.5 shadow-[3px_3px_0px_#000]">
      <div className="flex items-center justify-between">
        <span className="text-xs font-black uppercase tracking-wider text-gray-500">
          Mission {currentMissionIndex + 1} of 5
        </span>
        <div className="flex items-center gap-2 text-xs font-black">
          <span className="text-emerald-700">🛡️ {missionHistory.filter(h => h === 'success').length} Won</span>
          <span className="text-red-700">❌ {missionHistory.filter(h => h === 'fail').length} Failed</span>
        </div>
      </div>

      {/* 5 Missions Progress Bar */}
      <div className="grid grid-cols-5 gap-1.5 text-center">
        {matrix.missions.map((m, idx) => {
          const outcome = missionHistory[idx];
          const isCurrent = idx === currentMissionIndex;

          return (
            <div
              key={idx}
              className={`p-2 rounded-xl border-2 border-black flex flex-col items-center justify-center transition-all ${
                outcome === 'success'
                  ? 'bg-[#A7F3D0] shadow-[2px_2px_0px_#000]'
                  : outcome === 'fail'
                  ? 'bg-[#FECDD3] shadow-[2px_2px_0px_#000]'
                  : isCurrent
                  ? 'bg-[#FEF08A] border-3 shadow-[3px_3px_0px_#000] scale-105'
                  : 'bg-gray-100 opacity-60'
              }`}
            >
              <span className="text-[10px] font-black text-gray-600">M{idx + 1}</span>
              <span className="text-base font-black">
                {outcome === 'success' ? '🛡️' : outcome === 'fail' ? '❌' : `${m.playersRequired}p`}
              </span>
              {m.failsRequired > 1 && !outcome && (
                <span className="text-[8px] font-bold text-red-600">2 fails</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Failed Vote Tracker (0 to 5) */}
      <div className="flex items-center justify-between text-[11px] font-black pt-1 border-t border-gray-200">
        <span className="text-gray-500 uppercase tracking-wider">Vote Rejection Track:</span>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map(step => (
            <span
              key={step}
              className={`w-5 h-5 rounded-full border border-black flex items-center justify-center text-[10px] font-black ${
                failedProposals >= step
                  ? 'bg-red-500 text-white animate-pulse'
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              {step}
            </span>
          ))}
          <span className="text-[10px] text-red-600 font-bold ml-1">
            {failedProposals === 4 ? '⚠️ Next reject = Spies Win!' : ''}
          </span>
        </div>
      </div>
    </div>
  );

  // ===================== PHASE 2: TEAM PROPOSAL =====================
  if (phase === 'proposal') {
    const isTeamComplete = proposedTeamIds.length === currentMission.playersRequired;

    return (
      <div className="w-full max-w-sm mx-auto space-y-4 select-none pb-12">
        {renderScoreboard()}

        {/* Leader Box */}
        <div className="neo-card p-4 bg-[#FEF08A] border-3 border-black text-center space-y-1 shadow-[3px_3px_0px_#000]">
          <div className="text-[10px] font-black uppercase tracking-wider text-amber-900">Mission Leader</div>
          <div className="text-xl font-black flex items-center justify-center gap-2">
            <span>{activeLeader.avatarEmoji}</span>
            <span>{activeLeader.name}</span>
          </div>
          <p className="text-xs font-bold text-amber-950">
            Nominate <b>{currentMission.playersRequired} Operatives</b> for Mission {currentMissionIndex + 1}:
          </p>
        </div>

        {/* Player Selection List */}
        <div className="space-y-2">
          {players.map(p => {
            const isSelected = proposedTeamIds.includes(p.id);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handleTogglePlayerSelection(p.id)}
                className={`w-full p-3 rounded-2xl border-3 border-black flex items-center justify-between transition-all ${
                  isSelected
                    ? 'bg-[#A7F3D0] shadow-[3px_3px_0px_#000] scale-[1.01]'
                    : 'bg-white hover:bg-gray-50 shadow-[1px_1px_0px_#000]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">{p.avatarEmoji}</span>
                  <span className="text-sm font-black text-[#18181B]">{p.name}</span>
                  {p.id === activeLeader.id && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-100 border border-amber-300 font-bold text-amber-900">
                      Leader 👑
                    </span>
                  )}
                </div>
                <div
                  className={`w-6 h-6 rounded-full border-2 border-black flex items-center justify-center ${
                    isSelected ? 'bg-black text-white' : 'bg-transparent'
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Submit Team Button */}
        <button
          disabled={!isTeamComplete}
          onClick={handleConfirmTeamProposal}
          className={`w-full neo-btn py-4 text-base font-black text-[#18181B] flex items-center justify-center gap-2 ${
            isTeamComplete ? 'bg-[#BAE6FD] hover:bg-[#93C5FD]' : 'bg-gray-200 opacity-50 cursor-not-allowed'
          }`}
        >
          Propose Team ({proposedTeamIds.length}/{currentMission.playersRequired}) 📋
        </button>
      </div>
    );
  }

  // ===================== PHASE 3: TEAM VOTE =====================
  if (phase === 'team_vote') {
    const proposedPlayers = players.filter(p => proposedTeamIds.includes(p.id));

    return (
      <div className="w-full max-w-sm mx-auto space-y-4 select-none pb-12">
        {renderScoreboard()}

        <div className="neo-card-lg p-5 bg-white border-3 border-black text-center space-y-4 shadow-[4px_4px_0px_#000]">
          <div className="text-4xl animate-bounce">🗳️</div>
          <div className="space-y-1">
            <span className="neo-badge bg-[#E0E7FF] text-xs font-black uppercase text-indigo-950">
              Public Room Vote
            </span>
            <h2 className="text-2xl font-black text-[#18181B]">Vote on Proposed Team</h2>
            <p className="text-xs font-bold text-gray-600">
              <b>{activeLeader.name}</b> proposed these {proposedPlayers.length} operatives:
            </p>
          </div>

          {/* Nominated Operatives */}
          <div className="p-3 rounded-2xl border-2 border-black bg-gray-50 flex flex-wrap justify-center gap-2">
            {proposedPlayers.map(p => (
              <span
                key={p.id}
                className="px-3 py-1.5 rounded-xl border border-black bg-white text-xs font-black flex items-center gap-1.5 shadow-[1px_1px_0px_#000]"
              >
                <span>{p.avatarEmoji}</span>
                <span>{p.name}</span>
              </span>
            ))}
          </div>

          <p className="text-xs font-bold text-gray-700 leading-snug">
            Count down "3, 2, 1, VOTE!" — everyone simultaneously shows thumbs up (Approve) or thumbs down (Reject).
          </p>

          <div className="grid grid-cols-2 gap-2 pt-2">
            <button
              onClick={handleTeamApproved}
              className="neo-btn py-3.5 bg-[#A7F3D0] hover:bg-[#86EFAC] text-sm font-black text-emerald-950 flex items-center justify-center gap-1"
            >
              <Check className="w-4 h-4 stroke-[3]" /> Majority Approved
            </button>
            <button
              onClick={handleTeamRejected}
              className="neo-btn py-3.5 bg-[#FECDD3] hover:bg-[#FDA4AF] text-sm font-black text-red-950 flex items-center justify-center gap-1"
            >
              <X className="w-4 h-4 stroke-[3]" /> Team Rejected
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ===================== PHASE 4: SECRET MISSION ACTION =====================
  if (phase === 'mission_action') {
    if (isOperativeCurtain) {
      return (
        <div className="w-full max-w-sm mx-auto neo-card-lg p-6 text-center space-y-6 bg-[#FEF08A] select-none my-auto">
          <div className="w-16 h-16 mx-auto rounded-full border-3 border-black bg-white flex items-center justify-center shadow-[3px_3px_0px_#000]">
            <Shield className="w-8 h-8 text-yellow-700" />
          </div>

          <div className="space-y-1">
            <div className="text-xs font-black uppercase tracking-wider text-gray-700">
              Confidential Mission Action ({activeOperativeVoteIndex + 1}/{proposedTeamIds.length})
            </div>
            <div className="text-2xl font-black text-[#18181B]">Pass phone to Operative:</div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl border-3 border-black bg-white shadow-[3px_3px_0px_#000] my-2">
              <span className="text-3xl">{activeOperative?.avatarEmoji}</span>
              <span className="text-2xl font-black">{activeOperative?.name}</span>
            </div>
          </div>

          <p className="text-xs font-bold text-gray-700">
            Make sure no other players are looking at your screen before tapping unlock!
          </p>

          <button
            onClick={() => {
              sound.playPop();
              haptics.light();
              setIsOperativeCurtain(false);
            }}
            className="w-full neo-btn py-4 bg-[#A7F3D0] hover:bg-[#86EFAC] text-lg font-black text-[#18181B]"
          >
            I am {activeOperative?.name} → Vote 🗳️
          </button>
        </div>
      );
    }

    return (
      <div className="w-full max-w-sm mx-auto neo-card-lg p-6 text-center space-y-6 bg-white select-none my-auto">
        <div className="space-y-1">
          <span className="neo-badge bg-[#E0E7FF] text-xs font-black uppercase text-indigo-950">
            Confidential Mission Action
          </span>
          <h2 className="text-2xl font-black text-[#18181B]">{activeOperative?.name}, Cast Your Card</h2>
          <p className="text-xs font-bold text-gray-600">
            Your choice is completely anonymous and will be shuffled.
          </p>
        </div>

        <div className="space-y-3 pt-2">
          {/* Success Card Button */}
          <button
            onClick={() => handleCastMissionCard('success')}
            className="w-full neo-btn py-4 bg-[#A7F3D0] hover:bg-[#86EFAC] text-base font-black text-[#18181B] flex items-center justify-center gap-2 shadow-[3px_3px_0px_#000]"
          >
            <Check className="w-5 h-5 stroke-[3] text-emerald-800" />
            VOTE SUCCESS (Pass Mission)
          </button>

          {/* Sabotage Card Button */}
          {isOperativeSpy ? (
            <button
              onClick={() => handleCastMissionCard('fail')}
              className="w-full neo-btn py-4 bg-[#FECDD3] hover:bg-[#FDA4AF] text-base font-black text-red-950 flex items-center justify-center gap-2 shadow-[3px_3px_0px_#000]"
            >
              <X className="w-5 h-5 stroke-[3] text-red-700" />
              VOTE SABOTAGE (Fail Mission)
            </button>
          ) : (
            <div className="p-3 rounded-xl border-2 border-gray-300 bg-gray-100 text-gray-500 text-xs font-bold">
              🔒 Loyal Resistance Operatives can only vote SUCCESS.
            </div>
          )}
        </div>
      </div>
    );
  }

  // ===================== PHASE 5: MISSION REVEAL =====================
  if (phase === 'mission_reveal') {
    const sabotageCount = collectedMissionCards.filter(c => c === 'fail').length;
    const isFailed = sabotageCount >= currentMission.failsRequired;

    return (
      <div className="w-full max-w-sm mx-auto neo-card-lg p-6 text-center space-y-5 bg-white select-none my-auto">
        <div className="text-5xl animate-bounce">{isFailed ? '💥' : '🛡️'}</div>

        <div className="space-y-1">
          <span className="neo-badge bg-[#E0E7FF] text-xs font-black uppercase text-indigo-950">
            Mission {currentMissionIndex + 1} Result
          </span>
          <h2 className={`text-2xl font-black ${isFailed ? 'text-red-700' : 'text-emerald-700'}`}>
            {isFailed ? 'MISSION FAILED!' : 'MISSION SUCCEEDED!'}
          </h2>
        </div>

        {/* Clean Outcome: shows whether everyone succeeded or how many sabotaged */}
        {sabotageCount === 0 ? (
          <div className="p-4 rounded-2xl border-3 border-emerald-500 bg-emerald-50 space-y-1 shadow-[3px_3px_0px_#000]">
            <div className="text-lg font-black text-emerald-950 flex items-center justify-center gap-1.5">
              <span>🎉</span> Everyone Succeeded!
            </div>
            <p className="text-xs font-bold text-emerald-800">
              0 Sabotages detected! The Resistance scores 1 mission point!
            </p>
          </div>
        ) : (
          <div className="p-4 rounded-2xl border-3 border-red-500 bg-red-50 space-y-1 shadow-[3px_3px_0px_#000]">
            <div className="text-lg font-black text-red-950 flex items-center justify-center gap-1.5">
              <span>💥</span> {sabotageCount} {sabotageCount === 1 ? 'Player' : 'Players'} Sabotaged!
            </div>
            <p className="text-xs font-bold text-red-800">
              {isFailed
                ? `At least ${currentMission.failsRequired} sabotage occurred — The mission failed!`
                : `1 sabotage occurred, but this mission needed 2 sabotages to fail — Mission Passes!`}
            </p>
          </div>
        )}

        <button
          onClick={handleResolveMission}
          className="w-full neo-btn py-4 bg-[#FEF08A] hover:bg-[#FDE047] text-base font-black text-[#18181B] flex items-center justify-center gap-2 shadow-[4px_4px_0px_#000] active:scale-[0.98]"
        >
          Continue <ArrowRight className="w-5 h-5 stroke-[3]" />
        </button>
      </div>
    );
  }

  // ===================== PHASE 6: ASSASSIN GUESS =====================
  if (phase === 'assassin_guess') {
    const assassin = players.find(p => roles[p.id] === 'assassin') || players.find(p => spyIds.includes(p.id));
    const nonSpyCandidates = players.filter(p => !spyIds.includes(p.id));

    return (
      <div className="w-full max-w-sm mx-auto neo-card-lg p-6 text-center space-y-5 bg-[#FEF3C7] border-4 border-black select-none my-auto">
        <div className="text-4xl animate-bounce">🗡️</div>

        <div className="space-y-1">
          <div className="text-xs font-black uppercase tracking-wider text-amber-900">
            Final Stand • Assassin's Strike
          </div>
          <h2 className="text-2xl font-black text-amber-950">Resistance Won 3 Missions!</h2>
          <p className="text-xs font-bold text-amber-900 leading-snug">
            BUT the Assassin ({assassin?.name}) gets ONE last shot to identify and assassinate the Commander!
          </p>
        </div>

        <div className="space-y-2 pt-1 max-h-[260px] overflow-y-auto">
          {nonSpyCandidates.map(p => (
            <button
              key={p.id}
              onClick={() => handleAssassinGuess(p.id)}
              className="w-full p-3 rounded-2xl border-3 border-black bg-white hover:bg-rose-50 text-left flex items-center justify-between shadow-[2px_2px_0px_#000] active:translate-y-0.5"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">{p.avatarEmoji}</span>
                <span className="text-sm font-black text-[#18181B]">{p.name}</span>
              </div>
              <span className="text-xs font-bold text-red-600">Assassinate 🗡️</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ===================== PHASE 7: GAME OVER =====================
  return (
    <div className="w-full max-w-sm mx-auto neo-card-lg p-6 text-center space-y-5 bg-white select-none my-auto">
      <div className="text-5xl animate-bounce">{resistanceWonGame ? '🎉' : '💀'}</div>

      <div className="space-y-1">
        <div className="text-xs font-black uppercase tracking-wider text-indigo-700">War Over</div>
        <h2 className="text-2xl font-black text-[#18181B]">
          {resistanceWonGame ? 'The Resistance Prevails!' : 'Imperial Spies Triumph!'}
        </h2>
        <p className="text-xs font-bold text-gray-600">
          {spiesWonByAnarchy
            ? 'Spies won by causing 5 consecutive rejected proposals!'
            : assassinGuessedCorrectly
            ? 'The Assassin correctly killed the Commander to steal victory!'
            : resistanceWonGame
            ? '3 missions completed successfully!'
            : '3 missions sabotaged by Imperial Spies!'}
        </p>
      </div>

      {/* Role Reveal Table */}
      <div className="space-y-1.5 text-left">
        <span className="text-[11px] font-black uppercase text-gray-500">Player Identities:</span>
        <div className="space-y-1 max-h-[220px] overflow-y-auto pr-1">
          {players.map(p => {
            const isSpy = spyIds.includes(p.id);
            const role = roles[p.id];
            const pts = scoreDeltas[p.id] || 0;

            return (
              <div
                key={p.id}
                className="px-3 py-2 rounded-xl border-2 border-black flex items-center justify-between bg-white text-xs font-black"
              >
                <div className="flex items-center gap-2">
                  <span>{p.avatarEmoji}</span>
                  <span>{p.name}</span>
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded border ${
                      isSpy ? 'bg-red-100 text-red-950 border-red-300' : 'bg-emerald-100 text-emerald-950 border-emerald-300'
                    }`}
                  >
                    {role === 'commander'
                      ? 'Commander 👁️'
                      : role === 'assassin'
                      ? 'Assassin 🗡️'
                      : isSpy
                      ? 'Spy 🕵️'
                      : 'Resistance 🛡️'}
                  </span>
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
          Play Another War 🛡️ 🔁
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
