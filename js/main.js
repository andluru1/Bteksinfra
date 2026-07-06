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
      this._randomizeDesktopPanels();
      this._drawDesktopRoad();
      this._drawMobileRoad();
      this._initScrollAnimations();
    }, 600);

    // Handle resize
    window.addEventListener('resize', () => {
      this._drawDesktopRoad();
      this._drawMobileRoad();
    });
  }

  _randomizeDesktopPanels() {
    const isMobile = window.innerWidth <= 768;
    if (isMobile) return;
    
    const milestones = document.querySelectorAll('.milestone');
    milestones.forEach((m, i) => {
       const isRight = m.classList.contains('right');
       
       if (isRight) {
         // Scatter right panels by pushing them randomly out (50% to 65%)
         const randomLeft = 50 + Math.random() * 15;
         m.style.left = `${randomLeft}%`;
         // Adjust width so it doesn't overflow the container
         m.style.width = `${95 - randomLeft}%`;
       } else {
         // Scatter left panels by randomly changing their width (30% to 45%)
         const randomWidth = 30 + Math.random() * 15;
         m.style.width = `${randomWidth}%`;
       }
       
       // We removed the random vertical offset to prevent overlap.
       // The vertical top % is set mathematically in index.html to guarantee perfect spacing.
    });
  }

  _drawDesktopRoad() {
    const isMobile = window.innerWidth <= 768;
    if (isMobile) return;
    
    const svg = document.getElementById('desktop-svg');
    const container = document.querySelector('.circuit-container');
    const milestones = document.querySelectorAll('.milestone');
    const trackBg = document.getElementById('desktop-track-bg');
    const trackDashed = document.getElementById('desktop-track-dashed');
    const trackCover = document.getElementById('desktop-track-cover');
    
    if (!svg || !container || !milestones.length || !trackBg || !trackDashed || !trackCover) return;
    
    const containerRect = container.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const containerHeight = containerRect.height;
    
    svg.setAttribute('viewBox', `0 0 ${containerWidth} ${containerHeight}`);
    
    // Start road at top center
    let path = `M ${containerWidth/2},0 `;
    let prevX = containerWidth / 2;
    let prevY = 0;
    
    milestones.forEach((m, i) => {
       const dot = m.querySelector('.milestone-dot');
       const dotRect = dot.getBoundingClientRect();
       
       const x = dotRect.left - containerRect.left + (dotRect.width / 2);
       const y = dotRect.top - containerRect.top + (dotRect.height / 2);
       
       const controlY = prevY + (y - prevY) / 2;
       
       path += `C ${prevX},${controlY} ${x},${controlY} ${x},${y} `;
       
       prevX = x;
       prevY = y;
    });
    
    // Finish road
    path += `C ${prevX},${prevY + 100} ${containerWidth/2},${containerHeight - 100} ${containerWidth/2},${containerHeight}`;
    
    trackBg.setAttribute('d', path);
    trackDashed.setAttribute('d', path);
    trackCover.setAttribute('d', path);
  }

  _drawMobileRoad() {
    const isMobile = window.innerWidth <= 768;
    const svg = document.getElementById('mobile-svg');
    if (!svg) return;
    
    if (!isMobile) {
      svg.style.display = 'none';
      return;
    }
    
    svg.style.display = 'block';
    const container = document.querySelector('.circuit-container');
    const milestones = document.querySelectorAll('.milestone');
    const trackBg = document.getElementById('mobile-track-bg');
    const trackDashed = document.getElementById('mobile-track-dashed');
    const trackCover = document.getElementById('mobile-track-cover');
    
    if (!container || !milestones.length || !trackBg || !trackDashed || !trackCover) return;
    
    const containerHeight = container.offsetHeight;
    // Set viewBox height to match pixel height so Y coordinates are 1:1
    svg.setAttribute('viewBox', `0 0 400 ${containerHeight}`);
    
    // Start top center (X=200 is center of 400 viewBox)
    let path = `M 200,0 `;
    let prevY = 0;
    
    milestones.forEach((m, i) => {
       const dot = m.querySelector('.milestone-dot');
       // Calculate dot's exact Y position relative to container
       // dot.offsetTop is relative to milestone card if position relative, 
       // but here milestone is flex item, dot is position absolute. 
       // Better to use getBoundingClientRect
       const mRect = m.getBoundingClientRect();
       const cRect = container.getBoundingClientRect();
       const dotRect = dot.getBoundingClientRect();
       
       const y = dotRect.top - cRect.top + (dotRect.height / 2);
       
       // Calculate control points for an organic damping wave
       const controlY = prevY + (y - prevY) / 2;
       
       // Alternate left and right (tighter curve for mobile)
       // X=200 is center. Left=120, Right=280.
       const isEven = i % 2 === 0;
       // Damping effect: decreased curve size as requested
       const amplitude = isEven ? 120 : 280; 
       
       path += `C ${amplitude},${controlY} ${amplitude},${controlY} 200,${y} `;
       prevY = y;
    });
    
    path += `L 200,${containerHeight}`;
    
    trackBg.setAttribute('d', path);
    trackDashed.setAttribute('d', path);
    trackCover.setAttribute('d', path);
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
    const roadCover = document.getElementById('desktop-track-cover');
    if (roadCover) {
      const length = roadCover.getTotalLength();
      
      // Set up stroke-dasharray and stroke-dashoffset to fully cover the dashes initially
      roadCover.style.strokeDasharray = length;
      roadCover.style.strokeDashoffset = 0;
      
      gsap.to(roadCover, {
        strokeDashoffset: -length, // Pull back the cover to reveal dashes underneath
        ease: "none",
        scrollTrigger: {
          trigger: '#about',
          start: 'top 60%', // start drawing earlier when section enters viewport
          end: 'bottom bottom', // finish when #about hits bottom
          scrub: true
        }
      });
    }

    // 2b. Animate Mobile SVG Road
    const mobileRoadCover = document.getElementById('mobile-track-cover');
    if (mobileRoadCover) {
      const length = mobileRoadCover.getTotalLength();
      
      mobileRoadCover.style.strokeDasharray = length;
      mobileRoadCover.style.strokeDashoffset = 0;
      
      gsap.to(mobileRoadCover, {
        strokeDashoffset: -length,
        ease: "none",
        scrollTrigger: {
          trigger: '#about',
          start: 'top 60%', // start drawing earlier
          end: 'bottom bottom',
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

    // 4. Animate the Gallery SVG Line
    const galleryLine = document.getElementById('gallery-line');
    if (galleryLine) {
      const gLength = galleryLine.getTotalLength();
      
      galleryLine.style.strokeDasharray = gLength;
      galleryLine.style.strokeDashoffset = gLength;
      
      gsap.to(galleryLine, {
        strokeDashoffset: 0,
        ease: "none",
        scrollTrigger: {
          trigger: '#gallery',
          start: 'top top',
          end: 'bottom bottom',
          scrub: true
        }
      });
    }

    // 5. Animate the Gallery Items
    const galleryItems = document.querySelectorAll('.gallery-item');
    galleryItems.forEach((item) => {
      // Avoid animating x offset on mobile since we reset transform in CSS
      // GSAP reads computed style, but we can make it conditional or just standard
      const isMobile = window.innerWidth <= 768;
      const isRight = item.classList.contains('right');
      const xOffset = isMobile ? 0 : (isRight ? 100 : -100);
      const yOffset = isMobile ? 50 : 0;

      gsap.fromTo(item, 
        { 
          opacity: 0, 
          x: xOffset,
          y: yOffset,
          scale: 0.9
        },
        {
          opacity: 1,
          x: 0,
          y: 0,
          scale: 1,
          duration: 0.8,
          ease: "power2.out",
          scrollTrigger: {
            trigger: item,
            start: 'top 85%',
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
