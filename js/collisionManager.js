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
        
        enemies.forEach((fish, fishIndex) => {
            if (player.collidesWith(fish)) {
                const playerSize = player.size;
                const enemySize = fish.size;
                const sizeRatio = enemySize / playerSize;
                
                console.log('Collision detected!');
                console.log('  Player size:', playerSize);
                console.log('  Enemy size:', enemySize);
                console.log('  Size ratio (enemy/player):', sizeRatio);
                console.log('  Eatable ratio:', window.CONFIG.eatableSizeRatio);
                console.log('  Danger ratio:', window.CONFIG.dangerSizeRatio);

                if (sizeRatio < window.CONFIG.eatableSizeRatio) {
                    console.log('  => Can eat! (ratio < eatableRatio)');
                    this.eatFish(fish, fishIndex);
                } else if (sizeRatio > window.CONFIG.dangerSizeRatio) {
                    console.log('  => DANGER! (ratio > dangerRatio)');
                    console.log('  Has shield:', player.hasShield);
                    if (player.hasShield) {
                        console.log('  => Shield consumed, game continues');
                        this.handleShieldCollision(player);
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

        const growthAmount = fish.size * 0.15;
        const newSize = Math.min(this.game.player.size + growthAmount, window.CONFIG.playerMaxSize);
        this.game.player.grow(newSize);

        this.game.particleSystem.createParticles(fish.x, fish.y, '#4caf50', 8);

        this.game.spawnManager.removeFish(fishIndex);
    }

    handleShieldCollision(player) {
        player.shieldDuration = 0;
        player.hasShield = false;
        this.game.particleSystem.createParticles(player.x, player.y, '#64b5f6', 15);
    }

    collectPowerup(powerup, index) {
        const player = this.game.player;
        
        if (powerup.type === 'speed') {
            player.speedBoostDuration = window.CONFIG.speedBoostDuration;
            player.hasSpeedBoost = true;
        } else if (powerup.type === 'shield') {
            player.shieldDuration = window.CONFIG.shieldDuration;
            player.hasShield = true;
        }

        this.game.particleSystem.createParticles(
            powerup.x, 
            powerup.y, 
            powerup.type === 'speed' ? '#ffd700' : '#64b5f6', 
            12
        );
        
        this.game.spawnManager.removePowerup(index);
    }
};
