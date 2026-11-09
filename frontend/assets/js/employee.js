/**
 * StaffConnect - Employee Dashboard & Self-Service Portal
 * Upgraded with animated counters, avatar file upload, DOB/Gender support,
 * and SMS OTP phone verification.
 */

let myProfile = null;
let allColleagues = [];
let filteredColleagues = [];

document.addEventListener('DOMContentLoaded', () => {
  const user = protectPage();
  if (!user) return;

  initEmployeePortal();
});

async function initEmployeePortal() {
  setupEmployeeNavTabs();
  setupEventListeners();
  setupModals();
  await loadEmployeeDashboardData();
  await loadAllColleagues();
}

function setupEmployeeNavTabs() {
  const tabBtns = document.querySelectorAll('[data-tab-target]');
  const tabContents = document.querySelectorAll('.tab-content-pane');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-tab-target');

      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.style.display = 'none');

      btn.classList.add('active');
      const targetPane = document.getElementById(targetId);
      if (targetPane) targetPane.style.display = 'block';
    });
  });
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

  // Profile update form
  const profileForm = document.getElementById('updateProfileForm');
  if (profileForm) {
    profileForm.addEventListener('submit', handleUpdateProfile);
  }

  // Password change form
  const passwordForm = document.getElementById('changePasswordForm');
  if (passwordForm) {
    passwordForm.addEventListener('submit', handleChangePassword);
  }

  // Colleague directory search
  const colleagueSearch = document.getElementById('colleagueSearch');
  if (colleagueSearch) {
    let debounceTimer;
    colleagueSearch.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(filterColleagues, 250);
    });
  }

  // Avatar file upload listener
  const avatarInput = document.getElementById('profileAvatarFileInput');
  if (avatarInput) {
    avatarInput.addEventListener('change', handleAvatarFileUpload);
  }

  // Open OTP modal trigger
  const openOtpBtn = document.getElementById('openPhoneVerifyModalBtn');
  if (openOtpBtn) {
    openOtpBtn.addEventListener('click', () => {
      const phoneVal = document.getElementById('profilePhone')?.value || '';
      const modalPhone = document.getElementById('otpModalPhone');
      if (modalPhone && phoneVal) modalPhone.value = phoneVal;
      openEmployeeOtpModal();
    });
  }
}

function setupModals() {
  // Backdrop click and escape key handling
  document.querySelectorAll('.modal-backdrop').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('active');
        document.body.classList.remove('modal-open');
      }
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const activeModal = document.querySelector('.modal-backdrop.active');
      if (activeModal) {
        activeModal.classList.remove('active');
        document.body.classList.remove('modal-open');
      }
    }
  });
}

async function loadEmployeeDashboardData() {
  // Show skeleton loading in teammates grid
  const tmGrid = document.getElementById('teammatesGrid');
  if (tmGrid) {
    tmGrid.innerHTML = `
      <div class="skeleton" style="height: 80px; border-radius: var(--radius-md);"></div>
      <div class="skeleton" style="height: 80px; border-radius: var(--radius-md);"></div>
      <div class="skeleton" style="height: 80px; border-radius: var(--radius-md);"></div>
    `;
  }

  try {
    const res = await api.get('/dashboard/employee');
    if (res.success && res.data) {
      const data = res.data;
      myProfile = data.profile;

      renderHeroBanner(data.profile, data.departmentHead);
      renderTeammates(data.teammates);
      populateProfileForm(data.profile);

      // Animate total statistic counters
      api.animateCounter('statTotalColleagues', data.totalColleagues || 0, 1000);
      api.animateCounter('statTotalDepts', data.totalDepartments || 0, 1000);
    }
  } catch (error) {
    console.error('Failed to load employee dashboard:', error);
    showToast('Failed to load employee details', 'error');
  }
}

function renderHeroBanner(profile, deptHead) {
  if (!profile) return;

  const heroName = document.getElementById('heroEmployeeName');
  const heroRole = document.getElementById('heroDesignation');
  const heroDept = document.getElementById('heroDepartment');
  const heroId = document.getElementById('heroEmpId');
  const heroTenure = document.getElementById('heroTenure');
  const heroAvatar = document.getElementById('heroAvatar');
  const heroDeptHead = document.getElementById('heroDeptHead');

  if (heroName) heroName.textContent = profile.fullName;
  if (heroRole) heroRole.textContent = profile.designation;
  if (heroDept) heroDept.textContent = profile.department;
  if (heroId) heroId.textContent = profile.employeeId;
  if (heroAvatar && profile.avatarUrl) {
    heroAvatar.src = profile.avatarUrl;
  }
  if (heroDeptHead) heroDeptHead.textContent = deptHead || 'Department Head';

  if (heroTenure && profile.joiningDate) {
    const join = new Date(profile.joiningDate);
    const now = new Date();
    const months = (now.getFullYear() - join.getFullYear()) * 12 + (now.getMonth() - join.getMonth());
    const years = Math.floor(months / 12);
    const remMonths = months % 12;

    let tenureStr = '';
    if (years > 0) tenureStr += `${years} yr${years > 1 ? 's' : ''} `;
    tenureStr += `${remMonths} mo${remMonths !== 1 ? 's' : ''}`;
    heroTenure.textContent = tenureStr;
  }
}

function renderTeammates(teammates) {
  const container = document.getElementById('teammatesGrid');
  if (!container) return;

  if (!teammates || teammates.length === 0) {
    container.innerHTML = '<p class="text-muted" style="padding:16px;">You are currently the only member assigned to this department.</p>';
    return;
  }

  let html = '';
  teammates.forEach(tm => {
    const avatar = tm.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&h=256&q=80';
    html += `
      <div style="background:white; border:1px solid var(--border-light); border-radius:var(--radius-md); padding:16px; display:flex; align-items:center; gap:14px; box-shadow:var(--shadow-sm); transition:var(--transition);" onmouseover="this.style.borderColor='var(--primary)'" onmouseout="this.style.borderColor='var(--border-light)'">
        <img src="${avatar}" alt="${escapeHtml(tm.fullName)}" style="width:48px; height:48px; border-radius:var(--radius-full); object-fit:cover; border:2px solid #38bdf8;">
        <div style="flex:1; overflow:hidden;">
          <h4 style="font-size:0.95rem; font-weight:600; color:var(--text-main); margin-bottom:2px;">${escapeHtml(tm.fullName)}</h4>
          <p style="font-size:0.8rem; color:var(--text-muted); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHtml(tm.designation)}</p>
        </div>
        <div style="display:flex; gap:6px;">
          <a href="mailto:${escapeHtml(tm.email)}" class="btn-icon" title="Send Email" style="color:var(--primary);"><i class="fas fa-envelope"></i></a>
          ${tm.phone ? `<a href="tel:${escapeHtml(tm.phone)}" class="btn-icon" title="Call" style="color:var(--success-text);"><i class="fas fa-phone"></i></a>` : ''}
        </div>
      </div>
    `;
  });
  container.innerHTML = html;
}

async function loadAllColleagues() {
  const container = document.getElementById('colleagueCardsGrid');
  if (container) {
    container.innerHTML = `
      <div class="skeleton" style="height: 120px; border-radius: var(--radius-md);"></div>
      <div class="skeleton" style="height: 120px; border-radius: var(--radius-md);"></div>
      <div class="skeleton" style="height: 120px; border-radius: var(--radius-md);"></div>
    `;
  }

  try {
    const res = await api.get('/employees');
    if (res.success && res.data) {
      allColleagues = res.data;
      filterColleagues();
    }
  } catch (error) {
    console.error('Failed to load colleagues:', error);
  }
}

function filterColleagues() {
  const query = (document.getElementById('colleagueSearch')?.value || '').toLowerCase().trim();

  filteredColleagues = allColleagues.filter(e => {
    return !query ||
      (e.fullName && e.fullName.toLowerCase().includes(query)) ||
      (e.department && e.department.toLowerCase().includes(query)) ||
      (e.designation && e.designation.toLowerCase().includes(query)) ||
      (e.email && e.email.toLowerCase().includes(query));
  });

  renderColleagueCards();
}

function renderColleagueCards() {
  const container = document.getElementById('colleagueCardsGrid');
  if (!container) return;

  if (filteredColleagues.length === 0) {
    container.innerHTML = `
      <div style="grid-column:1/-1; text-align:center; padding:40px; color:var(--text-muted);">
        <i class="fas fa-search" style="font-size:2rem; margin-bottom:12px; display:block;"></i>
        No colleagues found matching your query.
      </div>
    `;
    return;
  }

  let html = '';
  filteredColleagues.forEach(emp => {
    const avatar = emp.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&h=256&q=80';
    let statusClass = 'badge-active';
    let statusText = 'Active';
    if (emp.status === 'ON_LEAVE') {
      statusClass = 'badge-leave';
      statusText = 'On Leave';
    } else if (emp.status === 'INACTIVE') {
      statusClass = 'badge-inactive';
      statusText = 'Inactive';
    }

    html += `
      <div class="stat-card" style="flex-direction:column; align-items:flex-start; gap:16px; position:relative; overflow:hidden;">
        <div style="display:flex; align-items:center; gap:14px; width:100%;">
          <img src="${avatar}" alt="${escapeHtml(emp.fullName)}" style="width:52px; height:52px; border-radius:var(--radius-full); object-fit:cover; border:2px solid #e2e8f0;">
          <div style="flex:1;">
            <h4 style="font-size:1rem; font-weight:700; color:var(--text-main);">${escapeHtml(emp.fullName)}</h4>
            <span style="font-size:0.8rem; color:var(--primary); font-weight:600;">${escapeHtml(emp.designation)}</span>
            <div style="font-size:0.75rem; color:var(--text-muted);">${escapeHtml(emp.department)}</div>
          </div>
        </div>

        <div style="width:100%; border-top:1px solid var(--border-light); padding-top:12px; display:flex; align-items:center; justify-content:space-between;">
          <span class="badge-tag ${statusClass}" style="font-size:0.72rem;">${statusText}</span>
          <div style="display:flex; gap:6px;">
            <a href="mailto:${escapeHtml(emp.email)}" class="btn btn-secondary btn-sm" title="Email Colleague">
              <i class="fas fa-envelope"></i> Message
            </a>
          </div>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

function populateProfileForm(profile) {
  if (!profile) return;

  const phoneEl = document.getElementById('profilePhone');
  const addressEl = document.getElementById('profileAddress');
  const bioEl = document.getElementById('profileBio');
  const skillsEl = document.getElementById('profileSkills');
  const avatarEl = document.getElementById('profileAvatar');
  const dobEl = document.getElementById('profileDob');
  const genderEl = document.getElementById('profileGender');
  const avatarPreview = document.getElementById('profileAvatarPreview');

  if (phoneEl) phoneEl.value = profile.phone || '';
  if (addressEl) addressEl.value = profile.address || '';
  if (bioEl) bioEl.value = profile.bio || '';
  if (skillsEl) skillsEl.value = profile.skills || '';
  if (avatarEl) avatarEl.value = profile.avatarUrl || '';
  if (dobEl && profile.dob) dobEl.value = profile.dob;
  if (genderEl && profile.gender) genderEl.value = profile.gender;
  if (avatarPreview && profile.avatarUrl) avatarPreview.src = profile.avatarUrl;

  // Phone verification badge
  updatePhoneVerificationBadge(profile.phoneVerified);

  // Read-only official record
  const roEmpId = document.getElementById('roEmployeeId');
  const roDept = document.getElementById('roDepartment');
  const roDesig = document.getElementById('roDesignation');
  const roStatus = document.getElementById('roStatus');

  if (roEmpId) roEmpId.textContent = profile.employeeId || 'EMP-XXXX';
  if (roDept) roDept.textContent = profile.department || '--';
  if (roDesig) roDesig.textContent = profile.designation || '--';
  if (roStatus) roStatus.textContent = profile.status || 'ACTIVE';
}

function updatePhoneVerificationBadge(isVerified) {
  const badge = document.getElementById('phoneVerifiedStatusBadge');
  const verifyBtn = document.getElementById('openPhoneVerifyModalBtn');
  if (!badge) return;

  if (isVerified) {
    badge.className = 'badge-tag badge-active';
    badge.innerHTML = '<i class="fas fa-check-circle"></i> Verified';
    if (verifyBtn) verifyBtn.style.display = 'none';
  } else {
    badge.className = 'badge-tag badge-leave';
    badge.innerHTML = '<i class="fas fa-exclamation-circle"></i> Unverified';
    if (verifyBtn) verifyBtn.style.display = 'inline-flex';
  }
}

async function handleAvatarFileUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  const statusEl = document.getElementById('profileAvatarUploadStatus');
  const preview = document.getElementById('profileAvatarPreview');
  const avatarInput = document.getElementById('profileAvatar');

  if (statusEl) statusEl.textContent = 'Uploading image...';

  try {
    const res = await api.uploadFile('/upload/avatar', file);
    if (res.success && res.data && res.data.fileUrl) {
      const fullUrl = res.data.fileUrl.startsWith('http') ? res.data.fileUrl : `${api.BASE_URL.replace('/api', '')}${res.data.fileUrl}`;
      if (preview) preview.src = fullUrl;
      if (avatarInput) avatarInput.value = fullUrl;
      if (statusEl) {
        statusEl.textContent = 'Uploaded successfully!';
        statusEl.style.color = 'var(--success-text)';
      }
      showToast('Avatar uploaded successfully! Click "Save Profile Details" to save changes.', 'success');
    } else {
      throw new Error(res.message || 'Avatar upload failed');
    }
  } catch (err) {
    console.error('Avatar upload error:', err);
    if (statusEl) {
      statusEl.textContent = 'Upload failed: ' + err.message;
      statusEl.style.color = 'var(--danger-text)';
    }
    showToast(err.message || 'Avatar upload failed', 'error');
  }
}

async function handleUpdateProfile(e) {
  e.preventDefault();

  const phone = document.getElementById('profilePhone').value.trim();
  if (phone && !api.isValidPhone(phone)) {
    showToast('Please enter a valid phone number (10-15 digits)', 'error');
    return;
  }

  const reqData = {
    phone: phone,
    address: document.getElementById('profileAddress').value.trim(),
    bio: document.getElementById('profileBio').value.trim(),
    skills: document.getElementById('profileSkills').value.trim(),
    avatarUrl: document.getElementById('profileAvatar').value.trim(),
    dob: document.getElementById('profileDob').value || null,
    gender: document.getElementById('profileGender').value || null
  };

  const submitBtn = document.getElementById('saveProfileBtn');
  try {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

    const res = await api.put('/profile', reqData);
    if (res.success) {
      showToast('Profile updated successfully!', 'success');
      // Update local storage user profile
      const user = api.getUser();
      if (user) {
        if (reqData.avatarUrl) user.avatarUrl = reqData.avatarUrl;
        localStorage.setItem('staffconnect_user', JSON.stringify(user));
      }
      await loadEmployeeDashboardData();
    }
  } catch (error) {
    showToast(error.message || 'Could not update profile', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="fas fa-save"></i> Save Profile Details';
  }
}

async function handleChangePassword(e) {
  e.preventDefault();
  const currentPassword = document.getElementById('currentPassword').value;
  const newPassword = document.getElementById('newPassword').value;
  const confirmPassword = document.getElementById('confirmPassword').value;

  if (newPassword !== confirmPassword) {
    showToast('New passwords do not match!', 'error');
    return;
  }

  if (newPassword.length < 6) {
    showToast('Password must be at least 6 characters long', 'warning');
    return;
  }

  const submitBtn = document.getElementById('submitPasswordBtn');
  try {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';

    const res = await api.post('/auth/change-password', { currentPassword, newPassword });
    if (res.success) {
      showToast('Password updated successfully! Please login with your new credentials.', 'success');
      document.getElementById('changePasswordForm').reset();
      setTimeout(logout, 1500);
    }
  } catch (error) {
    showToast(error.message || 'Could not change password', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="fas fa-lock"></i> Update Password';
  }
}

// =============================================================================
// Phone OTP Verification Functions for Employee
// =============================================================================

function openEmployeeOtpModal() {
  const modal = document.getElementById('employeeOtpModal');
  if (modal) {
    modal.classList.add('active');
    document.body.classList.add('modal-open');
  }
}

function closeEmployeeOtpModal() {
  const modal = document.getElementById('employeeOtpModal');
  if (modal) {
    modal.classList.remove('active');
    document.body.classList.remove('modal-open');
  }
}

async function sendEmployeeOtp() {
  const phone = document.getElementById('otpModalPhone')?.value.trim();
  if (!phone || !api.isValidPhone(phone)) {
    showToast('Please enter a valid phone number (10-15 digits) with country code', 'error');
    return;
  }

  const btn = document.getElementById('empSendOtpBtn');
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending OTP...';

  try {
    const res = await api.post('/otp/send', { phone });
    if (res.success) {
      showToast('OTP sent to ' + phone + '!', 'success');
      const inputGroup = document.getElementById('empOtpInputGroup');
      if (inputGroup) inputGroup.style.display = 'block';

      const hint = document.getElementById('empOtpHint');
      if (hint && res.data && res.data.devOtp) {
        hint.innerHTML = `<span style="color:var(--primary); font-weight:600;"><i class="fas fa-info-circle"></i> Dev/Test OTP:</span> <code>${res.data.devOtp}</code>`;
        const codeInput = document.getElementById('empOtpCode');
        if (codeInput) codeInput.value = res.data.devOtp;
      }
    } else {
      showToast(res.message || 'Failed to send OTP', 'error');
    }
  } catch (err) {
    showToast(err.message || 'Could not send verification OTP', 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-paper-plane"></i> Re-send OTP';
  }
}

async function verifyEmployeeOtp() {
  const phone = document.getElementById('otpModalPhone')?.value.trim();
  const otp = document.getElementById('empOtpCode')?.value.trim();

  if (!phone) {
    showToast('Phone number is missing', 'error');
    return;
  }

  if (!otp || otp.length !== 6) {
    showToast('Please enter the 6-digit OTP passcode', 'warning');
    return;
  }

  const btn = document.getElementById('empVerifyOtpBtn');
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

  try {
    const res = await api.post('/otp/verify', { phone, otp });
    if (res.success && res.data && res.data.verified) {
      showToast('Phone number verified successfully!', 'success');
      updatePhoneVerificationBadge(true);

      // Also update the profile phone input with verified phone
      const profilePhone = document.getElementById('profilePhone');
      if (profilePhone) profilePhone.value = phone;

      // Automatically update the profile on backend
      await api.put('/profile', {
        phone: phone,
        address: document.getElementById('profileAddress')?.value.trim() || '',
        bio: document.getElementById('profileBio')?.value.trim() || '',
        skills: document.getElementById('profileSkills')?.value.trim() || '',
        avatarUrl: document.getElementById('profileAvatar')?.value.trim() || ''
      });

      closeEmployeeOtpModal();
      await loadEmployeeDashboardData();
    } else {
      showToast(res.message || 'Invalid or expired OTP', 'error');
    }
  } catch (err) {
    showToast(err.message || 'Verification failed', 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = 'Verify';
  }
}
