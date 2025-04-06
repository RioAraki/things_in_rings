import { type Word } from '../types/word'
import { type Rule, type RuleType } from '../types/rule'
import { type Area } from '../types/area'
import wordsData from '../resources/data/words.json'

// Fix malformed data where questions might have duplicate 'result' properties
function normalizeWordData(wordData: any): Word {
  const normalizedQuestions = wordData.questions.map((q: any) => {
    // If there are two 'result' properties, one might be accidentally named 'result' instead of 'reason'
    if (typeof q.result === 'string') {
      return {
        ruleId: q.ruleId,
        result: true, // Default to true if the result is a string (which is likely meant to be a reason)
        reason: q.result // Move the string value to the reason field
      };
    }
    
    // Keep proper format
    return {
      ruleId: q.ruleId,
      result: typeof q.result === 'boolean' ? q.result : Boolean(q.result),
      reason: q.reason
    };
  });

  return {
    ...wordData,
    questions: normalizedQuestions,
    isPlaced: false
  };
}

// Normalize all words
const normalizedWords = (wordsData.words || []).map(word => normalizeWordData(word));

// Helper function to get random items from an array
function getRandomItems<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// Helper function to find a word by ID
function findWordById(wordId: string): Word | undefined {
  return normalizedWords.find(word => word.id === wordId);
}

// Helper function to convert RuleType to Area type
function ruleTypeToArea(type: RuleType): Area {
  return type.charAt(0).toUpperCase() + type.slice(1) as Area;
}

// Helper function to convert Area to RuleType
function areaToRuleType(area: string): RuleType | undefined {
  const lowerArea = area.toLowerCase();
  if (lowerArea === 'context' || lowerArea === 'property' || lowerArea === 'wording') {
    return lowerArea;
  }
  return undefined;
}

// Define all possible rules
const ALL_RULES: Rule[] = [
  {
    id: 1,
    type: 'context',
    description: 'Very old (over 1000 years)',
    check: (wordId: string) => {
      const word = findWordById(wordId);
      return word?.questions.find(q => q.ruleId === 1)?.result || false;
    }
  },
  {
    id: 2,
    type: 'context',
    description: 'Modern (after 1950)',
    check: (wordId: string) => {
      const word = findWordById(wordId);
      return word?.questions.find(q => q.ruleId === 2)?.result || false;
    }
  },
  {
    id: 3,
    type: 'context',
    description: 'Found in most homes',
    check: (wordId: string) => {
      const word = findWordById(wordId);
      return word?.questions.find(q => q.ruleId === 3)?.result || false;
    }
  },
  {
    id: 4,
    type: 'context',
    description: 'Rare in homes',
    check: (wordId: string) => {
      const word = findWordById(wordId);
      return word?.questions.find(q => q.ruleId === 4)?.result || false;
    }
  },
  {
    id: 5,
    type: 'property',
    description: 'Made for children',
    check: (wordId: string) => {
      const word = findWordById(wordId);
      return word?.questions.find(q => q.ruleId === 5)?.result || false;
    }
  },
  {
    id: 6,
    type: 'property',
    description: 'Made for adults',
    check: (wordId: string) => {
      const word = findWordById(wordId);
      return word?.questions.find(q => q.ruleId === 6)?.result || false;
    }
  },
  {
    id: 7,
    type: 'property',
    description: 'Expensive',
    check: (wordId: string) => {
      const word = findWordById(wordId);
      return word?.questions.find(q => q.ruleId === 7)?.result || false;
    }
  },
  {
    id: 8,
    type: 'property',
    description: 'Inexpensive',
    check: (wordId: string) => {
      const word = findWordById(wordId);
      return word?.questions.find(q => q.ruleId === 8)?.result || false;
    }
  },
  {
    id: 9,
    type: 'wording',
    description: 'Practical use',
    check: (wordId: string) => {
      const word = findWordById(wordId);
      return word?.questions.find(q => q.ruleId === 9)?.result || false;
    }
  },
  {
    id: 10,
    type: 'wording',
    description: 'Decorative use',
    check: (wordId: string) => {
      const word = findWordById(wordId);
      return word?.questions.find(q => q.ruleId === 10)?.result || false;
    }
  },
  {
    id: 11,
    type: 'wording',
    description: 'Natural',
    check: (wordId: string) => {
      const word = findWordById(wordId);
      return word?.questions.find(q => q.ruleId === 11)?.result || false;
    }
  },
  {
    id: 12,
    type: 'wording',
    description: 'Manufactured',
    check: (wordId: string) => {
      const word = findWordById(wordId);
      return word?.questions.find(q => q.ruleId === 12)?.result || false;
    }
  },
  {
    id: 13,
    type: 'wording',
    description: 'Special occasions',
    check: (wordId: string) => {
      const word = findWordById(wordId);
      return word?.questions.find(q => q.ruleId === 13)?.result || false;
    }
  },
  {
    id: 14,
    type: 'wording',
    description: 'Everyday use',
    check: (wordId: string) => {
      const word = findWordById(wordId);
      return word?.questions.find(q => q.ruleId === 14)?.result || false;
    }
  }
];

// Number of rules to select for each type
const RULES_PER_TYPE = 2;

// Selected rules for the current game
let currentRules = createRules();

export function getRules(): Rule[] {
  return currentRules;
}

// Add function to reset rules with new random selection
export function resetRules(): void {
  currentRules = createRules();
}

// Function to create a new set of rules
function createRules(): Rule[] {
  // Group rules by type
  const rulesByType = ALL_RULES.reduce((acc, rule) => {
    if (!acc[rule.type]) {
      acc[rule.type] = [];
    }
    acc[rule.type].push(rule);
    return acc;
  }, {} as Record<RuleType, Rule[]>);

  // Select random rules for each type
  const selectedRules: Rule[] = [];
  Object.values(rulesByType).forEach(rules => {
    selectedRules.push(...getRandomItems(rules, RULES_PER_TYPE));
  });

  return selectedRules;
}

// Function to check if a word belongs in an area
export function checkRule(wordId: string, area: string): boolean {
  const word = findWordById(wordId);
  if (!word) return false;

  const ruleType = areaToRuleType(area);
  if (!ruleType) return false;

  const rules = currentRules.filter(rule => rule.type === ruleType);
  return rules.some(rule => rule.check(wordId));
}

// Function to find the correct area for a word
export function findCorrectArea(wordId: string): Area {
  const word = findWordById(wordId);
  if (!word) return 'None';

  const matchingRules = currentRules.filter(rule => rule.check(wordId));
  const matchingTypes = new Set(matchingRules.map(rule => rule.type));
  const typeArray = Array.from(matchingTypes) as RuleType[];

  if (typeArray.length === 0) return 'None';
  if (typeArray.length === 3) return 'All';
  if (typeArray.length === 1) {
    return ruleTypeToArea(typeArray[0]);
  }
  
  // For two matching types, return the combined area name
  const types = typeArray.sort().map(ruleTypeToArea);
  return `${types[0]}+${types[1]}` as Area;
} 