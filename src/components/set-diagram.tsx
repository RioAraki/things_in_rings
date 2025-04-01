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
    // Primary sets with more vivid colors
    case 'Context':
      return '#ffdddb'; // More saturated light red
    case 'Property':
      return '#d1ffd1'; // More saturated light green
    case 'Wording':
      return '#d7d7ff'; // More saturated light blue
      
    // Intersection sets with more vivid mixed colors
    case 'Context+Property':
      return '#fff3aa'; // More saturated light yellow (red + green)
    case 'Context+Wording':
      return '#f7d6ff'; // More saturated light purple (red + blue)
    case 'Property+Wording':
      return '#b8f6f6'; // More saturated light cyan (green + blue)
      
    // Triple intersection - slightly more colorful
    case 'All':
      return '#e8e8fa'; // Light lavender gray (all mixed)
    
    // None rectangle - medium gray instead of dark gray
    case 'None':
      return '#b3b3b3'; // Medium gray instead of very dark gray
      
    default:
      return '#ffffff'; // White as fallback
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

  return (
    <Droppable droppableId={id}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className={`
            absolute border-2 rounded-lg p-2
            ${snapshot.isDraggingOver ? "border-blue-500 bg-blue-50" : "border-gray-300"}
            transition-colors duration-200
          `}
          style={{
            left: `${left}%`,
            top: `${top}%`,
            width: `${width}%`,
            height: `${height}%`,
            backgroundColor: getAreaColor(id),
          }}
        >
          <div 
            className={`
              mb-1 text-center 
              ${showRuleDescriptions 
                ? 'text-xs md:text-sm font-bold py-2 px-2 bg-white/90 rounded shadow-sm' 
                : 'text-sm font-medium'
              }
            `} 
            title={tooltipTitle}
            style={{
              overflow: 'hidden',
              maxWidth: '100%',
              lineHeight: '1.3',
              ...(showRuleDescriptions 
                ? { 
                    minHeight: '3.5rem', 
                    maxHeight: '5rem',
                    overflowY: 'auto',
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    whiteSpace: 'normal',  // Allow text to wrap
                    overflowWrap: 'break-word', // Break long words if needed
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
                      rounded-full px-2 py-1 text-sm shadow inline-block whitespace-nowrap
                      transition-all duration-700 ease-in-out
                      ${word.isAutoMoved ? 'scale-75 opacity-0' : 'scale-100 opacity-100'}
                      ${word.isChecked ? 'opacity-80' : ''}
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
                      // Add border to make the distinction more clear
                      border: word.isChecked && word.isCorrect 
                        ? (word.wasAutoMoved 
                            ? '2px dashed #eab308' // dashed border for system-corrected
                            : '2px solid #22c55e') // solid border for user-correct
                        : 'none',
                      // Add subtle checkmark or info icon
                      paddingRight: word.isChecked ? '22px' : '8px',
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
  // Base dimensions
  const AREA_WIDTH = 25
  const AREA_HEIGHT = showRuleDescriptions ? 26 : 22 // Increase height when showing rules
  const TRIANGLE_HEIGHT = 80  // Taller triangle
  const TRIANGLE_BASE = 100   // Wider base
  const OFFSET = { x: 0, y: 0 }
  
  // Define specific offsets for proper positioning
  const AB_OFFSET = { x: -15, y: 0 }   // Context+Property
  const AC_OFFSET = { x: 15, y: 0 }    // Context+Wording
  const ABC_OFFSET = { x: 0, y: 0 }   // All
  const BC_OFFSET = { x: 0, y: 5 }    // Property+Wording

  // Helper function to format points for display
  const formatPoint = (p: {x: number, y: number}) => `(${p.x.toFixed(1)}, ${p.y.toFixed(1)})`
  
  // Move the calculateSetLayout function inside the component
  function calculateSetLayout(
    triangleHeight: number,
    base: number,
    offset: Point,
    areaWidth: number,
    areaHeight: number,
    abOffset: Point = { x: 0, y: 0 },
    acOffset: Point = { x: 0, y: 0 },
    abcOffset: Point = { x: 0, y: 0 },
    bcOffset: Point = { x: 0, y: 0 }
  ) {
    // Helper to calculate triangle points
    const calculateTrianglePoints = () => {
      // Calculate positions based on height and base
      const topPoint = { x: offset.x + base/2, y: offset.y }       // Context at top
      const leftPoint = { x: offset.x, y: offset.y + triangleHeight }  // Property at bottom left
      const rightPoint = { x: offset.x + base, y: offset.y + triangleHeight }  // Wording at bottom right
      
      // Midpoints of sides
      const leftMid = { x: (topPoint.x + leftPoint.x)/2, y: (topPoint.y + leftPoint.y)/2 }  // Context+Property
      const rightMid = { x: (topPoint.x + rightPoint.x)/2, y: (topPoint.y + rightPoint.y)/2 }  // Context+Wording
      const bottomMid = { x: (leftPoint.x + rightPoint.x)/2, y: leftPoint.y }  // Property+Wording
      
      // Center point - calculate true centroid of triangle
      const center = { 
        x: (topPoint.x + leftPoint.x + rightPoint.x) / 3, 
        y: (topPoint.y + leftPoint.y + rightPoint.y) / 3 
      }  // All
      
      return {
        topPoint,      // Context
        leftPoint,     // Property
        rightPoint,    // Wording
        leftMid,       // Context+Property 
        rightMid,      // Context+Wording
        bottomMid,     // Property+Wording
        center         // All
      }
    }

    const points = calculateTrianglePoints()
    
    // Convert points to area layouts with width/height
    return {
      // Main vertices of the triangle
      Context: { 
        left: points.topPoint.x - areaWidth/2, 
        top: points.topPoint.y,
        width: areaWidth, 
        height: areaHeight 
      },
      Property: { 
        left: points.leftPoint.x, 
        top: points.leftPoint.y - areaHeight/2,
        width: areaWidth, 
        height: areaHeight 
      },
      Wording: { 
        left: points.rightPoint.x - areaWidth, 
        top: points.rightPoint.y - areaHeight/2,
        width: areaWidth, 
        height: areaHeight 
      },
      
      // Intersections - along the edges of triangle
      'Context+Property': { 
        left: points.leftMid.x + abOffset.x, 
        top: points.leftMid.y - areaHeight/2 + abOffset.y,
        width: areaWidth, 
        height: areaHeight 
      },
      'Context+Wording': { 
        left: points.rightMid.x - areaWidth + acOffset.x, 
        top: points.rightMid.y - areaHeight/2 + acOffset.y,
        width: areaWidth, 
        height: areaHeight 
      },
      'Property+Wording': { 
        left: points.bottomMid.x - areaWidth/2 + bcOffset.x, 
        top: points.bottomMid.y - areaHeight/2 + bcOffset.y,
        width: areaWidth, 
        height: areaHeight 
      },
      
      // Center of the triangle
      'All': { 
        left: points.center.x - areaWidth/2 + abcOffset.x, 
        top: points.center.y - areaHeight/2 + abcOffset.y,
        width: areaWidth, 
        height: areaHeight 
      },
      
      // None rectangle to the right of Context
      'None': {
        left: points.topPoint.x + areaWidth/2 + 5, 
        top: points.topPoint.y,
        width: areaWidth,
        height: areaHeight
      }
    }
  }

  const areaLayout = calculateSetLayout(
    TRIANGLE_HEIGHT,
    TRIANGLE_BASE,
    OFFSET,
    AREA_WIDTH,
    AREA_HEIGHT,
    AB_OFFSET,    // Pass the AB offset
    AC_OFFSET,    // Pass the AC offset
    ABC_OFFSET,   // Pass the ABC offset
    BC_OFFSET     // Pass the BC offset
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
      >
        {/* Connect Context to Context+Property */}
        <line 
          x1={centers.Context.x} y1={centers.Context.y}
          x2={centers['Context+Property'].x} y2={centers['Context+Property'].y}
          stroke="#666" strokeWidth="0.5" 
        />
        
        {/* Connect Context to Context+Wording */}
        <line 
          x1={centers.Context.x} y1={centers.Context.y}
          x2={centers['Context+Wording'].x} y2={centers['Context+Wording'].y}
          stroke="#666" strokeWidth="0.5" 
        />
        
        {/* Connect Property to Context+Property */}
        <line 
          x1={centers.Property.x} y1={centers.Property.y}
          x2={centers['Context+Property'].x} y2={centers['Context+Property'].y}
          stroke="#666" strokeWidth="0.5" 
        />
        
        {/* Connect Property to Property+Wording */}
        <line 
          x1={centers.Property.x} y1={centers.Property.y}
          x2={centers['Property+Wording'].x} y2={centers['Property+Wording'].y}
          stroke="#666" strokeWidth="0.5" 
        />
        
        {/* Connect Wording to Context+Wording */}
        <line 
          x1={centers.Wording.x} y1={centers.Wording.y}
          x2={centers['Context+Wording'].x} y2={centers['Context+Wording'].y}
          stroke="#666" strokeWidth="0.5" 
        />
        
        {/* Connect Wording to Property+Wording */}
        <line 
          x1={centers.Wording.x} y1={centers.Wording.y}
          x2={centers['Property+Wording'].x} y2={centers['Property+Wording'].y}
          stroke="#666" strokeWidth="0.5" 
        />
        
        {/* Connect intersections to the All area */}
        <line 
          x1={centers['Context+Property'].x} y1={centers['Context+Property'].y}
          x2={centers.All.x} y2={centers.All.y}
          stroke="#666" strokeWidth="0.5" 
        />
        <line 
          x1={centers['Context+Wording'].x} y1={centers['Context+Wording'].y}
          x2={centers.All.x} y2={centers.All.y}
          stroke="#666" strokeWidth="0.5" 
        />
        <line 
          x1={centers['Property+Wording'].x} y1={centers['Property+Wording'].y}
          x2={centers.All.x} y2={centers.All.y}
          stroke="#666" strokeWidth="0.5" 
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