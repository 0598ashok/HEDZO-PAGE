/* ==========================================================================
   HEDZO UNI — Main UI & Application Controller
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  // ==========================================================================
  // 1. PRELOADER CONTROLLER
  // ==========================================================================
  const preloader = document.getElementById('preloader');
  const loaderBar = document.querySelector('.loader-bar-fill');
  let progress = 0;

  const loadInterval = setInterval(() => {
    progress += Math.floor(Math.random() * 25) + 15;
    if (progress >= 100) {
      progress = 100;
      if (loaderBar) loaderBar.style.width = '100%';
      clearInterval(loadInterval);
      setTimeout(() => {
        if (preloader) {
          preloader.classList.add('fade-out');
          initEntranceAnimations();
        }
      }, 350);
    } else {
      if (loaderBar) loaderBar.style.width = `${progress}%`;
    }
  }, 90);

  // ==========================================================================
  // 2. SCROLL PROGRESS INDICATOR & NAVBAR CONTROLLER
  // ==========================================================================
  const scrollProgressBar = document.getElementById('scrollProgress');
  const navbar = document.querySelector('.hedzo-navbar');
  const navLinks = document.querySelectorAll('.nav-link-item');
  const sections = document.querySelectorAll('section[id]');

  window.addEventListener('scroll', () => {
    const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
    if (totalScroll > 0) {
      const scrollPercent = (window.scrollY / totalScroll) * 100;
      if (scrollProgressBar) scrollProgressBar.style.width = `${scrollPercent}%`;
    }

    if (window.scrollY > 40) {
      navbar?.classList.add('scrolled');
    } else {
      navbar?.classList.remove('scrolled');
    }

    // Active Section Navigation Highlighting
    let currentSectionId = '';
    sections.forEach(sec => {
      const sectionTop = sec.offsetTop - 120;
      const sectionHeight = sec.offsetHeight;
      if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
        currentSectionId = sec.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${currentSectionId}`) {
        link.classList.add('active');
      }
    });
  });

  // Mobile Menu Toggle
  const mobileToggle = document.querySelector('.mobile-nav-toggle');
  const mobileDrawer = document.querySelector('.mobile-drawer');

  if (mobileToggle && mobileDrawer) {
    mobileToggle.addEventListener('click', () => {
      mobileToggle.classList.toggle('open');
      mobileDrawer.classList.toggle('open');
      document.body.style.overflow = mobileDrawer.classList.contains('open') ? 'hidden' : '';
    });

    mobileDrawer.querySelectorAll('.nav-link-item').forEach(item => {
      item.addEventListener('click', () => {
        mobileToggle.classList.remove('open');
        mobileDrawer.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }

  // ==========================================================================
  // 3. CUSTOM CURSOR
  // ==========================================================================
  const cursorDot = document.querySelector('.custom-cursor-dot');
  const cursorRing = document.querySelector('.custom-cursor-ring');

  if (cursorDot && cursorRing && window.innerWidth > 768) {
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let ringX = mouseX;
    let ringY = mouseY;

    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      cursorDot.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%, -50%)`;
    });

    function renderCursorRing() {
      ringX += (mouseX - ringX) * 0.18;
      ringY += (mouseY - ringY) * 0.18;
      cursorRing.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%)`;
      requestAnimationFrame(renderCursorRing);
    }
    renderCursorRing();

    // Hover state over interactive elements
    const hoverElements = document.querySelectorAll('a, button, input, select, .market-card, .signal-card, .strategy-card');
    hoverElements.forEach(el => {
      el.addEventListener('mouseenter', () => cursorRing.classList.add('active'));
      el.addEventListener('mouseleave', () => cursorRing.classList.remove('active'));
    });
  }

  // ==========================================================================
  // 4. MARKET TICKER LIVE UPDATES
  // ==========================================================================
  function initTickerLiveSimulation() {
    const tickerPrices = document.querySelectorAll('.ticker-pill');
    setInterval(() => {
      const randomPill = tickerPrices[Math.floor(Math.random() * tickerPrices.length)];
      if (!randomPill) return;

      const priceEl = randomPill.querySelector('.ticker-price');
      const changeEl = randomPill.querySelector('.ticker-change');
      if (!priceEl) return;

      const isUp = Math.random() > 0.45;
      priceEl.classList.remove('flash-green', 'flash-red');
      void priceEl.offsetWidth; // trigger reflow
      priceEl.classList.add(isUp ? 'flash-green' : 'flash-red');

      setTimeout(() => {
        priceEl.classList.remove('flash-green', 'flash-red');
      }, 700);
    }, 1400);
  }
  initTickerLiveSimulation();

  // ==========================================================================
  // 5. MARKET CATEGORY FILTERING ("Markets in Motion")
  // ==========================================================================
  const filterBtns = document.querySelectorAll('.market-filter-btn');
  const marketCards = document.querySelectorAll('.market-card');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.dataset.filter;
      marketCards.forEach(card => {
        if (filter === 'all' || card.dataset.category === filter) {
          card.style.display = 'flex';
          card.style.animation = 'fadeInCard 0.4s ease';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });

  // ==========================================================================
  // 6. MAIN ANALYTICS DASHBOARD CONTROLLER
  // ==========================================================================
  let mainChartInstance = null;
  if (window.HedzoCharts && document.getElementById('mainCandleCanvas')) {
    mainChartInstance = new window.HedzoCharts.MainAnalyticsChart('mainCandleCanvas');
  }

  // Timeframe Buttons
  const tfButtons = document.querySelectorAll('.tf-btn');
  tfButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tfButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const tf = btn.dataset.tf;
      if (mainChartInstance) mainChartInstance.setTimeframe(tf);
    });
  });

  // Asset Select Dropdown
  const assetSelect = document.getElementById('analyticsAssetSelect');
  if (assetSelect) {
    assetSelect.addEventListener('change', (e) => {
      if (mainChartInstance) mainChartInstance.setAsset(e.target.value);
    });
  }

  // Indicator Toggles
  const indToggles = document.querySelectorAll('.indicator-toggle-btn');
  indToggles.forEach(btn => {
    btn.addEventListener('click', () => {
      btn.classList.toggle('active');
      const ind = btn.dataset.indicator;
      if (mainChartInstance) mainChartInstance.toggleIndicator(ind);
    });
  });

  // ==========================================================================
  // 7. STATS NUMBER COUNTER ANIMATION
  // ==========================================================================
  function animateCounters() {
    const counters = document.querySelectorAll('.stat-counter-val');
    counters.forEach(counter => {
      const target = parseFloat(counter.dataset.target);
      const prefix = counter.dataset.prefix || '';
      const suffix = counter.dataset.suffix || '';
      const decimals = parseInt(counter.dataset.decimals || '0', 10);
      const duration = 2000;
      const startTime = performance.now();

      function update(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // easeOutExpo
        const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
        const currentVal = ease * target;

        counter.textContent = `${prefix}${currentVal.toFixed(decimals)}${suffix}`;
        if (progress < 1) {
          requestAnimationFrame(update);
        }
      }
      requestAnimationFrame(update);
    });
  }

  // ==========================================================================
  // 8. INTERSECTION OBSERVER FOR SIGNALS & COUNTERS
  // ==========================================================================
  const observerOptions = { threshold: 0.25 };

  // Confidence Rings in Signals Section
  const signalsObserver = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const circleBars = entry.target.querySelectorAll('.confidence-circle-bar');
        circleBars.forEach(bar => {
          const percent = parseInt(bar.dataset.percent, 10);
          const circumference = 2 * Math.PI * 60; // r=60
          const offset = circumference - (percent / 100) * circumference;
          bar.style.strokeDashoffset = offset;
        });
        obs.unobserve(entry.target);
      }
    });
  }, observerOptions);

  const signalsSection = document.getElementById('signals');
  if (signalsSection) signalsObserver.observe(signalsSection);

  // Statistics Section Counter Trigger
  const statsObserver = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounters();
        obs.unobserve(entry.target);
      }
    });
  }, observerOptions);

  const statsSection = document.getElementById('stats');
  if (statsSection) statsObserver.observe(statsSection);

  // General Reveal Elements on Scroll
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
      }
    });
  }, { threshold: 0.15 });

  document.querySelectorAll('.reveal-on-scroll').forEach(el => revealObserver.observe(el));

  // ==========================================================================
  // 9. HEDZO TERMINAL SIMULATOR CONTROLLER
  // ==========================================================================
  // Terminal Clock (UTC)
  function updateTerminalClock() {
    const clockEl = document.getElementById('terminalClock');
    if (clockEl) {
      const now = new Date();
      clockEl.textContent = `${now.toUTCString().slice(17, 25)} UTC`;
    }
  }
  setInterval(updateTerminalClock, 1000);
  updateTerminalClock();

  // Watchlist selection
  const watchlistItems = document.querySelectorAll('.watchlist-item');
  watchlistItems.forEach(item => {
    item.addEventListener('click', () => {
      watchlistItems.forEach(w => w.classList.remove('active'));
      item.classList.add('active');
    });
  });

  // Order Side Toggle (BUY/SELL)
  const orderSideButtons = document.querySelectorAll('.order-side-btn');
  const btnPlaceOrder = document.getElementById('btnPlaceOrder');
  let currentSide = 'BUY';

  orderSideButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      orderSideButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentSide = btn.dataset.side;
      if (btnPlaceOrder) {
        btnPlaceOrder.textContent = `[ PLACE ${currentSide} ORDER ]`;
        btnPlaceOrder.style.background = currentSide === 'BUY' ? 'var(--emerald-primary)' : 'var(--coral-primary)';
      }
    });
  });

  // Simulated Order Execution Toast
  if (btnPlaceOrder) {
    btnPlaceOrder.addEventListener('click', () => {
      const originalText = btnPlaceOrder.textContent;
      btnPlaceOrder.textContent = 'EXECUTING ON-CHAIN...';
      btnPlaceOrder.disabled = true;

      setTimeout(() => {
        btnPlaceOrder.textContent = originalText;
        btnPlaceOrder.disabled = false;
        showTerminalToast(`Order Filled: ${currentSide} BTC/USD @ $67,842.20`);
      }, 600);
    });
  }

  function showTerminalToast(msg) {
    let toast = document.querySelector('.terminal-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'terminal-toast';
      document.body.appendChild(toast);
    }
    toast.innerHTML = `<span class="pulse-dot"></span> <div>${msg}</div>`;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3800);
  }

  // Newsletter Submit Interaction
  const newsletterForm = document.querySelector('.newsletter-form');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = newsletterForm.querySelector('.newsletter-input');
      if (input && input.value) {
        showTerminalToast(`Subscribed: ${input.value}`);
        input.value = '';
      }
    });
  }

  // ==========================================================================
  // 10. INITIALIZE ALL CHARTS & VISUALIZERS
  // ==========================================================================
  let chartsInitialized = false;
  function initAllCharts() {
    if (chartsInitialized) return;
    if (window.HedzoCharts) {
      chartsInitialized = true;
      if (document.getElementById('heroBgCanvas')) {
        new window.HedzoCharts.HeroBackgroundGrid('heroBgCanvas');
      }
      if (document.getElementById('heroMinimalCandlesCanvas')) {
        new window.HedzoCharts.HeroMinimalCandles('heroMinimalCandlesCanvas');
      }
      if (document.getElementById('multiAssetStreamCanvas')) {
        new window.HedzoCharts.MultiAssetStream('multiAssetStreamCanvas');
      }
      if (document.getElementById('terminalChartCanvas')) {
        new window.HedzoCharts.TerminalMiniChart('terminalChartCanvas');
      }
      window.HedzoCharts.initSparklines();
    }
  }

  function initEntranceAnimations() {
    initAllCharts();
  }

  // Initialize immediately if DOM is ready
  initAllCharts();
  window.addEventListener('load', initAllCharts);

});
