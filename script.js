/**
 * Sathish Sivakumar - Engineering Portfolio Script
 * Features:
 *  - Lenis Smooth Inertia Scrolling
 *  - Interactive Three.js 3D WebGL Background Scene & Holographic Polyhedra
 *  - 3D Card Tilt with Specular Lighting & Glare Reflection
 *  - Scroll-Linked 3D Depth & Camera Parallax
 *  - Top 3D Glowing Scroll Progress Indicator
 *  - Project Category Filtering & IntersectionObserver Reveals
 */

document.addEventListener('DOMContentLoaded', () => {
  // ==========================================================================
  // 0. AMBIENT BACKGROUND VIDEOS (Top & Bottom Scroll Crossfade)
  // ==========================================================================
  const bgVideo = document.getElementById('bgVideo');
  const bgVideoBottom = document.getElementById('bgVideoBottom');

  [bgVideo, bgVideoBottom].forEach(video => {
    if (!video) return;
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        const resumeVideo = () => {
          video.play().catch(() => {});
          window.removeEventListener('touchstart', resumeVideo);
          window.removeEventListener('click', resumeVideo);
        };
        window.addEventListener('touchstart', resumeVideo, { passive: true });
        window.addEventListener('click', resumeVideo, { passive: true });
      });
    }
  });

  document.addEventListener('visibilitychange', () => {
    [bgVideo, bgVideoBottom].forEach(video => {
      if (!video) return;
      if (document.hidden) {
        video.pause();
      } else {
        video.play().catch(() => {});
      }
    });
  });

  // ==========================================================================
  // 1. LENIS SMOOTH INERTIA SCROLLING
  // ==========================================================================
  let lenis = null;
  const progressBar = document.getElementById('scrollProgressBar');
  const navbar = document.getElementById('navbar');

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (typeof Lenis !== 'undefined' && !prefersReducedMotion) {
    try {
      lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: 'vertical',
        gestureOrientation: 'vertical',
        smoothWheel: true,
        wheelMultiplier: 1.0,
        touchMultiplier: 1.2,
        infinite: false,
      });

      function lenisRaf(time) {
        lenis.raf(time);
        requestAnimationFrame(lenisRaf);
      }
      requestAnimationFrame(lenisRaf);
    } catch (e) {
      console.warn('Lenis initialization skipped:', e);
    }
  }

  // Handle scroll events (via Lenis if available, or native window scroll)
  function handleScrollUpdate(scroll, progress) {
    // 1. Top Glowing Scroll Progress Bar
    if (progressBar) {
      progressBar.style.width = `${Math.min(100, Math.max(0, progress * 100))}%`;
    }

    // 2. Navbar glass effect on scroll
    if (navbar) {
      if (scroll > 40) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    }

    // 3. Dynamic Video Crossfade: Top video fades to Bottom video as user scrolls
    if (bgVideo && bgVideoBottom) {
      const fadeStart = 0.35;
      const fadeEnd = 0.82;
      let bottomWeight = 0;
      if (progress >= fadeEnd) {
        bottomWeight = 1;
      } else if (progress <= fadeStart) {
        bottomWeight = 0;
      } else {
        bottomWeight = (progress - fadeStart) / (fadeEnd - fadeStart);
      }

      const topOpacity = 0.38 * (1 - bottomWeight);
      const bottomOpacity = 0.42 * bottomWeight;

      bgVideo.style.opacity = topOpacity.toFixed(3);
      bgVideoBottom.style.opacity = bottomOpacity.toFixed(3);
    }

    // 4. Update WebGL 3D scene scroll state
    if (window.updateWebGLScroll) {
      window.updateWebGLScroll(scroll, progress);
    }
  }

  if (lenis) {
    lenis.on('scroll', ({ scroll, progress }) => {
      handleScrollUpdate(scroll, progress);
    });
  } else {
    window.addEventListener('scroll', () => {
      const scroll = window.scrollY || window.pageYOffset;
      const maxScroll = (document.documentElement.scrollHeight - window.innerHeight) || 1;
      const progress = scroll / maxScroll;
      handleScrollUpdate(scroll, progress);
    }, { passive: true });
  }

  // ==========================================================================
  // 2. NAVIGATION & SMOOTH ANCHOR SCROLLING
  // ==========================================================================
  const menuBtn = document.getElementById('menuBtn');

  if (menuBtn && navbar) {
    menuBtn.addEventListener('click', () => {
      navbar.classList.toggle('open');
    });
  }

  // Close mobile nav when clicking a nav link
  document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
      if (navbar) navbar.classList.remove('open');
    });
  });

  // Smooth scrolling for internal anchors
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#' || !targetId) return;

      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        e.preventDefault();
        if (lenis) {
          lenis.scrollTo(targetElement, {
            offset: -80,
            duration: 1.2
          });
        } else {
          const headerOffset = 80;
          const elementPosition = targetElement.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }
      }
    });
  });

  // Back to top button
  const backToTopBtn = document.querySelector('.footer-back-top');
  if (backToTopBtn) {
    backToTopBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (lenis) {
        lenis.scrollTo(0, { duration: 1.4 });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }

  // ==========================================================================
  // 3. PROJECT CATEGORY FILTERING
  // ==========================================================================
  const filterButtons = document.querySelectorAll('.filter-btn');
  const projectCards = document.querySelectorAll('.project-card');

  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      filterButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');

      const filterValue = button.getAttribute('data-filter');

      projectCards.forEach(card => {
        const cardCategory = card.getAttribute('data-category');

        if (filterValue === 'all' || cardCategory === filterValue) {
          card.style.display = 'flex';
          setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
          }, 50);
        } else {
          card.style.opacity = '0';
          card.style.transform = 'translateY(15px)';
          setTimeout(() => {
            card.style.display = 'none';
          }, 250);
        }
      });
    });
  });

  // ==========================================================================
  // 4. SCROLL REVEAL (IntersectionObserver)
  // ==========================================================================
  const observerOptions = {
    threshold: 0.08,
    rootMargin: '0px 0px -50px 0px'
  };

  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('show');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  document.querySelectorAll('.reveal').forEach(element => {
    revealObserver.observe(element);
  });

  // ==========================================================================
  // 5. INTERACTIVE 3D CARD TILT & SPECULAR GLARE
  // ==========================================================================
  const isTouchDevice = !window.matchMedia('(hover: hover)').matches;

  if (!isTouchDevice && !prefersReducedMotion) {
    const tiltCardSelectors = [
      '.project-card',
      '.skill-card',
      '.profile-hero-card',
      '.ai-code-console',
      '.timeline-card',
      '.pingzo-tier-card',
      '.contact-card',
      '.about-card',
      '.metric-card'
    ];

    const cardsToTilt = document.querySelectorAll(tiltCardSelectors.join(', '));

    cardsToTilt.forEach(card => {
      // Create glare overlay element inside card if not present
      let glare = card.querySelector('.card-3d-glare');
      if (!glare) {
        glare = document.createElement('div');
        glare.className = 'card-3d-glare';
        card.appendChild(glare);
      }

      let bounds = null;

      card.addEventListener('mouseenter', () => {
        bounds = card.getBoundingClientRect();
      });

      card.addEventListener('mousemove', (e) => {
        if (!bounds) bounds = card.getBoundingClientRect();

        const mouseX = e.clientX - bounds.left;
        const mouseY = e.clientY - bounds.top;

        const normX = (mouseX / bounds.width) - 0.5;
        const normY = (mouseY / bounds.height) - 0.5;

        // Moderate tilt angle for sleek luxury feel
        const maxTilt = 10;
        const tiltX = -normY * maxTilt;
        const tiltY = normX * maxTilt;

        card.style.transform = `perspective(1000px) rotateX(${tiltX.toFixed(2)}deg) rotateY(${tiltY.toFixed(2)}deg) translateZ(8px) translateY(-5px) scale3d(1.015, 1.015, 1.015)`;

        // Dynamic specular glare calculation
        const glareX = ((mouseX / bounds.width) * 100).toFixed(1);
        const glareY = ((mouseY / bounds.height) * 100).toFixed(1);

        glare.style.opacity = '0.7';
        glare.style.background = `radial-gradient(circle 220px at ${glareX}% ${glareY}%, rgba(255, 255, 255, 0.22) 0%, rgba(0, 242, 254, 0.12) 40%, transparent 80%)`;
      });

      card.addEventListener('mouseleave', () => {
        bounds = null;
        card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0) translateY(0) scale3d(1, 1, 1)';
        glare.style.opacity = '0';
      });
    });
  }

  // ==========================================================================
  // 6. THREE.JS 3D WEBGL INTERACTIVE UNIVERSE
  // ==========================================================================
  const webglCanvas = document.getElementById('webglCanvas');
  let webglActive = false;

  if (typeof THREE !== 'undefined' && webglCanvas) {
    try {
      // Scene, Camera, Renderer
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 1000);
      camera.position.set(0, 0, 24);

      const renderer = new THREE.WebGLRenderer({
        canvas: webglCanvas,
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance'
      });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      // Global lighting
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
      scene.add(ambientLight);

      const pointLightCyan = new THREE.PointLight(0x00f2fe, 3.2, 70);
      pointLightCyan.position.set(10, 8, 12);
      scene.add(pointLightCyan);

      const pointLightPurple = new THREE.PointLight(0x9d4edd, 3.5, 70);
      pointLightPurple.position.set(-10, -8, 10);
      scene.add(pointLightPurple);

      // Hero Focal 3D Cyber Complex
      const heroGroup = new THREE.Group();
      
      // Position hero group slightly to the right side on desktop, centered on mobile
      const updateHeroGroupPosition = () => {
        if (window.innerWidth > 1024) {
          heroGroup.position.set(6.2, 0.5, 1.5);
        } else {
          heroGroup.position.set(0, 1.2, -1.0);
        }
      };
      updateHeroGroupPosition();

      // Outer Wireframe Holographic Icosahedron
      const icosaGeo = new THREE.IcosahedronGeometry(3.5, 1);
      const icosaMat = new THREE.MeshStandardMaterial({
        color: 0x00f2fe,
        wireframe: true,
        transparent: true,
        opacity: 0.45,
        roughness: 0.2,
        metalness: 0.85
      });
      const icosaMesh = new THREE.Mesh(icosaGeo, icosaMat);
      heroGroup.add(icosaMesh);

      // Glowing Vertex Points
      const vertexGeo = new THREE.IcosahedronGeometry(3.5, 1);
      const vertexMat = new THREE.PointsMaterial({
        color: 0x00f2fe,
        size: 0.16,
        transparent: true,
        opacity: 0.85
      });
      const vertexPoints = new THREE.Points(vertexGeo, vertexMat);
      heroGroup.add(vertexPoints);

      // Inner Crystalline Core (Octahedron)
      const coreGeo = new THREE.OctahedronGeometry(1.9, 0);
      const coreMat = new THREE.MeshStandardMaterial({
        color: 0x9d4edd,
        emissive: 0x6366f1,
        emissiveIntensity: 0.65,
        roughness: 0.3,
        metalness: 0.9,
        flatShading: true
      });
      const coreMesh = new THREE.Mesh(coreGeo, coreMat);
      heroGroup.add(coreMesh);

      // Orbital Rings
      const ring1Geo = new THREE.TorusGeometry(4.7, 0.03, 16, 100);
      const ring1Mat = new THREE.MeshBasicMaterial({ color: 0x00f2fe, transparent: true, opacity: 0.4 });
      const ring1 = new THREE.Mesh(ring1Geo, ring1Mat);
      ring1.rotation.x = Math.PI / 3;
      heroGroup.add(ring1);

      const ring2Geo = new THREE.TorusGeometry(5.4, 0.025, 16, 100);
      const ring2Mat = new THREE.MeshBasicMaterial({ color: 0x9d4edd, transparent: true, opacity: 0.35 });
      const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
      ring2.rotation.y = Math.PI / 4;
      ring2.rotation.x = Math.PI / 6;
      heroGroup.add(ring2);

      scene.add(heroGroup);

      // Floating Satellite 3D Polyhedra (scattered across scroll depths)
      const satellites = [];
      const satelliteGeos = [
        new THREE.OctahedronGeometry(1.2, 0),
        new THREE.TetrahedronGeometry(1.4, 0),
        new THREE.BoxGeometry(1.4, 1.4, 1.4),
        new THREE.IcosahedronGeometry(1.1, 0),
        new THREE.DodecahedronGeometry(1.2, 0),
      ];

      const satelliteConfigs = [
        { x: -14, y: 4, z: -8, color: 0x3b82f6, rotSpeed: 0.012 },
        { x: 15, y: -12, z: -10, color: 0x9d4edd, rotSpeed: 0.009 },
        { x: -16, y: -28, z: -6, color: 0x00f2fe, rotSpeed: 0.015 },
        { x: 14, y: -45, z: -12, color: 0x6366f1, rotSpeed: 0.01 },
        { x: -13, y: -62, z: -8, color: 0x00f2fe, rotSpeed: 0.014 },
        { x: 15, y: -80, z: -10, color: 0x9d4edd, rotSpeed: 0.011 }
      ];

      satelliteConfigs.forEach((cfg, idx) => {
        const geo = satelliteGeos[idx % satelliteGeos.length];
        const mat = new THREE.MeshStandardMaterial({
          color: cfg.color,
          wireframe: true,
          transparent: true,
          opacity: 0.4,
          roughness: 0.3,
          metalness: 0.8
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(cfg.x, cfg.y, cfg.z);
        scene.add(mesh);
        satellites.push({
          mesh,
          baseY: cfg.y,
          rotSpeed: cfg.rotSpeed,
          seed: idx * 1.5
        });
      });

      // 3D Interactive Cyber Particle Galaxy
      const isMobile = window.innerWidth < 768;
      const particleCount = isMobile ? 600 : 1200;
      const particleGeo = new THREE.BufferGeometry();
      const posArray = new Float32Array(particleCount * 3);
      const colorArray = new Float32Array(particleCount * 3);

      const colorPalette = [
        new THREE.Color(0x00f2fe), // Cyan
        new THREE.Color(0x6366f1), // Indigo
        new THREE.Color(0x9d4edd), // Purple
        new THREE.Color(0x3b82f6)  // Blue
      ];

      for (let i = 0; i < particleCount; i++) {
        const idx3 = i * 3;
        posArray[idx3] = (Math.random() - 0.5) * 85;
        posArray[idx3 + 1] = (Math.random() - 0.5) * 200;
        posArray[idx3 + 2] = (Math.random() - 0.5) * 60;

        const pickedColor = colorPalette[Math.floor(Math.random() * colorPalette.length)];
        colorArray[idx3] = pickedColor.r;
        colorArray[idx3 + 1] = pickedColor.g;
        colorArray[idx3 + 2] = pickedColor.b;
      }

      particleGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
      particleGeo.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));

      const particleMat = new THREE.PointsMaterial({
        size: 0.18,
        vertexColors: true,
        transparent: true,
        opacity: 0.7,
        blending: THREE.AdditiveBlending
      });

      const particleSystem = new THREE.Points(particleGeo, particleMat);
      scene.add(particleSystem);

      // Mouse & Scroll State
      let mouseX = 0;
      let mouseY = 0;
      let targetMouseX = 0;
      let targetMouseY = 0;
      let scrollY = 0;
      let scrollProgress = 0;

      window.addEventListener('mousemove', (e) => {
        targetMouseX = (e.clientX / window.innerWidth - 0.5) * 2;
        targetMouseY = (e.clientY / window.innerHeight - 0.5) * 2;
      }, { passive: true });

      // Expose hook for scroll handler
      window.updateWebGLScroll = (scroll, progress) => {
        scrollY = scroll;
        scrollProgress = progress;
      };

      // Responsive Resize
      window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        updateHeroGroupPosition();
      });

      // Animation Loop with Tab Visibility Optimization
      let isTabVisible = true;
      document.addEventListener('visibilitychange', () => {
        isTabVisible = !document.hidden;
      });

      let clock = new THREE.Clock();

      function animateWebGL() {
        requestAnimationFrame(animateWebGL);
        if (!isTabVisible) return;

        const elapsedTime = clock.getElapsedTime();

        // Smooth mouse damping
        mouseX += (targetMouseX - mouseX) * 0.05;
        mouseY += (targetMouseY - mouseY) * 0.05;

        // Camera smoothly glides with scroll down through space + mouse tilt parallax
        const targetCamY = -mouseY * 1.5 - (scrollProgress * 45);
        const targetCamX = mouseX * 2.0;
        camera.position.x += (targetCamX - camera.position.x) * 0.05;
        camera.position.y += (targetCamY - camera.position.y) * 0.05;

        // Hero group rotation & response
        heroGroup.rotation.y = elapsedTime * 0.35 + (mouseX * 0.4);
        heroGroup.rotation.x = Math.sin(elapsedTime * 0.25) * 0.2 + (-mouseY * 0.4);
        coreMesh.rotation.y = -elapsedTime * 0.6;
        coreMesh.rotation.z = elapsedTime * 0.4;
        ring1.rotation.z = elapsedTime * 0.5;
        ring2.rotation.z = -elapsedTime * 0.45;

        // Animate floating satellites
        satellites.forEach(sat => {
          sat.mesh.rotation.x += sat.rotSpeed;
          sat.mesh.rotation.y += sat.rotSpeed * 1.2;
          sat.mesh.position.y = sat.baseY + Math.sin(elapsedTime * 0.8 + sat.seed) * 1.2;
        });

        // Subtle particle drift
        particleSystem.rotation.y = elapsedTime * 0.02;

        // Dynamic light movements
        pointLightCyan.position.x = Math.sin(elapsedTime * 0.7) * 14;
        pointLightCyan.position.y = Math.cos(elapsedTime * 0.5) * 10 - (scrollProgress * 40);

        pointLightPurple.position.x = -Math.sin(elapsedTime * 0.6) * 14;
        pointLightPurple.position.y = -Math.cos(elapsedTime * 0.4) * 10 - (scrollProgress * 40);

        renderer.render(scene, camera);
      }

      animateWebGL();
      webglActive = true;
    } catch (err) {
      console.warn('Three.js initialization error, falling back to 2D canvas:', err);
    }
  }

  // ==========================================================================
  // 7. 2D NEURAL CANVAS FALLBACK (Only runs if WebGL is inactive)
  // ==========================================================================
  const canvas = document.getElementById('neuralCanvas');
  if (canvas && !webglActive) {
    const ctx = canvas.getContext('2d');
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    let mouse = { x: null, y: null, radius: 140 };

    window.addEventListener('mousemove', (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    });

    window.addEventListener('mouseout', () => {
      mouse.x = null;
      mouse.y = null;
    });

    window.addEventListener('resize', () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initParticles();
    });

    const isMobile = window.innerWidth < 768;
    const particleCount = isMobile ? 35 : 75;
    let particles = [];

    const colors = [
      'rgba(0, 242, 254, ',
      'rgba(99, 102, 241, ',
      'rgba(157, 78, 221, ',
      'rgba(59, 130, 246, '
    ];

    class Particle {
      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.size = Math.random() * 2.2 + 0.8;
        this.baseColor = colors[Math.floor(Math.random() * colors.length)];
        this.vx = (Math.random() - 0.5) * 0.65;
        this.vy = (Math.random() - 0.5) * 0.65;
        this.alpha = Math.random() * 0.55 + 0.2;
        this.pulseSpeed = Math.random() * 0.02 + 0.008;
        this.pulseDir = 1;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0) this.x = width;
        if (this.x > width) this.x = 0;
        if (this.y < 0) this.y = height;
        if (this.y > height) this.y = 0;

        this.alpha += this.pulseSpeed * this.pulseDir;
        if (this.alpha > 0.75 || this.alpha < 0.2) {
          this.pulseDir *= -1;
        }

        if (mouse.x !== null && mouse.y !== null) {
          const dx = mouse.x - this.x;
          const dy = mouse.y - this.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < mouse.radius) {
            const force = (mouse.radius - dist) / mouse.radius;
            this.x -= (dx / dist) * force * 1.5;
            this.y -= (dy / dist) * force * 1.5;
          }
        }
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.baseColor + this.alpha + ')';
        ctx.shadowBlur = 8;
        ctx.shadowColor = this.baseColor + '0.6)';
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    function initParticles() {
      particles = [];
      for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
      }
    }

    function connectParticles() {
      const maxDistance = isMobile ? 85 : 125;
      for (let a = 0; a < particles.length; a++) {
        for (let b = a + 1; b < particles.length; b++) {
          const dx = particles[a].x - particles[b].x;
          const dy = particles[a].y - particles[b].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxDistance) {
            const opacity = (1 - dist / maxDistance) * 0.22;
            ctx.strokeStyle = `rgba(0, 242, 254, ${opacity})`;
            ctx.lineWidth = 0.85;
            ctx.beginPath();
            ctx.moveTo(particles[a].x, particles[a].y);
            ctx.lineTo(particles[b].x, particles[b].y);
            ctx.stroke();
          }
        }
      }
    }

    initParticles();

    function animate2D() {
      ctx.clearRect(0, 0, width, height);
      particles.forEach(p => {
        p.update();
        p.draw();
      });
      connectParticles();
      requestAnimationFrame(animate2D);
    }

    animate2D();
  }
});