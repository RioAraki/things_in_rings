<<<<<<< HEAD
import { type Rule, type RuleType } from '../types/rule'
import contextRules from '../resources/data/rules_zh/context_rules.json'
import propertyRules from '../resources/data/rules_zh/property_rules.json'
import wordingRules from '../resources/data/rules_zh/wording_rules.json'
=======
import contextRules from '../resources/data/rules/context_rules.json'
import propertyRules from '../resources/data/rules/property_rules.json'
import wordingRules from '../resources/data/rules/wording_rules.json'
import contextRulesZh from '../resources/data/rules_zh/context_rules.json'
import propertyRulesZh from '../resources/data/rules_zh/property_rules.json'
import wordingRulesZh from '../resources/data/rules_zh/wording_rule.json'
import rulesIndex from '../resources/data/rules_index.json'
>>>>>>> 760c1c8329778aef23a9ab83c57a76ffa8c64958
import { type WordQuestion } from '../types/word'
import { getWordById } from './words'
import { type RuleType } from '../types/rule'
import { LANGUAGE_CONFIG } from '../config/app-config'
import i18n from '../i18n/i18n'

interface Rule {
  id: number;
  question: string;
  difficulty: number;
  type?: RuleType;
  check?: (wordId: string) => boolean;
}

// Helper function to get a random item from an array
const getRandomItem = <T>(array: T[]): T => {
  const randomIndex = Math.floor(Math.random() * array.length);
  return array[randomIndex];
};

// Function to get rules based on current language
function getRulesByLanguage(): {
  context: Rule[];
  property: Rule[];
  wording: Rule[];
} {
  const isChinese = i18n.language === 'zh';
  
  return {
    context: isChinese ? (contextRulesZh as any).rules : (contextRules as any).rules,
    property: isChinese ? (propertyRulesZh as any).rules : (propertyRules as any).rules,
    wording: isChinese ? (wordingRulesZh as any).rules : (wordingRules as any).rules
  };
}

// Function to get a new set of randomly selected rules
function getRandomRules(count: number): Rule[] {
  const rules = getRulesByLanguage();
  const allRules = [...rules.context, ...rules.property, ...rules.wording];
  const shuffled = [...allRules].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// Keep the selected rules in a variable that can be updated
let SELECTED_RULES = getRandomRules(3);

// Helper function to get rule by ID from the new structure
const findRuleById = (id: number): Rule | undefined => {
  const rules = getRulesByLanguage();
  const allRules = [...rules.context, ...rules.property, ...rules.wording];
  return allRules.find(rule => rule.id === id);
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
      id: selectedRules[0].id,
      question: selectedRules[0].question,
      difficulty: selectedRules[0].difficulty
    },
    {
      id: selectedRules[1].id,
      question: selectedRules[1].question,
      difficulty: selectedRules[1].difficulty
    },
    {
      id: selectedRules[2].id,
      question: selectedRules[2].question,
      difficulty: selectedRules[2].difficulty
    }
  ];
}

// Keep the current rules in a variable that can be updated
let currentRules = createRules(SELECTED_RULES);

export const getRules = (): Rule[] => currentRules;

// Add function to reset rules with new random selection
export function resetRules(): void {
  SELECTED_RULES = getRandomRules(3);
  currentRules = createRules(SELECTED_RULES);
}

export function getRulesByType(type: RuleType): Rule[] {
  return getRules().filter(rule => rule.type === type)
}

export function getRuleById(id: number): Rule | undefined {
  return getRules().find(rule => rule.id === id)
}

// Helper function to check a single rule
function checkSingleRule(wordId: string, type: RuleType): boolean {
  const rules = getRulesByType(type);
  return rules.some(rule => rule.check && rule.check(wordId));
}

export const checkRule = (wordId: string, area: string): boolean => {
  // First handle the basic areas
  if (area.toLowerCase() === 'context' || area.toLowerCase() === 'property' || area.toLowerCase() === 'wording') {
    return checkSingleRule(wordId, area.toLowerCase() as RuleType);
  }

  // Get the results for all three basic rules
  const contextResult = checkSingleRule(wordId, 'context');
  const propertyResult = checkSingleRule(wordId, 'property');
  const wordingResult = checkSingleRule(wordId, 'wording');

  // Handle combination areas
  switch (area) {
    case 'context+property':
      // Must be true for both Context AND Property, but false for Wording
      return contextResult && propertyResult && !wordingResult;

    case 'context+wording':
      // Must be true for both Context AND Wording, but false for Property
      return contextResult && wordingResult && !propertyResult;

    case 'property+wording':
      // Must be true for both Property AND Wording, but false for Context
      return propertyResult && wordingResult && !contextResult;

    case 'all':
      // Must be true for ALL three conditions
      return contextResult && propertyResult && wordingResult;

    case 'none':
      // Must be false for ALL three conditions
      return !contextResult && !propertyResult && !wordingResult;

    default:
      return false;
  }
};

export const findCorrectArea = (wordId: string): string | null => {
  // Get the results for all three basic rules
  const contextResult = checkSingleRule(wordId, 'context');
  const propertyResult = checkSingleRule(wordId, 'property');
  const wordingResult = checkSingleRule(wordId, 'wording');

  // Count how many rules are true
  const trueCount = [contextResult, propertyResult, wordingResult].filter(Boolean).length;

  // If all rules are false, it belongs in None
  if (trueCount === 0) {
    return 'none';
  }

  // If all three rules are true, it belongs in All
  if (trueCount === 3) {
    return 'all';
  }

  // If exactly two rules are true, it belongs in one of the combination areas
  if (trueCount === 2) {
    if (contextResult && propertyResult) return 'context+property';
    if (contextResult && wordingResult) return 'context+wording';
    if (propertyResult && wordingResult) return 'property+wording';
  }

  // If exactly one rule is true, it belongs in that basic area
  if (trueCount === 1) {
    if (contextResult) return 'context';
    if (propertyResult) return 'property';
    if (wordingResult) return 'wording';
  }

  return null;
}; 