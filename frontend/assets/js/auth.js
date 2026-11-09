/**
 * StaffConnect - Authentication, Splash Transition & Password Recovery
 */

let splashDismissed = false;
let currentResetIdentifier = '';

document.addEventListener('DOMContentLoaded', () => {
  initSplashAnimation();
  initAuthUI();
  handleUrlActions();
});

/**
 * Splash Screen Animation Handler
 */
function initSplashAnimation() {
  const splash = document.getElementById('splashScreen');
  if (!splash) return;

  // Reduced motion: dismiss immediately
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    dismissSplash();
    return;
  }

  // Auto-dismiss after 1.8s
  setTimeout(() => {
    if (!splashDismissed) {
      dismissSplash();
    }
  }, 1800);
}

function dismissSplash() {
  splashDismissed = true;
  const splash = document.getElementById('splashScreen');
  if (splash) {
    splash.classList.add('fade-out');
    setTimeout(() => {
      splash.style.display = 'none';
    }, 600);
  }
}

function initAuthUI() {
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    // If user is already logged in, redirect them
    const user = api.getUser();
    const token = api.getToken();
    if (token && user) {
      redirectByRole(user.role);
      return;
    }

    loginForm.addEventListener('submit', handleLogin);
  }

  // Setup password toggle visibility buttons
  const togglePassBtns = document.querySelectorAll('.toggle-password');
  togglePassBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const input = e.target.closest('.password-group').querySelector('input');
      if (input.type === 'password') {
        input.type = 'text';
        btn.classList.replace('fa-eye', 'fa-eye-slash');
      } else {
        input.type = 'password';
        btn.classList.replace('fa-eye-slash', 'fa-eye');
      }
    });
  });

  // Forgot password form submissions
  const forgotStep1 = document.getElementById('forgotStep1Form');
  if (forgotStep1) forgotStep1.addEventListener('submit', handleForgotStep1);

  const forgotStep2 = document.getElementById('forgotStep2Form');
  if (forgotStep2) forgotStep2.addEventListener('submit', handleForgotStep2);

  // Activation form
  const actForm = document.getElementById('activationForm');
  if (actForm) actForm.addEventListener('submit', handleActivationSubmit);
}

async function handleLogin(e) {
  e.preventDefault();
  const emailInput = document.getElementById('loginEmail');
  const passwordInput = document.getElementById('loginPassword');
  const submitBtn = document.getElementById('loginSubmitBtn');

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email || !password) {
    showToast('Validation Error', 'Please enter both corporate email and password.', 'warning');
    return;
  }

  try {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Authenticating...';

    const response = await api.post('/auth/login', { email, password });
    
    if (response.success && response.data) {
      const authData = response.data;
      api.setAuth(authData.token, authData);
      showToast('Welcome Back', `Logged in as ${authData.fullName}. Redirecting...`, 'success');

      setTimeout(() => {
        redirectByRole(authData.role);
      }, 700);
    }
  } catch (error) {
    showToast('Authentication Failed', error.message || 'Invalid credentials. Please verify your email and password.', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = 'Sign In to Dashboard <i class="fas fa-arrow-right"></i>';
  }
}

function redirectByRole(role) {
  if (role === 'ROLE_ADMIN') {
    window.location.href = 'admin-dashboard.html';
  } else {
    window.location.href = 'employee-dashboard.html';
  }
}

function fillDemo(type) {
  dismissSplash();
  const emailInput = document.getElementById('loginEmail');
  const passwordInput = document.getElementById('loginPassword');
  if (!emailInput || !passwordInput) return;

  if (type === 'admin') {
    emailInput.value = 'admin@staffconnect.com';
    passwordInput.value = 'Admin@123';
    showToast('Demo Credentials Filled', 'Admin: admin@staffconnect.com / Admin@123', 'info');
  } else if (type === 'employee') {
    emailInput.value = 'sarah.chen@staffconnect.com';
    passwordInput.value = 'Staff@123';
    showToast('Demo Credentials Filled', 'Staff: sarah.chen@staffconnect.com / Staff@123', 'info');
  }
}

function logout() {
  api.clearAuth();
  showToast('Logged Out', 'You have been securely signed out.', 'info');
  setTimeout(() => {
    window.location.href = 'index.html';
  }, 400);
}

/**
 * Forgot Password Modal Management
 */
function openForgotPasswordModal() {
  dismissSplash();
  const modal = document.getElementById('forgotPasswordModal');
  const step1 = document.getElementById('forgotStep1Form');
  const step2 = document.getElementById('forgotStep2Form');

  if (step1) {
    step1.reset();
    step1.style.display = 'flex';
  }
  if (step2) {
    step2.reset();
    step2.style.display = 'none';
  }

  // Pre-fill email from login field if typed
  const loginEmail = document.getElementById('loginEmail')?.value.trim();
  const resetId = document.getElementById('resetIdentifier');
  if (resetId && loginEmail) resetId.value = loginEmail;

  if (modal) {
    document.body.classList.add('modal-open');
    modal.classList.add('show');
  }
}

function closeForgotPasswordModal() {
  const modal = document.getElementById('forgotPasswordModal');
  if (modal) {
    modal.classList.remove('show');
    document.body.classList.remove('modal-open');
  }
}

function backToStep1() {
  document.getElementById('forgotStep1Form').style.display = 'flex';
  document.getElementById('forgotStep2Form').style.display = 'none';
}

async function handleForgotStep1(e) {
  e.preventDefault();
  const identifier = document.getElementById('resetIdentifier').value.trim();
  const btn = document.getElementById('sendResetCodeBtn');

  if (!identifier) {
    showToast('Validation Error', 'Please enter an email address or mobile number.', 'warning');
    return;
  }

  try {
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';

    const res = await api.post('/auth/forgot-password', { identifier });
    if (res.success && res.data) {
      currentResetIdentifier = identifier;
      const data = res.data;

      document.getElementById('forgotStep1Form').style.display = 'none';
      const step2 = document.getElementById('forgotStep2Form');
      step2.style.display = 'flex';

      const notice = document.getElementById('resetTargetNotice');
      if (notice) {
        notice.innerHTML = `<strong>Verification Code Dispatched!</strong><br>${escapeHtml(data.message || 'Check your email or phone message.')}`;
      }

      if (data.devOtp || data.resetCode) {
        const code = data.devOtp || data.resetCode;
        showToast('Dev Code Available', `Mock verification code: ${code}`, 'info');
        const codeInput = document.getElementById('resetOtpCode');
        if (codeInput) codeInput.value = code;
      } else {
        showToast('Code Dispatched', data.message || 'Verification code sent.', 'success');
      }
    }
  } catch (error) {
    showToast('Reset Failed', error.message || 'Could not dispatch reset code.', 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = 'Send Reset Code <i class="fas fa-paper-plane"></i>';
  }
}

async function handleForgotStep2(e) {
  e.preventDefault();
  const code = document.getElementById('resetOtpCode').value.trim();
  const newPassword = document.getElementById('resetNewPassword').value;
  const confirmPassword = document.getElementById('resetConfirmPassword').value;
  const btn = document.getElementById('submitNewPasswordBtn');

  if (newPassword !== confirmPassword) {
    showToast('Password Mismatch', 'The new passwords do not match.', 'error');
    return;
  }

  if (newPassword.length < 6) {
    showToast('Password Length', 'Password must be at least 6 characters long.', 'warning');
    return;
  }

  try {
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

    const res = await api.post('/api/auth/reset-password', {
      identifier: currentResetIdentifier,
      code,
      newPassword
    });

    if (res.success) {
      showToast('Password Updated', 'Your password was successfully reset. Please sign in.', 'success');
      closeForgotPasswordModal();
      // Pre-fill login input
      if (currentResetIdentifier.includes('@')) {
        document.getElementById('loginEmail').value = currentResetIdentifier;
      }
      document.getElementById('loginPassword').value = newPassword;
    }
  } catch (error) {
    showToast('Reset Failed', error.message || 'Could not reset password. Please check the code.', 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = 'Save New Password <i class="fas fa-check"></i>';
  }
}

/**
 * Account Activation (From Welcome Email Link)
 */
function handleUrlActions() {
  const params = new URLSearchParams(window.location.search);
  const action = params.get('action');
  const email = params.get('email');
  const token = params.get('token');

  if (action === 'setup-password' && email && token) {
    dismissSplash();
    const actModal = document.getElementById('activationModal');
    const emailInput = document.getElementById('activationEmail');
    if (emailInput) emailInput.value = email;

    if (actModal) {
      document.body.classList.add('modal-open');
      actModal.classList.add('show');
    }
  } else if (action === 'reset-password' && email && token) {
    dismissSplash();
    openForgotPasswordModal();
    currentResetIdentifier = email;
    document.getElementById('forgotStep1Form').style.display = 'none';
    const step2 = document.getElementById('forgotStep2Form');
    step2.style.display = 'flex';
    document.getElementById('resetOtpCode').value = token;
  }
}

function closeActivationModal() {
  const modal = document.getElementById('activationModal');
  if (modal) {
    modal.classList.remove('show');
    document.body.classList.remove('modal-open');
  }
}

async function handleActivationSubmit(e) {
  e.preventDefault();
  const params = new URLSearchParams(window.location.search);
  const email = params.get('email');
  const token = params.get('token');
  const newPassword = document.getElementById('activationPassword').value;
  const confirmPassword = document.getElementById('activationConfirmPassword').value;
  const btn = document.getElementById('submitActivationBtn');

  if (newPassword !== confirmPassword) {
    showToast('Mismatch', 'Passwords do not match.', 'error');
    return;
  }

  if (newPassword.length < 6) {
    showToast('Too Short', 'Password must be at least 6 characters.', 'warning');
    return;
  }

  try {
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Activating...';

    const res = await api.post('/auth/setup-password', {
      email,
      token,
      newPassword
    });

    if (res.success) {
      showToast('Account Activated', 'Your account is ready! Please sign in.', 'success');
      closeActivationModal();
      document.getElementById('loginEmail').value = email;
      document.getElementById('loginPassword').value = newPassword;
      // Clean query params
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  } catch (error) {
    showToast('Activation Failed', error.message || 'Could not activate account. Link may have expired.', 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = 'Activate Account &amp; Proceed <i class="fas fa-arrow-right"></i>';
  }
}

/**
 * Route protection guard for dashboard pages
 */
function protectPage(requiredRole = null) {
  const token = api.getToken();
  const user = api.getUser();

  if (!token || !user) {
    window.location.href = 'index.html';
    return null;
  }

  if (requiredRole && user.role !== requiredRole) {
    redirectByRole(user.role);
    return null;
  }

  renderUserInfo(user);
  return user;
}

function renderUserInfo(user) {
  const nameEl = document.getElementById('userNameDisplay');
  const roleEl = document.getElementById('userRoleDisplay');
  const avatarEl = document.getElementById('userAvatarDisplay');
  const lastLoginEl = document.getElementById('userLastLogin');

  if (nameEl) nameEl.textContent = user.fullName || user.email;
  if (roleEl) roleEl.textContent = user.role === 'ROLE_ADMIN' ? 'Global Admin' : (user.designation || 'Staff Member');
  if (avatarEl) {
    avatarEl.src = user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&h=256&q=80';
  }
  if (lastLoginEl && user.lastLogin) {
    lastLoginEl.textContent = formatDateTime(user.lastLogin);
  }
}
