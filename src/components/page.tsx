"use client"

import { useState, useRef } from "react"
import { DragDropContext, type DropResult } from "@hello-pangea/dnd"
import WordList from "./word-list"
import SetDiagram from "./set-diagram"
import { type Word } from "../types/word"
import { type Area } from "../types/area"

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

// Helper function to check if a rectangle is fully contained within a circle or intersection
const isRectangleSafe = (rect: { x: number, y: number, width: number, height: number }, area: Area) => {
  // Check all four corners of the rectangle
  const corners = [
    { x: rect.x, y: rect.y },
    { x: rect.x + rect.width, y: rect.y },
    { x: rect.x, y: rect.y + rect.height },
    { x: rect.x + rect.width, y: rect.y + rect.height }
  ];

  switch (area) {
    case 'Context':
      return corners.every(corner => isInsideCircle(corner.x, corner.y, circles.Context));
    case 'Property':
      return corners.every(corner => isInsideCircle(corner.x, corner.y, circles.Property));
    case 'Wording':
      return corners.every(corner => isInsideCircle(corner.x, corner.y, circles.Wording));
    case 'Context+Property':
      return corners.every(corner => 
        isInsideCircle(corner.x, corner.y, circles.Context) && 
        isInsideCircle(corner.x, corner.y, circles.Property)
      );
    // Add other cases for the remaining areas
    default:
      return true;
  }
};

export default function SetDiagramPage() {
  const [words, setWords] = useState<Word[]>([
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

  const diagramRef = useRef<HTMLDivElement>(null)

  const calculateDistance = (x1: number, y1: number, x2: number, y2: number) => {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))
  }

  const findClosestArea = (x: number, y: number): Area => {
    let closestArea: Area = "None"
    let minDistance = Number.MAX_VALUE

    Object.entries(areaSafeZones).forEach(([area, zone]) => {
      const distance = calculateDistance(x, y, zone.x, zone.y)
      if (distance < minDistance) {
        minDistance = distance
        closestArea = area as Area
      }
    })

    return closestArea
  }

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
      if (!words || source.index >= words.length) return
      
      const word = words[source.index]
      
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

      // Remove from words list
      setWords(prev => {
        const newWords = [...prev]
        newWords.splice(source.index, 1)
        return newWords
      })

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
      
      // Add to words list
      setWords(prev => [...prev, word])
      
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
      destWords.splice(destination.index, 0, removed)

      return {
        ...prev,
        [source.droppableId]: sourceWords,
        [destination.droppableId]: destWords,
      }
    })
  }

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
          
          {/* Right side - split into Word List and Log (30%) */}
          <div style={{width: "30%"}} className="pl-2 flex flex-col h-full">
            {/* Word List (top half) */}
            <div className="h-1/2 mb-2 border overflow-hidden">
              <WordList words={words} />
            </div>
            
            {/* Log (bottom half) */}
            <div className="h-1/2 border overflow-auto bg-gray-50 p-4">
              <h2 className="text-xl font-semibold mb-4">Log</h2>
              <div className="space-y-2">
                {logs.length > 0 ? (
                  logs.map((log, index) => (
                    <div key={index} className="text-sm border-b pb-1">
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
      </DragDropContext>
    </div>
  )
}

