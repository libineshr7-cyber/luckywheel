(function () {
  'use strict';

  // DOM Elements
  const spinBtn = document.getElementById('spinBtn');
  const cooldownCard = document.getElementById('cooldownCard');
  const timerHours = document.getElementById('timerHours');
  const timerMinutes = document.getElementById('timerMinutes');
  const timerSeconds = document.getElementById('timerSeconds');
  const wheelPointer = document.getElementById('wheelPointer');

  const winModal = document.getElementById('winModal');
  const winPrizeName = document.getElementById('winPrizeName');
  const winPrizeImageContainer = document.getElementById('winPrizeImageContainer');
  const claimRewardBtn = document.getElementById('claimRewardBtn');
  const closeWinPopupBtn = document.getElementById('closeWinPopupBtn');
  const winModalCloseBtn = document.getElementById('winModalCloseBtn');

  const claimModal = document.getElementById('claimModal');
  const claimModalCloseBtn = document.getElementById('claimModalCloseBtn');
  const claimForm = document.getElementById('claimForm');
  const claimFormPrizeName = document.getElementById('claimFormPrizeName');
  const claimPrizeImageContainer = document.getElementById('claimPrizeImageContainer');
  const submitClaimBtn = document.getElementById('submitClaimBtn');

  const successModal = document.getElementById('successModal');
  const successModalCloseBtn = document.getElementById('successModalCloseBtn');
  const doneSuccessBtn = document.getElementById('doneSuccessBtn');
  const downloadInvoiceBtn = document.getElementById('downloadInvoiceBtn');
  const successUserName = document.getElementById('successUserName');
  const summaryName = document.getElementById('summaryName');
  const summaryPrize = document.getElementById('summaryPrize');
  const summaryClaimId = document.getElementById('summaryClaimId');
  const summaryAddress = document.getElementById('summaryAddress');

  const toastContainer = document.getElementById('toastContainer');

  // Application State
  let currentSpinState = {
    canSpin: true,
    remainingMs: 0,
    nextEligibleSpin: null,
    wonPrize: null,
    spinId: null
  };

  let activeInvoiceData = null;
  let countdownInterval = null;
  let wheelInstance = null;

  // Secret Admin Access (Shift + Alt + A)
  window.addEventListener('keydown', (e) => {
    if (e.shiftKey && e.altKey && (e.key === 'A' || e.key === 'a' || e.code === 'KeyA')) {
      e.preventDefault();
      showToast('Redirecting to Secret Admin Panel...', 'info');
      setTimeout(() => {
        window.location.href = '/admin';
      }, 400);
    }
    // Secret Test Reset (Shift + Alt + R)
    if (e.shiftKey && e.altKey && (e.key === 'R' || e.key === 'r' || e.code === 'KeyR')) {
      e.preventDefault();
      localStorage.clear();
      enableSpinButton();
      showToast('Test Cooldown Cleared! You can spin again now.', 'success');
    }
  });

  // Device ID Generator
  function getBrowserFingerprint() {
    try {
      let fp = localStorage.getItem('luxespin_device_id');
      if (!fp) {
        fp = 'fp_dev_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();
        localStorage.setItem('luxespin_device_id', fp);
      }
      return fp;
    } catch (e) {
      return 'fp_fallback_' + Date.now();
    }
  }

  const userFingerprint = getBrowserFingerprint();

  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  function getPrizeSvg(prizeName) {
    if (!prizeName) return window.PRIZE_IMAGES ? window.PRIZE_IMAGES["iPhone 17 Pro Max"] : '';
    const cleanName = prizeName.trim();
    if (window.PRIZE_IMAGES && window.PRIZE_IMAGES[cleanName]) {
      return window.PRIZE_IMAGES[cleanName];
    }
    if (window.PRIZE_IMAGES) {
      for (let k in window.PRIZE_IMAGES) {
        if (k.toLowerCase() === cleanName.toLowerCase()) {
          return window.PRIZE_IMAGES[k];
        }
      }
    }
    return '';
  }

  // Celebration Animation Class (Falling balloons, golden ribbons, confetti)
  class CelebrationAnimation {
    constructor(canvasId) {
      this.canvas = document.getElementById(canvasId);
      if (!this.canvas) return;
      this.ctx = this.canvas.getContext('2d');
      this.particles = [];
      this.balloons = [];
      this.ribbons = [];
      this.isRunning = false;
      this.animId = null;

      this.colors = ['#FF1744', '#FFD700', '#00E5FF', '#D500F9', '#FF9100', '#76FF03', '#FF4081'];

      window.addEventListener('resize', () => {
        if (this.isRunning) this.resize();
      });
    }

    resize() {
      this.width = window.innerWidth;
      this.height = window.innerHeight;
      this.canvas.width = this.width * (window.devicePixelRatio || 1);
      this.canvas.height = this.height * (window.devicePixelRatio || 1);
      this.ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
    }

    start() {
      if (!this.canvas) return;
      this.resize();
      this.canvas.style.display = 'block';
      this.isRunning = true;

      // 28 Glossy Falling Balloons
      this.balloons = [];
      for (let i = 0; i < 28; i++) {
        this.balloons.push({
          x: Math.random() * this.width,
          y: -120 - Math.random() * this.height,
          radius: 22 + Math.random() * 20,
          color: this.colors[Math.floor(Math.random() * this.colors.length)],
          vy: 1.4 + Math.random() * 2.2,
          vx: (Math.random() - 0.5) * 1.4,
          swingSpeed: 0.02 + Math.random() * 0.03,
          swingAngle: Math.random() * Math.PI * 2,
          stringLength: 45 + Math.random() * 30
        });
      }

      // 130 Tumbling Confetti Particles
      this.particles = [];
      for (let i = 0; i < 130; i++) {
        this.particles.push({
          x: Math.random() * this.width,
          y: -60 - Math.random() * this.height,
          size: 6 + Math.random() * 9,
          color: this.colors[Math.floor(Math.random() * this.colors.length)],
          vy: 2.5 + Math.random() * 4,
          vx: (Math.random() - 0.5) * 2.2,
          rot: Math.random() * Math.PI * 2,
          vRot: (Math.random() - 0.5) * 0.25,
          shape: Math.random() > 0.4 ? 'rect' : 'circle'
        });
      }

      // 16 Falling Golden Ribbons
      this.ribbons = [];
      for (let i = 0; i < 16; i++) {
        this.ribbons.push({
          x: Math.random() * this.width,
          y: -160 - Math.random() * this.height,
          length: 90 + Math.random() * 70,
          width: 3 + Math.random() * 3,
          vy: 2.2 + Math.random() * 3,
          waveFreq: 0.03 + Math.random() * 0.03,
          waveAmp: 16 + Math.random() * 16,
          phase: Math.random() * Math.PI * 2
        });
      }

      this.animate();
    }

    stop() {
      this.isRunning = false;
      if (this.animId) cancelAnimationFrame(this.animId);
      if (this.ctx) this.ctx.clearRect(0, 0, this.width, this.height);
      if (this.canvas) this.canvas.style.display = 'none';
    }

    animate() {
      if (!this.isRunning) return;

      const ctx = this.ctx;
      ctx.clearRect(0, 0, this.width, this.height);

      // 1. Draw Balloons
      for (let b of this.balloons) {
        b.swingAngle += b.swingSpeed;
        b.y += b.vy;
        b.x += b.vx + Math.sin(b.swingAngle) * 0.9;

        if (b.y - b.radius > this.height + 100) {
          b.y = -100;
          b.x = Math.random() * this.width;
        }

        ctx.save();
        ctx.translate(b.x, b.y);

        // String
        ctx.beginPath();
        ctx.moveTo(0, b.radius);
        ctx.bezierCurveTo(
          Math.sin(b.swingAngle) * 14, b.radius + b.stringLength * 0.3,
          -Math.sin(b.swingAngle) * 14, b.radius + b.stringLength * 0.7,
          0, b.radius + b.stringLength
        );
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Balloon Body
        const bGrad = ctx.createRadialGradient(-b.radius * 0.3, -b.radius * 0.3, b.radius * 0.1, 0, 0, b.radius);
        bGrad.addColorStop(0, '#FFFFFF');
        bGrad.addColorStop(0.3, b.color);
        bGrad.addColorStop(1, '#000000');

        ctx.beginPath();
        ctx.ellipse(0, 0, b.radius * 0.85, b.radius, 0, 0, 2 * Math.PI);
        ctx.fillStyle = bGrad;
        ctx.fill();

        // Specular Shine
        ctx.beginPath();
        ctx.ellipse(-b.radius * 0.3, -b.radius * 0.35, b.radius * 0.25, b.radius * 0.15, -Math.PI / 4, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.fill();

        // Knot
        ctx.beginPath();
        ctx.moveTo(-3, b.radius);
        ctx.lineTo(3, b.radius);
        ctx.lineTo(5, b.radius + 4);
        ctx.lineTo(-5, b.radius + 4);
        ctx.closePath();
        ctx.fillStyle = b.color;
        ctx.fill();

        ctx.restore();
      }

      // 2. Draw Golden Ribbons
      for (let r of this.ribbons) {
        r.y += r.vy;
        r.phase += r.waveFreq;

        if (r.y > this.height + r.length) {
          r.y = -r.length - 50;
          r.x = Math.random() * this.width;
        }

        ctx.save();
        ctx.beginPath();
        const points = 20;
        for (let i = 0; i <= points; i++) {
          const py = r.y + (i / points) * r.length;
          const px = r.x + Math.sin(r.phase + (i / points) * Math.PI * 3) * r.waveAmp;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = r.width;
        ctx.shadowColor = 'rgba(255, 215, 0, 0.6)';
        ctx.shadowBlur = 6;
        ctx.stroke();
        ctx.restore();
      }

      // 3. Draw Confetti
      for (let p of this.particles) {
        p.y += p.vy;
        p.x += p.vx + Math.sin(p.y * 0.02) * 1.2;
        p.rot += p.vRot;

        if (p.y > this.height + 20) {
          p.y = -20;
          p.x = Math.random() * this.width;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;

        if (p.shape === 'rect') {
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, 2 * Math.PI);
          ctx.fill();
        }
        ctx.restore();
      }

      this.animId = requestAnimationFrame(() => this.animate());
    }
  }

  let celebrationFx = null;

  function initWheel() {
    celebrationFx = new CelebrationAnimation('celebrationCanvas');
    window.celebrationFx = celebrationFx;

    wheelInstance = new RealisticWheel('prizeWheelCanvas', {
      prizes: [
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
      ],
      onTick: function () {
        wheelPointer.classList.add('tick');
        setTimeout(() => wheelPointer.classList.remove('tick'), 60);
      },
      onSpinComplete: function (winningIndex, prizeName) {
        spinBtn.classList.remove('loading');
        currentSpinState.wonPrize = prizeName;
        
        // Trigger live celebration background & falling balloons
        const celebrationBackdrop = document.getElementById('celebrationBackdrop');
        if (celebrationBackdrop) celebrationBackdrop.classList.add('active');
        if (celebrationFx) celebrationFx.start();

        setTimeout(() => {
          showWinModal(prizeName);
        }, 300);

        startCooldownTimer(24 * 60 * 60 * 1000);
      }
    });
  }

  async function syncStatus() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('reset') === 'true') {
      localStorage.clear();
      enableSpinButton();
      return;
    }

    try {
      const res = await fetch(`/api/spin/status?fingerprint=${encodeURIComponent(userFingerprint)}`);
      const data = await res.json();

      if (data.success) {
        if (!data.canSpin && data.remainingMs > 0) {
          startCooldownTimer(data.remainingMs);
          if (data.spinId) currentSpinState.spinId = data.spinId;
          if (data.lastPrize) currentSpinState.wonPrize = data.lastPrize;
        } else {
          enableSpinButton();
        }
      } else {
        enableSpinButton();
      }
    } catch (err) {
      console.warn('Status sync error:', err);
      enableSpinButton();
    }
  }

  function startCooldownTimer(ms) {
    currentSpinState.canSpin = false;
    currentSpinState.remainingMs = ms;

    spinBtn.disabled = true;
    cooldownCard.style.display = 'block';

    if (countdownInterval) clearInterval(countdownInterval);

    let endTime = Date.now() + ms;

    function updateTimer() {
      let now = Date.now();
      let diff = Math.max(0, endTime - now);

      if (diff <= 0) {
        clearInterval(countdownInterval);
        enableSpinButton();
        return;
      }

      let totalSecs = Math.floor(diff / 1000);
      let hours = Math.floor(totalSecs / 3600);
      let minutes = Math.floor((totalSecs % 3600) / 60);
      let seconds = totalSecs % 60;

      timerHours.textContent = String(hours).padStart(2, '0');
      timerMinutes.textContent = String(minutes).padStart(2, '0');
      timerSeconds.textContent = String(seconds).padStart(2, '0');
    }

    updateTimer();
    countdownInterval = setInterval(updateTimer, 1000);
  }

  function enableSpinButton() {
    currentSpinState.canSpin = true;
    spinBtn.disabled = false;
    spinBtn.classList.remove('loading');
    cooldownCard.style.display = 'none';
    if (countdownInterval) clearInterval(countdownInterval);
  }

  async function handleSpinClick() {
    if (!currentSpinState.canSpin || wheelInstance.isSpinning) return;

    spinBtn.disabled = true;
    spinBtn.classList.add('loading');

    try {
      const res = await fetch('/api/spin/record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fingerprint: userFingerprint })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        spinBtn.classList.remove('loading');
        showToast(data.message || 'You can spin once every 24 hours.', 'error');
        if (data.remainingMs) {
          startCooldownTimer(data.remainingMs);
        } else {
          spinBtn.disabled = false;
        }
        return;
      }

      currentSpinState.spinId = data.spinId;
      currentSpinState.wonPrize = data.prize;

      wheelInstance.spinToPrize(data.prizeIndex);

    } catch (err) {
      console.error('Spin record error:', err);
      spinBtn.classList.remove('loading');
      spinBtn.disabled = false;
      showToast('Connection error. Please try again.', 'error');
    }
  }

  function showWinModal(prizeName) {
    winPrizeName.textContent = prizeName;
    winPrizeImageContainer.innerHTML = getPrizeSvg(prizeName);
    winModal.classList.add('active');
  }

  function hideWinModal() {
    winModal.classList.remove('active');
  }

  function showClaimModal() {
    hideWinModal();
    const prizeName = currentSpinState.wonPrize || 'iPhone 17 Pro Max';
    claimFormPrizeName.textContent = prizeName;
    claimPrizeImageContainer.innerHTML = getPrizeSvg(prizeName);
    claimModal.classList.add('active');
  }

  function hideClaimModal() {
    claimModal.classList.remove('active');
  }

  function showSuccessModal(userName, prizeName, claimId, addressStr, email, phone) {
    hideClaimModal();
    successUserName.textContent = userName;
    summaryName.textContent = userName;
    summaryPrize.textContent = prizeName;
    summaryClaimId.textContent = claimId;
    summaryAddress.textContent = addressStr;

    activeInvoiceData = {
      userName,
      prizeName,
      claimId,
      addressStr,
      email: email || 'winner@example.com',
      phone: phone || '+1 (555) 000-0000',
      dateStr: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    };

    successModal.classList.add('active');
  }

  function hideSuccessModal() {
    successModal.classList.remove('active');
  }

  function handleClaimSubmit() {
    const rawName = document.getElementById('claimName').value.trim();
    const rawEmail = document.getElementById('claimEmail').value.trim();
    const rawPhone = document.getElementById('claimPhone').value.trim();
    const rawAddr1 = document.getElementById('claimAddr1').value.trim();
    const rawCity = document.getElementById('claimCity').value.trim();
    const rawState = document.getElementById('claimState').value.trim();
    const rawPin = document.getElementById('claimPin').value.trim();

    const userName = rawName || 'Winner';
    const addressLine1 = rawAddr1 || 'Address Registered';
    const city = rawCity || 'City';
    const state = rawState || 'State';
    const pinCode = rawPin || 'PIN';
    const prizeName = currentSpinState.wonPrize || 'iPhone 17 Pro Max';

    const fullAddress = `${addressLine1}, ${city}, ${state} ${pinCode}`;
    const generatedClaimId = 'CLM-2026-' + Math.floor(10000 + Math.random() * 90000);

    const claimData = {
      spinId: currentSpinState.spinId,
      name: userName,
      email: rawEmail || 'claim@luxespin.com',
      phone: rawPhone || '+1 (555) 000-0000',
      addressLine1,
      addressLine2: document.getElementById('claimAddr2').value.trim(),
      city,
      district: document.getElementById('claimDistrict').value.trim() || city,
      state,
      country: document.getElementById('claimCountry').value.trim() || 'United States',
      pinCode,
      occupation: document.getElementById('claimOccupation').value.trim(),
      age: document.getElementById('claimAge').value || 25,
      gender: document.getElementById('claimGender').value || 'Male',
      preferredDeliveryTime: document.getElementById('claimDeliveryTime').value,
      additionalNotes: document.getElementById('claimNotes').value.trim(),
      prize: prizeName,
      agreedToTerms: document.getElementById('claimTerms').checked
    };

    // 1. INSTANTLY open Success Modal Popup automatically!
    claimForm.reset();
    showSuccessModal(userName, prizeName, generatedClaimId, fullAddress, claimData.email, claimData.phone);

    // 2. Save claim details to MongoDB Atlas in background
    fetch('/api/claims/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...claimData, claimId: generatedClaimId })
    }).catch(err => console.warn('Background sync:', err));
  }

  // Generate Official PDF/Printable Reward Invoice Document
  function handleDownloadInvoice() {
    if (!activeInvoiceData) return;
    const inv = activeInvoiceData;

    const invoiceHTML = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Invoice ${inv.claimId} - LuxeSpin Verified Rewards</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          body { font-family: 'Inter', sans-serif; background: #ffffff; color: #0f172a; margin: 0; padding: 40px; }
          .invoice-card { max-width: 700px; margin: 0 auto; border: 1px solid #e2e8f0; padding: 40px; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); }
          .header-brand { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #f1f5f9; padding-bottom: 24px; margin-bottom: 30px; }
          .brand-title { font-size: 24px; font-weight: 700; color: #2563eb; letter-spacing: -0.02em; }
          .badge-paid { background: #d1fae5; color: #065f46; padding: 6px 14px; border-radius: 999px; font-weight: 700; font-size: 12px; text-transform: uppercase; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 32px; font-size: 14px; }
          .info-block strong { color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 4px; }
          .table-items { width: 100%; border-collapse: collapse; margin-bottom: 32px; font-size: 14px; }
          .table-items th { background: #f8fafc; padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; color: #475569; }
          .table-items td { padding: 16px 12px; border-bottom: 1px solid #f1f5f9; }
          .seal-box { border: 2px dashed #10b981; color: #047857; padding: 14px; text-align: center; border-radius: 8px; font-weight: 700; font-size: 13px; margin-top: 30px; background: #ecfdf5; }
        </style>
      </head>
      <body>
        <div class="invoice-card">
          <div class="header-brand">
            <div>
              <div class="brand-title">LuxeSpin</div>
              <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Verified Daily Rewards Program</div>
            </div>
            <span class="badge-paid">OFFICIAL REWARD DISPATCH</span>
          </div>

          <div class="info-grid">
            <div class="info-block">
              <strong>Billed / Delivered To</strong>
              <div style="font-weight: 700; font-size: 16px; margin-bottom: 4px;">${inv.userName}</div>
              <div>${inv.phone}</div>
              <div>${inv.email}</div>
              <div style="margin-top: 6px; color: #475569;">${inv.addressStr}</div>
            </div>
            <div class="info-block" style="text-align: right;">
              <strong>Reward Metadata</strong>
              <div>Claim ID: <span style="font-family: monospace; font-weight: 700;">${inv.claimId}</span></div>
              <div>Date: ${inv.dateStr}</div>
              <div>Status: Verified & Processed</div>
              <div>Logistics: Priority Express</div>
            </div>
          </div>

          <table class="table-items">
            <thead>
              <tr>
                <th>Description</th>
                <th>Qty</th>
                <th>Status</th>
                <th style="text-align: right;">Total Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>${inv.prizeName}</strong><br><span style="font-size: 12px; color: #64748b;">Official 2026 Edition Reward</span></td>
                <td>1</td>
                <td>Complimentary</td>
                <td style="text-align: right; font-weight: 700; color: #059669;">₹0.00 (FREE)</td>
              </tr>
            </tbody>
          </table>

          <div class="seal-box">
            ✔ VERIFIED & APPROVED FOR DISPATCH BY LUXESPIN LOGISTICS DIVISION
          </div>
        </div>
        <script>
          window.onload = function() { window.print(); };
        </script>
      </body>
      </html>
    `;

    const blob = new Blob([invoiceHTML], { type: 'text/html' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `LuxeSpin_Invoice_${inv.claimId}.html`;
    link.click();

    // Also open printable window
    const printWin = window.open('', '_blank');
    if (printWin) {
      printWin.document.write(invoiceHTML);
      printWin.document.close();
    }
  }

  // Event Listeners
  spinBtn.addEventListener('click', handleSpinClick);
  claimRewardBtn.addEventListener('click', showClaimModal);
  closeWinPopupBtn.addEventListener('click', hideWinModal);
  winModalCloseBtn.addEventListener('click', hideWinModal);
  claimModalCloseBtn.addEventListener('click', hideClaimModal);
  successModalCloseBtn.addEventListener('click', hideSuccessModal);
  doneSuccessBtn.addEventListener('click', hideSuccessModal);
  downloadInvoiceBtn.addEventListener('click', handleDownloadInvoice);

  // Directly attach click handler to Submit button
  submitClaimBtn.addEventListener('click', handleClaimSubmit);

  [winModal, claimModal, successModal].forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('active');
    });
  });

  document.addEventListener('DOMContentLoaded', () => {
    initWheel();
    syncStatus();
  });

})();
