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
    }
};
