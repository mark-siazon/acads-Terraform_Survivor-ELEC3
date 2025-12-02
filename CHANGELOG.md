# Changelog

All notable changes to Terraform Survivor.

## [1.3.1] - 2024-12-02

### Fixed

#### 🐛 Critical Bug Fixes

- **SaveManager Method Mismatch**: Fixed `clearSave()` method not existing

  - Game.js was calling `this.saveManager.clearSave()` on game over
  - SaveManager only had `deleteSave()` method
  - Added `clearSave()` as an alias to `deleteSave()` for compatibility
  - Prevents crash when player dies

- **Config Not Persisted**: Fixed game configuration not being saved

  - SaveManager was not saving the `config` object
  - Game.js was trying to load `savedGame.config` which didn't exist
  - Added `config` to the save data structure
  - Settings changes now persist across sessions

- **Achievement Return Value**: Fixed achievement notifications not showing

  - `checkAchievement()` method wasn't returning the unlocked achievement
  - Game.js expected a return value to show notification
  - Now properly returns the unlocked achievement object
  - Achievement notifications now display correctly when unlocked

- **Missing Achievement Icons**: Added icons to all achievement definitions
  - Action achievements (Explorer 🔍, Hunter 🏹, Craftsman 🔨)
  - Resource achievements (Gatherer 📦, Hoarder 🏛️)
  - Survivor achievements already had icons
  - Ensures consistent achievement display

#### 🔄 Display Sync Issues

- **Stats Panel Race Condition**: Fixed tooltips showing incorrect inventory status

  - `updateAllComponents()` was calling `updateStats()` before `setInventory()`
  - Stats panel render used stale inventory data for tooltip availability checks
  - Reordered calls to set inventory before updating stats
  - Tooltips now correctly show if you have items to fix low stats

- **Settings Panel Missing Method**: Fixed settings not updating in panel
  - Game.js called `setSettings()` but method didn't exist in SettingsPanel
  - Settings panel showed stale values after changes
  - Added `setSettings()` method to store and display current settings
  - Settings panel now shows correct values when reopened

### Technical

- Updated `SaveManager.js` to include config in save data
- Added `clearSave()` method as wrapper for `deleteSave()`
- Modified `StatsTracker.js` to return achievement objects
- Added icon property to all achievement definitions
- Fixed component update order in `Game.js`
- Added `setSettings()` method to `SettingsPanel.js`
- No breaking changes to existing save files

## [1.3.0] - 2024-12-02

### Added

#### 🧪 Integrated Test Features in Settings Panel

- **Test Features Section**: Added comprehensive testing tools directly in the Settings Panel
  - 💾 **Test Save/Load**: Validates localStorage functionality with 4 automated tests
    - Checks localStorage availability
    - Tests write permissions
    - Validates game state saving
    - Confirms game state loading
  - 🗑️ **Clear Save**: Quick action to remove saved game data
  - 📦 **Test Components**: Lists all game components with status indicators
  - ⌨️ **Test Keyboard**: Displays all keyboard shortcuts with visual mapping
- Real-time test results display with pass/fail indicators
- Visual feedback with color-coded test status (green for pass, red for fail)
- Test results shown inline within Settings Panel

#### ⚙️ Enhanced Settings Panel

- **Difficulty Presets**: Quick-select buttons for game difficulty
  - 🟢 Easy: Lower decay rates, more resources, less danger
  - 🟡 Normal: Balanced gameplay (default)
  - 🔴 Hard: Higher decay rates, fewer resources, more danger
  - ⚫ Extreme: Maximum challenge for experienced players
- **Custom Settings Sliders**: Fine-tune individual parameters
  - Hunger Decay Rate (0.5x - 5x)
  - Thirst Decay Rate (0.5x - 6x)
  - Energy Decay Rate (0.5x - 4x)
  - Resource Multiplier (0.3x - 3x)
  - Danger Level (0% - 100%)
- **Feature Toggles**: Enable/disable game features
  - Crafting system
  - Weather events
  - Random events
- Real-time value display as sliders are adjusted
- Apply and Reset buttons for settings management

#### 🎮 Standalone Version Enhancements

- Fully integrated SettingsPanel component in `standalone.html`
- Complete inline implementation (no external dependencies)
- Settings button added to action panel
- 'O' keyboard shortcut for quick settings access
- All test features available in standalone version

### Changed

- **SettingsPanel.js**: Expanded with test feature methods
  - Added `runTest()` method for test orchestration
  - Added `testSaveSystem()` for localStorage validation
  - Added `clearSave()` for save data management
  - Added `testComponents()` for component verification
  - Added `testKeyboard()` for shortcut documentation
  - Added `applyPreset()` for difficulty preset application
  - Added `applySettings()` for custom settings
  - Added `resetSettings()` for configuration reset
- **standalone.html**: Complete SettingsPanel integration
  - Added inline SettingsPanel class (400+ lines)
  - Added settings action to ActionPanel
  - Added 'O' keyboard shortcut handler
  - Added `openSettings()` method to Game class
  - Added `handleSettingsChange()` for settings persistence
  - Updated keyboard shortcuts help to include Settings (O key)
- **style.css**: Added comprehensive test feature styling
  - Test action buttons with gradient styling
  - Test results container with scrollable area
  - Test item cards with pass/fail indicators
  - Preset buttons with hover effects
  - Setting item layouts for sliders and checkboxes
  - Settings action buttons (primary/secondary styles)
  - Responsive grid layouts for test actions
  - Color-coded status indicators

### Deprecated

- **test-features.html**: Marked as deprecated
  - All functionality now integrated into Settings Panel
  - File retained for reference but no longer needed
  - Added deprecation notice in HTML comments

### Technical

- Maintained component-based architecture
- Zero new external dependencies
- Backward compatible with existing saves
- Test features use native browser APIs only
- Settings changes apply in real-time without page reload
- Clean separation between test and game logic

### Developer Experience

- Easier testing workflow (no separate test page needed)
- In-game access to all testing tools
- Better debugging capabilities during gameplay
- Unified interface for settings and testing

## [1.2.1] - 2024-11-29

### Added

- **Eat Food Action**: Press **F** or click "Eat Food" to consume berries or meat
- **Clickable Inventory**: Click on berries or meat in inventory to eat them directly!
- **Interactive Stats Panel**: Click on low stats to get instant help!
  - Hover over low stats to see solutions
  - Green tooltip = you have items to fix it (click to use)
  - Orange tooltip = you need to gather items first
  - Stats pulse when low to draw attention
- Food menu showing available food items with hunger restoration values
- Berries restore 15 hunger, Meat restores 30 hunger
- Visual food selection interface with availability display
- Consumable items show fork icon (🍴) on hover
- Interactive inventory with visual feedback
- Smart tooltips that check your inventory

### Fixed

- Players can now actually consume the food they gather and hunt!
- Inventory items are now interactive for quick consumption
- Stats panel now provides contextual help

## [1.2.0] - 2024-11-29

### Added

#### 🏆 Statistics & Achievement System

- Comprehensive stats tracking across all games
- Track explorations, hunts, crafts, and resources gathered
- Personal best tracking (longest survival run)
- 9 unlockable achievements:
  - Survivor achievements (10, 25, 50, 100 days)
  - Action achievements (Explorer, Hunter, Craftsman)
  - Resource achievements (Gatherer, Hoarder)
- Statistics panel accessible via new Statistics button
- Achievement progress persists across games
- Implemented in `StatsTracker.js`

#### 🔔 Notification System

- Toast-style notifications for important events
- Achievement unlock notifications with special styling
- Smooth slide-in animations
- Auto-dismiss after configurable duration
- Queue system for multiple notifications
- Implemented in `NotificationSystem.js`

#### 📊 Enhanced Game Over Screen

- Shows personal best comparison
- Displays total games played
- Highlights new records
- Better visual feedback for achievements

### Changed

- Game now tracks all player actions for statistics
- Achievement checks on key milestones (days survived, actions taken)
- Enhanced UI with notification container
- Updated action panel with Statistics button

## [1.1.0] - 2024-11-29

### Added

#### 💾 Auto-Save System

- Automatic game state persistence every 30 seconds
- Save to browser localStorage
- Automatic load on game start
- Manual save button and action
- Save cleared on game over
- Implemented in `SaveManager.js`

#### ⚙️ In-Game Settings Panel

- Real-time difficulty adjustment
- Configurable settings:
  - Hunger decay rate (1-10)
  - Thirst decay rate (1-10)
  - Energy decay rate (1-10)
  - Danger level (0-100%)
  - Resource multiplier (0.5x-3x)
- Settings persist with save game
- Accessible via 'O' hotkey or Settings button
- Slide-in panel with smooth animations
- Implemented in `SettingsPanel.js`

#### ⌨️ Enhanced Keyboard Support

- New 'O' hotkey for Settings
- All actions now have keyboard shortcuts
- Help dialog shows all shortcuts (press '?')
- Full keyboard navigation support

#### 🎨 UI Improvements

- Settings panel with modern slide-in design
- Enhanced action panel with Save and Settings buttons
- Improved visual feedback for all interactions
- Better accessibility with ARIA labels

### Changed

- Updated `Game.js` to integrate SaveManager and SettingsPanel
- Enhanced `ActionPanel.js` with new Save and Settings actions
- Updated documentation with new features
- Improved Quick Start guide with feature descriptions

### Technical

- Component-based architecture maintained
- No external dependencies added
- Backward compatible with existing saves
- Clean separation of concerns

## [1.0.0] - 2024-11-28

### Initial Release

- Core survival game mechanics
- Terraform-controlled difficulty
- Component-based architecture
- Full keyboard accessibility
- Deployment guides for GitHub Pages and Vercel
- Comprehensive documentation
