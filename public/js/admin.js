(function () {
  'use strict';

  const adminLoginSection = document.getElementById('adminLoginSection');
  const adminDashboardSection = document.getElementById('adminDashboardSection');
  const adminLoginForm = document.getElementById('adminLoginForm');
  const adminLogoutBtn = document.getElementById('adminLogoutBtn');

  const statTotalSpins = document.getElementById('statTotalSpins');
  const statTodaySpins = document.getElementById('statTodaySpins');
  const statTotalClaims = document.getElementById('statTotalClaims');
  const statPendingClaims = document.getElementById('statPendingClaims');
  const statCompletedClaims = document.getElementById('statCompletedClaims');

  const filterSearch = document.getElementById('filterSearch');
  const filterPrize = document.getElementById('filterPrize');
  const filterStatus = document.getElementById('filterStatus');
  const filterStartDate = document.getElementById('filterStartDate');
  const filterEndDate = document.getElementById('filterEndDate');

  const claimsTableBody = document.getElementById('claimsTableBody');
  const claimDetailModal = document.getElementById('claimDetailModal');
  const closeDetailModalBtn = document.getElementById('closeDetailModalBtn');
  const detailClaimId = document.getElementById('detailClaimId');
  const detailContent = document.getElementById('detailContent');
  const markCompleteBtn = document.getElementById('markCompleteBtn');
  const deleteClaimBtn = document.getElementById('deleteClaimBtn');

  const toastContainer = document.getElementById('toastContainer');

  let activeClaims = [];
  let selectedClaim = null;

  function showToast(msg, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = msg;
    toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  function checkAuth() {
    const token = sessionStorage.getItem('luxespin_admin_token');
    if (token) {
      adminLoginSection.style.display = 'none';
      adminDashboardSection.style.display = 'block';
      adminLogoutBtn.style.display = 'inline-block';
      loadDashboardData();
    } else {
      adminLoginSection.style.display = 'block';
      adminDashboardSection.style.display = 'none';
      adminLogoutBtn.style.display = 'none';
    }
  }

  async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('adminUser').value.trim();
    const password = document.getElementById('adminPass').value.trim();

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        sessionStorage.setItem('luxespin_admin_token', data.token);
        checkAuth();
        showToast('Authenticated as Admin', 'success');
      } else {
        showToast(data.message || 'Invalid credentials', 'error');
      }
    } catch (err) {
      showToast('Login request failed', 'error');
    }
  }

  function handleLogout() {
    sessionStorage.removeItem('luxespin_admin_token');
    checkAuth();
  }

  async function loadDashboardData() {
    fetchStats();
    fetchClaims();
  }

  async function fetchStats() {
    try {
      const res = await fetch('/api/admin/stats');
      const data = await res.json();
      if (data.success && data.stats) {
        statTotalSpins.textContent = data.stats.totalSpins || 0;
        statTodaySpins.textContent = data.stats.todaySpins || 0;
        statTotalClaims.textContent = data.stats.totalClaims || 0;
        statPendingClaims.textContent = data.stats.pendingClaims || 0;
        statCompletedClaims.textContent = data.stats.completedClaims || 0;
      }
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  }

  async function fetchClaims() {
    const query = filterSearch.value.trim();
    const prize = filterPrize.value;
    const status = filterStatus.value;
    const startDate = filterStartDate.value;
    const endDate = filterEndDate.value;

    const params = new URLSearchParams({
      query,
      prize,
      status,
      startDate,
      endDate
    });

    try {
      const res = await fetch(`/api/admin/claims?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        activeClaims = data.claims || [];
        renderClaimsTable(activeClaims);
      }
    } catch (err) {
      console.error('Failed to fetch claims:', err);
      claimsTableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 24px; color: #dc2626;">Failed to load claims.</td></tr>`;
    }
  }

  function renderClaimsTable(claims) {
    if (!claims || claims.length === 0) {
      claimsTableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 32px; color: var(--text-muted);">No claim records found matching criteria.</td></tr>`;
      return;
    }

    claimsTableBody.innerHTML = claims.map(c => {
      const dateStr = c.submissionTime ? new Date(c.submissionTime).toLocaleDateString() + ' ' + new Date(c.submissionTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'N/A';
      
      let badgeClass = 'badge-pending';
      if (c.status === 'Completed') badgeClass = 'badge-completed';
      if (c.status === 'Processing') badgeClass = 'badge-processing';
      if (c.status === 'Cancelled') badgeClass = 'badge-cancelled';

      const claimId = c.claimId || c._id;

      return `
        <tr>
          <td><strong>${c.claimId || 'N/A'}</strong></td>
          <td>${escapeHtml(c.name || 'N/A')}</td>
          <td>${escapeHtml(c.phone || 'N/A')}</td>
          <td><strong>${escapeHtml(c.prize || 'N/A')}</strong></td>
          <td>${dateStr}</td>
          <td><span class="badge ${badgeClass}">${c.status || 'Pending'}</span></td>
          <td>
            <button class="btn-action-icon view-btn" data-id="${claimId}">View Details</button>
          </td>
        </tr>
      `;
    }).join('');

    // Attach row click listeners
    document.querySelectorAll('.view-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.getAttribute('data-id');
        const found = activeClaims.find(c => c.claimId === id || c._id === id || c.id === id);
        if (found) openClaimDetailModal(found);
      });
    });
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, function (m) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m];
    });
  }

  function openClaimDetailModal(claim) {
    selectedClaim = claim;
    detailClaimId.textContent = `Claim: ${claim.claimId || 'N/A'}`;

    const fields = [
      { label: 'Full Name', val: claim.name },
      { label: 'Email Address', val: claim.email },
      { label: 'Phone Number', val: claim.phone },
      { label: 'Prize Won', val: claim.prize },
      { label: 'Address Line 1', val: claim.addressLine1 },
      { label: 'Address Line 2', val: claim.addressLine2 || 'None' },
      { label: 'City', val: claim.city },
      { label: 'District', val: claim.district },
      { label: 'State / Province', val: claim.state },
      { label: 'Country', val: claim.country },
      { label: 'PIN Code', val: claim.pinCode },
      { label: 'Occupation', val: claim.occupation || 'Not specified' },
      { label: 'Age', val: claim.age },
      { label: 'Gender', val: claim.gender },
      { label: 'Preferred Delivery', val: claim.preferredDeliveryTime },
      { label: 'Additional Notes', val: claim.additionalNotes || 'None' },
      { label: 'IP Address', val: claim.ipAddress },
      { label: 'Browser & OS', val: `${claim.browser || ''} on ${claim.os || ''}` },
      { label: 'Device Type', val: claim.deviceType },
      { label: 'Claim Status', val: claim.status }
    ];

    detailContent.innerHTML = fields.map(f => `
      <div class="detail-item">
        <strong>${f.label}</strong>
        <span>${escapeHtml(f.val || 'N/A')}</span>
      </div>
    `).join('');

    if (claim.status === 'Completed') {
      markCompleteBtn.textContent = 'Mark as Pending';
    } else {
      markCompleteBtn.textContent = 'Mark Completed';
    }

    claimDetailModal.classList.add('active');
  }

  function closeClaimDetailModal() {
    claimDetailModal.classList.remove('active');
    selectedClaim = null;
  }

  async function handleToggleStatus() {
    if (!selectedClaim) return;
    const targetStatus = selectedClaim.status === 'Completed' ? 'Pending' : 'Completed';
    const id = selectedClaim._id || selectedClaim.id || selectedClaim.claimId;

    try {
      const res = await fetch(`/api/admin/claims/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: targetStatus })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Status updated to ${targetStatus}`, 'success');
        closeClaimDetailModal();
        loadDashboardData();
      } else {
        showToast(data.message || 'Failed to update status', 'error');
      }
    } catch (err) {
      showToast('Error updating status', 'error');
    }
  }

  async function handleDeleteClaim() {
    if (!selectedClaim) return;
    if (!confirm(`Are you sure you want to delete claim ${selectedClaim.claimId}?`)) return;

    const id = selectedClaim._id || selectedClaim.id || selectedClaim.claimId;

    try {
      const res = await fetch(`/api/admin/claims/${id}`, {
        method: 'DELETE'
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast('Claim record deleted', 'success');
        closeClaimDetailModal();
        loadDashboardData();
      } else {
        showToast(data.message || 'Failed to delete claim', 'error');
      }
    } catch (err) {
      showToast('Error deleting claim', 'error');
    }
  }

  // Event Listeners for Filters
  let debounceTimeout;
  [filterSearch, filterPrize, filterStatus, filterStartDate, filterEndDate].forEach(el => {
    el.addEventListener('input', () => {
      clearTimeout(debounceTimeout);
      debounceTimeout = setTimeout(fetchClaims, 300);
    });
  });

  adminLoginForm.addEventListener('submit', handleLogin);
  adminLogoutBtn.addEventListener('click', handleLogout);
  closeDetailModalBtn.addEventListener('click', closeClaimDetailModal);
  markCompleteBtn.addEventListener('click', handleToggleStatus);
  deleteClaimBtn.addEventListener('click', handleDeleteClaim);

  claimDetailModal.addEventListener('click', (e) => {
    if (e.target === claimDetailModal) closeClaimDetailModal();
  });

  document.addEventListener('DOMContentLoaded', checkAuth);

})();
