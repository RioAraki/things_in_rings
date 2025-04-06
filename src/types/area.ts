// Define the base areas that don't change with language
export type BaseArea = 
  | "Property" 
  | "Wording" 
  | "Property+Wording" 
  | "All" 
  | "None";

// Define the areas that need translation
export type TranslatableArea = 
  | "Context" 
  | "Context+Property" 
  | "Context+Wording";

// Combined type for all areas
export type Area = BaseArea | TranslatableArea | string;

// Helper function to get the base area name (for internal use)
export const getBaseAreaName = (area: Area): string => {
  // For translated areas, we need to extract the base name
  // e.g., "上下文" should return "Context"
  if (area.includes('+')) {
    return area; // Return intersection areas as is
  }
  
  // For single areas, map translated names back to base names
  switch (area) {
    case "Context":
    case "上下文": // Chinese translation
      return "Context";
    case "Property":
      return "Property";
    case "Wording":
      return "Wording";
    default:
      return area;
  }
}; 