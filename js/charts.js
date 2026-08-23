/* ==========================================================================
   HEDZO UNI — High Performance Chart Engine
   Canvas-based Real-Time Candlestick, Sparkline & Stream Visualization
   ========================================================================== */

(function () {
  'use strict';

  // --- High DPI Canvas Helper ---
  function setupHiDPICanvas(canvas) {
    if (!canvas) return null;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const w = Math.round(rect.width);
    const h = Math.round(rect.height);
    if (w === 0 || h === 0) return null;

    const targetW = Math.round(w * dpr);
    const targetH = Math.round(h * dpr);

    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
    }

    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, width: w, height: h, dpr };
  }

  // --- Data Generator Utilities ---
  function generateCandleData(count, startPrice, volatility, trend = 0.001) {
    const candles = [];
    let currentClose = startPrice;
    const now = Date.now();
    const stepMs = 60 * 1000; // 1 minute intervals

    for (let i = count - 1; i >= 0; i--) {
      const time = new Date(now - i * stepMs);
      const change = (Math.random() - 0.48 + trend) * volatility * currentClose;
      const open = currentClose;
      const close = Math.max(open * 0.5, open + change);
      const high = Math.max(open, close) + Math.random() * volatility * 0.6 * open;
      const low = Math.min(open, close) - Math.random() * volatility * 0.6 * open;
      const volume = Math.floor((Math.random() * 0.8 + 0.2) * 50000);

      candles.push({
        time,
        open,
        high,
        low,
        close,
        volume,
        isBullish: close >= open
      });
      currentClose = close;
    }
    return candles;
  }

  // --- Calculate Exponential Moving Average ---
  function calculateEMA(data, period) {
    const k = 2 / (period + 1);
    const ema = [];
    let prevEMA = data[0].close;
    ema.push(prevEMA);

    for (let i = 1; i < data.length; i++) {
      const currentVal = data[i].close * k + prevEMA * (1 - k);
      ema.push(currentVal);
      prevEMA = currentVal;
    }
    return ema;
  }

  // --- Calculate Bollinger Bands ---
  function calculateBollinger(data, period = 20, multiplier = 2) {
    const bands = [];
    for (let i = 0; i < data.length; i++) {
      if (i < period - 1) {
        bands.push(null);
        continue;
      }
      let sum = 0;
      for (let j = 0; j < period; j++) {
        sum += data[i - j].close;
      }
      const mean = sum / period;
      let varianceSum = 0;
      for (let j = 0; j < period; j++) {
        varianceSum += Math.pow(data[i - j].close - mean, 2);
      }
      const stdDev = Math.sqrt(varianceSum / period);
      bands.push({
        upper: mean + multiplier * stdDev,
        middle: mean,
        lower: mean - multiplier * stdDev
      });
    }
    return bands;
  }

  // ==========================================================================
  // 1. HERO TRADING CHART ENGINE
  // ==========================================================================
  class HeroTradingChart {
    constructor(canvasId) {
      this.canvas = document.getElementById(canvasId);
      if (!this.canvas) return;
      this.candles = generateCandleData(48, 67400, 0.0035, 0.0008);
      this.lastTickTime = Date.now();
      this.hoverX = null;
      this.hoverY = null;
      this.initEvents();
      this.render();
      this.startLiveSimulation();
    }

    initEvents() {
      window.addEventListener('resize', () => this.render());
      this.canvas.addEventListener('mousemove', (e) => {
        const rect = this.canvas.getBoundingClientRect();
        this.hoverX = e.clientX - rect.left;
        this.hoverY = e.clientY - rect.top;
        this.render();
      });
      this.canvas.addEventListener('mouseleave', () => {
        this.hoverX = null;
        this.hoverY = null;
        this.render();
      });
    }

    startLiveSimulation() {
      setInterval(() => {
        // Continuous price tick on last candle
        const last = this.candles[this.candles.length - 1];
        const tick = (Math.random() - 0.47) * 22;
        last.close += tick;
        last.high = Math.max(last.high, last.close);
        last.low = Math.min(last.low, last.close);
        last.isBullish = last.close >= last.open;
        last.volume += Math.floor(Math.random() * 12);

        // Periodically push a new candle
        if (Date.now() - this.lastTickTime > 2800) {
          this.candles.shift();
          const newOpen = last.close;
          const newClose = newOpen + (Math.random() - 0.46) * 35;
          this.candles.push({
            time: new Date(),
            open: newOpen,
            close: newClose,
            high: Math.max(newOpen, newClose) + Math.random() * 15,
            low: Math.min(newOpen, newClose) - Math.random() * 15,
            volume: Math.floor(Math.random() * 20000 + 5000),
            isBullish: newClose >= newOpen
          });
          this.lastTickTime = Date.now();
        }

        // Update live price readout in hero badge
        const priceEl = document.querySelector('.live-price-main');
        if (priceEl) {
          priceEl.textContent = `$${last.close.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }

        this.render();
      }, 150);
    }

    render() {
      const setup = setupHiDPICanvas(this.canvas);
      if (!setup) return;
      const { ctx, width, height } = setup;

      ctx.clearRect(0, 0, width, height);

      const padding = { top: 20, right: 60, bottom: 40, left: 10 };
      const chartW = width - padding.left - padding.right;
      const chartH = height - padding.top - padding.bottom;
      const volumeH = chartH * 0.22;
      const candleAreaH = chartH * 0.74;

      // Min/Max Price calculation
      let minPrice = Infinity;
      let maxPrice = -Infinity;
      let maxVol = 0;

      this.candles.forEach(c => {
        if (c.low < minPrice) minPrice = c.low;
        if (c.high > maxPrice) maxPrice = c.high;
        if (c.volume > maxVol) maxVol = c.volume;
      });

      const priceRange = (maxPrice - minPrice) || 1;
      const priceToY = (p) => padding.top + candleAreaH - ((p - minPrice) / priceRange) * candleAreaH;

      // Draw Grid Lines & Price Axis
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      const gridRows = 4;
      for (let i = 0; i <= gridRows; i++) {
        const y = padding.top + (candleAreaH / gridRows) * i;
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(width - padding.right, y);
        ctx.stroke();

        const priceLabel = maxPrice - (i / gridRows) * priceRange;
        ctx.fillStyle = '#5A6A64';
        ctx.font = '10px "JetBrains Mono", monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`$${priceLabel.toFixed(1)}`, width - padding.right + 6, y + 3);
      }

      // Draw Candlesticks & Volume
      const candleCount = this.candles.length;
      const slotWidth = chartW / candleCount;
      const candleWidth = Math.max(2, slotWidth * 0.65);

      const ema20 = calculateEMA(this.candles, 14);

      // Volume Bars
      this.candles.forEach((c, idx) => {
        const x = padding.left + idx * slotWidth + slotWidth / 2;
        const vH = (c.volume / maxVol) * volumeH;
        const vY = height - padding.bottom - vH;

        ctx.fillStyle = c.isBullish ? 'rgba(0, 242, 140, 0.22)' : 'rgba(255, 75, 85, 0.22)';
        ctx.fillRect(x - candleWidth / 2, vY, candleWidth, vH);
      });

      // Moving Average Line
      ctx.beginPath();
      ctx.strokeStyle = '#00F28C';
      ctx.lineWidth = 2;
      ctx.shadowColor = 'rgba(0, 242, 140, 0.4)';
      ctx.shadowBlur = 8;
      this.candles.forEach((c, idx) => {
        const x = padding.left + idx * slotWidth + slotWidth / 2;
        const y = priceToY(ema20[idx]);
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.shadowBlur = 0; // reset

      // Draw Candles & Wicks
      this.candles.forEach((c, idx) => {
        const x = padding.left + idx * slotWidth + slotWidth / 2;
        const openY = priceToY(c.open);
        const closeY = priceToY(c.close);
        const highY = priceToY(c.high);
        const lowY = priceToY(c.low);

        const isGreen = c.isBullish;
        const color = isGreen ? '#00F28C' : '#FF4B55';
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = 1.2;

        // Wick
        ctx.beginPath();
        ctx.moveTo(x, highY);
        ctx.lineTo(x, lowY);
        ctx.stroke();

        // Body
        const topY = Math.min(openY, closeY);
        const bodyH = Math.max(2, Math.abs(closeY - openY));
        ctx.fillRect(x - candleWidth / 2, topY, candleWidth, bodyH);

        // Buy/Sell Marker Sample on extremes
        if (idx === 14) {
          this.drawMarker(ctx, x, highY - 12, 'SELL', '#FF4B55');
        } else if (idx === 34) {
          this.drawMarker(ctx, x, lowY + 18, 'BUY', '#00F28C');
        }
      });

      // Draw Crosshair if hovering
      if (this.hoverX !== null && this.hoverY !== null && this.hoverX >= padding.left && this.hoverX <= width - padding.right) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.setLineDash([4, 4]);
        ctx.lineWidth = 1;

        // Vertical
        ctx.beginPath();
        ctx.moveTo(this.hoverX, padding.top);
        ctx.lineTo(this.hoverX, height - padding.bottom);
        ctx.stroke();

        // Horizontal
        ctx.beginPath();
        ctx.moveTo(padding.left, this.hoverY);
        ctx.lineTo(width - padding.right, this.hoverY);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    drawMarker(ctx, x, y, label, color) {
      ctx.save();
      ctx.fillStyle = color;
      ctx.font = 'bold 8px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.beginPath();
      if (label === 'BUY') {
        ctx.moveTo(x, y - 6);
        ctx.lineTo(x - 4, y);
        ctx.lineTo(x + 4, y);
      } else {
        ctx.moveTo(x, y + 6);
        ctx.lineTo(x - 4, y);
        ctx.lineTo(x + 4, y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.fillText(label, x, label === 'BUY' ? y + 8 : y - 4);
      ctx.restore();
    }
  }

  // ==========================================================================
  // 2. MAIN ANALYTICS DASHBOARD CHART ENGINE
  // ==========================================================================
  class MainAnalyticsChart {
    constructor(canvasId) {
      this.canvas = document.getElementById(canvasId);
      if (!this.canvas) return;

      this.currentAsset = 'BTC/USD';
      this.currentTimeframe = '1D';
      this.activeIndicators = {
        ema: true,
        bollinger: false,
        volume: true,
        rsi: false
      };

      this.assetConfigs = {
        'BTC/USD': { base: 67842.20, vol: 0.004, trend: 0.001 },
        'ETH/USD': { base: 3482.90, vol: 0.0055, trend: 0.0006 },
        'NASDAQ': { base: 18492.10, vol: 0.0025, trend: 0.0009 },
        'NVDA': { base: 128.45, vol: 0.006, trend: 0.0012 },
        'GOLD': { base: 2412.80, vol: 0.0018, trend: 0.0003 },
        'EUR/USD': { base: 1.0924, vol: 0.0012, trend: -0.0001 }
      };

      this.loadData();
      this.initEvents();
      this.render();
      this.startLiveTick();
    }

    loadData() {
      const cfg = this.assetConfigs[this.currentAsset] || this.assetConfigs['BTC/USD'];
      let count = 60;
      if (this.currentTimeframe === '1H') count = 40;
      else if (this.currentTimeframe === '4H') count = 50;
      else if (this.currentTimeframe === '1D') count = 65;
      else if (this.currentTimeframe === '1W') count = 80;
      else if (this.currentTimeframe === '1M') count = 90;

      this.candles = generateCandleData(count, cfg.base, cfg.vol, cfg.trend);
    }

    setAsset(asset) {
      this.currentAsset = asset;
      this.loadData();
      this.updateSidebarStats();
      this.render();
    }

    setTimeframe(tf) {
      this.currentTimeframe = tf;
      this.loadData();
      this.render();
    }

    toggleIndicator(ind) {
      if (this.activeIndicators.hasOwnProperty(ind)) {
        this.activeIndicators[ind] = !this.activeIndicators[ind];
        this.render();
      }
    }

    initEvents() {
      window.addEventListener('resize', () => this.render());

      this.canvas.addEventListener('mousemove', (e) => {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        this.updateHUD(mouseX);
      });
    }

    startLiveTick() {
      setInterval(() => {
        const last = this.candles[this.candles.length - 1];
        const delta = (Math.random() - 0.48) * (last.close * 0.0005);
        last.close += delta;
        last.high = Math.max(last.high, last.close);
        last.low = Math.min(last.low, last.close);
        last.isBullish = last.close >= last.open;
        this.render();
      }, 300);
    }

    updateHUD(mouseX) {
      const padding = { left: 10, right: 70 };
      const chartW = this.canvas.clientWidth - padding.left - padding.right;
      const slotWidth = chartW / this.candles.length;
      const idx = Math.min(this.candles.length - 1, Math.max(0, Math.floor((mouseX - padding.left) / slotWidth)));
      const c = this.candles[idx];
      if (!c) return;

      const openEl = document.getElementById('hudOpen');
      const highEl = document.getElementById('hudHigh');
      const lowEl = document.getElementById('hudLow');
      const closeEl = document.getElementById('hudClose');
      const volEl = document.getElementById('hudVol');

      if (openEl) openEl.textContent = c.open.toFixed(2);
      if (highEl) highEl.textContent = c.high.toFixed(2);
      if (lowEl) lowEl.textContent = c.low.toFixed(2);
      if (closeEl) closeEl.textContent = c.close.toFixed(2);
      if (volEl) volEl.textContent = (c.volume / 1000).toFixed(1) + 'K';
    }

    updateSidebarStats() {
      const last = this.candles[this.candles.length - 1];
      const priceEl = document.getElementById('analyticsPrice');
      const changeEl = document.getElementById('analyticsChange');
      const highEl = document.getElementById('analyticsHigh');
      const lowEl = document.getElementById('analyticsLow');

      if (priceEl) priceEl.textContent = `$${last.close.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
      if (changeEl) changeEl.textContent = '+4.82%';
      if (highEl) highEl.textContent = `$${(last.close * 1.025).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
      if (lowEl) lowEl.textContent = `$${(last.close * 0.975).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    }

    render() {
      const setup = setupHiDPICanvas(this.canvas);
      if (!setup) return;
      const { ctx, width, height } = setup;

      ctx.clearRect(0, 0, width, height);

      const padding = { top: 20, right: 70, bottom: 30, left: 10 };
      const chartW = width - padding.left - padding.right;
      const chartH = height - padding.top - padding.bottom;
      const candleAreaH = this.activeIndicators.volume ? chartH * 0.76 : chartH;
      const volumeH = chartH * 0.2;

      let minPrice = Infinity;
      let maxPrice = -Infinity;
      let maxVol = 0;

      this.candles.forEach(c => {
        if (c.low < minPrice) minPrice = c.low;
        if (c.high > maxPrice) maxPrice = c.high;
        if (c.volume > maxVol) maxVol = c.volume;
      });

      const priceRange = (maxPrice - minPrice) || 1;
      const priceToY = (p) => padding.top + candleAreaH - ((p - minPrice) / priceRange) * candleAreaH;

      // Grid Lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 5; i++) {
        const y = padding.top + (candleAreaH / 5) * i;
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(width - padding.right, y);
        ctx.stroke();

        const pLabel = maxPrice - (i / 5) * priceRange;
        ctx.fillStyle = '#5A6A64';
        ctx.font = '10px "JetBrains Mono", monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`$${pLabel.toFixed(1)}`, width - padding.right + 8, y + 3);
      }

      const candleCount = this.candles.length;
      const slotWidth = chartW / candleCount;
      const candleWidth = Math.max(2, slotWidth * 0.7);

      // 1. Bollinger Bands (Optional)
      if (this.activeIndicators.bollinger) {
        const bb = calculateBollinger(this.candles, 18, 2);
        ctx.fillStyle = 'rgba(0, 242, 140, 0.04)';
        ctx.beginPath();
        // Upper line forward
        let started = false;
        bb.forEach((b, idx) => {
          if (!b) return;
          const x = padding.left + idx * slotWidth + slotWidth / 2;
          const y = priceToY(b.upper);
          if (!started) { ctx.moveTo(x, y); started = true; }
          else ctx.lineTo(x, y);
        });
        // Lower line backward
        for (let idx = bb.length - 1; idx >= 0; idx--) {
          const b = bb[idx];
          if (!b) continue;
          const x = padding.left + idx * slotWidth + slotWidth / 2;
          const y = priceToY(b.lower);
          ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();

        // Stroke Bollinger Lines
        ctx.strokeStyle = 'rgba(0, 242, 140, 0.25)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        bb.forEach((b, idx) => {
          if (!b) return;
          const x = padding.left + idx * slotWidth + slotWidth / 2;
          const y = priceToY(b.upper);
          ctx.lineTo(x, y);
        });
        ctx.stroke();
      }

      // 2. Volume Bars
      if (this.activeIndicators.volume) {
        this.candles.forEach((c, idx) => {
          const x = padding.left + idx * slotWidth + slotWidth / 2;
          const vH = (c.volume / maxVol) * volumeH;
          const vY = height - padding.bottom - vH;
          ctx.fillStyle = c.isBullish ? 'rgba(0, 242, 140, 0.25)' : 'rgba(255, 75, 85, 0.25)';
          ctx.fillRect(x - candleWidth / 2, vY, candleWidth, vH);
        });
      }

      // 3. EMA 20 & 50
      if (this.activeIndicators.ema) {
        const ema20 = calculateEMA(this.candles, 14);
        ctx.beginPath();
        ctx.strokeStyle = '#00F28C';
        ctx.lineWidth = 1.8;
        this.candles.forEach((c, idx) => {
          const x = padding.left + idx * slotWidth + slotWidth / 2;
          const y = priceToY(ema20[idx]);
          if (idx === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();
      }

      // 4. Candlesticks
      this.candles.forEach((c, idx) => {
        const x = padding.left + idx * slotWidth + slotWidth / 2;
        const openY = priceToY(c.open);
        const closeY = priceToY(c.close);
        const highY = priceToY(c.high);
        const lowY = priceToY(c.low);

        const color = c.isBullish ? '#00F28C' : '#FF4B55';
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = 1.2;

        // Wick
        ctx.beginPath();
        ctx.moveTo(x, highY);
        ctx.lineTo(x, lowY);
        ctx.stroke();

        // Body
        const topY = Math.min(openY, closeY);
        const bodyH = Math.max(2, Math.abs(closeY - openY));
        ctx.fillRect(x - candleWidth / 2, topY, candleWidth, bodyH);
      });
    }
  }

  // ==========================================================================
  // 3. MINI SPARKLINE CHARTS
  // ==========================================================================
  function initSparklines() {
    const canvases = document.querySelectorAll('.sparkline-canvas');
    canvases.forEach(canvas => {
      const isPositive = canvas.dataset.trend !== 'negative';
      const color = isPositive ? '#00F28C' : '#FF4B55';
      const fillGradient = isPositive ? 'rgba(0, 242, 140, 0.12)' : 'rgba(255, 75, 85, 0.12)';

      const points = [];
      let val = 50;
      for (let i = 0; i < 20; i++) {
        val += (Math.random() - (isPositive ? 0.42 : 0.58)) * 8;
        points.push(val);
      }

      function draw() {
        const setup = setupHiDPICanvas(canvas);
        if (!setup) return;
        const { ctx, width, height } = setup;

        const min = Math.min(...points);
        const max = Math.max(...points);
        const range = max - min || 1;

        const getY = (v) => height - 6 - ((v - min) / range) * (height - 12);
        const step = width / (points.length - 1);

        // Path
        ctx.clearRect(0, 0, width, height);

        // Gradient Fill
        ctx.beginPath();
        ctx.moveTo(0, height);
        points.forEach((p, i) => {
          ctx.lineTo(i * step, getY(p));
        });
        ctx.lineTo(width, height);
        ctx.closePath();
        ctx.fillStyle = fillGradient;
        ctx.fill();

        // Stroke
        ctx.beginPath();
        points.forEach((p, i) => {
          const x = i * step;
          const y = getY(p);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.8;
        ctx.stroke();

        // Last Pulsing Dot
        const lastX = width;
        const lastY = getY(points[points.length - 1]);
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(lastX, lastY, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      draw();
      window.addEventListener('resize', draw);
    });
  }

  // ==========================================================================
  // 4. MULTI-ASSET STREAM WAVE ("Markets Never Sleep")
  // ==========================================================================
  class MultiAssetStream {
    constructor(canvasId) {
      this.canvas = document.getElementById(canvasId);
      if (!this.canvas) return;

      this.streams = [
        { name: 'BTC/USD', color: '#00F28C', offset: 0, speed: 0.02, amp: 28, freq: 0.015, yBase: 0.25, visible: true },
        { name: 'ETH/USD', color: '#46FFA7', offset: 1.5, speed: 0.018, amp: 22, freq: 0.018, yBase: 0.42, visible: true },
        { name: 'NASDAQ', color: '#00B86B', offset: 3.2, speed: 0.024, amp: 18, freq: 0.012, yBase: 0.58, visible: true },
        { name: 'S&P 500', color: '#80FFC4', offset: 4.8, speed: 0.015, amp: 16, freq: 0.014, yBase: 0.72, visible: true },
        { name: 'GOLD', color: '#FFD250', offset: 2.1, speed: 0.012, amp: 14, freq: 0.01, yBase: 0.85, visible: true }
      ];

      this.tick = 0;
      this.animate();
    }

    toggleStream(name, isVisible) {
      const stream = this.streams.find(s => s.name === name);
      if (stream) {
        stream.visible = isVisible;
      }
    }

    setFilter(filterType) {
      this.streams.forEach(stream => {
        if (filterType === 'all') {
          stream.visible = true;
        } else if (filterType === 'crypto') {
          stream.visible = (stream.name === 'BTC/USD' || stream.name === 'ETH/USD');
        } else if (filterType === 'macro') {
          stream.visible = (stream.name !== 'BTC/USD' && stream.name !== 'ETH/USD');
        }
      });
    }

    animate() {
      const setup = setupHiDPICanvas(this.canvas);
      if (setup) {
        const { ctx, width, height } = setup;
        ctx.clearRect(0, 0, width, height);

        // Ambient Grid
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.lineWidth = 1;
        const gridGap = 40;
        for (let x = 0; x < width; x += gridGap) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
        }
        for (let y = 0; y < height; y += gridGap) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }

        // Draw each streaming market wave
        this.streams.forEach(stream => {
          if (stream.visible === false) return; // Skip if hidden

          const centerY = height * stream.yBase;
          ctx.beginPath();
          for (let x = 0; x <= width; x += 4) {
            const waveY = centerY + Math.sin(x * stream.freq + this.tick * stream.speed + stream.offset) * stream.amp
                                  + Math.cos(x * stream.freq * 0.5 + this.tick * stream.speed * 0.8) * (stream.amp * 0.4);
            if (x === 0) ctx.moveTo(x, waveY);
            else ctx.lineTo(x, waveY);
          }
          // Wide glow stroke
          ctx.strokeStyle = stream.color;
          ctx.lineWidth = 5.5;
          ctx.globalAlpha = 0.15;
          ctx.stroke();

          // Sharp core stroke
          ctx.lineWidth = 1.8;
          ctx.globalAlpha = 1.0;
          ctx.stroke();

          // Head glowing particle
          const headX = width - 8;
          const headY = centerY + Math.sin(headX * stream.freq + this.tick * stream.speed + stream.offset) * stream.amp
                                + Math.cos(headX * stream.freq * 0.5 + this.tick * stream.speed * 0.8) * (stream.amp * 0.4);
          ctx.fillStyle = stream.color;
          ctx.beginPath();
          ctx.arc(headX, headY, 4, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      this.tick++;
      requestAnimationFrame(() => this.animate());
    }
  }

  // ==========================================================================
  // 5. HERO BACKGROUND TECHNICAL TRADING GRID & DATA-FLOW
  // ==========================================================================
  class HeroBackgroundGrid {
    constructor(canvasId) {
      this.canvas = document.getElementById(canvasId);
      if (!this.canvas) return;

      this.cellSize = 48; // Medium-sized clean square cells
      this.cellW = this.cellSize;
      this.cellH = this.cellSize;
      this.pulses = [];
      this.nodeRipples = [];
      this.pulseCount = 14; // Minimal & premium density

      this.initNetwork();
      window.addEventListener('resize', () => this.initNetwork());
      this.animate();
    }

    initNetwork() {
      const rect = this.canvas.getBoundingClientRect();
      this.width = rect.width || window.innerWidth;
      this.height = rect.height || window.innerHeight;

      this.cols = Math.ceil(this.width / this.cellSize) + 1;
      this.rows = Math.ceil(this.height / this.cellSize) + 1;

      this.pulses = [];
      for (let i = 0; i < this.pulseCount; i++) {
        this.pulses.push(this.generateGridPath(true));
      }
    }

    generateGridPath(randomizeInitialDist = false) {
      // Waypoints are integer [col, row] coordinates strictly on the square grid
      const waypoints = [];
      
      // Choose starting edge: 0=Left, 1=Right, 2=Top, 3=Bottom
      const startEdge = Math.floor(Math.random() * 4);
      let currentCol, currentRow;

      if (startEdge === 0) { // Start Left
        currentCol = -1;
        currentRow = Math.floor(Math.random() * (this.rows - 1)) + 1;
      } else if (startEdge === 1) { // Start Right
        currentCol = this.cols + 1;
        currentRow = Math.floor(Math.random() * (this.rows - 1)) + 1;
      } else if (startEdge === 2) { // Start Top
        currentCol = Math.floor(Math.random() * (this.cols - 1)) + 1;
        currentRow = -1;
      } else { // Start Bottom
        currentCol = Math.floor(Math.random() * (this.cols - 1)) + 1;
        currentRow = this.rows + 1;
      }

      waypoints.push({ col: currentCol, row: currentRow });

      // Generate 2 to 4 segments with 90° turns strictly on grid lines
      const numTurns = Math.floor(Math.random() * 3) + 2; // 2 to 4 segments
      let isHorizontal = (startEdge === 0 || startEdge === 1);

      for (let t = 0; t < numTurns; t++) {
        if (isHorizontal) {
          // Move horizontally along current row
          let nextCol = Math.floor(Math.random() * (this.cols + 1));
          if (t === numTurns - 1) {
            nextCol = currentCol < this.cols / 2 ? this.cols + 1 : -1;
          }
          currentCol = nextCol;
        } else {
          // Move vertically along current column
          let nextRow = Math.floor(Math.random() * (this.rows + 1));
          if (t === numTurns - 1) {
            nextRow = currentRow < this.rows / 2 ? this.rows + 1 : -1;
          }
          currentRow = nextRow;
        }

        waypoints.push({ col: currentCol, row: currentRow });
        isHorizontal = !isHorizontal; // 90° turn
      }

      // Convert grid coordinates to pixel segments aligned to exact grid coordinates
      const segments = [];
      let totalLength = 0;

      for (let i = 0; i < waypoints.length - 1; i++) {
        const x1 = Math.round(waypoints[i].col * this.cellSize) + 0.5;
        const y1 = Math.round(waypoints[i].row * this.cellSize) + 0.5;
        const x2 = Math.round(waypoints[i + 1].col * this.cellSize) + 0.5;
        const y2 = Math.round(waypoints[i + 1].row * this.cellSize) + 0.5;
        const len = Math.hypot(x2 - x1, y2 - y1);

        if (len > 0) {
          segments.push({
            x1, y1, x2, y2,
            len,
            startDist: totalLength,
            endDist: totalLength + len,
            dx: (x2 - x1) / len,
            dy: (y2 - y1) / len
          });
          totalLength += len;
        }
      }

      const speed = Math.random() * 0.7 + 0.85; // 0.85px - 1.55px/frame
      const pulseLen = Math.random() * 50 + 65; // 65px - 115px beam length
      const currentDist = randomizeInitialDist ? Math.random() * totalLength : 0;

      return {
        segments,
        totalLength,
        speed,
        pulseLen,
        currentDist,
        lastTurnIndex: -1
      };
    }

    triggerNodeRipple(x, y) {
      if (this.nodeRipples.length > 18) return;
      this.nodeRipples.push({
        x,
        y,
        radius: 1.5,
        maxRadius: 5.5,
        alpha: 0.65
      });
    }

    getPosAtDist(pulse, dist) {
      if (dist <= 0) {
        const s = pulse.segments[0];
        return { x: s.x1, y: s.y1 };
      }
      if (dist >= pulse.totalLength) {
        const s = pulse.segments[pulse.segments.length - 1];
        return { x: s.x2, y: s.y2 };
      }
      for (const s of pulse.segments) {
        if (dist >= s.startDist && dist <= s.endDist) {
          const t = (dist - s.startDist) / s.len;
          return {
            x: s.x1 + (s.x2 - s.x1) * t,
            y: s.y1 + (s.y2 - s.y1) * t
          };
        }
      }
      const last = pulse.segments[pulse.segments.length - 1];
      return { x: last.x2, y: last.y2 };
    }

    animate() {
      const setup = setupHiDPICanvas(this.canvas);
      if (setup) {
        const { ctx, width, height } = setup;
        
        // Dynamically sync grid if dimensions changed or were 0 on initial construct
        if (width !== this.width || height !== this.height || !this.cols || this.cols < 3) {
          this.width = width;
          this.height = height;
          this.cols = Math.ceil(width / this.cellSize) + 1;
          this.rows = Math.ceil(height / this.cellSize) + 1;
          this.pulses = [];
          for (let i = 0; i < this.pulseCount; i++) {
            this.pulses.push(this.generateGridPath(true));
          }
        }

        ctx.clearRect(0, 0, width, height);

        // 1. Draw Clean Technical Grid with Subtle Center Fade
        ctx.lineWidth = 1;

        // Horizontal Grid Lines (Clean edge-to-edge, softer in center)
        for (let r = 0; r <= this.rows; r++) {
          const y = Math.round(r * this.cellSize) + 0.5;
          const hGrad = ctx.createLinearGradient(0, y, width, y);
          hGrad.addColorStop(0, 'rgba(180, 205, 195, 0.038)');
          hGrad.addColorStop(0.2, 'rgba(180, 205, 195, 0.032)');
          hGrad.addColorStop(0.5, 'rgba(180, 205, 195, 0.016)'); // Softer behind center text
          hGrad.addColorStop(0.8, 'rgba(180, 205, 195, 0.032)');
          hGrad.addColorStop(1, 'rgba(180, 205, 195, 0.038)');
          
          ctx.strokeStyle = hGrad;
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }

        // Vertical Grid Lines (Clean top-to-bottom, softer in center)
        for (let c = 0; c <= this.cols; c++) {
          const x = Math.round(c * this.cellSize) + 0.5;
          const vGrad = ctx.createLinearGradient(x, 0, x, height);
          vGrad.addColorStop(0, 'rgba(180, 205, 195, 0.034)');
          vGrad.addColorStop(0.45, 'rgba(180, 205, 195, 0.016)'); // Softer behind center text
          vGrad.addColorStop(1, 'rgba(180, 205, 195, 0.034)');

          ctx.strokeStyle = vGrad;
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
        }

        // Subtle Technical Micro Junction Points
        for (let r = 0; r <= this.rows; r += 2) {
          const y = Math.round(r * this.cellSize) + 0.5;
          for (let c = 0; c <= this.cols; c += 2) {
            const x = Math.round(c * this.cellSize) + 0.5;
            ctx.fillStyle = 'rgba(0, 242, 140, 0.08)';
            ctx.beginPath();
            ctx.arc(x, y, 0.8, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // 2. Draw & Update Glowing Data Pulses Travelling Directly ON Grid Lines
        this.pulses.forEach((pulse, idx) => {
          pulse.currentDist += pulse.speed;

          // Respawn if pulse completed its grid path
          if (pulse.currentDist > pulse.totalLength + pulse.pulseLen) {
            this.pulses[idx] = this.generateGridPath(false);
            return;
          }

          const headDist = pulse.currentDist;
          const tailDist = Math.max(0, headDist - pulse.pulseLen);

          // Check if head reached a 90-degree intersection turn point
          for (let segIdx = 0; segIdx < pulse.segments.length - 1; segIdx++) {
            const s = pulse.segments[segIdx];
            if (segIdx !== pulse.lastTurnIndex && Math.abs(headDist - s.endDist) < pulse.speed * 2) {
              pulse.lastTurnIndex = segIdx;
              this.triggerNodeRipple(s.x2, s.y2);
              break;
            }
          }

          // Draw active pulse segments directly ON the grid lines
          for (const s of pulse.segments) {
            if (s.endDist < tailDist || s.startDist > headDist) continue;

            const segHeadDist = Math.min(headDist, s.endDist);
            const segTailDist = Math.max(tailDist, s.startDist);

            const t1 = (segTailDist - s.startDist) / s.len;
            const t2 = (segHeadDist - s.startDist) / s.len;

            const startX = s.x1 + (s.x2 - s.x1) * t1;
            const startY = s.y1 + (s.y2 - s.y1) * t1;
            const endX = s.x1 + (s.x2 - s.x1) * t2;
            const endY = s.y1 + (s.y2 - s.y1) * t2;

            // Gradient light trail along the grid line (illuminates the grid line)
            const segDist = Math.hypot(endX - startX, endY - startY);
            if (segDist > 0.5) {
              const grad = ctx.createLinearGradient(startX, startY, endX, endY);
              grad.addColorStop(0, 'rgba(0, 242, 140, 0)');
              grad.addColorStop(0.5, 'rgba(0, 242, 140, 0.45)');
              grad.addColorStop(1, '#00F28C');
              ctx.strokeStyle = grad;
            } else {
              ctx.strokeStyle = '#00F28C';
            }

            ctx.lineWidth = 1.8;
            ctx.shadowColor = 'rgba(0, 242, 140, 0.9)';
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, endY);
            ctx.stroke();
            ctx.shadowBlur = 0;
          }

          // Glowing data point head
          if (headDist <= pulse.totalLength) {
            const head = this.getPosAtDist(pulse, headDist);
            ctx.fillStyle = '#00F28C';
            ctx.shadowColor = '#00F28C';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(head.x, head.y, 2.5, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(head.x, head.y, 1.2, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
          }
        });

        // 3. Draw & Update Intersection Node Ripples
        for (let i = this.nodeRipples.length - 1; i >= 0; i--) {
          const ripple = this.nodeRipples[i];
          ripple.radius += 0.2;
          ripple.alpha -= 0.032;

          if (ripple.alpha <= 0 || ripple.radius >= ripple.maxRadius) {
            this.nodeRipples.splice(i, 1);
            continue;
          }

          ctx.strokeStyle = `rgba(0, 242, 140, ${ripple.alpha})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
          ctx.stroke();

          ctx.fillStyle = `rgba(255, 255, 255, ${ripple.alpha * 0.8})`;
          ctx.beginPath();
          ctx.arc(ripple.x, ripple.y, 1.2, 0, Math.PI * 2);
        }
      }

      requestAnimationFrame(() => this.animate());
    }
  }

  // ==========================================================================
  // 6. HERO MINIMAL CANDLESTICK VISUALIZATION
  // ==========================================================================
  class HeroMinimalCandles {
    constructor(canvasId) {
      this.canvas = document.getElementById(canvasId);
      if (!this.canvas) return;

      // Pattern: 1 Red (bear), 2 Greens (bull), 1 Red, 2 Greens...
      this.pattern = ['bear', 'bull', 'bull'];
      this.spawnIndex = 0;

      // Initial 14 stylized floating candlesticks (1 Red, 2 Greens pattern)
      this.candles = [
        { type: 'bear', h: 44, targetH: 44, yOffset: 12, wickTop: 14, wickBottom: 16, phase: 0 },
        { type: 'bull', h: 58, targetH: 58, yOffset: -4, wickTop: 18, wickBottom: 22, phase: 0.5 },
        { type: 'bull', h: 72, targetH: 72, yOffset: -18, wickTop: 24, wickBottom: 26, phase: 1.1 },
        { type: 'bear', h: 46, targetH: 46, yOffset: -8, wickTop: 16, wickBottom: 18, phase: 1.7 },
        { type: 'bull', h: 52, targetH: 52, yOffset: -2, wickTop: 16, wickBottom: 20, phase: 2.3 },
        { type: 'bull', h: 68, targetH: 68, yOffset: -15, wickTop: 22, wickBottom: 25, phase: 2.9 },
        { type: 'bear', h: 42, targetH: 42, yOffset: 6, wickTop: 14, wickBottom: 16, phase: 3.4 },
        { type: 'bull', h: 56, targetH: 56, yOffset: -6, wickTop: 18, wickBottom: 22, phase: 4.0 },
        { type: 'bull', h: 76, targetH: 76, yOffset: -22, wickTop: 26, wickBottom: 28, phase: 4.6 },
        { type: 'bear', h: 40, targetH: 40, yOffset: 10, wickTop: 14, wickBottom: 16, phase: 5.2 },
        { type: 'bull', h: 62, targetH: 62, yOffset: -10, wickTop: 20, wickBottom: 24, phase: 5.8 },
        { type: 'bull', h: 80, targetH: 80, yOffset: -25, wickTop: 26, wickBottom: 30, phase: 6.4 },
        { type: 'bear', h: 48, targetH: 48, yOffset: 4, wickTop: 16, wickBottom: 18, phase: 7.0 },
        { type: 'bull', h: 66, targetH: 66, yOffset: -12, wickTop: 22, wickBottom: 25, phase: 7.6 }
      ];

      this.tick = 0;
      this.activeTickY = 0;
      this.mousePos = { x: -1000, y: -1000 };

      this.initEvents();
      this.startLiveSimulation();
      this.animate();
    }

    initEvents() {
      this.canvas.addEventListener('mousemove', (e) => {
        const rect = this.canvas.getBoundingClientRect();
        this.mousePos = {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        };
      });
      this.canvas.addEventListener('mouseleave', () => {
        this.mousePos = { x: -1000, y: -1000 };
      });
    }

    startLiveSimulation() {
      // 1. Gentle live price tick on active candle (250ms interval)
      setInterval(() => {
        const last = this.candles[this.candles.length - 1];
        if (!last) return;

        const delta = (Math.random() - 0.47) * 2.8;
        last.targetH = Math.max(22, Math.min(88, last.targetH + delta));
        last.wickTop = Math.max(10, Math.min(32, last.wickTop + (Math.random() - 0.48) * 1.5));
        last.wickBottom = Math.max(10, Math.min(32, last.wickBottom + (Math.random() - 0.48) * 1.5));

        // Subtly modulate a random middle candle
        const randomIdx = Math.floor(Math.random() * (this.candles.length - 2)) + 1;
        const midCandle = this.candles[randomIdx];
        if (midCandle && Math.random() > 0.4) {
          midCandle.targetH = Math.max(24, Math.min(78, midCandle.targetH + (Math.random() - 0.5) * 1.8));
        }
      }, 250);

      // 2. Periodic new candle spawn maintaining the 1 Red, 2 Greens rhythm (every 5.2s)
      setInterval(() => {
        this.candles.shift();

        this.spawnIndex++;
        const nextType = this.pattern[this.spawnIndex % 3];
        const isBull = nextType === 'bull';
        const prev = this.candles[this.candles.length - 1];
        const newOffset = Math.max(-26, Math.min(22, (prev ? prev.yOffset : 0) + (isBull ? -6 : 6) + (Math.random() - 0.5) * 6));
        const newTargetH = Math.floor(Math.random() * 46 + 34);

        this.candles.push({
          type: nextType,
          h: 4,
          targetH: newTargetH,
          yOffset: newOffset,
          wickTop: Math.floor(Math.random() * 16 + 10),
          wickBottom: Math.floor(Math.random() * 18 + 12),
          phase: Math.random() * Math.PI * 2
        });
      }, 5200);
    }

    animate() {
      const setup = setupHiDPICanvas(this.canvas);
      if (setup) {
        const { ctx, width, height } = setup;
        ctx.clearRect(0, 0, width, height);

        const candleCount = this.candles.length;
        const spacing = width / (candleCount + 1);
        const candleW = Math.max(14, Math.min(24, width * 0.024));
        const centerY = height * 0.52;

        // Smoothly interpolate heights with gentle easing
        this.candles.forEach((c) => {
          c.h += (c.targetH - c.h) * 0.06;
        });

        // 1. Calculate Positions & Slow, Smooth Top-to-Bottom Floating Wave
        const calculatedPoints = [];

        this.candles.forEach((c, i) => {
          const x = spacing * (i + 1);
          
          // Ultra-smooth, slow-motion harmonic floating wave
          const verticalWave = Math.sin(this.tick * 0.014 + (i * 0.35)) * 14;
          const heightWave = Math.cos(this.tick * 0.011 + (i * 0.28)) * 4;
          const currentH = Math.max(4, c.h + heightWave);
          const y = centerY + c.yOffset + verticalWave - currentH / 2;
          const topWickY = y - c.wickTop;
          const bottomWickY = y + currentH + c.wickBottom;
          const closeY = c.type === 'bull' ? y : y + currentH;

          // Check distance to mouse for subtle interactive hover boost
          const distToMouse = Math.hypot(x - this.mousePos.x, (y + currentH / 2) - this.mousePos.y);
          const hoverBoost = distToMouse < 90 ? Math.max(0, 1 - distToMouse / 90) : 0;

          calculatedPoints.push({
            c,
            i,
            x,
            y,
            currentH,
            topWickY,
            bottomWickY,
            closeY,
            hoverBoost
          });
        });

        // 2. Draw Subtle Glowing Area Fill beneath Graph Line
        if (calculatedPoints.length > 1) {
          ctx.beginPath();
          ctx.moveTo(calculatedPoints[0].x, calculatedPoints[0].closeY);
          for (let i = 0; i < calculatedPoints.length - 1; i++) {
            const p1 = calculatedPoints[i];
            const p2 = calculatedPoints[i + 1];
            const midX = (p1.x + p2.x) / 2;
            const midY = (p1.closeY + p2.closeY) / 2;
            ctx.quadraticCurveTo(p1.x, p1.closeY, midX, midY);
          }
          const lastPt = calculatedPoints[calculatedPoints.length - 1];
          ctx.lineTo(lastPt.x, lastPt.closeY);
          ctx.lineTo(lastPt.x, height);
          ctx.lineTo(calculatedPoints[0].x, height);
          ctx.closePath();

          const areaGrad = ctx.createLinearGradient(0, 20, 0, height);
          areaGrad.addColorStop(0, 'rgba(0, 242, 140, 0.12)');
          areaGrad.addColorStop(0.7, 'rgba(0, 242, 140, 0.02)');
          areaGrad.addColorStop(1, 'rgba(0, 242, 140, 0)');
          ctx.fillStyle = areaGrad;
          ctx.fill();
        }

        // 3. Draw Candlesticks with Ambient Glows
        calculatedPoints.forEach(pt => {
          const { c, x, y, currentH, topWickY, bottomWickY, hoverBoost } = pt;
          const isBull = c.type === 'bull';
          const primaryColor = isBull ? '#00F28C' : '#FF4B55';

          // Ambient Radial Glow centered dynamically on the candle
          const glowRadius = 38 + hoverBoost * 25;
          const candleCenterY = y + currentH / 2;
          const glowGrad = ctx.createRadialGradient(x, candleCenterY, 2, x, candleCenterY, glowRadius);
          glowGrad.addColorStop(0, isBull ? `rgba(0, 242, 140, ${0.28 + hoverBoost * 0.35})` : `rgba(255, 75, 85, ${0.28 + hoverBoost * 0.35})`);
          glowGrad.addColorStop(1, isBull ? 'rgba(0, 242, 140, 0)' : 'rgba(255, 75, 85, 0)');
          ctx.fillStyle = glowGrad;
          ctx.beginPath();
          ctx.arc(x, candleCenterY, glowRadius, 0, Math.PI * 2);
          ctx.fill();

          // Candle Wick
          ctx.strokeStyle = primaryColor;
          ctx.lineWidth = 1.5;
          ctx.shadowColor = isBull ? 'rgba(0, 242, 140, 0.6)' : 'rgba(255, 75, 85, 0.6)';
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.moveTo(x, topWickY);
          ctx.lineTo(x, bottomWickY);
          ctx.stroke();

          // Candle Solid Body
          ctx.fillStyle = primaryColor;
          ctx.fillRect(x - candleW / 2, y, candleW, currentH);
          ctx.shadowBlur = 0;

          // If rightmost candle -> store active price Y
          if (pt.i === candleCount - 1) {
            this.activeTickY = pt.closeY;
          }
        });

        // 4. Draw Animated Glowing Bezier Graph Line across Candlesticks
        if (calculatedPoints.length > 1) {
          ctx.beginPath();
          ctx.moveTo(calculatedPoints[0].x, calculatedPoints[0].closeY);
          for (let i = 0; i < calculatedPoints.length - 1; i++) {
            const p1 = calculatedPoints[i];
            const p2 = calculatedPoints[i + 1];
            const midX = (p1.x + p2.x) / 2;
            const midY = (p1.closeY + p2.closeY) / 2;
            ctx.quadraticCurveTo(p1.x, p1.closeY, midX, midY);
          }
          const lastPt = calculatedPoints[calculatedPoints.length - 1];
          ctx.lineTo(lastPt.x, lastPt.closeY);

          // Outer Glow
          ctx.strokeStyle = '#00F28C';
          ctx.lineWidth = 2.4;
          ctx.shadowColor = 'rgba(0, 242, 140, 0.85)';
          ctx.shadowBlur = 12;
          ctx.stroke();

          // Inner Bright Core
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 0.9;
          ctx.shadowBlur = 0;
          ctx.stroke();
        }

        // 5. Active Price Level Indicator & Shockwave Ring on last candle
        const lastCandle = this.candles[candleCount - 1];
        const isBullActive = lastCandle && lastCandle.type === 'bull';
        const activeColor = isBullActive ? '#00F28C' : '#FF4B55';
        const activeGuideColor = isBullActive ? 'rgba(0, 242, 140, 0.4)' : 'rgba(255, 75, 85, 0.4)';
        const activeHaloColor = isBullActive ? 'rgba(0, 242, 140, 0.25)' : 'rgba(255, 75, 85, 0.25)';

        const lastX = spacing * candleCount;
        const activeY = this.activeTickY;

        // Dashed Live Price Guide Line
        ctx.strokeStyle = activeGuideColor;
        ctx.setLineDash([3, 3]);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(lastX - candleW / 2 - 10, activeY);
        ctx.lineTo(width - 15, activeY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Pulsing Shockwave Ring on active price (Gentle slow pulse)
        const beaconPulse = Math.sin(this.tick * 0.05) * 2.5 + 3.5;
        ctx.strokeStyle = activeColor;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(lastX, activeY, beaconPulse + 4, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = activeHaloColor;
        ctx.beginPath();
        ctx.arc(lastX, activeY, beaconPulse + 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = activeColor;
        ctx.shadowColor = activeColor;
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.arc(lastX, activeY, 3.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(lastX, activeY, 1.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      this.tick++;
      requestAnimationFrame(() => this.animate());
    }
  }



  // --- Global Initialization ---
  window.HedzoCharts = {
    HeroTradingChart,
    HeroMinimalCandles,
    MainAnalyticsChart,
    MultiAssetStream,
    HeroBackgroundGrid,
    initSparklines
  };

})();
