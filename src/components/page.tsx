"use client"

import { useEffect } from "react"
import { DragDropContext } from "@hello-pangea/dnd"
import WordList from "./word-list"
import SetDiagram from "./set-diagram"
import { getRules } from '../utils/rules'
import GameCompleteModal from './game-complete-modal'
import GameOverModal from './game-over-modal'
import { useGameState } from '../hooks/useGameState'
import { useDragAndDrop } from '../hooks/useDragAndDrop'
import { useUIState } from '../hooks/useUIState'
import { getWordImage, initializeSounds } from '../utils/mediaUtils'

export default function SetDiagramPage() {
  
  // Initialize sounds when the component mounts
  useEffect(() => {
    initializeSounds();
  }, []);

  // Initialize game state
  const gameState = useGameState({ 
    onGameComplete: () => {},
    onGameOver: () => {}
  });

  // Initialize UI state
  const uiState = useUIState();

  // Initialize drag and drop handlers
  const { onDragEnd, onDragStart } = useDragAndDrop({
    visibleWords: gameState.visibleWords,
    areaWords: gameState.areaWords,
    removeWordFromVisible: gameState.removeWordFromVisible,
    addWordBackToVisible: gameState.addWordBackToVisible,
    addNewWordToVisible: gameState.addNewWordToVisible,
    updateAreaWords: gameState.updateAreaWords,
    setSelectedWord: gameState.setSelectedWord,
    incrementAttempts: gameState.incrementAttempts
  });

  // Get rules for display
  const rules = getRules();
  const contextRule = rules.find(r => r.type === 'context' as const);
  const propertyRule = rules.find(r => r.type === 'property' as const);
  const wordingRule = rules.find(r => r.type === 'wording' as const);

  // Handle checking the board
  const handleCheckBoard = () => {
    uiState.showRules();
    // Reset game complete state to allow re-checking
    // This would need to be added to the game state hook if needed
  };

  // Handle selection of a word from the word list
  const handleSelectWord = (word: any) => {
    gameState.setSelectedWord(word);
  };

  // Handle play again
  const handlePlayAgain = () => {
    gameState.resetGame();
    uiState.resetUIState();
  };

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-[90%] mx-auto px-4">
        <DragDropContext onDragEnd={onDragEnd} onDragStart={onDragStart}>
          <div className="flex flex-col md:flex-row overflow-hidden">
            {/* SetDiagram on the left half */}
            <div className="w-full md:w-1/2 p-4 overflow-y-auto">
              <SetDiagram
                areaWords={gameState.areaWords}
                setAreaWords={(updater) => {
                  if (typeof updater === 'function') {
                    gameState.updateAreaWords(updater);
                  } else {
                    gameState.updateAreaWords(() => updater);
                  }
                }}
                showRuleDescriptions={uiState.showRuleDescriptions}
                rules={{
                  context: contextRule?.question,
                  property: propertyRule?.question,
                  wording: wordingRule?.question
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
                    words={gameState.visibleWords} 
                    onSelectWord={handleSelectWord}
                    correctWordCount={gameState.correctWordCount}
                  />
                </div>
              </div>
               
              {/* Picture section */}
              <div className="h-[calc(50vh-4rem)]">
                <div className="h-full bg-gray-100 p-4 rounded-lg">
                  <h2 className="text-xl font-bold mb-2">Picture</h2>
                  <div className="h-[calc(100%-2.5rem)] flex items-center justify-center">
                    {gameState.selectedWord ? (
                      <img 
                        src={getWordImage(gameState.selectedWord.word_en)} 
                        alt={gameState.selectedWord.word} 
                        className="rounded-lg max-h-full object-contain"
                        style={{ maxWidth: '100%' }}
                      />
                    ) : (
                      <div className="text-gray-400 text-center">
                        Select a word to see picture
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DragDropContext>

        {/* Debug panel - press Ctrl+D to toggle */}
        {uiState.showDebug && (
          <div className="fixed top-0 right-0 bg-black/80 text-white p-4 rounded-bl-lg text-sm font-mono z-50 max-w-md">
            <h3 className="font-bold mb-2">Active Rules:</h3>
            <div className="space-y-2">
              <div className="border-b border-gray-600 pb-2">
                <div className="text-blue-300">Context Rule:</div>
                {contextRule ? (
                  <div className="pl-2 text-xs">ID: {contextRule.id} - {contextRule.question}</div>
                ) : (
                  <div className="pl-2 text-xs text-red-400">Not found (Check rule initialization)</div>
                )}
              </div>
              <div className="border-b border-gray-600 pb-2">
                <div className="text-green-300">Property Rule:</div>
                {propertyRule ? (
                  <div className="pl-2 text-xs">ID: {propertyRule.id} - {propertyRule.question}</div>
                ) : (
                  <div className="pl-2 text-xs text-red-400">Not found (Check rule initialization)</div>
                )}
              </div>
              <div className="border-b border-gray-600 pb-2">
                <div className="text-yellow-300">Wording Rule:</div>
                {wordingRule ? (
                  <div className="pl-2 text-xs">ID: {wordingRule.id} - {wordingRule.question}</div>
                ) : (
                  <div className="pl-2 text-xs text-red-400">Not found (Check rule initialization)</div>
                )}
              </div>
              <div className="border-b border-gray-600 pb-2">
                <div className="text-gray-300">All Active Rules:</div>
                <div className="pl-2 text-xs">
                  {rules.map((rule, index) => (
                    <div key={index} className="mb-1">
                      ID: {rule.id} - Type: {rule.type || 'unknown'} - {rule.question}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {gameState.selectedWord && (
              <div className="mt-3 pt-2 border-t border-gray-600">
                <div className="text-purple-300">Selected Word: {gameState.selectedWord.word}</div>
                <div className="pl-2 text-xs">
                  {contextRule ? `Context: ${contextRule.question}` : ''}<br/>
                  {propertyRule ? `Property: ${propertyRule.question}` : ''}<br/>
                  {wordingRule ? `Wording: ${wordingRule.question}` : ''}
                </div>
              </div>
            )}
            <div className="text-xs mt-2 text-gray-400">Press Ctrl+D to hide</div>
          </div>
        )}

        <GameCompleteModal
          attempts={gameState.attempts}
          onCheckBoard={handleCheckBoard}
          onPlayAgain={handlePlayAgain}
          isOpen={gameState.isGameComplete}
          correctWords={gameState.correctWordCount}
        />
         
        <GameOverModal
          attempts={gameState.attempts}
          onPlayAgain={handlePlayAgain}
          isOpen={gameState.isGameOver}
        />
      </div>
    </div>
  );
}

