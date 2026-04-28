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
    _notificationTimeout: null,
    _isInitialized: false,
    
    init: function() {
        if (this._isInitialized) return;
        this._isInitialized = true;
        this.hideAll();
    },
    
    hideAll: function() {
        this.hideNotification();
        this.hideShieldWarning();
    },
    
    show: function(text, subtitle, duration = 2000) {
        if (!this._isInitialized) {
            this.init();
        }
        
        const notification = document.getElementById('screenNotification');
        if (!notification) return;
        
        if (this._notificationTimeout) {
            clearTimeout(this._notificationTimeout);
            this._notificationTimeout = null;
        }
        
        notification.innerHTML = `
            <div class="notification-text">${text}</div>
            ${subtitle ? `<div class="notification-subtitle">${subtitle}</div>` : ''}
        `;
        notification.classList.remove('hidden');
        
        this._notificationTimeout = setTimeout(() => {
            this.hideNotification();
        }, duration);
    },
    
    hideNotification: function() {
        const notification = document.getElementById('screenNotification');
        if (notification) {
            notification.classList.add('hidden');
            notification.innerHTML = '';
        }
        if (this._notificationTimeout) {
            clearTimeout(this._notificationTimeout);
            this._notificationTimeout = null;
        }
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
    
    showSkillActive: function(skillName) {
        this.show(`✨ ${skillName}`, '技能已激活！', 1500);
    },
    
    showSkillCooldown: function(remainingTime) {
        const notification = document.getElementById('skillCooldownNotification');
        const timeElement = document.getElementById('cooldownNoticeTime');
        if (notification && timeElement) {
            timeElement.textContent = `${remainingTime}s`;
            notification.classList.remove('hidden');
            
            setTimeout(() => {
                notification.classList.add('hidden');
            }, 1000);
        }
    },
    
    showSkillActiveNotification: function(skillName) {
        const notification = document.getElementById('skillActiveNotification');
        const textElement = document.getElementById('skillActiveText');
        if (notification && textElement) {
            textElement.textContent = `${skillName} 激活！`;
            notification.classList.remove('hidden');
            
            setTimeout(() => {
                notification.classList.add('hidden');
            }, 1500);
        }
    },
    
    showShieldWarning: function(remaining) {
        const warning = document.getElementById('shieldWarning');
        if (!warning) return;
        
        if (remaining <= 3 && remaining > 0) {
            warning.innerHTML = `<div class="warning-text">护盾即将消失！${remaining}s</div>`;
            warning.classList.remove('hidden');
        } else {
            this.hideShieldWarning();
        }
    },
    
    hideShieldWarning: function() {
        const warning = document.getElementById('shieldWarning');
        if (warning) {
            warning.classList.add('hidden');
            warning.innerHTML = '';
        }
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
        
        window.NotificationManager.init();
        
        this.bindDifficultySelector();
        this.bindFishSelector();
        this.bindControlSelector();
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
    
    bindFishSelector: function() {
        const buttons = document.querySelectorAll('.fish-btn');
        buttons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.selectFishType(e.target.closest('.fish-btn'));
            });
        });
    },
    
    selectFishType: function(button) {
        document.querySelectorAll('.fish-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        button.classList.add('active');
        
        const fishType = button.dataset.fish;
        window.GameStatus.setSelectedFishType(fishType);
        console.log('Fish type selected:', fishType);
    },
    
    bindControlSelector: function() {
        const buttons = document.querySelectorAll('.control-btn');
        buttons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.selectControlMode(e.target.closest('.control-btn'));
            });
        });
    },
    
    selectControlMode: function(button) {
        document.querySelectorAll('.control-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        button.classList.add('active');
        
        const controlMode = button.dataset.control;
        if (controlMode === 'mouse') {
            window.GameStatus.controlMode = window.ControlMode.MOUSE;
        } else if (controlMode === 'keyboard') {
            window.GameStatus.controlMode = window.ControlMode.KEYBOARD;
        }
        console.log('Control mode selected:', window.GameStatus.controlMode);
    },
    
    checkMobileDevice: function() {
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        if (isMobile || window.innerWidth <= 768) {
            document.getElementById('mobileControls').classList.remove('hidden');
            document.getElementById('controlSelector').classList.add('hidden');
            window.GameStatus.controlMode = window.ControlMode.TOUCH;
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
            this.updateSkillIndicators(game.player);
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
    
    updateSkillIndicators: function(player) {
        const fishType = player.fishType;
        const fishConfig = player.fishConfig;
        
        const skillPanel = document.getElementById('skillPanel');
        const skill1Container = document.getElementById('skill1Container');
        const skill2Container = document.getElementById('skill2Container');
        const skillHint1 = document.getElementById('skillHint1');
        const skillHint2 = document.getElementById('skillHint2');
        const skill1Btn = document.getElementById('skill1Btn');
        const skill2Btn = document.getElementById('skill2Btn');
        
        if (fishType === window.FishType.SWORD_FISH) {
            skillPanel.classList.remove('hidden');
            skill1Container.classList.remove('hidden');
            skill2Container.classList.add('hidden');
            skillHint1.classList.remove('hidden');
            skillHint2.classList.add('hidden');
            skill1Btn.classList.remove('hidden');
            skill2Btn.classList.add('hidden');
            
            this.updateSkill1Indicator(player);
        } else if (fishType === window.FishType.PUFFER_FISH) {
            skillPanel.classList.remove('hidden');
            skill1Container.classList.add('hidden');
            skill2Container.classList.remove('hidden');
            skillHint1.classList.add('hidden');
            skillHint2.classList.remove('hidden');
            skill1Btn.classList.add('hidden');
            skill2Btn.classList.remove('hidden');
            
            this.updateSkill2Indicator(player);
        } else {
            skillPanel.classList.add('hidden');
            skill1Container.classList.add('hidden');
            skill2Container.classList.add('hidden');
            skillHint1.classList.add('hidden');
            skillHint2.classList.add('hidden');
            skill1Btn.classList.add('hidden');
            skill2Btn.classList.add('hidden');
        }
    },
    
    updateSkill1Indicator: function(player) {
        const skillIndicator = document.getElementById('skill1Indicator');
        const skillCooldown = document.getElementById('skill1Cooldown');
        const skillOverlay = document.getElementById('skill1CooldownOverlay');
        const skillName = document.getElementById('skill1Name');
        const skillBtnText = document.getElementById('skill1BtnText');
        const skillBtnCooldown = document.getElementById('skill1BtnCooldown');
        
        skillName.textContent = player.fishConfig.skillName;
        skillBtnText.textContent = player.fishConfig.skillName;
        
        const cooldownPercent = player.getSkill1CooldownPercent();
        const remainingTime = player.getSkill1RemainingTime();
        
        if (player.isDashing) {
            skillIndicator.classList.remove('ready');
            skillIndicator.classList.add('active');
            skillCooldown.textContent = '!';
            skillOverlay.style.height = '0%';
        } else if (cooldownPercent >= 100) {
            skillIndicator.classList.add('ready');
            skillIndicator.classList.remove('active');
            skillCooldown.textContent = 'J';
            skillOverlay.style.height = '0%';
        } else {
            skillIndicator.classList.remove('ready', 'active');
            skillCooldown.textContent = remainingTime > 0 ? remainingTime : 'J';
            skillOverlay.style.height = `${100 - cooldownPercent}%`;
        }
        
        if (skillBtnCooldown) {
            skillBtnCooldown.style.height = `${100 - cooldownPercent}%`;
        }
    },
    
    updateSkill2Indicator: function(player) {
        const skillIndicator = document.getElementById('skill2Indicator');
        const skillCooldown = document.getElementById('skill2Cooldown');
        const skillOverlay = document.getElementById('skill2CooldownOverlay');
        const skillName = document.getElementById('skill2Name');
        const skillBtnText = document.getElementById('skill2BtnText');
        const skillBtnCooldown = document.getElementById('skill2BtnCooldown');
        
        skillName.textContent = player.fishConfig.skillName;
        skillBtnText.textContent = player.fishConfig.skillName;
        
        const cooldownPercent = player.getSkill2CooldownPercent();
        const remainingTime = player.getSkill2RemainingTime();
        
        if (player.isInflated) {
            skillIndicator.classList.remove('ready');
            skillIndicator.classList.add('active');
            skillCooldown.textContent = '!';
            skillOverlay.style.height = '0%';
        } else if (cooldownPercent >= 100) {
            skillIndicator.classList.add('ready');
            skillIndicator.classList.remove('active');
            skillCooldown.textContent = 'K';
            skillOverlay.style.height = '0%';
        } else {
            skillIndicator.classList.remove('ready', 'active');
            skillCooldown.textContent = remainingTime > 0 ? remainingTime : 'K';
            skillOverlay.style.height = `${100 - cooldownPercent}%`;
        }
        
        if (skillBtnCooldown) {
            skillBtnCooldown.style.height = `${100 - cooldownPercent}%`;
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
        document.getElementById('fishTypePanel').classList.add('hidden');
        document.getElementById('skillPanel').classList.add('hidden');
        document.getElementById('controlHintLeft').classList.add('hidden');
        document.getElementById('controlHintRight').classList.add('hidden');
    },

    hideAllOverlays: function() {
        document.getElementById('startOverlay').classList.add('hidden');
        document.getElementById('gameOverOverlay').classList.add('hidden');
        document.getElementById('pauseOverlay').classList.add('hidden');
        document.getElementById('pauseIndicator').classList.add('hidden');
        
        this.updateFishTypePanel();
        this.updateControlHints();
        
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        if (isMobile || window.innerWidth <= 768) {
            document.getElementById('mobileControls').classList.remove('hidden');
        }
    },
    
    updateFishTypePanel: function() {
        const fishTypePanel = document.getElementById('fishTypePanel');
        const fishTypeIcon = document.getElementById('fishTypeIcon');
        const fishTypeName = document.getElementById('fishTypeName');
        
        const fishConfig = window.GameStatus.getSelectedFishConfig();
        if (fishConfig) {
            const fishEmojis = {
                normal: '🐟',
                whale_shark: '🦈',
                sword_fish: '🐡',
                puffer_fish: '🐡'
            };
            fishTypeIcon.textContent = fishEmojis[window.GameStatus.selectedFishType] || '🐟';
            fishTypeName.textContent = fishConfig.name;
            fishTypePanel.classList.remove('hidden');
        }
    },
    
    updateControlHints: function() {
        const controlHintLeft = document.getElementById('controlHintLeft');
        const controlHintRight = document.getElementById('controlHintRight');
        const skillHint1 = document.getElementById('skillHint1');
        const skillHint2 = document.getElementById('skillHint2');
        const skillHintText1 = document.getElementById('skillHintText1');
        const skillHintText2 = document.getElementById('skillHintText2');
        
        const fishConfig = window.GameStatus.getSelectedFishConfig();
        const controlMode = window.GameStatus.controlMode;
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;
        
        if (isMobile) {
            controlHintLeft.classList.add('hidden');
            controlHintRight.classList.add('hidden');
            return;
        }
        
        controlHintLeft.classList.remove('hidden');
        controlHintRight.classList.remove('hidden');
        
        const hintTitle = controlHintLeft.querySelector('.hint-title');
        const hintOr = controlHintLeft.querySelector('.hint-or');
        const keyBtns = controlHintLeft.querySelectorAll('.key-btn');
        const keyHints = controlHintLeft.querySelectorAll('.key-hint');
        
        if (controlMode === window.ControlMode.MOUSE) {
            if (hintTitle) hintTitle.textContent = '移动';
            if (hintOr) hintOr.textContent = '鼠标跟随';
            
            keyBtns.forEach(btn => {
                btn.style.display = 'none';
            });
            
            keyHints.forEach(hint => {
                hint.style.display = 'none';
            });
        } else if (controlMode === window.ControlMode.KEYBOARD) {
            if (hintTitle) hintTitle.textContent = '移动';
            if (hintOr) hintOr.textContent = 'WASD 键盘';
            
            keyBtns.forEach((btn, index) => {
                if (index === 0) btn.style.display = 'inline-flex';
                else if (index >= 1 && index <= 3) btn.style.display = 'inline-flex';
            });
            
            keyHints.forEach((hint, index) => {
                if (index <= 3) hint.style.display = 'inline-block';
            });
        } else if (controlMode === window.ControlMode.TOUCH) {
            if (hintTitle) hintTitle.textContent = '移动';
            if (hintOr) hintOr.textContent = '触屏控制';
            
            keyBtns.forEach(btn => {
                btn.style.display = 'none';
            });
            
            keyHints.forEach(hint => {
                hint.style.display = 'none';
            });
        }
        
        const hasActiveSkill = fishConfig && fishConfig.skillType === window.SkillType.ACTIVE;
        
        if (hasActiveSkill) {
            if (window.GameStatus.selectedFishType === window.FishType.SWORD_FISH) {
                skillHint1.classList.remove('hidden');
                skillHint2.classList.add('hidden');
                skillHintText1.textContent = fishConfig.skillName;
            } else if (window.GameStatus.selectedFishType === window.FishType.PUFFER_FISH) {
                skillHint1.classList.add('hidden');
                skillHint2.classList.remove('hidden');
                skillHintText2.textContent = fishConfig.skillName;
            } else {
                skillHint1.classList.add('hidden');
                skillHint2.classList.add('hidden');
            }
        } else {
            skillHint1.classList.add('hidden');
            skillHint2.classList.add('hidden');
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
        document.getElementById('summaryExplosions').textContent = window.GameStatus.fishKilledByExplosion;
        document.getElementById('summaryStage').textContent = window.GameStatus.stagesReached;
        document.getElementById('summaryTime').textContent = window.GameStatus.formatTime(window.GameStatus.gameTime);
        document.getElementById('summaryPowerups').textContent = window.GameStatus.powerupsCollected;
        document.getElementById('summarySize').textContent = Math.round(window.GameStatus.maxSize);
        
        this.updateGameOverFishPanel();
        this.updateSkillStatsPanel();
        
        const stage = window.GameUtils.getCurrentStageBySize(window.GameStatus.maxSize);
        let reasonText = '';
        let deathCauseText = '';
        
        if (window.GameStatus.deathCause === window.DeathCause.EXPLOSION) {
            reasonText = `最高达到: ${stage.name}，被海底爆炸消灭了！`;
            deathCauseText = '💥 死亡原因：海底爆炸';
        } else if (window.GameStatus.deathCause === window.DeathCause.EATEN) {
            reasonText = `最高达到: ${stage.name}，被更大的鱼吃掉了！`;
            deathCauseText = '🐟 死亡原因：被大鱼吃掉';
        } else {
            reasonText = `最高达到: ${stage.name}`;
            deathCauseText = '';
        }
        
        document.getElementById('gameOverReason').textContent = reasonText;
        
        const deathCauseElement = document.getElementById('deathCause');
        if (deathCauseText) {
            deathCauseElement.textContent = deathCauseText;
            deathCauseElement.classList.remove('hidden');
        } else {
            deathCauseElement.classList.add('hidden');
        }
        
        document.getElementById('gameOverOverlay').classList.remove('hidden');
        document.getElementById('mobileControls').classList.add('hidden');
    },
    
    updateGameOverFishPanel: function() {
        const fishUsedPanel = document.getElementById('fishUsedPanel');
        const fishUsedIcon = document.getElementById('fishUsedIcon');
        const fishUsedName = document.getElementById('fishUsedName');
        const fishUsedType = document.getElementById('fishUsedType');
        
        const fishConfig = window.GameStatus.getSelectedFishConfig();
        if (fishConfig) {
            const fishEmojis = {
                normal: '🐟',
                whale_shark: '🦈',
                sword_fish: '🐡',
                puffer_fish: '🐡'
            };
            const fishTypeLabels = {
                normal: '均衡型',
                whale_shark: '被动技能',
                sword_fish: '主动技能 - ' + fishConfig.skillName,
                puffer_fish: '主动技能 - ' + fishConfig.skillName
            };
            
            fishUsedIcon.textContent = fishEmojis[window.GameStatus.selectedFishType] || '🐟';
            fishUsedName.textContent = fishConfig.name;
            fishUsedType.textContent = fishTypeLabels[window.GameStatus.selectedFishType] || '未知类型';
            fishUsedPanel.classList.remove('hidden');
        }
    },
    
    updateSkillStatsPanel: function() {
        const skillStatsPanel = document.getElementById('skillStatsPanel');
        const skillStat1 = document.getElementById('skillStat1');
        const skillStat2 = document.getElementById('skillStat2');
        const skillStatName1 = document.getElementById('skillStatName1');
        const skillStatName2 = document.getElementById('skillStatName2');
        const skillStatCount1 = document.getElementById('skillStatCount1');
        const skillStatCount2 = document.getElementById('skillStatCount2');
        
        const fishConfig = window.GameStatus.getSelectedFishConfig();
        
        if (fishConfig && fishConfig.skillType === window.SkillType.ACTIVE) {
            skillStatsPanel.classList.remove('hidden');
            
            if (window.GameStatus.selectedFishType === window.FishType.SWORD_FISH) {
                skillStat1.classList.remove('hidden');
                skillStat2.classList.add('hidden');
                skillStatName1.textContent = fishConfig.skillName;
                skillStatCount1.textContent = window.GameStatus.skill1Used + '次';
            } else if (window.GameStatus.selectedFishType === window.FishType.PUFFER_FISH) {
                skillStat1.classList.add('hidden');
                skillStat2.classList.remove('hidden');
                skillStatName2.textContent = fishConfig.skillName;
                skillStatCount2.textContent = window.GameStatus.skill2Used + '次';
            }
        } else {
            skillStatsPanel.classList.add('hidden');
        }
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

        if (game.explosionManager) {
            game.explosionManager.render(ctx);
        }

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
