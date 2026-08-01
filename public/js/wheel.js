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
    this.bulbTimer = null;

    this.initCanvasSize();
    this.draw();
    this.startBulbAnimation();

    window.addEventListener('resize', () => {
      this.initCanvasSize();
      this.draw();
    });
  }

  startBulbAnimation() {
    if (this.bulbTimer) clearInterval(this.bulbTimer);
    this.bulbTimer = setInterval(() => {
      if (!this.isSpinning) {
        this.draw();
      }
    }, 450);
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
        osc.frequency.setValueAtTime(520 + Math.random() * 90, this.audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(140, this.audioCtx.currentTime + 0.025);
        gain.gain.setValueAtTime(0.15, this.audioCtx.currentTime);
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
    this.dpr = dpr;
  }

  draw() {
    const ctx = this.ctx;
    const dpr = this.dpr;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.save();
    ctx.translate(this.centerX, this.centerY);

    const totalRadius = (this.size * dpr) / 2 - 6 * dpr;
    const rimWidth = 36 * dpr;
    const wheelRadius = totalRadius - rimWidth;

    // 1. Gold Outer Metallic Gradient
    const goldGrad = ctx.createLinearGradient(-totalRadius, -totalRadius, totalRadius, totalRadius);
    goldGrad.addColorStop(0, '#FFE875');
    goldGrad.addColorStop(0.2, '#F5AF19');
    goldGrad.addColorStop(0.4, '#FFF5B8');
    goldGrad.addColorStop(0.7, '#E65100');
    goldGrad.addColorStop(0.85, '#FFD700');
    goldGrad.addColorStop(1, '#996E14');

    // Outer Bezel Rim Base (Gold)
    ctx.beginPath();
    ctx.arc(0, 0, totalRadius, 0, 2 * Math.PI);
    ctx.fillStyle = goldGrad;
    ctx.fill();

    // Dark Red Bezel Center Ring
    const redBezelGrad = ctx.createRadialGradient(0, 0, wheelRadius, 0, 0, totalRadius - 3 * dpr);
    redBezelGrad.addColorStop(0, '#7A0002');
    redBezelGrad.addColorStop(0.5, '#A80004');
    redBezelGrad.addColorStop(1, '#4A0001');

    ctx.beginPath();
    ctx.arc(0, 0, totalRadius - 3 * dpr, 0, 2 * Math.PI);
    ctx.fillStyle = redBezelGrad;
    ctx.fill();

    // Inner Bezel Gold Ring
    ctx.beginPath();
    ctx.arc(0, 0, wheelRadius, 0, 2 * Math.PI);
    ctx.fillStyle = goldGrad;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(0, 0, wheelRadius - 2.5 * dpr, 0, 2 * Math.PI);
    ctx.fillStyle = '#1A0001';
    ctx.fill();

    // 2. Casino Light Bulbs on Bezel
    const bulbCount = 24;
    const bulbRadius = 6.5 * dpr;
    const bulbDist = totalRadius - rimWidth / 2;

    const timeIndex = Math.floor(Date.now() / (this.isSpinning ? 90 : 450));

    for (let b = 0; b < bulbCount; b++) {
      const bulbAngle = (b * 2 * Math.PI) / bulbCount;
      const bx = Math.cos(bulbAngle) * bulbDist;
      const by = Math.sin(bulbAngle) * bulbDist;

      // Socket ring
      ctx.beginPath();
      ctx.arc(bx, by, bulbRadius + 1.8 * dpr, 0, 2 * Math.PI);
      ctx.fillStyle = goldGrad;
      ctx.fill();

      const isLit = (timeIndex + b) % 2 === 0;

      if (isLit) {
        // Glowing bulb aura
        ctx.save();
        ctx.shadowColor = '#FFEA00';
        ctx.shadowBlur = 14 * dpr;
        ctx.beginPath();
        ctx.arc(bx, by, bulbRadius, 0, 2 * Math.PI);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
        ctx.restore();

        // Bulb center gradient
        const litGrad = ctx.createRadialGradient(bx - 2 * dpr, by - 2 * dpr, 0, bx, by, bulbRadius);
        litGrad.addColorStop(0, '#FFFFFF');
        litGrad.addColorStop(0.3, '#FFF700');
        litGrad.addColorStop(0.75, '#FF8C00');
        litGrad.addColorStop(1, '#E65100');

        ctx.beginPath();
        ctx.arc(bx, by, bulbRadius, 0, 2 * Math.PI);
        ctx.fillStyle = litGrad;
        ctx.fill();
      } else {
        // Dimmed bulb
        const dimGrad = ctx.createRadialGradient(bx - 1.5 * dpr, by - 1.5 * dpr, 0, bx, by, bulbRadius);
        dimGrad.addColorStop(0, '#FFD700');
        dimGrad.addColorStop(0.6, '#996E14');
        dimGrad.addColorStop(1, '#4A3000');

        ctx.beginPath();
        ctx.arc(bx, by, bulbRadius, 0, 2 * Math.PI);
        ctx.fillStyle = dimGrad;
        ctx.fill();
      }
    }

    // 3. ROTATING SEGMENTS
    ctx.save();
    ctx.rotate(this.currentAngle);

    const innerRadius = wheelRadius - 2.5 * dpr;

    for (let i = 0; i < this.segmentCount; i++) {
      const startAngle = i * this.segmentAngle;
      const endAngle = startAngle + this.segmentAngle;
      const isYellowSegment = i % 2 === 0;

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, innerRadius, startAngle, endAngle);
      ctx.closePath();

      const segGrad = ctx.createRadialGradient(0, 0, 15 * dpr, 0, 0, innerRadius);
      if (isYellowSegment) {
        // Bright Gold/Yellow Segment
        segGrad.addColorStop(0, '#FFF59D');
        segGrad.addColorStop(0.35, '#FFC107');
        segGrad.addColorStop(0.85, '#FF9800');
        segGrad.addColorStop(1, '#F57C00');
      } else {
        // Deep Rich Red Segment
        segGrad.addColorStop(0, '#FF3D00');
        segGrad.addColorStop(0.35, '#D50000');
        segGrad.addColorStop(0.85, '#990000');
        segGrad.addColorStop(1, '#5C0000');
      }

      ctx.fillStyle = segGrad;
      ctx.fill();

      // Divider Lines (Gold Metallic)
      ctx.strokeStyle = goldGrad;
      ctx.lineWidth = 2.2 * dpr;
      ctx.stroke();

      // Text & Icon Rendering
      ctx.save();
      const midAngle = startAngle + this.segmentAngle / 2;
      ctx.rotate(midAngle);

      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';

      const fontSize = Math.max(12, Math.floor(14 * dpr));
      ctx.font = `900 ${fontSize}px Inter, "Segoe UI", sans-serif`;

      const prizeName = this.prizes[i];
      let displayTitle = prizeName;
      if (displayTitle.length > 17) {
        displayTitle = displayTitle.substring(0, 15) + '...';
      }

      if (isYellowSegment) {
        // Dark Crimson Red Text on Yellow Segment
        ctx.fillStyle = '#6E0000';
        ctx.shadowColor = 'rgba(255, 255, 255, 0.4)';
        ctx.shadowBlur = 2 * dpr;
      } else {
        // Bold White/Yellow Text on Red Segment
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
        ctx.shadowBlur = 5 * dpr;
      }

      ctx.fillText(displayTitle, innerRadius - 38 * dpr, 0);

      // Icon
      this.drawPrizeIcon(ctx, i, innerRadius - 16 * dpr, 0, dpr, isYellowSegment);
      ctx.restore();
    }

    // 4. CENTER METALLIC GOLD CAP
    const capOuterRadius = 42 * dpr;
    const capMidRadius = 32 * dpr;
    const capInnerRadius = 22 * dpr;

    // Outer Hub Gold Ring
    ctx.beginPath();
    ctx.arc(0, 0, capOuterRadius, 0, 2 * Math.PI);
    ctx.fillStyle = goldGrad;
    ctx.fill();
    ctx.strokeStyle = '#4A2800';
    ctx.lineWidth = 1.5 * dpr;
    ctx.stroke();

    // Middle Dark Bronze Ring
    const capDarkGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, capMidRadius);
    capDarkGrad.addColorStop(0, '#B8860B');
    capDarkGrad.addColorStop(0.7, '#5C3A00');
    capDarkGrad.addColorStop(1, '#2E1C00');

    ctx.beginPath();
    ctx.arc(0, 0, capMidRadius, 0, 2 * Math.PI);
    ctx.fillStyle = capDarkGrad;
    ctx.fill();

    // Inner Brass Dome Button
    const capInnerGrad = ctx.createRadialGradient(-6 * dpr, -6 * dpr, 0, 0, 0, capInnerRadius);
    capInnerGrad.addColorStop(0, '#FFFFFF');
    capInnerGrad.addColorStop(0.3, '#FFE082');
    capInnerGrad.addColorStop(0.7, '#FFB300');
    capInnerGrad.addColorStop(1, '#8D6E63');

    ctx.beginPath();
    ctx.arc(0, 0, capInnerRadius, 0, 2 * Math.PI);
    ctx.fillStyle = capInnerGrad;
    ctx.fill();
    ctx.strokeStyle = '#FFF8E1';
    ctx.lineWidth = 1 * dpr;
    ctx.stroke();

    ctx.restore(); // Restore currentAngle rotation
    ctx.restore(); // Restore translation
  }

  drawPrizeIcon(ctx, index, x, y, dpr, isYellowSegment) {
    ctx.save();
    ctx.translate(x, y);
    const color = isYellowSegment ? '#6E0000' : '#FFD700';
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 1.6 * dpr;
    
    const s = 6.5 * dpr;
    switch(index % 12) {
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
