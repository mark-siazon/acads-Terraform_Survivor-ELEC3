class SaveManager {
    constructor() {
        this.storageKey = 'terraformSurvivor_save';
        this.settingsKey = 'terraformSurvivor_settings';
    }

    saveGame(gameState) {
        try {
            const saveData = {
                player: gameState.player,
                inventory: gameState.inventory,
                config: gameState.config,
                timestamp: Date.now(),
                version: '1.0'
            };
            localStorage.setItem(this.storageKey, JSON.stringify(saveData));
            return true;
        } catch (e) {
            console.error('Failed to save game:', e);
            return false;
        }
    }

    loadGame() {
        try {
            const data = localStorage.getItem(this.storageKey);
            if (!data) return null;

            const saveData = JSON.parse(data);
            return saveData;
        } catch (e) {
            console.error('Failed to load game:', e);
            return null;
        }
    }

    deleteSave() {
        try {
            localStorage.removeItem(this.storageKey);
            return true;
        } catch (e) {
            console.error('Failed to delete save:', e);
            return false;
        }
    }

    clearSave() {
        return this.deleteSave();
    }

    hasSave() {
        return localStorage.getItem(this.storageKey) !== null;
    }

    saveSettings(settings) {
        try {
            localStorage.setItem(this.settingsKey, JSON.stringify(settings));
            return true;
        } catch (e) {
            console.error('Failed to save settings:', e);
            return false;
        }
    }

    loadSettings() {
        try {
            const data = localStorage.getItem(this.settingsKey);
            if (!data) return null;
            return JSON.parse(data);
        } catch (e) {
            console.error('Failed to load settings:', e);
            return null;
        }
    }

    getSaveInfo() {
        const save = this.loadGame();
        if (!save) return null;

        return {
            day: save.player.day,
            health: save.player.health,
            timestamp: new Date(save.timestamp).toLocaleString(),
            version: save.version
        };
    }
}

export default SaveManager;
