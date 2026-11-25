// Resistance Game Data & Rules Matrix
// Standard 5-10 player official Resistance rules

export interface MissionConfig {
  playersRequired: number;
  failsRequired: number; // usually 1, but mission 4 in 7+ players requires 2 fails
}

export interface ResistancePlayerMatrix {
  totalPlayers: number;
  resistanceCount: number;
  spyCount: number;
  missions: MissionConfig[]; // 5 missions
}

export const RESISTANCE_MATRIX: Record<number, ResistancePlayerMatrix> = {
  5: {
    totalPlayers: 5,
    resistanceCount: 3,
    spyCount: 2,
    missions: [
      { playersRequired: 2, failsRequired: 1 },
      { playersRequired: 3, failsRequired: 1 },
      { playersRequired: 2, failsRequired: 1 },
      { playersRequired: 3, failsRequired: 1 },
      { playersRequired: 3, failsRequired: 1 },
    ],
  },
  6: {
    totalPlayers: 6,
    resistanceCount: 4,
    spyCount: 2,
    missions: [
      { playersRequired: 2, failsRequired: 1 },
      { playersRequired: 3, failsRequired: 1 },
      { playersRequired: 4, failsRequired: 1 },
      { playersRequired: 3, failsRequired: 1 },
      { playersRequired: 4, failsRequired: 1 },
    ],
  },
  7: {
    totalPlayers: 7,
    resistanceCount: 4,
    spyCount: 3,
    missions: [
      { playersRequired: 2, failsRequired: 1 },
      { playersRequired: 3, failsRequired: 1 },
      { playersRequired: 3, failsRequired: 1 },
      { playersRequired: 4, failsRequired: 2 }, // 2 fails required for 7+ players on M4
      { playersRequired: 4, failsRequired: 1 },
    ],
  },
  8: {
    totalPlayers: 8,
    resistanceCount: 5,
    spyCount: 3,
    missions: [
      { playersRequired: 3, failsRequired: 1 },
      { playersRequired: 4, failsRequired: 1 },
      { playersRequired: 4, failsRequired: 1 },
      { playersRequired: 5, failsRequired: 2 },
      { playersRequired: 5, failsRequired: 1 },
    ],
  },
  9: {
    totalPlayers: 9,
    resistanceCount: 6,
    spyCount: 3,
    missions: [
      { playersRequired: 3, failsRequired: 1 },
      { playersRequired: 4, failsRequired: 1 },
      { playersRequired: 4, failsRequired: 1 },
      { playersRequired: 5, failsRequired: 2 },
      { playersRequired: 5, failsRequired: 1 },
    ],
  },
  10: {
    totalPlayers: 10,
    resistanceCount: 6,
    spyCount: 4,
    missions: [
      { playersRequired: 3, failsRequired: 1 },
      { playersRequired: 4, failsRequired: 1 },
      { playersRequired: 4, failsRequired: 1 },
      { playersRequired: 5, failsRequired: 2 },
      { playersRequired: 5, failsRequired: 1 },
    ],
  },
};

export type ResistanceRole = 'resistance' | 'spy' | 'commander' | 'assassin';

export interface ResistanceConfig {
  commanderMode: boolean; // Merlin / Commander & Assassin
}
