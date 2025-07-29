import { type Word } from '../types/word'
import { LANGUAGE_CONFIG } from '../config/app-config'


// Dynamically import all word files from the words directory
const wordModules = (() => {
  // This is a webpack feature that allows us to require all files matching a pattern
  // @ts-ignore - require.context is a webpack feature not recognized by TypeScript
  const context = require.context('../resources/data/words_zh', false, /\.json$/);
  
  // Get all file paths
  const filePaths = context.keys();
  
  // Import each file and return the array of modules
  return filePaths.map((path: string) => context(path));
})();

// Dynamically import all Chinese word files
const wordModulesZh = (() => {
  // @ts-ignore - require.context is a webpack feature not recognized by TypeScript
  const context = require.context('../resources/data/words_zh', false, /\.json$/);
  
  // Get all file paths
  const filePaths = context.keys();
  
  // Import each file and return the array of modules
  return filePaths.map((path: string) => context(path));
})();

// Fisher-Yates shuffle algorithm
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Helper function to normalize word data
function normalizeWordData(data: any): Word {
  return {
    id: data.id,
    word: data.word,
    questions: data.questions.map((q: any) => ({
      ruleId: q.ruleId,
      result: typeof q.result === 'string' ? q.result.toLowerCase() === 'true' : q.result,
      reason: q.reason
    }))
  };
}

// Load all words from the imported modules
const originalWords = wordModules.map((module: any) => normalizeWordData(module));
const originalWordsZh = wordModulesZh.map((module: any) => normalizeWordData(module));

export function getWords(): Word[] {
  // Always use English data
  const isChinese = false;
  
  // Get all words and shuffle them based on language
  const words = isChinese ? originalWordsZh : originalWords;
  return shuffleArray([...words]);
}

export function getWordById(id: string): Word | undefined {
  // Always use English data
  const isChinese = false;
  
  // Find word in the loaded words based on language
  const words = isChinese ? originalWordsZh : originalWords;
  return words.find((word: Word) => word.id === id);
}

export function getWordAnswerForRule(word: Word, ruleId: number): boolean | undefined {
  const question = word.questions.find(q => q.ruleId === ruleId)
  return question?.result
} 