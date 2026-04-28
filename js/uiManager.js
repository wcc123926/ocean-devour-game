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
    
    fishDescriptions: {
        normal: {
            title: '普通鱼 - 均衡型',
            lines: ['各项属性均衡', '适合新手体验']
        },
        whale_shark: {
            title: '鲸鲨 - 被动技能',
            lines: ['初始体型 +50%', '移动速度 -20%']
        },
        sword_fish: {
            title: '剑鱼 - 主动技能 (J)',
            lines: ['按J突进', '吃掉路径上所有可吞噬的鱼', '冷却: 15秒']
        },
        puffer_fish: {
            title: '河豚 - 主动技能 (K)',
            lines: ['按K膨胀', '体型+80%，可吃比膨胀后小的鱼', '期间速度-50%', '冷却: 15秒']
        }
    },
    
    init: function() {
        this.previousStageIndex = 0;
        this.previousSpeedBoost = false;
        this.previousShield = false;
        
        window.NotificationManager.init();
        
        this.bindDifficultySelector();
        this.bindFishSelector();
        this.bindControlSelector();
        this.bindColorSelector();
        this.checkMobileDevice();
        
        this.updateFishDescription('normal');
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
        this.updateFishDescription(fishType);
        console.log('Fish type selected:', fishType);
    },
    
    updateFishDescription: function(fishType) {
        const descTitle = document.getElementById('fishDescTitle');
        const descContent = document.getElementById('fishDescContent');
        
        if (!descTitle || !descContent) return;
        
        const desc = this.fishDescriptions[fishType];
        if (!desc) return;
        
        descTitle.textContent = desc.title;
        
        descContent.innerHTML = '';
        desc.lines.forEach(line => {
            const div = document.createElement('div');
            div.className = 'desc-line';
            if (line.includes('+') && !line.includes('-')) {
                div.classList.add('highlight');
            } else if (line.includes('-') && !line.includes('+')) {
                div.classList.add('dim');
            } else if (line.includes('冷却')) {
                div.classList.add('cooldown');
            }
            div.textContent = line;
            descContent.appendChild(div);
        });
    },
    
    bindColorSelector: function() {
        const colorToggle = document.getElementById('colorToggle');
        const colorPickerSection = document.getElementById('colorPickerSection');
        const toggleSwitch = colorToggle ? colorToggle.querySelector('.toggle-switch') : null;
        
        if (colorToggle && toggleSwitch && colorPickerSection) {
            colorToggle.addEventListener('click', () => {
                const isActive = toggleSwitch.classList.contains('active');
                
                if (isActive) {
                    toggleSwitch.classList.remove('active');
                    colorPickerSection.classList.add('hidden');
                    window.GameStatus.clearCustomColors();
                } else {
                    toggleSwitch.classList.add('active');
                    colorPickerSection.classList.remove('hidden');
                    this.applyCurrentColors();
                }
            });
        }
        
        const bodyPicker = document.getElementById('bodyColorPicker');
        const darkPicker = document.getElementById('darkColorPicker');
        const lightPicker = document.getElementById('lightColorPicker');
        
        const updateColorValue = (pickerId, valueId) => {
            const picker = document.getElementById(pickerId);
            const valueEl = document.getElementById(valueId);
            if (picker && valueEl) {
                picker.addEventListener('input', () => {
                    valueEl.textContent = picker.value;
                    this.applyCurrentColors();
                });
            }
        };
        
        updateColorValue('bodyColorPicker', 'bodyColorValue');
        updateColorValue('darkColorPicker', 'darkColorValue');
        updateColorValue('lightColorPicker', 'lightColorValue');
        
        const presetColors = document.querySelectorAll('.preset-color');
        presetColors.forEach(btn => {
            btn.addEventListener('click', () => {
                const bodyColor = btn.dataset.body;
                const darkColor = btn.dataset.dark;
                const lightColor = btn.dataset.light;
                
                this.setColorPickers(bodyColor, darkColor, lightColor);
                this.applyCurrentColors();
            });
        });
    },
    
    setColorPickers: function(bodyColor, darkColor, lightColor) {
        const bodyPicker = document.getElementById('bodyColorPicker');
        const darkPicker = document.getElementById('darkColorPicker');
        const lightPicker = document.getElementById('lightColorPicker');
        const bodyValue = document.getElementById('bodyColorValue');
        const darkValue = document.getElementById('darkColorValue');
        const lightValue = document.getElementById('lightColorValue');
        
        if (bodyPicker && bodyValue) {
            bodyPicker.value = bodyColor;
            bodyValue.textContent = bodyColor;
        }
        if (darkPicker && darkValue) {
            darkPicker.value = darkColor;
            darkValue.textContent = darkColor;
        }
        if (lightPicker && lightValue) {
            lightPicker.value = lightColor;
            lightValue.textContent = lightColor;
        }
    },
    
    applyCurrentColors: function() {
        const bodyPicker = document.getElementById('bodyColorPicker');
        const darkPicker = document.getElementById('darkColorPicker');
        const lightPicker = document.getElementById('lightColorPicker');
        const previewBody = document.getElementById('previewBody');
        
        if (bodyPicker && darkPicker && lightPicker) {
            const bodyColor = bodyPicker.value;
            const darkColor = darkPicker.value;
            const lightColor = lightPicker.value;
            
            window.GameStatus.setCustomColors(bodyColor, darkColor, lightColor);
            
            if (previewBody) {
                previewBody.style.background = `linear-gradient(135deg, ${bodyColor} 0%, ${darkColor} 100%)`;
            }
        }
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

        try {
            const scoreValue = document.getElementById('scoreValue');
            const stageValue = document.getElementById('stageValue');
            const difficultyValue = document.getElementById('difficultyValue');
            const timeValue = document.getElementById('timeValue');
            const progressBar = document.getElementById('progressBar');
            const progressText = document.getElementById('progressText');
            
            if (scoreValue) scoreValue.textContent = window.GameStatus.score;
            
            let stage = { name: '未知', index: 0, minSize: 25 };
            try {
                stage = window.GameUtils.getCurrentStage();
            } catch (e) {
                console.error('Error getting current stage:', e);
            }
            
            if (stageValue) stageValue.textContent = stage.name;
            
            try {
                const diffConfig = window.GameStatus.getDifficultyConfig();
                if (difficultyValue) difficultyValue.textContent = diffConfig.name;
            } catch (e) {
                console.error('Error getting difficulty config:', e);
            }
            
            try {
                if (timeValue) timeValue.textContent = window.GameStatus.formatTime(window.GameStatus.gameTime);
            } catch (e) {
                console.error('Error formatting time:', e);
            }

            try {
                this.updateGoalPanel(stage);
            } catch (e) {
                console.error('Error in updateGoalPanel:', e);
            }

            try {
                const progress = window.GameUtils.getProgress();
                if (progressBar) progressBar.style.width = `${progress}%`;
                if (progressText) progressText.textContent = `${Math.round(progress)}%`;
            } catch (e) {
                console.error('Error updating progress:', e);
            }

            if (game.player) {
                try {
                    this.updatePowerupIndicators(game.player);
                } catch (e) {
                    console.error('Error in updatePowerupIndicators:', e);
                }
                try {
                    this.updateSkillIndicators(game.player);
                } catch (e) {
                    console.error('Error in updateSkillIndicators:', e);
                }
                try {
                    this.checkStageUp(stage);
                } catch (e) {
                    console.error('Error in checkStageUp:', e);
                }
            }
        } catch (e) {
            console.error('Error in updateUI:', e);
        }
    },
    
    updateGoalPanel: function(stage) {
        try {
            const goalCurrent = document.getElementById('goalCurrent');
            const goalNext = document.getElementById('goalNext');
            
            if (!goalCurrent || !goalNext) return;
            
            const nextStageIndex = Math.min(stage.index + 1, window.CONFIG.growthStages.length - 1);
            const isMaxStage = stage.index === nextStageIndex;
            
            const game = window.gameInstance;
            const currentSize = game && game.player ? Math.round(game.player.size) : stage.minSize;
            
            goalCurrent.innerHTML = `
                <span class="goal-icon">🐟</span>
                <span class="goal-text">当前: ${stage.name} (${currentSize})</span>
            `;
            
            if (isMaxStage) {
                goalNext.innerHTML = `
                    <span class="goal-icon">👑</span>
                    <span class="goal-text">已达最高阶段！</span>
                `;
                goalNext.style.opacity = '0.7';
            } else {
                const nextStage = window.CONFIG.growthStages[nextStageIndex];
                goalNext.innerHTML = `
                    <span class="goal-icon">➡️</span>
                    <span class="goal-text">下一: ${nextStage.name} (${nextStage.minSize})</span>
                `;
                goalNext.style.opacity = '1';
            }
        } catch (e) {
            console.error('Error in updateGoalPanel:', e);
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
        
        const setClass = (element, className, shouldAdd) => {
            if (element) {
                if (shouldAdd) {
                    element.classList.add(className);
                } else {
                    element.classList.remove(className);
                }
            }
        };
        
        if (fishType === window.FishType.SWORD_FISH) {
            setClass(skillPanel, 'hidden', false);
            setClass(skill1Container, 'hidden', false);
            setClass(skill2Container, 'hidden', true);
            setClass(skillHint1, 'hidden', false);
            setClass(skillHint2, 'hidden', true);
            setClass(skill1Btn, 'hidden', false);
            setClass(skill2Btn, 'hidden', true);
            
            this.updateSkill1Indicator(player);
        } else if (fishType === window.FishType.PUFFER_FISH) {
            setClass(skillPanel, 'hidden', false);
            setClass(skill1Container, 'hidden', true);
            setClass(skill2Container, 'hidden', false);
            setClass(skillHint1, 'hidden', true);
            setClass(skillHint2, 'hidden', false);
            setClass(skill1Btn, 'hidden', true);
            setClass(skill2Btn, 'hidden', false);
            
            this.updateSkill2Indicator(player);
        } else {
            setClass(skillPanel, 'hidden', true);
            setClass(skill1Container, 'hidden', true);
            setClass(skill2Container, 'hidden', true);
            setClass(skillHint1, 'hidden', true);
            setClass(skillHint2, 'hidden', true);
            setClass(skill1Btn, 'hidden', true);
            setClass(skill2Btn, 'hidden', true);
        }
    },
    
    updateSkill1Indicator: function(player) {
        const skillIndicator = document.getElementById('skill1Indicator');
        const skillCooldown = document.getElementById('skill1Cooldown');
        const skillOverlay = document.getElementById('skill1CooldownOverlay');
        const skillName = document.getElementById('skill1Name');
        const skillBtnText = document.getElementById('skill1BtnText');
        const skillBtnCooldown = document.getElementById('skill1BtnCooldown');
        
        if (skillName && player.fishConfig) {
            skillName.textContent = player.fishConfig.skillName;
        }
        if (skillBtnText && player.fishConfig) {
            skillBtnText.textContent = player.fishConfig.skillName;
        }
        
        const cooldownPercent = player.getSkill1CooldownPercent();
        const remainingTime = player.getSkill1RemainingTime();
        
        if (player.isDashing) {
            if (skillIndicator) {
                skillIndicator.classList.remove('ready');
                skillIndicator.classList.add('active');
            }
            if (skillCooldown) skillCooldown.textContent = '!';
            if (skillOverlay) skillOverlay.style.height = '0%';
        } else if (cooldownPercent >= 100) {
            if (skillIndicator) {
                skillIndicator.classList.add('ready');
                skillIndicator.classList.remove('active');
            }
            if (skillCooldown) skillCooldown.textContent = 'J';
            if (skillOverlay) skillOverlay.style.height = '0%';
        } else {
            if (skillIndicator) {
                skillIndicator.classList.remove('ready', 'active');
            }
            if (skillCooldown) skillCooldown.textContent = remainingTime > 0 ? remainingTime : 'J';
            if (skillOverlay) skillOverlay.style.height = `${100 - cooldownPercent}%`;
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
        
        if (skillName && player.fishConfig) {
            skillName.textContent = player.fishConfig.skillName;
        }
        if (skillBtnText && player.fishConfig) {
            skillBtnText.textContent = player.fishConfig.skillName;
        }
        
        const cooldownPercent = player.getSkill2CooldownPercent();
        const remainingTime = player.getSkill2RemainingTime();
        
        if (player.isInflated) {
            if (skillIndicator) {
                skillIndicator.classList.remove('ready');
                skillIndicator.classList.add('active');
            }
            if (skillCooldown) skillCooldown.textContent = '!';
            if (skillOverlay) skillOverlay.style.height = '0%';
        } else if (cooldownPercent >= 100) {
            if (skillIndicator) {
                skillIndicator.classList.add('ready');
                skillIndicator.classList.remove('active');
            }
            if (skillCooldown) skillCooldown.textContent = 'K';
            if (skillOverlay) skillOverlay.style.height = '0%';
        } else {
            if (skillIndicator) {
                skillIndicator.classList.remove('ready', 'active');
            }
            if (skillCooldown) skillCooldown.textContent = remainingTime > 0 ? remainingTime : 'K';
            if (skillOverlay) skillOverlay.style.height = `${100 - cooldownPercent}%`;
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
        const startOverlay = document.getElementById('startOverlay');
        const gameOverOverlay = document.getElementById('gameOverOverlay');
        const pauseOverlay = document.getElementById('pauseOverlay');
        const pauseIndicator = document.getElementById('pauseIndicator');
        const mobileControls = document.getElementById('mobileControls');
        const fishTypePanel = document.getElementById('fishTypePanel');
        const skillPanel = document.getElementById('skillPanel');
        const controlHintLeft = document.getElementById('controlHintLeft');
        const controlHintRight = document.getElementById('controlHintRight');
        
        if (startOverlay) startOverlay.classList.remove('hidden');
        if (gameOverOverlay) gameOverOverlay.classList.add('hidden');
        if (pauseOverlay) pauseOverlay.classList.add('hidden');
        if (pauseIndicator) pauseIndicator.classList.add('hidden');
        if (mobileControls) mobileControls.classList.add('hidden');
        if (fishTypePanel) fishTypePanel.classList.add('hidden');
        if (skillPanel) skillPanel.classList.add('hidden');
        if (controlHintLeft) controlHintLeft.classList.add('hidden');
        if (controlHintRight) controlHintRight.classList.add('hidden');
    },

    hideAllOverlays: function() {
        const startOverlay = document.getElementById('startOverlay');
        const gameOverOverlay = document.getElementById('gameOverOverlay');
        const pauseOverlay = document.getElementById('pauseOverlay');
        const pauseIndicator = document.getElementById('pauseIndicator');
        const mobileControls = document.getElementById('mobileControls');
        
        if (startOverlay) startOverlay.classList.add('hidden');
        if (gameOverOverlay) gameOverOverlay.classList.add('hidden');
        if (pauseOverlay) pauseOverlay.classList.add('hidden');
        if (pauseIndicator) pauseIndicator.classList.add('hidden');
        
        try {
            this.updateFishTypePanel();
        } catch (e) {
            console.error('Error in updateFishTypePanel:', e);
        }
        try {
            this.updateControlHints();
        } catch (e) {
            console.error('Error in updateControlHints:', e);
        }
        
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        if (isMobile || window.innerWidth <= 768) {
            if (mobileControls) mobileControls.classList.remove('hidden');
        }
    },
    
    updateFishTypePanel: function() {
        const fishTypePanel = document.getElementById('fishTypePanel');
        const fishTypeIcon = document.getElementById('fishTypeIcon');
        const fishTypeName = document.getElementById('fishTypeName');
        
        if (!fishTypePanel) return;
        
        try {
            const fishConfig = window.GameStatus.getSelectedFishConfig();
            if (fishConfig) {
                const fishEmojis = {
                    normal: '🐟',
                    whale_shark: '🦈',
                    sword_fish: '🐡',
                    puffer_fish: '🐡'
                };
                if (fishTypeIcon) {
                    fishTypeIcon.textContent = fishEmojis[window.GameStatus.selectedFishType] || '🐟';
                }
                if (fishTypeName) {
                    fishTypeName.textContent = fishConfig.name;
                }
                fishTypePanel.classList.remove('hidden');
            }
        } catch (e) {
            console.error('Error in updateFishTypePanel:', e);
            fishTypePanel.classList.add('hidden');
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
            if (controlHintLeft) controlHintLeft.classList.add('hidden');
            if (controlHintRight) controlHintRight.classList.add('hidden');
            if (skillHint1) skillHint1.classList.add('hidden');
            if (skillHint2) skillHint2.classList.add('hidden');
            return;
        }
        
        if (controlHintLeft) controlHintLeft.classList.remove('hidden');
        if (controlHintRight) controlHintRight.classList.remove('hidden');
        
        const hintTitle = controlHintLeft ? controlHintLeft.querySelector('.hint-title') : null;
        const hintOr = controlHintLeft ? controlHintLeft.querySelector('.hint-or') : null;
        const keyBtns = controlHintLeft ? controlHintLeft.querySelectorAll('.key-btn') : [];
        const keyHints = controlHintLeft ? controlHintLeft.querySelectorAll('.key-hint') : [];
        
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
                if (skillHint1) skillHint1.classList.remove('hidden');
                if (skillHint2) skillHint2.classList.add('hidden');
                if (skillHintText1 && fishConfig) skillHintText1.textContent = fishConfig.skillName;
            } else if (window.GameStatus.selectedFishType === window.FishType.PUFFER_FISH) {
                if (skillHint1) skillHint1.classList.add('hidden');
                if (skillHint2) skillHint2.classList.remove('hidden');
                if (skillHintText2 && fishConfig) skillHintText2.textContent = fishConfig.skillName;
            } else {
                if (skillHint1) skillHint1.classList.add('hidden');
                if (skillHint2) skillHint2.classList.add('hidden');
            }
        } else {
            if (skillHint1) skillHint1.classList.add('hidden');
            if (skillHint2) skillHint2.classList.add('hidden');
        }
        
        const joystickLabel = document.getElementById('joystickLabel');
        if (joystickLabel) {
            if (controlMode === window.ControlMode.MOUSE) {
                joystickLabel.textContent = '鼠标跟随';
            } else if (controlMode === window.ControlMode.KEYBOARD) {
                joystickLabel.textContent = 'WASD 控制';
            } else {
                joystickLabel.textContent = '触屏控制';
            }
        }
    },
    
    updateJoystickIndicator: function(player, gameInstance) {
        const directionIndicator = document.getElementById('directionIndicator');
        if (!directionIndicator || !player) return;
        
        let directionX = 0;
        let directionY = 0;
        
        if (window.GameStatus.controlMode === window.ControlMode.MOUSE) {
            const dx = gameInstance.mouse.x - player.x;
            const dy = gameInstance.mouse.y - player.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 10) {
                directionX = dx / distance;
                directionY = dy / distance;
            }
        } else if (window.GameStatus.controlMode === window.ControlMode.KEYBOARD) {
            if (gameInstance.keys.w || gameInstance.keys.arrowup) directionY = -1;
            if (gameInstance.keys.s || gameInstance.keys.arrowdown) directionY = 1;
            if (gameInstance.keys.a || gameInstance.keys.arrowleft) directionX = -1;
            if (gameInstance.keys.d || gameInstance.keys.arrowright) directionX = 1;
            
            if (directionX !== 0 || directionY !== 0) {
                const length = Math.sqrt(directionX * directionX + directionY * directionY);
                directionX /= length;
                directionY /= length;
            }
        } else if (window.GameStatus.controlMode === window.ControlMode.TOUCH) {
            if (gameInstance.touchInput.active && gameInstance.touchInput.joystickCenter && gameInstance.touchInput.joystickCurrent) {
                const dx = gameInstance.touchInput.joystickCurrent.x - gameInstance.touchInput.joystickCenter.x;
                const dy = gameInstance.touchInput.joystickCurrent.y - gameInstance.touchInput.joystickCenter.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance > 10) {
                    directionX = dx / distance;
                    directionY = dy / distance;
                }
            }
        }
        
        const maxOffset = 32;
        const translateX = directionX * maxOffset;
        const translateY = directionY * maxOffset;
        
        const hasDirection = directionX !== 0 || directionY !== 0;
        if (hasDirection) {
            directionIndicator.style.transform = `translate(${translateX}px, ${translateY}px) scale(0.8)`;
            directionIndicator.style.background = 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)';
            directionIndicator.style.boxShadow = '0 0 20px rgba(33, 150, 243, 0.8), inset 0 0 10px rgba(255, 255, 255, 0.5)';
        } else {
            directionIndicator.style.transform = 'translate(0, 0) scale(0.5)';
            directionIndicator.style.background = 'linear-gradient(135deg, #64b5f6 0%, #42a5f5 100%)';
            directionIndicator.style.boxShadow = '0 0 10px rgba(100, 181, 246, 0.4), inset 0 0 5px rgba(255, 255, 255, 0.3)';
        }
    },

    showPauseOverlay: function() {
        const pauseIndicator = document.getElementById('pauseIndicator');
        const pauseOverlay = document.getElementById('pauseOverlay');
        const mobileControls = document.getElementById('mobileControls');
        const pauseScore = document.getElementById('pauseScore');
        const pauseTime = document.getElementById('pauseTime');
        
        if (pauseScore) {
            pauseScore.textContent = window.GameStatus.score;
        }
        if (pauseTime) {
            try {
                pauseTime.textContent = window.GameStatus.formatTime(window.GameStatus.gameTime);
            } catch (e) {
                pauseTime.textContent = '0:00';
            }
        }
        
        if (pauseIndicator) pauseIndicator.classList.remove('hidden');
        if (pauseOverlay) pauseOverlay.classList.remove('hidden');
        if (mobileControls) mobileControls.classList.add('hidden');
    },

    hidePauseOverlay: function() {
        const pauseIndicator = document.getElementById('pauseIndicator');
        const pauseOverlay = document.getElementById('pauseOverlay');
        const mobileControls = document.getElementById('mobileControls');
        
        if (pauseIndicator) pauseIndicator.classList.add('hidden');
        if (pauseOverlay) pauseOverlay.classList.add('hidden');
        
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        if (isMobile || window.innerWidth <= 768) {
            if (mobileControls) mobileControls.classList.remove('hidden');
        }
    },

    showGameOverOverlay: function() {
        console.log('showGameOverOverlay called');
        
        const finalScore = document.getElementById('finalScore');
        const summaryScore = document.getElementById('summaryScore');
        const summaryFish = document.getElementById('summaryFish');
        const summaryExplosions = document.getElementById('summaryExplosions');
        const summaryStage = document.getElementById('summaryStage');
        const summaryTime = document.getElementById('summaryTime');
        const summaryPowerups = document.getElementById('summaryPowerups');
        const summarySize = document.getElementById('summarySize');
        const gameOverReason = document.getElementById('gameOverReason');
        const deathCauseElement = document.getElementById('deathCause');
        const gameOverOverlay = document.getElementById('gameOverOverlay');
        const mobileControls = document.getElementById('mobileControls');
        
        console.log('Elements:', {
            finalScore: finalScore ? 'exists' : 'null',
            gameOverOverlay: gameOverOverlay ? 'exists' : 'null'
        });
        
        if (finalScore) finalScore.textContent = window.GameStatus.score;
        if (summaryScore) summaryScore.textContent = window.GameStatus.score;
        if (summaryFish) summaryFish.textContent = window.GameStatus.fishEaten;
        if (summaryExplosions) summaryExplosions.textContent = window.GameStatus.fishKilledByExplosion;
        if (summaryStage) summaryStage.textContent = window.GameStatus.stagesReached;
        if (summaryTime) {
            try {
                summaryTime.textContent = window.GameStatus.formatTime(window.GameStatus.gameTime);
            } catch (e) {
                summaryTime.textContent = '0:00';
            }
        }
        if (summaryPowerups) summaryPowerups.textContent = window.GameStatus.powerupsCollected;
        if (summarySize) summarySize.textContent = Math.round(window.GameStatus.maxSize);
        
        try {
            this.updateGameOverFishPanel();
        } catch (e) {
            console.error('Error in updateGameOverFishPanel:', e);
        }
        
        try {
            this.updateSkillStatsPanel();
        } catch (e) {
            console.error('Error in updateSkillStatsPanel:', e);
        }
        
        let stageName = '未知';
        try {
            const stage = window.GameUtils.getCurrentStageBySize(window.GameStatus.maxSize);
            if (stage && stage.name) stageName = stage.name;
        } catch (e) {
            console.error('Error getting stage:', e);
        }
        
        let reasonText = '';
        let deathCauseText = '';
        
        try {
            if (window.GameStatus.deathCause === window.DeathCause.EXPLOSION) {
                reasonText = `最高达到: ${stageName}，被海底爆炸消灭了！`;
                deathCauseText = '💥 死亡原因：海底爆炸';
            } else if (window.GameStatus.deathCause === window.DeathCause.EATEN) {
                reasonText = `最高达到: ${stageName}，被更大的鱼吃掉了！`;
                deathCauseText = '🐟 死亡原因：被大鱼吃掉';
            } else {
                reasonText = `最高达到: ${stageName}`;
                deathCauseText = '';
            }
        } catch (e) {
            console.error('Error determining death cause:', e);
            reasonText = `最高达到: ${stageName}`;
        }
        
        if (gameOverReason) gameOverReason.textContent = reasonText;
        
        if (deathCauseText) {
            if (deathCauseElement) {
                deathCauseElement.textContent = deathCauseText;
                deathCauseElement.classList.remove('hidden');
            }
        } else {
            if (deathCauseElement) {
                deathCauseElement.classList.add('hidden');
            }
        }
        
        if (gameOverOverlay) {
            gameOverOverlay.classList.remove('hidden');
            console.log('gameOverOverlay shown');
        }
        if (mobileControls) mobileControls.classList.add('hidden');
        
        console.log('Game Over overlay shown successfully');
    },
    
    updateGameOverFishPanel: function() {
        const fishUsedPanel = document.getElementById('fishUsedPanel');
        const fishUsedIcon = document.getElementById('fishUsedIcon');
        const fishUsedName = document.getElementById('fishUsedName');
        const fishUsedType = document.getElementById('fishUsedType');
        
        if (!fishUsedPanel) return;
        
        try {
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
                    sword_fish: '主动技能 - ' + (fishConfig.skillName || '未知'),
                    puffer_fish: '主动技能 - ' + (fishConfig.skillName || '未知')
                };
                
                if (fishUsedIcon) {
                    fishUsedIcon.textContent = fishEmojis[window.GameStatus.selectedFishType] || '🐟';
                }
                if (fishUsedName) {
                    fishUsedName.textContent = fishConfig.name || '普通鱼';
                }
                if (fishUsedType) {
                    fishUsedType.textContent = fishTypeLabels[window.GameStatus.selectedFishType] || '未知类型';
                }
                fishUsedPanel.classList.remove('hidden');
            }
        } catch (e) {
            console.error('Error in updateGameOverFishPanel:', e);
            fishUsedPanel.classList.add('hidden');
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
        
        if (!skillStatsPanel) return;
        
        try {
            const fishConfig = window.GameStatus.getSelectedFishConfig();
            
            if (fishConfig && fishConfig.skillType === window.SkillType.ACTIVE) {
                skillStatsPanel.classList.remove('hidden');
                
                if (window.GameStatus.selectedFishType === window.FishType.SWORD_FISH) {
                    if (skillStat1) skillStat1.classList.remove('hidden');
                    if (skillStat2) skillStat2.classList.add('hidden');
                    if (skillStatName1) skillStatName1.textContent = fishConfig.skillName || '技能1';
                    if (skillStatCount1) skillStatCount1.textContent = (window.GameStatus.skill1Used || 0) + '次';
                } else if (window.GameStatus.selectedFishType === window.FishType.PUFFER_FISH) {
                    if (skillStat1) skillStat1.classList.add('hidden');
                    if (skillStat2) skillStat2.classList.remove('hidden');
                    if (skillStatName2) skillStatName2.textContent = fishConfig.skillName || '技能2';
                    if (skillStatCount2) skillStatCount2.textContent = (window.GameStatus.skill2Used || 0) + '次';
                } else {
                    skillStatsPanel.classList.add('hidden');
                }
            } else {
                skillStatsPanel.classList.add('hidden');
            }
        } catch (e) {
            console.error('Error in updateSkillStatsPanel:', e);
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
