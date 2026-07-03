/**
 * particles.js — High-Density Canvas Particle System with Perfect Logo Assembly
 */

const PARTICLE_COUNT = 4000; // Massively increased for a "perfect and clear" logo

// Default fallback colors (in case of random particles)
const FALLBACK_COLORS = [
  'rgba(15, 23, 42, 0.8)',
  'rgba(30, 58, 138, 0.7)',
  'rgba(37, 99, 235, 0.6)',
];

export class ParticleHero {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false }); // Optimize canvas
    this.particles = [];
    this.isRunning = true;
    this.dpr = Math.min(window.devicePixelRatio, 2);
    
    this.assemblyProgress = 0;
    this.animationStartTime = null;
    this.ASSEMBLY_DURATION = 1500; // 1.5 seconds to assemble (faster)

    this._resize();
    this._initParticles();
    this._bindEvents();
    this._animate();
  }

  _resize() {
    const parent = this.canvas.parentElement;
    const w = parent.offsetWidth;
    const h = parent.offsetHeight;
    this.canvas.width = w * this.dpr;
    this.canvas.height = h * this.dpr;
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';
    this.ctx.scale(this.dpr, this.dpr);
    this.width = w;
    this.height = h;

    if (this._logoImage) {
      this._computeLogoPositions(this._logoImage);
    }
  }

  _initParticles() {
    this.particles = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      this.particles.push({
        // Start randomly scattered
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        // Free drifting speed
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        size: 0.8 + Math.random() * 1.2, // Smaller particles for higher resolution
        color: FALLBACK_COLORS[Math.floor(Math.random() * FALLBACK_COLORS.length)],
        targetColor: null, // Will be sampled from the image
        targetX: this.width / 2, 
        targetY: this.height / 2,
      });
    }
  }

  _bindEvents() {
    window.addEventListener('resize', () => {
      this._resize();
    });
  }

  async loadLogo(imagePath) {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        this._logoImage = img;
        this._computeLogoPositions(img);
        // Start assembly animation after a 200ms delay (much shorter)
        this.animationStartTime = performance.now() + 200;
        resolve();
      };
      img.onerror = () => {
        console.warn('Failed to load logo for particles');
        this.animationStartTime = performance.now() + 200;
        resolve();
      };
      img.src = imagePath;
    });
  }

  _computeLogoPositions(img) {
    const sampleCanvas = document.createElement('canvas');
    // High resolution sampling canvas
    const sampleSize = 400;
    sampleCanvas.width = sampleSize;
    sampleCanvas.height = sampleSize;
    const sCtx = sampleCanvas.getContext('2d');

    // Draw logo centered
    const scale = Math.min(sampleSize / img.width, sampleSize / img.height) * 0.9;
    const w = img.width * scale;
    const h = img.height * scale;
    sCtx.drawImage(img, (sampleSize - w) / 2, (sampleSize - h) / 2, w, h);

    const imageData = sCtx.getImageData(0, 0, sampleSize, sampleSize);
    const validPixels = [];

    for (let y = 0; y < sampleSize; y++) {
      for (let x = 0; x < sampleSize; x++) {
        const idx = (y * sampleSize + x) * 4;
        const r = imageData.data[idx];
        const g = imageData.data[idx + 1];
        const b = imageData.data[idx + 2];
        const a = imageData.data[idx + 3];

        // Only take pixels that are solidly opaque and not pure white
        if (a > 150 && (r + g + b) < 700) {
          validPixels.push({ 
            x: x / sampleSize, 
            y: y / sampleSize,
            color: `rgba(${r}, ${g}, ${b}, ${a/255})`
          });
        }
      }
    }

    // Map to screen coordinates (bounded by both width and height to prevent overlapping text)
    const maxLogoSize = Math.min(this.width * 0.8, this.height * 0.6, 800);
    const logoWidth = maxLogoSize;
    const logoHeight = maxLogoSize;
    const offsetX = (this.width - logoWidth) / 2;
    const offsetY = (this.height - logoHeight) / 2 - 80; // Shifted up above text

    // We will shuffle valid pixels so particles map randomly across the logo
    // rather than top-to-bottom, which makes the assembly animation look better.
    for (let i = validPixels.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [validPixels[i], validPixels[j]] = [validPixels[j], validPixels[i]];
    }

    let pIndex = 0;
    for (let i = 0; i < this.particles.length; i++) {
      if (validPixels.length > 0) {
        // Distribute particles evenly across the valid pixels
        const pixel = validPixels[pIndex % validPixels.length];
        
        // Add tiny random noise so they don't perfectly stack on exactly the same grid point
        const noiseX = (Math.random() - 0.5) * 2;
        const noiseY = (Math.random() - 0.5) * 2;

        this.particles[i].targetX = offsetX + pixel.x * logoWidth + noiseX;
        this.particles[i].targetY = offsetY + pixel.y * logoHeight + noiseY;
        this.particles[i].targetColor = pixel.color;
        
        pIndex++;
      } else {
        this.particles[i].targetX = this.width / 2;
        this.particles[i].targetY = this.height / 2;
        this.particles[i].targetColor = FALLBACK_COLORS[0];
      }
    }
  }

  stop() {
    this.isRunning = false;
  }

  _animate(time) {
    if (!this.isRunning) return;
    requestAnimationFrame((t) => this._animate(t));

    const ctx = this.ctx;
    
    // Solid white background fill
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, this.width, this.height);

    if (this.animationStartTime) {
      const elapsed = time - this.animationStartTime;
      // Use Math.max(0, ...) to ensure it stays at 0 during the delay
      this.assemblyProgress = Math.max(0, Math.min(1, elapsed / this.ASSEMBLY_DURATION));
    }

    const t = this.assemblyProgress;
    // Cubic ease out for smooth assembly locking
    const eased = 1 - Math.pow(1 - t, 4);

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];

      // Free floating position
      const freeX = p.x + p.vx;
      const freeY = p.y + p.vy;

      // Wrap around for free floating
      p.x = freeX;
      p.y = freeY;
      if (p.x < -50) p.x = this.width + 50;
      if (p.x > this.width + 50) p.x = -50;
      if (p.y < -50) p.y = this.height + 50;
      if (p.y > this.height + 50) p.y = -50;

      // Lerp between free floating and exact pixel target
      const currentX = p.x + (p.targetX - p.x) * eased;
      const currentY = p.y + (p.targetY - p.y) * eased;

      // Transition color from scatter color to exact pixel color
      ctx.fillStyle = (eased > 0.5 && p.targetColor) ? p.targetColor : p.color;

      // Draw particle (no strokes or lines for max performance and clarity)
      ctx.beginPath();
      ctx.arc(currentX, currentY, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
