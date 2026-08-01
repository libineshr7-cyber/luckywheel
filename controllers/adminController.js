const Claim = require('../models/Claim');
const Spin = require('../models/Spin');
const { getDbState, inMemoryStore } = require('../config/db');

exports.login = (req, res) => {
  const { username, password } = req.body;
  const adminUser = process.env.ADMIN_USERNAME || 'admin';
  const adminPass = process.env.ADMIN_PASSWORD || 'admin123';

  if (username === adminUser && password === adminPass) {
    return res.json({
      success: true,
      token: 'admin-secret-session-token-' + Date.now(),
      message: 'Admin authentication successful'
    });
  }

  return res.status(401).json({
    success: false,
    message: 'Invalid admin credentials'
  });
};

exports.getStats = async (req, res) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    if (getDbState()) {
      const totalSpins = await Spin.countDocuments();
      const todaySpins = await Spin.countDocuments({ spinTimestamp: { $gte: todayStart } });
      const totalClaims = await Claim.countDocuments();
      const pendingClaims = await Claim.countDocuments({ status: 'Pending' });
      const completedClaims = await Claim.countDocuments({ status: 'Completed' });
      const recentWinners = await Claim.find()
        .sort({ submissionTime: -1 })
        .limit(6)
        .select('name prize submissionTime claimId status');

      return res.json({
        success: true,
        stats: {
          totalSpins,
          todaySpins,
          totalClaims,
          pendingClaims,
          completedClaims
        },
        recentWinners
      });
    } else {
      const totalSpins = inMemoryStore.spins.length;
      const todaySpins = inMemoryStore.spins.filter(s => new Date(s.spinTimestamp) >= todayStart).length;
      const totalClaims = inMemoryStore.claims.length;
      const pendingClaims = inMemoryStore.claims.filter(c => c.status === 'Pending').length;
      const completedClaims = inMemoryStore.claims.filter(c => c.status === 'Completed').length;
      const recentWinners = [...inMemoryStore.claims]
        .sort((a, b) => new Date(b.submissionTime) - new Date(a.submissionTime))
        .slice(0, 6);

      return res.json({
        success: true,
        stats: {
          totalSpins,
          todaySpins,
          totalClaims,
          pendingClaims,
          completedClaims
        },
        recentWinners
      });
    }
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ success: false, message: 'Server error loading dashboard metrics' });
  }
};

exports.getClaims = async (req, res) => {
  try {
    const { query, prize, status, startDate, endDate } = req.query;

    if (getDbState()) {
      let dbQuery = {};

      if (query) {
        const regex = new RegExp(query, 'i');
        dbQuery.$or = [
          { claimId: regex },
          { name: regex },
          { email: regex },
          { phone: regex },
          { city: regex },
          { state: regex }
        ];
      }

      if (prize && prize !== 'ALL') dbQuery.prize = prize;
      if (status && status !== 'ALL') dbQuery.status = status;

      if (startDate || endDate) {
        dbQuery.submissionTime = {};
        if (startDate) dbQuery.submissionTime.$gte = new Date(startDate);
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          dbQuery.submissionTime.$lte = end;
        }
      }

      const claims = await Claim.find(dbQuery).sort({ submissionTime: -1 });
      return res.json({ success: true, claims });
    } else {
      let filtered = [...inMemoryStore.claims];

      if (query) {
        const q = query.toLowerCase();
        filtered = filtered.filter(
          c =>
            (c.claimId && c.claimId.toLowerCase().includes(q)) ||
            (c.name && c.name.toLowerCase().includes(q)) ||
            (c.email && c.email.toLowerCase().includes(q)) ||
            (c.phone && c.phone.includes(q)) ||
            (c.city && c.city.toLowerCase().includes(q)) ||
            (c.state && c.state.toLowerCase().includes(q))
        );
      }

      if (prize && prize !== 'ALL') {
        filtered = filtered.filter(c => c.prize === prize);
      }

      if (status && status !== 'ALL') {
        filtered = filtered.filter(c => c.status === status);
      }

      if (startDate) {
        const sTime = new Date(startDate).getTime();
        filtered = filtered.filter(c => new Date(c.submissionTime).getTime() >= sTime);
      }

      if (endDate) {
        const eTime = new Date(endDate).setHours(23, 59, 59, 999);
        filtered = filtered.filter(c => new Date(c.submissionTime).getTime() <= eTime);
      }

      filtered.sort((a, b) => new Date(b.submissionTime) - new Date(a.submissionTime));
      return res.json({ success: true, claims: filtered });
    }
  } catch (error) {
    console.error('Error fetching claims:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving claims.' });
  }
};

exports.updateClaimStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['Pending', 'Completed', 'Processing', 'Cancelled'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid claim status' });
    }

    if (getDbState()) {
      const updated = await Claim.findByIdAndUpdate(id, { status }, { new: true });
      if (!updated) {
        // try searching by claimId
        const updatedByClaimId = await Claim.findOneAndUpdate({ claimId: id }, { status }, { new: true });
        if (!updatedByClaimId) return res.status(404).json({ success: false, message: 'Claim record not found' });
        return res.json({ success: true, claim: updatedByClaimId });
      }
      return res.json({ success: true, claim: updated });
    } else {
      const claim = inMemoryStore.claims.find(c => c.id === id || c._id === id || c.claimId === id);
      if (!claim) return res.status(404).json({ success: false, message: 'Claim record not found' });
      claim.status = status;
      return res.json({ success: true, claim });
    }
  } catch (error) {
    console.error('Error updating claim status:', error);
    res.status(500).json({ success: false, message: 'Server error updating status' });
  }
};

exports.deleteClaim = async (req, res) => {
  try {
    const { id } = req.params;

    if (getDbState()) {
      const deleted = await Claim.findByIdAndDelete(id);
      if (!deleted) {
        await Claim.findOneAndDelete({ claimId: id });
      }
    } else {
      inMemoryStore.claims = inMemoryStore.claims.filter(
        c => c.id !== id && c._id !== id && c.claimId !== id
      );
    }

    res.json({ success: true, message: 'Claim record deleted successfully' });
  } catch (error) {
    console.error('Error deleting claim:', error);
    res.status(500).json({ success: false, message: 'Server error deleting claim record' });
  }
};

// CSV Export
exports.exportCSV = async (req, res) => {
  try {
    let claims = [];
    if (getDbState()) {
      claims = await Claim.find().sort({ submissionTime: -1 });
    } else {
      claims = [...inMemoryStore.claims].sort((a, b) => new Date(b.submissionTime) - new Date(a.submissionTime));
    }

    const headers = [
      'Claim ID', 'Name', 'Email', 'Phone', 'Prize', 'Status',
      'Address 1', 'Address 2', 'City', 'District', 'State', 'Country', 'PIN Code',
      'Occupation', 'Age', 'Gender', 'Preferred Delivery', 'Notes',
      'IP Address', 'Browser', 'OS', 'Device', 'Submission Time'
    ];

    let csvContent = headers.join(',') + '\n';

    claims.forEach(c => {
      const row = [
        `"${c.claimId || ''}"`,
        `"${(c.name || '').replace(/"/g, '""')}"`,
        `"${(c.email || '').replace(/"/g, '""')}"`,
        `"${(c.phone || '').replace(/"/g, '""')}"`,
        `"${(c.prize || '').replace(/"/g, '""')}"`,
        `"${c.status || 'Pending'}"`,
        `"${(c.addressLine1 || '').replace(/"/g, '""')}"`,
        `"${(c.addressLine2 || '').replace(/"/g, '""')}"`,
        `"${(c.city || '').replace(/"/g, '""')}"`,
        `"${(c.district || '').replace(/"/g, '""')}"`,
        `"${(c.state || '').replace(/"/g, '""')}"`,
        `"${(c.country || '').replace(/"/g, '""')}"`,
        `"${c.pinCode || ''}"`,
        `"${(c.occupation || '').replace(/"/g, '""')}"`,
        `"${c.age || ''}"`,
        `"${c.gender || ''}"`,
        `"${(c.preferredDeliveryTime || '').replace(/"/g, '""')}"`,
        `"${(c.additionalNotes || '').replace(/"/g, '""')}"`,
        `"${c.ipAddress || ''}"`,
        `"${(c.browser || '').replace(/"/g, '""')}"`,
        `"${(c.os || '').replace(/"/g, '""')}"`,
        `"${c.deviceType || ''}"`,
        `"${c.submissionTime ? new Date(c.submissionTime).toISOString() : ''}"`
      ];
      csvContent += row.join(',') + '\n';
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=claims_export_${Date.now()}.csv`);
    return res.status(200).send(csvContent);
  } catch (error) {
    console.error('Error exporting CSV:', error);
    res.status(500).json({ success: false, message: 'Export failed' });
  }
};

// Excel XML / CSV Export compatibility
exports.exportExcel = async (req, res) => {
  // Generates an Excel-friendly CSV with BOM for proper Unicode & Excel formatting
  try {
    let claims = [];
    if (getDbState()) {
      claims = await Claim.find().sort({ submissionTime: -1 });
    } else {
      claims = [...inMemoryStore.claims].sort((a, b) => new Date(b.submissionTime) - new Date(a.submissionTime));
    }

    const headers = [
      'Claim ID', 'Name', 'Email', 'Phone', 'Prize', 'Status',
      'Address Line 1', 'Address Line 2', 'City', 'District', 'State', 'Country', 'PIN Code',
      'Occupation', 'Age', 'Gender', 'Preferred Delivery Time', 'Additional Notes',
      'IP Address', 'Browser', 'OS', 'Device Type', 'Submission Time'
    ];

    let csvContent = '\uFEFF'; // UTF-8 BOM for Excel compatibility
    csvContent += headers.join('\t') + '\n';

    claims.forEach(c => {
      const row = [
        c.claimId || '',
        (c.name || '').replace(/\t/g, ' '),
        (c.email || '').replace(/\t/g, ' '),
        (c.phone || '').replace(/\t/g, ' '),
        (c.prize || '').replace(/\t/g, ' '),
        c.status || 'Pending',
        (c.addressLine1 || '').replace(/\t/g, ' '),
        (c.addressLine2 || '').replace(/\t/g, ' '),
        (c.city || '').replace(/\t/g, ' '),
        (c.district || '').replace(/\t/g, ' '),
        (c.state || '').replace(/\t/g, ' '),
        (c.country || '').replace(/\t/g, ' '),
        c.pinCode || '',
        (c.occupation || '').replace(/\t/g, ' '),
        c.age || '',
        c.gender || '',
        (c.preferredDeliveryTime || '').replace(/\t/g, ' '),
        (c.additionalNotes || '').replace(/\t/g, ' '),
        c.ipAddress || '',
        (c.browser || '').replace(/\t/g, ' '),
        (c.os || '').replace(/\t/g, ' '),
        c.deviceType || '',
        c.submissionTime ? new Date(c.submissionTime).toLocaleString() : ''
      ];
      csvContent += row.join('\t') + '\n';
    });

    res.setHeader('Content-Type', 'application/vnd.ms-excel; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=claims_report_${Date.now()}.xls`);
    return res.status(200).send(csvContent);
  } catch (error) {
    console.error('Error exporting Excel:', error);
    res.status(500).json({ success: false, message: 'Excel export failed' });
  }
};
