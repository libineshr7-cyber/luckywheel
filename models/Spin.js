const mongoose = require('mongoose');

const SpinSchema = new mongoose.Schema({
  fingerprint: { type: String, required: true, index: true },
  ip: { type: String, required: true, index: true },
  browser: { type: String, default: 'Unknown' },
  os: { type: String, default: 'Unknown' },
  deviceType: { type: String, default: 'Desktop' },
  prize: { type: String, required: true },
  spinTimestamp: { type: Date, default: Date.now },
  nextEligibleSpin: { type: Date, required: true },
  claimId: { type: String, default: null },
  claimed: { type: Boolean, default: false }
}, {
  timestamps: true,
  collection: 'spins'
});

module.exports = mongoose.model('Spin', SpinSchema);
