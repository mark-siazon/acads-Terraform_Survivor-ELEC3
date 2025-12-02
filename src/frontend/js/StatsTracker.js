class StatsTracker {
    constructor() {
        this.stats = this.loadStats();
    }

    loadStats() {
        try {
            const saved = localStorage.getItem('terraformSurvivorStats');
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (e) {
            console.error('Failed to load stats:', e);
        }

        return {
            gamesPlayed: 0,
            totalDaysSurvived: 0,
            bestRun: 0,
            totalExplorations: 0,
            totalHunts: 0,
            successfulHunts: 0,
            totalCrafts: 0,
            totalRests: 0,
            resourcesGathered: {},
            achievements: []
        };
    }

    saveStats() {
        try {
            localStorage.setItem('terraformSurvivorStats', JSON.stringify(this.stats));
        } catch (e) {
            console.error('Failed to save stats:', e);
        }
    }

    recordGameStart() {
        this.stats.gamesPlayed++;
        this.saveStats();
    }

    recordGameEnd(days) {
        this.stats.totalDaysSurvived += days;
        if (days > this.stats.bestRun) {
            this.stats.bestRun = days;
            this.checkAchievement('survivor', days);
        }
        this.saveStats();
    }

    recordAction(action, success = true) {
        switch (action) {
            case 'explore':
                this.stats.totalExplorations++;
                break;
            case 'hunt':
                this.stats.totalHunts++;
                if (success) this.stats.successfulHunts++;
                break;
            case 'craft':
                this.stats.totalCrafts++;
                break;
            case 'rest':
                this.stats.totalRests++;
                break;
        }
        this.checkActionAchievements();
        this.saveStats();
    }

    recordResource(resource, amount) {
        if (!this.stats.resourcesGathered[resource]) {
            this.stats.resourcesGathered[resource] = 0;
        }
        this.stats.resourcesGathered[resource] += amount;
        this.checkResourceAchievements();
        this.saveStats();
    }

    checkAchievement(id, value) {
        const achievements = {
            survivor: [
                { id: 'survivor_10', name: 'Survivor', desc: 'Survive 10 days', days: 10, icon: '🏕️' },
                { id: 'survivor_25', name: 'Veteran', desc: 'Survive 25 days', days: 25, icon: '⛺' },
                { id: 'survivor_50', name: 'Legend', desc: 'Survive 50 days', days: 50, icon: '🏔️' },
                { id: 'survivor_100', name: 'Immortal', desc: 'Survive 100 days', days: 100, icon: '👑' }
            ]
        };

        if (id === 'survivor') {
            let unlockedAchievement = null;
            achievements.survivor.forEach(ach => {
                if (value >= ach.days && !this.stats.achievements.includes(ach.id)) {
                    unlockedAchievement = this.unlockAchievement(ach);
                }
            });
            return unlockedAchievement;
        }
        return null;
    }

    checkActionAchievements() {
        const actionAchievements = [
            { id: 'explorer_50', name: 'Explorer', desc: 'Explore 50 times', icon: '🔍', check: () => this.stats.totalExplorations >= 50 },
            { id: 'hunter_25', name: 'Hunter', desc: 'Hunt 25 times', icon: '🏹', check: () => this.stats.totalHunts >= 25 },
            { id: 'crafter_10', name: 'Craftsman', desc: 'Craft 10 items', icon: '🔨', check: () => this.stats.totalCrafts >= 10 }
        ];

        actionAchievements.forEach(ach => {
            if (ach.check() && !this.stats.achievements.includes(ach.id)) {
                this.unlockAchievement(ach);
            }
        });
    }

    checkResourceAchievements() {
        const total = Object.values(this.stats.resourcesGathered).reduce((sum, val) => sum + val, 0);

        const resourceAchievements = [
            { id: 'gatherer_100', name: 'Gatherer', desc: 'Collect 100 resources', icon: '📦', amount: 100 },
            { id: 'gatherer_500', name: 'Hoarder', desc: 'Collect 500 resources', icon: '🏛️', amount: 500 }
        ];

        resourceAchievements.forEach(ach => {
            if (total >= ach.amount && !this.stats.achievements.includes(ach.id)) {
                this.unlockAchievement(ach);
            }
        });
    }

    unlockAchievement(achievement) {
        this.stats.achievements.push(achievement.id);
        this.saveStats();
        return achievement;
    }

    getStats() {
        return { ...this.stats };
    }

    getAchievements() {
        return this.stats.achievements;
    }

    resetStats() {
        this.stats = {
            gamesPlayed: 0,
            totalDaysSurvived: 0,
            bestRun: 0,
            totalExplorations: 0,
            totalHunts: 0,
            successfulHunts: 0,
            totalCrafts: 0,
            totalRests: 0,
            resourcesGathered: {},
            achievements: []
        };
        this.saveStats();
    }
}

export default StatsTracker;
