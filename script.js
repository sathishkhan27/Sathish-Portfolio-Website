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
          video.play().catch(() => { });
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
        video.play().catch(() => { });
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

  // ==========================================================================
  // 10. PHONE NUMBER MASKING & REVEAL INTERACTION
  // ==========================================================================
  const phoneMaskBtn = document.getElementById('phoneMaskBtn');
  const phoneDisplay = document.getElementById('phoneDisplay');
  const phoneBadge = document.getElementById('phoneBadge');
  const phoneCopyBtn = document.getElementById('phoneCopyBtn');

  if (phoneMaskBtn && phoneDisplay && phoneBadge) {
    let isRevealed = false;
    const unmaskedNumber = phoneMaskBtn.getAttribute('data-unmasked') || '+91 97912 28131';
    const telNumber = phoneMaskBtn.getAttribute('data-tel') || '+919791228131';

    phoneMaskBtn.addEventListener('click', () => {
      if (!isRevealed) {
        // First click: unmask the phone number
        isRevealed = true;
        phoneDisplay.textContent = unmaskedNumber;
        phoneMaskBtn.classList.add('revealed');
        phoneBadge.innerHTML = `
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
          <span class="badge-text">Call ↗</span>
        `;
        phoneMaskBtn.setAttribute('title', 'Click to call ' + unmaskedNumber);
        if (phoneCopyBtn) {
          phoneCopyBtn.style.display = 'inline-flex';
        }
      } else {
        // Already revealed: trigger direct phone dial
        window.location.href = 'tel:' + telNumber;
      }
    });

    if (phoneCopyBtn) {
      phoneCopyBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        try {
          await navigator.clipboard.writeText(unmaskedNumber);
          const originalHTML = phoneCopyBtn.innerHTML;
          phoneCopyBtn.innerHTML = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#00f2fe" stroke-width="2.5" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>`;
          phoneCopyBtn.setAttribute('title', 'Copied to clipboard!');
          setTimeout(() => {
            phoneCopyBtn.innerHTML = originalHTML;
            phoneCopyBtn.setAttribute('title', 'Copy phone number');
          }, 2000);
        } catch (err) {
          window.location.href = 'tel:' + telNumber;
        }
      });
    }
  }

  // ==========================================================================
  // 11. INTERACTIVE AI ASSISTANT: SATHISH BOT (Floating Separate Screen)
  // ==========================================================================
  const floatingChatScreenWrapper = document.getElementById('floatingChatScreenWrapper');
  const floatingChatFab = document.getElementById('floatingChatFab');
  const fabChatIcon = document.getElementById('fabChatIcon');
  const fabCloseIcon = document.getElementById('fabCloseIcon');
  const floatChatMinimizeBtn = document.getElementById('floatChatMinimizeBtn');

  const floatChatHeaderForm = document.getElementById('floatChatHeaderForm');
  const floatHeaderInput = document.getElementById('floatHeaderInput');

  const floatChatStarterView = document.getElementById('floatChatStarterView');
  const floatChatThreadView = document.getElementById('floatChatThreadView');
  const floatChatMessages = document.getElementById('floatChatMessages');
  const floatChatBottomBar = document.getElementById('floatChatBottomBar');
  const floatBottomForm = document.getElementById('floatBottomForm');
  const floatBottomInput = document.getElementById('floatBottomInput');

  const floatChatBackBtn = document.getElementById('floatChatBackBtn');
  const floatChatResetBtn = document.getElementById('floatChatResetBtn');

  if (floatingChatScreenWrapper && floatingChatFab) {
    const BOT_NAME = 'Sathish';
    const BOT_AVATAR = 'assets/profile.jpg?v=2026';

    // Comprehensive Knowledge Base & Response Engine
    const KNOWLEDGE_RESPONSES = [
      {
        triggers: [
          'summary', 'about', 'who are you', 'who is sathish', 'introduce',
          'background', 'overview', 'profile', 'bio', 'tell me about yourself'
        ],
        response: `Hello! I'm <strong>Sathish Sivakumar</strong> — a <strong>Technical Lead, Full-Stack Developer &amp; Forward Deployed AI Engineer</strong> with over <strong>8+ years</strong> of engineering leadership based in Chennai, India.<br><br>
        • <strong>Current Roles:</strong> Lead Product Architect at <strong>PingZo Ecosystem</strong> &amp; Technical Lead at <strong>Impiger Technologies</strong> for the <strong>ABCD Super App (10M+ users)</strong>.<br>
        • <strong>Core Strengths:</strong> Cross-platform mobile (Flutter), modern web (React/Next.js), distributed microservices (Java Spring Boot/Python), and Agentic AI workflows.<br>
        • <strong>Leadership:</strong> Directing cross-functional squads, architectural reviews, CI/CD pipelines, and high-concurrency scaling.`,
        actions: [
          { text: '🚀 PingZo Ecosystem', query: 'Tell me about PingZo' },
          { text: '⚡ Core Tech Stack', query: 'What is your tech stack?' },
          { text: '📫 Contact Sathish', query: 'How can I contact you?' }
        ]
      },
      {
        triggers: [
          'pingzo', 'ecosystem', 'proprietary', 'delivery app', 'customer app', 'admin portal', 'on-demand platform'
        ],
        response: `<strong>PingZo Enterprise</strong> is my proprietary 3-tier on-demand ordering &amp; logistics platform that I independently architected and delivered end-to-end:<br><br>
        1. <strong>Admin Enterprise Portal</strong> (Next.js / React / Cloud DB): Merchant catalog orchestration, automated order dispatching, dynamic analytics dashboards, and real-time inventory management.<br>
        2. <strong>Customer Ordering App</strong> (Flutter / Firebase): Interactive product catalog, smart search indexing, live geofenced telemetry, and seamless payment checkout.<br>
        3. <strong>Delivery Partner App</strong> (Flutter): Offline-resilient driver companion, turn-by-turn route optimization, and instant proof-of-delivery capture.`,
        actions: [
          { text: 'View PingZo Section', href: '#pingzo' },
          { text: '🏢 ABCD Super App', query: 'Tell me about ABCD Super App' }
        ]
      },
      {
        triggers: [
          'abcd', 'aditya birla', 'impiger', 'fintech', 'super app', 'superapp', '10m', '10 million', 'users'
        ],
        response: `At <strong>Impiger Technologies</strong> (10/2024 — Present), I serve as <strong>Technical Lead</strong> governing engineering squads for <strong>ABCD (Aditya Birla Capital Super App)</strong>:<br><br>
        • <strong>Scale:</strong> High-concurrency enterprise FinTech platform serving <strong>10 Million+ users</strong> across India.<br>
        • <strong>Stack:</strong> Flutter, React JS, Java Spring Boot, GCP microservices.<br>
        • <strong>Responsibilities:</strong> Architectural governance, biometric authentication, SSO integration, payment processing, performance tuning, and release velocity.`,
        actions: [
          { text: '💼 Career Experience', query: 'Tell me about your career history' },
          { text: '📫 Contact Sathish', query: 'How to contact Sathish' }
        ]
      },
      {
        triggers: [
          'skills', 'tech stack', 'technologies', 'tools', 'stack', 'languages', 'frameworks'
        ],
        response: `My core technical toolkit spans the entire enterprise stack:<br><br>
        • <strong>Mobile:</strong> Flutter, Dart, Native Android (Java/Kotlin), BLoC, Provider, Offline caching, Biometrics<br>
        • <strong>Frontend:</strong> React JS, Next.js, TypeScript, JavaScript (ES6+), HTML5/CSS3, Redux, Three.js/WebGL<br>
        • <strong>Backend &amp; Cloud:</strong> Java Spring Boot, Python, RESTful Microservices, Keycloak (SSO), GCP, Firebase, PostgreSQL, MongoDB, Redis, Docker, CI/CD<br>
        • <strong>AI &amp; GenAI:</strong> Conversational AI, Agentic Workflows, OpenAI, Gemini, Claude, Prompt Engineering, Antigravity`,
        actions: [
          { text: '📱 Flutter Experience', query: 'Tell me about your Flutter skills' },
          { text: '🌐 React & Web', query: 'Tell me about your React experience' },
          { text: '📄 Download Resume', href: 'assets/SATHISH_SIVAKUMAR_Resume.pdf' }
        ]
      },
      {
        triggers: [
          'flutter', 'dart', 'bloc', 'provider', 'android', 'ios', 'mobile'
        ],
        response: `I have <strong>extensive production experience in Flutter &amp; Mobile engineering</strong>:<br><br>
        • Architected and shipped <strong>ABCD (Aditya Birla Capital)</strong> serving 10M+ users with strict crash-free sessions (>99.5%).<br>
        • Built PingZo's <strong>Customer App</strong> and <strong>Delivery Partner App</strong> from scratch with BLoC state management and offline synchronization.<br>
        • Shipped 8+ commercial Flutter apps at Bhumaha Solutions including enterprise ERP, ticket booking, and healthcare companions.`,
        actions: [
          { text: '🚀 PingZo Ecosystem', query: 'Tell me about PingZo' },
          { text: '📄 View Verified Resume', href: 'assets/SATHISH_SIVAKUMAR_Resume.pdf' }
        ]
      },
      {
        triggers: [
          'react', 'next.js', 'nextjs', 'typescript', 'javascript', 'frontend', 'redux', 'three.js', 'webgl'
        ],
        response: `In <strong>Modern Frontend Architecture (React &amp; Next.js)</strong>:<br><br>
        • Architected the <strong>PingZo Enterprise Admin Portal</strong> with server-side rendering, real-time analytics dashboards, and modular state management.<br>
        • Deep expertise in React 18+, Next.js App Router, TypeScript, Redux Toolkit, Tailwind/Vanilla CSS, and WebGL/Three.js 3D animations.<br>
        • Focused on sub-second First Contentful Paint, accessible WCAG standards, and micro-frontend modularity.`,
        actions: [
          { text: '⚡ Core Tech Stack', query: 'What is your tech stack?' },
          { text: '📫 Hire Sathish', query: 'How to contact Sathish' }
        ]
      },
      {
        triggers: [
          'java', 'spring boot', 'springboot', 'microservices', 'backend', 'api', 'rest', 'postgres', 'postgresql', 'redis', 'docker', 'gcp', 'cloud'
        ],
        response: `On the <strong>Enterprise Backend &amp; Cloud Infrastructure</strong> front:<br><br>
        • Engineered distributed microservices with <strong>Java Spring Boot</strong> and <strong>Python</strong> handling high-concurrency workloads.<br>
        • Implemented enterprise security with <strong>Keycloak SSO</strong>, OAuth2, and RBAC authorization.<br>
        • Containerized microservices with Docker, hosted on Google Cloud Platform (GCP) and AWS with PostgreSQL and Redis caching.`,
        actions: [
          { text: '🏢 ABCD Super App', query: 'Tell me about ABCD Super App' },
          { text: '📫 Contact Sathish', query: 'How can I contact you?' }
        ]
      },
      {
        triggers: [
          'ai', 'forward', 'genai', 'agentic', 'agents', 'llm', 'copilot', 'antigravity', 'chatgpt', 'openai', 'gemini', 'claude', 'prompt engineering'
        ],
        response: `As a <strong>Forward Deployed AI Engineer</strong>, I bridge cutting-edge artificial intelligence with production enterprise software:<br><br>
        • <strong>Agentic Workflows:</strong> Orchestrating autonomous agents for automated test generation, code auditing, and deployment pipelines.<br>
        • <strong>Conversational Systems:</strong> Built <em>BizcomAI</em> for dynamic enterprise query processing (invoices, work orders, analytics) within interactive chat interfaces.<br>
        • <strong>LLM Integrations:</strong> Integrating OpenAI, Gemini, and Claude models into mobile and full-stack web applications with strict latency and privacy standards.`,
        actions: [
          { text: '🚀 View Projects', href: '#projects' },
          { text: '📫 Hire Sathish', query: 'Are you available for hire?' }
        ]
      },
      {
        triggers: [
          'experience', 'career', 'history', 'companies', 'timeline', 'bhumaha', 'tag info', 'years', 'background'
        ],
        response: `Here is a summary of my <strong>8+ years of engineering leadership</strong>:<br><br>
        • <strong>2024 — Present:</strong> Lead Product Architect &amp; Forward AI Engineer at <em>PingZo Ecosystem</em> (Tri-app on-demand platform)<br>
        • <strong>10/2024 — Present:</strong> Technical Lead at <em>Impiger Technologies</em> (Aditya Birla Capital ABCD Super App with 10M+ users)<br>
        • <strong>09/2020 — 10/2024:</strong> Senior Software Engineer at <em>Bhumaha Solutions</em> (Shipped 8+ apps: BizcomAI, TATA AIA Siddhi, Flowsoft, CIT94, Hiwelinked, Foodwall, Go4worldbusiness, TTS)<br>
        • <strong>08/2017 — 07/2020:</strong> Junior Software Engineer at <em>Tag Info Solutions</em> (Android apps: Teacher's Curriculum, Anderson Healthcare, Cobota ticket booking)`,
        actions: [
          { text: '📄 Download Resume', href: 'assets/SATHISH_SIVAKUMAR_Resume.pdf' },
          { text: '📫 Get in Touch', query: 'How to contact Sathish' }
        ]
      },
      {
        triggers: [
          'lead', 'leadership', 'architect', 'architecture', 'mentor', 'management', 'team', 'philosophy'
        ],
        response: `My engineering leadership approach centers on 3 fundamental pillars:<br><br>
        1. <strong>Outcome-Driven Delivery:</strong> Aligning product vision with engineering execution to ship resilient features on time without technical debt.<br>
        2. <strong>Architectural Rigor:</strong> Enforcing clean architecture, state management discipline, test automation, and security best practices.<br>
        3. <strong>Empowerment &amp; Mentorship:</strong> Guiding developers through code reviews, architectural pairing, and introducing AI tooling to accelerate team output.`,
        actions: [
          { text: '🏢 Enterprise Projects', href: '#projects' },
          { text: '📫 Discuss Opportunities', query: 'How to contact Sathish' }
        ]
      },
      {
        triggers: [
          'hire', 'contact', 'available', 'availability', 'email', 'phone', 'call', 'location',
          'joining', 'notice period', 'reach', 'interview', 'salary', 'chennai', 'remote'
        ],
        response: `I am based in <strong>Chennai, Tamil Nadu, India</strong> and have <strong>Immediate Availability</strong> for high-impact roles as <strong>Technical Lead</strong>, <strong>Full-Stack Developer</strong>, or <strong>Forward Deployed AI Engineer</strong>.<br><br>
        • <strong>Email:</strong> <a href="mailto:sathish.sivakumar2706@gmail.com">sathish.sivakumar2706@gmail.com</a><br>
        • <strong>Phone:</strong> +91 97912 28131 (click reveal in Contact section)<br>
        • <strong>LinkedIn:</strong> <a href="https://www.linkedin.com/in/sathish-sivakumar-99a462143/" target="_blank" rel="noreferrer">linkedin.com/in/sathish-sivakumar-99a462143</a><br>
        • <strong>GitHub:</strong> <a href="https://github.com/sathishkhan27/" target="_blank" rel="noreferrer">github.com/sathishkhan27</a>`,
        actions: [
          { text: '✉ Email Sathish Directly', href: 'mailto:sathish.sivakumar2706@gmail.com' },
          { text: '📄 Download Verified Resume', href: 'assets/SATHISH_SIVAKUMAR_Resume.pdf' }
        ]
      },
      {
        triggers: [
          'github', 'resume', 'cv', 'code', 'repository', 'repos', 'open source', 'download resume'
        ],
        response: `You can review my open-source code, architecture blueprints, and verified credentials:<br><br>
        • <strong>GitHub Profile:</strong> <a href="https://github.com/sathishkhan27/" target="_blank" rel="noreferrer">https://github.com/sathishkhan27/</a><br>
        • <strong>Official Resume (PDF):</strong> Comprehensive breakdown of my 8+ years experience, enterprise products, and tech stack.`,
        actions: [
          { text: '🐙 Open GitHub Profile', href: 'https://github.com/sathishkhan27/' },
          { text: '📄 Download Resume (PDF)', href: 'assets/SATHISH_SIVAKUMAR_Resume.pdf' }
        ]
      },
      {
        triggers: ['hi', 'hello', 'hey', 'greetings', 'good morning', 'good afternoon', 'good evening', 'howdy'],
        response: `Hi there! I'm <strong>Sathish</strong> — Sathish Sivakumar's AI persona. Great to meet you! How can I assist you with details about my engineering experience, projects, or technical leadership?`,
        actions: [
          { text: '👨‍💼 Executive Summary', query: 'Give me an executive summary' },
          { text: '🚀 PingZo Ecosystem', query: 'Tell me about PingZo' },
          { text: '📫 Contact & Availability', query: 'How can I contact you?' }
        ]
      },
      {
        triggers: ['how are you', 'how are you doing', 'hows it going', 'whats up', 'how do you do'],
        response: `I'm doing great, thank you for asking! 😊 I'm here and ready to answer any questions about software development, technical architecture, or Sathish's engineering journey and projects. How can I help you today?`,
        actions: [
          { text: '⚡ Core Tech Stack', query: 'What is your tech stack?' },
          { text: '🚀 PingZo Ecosystem', query: 'Tell me about PingZo' },
          { text: '📫 Contact Sathish', query: 'How to contact Sathish' }
        ]
      },
      {
        triggers: ['what can you do', 'help', 'what do you do', 'how can you help', 'commands', 'features'],
        response: `I can help you explore everything about Sathish Sivakumar's profile and software engineering topics:<br><br>
        • <strong>General Tech Explanations:</strong> Ask me about Flutter, React, Java Spring Boot, Microservices, Clean Architecture, or Docker.<br>
        • <strong>Flagship Products:</strong> Learn about <em>PingZo Enterprise</em> (Tri-app logistics platform) and the <em>Aditya Birla ABCD Super App</em> (10M+ users).<br>
        • <strong>Leadership &amp; Career:</strong> Review 8+ years of engineering leadership, team mentoring, and company history.<br>
        • <strong>Contact &amp; Hiring:</strong> Direct email, phone, location, and verified resume download.`,
        actions: [
          { text: '👨‍💼 Executive Summary', query: 'Give me an executive summary' },
          { text: '🚀 PingZo Ecosystem', query: 'Tell me about PingZo' },
          { text: '📫 Contact Sathish', query: 'How can I contact you?' }
        ]
      },
      {
        triggers: ['who made you', 'who created you', 'are you an ai', 'are you real', 'are you a robot', 'are you sathish'],
        response: `I am an interactive AI assistant persona representing <strong>Sathish Sivakumar</strong>. I was designed to answer questions about his professional background, software architecture expertise, and enterprise products in real time. Sathish is an active Technical Lead and Forward Deployed AI Engineer based in Chennai, India.`,
        actions: [
          { text: '👨‍💼 Learn About Sathish', query: 'Tell me about yourself' },
          { text: '🐙 View GitHub Profile', href: 'https://github.com/sathishkhan27/' },
          { text: '📫 Contact Sathish Directly', href: 'mailto:sathish.sivakumar2706@gmail.com' }
        ]
      },
      {
        triggers: ['what is flutter', 'explain flutter', 'define flutter'],
        response: `<strong>Flutter</strong> is an open-source UI software development kit created by Google. It allows developers to build natively compiled applications for mobile (iOS &amp; Android), web, and desktop from a single <strong>Dart</strong> codebase.<br><br>
        • <strong>Key Advantages:</strong> High-performance direct compilation to native ARM code, 60/120 FPS rendering via Impeller/Skia, and a rich reactive widget tree.<br>
        • <strong>Sathish's Experience:</strong> Shipped 10+ Flutter applications, including the 10M+ user Aditya Birla Capital Super App and PingZo's customer/delivery apps.`,
        actions: [
          { text: '📱 Sathish Flutter Experience', query: 'Tell me about your Flutter skills' },
          { text: '🏢 ABCD Super App', query: 'Tell me about ABCD Super App' }
        ]
      },
      {
        triggers: ['what is react', 'what is nextjs', 'what is next.js', 'explain react'],
        response: `<strong>React</strong> is a declarative, component-based JavaScript library maintained by Meta for building dynamic user interfaces with an efficient Virtual DOM.<br><br>
        <strong>Next.js</strong> extends React by providing enterprise-grade full-stack features: Server-Side Rendering (SSR), Static Site Generation (SSG), API routes, and optimized streaming.<br><br>
        In production, I leverage React and Next.js to architect high-throughput enterprise portals and real-time dashboards like the PingZo Enterprise Admin Portal.`,
        actions: [
          { text: '🌐 React Experience', query: 'Tell me about your React experience' },
          { text: '🚀 PingZo Admin Portal', query: 'Tell me about PingZo' }
        ]
      },
      {
        triggers: ['what is spring boot', 'what is springboot', 'explain spring boot'],
        response: `<strong>Spring Boot</strong> is an open-source, Java-based enterprise framework used to create stand-alone, production-grade RESTful microservices with minimal configuration.<br><br>
        • <strong>Key Features:</strong> Auto-configuration, embedded web servers (Tomcat/Jetty), comprehensive dependency injection, and seamless cloud integration.<br>
        • <strong>In Enterprise:</strong> Used heavily in high-concurrency FinTech backends, Keycloak SSO integrations, and distributed transactional services.`,
        actions: [
          { text: '⚡ Core Tech Stack', query: 'What is your tech stack?' },
          { text: '🏢 ABCD Super App', query: 'Tell me about ABCD Super App' }
        ]
      },
      {
        triggers: ['what is microservices', 'microservice architecture', 'monolith vs microservices'],
        response: `<strong>Microservices Architecture</strong> is an architectural approach where a complex application is broken down into a suite of small, loosely coupled, independently deployable services.<br><br>
        • <strong>Benefits:</strong> Independent scaling, resilience, polyglot technology adoption, and localized deployments.<br>
        • <strong>Communication:</strong> Typically orchestrated via REST APIs, gRPC, or event streaming brokers like Apache Kafka/RabbitMQ.`,
        actions: [
          { text: '⚡ Tech Stack', query: 'What is your tech stack?' },
          { text: '🏢 Architecture Philosophy', query: 'What is your leadership approach?' }
        ]
      },
      {
        triggers: ['what is clean architecture', 'clean architecture', 'solid principles', 'design patterns'],
        response: `<strong>Clean Architecture</strong> (popularized by Robert C. Martin / Uncle Bob) structures applications into concentric layers — Entities (Domain), Use Cases, Interface Adapters, and Frameworks/Drivers.<br><br>
        • <strong>The Dependency Rule:</strong> Source code dependencies must only point inwards towards high-level policies.<br>
        • <strong>Benefit:</strong> UI, databases, and third-party frameworks can be swapped or upgraded without modifying core business rules.`,
        actions: [
          { text: '🏢 Engineering Leadership', query: 'What is your leadership approach?' },
          { text: '⚡ Core Tech Stack', query: 'What is your tech stack?' }
        ]
      },
      {
        triggers: ['flutter vs react native', 'react native vs flutter'],
        response: `<strong>Flutter vs React Native Comparison:</strong><br><br>
        • <strong>Flutter:</strong> Uses Dart, compiles directly to native machine code, renders via its own engine (Impeller/Skia), providing guaranteed 60/120fps UI consistency across platforms.<br>
        • <strong>React Native:</strong> Uses JavaScript/TypeScript and bridges to native platform UI widgets.<br><br>
        For complex custom animations, strict pixel parity, and offline reliability, Flutter is an exceptional choice.`,
        actions: [
          { text: '📱 Flutter Skills', query: 'Tell me about your Flutter skills' },
          { text: '🌐 React Skills', query: 'Tell me about your React experience' }
        ]
      },
      {
        triggers: ['education', 'degree', 'college', 'university', 'qualification', 'studied'],
        response: `Sathish holds a <strong>Bachelor of Engineering (B.E.) in Computer Science &amp; Engineering</strong> from <strong>Anna University, Chennai</strong> (Graduated in 2017).<br><br>His academic foundation in algorithms and software engineering is backed by 8+ continuous years of building production-grade enterprise software systems.`,
        actions: [
          { text: '💼 Career Experience', query: 'Tell me about your career history' },
          { text: '📄 Download Verified Resume', href: 'assets/SATHISH_SIVAKUMAR_Resume.pdf' }
        ]
      },
      {
        triggers: ['docker', 'container', 'containerization', 'kubernetes', 'k8s', 'devops'],
        response: `<strong>Docker</strong> packages applications and their dependencies into standardized, lightweight containers that run reliably in any computing environment.<br><br>
        • <strong>Benefits:</strong> Eliminates "works on my machine" issues, isolates microservices, and accelerates CI/CD automated deployments.<br>
        • <strong>Production Usage:</strong> Sathish containerizes Java Spring Boot, Python, and Node microservices with multi-stage Dockerfiles and deploys them to GCP Cloud Run and Kubernetes clusters.`,
        actions: [
          { text: '⚡ Core Tech Stack', query: 'What is your tech stack?' },
          { text: '🏢 ABCD Super App', query: 'Tell me about ABCD Super App' }
        ]
      },
      {
        triggers: ['python', 'django', 'fastapi', 'flask'],
        response: `<strong>Python</strong> is a versatile high-level language prized for readability, data handling, and extensive AI/ML ecosystem.<br><br>
        • <strong>How Sathish Uses Python:</strong> Building rapid backend microservices (FastAPI), automating data extraction pipelines, scripting CI/CD workflows, and developing Agentic AI orchestration tools.`,
        actions: [
          { text: '⚡ Full Tech Stack', query: 'What is your tech stack?' },
          { text: '🤖 AI & Forward Deployed', query: 'Tell me about your AI experience' }
        ]
      },
      {
        triggers: ['typescript', 'javascript vs typescript', 'ts vs js'],
        response: `<strong>TypeScript</strong> is a strongly typed superset of JavaScript developed by Microsoft. It adds static types, compile-time error checking, and rich IDE autocompletion.<br><br>
        • <strong>Enterprise Impact:</strong> Reduces runtime bugs by over 30%, streamlines large team refactoring, and ensures strict API contracts across frontend and backend layers.`,
        actions: [
          { text: '🌐 React & Web Stack', query: 'Tell me about your React experience' },
          { text: '🚀 PingZo Ecosystem', query: 'Tell me about PingZo' }
        ]
      },
      {
        triggers: ['what is an api', 'api', 'rest api', 'restful', 'graphql', 'web services'],
        response: `An <strong>API (Application Programming Interface)</strong> is a defined contract allowing different software systems to communicate and exchange data.<br><br>
        • <strong>RESTful APIs:</strong> Rely on standard HTTP methods (GET, POST, PUT, DELETE) and JSON payloads for stateless, cacheable web services.<br>
        • <strong>In Sathish's Work:</strong> Architected hundreds of secure RESTful endpoints for 10M+ users with OAuth2/JWT security, rate limiting, and sub-100ms response targets.`,
        actions: [
          { text: '⚡ Backend Stack', query: 'What is your tech stack?' },
          { text: '🏢 ABCD Super App', query: 'Tell me about ABCD Super App' }
        ]
      },
      {
        triggers: ['database', 'sql vs nosql', 'sql', 'nosql', 'postgres', 'mongodb'],
        response: `<strong>SQL vs NoSQL Databases:</strong><br><br>
        • <strong>SQL (Relational - PostgreSQL, MySQL):</strong> Structured schemas, ACID transactions, and complex relational queries. Best for financial, user, and ordering transactions.<br>
        • <strong>NoSQL (Document/Key-Value - MongoDB, Redis, Firestore):</strong> Schema-less, horizontally scalable. Best for session caching, catalogs, and rapid unstructured events.<br><br>
        Sathish architects hybrid data tiers leveraging PostgreSQL for core ledgers and Redis for sub-millisecond caching.`,
        actions: [
          { text: '⚡ Tech Stack Details', query: 'What is your tech stack?' },
          { text: '🚀 PingZo Architecture', query: 'Tell me about PingZo' }
        ]
      },
      {
        triggers: ['why should we hire you', 'why hire sathish', 'why hire you', 'strengths', 'why choose you'],
        response: `Here is why Sathish Sivakumar brings exceptional, immediate value to engineering teams:<br><br>
        1. <strong>Proven Scale (10M+ Users):</strong> Technical Lead driving high-concurrency FinTech architecture on ABCD Super App with 99.5%+ crash-free sessions.<br>
        2. <strong>End-to-End Ownership:</strong> Independently architected, designed, and deployed the 3-tier PingZo logistics ecosystem (Admin + Customer + Driver apps).<br>
        3. <strong>Forward Deployed AI Mindset:</strong> Actively embeds LLMs and agentic autonomous workflows directly into enterprise software.<br>
        4. <strong>Hands-on Tech Leadership:</strong> 8+ years leading cross-functional squads, code reviews, and high-velocity sprints.`,
        actions: [
          { text: '💼 Career Experience', query: 'Tell me about your career history' },
          { text: '📄 Download Resume (PDF)', href: 'assets/SATHISH_SIVAKUMAR_Resume.pdf' },
          { text: '📫 Schedule a Call', href: 'mailto:sathish.sivakumar2706@gmail.com' }
        ]
      },
      {
        triggers: ['hobbies', 'interests', 'free time', 'outside work', 'what do you like'],
        response: `Outside of building enterprise software and AI systems, Sathish is passionate about:<br><br>
        • 🚀 Exploring novel AI frameworks, autonomous multi-agent orchestration, and developer tooling.<br>
        • 📱 Experimenting with bleeding-edge UI micro-interactions, Flutter shader rendering, and WebGL animations.<br>
        • 📚 Mentoring early-career software engineers and staying current with distributed cloud architectures.`,
        actions: [
          { text: '👨‍💼 Executive Summary', query: 'Give me an executive summary' },
          { text: '🐙 Explore GitHub', href: 'https://github.com/sathishkhan27/' }
        ]
      },
      {
        triggers: ['center a div', 'center div', 'how to center a div'],
        response: `To center a <code>div</code> in modern CSS, the simplest approach is using <strong>Flexbox</strong>:<br>
        <code>display: flex; justify-content: center; align-items: center;</code><br><br>
        Or using <strong>CSS Grid</strong>:<br>
        <code>display: grid; place-items: center;</code>`,
        actions: [
          { text: '🌐 React & Web Stack', query: 'Tell me about your React experience' },
          { text: '⚡ Full Tech Stack', query: 'What is your tech stack?' }
        ]
      },
      {
        triggers: ['joke', 'tell me a joke', 'funny', 'another joke'],
        response: `Here's a developer classic: 😄<br><br>
        <em>"There are 10 types of people in the world: those who understand binary, and those who don't!"</em><br><br>
        Another one: <em>"Why do programmers prefer dark mode? Because light attracts bugs!"</em> 🐛<br><br>
        What tech topic would you like to explore next?`,
        actions: [
          { text: '🚀 PingZo Ecosystem', query: 'Tell me about PingZo' },
          { text: '⚡ Core Tech Stack', query: 'What is your tech stack?' }
        ]
      },
      {
        triggers: ['bye', 'goodbye', 'see you', 'see ya', 'cya', 'take care', 'good night', 'have a nice day'],
        response: `Goodbye! Thanks for stopping by Sathish's portfolio website. Have a wonderful day ahead! If you'd like to stay connected, feel free to drop an email or reach out on LinkedIn.`,
        actions: [
          { text: '✉ Email Sathish', href: 'mailto:sathish.sivakumar2706@gmail.com' },
          { text: '📄 Download Resume', href: 'assets/SATHISH_SIVAKUMAR_Resume.pdf' }
        ]
      },
      {
        triggers: ['thanks', 'thank you', 'thx', 'great', 'awesome', 'cool', 'nice', 'perfect', 'well done', 'good job'],
        response: `You're very welcome! If you have any further questions or would like to explore working together, feel free to ask or drop me an email anytime!`,
        actions: [
          { text: '✉ Email Sathish', href: 'mailto:sathish.sivakumar2706@gmail.com' },
          { text: '📄 Download Resume', href: 'assets/SATHISH_SIVAKUMAR_Resume.pdf' }
        ]
      }
    ];

    function getBotResponse(query) {
      const q = query.toLowerCase().trim();
      const normalized = q.replace(/[^\w\s]/g, ' ');
      const words = normalized.split(/\s+/).filter(Boolean);

      // Check PingZo + ABCD combined intent (e.g. from starter option)
      if (q.includes('pingzo') && (q.includes('abcd') || q.includes('super app') || q.includes('superapp') || q.includes('10m'))) {
        return {
          response: `Here is a consolidated overview of my two flagship enterprise initiatives:<br><br>
          • <strong>PingZo Ecosystem (Proprietary Tri-App):</strong> An end-to-end on-demand ordering and multi-tier logistics platform architected by me, featuring an Admin Enterprise Portal (React/Next.js), Customer App (Flutter), and Driver Logistics App (Flutter).<br><br>
          • <strong>ABCD Super App (10M+ Users):</strong> At Impiger Technologies, I serve as Technical Lead governing squads building India's premier FinTech super-app for Aditya Birla Capital using Flutter, React JS, Java Spring Boot microservices, and GCP cloud infrastructure.`,
          actions: [
            { text: '🚀 PingZo Architecture', query: 'Tell me about PingZo' },
            { text: '🏢 ABCD Tech Leadership', query: 'Tell me about ABCD Super App' },
            { text: '📫 Contact Sathish', query: 'How to contact Sathish' }
          ]
        };
      }

      let bestMatch = null;
      let highestScore = 0;

      for (const item of KNOWLEDGE_RESPONSES) {
        let score = 0;
        for (const trigger of item.triggers) {
          if (trigger.includes(' ') || trigger.includes('-') || trigger.includes('.')) {
            // Multi-word phrase or hyphenated trigger
            if (q === trigger) {
              score += 20;
            } else if (q.includes(trigger)) {
              score += 8;
            }
          } else {
            // Single word trigger: match whole word or exact
            if (q === trigger) {
              score += 20;
            } else if (words.includes(trigger)) {
              score += 6;
            }
          }
        }
        if (score > highestScore) {
          highestScore = score;
          bestMatch = item;
        }
      }

      if (bestMatch && highestScore > 0) {
        return bestMatch;
      }

      // Friendly generic conversational response
      return {
        response: `I'd be glad to help with that! As an AI assistant representing <strong>Sathish Sivakumar</strong>, I can chat about software development, discuss technical concepts (like Flutter, React, Java Spring Boot, and AI workflows), or share detailed insights into my 8+ years of engineering leadership and products.<br><br>Feel free to ask any technical question or select an area below to explore:`,
        actions: [
          { text: '👨‍💼 Executive Summary', query: 'Give me an executive summary' },
          { text: '⚡ Core Tech Stack', query: 'What is your tech stack?' },
          { text: '🚀 PingZo Ecosystem', query: 'Tell me about PingZo' },
          { text: '📫 Contact Sathish', query: 'How to contact Sathish' }
        ]
      };
    }

    // Scroll helper
    function scrollChatToBottom(delay = 40) {
      setTimeout(() => {
        const chatBody = document.getElementById('floatChatBody');
        if (chatBody) {
          chatBody.scrollTop = chatBody.scrollHeight;
        }
        if (floatChatMessages) {
          floatChatMessages.scrollTop = floatChatMessages.scrollHeight;
        }
      }, delay);
    }

    // View Transitions
    function switchToThreadView() {
      const screen = document.getElementById('floatingChatScreen');
      if (screen) screen.classList.add('in-thread');
      if (floatChatStarterView) floatChatStarterView.style.display = 'none';
      if (floatChatThreadView) floatChatThreadView.style.display = 'flex';
      if (floatChatBottomBar) floatChatBottomBar.style.display = 'block';
      scrollChatToBottom(50);
    }

    function switchToStarterView() {
      const screen = document.getElementById('floatingChatScreen');
      if (screen) screen.classList.remove('in-thread');
      if (floatChatStarterView) floatChatStarterView.style.display = 'block';
      if (floatChatThreadView) floatChatThreadView.style.display = 'none';
      if (floatChatBottomBar) floatChatBottomBar.style.display = 'none';
      if (floatHeaderInput) floatHeaderInput.focus();
    }

    // Flyout Window Open / Close
    function openFloatingChat() {
      floatingChatScreenWrapper.classList.add('active');
      floatingChatScreenWrapper.setAttribute('aria-hidden', 'false');
      floatingChatFab.classList.add('active');
      if (fabChatIcon) fabChatIcon.style.display = 'none';
      if (fabCloseIcon) fabCloseIcon.style.display = 'flex';

      setTimeout(() => {
        if (floatChatThreadView && floatChatThreadView.style.display !== 'none') {
          if (floatBottomInput) floatBottomInput.focus();
        } else {
          if (floatHeaderInput) floatHeaderInput.focus();
        }
      }, 150);
    }

    function closeFloatingChat() {
      floatingChatScreenWrapper.classList.remove('active');
      floatingChatScreenWrapper.setAttribute('aria-hidden', 'true');
      floatingChatFab.classList.remove('active');
      if (fabChatIcon) fabChatIcon.style.display = 'flex';
      if (fabCloseIcon) fabCloseIcon.style.display = 'none';
    }

    function toggleFloatingChat() {
      if (floatingChatScreenWrapper.classList.contains('active')) {
        closeFloatingChat();
      } else {
        openFloatingChat();
      }
    }

    // Message Rendering
    function appendMessage(sender, text, actions = null) {
      if (!floatChatMessages) return;

      const msgDiv = document.createElement('div');
      msgDiv.className = `float-msg float-msg-${sender}`;

      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      if (sender === 'bot') {
        let actionsHtml = '';
        if (actions && actions.length > 0) {
          actionsHtml = `<div class="float-inline-actions">` + actions.map(act => {
            if (act.href) {
              const isExt = act.href.startsWith('http') || act.href.startsWith('mailto');
              return `<a href="${act.href}" ${isExt ? 'target="_blank" rel="noopener noreferrer"' : ''} class="float-inline-btn">${act.text} ↗</a>`;
            } else {
              return `<button type="button" class="float-inline-btn" data-query="${act.query}">${act.text}</button>`;
            }
          }).join('') + `</div>`;
        }

        msgDiv.innerHTML = `
          <img src="${BOT_AVATAR}" alt="${BOT_NAME}" class="float-msg-avatar">
          <div class="float-msg-bubble">
            <div class="float-bot-meta">
              <span class="float-bot-name">Sathish</span>
              <span class="float-bot-badge">Verified AI</span>
            </div>
            <p>${text}</p>
            ${actionsHtml}
            <span class="float-time">${timeStr}</span>
          </div>
        `;
      } else {
        msgDiv.innerHTML = `
          <div class="float-msg-bubble">
            <p>${escapeHtml(text)}</p>
            <span class="float-time">${timeStr}</span>
          </div>
        `;
      }

      floatChatMessages.appendChild(msgDiv);
      if (sender === 'user') {
        scrollChatToBottom(20);
      } else {
        setTimeout(() => {
          msgDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 60);
      }
    }

    function escapeHtml(string) {
      const div = document.createElement('div');
      div.innerText = string;
      return div.innerHTML;
    }

    function showTypingIndicator() {
      if (!floatChatMessages) return;
      const typingDiv = document.createElement('div');
      typingDiv.className = 'float-msg float-msg-bot';
      typingDiv.id = 'floatTypingIndicator';
      typingDiv.innerHTML = `
        <img src="${BOT_AVATAR}" alt="${BOT_NAME}" class="float-msg-avatar">
        <div class="float-msg-bubble">
          <div class="float-typing">
            <span class="float-typing-dot"></span>
            <span class="float-typing-dot"></span>
            <span class="float-typing-dot"></span>
          </div>
        </div>
      `;
      floatChatMessages.appendChild(typingDiv);
      scrollChatToBottom(20);
    }

    function removeTypingIndicator() {
      const typingDiv = document.getElementById('floatTypingIndicator');
      if (typingDiv) {
        typingDiv.remove();
      }
    }

    function handleUserQuery(queryText) {
      if (!queryText || !queryText.trim()) return;
      const cleanText = queryText.trim();

      // Ensure floating window is visible and in thread mode
      openFloatingChat();
      switchToThreadView();

      // Append User message
      appendMessage('user', cleanText);
      if (floatHeaderInput) floatHeaderInput.value = '';
      if (floatBottomInput) floatBottomInput.value = '';

      // Show typing indicator
      showTypingIndicator();

      // Bot thinking delay
      setTimeout(() => {
        removeTypingIndicator();
        const result = getBotResponse(cleanText);
        appendMessage('bot', result.response, result.actions);
        if (floatBottomInput) floatBottomInput.focus();
      }, 420);
    }

    // FAB click handler
    floatingChatFab.addEventListener('click', () => {
      toggleFloatingChat();
    });

    // Minimize button
    if (floatChatMinimizeBtn) {
      floatChatMinimizeBtn.addEventListener('click', () => {
        closeFloatingChat();
      });
    }

    // Header Form Submit
    if (floatChatHeaderForm) {
      floatChatHeaderForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (floatHeaderInput && floatHeaderInput.value.trim()) {
          handleUserQuery(floatHeaderInput.value);
        }
      });
    }

    // Bottom Form Submit
    if (floatBottomForm) {
      floatBottomForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (floatBottomInput && floatBottomInput.value.trim()) {
          handleUserQuery(floatBottomInput.value);
        }
      });
    }

    // Back to topics button
    if (floatChatBackBtn) {
      floatChatBackBtn.addEventListener('click', () => {
        switchToStarterView();
      });
    }

    // Reset Chat button
    if (floatChatResetBtn) {
      floatChatResetBtn.addEventListener('click', () => {
        if (floatChatMessages) floatChatMessages.innerHTML = '';
        switchToStarterView();
      });
    }

    // Starter Options & Inline Chips Delegation
    document.addEventListener('click', (e) => {
      const starterBtn = e.target.closest('.starter-option-btn');
      if (starterBtn && starterBtn.hasAttribute('data-query')) {
        const query = starterBtn.getAttribute('data-query');
        handleUserQuery(query);
        return;
      }

      const inlineBtn = e.target.closest('.float-inline-btn[data-query]') || e.target.closest('.chat-inline-btn[data-query]');
      if (inlineBtn && inlineBtn.hasAttribute('data-query')) {
        const query = inlineBtn.getAttribute('data-query');
        handleUserQuery(query);
        return;
      }
    });

    // Global navigation links targeting chat (#chat or .nav-chat-link)
    document.querySelectorAll('a[href="#chat"], .nav-chat-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        openFloatingChat();
      });
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && floatingChatScreenWrapper.classList.contains('active')) {
        closeFloatingChat();
      }
    });
  }
});