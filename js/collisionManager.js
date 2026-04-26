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
        
        const playerX = player.x;
        const playerY = player.y;
        const playerSize = player.size;
        const eatableRatio = diffConfig.eatableRatio;
        const dangerRatio = diffConfig.dangerRatio;
        
        for (let i = enemies.length - 1; i >= 0; i--) {
            const fish = enemies[i];
            
            const dx = fish.x - playerX;
            const dy = fish.y - playerY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const minDistance = (playerSize + fish.size) * 0.8;
            
            if (distance < minDistance) {
                const sizeRatio = fish.size / playerSize;

                if (sizeRatio < eatableRatio) {
                    this.eatFish(fish, i);
                } else if (sizeRatio > dangerRatio) {
                    if (player.hasShield) {
                        this.handleShieldCollision(player, i);
                    } else {
                        window.GameStatus.setDeathCause(window.DeathCause.EATEN);
                        this.game.gameOver();
                        return;
                    }
                }
            }
        }
    }

    checkPlayerPowerupCollisions() {
        const player = this.game.player;
        const powerups = this.game.spawnManager.powerups;
        
        for (let i = powerups.length - 1; i >= 0; i--) {
            const powerup = powerups[i];
            if (player.collidesWith(powerup)) {
                this.collectPowerup(powerup, i);
            }
        }
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
