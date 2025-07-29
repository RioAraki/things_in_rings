// Dynamic image loading setup
const wordImages: Record<string, string> = {};

// Sound setup
let correctSound: HTMLAudioElement | null = null;
let wrongSound: HTMLAudioElement | null = null;

// Initialize sounds - this should be called when the component mounts
export const initializeSounds = () => {
  try {
    correctSound = new Audio(require('../resources/sound/correct.wav'));
    wrongSound = new Audio(require('../resources/sound/wrong.wav'));
  } catch (error) {
    console.warn('Failed to initialize sounds:', error);
  }
};

/**
 * This function will try to load an image for a given word
 * If it fails, it will return a placeholder image
 */
export const getWordImage = (word: string): string => {
  const formattedWord = word.toLowerCase();
  
  try {
    // Try to get the image from our cache
    if (!wordImages[formattedWord]) {
      // If not cached, try to dynamically require it
      wordImages[formattedWord] = require(`../resources/pictures/${formattedWord}.png`);
    }
    return wordImages[formattedWord];
  } catch (error) {
    // If the image doesn't exist, return a placeholder
    console.warn(`Image for "${word}" not found, using placeholder`);
    try {
      return require('../resources/pictures/placeholder.png');
    } catch {
      // If even the placeholder doesn't exist, return apple as fallback
      return require('../resources/pictures/apple.png');
    }
  }
};

/**
 * Play the correct sound effect
 */
export const playCorrectSound = () => {
  if (correctSound) {
    correctSound.currentTime = 0; // Reset sound to beginning
    correctSound.play().catch(err => console.log("Sound playback failed:", err));
  }
};

/**
 * Play the wrong sound effect
 */
export const playWrongSound = () => {
  if (wrongSound) {
    wrongSound.currentTime = 0; // Reset sound to beginning
    wrongSound.play().catch(err => console.log("Sound playback failed:", err));
  }
}; 