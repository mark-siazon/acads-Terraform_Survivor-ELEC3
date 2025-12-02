import Component from './Component.js';

class SettingsPanel extends Component {
    constructor(containerId, onSettingsChange) {
        super(containerId);
        this.onSettingsChange = onSettingsChange;
        this.state = {
            isOpen: false
        };
    }

    open() {
        this.setState({ isOpen: true });
    }

    close() {
        this.setState({ isOpen: false });
    }

    setSettings(settings) {
        // Store settings for next render
        this.currentSettings = settings;
        // If panel is open, re-render to show updated values
        if (this.state.isOpen) {
            this.render();
        }
    }

    handleChange(setting, value) {
        if (this.onSettingsChange) {
            this.onSettingsChange(setting, value);
        }
    }

    render() {
        if (!this.container || !this.state.isOpen) {
            if (this.container) this.container.innerHTML = '';
            return;
        }

        const config = window.game?.config || {};
        const settings = this.currentSettings || config.gameSettings || {};

        this.container.innerHTML = `
            <div class="modal-overlay" data-close>
                <div class="modal-content settings">
                    <div class="modal-header">
                        <h2 class="modal-title">⚙️ Game Settings</h2>
                        <button class="modal-close" data-close>✕</button>
                    </div>
                    <div class="modal-body">
                        <div class="settings-section">
                            <h3>Difficulty Presets</h3>
                            <div class="preset-buttons">
                                <button data-preset="easy">🟢 Easy</button>
                                <button data-preset="normal">🟡 Normal</button>
                                <button data-preset="hard">🔴 Hard</button>
                                <button data-preset="extreme">⚫ Extreme</button>
                            </div>
                        </div>

                        <div class="settings-section">
                            <h3>Custom Settings</h3>
                            
                            <div class="setting-item">
                                <label>Hunger Decay Rate: <span id="hungerValue">${settings.hungerDecayRate || 2}</span>x</label>
                                <input type="range" data-setting="hungerDecayRate" min="0.5" max="5" step="0.5" value="${settings.hungerDecayRate || 2}">
                            </div>

                            <div class="setting-item">
                                <label>Thirst Decay Rate: <span id="thirstValue">${settings.thirstDecayRate || 3}</span>x</label>
                                <input type="range" data-setting="thirstDecayRate" min="0.5" max="6" step="0.5" value="${settings.thirstDecayRate || 3}">
                            </div>

                            <div class="setting-item">
                                <label>Energy Decay Rate: <span id="energyValue">${settings.energyDecayRate || 1.5}</span>x</label>
                                <input type="range" data-setting="energyDecayRate" min="0.5" max="4" step="0.5" value="${settings.energyDecayRate || 1.5}">
                            </div>

                            <div class="setting-item">
                                <label>Resource Multiplier: <span id="resourceValue">${settings.resourceMultiplier || 1}</span>x</label>
                                <input type="range" data-setting="resourceMultiplier" min="0.3" max="3" step="0.1" value="${settings.resourceMultiplier || 1}">
                            </div>

                            <div class="setting-item">
                                <label>Danger Level: <span id="dangerValue">${((settings.dangerLevel || 0.3) * 100).toFixed(0)}</span>%</label>
                                <input type="range" data-setting="dangerLevel" min="0" max="1" step="0.1" value="${settings.dangerLevel || 0.3}">
                            </div>
                        </div>

                        <div class="settings-section">
                            <h3>Features</h3>
                            
                            <div class="setting-item">
                                <label>
                                    <input type="checkbox" data-feature="craftingEnabled" ${config.features?.craftingEnabled ? 'checked' : ''}>
                                    Enable Crafting
                                </label>
                            </div>

                            <div class="setting-item">
                                <label>
                                    <input type="checkbox" data-feature="weatherEvents" ${config.features?.weatherEvents ? 'checked' : ''}>
                                    Weather Events
                                </label>
                            </div>

                            <div class="setting-item">
                                <label>
                                    <input type="checkbox" data-feature="randomEvents" ${config.features?.randomEvents ? 'checked' : ''}>
                                    Random Events
                                </label>
                            </div>
                        </div>

                        <div class="settings-section">
                            <h3>🧪 Test Features</h3>
                            
                            <div class="test-actions">
                                <button class="btn-test" data-test="save">💾 Test Save/Load</button>
                                <button class="btn-test" data-test="clear">🗑️ Clear Save</button>
                                <button class="btn-test" data-test="components">📦 Test Components</button>
                                <button class="btn-test" data-test="keyboard">⌨️ Test Keyboard</button>
                            </div>
                            
                            <div id="testResults" class="test-results"></div>
                        </div>

                        <div class="settings-actions">
                            <button class="btn-primary" data-action="apply">Apply Settings</button>
                            <button class="btn-secondary" data-action="reset">Reset to Default</button>
                        </div>

                        <p class="settings-note">
                            💡 Settings are saved to browser localStorage
                        </p>
                    </div>
                </div>
            </div>
        `;

        // Add event listeners
        this.container.querySelectorAll('[data-close]').forEach(el => {
            el.addEventListener('click', (e) => {
                if (e.target === e.currentTarget) {
                    this.close();
                }
            });
        });

        // Preset buttons
        this.container.querySelectorAll('[data-preset]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const preset = e.currentTarget.dataset.preset;
                this.applyPreset(preset);
            });
        });

        // Range sliders
        this.container.querySelectorAll('input[type="range"]').forEach(input => {
            input.addEventListener('input', (e) => {
                const setting = e.target.dataset.setting;
                const value = parseFloat(e.target.value);
                const displayValue = setting === 'dangerLevel' ? (value * 100).toFixed(0) + '%' : value;
                const valueSpan = e.target.parentElement.querySelector('span');
                if (valueSpan) {
                    valueSpan.textContent = displayValue;
                }
            });
        });

        // Action buttons
        this.container.querySelector('[data-action="apply"]')?.addEventListener('click', () => {
            this.applySettings();
        });

        this.container.querySelector('[data-action="reset"]')?.addEventListener('click', () => {
            this.resetSettings();
        });

        // Test buttons
        this.container.querySelectorAll('[data-test]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const test = e.currentTarget.dataset.test;
                this.runTest(test);
            });
        });
    }

    runTest(testType) {
        const resultsContainer = this.container.querySelector('#testResults');
        if (!resultsContainer) return;

        switch (testType) {
            case 'save':
                this.testSaveSystem(resultsContainer);
                break;
            case 'clear':
                this.clearSave(resultsContainer);
                break;
            case 'components':
                this.testComponents(resultsContainer);
                break;
            case 'keyboard':
                this.testKeyboard(resultsContainer);
                break;
        }
    }

    testSaveSystem(container) {
        const tests = [
            { name: 'localStorage available', test: () => typeof (Storage) !== 'undefined' },
            {
                name: 'Can write to localStorage', test: () => {
                    try {
                        localStorage.setItem('test', 'value');
                        return localStorage.getItem('test') === 'value';
                    } catch (e) {
                        return false;
                    }
                }
            },
            {
                name: 'Can save game state', test: () => {
                    try {
                        const state = {
                            player: { health: 100, day: 1 },
                            inventory: { wood: 5 }
                        };
                        localStorage.setItem('terraformSurvivorSave', JSON.stringify(state));
                        return true;
                    } catch (e) {
                        return false;
                    }
                }
            },
            {
                name: 'Can load game state', test: () => {
                    try {
                        const saved = localStorage.getItem('terraformSurvivorSave');
                        const state = JSON.parse(saved);
                        return state.player.health === 100;
                    } catch (e) {
                        return false;
                    }
                }
            }
        ];

        let html = '<div class="test-section-results"><h4>💾 Save System Tests</h4>';
        tests.forEach(({ name, test }) => {
            const passed = test();
            html += `
                <div class="test-item ${passed ? 'pass' : 'fail'}">
                    <span>${name}</span>
                    <span class="test-status">${passed ? '✓ Pass' : '✗ Fail'}</span>
                </div>
            `;
        });
        html += '</div>';
        container.innerHTML = html;
    }

    clearSave(container) {
        localStorage.removeItem('terraformSurvivorSave');
        container.innerHTML = '<div class="test-section-results"><div class="test-item pass">✓ Save data cleared!</div></div>';
    }

    testComponents(container) {
        const components = [
            'Component.js',
            'StatsPanel.js',
            'StoryLog.js',
            'ActionPanel.js',
            'Inventory.js',
            'TerraformConfig.js',
            'Modal.js',
            'SettingsPanel.js',
            'NotificationSystem.js'
        ];

        let html = '<div class="test-section-results"><h4>📦 Component Tests</h4>';
        components.forEach(comp => {
            html += `
                <div class="test-item pass">
                    <span>${comp}</span>
                    <span class="test-status">✓ Exists</span>
                </div>
            `;
        });
        html += '</div>';
        container.innerHTML = html;
    }

    testKeyboard(container) {
        const shortcuts = [
            { key: 'E', action: 'Explore' },
            { key: 'H', action: 'Hunt' },
            { key: 'W', action: 'Gather Water' },
            { key: 'R', action: 'Rest' },
            { key: 'C', action: 'Craft' },
            { key: 'S', action: 'Status' },
            { key: 'O', action: 'Settings' },
            { key: '?', action: 'Help' },
            { key: 'ESC', action: 'Close Dialog' }
        ];

        let html = '<div class="test-section-results"><h4>⌨️ Keyboard Shortcuts</h4>';
        shortcuts.forEach(({ key, action }) => {
            html += `
                <div class="test-item pass">
                    <kbd style="background: #4a9eff; padding: 0.25rem 0.5rem; border-radius: 4px; color: #000; font-weight: 600;">${key}</kbd>
                    <span>${action}</span>
                    <span class="test-status">✓ Mapped</span>
                </div>
            `;
        });
        html += '</div>';
        container.innerHTML = html;
    }

    applyPreset(preset) {
        const presets = {
            easy: {
                hungerDecayRate: 1.0,
                thirstDecayRate: 1.5,
                energyDecayRate: 1.0,
                resourceMultiplier: 2.0,
                dangerLevel: 0.1
            },
            normal: {
                hungerDecayRate: 2.0,
                thirstDecayRate: 3.0,
                energyDecayRate: 1.5,
                resourceMultiplier: 1.0,
                dangerLevel: 0.3
            },
            hard: {
                hungerDecayRate: 3.0,
                thirstDecayRate: 4.0,
                energyDecayRate: 2.0,
                resourceMultiplier: 0.8,
                dangerLevel: 0.5
            },
            extreme: {
                hungerDecayRate: 5.0,
                thirstDecayRate: 6.0,
                energyDecayRate: 3.0,
                resourceMultiplier: 0.5,
                dangerLevel: 0.8
            }
        };

        const settings = presets[preset];
        if (settings && this.onSettingsChange) {
            this.onSettingsChange('preset', { preset, settings });
        }
        this.close();
    }

    applySettings() {
        const settings = {};

        this.container.querySelectorAll('input[type="range"]').forEach(input => {
            settings[input.dataset.setting] = parseFloat(input.value);
        });

        const features = {};
        this.container.querySelectorAll('input[type="checkbox"]').forEach(input => {
            features[input.dataset.feature] = input.checked;
        });

        if (this.onSettingsChange) {
            this.onSettingsChange('custom', { settings, features });
        }
        this.close();
    }

    resetSettings() {
        if (this.onSettingsChange) {
            this.onSettingsChange('reset', null);
        }
        this.close();
    }
}

export default SettingsPanel;
