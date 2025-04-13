// Define the base areas that don't change with language
export type BaseArea = 
  | "Context"
  | "Property" 
  | "Wording"
  | "Context+Property"
  | "Context+Wording" 
  | "Property+Wording" 
  | "All" 
  | "None";

// Define the areas that need translation
export type TranslatableArea = 
  | "使用场景"
  | "特性"
  | "拼写"
  | "全部满足"
  | "全不满足"
  | "使用场景+特性"
  | "使用场景+拼写"
  | "特性+拼写";

// Combined type for all areas
export type Area = BaseArea | TranslatableArea | string;

// Helper function to get the base area name (for internal use)
export const getBaseAreaName = (area: Area): string => {
  // For translated areas, we need to extract the base name
  if (area === '使用场景') return 'context';
  if (area === '特性') return 'property';
  if (area === '拼写') return 'wording';
  if (area === '全部满足') return 'all';
  if (area === '全不满足') return 'none';
  
  // Handle intersection areas
  if (area.startsWith('使用场景+')) {
    return 'context' + area.substring('使用场景'.length);
  }
  if (area.includes('+拼写')) {
    return area.replace('拼写', 'wording');
  }
  if (area.includes('特性')) {
    return area.replace('特性', 'property');
  }
  
  return area;
}; 