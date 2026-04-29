window.GameState = {
    START: 'start',
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAME_OVER: 'gameOver'
};

window.GameStatus = {
    state: window.GameState.START,
    score: 0,
    gameTime: 0,
    isStartupPhase: true,
    difficulty: window.Difficulty.NORMAL,
    controlMode: window.ControlMode.MOUSE,
    fishEaten: 0,
    powerupsCollected: 0,
    stagesReached: 1,
    maxSize: 25,
    deathCause: window.DeathCause.UNKNOWN,
    explosionsTriggered: 0,
    fishKilledByExplosion: 0,
    
    selectedFishType: window.FishType.NORMAL,
    skill1Used: 0,
    skill2Used: 0,
    
    useCustomColor: false,
    customBodyColor: null,
    customDarkColor: null,
    customLightColor: null,
    
    pearls: 0,
    unlockedSkins: {},
    currentSkin: {},
    
    _storageKey: 'ocean_devour_save',
    
    init: function() {
        this.state = window.GameState.START;
        this.score = 0;
        this.gameTime = 0;
        this.isStartupPhase = true;
        this.difficulty = window.Difficulty.NORMAL;
        this.controlMode = window.ControlMode.MOUSE;
        this.fishEaten = 0;
        this.powerupsCollected = 0;
        this.stagesReached = 1;
        this.maxSize = 25;
        this.deathCause = window.DeathCause.UNKNOWN;
        this.explosionsTriggered = 0;
        this.fishKilledByExplosion = 0;
        this.selectedFishType = window.FishType.NORMAL;
        this.skill1Used = 0;
        this.skill2Used = 0;
        this.useCustomColor = false;
        this.customBodyColor = null;
        this.customDarkColor = null;
        this.customLightColor = null;
    },
    
    reset: function() {
        this.state = window.GameState.PLAYING;
        this.score = 0;
        this.gameTime = 0;
        this.isStartupPhase = true;
        this.fishEaten = 0;
        this.powerupsCollected = 0;
        this.stagesReached = 1;
        this.maxSize = 25;
        this.deathCause = window.DeathCause.UNKNOWN;
        this.explosionsTriggered = 0;
        this.fishKilledByExplosion = 0;
        this.skill1Used = 0;
        this.skill2Used = 0;
    },
    
    setCustomColors: function(bodyColor, darkColor, lightColor) {
        this.useCustomColor = true;
        this.customBodyColor = bodyColor;
        this.customDarkColor = darkColor;
        this.customLightColor = lightColor;
    },
    
    clearCustomColors: function() {
        this.useCustomColor = false;
        this.customBodyColor = null;
        this.customDarkColor = null;
        this.customLightColor = null;
    },
    
    getDifficultyConfig: function() {
        return window.DifficultyConfig[this.difficulty];
    },
    
    updateTime: function(deltaTime) {
        this.gameTime += deltaTime * 1000;
        
        const diffConfig = this.getDifficultyConfig();
        if (this.isStartupPhase && this.gameTime > diffConfig.startupDuration) {
            this.isStartupPhase = false;
            console.log('Startup phase ended, danger fish now spawning');
        }
    },
    
    addScore: function(points) {
        this.score += points;
    },
    
    incrementFishEaten: function() {
        this.fishEaten++;
    },
    
    incrementPowerupsCollected: function() {
        this.powerupsCollected++;
    },
    
    updateStagesReached: function(stageIndex) {
        if (stageIndex + 1 > this.stagesReached) {
            this.stagesReached = stageIndex + 1;
        }
    },
    
    updateMaxSize: function(size) {
        if (size > this.maxSize) {
            this.maxSize = size;
        }
    },
    
    setDeathCause: function(cause) {
        this.deathCause = cause;
    },
    
    incrementExplosionsTriggered: function() {
        this.explosionsTriggered++;
    },
    
    addFishKilledByExplosion: function(count) {
        this.fishKilledByExplosion += count;
    },
    
    getSelectedFishConfig: function() {
        return window.CONFIG.fishTypes[this.selectedFishType];
    },
    
    setSelectedFishType: function(fishType) {
        this.selectedFishType = fishType;
        console.log('Fish type selected:', fishType);
    },
    
    incrementSkill1Used: function() {
        this.skill1Used++;
    },
    
    incrementSkill2Used: function() {
        this.skill2Used++;
    },
    
    formatTime: function(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    },
    
    isPlaying: function() {
        return this.state === window.GameState.PLAYING;
    },
    
    isPaused: function() {
        return this.state === window.GameState.PAUSED;
    },
    
    isGameOver: function() {
        return this.state === window.GameState.GAME_OVER;
    },
    
    loadSave: function() {
        try {
            const saved = localStorage.getItem(this._storageKey);
            if (saved) {
                const data = JSON.parse(saved);
                this.pearls = data.pearls || 0;
                this.unlockedSkins = data.unlockedSkins || {};
                this.currentSkin = data.currentSkin || {};
                console.log('Save loaded:', { pearls: this.pearls, unlockedSkins: this.unlockedSkins, currentSkin: this.currentSkin });
            }
        } catch (e) {
            console.error('Error loading save:', e);
            this.pearls = 0;
            this.unlockedSkins = {};
            this.currentSkin = {};
        }
    },
    
    saveSave: function() {
        try {
            const data = {
                pearls: this.pearls,
                unlockedSkins: this.unlockedSkins,
                currentSkin: this.currentSkin
            };
            localStorage.setItem(this._storageKey, JSON.stringify(data));
            console.log('Save saved:', data);
        } catch (e) {
            console.error('Error saving save:', e);
        }
    },
    
    addPearls: function(amount) {
        this.pearls += amount;
        this.saveSave();
        console.log('Pearls added:', amount, 'Total:', this.pearls);
    },
    
    spendPearls: function(amount) {
        if (this.pearls >= amount) {
            this.pearls -= amount;
            this.saveSave();
            return true;
        }
        return false;
    },
    
    unlockSkin: function(skinId) {
        this.unlockedSkins[skinId] = true;
        this.saveSave();
        console.log('Skin unlocked:', skinId);
    },
    
    isSkinUnlocked: function(skinId) {
        return this.unlockedSkins[skinId] === true;
    },
    
    setCurrentSkin: function(fishType, skinId) {
        this.currentSkin[fishType] = skinId;
        this.saveSave();
        console.log('Current skin set for', fishType, ':', skinId);
    },
    
    getCurrentSkin: function(fishType) {
        return this.currentSkin[fishType] || window.SkinId.DEFAULT;
    },
    
    getCurrentSkinConfig: function(fishType) {
        const skinId = this.getCurrentSkin(fishType);
        if (skinId === window.SkinId.DEFAULT) {
            return null;
        }
        
        for (const key in window.CONFIG.skins) {
            const skin = window.CONFIG.skins[key];
            if (skin.id === skinId && skin.fishType === fishType) {
                return skin;
            }
        }
        return null;
    },
    
    isSkinOwned: function(fishType, skinId) {
        if (skinId === window.SkinId.DEFAULT) {
            return true;
        }
        return this.isSkinUnlocked(skinId);
    },
    
    purchaseSkin: function(skinConfig) {
        if (this.pearls >= skinConfig.price && !this.isSkinUnlocked(skinConfig.id)) {
            this.spendPearls(skinConfig.price);
            this.unlockSkin(skinConfig.id);
            return true;
        }
        return false;
    }
};
