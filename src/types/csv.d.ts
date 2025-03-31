declare module '*.csv' {
  const content: string
  export default content
}

declare module '*/rules.csv' {
  const content: {
    id: string
    question: string
    type: 'Context' | 'Property' | 'Wording'
  }[]
  export default content
}

declare module '*/words.csv' {
  const content: {
    id: string
    word: string
  }[]
  export default content
} 