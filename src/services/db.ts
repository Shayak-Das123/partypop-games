import Dexie, { type Table } from 'dexie';

export interface Player {
  id: string;
  name: string;
  avatarEmoji: string;
  color: string;
  orderIndex: number;
}

export interface GameRoundRecord {
  roundId: string;
  gameType:
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
  timestamp: number;
  summary: string;
  scoreDeltas: Record<string, number>; // playerId -> points
  meta?: Record<string, any>;
}

export interface SessionSettings {
  autoSaveProgress: boolean;
  keepRosterBetweenGames: boolean;
}

export interface SessionPhoto {
  id: string;
  url: string; // ImgBB permanent cloud CDN URL
  dataUrl?: string; // backwards compatibility
  caption?: string;
  timestamp: number;
  likes?: number;
  carouselGroupId?: string;
}

export interface SessionVideoLink {
  id: string;
  url: string;
  youtubeId: string;
  title?: string;
  timestamp: number;
}

export interface Session {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  status: 'active' | 'archived';
  players: Player[];
  cumulativeScores: Record<string, number>; // playerId -> points
  history: GameRoundRecord[];
  photos?: SessionPhoto[];
  videoLinks?: SessionVideoLink[];
  settings?: SessionSettings;
}

export interface PlayerPerformanceProfile {
  playerId: string;
  playerName: string;
  avatarEmoji: string;
  totalScore: number;
  primaryTitle: string;
  primaryEmoji: string;
  tags: string[];
  summary: string;
  stats: {
    imposterRoundsPlayed: number;
    imposterCorrectVotes: number;
    imposterTotalVotes: number;
    imposterTimesSurvived: number;
    charadesWordsGuessed: number;
    timesEliminated: number;
  };
}

export interface SessionAward {
  id: string;
  title: string;
  emoji: string;
  recipientName: string;
  description: string;
  score: string;
}

export class GameDatabase extends Dexie {
  sessions!: Table<Session, string>;

  constructor() {
    super('PartyPopDB');
    this.version(1).stores({
      sessions: 'id, updatedAt, status',
    });
  }
}

export const db = new GameDatabase();

// Exactly 20 playful animal/character icons
export const CUTE_AVATARS = [
  '🦊', '🐼', '🐯', '🐰', '🦁',
  '🐸', '🐨', '🐙', '🦄', '🐵',
  '🐱', '🐶', '🦉', '🦥', '🐲',
  '🐻', '🐧', '🦖', '🦩', '🐬'
];

export const PASTEL_COLORS = [
  '#FEF08A', // Yellow
  '#FECDD3', // Pink
  '#A7F3D0', // Mint
  '#DDD6FE', // Lavender
  '#BAE6FD', // Sky Cyan
  '#FED7AA', // Peach
  '#F5D0FE', // Lilac
];

export interface PlayerInput {
  name: string;
  avatarEmoji?: string;
}

// Helper to generate a cute player with chosen or default avatar
export function createPlayer(name: string, index: number, customAvatar?: string): Player {
  return {
    id: 'p_' + Math.random().toString(36).substring(2, 9),
    name: name.trim() || `Player ${index + 1}`,
    avatarEmoji: customAvatar || CUTE_AVATARS[index % CUTE_AVATARS.length],
    color: PASTEL_COLORS[index % PASTEL_COLORS.length],
    orderIndex: index,
  };
}

// Database Operations
export async function createNewSession(
  title?: string,
  playersInput: (string | PlayerInput)[] = []
): Promise<Session> {
  const players = playersInput.map((item, i) => {
    if (typeof item === 'string') {
      return createPlayer(item, i);
    }
    return createPlayer(item.name, i, item.avatarEmoji);
  });

  const cumulativeScores: Record<string, number> = {};
  players.forEach(p => (cumulativeScores[p.id] = 0));

  const session: Session = {
    id: 'sess_' + Date.now(),
    title: title?.trim() || `Party Night #${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    status: 'active',
    players,
    cumulativeScores,
    history: [],
    settings: {
      autoSaveProgress: true,
      keepRosterBetweenGames: true,
    },
  };

  await db.sessions.put(session);
  return session;
}

export async function updateSessionSettings(
  sessionId: string,
  newSettings: Partial<SessionSettings>
): Promise<void> {
  const session = await db.sessions.get(sessionId);
  if (!session) return;

  session.settings = {
    autoSaveProgress: true,
    keepRosterBetweenGames: true,
    ...session.settings,
    ...newSettings,
  };
  session.updatedAt = Date.now();
  await db.sessions.put(session);
}

export async function switchActiveSession(sessionId: string): Promise<Session | null> {
  const session = await db.sessions.get(sessionId);
  if (!session) return null;

  session.updatedAt = Date.now();
  await db.sessions.put(session);
  return session;
}

export async function deleteSession(sessionId: string): Promise<void> {
  await db.sessions.delete(sessionId);
}

export async function getAllSessions(): Promise<Session[]> {
  return await db.sessions.orderBy('updatedAt').reverse().toArray();
}

export async function addPlayerToSession(
  sessionId: string,
  playerName: string,
  avatarEmoji?: string
): Promise<Player> {
  const session = await db.sessions.get(sessionId);
  if (!session) throw new Error('Session not found');

  const newPlayer = createPlayer(playerName, session.players.length, avatarEmoji);
  session.players.push(newPlayer);
  session.cumulativeScores[newPlayer.id] = 0;
  session.updatedAt = Date.now();

  await db.sessions.put(session);
  return newPlayer;
}

export async function removePlayerFromSession(sessionId: string, playerId: string): Promise<void> {
  const session = await db.sessions.get(sessionId);
  if (!session) return;

  session.players = session.players.filter(p => p.id !== playerId);
  delete session.cumulativeScores[playerId];
  session.updatedAt = Date.now();

  await db.sessions.put(session);
}

export async function updatePlayerOrder(sessionId: string, players: Player[]): Promise<void> {
  const session = await db.sessions.get(sessionId);
  if (!session) return;

  session.players = players.map((p, idx) => ({ ...p, orderIndex: idx }));
  session.updatedAt = Date.now();

  await db.sessions.put(session);
}

export async function commitRoundToSession(
  sessionId: string,
  gameType: GameRoundRecord['gameType'],
  summary: string,
  scoreDeltas: Record<string, number>,
  meta?: Record<string, any>
): Promise<void> {
  const session = await db.sessions.get(sessionId);
  if (!session) throw new Error('Session not found');

  const roundRecord: GameRoundRecord = {
    roundId: 'rnd_' + Date.now(),
    gameType,
    timestamp: Date.now(),
    summary,
    scoreDeltas,
    meta,
  };

  session.history.unshift(roundRecord);

  // Accumulate scores
  Object.entries(scoreDeltas).forEach(([playerId, delta]) => {
    session.cumulativeScores[playerId] = (session.cumulativeScores[playerId] || 0) + delta;
  });

  session.updatedAt = Date.now();
  await db.sessions.put(session);
}

export async function manuallyAdjustPlayerScore(
  sessionId: string,
  playerId: string,
  delta: number
): Promise<void> {
  const session = await db.sessions.get(sessionId);
  if (!session) throw new Error('Session not found');

  const currentScore = session.cumulativeScores[playerId] || 0;
  const newScore = Math.max(0, currentScore + delta);
  session.cumulativeScores[playerId] = newScore;
  session.updatedAt = Date.now();

  await db.sessions.put(session);
}

export async function archiveSession(sessionId: string): Promise<void> {
  const session = await db.sessions.get(sessionId);
  if (!session) return;
  session.status = 'archived';
  session.updatedAt = Date.now();
  await db.sessions.put(session);
}

export async function addPhotoToSession(
  sessionId: string,
  url: string,
  caption?: string,
  carouselGroupId?: string
): Promise<SessionPhoto> {
  const session = await db.sessions.get(sessionId);
  if (!session) throw new Error('Session not found');

  if (!session.photos) session.photos = [];
  const newPhoto: SessionPhoto = {
    id: 'photo_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    url,
    caption: caption?.trim(),
    timestamp: Date.now(),
    likes: 0,
    carouselGroupId,
  };
  session.photos.unshift(newPhoto);
  session.updatedAt = Date.now();

  await db.sessions.put(session);
  return newPhoto;
}

export async function togglePhotoLike(
  sessionId: string,
  photoId: string
): Promise<number> {
  const session = await db.sessions.get(sessionId);
  if (!session || !session.photos) return 0;

  const photo = session.photos.find(p => p.id === photoId);
  if (!photo) return 0;

  photo.likes = (photo.likes || 0) + 1;
  session.updatedAt = Date.now();
  await db.sessions.put(session);
  return photo.likes;
}

export async function removePhotoFromSession(
  sessionId: string,
  photoId: string
): Promise<void> {
  const session = await db.sessions.get(sessionId);
  if (!session || !session.photos) return;

  session.photos = session.photos.filter(p => p.id !== photoId);
  session.updatedAt = Date.now();
  await db.sessions.put(session);
}

export async function addVideoLinkToSession(
  sessionId: string,
  url: string,
  title?: string
): Promise<void> {
  const session = await db.sessions.get(sessionId);
  if (!session) throw new Error('Session not found');

  // Extract YouTube ID
  let youtubeId = '';
  try {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
      youtubeId = match[2];
    } else if (url.includes('/shorts/')) {
      const parts = url.split('/shorts/');
      if (parts[1]) youtubeId = parts[1].split('?')[0].substring(0, 11);
    }
  } catch {}

  if (!youtubeId) {
    throw new Error('Please enter a valid YouTube video or Short URL');
  }

  if (!session.videoLinks) session.videoLinks = [];
  session.videoLinks.unshift({
    id: 'vid_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    url,
    youtubeId,
    title: title?.trim() || `Game Night Video #${session.videoLinks.length + 1}`,
    timestamp: Date.now(),
  });
  session.updatedAt = Date.now();

  await db.sessions.put(session);
}

export async function removeVideoLinkFromSession(
  sessionId: string,
  videoId: string
): Promise<void> {
  const session = await db.sessions.get(sessionId);
  if (!session || !session.videoLinks) return;

  session.videoLinks = session.videoLinks.filter(v => v.id !== videoId);
  session.updatedAt = Date.now();
  await db.sessions.put(session);
}

// Generate Personalized Performance Tags for EVERY player in the session
export function computeAllPlayerProfiles(session: Session): PlayerPerformanceProfile[] {
  const imposterRounds = session.history.filter(h => h.gameType === 'imposter');
  const foreheadRounds = session.history.filter(h => h.gameType === 'forehead_pop');

  // Find max score for relative comparison
  let maxScore = -Infinity;
  session.players.forEach(p => {
    const sc = session.cumulativeScores[p.id] || 0;
    if (sc > maxScore) maxScore = sc;
  });

  return session.players.map(player => {
    const totalScore = session.cumulativeScores[player.id] || 0;
    const tags: string[] = [];

    let correctVotes = 0;
    let totalVotes = 0;
    let timesEliminated = 0;
    let timesSurvivedAsImposter = 0;
    let timesJesterVotedOut = 0;
    let timesAssistantSurvived = 0;
    let charadesWords = 0;

    // Analyze Imposter rounds
    imposterRounds.forEach(r => {
      const votes = r.meta?.votes as Record<string, string> | undefined;
      const imposterIds = new Set(r.meta?.imposterIds || []);
      const roles = r.meta?.roles as Record<string, string> | undefined;
      const eliminatedId = r.meta?.eliminatedId || (r.summary.includes(player.name) ? player.id : null);

      if (votes && votes[player.id]) {
        totalVotes++;
        if (imposterIds.has(votes[player.id])) {
          correctVotes++;
        }
      }

      if (roles && roles[player.id] === 'imposter') {
        if (eliminatedId !== player.id) {
          timesSurvivedAsImposter++;
        }
      }

      if (roles && roles[player.id] === 'jester' && eliminatedId === player.id) {
        timesJesterVotedOut++;
      }

      if (roles && roles[player.id] === 'assistant' && eliminatedId !== player.id) {
        timesAssistantSurvived++;
      }

      if (eliminatedId === player.id) {
        timesEliminated++;
      }
    });

    // Analyze Forehead rounds
    foreheadRounds.forEach(r => {
      const wordsGuessedMap = r.meta?.wordsGuessed as Record<string, string[]> | undefined;
      if (wordsGuessedMap && wordsGuessedMap[player.id]) {
        charadesWords += wordsGuessedMap[player.id].length;
      } else if (r.scoreDeltas[player.id]) {
        charadesWords += Math.max(0, r.scoreDeltas[player.id]);
      }
    });

    const voteAccuracy = totalVotes > 0 ? correctVotes / totalVotes : 0;

    // Determine titles & tags
    let primaryTitle = 'The Wildcard';
    let primaryEmoji = '🎲';
    let summary = 'A flexible party player keeping everyone on their toes!';

    if (totalScore === maxScore && maxScore > 0) {
      primaryTitle = 'Party GOAT';
      primaryEmoji = '👑';
      summary = 'Dominating the leaderboard as the undisputed session champion!';
      tags.push('Session MVP', 'Score Leader');
    } else if (voteAccuracy >= 0.75 && totalVotes >= 2) {
      primaryTitle = 'Sherlock Holmes';
      primaryEmoji = '🕵️';
      summary = 'Sharp deductive instincts and an eagle eye for spotting lies.';
      tags.push('Eagle Eye', `${Math.round(voteAccuracy * 100)}% Accuracy`, 'Master Detective');
    } else if (timesSurvivedAsImposter > 0) {
      primaryTitle = 'The Phantom';
      primaryEmoji = '👻';
      summary = 'Blended in without raising a shred of suspicion!';
      tags.push('Master Deceiver', 'Untraceable', 'Stealth Mode');
    } else if (charadesWords >= 4) {
      primaryTitle = 'Charade Royalty';
      primaryEmoji = '🎭';
      summary = 'Crushed the stage with lightning-fast acting and guessing!';
      tags.push('Stage Star', `${charadesWords} Words Guessed`, 'Expressive');
    } else if (timesJesterVotedOut > 0) {
      primaryTitle = 'The Chaos Gremlin';
      primaryEmoji = '🃏';
      summary = 'Masterminded chaos and baited the entire room into voting them out!';
      tags.push('Trickster', 'Chaos Master', 'Puppet Master');
    } else if (timesAssistantSurvived > 0) {
      primaryTitle = 'The Loyal Wingman';
      primaryEmoji = '🤝';
      summary = 'Secretly held the frontline and saved their partner from ruin.';
      tags.push('Loyal Partner', 'Secret Agent');
    } else if (timesEliminated >= 2) {
      primaryTitle = 'The Scapegoat';
      primaryEmoji = '🎯';
      summary = 'Constantly in the hot seat, whether innocent or guilty!';
      tags.push('Suspect #1', 'Framed', 'Resilient');
    } else if (timesEliminated === 0 && session.history.length >= 2) {
      primaryTitle = 'The Untouchable';
      primaryEmoji = '🛡️';
      summary = 'Never got voted out! Radiated total innocence all night long.';
      tags.push('Zero Heat', 'Clean Record');
    } else if (totalScore > 0) {
      primaryTitle = 'The Steady Hand';
      primaryEmoji = '⚡';
      summary = 'Consistently picking up points round after round.';
      tags.push('Reliable', 'Points Hunter');
    }

    if (charadesWords > 0 && !tags.some(t => t.includes('Guessed'))) {
      tags.push(`${charadesWords} Charades`);
    }
    if (totalVotes >= 1 && !tags.some(t => t.includes('Accuracy'))) {
      tags.push(`${Math.round(voteAccuracy * 100)}% Voting`);
    }

    return {
      playerId: player.id,
      playerName: player.name,
      avatarEmoji: player.avatarEmoji,
      totalScore,
      primaryTitle,
      primaryEmoji,
      tags,
      summary,
      stats: {
        imposterRoundsPlayed: imposterRounds.length,
        imposterCorrectVotes: correctVotes,
        imposterTotalVotes: totalVotes,
        imposterTimesSurvived: timesSurvivedAsImposter,
        charadesWordsGuessed: charadesWords,
        timesEliminated,
      },
    };
  });
}

// Session Awards Calculator (High level awards)
export function computeSessionAwards(session: Session): SessionAward[] {
  const profiles = computeAllPlayerProfiles(session);
  const awards: SessionAward[] = [];

  // Top MVP
  const sortedByScore = [...profiles].sort((a, b) => b.totalScore - a.totalScore);
  if (sortedByScore.length > 0 && sortedByScore[0].totalScore > 0) {
    const mvp = sortedByScore[0];
    awards.push({
      id: 'overall_mvp',
      title: 'Party GOAT 🏆',
      emoji: '👑',
      recipientName: mvp.playerName,
      description: 'Highest total score across all games in this session!',
      score: `${mvp.totalScore} pts`,
    });
  }

  // Top Detective
  const sortedByAccuracy = [...profiles]
    .filter(p => p.stats.imposterTotalVotes >= 1)
    .sort((a, b) => b.stats.imposterCorrectVotes / (b.stats.imposterTotalVotes || 1) - a.stats.imposterCorrectVotes / (a.stats.imposterTotalVotes || 1));
  if (sortedByAccuracy.length > 0) {
    const bestDet = sortedByAccuracy[0];
    const acc = Math.round((bestDet.stats.imposterCorrectVotes / bestDet.stats.imposterTotalVotes) * 100);
    if (acc > 0) {
      awards.push({
        id: 'sherlock',
        title: 'Sherlock Holmes 🔍',
        emoji: '🕵️',
        recipientName: bestDet.playerName,
        description: 'Sharpest detective with top voting accuracy.',
        score: `${acc}% accuracy`,
      });
    }
  }

  // Top Charade
  const sortedByCharades = [...profiles].sort((a, b) => b.stats.charadesWordsGuessed - a.stats.charadesWordsGuessed);
  if (sortedByCharades.length > 0 && sortedByCharades[0].stats.charadesWordsGuessed > 0) {
    const charadeKing = sortedByCharades[0];
    awards.push({
      id: 'charade_master',
      title: 'Charade Royalty 🎭',
      emoji: '⚡',
      recipientName: charadeKing.playerName,
      description: 'Lightning fast acting and guessing in Forehead Pop!',
      score: `${charadeKing.stats.charadesWordsGuessed} words`,
    });
  }

  return awards;
}
