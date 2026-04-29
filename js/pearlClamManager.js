window.PearlClamState = {
    CLOSED: 'closed',
    OPENING: 'opening',
    OPEN: 'open',
    WARNING: 'warning',
    CLOSING: 'closing',
    DEAD: 'dead'
};

window.PearlClam = class PearlClam {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.state = window.PearlClamState.CLOSED;
        this.size = window.CONFIG.pearlClam.clamSize;
        this.pearlSize = window.CONFIG.pearlClam.pearlSize;
        this.trapRadius = window.CONFIG.pearlClam.trapRadius;
        
        this.openProgress = 0;
        this.maxOpenOffset = this.size * 0.35;
        this.animationPhase = 0;
        this.pearlCollected = false;
        
        this.lifetime = 0;
        this.openDuration = window.CONFIG.pearlClam.openDuration;
        this.warningDuration = window.CONFIG.pearlClam.warningDuration;
        this.warningTime = this.openDuration - this.warningDuration;
        
        this.floatPhase = Math.random() * Math.PI * 2;
        this.warningPulsePhase = 0;
        this.warningExclamationPhase = 0;
        
        this.hasTrappedPlayer = false;
        
        this.pearlWorldX = this.x;
        this.pearlWorldY = this.y + this.size * 0.1;
    }

    update(deltaTime) {
        const deltaMs = deltaTime * 1000;
        this.lifetime += deltaMs;
        this.animationPhase += deltaMs * 0.003;
        this.floatPhase += deltaMs * 0.002;
        
        switch (this.state) {
            case window.PearlClamState.CLOSED:
                this.updateClosed(deltaMs);
                break;
            case window.PearlClamState.OPENING:
                this.updateOpening(deltaMs);
                break;
            case window.PearlClamState.OPEN:
                this.updateOpen(deltaMs);
                break;
            case window.PearlClamState.WARNING:
                this.updateWarning(deltaMs);
                break;
            case window.PearlClamState.CLOSING:
                this.updateClosing(deltaMs);
                break;
        }
        
        const floatOffset = Math.sin(this.floatPhase) * 3;
        this.pearlWorldY = this.y + floatOffset + this.size * 0.1;
    }

    updateClosed(deltaMs) {
        if (this.lifetime >= 2000) {
            this.state = window.PearlClamState.OPENING;
            this.lifetime = 0;
        }
    }

    updateOpening(deltaMs) {
        this.openProgress = Math.min(this.openProgress + deltaMs * 0.001, 1);
        
        if (this.openProgress >= 1) {
            this.state = window.PearlClamState.OPEN;
            this.lifetime = 0;
        }
    }

    updateOpen(deltaMs) {
        if (this.lifetime >= this.warningTime) {
            this.state = window.PearlClamState.WARNING;
            this.lifetime = 0;
        }
    }

    updateWarning(deltaMs) {
        this.warningPulsePhase += deltaMs * 0.008;
        this.warningExclamationPhase += deltaMs * 0.005;
        
        if (this.lifetime >= this.warningDuration) {
            this.state = window.PearlClamState.CLOSING;
            this.lifetime = 0;
        }
    }

    updateClosing(deltaMs) {
        this.openProgress = Math.max(this.openProgress - deltaMs * 0.0025, 0);
        
        if (this.openProgress <= 0) {
            this.state = window.PearlClamState.DEAD;
        }
    }

    isInTrapRange(playerX, playerY, playerSize) {
        if (this.state !== window.PearlClamState.CLOSING && 
            this.state !== window.PearlClamState.WARNING &&
            this.state !== window.PearlClamState.OPEN) {
            return false;
        }
        
        const dx = playerX - this.x;
        const dy = playerY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        return distance < (this.trapRadius + playerSize * 0.5);
    }

    canCollectPearl(playerX, playerY, playerSize) {
        if (this.pearlCollected || 
            (this.state !== window.PearlClamState.OPEN && 
             this.state !== window.PearlClamState.WARNING)) {
            return false;
        }
        
        const dx = playerX - this.pearlWorldX;
        const dy = playerY - this.pearlWorldY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        const collectRange = this.pearlSize * 2 + playerSize * 0.5;
        return distance < collectRange;
    }

    collectPearl() {
        if (this.pearlCollected) return 0;
        this.pearlCollected = true;
        return window.CONFIG.pearlClam.pearlValue;
    }

    isDead() {
        return this.state === window.PearlClamState.DEAD;
    }

    render(ctx) {
        const floatOffset = Math.sin(this.floatPhase) * 3;
        const currentY = this.y + floatOffset;
        
        ctx.save();
        ctx.translate(this.x, currentY);
        
        this.renderBackgroundGlow(ctx);
        this.renderClamShell(ctx);
        
        if ((this.state === window.PearlClamState.OPEN || 
             this.state === window.PearlClamState.WARNING) && 
            !this.pearlCollected) {
            this.renderPearl(ctx);
        }
        
        if (this.state === window.PearlClamState.WARNING) {
            this.renderWarning(ctx);
        }
        
        ctx.restore();
    }

    renderBackgroundGlow(ctx) {
        if (this.state === window.PearlClamState.OPEN || 
            this.state === window.PearlClamState.WARNING) {
            const glowIntensity = this.state === window.PearlClamState.WARNING ? 
                0.4 + Math.sin(this.warningPulsePhase) * 0.2 : 0.3;
            
            const glowGradient = ctx.createRadialGradient(
                0, 0, 0,
                0, 0, this.size * 1.5
            );
            glowGradient.addColorStop(0, `rgba(255, 215, 0, ${glowIntensity})`);
            glowGradient.addColorStop(0.5, `rgba(255, 193, 7, ${glowIntensity * 0.5})`);
            glowGradient.addColorStop(1, 'rgba(255, 152, 0, 0)');
            
            ctx.beginPath();
            ctx.arc(0, 0, this.size * 1.5, 0, Math.PI * 2);
            ctx.fillStyle = glowGradient;
            ctx.fill();
        }
    }

    renderClamShell(ctx) {
        const shellWidth = this.size * 0.9;
        const shellHeight = this.size * 0.5;
        const openOffset = this.openProgress * this.maxOpenOffset;
        
        this.renderBottomShell(ctx, shellWidth, shellHeight);
        
        ctx.save();
        ctx.translate(0, -openOffset);
        ctx.rotate(-this.openProgress * 0.5);
        this.renderTopShell(ctx, shellWidth, shellHeight);
        ctx.restore();
        
        this.renderHinge(ctx, shellWidth);
    }

    renderBottomShell(ctx, width, height) {
        const shellGradient = ctx.createRadialGradient(
            -width * 0.1, height * 0.1, 0,
            0, 0, width
        );
        shellGradient.addColorStop(0, '#E8DCC8');
        shellGradient.addColorStop(0.3, '#D4C4A8');
        shellGradient.addColorStop(0.7, '#C4B090');
        shellGradient.addColorStop(1, '#A89070');
        
        ctx.beginPath();
        ctx.ellipse(0, height * 0.15, width, height * 0.5, 0, 0, Math.PI);
        ctx.quadraticCurveTo(width * 0.5, height * 0.3, 0, height * 0.15);
        ctx.closePath();
        ctx.fillStyle = shellGradient;
        ctx.fill();
        ctx.strokeStyle = '#8B7355';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.strokeStyle = 'rgba(139, 115, 85, 0.3)';
        ctx.lineWidth = 0.5;
        for (let i = 1; i <= 4; i++) {
            const ratio = i * 0.2;
            ctx.beginPath();
            ctx.ellipse(
                0, height * 0.1,
                width * ratio, height * ratio * 0.3,
                0, Math.PI * 0.1, Math.PI * 0.9
            );
            ctx.stroke();
        }
    }

    renderTopShell(ctx, width, height) {
        const shellGradient = ctx.createRadialGradient(
            -width * 0.1, -height * 0.1, 0,
            0, 0, width
        );
        shellGradient.addColorStop(0, '#E8DCC8');
        shellGradient.addColorStop(0.3, '#D4C4A8');
        shellGradient.addColorStop(0.7, '#C4B090');
        shellGradient.addColorStop(1, '#A89070');
        
        ctx.beginPath();
        ctx.ellipse(0, -height * 0.15, width, height * 0.5, 0, Math.PI, Math.PI * 2);
        ctx.quadraticCurveTo(width * 0.5, -height * 0.3, 0, -height * 0.15);
        ctx.closePath();
        ctx.fillStyle = shellGradient;
        ctx.fill();
        ctx.strokeStyle = '#8B7355';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.strokeStyle = 'rgba(139, 115, 85, 0.3)';
        ctx.lineWidth = 0.5;
        for (let i = 1; i <= 4; i++) {
            const ratio = i * 0.2;
            ctx.beginPath();
            ctx.ellipse(
                0, -height * 0.1,
                width * ratio, height * ratio * 0.3,
                0, Math.PI * 1.1, Math.PI * 1.9
            );
            ctx.stroke();
        }
        
        ctx.save();
        ctx.clip();
        const innerGradient = ctx.createRadialGradient(
            -width * 0.2, 0, 0,
            0, 0, width * 0.6
        );
        innerGradient.addColorStop(0, 'rgba(255, 245, 230, 0.5)');
        innerGradient.addColorStop(1, 'rgba(255, 245, 230, 0)');
        
        ctx.beginPath();
        ctx.ellipse(
            width * 0.2, -height * 0.2,
            width * 0.4, height * 0.25,
            0, 0, Math.PI * 2
        );
        ctx.fillStyle = innerGradient;
        ctx.fill();
        ctx.restore();
    }

    renderHinge(ctx, shellWidth) {
        ctx.beginPath();
        ctx.ellipse(0, 0, shellWidth * 0.15, shellWidth * 0.08, 0, 0, Math.PI * 2);
        const hingeGradient = ctx.createRadialGradient(
            -shellWidth * 0.05, -shellWidth * 0.03, 0,
            0, 0, shellWidth * 0.15
        );
        hingeGradient.addColorStop(0, '#8B7355');
        hingeGradient.addColorStop(0.5, '#6B5344');
        hingeGradient.addColorStop(1, '#4A3728');
        ctx.fillStyle = hingeGradient;
        ctx.fill();
        ctx.strokeStyle = '#3A2718';
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    renderPearl(ctx) {
        const pearlY = this.size * 0.1;
        const pulseSize = 1 + Math.sin(this.animationPhase * 2) * 0.05;
        const currentPearlSize = this.pearlSize * pulseSize;
        
        const glowGradient = ctx.createRadialGradient(
            0, pearlY, 0,
            0, pearlY, currentPearlSize * 2.5
        );
        glowGradient.addColorStop(0, 'rgba(255, 215, 0, 0.4)');
        glowGradient.addColorStop(0.5, 'rgba(255, 193, 7, 0.2)');
        glowGradient.addColorStop(1, 'rgba(255, 152, 0, 0)');
        
        ctx.beginPath();
        ctx.arc(0, pearlY, currentPearlSize * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = glowGradient;
        ctx.fill();
        
        const pearlGradient = ctx.createRadialGradient(
            -currentPearlSize * 0.3, pearlY - currentPearlSize * 0.3, 0,
            0, pearlY, currentPearlSize
        );
        pearlGradient.addColorStop(0, '#FFFFFF');
        pearlGradient.addColorStop(0.2, '#FFF8E7');
        pearlGradient.addColorStop(0.5, '#FFE4B5');
        pearlGradient.addColorStop(0.8, '#FFD700');
        pearlGradient.addColorStop(1, '#DAA520');
        
        ctx.beginPath();
        ctx.arc(0, pearlY, currentPearlSize, 0, Math.PI * 2);
        ctx.fillStyle = pearlGradient;
        ctx.fill();
        ctx.strokeStyle = 'rgba(218, 165, 32, 0.5)';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(
            -currentPearlSize * 0.3, pearlY - currentPearlSize * 0.3,
            currentPearlSize * 0.25, 0, Math.PI * 2
        );
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(
            currentPearlSize * 0.2, pearlY + currentPearlSize * 0.15,
            currentPearlSize * 0.1, 0, Math.PI * 2
        );
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.fill();
    }

    renderWarning(ctx) {
        const pulseAlpha = 0.3 + Math.sin(this.warningPulsePhase) * 0.3;
        
        const warningGradient = ctx.createRadialGradient(
            0, 0, 0,
            0, 0, this.trapRadius
        );
        warningGradient.addColorStop(0, `rgba(255, 87, 34, ${pulseAlpha * 0.3})`);
        warningGradient.addColorStop(0.7, `rgba(255, 87, 34, ${pulseAlpha * 0.15})`);
        warningGradient.addColorStop(1, 'rgba(255, 87, 34, 0)');
        
        ctx.beginPath();
        ctx.arc(0, 0, this.trapRadius, 0, Math.PI * 2);
        ctx.fillStyle = warningGradient;
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(0, 0, this.trapRadius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 87, 34, ${pulseAlpha})`;
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.stroke();
        ctx.setLineDash([]);
        
        const exclamationScale = 1 + Math.sin(this.warningExclamationPhase * 3) * 0.15;
        const exclamationY = -this.size * 0.8;
        
        ctx.save();
        ctx.translate(0, exclamationY);
        ctx.scale(exclamationScale, exclamationScale);
        
        const exclamationGradient = ctx.createLinearGradient(0, -15, 0, 15);
        exclamationGradient.addColorStop(0, '#FFEB3B');
        exclamationGradient.addColorStop(0.5, '#FFC107');
        exclamationGradient.addColorStop(1, '#FF9800');
        
        ctx.beginPath();
        ctx.moveTo(-8, -10);
        ctx.lineTo(8, -10);
        ctx.lineTo(5, 5);
        ctx.lineTo(-5, 5);
        ctx.closePath();
        ctx.fillStyle = exclamationGradient;
        ctx.fill();
        ctx.strokeStyle = '#E65100';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(0, 10, 3, 0, Math.PI * 2);
        ctx.fillStyle = exclamationGradient;
        ctx.fill();
        ctx.stroke();
        
        ctx.restore();
    }
};

window.PearlClamManager = class PearlClamManager {
    constructor(game) {
        this.game = game;
        this.clams = [];
        this.isEnabled = window.CONFIG.pearlClam.enabled;
        this.timeUntilNextClam = this.getRandomInterval();
        this.maxClams = window.CONFIG.pearlClam.maxClams;
    }

    getRandomInterval() {
        const { minInterval, maxInterval } = window.CONFIG.pearlClam;
        return minInterval + Math.random() * (maxInterval - minInterval);
    }

    clear() {
        this.clams = [];
        this.timeUntilNextClam = this.getRandomInterval();
    }

    spawnClam() {
        if (this.clams.length >= this.maxClams) return;
        
        const margin = window.CONFIG.pearlClam.clamSize * 1.5;
        const x = margin + Math.random() * (window.CONFIG.canvasWidth - margin * 2);
        const y = window.CONFIG.canvasHeight * 0.75 + Math.random() * (window.CONFIG.canvasHeight * 0.2);
        
        const tooClose = this.clams.some(clam => {
            const dx = clam.x - x;
            const dy = clam.y - y;
            return Math.sqrt(dx * dx + dy * dy) < window.CONFIG.pearlClam.clamSize * 3;
        });
        
        if (!tooClose) {
            this.clams.push(new window.PearlClam(x, y));
            console.log('Pearl clam spawned at:', x, y);
        }
    }

    update(deltaTime) {
        if (!this.isEnabled || !window.GameStatus.isPlaying()) return;
        
        const deltaMs = deltaTime * 1000;
        
        this.timeUntilNextClam -= deltaMs;
        if (this.timeUntilNextClam <= 0) {
            this.spawnClam();
            this.timeUntilNextClam = this.getRandomInterval();
        }
        
        for (let i = this.clams.length - 1; i >= 0; i--) {
            const clam = this.clams[i];
            clam.update(deltaTime);
            
            if (clam.isDead()) {
                this.clams.splice(i, 1);
            }
        }
    }

    checkPearlCollection(player) {
        if (!player) return 0;
        
        let totalPearls = 0;
        
        for (const clam of this.clams) {
            if (clam.canCollectPearl(player.x, player.y, player.getEffectiveSize())) {
                const pearls = clam.collectPearl();
                if (pearls > 0) {
                    totalPearls += pearls;
                    
                    if (this.game && this.game.particleSystem) {
                        this.game.particleSystem.createPearlCollectEffect(clam.pearlWorldX, clam.pearlWorldY);
                    }
                    
                    window.NotificationManager.show('💎 获得珍珠！', `+${pearls} 珍珠`, 1500);
                }
            }
        }
        
        return totalPearls;
    }

    checkTrapCollision(player) {
        if (!player) return false;
        
        for (const clam of this.clams) {
            if (clam.state === window.PearlClamState.CLOSING && !clam.hasTrappedPlayer) {
                if (clam.isInTrapRange(player.x, player.y, player.getEffectiveSize())) {
                    clam.hasTrappedPlayer = true;
                    return true;
                }
            }
        }
        
        return false;
    }

    render(ctx) {
        this.clams.forEach(clam => clam.render(ctx));
    }
};
