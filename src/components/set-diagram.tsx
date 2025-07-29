import React, { useState, useEffect } from 'react'
import { Droppable, Draggable } from "@hello-pangea/dnd"
import { type Area, getBaseAreaName } from "../types/area"
import { type Word } from "../types/word"

// Rename VennDiagramProps to SetDiagramProps
type SetDiagramProps = {
  areaWords: Record<Area, Word[]>
  // Remove areaSafeZones since we're not using it anymore
  setAreaWords: React.Dispatch<React.SetStateAction<Record<Area, Word[]>>>
  showRuleDescriptions?: boolean
  rules?: {
    context?: string
    property?: string
    wording?: string
  }
  onSelectWord?: (word: Word) => void
  transparency?: number // Add transparency parameter (0-100)
}

const getAreaColor = (area: Area): string => {
  // Get the base area name for color mapping
  const baseArea = getBaseAreaName(area);
  
  switch (baseArea) {
    // Primary faces with vivid colors
    case 'context':
      return '#ff9999';
    case 'property':
      return '#99ff99';
    case 'wording':
      return '#9999ff';
    
    // Intersection areas with mixed colors
    case 'context+property':
      return '#f9c999';
    case 'context+wording':
      return '#f999f9';
    case 'property+wording':
      return '#99c9f9';
    
    // Center intersection
    case 'all':
      return '#ffffff';
    
    // None area
    case 'none':
      return '#000000';
    
    default:
      return '#ffffff';
  }
}

const AreaComponent = ({
  id,
  words,
  left,
  top,
  width,
  height,
  showRuleDescriptions,
  rules,
  onSelectWord,
  transparency = 20
}: {
  id: Area
  words: Word[]
  left: number
  top: number
  width: number
  height: number
  showRuleDescriptions?: boolean
  rules?: {
    context?: string
    property?: string
    wording?: string
  }
  onSelectWord?: (word: Word) => void
  transparency?: number
}) => {
  const baseAreaName = getBaseAreaName(id);
  const [animationKey, setAnimationKey] = useState(0);
  const opacity = (100 - transparency) / 100;
  const opacityHex = Math.floor((100 - transparency) * 2.55).toString(16).padStart(2, '0');

  // Function to get the title based on the area and whether to show rules
  const getTitle = () => {
    if (showRuleDescriptions && rules) {
      const ruleType = baseAreaName as keyof typeof rules;
      return rules[ruleType] || '';
    }

    // Area name mapping
    const areaNames: Record<string, string> = {
      'context': '使用场景',
      'property': '特性', 
      'wording': '拼写',
      'all': '全部满足',
      'none': '全不满足'
    };

    // Handle combination areas
    if (baseAreaName.includes('+')) {
      const [first, second] = baseAreaName.toLowerCase().split('+');
      const firstName = areaNames[first] || first;
      const secondName = areaNames[second] || second;
      return `${firstName}+${secondName}`;
    }

    // Handle single areas
    return areaNames[baseAreaName.toLowerCase()] || baseAreaName;
  };

  const areaTitle = getTitle();
  const tooltipTitle = areaTitle;

  // Check if any word in this area was just auto-moved here
  const hasAutoMovedWord = words.some(word => word.wasAutoMoved);
  
  // Update animation key when words change
  useEffect(() => {
    if (hasAutoMovedWord) {
      setAnimationKey(prev => prev + 1);
    }
  }, [hasAutoMovedWord]);

  return (
    <Droppable droppableId={id}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          key={`${id}-${animationKey}`}
          className={`
            absolute border-[1.5px] rounded-lg p-2
            ${snapshot.isDraggingOver ? "border-blue-500 bg-blue-50/50" : "border-white/40"}
            ${hasAutoMovedWord ? "animate-highlight" : ""}
            transition-all duration-200
            backdrop-blur-[8px]
            ${snapshot.isDraggingOver ? "scale-105" : ""}
          `}
          style={{
            left: `${left}%`,
            top: `${top}%`,
            width: `${width}%`,
            height: `${height}%`,
            backgroundColor: `${getAreaColor(id)}${opacityHex}`,
            boxShadow: snapshot.isDraggingOver 
              ? '0 12px 20px rgba(0,0,0,0.25), 0 3px 6px rgba(0,0,0,0.15), inset 0 0 20px rgba(255,255,255,0.4)'
              : '0 8px 16px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.1), inset 0 0 15px rgba(255,255,255,0.3)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            background: `linear-gradient(135deg, ${getAreaColor(id)}${Math.floor(opacity * 0.5 * 255).toString(16).padStart(2, '0')} 0%, ${getAreaColor(id)}${opacityHex} 100%)`,
            border: snapshot.isDraggingOver 
              ? '1.5px solid rgba(255,255,255,0.5)'
              : '1.5px solid rgba(255,255,255,0.3)',
            zIndex: id === 'all' ? 2 : (snapshot.isDraggingOver ? 3 : 1),
            transform: `translateY(-1px) ${snapshot.isDraggingOver ? 'scale(1.05)' : ''}`,
            transition: 'all 0.2s ease-out',
          }}
        >
          <div 
            className={`
              mb-1 text-center 
              ${showRuleDescriptions 
                ? 'text-xs md:text-sm font-bold py-2 px-2 bg-white/90 rounded shadow-sm backdrop-blur-sm' 
                : 'text-sm font-semibold'}
              text-gray-800 relative z-10
              ${snapshot.isDraggingOver ? 'scale-105 font-bold' : ''}
            `} 
            title={tooltipTitle}
            style={{
              overflow: 'hidden',
              maxWidth: '100%',
              lineHeight: '1.3',
              textShadow: '0 1px 3px rgba(255,255,255,0.8)',
              transition: 'all 0.2s ease-out',
              ...(showRuleDescriptions 
                ? { 
                    minHeight: '3.5rem', 
                    maxHeight: '5rem',
                    overflowY: 'auto',
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    whiteSpace: 'normal',
                    overflowWrap: 'break-word',
                    wordBreak: 'break-word',
                    hyphens: 'auto',
                    backgroundColor: 'rgba(255,255,255,0.9)',
                    backdropFilter: 'blur(4px)',
                    WebkitBackdropFilter: 'blur(4px)',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.05), inset 0 0 10px rgba(255,255,255,0.5)'
                  } 
                : {
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                  }
              )
            }}
          >
            {areaTitle}
          </div>
          <div className="flex flex-wrap gap-1 justify-center items-start">
            {words.map((word, index) => (
              <Draggable 
                key={word.id} 
                draggableId={word.id} 
                index={index}
                isDragDisabled={word.isChecked}
              >
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={`
                      relative rounded-full px-2 py-1 text-sm shadow-sm inline-block whitespace-nowrap
                      transition-all duration-200 ease-out
                      ${word.wasAutoMoved ? 'border-dashed border-2 border-yellow-500' : ''}
                      ${word.isChecked ? 'opacity-80' : ''}
                      ${snapshot.isDragging ? 'shadow-lg scale-110 z-50' : 'shadow-md'}
                    `}
                    style={{
                      ...provided.draggableProps.style,
                      backgroundColor: word.isChecked 
                        ? (word.isCorrect 
                            ? (word.wasAutoMoved ? '#fef08a' : '#86efac') // yellow for system-corrected, green for user-correct
                            : '#fca5a5') // red for incorrect
                        : 'white',
                      cursor: word.isChecked ? 'pointer' : 'grab',
                      transition: 'all 0.2s ease-out',
                      transform: `${provided.draggableProps.style?.transform || ''} ${
                        word.isAutoMoved ? 'scale(0.75)' : (snapshot.isDragging ? 'scale(1.1)' : 'scale(1)')
                      }`,
                      opacity: word.isAutoMoved ? 0 : 1, // Only make it invisible during the auto-move animation
                      border: word.isChecked && word.isCorrect 
                        ? (word.wasAutoMoved 
                            ? '2px dashed #eab308' // dashed border for system-corrected
                            : '2px solid #22c55e') // solid border for user-correct
                        : '1px solid rgba(0,0,0,0.1)', // Add a subtle border for all words
                      paddingRight: word.isChecked ? '22px' : '8px',
                      boxShadow: snapshot.isDragging 
                        ? '0 8px 16px rgba(0,0,0,0.15), 0 2px 4px rgba(0,0,0,0.1)' 
                        : '0 4px 8px rgba(0,0,0,0.15), 0 1px 2px rgba(0,0,0,0.1), 0 0 0 1px rgba(255,255,255,0.5)',
                      zIndex: snapshot.isDragging ? 50 : 'auto',
                    }}
                    onClick={(e) => {
                      // Only handle click if the word is checked (locked in place)
                      if (word.isChecked) {
                        // Prevent the click from triggering drag
                        e.stopPropagation();
                        // Call the onSelectWord handler if it exists
                        if (onSelectWord) {
                          onSelectWord(word);
                        }
                      }
                    }}
                  >
                    {word.word}
                    {word.isChecked && (
                      <span 
                        className="absolute right-1 text-xs" 
                        style={{ 
                          top: '50%', 
                          transform: 'translateY(-50%)',
                          color: word.wasAutoMoved ? '#b45309' : (word.isCorrect ? '#166534' : '#991b1b'), // Darker colors for better contrast
                          fontWeight: word.wasAutoMoved ? 'bold' : 'normal' // Make auto-placed indicator bold
                        }}
                      >
                        {word.isCorrect 
                          ? (word.wasAutoMoved ? '⟳' : '✓') 
                          : '✗'}
                      </span>
                    )}
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        </div>
      )}
    </Droppable>
  );
}

type Point = {
  x: number
  y: number
}

const SetDiagram: React.FC<SetDiagramProps> = ({ 
  areaWords, 
  setAreaWords, 
  showRuleDescriptions = false,
  rules = {},
  onSelectWord,
  transparency = 20  // Default transparency value of 20%
}) => {
  
  // Base dimensions for cube layout
  const AREA_WIDTH = 25
  const AREA_HEIGHT = 18
  const CUBE_SIZE = 100
  // Base size of the cube
  const OFFSET = { x: 0, y: 0 }  // Starting position offset
  const PERSPECTIVE = 0.6  // Perspective factor (0-1)
  
  // Create a mapping of English names to actual Chinese area names in areaWords
  const areaNameMapping: Record<string, Area> = {
    'context': '使用场景',
    'property': '特性',
    'wording': '拼写',
    'context+property': '使用场景+特性',
    'context+wording': '使用场景+拼写',
    'property+wording': '特性+拼写',
    'all': '全部满足',
    'none': '全不满足'
  };

  // Function to calculate cube layout positions with perspective
  function calculateCubeLayout(
    cubeSize: number,
    offset: Point,
    areaWidth: number,
    areaHeight: number,
    perspective: number
  ) {
    // Calculate key points for cube faces with perspective
    const centerX = offset.x + cubeSize/2
    const centerY = offset.y + cubeSize/2

    // Calculate face positions
    const leftFaceX = centerX - cubeSize * 0.35  // X position for left face
    const rightFaceX = centerX + cubeSize * 0.35 // X position for right face
    
    // Top face (Context) - centered at top
    const topFaceCenter = { 
      x: centerX,
      y: offset.y + cubeSize * 0.15
    }

    // Position for None rectangle (left of Context)
    const noneCenter = {
      x: topFaceCenter.x - cubeSize * 0.3, // Reduced from 0.5 to 0.35 to move it closer
      y: topFaceCenter.y  // Same height as Context
    }

    // Left face connection points (Property and Context+Property)
    const contextPropertyCenter = {
      x: leftFaceX,
      y: centerY - cubeSize * 0.15
    }
    
    const propertyCenter = {
      x: leftFaceX,
      y: centerY + cubeSize * 0.2
    }

    // Right face connection points (Wording and Context+Wording)
    const contextWordingCenter = {
      x: rightFaceX,
      y: centerY - cubeSize * 0.15
    }
    
    const wordingCenter = {
      x: rightFaceX,
      y: centerY + cubeSize * 0.2
    }

    // Bottom connection (Property+Wording)
    const propertyWordingCenter = {
      x: centerX,
      y: centerY + cubeSize * 0.35
    }

    // Center point (All)
    const allCenter = {
      x: centerX,
      y: centerY
    }

    return {
      // Main vertices
      context: {
        left: topFaceCenter.x - areaWidth/2,
        top: topFaceCenter.y - areaHeight/2,
        width: areaWidth,
        height: areaHeight
      },
      property: {
        left: propertyCenter.x - areaWidth/2,
        top: propertyCenter.y - areaHeight/2,
        width: areaWidth,
        height: areaHeight
      },
      wording: {
        left: wordingCenter.x - areaWidth/2,
        top: wordingCenter.y - areaHeight/2,
        width: areaWidth,
        height: areaHeight
      },

      // Edge intersections
      'context+property': {
        left: contextPropertyCenter.x - areaWidth/2,
        top: contextPropertyCenter.y - areaHeight/2,
        width: areaWidth,
        height: areaHeight
      },
      'context+wording': {
        left: contextWordingCenter.x - areaWidth/2,
        top: contextWordingCenter.y - areaHeight/2,
        width: areaWidth,
        height: areaHeight
      },
      'property+wording': {
        left: propertyWordingCenter.x - areaWidth/2,
        top: propertyWordingCenter.y - areaHeight/2,
        width: areaWidth,
        height: areaHeight
      },

      // Center intersection
      'all': {
        left: allCenter.x - areaWidth/2,
        top: allCenter.y - areaHeight/2,
        width: areaWidth,
        height: areaHeight
      },

      // None area - placed to the left of Context
      'none': {
        left: noneCenter.x - areaWidth/2,
        top: noneCenter.y - areaHeight/2,
        width: areaWidth,
        height: areaHeight
      }
    }
  }

  const areaLayout = calculateCubeLayout(
    CUBE_SIZE,
    OFFSET,
    AREA_WIDTH,
    AREA_HEIGHT,
    PERSPECTIVE
  )

  const getCenter = (rect: { left: number; top: number; width: number; height: number }) => ({
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
    bottomY: rect.top + rect.height
  })

  const centers = Object.entries(areaLayout).reduce((acc, [id, rect]) => {
    // Map English area ID to Chinese area name for centers
    const chineseAreaName = areaNameMapping[id.toLowerCase()] || id;
    return {
      ...acc,
      [chineseAreaName]: getCenter(rect),
    };
  }, {} as Record<Area, { x: number; y: number; bottomY: number }>)


  return (
    <div className="relative w-full h-full overflow-hidden bg-white p-4">
      <svg 
        className="absolute inset-0 w-full h-full pointer-events-none" 
        viewBox="0 0 100 100" 
        preserveAspectRatio="xMidYMid meet"
        style={{
          maxWidth: '100%',
          maxHeight: '100%',
          overflow: 'hidden'
        }}
      >
        <style>
          {`
            @keyframes cube-rotate {
              0%, 100% { transform: rotateY(0deg); }
              50% { transform: rotateY(-10deg); }
            }
            .cube-container {
              transform-origin: center center;
              animation: cube-rotate 8s ease-in-out infinite;
              transform-style: preserve-3d;
            }
          `}
                  </style>
          <g className="cube-container">

          {/* Cube edges */}
          {/* Left face connections */}
          <line 
            x1={centers['使用场景'].x} y1={centers['使用场景'].y}
            x2={centers['使用场景+特性'].x} y2={centers['使用场景+特性'].y}
            stroke="#666" strokeWidth="0.3"
          />
          <line 
            x1={centers['使用场景+特性'].x} y1={centers['使用场景+特性'].y}
            x2={centers['特性'].x} y2={centers['特性'].y}
            stroke="#666" strokeWidth="0.3"
          />

          {/* Right face connections */}
          <line 
            x1={centers['使用场景'].x} y1={centers['使用场景'].y}
            x2={centers['使用场景+拼写'].x} y2={centers['使用场景+拼写'].y}
            stroke="#666" strokeWidth="0.3"
          />
          <line 
            x1={centers['使用场景+拼写'].x} y1={centers['使用场景+拼写'].y}
            x2={centers['拼写'].x} y2={centers['拼写'].y}
            stroke="#666" strokeWidth="0.3"
          />

          {/* Bottom connections */}
          <line 
            x1={centers['特性'].x} y1={centers['特性'].y}
            x2={centers['特性+拼写'].x} y2={centers['特性+拼写'].y}
            stroke="#666" strokeWidth="0.3"
          />
          <line 
            x1={centers['特性+拼写'].x} y1={centers['特性+拼写'].y}
            x2={centers['拼写'].x} y2={centers['拼写'].y}
            stroke="#666" strokeWidth="0.3"
          />

          {/* Center connections */}
          <line 
            x1={centers['使用场景+特性'].x} y1={centers['使用场景+特性'].y}
            x2={centers['全部满足'].x} y2={centers['全部满足'].y}
            stroke="#666" strokeWidth="0.3"
          />
          <line 
            x1={centers['使用场景+拼写'].x} y1={centers['使用场景+拼写'].y}
            x2={centers['全部满足'].x} y2={centers['全部满足'].y}
            stroke="#666" strokeWidth="0.3"
          />
          <line 
            x1={centers['特性+拼写'].x} y1={centers['特性+拼写'].y}
            x2={centers['全部满足'].x} y2={centers['全部满足'].y}
            stroke="#666" strokeWidth="0.3"
          />
        </g>
      </svg>

      {/* Render the area rectangles */}
      {Object.entries(areaLayout).map(([areaId, layout]) => {
        // Map the English area ID to the actual area name in areaWords
        const actualAreaId = areaNameMapping[areaId.toLowerCase()] || areaId as Area;
        
        return (
          <AreaComponent
            key={areaId}
            id={actualAreaId}
            words={areaWords[actualAreaId] || []}
            left={layout.left}
            top={layout.top}
            width={layout.width}
            height={layout.height}
            showRuleDescriptions={showRuleDescriptions}
            rules={rules}
            onSelectWord={onSelectWord}
            transparency={transparency}
          />
        );
      })}
    </div>
  )
}

export default SetDiagram 