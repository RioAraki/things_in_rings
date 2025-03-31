import { type Word } from '../types/word'
import wordsData from '../resources/data/words.json'

export function getWords(): Word[] {
  return (wordsData.words || []).map(word => ({
    ...word,
    isPlaced: false
  }))
}

export function getWordById(id: string): Word | undefined {
  return getWords().find(word => word.id === id)
}

export function getWordAnswerForRule(word: Word, ruleId: number): boolean | undefined {
  const question = word.questions.find(q => q.ruleId === ruleId)
  return question?.result
} 