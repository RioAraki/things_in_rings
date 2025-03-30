import { Droppable, Draggable } from "@hello-pangea/dnd"
import { type Area } from "../types/area"
import { type Word } from "../types/word"

// Rename VennDiagramProps to SetDiagramProps
type SetDiagramProps = {
  areaWords: Record<Area, Word[]>
  // Remove areaSafeZones since we're not using it anymore
  setAreaWords: React.Dispatch<React.SetStateAction<Record<Area, Word[]>>>
}

const getAreaColor = (area: Area): string => {
  switch (area) {
    // Primary sets with more vivid colors
    case 'Context':
      return '#ffcccb'; // More saturated light red
    case 'Property':
      return '#c1f0c1'; // More saturated light green
    case 'Wording':
      return '#c7c7ff'; // More saturated light blue
      
    // Intersection sets with more vivid mixed colors
    case 'Context+Property':
      return '#ffec99'; // More saturated light yellow (red + green)
    case 'Context+Wording':
      return '#f5c6ff'; // More saturated light purple (red + blue)
    case 'Property+Wording':
      return '#a8e6e6'; // More saturated light cyan (green + blue)
      
    // Triple intersection - slightly more colorful
    case 'All':
      return '#e2e2f0'; // Light lavender gray (all mixed)
    
    // None rectangle - significantly darker
    case 'None':
      return '#595959'; // Dark gray
      
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
}: {
  id: Area
  words: Word[]
  left: number
  top: number
  width: number
  height: number
}) => (
  <Droppable 
    droppableId={id}
    direction="horizontal"
    isDropDisabled={false}
  >
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
          overflow: 'auto',
          pointerEvents: 'auto'
        }}
      >
        <div className={`text-sm font-medium mb-1 text-center ${id === 'None' ? 'text-white' : 'text-black'}`}>
          {id}
        </div>
        <div 
          style={{ 
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            alignContent: 'flex-start',
            gap: '4px',
            height: 'calc(100% - 2rem)',
            overflow: 'auto',
            pointerEvents: 'auto'
          }}
        >
          {words.map((word, index) => (
            <Draggable 
              key={word.id} 
              draggableId={word.id} 
              index={index}
              isDragDisabled={word.isPlaced === true}
            >
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.draggableProps}
                  {...provided.dragHandleProps}
                  className={`
                    bg-white rounded-full px-2 py-1 text-sm shadow 
                    whitespace-nowrap
                    ${snapshot.isDragging ? 'opacity-50' : 'opacity-100'}
                    ${word.isPlaced ? 'cursor-default opacity-80' : 'cursor-grab'}
                  `}
                  style={{
                    ...provided.draggableProps.style,
                    display: 'inline-block',
                    width: 'auto',
                    userSelect: 'none',
                    cursor: word.isPlaced ? 'default' : 'grab',
                    zIndex: snapshot.isDragging ? 9999 : 'auto'
                  }}
                >
                  {word.content}
                </div>
              )}
            </Draggable>
          ))}
          {provided.placeholder}
        </div>
      </div>
    )}
  </Droppable>
)

type Point = {
  x: number
  y: number
}

export default function SetDiagram({ areaWords, setAreaWords }: SetDiagramProps) {
  const AREA_WIDTH = 25
  const AREA_HEIGHT = 20
  const TRIANGLE_HEIGHT = 75  
  const TRIANGLE_BASE = 90    
  const OFFSET = { x: 0, y: 5 }
  
  // Define specific offsets for the intersection areas
  const AB_OFFSET = { x: -17, y: 0 }  // Move AB slightly to the left
  const AC_OFFSET = { x: 17, y: 0 }   // Move AC slightly to the right
  const ABC_OFFSET = { x: 0, y: -3 } // Move ABC slightly up
  const BC_OFFSET = { x: 0, y: -3 }   // Move BC slightly down

  // Helper function to format points for display
  const formatPoint = (p: {x: number, y: number}) => `(${p.x.toFixed(1)}, ${p.y.toFixed(1)})`
  
  // Move the calculateSetLayout function inside the component
  function calculateSetLayout(
    triangleHeight: number,
    base: number,
    offset: Point,
    areaWidth: number,
    areaHeight: number,
    // Add new offset parameters with default values (0,0)
    abOffset: Point = { x: 0, y: 0 },
    acOffset: Point = { x: 0, y: 0 },
    abcOffset: Point = { x: 0, y: 0 },
    bcOffset: Point = { x: 0, y: 0 }
  ) {
    // Helper to calculate triangle points
    const calculateTrianglePoints = () => {
      // Calculate positions based on height and base
      const topPoint = { x: offset.x + base/2, y: offset.y }
      const leftPoint = { x: offset.x, y: offset.y + triangleHeight }
      const rightPoint = { x: offset.x + base, y: offset.y + triangleHeight }
      
      // Midpoints of sides
      const leftMid = { x: (topPoint.x + leftPoint.x)/2, y: (topPoint.y + leftPoint.y)/2 }
      const rightMid = { x: (topPoint.x + rightPoint.x)/2, y: (topPoint.y + rightPoint.y)/2 }
      const bottomMid = { x: (leftPoint.x + rightPoint.x)/2, y: leftPoint.y }
      
      // Center point - calculate true centroid of triangle
      const center = { 
        x: (topPoint.x + leftPoint.x + rightPoint.x) / 3, 
        y: (topPoint.y + leftPoint.y + rightPoint.y) / 3 
      }
            
      return {
        topPoint,
        leftPoint,
        rightPoint,
        leftMid,
        rightMid,
        bottomMid,
        center
      }
    }

    const points = calculateTrianglePoints()
    
    // Convert points to area layouts with width/height
    return {
      Context: { 
        left: points.topPoint.x - areaWidth/2, 
        top: points.topPoint.y,
        width: areaWidth, 
        height: areaHeight 
      },
      'Context+Property': { 
        left: points.leftPoint.x, 
        top: points.leftPoint.y - areaHeight/2,
        width: areaWidth, 
        height: areaHeight 
      },
      'Context+Wording': { 
        left: points.rightPoint.x - areaWidth, 
        top: points.rightPoint.y - areaHeight/2,
        width: areaWidth, 
        height: areaHeight 
      },
      'All': { 
        left: points.leftMid.x + abOffset.x, 
        top: points.leftMid.y - areaHeight/2 + abOffset.y,
        width: areaWidth, 
        height: areaHeight 
      },
      'Property': { 
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
      'Wording': { 
        left: points.center.x - areaWidth/2 + abcOffset.x, 
        top: points.center.y - areaHeight/2 + abcOffset.y,
        width: areaWidth, 
        height: areaHeight 
      },
      'None': {
        left: points.topPoint.x + areaWidth/2 + 5, // A's right edge + 5% spacing 
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
      {/* SVG viewBox needs to match the container dimensions */}
      <svg 
        className="absolute inset-0 w-full h-full pointer-events-none" 
        viewBox="0 0 100 100" 
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Keep your line connections... */}
      </svg>

      {/* Render the area rectangles */}
      {Object.entries(areaLayout).map(([areaId, layout]) => (
        <AreaComponent
          key={areaId}
          id={areaId as Area}
          words={areaWords[areaId as Area] || []}
          {...layout}
        />
      ))}
    </div>
  )
} 