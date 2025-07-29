# Thing-in-Rings Architecture Documentation

## Project Overview

**Thing-in-Rings** is an interactive language game built with React and TypeScript. Players drag words into different categorization areas based on linguistic rules about **context**, **property**, and **wording**. The game provides visual feedback through animations, sound effects, and a 3D cube-like diagram visualization.

### Key Features
- 🎯 **Drag-and-Drop Gameplay** - Intuitive word categorization interface
- 🎨 **3D Visualization** - Interactive set diagram with cube-like appearance
- 🇨🇳 **Chinese Interface** - Game interface and area names in Chinese
- 🎵 **Audio Feedback** - Sound effects for correct/incorrect placements
- ✨ **Smooth Animations** - Complex placement animations with auto-correction
- 📊 **Progress Tracking** - Game completion and attempt counting

---

## Architecture Overview

The project follows a **modular, hook-based architecture** with clear separation of concerns:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   UI Components │    │  Custom Hooks   │    │   Utilities     │
│                 │    │                 │    │                 │
│ • page.tsx      │───▶│ • useGameState  │───▶│ • gameUtils     │
│ • set-diagram   │    │ • useDragAndDrop│    │ • mediaUtils    │
│ • word-list     │    │ • useUIState    │    │ • rules         │
│ • modals        │    │                 │    │ • words         │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

## Directory Structure

```
src/
├── components/           # React UI components
│   ├── page.tsx         # Main game page (entry point)
│   ├── set-diagram.tsx  # 3D cube visualization
│   ├── word-list.tsx    # Draggable word list
│   ├── game-complete-modal.tsx
│   └── game-over-modal.tsx
│
├── hooks/               # Custom React hooks for state management
│   ├── useGameState.ts  # Core game logic and state
│   ├── useDragAndDrop.ts# Drag-and-drop with animations
│   └── useUIState.ts    # UI state (debug, modals, etc.)
│
├── utils/               # Pure utility functions
│   ├── gameUtils.ts     # Game-related utilities
│   ├── mediaUtils.ts    # Image/sound management
│   ├── rules.ts         # Rule validation logic
│   └── words.ts         # Word data management
│
├── constants/           # Configuration and constants
│   └── gameConstants.ts # Game configuration values
│
├── types/               # TypeScript type definitions
│   ├── word.ts          # Word data structure
│   ├── area.ts          # Game area definitions
│   └── rule.ts          # Rule validation types
│
└── resources/           # Static assets
    ├── data/            # Game data (words, rules)
    ├── pictures/        # Word images
    └── sound/           # Audio files
```

---

## Core Concepts

### Game Mechanics

1. **Words**: Players are presented with 5 visible words at a time
2. **Areas**: 8 categorization areas based on linguistic properties:
   - `使用场景` (Context), `特性` (Property), `拼写` (Wording) (basic areas)
   - `使用场景+特性`, `使用场景+拼写`, `特性+拼写` (combinations) 
   - `全部满足` (All), `全不满足` (None) (special areas)
3. **Rules**: Each game session has randomly selected rules that determine correct word placement
4. **Validation**: Words are validated against rules when dropped into areas (using English area mappings internally)
5. **Auto-correction**: Incorrectly placed words animate to their correct areas

### Data Flow

```
User Action (Drag) → useDragAndDrop → Rule Validation → 
Animation/Sound → useGameState Update → UI Re-render
```

---

## Architecture Patterns

### 1. Custom Hooks Pattern

**Purpose**: Separate business logic from UI rendering

- **`useGameState`**: Manages core game state (words, areas, completion)
- **`useDragAndDrop`**: Handles drag operations and complex animations  
- **`useUIState`**: Manages UI-specific state (modals, debug mode)

### 2. Utility Functions

**Purpose**: Pure functions for common operations

- **`mediaUtils.ts`**: Image loading, sound playback
- **`rules.ts`**: Rule validation and management

### 3. Constants Organization

**Purpose**: Centralized configuration management

- Game parameters (max visible words, target score)
- Animation timing constants
- Base area definitions

---

## Key Components

### `src/components/page.tsx` 
**Main game container** - Orchestrates all game functionality
- Initializes hooks and manages component composition
- Handles user interactions (word selection, game actions)
- Renders game layout with drag-and-drop context

### `src/components/set-diagram.tsx`
**3D visualization component** - Renders the interactive cube diagram
- SVG-based 3D cube with animated faces
- Droppable areas for word categorization
- Dynamic rule descriptions display

### `src/hooks/useGameState.ts`
**Core game logic hook** - Manages all game state
- Word management (visible, used, area placement)
- Game progression (attempts, completion, scoring)
- State transitions and validation

### `src/hooks/useDragAndDrop.ts` 
**Drag-and-drop handler** - Complex interaction logic
- Word placement validation
- Animation orchestration for incorrect placements
- Sound effect integration
- Multi-stage animation sequences

---

## Game Data Structure

### Word Object
```typescript
interface Word {
  id: string          // Unique identifier
  word: string        // Display text
  isChecked?: boolean // Has been validated
  isCorrect?: boolean // Placement correctness
  isAutoMoved?: boolean // Animation state
  wasAutoMoved?: boolean // Final styling state
}
```

### Rule Object  
```typescript
interface Rule {
  id: string          // Rule identifier
  type: 'context' | 'property' | 'wording'
  question: string    // Rule description
  ruleId: string     // Links to validation logic
}
```

---

## Development Workflow

### Adding New Features

1. **New Game Mechanics**: 
   - Add types to `src/types/`
   - Implement logic in appropriate hook (`src/hooks/`)
   - Update UI components as needed

2. **New UI Components**:
   - Create in `src/components/`
   - Use existing hooks for state management
   - Follow existing patterns for drag-and-drop integration

3. **New Utility Functions**:
   - Add to appropriate utility file in `src/utils/`
   - Keep functions pure and well-typed
   - Add constants to `src/constants/` if needed

### Testing New Changes

```bash
npm run build    # Verify TypeScript compilation
npm start        # Test in development mode
```

### Adding New Words/Rules

1. **Words**: Add JSON files to `src/resources/data/words/` (English) and `src/resources/data/words_zh/` (Chinese)
2. **Rules**: Update rule files in `src/resources/data/rules/` (English) and `src/resources/data/rules_zh/` (Chinese)
3. **Images**: Add corresponding images to `src/resources/pictures/`

Note: The game currently uses English word data and rules internally, but displays Chinese area names in the UI.

---

## State Management Philosophy

### Centralized Game State
- **Single source of truth** in `useGameState` hook
- **Immutable updates** using React state patterns
- **Derived state** computed from core state values

### UI State Separation  
- UI-specific state (modals, debug) separated from game logic
- **Event-driven** updates between hooks
- **Minimal prop drilling** through hook composition

### Area Name Management
- **Chinese UI Display** - All area names shown in Chinese to users
- **English Rule Validation** - Internal rule checking uses English area names
- **Automatic Mapping** - Seamless conversion between Chinese display and English validation

### Animation State
- **Complex animations** managed in `useDragAndDrop`
- **Multi-stage** state transitions for smooth UX
- **Cleanup** handling for interrupted animations

---

## Performance Considerations

- **Lazy image loading** with fallback handling
- **Memoized calculations** for expensive operations
- **Efficient re-renders** through proper dependency arrays
- **Sound preloading** for immediate feedback

---

## Contributing Guidelines

### Code Style
- Use **TypeScript** for all new code
- Follow existing **naming conventions**
- Add **JSDoc comments** for complex functions
- Maintain **separation of concerns**

### Adding Features
1. **Plan the architecture** - Which hook/utility should contain the logic?
2. **Update types** - Add/modify TypeScript interfaces as needed  
3. **Test thoroughly** - Verify drag-and-drop, animations, and state management
4. **Update documentation** - Modify this file if architecture changes

### File Organization
- **One concern per file** - Keep modules focused
- **Consistent exports** - Use named exports for utilities, default for components
- **Clear dependencies** - Minimize coupling between modules

---

## Debugging

### Debug Mode
Press `Ctrl+D` in the game to toggle debug panel showing:
- Active rules and their IDs
- Selected word information  
- Rule validation details

### Console Logs
Key debug information is logged during:
- Rule validation (`useDragAndDrop.ts`)
- Word placement logic
- Animation state transitions

---

## Future Architecture Considerations

### Scalability
- **Component library** - Extract reusable UI components
- **State management** - Consider Redux for complex state if needed
- **Performance monitoring** - Add metrics for user interactions

### Extensibility  
- **Plugin system** - For new game modes or rule types
- **Theme system** - For visual customization
- **Analytics integration** - For learning progress tracking
- **Multi-language** - Could re-add internationalization support if needed

---

*This architecture enables maintainable, testable code while supporting the complex interactions required for an engaging language learning game.* 