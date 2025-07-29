import { useState, useEffect } from 'react';
import { type Word } from '../types/word';
import { type Area } from '../types/area';
import { getWords } from '../utils/words';
import { checkRule, findCorrectArea, resetRules } from '../utils/rules';
import { BASE_AREAS, MAX_VISIBLE_WORDS, TARGET_CORRECT_WORDS } from '../constants/gameConstants';

interface GameState {
  allWords: Word[];
  visibleWords: Word[];
  usedWordIds: Record<string, boolean>;
  areaWords: Record<Area, Word[]>;
  selectedWord: Word | null;
  attempts: number;
  isGameComplete: boolean;
  isGameOver: boolean;
  correctWordCount: number;
}

interface UseGameStateProps {
  onGameComplete?: () => void;
  onGameOver?: () => void;
}

/**
 * Initialize area words with Chinese area names (but keeping English for rule validation)
 */
function initializeAreaWords(): Record<Area, Word[]> {
  const initialAreas: Record<Area, Word[]> = {};
  
  // Add Chinese area names (these will be displayed in UI)
  initialAreas['使用场景'] = [];
  initialAreas['特性'] = [];
  initialAreas['拼写'] = [];
  initialAreas['使用场景+特性'] = [];
  initialAreas['使用场景+拼写'] = [];
  initialAreas['特性+拼写'] = [];
  initialAreas['全部满足'] = [];
  initialAreas['全不满足'] = [];
  
  return initialAreas;
}

/**
 * Custom hook to manage the game state
 * 
 * This hook handles:
 * - Word management (all words, visible words, used words)
 * - Area management (words in each area)
 * - Game progress tracking
 * - Word selection
 * 
 * @param props - Configuration options for the game state
 * @returns Game state and management functions
 */
export function useGameState({ onGameComplete, onGameOver }: UseGameStateProps) {
  // Initialize game state
  const [gameState, setGameState] = useState<GameState>(() => ({
    allWords: getWords(),
    visibleWords: [],
    usedWordIds: {},
    areaWords: initializeAreaWords(),
    selectedWord: null,
    attempts: 0,
    isGameComplete: false,
    isGameOver: false,
    correctWordCount: 0
  }));

  // Initialize visible words when component mounts
  useEffect(() => {
    if (gameState.visibleWords.length === 0) {
      const initialWords = gameState.allWords.slice(0, MAX_VISIBLE_WORDS);
      setGameState(prev => ({
        ...prev,
        visibleWords: initialWords,
        allWords: prev.allWords.slice(MAX_VISIBLE_WORDS),
        usedWordIds: initialWords.reduce((acc, word) => ({
          ...acc,
          [word.id]: true
        }), {})
      }));
    }
  }, []);

  // Check for game completion whenever areaWords changes
  useEffect(() => {
    const userCorrectWords = Object.values(gameState.areaWords).reduce((count, words) => {
      const areaCorrectCount = words.filter(word => 
        word.isChecked && 
        word.isCorrect && 
        !word.wasAutoMoved // Only count words correctly placed by the user
      ).length;
      return count + areaCorrectCount;
    }, 0);
    
    setGameState(prev => ({ ...prev, correctWordCount: userCorrectWords }));

    if (userCorrectWords === TARGET_CORRECT_WORDS && !gameState.isGameComplete) {
      setGameState(prev => ({ ...prev, isGameComplete: true }));
      onGameComplete?.();
    }
  }, [gameState.areaWords, gameState.isGameComplete, onGameComplete]);

  /**
   * Add a new word to the visible words list
   * @returns boolean indicating if a new word was added
   */
  const addNewWordToVisible = () => {
    if (gameState.allWords.length > 0) {
      const nextWord = gameState.allWords[0];
      if (!gameState.usedWordIds[nextWord.id]) {
        setGameState(prev => ({
          ...prev,
          visibleWords: [...prev.visibleWords, nextWord],
          allWords: prev.allWords.slice(1),
          usedWordIds: { ...prev.usedWordIds, [nextWord.id]: true }
        }));
        return true;
      }
    }
    
    if (gameState.visibleWords.length === 0) {
      setGameState(prev => ({ ...prev, isGameOver: true }));
      onGameOver?.();
    }
    
    return false;
  };

  /**
   * Remove a word from visible words (when dragged to an area)
   */
  const removeWordFromVisible = (wordId: string) => {
    setGameState(prev => ({
      ...prev,
      visibleWords: prev.visibleWords.filter(w => w.id !== wordId)
    }));
  };

  /**
   * Add a word back to visible words (when dragged back from an area)
   */
  const addWordBackToVisible = (word: Word) => {
    if (gameState.visibleWords.length < MAX_VISIBLE_WORDS) {
      setGameState(prev => ({
        ...prev,
        visibleWords: [...prev.visibleWords, word]
      }));
    } else {
      // If we already have max visible words, add it back to allWords
      setGameState(prev => ({
        ...prev,
        allWords: [...prev.allWords, word]
      }));
    }
  };

  /**
   * Update area words state
   */
  const updateAreaWords = (updater: (prev: Record<Area, Word[]>) => Record<Area, Word[]>) => {
    setGameState(prev => ({
      ...prev,
      areaWords: updater(prev.areaWords)
    }));
  };

  /**
   * Handle word placement in an area
   * @param word - The word being placed
   * @param destArea - The destination area
   */
  const handleWordPlacement = (word: Word, destArea: Area) => {
    const isCorrect = checkRule(word.id, destArea);
    const correctArea = findCorrectArea(word.id);
    
    setGameState(prev => ({
      ...prev,
      visibleWords: prev.visibleWords.filter(w => w.id !== word.id),
      areaWords: {
        ...prev.areaWords,
        [destArea]: [
          ...(prev.areaWords[destArea] || []),
          {
            ...word,
            isChecked: true,
            isCorrect,
            isAutoMoved: false,
            wasAutoMoved: false
          }
        ]
      },
      attempts: prev.attempts + 1
    }));

    if (!isCorrect) {
      addNewWordToVisible();
    }
  };

  /**
   * Reset the game state
   */
  const resetGame = () => {
    // Reset rules first
    resetRules();
    
    // Get new shuffled words
    const newWords = getWords();
    
    setGameState({
      allWords: newWords.slice(MAX_VISIBLE_WORDS),
      visibleWords: newWords.slice(0, MAX_VISIBLE_WORDS),
      usedWordIds: newWords.slice(0, MAX_VISIBLE_WORDS).reduce((acc, word) => ({
        ...acc,
        [word.id]: true
      }), {}),
      areaWords: initializeAreaWords(),
      selectedWord: null,
      attempts: 0,
      isGameComplete: false,
      isGameOver: false,
      correctWordCount: 0
    });
  };

  /**
   * Set the selected word
   */
  const setSelectedWord = (word: Word | null) => {
    setGameState(prev => ({ ...prev, selectedWord: word }));
  };

  /**
   * Increment attempts counter
   */
  const incrementAttempts = () => {
    setGameState(prev => ({ ...prev, attempts: prev.attempts + 1 }));
  };

  return {
    // State
    ...gameState,
    
    // Word management
    addNewWordToVisible,
    removeWordFromVisible,
    addWordBackToVisible,
    
    // Area management
    updateAreaWords,
    
    // Game management
    handleWordPlacement,
    resetGame,
    setSelectedWord,
    incrementAttempts
  };
} 