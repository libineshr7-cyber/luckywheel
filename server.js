require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { connectDB } = require('./config/db');

const spinController = require('./controllers/spinController');
const claimController = require('./controllers/claimController');
const adminController = require('./controllers/adminController');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect Database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend
app.use(express.static(path.join(__dirname, 'public')));

// Public APIs
app.get('/api/spin/status', spinController.checkStatus);
app.post('/api/spin/record', spinController.recordSpin);
app.post('/api/claims/submit', claimController.submitClaim);

// Admin APIs
app.post('/api/admin/login', adminController.login);
app.get('/api/admin/stats', adminController.getStats);
app.get('/api/admin/claims', adminController.getClaims);
app.patch('/api/admin/claims/:id/status', adminController.updateClaimStatus);
app.delete('/api/admin/claims/:id', adminController.deleteClaim);
app.get('/api/admin/export/csv', adminController.exportCSV);
app.get('/api/admin/export/excel', adminController.exportExcel);

// Direct route for admin page
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Fallback route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 Daily Lucky Spin Server running on http://localhost:${PORT}`);
  console.log(`🏠 Homepage: http://localhost:${PORT}`);
  console.log(`🔐 Admin Panel: http://localhost:${PORT}/admin`);
  console.log(`====================================================`);
});
