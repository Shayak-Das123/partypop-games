import { Player } from '../../../services/db';

export type MafiaRoleType = 'mafia' | 'detective' | 'doctor' | 'villager' | 'jester';

export interface MafiaRoleDefinition {
  type: MafiaRoleType;
  name: string;
  emoji: string;
  team: 'mafia' | 'town' | 'neutral';
  color: string;
  description: string;
}

export const ROLE_DEFINITIONS: Record<MafiaRoleType, MafiaRoleDefinition> = {
  mafia: {
    type: 'mafia',
    name: 'Mafia',
    emoji: '🐺',
    team: 'mafia',
    color: '#FECDD3',
    description: 'Eliminate all townspeople. Choose 1 victim to strike each night without getting caught!',
  },
  detective: {
    type: 'detective',
    name: 'Detective',
    emoji: '🕵️',
    team: 'town',
    color: '#BAE6FD',
    description: 'Investigate 1 suspect each night. The phone will secretly reveal if they are Guilty or Innocent!',
  },
  doctor: {
    type: 'doctor',
    name: 'Doctor',
    emoji: '💉',
    team: 'town',
    color: '#A7F3D0',
    description: 'Protect 1 player each night. If the Mafia attacks your patient, they will survive!',
  },
  villager: {
    type: 'villager',
    name: 'Villager',
    emoji: '🧑‍🌾',
    team: 'town',
    color: '#FEF08A',
    description: 'Find the Mafia during daytime discussions and vote them out before it is too late!',
  },
  jester: {
    type: 'jester',
    name: 'Jester',
    emoji: '🃏',
    team: 'neutral',
    color: '#DDD6FE',
    description: 'Act suspiciously and deceive everyone. You win solo if the town votes you out during daytime trial!',
  },
};

export interface PlayerRoleAssignment {
  playerId: string;
  role: MafiaRoleDefinition;
  isAlive: boolean;
}

export function assignMafiaRoles(
  players: Player[],
  includeJester: boolean = false
): Record<string, PlayerRoleAssignment> {
  const n = players.length;
  const rolesPool: MafiaRoleType[] = [];

  // Determine Mafia count
  const mafiaCount = n >= 7 ? 2 : 1;
  for (let i = 0; i < mafiaCount; i++) rolesPool.push('mafia');

  // Detective (Cop)
  rolesPool.push('detective');

  // Doctor (Medic)
  if (n >= 4) {
    rolesPool.push('doctor');
  }

  // Optional Jester
  if (includeJester && n >= 5) {
    rolesPool.push('jester');
  }

  // Fill remainder with Villagers
  while (rolesPool.length < n) {
    rolesPool.push('villager');
  }

  // Shuffle roles pool
  for (let i = rolesPool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [rolesPool[i], rolesPool[j]] = [rolesPool[j], rolesPool[i]];
  }

  // Assign to players
  const assignments: Record<string, PlayerRoleAssignment> = {};
  players.forEach((p, idx) => {
    const roleType = rolesPool[idx];
    assignments[p.id] = {
      playerId: p.id,
      role: ROLE_DEFINITIONS[roleType],
      isAlive: true,
    };
  });

  return assignments;
}
