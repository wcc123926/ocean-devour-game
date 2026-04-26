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
    
    init: function() {
        this.state = window.GameState.START;
        this.score = 0;
        this.gameTime = 0;
        this.isStartupPhase = true;
    },
    
    reset: function() {
        this.state = window.GameState.PLAYING;
        this.score = 0;
        this.gameTime = 0;
        this.isStartupPhase = true;
    },
    
    updateTime: function(deltaTime) {
        this.gameTime += deltaTime * 1000;
        
        if (this.isStartupPhase && this.gameTime > window.CONFIG.startupDuration) {
            this.isStartupPhase = false;
            console.log('Startup phase ended, danger fish now spawning');
        }
    },
    
    addScore: function(points) {
        this.score += points;
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
