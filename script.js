/* ===================================================================
   AKSHITH KESARI — PORTFOLIO SCRIPT
   Vanilla JS, GPU-friendly, respects prefers-reduced-motion
   =================================================================== */

(function () {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------- SPRING UTILITY ----------------
     A tiny critically-damped-ish spring for natural, weighted motion.
     Used by the magnetic button and hero parallax so movement settles
     instead of snapping linearly to the cursor. */
  function createSpring(stiffness, damping) {
    let x = 0, v = 0, target = 0, raf = null;
    function step() {
      const force = (target - x) * stiffness;
      v = (v + force) * damping;
      x += v;
      onUpdate(x);
      if (Math.abs(target - x) > 0.01 || Math.abs(v) > 0.01) {
        raf = requestAnimationFrame(step);
      } else {
        x = target;
        onUpdate(x);
        raf = null;
      }
    }
    let onUpdate = () => {};
    return {
      set(t) { target = t; if (!raf) raf = requestAnimationFrame(step); },
      onUpdate(fn) { onUpdate = fn; },
    };
  }

  /* ---------------- SCROLL PROGRESS BAR ---------------- */
  function initScrollProgress() {
    const bar = document.getElementById('scrollProgress');
    function update() {
      const scrollTop = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const pct = max > 0 ? (scrollTop / max) * 100 : 0;
      bar.style.width = pct + '%';
    }
    window.addEventListener('scroll', update, { passive: true });
    update();
  }

  /* ---------------- NAVBAR ---------------- */
  function initNavbar() {
    const navbar = document.getElementById('navbar');
    const toggle = document.getElementById('navToggle');
    const links = document.getElementById('navLinks');

    function onScroll() {
      navbar.classList.toggle('navbar-scrolled', window.scrollY > 40);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    toggle.addEventListener('click', () => {
      const expanded = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!expanded));
      links.classList.toggle('nav-open');
    });

    links.querySelectorAll('a').forEach((a) => {
      a.addEventListener('click', () => {
        toggle.setAttribute('aria-expanded', 'false');
        links.classList.remove('nav-open');
      });
    });
  }

  /* ---------------- TYPING ANIMATION ---------------- */
  function initTyping() {
    const el = document.getElementById('typingText');
    const phrases = ['Who am I?', 'learning Python', 'breaking things on purpose', 'incoming CSE @ VIT Vellore', 'figuring out cybersecurity'];
    let phraseIdx = 0;
    let charIdx = 0;
    let deleting = false;

    if (reduceMotion) {
      el.textContent = phrases[0];
      return;
    }

    function tick() {
      const phrase = phrases[phraseIdx];
      if (!deleting) {
        charIdx++;
        el.textContent = phrase.slice(0, charIdx);
        if (charIdx === phrase.length) {
          deleting = true;
          setTimeout(tick, 1600);
          return;
        }
        setTimeout(tick, 65 + Math.random() * 40);
      } else {
        charIdx--;
        el.textContent = phrase.slice(0, charIdx);
        if (charIdx === 0) {
          deleting = false;
          phraseIdx = (phraseIdx + 1) % phrases.length;
          setTimeout(tick, 400);
          return;
        }
        setTimeout(tick, 30);
      }
    }
    tick();
  }

  /* ---------------- PARTICLE BACKGROUND ---------------- */
  function initParticles() {
    const canvas = document.getElementById('particleCanvas');
    const ctx = canvas.getContext('2d');
    let particles = [];
    let mouse = { x: null, y: null };
    let w, h;
    let rafId;

    const COLORS = ['#a8502b', '#4f6b52', '#969184'];

    function resize() {
      w = canvas.width = canvas.offsetWidth * devicePixelRatio;
      h = canvas.height = canvas.offsetHeight * devicePixelRatio;
      canvas.style.width = canvas.offsetWidth + 'px';
      canvas.style.height = canvas.offsetHeight + 'px';
      const count = Math.min(80, Math.floor((canvas.offsetWidth * canvas.offsetHeight) / 16000));
      particles = Array.from({ length: count }, () => createParticle());
    }

    function createParticle() {
      return {
        x: Math.random() * w,
        y: Math.random() * h,
        r: (Math.random() * 1.6 + 0.6) * devicePixelRatio,
        vx: (Math.random() - 0.5) * 0.18 * devicePixelRatio,
        vy: (Math.random() - 0.5) * 0.18 * devicePixelRatio,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        alpha: Math.random() * 0.3 + 0.18,
      };
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);
      const maxDist = 130 * devicePixelRatio;

      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;

        // subtle mouse repel/attract
        if (mouse.x !== null) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 160 * devicePixelRatio) {
            const force = (1 - dist / (160 * devicePixelRatio)) * 0.5;
            p.x += (dx / (dist || 1)) * force;
            p.y += (dy / (dist || 1)) * force;
          }
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fill();
      });

      ctx.globalAlpha = 1;
      // connect nearby particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < maxDist) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = '#969184';
            ctx.globalAlpha = (1 - dist / maxDist) * 0.1;
            ctx.lineWidth = devicePixelRatio * 0.6;
            ctx.stroke();
          }
        }
      }
      ctx.globalAlpha = 1;

      rafId = requestAnimationFrame(draw);
    }

    window.addEventListener('resize', resize, { passive: true });
    canvas.parentElement.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = (e.clientX - rect.left) * devicePixelRatio;
      mouse.y = (e.clientY - rect.top) * devicePixelRatio;
    });
    canvas.parentElement.addEventListener('mouseleave', () => { mouse.x = null; mouse.y = null; });

    resize();
    if (!reduceMotion) {
      draw();
    } else {
      // draw a single static frame
      particles.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fill();
      });
      ctx.globalAlpha = 1;
    }
  }

  /* ---------------- HERO MOUSE PARALLAX + SCROLL EXIT ----------------
     Combines cursor parallax (spring-eased, has weight) with a scroll-driven
     cinematic exit (fade + lift + slight scale) into one transform pipeline
     so the two inputs don't fight over the same style property. */
  function initHeroMotion() {
    const hero = document.getElementById('hero');
    const content = document.getElementById('heroContent');
    if (!hero || !content) return;

    let mouseX = 0, mouseY = 0;
    let scrollLift = 0, scrollScale = 1, scrollOpacity = 1;

    function render() {
      content.style.transform = `translate3d(${mouseX}px, ${mouseY + scrollLift}px, 0) scale(${scrollScale})`;
      content.style.opacity = String(scrollOpacity);
    }

    if (!reduceMotion) {
      const springX = createSpring(0.06, 0.85);
      const springY = createSpring(0.06, 0.85);
      springX.onUpdate((v) => { mouseX = v; render(); });
      springY.onUpdate((v) => { mouseY = v; render(); });

      hero.addEventListener('mousemove', (e) => {
        const rect = hero.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width - 0.5;
        const py = (e.clientY - rect.top) / rect.height - 0.5;
        springX.set(px * -14);
        springY.set(py * -10);
      });
      hero.addEventListener('mouseleave', () => { springX.set(0); springY.set(0); });

      let ticking = false;
      function updateScroll() {
        const rect = hero.getBoundingClientRect();
        const vh = window.innerHeight;
        const progress = Math.min(Math.max(-rect.top / vh, 0), 1);
        scrollOpacity = Math.max(1 - progress * 1.15, 0);
        scrollLift = progress * 60;
        scrollScale = 1 - progress * 0.04;
        render();
        ticking = false;
      }
      window.addEventListener('scroll', () => {
        if (!ticking) { requestAnimationFrame(updateScroll); ticking = true; }
      }, { passive: true });
      updateScroll();
    }
  }

  /* ---------------- MAGNETIC BUTTON ---------------- */
  function initMagneticButton() {
    if (reduceMotion) return;
    const btn = document.getElementById('exploreBtn');
    const inner = btn.querySelector('.btn-magnetic-inner');

    const springX = createSpring(0.18, 0.78);
    const springY = createSpring(0.18, 0.78);
    let curX = 0, curY = 0;

    springX.onUpdate((v) => { curX = v; inner.style.transform = `translate(${curX}px, ${curY}px)`; });
    springY.onUpdate((v) => { curY = v; inner.style.transform = `translate(${curX}px, ${curY}px)`; });

    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      springX.set(x * 0.3);
      springY.set(y * 0.4);
    });
    btn.addEventListener('mouseleave', () => {
      springX.set(0);
      springY.set(0);
    });
  }

  /* ---------------- SECTION TITLE WORD REVEAL ----------------
     Splits each section title into per-word spans so they cascade in
     with a blur-to-sharp focus pull, rather than fading as one flat block. */
  function initTitleSplit() {
    const titles = document.querySelectorAll('.section-title');
    titles.forEach((title) => {
      const words = title.textContent.trim().split(/\s+/);
      title.innerHTML = words
        .map((w, i) => `<span class="title-word" style="transition-delay:${i * 0.06}s">${w}</span>`)
        .join(' ');
    });
  }
  function initScrollReveal() {
    const targets = document.querySelectorAll('[data-reveal], .section-tag, .section-title, .section-sub, .ledger-row, .stat-block');
    if (!('IntersectionObserver' in window)) {
      targets.forEach((t) => t.classList.add('is-visible'));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });

    targets.forEach((t) => observer.observe(t));
  }

  /* ---------------- STAGGER CHILD DELAYS ---------------- */
  function initStaggers() {
    document.querySelectorAll('.interest-row').forEach((card, i) => {
      card.style.transitionDelay = (i % 5) * 0.07 + 's';
    });
    document.querySelectorAll('.ledger-row').forEach((item, i) => {
      item.style.transitionDelay = (i * 0.05) + 's';
    });
    document.querySelectorAll('.stat-block').forEach((card, i) => {
      card.style.transitionDelay = (i * 0.08) + 's';
    });
  }

  /* ---------------- LEDGER FILL LINE ---------------- */
  function initTimelineFill() {
    const fill = document.getElementById('timelineFill');
    const ledger = document.querySelector('.ledger');
    if (!fill || !ledger) return;

    function update() {
      const rect = ledger.getBoundingClientRect();
      const viewportH = window.innerHeight;
      const total = rect.height;
      const visible = Math.min(Math.max(viewportH * 0.75 - rect.top, 0), total);
      const pct = total > 0 ? (visible / total) * 100 : 0;
      fill.style.height = pct + '%';
    }
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    update();
  }

  /* (interest row hover handled entirely in CSS now — no JS needed) */

  /* ---------------- LEARNING GOALS (progress cards) ---------------- */
  function initLearningGoals() {
    const data = [
      { name: 'Python', pct: 20, status: 'just getting started' },
      { name: 'Java', pct: 20, status: 'just getting started' },
      { name: 'Data Structures', pct: 0, status: 'not started yet' },
      { name: 'Algorithms', pct: 0, status: 'not started yet' },
      { name: 'Networking Fundamentals', pct: 10, status: 'next on the list' },
      { name: 'Linux & Shell', pct: 15, status: 'early stages' },
      { name: 'Cybersecurity Basics', pct: 15, status: 'next on the list' },
      { name: 'Ethical Hacking Concepts', pct: 5, status: 'just getting started' },
    ];

    const grid = document.getElementById('progressGrid');
    grid.innerHTML = data.map((item, i) => `
      <div class="progress-card" data-pct="${item.pct}" style="transition-delay:${(i % 2) * 0.08}s">
        <div class="progress-card-top">
          <h3>${item.name}</h3>
          <span class="progress-card-pct">${item.pct}%</span>
        </div>
        <div class="progress-bar-track">
          <div class="progress-bar-fill" data-fill style="width:0%"></div>
        </div>
        <span class="progress-card-status">// ${item.status}</span>
      </div>
    `).join('');

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          const fill = entry.target.querySelector('[data-fill]');
          const pct = entry.target.getAttribute('data-pct');
          requestAnimationFrame(() => { fill.style.width = pct + '%'; });
          fill.addEventListener('transitionend', () => fill.classList.add('fill-done'), { once: true });
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });

    grid.querySelectorAll('.progress-card').forEach((c) => observer.observe(c));
  }

  /* ---------------- COUNTERS ---------------- */
  function initCounters() {
    const counters = document.querySelectorAll('[data-count-to]');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    counters.forEach((c) => observer.observe(c));

    function animateCounter(el) {
      const to = parseInt(el.getAttribute('data-count-to'), 10);
      const from = parseInt(el.getAttribute('data-count-from') || '0', 10);
      const duration = 1400;
      const start = performance.now();

      function step(now) {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const value = Math.round(from + (to - from) * eased);
        el.textContent = value;
        if (progress < 1) requestAnimationFrame(step);
        else el.textContent = to;
      }
      if (reduceMotion) {
        el.textContent = to;
      } else {
        requestAnimationFrame(step);
      }
    }
  }

  /* ---------------- COPY EMAIL ---------------- */
  function initCopyEmail() {
    const btn = document.getElementById('copyBtn');
    const label = document.getElementById('copyLabel');
    const icon = document.getElementById('copyIcon');
    const email = document.getElementById('emailText').textContent.trim();
    const defaultIcon = icon.innerHTML;
    const checkIcon = '<path d="M5 12.5L10 17.5L19 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';

    btn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(email);
      } catch (e) {
        const ta = document.createElement('textarea');
        ta.value = email;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      btn.classList.add('copied');
      icon.innerHTML = checkIcon;
      icon.classList.add('icon-pop');
      label.textContent = 'Copied!';
      setTimeout(() => {
        btn.classList.remove('copied');
        icon.innerHTML = defaultIcon;
        icon.classList.remove('icon-pop');
        label.textContent = 'Copy Email';
      }, 2000);
    });
  }

  /* ---------------- BACK TO TOP ---------------- */
  function initBackToTop() {
    const btn = document.getElementById('backToTop');
    window.addEventListener('scroll', () => {
      btn.classList.toggle('visible', window.scrollY > 600);
    }, { passive: true });

    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  }

  /* ---------------- INIT ---------------- */
  document.addEventListener('DOMContentLoaded', () => {
    initScrollProgress();
    initNavbar();
    initTyping();
    initParticles();
    initHeroMotion();
    initMagneticButton();
    initStaggers();
    initTitleSplit();
    initScrollReveal();
    initTimelineFill();
    initLearningGoals();
    initCounters();
    initCopyEmail();
    initBackToTop();
  });
})();
