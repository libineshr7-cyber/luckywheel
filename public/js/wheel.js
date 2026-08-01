class RealisticWheel {
  constructor(canvasId, options = {}) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    
    this.prizes = options.prizes || [
      "iPhone 17 Pro Max",
      "Samsung Galaxy S25 Ultra",
      "MacBook Pro",
      "Apple Watch Ultra",
      "PlayStation 5 Pro",
      "BMW M4",
      "Mercedes G-Class",
      "Dubai Luxury Trip",
      "₹10,00,000 Cash Reward",
      "Rolex Watch",
      "Apple Vision Pro",
      "Tesla Model 3"
    ];

    this.onSpinComplete = options.onSpinComplete || function() {};
    this.onTick = options.onTick || function() {};

    this.segmentCount = this.prizes.length;
    this.segmentAngle = (2 * Math.PI) / this.segmentCount;
    this.currentAngle = 0;
    this.isSpinning = false;
    
    this.audioCtx = null;

    this.colors = [
      { bg: '#FFFFFF', text: '#0F172A' },
      { bg: '#F8FAFC', text: '#0F172A' },
      { bg: '#FFFBF5', text: '#0F172A' },
      { bg: '#F1F5F9', text: '#0F172A' },
      { bg: '#FFFFFF', text: '#0F172A' },
      { bg: '#F8FAFC', text: '#0F172A' },
      { bg: '#FFFBF5', text: '#0F172A' },
      { bg: '#F1F5F9', text: '#0F172A' },
      { bg: '#FFFFFF', text: '#0F172A' },
      { bg: '#F8FAFC', text: '#0F172A' },
      { bg: '#FFFBF5', text: '#0F172A' },
      { bg: '#F1F5F9', text: '#0F172A' }
    ];

    this.initCanvasSize();
    this.draw();

    window.addEventListener('resize', () => {
      this.initCanvasSize();
      this.draw();
    });
  }

  playTickSound() {
    try {
      if (!this.audioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) this.audioCtx = new AudioContext();
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      if (this.audioCtx) {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(480 + Math.random() * 80, this.audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(120, this.audioCtx.currentTime + 0.025);
        gain.gain.setValueAtTime(0.12, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.025);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start();
        osc.stop(this.audioCtx.currentTime + 0.03);
      }
    } catch (e) {}
  }

  initCanvasSize() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const size = Math.min(rect.width, 520);

    this.canvas.width = size * dpr;
    this.canvas.height = size * dpr;
    this.canvas.style.width = `${size}px`;
    this.canvas.style.height = `${size}px`;
    
    this.size = size;
    this.centerX = (size * dpr) / 2;
    this.centerY = (size * dpr) / 2;
    this.radius = (size * dpr) / 2 - 18 * dpr;
    this.dpr = dpr;
  }

  draw() {
    const ctx = this.ctx;
    const dpr = this.dpr;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.save();
    ctx.translate(this.centerX, this.centerY);
    ctx.rotate(this.currentAngle);

    // 1. Bezel Outer Metallic Rim
    const outerRimGradient = ctx.createRadialGradient(0, 0, this.radius - 10 * dpr, 0, 0, this.radius + 14 * dpr);
    outerRimGradient.addColorStop(0, '#E2E8F0');
    outerRimGradient.addColorStop(0.3, '#FFFFFF');
    outerRimGradient.addColorStop(0.7, '#94A3B8');
    outerRimGradient.addColorStop(1, '#64748B');

    ctx.beginPath();
    ctx.arc(0, 0, this.radius + 10 * dpr, 0, 2 * Math.PI);
    ctx.fillStyle = outerRimGradient;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, 2 * Math.PI);
    ctx.strokeStyle = '#94A3B8';
    ctx.lineWidth = 2 * dpr;
    ctx.stroke();

    // 2. Segments
    for (let i = 0; i < this.segmentCount; i++) {
      const startAngle = i * this.segmentAngle;
      const endAngle = startAngle + this.segmentAngle;
      const color = this.colors[i % this.colors.length];

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, this.radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = color.bg;
      ctx.fill();

      ctx.strokeStyle = '#CBD5E1';
      ctx.lineWidth = 1.5 * dpr;
      ctx.stroke();

      ctx.save();
      const midAngle = startAngle + this.segmentAngle / 2;
      ctx.rotate(midAngle);

      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = color.text;
      ctx.font = `600 ${Math.max(11, Math.floor(13 * dpr))}px Inter, sans-serif`;

      const prizeName = this.prizes[i];
      let displayTitle = prizeName;
      if (displayTitle.length > 18) {
        displayTitle = displayTitle.substring(0, 16) + '...';
      }

      ctx.fillText(displayTitle, this.radius - 30 * dpr, 0);
      this.drawPrizeIcon(ctx, i, this.radius - 14 * dpr, 0, dpr);
      ctx.restore();
    }

    // 3. Studs / Pins
    for (let i = 0; i < this.segmentCount; i++) {
      const pinAngle = i * this.segmentAngle;
      const pinDist = this.radius + 5 * dpr;
      const px = Math.cos(pinAngle) * pinDist;
      const py = Math.sin(pinAngle) * pinDist;

      const pinGrad = ctx.createRadialGradient(px - 1*dpr, py - 1*dpr, 0, px, py, 4*dpr);
      pinGrad.addColorStop(0, '#FFFFFF');
      pinGrad.addColorStop(0.6, '#94A3B8');
      pinGrad.addColorStop(1, '#334155');

      ctx.beginPath();
      ctx.arc(px, py, 4 * dpr, 0, 2 * Math.PI);
      ctx.fillStyle = pinGrad;
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1 * dpr;
      ctx.stroke();
    }

    // 4. Center Cap
    const capGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 38 * dpr);
    capGrad.addColorStop(0, '#FFFFFF');
    capGrad.addColorStop(0.6, '#F1F5F9');
    capGrad.addColorStop(1, '#94A3B8');

    ctx.beginPath();
    ctx.arc(0, 0, 38 * dpr, 0, 2 * Math.PI);
    ctx.fillStyle = capGrad;
    ctx.fill();
    ctx.strokeStyle = '#64748B';
    ctx.lineWidth = 2 * dpr;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 0, 14 * dpr, 0, 2 * Math.PI);
    ctx.fillStyle = '#2563EB';
    ctx.fill();

    ctx.restore();
  }

  drawPrizeIcon(ctx, index, x, y, dpr) {
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = '#475569';
    ctx.fillStyle = '#475569';
    ctx.lineWidth = 1.4 * dpr;
    
    const s = 6.5 * dpr;
    switch(index) {
      case 0:
      case 1:
        ctx.beginPath();
        ctx.roundRect(-s*0.6, -s, s*1.2, s*2, 2 * dpr);
        ctx.stroke();
        break;
      case 2:
        ctx.beginPath();
        ctx.rect(-s, -s*0.6, s*2, s*1.2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-s*1.2, s*0.6);
        ctx.lineTo(s*1.2, s*0.6);
        ctx.stroke();
        break;
      case 3:
      case 9:
        ctx.beginPath();
        ctx.arc(0, 0, s*0.85, 0, 2*Math.PI);
        ctx.stroke();
        break;
      case 4:
        ctx.beginPath();
        ctx.roundRect(-s, -s*0.5, s*2, s, 3*dpr);
        ctx.stroke();
        break;
      case 5:
      case 6:
      case 11:
        ctx.beginPath();
        ctx.roundRect(-s*1.1, -s*0.6, s*2.2, s*1.2, 3*dpr);
        ctx.stroke();
        break;
      case 7:
        ctx.beginPath();
        ctx.moveTo(-s, s*0.5);
        ctx.lineTo(0, -s);
        ctx.lineTo(s, s*0.5);
        ctx.stroke();
        break;
      case 8:
        ctx.beginPath();
        ctx.rect(-s*0.9, -s*0.6, s*1.8, s*1.2);
        ctx.stroke();
        break;
      case 10:
        ctx.beginPath();
        ctx.ellipse(0, 0, s*1.1, s*0.6, 0, 0, 2*Math.PI);
        ctx.stroke();
        break;
      default:
        ctx.beginPath();
        ctx.arc(0, 0, s*0.6, 0, 2*Math.PI);
        ctx.fill();
    }
    ctx.restore();
  }

  spinToPrize(winningIndex) {
    if (this.isSpinning) return;
    this.isSpinning = true;

    // 1. Center of winning segment in unrotated wheel coordinates
    const segmentCenter = (winningIndex + 0.5) * this.segmentAngle;
    const pointerAngle = (3 * Math.PI) / 2; // 270 deg (Top)

    // 2. Exact Target Final Angle
    let targetFinalAngle = pointerAngle - segmentCenter;

    // Normalize target angle to [0, 2*PI)
    targetFinalAngle = (targetFinalAngle % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);

    // 8 full 360-degree rotations for high-speed momentum
    const extraTurns = 8 * 2 * Math.PI;

    // Current angle normalized
    const currentNorm = (this.currentAngle % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);

    let delta = targetFinalAngle - currentNorm;
    if (delta <= 0) {
      delta += 2 * Math.PI;
    }

    const totalRotation = extraTurns + delta;
    const startAngle = this.currentAngle;

    const startTime = performance.now();
    const duration = 5800; // 5.8 seconds

    let lastTickAngle = this.currentAngle;

    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);

      let easeProgress;
      if (progress < 0.2) {
        easeProgress = 2.5 * progress * progress;
      } else if (progress < 0.45) {
        easeProgress = 0.1 + (progress - 0.2) * 1.6;
      } else {
        const t = (progress - 0.45) / 0.55;
        const cubicDecay = 1 - Math.pow(1 - t, 3.5);
        easeProgress = 0.5 + 0.5 * cubicDecay;
      }

      this.currentAngle = startAngle + totalRotation * easeProgress;
      this.draw();

      const angleDiff = Math.abs(this.currentAngle - lastTickAngle);
      if (angleDiff >= this.segmentAngle) {
        lastTickAngle = this.currentAngle;
        this.playTickSound();
        this.onTick();
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.isSpinning = false;
        // Snap to exact target angle
        this.currentAngle = startAngle + totalRotation;
        this.draw();
        this.onSpinComplete(winningIndex, this.prizes[winningIndex]);
      }
    };

    requestAnimationFrame(animate);
  }
}
