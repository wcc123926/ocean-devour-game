window.Game = class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.player = null;
        this.spawnManager = null;
        this.collisionManager = null;
        this.particleSystem = null;
        
        this.keys = {};
        this.mouse = { x: window.CONFIG.canvasWidth / 2, y: window.CONFIG.canvasHeight / 2 };
        this.lastTime = 0;
        this.animationId = null;
        
        this.init();
    }

    init() {
        window.Renderer.initBackground();
        this.bindEvents();
        window.UIManager.updateUI();
        window.UIManager.showStartOverlay();
    }

    bindEvents() {
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = e.clientX - rect.left;
            this.mouse.y = e.clientY - rect.top;
        });

        this.canvas.addEventListener('click', (e) => {
            if (window.GameStatus.isPlaying() && this.player) {
                this.player.boost();
            }
        });

        document.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            
            if (e.key === 'Escape') {
                if (window.GameStatus.isPlaying()) {
                    this.pause();
                } else if (window.GameStatus.isPaused()) {
                    this.resume();
                }
            }
        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });

        document.getElementById('startButton').addEventListener('click', () => this.start());
        document.getElementById('resumeButton').addEventListener('click', () => this.resume());
        document.getElementById('restartButton').addEventListener('click', () => this.restart());
        document.getElementById('pauseRestartButton').addEventListener('click', () => this.restart());
    }

    start() {
        window.GameStatus.reset();
        
        this.player = new window.Player(
            window.CONFIG.canvasWidth / 2,
            window.CONFIG.canvasHeight / 2,
            window.CONFIG.playerBaseSize
        );
        
        this.spawnManager = new window.SpawnManager(this);
        this.collisionManager = new window.CollisionManager(this);
        this.particleSystem = new window.ParticleSystem();

        window.UIManager.hideAllOverlays();

        this.lastTime = performance.now();
        this.gameLoop();
    }

    pause() {
        if (!window.GameStatus.isPlaying()) return;
        window.GameStatus.state = window.GameState.PAUSED;
        window.UIManager.showPauseOverlay();
        cancelAnimationFrame(this.animationId);
    }

    resume() {
        if (!window.GameStatus.isPaused()) return;
        window.GameStatus.state = window.GameState.PLAYING;
        window.UIManager.hidePauseOverlay();
        this.lastTime = performance.now();
        this.gameLoop();
    }

    restart() {
        this.start();
    }

    gameOver() {
        console.log('Game Over triggered!');
        window.GameStatus.state = window.GameState.GAME_OVER;
        cancelAnimationFrame(this.animationId);
        window.UIManager.showGameOverOverlay();
    }

    gameLoop(currentTime = performance.now()) {
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

        this.update(deltaTime);
        this.render();

        this.animationId = requestAnimationFrame((time) => this.gameLoop(time));
    }

    update(deltaTime) {
        if (!window.GameStatus.isPlaying()) return;

        window.GameStatus.updateTime(deltaTime);
        window.Renderer.updateBackground(deltaTime);

        if (this.player) {
            this.player.update(deltaTime, this.mouse, this.canvas);
        }

        if (this.spawnManager) {
            this.spawnManager.spawnEnemyFish();
            this.spawnManager.spawnPowerups();
            this.spawnManager.update(deltaTime, this.canvas);
        }

        if (this.particleSystem) {
            this.particleSystem.update(deltaTime);
        }

        if (this.collisionManager) {
            this.collisionManager.checkAllCollisions();
        }

        window.UIManager.updateUI();
    }

    render() {
        window.Renderer.render(this.ctx, this);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    console.log('Game initializing...');
    console.log('CONFIG:', window.CONFIG);
    window.gameInstance = new window.Game();
});
