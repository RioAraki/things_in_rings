export type RuleType = 'context' | 'property' | 'wording';

export interface Rule {
  id: number;
  type: RuleType;
  description: string;
  check: (wordId: string) => boolean;
} 