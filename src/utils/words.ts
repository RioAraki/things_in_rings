import { type Word } from '../types/word'
import wordsData from '../resources/data/words.json'

// Fisher-Yates shuffle algorithm
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Keep a cache of the original unshuffled words
const originalWords = (wordsData.words || []).map(word => ({
  ...word,
  isPlaced: false
}));

export function getWords(): Word[] {
  // Get all words and shuffle them
  return shuffleArray([...originalWords]);
}

export function getWordById(id: string): Word | undefined {
  // Use the original unshuffled array to find words by ID
  return originalWords.find(word => word.id === id);
}

export function getWordAnswerForRule(word: Word, ruleId: number): boolean | undefined {
  const question = word.questions.find(q => q.ruleId === ruleId)
  return question?.result
} 