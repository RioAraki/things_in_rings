"use client"

import { useState, useEffect } from "react"
import { DragDropContext, type DropResult } from "@hello-pangea/dnd"
import WordList from "./word-list"
import SetDiagram from "./set-diagram"
import { type Word } from "../types/word"
import { type Area } from "../types/area"
import { getWords } from '../utils/words'
import { checkRule, findCorrectArea, getRules } from '../utils/rules'
import { type Rule } from '../types/rule'
import GameCompleteModal from './game-complete-modal'

// Dynamic image loading setup
const wordImages: Record<string, string> = {};

// This function will try to load an image for a given word
// If it fails, it will return a placeholder image
const getWordImage = (word: string): string => {
  const formattedWord = word.toLowerCase();
  
  try {
    // Try to get the image from our cache
    if (!wordImages[formattedWord]) {
      // If not cached, try to dynamically require it
      wordImages[formattedWord] = require(`../resources/${formattedWord}.png`);
    }
    return wordImages[formattedWord];
  } catch (error) {
    // If the image doesn't exist, return a placeholder
    console.warn(`Image for "${word}" not found, using placeholder`);
    try {
      return require('../resources/placeholder.png');
    } catch {
      // If even the placeholder doesn't exist, return apple as fallback
      return require('../resources/apple.png');
    }
  }
};

export default function SetDiagramPage() {
  // Store all available words that haven't been shown yet
  const [allWords, setAllWords] = useState<Word[]>(getWords())
  
  // Store only the currently visible words in the word list (maximum 5)
  const [visibleWords, setVisibleWords] = useState<Word[]>([])
  
  // Initialize the visible words when the component mounts
  useEffect(() => {
    // Only initialize once when the component mounts
    if (visibleWords.length === 0) {
      // Take the first 5 words from allWords and make them visible
      setVisibleWords(allWords.slice(0, 5));
      // Remove those words from allWords
      setAllWords(prev => prev.slice(5));
    }
  }, []); // Empty dependency array - run only on mount

  const [areaWords, setAreaWords] = useState<Record<Area, Word[]>>({
    Context: [],
    Property: [],
    Wording: [],
    'Context+Property': [],
    'Property+Wording': [],
    'Context+Wording': [],
    'All': [],
    None: [],
  })

  // Add logs state to track user actions
  const [logs, setLogs] = useState<string[]>([])

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
      return count + words.filter(word => 
        word.isChecked && 
        word.isCorrect && 
        !word.wasAutoMoved // Only count words correctly placed by the user
      ).length;
    }, 0);
    
    setCorrectWordCount(userCorrectWords);

    if (userCorrectWords >= 5 && !isGameComplete) {
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
      const isCorrect = checkRule(word.id, destArea)
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
        
        if (allWords.length > 0) {
          const nextWord = allWords[0];
          newVisibleWords.push(nextWord);
          setAllWords(prev => prev.slice(1));
        }
        
        return newVisibleWords;
      });

      // Add to logs
      setLogs(prev => [
        `Dropped "${word.word}" in ${destArea} - ${isCorrect ? 'Correct! ✓' : 'Wrong! ✗'}`,
        ...(correctArea && !isCorrect ? [`"${word.word}" actually belongs to ${correctArea}`] : []),
        ...prev.slice(0, 8)
      ]);

      // If incorrect, animate the movement to correct area
      if (!isCorrect && correctArea) {
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
        }, 1000);

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
                isCorrect: true,
                isAutoMoved: true  // Set to true when first appearing in correct area
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
                  isAutoMoved: false,  // Set to false to show in final position
                  wasAutoMoved: true   // Keep track that this was auto-moved
                } : w
              )
            }));
          }, 50);
        }, 1500); // Increased delay to ensure fade out completes
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

  // Handle selection of a word from the word list
  const handleSelectWord = (word: Word) => {
    setSelectedWord(word);
  };

  return (
    <div className="container mx-auto p-4 h-screen">
      <h1 className="text-2xl font-bold mb-4">
        Set Diagram Word Sorter {showRuleDescriptions ? '- Rules Revealed' : ''}
      </h1>

      {/* Add debug panel - press Ctrl+D to toggle */}
      {showDebug && (
        <div className="fixed top-0 right-0 bg-black/80 text-white p-4 rounded-bl-lg text-sm font-mono z-50 max-w-md">
          <h3 className="font-bold mb-2">Active Rules:</h3>
          <div className="space-y-2">
            <div className="border-b border-gray-600 pb-2">
              <div className="text-blue-300">Context Rule (1):</div>
              <div className="pl-2 text-xs">{contextRule?.description || 'Not found'}</div>
            </div>
            <div className="border-b border-gray-600 pb-2">
              <div className="text-green-300">Property Rule (2):</div>
              <div className="pl-2 text-xs">{propertyRule?.description || 'Not found'}</div>
            </div>
            <div className="border-b border-gray-600 pb-2">
              <div className="text-yellow-300">Wording Rule (3):</div>
              <div className="pl-2 text-xs">{wordingRule?.description || 'Not found'}</div>
            </div>
          </div>
          {selectedWord && (
            <div className="mt-3 pt-2 border-t border-gray-600">
              <div className="text-purple-300">Selected Word: {selectedWord.word}</div>
              <div className="pl-2 text-xs">
                Context: {checkRule(selectedWord.id, 'Context') ? '✓' : '✗'}<br/>
                Property: {checkRule(selectedWord.id, 'Property') ? '✓' : '✗'}<br/>
                Wording: {checkRule(selectedWord.id, 'Wording') ? '✓' : '✗'}
              </div>
            </div>
          )}
          <div className="text-xs mt-2 text-gray-400">Press Ctrl+D to hide</div>
        </div>
      )}

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex h-[calc(100%-4rem)]">
          {/* Left side - Set Diagram (70%) */}
          <div style={{width: "70%"}} className="pr-2 border h-full overflow-hidden">  
            <SetDiagram 
              areaWords={areaWords} 
              setAreaWords={setAreaWords}
              showRuleDescriptions={showRuleDescriptions}
              rules={{
                context: contextRule?.description,
                property: propertyRule?.description,
                wording: wordingRule?.description
              }}
            />
          </div>
          
          {/* Right side - split into Word List, Picture, and Log (30%) */}
          <div style={{width: "30%"}} className="pl-2 flex flex-col h-full">
            {/* Word List (top third) */}
            <div style={{height: "30%"}} className="mb-4 overflow-hidden">
              <WordList 
                words={visibleWords} 
                onSelectWord={handleSelectWord} 
              />
            </div>
            
            {/* Picture (middle third) */}
            <div style={{height: "30%"}} className="mb-4 bg-gray-100 p-4 rounded-lg flex flex-col">
              <h2 className="text-xl font-semibold mb-3">
                {selectedWord ? `Picture: ${selectedWord.word}` : 'Select a word'}
              </h2>
              <div className="flex-grow flex items-center justify-center">
                <img 
                  src={selectedWord 
                    ? getWordImage(selectedWord.word)
                    : require('../resources/placeholder.png')} 
                  alt={selectedWord ? selectedWord.word : "Select a word"} 
                  className="rounded-lg object-contain"
                  style={{ 
                    maxHeight: "80%", 
                    maxWidth: "80%",
                    display: "block",
                    margin: "auto"
                  }}
                />
              </div>
            </div>
            
            {/* Log (bottom third) */}
            <div style={{height: "30%"}} className="bg-gray-100 p-4 rounded-lg flex flex-col">
              <h2 className="text-xl font-semibold mb-3">Log</h2>
              
              {/* Scrollable container for ALL logs */}
              <div className="overflow-y-auto flex-grow">
                <div className="space-y-2">
                  {logs.length > 0 ? (
                    logs.map((log, index) => (
                      <div 
                        key={index} 
                        className="text-sm border-b pb-1 pt-1"
                      >
                        {log}
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-gray-500 italic">
                      No actions logged yet. Drag words to categories to see logs.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </DragDropContext>

      <GameCompleteModal 
        attempts={attempts}
        onCheckBoard={handleCheckBoard}
        isOpen={isGameComplete}
        correctWords={correctWordCount}
      />
    </div>
  )
}

