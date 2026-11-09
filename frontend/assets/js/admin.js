/**
 * StaffConnect - Admin Dashboard Management Controller
 * Upgraded with Animations, Skeletons, Multi-Section Validation, Phone OTP & Avatar Uploads
 */

let allEmployees = [];
let allDepartments = [];
let filteredEmployees = [];
let currentPage = 1;
const pageSize = 8;
let deptChartInstance = null;
let trendChartInstance = null;
let currentEmployeeToDelete = null;
let otpCountdownTimer = null;

document.addEventListener('DOMContentLoaded', () => {
  const user = protectPage('ROLE_ADMIN');
  if (!user) return;

  initAdminDashboard();
});

async function initAdminDashboard() {
  renderTableSkeletons();
  setupEventListeners();
  setupAvatarUploadHandlers();
  setupFormRealTimeValidation();
  setupModalBackdropHandlers();

  await loadDepartmentsDropdown();
  await loadDashboardStats();
  await loadEmployeeDirectory();
}

function setupEventListeners() {
  // Mobile sidebar toggle
  const mobileToggle = document.getElementById('mobileSidebarToggle');
  const sidebar = document.getElementById('sidebar');
  if (mobileToggle && sidebar) {
    mobileToggle.addEventListener('click', () => {
      sidebar.classList.toggle('active');
    });
  }

  // Live search with debounce
  const searchInput = document.getElementById('employeeSearch');
  if (searchInput) {
    let debounceTimer;
    searchInput.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        applyFilters();
      }, 250);
    });
  }

  // Filters
  const deptFilter = document.getElementById('departmentFilter');
  const statusFilter = document.getElementById('statusFilter');
  if (deptFilter) deptFilter.addEventListener('change', applyFilters);
  if (statusFilter) statusFilter.addEventListener('change', applyFilters);

  // Forms
  const addEmployeeForm = document.getElementById('addEmployeeForm');
  if (addEmployeeForm) {
    addEmployeeForm.addEventListener('submit', handleAddEmployee);
  }

  const editEmployeeForm = document.getElementById('editEmployeeForm');
  if (editEmployeeForm) {
    editEmployeeForm.addEventListener('submit', handleEditEmployee);
  }

  // Export CSV
  const exportBtn = document.getElementById('exportCsvBtn');
  if (exportBtn) {
    exportBtn.addEventListener('click', exportToCSV);
  }

  // Auto-sync Work Email with Login Email
  const addEmailInput = document.getElementById('addEmpEmail');
  const addLoginEmail = document.getElementById('addEmpLoginEmail');
  if (addEmailInput && addLoginEmail) {
    addEmailInput.addEventListener('input', () => {
      addLoginEmail.value = addEmailInput.value.trim().toLowerCase();
    });
  }
}

/**
 * Close modal on backdrop click or Escape key
 */
function setupModalBackdropHandlers() {
  document.querySelectorAll('.modal-backdrop').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeAllModals();
      }
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeAllModals();
    }
  });
}

function closeAllModals() {
  closeAddEmployeeModal();
  closeEditEmployeeModal();
  closeDossierModal();
  closeDeleteModal();
}

/**
 * Shimmer Loading Skeletons for Table
 */
function renderTableSkeletons() {
  const tbody = document.getElementById('employeeTableBody');
  if (!tbody) return;

  let skeletonRows = '';
  for (let i = 0; i < 5; i++) {
    skeletonRows += `
      <tr>
        <td>
          <div class="emp-cell">
            <div class="skeleton" style="width: 42px; height: 42px; border-radius: 50%;"></div>
            <div style="display: flex; flex-direction: column; gap: 6px;">
              <div class="skeleton" style="width: 120px; height: 14px;"></div>
              <div class="skeleton" style="width: 160px; height: 11px;"></div>
            </div>
          </div>
        </td>
        <td><div class="skeleton" style="width: 70px; height: 14px;"></div></td>
        <td><div class="skeleton" style="width: 90px; height: 14px;"></div></td>
        <td><div class="skeleton" style="width: 110px; height: 14px;"></div></td>
        <td><div class="skeleton" style="width: 95px; height: 14px;"></div></td>
        <td><div class="skeleton" style="width: 60px; height: 14px;"></div></td>
        <td><div class="skeleton" style="width: 70px; height: 20px; border-radius: 9999px;"></div></td>
        <td><div class="skeleton" style="width: 80px; height: 26px;"></div></td>
      </tr>
    `;
  }
  tbody.innerHTML = skeletonRows;
}

/**
 * Load & Animate Dashboard Statistics
 */
async function loadDashboardStats() {
  try {
    const res = await api.get('/dashboard/stats');
    if (res.success && res.data) {
      const stats = res.data;

      // Animated counters
      animateCounter('statTotalEmployees', stats.totalEmployees);
      animateCounter('statActiveEmployees', stats.activeEmployees);
      animateCounter('statOnLeaveEmployees', stats.onLeaveEmployees);
      animateCounter('statDepartmentCount', stats.departmentCount);

      // Render Charts
      renderDepartmentChart(stats.departmentDistribution);
      renderTrendsChart(stats.monthlyJoinTrends);

      // Render Activity Feed
      renderRecentActivity(stats.recentActivities);
    }
  } catch (error) {
    console.error('Failed to load dashboard stats:', error);
    showToast('Analytics', 'Could not refresh dashboard statistics.', 'warning');
  }
}

function renderDepartmentChart(distribution) {
  const canvas = document.getElementById('departmentChart');
  if (!canvas) return;

  const labels = distribution ? Object.keys(distribution) : [];
  const data = distribution ? Object.values(distribution) : [];

  if (deptChartInstance) {
    deptChartInstance.destroy();
  }

  const ctx = canvas.getContext('2d');
  deptChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels.length ? labels : ['No Data'],
      datasets: [{
        data: data.length ? data : [1],
        backgroundColor: [
          '#1d4ed8', '#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#64748b'
        ],
        borderWidth: 2,
        borderColor: '#ffffff',
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 1200,
        easing: 'easeOutQuart'
      },
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            boxWidth: 12,
            font: { size: 11, family: 'Inter' }
          }
        }
      },
      cutout: '68%'
    }
  });
}

function renderTrendsChart(trends) {
  const canvas = document.getElementById('trendChart');
  if (!canvas) return;

  const labels = trends ? Object.keys(trends) : [];
  const data = trends ? Object.values(trends) : [];

  if (trendChartInstance) {
    trendChartInstance.destroy();
  }

  const ctx = canvas.getContext('2d');
  trendChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'New Employees',
        data: data,
        backgroundColor: '#3b82f6',
        borderRadius: 6,
        barThickness: 24,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 1200,
        easing: 'easeOutQuart'
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { stepSize: 1, precision: 0 }
        },
        x: {
          grid: { display: false }
        }
      },
      plugins: {
        legend: { display: false }
      }
    }
  });
}

function renderRecentActivity(activities) {
  const container = document.getElementById('recentActivityFeed');
  if (!container) return;

  if (!activities || activities.length === 0) {
    container.innerHTML = '<p class="text-muted" style="font-size:0.85rem;">No recent activities.</p>';
    return;
  }

  let html = '<ul style="list-style:none; display:flex; flex-direction:column; gap:12px;">';
  activities.slice(0, 5).forEach(act => {
    html += `
      <li style="display:flex; align-items:flex-start; gap:10px; font-size:0.84rem;">
        <i class="fas fa-circle-dot" style="color:var(--primary); font-size:0.6rem; margin-top:6px;"></i>
        <div>
          <div style="font-weight:600; color:var(--text-main);">${escapeHtml(act.details || act.action)}</div>
          <div style="font-size:0.75rem; color:var(--text-muted);">${formatDateTime(act.timestamp)} by ${escapeHtml(act.performedBy || 'System')}</div>
        </div>
      </li>
    `;
  });
  html += '</ul>';
  container.innerHTML = html;
}

async function loadDepartmentsDropdown() {
  try {
    const res = await api.get('/departments');
    if (res.success && res.data) {
      allDepartments = res.data;

      const filterSelect = document.getElementById('departmentFilter');
      const addSelect = document.getElementById('addEmpDepartment');
      const editSelect = document.getElementById('editEmpDepartment');

      let filterOptions = '<option value="">All Departments</option>';
      let formOptions = '<option value="">Select Department</option>';

      allDepartments.forEach(d => {
        filterOptions += `<option value="${escapeHtml(d.name)}">${escapeHtml(d.name)}</option>`;
        formOptions += `<option value="${escapeHtml(d.name)}">${escapeHtml(d.name)}</option>`;
      });

      if (filterSelect) filterSelect.innerHTML = filterOptions;
      if (addSelect) addSelect.innerHTML = formOptions;
      if (editSelect) editSelect.innerHTML = formOptions;
    }
  } catch (error) {
    console.error('Failed to load departments:', error);
  }
}

async function loadEmployeeDirectory() {
  try {
    const res = await api.get('/employees');
    if (res.success && res.data) {
      allEmployees = res.data;
      applyFilters();
    }
  } catch (error) {
    console.error('Failed to load employees:', error);
    showToast('Directory Error', 'Failed to retrieve employee directory.', 'error');
  }
}

function applyFilters() {
  const search = (document.getElementById('employeeSearch')?.value || '').toLowerCase().trim();
  const dept = document.getElementById('departmentFilter')?.value || '';
  const status = document.getElementById('statusFilter')?.value || '';

  filteredEmployees = allEmployees.filter(emp => {
    const matchesSearch = !search ||
      (emp.firstName && emp.firstName.toLowerCase().includes(search)) ||
      (emp.lastName && emp.lastName.toLowerCase().includes(search)) ||
      (emp.email && emp.email.toLowerCase().includes(search)) ||
      (emp.employeeId && emp.employeeId.toLowerCase().includes(search)) ||
      (emp.designation && emp.designation.toLowerCase().includes(search));

    const matchesDept = !dept || (emp.department && emp.department.toLowerCase() === dept.toLowerCase());
    const matchesStatus = !status || (emp.status && emp.status.toUpperCase() === status.toUpperCase());

    return matchesSearch && matchesDept && matchesStatus;
  });

  currentPage = 1;
  renderEmployeeTable();
}

function renderEmployeeTable() {
  const tbody = document.getElementById('employeeTableBody');
  const paginationInfo = document.getElementById('paginationInfo');
  const paginationControls = document.getElementById('paginationControls');
  if (!tbody) return;

  if (filteredEmployees.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align:center; padding: 48px 20px; color: var(--text-muted);">
          <i class="fas fa-users-slash" style="font-size:2.2rem; margin-bottom:12px; display:block; color: #cbd5e1;"></i>
          <strong>No matching employees found</strong>
          <p style="font-size: 0.82rem; margin-top: 4px;">Try adjusting your search query or department filter.</p>
        </td>
      </tr>
    `;
    if (paginationInfo) paginationInfo.textContent = 'Showing 0 of 0 entries';
    if (paginationControls) paginationControls.innerHTML = '';
    return;
  }

  const total = filteredEmployees.length;
  const totalPages = Math.ceil(total / pageSize);
  const startIdx = (currentPage - 1) * pageSize;
  const pageItems = filteredEmployees.slice(startIdx, startIdx + pageSize);

  let html = '';
  pageItems.forEach(emp => {
    const avatar = emp.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&h=256&q=80';
    let statusBadge = `<span class="badge-tag badge-active"><i class="fas fa-check-circle"></i> Active</span>`;
    if (emp.status === 'ON_LEAVE') {
      statusBadge = `<span class="badge-tag badge-leave"><i class="fas fa-clock"></i> On Leave</span>`;
    } else if (emp.status === 'INACTIVE') {
      statusBadge = `<span class="badge-tag badge-inactive"><i class="fas fa-ban"></i> Inactive</span>`;
    }

    const roleBadge = emp.role === 'ROLE_ADMIN'
      ? `<span class="badge-tag badge-role"><i class="fas fa-shield-alt"></i> Admin</span>`
      : `<span style="font-size:0.75rem; color:var(--text-secondary);">Employee</span>`;

    const phoneVerifiedBadge = emp.phoneVerified
      ? `<span style="font-size:0.72rem; color:var(--success-text); display:inline-flex; align-items:center; gap:3px;"><i class="fas fa-check-circle"></i> ${escapeHtml(emp.phone || 'Verified')}</span>`
      : `<span style="font-size:0.72rem; color:var(--text-muted); display:inline-flex; align-items:center; gap:3px;"><i class="fas fa-circle-question"></i> ${escapeHtml(emp.phone || 'Unverified')}</span>`;

    html += `
      <tr>
        <td>
          <div class="emp-cell">
            <img src="${avatar}" alt="${escapeHtml(emp.fullName)}" class="emp-avatar" onerror="this.src='https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&h=256&q=80'">
            <div class="emp-details">
              <span class="emp-name">${escapeHtml(emp.fullName)}</span>
              <span class="emp-email">${escapeHtml(emp.email)}</span>
            </div>
          </div>
        </td>
        <td><strong style="color:var(--primary); font-family:monospace;">${escapeHtml(emp.employeeId)}</strong></td>
        <td>${escapeHtml(emp.department)}</td>
        <td>${escapeHtml(emp.designation)}</td>
        <td>${phoneVerifiedBadge}</td>
        <td>${roleBadge}</td>
        <td>${statusBadge}</td>
        <td>
          <div style="display:flex; align-items:center; gap:6px;">
            <button class="btn-icon" title="View Dossier" onclick="viewEmployeeDossier(${emp.id})">
              <i class="fas fa-eye"></i>
            </button>
            <button class="btn-icon edit" title="Edit Employee" onclick="openEditEmployeeModal(${emp.id})">
              <i class="fas fa-pencil-alt"></i>
            </button>
            <button class="btn-icon" title="Toggle Status" onclick="toggleEmployeeStatus(${emp.id}, '${emp.status}')">
              <i class="fas fa-sync-alt"></i>
            </button>
            <button class="btn-icon delete" title="Delete Employee" onclick="confirmDeleteEmployee(${emp.id}, '${escapeHtml(emp.fullName)}')">
              <i class="fas fa-trash-alt"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  });

  tbody.innerHTML = html;

  if (paginationInfo) {
    paginationInfo.textContent = `Showing ${startIdx + 1} to ${Math.min(startIdx + pageSize, total)} of ${total} employees`;
  }

  if (paginationControls) {
    let controlsHtml = `
      <button class="btn btn-secondary btn-sm" ${currentPage === 1 ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ''} onclick="changePage(${currentPage - 1})">
        <i class="fas fa-chevron-left"></i> Prev
      </button>
      <span style="font-size:0.85rem; font-weight:600; padding:0 8px;">${currentPage} / ${totalPages}</span>
      <button class="btn btn-secondary btn-sm" ${currentPage === totalPages ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ''} onclick="changePage(${currentPage + 1})">
        Next <i class="fas fa-chevron-right"></i>
      </button>
    `;
    paginationControls.innerHTML = controlsHtml;
  }
}

function changePage(newPage) {
  const totalPages = Math.ceil(filteredEmployees.length / pageSize);
  if (newPage < 1 || newPage > totalPages) return;
  currentPage = newPage;
  renderEmployeeTable();
}

/**
 * Real-Time Validation Setup
 */
function setupFormRealTimeValidation() {
  const addForm = document.getElementById('addEmployeeForm');
  if (!addForm) return;

  const emailField = document.getElementById('addEmpEmail');
  if (emailField) {
    emailField.addEventListener('blur', () => {
      const email = emailField.value.trim().toLowerCase();
      const grp = document.getElementById('grpAddEmail');
      const isDuplicate = allEmployees.some(e => e.email.toLowerCase() === email);

      if (!isValidEmail(email) || isDuplicate) {
        grp.classList.add('has-error');
        emailField.classList.add('is-invalid');
        emailField.classList.remove('is-valid');
        const feedback = grp.querySelector('.invalid-feedback');
        if (feedback) feedback.textContent = isDuplicate ? 'This email is already registered' : 'Enter a valid corporate email';
      } else {
        grp.classList.remove('has-error');
        emailField.classList.remove('is-invalid');
        emailField.classList.add('is-valid');
      }
    });
  }

  const idField = document.getElementById('addEmpId');
  if (idField) {
    idField.addEventListener('blur', () => {
      const idVal = idField.value.trim();
      const grp = document.getElementById('grpAddId');
      const isDuplicate = allEmployees.some(e => e.employeeId.toLowerCase() === idVal.toLowerCase());

      if (!idVal || isDuplicate) {
        grp.classList.add('has-error');
        idField.classList.add('is-invalid');
        idField.classList.remove('is-valid');
        const feedback = grp.querySelector('.invalid-feedback');
        if (feedback) feedback.textContent = isDuplicate ? 'Employee ID already exists' : 'Employee ID is required';
      } else {
        grp.classList.remove('has-error');
        idField.classList.remove('is-invalid');
        idField.classList.add('is-valid');
      }
    });
  }

  const dobField = document.getElementById('addEmpDob');
  if (dobField) {
    dobField.addEventListener('change', () => {
      const dobVal = dobField.value;
      const grp = document.getElementById('grpAddDob');
      if (dobVal) {
        const birthDate = new Date(dobVal);
        const ageDifMs = Date.now() - birthDate.getTime();
        const ageDate = new Date(ageDifMs);
        const age = Math.abs(ageDate.getUTCFullYear() - 1970);
        if (age < 18) {
          grp.classList.add('has-error');
          dobField.classList.add('is-invalid');
        } else {
          grp.classList.remove('has-error');
          dobField.classList.remove('is-invalid');
          dobField.classList.add('is-valid');
        }
      }
    });
  }
}

/**
 * Avatar File Upload Handlers (Drag-and-Drop & File Picker)
 */
function setupAvatarUploadHandlers() {
  const addFileInput = document.getElementById('addEmpAvatarFile');
  const addDropBox = document.getElementById('addAvatarDropBox');

  if (addFileInput) {
    addFileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        handleAvatarFileUpload(e.target.files[0], 'add');
      }
    });
  }

  if (addDropBox) {
    addDropBox.addEventListener('dragover', (e) => {
      e.preventDefault();
      addDropBox.classList.add('drag-over');
    });

    addDropBox.addEventListener('dragleave', () => {
      addDropBox.classList.remove('drag-over');
    });

    addDropBox.addEventListener('drop', (e) => {
      e.preventDefault();
      addDropBox.classList.remove('drag-over');
      if (e.dataTransfer.files.length > 0) {
        handleAvatarFileUpload(e.dataTransfer.files[0], 'add');
      }
    });
  }

  // Edit avatar handler
  const editFileInput = document.getElementById('editEmpAvatarFile');
  if (editFileInput) {
    editFileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        handleAvatarFileUpload(e.target.files[0], 'edit');
      }
    });
  }
}

async function handleAvatarFileUpload(file, target = 'add') {
  if (!file.type.startsWith('image/')) {
    showToast('Invalid File', 'Please select a valid image file (JPEG, PNG, WEBP).', 'error');
    return;
  }

  const previewEl = document.getElementById(`${target}AvatarPreview`);
  const nameEl = document.getElementById(`${target}AvatarFileName`);
  const hiddenInput = document.getElementById(`${target}EmpAvatar`);

  // Local instant preview
  const reader = new FileReader();
  reader.onload = (e) => {
    if (previewEl) previewEl.src = e.target.result;
  };
  reader.readAsDataURL(file);

  if (nameEl) nameEl.textContent = `${file.name} (uploading...)`;

  try {
    const res = await api.uploadFile('/upload/avatar', file);
    if (res.success && res.data && res.data.url) {
      if (hiddenInput) hiddenInput.value = res.data.url;
      if (nameEl) nameEl.textContent = `${file.name} (Uploaded)`;
      showToast('Avatar Uploaded', 'Profile picture uploaded successfully.', 'success');
    }
  } catch (error) {
    showToast('Upload Failed', error.message || 'Could not upload image.', 'error');
    if (nameEl) nameEl.textContent = 'Upload failed';
  }
}

/**
 * Mobile OTP Phone Verification
 */
async function initiatePhoneOtp() {
  const phone = document.getElementById('addEmpPhone').value.trim();
  const btn = document.getElementById('btnSendPhoneOtp');
  const widget = document.getElementById('addEmpOtpWidget');

  if (!phone || phone.length < 7) {
    showToast('Validation Error', 'Please enter a valid phone number before sending OTP.', 'warning');
    return;
  }

  try {
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';

    const res = await api.post('/otp/send', { phone });
    if (res.success) {
      widget.classList.add('show');
      showToast('OTP Dispatched', res.message || 'Verification code sent to ' + phone, 'info');

      if (res.data && res.data.devOtp) {
        showToast('Dev Mode Code', `Mock OTP: ${res.data.devOtp}`, 'info');
        document.getElementById('addEmpOtpInput').value = res.data.devOtp;
      }

      startOtpTimer();
    }
  } catch (error) {
    showToast('OTP Failed', error.message || 'Could not send SMS OTP.', 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-arrows-rotate"></i> Resend OTP';
  }
}

function startOtpTimer() {
  clearInterval(otpCountdownTimer);
  let duration = 300; // 5 minutes
  const timerDisplay = document.getElementById('otpTimerDisplay');

  otpCountdownTimer = setInterval(() => {
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    if (timerDisplay) {
      timerDisplay.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    }
    if (--duration < 0) {
      clearInterval(otpCountdownTimer);
      if (timerDisplay) timerDisplay.textContent = 'Expired';
    }
  }, 1000);
}

async function verifyPhoneOtp() {
  const phone = document.getElementById('addEmpPhone').value.trim();
  const otp = document.getElementById('addEmpOtpInput').value.trim();

  if (!otp || otp.length < 4) {
    showToast('Validation Error', 'Please enter the 6-digit OTP code.', 'warning');
    return;
  }

  try {
    const res = await api.post('/otp/verify', { phone, otp });
    if (res.success) {
      document.getElementById('addEmpPhoneVerified').value = 'true';
      clearInterval(otpCountdownTimer);

      const widget = document.getElementById('addEmpOtpWidget');
      if (widget) {
        widget.innerHTML = `<span class="badge-tag badge-active" style="padding: 6px 12px;"><i class="fas fa-check-circle"></i> Phone Number Verified</span>`;
      }
      showToast('Phone Verified', 'Mobile phone successfully authenticated!', 'success');
    }
  } catch (error) {
    showToast('Verification Failed', error.message || 'Invalid or expired OTP code.', 'error');
  }
}

/**
 * Add Employee Modal & Form Submission
 */
function openAddEmployeeModal() {
  const form = document.getElementById('addEmployeeForm');
  if (form) form.reset();

  regenerateEmployeeId();
  regenerateInitialPassword();

  // Reset verification widget & avatar
  const widget = document.getElementById('addEmpOtpWidget');
  if (widget) {
    widget.classList.remove('show');
    widget.innerHTML = `
      <span style="font-size: 0.8rem; font-weight: 600; color: var(--text-main);">Enter 6-digit OTP sent to phone:</span>
      <div class="otp-input-group">
        <input type="text" id="addEmpOtpInput" class="form-control otp-input" placeholder="••••••" maxlength="6">
        <button type="button" class="btn btn-primary btn-sm" onclick="verifyPhoneOtp()">Verify</button>
        <span class="otp-timer" id="otpTimerDisplay">5:00</span>
      </div>
    `;
  }
  document.getElementById('addEmpPhoneVerified').value = 'false';
  document.getElementById('addAvatarPreview').src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&h=256&q=80';
  document.getElementById('addEmpAvatar').value = '';
  document.getElementById('addAvatarFileName').textContent = '';

  // Default join date to today
  const joinInput = document.getElementById('addEmpJoinDate');
  if (joinInput) joinInput.value = new Date().toISOString().split('T')[0];

  // Prevent background scrolling
  document.body.classList.add('modal-open');
  const modal = document.getElementById('addEmployeeModal');
  if (modal) modal.classList.add('show');
}

function closeAddEmployeeModal() {
  const modal = document.getElementById('addEmployeeModal');
  if (modal) {
    modal.classList.remove('show');
    document.body.classList.remove('modal-open');
  }
}

function regenerateEmployeeId() {
  const nextId = 'EMP-' + (allEmployees.length + 1001);
  const empIdInput = document.getElementById('addEmpId');
  if (empIdInput) empIdInput.value = nextId;
}

function regenerateInitialPassword() {
  const passInput = document.getElementById('addEmpPassword');
  if (passInput) passInput.value = 'Staff@' + Math.floor(1000 + Math.random() * 9000);
}

async function handleAddEmployee(e) {
  e.preventDefault();

  const firstName = document.getElementById('addEmpFirstName').value.trim();
  const lastName = document.getElementById('addEmpLastName').value.trim();
  const email = document.getElementById('addEmpEmail').value.trim().toLowerCase();
  const phone = document.getElementById('addEmpPhone').value.trim();
  const employeeId = document.getElementById('addEmpId').value.trim();
  const department = document.getElementById('addEmpDepartment').value;
  const designation = document.getElementById('addEmpDesignation').value.trim();
  const salary = parseFloat(document.getElementById('addEmpSalary').value) || 0;
  const joiningDate = document.getElementById('addEmpJoinDate').value;

  // Real-time validation checks
  if (!firstName || !lastName || !email || !department || !designation || !employeeId) {
    showToast('Incomplete Form', 'Please fill in all mandatory fields marked with an asterisk (*).', 'error');
    return;
  }

  if (!isValidEmail(email)) {
    showToast('Invalid Email', 'Please provide a valid corporate email address.', 'error');
    return;
  }

  const employeeData = {
    employeeId,
    firstName,
    lastName,
    email,
    phone,
    dob: document.getElementById('addEmpDob').value || null,
    gender: document.getElementById('addEmpGender').value || null,
    phoneVerified: document.getElementById('addEmpPhoneVerified').value === 'true',
    department,
    designation,
    salary,
    joiningDate,
    role: document.getElementById('addEmpRole').value,
    status: document.getElementById('addEmpStatus').value,
    initialPassword: document.getElementById('addEmpPassword').value.trim(),
    avatarUrl: document.getElementById('addEmpAvatar').value.trim() || null,
    address: document.getElementById('addEmpAddress').value.trim(),
    skills: document.getElementById('addEmpSkills').value.trim(),
    bio: document.getElementById('addEmpBio').value.trim()
  };

  const submitBtn = document.getElementById('submitAddEmpBtn');
  try {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Registering & Dispatching Email...';

    const res = await api.post('/employees', employeeData);
    if (res.success) {
      const emailStatus = res.data?.emailDeliveryStatus || 'Welcome notification dispatched.';
      showToast('Registration Successful', `Employee ${employeeData.firstName} registered. ${emailStatus}`, 'success');
      
      closeAddEmployeeModal();
      await loadEmployeeDirectory();
      await loadDashboardStats();
    }
  } catch (error) {
    showToast('Registration Error', error.message || 'Could not register employee.', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="fas fa-user-plus"></i> Register Employee';
  }
}

/**
 * Edit Employee Modal & Form Submission
 */
function openEditEmployeeModal(id) {
  const emp = allEmployees.find(e => e.id === id);
  if (!emp) return;

  document.getElementById('editEmpIdPk').value = emp.id;
  document.getElementById('editEmpId').value = emp.employeeId;
  document.getElementById('editEmpFirstName').value = emp.firstName;
  document.getElementById('editEmpLastName').value = emp.lastName;
  document.getElementById('editEmpEmail').value = emp.email;
  document.getElementById('editEmpPhone').value = emp.phone || '';
  document.getElementById('editEmpDob').value = emp.dob || '';
  document.getElementById('editEmpGender').value = emp.gender || '';
  document.getElementById('editEmpDepartment').value = emp.department;
  document.getElementById('editEmpDesignation').value = emp.designation;
  document.getElementById('editEmpSalary').value = emp.salary || 0;
  document.getElementById('editEmpJoinDate').value = emp.joiningDate || '';
  document.getElementById('editEmpRole').value = emp.role || 'ROLE_EMPLOYEE';
  document.getElementById('editEmpStatus').value = emp.status || 'ACTIVE';
  document.getElementById('editEmpPhoneVerified').value = emp.phoneVerified ? 'true' : 'false';
  document.getElementById('editEmpAvatar').value = emp.avatarUrl || '';
  document.getElementById('editAvatarPreview').src = emp.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&h=256&q=80';
  document.getElementById('editAvatarFileName').textContent = '';
  document.getElementById('editEmpAddress').value = emp.address || '';
  document.getElementById('editEmpSkills').value = emp.skills || '';
  document.getElementById('editEmpBio').value = emp.bio || '';

  document.body.classList.add('modal-open');
  const modal = document.getElementById('editEmployeeModal');
  if (modal) modal.classList.add('show');
}

function closeEditEmployeeModal() {
  const modal = document.getElementById('editEmployeeModal');
  if (modal) {
    modal.classList.remove('show');
    document.body.classList.remove('modal-open');
  }
}

async function handleEditEmployee(e) {
  e.preventDefault();
  const id = document.getElementById('editEmpIdPk').value;

  const employeeData = {
    employeeId: document.getElementById('editEmpId').value,
    firstName: document.getElementById('editEmpFirstName').value.trim(),
    lastName: document.getElementById('editEmpLastName').value.trim(),
    email: document.getElementById('editEmpEmail').value.trim(),
    phone: document.getElementById('editEmpPhone').value.trim(),
    dob: document.getElementById('editEmpDob').value || null,
    gender: document.getElementById('editEmpGender').value || null,
    phoneVerified: document.getElementById('editEmpPhoneVerified').value === 'true',
    department: document.getElementById('editEmpDepartment').value,
    designation: document.getElementById('editEmpDesignation').value.trim(),
    salary: parseFloat(document.getElementById('editEmpSalary').value) || 0,
    joiningDate: document.getElementById('editEmpJoinDate').value,
    role: document.getElementById('editEmpRole').value,
    status: document.getElementById('editEmpStatus').value,
    avatarUrl: document.getElementById('editEmpAvatar').value.trim(),
    address: document.getElementById('editEmpAddress').value.trim(),
    skills: document.getElementById('editEmpSkills').value.trim(),
    bio: document.getElementById('editEmpBio').value.trim()
  };

  const submitBtn = document.getElementById('submitEditEmpBtn');
  try {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

    const res = await api.put(`/employees/${id}`, employeeData);
    if (res.success) {
      showToast('Profile Updated', 'Employee information successfully updated!', 'success');
      closeEditEmployeeModal();
      await loadEmployeeDirectory();
      await loadDashboardStats();
    }
  } catch (error) {
    showToast('Update Failed', error.message || 'Could not update employee.', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="fas fa-save"></i> Save Changes';
  }
}

/**
 * Toggle Status
 */
async function toggleEmployeeStatus(id, currentStatus) {
  let nextStatus = 'ACTIVE';
  if (currentStatus === 'ACTIVE') nextStatus = 'ON_LEAVE';
  else if (currentStatus === 'ON_LEAVE') nextStatus = 'INACTIVE';
  else nextStatus = 'ACTIVE';

  try {
    const res = await api.patch(`/employees/${id}/status`, { status: nextStatus });
    if (res.success) {
      showToast('Status Changed', `Status updated to ${nextStatus}`, 'success');
      await loadEmployeeDirectory();
      await loadDashboardStats();
    }
  } catch (error) {
    showToast('Status Update Failed', error.message || 'Could not change status.', 'error');
  }
}

/**
 * View Employee Dossier Modal
 */
function viewEmployeeDossier(id) {
  const emp = allEmployees.find(e => e.id === id);
  if (!emp) return;

  const content = document.getElementById('dossierContent');
  if (!content) return;

  const avatar = emp.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&h=256&q=80';
  const skillsArray = emp.skills ? emp.skills.split(',').map(s => s.trim()) : [];

  let skillsChips = skillsArray.map(s => `
    <span style="background-color:var(--bg-page); border:1px solid var(--border-light); padding:4px 10px; border-radius:var(--radius-full); font-size:0.78rem; font-weight:500;">
      ${escapeHtml(s)}
    </span>
  `).join('');

  content.innerHTML = `
    <div style="display:flex; align-items:center; gap:20px; margin-bottom:24px; padding-bottom:20px; border-bottom:1px solid var(--border-light);">
      <img src="${avatar}" alt="${escapeHtml(emp.fullName)}" style="width:76px; height:76px; border-radius:var(--radius-full); object-fit:cover; border:3px solid #38bdf8; box-shadow:0 4px 12px rgba(0,0,0,0.1);">
      <div>
        <h3 style="font-size:1.35rem; font-weight:700; color:var(--text-main); margin-bottom: 2px;">${escapeHtml(emp.fullName)}</h3>
        <p style="color:var(--primary); font-weight:600; font-size:0.92rem; margin-bottom: 4px;">${escapeHtml(emp.designation)} &bull; ${escapeHtml(emp.department)}</p>
        <div style="display:flex; gap:8px; align-items:center;">
          <span style="font-family:monospace; background:var(--bg-page); padding:2px 8px; border-radius:4px; font-size:0.8rem; border:1px solid var(--border-light); font-weight:600;">ID: ${escapeHtml(emp.employeeId)}</span>
          ${emp.phoneVerified ? '<span class="badge-tag badge-active" style="font-size:0.7rem;"><i class="fas fa-check"></i> Phone Verified</span>' : ''}
        </div>
      </div>
    </div>

    <div class="form-grid" style="gap:16px; font-size:0.88rem; margin-bottom:20px;">
      <div>
        <span style="color:var(--text-muted); display:block; font-size:0.75rem; text-transform:uppercase;">Work Email</span>
        <strong style="color:var(--text-main);"><a href="mailto:${escapeHtml(emp.email)}">${escapeHtml(emp.email)}</a></strong>
      </div>
      <div>
        <span style="color:var(--text-muted); display:block; font-size:0.75rem; text-transform:uppercase;">Phone</span>
        <strong style="color:var(--text-main);">${escapeHtml(emp.phone || 'Not provided')}</strong>
      </div>
      <div>
        <span style="color:var(--text-muted); display:block; font-size:0.75rem; text-transform:uppercase;">Date of Birth</span>
        <strong style="color:var(--text-main);">${emp.dob ? formatDate(emp.dob) : 'Not specified'}</strong>
      </div>
      <div>
        <span style="color:var(--text-muted); display:block; font-size:0.75rem; text-transform:uppercase;">Gender</span>
        <strong style="color:var(--text-main);">${escapeHtml(emp.gender || 'Not specified')}</strong>
      </div>
      <div>
        <span style="color:var(--text-muted); display:block; font-size:0.75rem; text-transform:uppercase;">Joining Date</span>
        <strong style="color:var(--text-main);">${formatDate(emp.joiningDate)}</strong>
      </div>
      <div>
        <span style="color:var(--text-muted); display:block; font-size:0.75rem; text-transform:uppercase;">Annual Salary</span>
        <strong style="color:var(--text-main);">$${(emp.salary || 0).toLocaleString()}</strong>
      </div>
      <div>
        <span style="color:var(--text-muted); display:block; font-size:0.75rem; text-transform:uppercase;">Account Role</span>
        <strong style="color:var(--text-main);">${emp.role === 'ROLE_ADMIN' ? 'Global Admin' : 'Standard Employee'}</strong>
      </div>
      <div>
        <span style="color:var(--text-muted); display:block; font-size:0.75rem; text-transform:uppercase;">Last Active</span>
        <strong style="color:var(--text-main);">${formatDateTime(emp.lastLogin)}</strong>
      </div>
      <div class="form-full">
        <span style="color:var(--text-muted); display:block; font-size:0.75rem; text-transform:uppercase;">Location / Address</span>
        <strong style="color:var(--text-main);">${escapeHtml(emp.address || 'Corporate Headquarters')}</strong>
      </div>
    </div>

    <div style="margin-bottom:16px;">
      <h4 style="font-size:0.82rem; text-transform:uppercase; color:var(--text-muted); margin-bottom:6px;">Professional Biography</h4>
      <p style="font-size:0.88rem; color:var(--text-secondary); background:var(--bg-page); padding:12px; border-radius:var(--radius-md); border:1px solid var(--border-light); line-height:1.6;">
        ${escapeHtml(emp.bio || 'No professional bio on record.')}
      </p>
    </div>

    <div>
      <h4 style="font-size:0.82rem; text-transform:uppercase; color:var(--text-muted); margin-bottom:8px;">Skills &amp; Competencies</h4>
      <div style="display:flex; flex-wrap:wrap; gap:8px;">
        ${skillsChips || '<span style="color:var(--text-muted); font-size:0.85rem;">No skills specified</span>'}
      </div>
    </div>
  `;

  document.body.classList.add('modal-open');
  const modal = document.getElementById('dossierModal');
  if (modal) modal.classList.add('show');
}

function closeDossierModal() {
  const modal = document.getElementById('dossierModal');
  if (modal) {
    modal.classList.remove('show');
    document.body.classList.remove('modal-open');
  }
}

/**
 * Delete Employee
 */
function confirmDeleteEmployee(id, name) {
  currentEmployeeToDelete = id;
  const nameEl = document.getElementById('deleteEmpNamePrompt');
  if (nameEl) nameEl.textContent = name;

  document.body.classList.add('modal-open');
  const modal = document.getElementById('deleteConfirmModal');
  if (modal) modal.classList.add('show');
}

function closeDeleteModal() {
  currentEmployeeToDelete = null;
  const modal = document.getElementById('deleteConfirmModal');
  if (modal) {
    modal.classList.remove('show');
    document.body.classList.remove('modal-open');
  }
}

async function executeDeleteEmployee() {
  if (!currentEmployeeToDelete) return;

  const submitBtn = document.getElementById('executeDeleteBtn');
  try {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Deleting...';

    const res = await api.delete(`/employees/${currentEmployeeToDelete}`);
    if (res.success) {
      showToast('Employee Removed', 'Employee was permanently deleted.', 'success');
      closeDeleteModal();
      await loadEmployeeDirectory();
      await loadDashboardStats();
    }
  } catch (error) {
    showToast('Delete Failed', error.message || 'Could not delete employee.', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = 'Delete Permanently';
  }
}

/**
 * Export to CSV
 */
function exportToCSV() {
  if (!filteredEmployees || filteredEmployees.length === 0) {
    showToast('Export Notice', 'No employee records to export.', 'warning');
    return;
  }

  const headers = ['Employee ID', 'First Name', 'Last Name', 'Email', 'Phone', 'Phone Verified', 'Gender', 'DOB', 'Department', 'Designation', 'Status', 'Role', 'Joining Date', 'Salary'];
  const rows = filteredEmployees.map(e => [
    `"${e.employeeId || ''}"`,
    `"${e.firstName || ''}"`,
    `"${e.lastName || ''}"`,
    `"${e.email || ''}"`,
    `"${e.phone || ''}"`,
    `"${e.phoneVerified ? 'Yes' : 'No'}"`,
    `"${e.gender || ''}"`,
    `"${e.dob || ''}"`,
    `"${e.department || ''}"`,
    `"${e.designation || ''}"`,
    `"${e.status || ''}"`,
    `"${e.role || ''}"`,
    `"${e.joiningDate || ''}"`,
    `"${e.salary || 0}"`
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `StaffConnect_Directory_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  showToast('Export Completed', 'Employee Directory CSV successfully generated!', 'success');
}
