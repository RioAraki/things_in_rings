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

// Fix malformed data where questions might have duplicate 'result' properties
function normalizeWordData(wordData: any): Word {
  const normalizedQuestions = wordData.questions.map((q: any) => {
    // If there are two 'result' properties, one might be accidentally named 'result' instead of 'reason'
    if (typeof q.result === 'string') {
      return {
        ruleId: q.ruleId,
        result: true, // Default to true if the result is a string (which is likely meant to be a reason)
        reason: q.result // Move the string value to the reason field
      };
    }
    
    // Keep proper format
    return {
      ruleId: q.ruleId,
      result: typeof q.result === 'boolean' ? q.result : Boolean(q.result),
      reason: q.reason
    };
  });

  return {
    ...wordData,
    questions: normalizedQuestions,
    isPlaced: false
  };
}

// Keep a cache of the original unshuffled words
const originalWords = (wordsData.words || []).map(word => normalizeWordData(word));

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