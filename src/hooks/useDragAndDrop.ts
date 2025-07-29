import { type DropResult } from "@hello-pangea/dnd";
import { type Word } from "../types/word";
import { type Area, getBaseAreaName } from "../types/area";
import { checkRule, findCorrectArea } from "../utils/rules";
import { playCorrectSound, playWrongSound } from "../utils/mediaUtils";
import { ANIMATION_DELAYS } from "../constants/gameConstants";

// Function to convert English area name back to Chinese for UI display
function getChineseAreaName(englishArea: string): string {
  const areaMap: Record<string, string> = {
    'context': '使用场景',
    'property': '特性', 
    'wording': '拼写',
    'context+property': '使用场景+特性',
    'context+wording': '使用场景+拼写',
    'property+wording': '特性+拼写',
    'all': '全部满足',
    'none': '全不满足'
  };
  return areaMap[englishArea] || englishArea;
}

interface UseDragAndDropProps {
  visibleWords: Word[];
  areaWords: Record<Area, Word[]>;
  removeWordFromVisible: (wordId: string) => void;
  addWordBackToVisible: (word: Word) => void;
  addNewWordToVisible: () => boolean;
  updateAreaWords: (updater: (prev: Record<Area, Word[]>) => Record<Area, Word[]>) => void;
  setSelectedWord: (word: Word | null) => void;
  incrementAttempts: () => void;
}

/**
 * Custom hook to manage drag and drop functionality with complex animations and logic
 * 
 * This hook handles:
 * - Word dragging from word list to areas with correctness checking
 * - Complex animations for incorrect placements (fade out, move, fade in)
 * - Sound effects for correct/incorrect placements
 * - Word reordering within and between areas
 * - Word selection during drag operations
 * 
 * @param props - Configuration options for drag and drop
 * @returns Drag and drop handlers
 */
export function useDragAndDrop({
  visibleWords,
  areaWords,
  removeWordFromVisible,
  addWordBackToVisible,
  addNewWordToVisible,
  updateAreaWords,
  setSelectedWord,
  incrementAttempts
}: UseDragAndDropProps) {

  /**
   * Handle complex word placement with animations for incorrect placements
   */
  const handleWordPlacement = (word: Word, destArea: Area, sourceIndex: number) => {
    // Convert Chinese area name to English for rule checking
    const englishDestArea = getBaseAreaName(destArea);
    const isCorrect = checkRule(word.id, englishDestArea);
    const correctAreaEnglish = findCorrectArea(word.id);
    const correctAreaChinese = correctAreaEnglish ? getChineseAreaName(correctAreaEnglish) : null;
    
    // Debug logs
    console.log("Word:", word.word);
    console.log("Dropped in area:", destArea);
    console.log("Is correct?", isCorrect);
    console.log("Correct area (English):", correctAreaEnglish);
    console.log("Correct area (Chinese):", correctAreaChinese);
    
    // Check if the destination area is actually the correct area
    const isDirectlyInCorrectArea = destArea === correctAreaChinese;
    const isDestinationCorrect = isCorrect || isDirectlyInCorrectArea;
    
    // Update the selected word when dragged
    setSelectedWord(word);
    
    // Safety check: ensure the destination area exists
    if (!areaWords[destArea]) {
      console.error(`Area ${destArea} not found in areaWords`);
      return;
    }
    
    // Remove from visible words list
    removeWordFromVisible(word.id);
    
    // Only refill a new word if the placement was incorrect
    if (!isDestinationCorrect) {
      addNewWordToVisible();
    }

    // If incorrect, animate the movement to correct area
    if (!isDestinationCorrect && correctAreaChinese && destArea !== correctAreaChinese) {
      // Play wrong sound when word is placed incorrectly
      playWrongSound();
      
      // First, add to the wrong area without isAutoMoved flag
      updateAreaWords(prev => ({
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
        updateAreaWords(prev => ({
          ...prev,
          [destArea]: prev[destArea].map(w => 
            w.id === word.id ? { ...w, isAutoMoved: true } : w  // Set to true to trigger fade out
          )
        }));
      }, ANIMATION_DELAYS.WRONG_PLACEMENT_FADE_START);

      // After fade out, move to correct area
      setTimeout(() => {
        console.log("Moving word to correct area:", correctAreaChinese);
        
        updateAreaWords(prev => {
          const newAreaWords = { ...prev };
          // Remove from wrong area
          newAreaWords[destArea] = prev[destArea].filter(w => w.id !== word.id);
          // Add to correct area with isAutoMoved true initially
          newAreaWords[correctAreaChinese as Area] = [
            ...(prev[correctAreaChinese as Area] || []),
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

        // Fade in at new location - first make it visible but keep isAutoMoved true for animation
        setTimeout(() => {
          console.log("Fading in word in correct area");
          
          updateAreaWords(prev => ({
            ...prev,
            [correctAreaChinese as Area]: prev[correctAreaChinese as Area].map(w =>
              w.id === word.id ? { 
                ...w, 
                isAutoMoved: false,  // Change the animation flag
                wasAutoMoved: false  // Temporarily set to false to make it visible
              } : w
            )
          }));
          
          // After the word appears, mark it as auto-moved again for styling
          setTimeout(() => {
            console.log("Setting final style for auto-moved word");
            
            updateAreaWords(prev => ({
              ...prev,
              [correctAreaChinese as Area]: prev[correctAreaChinese as Area].map(w =>
                w.id === word.id ? { 
                  ...w,
                  wasAutoMoved: true  // Set back to true for styling purposes
                } : w
              )
            }));
          }, ANIMATION_DELAYS.FINAL_STYLE_UPDATE);
        }, ANIMATION_DELAYS.CORRECT_PLACEMENT_FADE_IN);
      }, ANIMATION_DELAYS.WRONG_PLACEMENT_MOVE);
    } else {
      // If correct, just add to the area (not auto-moved)
      console.log(`Word "${word.word}" placed correctly in ${destArea}. Adding it directly.`);
      
      updateAreaWords(prev => ({
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
      playCorrectSound();
    }
    
    incrementAttempts();
  };

  /**
   * Handle the end of a drag operation
   * @param result - The result of the drag operation
   */
  const onDragEnd = (result: DropResult) => {
    const { source, destination } = result;
    
    if (!destination) return;

    // Same position - no change needed
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    // Safety check: ensure source and destination are valid
    if (!source || !destination) return;

    // Case 1: From wordList to an area
    if (source.droppableId === 'wordList' && destination.droppableId !== 'wordList') {
      // Safety check: ensure the word exists
      if (!visibleWords || source.index >= visibleWords.length) return;
      
      const word = visibleWords[source.index];
      const destArea = destination.droppableId as Area;
      
      handleWordPlacement(word, destArea, source.index);
      return;
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
      
      const word = sourceArea[source.index];
      
      // Update the selected word when dragged
      setSelectedWord(word);
      
      // Add back to visible words
      addWordBackToVisible(word);
      
      // Remove from source area
      updateAreaWords(prev => {
        const sourceWords = Array.from(prev[source.droppableId as Area] || []);
        sourceWords.splice(source.index, 1);
        
        return {
          ...prev,
          [source.droppableId]: sourceWords
        };
      });
      return;
    }

    // Case 3: Within the same area - reordering
    if (source.droppableId === destination.droppableId) {
      // Safety check: ensure the area exists
      if (!areaWords[source.droppableId as Area]) {
        console.error(`Area ${source.droppableId} not found in areaWords`);
        return;
      }
      
      updateAreaWords(prev => {
        const areaId = source.droppableId as Area;
        const areaItems = Array.from(prev[areaId] || []);
        
        // Safety check: ensure the index is valid
        if (source.index >= areaItems.length) return prev;
        
        const [movedItem] = areaItems.splice(source.index, 1);
        
        // Update the selected word when reordered
        setSelectedWord(movedItem);
        
        areaItems.splice(destination.index, 0, movedItem);
        
        return {
          ...prev,
          [areaId]: areaItems
        };
      });
      return;
    }

    // Case 4: Between different areas
    updateAreaWords(prev => {
      // Safety checks for both areas
      if (!prev[source.droppableId as Area] || !prev[destination.droppableId as Area]) {
        console.error("Source or destination area not found");
        return prev;
      }
      
      const sourceWords = Array.from(prev[source.droppableId as Area] || []);
      const destWords = Array.from(prev[destination.droppableId as Area] || []);
      
      // Safety check: ensure the index is valid
      if (source.index >= sourceWords.length) return prev;
      
      const [removed] = sourceWords.splice(source.index, 1);
      
      // Update the selected word when moved between areas
      setSelectedWord(removed);
      
      destWords.splice(destination.index, 0, removed);

      return {
        ...prev,
        [source.droppableId]: sourceWords,
        [destination.droppableId]: destWords,
      };
    });
  };

  /**
   * Handle the start of a drag operation
   * @param start - The start information of the drag operation
   */
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

  return {
    onDragEnd,
    onDragStart
  };
} 