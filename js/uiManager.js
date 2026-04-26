window.GameUtils = {
    getCurrentStage: function() {
        const game = window.gameInstance;
        if (!game || !game.player) {
            return { ...window.CONFIG.growthStages[0], index: 0 };
        }
        return this.getCurrentStageBySize(game.player.size);
    },

    getCurrentStageBySize: function(size) {
        for (let i = window.CONFIG.growthStages.length - 1; i >= 0; i--) {
            if (size >= window.CONFIG.growthStages[i].minSize) {
                return { ...window.CONFIG.growthStages[i], index: i };
            }
        }
        return { ...window.CONFIG.growthStages[0], index: 0 };
    },

    getProgress: function() {
        const game = window.gameInstance;
        if (!game || !game.player) return 0;
        
        const stage = this.getCurrentStage();
        const nextStageIndex = Math.min(stage.index + 1, window.CONFIG.growthStages.length - 1);
        
        if (stage.index === nextStageIndex) return 100;

        const currentMin = window.CONFIG.growthStages[stage.index].minSize;
        const nextMin = window.CONFIG.growthStages[nextStageIndex].minSize;
        const currentSize = game.player.size;

        const progress = ((currentSize - currentMin) / (nextMin - currentMin)) * 100;
        return Math.max(0, Math.min(100, progress));
    }
};

window.UIManager = {
    updateUI: function() {
        const game = window.gameInstance;
        if (!game) return;

        document.getElementById('scoreValue').textContent = window.GameStatus.score;

        const stage = window.GameUtils.getCurrentStage();
        document.getElementById('stageValue').textContent = `${stage.index + 1} - ${stage.name}`;

        const progress = window.GameUtils.getProgress();
        document.getElementById('progressBar').style.width = `${progress}%`;

        if (game.player) {
            const speedLevel = game.player.getSpeedLevel();
            const speedRatio = speedLevel.ratio;
            const speedPercent = Math.min(100, Math.max(0, (speedRatio - 0.5) * 100));
            
            document.getElementById('speedBarFill').style.width = `${speedPercent}%`;
            document.getElementById('speedLevelText').textContent = speedLevel.name;
            document.getElementById('speedLevelText').style.color = speedLevel.color;

            const speedIndicator = document.getElementById('speedIndicator');
            const speedDuration = document.getElementById('speedDuration');
            
            if (game.player.hasSpeedBoost) {
                speedIndicator.classList.add('active');
                speedDuration.textContent = `${Math.ceil(game.player.speedBoostDuration / 1000)}s`;
            } else {
                speedIndicator.classList.remove('active');
                speedDuration.textContent = '--';
            }

            const shieldIndicator = document.getElementById('shieldIndicator');
            const shieldDuration = document.getElementById('shieldDuration');
            
            if (game.player.hasShield) {
                shieldIndicator.classList.add('active');
                shieldDuration.textContent = `${Math.ceil(game.player.shieldDuration / 1000)}s`;
            } else {
                shieldIndicator.classList.remove('active');
                shieldDuration.textContent = '--';
            }
        }
    },

    showStartOverlay: function() {
        document.getElementById('startOverlay').classList.remove('hidden');
        document.getElementById('gameOverOverlay').classList.add('hidden');
        document.getElementById('pauseOverlay').classList.add('hidden');
        document.getElementById('pauseIndicator').classList.add('hidden');
    },

    hideAllOverlays: function() {
        document.getElementById('startOverlay').classList.add('hidden');
        document.getElementById('gameOverOverlay').classList.add('hidden');
        document.getElementById('pauseOverlay').classList.add('hidden');
        document.getElementById('pauseIndicator').classList.add('hidden');
    },

    showPauseOverlay: function() {
        document.getElementById('pauseIndicator').classList.remove('hidden');
        document.getElementById('pauseOverlay').classList.remove('hidden');
    },

    hidePauseOverlay: function() {
        document.getElementById('pauseIndicator').classList.add('hidden');
        document.getElementById('pauseOverlay').classList.add('hidden');
    },

    showGameOverOverlay: function() {
        document.getElementById('finalScore').textContent = window.GameStatus.score;
        document.getElementById('gameOverOverlay').classList.remove('hidden');
    }
};

window.Renderer = {
    backgroundElements: {
        bubbles: [],
        seaweed: []
    },

    initBackground: function() {
        this.backgroundElements = {
            bubbles: [],
            seaweed: []
        };

        for (let i = 0; i < 15; i++) {
            this.backgroundElements.seaweed.push({
                x: Math.random() * window.CONFIG.canvasWidth,
                y: window.CONFIG.canvasHeight - Math.random() * 100,
                height: 50 + Math.random() * 100,
                width: 3 + Math.random() * 3,
                sway: Math.random() * Math.PI * 2,
                swaySpeed: 0.02 + Math.random() * 0.02
            });
        }

        for (let i = 0; i < 20; i++) {
            this.backgroundElements.bubbles.push({
                x: Math.random() * window.CONFIG.canvasWidth,
                y: Math.random() * window.CONFIG.canvasHeight,
                radius: 1 + Math.random() * 3,
                speed: 0.5 + Math.random() * 1,
                sway: Math.random() * Math.PI * 2
            });
        }
    },

    updateBackground: function(deltaTime) {
        this.backgroundElements.bubbles.forEach(bubble => {
            bubble.y -= bubble.speed;
            bubble.sway += 0.05;
            bubble.x += Math.sin(bubble.sway) * 0.3;
            
            if (bubble.y < -10) {
                bubble.y = window.CONFIG.canvasHeight + 10;
                bubble.x = Math.random() * window.CONFIG.canvasWidth;
            }
        });

        this.backgroundElements.seaweed.forEach(seaweed => {
            seaweed.sway += seaweed.swaySpeed;
        });
    },

    renderBackground: function(ctx) {
        const { bubbles, seaweed } = this.backgroundElements;

        ctx.save();
        seaweed.forEach(seaweed => {
            ctx.beginPath();
            ctx.moveTo(seaweed.x, seaweed.y);
            
            const swayAmount = Math.sin(seaweed.sway) * 15;
            ctx.quadraticCurveTo(
                seaweed.x + swayAmount,
                seaweed.y - seaweed.height * 0.5,
                seaweed.x + swayAmount * 0.5,
                seaweed.y - seaweed.height
            );
            
            ctx.strokeStyle = '#1b5e20';
            ctx.lineWidth = seaweed.width;
            ctx.lineCap = 'round';
            ctx.stroke();
        });
        ctx.restore();

        ctx.save();
        bubbles.forEach(bubble => {
            ctx.beginPath();
            ctx.arc(bubble.x, bubble.y, bubble.radius, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.fill();
            
            ctx.beginPath();
            ctx.arc(
                bubble.x - bubble.radius * 0.3,
                bubble.y - bubble.radius * 0.3,
                bubble.radius * 0.3,
                0, Math.PI * 2
            );
            ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.fill();
        });
        ctx.restore();

        const gradient = ctx.createLinearGradient(
            0, window.CONFIG.canvasHeight - 50, 
            0, window.CONFIG.canvasHeight
        );
        gradient.addColorStop(0, 'rgba(139, 119, 101, 0.3)');
        gradient.addColorStop(1, 'rgba(139, 119, 101, 0.6)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, window.CONFIG.canvasHeight - 50, window.CONFIG.canvasWidth, 50);
    },

    render: function(ctx, game) {
        ctx.clearRect(0, 0, window.CONFIG.canvasWidth, window.CONFIG.canvasHeight);
        this.renderBackground(ctx);

        if (game.spawnManager) {
            game.spawnManager.render(ctx);
        }

        if (game.player) {
            game.player.render(ctx);
        }

        if (game.particleSystem) {
            game.particleSystem.render(ctx);
        }
    }
};
