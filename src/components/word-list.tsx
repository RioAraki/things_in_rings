import { DragDropContext, Droppable, Draggable, type DroppableProvided, type DraggableProvided } from "@hello-pangea/dnd"
import { useTranslation } from 'react-i18next'
import { type Word } from "../types/word"

type WordListProps = {
  words: Word[]
  onSelectWord?: (word: Word) => void
  correctWordCount?: number
}

export default function WordList({ words, onSelectWord, correctWordCount = 0 }: WordListProps) {
  const { t } = useTranslation();
  const remainingWords = 5 - correctWordCount;
  
  return (
    <div className="bg-gray-100 p-4 rounded-lg h-full flex flex-col">
      <h2 className="text-xl font-semibold mb-4 flex items-center justify-between">
        <span>{(t as any)('ui.wordList')}</span>
        <span className="bg-white px-3 py-1 rounded-full shadow-sm border border-gray-200 font-bold text-base">
          <span className="text-blue-600">{remainingWords}</span>
          <span className="text-gray-500"> / </span>
          <span className="text-gray-700">5</span>
        </span>
      </h2>
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
                      {word.word}
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

