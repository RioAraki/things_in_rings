import React from 'react'
import { Droppable, Draggable } from "@hello-pangea/dnd"
import { type Area } from "../types/area"
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
}

const getAreaColor = (area: Area): string => {
  switch (area) {
    // Primary faces with vivid colors
    case 'Context':
      return '#ff9999'; // Bright red for top face
    case 'Property':
      return '#42daf5'; // RGB(66, 218, 245) - bright cyan-blue
    case 'Wording':
      return '#99ff99'; // Bright green for right face
    
    // Intersection areas with mixed colors
    case 'Context+Property':
      return '#b3bff5'; // Purple-blue (red + cyan-blue mix)
    case 'Context+Wording':
      return '#ffcc99'; // Orange (red + green mix)
    case 'Property+Wording':
      return '#6decc7'; // Turquoise (cyan-blue + green mix)
    
    // Center intersection
    case 'All':
      return '#e8e8ff'; // Brighter light blue-gray
    
    // None area
    case 'None':
      return '#f0f0f0'; // Light gray
    
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
  rules
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
}) => {
  // Function to get the title based on the area and whether to show rules
  const getAreaTitle = (): React.ReactNode => {
    if (!showRuleDescriptions) {
      return id; // Just show the area name if not showing rules
    }
    
    // For simple areas, show the associated rule with prefix
    if (id === 'Context' && rules?.context) {
      return (
        <div>
          <span className="font-bold block mb-1">Context:</span>
          {rules.context}
        </div>
      );
    }
    if (id === 'Property' && rules?.property) {
      return (
        <div>
          <span className="font-bold block mb-1">Property:</span>
          {rules.property}
        </div>
      );
    }
    if (id === 'Wording' && rules?.wording) {
      return (
        <div>
          <span className="font-bold block mb-1">Wording:</span>
          {rules.wording}
        </div>
      );
    }
    
    // For combination areas, add a title with styling
    if (id.includes('+')) {
      return (
        <div className="text-sm font-bold">{id}</div>
      );
    }
    
    // For All or None
    return <div className="text-sm font-bold">{id}</div>;
  };

  // Get the title text based on current state
  const areaTitle = getAreaTitle();
  
  // For the tooltip, we need a string value
  const tooltipTitle = (() => {
    if (typeof areaTitle === 'string') return areaTitle;
    if (id === 'Context' && rules?.context) return `Context: ${rules.context}`;
    if (id === 'Property' && rules?.property) return `Property: ${rules.property}`;
    if (id === 'Wording' && rules?.wording) return `Wording: ${rules.wording}`;
    return id;
  })();

  // Check if any word in this area was just auto-moved here
  const hasNewAutoMovedWord = words.some(w => w.wasAutoMoved);

  // Check if any word was just correctly placed here (either by user or auto-moved)
  const hasNewCorrectWord = words.some(w => w.isCorrect && !w.isAutoMoved);

  // Generate a unique key for the animation based on the words in this area
  const animationKey = words.filter(w => w.isCorrect || w.wasAutoMoved).length;

  return (
    <Droppable droppableId={id}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          key={`${id}-${animationKey}`}
          className={`
            absolute border-[1.5px] rounded-lg p-2
            ${snapshot.isDraggingOver ? "border-blue-500 bg-blue-50" : "border-gray-400"}
            ${(hasNewAutoMovedWord || hasNewCorrectWord) ? "animate-highlight" : ""}
            transition-all duration-200 backdrop-blur-[2px]
            shadow-[0_8px_16px_rgba(0,0,0,0.2)]
          `}
          style={{
            left: `${left}%`,
            top: `${top}%`,
            width: `${width}%`,
            height: `${height}%`,
            backgroundColor: getAreaColor(id),
            boxShadow: '0 8px 16px rgba(0,0,0,0.2), 0 2px 4px rgba(0,0,0,0.1), 0 0 1px rgba(0,0,0,0.1)',
            backdropFilter: 'blur(2px)',
            zIndex: id === 'All' ? 2 : 1,
            transform: 'translateY(-1px)', // Subtle lift effect
          }}
        >
          <div 
            className={`
              mb-1 text-center 
              ${showRuleDescriptions 
                ? 'text-xs md:text-sm font-bold py-2 px-2 bg-white/90 rounded shadow-sm' 
                : 'text-sm font-semibold'}
              text-gray-700 relative z-10
            `} 
            title={tooltipTitle}
            style={{
              overflow: 'hidden',
              maxWidth: '100%',
              lineHeight: '1.3',
              textShadow: '0 1px 3px rgba(255,255,255,0.8)',
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
                      rounded-full px-2 py-1 text-sm shadow-sm inline-block whitespace-nowrap
                      transition-all duration-700 ease-in-out
                      ${word.isAutoMoved ? 'scale-75 opacity-0' : 'scale-100 opacity-100'}
                      ${word.isChecked ? 'opacity-80' : ''}
                      ${snapshot.isDragging ? 'shadow-md' : 'shadow-sm'}
                    `}
                    style={{
                      ...provided.draggableProps.style,
                      backgroundColor: word.isChecked 
                        ? (word.isCorrect 
                            ? (word.wasAutoMoved ? '#fef08a' : '#86efac') // yellow for system-corrected, green for user-correct
                            : '#fca5a5') // red for incorrect
                        : 'white',
                      cursor: word.isChecked ? 'not-allowed' : 'grab',
                      transition: 'all 0.7s ease-in-out',
                      transform: `${provided.draggableProps.style?.transform || ''} ${
                        word.isAutoMoved ? 'scale(0.75)' : 'scale(1)'
                      }`,
                      opacity: word.isAutoMoved ? 0 : 1,
                      border: word.isChecked && word.isCorrect 
                        ? (word.wasAutoMoved 
                            ? '2px dashed #eab308' // dashed border for system-corrected
                            : '2px solid #22c55e') // solid border for user-correct
                        : 'none',
                      paddingRight: word.isChecked ? '22px' : '8px',
                      boxShadow: snapshot.isDragging 
                        ? '0 4px 6px rgba(0,0,0,0.1)' 
                        : '0 1px 2px rgba(0,0,0,0.1)',
                    }}
                  >
                    {word.word}
                    {word.isChecked && (
                      <span 
                        className="absolute right-1 text-xs" 
                        style={{ 
                          top: '50%', 
                          transform: 'translateY(-50%)'
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
  rules = {}
}) => {
  // Base dimensions for cube layout
  const AREA_WIDTH = 20
  const AREA_HEIGHT = 18
  const CUBE_SIZE = 100
  // Base size of the cube
  const OFFSET = { x: 0, y: 0 }  // Starting position offset
  const PERSPECTIVE = 0.6  // Perspective factor (0-1)
  
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
      Context: {
        left: topFaceCenter.x - areaWidth/2,
        top: topFaceCenter.y - areaHeight/2,
        width: areaWidth,
        height: areaHeight
      },
      Property: {
        left: propertyCenter.x - areaWidth/2,
        top: propertyCenter.y - areaHeight/2,
        width: areaWidth,
        height: areaHeight
      },
      Wording: {
        left: wordingCenter.x - areaWidth/2,
        top: wordingCenter.y - areaHeight/2,
        width: areaWidth,
        height: areaHeight
      },

      // Edge intersections
      'Context+Property': {
        left: contextPropertyCenter.x - areaWidth/2,
        top: contextPropertyCenter.y - areaHeight/2,
        width: areaWidth,
        height: areaHeight
      },
      'Context+Wording': {
        left: contextWordingCenter.x - areaWidth/2,
        top: contextWordingCenter.y - areaHeight/2,
        width: areaWidth,
        height: areaHeight
      },
      'Property+Wording': {
        left: propertyWordingCenter.x - areaWidth/2,
        top: propertyWordingCenter.y - areaHeight/2,
        width: areaWidth,
        height: areaHeight
      },

      // Center intersection
      'All': {
        left: allCenter.x - areaWidth/2,
        top: allCenter.y - areaHeight/2,
        width: areaWidth,
        height: areaHeight
      },

      // None area - placed to the left of Context
      'None': {
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

  const centers = Object.entries(areaLayout).reduce((acc, [id, rect]) => ({
    ...acc,
    [id]: getCenter(rect),
  }), {} as Record<Area, { x: number; y: number; bottomY: number }>)


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
        {/* Colored cube faces */}
        {/* Top face (darker red) */}
        <polygon 
          points={`
            ${centers.Context.x},${centers.Context.y}
            ${centers['Context+Property'].x},${centers['Context+Property'].y}
            ${centers.All.x},${centers.All.y}
            ${centers['Context+Wording'].x},${centers['Context+Wording'].y}
          `}
          fill="#cc3333"
          opacity="0.7"
        />
        
        {/* Left face (darker blue) */}
        <polygon 
          points={`
            ${centers['Context+Property'].x},${centers['Context+Property'].y}
            ${centers.Property.x},${centers.Property.y}
            ${centers['Property+Wording'].x},${centers['Property+Wording'].y}
            ${centers.All.x},${centers.All.y}
          `}
          fill="#0099cc"
          opacity="0.7"
        />
        
        {/* Right face (darker green) */}
        <polygon 
          points={`
            ${centers['Context+Wording'].x},${centers['Context+Wording'].y}
            ${centers.All.x},${centers.All.y}
            ${centers['Property+Wording'].x},${centers['Property+Wording'].y}
            ${centers.Wording.x},${centers.Wording.y}
          `}
          fill="#008833"
          opacity="0.7"
        />

        {/* Cube edges */}
        {/* Left face connections */}
        <line 
          x1={centers.Context.x} y1={centers.Context.y}
          x2={centers['Context+Property'].x} y2={centers['Context+Property'].y}
          stroke="#666" strokeWidth="0.3"
        />
        <line 
          x1={centers['Context+Property'].x} y1={centers['Context+Property'].y}
          x2={centers.Property.x} y2={centers.Property.y}
          stroke="#666" strokeWidth="0.3"
        />

        {/* Right face connections */}
        <line 
          x1={centers.Context.x} y1={centers.Context.y}
          x2={centers['Context+Wording'].x} y2={centers['Context+Wording'].y}
          stroke="#666" strokeWidth="0.3"
        />
        <line 
          x1={centers['Context+Wording'].x} y1={centers['Context+Wording'].y}
          x2={centers.Wording.x} y2={centers.Wording.y}
          stroke="#666" strokeWidth="0.3"
        />

        {/* Bottom connections */}
        <line 
          x1={centers.Property.x} y1={centers.Property.y}
          x2={centers['Property+Wording'].x} y2={centers['Property+Wording'].y}
          stroke="#666" strokeWidth="0.3"
        />
        <line 
          x1={centers['Property+Wording'].x} y1={centers['Property+Wording'].y}
          x2={centers.Wording.x} y2={centers.Wording.y}
          stroke="#666" strokeWidth="0.3"
        />

        {/* Center connections */}
        <line 
          x1={centers['Context+Property'].x} y1={centers['Context+Property'].y}
          x2={centers.All.x} y2={centers.All.y}
          stroke="#666" strokeWidth="0.3"
        />
        <line 
          x1={centers['Context+Wording'].x} y1={centers['Context+Wording'].y}
          x2={centers.All.x} y2={centers.All.y}
          stroke="#666" strokeWidth="0.3"
        />
        <line 
          x1={centers['Property+Wording'].x} y1={centers['Property+Wording'].y}
          x2={centers.All.x} y2={centers.All.y}
          stroke="#666" strokeWidth="0.3"
        />
      </svg>

      {/* Render the area rectangles */}
      {Object.entries(areaLayout).map(([areaId, layout]) => (
        <AreaComponent
          key={areaId}
          id={areaId as Area}
          words={areaWords[areaId as Area] || []}
          {...layout}
          showRuleDescriptions={showRuleDescriptions}
          rules={rules}
        />
      ))}
    </div>
  )
}

export default SetDiagram 