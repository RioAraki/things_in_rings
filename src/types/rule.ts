export type RuleType = 'context' | 'property' | 'wording';

export interface Rule {
  id: number;
  type: RuleType;
  question: string;
  check: (wordId: string) => boolean;
} 