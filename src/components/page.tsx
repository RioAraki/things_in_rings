"use client"

import { useState, useEffect } from "react"
import { DragDropContext, type DropResult } from "@hello-pangea/dnd"
import WordList from "./word-list"
import SetDiagram from "./set-diagram"
import { type Word } from "../types/word"
import { type Area } from "../types/area"

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

// Define circle centers and radius
const circles = {
  Context: { x: 33, y: 33, r: 33 },
  Property: { x: 67, y: 33, r: 33 },
  Wording: { x: 50, y: 67, r: 33 }
};

// Define safe zones for word placement within each region
const areaSafeZones = {
  // Single regions - offset from center towards the unique part of each circle
  Context: { 
    x: circles.Context.x - 15, // Shifted left from center
    y: circles.Context.y,
    width: 20,
    height: 20
  },
  Property: { 
    x: circles.Property.x + 5, // Shifted right from center
    y: circles.Property.y,
    width: 20,
    height: 20
  },
  Wording: { 
    x: circles.Wording.x,
    y: circles.Wording.y + 5, // Shifted down from center
    width: 20,
    height: 20
  },
  
  // Intersection regions
  'Context+Property': {
    x: (circles.Context.x + circles.Property.x) / 2 - 10,
    y: circles.Context.y - 5,
    width: 20,
    height: 20
  },
  'Property+Wording': {
    x: (circles.Property.x + circles.Wording.x) / 2 + 5,
    y: (circles.Property.y + circles.Wording.y) / 2,
    width: 20,
    height: 20
  },
  'Context+Wording': {
    x: (circles.Context.x + circles.Wording.x) / 2 - 15,
    y: (circles.Context.y + circles.Wording.y) / 2,
    width: 20,
    height: 20
  },
  
  // Center region
  'All': {
    x: (circles.Context.x + circles.Property.x + circles.Wording.x) / 3 - 10,
    y: (circles.Context.y + circles.Property.y + circles.Wording.y) / 3,
    width: 20,
    height: 20
  },
  
  None: { 
    x: 5,
    y: 95,
    width: 30,
    height: 20
  }
};

// Helper function to check if a point is inside a circle
const isInsideCircle = (x: number, y: number, circle: typeof circles.Context) => {
  return Math.pow(x - circle.x, 2) + Math.pow(y - circle.y, 2) <= Math.pow(circle.r, 2);
};

export default function SetDiagramPage() {
  // Store all available words that haven't been shown yet
  const [allWords, setAllWords] = useState<Word[]>([
    { id: "word1", content: "Telescope" },
    { id: "word2", content: "Penguin" },
    { id: "word3", content: "Cinnamon" },
    { id: "word4", content: "Umbrella" },
    { id: "word5", content: "Volcano" },
    { id: "word6", content: "Compass" },
    { id: "word7", content: "Bamboo" },
    { id: "word8", content: "Lantern" },
    { id: "word9", content: "Dolphin" },
    { id: "word10", content: "Hammer" },
    { id: "word11", content: "Crystal" },
    { id: "word12", content: "Basket" },
    { id: "word13", content: "Cactus" },
    { id: "word14", content: "Compass" },
    { id: "word15", content: "Feather" },
    { id: "word16", content: "Kettle" },
    { id: "word17", content: "Marble" },
    { id: "word18", content: "Pyramid" },
    { id: "word19", content: "Saddle" },
    { id: "word20", content: "Whistle" },
  ])
  
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
      
      // Update the selected word when dragged
      setSelectedWord(word);
      
      // Safety check: ensure the destination area exists
      if (!areaWords[destination.droppableId as Area]) {
        console.error(`Area ${destination.droppableId} not found in areaWords`);
        return;
      }
      
      // Add to logs when word is moved from word list to an area - prepend to array
      setLogs(prev => [
        `You think the word "${word.content}" matches the requirement of "${destination.droppableId}"`,
        ...prev
      ])

      // Remove from visible words list
      setVisibleWords(prev => {
        const newVisibleWords = [...prev];
        newVisibleWords.splice(source.index, 1);
        
        // Add a new word from allWords if available
        if (allWords.length > 0) {
          // Get the next word and add it to visible words
          const nextWord = allWords[0];
          newVisibleWords.push(nextWord);
          
          // Remove that word from allWords
          setAllWords(prev => prev.slice(1));
        }
        
        return newVisibleWords;
      });

      // Add to destination area - mark as placed
      setAreaWords(prev => ({
        ...prev,
        [destination.droppableId]: [...(prev[destination.droppableId as Area] || []), 
          {...word, isPlaced: true} // Mark the word as placed
        ]
      }))
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
      <h1 className="text-2xl font-bold mb-4">Set Diagram Word Sorter</h1>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex h-[calc(100%-4rem)]">
          {/* Left side - Set Diagram (70%) */}
          <div style={{width: "70%"}} className="pr-2 border h-full overflow-hidden">  
            <SetDiagram 
              areaWords={areaWords} 
              setAreaWords={setAreaWords}
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
                {selectedWord ? `Picture: ${selectedWord.content}` : 'Select a word'}
              </h2>
              <div className="flex-grow flex items-center justify-center">
                <img 
                  src={selectedWord 
                    ? getWordImage(selectedWord.content)
                    : require('../resources/placeholder.png')} 
                  alt={selectedWord ? selectedWord.content : "Select a word"} 
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
    </div>
  )
}

