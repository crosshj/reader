# App State Pattern

## Current Implementation Status ✅

The app state pattern has been **fully implemented** and is working in production. The system uses a unified `app:state` event pattern with proper state management.

## 4-State UI System (Implemented)

1. **No Folder** - User hasn't selected a folder yet
   - Component: `SelectFolder.js` ✅
   - State: `noFolder`

2. **Folder but No File** - User has folder but no file selected (includes file errors)
   - Component: `SelectFile.js` ✅
   - State: `noFile`
   - Note: File errors are handled within this state by showing error messages

3. **Loading** - App is processing (file operations, database loading)
   - Component: Loading spinner in `Reader.js` ✅
   - State: `loading`

4. **Folder + File + Valid DB** - Everything working
   - Component: `Reader.js` with dynamic UI ✅
   - State: `database` (via `db:state` events)

## Event Pattern (Implemented)

### `app:state` Event Structure
```javascript
dispatchEvent('app:state', {
  state: 'loading' | 'splash' | 'noFolder' | 'noFile' | 'database',
  message?: string,
  error?: string,
  data?: object
});
```

### Event Flow (Working)
- **ApplicationController** fires `app:state` events for file/folder operations
- **ReaderController** listens to `app:state` and routes to appropriate UI methods
- **Reader.js** handles state-specific UI rendering
- **db:state** events remain separate for database-specific state

### State Handlers (Implemented)
```javascript
// ReaderController.js - app:state listener
addEventListener('app:state', (e) => {
  const { state, data, error, message } = e.detail;
  
  switch (state) {
    case 'splash': this.ui.showContent(); break;
    case 'loading': this.ui.showLoadingState(message); break;
    case 'noFolder': this.ui.showSelectFolder(); break;
    case 'noFile': this.ui.showSelectFile(data?.files || []); break;
  }
});
```

## Implementation Status

### Phase 1: Event Pattern Migration ✅ COMPLETE
- [x] Convert `ui:loading` to `app:state`
- [x] Convert `ui:showSplash` to `app:state`
- [x] Convert `file:error` to `app:state`
- [x] Update ReaderController to use single `app:state` listener

### Phase 2: Component Architecture ✅ COMPLETE
- [x] Create `SelectFolder.js` component (replaces planned `NoFolder.js`)
- [x] Create `SelectFile.js` component (replaces planned `Files.js` refactor)
- [x] Use existing `Error.js` for file errors
- [x] Update `Reader.js` for new state handling

### Phase 3: Folder Service Integration ✅ COMPLETE
- [x] Replace `persistenceService` with `folderService`
- [x] Implement file-system-driven operations
- [x] Add auto-save functionality
- [x] Update menu structure

### Phase 4: State Management ✅ COMPLETE
- [x] Move event firing responsibility to `ApplicationController`
- [x] Implement state persistence via `PersistenceService`
- [x] Add error recovery mechanisms

## Current Architecture

### Event Flow
1. **User Action** → UI component
2. **UI Event** → `ApplicationController` handlers
3. **Handler** → `dispatchEvent('app:state', {...})`
4. **ReaderController** → Routes to appropriate UI method
5. **Reader.js** → Renders state-specific UI

### Key Components
- **ApplicationController**: Manages app-level state and fires `app:state` events
- **ReaderController**: Routes `app:state` events to UI methods
- **Reader.js**: Main UI component with state-specific rendering methods
- **SelectFolder.js**: Handles folder selection state
- **SelectFile.js**: Handles file selection state
- **Error.js**: Handles error states

### State Transitions
```
noFolder → (select folder) → noFile → (select file) → loading → database
    ↑                           ↑                        ↓
    └── (error) ←───────────────┴────────────────────────┘
```

## Notes
- `db:state` events remain unchanged and work alongside `app:state`
- All planned components have been implemented with different names
- State management is fully functional and production-ready
- Error handling and recovery mechanisms are in place

## Simplification Opportunity
The `fileError` state has been identified as redundant since file errors are already handled within the `noFile` state by showing error messages in the `SelectFile` component. The codebase could be cleaned up by:
- Removing `fileError` case from ReaderController
- Updating all `fileError` dispatches to use `noFile` instead
- This would simplify the state system from 5 states to 4 states
