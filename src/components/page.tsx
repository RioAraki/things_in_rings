"use client"

import { useState, useEffect } from "react"
import { DragDropContext, type DropResult } from "@hello-pangea/dnd"
import { useTranslation } from 'react-i18next'
import WordList from "./word-list"
import SetDiagram from "./set-diagram"
import { type Word } from "../types/word"
import { type Area, type BaseArea } from "../types/area"
import { getWords } from '../utils/words'
import { checkRule, findCorrectArea, getRules, resetRules } from '../utils/rules'
import { type Rule } from '../types/rule'
import GameCompleteModal from './game-complete-modal'
import GameOverModal from './game-over-modal'

// Dynamic image loading setup
const wordImages: Record<string, string> = {};

// Sound setup
const correctSound = new Audio(require('../resources/sound/correct.wav'));
const wrongSound = new Audio(require('../resources/sound/wrong.wav'));

// This function will try to load an image for a given word
// If it fails, it will return a placeholder image
const getWordImage = (word: string): string => {
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

// Add this function near the top of the file, after the imports
function getEnglishAreaName(translatedArea: string): string {
  // Handle basic areas
  if (translatedArea === '使用场景') return 'Context';
  if (translatedArea === '特性') return 'Property';
  if (translatedArea === '拼写') return 'Wording';
  if (translatedArea === '全部满足') return 'All';
  if (translatedArea === '全不满足') return 'None';

  // Handle combination areas
  if (translatedArea.startsWith('使用场景+')) {
    return 'Context' + translatedArea.substring('使用场景'.length);
  }
  if (translatedArea.includes('+拼写')) {
    return translatedArea.replace('拼写', 'Wording');
  }
  if (translatedArea.includes('特性')) {
    return translatedArea.replace('特性', 'Property');
  }

  // Default case: return as is
  return translatedArea;
}

export default function SetDiagramPage() {
  const { t } = useTranslation();
  
  // Store all available words that haven't been shown yet
  const [allWords, setAllWords] = useState<Word[]>(getWords())
  
  // Store only the currently visible words in the word list (maximum 5)
  const [visibleWords, setVisibleWords] = useState<Word[]>([])
  
  // Keep track of used word IDs to prevent duplicates
  const [usedWordIds, setUsedWordIds] = useState<Record<string, boolean>>({})
  
  // Initialize the visible words when the component mounts
  useEffect(() => {
    // Only initialize once when the component mounts
    if (visibleWords.length === 0) {
      // Take the first 5 words from allWords and make them visible
      const initialWords = allWords.slice(0, 5);
      setVisibleWords(initialWords);
      // Remove those words from allWords and mark them as used
      setAllWords(prev => prev.slice(5));
      const initialUsedIds = initialWords.reduce((acc, word) => ({
        ...acc,
        [word.id]: true
      }), {});
      setUsedWordIds(initialUsedIds);
    }
  }, []); // Empty dependency array - run only on mount

  // Function to add a new word to visible words if available
  const addNewWordToVisible = () => {
    if (allWords.length > 0) {
      // Find the first unused word
      const nextWord = allWords[0];
      if (!usedWordIds[nextWord.id]) {
        setVisibleWords(prev => [...prev, nextWord]);
        setAllWords(prev => prev.slice(1));
        setUsedWordIds(prev => ({ ...prev, [nextWord.id]: true }));
        return true;
      }
    }
    
    // If we couldn't add a new word, check if we're out of words
    if (visibleWords.length === 0) {
      setIsGameOver(true);
    }
    
    return false;
  };

  // Define the base areas that don't change with language
  const baseAreas: BaseArea[] = ["Context", "Property", "Wording", "Context+Property", "Context+Wording", "Property+Wording", "All", "None"];
  
  // Create the area words state with both translated and base areas
  const [areaWords, setAreaWords] = useState<Record<Area, Word[]>>(() => {
    const initialAreas: Record<Area, Word[]> = {};
    
    // Add all areas with their English names first
    baseAreas.forEach(area => {
      initialAreas[area] = [];
    });
    
    // Add translated areas
    initialAreas[(t as any)('ui.context')] = [];
    initialAreas[`${(t as any)('ui.context')}+${(t as any)('ui.property')}`] = [];
    initialAreas[`${(t as any)('ui.context')}+${(t as any)('ui.wording')}`] = [];
    initialAreas[`${(t as any)('ui.property')}+${(t as any)('ui.wording')}`] = [];
    initialAreas[(t as any)('ui.all')] = [];
    initialAreas[(t as any)('ui.none')] = [];
    
    return initialAreas;
  });

  // Add a state to track the currently selected/moved word
  const [selectedWord, setSelectedWord] = useState<Word | null>(null);

  // Add debug state
  const [showDebug, setShowDebug] = useState(false)

  // Add attempts state
  const [attempts, setAttempts] = useState<number>(0);
  const [isGameComplete, setIsGameComplete] = useState<boolean>(false);
  const [showRuleDescriptions, setShowRuleDescriptions] = useState<boolean>(false);

  // Add state to track user-correct word count
  const [correctWordCount, setCorrectWordCount] = useState<number>(0);

  // Add state for game over modal
  const [isGameOver, setIsGameOver] = useState<boolean>(false);

  // Get rules for display
  const rules = getRules();
  const contextRule = rules.find(r => r.type === 'context' as const);
  const propertyRule = rules.find(r => r.type === 'property' as const);
  const wordingRule = rules.find(r => r.type === 'wording' as const);

  // Add keyboard shortcut to toggle debug (Ctrl + D)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'd') {
        e.preventDefault()
        setShowDebug(prev => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Check for game completion whenever areaWords changes
  useEffect(() => {
    const userCorrectWords = Object.values(areaWords).reduce((count, words) => {
      const areaCorrectCount = words.filter(word => 
        word.isChecked && 
        word.isCorrect && 
        !word.wasAutoMoved // Only count words correctly placed by the user
      ).length;
      console.log('Area words:', words.map(w => ({ word: w.word, isChecked: w.isChecked, isCorrect: w.isCorrect, wasAutoMoved: w.wasAutoMoved })));
      console.log('Area correct count:', areaCorrectCount);
      return count + areaCorrectCount;
    }, 0);
    
    console.log('Total correct words:', userCorrectWords);
    setCorrectWordCount(userCorrectWords);

    if (userCorrectWords === 5 && !isGameComplete) {
      setIsGameComplete(true);
    }
  }, [areaWords]);

  // Handle checking the board
  const handleCheckBoard = () => {
    setShowRuleDescriptions(true);
    setIsGameComplete(false);
  };

  const onDragEnd = (result: DropResult) => {
    const { source, destination } = result
    
    if (!destination) return

    // Same position - no change needed
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return
    }

    // Safety check: ensure source and destination are valid
    if (!source || !destination) return

    // Case 1: From wordList to an area
    if (source.droppableId === 'wordList' && destination.droppableId !== 'wordList') {
      // Safety check: ensure the word exists
      if (!visibleWords || source.index >= visibleWords.length) return
      
      const word = visibleWords[source.index]
      const destArea = destination.droppableId as Area
      
      // Check if the word matches the rule for this area
      const isCorrect = checkRule(word.id, getEnglishAreaName(destArea))
      const correctArea = findCorrectArea(word.id)
      
      // Update the selected word when dragged
      setSelectedWord(word);
      
      // Safety check: ensure the destination area exists
      if (!areaWords[destArea]) {
        console.error(`Area ${destArea} not found in areaWords`);
        return;
      }
      
      // Remove from visible words list
      setVisibleWords(prev => {
        const newVisibleWords = [...prev];
        newVisibleWords.splice(source.index, 1);
        return newVisibleWords;
      });
      
      // Only refill a new word if the placement was incorrect
      if (!isCorrect) {
        addNewWordToVisible();
      }

      // If incorrect, animate the movement to correct area
      if (!isCorrect && correctArea) {
        // Play wrong sound when word is placed incorrectly
        wrongSound.currentTime = 0; // Reset sound to beginning
        wrongSound.play().catch(err => console.log("Sound playback failed:", err));
        
        // First, add to the wrong area without isAutoMoved flag
        setAreaWords(prev => ({
          ...prev,
          [destArea]: [
            ...(prev[destArea] || []),
            {
              ...word,
              isChecked: true,
              isCorrect: false,
              isAutoMoved: false  // Initially false when placed in wrong area
            }
          ]
        }));

        // Start fade out animation after a short delay
        setTimeout(() => {
          setAreaWords(prev => ({
            ...prev,
            [destArea]: prev[destArea].map(w => 
              w.id === word.id ? { ...w, isAutoMoved: true } : w  // Set to true to trigger fade out
            )
          }));
        }, 600); // Increased from 300ms to 600ms for smoother fade-out

        // After fade out, move to correct area
        setTimeout(() => {
          setAreaWords(prev => {
            const newAreaWords = { ...prev };
            // Remove from wrong area
            newAreaWords[destArea] = prev[destArea].filter(w => w.id !== word.id);
            // Add to correct area with isAutoMoved true initially
            newAreaWords[correctArea as Area] = [
              ...(prev[correctArea as Area] || []),
              {
                ...word,
                isChecked: true,
                isCorrect: true,  // Changed to true since it's now in the correct area
                isAutoMoved: true,
                wasAutoMoved: true  // Mark it as auto-moved immediately
              }
            ];
            return newAreaWords;
          });

          // Fade in at new location
          setTimeout(() => {
            setAreaWords(prev => ({
              ...prev,
              [correctArea as Area]: prev[correctArea as Area].map(w =>
                w.id === word.id ? { 
                  ...w, 
                  isAutoMoved: false  // Only change the animation flag
                } : w
              )
            }));
          }, 50);
        }, 800); // Increased from 400ms to 800ms to allow for fade-out
      } else {
        // If correct, just add to the area (not auto-moved)
        setAreaWords(prev => ({
          ...prev,
          [destArea]: [
            ...(prev[destArea] || []),
            {
              ...word,
              isChecked: true,
              isCorrect: true,
              isAutoMoved: false,
              wasAutoMoved: false
            }
          ]
        }));
        
        // Play correct sound when word is placed correctly
        correctSound.currentTime = 0; // Reset sound to beginning
        correctSound.play().catch(err => console.log("Sound playback failed:", err));
      }
      setAttempts(prev => prev + 1);
      return
    }

    // Case 2: From an area back to wordList
    if (source.droppableId !== 'wordList' && destination.droppableId === 'wordList') {
      // Safety check: ensure the source area exists
      if (!areaWords[source.droppableId as Area]) {
        console.error(`Area ${source.droppableId} not found in areaWords`);
        return;
      }
      
      // Safety check: ensure the word exists
      const sourceArea = areaWords[source.droppableId as Area];
      if (!sourceArea || source.index >= sourceArea.length) return;
      
      const word = sourceArea[source.index]
      
      // Update the selected word when dragged
      setSelectedWord(word);
      
      // Add to visible words list (but only if there's room)
      if (visibleWords.length < 5) {
        setVisibleWords(prev => [...prev, word]);
      } else {
        // If we already have 5 visible words, add it back to allWords
        setAllWords(prev => [...prev, word]);
      }
      
      // Remove from source area
      setAreaWords(prev => {
        const sourceWords = Array.from(prev[source.droppableId as Area] || [])
        sourceWords.splice(source.index, 1)
        
        return {
          ...prev,
          [source.droppableId]: sourceWords
        }
      })
      return
    }

    // Case 3: Within the same area - reordering
    if (source.droppableId === destination.droppableId) {
      // Safety check: ensure the area exists
      if (!areaWords[source.droppableId as Area]) {
        console.error(`Area ${source.droppableId} not found in areaWords`);
        return;
      }
      
      setAreaWords(prev => {
        const areaId = source.droppableId as Area
        const areaItems = Array.from(prev[areaId] || [])
        
        // Safety check: ensure the index is valid
        if (source.index >= areaItems.length) return prev;
        
        const [movedItem] = areaItems.splice(source.index, 1)
        
        // Update the selected word when reordered
        setSelectedWord(movedItem);
        
        areaItems.splice(destination.index, 0, movedItem)
        
        return {
          ...prev,
          [areaId]: areaItems
        }
      })
      return
    }

    // Case 4: Between different areas
    setAreaWords(prev => {
      // Safety checks for both areas
      if (!prev[source.droppableId as Area] || !prev[destination.droppableId as Area]) {
        console.error("Source or destination area not found");
        return prev;
      }
      
      const sourceWords = Array.from(prev[source.droppableId as Area] || [])
      const destWords = Array.from(prev[destination.droppableId as Area] || [])
      
      // Safety check: ensure the index is valid
      if (source.index >= sourceWords.length) return prev;
      
      const [removed] = sourceWords.splice(source.index, 1)
      
      // Update the selected word when moved between areas
      setSelectedWord(removed);
      
      destWords.splice(destination.index, 0, removed)

      return {
        ...prev,
        [source.droppableId]: sourceWords,
        [destination.droppableId]: destWords,
      }
    })
  }

  const onDragStart = (start: any) => {
    // Find the word being dragged
    let draggedWord: Word | undefined;
    
    if (start.source.droppableId === 'wordList') {
      draggedWord = visibleWords[start.source.index];
    } else {
      draggedWord = areaWords[start.source.droppableId as Area]?.[start.source.index];
    }
    
    if (draggedWord) {
      setSelectedWord(draggedWord);
    }
  };

  // Handle selection of a word from the word list
  const handleSelectWord = (word: Word) => {
    setSelectedWord(word);
  };

  // Add reset game function
  const handlePlayAgain = () => {
    // Reset rules first
    resetRules();
    
    // Get new shuffled words
    const newWords = getWords();
    
    // Reset all state
    const resetAreas: Record<Area, Word[]> = {};
    
    // Add all areas with their English names first
    baseAreas.forEach(area => {
      resetAreas[area] = [];
    });
    
    // Add translated areas
    resetAreas[(t as any)('ui.context')] = [];
    resetAreas[`${(t as any)('ui.context')}+${(t as any)('ui.property')}`] = [];
    resetAreas[`${(t as any)('ui.context')}+${(t as any)('ui.wording')}`] = [];
    resetAreas[`${(t as any)('ui.property')}+${(t as any)('ui.wording')}`] = [];
    resetAreas[(t as any)('ui.all')] = [];
    resetAreas[(t as any)('ui.none')] = [];
    
    setAreaWords(resetAreas);
    
    // Take first 5 words for visible list
    const initialWords = newWords.slice(0, 5);
    setVisibleWords(initialWords);
    
    // Store remaining words
    setAllWords(newWords.slice(5));
    
    // Mark initial words as used
    const initialUsedIds = initialWords.reduce((acc, word) => ({
      ...acc,
      [word.id]: true
    }), {});
    setUsedWordIds(initialUsedIds);
    
    // Reset other state
    setSelectedWord(null);
    setAttempts(0);
    setIsGameComplete(false);
    setShowRuleDescriptions(false);
    setCorrectWordCount(0);
    setIsGameOver(false); // Reset game over state
  };

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-[90%] mx-auto px-4">
        <DragDropContext onDragEnd={onDragEnd} onDragStart={onDragStart}>
          <div className="flex flex-col md:flex-row overflow-hidden">
            {/* SetDiagram on the left half */}
            <div className="w-full md:w-1/2 p-4 overflow-y-auto">
              <SetDiagram 
                areaWords={areaWords}
                setAreaWords={setAreaWords}
                showRuleDescriptions={showRuleDescriptions}
                rules={{
                  context: contextRule?.description,
                  property: propertyRule?.description,
                  wording: wordingRule?.description
                }}
                onSelectWord={handleSelectWord}
              />
            </div>
            
            {/* Word list, picture, and log on the right half */}
            <div className="w-full md:w-1/2 p-4 overflow-y-auto flex flex-col gap-4">
              {/* Word list */}
              <div className="h-[calc(50vh-4rem)]">
                <div className="h-[calc(100%-0.5rem)] overflow-y-auto">
                  <WordList 
                    words={visibleWords} 
                    onSelectWord={handleSelectWord}
                    correctWordCount={correctWordCount}
                  />
                </div>
              </div>
              
              {/* Picture section */}
              <div className="h-[calc(50vh-4rem)]">
                <div className="h-full bg-gray-100 p-4 rounded-lg">
                  <h2 className="text-xl font-bold mb-2">{(t as any)('ui.picture')}</h2>
                  <div className="h-[calc(100%-2.5rem)] flex items-center justify-center">
                    {selectedWord ? (
                      <img 
                        src={getWordImage(selectedWord.word)} 
                        alt={selectedWord.word} 
                        className="rounded-lg max-h-full object-contain"
                        style={{ maxWidth: '100%' }}
                      />
                    ) : (
                      <div className="text-gray-400 text-center">
                        {(t as any)('ui.selectWordForPicture')}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DragDropContext>

        {/* Add debug panel - press Ctrl+D to toggle */}
        {showDebug && (
          <div className="fixed top-0 right-0 bg-black/80 text-white p-4 rounded-bl-lg text-sm font-mono z-50 max-w-md">
            <h3 className="font-bold mb-2">Active Rules:</h3>
            <div className="space-y-2">
              <div className="border-b border-gray-600 pb-2">
                <div className="text-blue-300">{(t as any)('ui.context')} Rule (1):</div>
                <div className="pl-2 text-xs">{contextRule?.description || 'Not found'}</div>
              </div>
              <div className="border-b border-gray-600 pb-2">
                <div className="text-green-300">{(t as any)('ui.property')} Rule (2):</div>
                <div className="pl-2 text-xs">{propertyRule?.description || 'Not found'}</div>
              </div>
              <div className="border-b border-gray-600 pb-2">
                <div className="text-yellow-300">{(t as any)('ui.wording')} Rule (3):</div>
                <div className="pl-2 text-xs">{wordingRule?.description || 'Not found'}</div>
              </div>
            </div>
            {selectedWord && (
              <div className="mt-3 pt-2 border-t border-gray-600">
                <div className="text-purple-300">Selected Word: {selectedWord.word}</div>
                <div className="pl-2 text-xs">
                  {(t as any)('ui.context')}: {checkRule(selectedWord.id, 'Context') ? '✓' : '✗'}<br/>
                  {(t as any)('ui.property')}: {checkRule(selectedWord.id, 'Property') ? '✓' : '✗'}<br/>
                  {(t as any)('ui.wording')}: {checkRule(selectedWord.id, 'Wording') ? '✓' : '✗'}
                </div>
              </div>
            )}
            <div className="text-xs mt-2 text-gray-400">Press Ctrl+D to hide</div>
          </div>
        )}

        <GameCompleteModal 
          attempts={attempts}
          onCheckBoard={handleCheckBoard}
          onPlayAgain={handlePlayAgain}
          isOpen={isGameComplete}
          correctWords={correctWordCount}
        />
        
        <GameOverModal
          attempts={attempts}
          onPlayAgain={handlePlayAgain}
          isOpen={isGameOver}
        />
      </div>
    </div>
  );
}

