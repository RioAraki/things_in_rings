import { type BaseArea } from '../types/area';

// Define the base areas that don't change with language
export const BASE_AREAS: BaseArea[] = [
  "Context", 
  "Property", 
  "Wording", 
  "Context+Property", 
  "Context+Wording", 
  "Property+Wording", 
  "All", 
  "None"
];

// Game configuration constants
export const MAX_VISIBLE_WORDS = 5;
export const TARGET_CORRECT_WORDS = 5;

// Animation timing constants
export const ANIMATION_DELAYS = {
  WRONG_PLACEMENT_FADE_START: 600,
  WRONG_PLACEMENT_MOVE: 800,
  CORRECT_PLACEMENT_FADE_IN: 100,
  FINAL_STYLE_UPDATE: 500
} as const; 