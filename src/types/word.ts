export type WordQuestion = {
  ruleId: number
  result: boolean
  reason?: string
}

export interface Word {
  id: string;
  word: string;
  questions: WordQuestion[]
  isPlaced?: boolean
  isChecked?: boolean
  isCorrect?: boolean
  isAutoMoved?: boolean  // Used for animation
  wasAutoMoved?: boolean // Used to track if word was system-corrected
} 