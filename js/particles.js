window.Powerup = class Powerup {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.size = 20;
        this.lifetime = 15000;
        this.pulsePhase = 0;
        this.floatPhase = Math.random() * Math.PI * 2;
        this.rotationPhase = 0;
    }

    update(deltaTime) {
        this.lifetime -= deltaTime * 1000;
        this.pulsePhase += 0.1;
        this.floatPhase += 0.03;
        this.rotationPhase += 0.02;
    }

    render(ctx) {
        const pulse = 1 + Math.sin(this.pulsePhase) * 0.15;
        const float = Math.sin(this.floatPhase) * 5;

        ctx.save();
        ctx.translate(this.x, this.y + float);
        ctx.rotate(Math.sin(this.rotationPhase) * 0.1);

        if (this.type === 'speed') {
            const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.size * pulse * 1.5);
            gradient.addColorStop(0, 'rgba(255, 215, 0, 0.8)');
            gradient.addColorStop(0.5, 'rgba(255, 193, 7, 0.4)');
            gradient.addColorStop(1, 'rgba(255, 152, 0, 0)');

            ctx.beginPath();
            ctx.arc(0, 0, this.size * pulse * 1.5, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();

            const coreGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.size * pulse);
            coreGradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
            coreGradient.addColorStop(0.6, 'rgba(255, 215, 0, 0.7)');
            coreGradient.addColorStop(1, 'rgba(255, 152, 0, 0.4)');

            ctx.beginPath();
            ctx.arc(0, 0, this.size * pulse, 0, Math.PI * 2);
            ctx.fillStyle = coreGradient;
            ctx.fill();

            ctx.strokeStyle = 'rgba(255, 215, 0, 0.6)';
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.font = `bold ${this.size * 1.2}px Arial`;
            ctx.fillStyle = '#fff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('⚡', 0, 0);

        } else {
            const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.size * pulse * 1.5);
            gradient.addColorStop(0, 'rgba(100, 181, 246, 0.8)');
            gradient.addColorStop(0.5, 'rgba(33, 150, 243, 0.4)');
            gradient.addColorStop(1, 'rgba(13, 71, 161, 0)');

            ctx.beginPath();
            ctx.arc(0, 0, this.size * pulse * 1.5, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();

            const coreGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.size * pulse);
            coreGradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
            coreGradient.addColorStop(0.6, 'rgba(100, 181, 246, 0.7)');
            coreGradient.addColorStop(1, 'rgba(33, 150, 243, 0.4)');

            ctx.beginPath();
            ctx.arc(0, 0, this.size * pulse, 0, Math.PI * 2);
            ctx.fillStyle = coreGradient;
            ctx.fill();

            ctx.strokeStyle = 'rgba(100, 181, 246, 0.6)';
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.font = `bold ${this.size * 1.2}px Arial`;
            ctx.fillStyle = '#fff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🛡️', 0, 0);
        }

        ctx.beginPath();
        ctx.arc(-this.size * 0.3 * pulse, -this.size * 0.3 * pulse, this.size * 0.25 * pulse, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.fill();

        ctx.restore();
    }
};

window.Particle = class Particle {
    constructor(x, y, color, options = {}) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = options.size || (3 + Math.random() * 5);
        this.vx = options.vx || ((Math.random() - 0.5) * 8);
        this.vy = options.vy || ((Math.random() - 0.5) * 8);
        this.ax = options.ax || 0;
        this.ay = options.ay || 0;
        this.lifetime = options.lifetime || (500 + Math.random() * 500);
        this.maxLifetime = this.lifetime;
        this.type = options.type || 'circle';
        this.rotation = options.rotation || 0;
        this.rotationSpeed = options.rotationSpeed || ((Math.random() - 0.5) * 0.2);
        this.fadeIn = options.fadeIn || 0;
    }

    update(deltaTime) {
        this.vx += this.ax;
        this.vy += this.ay;
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= 0.98;
        this.vy *= 0.98;
        this.rotation += this.rotationSpeed;
        this.lifetime -= deltaTime * 1000;
    }

    render(ctx) {
        let alpha = this.lifetime / this.maxLifetime;
        
        if (this.fadeIn > 0) {
            const progress = 1 - (this.lifetime / this.maxLifetime);
            if (progress < this.fadeIn) {
                alpha *= progress / this.fadeIn;
            }
        }
        
        const currentSize = this.size * (0.5 + alpha * 0.5);

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        if (this.type === 'circle') {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(0, 0, currentSize, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.type === 'star') {
            this.drawStar(ctx, currentSize);
        } else if (this.type === 'text') {
            ctx.font = `bold ${currentSize * 2}px Arial`;
            ctx.fillStyle = this.color;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.text || '+', 0, 0);
        } else if (this.type === 'ring') {
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, currentSize, 0, Math.PI * 2);
            ctx.stroke();
        } else if (this.type === 'lightning') {
            this.drawLightning(ctx, currentSize);
        }
        
        ctx.restore();
    }

    drawStar(ctx, size) {
        const spikes = 5;
        const outerRadius = size;
        const innerRadius = size / 2;
        let rot = Math.PI / 2 * 3;
        const step = Math.PI / spikes;

        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(0, -outerRadius);
        
        for (let i = 0; i < spikes; i++) {
            ctx.lineTo(
                Math.cos(rot) * outerRadius,
                Math.sin(rot) * outerRadius
            );
            rot += step;
            ctx.lineTo(
                Math.cos(rot) * innerRadius,
                Math.sin(rot) * innerRadius
            );
            rot += step;
        }
        
        ctx.lineTo(0, -outerRadius);
        ctx.closePath();
        ctx.fill();
    }

    drawLightning(ctx, size) {
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        const segments = 6;
        const segmentSize = size / segments;
        let x = 0, y = -size;
        
        ctx.moveTo(x, y);
        
        for (let i = 0; i < segments; i++) {
            x += (Math.random() - 0.5) * segmentSize * 1.5;
            y += segmentSize;
            ctx.lineTo(x, y);
        }
        
        ctx.stroke();
    }
};

window.ParticleSystem = class ParticleSystem {
    constructor() {
        this.particles = [];
        this.maxParticles = 80;
    }

    createParticles(x, y, color, count) {
        const actualCount = Math.min(count, this.maxParticles - this.particles.length);
        if (actualCount <= 0) return;
        
        for (let i = 0; i < actualCount; i++) {
            this.particles.push(new window.Particle(x, y, color));
        }
    }

    createEatEffect(x, y, points) {
        for (let i = 0; i < 15; i++) {
            const angle = (Math.PI * 2 / 15) * i;
            const speed = 3 + Math.random() * 4;
            this.particles.push(new window.Particle(x, y, '#4caf50', {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 4 + Math.random() * 4,
                lifetime: 600 + Math.random() * 400
            }));
        }
        
        for (let i = 0; i < 8; i++) {
            this.particles.push(new window.Particle(x, y, '#ffd700', {
                type: 'star',
                vx: (Math.random() - 0.5) * 6,
                vy: -2 - Math.random() * 4,
                ay: 0.1,
                size: 5 + Math.random() * 5,
                lifetime: 800 + Math.random() * 400
            }));
        }
        
        this.createScorePopup(x, y, `+${points}`);
    }

    createScorePopup(x, y, text) {
        for (let i = 0; i < 1; i++) {
            this.particles.push(new window.Particle(x, y - 20, '#ffd700', {
                type: 'text',
                text: text,
                vx: (Math.random() - 0.5) * 2,
                vy: -2,
                size: 12,
                lifetime: 1000
            }));
        }
    }

    createShieldCollectEffect(x, y) {
        for (let i = 0; i < 20; i++) {
            const angle = (Math.PI * 2 / 20) * i;
            this.particles.push(new window.Particle(x, y, '#64b5f6', {
                vx: Math.cos(angle) * 5,
                vy: Math.sin(angle) * 5,
                ax: Math.cos(angle) * -0.1,
                ay: Math.sin(angle) * -0.1,
                size: 5 + Math.random() * 5,
                lifetime: 800 + Math.random() * 400
            }));
        }
        
        for (let i = 0; i < 3; i++) {
            const delay = i * 150;
            this.particles.push(new window.Particle(x, y, '#64b5f6', {
                type: 'ring',
                size: 20,
                vx: 0,
                vy: 0,
                lifetime: 600 + delay,
                fadeIn: 0.2
            }));
        }
    }

    createSpeedCollectEffect(x, y) {
        for (let i = 0; i < 25; i++) {
            this.particles.push(new window.Particle(x, y, '#ffd700', {
                type: 'lightning',
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                size: 8 + Math.random() * 8,
                lifetime: 400 + Math.random() * 300,
                rotationSpeed: (Math.random() - 0.5) * 0.3
            }));
        }
        
        for (let i = 0; i < 15; i++) {
            this.particles.push(new window.Particle(x, y, '#ff9800', {
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                size: 3 + Math.random() * 4,
                lifetime: 500 + Math.random() * 300
            }));
        }
    }

    createShieldBreakEffect(x, y) {
        for (let i = 0; i < 30; i++) {
            const angle = (Math.PI * 2 / 30) * i;
            const speed = 4 + Math.random() * 6;
            this.particles.push(new window.Particle(x, y, '#ff5722', {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 6 + Math.random() * 6,
                lifetime: 800 + Math.random() * 400
            }));
        }
        
        for (let i = 0; i < 20; i++) {
            this.particles.push(new window.Particle(x, y, '#ffeb3b', {
                type: 'star',
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                size: 5 + Math.random() * 5,
                lifetime: 600 + Math.random() * 400
            }));
        }
        
        for (let i = 0; i < 4; i++) {
            this.particles.push(new window.Particle(x, y, '#ff5722', {
                type: 'ring',
                size: 30 + i * 15,
                lifetime: 400 + i * 100,
                fadeIn: 0.1
            }));
        }
    }

    createStageUpEffect(x, y) {
        for (let i = 0; i < 40; i++) {
            const angle = (Math.PI * 2 / 40) * i;
            const speed = 3 + Math.random() * 5;
            this.particles.push(new window.Particle(x, y, '#ffd700', {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 5 + Math.random() * 6,
                lifetime: 1000 + Math.random() * 500
            }));
        }
        
        for (let i = 0; i < 25; i++) {
            this.particles.push(new window.Particle(x, y, '#e91e63', {
                type: 'star',
                vx: (Math.random() - 0.5) * 8,
                vy: -3 - Math.random() * 5,
                ay: 0.15,
                size: 6 + Math.random() * 6,
                lifetime: 1200 + Math.random() * 600
            }));
        }
        
        for (let i = 0; i < 20; i++) {
            this.particles.push(new window.Particle(x, y, '#9c27b0', {
                type: 'star',
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                size: 4 + Math.random() * 5,
                lifetime: 800 + Math.random() * 400
            }));
        }
    }

    update(deltaTime) {
        this.particles.forEach((particle, index) => {
            particle.update(deltaTime);
            if (particle.lifetime <= 0) {
                this.particles.splice(index, 1);
            }
        });
    }

    render(ctx) {
        this.particles.forEach(particle => particle.render(ctx));
    }

    clear() {
        this.particles = [];
    }
};
