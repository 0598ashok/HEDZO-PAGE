/**
 * Hedzo Trading Academy - Interactive Trading Canvas Animation
 * High-performance, subtle ambient stock market canvas background.
 * Renders glowing candlesticks, moving averages, financial grid lines, and market particles.
 */

(function () {
  'use strict';

  const canvas = document.getElementById('trading-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let width, height, dpr;
  let animationFrameId;

  // Configuration
  const config = {
    candleWidth: 9,
    candleSpacing: 22,
    bullColor: '#00FF88',
    bearColor: '#FF4D6D',
    wickColor: 'rgba(255, 255, 255, 0.25)',
    gridColor: 'rgba(0, 255, 136, 0.04)',
    gridSize: 60,
    speed: 0.45,
    maxCandles: 80,
    particleCount: 28
  };

  // State
  let candles = [];
  let particles = [];
  let mouse = { x: -1000, y: -1000, targetX: -1000, targetY: -1000, active: false };
  let lastPrice = 18500;
  let trendPhase = 0;

  function resize() {
    dpr = window.devicePixelRatio || 1;
    width = window.innerWidth;
    height = window.innerHeight;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';

    ctx.scale(dpr, dpr);
    initCandles();
    initParticles();
  }

  function generateCandle(xPos, prevClose) {
    trendPhase += 0.05;
    // Market bias: bullish trend with periodic pullbacks
    const trendBias = Math.sin(trendPhase) * 12 + Math.cos(trendPhase * 0.4) * 8 + 3;
    const change = (Math.random() - 0.46) * 45 + trendBias;
    const open = prevClose;
    const close = open + change;
    const isBull = close >= open;

    const high = Math.max(open, close) + Math.random() * 22;
    const low = Math.min(open, close) - Math.random() * 22;

    return {
      x: xPos,
      open,
      close,
      high,
      low,
      isBull,
      opacity: 0.15 + Math.random() * 0.18
    };
  }

  function initCandles() {
    candles = [];
    const count = Math.ceil(width / config.candleSpacing) + 5;
    let currentPrice = height * 0.52;

    for (let i = 0; i < count; i++) {
      const x = i * config.candleSpacing;
      const c = generateCandle(x, currentPrice);
      // Keep price within screen bounds
      if (c.close < height * 0.2) c.close = height * 0.3;
      if (c.close > height * 0.8) c.close = height * 0.7;
      currentPrice = c.close;
      candles.push(c);
    }
  }

  function initParticles() {
    particles = [];
    for (let i = 0; i < config.particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 2 + 1,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        opacity: Math.random() * 0.3 + 0.1,
        color: Math.random() > 0.3 ? '#00FF88' : '#00E5FF'
      });
    }
  }

  function drawGrid() {
    ctx.lineWidth = 1;
    ctx.strokeStyle = config.gridColor;

    // Vertical lines
    for (let x = 0; x < width; x += config.gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Horizontal lines
    for (let y = 0; y < height; y += config.gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  }

  function drawCandlesticks() {
    // 1. Move candles leftwards
    for (let i = 0; i < candles.length; i++) {
      candles[i].x -= config.speed;
    }

    // 2. Remove off-screen left and spawn on the right
    if (candles.length > 0 && candles[0].x < -config.candleSpacing) {
      candles.shift();
      const lastCandle = candles[candles.length - 1];
      const newX = lastCandle ? lastCandle.x + config.candleSpacing : width;
      let prevClose = lastCandle ? lastCandle.close : height * 0.5;

      // Keep within comfortable vertical window
      if (prevClose < height * 0.25) prevClose += 40;
      if (prevClose > height * 0.75) prevClose -= 40;

      candles.push(generateCandle(newX, prevClose));
    }

    // 3. Draw Moving Average Trend Glow Line
    if (candles.length > 3) {
      ctx.save();
      ctx.beginPath();
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(0, 255, 136, 0.3)';
      ctx.shadowColor = '#00FF88';
      ctx.shadowBlur = 10;

      for (let i = 0; i < candles.length; i++) {
        const c = candles[i];
        const midY = (c.open + c.close) / 2;
        if (i === 0) {
          ctx.moveTo(c.x, midY);
        } else {
          // Bezier smoothing between points
          const prev = candles[i - 1];
          const prevMidY = (prev.open + prev.close) / 2;
          const xc = (prev.x + c.x) / 2;
          const yc = (prevMidY + midY) / 2;
          ctx.quadraticCurveTo(prev.x, prevMidY, xc, yc);
        }
      }
      ctx.stroke();

      // Soft gradient area fill under moving average
      ctx.lineTo(candles[candles.length - 1].x, height);
      ctx.lineTo(candles[0].x, height);
      ctx.closePath();
      const fillGrad = ctx.createLinearGradient(0, height * 0.3, 0, height);
      fillGrad.addColorStop(0, 'rgba(0, 255, 136, 0.035)');
      fillGrad.addColorStop(1, 'rgba(0, 255, 136, 0.0)');
      ctx.fillStyle = fillGrad;
      ctx.fill();
      ctx.restore();
    }

    // 4. Draw Individual Candlesticks (Bodies + Wicks)
    for (let i = 0; i < candles.length; i++) {
      const c = candles[i];
      const candleColor = c.isBull ? config.bullColor : config.bearColor;
      const bodyTop = Math.min(c.open, c.close);
      const bodyHeight = Math.max(Math.abs(c.close - c.open), 3);

      ctx.save();
      ctx.globalAlpha = c.opacity;

      // Candle Wick (Vertical Line)
      ctx.strokeStyle = c.isBull ? 'rgba(0, 255, 136, 0.4)' : 'rgba(255, 77, 109, 0.3)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(c.x + config.candleWidth / 2, c.low);
      ctx.lineTo(c.x + config.candleWidth / 2, c.high);
      ctx.stroke();

      // Candle Body
      if (c.isBull) {
        ctx.fillStyle = config.bullColor;
        ctx.shadowColor = '#00FF88';
        ctx.shadowBlur = 8;
      } else {
        ctx.fillStyle = config.bearColor;
        ctx.shadowColor = '#FF4D6D';
        ctx.shadowBlur = 4;
      }

      ctx.beginPath();
      ctx.roundRect(c.x, bodyTop, config.candleWidth, bodyHeight, 1.5);
      ctx.fill();

      ctx.restore();
    }
  }

  function drawParticles() {
    ctx.save();
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0) p.x = width;
      if (p.x > width) p.x = 0;
      if (p.y < 0) p.y = height;
      if (p.y > height) p.y = 0;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.opacity;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 6;
      ctx.fill();
    }
    ctx.restore();
  }

  function drawInteractiveCursor() {
    if (!mouse.active) return;
    
    // Smooth lerp mouse coordinates
    mouse.x += (mouse.targetX - mouse.x) * 0.1;
    mouse.y += (mouse.targetY - mouse.y) * 0.1;

    ctx.save();
    ctx.strokeStyle = 'rgba(0, 255, 136, 0.18)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);

    // Crosshair lines
    ctx.beginPath();
    ctx.moveTo(0, mouse.y);
    ctx.lineTo(width, mouse.y);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(mouse.x, 0);
    ctx.lineTo(mouse.x, height);
    ctx.stroke();

    // Glowing coordinate beacon
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.arc(mouse.x, mouse.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#00FF88';
    ctx.shadowColor = '#00FF88';
    ctx.shadowBlur = 12;
    ctx.fill();

    ctx.restore();
  }

  function animate() {
    ctx.clearRect(0, 0, width, height);

    drawGrid();
    drawCandlesticks();
    drawParticles();
    drawInteractiveCursor();

    animationFrameId = requestAnimationFrame(animate);
  }

  // Event Listeners
  window.addEventListener('resize', resize);
  
  window.addEventListener('mousemove', function (e) {
    mouse.targetX = e.clientX;
    mouse.targetY = e.clientY;
    mouse.active = true;
  });

  window.addEventListener('mouseleave', function () {
    mouse.active = false;
  });

  // Handle visibility change to conserve battery/CPU
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      cancelAnimationFrame(animationFrameId);
    } else {
      animationFrameId = requestAnimationFrame(animate);
    }
  });

  // Initialize
  resize();
  animate();
})();
