import { Player } from '../../services/db';
import { SentenceSubmission } from './SentenceCollectionPhase';
import { EchoBluffConfig } from './EchoBluffSettings';

export interface EchoRoundResult {
  isAiAuthor: boolean;
  actualAuthorName: string;
  actualAuthorId: string;
  votes: Record<string, string>; // voterId -> suspectId
  scoreDeltas: Record<string, number>;
  outcomeTitle: string;
  outcomeDescription: string;
  voteTallies: Record<string, number>; // suspectId -> count
}

export function computeEchoScores(
  players: Player[],
  mysterySubmission: SentenceSubmission,
  votes: Record<string, string>,
  config: EchoBluffConfig
): EchoRoundResult {
  const scoreDeltas: Record<string, number> = {};
  players.forEach(p => (scoreDeltas[p.id] = 0));

  // Tally votes for each suspect
  const voteTallies: Record<string, number> = { ai: 0 };
  players.forEach(p => (voteTallies[p.id] = 0));

  Object.values(votes).forEach(suspectId => {
    voteTallies[suspectId] = (voteTallies[suspectId] || 0) + 1;
  });

  // CASE 1: The sentence was written by the AI!
  if (mysterySubmission.isAi) {
    let humansWhoCaughtAi = 0;
    let humansFooled = 0;

    players.forEach(voter => {
      const suspectChoice = votes[voter.id];
      if (suspectChoice === 'ai') {
        // Human spotted the AI!
        scoreDeltas[voter.id] += config.aiCaughtBonus;
        humansWhoCaughtAi++;
      } else {
        // Wrongly voted for an innocent friend when it was AI!
        scoreDeltas[voter.id] -= config.aiPointsPenalty;
        humansFooled++;
      }
    });

    const aiWon = humansFooled > humansWhoCaughtAi;

    return {
      isAiAuthor: true,
      actualAuthorName: 'The AI (Mystery Bot)',
      actualAuthorId: 'ai',
      votes,
      scoreDeltas,
      outcomeTitle: aiWon ? 'THE AI TRICKED THE ROOM! 🤖' : 'HUMANS EXPOSED THE AI! 🧠',
      outcomeDescription: aiWon
        ? `The AI tricked everyone into blaming an innocent friend! Voters who accused a human lose ${config.aiPointsPenalty} point.`
        : `Brilliant intuition! Players who called out the AI earn +${config.aiCaughtBonus} points!`,
      voteTallies,
    };
  }

  // CASE 2: The sentence was written by a human Player
  const authorId = mysterySubmission.authorId;
  const authorPlayer = players.find(p => p.id === authorId);
  const authorName = authorPlayer ? authorPlayer.name : mysterySubmission.authorName;

  const totalOtherVoters = players.filter(p => p.id !== authorId);
  let votesAgainstAuthor = 0;

  totalOtherVoters.forEach(voter => {
    const suspectChoice = votes[voter.id];
    if (suspectChoice === authorId) {
      // Correct guess!
      scoreDeltas[voter.id] += 1;
      votesAgainstAuthor++;
    }
  });

  // Did the author successfully bluff the room?
  // If fewer than half of the other voters caught them, the bluff succeeded!
  const isBluffSuccessful = votesAgainstAuthor < Math.ceil(totalOtherVoters.length / 2);

  if (isBluffSuccessful) {
    // Author fooled the room!
    scoreDeltas[authorId] += config.bluffSuccessBonus;

    return {
      isAiAuthor: false,
      actualAuthorName: authorName,
      actualAuthorId: authorId,
      votes,
      scoreDeltas,
      outcomeTitle: `${authorName} PULLED OFF THE BLUFF! 🎭`,
      outcomeDescription: `${authorName} successfully deceived the group and earns +${config.bluffSuccessBonus} points!`,
      voteTallies,
    };
  } else {
    // Author was caught!
    return {
      isAiAuthor: false,
      actualAuthorName: authorName,
      actualAuthorId: authorId,
      votes,
      scoreDeltas,
      outcomeTitle: `${authorName} WAS CAUGHT! 🕵️`,
      outcomeDescription: `The room saw right through ${authorName}'s bluff! Voters who spotted them earn +1 point.`,
      voteTallies,
    };
  }
}
