import { DragDropContext, Droppable, Draggable, type DroppableProvided, type DraggableProvided } from "@hello-pangea/dnd"

type Word = {
  id: string
  content: string
}

type WordListProps = {
  words: Word[]
  onSelectWord?: (word: Word) => void
}

export default function WordList({ words, onSelectWord }: WordListProps) {
  return (
    <div className="bg-gray-100 p-4 rounded-lg h-full flex flex-col">
      <h2 className="text-xl font-semibold mb-4">Word List</h2>
      <Droppable droppableId="wordList">
        {(provided: DroppableProvided) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className="h-full bg-gray-100 p-4 rounded"
          >
            <div className="flex flex-wrap gap-2">
              {words.map((word, index) => (
                <Draggable key={word.id} draggableId={word.id} index={index}>
                  {(provided: DraggableProvided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className="bg-white rounded-full px-2 py-1 text-sm shadow inline-block whitespace-nowrap cursor-pointer hover:bg-blue-50"
                      style={provided.draggableProps.style}
                      onClick={() => onSelectWord && onSelectWord(word)}
                    >
                      {word.content}
                    </div>
                  )}
                </Draggable>
              ))}
            </div>
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  )
}

