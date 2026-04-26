window.CollisionManager = class CollisionManager {
    constructor(game) {
        this.game = game;
    }

    checkAllCollisions() {
        this.checkPlayerEnemyCollisions();
        this.checkPlayerPowerupCollisions();
    }

    checkPlayerEnemyCollisions() {
        const player = this.game.player;
        const enemies = this.game.spawnManager.enemyFish;
        const diffConfig = window.GameStatus.getDifficultyConfig();
        
        enemies.forEach((fish, fishIndex) => {
            if (player.collidesWith(fish)) {
                const playerSize = player.size;
                const enemySize = fish.size;
                const sizeRatio = enemySize / playerSize;
                
                console.log('Collision detected!');
                console.log('  Player size:', playerSize);
                console.log('  Enemy size:', enemySize);
                console.log('  Size ratio (enemy/player):', sizeRatio);
                console.log('  Eatable ratio:', diffConfig.eatableRatio);
                console.log('  Danger ratio:', diffConfig.dangerRatio);

                if (sizeRatio < diffConfig.eatableRatio) {
                    console.log('  => Can eat! (ratio < eatableRatio)');
                    this.eatFish(fish, fishIndex);
                } else if (sizeRatio > diffConfig.dangerRatio) {
                    console.log('  => DANGER! (ratio > dangerRatio)');
                    console.log('  Has shield:', player.hasShield);
                    if (player.hasShield) {
                        console.log('  => Shield consumed, game continues');
                        this.handleShieldCollision(player, fishIndex);
                    } else {
                        console.log('  => No shield, game over!');
                        this.game.gameOver();
                    }
                } else {
                    console.log('  => Neutral collision (between ratios), no effect');
                }
            }
        });
    }

    checkPlayerPowerupCollisions() {
        const player = this.game.player;
        const powerups = this.game.spawnManager.powerups;
        
        powerups.forEach((powerup, index) => {
            if (player.collidesWith(powerup)) {
                this.collectPowerup(powerup, index);
            }
        });
    }

    eatFish(fish, fishIndex) {
        const stage = window.GameUtils.getCurrentStage();
        const points = stage.scorePerFish;
        window.GameStatus.addScore(points);
        window.GameStatus.incrementFishEaten();

        const diffConfig = window.GameStatus.getDifficultyConfig();
        const growthAmount = fish.size * 0.15 * diffConfig.growthMultiplier;
        const newSize = Math.min(this.game.player.size + growthAmount, window.CONFIG.playerMaxSize);
        this.game.player.grow(newSize);

        this.game.particleSystem.createEatEffect(fish.x, fish.y, points);

        this.game.spawnManager.removeFish(fishIndex);
    }

    handleShieldCollision(player, fishIndex) {
        player.shieldDuration = 0;
        player.hasShield = false;
        
        player.activateInvulnerability(2500);
        
        this.game.particleSystem.createShieldBreakEffect(player.x, player.y);
        
        if (fishIndex !== undefined) {
            this.game.spawnManager.removeFish(fishIndex);
        }
        
        window.NotificationManager.show('🛡️ 护盾消耗！', '无敌2.5秒，继续战斗！', 2000);
    }

    collectPowerup(powerup, index) {
        const player = this.game.player;
        const diffConfig = window.GameStatus.getDifficultyConfig();
        
        window.GameStatus.incrementPowerupsCollected();
        
        if (powerup.type === 'speed') {
            player.speedBoostDuration = window.CONFIG.speedBoostDuration;
            player.hasSpeedBoost = true;
            this.game.particleSystem.createSpeedCollectEffect(powerup.x, powerup.y);
        } else if (powerup.type === 'shield') {
            player.shieldDuration = diffConfig.shieldDuration;
            player.hasShield = true;
            this.game.particleSystem.createShieldCollectEffect(powerup.x, powerup.y);
        }
        
        this.game.spawnManager.removePowerup(index);
    }
};
