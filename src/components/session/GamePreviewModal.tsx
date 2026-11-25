import React from 'react';
import { SelectableGameId } from './GameHub';
import { sound } from '../../services/soundboard';
import {
  X,
  Play,
  ArrowRight,
  Sparkles,
  Trophy,
  Flame,
  Award,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
} from 'lucide-react';

interface GameStep {
  step: number;
  title: string;
  desc: string;
  badge: string;
  color: string;
}

interface ScoringRule {
  outcome: string;
  points: string;
  color: string;
}

interface GamePreviewData {
  title: string;
  emoji: string;
  tagline: string;
  category: string;
  themeBg: string;
  playerCount: string;
  flowchart: GameStep[];
  scoring: ScoringRule[];
  proTips: string[];
}

const GAME_PREVIEWS: Record<SelectableGameId, GamePreviewData> = {
  imposter: {
    title: 'The Imposter',
    emoji: '🕵️',
    tagline: 'Spot the liar who doesn’t know the secret word, or bluff your way to victory!',
    category: 'Social Deduction',
    themeBg: '#FECDD3',
    playerCount: '3+ Players',
    flowchart: [
      {
        step: 1,
        title: 'Secret Word Pass',
        desc: 'Pass the phone. Everyone sees the secret word (e.g. Victoria) except the Imposter!',
        badge: 'Private Pass',
        color: '#BAE6FD',
      },
      {
        step: 2,
        title: 'One-Word Clues',
        desc: 'In circle order, each player says exactly ONE word related to the secret. Don’t make it too obvious!',
        badge: 'Face to Face',
        color: '#FEF08A',
      },
      {
        step: 3,
        title: 'Room Interrogation',
        desc: 'Cross-examine suspicious clues. Why did they say that? Defend your innocence!',
        badge: 'Debate',
        color: '#FED7AA',
      },
      {
        step: 4,
        title: 'Accusation & Steal',
        desc: 'Point on 3-2-1! If caught, the Imposter gets one shot to guess the secret word for a steal!',
        badge: 'Climax',
        color: '#FECDD3',
      },
    ],
    scoring: [
      { outcome: 'Town spots Imposter (fails guess)', points: '+2 pts each', color: 'bg-emerald-100 text-emerald-950' },
      { outcome: 'Imposter survives unnoticed', points: '+3 pts', color: 'bg-rose-100 text-rose-950' },
      { outcome: 'Imposter steals by guessing word', points: '+3 pts', color: 'bg-amber-100 text-amber-950' },
    ],
    proTips: [
      'Give clues that only someone who knows the word will recognize, but vague enough so the Imposter cannot easily deduce it.',
      'If you are the Imposter, listen carefully to earlier clues to piece together the topic before your turn!',
    ],
  },

  forehead_pop: {
    title: 'Forehead Pop!',
    emoji: '📱',
    tagline: 'Hold the phone on your forehead! Tilt up for correct, tilt down to pass!',
    category: 'Dumb Charades / Heads Up',
    themeBg: '#FEF08A',
    playerCount: '2+ Players',
    flowchart: [
      {
        step: 1,
        title: 'Forehead Hold',
        desc: 'Active player places the phone on their forehead in landscape mode facing the room.',
        badge: 'Landscape',
        color: '#E0E7FF',
      },
      {
        step: 2,
        title: 'Friends Act & Shout',
        desc: 'Friends shout hints, act out charades, and describe the secret word without saying it.',
        badge: 'Acting',
        color: '#FEF08A',
      },
      {
        step: 3,
        title: 'Motion Gestures',
        desc: 'Tilt phone UP (screen to ceiling) for CORRECT! Tilt DOWN (screen to floor) to SKIP!',
        badge: 'Gyro Tilt',
        color: '#A7F3D0',
      },
      {
        step: 4,
        title: 'Score & Next Turn',
        desc: 'When time expires, pass the phone to the next player. Cumulative scores update!',
        badge: 'Tally',
        color: '#BAE6FD',
      },
    ],
    scoring: [
      { outcome: 'Each Correct Word Guessed', points: '+1 pt', color: 'bg-emerald-100 text-emerald-950' },
      { outcome: 'Skipped Words', points: '0 pts', color: 'bg-gray-100 text-gray-800' },
    ],
    proTips: [
      'Tilt smoothly and return the phone to a neutral upright forehead position for the next word.',
      'No rhyming or saying the letters in the word!',
    ],
  },

  bomb: {
    title: 'Tick-Tick-BOOM!',
    emoji: '💣',
    tagline: 'Silent ticking mystery fuse! Shout a word matching the rule and pass before it blasts!',
    category: 'High-Speed Word Rush',
    themeBg: '#FED7AA',
    playerCount: '2+ Players',
    flowchart: [
      {
        step: 1,
        title: 'Category Rule Drawn',
        desc: 'App displays a syllable or category rule (e.g. "Starts with TR", "Things in Kolkata").',
        badge: 'Category',
        color: '#FED7AA',
      },
      {
        step: 2,
        title: 'Silent Mystery Fuse',
        desc: 'The bomb is completely silent! Nobody knows when it will explode (purely randomized 6-18s on every pass).',
        badge: 'Silent Clock',
        color: '#FECDD3',
      },
      {
        step: 3,
        title: 'Shout & Pass Fast',
        desc: 'Shout a valid word and immediately pass the phone to the next friend in the circle!',
        badge: 'Pass Fast',
        color: '#FEF08A',
      },
      {
        step: 4,
        title: 'SUDDEN EXPLOSION!',
        desc: 'The bomb detonates with a blast sound! The player holding it loses a heart or gains a strike!',
        badge: 'BOOM!',
        color: '#F87171',
      },
    ],
    scoring: [
      { outcome: 'Surviving a Round Unexploded', points: '+2 pts', color: 'bg-emerald-100 text-emerald-950' },
      { outcome: 'Holding Bomb on Blast', points: '-1 pt / Strike', color: 'bg-rose-100 text-rose-950' },
    ],
    proTips: [
      'Do not hold the phone while thinking — say your word first, then pass immediately!',
      'Duplicate words in the same round are not allowed.',
    ],
  },

  echo_bluff: {
    title: 'Echo Bluff',
    emoji: '🎭',
    tagline: 'Everyone writes an anonymous sentence. 30% chance AI joins. Can you find the author?',
    category: 'Bluffing & Social Mystery',
    themeBg: '#DDD6FE',
    playerCount: '2+ Players',
    flowchart: [
      {
        step: 1,
        title: 'Random Topic Prompt',
        desc: 'A random topic appears (e.g. "Biryani", "Traffic", "Weekend").',
        badge: 'Topic',
        color: '#DDD6FE',
      },
      {
        step: 2,
        title: 'Pass & Write Secretly',
        desc: 'Each player secretly types 1 short sentence about that topic on the phone.',
        badge: 'Anonymous',
        color: '#FEF08A',
      },
      {
        step: 3,
        title: 'Mystery Sentence Display',
        desc: 'The phone randomly picks 1 sentence (or a colloquial Benglish AI sentence 30% of the time!).',
        badge: 'Quote Reveal',
        color: '#BAE6FD',
      },
      {
        step: 4,
        title: 'Room Trial & Accusation',
        desc: 'Who wrote this? The true author tries to bluff and blame someone else! Everyone votes!',
        badge: 'Vote',
        color: '#FECDD3',
      },
    ],
    scoring: [
      { outcome: 'Author fools everyone / not caught', points: '+3 pts', color: 'bg-emerald-100 text-emerald-950' },
      { outcome: 'Guessing the true author correctly', points: '+1 pt each', color: 'bg-sky-100 text-sky-950' },
      { outcome: 'Correctly spotting the Benglish AI', points: '+2 pts', color: 'bg-purple-100 text-purple-950' },
    ],
    proTips: [
      'Try writing in your friend’s signature speaking style or slang to frame them!',
      'Watch out for the AI — it uses sneaky colloquial Benglish phrases like "bhai eta puro scam"!',
    ],
  },

  word_trap: {
    title: 'Word Trap',
    emoji: '🚨',
    tagline: 'Describe the secret word without uttering any of the 5 forbidden silence traps!',
    category: 'Taboo Relay',
    themeBg: '#FECDD3',
    playerCount: '2+ Players',
    flowchart: [
      {
        step: 1,
        title: 'Clue Giver Receives Phone',
        desc: 'Active player reads the secret word and the 5 forbidden silence words.',
        badge: 'Private',
        color: '#FECDD3',
      },
      {
        step: 2,
        title: 'Describe Under Pressure',
        desc: 'Give verbal clues without saying the secret word or any of the 5 forbidden words!',
        badge: 'Timer Ticking',
        color: '#FEF08A',
      },
      {
        step: 3,
        title: 'Live Trap Buzzer',
        desc: 'If the clue giver slips up and says any forbidden word, tap TRAP BUZZER 🚨 (-1 pt penalty)!',
        badge: 'Buzzer',
        color: '#F87171',
      },
      {
        step: 4,
        title: 'Correct Guess (+1)',
        desc: 'When your team shouts the correct word, tap Guessed! 🎉 (+1 pt) and jump to next card.',
        badge: 'Success',
        color: '#A7F3D0',
      },
    ],
    scoring: [
      { outcome: 'Each Word Guessed Correctly', points: '+1 pt', color: 'bg-emerald-100 text-emerald-950' },
      { outcome: 'Trap Buzzer (Said forbidden word)', points: '-1 pt', color: 'bg-rose-100 text-rose-950' },
    ],
    proTips: [
      'Think of metaphorical, historic, or situational clues instead of straightforward descriptions.',
      'Customize silence words between 3, 4, or 5 in settings depending on your group’s skill level.',
    ],
  },

  things_to_say: {
    title: 'Things You Can Say...',
    emoji: '💬',
    tagline: 'Cheeky, cute & double-meaning blitz! Say as many as you can in 10s and let the group score!',
    category: 'Double-Meaning Blitz',
    themeBg: '#FEF08A',
    playerCount: '2+ Players',
    flowchart: [
      {
        step: 1,
        title: 'Read-First Handoff',
        desc: 'Take the phone and read the funny prompt in peace (timer does NOT start until you click Start!).',
        badge: 'Read First',
        color: '#BAE6FD',
      },
      {
        step: 2,
        title: 'Tap Start & 10s Blitz',
        desc: 'Tap Start! You have 10 seconds to shout as many funny, witty, double-meaning answers as possible!',
        badge: '10s Blitz',
        color: '#FEF08A',
      },
      {
        step: 3,
        title: 'Buzzer Detonates',
        desc: 'Timer hits 0 with a loud buzzer. Stop shouting!',
        badge: 'Time’s Up',
        color: '#FED7AA',
      },
      {
        step: 4,
        title: 'Group Decision Stepper',
        desc: 'The room laughs and agrees on how many answers were valid. Use the [+] / [-] stepper to award points!',
        badge: 'Consensus',
        color: '#A7F3D0',
      },
    ],
    scoring: [
      { outcome: 'Each Approved / Funny Answer', points: '+1 pt', color: 'bg-emerald-100 text-emerald-950' },
      { outcome: 'Hilarious Group Favorite Bonus', points: '+1 bonus pt', color: 'bg-amber-100 text-amber-950' },
    ],
    proTips: [
      'Double-meaning answers that work equally well in both contexts get the biggest laughs and easiest points!',
      'Speed matters — rapid-fire answers keep the room hyped.',
    ],
  },

  fake_artist: {
    title: 'Fake Artist',
    emoji: '🎨',
    tagline: 'Everyone draws one stroke of the secret word. The Fake Artist is clueless! Auto-passes on stroke lift!',
    category: 'Drawing Social Deduction',
    themeBg: '#E0E7FF',
    playerCount: '3+ Players',
    flowchart: [
      {
        step: 1,
        title: 'Secret Role Reveal',
        desc: 'Pass phone secretly. Real artists see the secret word (e.g. Tram); Fake Artist sees only the category!',
        badge: 'Secret Pass',
        color: '#E0E7FF',
      },
      {
        step: 2,
        title: 'Draw 1 Continuous Stroke',
        desc: 'Each player draws with their assigned vibrant neon color. Stylus mode enables palm rejection!',
        badge: 'Shared Canvas',
        color: '#A7F3D0',
      },
      {
        step: 3,
        title: 'Auto-Next on Lift',
        desc: 'The moment you lift your pen or finger, your stroke completes and passes to the next player!',
        badge: 'Auto-Advance',
        color: '#BAE6FD',
      },
      {
        step: 4,
        title: 'Accusation & Steal Guess',
        desc: 'Room points at the Fake Artist (or secret pass-and-play voting ballots if >6 players)! If caught, Fake Artist gets 1 guess to steal!',
        badge: 'Accusation',
        color: '#FECDD3',
      },
    ],
    scoring: [
      { outcome: 'Artists catch Fake Artist (fails guess)', points: '+2 pts each', color: 'bg-emerald-100 text-emerald-950' },
      { outcome: 'Fake Artist escapes unnoticed', points: '+3 pts', color: 'bg-purple-100 text-purple-950' },
      { outcome: 'Fake Artist steals by guessing word', points: '+3 pts', color: 'bg-amber-100 text-amber-950' },
    ],
    proTips: [
      'Real artists should NOT draw the whole picture in stroke 1 — draw subtle lines that prove you know it without giving it away to the Fake!',
      'Fake Artists should connect existing lines or add ambiguous curves (like eyes or wheels) that fit multiple things.',
    ],
  },

  mafia: {
    title: 'Mafia',
    emoji: '🐺',
    tagline: 'Automated night cycles, Detective inquiries, Doctor saves, and daytime town trials!',
    category: 'Social Deduction Classic',
    themeBg: '#FEE2E2',
    playerCount: '3+ Players',
    flowchart: [
      {
        step: 1,
        title: 'Secret Roles Assignment',
        desc: 'Pass phone secretly to reveal your role: 🐺 Mafia, 🕵️ Detective, 💉 Doctor, 🧑‍🌾 Villager, or 🃏 Jester.',
        badge: 'Secret Roles',
        color: '#FEE2E2',
      },
      {
        step: 2,
        title: 'Silent Night Cycle',
        desc: 'Pass phone to living players: Mafia strikes, Detective inspects (Guilty/Innocent), Doctor heals.',
        badge: 'Night Pass',
        color: '#0F172A text-white',
      },
      {
        step: 3,
        title: 'Morning Announcement',
        desc: 'Morning church bell rings! The app reveals if someone was eliminated or if the Doctor performed a miracle save!',
        badge: 'Dawn Reveal',
        color: '#FEF08A',
      },
      {
        step: 4,
        title: 'Discussion & Town Trial',
        desc: '90s debate timer! Town votes to eliminate a suspect or skip. Jester wins solo if voted out!',
        badge: 'Trial Vote',
        color: '#FECDD3',
      },
    ],
    scoring: [
      { outcome: 'Town Victory (All Mafia eliminated)', points: '+3 pts each Town', color: 'bg-emerald-100 text-emerald-950' },
      { outcome: 'Mafia Dominates (Equals/Outnumbers Town)', points: '+4 pts each Mafia', color: 'bg-rose-100 text-rose-950' },
      { outcome: 'Jester Solo Win (Tricked Town to vote them)', points: '+5 pts Jester', color: 'bg-purple-100 text-purple-950' },
    ],
    proTips: [
      'The Detective should not immediately reveal their identity on Day 1 unless they have a confirmed Guilty Mafia target!',
      'The Doctor can choose to protect themselves if they feel threatened.',
    ],
  },

  resistance: {
    title: 'The Resistance',
    emoji: '🛡️',
    tagline: 'Unmask imperial spies! Propose mission teams, vote on leaders, and pass 3 missions to overthrow the Empire!',
    category: 'Revolt & Deduction',
    themeBg: '#E0E7FF',
    playerCount: '5-10 Players',
    flowchart: [
      {
        step: 1,
        title: 'Secret Role Assignment',
        desc: 'Pass phone secretly. Resistance members know nothing; Imperial Spies secretly see all fellow spies!',
        badge: 'Secret Pass',
        color: '#E0E7FF',
      },
      {
        step: 2,
        title: 'Leader Proposes Team',
        desc: 'Leader nominates required number of operatives. Room openly votes Approve/Reject (5 rejects in a row = Spies win!).',
        badge: 'Public Vote',
        color: '#FEF08A',
      },
      {
        step: 3,
        title: 'Secret Mission Action',
        desc: 'Approved operatives secretly vote! Resistance can only vote SUCCESS. Spies choose SUCCESS or SABOTAGE.',
        badge: 'Anonymous Vote',
        color: '#A7F3D0',
      },
      {
        step: 4,
        title: 'Anonymous Shuffled Reveal',
        desc: 'Cards are shuffled! If even 1 Sabotage appears, the mission fails! First team to 3 wins takes the war!',
        badge: 'Outcome',
        color: '#FECDD3',
      },
    ],
    scoring: [
      { outcome: 'Resistance completes 3 missions', points: '+3 pts each Resistance', color: 'bg-indigo-100 text-indigo-950' },
      { outcome: 'Spies sabotage 3 missions / 5 rejected votes', points: '+3 pts each Spy', color: 'bg-rose-100 text-rose-950' },
      { outcome: 'Assassin correctly eliminates Commander', points: '+3 pts Spies Steal', color: 'bg-amber-100 text-amber-950' },
    ],
    proTips: [
      'Why send 2 players on Mission 1? If it fails, you know with 100% mathematical certainty that either Player A or Player B is a Spy!',
      'Spies often vote SUCCESS on Mission 1 to build deep trust, then strike on high-stake Missions 4 and 5!',
    ],
  },

  spyfall: {
    title: 'Spyfall',
    emoji: '📍',
    tagline: 'Everyone knows the secret location and their role except ONE clueless Spy. Ask subtle questions, spot the bluff!',
    category: 'Location Bluffing',
    themeBg: '#BAE6FD',
    playerCount: '3-12 Players',
    flowchart: [
      {
        step: 1,
        title: 'Secret Location Peek',
        desc: 'Everyone sees the same spot (e.g. Eden Gardens or Airplane) + their role. The Spy only sees "YOU ARE THE SPY"!',
        badge: 'Secret Peek',
        color: '#BAE6FD',
      },
      {
        step: 2,
        title: 'Subtle Questioning Round',
        desc: 'Active questioner asks 1 player a clever question. That player answers and asks someone else. Keep questions subtle!',
        badge: '6 min Timer',
        color: '#FEF08A',
      },
      {
        step: 3,
        title: 'Accuse a Suspect',
        desc: 'Stop the clock to accuse who you think is clueless! If the room votes and catches the Spy, Innocents win!',
        badge: 'Room Trial',
        color: '#FECDD3',
      },
      {
        step: 4,
        title: 'The Spy’s Location Steal',
        desc: 'At any point, the Spy can stop the game and guess the location from the grid. If correct, the Spy steals the win!',
        badge: 'Dramatic Steal',
        color: '#A7F3D0',
      },
    ],
    scoring: [
      { outcome: 'Innocents catch the Spy (fails guess)', points: '+2 pts each Innocent', color: 'bg-sky-100 text-sky-950' },
      { outcome: 'Spy survives timer without being caught', points: '+3 pts Spy', color: 'bg-purple-100 text-purple-950' },
      { outcome: 'Spy correctly guesses secret location', points: '+3 pts Spy Steal', color: 'bg-amber-100 text-amber-950' },
    ],
    proTips: [
      'You cannot just imagine a location! Your answer will sound completely bizarre to everyone else and expose you immediately.',
      'Never ask direct questions like "Are we on a flight?" — the Spy is listening and will guess the location!',
    ],
  },
};

interface GamePreviewModalProps {
  gameId: SelectableGameId;
  onProceed: () => void;
  onClose: () => void;
}

export const GamePreviewModal: React.FC<GamePreviewModalProps> = ({
  gameId,
  onProceed,
  onClose,
}) => {
  const data = GAME_PREVIEWS[gameId];

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#FFFDF7] animate-fade-in select-none w-full h-[100dvh] overflow-hidden">
      <div className="w-full max-w-2xl mx-auto flex-1 flex flex-col p-4 sm:p-6 min-h-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between border-b-3 border-black pb-3 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="w-14 h-14 rounded-2xl border-3 border-black flex items-center justify-center text-3xl shadow-[3px_3px_0px_#000] shrink-0"
              style={{ backgroundColor: data.themeBg }}
            >
              {data.emoji}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="neo-badge bg-white text-[10px] font-black uppercase text-gray-800">
                  {data.category}
                </span>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full border border-black bg-gray-100">
                  {data.playerCount}
                </span>
              </div>
              <h2 className="text-2xl font-black text-[#18181B] leading-tight">{data.title}</h2>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playPop();
              onClose();
            }}
            className="p-2 rounded-xl border-3 border-black bg-white hover:bg-gray-100 shadow-[2px_2px_0px_#000] shrink-0 active:translate-x-0.5 active:translate-y-0.5"
            aria-label="Close"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Scrollable Overview Content */}
        <div className="flex-1 overflow-y-auto space-y-4 py-3 pr-1 sm:pr-2">
          {/* Tagline Box */}
          <div className="p-3.5 rounded-2xl border-3 border-black bg-white shadow-[3px_3px_0px_#000]">
            <p className="text-xs sm:text-sm font-bold text-gray-800 leading-snug">{data.tagline}</p>
          </div>

          {/* VISUAL FLOWCHART */}
          <div className="space-y-2">
            <div className="text-xs font-black uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Step-by-Step Flowchart
            </div>

            <div className="space-y-2">
              {data.flowchart.map((node, idx) => (
                <React.Fragment key={node.step}>
                  <div className="p-3 rounded-2xl border-3 border-black bg-white flex items-start gap-3 shadow-[2px_2px_0px_#000]">
                    <div
                      className="w-7 h-7 rounded-xl border-2 border-black flex items-center justify-center text-xs font-black shrink-0 shadow-[1px_1px_0px_#000]"
                      style={{ backgroundColor: node.color }}
                    >
                      {node.step}
                    </div>

                    <div className="space-y-0.5 flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-black text-[#18181B]">{node.title}</span>
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded border border-black bg-gray-50 uppercase text-gray-600">
                          {node.badge}
                        </span>
                      </div>
                      <p className="text-[11px] font-bold text-gray-600 leading-snug">{node.desc}</p>
                    </div>
                  </div>

                  {idx < data.flowchart.length - 1 && (
                    <div className="flex justify-center -my-1">
                      <div className="text-xs font-black text-gray-400">↓</div>
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* SCORING & POINTS MATRIX */}
          <div className="space-y-2">
            <div className="text-xs font-black uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-amber-600" />
              Points &amp; Scoring Matrix
            </div>

            <div className="space-y-1.5">
              {data.scoring.map((rule, idx) => (
                <div
                  key={idx}
                  className={`p-2.5 rounded-xl border-2 border-black flex items-center justify-between text-xs font-black ${rule.color}`}
                >
                  <span className="truncate pr-2">{rule.outcome}</span>
                  <span className="px-2 py-0.5 rounded-lg border border-black bg-white text-black font-mono shrink-0 shadow-[1px_1px_0px_#000]">
                    {rule.points}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* PRO TIPS */}
          <div className="p-3.5 rounded-2xl border-3 border-black bg-[#FEF3C7] space-y-1.5 text-amber-950 shadow-[3px_3px_0px_#000]">
            <div className="text-xs font-black uppercase flex items-center gap-1.5">
              <Lightbulb className="w-4 h-4 text-amber-700" /> Pro Tips for Tonight
            </div>
            <ul className="space-y-1 text-[11px] font-bold leading-relaxed list-disc list-inside">
              {data.proTips.map((tip, idx) => (
                <li key={idx}>{tip}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-3 border-t-3 border-black space-y-2 shrink-0">
          <button
            onClick={() => {
              sound.playFanfare();
              onProceed();
            }}
            className="w-full neo-btn py-4 bg-[#FEF08A] hover:bg-[#FDE047] text-base sm:text-lg font-black text-[#18181B] flex items-center justify-center gap-2 shadow-[4px_4px_0px_#000] active:translate-x-0.5 active:translate-y-0.5"
          >
            Proceed to Game <ArrowRight className="w-5 h-5 stroke-[3]" />
          </button>
        </div>
      </div>
    </div>
  );
};
