import { Droppable, Draggable, type DropResult } from "@hello-pangea/dnd"

type Word = {
  id: string
  content: string
}

type Area = "A" | "B" | "C" | "AB" | "BC" | "AC" | "ABC" | "None"

type Anchor = {
  x: number
  y: number
}

type SafeZone = {
  x: number
  y: number
  width: number
  height: number
}

type VennDiagramProps = {
  areaWords: Record<Area, Word[]>
  areaSafeZones: Record<Area, SafeZone>
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
        <div className="flex flex-wrap gap-1 justify-center items-start">
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

export default function SetDiagram({ areaWords, setAreaWords }: VennDiagramProps) {
  // Define the layout for the rectangles
  const areaLayout = {
    A: { left: 40, top: 5, width: 20, height: 15 },
    AB: { left: 30, top: 25, width: 20, height: 15 },
    B: { left: 10, top: 45, width: 20, height: 15 },
    ABC: { left: 40, top: 45, width: 20, height: 15 },
    C: { left: 70, top: 45, width: 20, height: 15 },
    AC: { left: 50, top: 25, width: 20, height: 15 },
    BC: { left: 40, top: 65, width: 20, height: 15 },
  }

  return (
    <div className="relative w-full h-full bg-white p-4">
      {/* Draw connecting lines first */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
        {/* A to AB */}
        <line x1="50" y1="20" x2="40" y2="25" stroke="#666" strokeWidth="0.5" />
        {/* A to AC */}
        <line x1="50" y1="20" x2="60" y2="25" stroke="#666" strokeWidth="0.5" />
        {/* AB to B */}
        <line x1="40" y1="40" x2="20" y2="45" stroke="#666" strokeWidth="0.5" />
        {/* AB to ABC */}
        <line x1="40" y1="40" x2="50" y2="45" stroke="#666" strokeWidth="0.5" />
        {/* AC to ABC */}
        <line x1="60" y1="40" x2="50" y2="45" stroke="#666" strokeWidth="0.5" />
        {/* AC to C */}
        <line x1="60" y1="40" x2="80" y2="45" stroke="#666" strokeWidth="0.5" />
        {/* ABC to BC */}
        <line x1="50" y1="60" x2="50" y2="65" stroke="#666" strokeWidth="0.5" />
      </svg>

      {/* Render the area rectangles */}
      {Object.entries(areaLayout).map(([areaId, layout]) => (
        <AreaComponent
          key={areaId}
          id={areaId as Area}
          words={areaWords[areaId as Area]}
          {...layout}
        />
      ))}
    </div>
  )
}

