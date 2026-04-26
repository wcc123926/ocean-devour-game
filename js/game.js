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
        
        this.touchInput = {
            active: false,
            joystickCenter: { x: 0, y: 0 },
            joystickCurrent: { x: 0, y: 0 }
        };
        
        this.init();
    }

    init() {
        window.Renderer.initBackground();
        window.UIManager.init();
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

        this.bindTouchEvents();

        document.getElementById('startButton').addEventListener('click', () => this.start());
        document.getElementById('resumeButton').addEventListener('click', () => this.resume());
        document.getElementById('restartButton').addEventListener('click', () => this.restart());
        document.getElementById('pauseRestartButton').addEventListener('click', () => this.restart());
    }

    bindTouchEvents() {
        const joystickArea = document.getElementById('joystickArea');
        const joystickBase = document.getElementById('joystickBase');
        const joystickStick = document.getElementById('joystickStick');
        const boostBtn = document.getElementById('boostBtn');

        joystickArea.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = joystickArea.getBoundingClientRect();
            
            this.touchInput.active = true;
            this.touchInput.joystickCenter = {
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2
            };
            this.touchInput.joystickCurrent = {
                x: touch.clientX,
                y: touch.clientY
            };
            
            this.updateJoystickPosition(touch.clientX, touch.clientY);
        }, { passive: false });

        joystickArea.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (!this.touchInput.active) return;
            
            const touch = e.touches[0];
            this.touchInput.joystickCurrent = {
                x: touch.clientX,
                y: touch.clientY
            };
            
            this.updateJoystickPosition(touch.clientX, touch.clientY);
            this.updateTouchTarget();
        }, { passive: false });

        joystickArea.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.touchInput.active = false;
            
            joystickStick.style.transform = 'translate(0, 0)';
            
            if (this.player) {
                this.mouse = {
                    x: this.player.x,
                    y: this.player.y
                };
            }
        }, { passive: false });

        boostBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            boostBtn.classList.add('active');
            if (window.GameStatus.isPlaying() && this.player) {
                this.player.boost();
            }
        }, { passive: false });

        boostBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            boostBtn.classList.remove('active');
        }, { passive: false });

        this.canvas.addEventListener('touchstart', (e) => {
            if (e.target === this.canvas) {
                const touch = e.touches[0];
                const rect = this.canvas.getBoundingClientRect();
                this.mouse.x = touch.clientX - rect.left;
                this.mouse.y = touch.clientY - rect.top;
            }
        }, { passive: false });

        this.canvas.addEventListener('touchmove', (e) => {
            if (e.target === this.canvas) {
                const touch = e.touches[0];
                const rect = this.canvas.getBoundingClientRect();
                this.mouse.x = touch.clientX - rect.left;
                this.mouse.y = touch.clientY - rect.top;
            }
        }, { passive: false });
    }

    updateJoystickPosition(touchX, touchY) {
        const joystickStick = document.getElementById('joystickStick');
        const joystickBase = document.getElementById('joystickBase');
        
        const baseRect = joystickBase.getBoundingClientRect();
        const baseCenterX = baseRect.left + baseRect.width / 2;
        const baseCenterY = baseRect.top + baseRect.height / 2;
        
        let dx = touchX - baseCenterX;
        let dy = touchY - baseCenterY;
        
        const maxDistance = baseRect.width / 4;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > maxDistance) {
            const ratio = maxDistance / distance;
            dx *= ratio;
            dy *= ratio;
        }
        
        joystickStick.style.transform = `translate(${dx}px, ${dy}px)`;
    }

    updateTouchTarget() {
        if (!this.touchInput.active || !this.player) return;
        
        const { joystickCenter, joystickCurrent } = this.touchInput;
        const dx = joystickCurrent.x - joystickCenter.x;
        const dy = joystickCurrent.y - joystickCenter.y;
        
        const maxDistance = 60;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const speedMultiplier = Math.min(distance / maxDistance, 1.5);
        
        const targetX = this.player.x + dx * 5;
        const targetY = this.player.y + dy * 5;
        
        this.mouse.x = Math.max(0, Math.min(window.CONFIG.canvasWidth, targetX));
        this.mouse.y = Math.max(0, Math.min(window.CONFIG.canvasHeight, targetY));
    }

    start() {
        window.GameStatus.reset();
        
        this.player = new window.Player(
            window.CONFIG.canvasWidth / 2,
            window.CONFIG.canvasHeight / 2,
            window.CONFIG.playerBaseSize
        );
        
        window.GameStatus.updateMaxSize(window.CONFIG.playerBaseSize);
        window.GameStatus.updateStagesReached(0);
        window.UIManager.previousStageIndex = 0;
        window.UIManager.previousSpeedBoost = false;
        window.UIManager.previousShield = false;
        
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
            window.GameStatus.updateMaxSize(this.player.size);
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
