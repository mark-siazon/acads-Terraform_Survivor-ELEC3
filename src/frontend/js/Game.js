import StatsPanel from './components/StatsPanel.js';
import StoryLog from './components/StoryLog.js';
import ActionPanel from './components/ActionPanel.js';
import Inventory from './components/Inventory.js';
import TerraformConfig from './components/TerraformConfig.js';
import Modal from './components/Modal.js';
import SettingsPanel from './components/SettingsPanel.js';
import NotificationSystem from './components/NotificationSystem.js';
import SaveManager from './SaveManager.js';
import StatsTracker from './StatsTracker.js';

class Game {
    constructor(config) {
        this.config = config;
        this.saveManager = new SaveManager();
        this.statsTracker = new StatsTracker();

        // Try to load saved game
        const savedGame = this.saveManager.loadGame();
        const isNewGame = !savedGame;

        if (savedGame) {
            this.player = savedGame.player;
            this.inventory = savedGame.inventory;
            this.config = { ...config, ...savedGame.config };
        } else {
            this.player = {
                health: 100,
                hunger: 100,
                thirst: 100,
                energy: 100,
                day: 1
            };
            this.inventory = { ...config.startingResources };
            this.statsTracker.recordGameStart();
        }

        this.gameRunning = true;

        this.initComponents();
        this.startGameLoop();
        this.logWelcomeMessage(!isNewGame);
    }

    initComponents() {
        this.statsPanel = new StatsPanel('statsPanel', (action, stat) => this.handleStatClick(action, stat));
        this.storyLog = new StoryLog('storyLog');
        this.actionPanel = new ActionPanel('actionPanel', (action) => this.handleAction(action));
        this.inventoryComponent = new Inventory('inventoryPanel', (item) => this.handleInventoryClick(item));
        this.terraformConfig = new TerraformConfig('terraformConfig');
        this.modal = new Modal('modalContainer');
        this.settingsPanel = new SettingsPanel('settingsPanel', (type, data) => this.applySettings(type, data));
        this.notifications = new NotificationSystem('notificationContainer');

        // Mount all components
        this.statsPanel.mount();
        this.storyLog.mount();
        this.actionPanel.mount();
        this.inventoryComponent.mount();
        this.terraformConfig.mount();
        this.modal.mount();
        this.settingsPanel.mount();
        this.notifications.mount();

        // Set initial data
        this.terraformConfig.setConfig(this.config);
        this.settingsPanel.setSettings(this.config.gameSettings);
        this.updateAllComponents();

        // Initialize keyboard shortcuts
        this.initKeyboardShortcuts();

        // Auto-save every 30 seconds
        this.autoSaveInterval = setInterval(() => this.saveGame(), 30000);

        // Add header settings button event listener
        const headerSettingsBtn = document.getElementById('headerSettingsBtn');
        if (headerSettingsBtn) {
            headerSettingsBtn.addEventListener('click', () => {
                this.openSettings();
            });
        }
    }

    initKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Don't trigger if typing in an input
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            // Don't trigger if modal is open (except Escape)
            if (this.modal.state.isOpen && e.key !== 'Escape') return;

            const key = e.key.toLowerCase();

            const shortcuts = {
                'e': () => this.explore(),
                'h': () => this.hunt(),
                'w': () => this.gatherWater(),
                'f': () => this.showEatMenu(),
                'r': () => this.rest(),
                'c': () => this.showCraftingMenu(),
                's': () => this.showStatus(),
                'p': () => this.togglePause(),
                'escape': () => this.modal.close(),
                '?': () => this.showHelp(),
                'o': () => this.settingsPanel.toggle()
            };

            if (shortcuts[key]) {
                e.preventDefault();
                shortcuts[key]();
            }
        });

        // Show keyboard shortcuts hint on first load
        setTimeout(() => {
            this.storyLog.addMessage('💡 Tip: Use keyboard shortcuts! Press ? for help', 'info');
        }, 2000);
    }

    showHelp() {
        const helpHTML = `
            <div class="help-content">
                <h3>⌨️ Keyboard Shortcuts</h3>
                <div class="shortcuts-grid">
                    <div class="shortcut-item">
                        <kbd>E</kbd>
                        <span>Explore</span>
                    </div>
                    <div class="shortcut-item">
                        <kbd>H</kbd>
                        <span>Hunt</span>
                    </div>
                    <div class="shortcut-item">
                        <kbd>W</kbd>
                        <span>Gather Water</span>
                    </div>
                    <div class="shortcut-item">
                        <kbd>F</kbd>
                        <span>Eat Food</span>
                    </div>
                    <div class="shortcut-item">
                        <kbd>R</kbd>
                        <span>Rest</span>
                    </div>
                    <div class="shortcut-item">
                        <kbd>C</kbd>
                        <span>Craft</span>
                    </div>
                    <div class="shortcut-item">
                        <kbd>S</kbd>
                        <span>Status</span>
                    </div>
                    <div class="shortcut-item">
                        <kbd>ESC</kbd>
                        <span>Close Dialog</span>
                    </div>
                    <div class="shortcut-item">
                        <kbd>?</kbd>
                        <span>Show This Help</span>
                    </div>
                    <div class="shortcut-item">
                        <kbd>O</kbd>
                        <span>Settings</span>
                    </div>
                    <div class="shortcut-item">
                        <kbd>P</kbd>
                        <span>Pause/Resume</span>
                    </div>
                </div>
                <p style="margin-top: 1rem; font-size: 0.85rem; color: var(--text-secondary);">
                    💡 Tip: You can also click the buttons or use Tab to navigate
                </p>
            </div>
        `;
        this.modal.open('Keyboard Shortcuts', helpHTML, 'info');
    }

    logWelcomeMessage(isLoadedGame) {
        if (isLoadedGame) {
            this.storyLog.addMessage(`Welcome back! Game loaded from Day ${this.player.day}.`, 'success');
        } else {
            this.storyLog.addMessage(`Welcome to Terraform Survivor!`, 'info');
            this.storyLog.addMessage(`Environment: ${this.config.environment} | Difficulty: ${this.config.difficulty}`, 'info');
            this.storyLog.addMessage(`You've crash-landed in the wilderness. Survive as long as you can!`, 'info');
        }
    }

    startGameLoop() {
        this.lastWarnings = { hunger: false, thirst: false, energy: false };

        this.gameLoop = setInterval(() => {
            if (!this.gameRunning || this.gamePaused) return;

            this.player.hunger = Math.max(0, this.player.hunger - this.config.gameSettings.hungerDecayRate / 10);
            this.player.thirst = Math.max(0, this.player.thirst - this.config.gameSettings.thirstDecayRate / 10);
            this.player.energy = Math.max(0, this.player.energy - this.config.gameSettings.energyDecayRate / 10);

            // Warning system
            this.checkWarnings();

            // Critical damage
            if (this.player.hunger <= 0 || this.player.thirst <= 0) {
                this.player.health = Math.max(0, this.player.health - 1);
                if (this.player.hunger <= 0) {
                    this.storyLog.addMessage('💀 You are starving! Health decreasing!', 'danger');
                    this.flashPanel('statsPanel', 'danger');
                }
                if (this.player.thirst <= 0) {
                    this.storyLog.addMessage('💀 You are dehydrated! Health decreasing!', 'danger');
                    this.flashPanel('statsPanel', 'danger');
                }
            }

            this.checkGameOver();
            this.updateAllComponents();
        }, 1000);
    }

    checkWarnings() {
        // Hunger warning
        if (this.player.hunger <= 30 && this.player.hunger > 0 && !this.lastWarnings.hunger) {
            this.storyLog.addMessage('⚠️ You\'re getting hungry! Find food soon.', 'danger');
            this.lastWarnings.hunger = true;
        } else if (this.player.hunger > 30) {
            this.lastWarnings.hunger = false;
        }

        // Thirst warning
        if (this.player.thirst <= 30 && this.player.thirst > 0 && !this.lastWarnings.thirst) {
            this.storyLog.addMessage('⚠️ You\'re getting thirsty! Gather water soon.', 'danger');
            this.lastWarnings.thirst = true;
        } else if (this.player.thirst > 30) {
            this.lastWarnings.thirst = false;
        }

        // Energy warning
        if (this.player.energy <= 20 && this.player.energy > 0 && !this.lastWarnings.energy) {
            this.storyLog.addMessage('⚠️ You\'re exhausted! Rest soon.', 'danger');
            this.lastWarnings.energy = true;
        } else if (this.player.energy > 20) {
            this.lastWarnings.energy = false;
        }
    }

    togglePause() {
        this.gamePaused = !this.gamePaused;
        if (this.gamePaused) {
            this.storyLog.addMessage('⏸️ Game paused. Press P to resume.', 'info');
            this.notifications.show('Game Paused', 'info', 2000);
        } else {
            this.storyLog.addMessage('▶️ Game resumed!', 'info');
            this.notifications.show('Game Resumed', 'success', 2000);
        }
    }

    handleAction(actionId) {
        // Prevent actions if game is over
        if (!this.gameRunning) {
            return;
        }

        if (this.gamePaused && actionId !== 'settings') {
            this.storyLog.addMessage('⏸️ Game is paused! Press P to resume.', 'danger');
            return;
        }

        const actions = {
            explore: () => this.explore(),
            hunt: () => this.hunt(),
            gather: () => this.gatherWater(),
            rest: () => this.rest(),
            craft: () => this.showCraftingMenu(),
            eat: () => this.showEatMenu(),
            status: () => this.showStatus(),
            help: () => this.showHelp(),
            save: () => this.saveGame(true),
            settings: () => this.openSettings(),
            stats: () => this.showStatistics()
        };

        if (actions[actionId]) {
            actions[actionId]();
        }
    }

    explore() {
        if (!this.hasEnergy(15)) return;

        this.player.energy = Math.max(0, this.player.energy - 15);
        const multiplier = this.config.gameSettings.resourceMultiplier;

        const finds = [
            { item: 'wood', amount: Math.floor((Math.random() * 3 + 2) * multiplier), emoji: '🪵' },
            { item: 'stone', amount: Math.floor((Math.random() * 2 + 1) * multiplier), emoji: '🪨' },
            { item: 'berries', amount: Math.floor((Math.random() * 4 + 1) * multiplier), emoji: '🫐' }
        ];

        const found = finds[Math.floor(Math.random() * finds.length)];
        this.addToInventory(found.item, found.amount);
        this.statsTracker.recordAction('explore');
        this.statsTracker.recordResource(found.item, found.amount);
        this.storyLog.addMessage(`🔍 Explored and found ${found.emoji} ${found.amount} ${found.item}!`, 'success');

        if (this.config.features.randomEvents && Math.random() < this.config.gameSettings.dangerLevel) {
            this.player.health = Math.max(0, this.player.health - 10);
            this.storyLog.addMessage('You encountered danger and lost 10 health!', 'danger');
        }

        this.updateAllComponents();
    }

    hunt() {
        if (!this.hasEnergy(20)) return;

        this.player.energy = Math.max(0, this.player.energy - 20);
        const success = Math.random() > this.config.gameSettings.dangerLevel;

        this.statsTracker.recordAction('hunt', success);

        if (success) {
            const meat = Math.floor((Math.random() * 3 + 2) * this.config.gameSettings.resourceMultiplier);
            this.addToInventory('meat', meat);
            this.statsTracker.recordResource('meat', meat);
            this.storyLog.addMessage(`🏹 Successful hunt! You got 🍖 ${meat} meat!`, 'success');
            this.flashPanel('inventoryPanel', 'success');
        } else {
            this.player.health = Math.max(0, this.player.health - 15);
            this.storyLog.addMessage('💔 Hunt failed! You were injured and lost 15 health.', 'danger');
            this.flashPanel('statsPanel', 'danger');
        }

        this.updateAllComponents();
    }

    gatherWater() {
        if (!this.hasEnergy(10)) return;

        this.player.energy = Math.max(0, this.player.energy - 10);
        const water = Math.floor(Math.random() * 30 + 20);
        this.player.thirst = Math.min(100, this.player.thirst + water);
        this.storyLog.addMessage(`💧 Gathered water and restored ${water} thirst!`, 'success');
        this.flashPanel('statsPanel', 'success');
        this.updateAllComponents();
    }

    rest() {
        const energyGain = 40;
        this.player.energy = Math.min(100, this.player.energy + energyGain);
        this.player.hunger = Math.max(0, this.player.hunger - 5);
        this.player.thirst = Math.max(0, this.player.thirst - 5);
        this.player.day++;

        this.statsTracker.recordAction('rest');
        this.storyLog.addMessage(`😴 Rested and restored ${energyGain} energy. ☀️ Day ${this.player.day} begins!`, 'info');
        this.flashPanel('statsPanel', 'success');

        // Check for day-based achievements
        const achievement = this.statsTracker.checkAchievement('survivor', this.player.day);
        if (achievement) {
            this.notifications.showAchievement(achievement);
        }

        if (this.config.features.weatherEvents && Math.random() < 0.4) {
            const events = [
                {
                    text: '🌧️ It rained during the night. Your thirst is fully restored!',
                    effect: () => this.player.thirst = 100,
                    type: 'success'
                },
                {
                    text: '❄️ Cold night! You lost some health but found extra wood.',
                    effect: () => {
                        this.player.health = Math.max(0, this.player.health - 10);
                        this.addToInventory('wood', 3);
                    },
                    type: 'danger'
                },
                {
                    text: '🌟 Peaceful night. You feel refreshed and energized!',
                    effect: () => {
                        this.player.health = Math.min(100, this.player.health + 15);
                        this.player.energy = Math.min(100, this.player.energy + 10);
                    },
                    type: 'success'
                },
                {
                    text: '🦌 A friendly deer visited! You got some meat without hunting.',
                    effect: () => this.addToInventory('meat', 2),
                    type: 'success'
                },
                {
                    text: '🌿 You found a berry bush near your camp!',
                    effect: () => this.addToInventory('berries', 5),
                    type: 'success'
                },
                {
                    text: '🐺 Wolves howled nearby. You stayed alert all night. -15 energy.',
                    effect: () => this.player.energy = Math.max(0, this.player.energy - 15),
                    type: 'danger'
                },
                {
                    text: '☀️ Beautiful sunrise! You feel motivated. +20 energy!',
                    effect: () => this.player.energy = Math.min(100, this.player.energy + 20),
                    type: 'success'
                },
                {
                    text: '🪨 You found a stone deposit while sleeping!',
                    effect: () => this.addToInventory('stone', 4),
                    type: 'success'
                }
            ];
            const event = events[Math.floor(Math.random() * events.length)];
            event.effect();
            this.storyLog.addMessage(event.text, event.type);
        }

        this.updateAllComponents();
    }

    showCraftingMenu() {
        if (!this.config.features.craftingEnabled) {
            this.modal.open('Crafting Disabled', '<p>Crafting is disabled in this environment configuration.</p>', 'info');
            return;
        }

        const recipes = [
            { name: 'Campfire', requires: { wood: 5, stone: 3 }, effect: 'Instant: +10 HP, +15 Energy', emoji: '🔥' },
            { name: 'Shelter', requires: { wood: 10, stone: 5 }, effect: 'Instant: +15 HP, +30 Energy', emoji: '🏠' },
            { name: 'Spear', requires: { wood: 3, stone: 2 }, effect: 'Instant: Hunt 3-8 meat', emoji: '🗡️' },
            { name: 'Bandage', requires: { wood: 2, berries: 3 }, effect: 'Instant: +25 HP', emoji: '🩹' }
        ];

        const recipesHTML = recipes.map(recipe => {
            const canCraft = Object.entries(recipe.requires).every(([item, amount]) =>
                (this.inventory[item] || 0) >= amount
            );

            const requirementsHTML = Object.entries(recipe.requires)
                .map(([item, amount]) => {
                    const has = this.inventory[item] || 0;
                    const hasEnough = has >= amount;
                    return `<span class="${hasEnough ? 'has-resource' : 'needs-resource'}">${item}: ${has}/${amount}</span>`;
                }).join(', ');

            return `
                <div class="recipe-item ${canCraft ? 'can-craft' : 'cannot-craft'}">
                    <div class="recipe-header">
                        <span class="recipe-icon">${recipe.emoji}</span>
                        <span class="recipe-name">${recipe.name}</span>
                    </div>
                    <div class="recipe-requirements">${requirementsHTML}</div>
                    <div class="recipe-effect">${recipe.effect}</div>
                    ${canCraft ? `<button onclick="window.game.craftItem('${recipe.name}', ${JSON.stringify(recipe.requires).replace(/"/g, '&quot;')})">Craft</button>` : ''}
                </div>
            `;
        }).join('');

        this.modal.open('Crafting Menu', `<div class="recipes-grid">${recipesHTML}</div>`, 'craft');
    }

    craftItem(name, requires) {
        Object.entries(requires).forEach(([item, amount]) => {
            this.inventory[item] = (this.inventory[item] || 0) - amount;
        });

        this.addToInventory(name.toLowerCase(), 1);
        this.statsTracker.recordAction('craft');

        // Apply crafting benefits
        this.applyCraftingBenefit(name.toLowerCase());

        this.storyLog.addMessage(`✨ Crafted ${name}! Bonus applied.`, 'craft');
        this.modal.close();
        this.updateAllComponents();
    }

    applyCraftingBenefit(itemName) {
        const benefits = {
            campfire: () => {
                // Campfire: Restore some health and energy
                this.player.health = Math.min(100, this.player.health + 10);
                this.player.energy = Math.min(100, this.player.energy + 15);
                this.storyLog.addMessage('🔥 Campfire warmth restored 10 health and 15 energy!', 'success');
            },
            shelter: () => {
                // Shelter: Big energy boost
                this.player.energy = Math.min(100, this.player.energy + 30);
                this.player.health = Math.min(100, this.player.health + 15);
                this.storyLog.addMessage('🏠 Shelter provides safety! +30 energy, +15 health!', 'success');
            },
            spear: () => {
                // Spear: Instant successful hunt
                const meat = Math.floor((Math.random() * 5 + 3) * this.config.gameSettings.resourceMultiplier);
                this.addToInventory('meat', meat);
                this.storyLog.addMessage(`🗡️ Used spear to hunt! Got ${meat} meat instantly!`, 'success');
            },
            bandage: () => {
                // Bandage: Heal health
                this.player.health = Math.min(100, this.player.health + 25);
                this.storyLog.addMessage('🩹 Applied bandage! Restored 25 health!', 'success');
                this.flashPanel('statsPanel', 'success');
            }
        };

        if (benefits[itemName]) {
            benefits[itemName]();
        }
    }

    showEatMenu() {
        const foods = [
            { name: 'Berries', item: 'berries', hunger: 15, emoji: '🫐', desc: 'Sweet and nutritious' },
            { name: 'Meat', item: 'meat', hunger: 30, emoji: '🍖', desc: 'Filling and protein-rich' }
        ];

        const foodsHTML = foods.map(food => {
            const available = this.inventory[food.item] || 0;
            const canEat = available > 0;

            return `
                <div class="food-item ${canEat ? 'can-eat' : 'cannot-eat'}">
                    <div class="food-header">
                        <span class="food-icon">${food.emoji}</span>
                        <span class="food-name">${food.name}</span>
                    </div>
                    <div class="food-info">
                        <span class="food-available">Available: ${available}</span>
                        <span class="food-effect">+${food.hunger} Hunger</span>
                    </div>
                    <div class="food-desc">${food.desc}</div>
                    ${canEat ? `<button onclick="window.game.eatFood('${food.item}', ${food.hunger})">Eat</button>` : '<span class="no-food">None available</span>'}
                </div>
            `;
        }).join('');

        this.modal.open('Eat Food', `<div class="food-grid">${foodsHTML}</div>`, 'info');
    }

    handleInventoryClick(item) {
        // When clicking food items in inventory, eat them directly
        if (item === 'berries') {
            this.eatFood('berries', 15);
        } else if (item === 'meat') {
            this.eatFood('meat', 30);
        }
    }

    eatFood(item, hungerRestore) {
        if ((this.inventory[item] || 0) <= 0) {
            this.storyLog.addMessage(`You don't have any ${item}!`, 'danger');
            return;
        }

        this.inventory[item]--;
        this.player.hunger = Math.min(100, this.player.hunger + hungerRestore);

        const foodNames = { berries: 'berries', meat: 'meat' };
        this.storyLog.addMessage(`You ate ${foodNames[item]} and restored ${hungerRestore} hunger!`, 'success');

        this.modal.close();
        this.updateAllComponents();
    }

    showStatus() {
        const getStatColor = (value) => {
            if (value >= 70) return 'stat-good';
            if (value >= 40) return 'stat-ok';
            if (value >= 20) return 'stat-low';
            return 'stat-critical';
        };

        const getItemIcon = (item) => {
            const icons = {
                wood: '🪵', stone: '🪨', berries: '🫐', meat: '🍖',
                campfire: '🔥', shelter: '🏠', spear: '🗡️', bandage: '🩹'
            };
            return icons[item] || '📦';
        };

        const statusHTML = `
            <div class="status-modal">
                <!-- Player Stats Cards -->
                <div class="status-section">
                    <h3 class="section-title">📊 Player Status</h3>
                    <div class="stats-cards">
                        <div class="stat-card ${getStatColor(this.player.health)}">
                            <div class="stat-icon">❤️</div>
                            <div class="stat-info">
                                <div class="stat-label">Health</div>
                                <div class="stat-number">${Math.floor(this.player.health)}</div>
                            </div>
                            <div class="stat-bar-mini">
                                <div class="stat-bar-fill-mini" style="width: ${this.player.health}%"></div>
                            </div>
                        </div>
                        
                        <div class="stat-card ${getStatColor(this.player.hunger)}">
                            <div class="stat-icon">🍖</div>
                            <div class="stat-info">
                                <div class="stat-label">Hunger</div>
                                <div class="stat-number">${Math.floor(this.player.hunger)}</div>
                            </div>
                            <div class="stat-bar-mini">
                                <div class="stat-bar-fill-mini" style="width: ${this.player.hunger}%"></div>
                            </div>
                        </div>
                        
                        <div class="stat-card ${getStatColor(this.player.thirst)}">
                            <div class="stat-icon">💧</div>
                            <div class="stat-info">
                                <div class="stat-label">Thirst</div>
                                <div class="stat-number">${Math.floor(this.player.thirst)}</div>
                            </div>
                            <div class="stat-bar-mini">
                                <div class="stat-bar-fill-mini" style="width: ${this.player.thirst}%"></div>
                            </div>
                        </div>
                        
                        <div class="stat-card ${getStatColor(this.player.energy)}">
                            <div class="stat-icon">⚡</div>
                            <div class="stat-info">
                                <div class="stat-label">Energy</div>
                                <div class="stat-number">${Math.floor(this.player.energy)}</div>
                            </div>
                            <div class="stat-bar-mini">
                                <div class="stat-bar-fill-mini" style="width: ${this.player.energy}%"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Day Counter -->
                <div class="status-section">
                    <div class="day-card">
                        <div class="day-icon">☀️</div>
                        <div class="day-info">
                            <div class="day-label">Day</div>
                            <div class="day-value">${this.player.day}</div>
                        </div>
                    </div>
                </div>

                <!-- Environment Info -->
                <div class="status-section">
                    <h3 class="section-title">🌍 Environment</h3>
                    <div class="info-cards">
                        <div class="info-card">
                            <div class="info-label">Difficulty</div>
                            <div class="info-value difficulty-${this.config.difficulty.toLowerCase()}">${this.config.difficulty}</div>
                        </div>
                        <div class="info-card">
                            <div class="info-label">Danger Level</div>
                            <div class="info-value">${(this.config.gameSettings.dangerLevel * 100).toFixed(0)}%</div>
                        </div>
                    </div>
                </div>

                <!-- Inventory -->
                <div class="status-section">
                    <h3 class="section-title">🎒 Inventory</h3>
                    <div class="inventory-cards">
                        ${Object.entries(this.inventory)
                .filter(([_, amount]) => amount > 0)
                .map(([item, amount]) => `
                                <div class="inventory-card">
                                    <div class="inventory-icon">${getItemIcon(item)}</div>
                                    <div class="inventory-name">${item}</div>
                                    <div class="inventory-amount">×${amount}</div>
                                </div>
                            `).join('') || '<div class="empty-inventory">No items</div>'}
                    </div>
                </div>
            </div>
        `;
        this.modal.open('📊 Game Status', statusHTML, 'info');
    }

    hasEnergy(amount) {
        if (this.player.energy < amount) {
            this.storyLog.addMessage('Not enough energy! Rest to recover.', 'danger');
            return false;
        }
        return true;
    }

    addToInventory(item, amount) {
        this.inventory[item] = (this.inventory[item] || 0) + amount;

        // Visual feedback for adding items
        this.flashPanel('inventoryPanel', 'success');
    }

    flashPanel(panelId, type = 'success') {
        const panel = document.getElementById(panelId);
        if (panel) {
            panel.classList.add(`${type}-flash`);
            setTimeout(() => panel.classList.remove(`${type}-flash`), 500);
        }
    }

    applySettings(settings) {
        this.config.gameSettings = { ...this.config.gameSettings, ...settings };
        this.storyLog.addMessage('Settings updated!', 'success');
        this.saveGame();
    }

    saveGame(showMessage = false) {
        const gameState = {
            player: this.player,
            inventory: this.inventory,
            config: this.config
        };

        this.saveManager.saveGame(gameState);

        if (showMessage) {
            this.storyLog.addMessage('Game saved!', 'success');
        }
    }

    showStatistics() {
        const stats = this.statsTracker.getStats();
        const achievements = this.getAllAchievements();

        const statsHTML = `
            <div class="stats-summary">
                <div class="stat-card">
                    <span class="stat-value">${stats.gamesPlayed}</span>
                    <span class="stat-label">Games Played</span>
                </div>
                <div class="stat-card">
                    <span class="stat-value">${stats.bestRun}</span>
                    <span class="stat-label">Best Run (Days)</span>
                </div>
                <div class="stat-card">
                    <span class="stat-value">${stats.totalExplorations}</span>
                    <span class="stat-label">Explorations</span>
                </div>
                <div class="stat-card">
                    <span class="stat-value">${stats.successfulHunts}/${stats.totalHunts}</span>
                    <span class="stat-label">Successful Hunts</span>
                </div>
                <div class="stat-card">
                    <span class="stat-value">${stats.totalCrafts}</span>
                    <span class="stat-label">Items Crafted</span>
                </div>
                <div class="stat-card">
                    <span class="stat-value">${stats.totalRests}</span>
                    <span class="stat-label">Days Rested</span>
                </div>
            </div>
            
            <h3 style="margin-top: 1.5rem; color: var(--accent-purple);">🏆 Achievements</h3>
            <div class="achievements-grid">
                ${achievements.map(ach => `
                    <div class="achievement-card ${stats.achievements.includes(ach.id) ? 'unlocked' : 'locked'}">
                        <span class="achievement-icon">${ach.icon}</span>
                        <span class="achievement-name">${ach.name}</span>
                        <span class="achievement-desc">${ach.desc}</span>
                    </div>
                `).join('')}
            </div>
        `;

        this.modal.open('Statistics & Achievements', statsHTML, 'info');
    }

    getAllAchievements() {
        return [
            { id: 'survivor_10', name: 'Survivor', desc: 'Survive 10 days', icon: '🏕️' },
            { id: 'survivor_25', name: 'Veteran', desc: 'Survive 25 days', icon: '⛺' },
            { id: 'survivor_50', name: 'Legend', desc: 'Survive 50 days', icon: '🏔️' },
            { id: 'survivor_100', name: 'Immortal', desc: 'Survive 100 days', icon: '👑' },
            { id: 'explorer_50', name: 'Explorer', desc: 'Explore 50 times', icon: '🔍' },
            { id: 'hunter_25', name: 'Hunter', desc: 'Hunt 25 times', icon: '🏹' },
            { id: 'crafter_10', name: 'Craftsman', desc: 'Craft 10 items', icon: '🔨' },
            { id: 'gatherer_100', name: 'Gatherer', desc: 'Collect 100 resources', icon: '📦' },
            { id: 'gatherer_500', name: 'Hoarder', desc: 'Collect 500 resources', icon: '🏛️' }
        ];
    }

    checkGameOver() {
        if (this.player.health <= 0) {
            this.gameRunning = false;
            clearInterval(this.gameLoop);
            clearInterval(this.autoSaveInterval);

            // Record stats
            this.statsTracker.recordGameEnd(this.player.day);

            // Clear save on game over
            this.saveManager.clearSave();

            const stats = this.statsTracker.getStats();
            const isNewRecord = this.player.day === stats.bestRun;

            const gameOverHTML = `
                <div class="game-over">
                    <h2>💀 Game Over</h2>
                    <p>You survived <strong>${this.player.day}</strong> days!</p>
                    ${isNewRecord ? '<p style="color: var(--accent-green); font-weight: 600;">🎉 New Personal Record!</p>' : ''}
                    <p>Environment: ${this.config.environment}</p>
                    <p>Difficulty: ${this.config.difficulty}</p>
                    <p style="margin-top: 1rem; color: var(--text-secondary); font-size: 0.9rem;">
                        Best Run: ${stats.bestRun} days | Total Games: ${stats.gamesPlayed}
                    </p>
                    <button onclick="location.reload()">Play Again</button>
                </div>
            `;
            this.modal.open('Game Over', gameOverHTML, 'danger');
        }
    }

    handleStatClick(action, stat) {
        switch (action) {
            case 'eat':
                this.showEatMenu();
                break;
            case 'drink':
                this.gatherWater();
                break;
            case 'rest':
                this.rest();
                break;
        }
    }

    updateAllComponents() {
        // Set inventory BEFORE updating stats so tooltips have correct data
        this.statsPanel.setInventory(this.inventory);
        this.statsPanel.updateStats(this.player);
        this.inventoryComponent.updateItems(this.inventory);
    }

    openSettings() {
        this.settingsPanel.open();
    }

    applySettings(type, data) {
        if (type === 'preset' || type === 'custom') {
            const { settings, features } = data;

            if (settings) {
                Object.assign(this.config.gameSettings, settings);
            }

            if (features) {
                Object.assign(this.config.features, features);
            }

            // Force update of Terraform config display with new object reference
            this.terraformConfig.setConfig({ ...this.config });

            // Update settings panel
            this.settingsPanel.setSettings(this.config.gameSettings);

            // Notify user
            const message = type === 'preset' ? `⚙️ Settings updated! Preset: ${data.preset}` : '⚙️ Custom settings applied!';
            this.storyLog.addMessage(message, 'info');
            this.notifications.show(message, 'success', 3000);

            console.log('Settings updated:', this.config.gameSettings);
        } else if (type === 'reset') {
            location.reload();
        }
    }
}

export default Game;
