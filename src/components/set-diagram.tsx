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
    case 'A':
      return '#f3f4f6' // gray-100
    case 'B':
      return '#f3f4f6'
    case 'C':
      return '#f3f4f6'
    case 'AB':
      return '#fef3c7' // amber-100
    case 'BC':
      return '#fef3c7'
    case 'AC':
      return '#fef3c7'
    case 'ABC':
      return '#e0f2fe' // sky-100
    default:
      return '#ffffff'
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
        <div className="text-sm font-medium mb-1 text-center">{id}</div>
        <div className="flex flex-wrap gap-1 justify-center items-start overflow-y-auto h-[calc(100%-2rem)]">
          {words.map((word, index) => (
            <Draggable key={word.id} draggableId={word.id} index={index}>
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.draggableProps}
                  {...provided.dragHandleProps}
                  className="bg-white rounded-full px-2 py-1 text-sm shadow inline-block whitespace-nowrap"
                  style={provided.draggableProps.style}
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

export default function SetDiagram({ areaWords }: SetDiagramProps) {
  const AREA_WIDTH = 30
  const AREA_HEIGHT = 20
  const TRIANGLE_HEIGHT = 80  
  const TRIANGLE_BASE = 120    
  const OFFSET = { x: 0, y: 5 }
  
  // Define specific offsets for the intersection areas
  const AB_OFFSET = { x: -20, y: 0 }  // Move AB slightly to the left
  const AC_OFFSET = { x: 20, y: 0 }   // Move AC slightly to the right
  const ABC_OFFSET = { x: 0, y: -5 } // Move ABC slightly up
  const BC_OFFSET = { x: 0, y: 0 }   // Move BC slightly down

  // Debug mode flag
  const DEBUG = false
  
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
      
      // Debug log for triangle points
      if (DEBUG) {
        console.group('Triangle Points:')
        console.log(`A (top): ${formatPoint(topPoint)}`)
        console.log(`B (left): ${formatPoint(leftPoint)}`)
        console.log(`C (right): ${formatPoint(rightPoint)}`)
        console.log(`AB (left mid): ${formatPoint(leftMid)}`)
        console.log(`AC (right mid): ${formatPoint(rightMid)}`)
        console.log(`BC (bottom mid): ${formatPoint(bottomMid)}`)
        console.log(`ABC (center): ${formatPoint(center)}`)
        console.log(`Triangle height: ${triangleHeight.toFixed(1)}`)
        console.log(`Triangle base: ${base.toFixed(1)}`)
        console.groupEnd()
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
      A: { 
        left: points.topPoint.x - areaWidth/2, 
        top: points.topPoint.y,
        width: areaWidth, 
        height: areaHeight 
      },
      B: { 
        left: points.leftPoint.x, 
        top: points.leftPoint.y - areaHeight/2,
        width: areaWidth, 
        height: areaHeight 
      },
      C: { 
        left: points.rightPoint.x - areaWidth, 
        top: points.rightPoint.y - areaHeight/2,
        width: areaWidth, 
        height: areaHeight 
      },
      AB: { 
        left: points.leftMid.x + abOffset.x, 
        top: points.leftMid.y - areaHeight/2 + abOffset.y,
        width: areaWidth, 
        height: areaHeight 
      },
      AC: { 
        left: points.rightMid.x - areaWidth + acOffset.x, 
        top: points.rightMid.y - areaHeight/2 + acOffset.y,
        width: areaWidth, 
        height: areaHeight 
      },
      BC: { 
        left: points.bottomMid.x - areaWidth/2 + bcOffset.x, 
        top: points.bottomMid.y - areaHeight/2 + bcOffset.y,
        width: areaWidth, 
        height: areaHeight 
      },
      ABC: { 
        left: points.center.x - areaWidth/2 + abcOffset.x, 
        top: points.center.y - areaHeight/2 + abcOffset.y,
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

  // Debug log for area layouts
  if (DEBUG) {
    console.group('Area Layouts:')
    Object.entries(areaLayout).forEach(([area, rect]) => {
      console.log(`${area}: left=${rect.left.toFixed(1)}, top=${rect.top.toFixed(1)}, width=${rect.width}, height=${rect.height}`)
    })
    console.groupEnd()
  }

  const getCenter = (rect: { left: number; top: number; width: number; height: number }) => ({
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
    bottomY: rect.top + rect.height
  })

  const centers = Object.entries(areaLayout).reduce((acc, [id, rect]) => ({
    ...acc,
    [id]: getCenter(rect),
  }), {} as Record<Area, { x: number; y: number; bottomY: number }>)

  // Debug log for center points
  if (DEBUG) {
    console.group('Center Points:')
    Object.entries(centers).forEach(([area, point]) => {
      console.log(`${area}: center=${formatPoint(point)}, bottomY=${point.bottomY.toFixed(1)}`)
    })
    console.groupEnd()
  }

  // Visual representation of the debug data in the UI
  const DebugOverlay = () => (
    DEBUG ? (
      <div className="absolute top-0 right-0 bg-white bg-opacity-80 p-3 text-xs font-mono max-w-xs max-h-96 overflow-auto">
        <h3 className="font-bold mb-1">Debug Info:</h3>
        <div className="mb-2">
          <strong>Triangle:</strong> Height: {TRIANGLE_HEIGHT}, Base: {TRIANGLE_BASE}, Offset: {formatPoint(OFFSET)}
        </div>
        <div className="mb-2">
          <strong>Area Size:</strong> W: {AREA_WIDTH}, H: {AREA_HEIGHT}
        </div>
        <div className="mb-2">
          <strong>Additional Offsets:</strong><br/>
          AB: {formatPoint(AB_OFFSET)}<br/>
          AC: {formatPoint(AC_OFFSET)}<br/>
          ABC: {formatPoint(ABC_OFFSET)}<br/>
          BC: {formatPoint(BC_OFFSET)}
        </div>
        <div>
          <strong>Centers:</strong>
          <ul className="list-disc pl-4">
            {Object.entries(centers).map(([area, point]) => (
              <li key={area}>
                {area}: {formatPoint(point)}
              </li>
            ))}
          </ul>
        </div>
      </div>
    ) : null
  )

  return (
    <div className="relative w-full h-full bg-white p-4">
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
        {/* Draw lines between centers */}
        <line 
          x1={centers.A.x} y1={centers.A.y} 
          x2={centers.AB.x} y2={centers.AB.y} 
          stroke="#666" strokeWidth="0.5" 
        />
        <line 
          x1={centers.A.x} y1={centers.A.y} 
          x2={centers.AC.x} y2={centers.AC.y} 
          stroke="#666" strokeWidth="0.5" 
        />

        {/* Keep the rest of the lines the same */}
        <line 
          x1={centers.AB.x} y1={centers.AB.y} 
          x2={centers.B.x} y2={centers.B.y} 
          stroke="#666" strokeWidth="0.5" 
        />
        <line 
          x1={centers.AC.x} y1={centers.AC.y} 
          x2={centers.C.x} y2={centers.C.y} 
          stroke="#666" strokeWidth="0.5" 
        />
        <line 
          x1={centers.B.x} y1={centers.B.y} 
          x2={centers.BC.x} y2={centers.BC.y} 
          stroke="#666" strokeWidth="0.5" 
        />
        <line 
          x1={centers.BC.x} y1={centers.BC.y} 
          x2={centers.C.x} y2={centers.C.y} 
          stroke="#666" strokeWidth="0.5" 
        />
        <line 
          x1={centers.AB.x} y1={centers.AB.y} 
          x2={centers.ABC.x} y2={centers.ABC.y} 
          stroke="#666" strokeWidth="0.5" 
        />
        <line 
          x1={centers.AC.x} y1={centers.AC.y} 
          x2={centers.ABC.x} y2={centers.ABC.y} 
          stroke="#666" strokeWidth="0.5" 
        />
        <line 
          x1={centers.BC.x} y1={centers.BC.y} 
          x2={centers.ABC.x} y2={centers.ABC.y} 
          stroke="#666" strokeWidth="0.5" 
        />
      </svg>

      {/* Render areas */}
      {Object.entries(areaLayout).map(([areaId, layout]) => (
        <AreaComponent
          key={areaId}
          id={areaId as Area}
          words={areaWords[areaId as Area] || []}
          {...layout}
        />
      ))}
      
      {/* Add debug overlay */}
      <DebugOverlay />
    </div>
  )
} 