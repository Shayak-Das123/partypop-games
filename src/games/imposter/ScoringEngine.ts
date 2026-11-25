import { Player } from '../../services/db';

export type ImposterRole = 'innocent' | 'imposter' | 'assistant' | 'jester';

export interface ImposterRoundResult {
  eliminatedId: string | null;
  eliminatedRole: ImposterRole | null;
  isTie: boolean;
  voteCounts: Record<string, number>;
  scoreDeltas: Record<string, number>;
  detailedReasons: Record<string, string>;
}

export function calculateImposterScores(params: {
  players: Player[];
  roles: Record<string, ImposterRole>;
  votes: Record<string, string>; // voterId -> targetId
  imposterGuessedCorrectly?: boolean;
}): ImposterRoundResult {
  const { players, roles, votes, imposterGuessedCorrectly } = params;

  // 1. Tally votes
  const voteCounts: Record<string, number> = {};
  players.forEach(p => (voteCounts[p.id] = 0));
  Object.values(votes).forEach(targetId => {
    if (voteCounts[targetId] !== undefined) {
      voteCounts[targetId]++;
    }
  });

  // 2. Identify majority eliminated player
  let maxVotes = 0;
  Object.values(voteCounts).forEach(cnt => {
    if (cnt > maxVotes) maxVotes = cnt;
  });

  const topCandidates = Object.keys(voteCounts).filter(pid => voteCounts[pid] === maxVotes && maxVotes > 0);
  const isTie = topCandidates.length > 1;
  const eliminatedId = !isTie && topCandidates.length === 1 ? topCandidates[0] : null;
  const eliminatedRole = eliminatedId ? roles[eliminatedId] : null;

  const scoreDeltas: Record<string, number> = {};
  const detailedReasons: Record<string, string> = {};
  players.forEach(p => {
    scoreDeltas[p.id] = 0;
    detailedReasons[p.id] = '0 pts';
  });

  const imposterIds = players.filter(p => roles[p.id] === 'imposter').map(p => p.id);
  const isAnyImposterEliminated = imposterIds.includes(eliminatedId || '');

  // 3. Jester Special Handling
  const jester = players.find(p => roles[p.id] === 'jester');
  if (jester) {
    if (eliminatedId === jester.id) {
      scoreDeltas[jester.id] += 2;
      detailedReasons[jester.id] = '+2 pts: Tricked everyone & got voted out! 🃏';
    } else {
      scoreDeltas[jester.id] -= 1;
      detailedReasons[jester.id] = '-1 pt: Failed to get voted out as Jester 🃏';
    }
  }

  // 4. Assistant Special Handling
  const assistant = players.find(p => roles[p.id] === 'assistant');
  if (assistant) {
    if (eliminatedId === assistant.id) {
      // If assistant voted out: assistant gets -1, nobody else gets points UNLESS they voted for real imposter (+1)
      scoreDeltas[assistant.id] = -1;
      detailedReasons[assistant.id] = '-1 pt: Assistant was caught and voted out! 🤝';

      players.forEach(voter => {
        if (voter.id !== assistant.id && roles[voter.id] !== 'jester') {
          const target = votes[voter.id];
          if (imposterIds.includes(target)) {
            scoreDeltas[voter.id] = 1;
            detailedReasons[voter.id] = '+1 pt: Voted for the real Imposter even though Assistant took the fall!';
          } else {
            scoreDeltas[voter.id] = 0;
            detailedReasons[voter.id] = '0 pts: Voted for wrong player / Assistant took the fall';
          }
        }
      });

      return {
        eliminatedId,
        eliminatedRole,
        isTie,
        voteCounts,
        scoreDeltas,
        detailedReasons,
      };
    } else if (!isAnyImposterEliminated) {
      // Imposter survived! Assistant helped successfully
      scoreDeltas[assistant.id] = 1;
      detailedReasons[assistant.id] = '+1 pt: Successfully protected the Imposter! 🤝';
    }
  }

  // 5. Standard Player Scoring
  players.forEach(voter => {
    if (roles[voter.id] === 'jester') return; // already handled
    if (roles[voter.id] === 'assistant' && eliminatedId !== assistant?.id) return; // handled above

    const target = votes[voter.id];
    const isVoterImposter = roles[voter.id] === 'imposter';

    if (isVoterImposter) {
      // Imposter logic
      if (!isAnyImposterEliminated) {
        scoreDeltas[voter.id] += 1;
        detailedReasons[voter.id] = '+1 pt: Survived without getting eliminated! 🤫';
      } else if (voter.id === eliminatedId) {
        scoreDeltas[voter.id] -= 1;
        detailedReasons[voter.id] = '-1 pt: Caught & voted out by majority! ❌';
      }
      return;
    }

    // Voter is an innocent
    if (imposterIds.includes(target)) {
      if (isAnyImposterEliminated && target === eliminatedId) {
        scoreDeltas[voter.id] += 2;
        detailedReasons[voter.id] = '+2 pts: Found & eliminated the Imposter! 🎯';
      } else {
        scoreDeltas[voter.id] += 1;
        detailedReasons[voter.id] = '+1 pt: Found the Imposter, but majority did not vote them out.';
      }
    } else {
      // Voted for wrong person
      if (target === eliminatedId && eliminatedId !== null) {
        scoreDeltas[voter.id] -= 1;
        detailedReasons[voter.id] = '-1 pt: Voted out an innocent player! ❌';
      } else {
        scoreDeltas[voter.id] = 0;
        detailedReasons[voter.id] = '0 pts: Voted for innocent, but they were not eliminated.';
      }
    }
  });

  // 6. Imposter Redemption Bonus
  if (isAnyImposterEliminated && imposterGuessedCorrectly) {
    imposterIds.forEach(impId => {
      scoreDeltas[impId] += 1;
      detailedReasons[impId] = '+1 pt: Redemption! Guessed the secret word correctly 🔮';
    });
  }

  return {
    eliminatedId,
    eliminatedRole,
    isTie,
    voteCounts,
    scoreDeltas,
    detailedReasons,
  };
}
