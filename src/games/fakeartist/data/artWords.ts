export interface ArtPromptCard {
  id: string;
  category: string;
  word: string;
}

export const ART_WORDS_BANK: ArtPromptCard[] = [
  // Kolkata Landmarks & Icons
  { id: 'kol_1', category: 'Kolkata Icon', word: 'Victoria' },
  { id: 'kol_2', category: 'Kolkata Icon', word: 'Howrah' },
  { id: 'kol_3', category: 'Kolkata Icon', word: 'Tram' },
  { id: 'kol_4', category: 'Kolkata Icon', word: 'Eden' },
  { id: 'kol_5', category: 'Kolkata Icon', word: 'Dakshineswar' },
  { id: 'kol_6', category: 'Kolkata Icon', word: 'Kalighat' },
  { id: 'kol_7', category: 'Kolkata Icon', word: 'Flurys' },
  { id: 'kol_8', category: 'Kolkata Icon', word: 'Rickshaw' },
  { id: 'kol_9', category: 'Kolkata Icon', word: 'Ghat' },
  { id: 'kol_10', category: 'Kolkata Icon', word: 'Maidan' },
  { id: 'kol_11', category: 'Kolkata Icon', word: 'Durgapuja' },
  { id: 'kol_12', category: 'Kolkata Icon', word: 'Dhaak' },
  { id: 'kol_13', category: 'Kolkata Icon', word: 'Vidyasagar' },
  { id: 'kol_14', category: 'Kolkata Icon', word: 'Alipore' },
  { id: 'kol_15', category: 'Kolkata Icon', word: 'Nicco' },

  // Street Food & Delicacies
  { id: 'food_1', category: 'Food & Drinks', word: 'Biryani' },
  { id: 'food_2', category: 'Food & Drinks', word: 'Rosogolla' },
  { id: 'food_3', category: 'Food & Drinks', word: 'Phuchka' },
  { id: 'food_4', category: 'Food & Drinks', word: 'Samosa' },
  { id: 'food_5', category: 'Food & Drinks', word: 'Jalebi' },
  { id: 'food_6', category: 'Food & Drinks', word: 'Chai' },
  { id: 'food_7', category: 'Food & Drinks', word: 'Momos' },
  { id: 'food_8', category: 'Food & Drinks', word: 'Sandesh' },
  { id: 'food_9', category: 'Food & Drinks', word: 'Mishtidoi' },
  { id: 'food_10', category: 'Food & Drinks', word: 'Pizza' },
  { id: 'food_11', category: 'Food & Drinks', word: 'Burger' },
  { id: 'food_12', category: 'Food & Drinks', word: 'Icecream' },
  { id: 'food_13', category: 'Food & Drinks', word: 'Lassi' },
  { id: 'food_14', category: 'Food & Drinks', word: 'Dosa' },
  { id: 'food_15', category: 'Food & Drinks', word: 'Kulfi' },

  // Animals & Nature
  { id: 'anim_1', category: 'Animals & Nature', word: 'Tiger' },
  { id: 'anim_2', category: 'Animals & Nature', word: 'Elephant' },
  { id: 'anim_3', category: 'Animals & Nature', word: 'Peacock' },
  { id: 'anim_4', category: 'Animals & Nature', word: 'Butterfly' },
  { id: 'anim_5', category: 'Animals & Nature', word: 'Dinosaur' },
  { id: 'anim_6', category: 'Animals & Nature', word: 'Octopus' },
  { id: 'anim_7', category: 'Animals & Nature', word: 'Penguin' },
  { id: 'anim_8', category: 'Animals & Nature', word: 'Monkey' },
  { id: 'anim_9', category: 'Animals & Nature', word: 'Giraffe' },
  { id: 'anim_10', category: 'Animals & Nature', word: 'Kangaroo' },
  { id: 'anim_11', category: 'Animals & Nature', word: 'Crocodile' },
  { id: 'anim_12', category: 'Animals & Nature', word: 'Spider' },
  { id: 'anim_13', category: 'Animals & Nature', word: 'Flamingo' },
  { id: 'anim_14', category: 'Animals & Nature', word: 'Volcano' },
  { id: 'anim_15', category: 'Animals & Nature', word: 'Cactus' },

  // Everyday Objects & Tools
  { id: 'obj_1', category: 'Objects & Tools', word: 'Guitar' },
  { id: 'obj_2', category: 'Objects & Tools', word: 'Umbrella' },
  { id: 'obj_3', category: 'Objects & Tools', word: 'Teapot' },
  { id: 'obj_4', category: 'Objects & Tools', word: 'Camera' },
  { id: 'obj_5', category: 'Objects & Tools', word: 'Clock' },
  { id: 'obj_6', category: 'Objects & Tools', word: 'Bicycle' },
  { id: 'obj_7', category: 'Objects & Tools', word: 'Backpack' },
  { id: 'obj_8', category: 'Objects & Tools', word: 'Lantern' },
  { id: 'obj_9', category: 'Objects & Tools', word: 'Scissors' },
  { id: 'obj_10', category: 'Objects & Tools', word: 'Telescope' },
  { id: 'obj_11', category: 'Objects & Tools', word: 'Headphones' },
  { id: 'obj_12', category: 'Objects & Tools', word: 'Flashlight' },
  { id: 'obj_13', category: 'Objects & Tools', word: 'Hourglass' },
  { id: 'obj_14', category: 'Objects & Tools', word: 'Microscope' },
  { id: 'obj_15', category: 'Objects & Tools', word: 'Compass' },

  // Vehicles & Tech
  { id: 'veh_1', category: 'Vehicles & Tech', word: 'Helicopter' },
  { id: 'veh_2', category: 'Vehicles & Tech', word: 'Rocket' },
  { id: 'veh_3', category: 'Vehicles & Tech', word: 'Submarine' },
  { id: 'veh_4', category: 'Vehicles & Tech', word: 'Train' },
  { id: 'veh_5', category: 'Vehicles & Tech', word: 'Scooter' },
  { id: 'veh_6', category: 'Vehicles & Tech', word: 'Tractor' },
  { id: 'veh_7', category: 'Vehicles & Tech', word: 'Skateboard' },
  { id: 'veh_8', category: 'Vehicles & Tech', word: 'Spaceship' },
  { id: 'veh_9', category: 'Vehicles & Tech', word: 'Yacht' },
  { id: 'veh_10', category: 'Vehicles & Tech', word: 'Drone' },

  // Pop Culture & Characters
  { id: 'pop_1', category: 'Characters', word: 'Batman' },
  { id: 'pop_2', category: 'Characters', word: 'Pikachu' },
  { id: 'pop_3', category: 'Characters', word: 'Spiderman' },
  { id: 'pop_4', category: 'Characters', word: 'Yoda' },
  { id: 'pop_5', category: 'Characters', word: 'Minion' },
  { id: 'pop_6', category: 'Characters', word: 'Joker' },
  { id: 'pop_7', category: 'Characters', word: 'Mario' },
  { id: 'pop_8', category: 'Characters', word: 'Sonic' },
  { id: 'pop_9', category: 'Characters', word: 'Shrek' },
  { id: 'pop_10', category: 'Characters', word: 'Ghost' },
];

import { getNonRepeatingItem } from '../../../services/sessionDeckManager';

export function getRandomArtCard(): ArtPromptCard {
  return ART_WORDS_BANK[Math.floor(Math.random() * ART_WORDS_BANK.length)];
}

export function getNonRepeatingArtCard(sessionId: string): ArtPromptCard {
  return getNonRepeatingItem(sessionId, 'fakeartist_cards', ART_WORDS_BANK, c => c.id);
}


// 10 distinct high-contrast vibrant colors for players drawing on the canvas
export const PLAYER_DRAWING_COLORS = [
  '#2563EB', // Electric Royal Blue
  '#DC2626', // Bright Crimson Red
  '#16A34A', // Vibrant Emerald Green
  '#9333EA', // Deep Neon Purple
  '#EA580C', // Bright Tangerine Orange
  '#0D9488', // Deep Cyan Teal
  '#DB2777', // Vivid Hot Pink
  '#CA8A04', // Rich Golden Honey
  '#4338CA', // Indigo
  '#475569', // Slate Charcoal
];
