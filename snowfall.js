// Interactive Snowfall with Parallax Effect
class Snowfall {
    constructor() {
        this.canvas = document.getElementById('snowfall');
        this.ctx = this.canvas.getContext('2d');
        this.snowflakes = [];
        this.snowflakeImage = new Image();
        this.snowflakeImage.src = 'SNECHINKA.svg';
        this.mouseX = 0;
        this.mouseY = 0;
        this.isMouseMoving = false;
        this.mouseTimeout = null;

        this.init();
    }

    init() {
        this.resize();
        window.addEventListener('resize', () => this.resize());

        // Mouse interaction
        document.addEventListener('mousemove', (e) => {
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;
            this.isMouseMoving = true;

            clearTimeout(this.mouseTimeout);
            this.mouseTimeout = setTimeout(() => {
                this.isMouseMoving = false;
            }, 100);
        });

        // Touch support for mobile
        document.addEventListener('touchmove', (e) => {
            this.mouseX = e.touches[0].clientX;
            this.mouseY = e.touches[0].clientY;
            this.isMouseMoving = true;

            clearTimeout(this.mouseTimeout);
            this.mouseTimeout = setTimeout(() => {
                this.isMouseMoving = false;
            }, 100);
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
        const count = Math.floor((window.innerWidth * window.innerHeight) / 8000);
        this.snowflakes = [];

        for (let i = 0; i < Math.min(count, 80); i++) {
            this.snowflakes.push(this.createSnowflake());
        }
    }

    createSnowflake() {
        // Random layer (0 = far/slow, 2 = close/fast)
        const layer = Math.floor(Math.random() * 3);
        const baseSize = 15 + layer * 15; // 15, 30, 45

        return {
            x: Math.random() * this.canvas.width,
            y: Math.random() * this.canvas.height - this.canvas.height,
            size: baseSize + Math.random() * 15,
            speed: 0.5 + layer * 0.5 + Math.random() * 0.5, // Speed based on layer
            layer: layer,
            opacity: 0.3 + layer * 0.25, // Closer = more opaque
            rotation: Math.random() * 360,
            rotationSpeed: (Math.random() - 0.5) * 2,
            wobble: Math.random() * Math.PI * 2,
            wobbleSpeed: 0.02 + Math.random() * 0.02,
            wobbleAmount: 0.5 + Math.random() * 1
        };
    }

    update() {
        this.snowflakes.forEach((flake, index) => {
            // Vertical movement
            flake.y += flake.speed;

            // Horizontal wobble
            flake.wobble += flake.wobbleSpeed;
            flake.x += Math.sin(flake.wobble) * flake.wobbleAmount;

            // Rotation
            flake.rotation += flake.rotationSpeed;

            // Mouse interaction - snowflakes repel from cursor
            if (this.isMouseMoving) {
                const dx = flake.x - this.mouseX;
                const dy = flake.y - this.mouseY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const repelRadius = 150;

                if (distance < repelRadius) {
                    const force = (repelRadius - distance) / repelRadius;
                    const angle = Math.atan2(dy, dx);
                    flake.x += Math.cos(angle) * force * 3 * (flake.layer + 1);
                    flake.y += Math.sin(angle) * force * 2 * (flake.layer + 1);
                }
            }

            // Reset when out of screen
            if (flake.y > this.canvas.height + flake.size) {
                this.snowflakes[index] = this.createSnowflake();
                this.snowflakes[index].y = -this.snowflakes[index].size;
            }

            // Wrap horizontally
            if (flake.x < -flake.size) {
                flake.x = this.canvas.width + flake.size;
            } else if (flake.x > this.canvas.width + flake.size) {
                flake.x = -flake.size;
            }
        });
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Sort by layer for proper depth rendering
        const sortedFlakes = [...this.snowflakes].sort((a, b) => a.layer - b.layer);

        sortedFlakes.forEach(flake => {
            this.ctx.save();
            this.ctx.translate(flake.x, flake.y);
            this.ctx.rotate(flake.rotation * Math.PI / 180);
            this.ctx.globalAlpha = flake.opacity;

            // Add glow effect only for the closest snowflakes and reducing cost
            // Optimization: Shadow blur is expensive. Reduce frequency/radius.
            if (flake.layer === 2) {
                this.ctx.shadowColor = 'rgba(100, 200, 255, 0.5)';
                this.ctx.shadowBlur = 10;
            } else {
                this.ctx.shadowBlur = 0;
                this.ctx.shadowColor = 'transparent';
            }

            if (this.snowflakeImage.complete && this.snowflakeImage.naturalWidth > 0) {
                // Draw SVG snowflake
                this.ctx.drawImage(
                    this.snowflakeImage,
                    -flake.size / 2,
                    -flake.size / 2,
                    flake.size,
                    flake.size
                );
            } else {
                // Fallback: draw simple snowflake
                this.drawFallbackSnowflake(flake.size);
            }

            this.ctx.restore();
        });
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
        this.update();
        this.draw();
        requestAnimationFrame(() => this.animate());
    }
}

// Initialize snowfall when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new Snowfall();
});
