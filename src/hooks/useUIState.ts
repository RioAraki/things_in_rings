import { useState, useEffect } from 'react';

interface UIState {
  showDebug: boolean;
  showRuleDescriptions: boolean;
}

/**
 * Custom hook to manage UI-specific state
 * 
 * This hook handles:
 * - Debug mode toggle
 * - Keyboard shortcuts
 * - Rule descriptions visibility
 * - Other UI-specific state
 * 
 * @returns UI state and management functions
 */
export function useUIState() {
  const [uiState, setUIState] = useState<UIState>({
    showDebug: false,
    showRuleDescriptions: false
  });

  // Add keyboard shortcut to toggle debug (Ctrl + D)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'd') {
        e.preventDefault();
        setUIState(prev => ({ ...prev, showDebug: !prev.showDebug }));
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleDebug = () => {
    setUIState(prev => ({ ...prev, showDebug: !prev.showDebug }));
  };

  const showRules = () => {
    setUIState(prev => ({ ...prev, showRuleDescriptions: true }));
  };

  const hideRules = () => {
    setUIState(prev => ({ ...prev, showRuleDescriptions: false }));
  };

  const resetUIState = () => {
    setUIState({
      showDebug: false,
      showRuleDescriptions: false
    });
  };

  return {
    ...uiState,
    toggleDebug,
    showRules,
    hideRules,
    resetUIState
  };
} 