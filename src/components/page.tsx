"use client"

import { useState, useRef } from "react"
import { DragDropContext, type DropResult } from "@hello-pangea/dnd"
import WordList from "./word-list"
import SetDiagram from "./set-diagram"
import { type Word } from "../types/word"
import { type Area } from "../types/area"

// Define circle centers and radius
const circles = {
  A: { x: 33, y: 33, r: 33 },
  B: { x: 67, y: 33, r: 33 },
  C: { x: 50, y: 67, r: 33 }
};

// Define safe zones for word placement within each region
const areaSafeZones = {
  // Single regions - offset from center towards the unique part of each circle
  A: { 
    x: circles.A.x - 15, // Shifted left from center
    y: circles.A.y,
    width: 20,
    height: 20
  },
  B: { 
    x: circles.B.x + 5, // Shifted right from center
    y: circles.B.y,
    width: 20,
    height: 20
  },
  C: { 
    x: circles.C.x,
    y: circles.C.y + 5, // Shifted down from center
    width: 20,
    height: 20
  },
  
  // Intersection regions
  AB: {
    x: (circles.A.x + circles.B.x) / 2 - 10,
    y: circles.A.y - 5,
    width: 20,
    height: 20
  },
  BC: {
    x: (circles.B.x + circles.C.x) / 2 + 5,
    y: (circles.B.y + circles.C.y) / 2,
    width: 20,
    height: 20
  },
  AC: {
    x: (circles.A.x + circles.C.x) / 2 - 15,
    y: (circles.A.y + circles.C.y) / 2,
    width: 20,
    height: 20
  },
  
  // Center region
  ABC: {
    x: (circles.A.x + circles.B.x + circles.C.x) / 3 - 10,
    y: (circles.A.y + circles.B.y + circles.C.y) / 3,
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
const isInsideCircle = (x: number, y: number, circle: typeof circles.A) => {
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
    case 'A':
      return corners.every(corner => isInsideCircle(corner.x, corner.y, circles.A));
    case 'B':
      return corners.every(corner => isInsideCircle(corner.x, corner.y, circles.B));
    case 'C':
      return corners.every(corner => isInsideCircle(corner.x, corner.y, circles.C));
    case 'AB':
      return corners.every(corner => 
        isInsideCircle(corner.x, corner.y, circles.A) && 
        isInsideCircle(corner.x, corner.y, circles.B)
      );
    // Add other cases for BC, AC, ABC...
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
    A: [],
    B: [],
    C: [],
    AB: [],
    BC: [],
    AC: [],
    ABC: [],
    None: [],
  })

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

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return
    }

    // If dragging from word list
    if (source.droppableId === 'wordList') {
      const word = words[source.index]
      
      // Remove from words list
      setWords(prev => {
        const newWords = [...prev]
        newWords.splice(source.index, 1)
        return newWords
      })

      // Add to destination area
      setAreaWords(prev => ({
        ...prev,
        [destination.droppableId]: [...prev[destination.droppableId as Area], word]
      }))
      return
    }

    // If dragging between areas
    setAreaWords(prev => {
      const sourceWords = Array.from(prev[source.droppableId as Area])
      const destWords = Array.from(prev[destination.droppableId as Area])
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
        <div className="flex flex-row h-[calc(100%-4rem)]">
          <div style={{width: "70%"}} className="pr-2 border h-full overflow-hidden">  
            <SetDiagram 
              areaWords={areaWords} 
              setAreaWords={setAreaWords}
            />
          </div>
          <div style={{width: "30%"}} className="pl-2 border">  
            <WordList words={words} />
          </div>
        </div>
      </DragDropContext>
    </div>
  )
}

