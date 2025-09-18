# App State Pattern

## 4-State UI System

1. **No Folder** - User hasn't selected a folder yet
   - Component: `NoFolder.js`

2. **Folder but No File** - User has folder but no file selected
   - Component: `Files.js` (existing)

3. **Folder + File but Invalid** - File exists but can't be parsed
   - Component: `FileError.js`

4. **Folder + File + Valid DB** - Everything working
   - Component: `Reader.js` (existing)

## Event Pattern

### `app:state` Event Structure
```javascript
dispatchEvent('app:state', {
  state: 'loading' | 'splash' | 'fileError' | 'noFolder' | 'noFile' | 'database',
  message?: string,
  error?: string,
  data?: object
});
```

### Event Mapping
- `ui:loading` → `app:state` with `state: 'loading'`
- `ui:showSplash` → `app:state` with `state: 'splash'`
- `file:error` → `app:state` with `state: 'fileError'`
- New states: `noFolder`, `noFile`

### ReaderController
- Single `app:state` listener with switch statement
- Comment out old individual event listeners

## Implementation Status

### Phase 1: Event Pattern Migration ✅
- [x] Convert `ui:loading` to `app:state`
- [x] Convert `ui:showSplash` to `app:state`
- [x] Convert `file:error` to `app:state`
- [x] Update ReaderController to use single `app:state` listener

### Phase 2: Component Architecture
- [ ] Create `NoFolder.js` component
- [ ] Create `FileError.js` component
- [ ] Refactor `Files.js` for better integration
- [ ] Update `Reader.js` for new state handling

### Phase 3: Folder Service Integration
- [ ] Replace `persistenceService` with `folderService`
- [ ] Implement file-system-driven operations
- [ ] Add auto-save functionality
- [ ] Update menu structure

### Phase 4: State Management
- [ ] Move event firing responsibility to `ApplicationController`
- [ ] Implement state persistence
- [ ] Add error recovery mechanisms

## Notes
- `db:state` events remain unchanged
- Convert events one by one
- Keep old event listeners commented out during transition
