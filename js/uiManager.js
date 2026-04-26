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

window.NotificationManager = {
    activeNotifications: [],
    
    show: function(text, subtitle, duration = 2000) {
        const notification = document.getElementById('screenNotification');
        notification.innerHTML = `
            <div class="notification-text">${text}</div>
            ${subtitle ? `<div class="notification-subtitle">${subtitle}</div>` : ''}
        `;
        notification.classList.remove('hidden');
        
        setTimeout(() => {
            notification.classList.add('hidden');
        }, duration);
    },
    
    showSpeedBoost: function() {
        this.show('⚡ 加速！', '移动速度提升！', 1500);
    },
    
    showShield: function() {
        this.show('🛡️ 护盾激活！', '可以抵挡一次伤害', 1500);
    },
    
    showStageUp: function(stageName, size) {
        this.show(`🎉 进化！`, `升级为 ${stageName} (${size})`, 2500);
    },
    
    showEat: function(points) {
        this.show(`+${points} 分`, '', 800);
    },
    
    showShieldWarning: function(remaining) {
        const warning = document.getElementById('shieldWarning');
        if (remaining <= 3) {
            warning.innerHTML = `<div class="warning-text">护盾即将消失！${remaining}s</div>`;
            warning.classList.remove('hidden');
        } else {
            warning.classList.add('hidden');
        }
    },
    
    hideShieldWarning: function() {
        const warning = document.getElementById('shieldWarning');
        warning.classList.add('hidden');
    }
};

window.UIManager = {
    previousStageIndex: 0,
    previousSpeedBoost: false,
    previousShield: false,
    
    init: function() {
        this.previousStageIndex = 0;
        this.previousSpeedBoost = false;
        this.previousShield = false;
        this.bindDifficultySelector();
        this.checkMobileDevice();
    },
    
    bindDifficultySelector: function() {
        const buttons = document.querySelectorAll('.difficulty-btn');
        buttons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.selectDifficulty(e.target.closest('.difficulty-btn'));
            });
        });
    },
    
    selectDifficulty: function(button) {
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        button.classList.add('active');
        
        const difficulty = button.dataset.difficulty;
        window.GameStatus.difficulty = difficulty;
        console.log('Difficulty selected:', difficulty);
    },
    
    checkMobileDevice: function() {
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        if (isMobile || window.innerWidth <= 768) {
            document.getElementById('mobileControls').classList.remove('hidden');
        }
    },
    
    updateUI: function() {
        const game = window.gameInstance;
        if (!game) return;

        document.getElementById('scoreValue').textContent = window.GameStatus.score;

        const stage = window.GameUtils.getCurrentStage();
        document.getElementById('stageValue').textContent = stage.name;
        
        const diffConfig = window.GameStatus.getDifficultyConfig();
        document.getElementById('difficultyValue').textContent = diffConfig.name;

        document.getElementById('timeValue').textContent = window.GameStatus.formatTime(window.GameStatus.gameTime);

        this.updateGoalPanel(stage);

        const progress = window.GameUtils.getProgress();
        document.getElementById('progressBar').style.width = `${progress}%`;
        document.getElementById('progressText').textContent = `${Math.round(progress)}%`;

        if (game.player) {
            this.updatePowerupIndicators(game.player);
            this.checkStageUp(stage);
        }
    },
    
    updateGoalPanel: function(stage) {
        const nextStageIndex = Math.min(stage.index + 1, window.CONFIG.growthStages.length - 1);
        const isMaxStage = stage.index === nextStageIndex;
        
        const game = window.gameInstance;
        const currentSize = game && game.player ? Math.round(game.player.size) : stage.minSize;
        
        document.getElementById('goalCurrent').innerHTML = `
            <span class="goal-icon">🐟</span>
            <span class="goal-text">当前: ${stage.name} (${currentSize})</span>
        `;
        
        if (isMaxStage) {
            document.getElementById('goalNext').innerHTML = `
                <span class="goal-icon">👑</span>
                <span class="goal-text">已达最高阶段！</span>
            `;
            document.getElementById('goalNext').style.opacity = '0.7';
        } else {
            const nextStage = window.CONFIG.growthStages[nextStageIndex];
            document.getElementById('goalNext').innerHTML = `
                <span class="goal-icon">➡️</span>
                <span class="goal-text">下一: ${nextStage.name} (${nextStage.minSize})</span>
            `;
            document.getElementById('goalNext').style.opacity = '1';
        }
    },
    
    updatePowerupIndicators: function(player) {
        const speedIndicator = document.getElementById('speedIndicator');
        const speedDuration = document.getElementById('speedDuration');
        
        if (player.hasSpeedBoost) {
            const remaining = Math.ceil(player.speedBoostDuration / 1000);
            speedIndicator.classList.add('active');
            speedDuration.textContent = `${remaining}s`;
            
            if (remaining <= 3) {
                speedIndicator.classList.add('warning');
                speedDuration.classList.add('warning');
            } else {
                speedIndicator.classList.remove('warning');
                speedDuration.classList.remove('warning');
            }
            
            if (!this.previousSpeedBoost) {
                window.NotificationManager.showSpeedBoost();
            }
        } else {
            speedIndicator.classList.remove('active', 'warning');
            speedDuration.classList.remove('warning');
            speedDuration.textContent = '--';
        }
        this.previousSpeedBoost = player.hasSpeedBoost;

        const shieldIndicator = document.getElementById('shieldIndicator');
        const shieldDuration = document.getElementById('shieldDuration');
        
        if (player.hasShield) {
            const remaining = Math.ceil(player.shieldDuration / 1000);
            shieldIndicator.classList.add('active');
            shieldDuration.textContent = `${remaining}s`;
            
            if (remaining <= 3) {
                shieldIndicator.classList.add('warning');
                shieldDuration.classList.add('warning');
                window.NotificationManager.showShieldWarning(remaining);
            } else {
                shieldIndicator.classList.remove('warning');
                shieldDuration.classList.remove('warning');
                window.NotificationManager.hideShieldWarning();
            }
            
            if (!this.previousShield) {
                window.NotificationManager.showShield();
            }
        } else {
            shieldIndicator.classList.remove('active', 'warning');
            shieldDuration.classList.remove('warning');
            shieldDuration.textContent = '--';
            window.NotificationManager.hideShieldWarning();
        }
        this.previousShield = player.hasShield;
    },
    
    checkStageUp: function(currentStage) {
        if (currentStage.index > this.previousStageIndex) {
            window.GameStatus.updateStagesReached(currentStage.index);
            window.NotificationManager.showStageUp(currentStage.name, currentStage.minSize);
        }
        this.previousStageIndex = currentStage.index;
    },

    showStartOverlay: function() {
        document.getElementById('startOverlay').classList.remove('hidden');
        document.getElementById('gameOverOverlay').classList.add('hidden');
        document.getElementById('pauseOverlay').classList.add('hidden');
        document.getElementById('pauseIndicator').classList.add('hidden');
        document.getElementById('mobileControls').classList.add('hidden');
    },

    hideAllOverlays: function() {
        document.getElementById('startOverlay').classList.add('hidden');
        document.getElementById('gameOverOverlay').classList.add('hidden');
        document.getElementById('pauseOverlay').classList.add('hidden');
        document.getElementById('pauseIndicator').classList.add('hidden');
        
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        if (isMobile || window.innerWidth <= 768) {
            document.getElementById('mobileControls').classList.remove('hidden');
        }
    },

    showPauseOverlay: function() {
        document.getElementById('pauseIndicator').classList.remove('hidden');
        document.getElementById('pauseOverlay').classList.remove('hidden');
        document.getElementById('mobileControls').classList.add('hidden');
    },

    hidePauseOverlay: function() {
        document.getElementById('pauseIndicator').classList.add('hidden');
        document.getElementById('pauseOverlay').classList.add('hidden');
        
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        if (isMobile || window.innerWidth <= 768) {
            document.getElementById('mobileControls').classList.remove('hidden');
        }
    },

    showGameOverOverlay: function() {
        document.getElementById('finalScore').textContent = window.GameStatus.score;
        
        document.getElementById('summaryScore').textContent = window.GameStatus.score;
        document.getElementById('summaryFish').textContent = window.GameStatus.fishEaten;
        document.getElementById('summaryStage').textContent = window.GameStatus.stagesReached;
        document.getElementById('summaryTime').textContent = window.GameStatus.formatTime(window.GameStatus.gameTime);
        document.getElementById('summaryPowerups').textContent = window.GameStatus.powerupsCollected;
        document.getElementById('summarySize').textContent = Math.round(window.GameStatus.maxSize);
        
        const stage = window.GameUtils.getCurrentStageBySize(window.GameStatus.maxSize);
        document.getElementById('gameOverReason').textContent = `最高达到: ${stage.name}，被更大的鱼吃掉了！`;
        
        document.getElementById('gameOverOverlay').classList.remove('hidden');
        document.getElementById('mobileControls').classList.add('hidden');
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
