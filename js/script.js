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
  }, { threshold: 0.02 });

  document.querySelectorAll('.reveal-on-scroll').forEach(el => revealObserver.observe(el));

  // ==========================================================================
  // 9. NEW REAL-TIME TERMINAL LIST CONTROLLER
  // ==========================================================================
  const terminalSearchInput = document.getElementById('terminalSearchInput');
  const terminalFilterBtn = document.getElementById('terminalFilterBtn');
  const terminalRows = document.querySelectorAll('.terminal-row');

  // Search Filter
  if (terminalSearchInput) {
    terminalSearchInput.addEventListener('input', () => {
      const query = terminalSearchInput.value.toLowerCase().trim();
      terminalRows.forEach(row => {
        const symbol = row.dataset.symbol.toLowerCase();
        const market = row.querySelector('.col-market').textContent.toLowerCase();
        if (symbol.includes(query) || market.includes(query)) {
          row.style.display = '';
        } else {
          row.style.display = 'none';
        }
      });
    });
  }

  // Filter Button Toggle (All -> Positive -> Negative -> All)
  let activeFilterState = 'all'; // all, pos, neg
  if (terminalFilterBtn) {
    terminalFilterBtn.addEventListener('click', () => {
      const btnSpan = terminalFilterBtn.querySelector('span');
      if (activeFilterState === 'all') {
        activeFilterState = 'pos';
        if (btnSpan) btnSpan.textContent = 'Change: +';
        terminalRows.forEach(row => {
          const changeVal = parseFloat(row.querySelector('.col-change').dataset.base);
          row.style.display = changeVal >= 0 ? '' : 'none';
        });
      } else if (activeFilterState === 'pos') {
        activeFilterState = 'neg';
        if (btnSpan) btnSpan.textContent = 'Change: -';
        terminalRows.forEach(row => {
          const changeVal = parseFloat(row.querySelector('.col-change').dataset.base);
          row.style.display = changeVal < 0 ? '' : 'none';
        });
      } else {
        activeFilterState = 'all';
        if (btnSpan) btnSpan.textContent = 'Filter';
        terminalRows.forEach(row => {
          row.style.display = '';
        });
      }
    });
  }

  const ledgerFeedList = document.getElementById('ledgerFeedList');
  const telLatency = document.getElementById('telLatency');
  const telThroughput = document.getElementById('telThroughput');

  function addLedgerExecution(symbol, priceDelta, price) {
    if (!ledgerFeedList) return;
    
    const now = new Date();
    const time = now.toLocaleTimeString('en-US', { hour12: false });
    const side = priceDelta >= 0 ? 'buy' : 'sell';
    const action = priceDelta >= 0 ? 'BUY' : 'SELL';
    
    const shareLots = [100, 200, 400, 500, 1000, 1200, 2500];
    const shares = shareLots[Math.floor(Math.random() * shareLots.length)];

    const item = document.createElement('div');
    item.className = `ledger-item ${side}`;
    item.innerHTML = `
      <span class="ledger-meta">${time} <span class="ledger-symbol">${symbol}</span></span>
      <span class="ledger-action ${side}">${action}</span>
      <span class="ledger-details">${shares} shrs @ $${price}</span>
      <span class="ledger-status font-mono">FILLED</span>
    `;

    ledgerFeedList.insertBefore(item, ledgerFeedList.firstChild);

    while (ledgerFeedList.children.length > 6) {
      ledgerFeedList.removeChild(ledgerFeedList.lastChild);
    }

    if (telLatency) {
      const lat = (Math.random() * 2 + 7.4).toFixed(1);
      telLatency.textContent = `${lat}ms`;
      telLatency.className = lat < 8.5 ? 't-val font-mono text-emerald' : 't-val font-mono text-coral';
    }
    if (telThroughput) {
      const tps = Math.round(14000 + (Math.random() - 0.5) * 600);
      telThroughput.textContent = `${tps.toLocaleString('en-US')} tps`;
    }
  }

  // Populate initial dummy execution logs
  setTimeout(() => {
    const initialStocks = ['NVDA', 'TSLA', 'AAPL', 'MSFT', 'AMZN'];
    for (let i = 0; i < 4; i++) {
      const sym = initialStocks[Math.floor(Math.random() * initialStocks.length)];
      const delta = Math.random() > 0.5 ? 1 : -1;
      const fakePrice = (Math.random() * 300 + 100).toFixed(2);
      addLedgerExecution(sym, delta, fakePrice);
    }
  }, 100);

  // Real-Time Price Fluctuations Simulator
  setInterval(() => {
    if (terminalRows.length === 0) return;
    const randomRow = terminalRows[Math.floor(Math.random() * terminalRows.length)];
    const priceCell = randomRow.querySelector('.col-price');
    const changeCell = randomRow.querySelector('.col-change');
    const path = randomRow.querySelector('.sparkline-svg path');

    if (!priceCell || !changeCell) return;

    const basePrice = parseFloat(priceCell.dataset.base);
    const baseChange = parseFloat(changeCell.dataset.base);

    // Minor random price fluctuation (0.05% to 0.15%)
    const pctChange = (Math.random() * 0.1 + 0.05) * (Math.random() > 0.48 ? 1 : -1);
    const priceDelta = basePrice * (pctChange / 100);
    const newPrice = basePrice + priceDelta;
    const newChange = baseChange + pctChange;

    priceCell.dataset.base = newPrice.toFixed(2);
    changeCell.dataset.base = newChange.toFixed(2);

    priceCell.textContent = `$${newPrice.toFixed(2)}`;
    changeCell.textContent = `${newChange >= 0 ? '+' : ''}${newChange.toFixed(2)}%`;

    // Visual Flash Highlight
    const flashClass = priceDelta >= 0 ? 'flash-green' : 'flash-red';
    priceCell.classList.add(flashClass);
    setTimeout(() => {
      priceCell.classList.remove(flashClass);
    }, 450);

    // Apply color values to change cell
    if (newChange >= 0) {
      changeCell.className = 'col-change text-end font-mono text-emerald';
      const svg = randomRow.querySelector('.sparkline-svg');
      if (svg) {
        svg.className.baseVal = 'sparkline-svg trend-up';
      }
    } else {
      changeCell.className = 'col-change text-end font-mono text-coral';
      const svg = randomRow.querySelector('.sparkline-svg');
      if (svg) {
        svg.className.baseVal = 'sparkline-svg trend-down';
      }
    }

    // Dynamic Sparkline Shift (recalculate path points dynamically for real-time vibe!)
    if (path) {
      const points = path.getAttribute('d').split(' ').filter(p => p.includes(','));
      // Shift all Y coordinates slightly, append a new random Y coordinate at the end
      const newPathPoints = points.map((p, idx) => {
        const [x, y] = p.split(',').map(Number);
        if (idx === points.length - 1) {
          // Last point matches price direction
          const newY = Math.max(1, Math.min(19, y + (priceDelta >= 0 ? -1.5 : 1.5)));
          return `${x},${newY.toFixed(1)}`;
        }
        const nextP = points[idx + 1];
        if (nextP) {
          const nextY = Number(nextP.split(',')[1]);
          return `${x},${nextY.toFixed(1)}`;
        }
        return p;
      });
      path.setAttribute('d', `M 0,${newPathPoints[0].split(',')[1]} ` + newPathPoints.map((p, i) => i === 0 ? '' : `L ${p}`).join(' '));
    }

    // Log this tick as a new execution block trade!
    addLedgerExecution(randomRow.dataset.symbol, priceDelta, newPrice.toFixed(2));
  }, 1600);

  // Simulated Order Execution Toast Alert System
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
  let multiAssetStreamInstance = null;
 
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
       if (document.getElementById('nsMultiStreamCanvas')) {
         multiAssetStreamInstance = new window.HedzoCharts.MultiAssetStream('nsMultiStreamCanvas');
       } else if (document.getElementById('multiAssetStreamCanvas')) {
         multiAssetStreamInstance = new window.HedzoCharts.MultiAssetStream('multiAssetStreamCanvas');
       }
       window.HedzoCharts.initSparklines();
     }
   }
 
   // --- Sentiment Flow Recalibration Controller ---
   const btnRecalibrate = document.getElementById('btnRecalibrate');
   const axialBullPct = document.getElementById('axialBullPct');
   const axialBearPct = document.getElementById('axialBearPct');
   const axialSliderHandle = document.getElementById('axialSliderHandle');
   const matrixRows = document.querySelectorAll('.matrix-row');
 
   function updateOrderFlowBars(bullRatio) {
     matrixRows.forEach(row => {
       const price = row.dataset.price.replace('.', '');
       const buyBar = row.querySelector('.buy-bar');
       const sellBar = row.querySelector('.sell-bar');
       const buyVol = document.getElementById(`vol-buy-${price}`);
       const sellVol = document.getElementById(`vol-sell-${price}`);
 
       // Row ratio has minor deviation from target ratio
       const deviation = (Math.random() - 0.5) * 0.12;
       const rowRatio = Math.max(0.15, Math.min(0.85, bullRatio + deviation));
       const buyPct = Math.round(rowRatio * 100);
       const bearPct = 100 - buyPct;
 
       if (buyBar) buyBar.style.width = `${buyPct}%`;
       if (sellBar) sellBar.style.width = `${bearPct}%`;
 
       // Update volume text metrics
       const buyBTC = (rowRatio * (Math.random() * 2 + 1.2)).toFixed(2);
       const sellBTC = ((1 - rowRatio) * (Math.random() * 2 + 1.2)).toFixed(2);
       if (buyVol) buyVol.textContent = `${buyBTC} BTC`;
       if (sellVol) sellVol.textContent = `${sellBTC} BTC`;
     });
   }
 
   if (btnRecalibrate) {
     btnRecalibrate.addEventListener('click', () => {
       // Randomize bull sentiment ratio (between 44% and 72%)
       const bullRatio = Math.random() * 0.28 + 0.44;
       const bullPct = Math.round(bullRatio * 100);
       const bearPct = 100 - bullPct;
       const netPct = bullPct - bearPct;
 
       // Update indicators
       if (axialBullPct) axialBullPct.textContent = `${bullPct}% BULLISH`;
       if (axialBearPct) axialBearPct.textContent = `${bearPct}% BEARISH`;
       if (axialSliderHandle) {
         axialSliderHandle.style.top = `${100 - bullPct}%`;
         const handleGlow = axialSliderHandle.querySelector('.handle-glow');
         if (handleGlow) {
           handleGlow.style.backgroundColor = bullRatio >= 0.5 ? 'var(--emerald-primary)' : 'var(--coral-primary)';
         }
       }
 
       // Update Net Sentiment values
       const netValueEl = document.getElementById('gaugeNetValue');
       if (netValueEl) {
         animateCounter(netValueEl, netPct, '%', true);
         if (netPct >= 0) {
           netValueEl.className = 'gauge-value font-mono text-emerald';
         } else {
           netValueEl.className = 'gauge-value font-mono text-coral';
         }
       }
 
       // Update radial gauge fill dashoffset
       const gaugeFillBull = document.getElementById('gaugeFillBull');
       if (gaugeFillBull) {
         const circumference = 251.2;
         const offset = circumference * (1 - bullRatio);
         gaugeFillBull.style.strokeDashoffset = offset;
       }
 
       // Update sidebar progress meters
       const statBuySpeed = document.getElementById('statBuySpeed');
       const progressBuy = document.getElementById('progressBuy');
       if (statBuySpeed) animateCounter(statBuySpeed, bullPct, '%');
       if (progressBuy) progressBuy.style.width = `${bullPct}%`;
 
       const statSellSpeed = document.getElementById('statSellSpeed');
       const progressSell = document.getElementById('progressSell');
       if (statSellSpeed) animateCounter(statSellSpeed, bearPct, '%');
       if (progressSell) progressSell.style.width = `${bearPct}%`;
 
       const statBidRate = document.getElementById('statBidRate');
       if (statBidRate) {
         const newRate = Math.round(Math.random() * 200 + 300);
         animateCounter(statBidRate, newRate, ' tx/s');
       }
 
       // Update matrix volume bars
       updateOrderFlowBars(bullRatio);
 
       // Spin the button icon
       const icon = btnRecalibrate.querySelector('i');
       if (icon) {
         icon.style.transform = 'rotate(360deg)';
         setTimeout(() => {
           icon.style.transform = 'none';
         }, 600);
       }
     });
   }
 
   // Live incoming orders activity simulation loop
   function spawnOrderParticle() {
     if (matrixRows.length === 0) return;
     const randomRow = matrixRows[Math.floor(Math.random() * matrixRows.length)];
     const priceStr = randomRow.dataset.price.replace('.', '');
     const track = document.getElementById(`track-${priceStr}`);
     
     if (!track) return;
 
     const side = Math.random() > 0.48 ? 'buy' : 'sell';
     const dot = document.createElement('span');
     dot.className = `order-dot ${side}`;
     track.appendChild(dot);
 
     // Subtly wobble the volume bar for this row to simulate filled orders
     const bar = randomRow.querySelector(side === 'buy' ? '.buy-bar' : '.sell-bar');
     if (bar) {
       const origWidth = bar.style.width;
       const parsed = parseFloat(origWidth) || 50;
       const wobble = (Math.random() * 4 + 2) * (Math.random() > 0.5 ? 1 : -1);
       bar.style.width = `${Math.max(10, Math.min(90, parsed + wobble))}%`;
       setTimeout(() => {
         bar.style.width = origWidth;
       }, 900);
     }
 
     // Clean up particle DOM node after slide animation completes
     setTimeout(() => {
       if (dot.parentNode === track) {
         track.removeChild(dot);
       }
     }, 1500);
   }
 
   // Continuous background activity scheduler
   let activityInterval = null;
   function startOrderFlowActivity() {
     if (activityInterval) clearInterval(activityInterval);
     activityInterval = setInterval(spawnOrderParticle, 700);
   }
   startOrderFlowActivity();

  function animateCounter(element, targetVal, suffix = '', signPrefix = false) {
    if (!element) return;
    const startVal = parseInt(element.textContent.replace('+', '')) || 0;
    const duration = 750; // ms
    const startTime = performance.now();

    function update(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = progress * (2 - progress); // Ease out quad
      const currentVal = Math.round(startVal + (targetVal - startVal) * easeProgress);
      const prefix = (signPrefix && currentVal >= 0) ? '+' : '';
      element.textContent = `${prefix}${currentVal}${suffix}`;

      if (progress < 1) {
        requestAnimationFrame(update);
      }
    }
    requestAnimationFrame(update);
  }

  // --- Correlation Workstation Event Controllers ---
  const streamToggleCheckboxes = document.querySelectorAll('.stream-toggle-chk');
  const sidebarAssetRows = document.querySelectorAll('.sidebar-asset-row');
  const streamFilterButtons = document.querySelectorAll('.stream-filter-btn');

  sidebarAssetRows.forEach(row => {
    row.addEventListener('click', (e) => {
      const chk = row.querySelector('.stream-toggle-chk');
      // Prevent double trigger if checkbox was directly clicked
      if (chk && e.target !== chk && !chk.contains(e.target) && e.target.tagName !== 'LABEL') {
        chk.checked = !chk.checked;
        triggerCheckboxToggle(chk, row);
      }
    });
  });

  streamToggleCheckboxes.forEach(chk => {
    chk.addEventListener('change', () => {
      const row = chk.closest('.sidebar-asset-row');
      triggerCheckboxToggle(chk, row);
    });
  });

  function triggerCheckboxToggle(chk, row) {
    const streamName = chk.dataset.stream;
    const isVisible = chk.checked;

    if (row) {
      if (isVisible) {
        row.classList.add('active');
      } else {
        row.classList.remove('active');
      }
    }

    if (multiAssetStreamInstance) {
      multiAssetStreamInstance.toggleStream(streamName, isVisible);
    }
  }

  streamFilterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      streamFilterButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filterType = btn.dataset.filter;

      if (multiAssetStreamInstance) {
        multiAssetStreamInstance.setFilter(filterType);
      }

      // Sync checkboxes
      streamToggleCheckboxes.forEach(chk => {
        const streamName = chk.dataset.stream;
        const row = chk.closest('.sidebar-asset-row');
        
        let isVisible = true;
        if (filterType === 'crypto') {
          isVisible = (streamName === 'BTC/USD' || streamName === 'ETH/USD');
        } else if (filterType === 'macro') {
          isVisible = (streamName !== 'BTC/USD' && streamName !== 'ETH/USD');
        }

        chk.checked = isVisible;
        if (row) {
          if (isVisible) row.classList.add('active');
          else row.classList.remove('active');
        }
      });
    });
  });

  // --- HEDZO TERMINAL INTERACTIVE LOGIC ---
  function updateTerminalClock() {
    const el = document.getElementById('terminalClock');
    if (!el) return;
    const now = new Date();
    const h = String(now.getUTCHours()).padStart(2, '0');
    const m = String(now.getUTCMinutes()).padStart(2, '0');
    const s = String(now.getUTCSeconds()).padStart(2, '0');
    el.textContent = `${h}:${m}:${s} UTC`;
  }
  updateTerminalClock();
  setInterval(updateTerminalClock, 1000);

  // Watchlist clicks
  const watchlistItems = document.querySelectorAll('.watchlist-item');
  watchlistItems.forEach(item => {
    item.addEventListener('click', () => {
      watchlistItems.forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      const priceVal = item.querySelector('.watchlist-item-data .font-weight-bold');
      const entryInput = document.querySelector('.order-input-field[value*=","]');
      if (priceVal && entryInput) {
        entryInput.value = priceVal.textContent.replace('$', '');
      }
    });
  });

  // BUY / SELL Tab Switcher
  const orderSideBtns = document.querySelectorAll('.order-side-btn');
  const btnPlaceOrder = document.getElementById('btnPlaceOrder');
  orderSideBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      orderSideBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const side = btn.dataset.side || 'BUY';
      if (btnPlaceOrder) {
        btnPlaceOrder.textContent = `[ PLACE ${side} ORDER ]`;
        if (side === 'BUY') {
          btnPlaceOrder.style.background = 'var(--emerald-primary)';
          btnPlaceOrder.style.color = '#040806';
          btnPlaceOrder.style.boxShadow = '0 0 20px rgba(0, 242, 140, 0.3)';
        } else {
          btnPlaceOrder.style.background = 'var(--coral-primary)';
          btnPlaceOrder.style.color = '#FFFFFF';
          btnPlaceOrder.style.boxShadow = '0 0 20px rgba(255, 75, 85, 0.3)';
        }
      }
    });
  });

  // Place Order Toast Trigger
  if (btnPlaceOrder) {
    btnPlaceOrder.addEventListener('click', () => {
      const activeSide = document.querySelector('.order-side-btn.active')?.dataset.side || 'BUY';
      const activeAsset = document.querySelector('.watchlist-item.active')?.dataset.symbol || 'BTC/USD';
      
      let toast = document.querySelector('.terminal-toast');
      if (!toast) {
        toast = document.createElement('div');
        toast.className = 'terminal-toast';
        document.body.appendChild(toast);
      }

      const icon = activeSide === 'BUY' ? '<i class="bi bi-check-circle-fill text-emerald"></i>' : '<i class="bi bi-exclamation-triangle-fill text-coral"></i>';
      toast.innerHTML = `${icon} <span><strong>${activeSide} ORDER EXECUTED:</strong> ${activeAsset} @ Market Price</span>`;
      
      toast.classList.add('show');
      setTimeout(() => {
        toast.classList.remove('show');
      }, 3500);
    });
  }

  function initEntranceAnimations() {
    initAllCharts();
  }

  // Initialize immediately if DOM is ready
  initAllCharts();
  window.addEventListener('load', initAllCharts);

});
