// Interactive Snowfall with Parallax Effect - Optimized
class Snowfall {
    constructor() {
        this.canvas = document.getElementById('snowfall');
        this.ctx = this.canvas.getContext('2d', { alpha: true });
        this.snowflakes = [];
        this.snowflakesByLayer = [[], [], []]; // Pre-sorted by layer
        this.snowflakeImage = new Image();
        this.snowflakeImage.src = 'SNECHINKA.svg';
        this.mouseX = 0;
        this.mouseY = 0;
        this.isMouseMoving = false;
        this.mouseTimeout = null;
        this.animationId = null;
        this.isVisible = true;
        
        // Throttle resize
        this.resizeTimeout = null;

        this.init();
    }

    init() {
        this.resize();
        
        // Throttled resize handler
        window.addEventListener('resize', () => {
            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = setTimeout(() => this.resize(), 150);
        });

        // Mouse interaction with passive listener
        document.addEventListener('mousemove', (e) => {
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;
            this.isMouseMoving = true;

            clearTimeout(this.mouseTimeout);
            this.mouseTimeout = setTimeout(() => {
                this.isMouseMoving = false;
            }, 100);
        }, { passive: true });

        // Touch support for mobile with passive listener
        document.addEventListener('touchmove', (e) => {
            this.mouseX = e.touches[0].clientX;
            this.mouseY = e.touches[0].clientY;
            this.isMouseMoving = true;

            clearTimeout(this.mouseTimeout);
            this.mouseTimeout = setTimeout(() => {
                this.isMouseMoving = false;
            }, 100);
        }, { passive: true });

        // Visibility API - pause when tab is hidden
        document.addEventListener('visibilitychange', () => {
            this.isVisible = !document.hidden;
            if (this.isVisible && !this.animationId) {
                this.animate();
            }
        });

        // Wait for image to load
        this.snowflakeImage.onload = () => {
            this.createSnowflakes();
            this.animate();
        };

        // Fallback if image doesn't load
        setTimeout(() => {
            if (this.snowflakes.length === 0) {
                this.createSnowflakes();
                this.animate();
            }
        }, 1000);
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    createSnowflakes() {
        // Reduce count on mobile for better performance
        const isMobile = window.innerWidth < 768;
        const divisor = isMobile ? 12000 : 8000;
        const maxCount = isMobile ? 40 : 60;
        const count = Math.floor((window.innerWidth * window.innerHeight) / divisor);
        
        this.snowflakes = [];
        this.snowflakesByLayer = [[], [], []];

        for (let i = 0; i < Math.min(count, maxCount); i++) {
            const flake = this.createSnowflake();
            this.snowflakes.push(flake);
            this.snowflakesByLayer[flake.layer].push(flake);
        }
    }

    createSnowflake(layer = null) {
        // Random layer (0 = far/slow, 2 = close/fast)
        const flakeLayer = layer !== null ? layer : Math.floor(Math.random() * 3);
        const baseSize = 15 + flakeLayer * 15; // 15, 30, 45

        return {
            x: Math.random() * this.canvas.width,
            y: Math.random() * this.canvas.height - this.canvas.height,
            size: baseSize + Math.random() * 15,
            speed: 0.5 + flakeLayer * 0.5 + Math.random() * 0.5,
            layer: flakeLayer,
            opacity: 0.3 + flakeLayer * 0.25,
            rotation: Math.random() * 360,
            rotationSpeed: (Math.random() - 0.5) * 2,
            wobble: Math.random() * Math.PI * 2,
            wobbleSpeed: 0.02 + Math.random() * 0.02,
            wobbleAmount: 0.5 + Math.random() * 1
        };
    }

    update() {
        const canvasHeight = this.canvas.height;
        const canvasWidth = this.canvas.width;
        const mouseMoving = this.isMouseMoving;
        const mouseX = this.mouseX;
        const mouseY = this.mouseY;
        const repelRadiusSq = 150 * 150; // Pre-calculate squared radius

        for (let i = 0; i < this.snowflakes.length; i++) {
            const flake = this.snowflakes[i];
            
            // Vertical movement
            flake.y += flake.speed;

            // Horizontal wobble
            flake.wobble += flake.wobbleSpeed;
            flake.x += Math.sin(flake.wobble) * flake.wobbleAmount;

            // Rotation
            flake.rotation += flake.rotationSpeed;

            // Mouse interaction - use squared distance to avoid sqrt
            if (mouseMoving) {
                const dx = flake.x - mouseX;
                const dy = flake.y - mouseY;
                const distanceSq = dx * dx + dy * dy;

                if (distanceSq < repelRadiusSq && distanceSq > 0) {
                    const distance = Math.sqrt(distanceSq);
                    const force = (150 - distance) / 150;
                    const layerMult = flake.layer + 1;
                    flake.x += (dx / distance) * force * 3 * layerMult;
                    flake.y += (dy / distance) * force * 2 * layerMult;
                }
            }

            // Reset when out of screen
            if (flake.y > canvasHeight + flake.size) {
                const oldLayer = flake.layer;
                const newFlake = this.createSnowflake(oldLayer);
                newFlake.y = -newFlake.size;
                this.snowflakes[i] = newFlake;
                
                // Update layer array reference
                const layerArr = this.snowflakesByLayer[oldLayer];
                const idx = layerArr.indexOf(flake);
                if (idx > -1) layerArr[idx] = newFlake;
            }

            // Wrap horizontally
            if (flake.x < -flake.size) {
                flake.x = canvasWidth + flake.size;
            } else if (flake.x > canvasWidth + flake.size) {
                flake.x = -flake.size;
            }
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const hasImage = this.snowflakeImage.complete && this.snowflakeImage.naturalWidth > 0;
        const ctx = this.ctx;
        const img = this.snowflakeImage;
        const degToRad = Math.PI / 180;

        // Draw layers in order (already pre-sorted)
        for (let layer = 0; layer < 3; layer++) {
            const flakes = this.snowflakesByLayer[layer];
            
            for (let i = 0; i < flakes.length; i++) {
                const flake = flakes[i];
                const halfSize = flake.size / 2;
                
                ctx.save();
                ctx.translate(flake.x, flake.y);
                ctx.rotate(flake.rotation * degToRad);
                ctx.globalAlpha = flake.opacity;

                // Removed shadowBlur - too expensive, use CSS filter on canvas instead if needed

                if (hasImage) {
                    ctx.drawImage(img, -halfSize, -halfSize, flake.size, flake.size);
                } else {
                    this.drawFallbackSnowflake(flake.size);
                }

                ctx.restore();
            }
        }
    }

    drawFallbackSnowflake(size) {
        const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, size / 2);
        gradient.addColorStop(0, 'rgba(184, 255, 255, 1)');
        gradient.addColorStop(0.5, 'rgba(92, 212, 255, 0.8)');
        gradient.addColorStop(1, 'rgba(0, 169, 255, 0.3)');

        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();

        // Draw 6-pointed star
        for (let i = 0; i < 6; i++) {
            const angle = (i * 60) * Math.PI / 180;
            const x = Math.cos(angle) * size / 2;
            const y = Math.sin(angle) * size / 2;

            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }

            const innerAngle = ((i * 60) + 30) * Math.PI / 180;
            const innerX = Math.cos(innerAngle) * size / 4;
            const innerY = Math.sin(innerAngle) * size / 4;
            this.ctx.lineTo(innerX, innerY);
        }

        this.ctx.closePath();
        this.ctx.fill();
    }

    animate() {
        if (!this.isVisible) {
            this.animationId = null;
            return;
        }
        
        this.update();
        this.draw();
        this.animationId = requestAnimationFrame(() => this.animate());
    }
}

// Initialize snowfall when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new Snowfall();
});
