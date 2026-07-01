/**
 * main.js — Entry Point & Orchestrator
 * Coordinates the 2D particle hero and scroll animations
 */
import { ParticleHero } from './particles.js';

class App {
  constructor() {
    this.particleHero = null;
  }

  async init() {
    // 1. Initialize the 2D Canvas Particle System with Logo Assembly
    const heroCanvas = document.getElementById('hero-canvas');
    this.particleHero = new ParticleHero(heroCanvas);
    this.particleHero.loadLogo('BTeksInfra Final Logo-02.png');
    
    // Hide loading screen
    setTimeout(() => {
      this._hideLoading();
      this._initScrollAnimations();
    }, 600);
  }

  _initScrollAnimations() {
    // Register GSAP ScrollTrigger
    gsap.registerPlugin(ScrollTrigger);

    // 1. Parallax / Fade for Hero Content
    gsap.to('.hero-content', {
      scrollTrigger: {
        trigger: '#hero',
        start: 'top top',
        end: 'bottom top',
        scrub: true
      },
      y: 150,
      opacity: 0
    });

    // 2. Animate the SVG Road (Draw effect)
    const roadPath = document.getElementById('road-path');
    if (roadPath) {
      const length = roadPath.getTotalLength();
      
      // Set up stroke-dasharray and stroke-dashoffset
      roadPath.style.strokeDasharray = length;
      roadPath.style.strokeDashoffset = length;
      
      gsap.to(roadPath, {
        strokeDashoffset: 0,
        ease: "none",
        scrollTrigger: {
          trigger: '#about',
          start: 'top top', // start drawing when #about hits top of viewport
          end: 'bottom bottom', // finish when #about hits bottom
          scrub: true
        }
      });
    }

    // 3. Animate the Milestones
    const milestones = document.querySelectorAll('.milestone');
    milestones.forEach((milestone, i) => {
      // Alternate animation direction based on right/left class
      const isRight = milestone.classList.contains('right');
      const xOffset = isRight ? 100 : -100;

      gsap.fromTo(milestone, 
        { 
          opacity: 0, 
          x: xOffset,
          scale: 0.8
        },
        {
          opacity: 1,
          x: 0,
          scale: 1,
          duration: 0.8,
          ease: "power2.out",
          scrollTrigger: {
            trigger: milestone,
            start: 'top 80%', // trigger when milestone is 80% down the screen
            toggleActions: "play none none reverse"
          }
        }
      );
    });
  }

  _hideLoading() {
    const screen = document.getElementById('loading-screen');
    if (screen) {
      screen.style.opacity = 0;
      setTimeout(() => {
        screen.style.display = 'none';
      }, 500);
    }
  }
}

// Boot
const app = new App();
app.init().catch(err => {
  console.error('BTeksInfra Init Error:', err);
});
