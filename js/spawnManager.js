window.SpawnManager = class SpawnManager {
    constructor(game) {
        this.game = game;
        this.enemyFish = [];
        this.powerups = [];
    }

    clear() {
        this.enemyFish = [];
        this.powerups = [];
    }

    spawnEnemyFish() {
        if (this.enemyFish.length >= window.CONFIG.maxEnemyFish) return;

        const playerSize = this.game.player.size;
        const isStartupPhase = window.GameStatus.isStartupPhase;
        
        const sizes = [];
        
        if (isStartupPhase) {
            console.log('Startup phase: only spawning safe fish, playerSize:', playerSize);
            for (let i = 0; i < 9; i++) {
                const safeSize = playerSize * (0.4 + Math.random() * 0.4);
                sizes.push(safeSize);
                console.log('  Safe fish size:', safeSize, 'ratio:', safeSize / playerSize);
            }
            for (let i = 0; i < 1; i++) {
                const similarSize = playerSize * (0.95 + Math.random() * 0.1);
                sizes.push(similarSize);
                console.log('  Similar fish size:', similarSize, 'ratio:', similarSize / playerSize);
            }
        } else {
            for (let i = 0; i < 6; i++) {
                sizes.push(playerSize * (0.4 + Math.random() * 0.45));
            }
            for (let i = 0; i < 3; i++) {
                const dangerSize = playerSize * (1.2 + Math.random() * 1.3);
                sizes.push(dangerSize);
                console.log('Danger fish size:', dangerSize, 'ratio:', dangerSize / playerSize);
            }
            for (let i = 0; i < 1; i++) {
                sizes.push(playerSize * (0.95 + Math.random() * 0.2));
            }
        }

        const fishSize = sizes[Math.floor(Math.random() * sizes.length)];
        console.log('Selected fish size:', fishSize, 'ratio to player:', fishSize / playerSize);
        
        const edge = Math.floor(Math.random() * 4);
        let x, y, direction;

        switch (edge) {
            case 0:
                x = -fishSize * 2;
                y = Math.random() * window.CONFIG.canvasHeight;
                direction = Math.random() * Math.PI * 0.5 - Math.PI * 0.25;
                break;
            case 1:
                x = window.CONFIG.canvasWidth + fishSize * 2;
                y = Math.random() * window.CONFIG.canvasHeight;
                direction = Math.PI + Math.random() * Math.PI * 0.5 - Math.PI * 0.25;
                break;
            case 2:
                x = Math.random() * window.CONFIG.canvasWidth;
                y = -fishSize * 2;
                direction = Math.PI * 0.5 + Math.random() * Math.PI * 0.5 - Math.PI * 0.25;
                break;
            case 3:
                x = Math.random() * window.CONFIG.canvasWidth;
                y = window.CONFIG.canvasHeight + fishSize * 2;
                direction = -Math.PI * 0.5 + Math.random() * Math.PI * 0.5 - Math.PI * 0.25;
                break;
        }

        this.enemyFish.push(new window.EnemyFish(x, y, fishSize, direction));
    }

    spawnPowerups() {
        if (this.powerups.length >= window.CONFIG.maxPowerups) return;
        if (Math.random() > 0.005) return;

        const x = 100 + Math.random() * (window.CONFIG.canvasWidth - 200);
        const y = 100 + Math.random() * (window.CONFIG.canvasHeight - 200);
        const type = Math.random() > 0.5 ? 'speed' : 'shield';

        this.powerups.push(new window.Powerup(x, y, type));
    }

    update(deltaTime, canvas) {
        this.enemyFish.forEach((fish, index) => {
            fish.update(deltaTime, canvas);
            if (fish.isOutOfBounds(canvas)) {
                this.enemyFish.splice(index, 1);
            }
        });

        this.powerups.forEach((powerup, index) => {
            powerup.update(deltaTime);
            if (powerup.lifetime <= 0) {
                this.powerups.splice(index, 1);
            }
        });
    }

    removeFish(index) {
        this.enemyFish.splice(index, 1);
    }

    removePowerup(index) {
        this.powerups.splice(index, 1);
    }

    render(ctx) {
        this.powerups.forEach(powerup => powerup.render(ctx));
        this.enemyFish.forEach(fish => fish.render(ctx));
    }
};
