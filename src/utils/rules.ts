import { type Rule, type RuleType } from '../types/rule'
import rulesData from '../resources/data/rules.json'
import { Word } from '../types/word'
import wordsData from '../resources/data/words.json'
import { type Area } from '../types/area'

// Helper function to get a random item from an array
const getRandomItem = <T>(array: T[]): T => {
  const randomIndex = Math.floor(Math.random() * array.length);
  return array[randomIndex];
};

// Randomly select one rule from each type
const SELECTED_RULES = {
  Context: getRandomItem(rulesData.rulesByType.context).id,
  Property: getRandomItem(rulesData.rulesByType.property).id,
  Wording: getRandomItem(rulesData.rulesByType.wording).id
} as const;

// Helper function to get rule by ID from the new structure
const findRuleById = (id: number) => {
  const allRules = [
    ...rulesData.rulesByType.context,
    ...rulesData.rulesByType.property,
    ...rulesData.rulesByType.wording
  ];
  return allRules.find(r => r.id === id);
};

// Get the actual rule descriptions from rulesData
const rules: Rule[] = [
  {
    id: SELECTED_RULES.Context,
    type: 'context',
    description: findRuleById(SELECTED_RULES.Context)?.question || 'Unknown context rule',
    check: (wordId: string) => {
      const wordData = wordsData.words.find(w => w.id === wordId);
      return wordData?.questions.find(q => q.ruleId === SELECTED_RULES.Context)?.result ?? false;
    }
  },
  {
    id: SELECTED_RULES.Property,
    type: 'property',
    description: findRuleById(SELECTED_RULES.Property)?.question || 'Unknown property rule',
    check: (wordId: string) => {
      const wordData = wordsData.words.find(w => w.id === wordId);
      return wordData?.questions.find(q => q.ruleId === SELECTED_RULES.Property)?.result ?? false;
    }
  },
  {
    id: SELECTED_RULES.Wording,
    type: 'wording',
    description: findRuleById(SELECTED_RULES.Wording)?.question || 'Unknown wording rule',
    check: (wordId: string) => {
      const wordData = wordsData.words.find(w => w.id === wordId);
      return wordData?.questions.find(q => q.ruleId === SELECTED_RULES.Wording)?.result ?? false;
    }
  }
];

export const getRules = (): Rule[] => rules;

export function getRulesByType(type: RuleType): Rule[] {
  return getRules().filter(rule => rule.type === type)
}

export function getRuleById(id: number): Rule | undefined {
  return getRules().find(rule => rule.id === id)
}

// Update the checkSingleRule function to use our selected rules
const checkSingleRule = (wordId: string, area: 'Context' | 'Property' | 'Wording'): boolean => {
  const wordData = wordsData.words.find(w => w.id === wordId);
  if (!wordData) return false;

  const ruleId = SELECTED_RULES[area];
  return wordData.questions.find(q => q.ruleId === ruleId)?.result ?? false;
};

export const checkRule = (wordId: string, area: string): boolean => {
  // First handle the basic areas
  if (area === 'Context' || area === 'Property' || area === 'Wording') {
    return checkSingleRule(wordId, area);
  }

  // Get the results for all three basic rules
  const contextResult = checkSingleRule(wordId, 'Context');
  const propertyResult = checkSingleRule(wordId, 'Property');
  const wordingResult = checkSingleRule(wordId, 'Wording');

  // Handle combination areas
  switch (area) {
    case 'Context+Property':
      // Must be true for both Context AND Property, but false for Wording
      return contextResult && propertyResult && !wordingResult;

    case 'Context+Wording':
      // Must be true for both Context AND Wording, but false for Property
      return contextResult && wordingResult && !propertyResult;

    case 'Property+Wording':
      // Must be true for both Property AND Wording, but false for Context
      return propertyResult && wordingResult && !contextResult;

    case 'All':
      // Must be true for ALL three conditions
      return contextResult && propertyResult && wordingResult;

    case 'None':
      // Must be false for ALL three conditions
      return !contextResult && !propertyResult && !wordingResult;

    default:
      return false;
  }
};

export const findCorrectArea = (wordId: string): string | null => {
  const areas: Area[] = [
    'Context', 'Property', 'Wording',
    'Context+Property', 'Context+Wording', 'Property+Wording',
    'All', 'None'
  ];

  for (const area of areas) {
    if (checkRule(wordId, area)) {
      return area;
    }
  }
  return null;
}; 