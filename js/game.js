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
        
        this.explosionManager = null;
        
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
            const key = e.key.toLowerCase();
            this.keys[key] = true;
            
            if (e.key === 'Escape') {
                if (window.GameStatus.isPlaying()) {
                    this.pause();
                } else if (window.GameStatus.isPaused()) {
                    this.resume();
                }
            }
            
            if ((key === ' ' || key === 'space') && window.GameStatus.isPlaying() && this.player) {
                this.player.boost();
            }
        });

        document.addEventListener('keyup', (e) => {
            const key = e.key.toLowerCase();
            this.keys[key] = false;
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
        this.explosionManager = new window.ExplosionManager(this);

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
            this.player.update(deltaTime, this.mouse, this.canvas, this.keys);
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

        if (this.explosionManager) {
            this.explosionManager.update(deltaTime);
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

window.ExplosionState = {
    IDLE: 'idle',
    WARNING: 'warning',
    EXPLODING: 'exploding',
    COOLDOWN: 'cooldown'
};

window.ExplosionManager = class ExplosionManager {
    constructor(game) {
        this.game = game;
        this.state = window.ExplosionState.IDLE;
        
        this.timeUntilNextExplosion = this.getRandomInterval();
        this.countdownTime = 0;
        this.currentCountdown = 0;
        
        this.explosionX = 0;
        this.explosionY = 0;
        this.explosionRadius = 0;
        
        this.warningPulsePhase = 0;
        this.explosionAnimationPhase = 0;
        
        this.isExplosionEnabled = window.CONFIG.explosion.enabled;
    }

    getRandomInterval() {
        const { minInterval, maxInterval } = window.CONFIG.explosion;
        return minInterval + Math.random() * (maxInterval - minInterval);
    }

    getRandomRadius() {
        const { minRadius, maxRadius } = window.CONFIG.explosion;
        return minRadius + Math.random() * (maxRadius - minRadius);
    }

    update(deltaTime) {
        if (!this.isExplosionEnabled || !window.GameStatus.isPlaying()) return;

        const deltaMs = deltaTime * 1000;

        switch (this.state) {
            case window.ExplosionState.IDLE:
                this.updateIdle(deltaMs);
                break;
            case window.ExplosionState.WARNING:
                this.updateWarning(deltaMs);
                break;
            case window.ExplosionState.EXPLODING:
                this.updateExploding(deltaMs);
                break;
        }
    }

    updateIdle(deltaMs) {
        this.timeUntilNextExplosion -= deltaMs;
        
        if (this.timeUntilNextExplosion <= 0) {
            this.startWarning();
        }
    }

    startWarning() {
        this.state = window.ExplosionState.WARNING;
        this.countdownTime = window.CONFIG.explosion.countdownTime;
        this.currentCountdown = this.countdownTime;
        
        const margin = 150;
        this.explosionX = margin + Math.random() * (window.CONFIG.canvasWidth - margin * 2);
        this.explosionY = margin + Math.random() * (window.CONFIG.canvasHeight - margin * 2);
        this.explosionRadius = this.getRandomRadius();
        
        this.warningPulsePhase = 0;
        
        this.showWarningUI();
        
        console.log('Explosion warning started at:', this.explosionX, this.explosionY, 'radius:', this.explosionRadius);
    }

    showWarningUI() {
        const warningElement = document.getElementById('explosionWarning');
        if (warningElement) {
            warningElement.classList.remove('hidden');
        }
        this.updateCountdownDisplay();
    }

    hideWarningUI() {
        const warningElement = document.getElementById('explosionWarning');
        if (warningElement) {
            warningElement.classList.add('hidden');
        }
    }

    updateCountdownDisplay() {
        const countdownElement = document.getElementById('explosionCountdown');
        if (countdownElement) {
            const seconds = Math.ceil(this.currentCountdown / 1000);
            countdownElement.textContent = seconds;
        }
    }

    updateWarning(deltaMs) {
        this.currentCountdown -= deltaMs;
        this.warningPulsePhase += deltaMs * 0.01 * window.CONFIG.explosion.warningPulseRate;
        
        this.updateCountdownDisplay();
        
        if (this.currentCountdown <= 0) {
            this.explode();
        }
    }

    explode() {
        this.state = window.ExplosionState.EXPLODING;
        this.explosionAnimationPhase = 0;
        
        window.GameStatus.incrementExplosionsTriggered();
        
        this.hideWarningUI();
        
        let playerKilled = false;
        let fishKilled = 0;
        
        if (this.game.player) {
            const dx = this.game.player.x - this.explosionX;
            const dy = this.game.player.y - this.explosionY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance <= this.explosionRadius) {
                window.GameStatus.setDeathCause(window.DeathCause.EXPLOSION);
                playerKilled = true;
            }
        }
        
        if (this.game.spawnManager) {
            const enemies = this.game.spawnManager.enemyFish;
            const indicesToRemove = [];
            
            for (let i = enemies.length - 1; i >= 0; i--) {
                const fish = enemies[i];
                const dx = fish.x - this.explosionX;
                const dy = fish.y - this.explosionY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance <= this.explosionRadius) {
                    indicesToRemove.push(i);
                    fishKilled++;
                }
            }
            
            indicesToRemove.forEach(index => {
                this.game.spawnManager.removeFish(index);
            });
        }
        
        window.GameStatus.addFishKilledByExplosion(fishKilled);
        
        console.log('Explosion triggered! Fish killed:', fishKilled, 'Player killed:', playerKilled);
        
        if (playerKilled) {
            this.game.gameOver();
        } else {
            this.createExplosionEffect();
        }
    }

    checkExplosionDamage() {
        let fishKilled = 0;
        let playerKilled = false;
        
        if (this.game.player) {
            const dx = this.game.player.x - this.explosionX;
            const dy = this.game.player.y - this.explosionY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance <= this.explosionRadius) {
                window.GameStatus.setDeathCause(window.DeathCause.EXPLOSION);
                playerKilled = true;
                console.log('Player killed by explosion!');
            }
        }
        
        if (this.game.spawnManager) {
            const enemies = this.game.spawnManager.enemyFish;
            const indicesToRemove = [];
            
            for (let i = enemies.length - 1; i >= 0; i--) {
                const fish = enemies[i];
                const dx = fish.x - this.explosionX;
                const dy = fish.y - this.explosionY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance <= this.explosionRadius) {
                    indicesToRemove.push(i);
                    fishKilled++;
                }
            }
            
            indicesToRemove.forEach(index => {
                this.game.spawnManager.removeFish(index);
            });
        }
        
        if (playerKilled) {
            this.game.gameOver();
        }
        
        return fishKilled;
    }

    createExplosionEffect() {
        if (!this.game.particleSystem) return;
        
        const particleCount = 20;
        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 / particleCount) * i;
            const speed = 3 + Math.random() * 5;
            const size = 5 + Math.random() * 8;
            
            this.game.particleSystem.particles.push(new window.Particle(
                this.explosionX,
                this.explosionY,
                Math.random() > 0.5 ? '#ff5722' : '#ff9800',
                {
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    size: size,
                    lifetime: 500 + Math.random() * 300
                }
            ));
        }
        
        for (let i = 0; i < 3; i++) {
            this.game.particleSystem.particles.push(new window.Particle(
                this.explosionX,
                this.explosionY,
                '#ffd700',
                {
                    type: 'ring',
                    size: 40 + i * 30,
                    lifetime: 300 + i * 80,
                    fadeIn: 0.1
                }
            ));
        }
    }

    updateExploding(deltaMs) {
        this.explosionAnimationPhase += deltaMs;
        
        if (this.explosionAnimationPhase > 1000) {
            this.reset();
        }
    }

    reset() {
        this.state = window.ExplosionState.IDLE;
        this.timeUntilNextExplosion = this.getRandomInterval();
        this.explosionAnimationPhase = 0;
        this.currentCountdown = 0;
    }

    render(ctx) {
        if (this.state === window.ExplosionState.WARNING) {
            this.renderWarningZone(ctx);
        } else if (this.state === window.ExplosionState.EXPLODING) {
            this.renderExplosionEffect(ctx);
        }
    }

    renderWarningZone(ctx) {
        const pulse = Math.sin(this.warningPulsePhase) * 0.3 + 0.7;
        
        const gradient = ctx.createRadialGradient(
            this.explosionX, this.explosionY, 0,
            this.explosionX, this.explosionY, this.explosionRadius
        );
        
        gradient.addColorStop(0, `rgba(255, 87, 34, ${0.1 * pulse})`);
        gradient.addColorStop(0.7, `rgba(255, 87, 34, ${0.2 * pulse})`);
        gradient.addColorStop(1, `rgba(255, 87, 34, ${0.4 * pulse})`);
        
        ctx.beginPath();
        ctx.arc(this.explosionX, this.explosionY, this.explosionRadius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
        
        const dashOffset = this.warningPulsePhase * 20;
        ctx.setLineDash([10, 10]);
        ctx.lineDashOffset = dashOffset;
        ctx.strokeStyle = `rgba(255, 87, 34, ${0.8 * pulse})`;
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.setLineDash([]);
        
        const innerRadius = this.explosionRadius * 0.8;
        ctx.beginPath();
        ctx.arc(this.explosionX, this.explosionY, innerRadius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 152, 0, ${0.5 * pulse})`;
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.lineDashOffset = -dashOffset;
        ctx.stroke();
        ctx.setLineDash([]);
        
        this.renderWarningIndicator(ctx);
    }

    renderWarningIndicator(ctx) {
        const indicatorRadius = 30;
        const pulse = Math.sin(this.warningPulsePhase * 2) * 0.3 + 0.7;
        
        ctx.save();
        ctx.translate(this.explosionX, this.explosionY);
        
        const glowGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, indicatorRadius * 2);
        glowGradient.addColorStop(0, `rgba(255, 87, 34, ${0.3 * pulse})`);
        glowGradient.addColorStop(1, 'rgba(255, 87, 34, 0)');
        
        ctx.beginPath();
        ctx.arc(0, 0, indicatorRadius * 2, 0, Math.PI * 2);
        ctx.fillStyle = glowGradient;
        ctx.fill();
        
        ctx.font = `bold ${indicatorRadius}px Arial`;
        ctx.fillStyle = `rgba(255, 87, 34, ${pulse})`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⚠', 0, 0);
        
        ctx.restore();
    }

    renderExplosionEffect(ctx) {
        const progress = Math.min(this.explosionAnimationPhase / 500, 1);
        const expandingRadius = this.explosionRadius * (1 + progress * 0.5);
        
        const alpha = 1 - progress;
        
        const gradient = ctx.createRadialGradient(
            this.explosionX, this.explosionY, 0,
            this.explosionX, this.explosionY, expandingRadius
        );
        
        gradient.addColorStop(0, `rgba(255, 255, 255, ${alpha * 0.8})`);
        gradient.addColorStop(0.3, `rgba(255, 215, 0, ${alpha * 0.6})`);
        gradient.addColorStop(0.6, `rgba(255, 152, 0, ${alpha * 0.4})`);
        gradient.addColorStop(1, `rgba(255, 87, 34, 0)`);
        
        ctx.beginPath();
        ctx.arc(this.explosionX, this.explosionY, expandingRadius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
    }
};
