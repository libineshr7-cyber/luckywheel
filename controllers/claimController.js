const Claim = require('../models/Claim');
const Spin = require('../models/Spin');
const { getDbState, inMemoryStore } = require('../config/db');
const useragent = require('useragent');

function generateClaimId() {
  const year = new Date().getFullYear();
  const randomNum = Math.floor(10000 + Math.random() * 90000);
  return `CLM-${year}-${randomNum}`;
}

function parseDeviceInfo(req) {
  const agent = useragent.parse(req.headers['user-agent'] || '');
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
  let deviceType = 'Desktop';
  const ua = req.headers['user-agent'] || '';
  if (/mobile/i.test(ua)) deviceType = 'Mobile';
  else if (/ipad|tablet/i.test(ua)) deviceType = 'Tablet';

  return { ip, browser: agent.toAgent() || 'Unknown Browser', os: agent.os.toString() || 'Unknown OS', deviceType };
}

// Timeout helper for fast DB operations
function withTimeout(promise, ms = 3000) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Operation timeout')), ms))
  ]);
}

exports.submitClaim = async (req, res) => {
  try {
    const {
      spinId,
      name,
      email,
      phone,
      addressLine1,
      addressLine2,
      city,
      district,
      state,
      country,
      pinCode,
      occupation,
      age,
      gender,
      preferredDeliveryTime,
      additionalNotes,
      prize,
      agreedToTerms
    } = req.body;

    if (!agreedToTerms) {
      return res.status(400).json({ success: false, message: 'You must agree to the Terms and Conditions.' });
    }

    if (!name || !email || !phone || !addressLine1 || !city || !district || !state || !country || !pinCode || !age || !gender || !prize) {
      return res.status(400).json({ success: false, message: 'Please complete all required fields.' });
    }

    if (!/^[0-9]{10}$/.test(phone)) {
      return res.status(400).json({ success: false, message: 'Phone number must be exactly 10 digits.' });
    }

    const { ip, browser, os, deviceType } = parseDeviceInfo(req);
    const claimId = generateClaimId();
    const submissionTime = new Date();

    const claimDoc = {
      claimId,
      spinId: spinId || null,
      name,
      email,
      phone,
      addressLine1,
      addressLine2: addressLine2 || '',
      city,
      district,
      state,
      country,
      pinCode,
      occupation: occupation || '',
      age: parseInt(age, 10),
      gender,
      preferredDeliveryTime: preferredDeliveryTime || 'Anytime',
      additionalNotes: additionalNotes || '',
      prize,
      ipAddress: ip,
      browser,
      os,
      deviceType,
      submissionTime,
      status: 'Pending'
    };

    let savedClaim = null;

    if (getDbState()) {
      try {
        savedClaim = await withTimeout(Claim.create(claimDoc), 3000);
        if (spinId) {
          Spin.findByIdAndUpdate(spinId, { claimed: true, claimId }).catch(() => {});
        }
      } catch (dbErr) {
        console.warn('[Claim DB Fallback] Storing in memory fallback:', dbErr.message);
        savedClaim = { id: 'claim_' + Date.now(), ...claimDoc };
        inMemoryStore.claims.push(savedClaim);
      }
    } else {
      savedClaim = { id: 'claim_' + Date.now(), ...claimDoc };
      inMemoryStore.claims.push(savedClaim);
    }

    return res.json({
      success: true,
      claimId,
      message: 'Your reward claim has been successfully submitted!',
      claim: savedClaim
    });
  } catch (error) {
    console.error('Error in submitClaim:', error);
    return res.status(500).json({ success: false, message: 'Server error processing reward claim.' });
  }
};
