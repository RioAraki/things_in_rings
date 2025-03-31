declare module '*.json' {
  const value: {
    words?: {
      id: string
      word: string
      questions: {
        ruleId: number
        result: boolean
      }[]
    }[]
    rules?: {
      id: number
      question: string
      type: 'Context' | 'Property' | 'Wording'
    }[]
  }
  export default value
} 