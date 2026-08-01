const mongoose = require('mongoose');

const ClaimSchema = new mongoose.Schema({
  claimId: { type: String, required: true, unique: true, index: true },
  spinId: { type: String, default: null },
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  addressLine1: { type: String, required: true },
  addressLine2: { type: String, default: '' },
  city: { type: String, required: true },
  district: { type: String, required: true },
  state: { type: String, required: true },
  country: { type: String, required: true },
  pinCode: { type: String, required: true },
  occupation: { type: String, default: '' },
  age: { type: Number, required: true },
  gender: { type: String, required: true },
  preferredDeliveryTime: { type: String, default: 'Anytime' },
  additionalNotes: { type: String, default: '' },
  prize: { type: String, required: true },
  ipAddress: { type: String, default: '0.0.0.0' },
  browser: { type: String, default: 'Unknown' },
  os: { type: String, default: 'Unknown' },
  deviceType: { type: String, default: 'Desktop' },
  submissionTime: { type: Date, default: Date.now },
  status: { type: String, enum: ['Pending', 'Completed', 'Processing', 'Cancelled'], default: 'Pending' }
}, {
  timestamps: true,
  collection: 'luck' // Points directly to the 'luck' collection in your 'Spinwheel' database!
});

module.exports = mongoose.model('Claim', ClaimSchema);
