window.Player = class Player {
    constructor(x, y, size) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.baseSpeed = window.CONFIG.playerBaseSpeed;
        this.direction = 0;
        this.hasSpeedBoost = false;
        this.speedBoostDuration = 0;
        this.hasShield = false;
        this.shieldDuration = 0;
        this.boostCooldown = 0;
        this.tailWag = 0;
        this.currentSpeed = this.baseSpeed;
    }

    update(deltaTime, mouse, canvas) {
        if (this.speedBoostDuration > 0) {
            this.speedBoostDuration -= deltaTime * 1000;
            if (this.speedBoostDuration <= 0) {
                this.hasSpeedBoost = false;
                this.speedBoostDuration = 0;
            }
        }

        if (this.shieldDuration > 0) {
            this.shieldDuration -= deltaTime * 1000;
            if (this.shieldDuration <= 0) {
                this.hasShield = false;
                this.shieldDuration = 0;
            }
        }

        if (this.boostCooldown > 0) {
            this.boostCooldown -= deltaTime * 1000;
        }

        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const targetAngle = Math.atan2(dy, dx);

        let angleDiff = targetAngle - this.direction;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        this.direction += angleDiff * 0.1;

        let currentSpeed = this.baseSpeed;
        
        const sizePenalty = 1 - (this.size - window.CONFIG.playerBaseSize) / window.CONFIG.playerMaxSize * 0.4;
        currentSpeed *= Math.max(0.5, sizePenalty);

        if (this.hasSpeedBoost) {
            currentSpeed *= window.CONFIG.speedBoostMultiplier;
        }

        this.currentSpeed = currentSpeed;

        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance > 5) {
            this.x += Math.cos(this.direction) * currentSpeed;
            this.y += Math.sin(this.direction) * currentSpeed;
        }

        this.x = Math.max(this.size, Math.min(canvas.width - this.size, this.x));
        this.y = Math.max(this.size, Math.min(canvas.height - this.size, this.y));

        this.tailWag += 0.2;
    }

    boost() {
        if (this.boostCooldown > 0) return;
        this.boostCooldown = 1000;
    }

    grow(newSize) {
        this.size = newSize;
    }

    collidesWith(object) {
        const dx = this.x - object.x;
        const dy = this.y - object.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const minDistance = (this.size + object.size) * 0.8;
        return distance < minDistance;
    }

    getSpeedLevel() {
        const speedRatio = this.currentSpeed / this.baseSpeed;
        const levels = window.CONFIG.speedLevels;
        
        for (let i = levels.length - 1; i >= 0; i--) {
            if (speedRatio >= levels[i].threshold) {
                return { ...levels[i], ratio: speedRatio };
            }
        }
        return { ...levels[0], ratio: speedRatio };
    }

    render(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.direction);

        if (this.hasShield) {
            ctx.beginPath();
            ctx.arc(0, 0, this.size * 1.3, 0, Math.PI * 2);
            const shieldGradient = ctx.createRadialGradient(0, 0, this.size, 0, 0, this.size * 1.3);
            shieldGradient.addColorStop(0, 'rgba(100, 181, 246, 0)');
            shieldGradient.addColorStop(0.7, 'rgba(100, 181, 246, 0.3)');
            shieldGradient.addColorStop(1, 'rgba(100, 181, 246, 0.6)');
            ctx.fillStyle = shieldGradient;
            ctx.fill();
            
            ctx.strokeStyle = 'rgba(100, 181, 246, 0.8)';
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        if (this.hasSpeedBoost) {
            ctx.beginPath();
            ctx.moveTo(-this.size * 0.5, 0);
            ctx.lineTo(-this.size * 1.5, -this.size * 0.3);
            ctx.lineTo(-this.size * 1.5, this.size * 0.3);
            ctx.closePath();
            ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
            ctx.fill();
        }

        const stage = window.GameUtils.getCurrentStageBySize(this.size);
        const bodyColor = stage ? stage.sizeColor : '#64b5f6';
        const darkColor = this.getDarkerColor(bodyColor);
        const lightColor = this.getLighterColor(bodyColor);

        const bodyGradient = ctx.createRadialGradient(
            -this.size * 0.2, -this.size * 0.2, 0,
            0, 0, this.size
        );
        bodyGradient.addColorStop(0, lightColor);
        bodyGradient.addColorStop(0.7, bodyColor);
        bodyGradient.addColorStop(1, darkColor);

        ctx.beginPath();
        ctx.ellipse(0, 0, this.size * 0.8, this.size * 0.5, 0, 0, Math.PI * 2);
        ctx.fillStyle = bodyGradient;
        ctx.fill();
        ctx.strokeStyle = darkColor;
        ctx.lineWidth = 1;
        ctx.stroke();

        const tailWagOffset = Math.sin(this.tailWag) * this.size * 0.1;
        ctx.beginPath();
        ctx.moveTo(-this.size * 0.7, 0);
        ctx.quadraticCurveTo(
            -this.size * 1.2, -this.size * 0.4 + tailWagOffset,
            -this.size * 1.5, -this.size * 0.3 + tailWagOffset
        );
        ctx.quadraticCurveTo(
            -this.size * 1.3, 0,
            -this.size * 1.5, this.size * 0.3 - tailWagOffset
        );
        ctx.quadraticCurveTo(
            -this.size * 1.2, this.size * 0.4 - tailWagOffset,
            -this.size * 0.7, 0
        );
        ctx.fillStyle = lightColor;
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(0, -this.size * 0.45);
        ctx.quadraticCurveTo(
            -this.size * 0.3, -this.size * 0.8,
            -this.size * 0.1, -this.size * 0.6
        );
        ctx.lineTo(0, -this.size * 0.45);
        ctx.fillStyle = lightColor;
        ctx.fill();

        ctx.beginPath();
        ctx.ellipse(
            this.size * 0.1, 
            this.size * 0.35, 
            this.size * 0.2, 
            this.size * 0.1, 
            Math.PI * 0.3, 
            0, 
            Math.PI * 2
        );
        ctx.fillStyle = lightColor;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(this.size * 0.4, -this.size * 0.15, this.size * 0.15, 0, Math.PI * 2);
        ctx.fillStyle = 'white';
        ctx.fill();
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(this.size * 0.45, -this.size * 0.15, this.size * 0.08, 0, Math.PI * 2);
        ctx.fillStyle = '#333';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(this.size * 0.48, -this.size * 0.18, this.size * 0.03, 0, Math.PI * 2);
        ctx.fillStyle = 'white';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(this.size * 0.65, 0, this.size * 0.1, -Math.PI * 0.3, Math.PI * 0.3);
        ctx.strokeStyle = darkColor;
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.restore();
    }

    getDarkerColor(hex) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgb(${Math.max(0, r - 40)}, ${Math.max(0, g - 40)}, ${Math.max(0, b - 40)})`;
    }

    getLighterColor(hex) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgb(${Math.min(255, r + 60)}, ${Math.min(255, g + 60)}, ${Math.min(255, b + 60)})`;
    }
};

window.EnemyFish = class EnemyFish {
    constructor(x, y, size, direction) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.direction = direction;
        this.speed = this.calculateSpeed();
        this.tailWag = Math.random() * Math.PI * 2;
        this.color = this.getRandomColor();
    }

    calculateSpeed() {
        const baseSpeed = 1.5 + Math.random() * 1.0;
        const sizeRatio = this.size / window.CONFIG.playerMaxSize;
        const speedMultiplier = (1.4 - sizeRatio * 0.5);
        return Math.max(window.CONFIG.minSpeed, baseSpeed * speedMultiplier);
    }

    getRandomColor() {
        const colors = [
            { body: '#ff7043', dark: '#e64a19', light: '#ffab91' },
            { body: '#66bb6a', dark: '#388e3c', light: '#a5d6a7' },
            { body: '#ffa726', dark: '#f57c00', light: '#ffcc80' },
            { body: '#ab47bc', dark: '#7b1fa2', light: '#ce93d8' },
            { body: '#ef5350', dark: '#d32f2f', light: '#ef9a9a' },
            { body: '#26c6da', dark: '#0097a7', light: '#80deea' },
            { body: '#ec407a', dark: '#c2185b', light: '#f48fb1' },
            { body: '#5c6bc0', dark: '#3949ab', light: '#9fa8da' }
        ];
        
        return colors[Math.floor(Math.random() * colors.length)];
    }

    update(deltaTime, canvas) {
        this.x += Math.cos(this.direction) * this.speed;
        this.y += Math.sin(this.direction) * this.speed;
        this.tailWag += 0.15;
    }

    isOutOfBounds(canvas) {
        const margin = this.size * 3;
        return this.x < -margin || 
               this.x > canvas.width + margin ||
               this.y < -margin || 
               this.y > canvas.height + margin;
    }

    collidesWith(object) {
        const dx = this.x - object.x;
        const dy = this.y - object.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const minDistance = (this.size + object.size) * 0.8;
        return distance < minDistance;
    }

    render(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.direction);

        const bodyGradient = ctx.createRadialGradient(
            -this.size * 0.2, -this.size * 0.2, 0,
            0, 0, this.size
        );
        bodyGradient.addColorStop(0, this.color.light);
        bodyGradient.addColorStop(0.7, this.color.body);
        bodyGradient.addColorStop(1, this.color.dark);

        ctx.beginPath();
        ctx.ellipse(0, 0, this.size * 0.8, this.size * 0.5, 0, 0, Math.PI * 2);
        ctx.fillStyle = bodyGradient;
        ctx.fill();
        ctx.strokeStyle = this.color.dark;
        ctx.lineWidth = 1;
        ctx.stroke();

        const tailWagOffset = Math.sin(this.tailWag) * this.size * 0.1;
        ctx.beginPath();
        ctx.moveTo(-this.size * 0.7, 0);
        ctx.quadraticCurveTo(
            -this.size * 1.2, -this.size * 0.4 + tailWagOffset,
            -this.size * 1.5, -this.size * 0.3 + tailWagOffset
        );
        ctx.quadraticCurveTo(
            -this.size * 1.3, 0,
            -this.size * 1.5, this.size * 0.3 - tailWagOffset
        );
        ctx.quadraticCurveTo(
            -this.size * 1.2, this.size * 0.4 - tailWagOffset,
            -this.size * 0.7, 0
        );
        ctx.fillStyle = this.color.light;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(this.size * 0.4, -this.size * 0.15, this.size * 0.12, 0, Math.PI * 2);
        ctx.fillStyle = 'white';
        ctx.fill();
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(this.size * 0.44, -this.size * 0.15, this.size * 0.06, 0, Math.PI * 2);
        ctx.fillStyle = '#333';
        ctx.fill();

        ctx.restore();
    }
};
