import { type Rule, type RuleType } from '../types/rule'
import contextRules from '../resources/data/rules/context_rules.json'
import propertyRules from '../resources/data/rules/property_rules.json'
import wordingRules from '../resources/data/rules/wording_rules.json'
import { type WordQuestion } from '../types/word'
import { getWordById } from './words'
import { type Area } from '../types/area'

// Helper function to get a random item from an array
const getRandomItem = <T>(array: T[]): T => {
  const randomIndex = Math.floor(Math.random() * array.length);
  return array[randomIndex];
};

// Function to get a new set of randomly selected rules
function getRandomRules() {
  return {
    Context: getRandomItem(contextRules.rules).id,
    Property: getRandomItem(propertyRules.rules).id,
    Wording: getRandomItem(wordingRules.rules).id
  };
}

// Keep the selected rules in a variable that can be updated
let SELECTED_RULES = getRandomRules();

// Helper function to get rule by ID from the new structure
const findRuleById = (id: number) => {
  const allRules = [
    ...contextRules.rules,
    ...propertyRules.rules,
    ...wordingRules.rules
  ];
  return allRules.find(r => r.id === id);
};

// Helper function to normalize question data
function normalizeQuestion(question: any): WordQuestion {
  return {
    ruleId: question.ruleId,
    result: typeof question.result === 'string' ? question.result.toLowerCase() === 'true' : Boolean(question.result),
    reason: question.reason
  };
}

// Helper function to find a question by rule ID
const findQuestionByRuleId = (questions: any[], ruleId: number): WordQuestion | undefined => {
  const question = questions.find(q => q.ruleId === ruleId);
  return question ? normalizeQuestion(question) : undefined;
};

// Function to create rules based on selected IDs
function createRules(selectedRules: typeof SELECTED_RULES): Rule[] {
  return [
    {
      id: selectedRules.Context,
      type: 'context',
      description: findRuleById(selectedRules.Context)?.question || 'Unknown context rule',
      check: (wordId: string) => {
        const wordData = getWordById(wordId);
        const question = wordData?.questions 
          ? findQuestionByRuleId(wordData.questions, selectedRules.Context)
          : undefined;
        return question ? question.result : false;
      }
    },
    {
      id: selectedRules.Property,
      type: 'property',
      description: findRuleById(selectedRules.Property)?.question || 'Unknown property rule',
      check: (wordId: string) => {
        const wordData = getWordById(wordId);
        const question = wordData?.questions 
          ? findQuestionByRuleId(wordData.questions, selectedRules.Property)
          : undefined;
        return question ? question.result : false;
      }
    },
    {
      id: selectedRules.Wording,
      type: 'wording',
      description: findRuleById(selectedRules.Wording)?.question || 'Unknown wording rule',
      check: (wordId: string) => {
        const wordData = getWordById(wordId);
        const question = wordData?.questions 
          ? findQuestionByRuleId(wordData.questions, selectedRules.Wording)
          : undefined;
        return question ? question.result : false;
      }
    }
  ];
}

// Keep the current rules in a variable that can be updated
let currentRules = createRules(SELECTED_RULES);

export const getRules = (): Rule[] => currentRules;

// Add function to reset rules with new random selection
export function resetRules(): void {
  SELECTED_RULES = getRandomRules();
  currentRules = createRules(SELECTED_RULES);
}

export function getRulesByType(type: RuleType): Rule[] {
  return getRules().filter(rule => rule.type === type)
}

export function getRuleById(id: number): Rule | undefined {
  return getRules().find(rule => rule.id === id)
}

// Helper function to check a single rule
function checkSingleRule(wordId: string, type: 'Context' | 'Property' | 'Wording'): boolean {
  const rules = getRulesByType(type.toLowerCase() as RuleType);
  return rules.some(rule => rule.check(wordId));
}

export const checkRule = (wordId: string, area: string): boolean => {
  // First handle the basic areas
  if (area === 'Context' || area === 'Property' || area === 'Wording') {
    return checkSingleRule(wordId, area as 'Context' | 'Property' | 'Wording');
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
  // Get the results for all three basic rules
  const contextResult = checkSingleRule(wordId, 'Context');
  const propertyResult = checkSingleRule(wordId, 'Property');
  const wordingResult = checkSingleRule(wordId, 'Wording');

  // Count how many rules are true
  const trueCount = [contextResult, propertyResult, wordingResult].filter(Boolean).length;

  // If all rules are false, it belongs in None
  if (trueCount === 0) {
    return 'None';
  }

  // If all three rules are true, it belongs in All
  if (trueCount === 3) {
    return 'All';
  }

  // If exactly two rules are true, it belongs in one of the combination areas
  if (trueCount === 2) {
    if (contextResult && propertyResult) return 'Context+Property';
    if (contextResult && wordingResult) return 'Context+Wording';
    if (propertyResult && wordingResult) return 'Property+Wording';
  }

  // If exactly one rule is true, it belongs in that basic area
  if (trueCount === 1) {
    if (contextResult) return 'Context';
    if (propertyResult) return 'Property';
    if (wordingResult) return 'Wording';
  }

  return null;
}; 