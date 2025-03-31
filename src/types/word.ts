export type WordQuestion = {
  ruleId: number
  result: boolean
}

export type Word = {
  id: string    // Using string for the numeric ID to match drag-drop requirements
  word: string  // The actual word content
  questions: WordQuestion[]
  isPlaced?: boolean
  isChecked?: boolean
  isCorrect?: boolean
  isAutoMoved?: boolean  // Used for animation
  wasAutoMoved?: boolean // Used to track if word was system-corrected
} 