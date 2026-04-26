window.Powerup = class Powerup {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.size = 20;
        this.lifetime = 15000;
        this.pulsePhase = 0;
        this.floatPhase = Math.random() * Math.PI * 2;
    }

    update(deltaTime) {
        this.lifetime -= deltaTime * 1000;
        this.pulsePhase += 0.1;
        this.floatPhase += 0.03;
    }

    render(ctx) {
        const pulse = 1 + Math.sin(this.pulsePhase) * 0.15;
        const float = Math.sin(this.floatPhase) * 5;

        ctx.save();
        ctx.translate(this.x, this.y + float);

        if (this.type === 'speed') {
            const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.size * pulse);
            gradient.addColorStop(0, 'rgba(255, 215, 0, 0.8)');
            gradient.addColorStop(0.6, 'rgba(255, 193, 7, 0.5)');
            gradient.addColorStop(1, 'rgba(255, 152, 0, 0.2)');

            ctx.beginPath();
            ctx.arc(0, 0, this.size * pulse, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();

            ctx.font = `bold ${this.size}px Arial`;
            ctx.fillStyle = '#fff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('⚡', 0, 0);

        } else {
            const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.size * pulse);
            gradient.addColorStop(0, 'rgba(100, 181, 246, 0.8)');
            gradient.addColorStop(0.6, 'rgba(33, 150, 243, 0.5)');
            gradient.addColorStop(1, 'rgba(13, 71, 161, 0.2)');

            ctx.beginPath();
            ctx.arc(0, 0, this.size * pulse, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();

            ctx.font = `bold ${this.size}px Arial`;
            ctx.fillStyle = '#fff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🛡️', 0, 0);
        }

        ctx.beginPath();
        ctx.arc(-this.size * 0.3 * pulse, -this.size * 0.3 * pulse, this.size * 0.2 * pulse, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.fill();

        ctx.restore();
    }
};

window.Particle = class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = 3 + Math.random() * 5;
        this.vx = (Math.random() - 0.5) * 8;
        this.vy = (Math.random() - 0.5) * 8;
        this.lifetime = 500 + Math.random() * 500;
        this.maxLifetime = this.lifetime;
    }

    update(deltaTime) {
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= 0.95;
        this.vy *= 0.95;
        this.lifetime -= deltaTime * 1000;
    }

    render(ctx) {
        const alpha = this.lifetime / this.maxLifetime;
        const currentSize = this.size * alpha;

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, currentSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
};

window.ParticleSystem = class ParticleSystem {
    constructor() {
        this.particles = [];
    }

    createParticles(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            this.particles.push(new window.Particle(x, y, color));
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
