window.Player = class Player {
    constructor(x, y, size, fishType = window.FishType.NORMAL) {
        this.x = x;
        this.y = y;
        this.fishType = fishType;
        this.fishConfig = window.CONFIG.fishTypes[fishType];
        
        this.skinConfig = window.GameStatus.getCurrentSkinConfig(fishType);
        this.hasSkin = this.skinConfig !== null;
        
        this.baseSize = this.fishConfig.baseSize;
        this.size = Math.max(size, this.baseSize);
        this.baseSpeed = this.fishConfig.baseSpeed;
        this.direction = 0;
        this.hasSpeedBoost = false;
        this.speedBoostDuration = 0;
        this.hasShield = false;
        this.shieldDuration = 0;
        this.boostCooldown = 0;
        this.tailWag = 0;
        this.currentSpeed = this.baseSpeed;
        this.shieldPulse = 0;
        this.speedTrails = [];
        this.previousSize = this.size;
        this.isInvulnerable = false;
        this.invulnerabilityDuration = 0;
        this.invulnerabilityFlashRate = 0.1;
        this.invulnerabilityFlashTimer = 0;
        this.showPlayer = true;
        
        this.isDashing = false;
        this.dashDuration = 0;
        this.dashCooldown = 0;
        this.dashDirection = 0;
        this.dashStartX = 0;
        this.dashStartY = 0;
        
        this.isInflated = false;
        this.inflateDuration = 0;
        this.inflateCooldown = 0;
        this.inflateAnimationPhase = 0;
        this.spikePhase = 0;
        
        this.skinEffectPhase = 0;
        this.skinParticles = [];
    }

    getEffectiveSize() {
        if (this.isInflated && this.fishType === window.FishType.PUFFER_FISH) {
            return this.size * this.fishConfig.inflateMultiplier;
        }
        return this.size;
    }

    getEffectiveSpeed() {
        let speed = this.baseSpeed;
        
        const sizePenalty = 1 - (this.size - window.CONFIG.playerBaseSize) / window.CONFIG.playerMaxSize * 0.4;
        speed *= Math.max(0.5, sizePenalty);

        if (this.hasSpeedBoost) {
            speed *= window.CONFIG.speedBoostMultiplier;
        }
        
        if (this.isDashing && this.fishType === window.FishType.SWORD_FISH) {
            speed = this.fishConfig.dashSpeed;
        }
        
        if (this.isInflated && this.fishType === window.FishType.PUFFER_FISH) {
            speed *= this.fishConfig.inflateSpeedMultiplier;
        }
        
        return speed;
    }

    update(deltaTime, mouse, canvas, keys) {
        if (this.speedBoostDuration > 0) {
            this.speedBoostDuration -= deltaTime * 1000;
            if (this.speedBoostDuration <= 0) {
                this.hasSpeedBoost = false;
                this.speedBoostDuration = 0;
                this.speedTrails = [];
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

        if (this.isInvulnerable) {
            this.invulnerabilityDuration -= deltaTime * 1000;
            if (this.invulnerabilityDuration <= 0) {
                this.isInvulnerable = false;
                this.showPlayer = true;
            } else {
                this.invulnerabilityFlashTimer += deltaTime;
                if (this.invulnerabilityFlashTimer >= this.invulnerabilityFlashRate) {
                    this.invulnerabilityFlashTimer = 0;
                    this.showPlayer = !this.showPlayer;
                }
            }
        }

        if (this.dashCooldown > 0) {
            this.dashCooldown -= deltaTime * 1000;
        }
        if (this.isDashing) {
            this.dashDuration -= deltaTime * 1000;
            if (this.dashDuration <= 0) {
                this.isDashing = false;
                this.dashDuration = 0;
            }
        }

        if (this.inflateCooldown > 0) {
            this.inflateCooldown -= deltaTime * 1000;
        }
        if (this.isInflated) {
            this.inflateDuration -= deltaTime * 1000;
            this.inflateAnimationPhase += deltaTime * 5;
            this.spikePhase += deltaTime * 3;
            if (this.inflateDuration <= 0) {
                this.isInflated = false;
                this.inflateDuration = 0;
                this.inflateAnimationPhase = 0;
            }
        }

        let currentSpeed = this.getEffectiveSpeed();
        this.currentSpeed = currentSpeed;

        const controlMode = window.GameStatus.controlMode;
        let isMoving = false;

        if (this.isDashing && this.fishType === window.FishType.SWORD_FISH) {
            this.x += Math.cos(this.dashDirection) * currentSpeed;
            this.y += Math.sin(this.dashDirection) * currentSpeed;
            this.addSpeedTrail();
            isMoving = true;
        } else if (controlMode === window.ControlMode.KEYBOARD && keys) {
            let dx = 0;
            let dy = 0;

            if (keys['w'] || keys['arrowup']) dy -= 1;
            if (keys['s'] || keys['arrowdown']) dy += 1;
            if (keys['a'] || keys['arrowleft']) dx -= 1;
            if (keys['d'] || keys['arrowright']) dx += 1;

            if (dx !== 0 || dy !== 0) {
                const length = Math.sqrt(dx * dx + dy * dy);
                dx /= length;
                dy /= length;

                const targetAngle = Math.atan2(dy, dx);
                let angleDiff = targetAngle - this.direction;
                while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
                while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
                this.direction += angleDiff * 0.15;

                this.x += dx * currentSpeed;
                this.y += dy * currentSpeed;
                isMoving = true;
            }
        } else {
            const dx = mouse.x - this.x;
            const dy = mouse.y - this.y;
            const targetAngle = Math.atan2(dy, dx);

            let angleDiff = targetAngle - this.direction;
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
            this.direction += angleDiff * 0.1;

            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance > 5) {
                this.x += Math.cos(this.direction) * currentSpeed;
                this.y += Math.sin(this.direction) * currentSpeed;
                isMoving = true;
            }
        }

        if (isMoving && this.hasSpeedBoost && currentSpeed > this.baseSpeed * 1.2) {
            this.addSpeedTrail();
        }

        const effectiveSize = this.getEffectiveSize();
        this.x = Math.max(effectiveSize, Math.min(canvas.width - effectiveSize, this.x));
        this.y = Math.max(effectiveSize, Math.min(canvas.height - effectiveSize, this.y));

        this.tailWag += 0.2 + (currentSpeed / this.baseSpeed) * 0.1;
        this.shieldPulse += 0.1;
        
        this.updateSpeedTrails(deltaTime);
        
        this.previousSize = this.size;
    }

    useSkill1() {
        if (this.fishType === window.FishType.SWORD_FISH) {
            if (this.dashCooldown > 0 || this.isDashing) return false;
            this.isDashing = true;
            this.dashDuration = this.fishConfig.dashDuration;
            this.dashCooldown = this.fishConfig.skillCooldown;
            this.dashDirection = this.direction;
            this.dashStartX = this.x;
            this.dashStartY = this.y;
            this.activateInvulnerability(this.fishConfig.dashDuration + 200);
            return true;
        }
        return false;
    }

    useSkill2() {
        if (this.fishType === window.FishType.PUFFER_FISH) {
            if (this.inflateCooldown > 0 || this.isInflated) return false;
            this.isInflated = true;
            this.inflateDuration = this.fishConfig.inflateDuration;
            this.inflateCooldown = this.fishConfig.skillCooldown;
            this.inflateAnimationPhase = 0;
            return true;
        }
        return false;
    }
    
    getDirection() {
        return {
            x: Math.cos(this.direction),
            y: Math.sin(this.direction)
        };
    }

    getSkill1CooldownPercent() {
        if (this.fishType !== window.FishType.SWORD_FISH) return 100;
        if (this.dashCooldown <= 0) return 100;
        const config = this.fishConfig;
        return Math.max(0, 100 - (this.dashCooldown / config.skillCooldown * 100));
    }

    getSkill2CooldownPercent() {
        if (this.fishType !== window.FishType.PUFFER_FISH) return 100;
        if (this.inflateCooldown <= 0) return 100;
        const config = this.fishConfig;
        return Math.max(0, 100 - (this.inflateCooldown / config.skillCooldown * 100));
    }

    getSkill1RemainingTime() {
        if (this.fishType !== window.FishType.SWORD_FISH) return 0;
        return Math.max(0, Math.ceil(this.dashCooldown / 1000));
    }

    getSkill2RemainingTime() {
        if (this.fishType !== window.FishType.PUFFER_FISH) return 0;
        return Math.max(0, Math.ceil(this.inflateCooldown / 1000));
    }

    addSpeedTrail() {
        this.speedTrails.push({
            x: this.x - Math.cos(this.direction) * this.getEffectiveSize() * 0.8,
            y: this.y - Math.sin(this.direction) * this.getEffectiveSize() * 0.8,
            size: this.getEffectiveSize() * 0.6,
            alpha: 0.6,
            direction: this.direction
        });
        
        if (this.speedTrails.length > 8) {
            this.speedTrails.shift();
        }
    }

    updateSpeedTrails(deltaTime) {
        this.speedTrails.forEach((trail, index) => {
            trail.alpha -= deltaTime * 2;
            trail.size *= 0.95;
        });
        
        this.speedTrails = this.speedTrails.filter(trail => trail.alpha > 0);
    }

    boost() {
        if (this.boostCooldown > 0) return;
        this.boostCooldown = 1000;
    }

    grow(newSize) {
        this.size = newSize;
    }

    activateInvulnerability(durationMs = 2000) {
        this.isInvulnerable = true;
        this.invulnerabilityDuration = durationMs;
        this.invulnerabilityFlashTimer = 0;
        this.showPlayer = true;
    }

    collidesWith(object) {
        if (this.isInvulnerable) {
            return false;
        }
        
        const dx = this.x - object.x;
        const dy = this.y - object.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const effectiveSize = this.getEffectiveSize();
        const minDistance = (effectiveSize + object.size) * 0.8;
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
        this.renderSpeedTrails(ctx);

        if (!this.showPlayer) {
            return;
        }

        const effectiveSize = this.getEffectiveSize();

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.direction);

        if (this.isInvulnerable) {
            this.renderInvulnerabilityEffect(ctx, effectiveSize);
        }

        if (this.hasShield) {
            this.renderShield(ctx, effectiveSize);
        }

        if (this.hasSpeedBoost || this.isDashing) {
            this.renderSpeedEffect(ctx, effectiveSize);
        }

        if (this.isDashing && this.fishType === window.FishType.SWORD_FISH) {
            this.renderDashEffect(ctx, effectiveSize);
        }

        if (this.isInflated && this.fishType === window.FishType.PUFFER_FISH) {
            this.renderPufferSpikes(ctx, effectiveSize);
        }

        this.renderFish(ctx, effectiveSize);

        ctx.restore();
    }

    renderFish(ctx, effectiveSize) {
        const stage = window.GameUtils.getCurrentStageBySize(this.size);
        let bodyColor, darkColor, lightColor, glowColor;
        
        if (this.hasSkin && this.skinConfig && this.skinConfig.colors) {
            bodyColor = this.skinConfig.colors.bodyColor;
            darkColor = this.skinConfig.colors.darkColor;
            lightColor = this.skinConfig.colors.lightColor;
            glowColor = this.skinConfig.colors.glowColor;
        } else if (window.GameStatus.useCustomColor && 
            window.GameStatus.customBodyColor && 
            window.GameStatus.customDarkColor && 
            window.GameStatus.customLightColor) {
            bodyColor = window.GameStatus.customBodyColor;
            darkColor = window.GameStatus.customDarkColor;
            lightColor = window.GameStatus.customLightColor;
        } else if (this.fishType === window.FishType.NORMAL) {
            bodyColor = stage ? stage.sizeColor : this.fishConfig.sizeColor;
            darkColor = this.getDarkerColor(bodyColor);
            lightColor = this.getLighterColor(bodyColor);
        } else {
            bodyColor = this.fishConfig.sizeColor;
            darkColor = this.fishConfig.darkColor;
            lightColor = this.fishConfig.lightColor;
        }

        const bodyGradient = ctx.createRadialGradient(
            -effectiveSize * 0.2, -effectiveSize * 0.2, 0,
            0, 0, effectiveSize
        );
        bodyGradient.addColorStop(0, lightColor);
        bodyGradient.addColorStop(0.7, bodyColor);
        bodyGradient.addColorStop(1, darkColor);

        if (this.hasSkin && this.skinConfig) {
            this.renderSkinEffect(ctx, effectiveSize, glowColor);
        }

        switch (this.fishType) {
            case window.FishType.SWORD_FISH:
                this.renderSwordFish(ctx, effectiveSize, bodyGradient, darkColor, lightColor);
                break;
            case window.FishType.WHALE_SHARK:
                this.renderWhaleShark(ctx, effectiveSize, bodyGradient, darkColor, lightColor);
                break;
            case window.FishType.PUFFER_FISH:
                this.renderPufferFish(ctx, effectiveSize, bodyGradient, darkColor, lightColor);
                break;
            default:
                this.renderNormalFish(ctx, effectiveSize, bodyGradient, darkColor, lightColor);
        }

        if (this.hasSkin && this.skinConfig) {
            this.renderSkinOverlay(ctx, effectiveSize, glowColor);
        }
    }

    renderNormalFish(ctx, effectiveSize, bodyGradient, darkColor, lightColor) {
        ctx.beginPath();
        ctx.ellipse(0, 0, effectiveSize * 0.8, effectiveSize * 0.5, 0, 0, Math.PI * 2);
        ctx.fillStyle = bodyGradient;
        ctx.fill();
        ctx.strokeStyle = darkColor;
        ctx.lineWidth = 1;
        ctx.stroke();

        this.renderFinsAndTail(ctx, effectiveSize, lightColor, darkColor);
        this.renderEye(ctx, effectiveSize, darkColor);
    }

    renderSwordFish(ctx, effectiveSize, bodyGradient, darkColor, lightColor) {
        ctx.beginPath();
        ctx.ellipse(0, 0, effectiveSize * 0.85, effectiveSize * 0.4, 0, 0, Math.PI * 2);
        ctx.fillStyle = bodyGradient;
        ctx.fill();
        ctx.strokeStyle = darkColor;
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(effectiveSize * 0.6, 0);
        ctx.lineTo(effectiveSize * 1.5, 0);
        ctx.strokeStyle = darkColor;
        ctx.lineWidth = effectiveSize * 0.08;
        ctx.lineCap = 'round';
        ctx.stroke();

        ctx.beginPath();
        ctx.ellipse(effectiveSize * 1.4, 0, effectiveSize * 0.08, effectiveSize * 0.03, 0, 0, Math.PI * 2);
        ctx.fillStyle = lightColor;
        ctx.fill();

        this.renderFinsAndTail(ctx, effectiveSize, lightColor, darkColor);
        this.renderEye(ctx, effectiveSize, darkColor);
    }

    renderWhaleShark(ctx, effectiveSize, bodyGradient, darkColor, lightColor) {
        ctx.beginPath();
        ctx.ellipse(0, 0, effectiveSize * 0.9, effectiveSize * 0.55, 0, 0, Math.PI * 2);
        ctx.fillStyle = bodyGradient;
        ctx.fill();
        ctx.strokeStyle = darkColor;
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        const spotPositions = [
            [-0.3, -0.2], [0.2, -0.25], [0.4, 0.1],
            [-0.4, 0.15], [0.1, 0.25], [-0.1, -0.1]
        ];
        spotPositions.forEach(pos => {
            ctx.beginPath();
            ctx.arc(effectiveSize * pos[0], effectiveSize * pos[1], effectiveSize * 0.06, 0, Math.PI * 2);
            ctx.fill();
        });

        this.renderFinsAndTail(ctx, effectiveSize, lightColor, darkColor);
        this.renderEye(ctx, effectiveSize, darkColor);
    }

    renderPufferFish(ctx, effectiveSize, bodyGradient, darkColor, lightColor) {
        const baseRadius = effectiveSize * 0.7;
        
        if (this.isInflated) {
            const pulse = Math.sin(this.inflateAnimationPhase) * 0.05;
            ctx.beginPath();
            ctx.arc(0, 0, baseRadius * (1 + pulse), 0, Math.PI * 2);
        } else {
            ctx.beginPath();
            ctx.ellipse(0, 0, effectiveSize * 0.7, effectiveSize * 0.55, 0, 0, Math.PI * 2);
        }
        ctx.fillStyle = bodyGradient;
        ctx.fill();
        ctx.strokeStyle = darkColor;
        ctx.lineWidth = 2;
        ctx.stroke();

        if (!this.isInflated) {
            this.renderFinsAndTail(ctx, effectiveSize, lightColor, darkColor);
        }
        this.renderEye(ctx, effectiveSize, darkColor);
    }

    renderPufferSpikes(ctx, effectiveSize) {
        const config = this.fishConfig;
        const spikeCount = 16;
        const innerRadius = effectiveSize * 0.7;
        const outerRadius = effectiveSize * 0.95;
        const pulseOffset = Math.sin(this.spikePhase) * 5;

        for (let i = 0; i < spikeCount; i++) {
            const angle = (Math.PI * 2 / spikeCount) * i;
            const innerX = Math.cos(angle) * innerRadius;
            const innerY = Math.sin(angle) * innerRadius;
            const outerX = Math.cos(angle) * (outerRadius + pulseOffset);
            const outerY = Math.sin(angle) * (outerRadius + pulseOffset);

            ctx.beginPath();
            ctx.moveTo(innerX - Math.cos(angle + 0.15) * 5, innerY - Math.sin(angle + 0.15) * 5);
            ctx.lineTo(outerX, outerY);
            ctx.lineTo(innerX - Math.cos(angle - 0.15) * 5, innerY - Math.sin(angle - 0.15) * 5);
            ctx.closePath();
            ctx.fillStyle = this.fishConfig.darkColor;
            ctx.fill();
            ctx.strokeStyle = this.fishConfig.lightColor;
            ctx.lineWidth = 1;
            ctx.stroke();
        }
    }

    renderFinsAndTail(ctx, effectiveSize, lightColor, darkColor) {
        const tailWagOffset = Math.sin(this.tailWag) * effectiveSize * 0.15;
        
        ctx.beginPath();
        ctx.moveTo(-effectiveSize * 0.7, 0);
        ctx.quadraticCurveTo(
            -effectiveSize * 1.2, -effectiveSize * 0.4 + tailWagOffset,
            -effectiveSize * 1.5, -effectiveSize * 0.3 + tailWagOffset
        );
        ctx.quadraticCurveTo(
            -effectiveSize * 1.3, 0,
            -effectiveSize * 1.5, effectiveSize * 0.3 - tailWagOffset
        );
        ctx.quadraticCurveTo(
            -effectiveSize * 1.2, effectiveSize * 0.4 - tailWagOffset,
            -effectiveSize * 0.7, 0
        );
        ctx.fillStyle = lightColor;
        ctx.fill();

        const dorsalWag = Math.sin(this.tailWag * 0.8) * 0.1;
        ctx.beginPath();
        ctx.moveTo(0, -effectiveSize * 0.45);
        ctx.quadraticCurveTo(
            -effectiveSize * 0.3 + dorsalWag * effectiveSize, -effectiveSize * 0.8,
            -effectiveSize * 0.1 + dorsalWag * effectiveSize * 0.5, -effectiveSize * 0.6
        );
        ctx.lineTo(0, -effectiveSize * 0.45);
        ctx.fillStyle = lightColor;
        ctx.fill();

        ctx.beginPath();
        ctx.ellipse(
            effectiveSize * 0.1, 
            effectiveSize * 0.35, 
            effectiveSize * 0.2, 
            effectiveSize * 0.1, 
            Math.PI * 0.3, 
            0, 
            Math.PI * 2
        );
        ctx.fillStyle = lightColor;
        ctx.fill();
    }

    renderEye(ctx, effectiveSize, darkColor) {
        const eyeGlow = this.hasSpeedBoost ? 0.3 : 0.1;
        const eyeSize = effectiveSize * 0.15;
        const eyeX = effectiveSize * 0.4;
        const eyeY = -effectiveSize * 0.15;

        const eyeGradient = ctx.createRadialGradient(eyeX, eyeY, 0, eyeX, eyeY, eyeSize);
        eyeGradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        eyeGradient.addColorStop(0.8, 'rgba(255, 255, 255, 0.8)');
        eyeGradient.addColorStop(1, `rgba(255, 255, 255, ${eyeGlow})`);

        ctx.beginPath();
        ctx.arc(eyeX, eyeY, eyeSize, 0, Math.PI * 2);
        ctx.fillStyle = eyeGradient;
        ctx.fill();
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(eyeX + effectiveSize * 0.05, eyeY, effectiveSize * 0.08, 0, Math.PI * 2);
        ctx.fillStyle = '#333';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(eyeX + effectiveSize * 0.08, eyeY - effectiveSize * 0.03, effectiveSize * 0.03, 0, Math.PI * 2);
        ctx.fillStyle = 'white';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(effectiveSize * 0.65, 0, effectiveSize * 0.1, -Math.PI * 0.3, Math.PI * 0.3);
        ctx.strokeStyle = darkColor;
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    renderDashEffect(ctx, effectiveSize) {
        const dashGradient = ctx.createRadialGradient(
            -effectiveSize * 0.5, 0, 0,
            -effectiveSize * 2, 0, effectiveSize * 1.2
        );
        dashGradient.addColorStop(0, 'rgba(255, 112, 67, 0.4)');
        dashGradient.addColorStop(0.5, 'rgba(255, 87, 34, 0.2)');
        dashGradient.addColorStop(1, 'rgba(255, 87, 34, 0)');

        ctx.beginPath();
        ctx.moveTo(-effectiveSize * 0.3, -effectiveSize * 0.5);
        ctx.lineTo(-effectiveSize * 3, -effectiveSize * 0.6);
        ctx.lineTo(-effectiveSize * 3, effectiveSize * 0.6);
        ctx.lineTo(-effectiveSize * 0.3, effectiveSize * 0.5);
        ctx.closePath();
        ctx.fillStyle = dashGradient;
        ctx.fill();

        for (let i = 0; i < 5; i++) {
            const yOffset = (i - 2) * effectiveSize * 0.2;
            ctx.beginPath();
            ctx.moveTo(-effectiveSize * 0.8, yOffset);
            ctx.lineTo(-effectiveSize * 2.5, yOffset);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    }

    renderInvulnerabilityEffect(ctx, effectiveSize) {
        const flashAlpha = 0.3 + Math.sin(this.shieldPulse * 3) * 0.2;
        
        const invulnerabilityGradient = ctx.createRadialGradient(0, 0, effectiveSize * 0.5, 0, 0, effectiveSize * 1.5);
        invulnerabilityGradient.addColorStop(0, `rgba(255, 255, 255, 0)`);
        invulnerabilityGradient.addColorStop(0.6, `rgba(255, 215, 0, ${flashAlpha * 0.3})`);
        invulnerabilityGradient.addColorStop(1, `rgba(255, 215, 0, ${flashAlpha * 0.5})`);

        ctx.beginPath();
        ctx.arc(0, 0, effectiveSize * 1.5, 0, Math.PI * 2);
        ctx.fillStyle = invulnerabilityGradient;
        ctx.fill();
        
        ctx.strokeStyle = `rgba(255, 215, 0, ${flashAlpha})`;
        ctx.lineWidth = 3;
        ctx.stroke();
    }

    renderSpeedTrails(ctx) {
        this.speedTrails.forEach(trail => {
            ctx.save();
            ctx.globalAlpha = trail.alpha * 0.5;
            ctx.translate(trail.x, trail.y);
            ctx.rotate(trail.direction);
            
            const trailGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, trail.size);
            trailGradient.addColorStop(0, 'rgba(255, 215, 0, 0.6)');
            trailGradient.addColorStop(0.5, 'rgba(255, 193, 7, 0.3)');
            trailGradient.addColorStop(1, 'rgba(255, 152, 0, 0)');
            
            ctx.beginPath();
            ctx.arc(0, 0, trail.size, 0, Math.PI * 2);
            ctx.fillStyle = trailGradient;
            ctx.fill();
            
            ctx.restore();
        });
    }

    renderShield(ctx, effectiveSize) {
        const shieldSize = effectiveSize * 1.4;
        const pulseAmount = Math.sin(this.shieldPulse * 2) * 0.1;
        const currentShieldSize = shieldSize * (1 + pulseAmount);
        
        const isWarning = this.shieldDuration < 3000;
        const baseAlpha = isWarning ? 0.4 + Math.sin(this.shieldPulse * 5) * 0.3 : 0.6;
        
        const shieldGradient = ctx.createRadialGradient(0, 0, effectiveSize, 0, 0, currentShieldSize);
        shieldGradient.addColorStop(0, `rgba(100, 181, 246, 0)`);
        shieldGradient.addColorStop(0.6, `rgba(100, 181, 246, ${baseAlpha * 0.5})`);
        shieldGradient.addColorStop(1, `rgba(100, 181, 246, ${baseAlpha})`);

        ctx.beginPath();
        ctx.arc(0, 0, currentShieldSize, 0, Math.PI * 2);
        ctx.fillStyle = shieldGradient;
        ctx.fill();
        
        const ringColor = isWarning ? '#ff5722' : '#64b5f6';
        const ringAlpha = isWarning ? 0.8 + Math.sin(this.shieldPulse * 5) * 0.2 : 0.6;
        
        ctx.strokeStyle = `rgba(${isWarning ? '255, 87, 34' : '100, 181, 246'}, ${ringAlpha})`;
        ctx.lineWidth = 3;
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(0, 0, currentShieldSize * 0.9, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${isWarning ? '255, 87, 34' : '100, 181, 246'}, ${ringAlpha * 0.4})`;
        ctx.lineWidth = 1;
        ctx.stroke();
        
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI * 2 / 6) * i + this.shieldPulse * 0.5;
            const dotX = Math.cos(angle) * currentShieldSize;
            const dotY = Math.sin(angle) * currentShieldSize;
            
            ctx.beginPath();
            ctx.arc(dotX, dotY, 4, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${baseAlpha * 0.8})`;
            ctx.fill();
        }
    }

    renderSpeedEffect(ctx, effectiveSize) {
        const speedLevel = this.currentSpeed / this.baseSpeed;
        const intensity = Math.min((speedLevel - 1) / 0.8, 1);
        
        const effectGradient = ctx.createRadialGradient(
            -effectiveSize * 0.5, 0, 0,
            -effectiveSize * 1.2, 0, effectiveSize * 0.8
        );
        effectGradient.addColorStop(0, `rgba(255, 215, 0, ${0.3 * intensity})`);
        effectGradient.addColorStop(0.5, `rgba(255, 193, 7, ${0.2 * intensity})`);
        effectGradient.addColorStop(1, 'rgba(255, 152, 0, 0)');

        ctx.beginPath();
        ctx.moveTo(-effectiveSize * 0.3, -effectiveSize * 0.3);
        ctx.lineTo(-effectiveSize * 1.8 - intensity * effectiveSize, -effectiveSize * 0.5);
        ctx.lineTo(-effectiveSize * 1.8 - intensity * effectiveSize, effectiveSize * 0.5);
        ctx.lineTo(-effectiveSize * 0.3, effectiveSize * 0.3);
        ctx.closePath();
        ctx.fillStyle = effectGradient;
        ctx.fill();
        
        const streakCount = 3 + Math.floor(intensity * 3);
        for (let i = 0; i < streakCount; i++) {
            const yOffset = (i - streakCount / 2) * effectiveSize * 0.25;
            const length = effectiveSize * (0.8 + Math.random() * 0.4 + intensity * 0.5);
            
            ctx.beginPath();
            ctx.moveTo(-effectiveSize * 0.5, yOffset);
            ctx.lineTo(-effectiveSize * 0.5 - length, yOffset + (Math.random() - 0.5) * effectiveSize * 0.2);
            ctx.strokeStyle = `rgba(255, 255, 255, ${0.2 + Math.random() * 0.2})`;
            ctx.lineWidth = 1 + Math.random() * 2;
            ctx.stroke();
        }
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

    renderSkinEffect(ctx, effectiveSize, glowColor) {
        if (!this.skinConfig) return;
        
        const skinId = this.skinConfig.skinId;
        this.skinEffectPhase += 0.05;

        switch (skinId) {
            case window.SkinId.MOONLIGHT_FLOW:
                this.renderMoonlightFlowEffect(ctx, effectiveSize, glowColor);
                break;
            case window.SkinId.STAR_DOMINATOR:
                this.renderStarDominatorEffect(ctx, effectiveSize, glowColor);
                break;
            case window.SkinId.RED_BLADE:
                this.renderRedBladeEffect(ctx, effectiveSize, glowColor);
                break;
            case window.SkinId.GOLD_GUARDIAN:
                this.renderGoldGuardianEffect(ctx, effectiveSize, glowColor);
                break;
        }
    }

    renderMoonlightFlowEffect(ctx, effectiveSize, glowColor) {
        const pulse = Math.sin(this.skinEffectPhase) * 0.1 + 0.9;
        const glowSize = effectiveSize * 1.3 * pulse;
        
        const glowGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, glowSize);
        glowGradient.addColorStop(0, 'rgba(200, 230, 255, 0.3)');
        glowGradient.addColorStop(0.5, 'rgba(173, 216, 230, 0.15)');
        glowGradient.addColorStop(1, 'rgba(173, 216, 230, 0)');
        
        ctx.beginPath();
        ctx.arc(0, 0, glowSize, 0, Math.PI * 2);
        ctx.fillStyle = glowGradient;
        ctx.fill();

        ctx.save();
        ctx.rotate(this.skinEffectPhase * 0.3);
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 / 8) * i;
            const dist = effectiveSize * (0.6 + Math.sin(this.skinEffectPhase + i) * 0.2);
            const x = Math.cos(angle) * dist;
            const y = Math.sin(angle) * dist;
            const size = 2 + Math.sin(this.skinEffectPhase * 2 + i) * 1;
            
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(200, 230, 255, 0.6)';
            ctx.fill();
        }
        ctx.restore();
    }

    renderStarDominatorEffect(ctx, effectiveSize, glowColor) {
        const pulse = Math.sin(this.skinEffectPhase * 1.5) * 0.1 + 0.95;
        const glowSize = effectiveSize * 1.5 * pulse;
        
        const glowGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, glowSize);
        glowGradient.addColorStop(0, 'rgba(138, 43, 226, 0.35)');
        glowGradient.addColorStop(0.3, 'rgba(75, 0, 130, 0.2)');
        glowGradient.addColorStop(0.6, 'rgba(25, 25, 112, 0.1)');
        glowGradient.addColorStop(1, 'rgba(0, 0, 50, 0)');
        
        ctx.beginPath();
        ctx.arc(0, 0, glowSize, 0, Math.PI * 2);
        ctx.fillStyle = glowGradient;
        ctx.fill();

        const starCount = 20;
        for (let i = 0; i < starCount; i++) {
            const angle = (Math.PI * 2 / starCount) * i + this.skinEffectPhase * 0.2;
            const dist = effectiveSize * (0.5 + Math.sin(this.skinEffectPhase * 0.5 + i * 0.3) * 0.4);
            const x = Math.cos(angle) * dist;
            const y = Math.sin(angle) * dist;
            
            const twinkle = Math.sin(this.skinEffectPhase * 3 + i) * 0.5 + 0.5;
            const size = (1 + twinkle) * (effectiveSize * 0.03);
            
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(this.skinEffectPhase * 0.5 + i);
            
            ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + twinkle * 0.5})`;
            ctx.beginPath();
            for (let j = 0; j < 4; j++) {
                const starAngle = (Math.PI / 2) * j;
                const outerX = Math.cos(starAngle) * size;
                const outerY = Math.sin(starAngle) * size;
                const innerX = Math.cos(starAngle + Math.PI / 4) * size * 0.4;
                const innerY = Math.sin(starAngle + Math.PI / 4) * size * 0.4;
                
                if (j === 0) {
                    ctx.moveTo(outerX, outerY);
                } else {
                    ctx.lineTo(outerX, outerY);
                }
                ctx.lineTo(innerX, innerY);
            }
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }
    }

    renderRedBladeEffect(ctx, effectiveSize, glowColor) {
        const pulse = Math.sin(this.skinEffectPhase * 2) * 0.1 + 0.9;
        const glowSize = effectiveSize * 1.3 * pulse;
        
        const glowGradient = ctx.createRadialGradient(
            effectiveSize * 0.5, 0, 0,
            effectiveSize * 0.5, 0, glowSize
        );
        glowGradient.addColorStop(0, 'rgba(255, 60, 0, 0.4)');
        glowGradient.addColorStop(0.5, 'rgba(255, 30, 0, 0.2)');
        glowGradient.addColorStop(1, 'rgba(200, 0, 0, 0)');
        
        ctx.beginPath();
        ctx.arc(0, 0, glowSize, 0, Math.PI * 2);
        ctx.fillStyle = glowGradient;
        ctx.fill();

        const streakCount = 5;
        for (let i = 0; i < streakCount; i++) {
            const offset = (i - streakCount / 2) * effectiveSize * 0.12;
            const length = effectiveSize * (0.8 + Math.sin(this.skinEffectPhase + i) * 0.3);
            const alpha = 0.3 + Math.sin(this.skinEffectPhase * 2 + i * 0.5) * 0.2;
            
            ctx.beginPath();
            ctx.moveTo(effectiveSize * 0.8, offset);
            ctx.lineTo(effectiveSize * 0.8 + length, offset * 0.5);
            ctx.strokeStyle = `rgba(255, 100, 50, ${alpha})`;
            ctx.lineWidth = 2 + Math.sin(this.skinEffectPhase * 3 + i) * 1;
            ctx.stroke();
        }

        const sparkCount = 8;
        for (let i = 0; i < sparkCount; i++) {
            const angle = (Math.PI / 8) * (i - sparkCount / 2);
            const dist = effectiveSize * (1.0 + Math.sin(this.skinEffectPhase * 2 + i) * 0.2);
            const x = Math.cos(angle) * dist;
            const y = Math.sin(angle) * dist;
            const size = 1 + Math.sin(this.skinEffectPhase * 4 + i) * 0.5;
            
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 200, 100, 0.8)';
            ctx.fill();
        }
    }

    renderGoldGuardianEffect(ctx, effectiveSize, glowColor) {
        const pulse = Math.sin(this.skinEffectPhase * 1.2) * 0.1 + 0.9;
        const glowSize = effectiveSize * 1.4 * pulse;
        
        const glowGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, glowSize);
        glowGradient.addColorStop(0, 'rgba(255, 215, 0, 0.35)');
        glowGradient.addColorStop(0.4, 'rgba(255, 193, 7, 0.2)');
        glowGradient.addColorStop(0.7, 'rgba(255, 152, 0, 0.1)');
        glowGradient.addColorStop(1, 'rgba(200, 100, 0, 0)');
        
        ctx.beginPath();
        ctx.arc(0, 0, glowSize, 0, Math.PI * 2);
        ctx.fillStyle = glowGradient;
        ctx.fill();

        ctx.save();
        ctx.rotate(this.skinEffectPhase * 0.5);
        
        const ringCount = 3;
        for (let i = 0; i < ringCount; i++) {
            const ringSize = effectiveSize * (0.8 + i * 0.2);
            const alpha = 0.15 + Math.sin(this.skinEffectPhase + i * 0.8) * 0.1;
            
            ctx.beginPath();
            ctx.arc(0, 0, ringSize, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(255, 215, 0, ${alpha})`;
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 10]);
            ctx.stroke();
            ctx.setLineDash([]);
        }
        ctx.restore();

        const beadCount = 12;
        for (let i = 0; i < beadCount; i++) {
            const angle = (Math.PI * 2 / beadCount) * i + this.skinEffectPhase * 0.3;
            const dist = effectiveSize * (0.9 + Math.sin(this.skinEffectPhase * 1.5 + i * 0.5) * 0.15);
            const x = Math.cos(angle) * dist;
            const y = Math.sin(angle) * dist;
            const size = effectiveSize * (0.04 + Math.sin(this.skinEffectPhase * 2 + i) * 0.01);
            
            const beadGradient = ctx.createRadialGradient(
                x - size * 0.3, y - size * 0.3, 0,
                x, y, size
            );
            beadGradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
            beadGradient.addColorStop(0.3, 'rgba(255, 248, 220, 0.8)');
            beadGradient.addColorStop(0.7, 'rgba(255, 215, 0, 0.7)');
            beadGradient.addColorStop(1, 'rgba(218, 165, 32, 0.5)');
            
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fillStyle = beadGradient;
            ctx.fill();
        }
    }

    renderSkinOverlay(ctx, effectiveSize, glowColor) {
        if (!this.skinConfig) return;
        
        const skinId = this.skinConfig.skinId;
        const baseAlpha = 0.15 + Math.sin(this.skinEffectPhase) * 0.05;

        switch (skinId) {
            case window.SkinId.MOONLIGHT_FLOW:
                const moonGradient = ctx.createRadialGradient(
                    effectiveSize * 0.2, -effectiveSize * 0.1, 0,
                    0, 0, effectiveSize * 0.8
                );
                moonGradient.addColorStop(0, `rgba(200, 230, 255, ${baseAlpha})`);
                moonGradient.addColorStop(0.5, `rgba(173, 216, 230, ${baseAlpha * 0.5})`);
                moonGradient.addColorStop(1, 'rgba(173, 216, 230, 0)');
                
                ctx.beginPath();
                ctx.arc(0, 0, effectiveSize * 0.8, 0, Math.PI * 2);
                ctx.fillStyle = moonGradient;
                ctx.fill();
                break;

            case window.SkinId.STAR_DOMINATOR:
                const starCount = 6;
                for (let i = 0; i < starCount; i++) {
                    const angle = (Math.PI * 2 / starCount) * i + this.skinEffectPhase * 0.3;
                    const dist = effectiveSize * (0.3 + Math.sin(this.skinEffectPhase * 0.5 + i) * 0.15);
                    const x = Math.cos(angle) * dist;
                    const y = Math.sin(angle) * dist;
                    const size = effectiveSize * (0.04 + Math.sin(this.skinEffectPhase * 2 + i) * 0.015);
                    
                    const twinkle = Math.sin(this.skinEffectPhase * 3 + i * 0.7) * 0.3 + 0.5;
                    
                    const starGradient = ctx.createRadialGradient(x, y, 0, x, y, size * 2);
                    starGradient.addColorStop(0, `rgba(255, 255, 255, ${twinkle * 0.4})`);
                    starGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
                    
                    ctx.beginPath();
                    ctx.arc(x, y, size * 2, 0, Math.PI * 2);
                    ctx.fillStyle = starGradient;
                    ctx.fill();
                }
                break;

            case window.SkinId.RED_BLADE:
                const bladeGradient = ctx.createLinearGradient(
                    effectiveSize * 0.5, 0,
                    effectiveSize * 1.6, 0
                );
                bladeGradient.addColorStop(0, `rgba(255, 100, 50, ${baseAlpha * 1.5})`);
                bladeGradient.addColorStop(0.5, `rgba(255, 50, 0, ${baseAlpha})`);
                bladeGradient.addColorStop(1, 'rgba(200, 0, 0, 0)');
                
                ctx.beginPath();
                ctx.moveTo(effectiveSize * 0.6, -effectiveSize * 0.05);
                ctx.lineTo(effectiveSize * 1.5, 0);
                ctx.lineTo(effectiveSize * 0.6, effectiveSize * 0.05);
                ctx.closePath();
                ctx.fillStyle = bladeGradient;
                ctx.fill();
                break;

            case window.SkinId.GOLD_GUARDIAN:
                const goldCount = 8;
                for (let i = 0; i < goldCount; i++) {
                    const angle = (Math.PI * 2 / goldCount) * i + this.skinEffectPhase * 0.4;
                    const dist = effectiveSize * (0.45 + Math.sin(this.skinEffectPhase + i * 0.6) * 0.1);
                    const x = Math.cos(angle) * dist;
                    const y = Math.sin(angle) * dist;
                    const size = effectiveSize * (0.035 + Math.sin(this.skinEffectPhase * 1.8 + i) * 0.01);
                    
                    const beadGradient = ctx.createRadialGradient(
                        x - size * 0.3, y - size * 0.3, 0,
                        x, y, size
                    );
                    beadGradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
                    beadGradient.addColorStop(0.4, 'rgba(255, 248, 220, 0.7)');
                    beadGradient.addColorStop(0.8, 'rgba(255, 215, 0, 0.5)');
                    beadGradient.addColorStop(1, 'rgba(218, 165, 32, 0.2)');
                    
                    ctx.beginPath();
                    ctx.arc(x, y, size, 0, Math.PI * 2);
                    ctx.fillStyle = beadGradient;
                    ctx.fill();
                }
                break;
        }
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
        this.eyePhase = Math.random() * Math.PI * 2;
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
        this.eyePhase += 0.05;
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

        const tailWagOffset = Math.sin(this.tailWag) * this.size * 0.12;
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

        const eyeGlow = Math.sin(this.eyePhase) * 0.05 + 0.1;
        const eyeGradient = ctx.createRadialGradient(
            this.size * 0.4, -this.size * 0.15, 0,
            this.size * 0.4, -this.size * 0.15, this.size * 0.12
        );
        eyeGradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        eyeGradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.9)');
        eyeGradient.addColorStop(1, `rgba(255, 255, 255, ${eyeGlow})`);

        ctx.beginPath();
        ctx.arc(this.size * 0.4, -this.size * 0.15, this.size * 0.12, 0, Math.PI * 2);
        ctx.fillStyle = eyeGradient;
        ctx.fill();
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(this.size * 0.43, -this.size * 0.15, this.size * 0.06, 0, Math.PI * 2);
        ctx.fillStyle = '#333';
        ctx.fill();

        ctx.restore();
    }
};
