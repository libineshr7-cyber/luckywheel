const Spin = require('../models/Spin');
const { getDbState, inMemoryStore } = require('../config/db');
const useragent = require('useragent');

const PRIZES = [
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

function parseDeviceInfo(req) {
  const agent = useragent.parse(req.headers['user-agent'] || '');
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
  let deviceType = 'Desktop';
  const ua = req.headers['user-agent'] || '';
  if (/mobile/i.test(ua)) deviceType = 'Mobile';
  else if (/ipad|tablet/i.test(ua)) deviceType = 'Tablet';

  return { ip, browser: agent.toAgent() || 'Unknown Browser', os: agent.os.toString() || 'Unknown OS', deviceType };
}

exports.checkStatus = async (req, res) => {
  try {
    const fingerprint = req.query.fingerprint || req.headers['x-fingerprint'];
    const { ip } = parseDeviceInfo(req);
    const now = new Date();

    if (!fingerprint) {
      return res.json({ success: true, canSpin: true, remainingMs: 0 });
    }

    let lastSpin = null;

    if (getDbState()) {
      lastSpin = await Spin.findOne({
        fingerprint,
        nextEligibleSpin: { $gt: now }
      }).sort({ spinTimestamp: -1 });
    } else {
      lastSpin = inMemoryStore.spins
        .filter(s => s.fingerprint === fingerprint && new Date(s.nextEligibleSpin) > now)
        .sort((a, b) => new Date(b.spinTimestamp) - new Date(a.spinTimestamp))[0];
    }

    if (lastSpin) {
      const remainingMs = Math.max(0, new Date(lastSpin.nextEligibleSpin).getTime() - now.getTime());
      return res.json({
        success: true,
        canSpin: false,
        lastPrize: lastSpin.prize,
        nextEligibleSpin: lastSpin.nextEligibleSpin,
        remainingMs,
        spinId: lastSpin._id || lastSpin.id
      });
    }

    return res.json({
      success: true,
      canSpin: true,
      remainingMs: 0,
      nextEligibleSpin: null
    });
  } catch (error) {
    console.error('Error in checkStatus:', error);
    res.status(500).json({ success: false, message: 'Server error checking spin status' });
  }
};

exports.recordSpin = async (req, res) => {
  try {
    const fingerprint = req.body.fingerprint || 'anonymous-fp';
    const { ip, browser, os, deviceType } = parseDeviceInfo(req);
    const now = new Date();

    // Verify 24h cooldown server side
    let lastSpin = null;
    if (getDbState()) {
      lastSpin = await Spin.findOne({
        fingerprint,
        nextEligibleSpin: { $gt: now }
      });
    } else {
      lastSpin = inMemoryStore.spins.find(
        s => s.fingerprint === fingerprint && new Date(s.nextEligibleSpin) > now
      );
    }

    if (lastSpin) {
      const remainingMs = Math.max(0, new Date(lastSpin.nextEligibleSpin).getTime() - now.getTime());
      return res.status(429).json({
        success: false,
        canSpin: false,
        message: 'Cooldown period active. You can spin once every 24 hours.',
        nextEligibleSpin: lastSpin.nextEligibleSpin,
        remainingMs
      });
    }

    // Always pick a random prize among all 12 items
    const prizeIndex = Math.floor(Math.random() * PRIZES.length);
    const prize = PRIZES[prizeIndex];
    const nextEligibleSpin = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    let spinRecord = null;
    if (getDbState()) {
      spinRecord = await Spin.create({
        fingerprint,
        ip,
        browser,
        os,
        deviceType,
        prize,
        spinTimestamp: now,
        nextEligibleSpin,
        claimed: false
      });
    } else {
      spinRecord = {
        id: 'spin_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        fingerprint,
        ip,
        browser,
        os,
        deviceType,
        prize,
        spinTimestamp: now,
        nextEligibleSpin,
        claimed: false
      };
      inMemoryStore.spins.push(spinRecord);
    }

    res.json({
      success: true,
      spinId: spinRecord._id || spinRecord.id,
      prizeIndex,
      prize,
      spinTimestamp: now,
      nextEligibleSpin,
      remainingMs: 24 * 60 * 60 * 1000
    });
  } catch (error) {
    console.error('Error in recordSpin:', error);
    res.status(500).json({ success: false, message: 'Server error recording spin' });
  }
};
