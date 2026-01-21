/*
  Authentication module for Eventura
  - OTP-based sign-in flow
  - API integration for backend auth
*/

// API base with fallback: if not running on port 4000, use localhost:4000
const API_BASE = window.location.port === '4000' ? `${window.location.origin}/api` : 'http://localhost:4000/api';

const authElements = {
  mobileStep: document.getElementById('mobileStep'),
  otpStep: document.getElementById('otpStep'),
  successStep: document.getElementById('successStep'),
  mobileInput: document.getElementById('mobileInput'),
  otpInput: document.getElementById('otpInput'),
  requestOtpBtn: document.getElementById('requestOtpBtn'),
  verifyOtpBtn: document.getElementById('verifyOtpBtn'),
  resendOtpBtn: document.getElementById('resendOtpBtn'),
  mobileError: document.getElementById('mobileError'),
  otpError: document.getElementById('otpError'),
};

let currentMobile = '';

function showError(element, message) {
  if (element) {
    element.textContent = message;
    element.classList.remove('hidden');
  }
}

function hideError(element) {
  if (element) {
    element.classList.add('hidden');
  }
}

function showStep(stepName) {
  ['mobileStep', 'otpStep', 'successStep'].forEach(step => {
    authElements[step]?.classList.add('hidden');
  });
  authElements[stepName]?.classList.remove('hidden');
}

async function requestOtp() {
  const mobileInputEl = document.getElementById('mobileInput');
  const mobile = mobileInputEl?.value.trim();
  
  if (!mobile || !/^\d{10}$/.test(mobile)) {
    showError(authElements.mobileError, 'Please enter a valid 10-digit mobile number');
    return;
  }

  hideError(authElements.mobileError);
  authElements.requestOtpBtn.disabled = true;
  authElements.requestOtpBtn.textContent = 'Sending...';

  try {
    const response = await fetch(`${API_BASE}/auth/request-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile })
    });

    const data = await response.json();

    if (response.ok) {
      currentMobile = mobile;
      showStep('otpStep');
      authElements.otpInput?.focus();
    } else {
      showError(authElements.mobileError, data.error || 'Failed to send OTP');
    }
  } catch (error) {
    showError(authElements.mobileError, 'Network error. Please check your connection.');
    console.error('OTP request error:', error);
  } finally {
    authElements.requestOtpBtn.disabled = false;
    authElements.requestOtpBtn.textContent = 'Send OTP';
  }
}

async function verifyOtp() {
  const otpInputEl = document.getElementById('otpInput');
  const code = otpInputEl?.value.trim();
  
  if (!code || !/^\d{6}$/.test(code)) {
    showError(authElements.otpError, 'Please enter a valid 6-digit OTP');
    return;
  }

  hideError(authElements.otpError);
  authElements.verifyOtpBtn.disabled = true;
  authElements.verifyOtpBtn.textContent = 'Verifying...';

  try {
    const response = await fetch(`${API_BASE}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile: currentMobile, code })
    });

    const data = await response.json();

    if (response.ok) {
      // Store auth token
      localStorage.setItem('EV_AUTH_TOKEN', data.token);
      localStorage.setItem('EV_USER', JSON.stringify(data.user));
      
      showStep('successStep');
      
      // Redirect after 2 seconds
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 2000);
    } else {
      showError(authElements.otpError, data.error || 'Invalid OTP');
    }
  } catch (error) {
    showError(authElements.otpError, 'Network error. Please try again.');
    console.error('OTP verification error:', error);
  } finally {
    authElements.verifyOtpBtn.disabled = false;
    authElements.verifyOtpBtn.textContent = 'Verify & Sign In';
  }
}

function resendOtp() {
  authElements.otpInput.value = '';
  hideError(authElements.otpError);
  showStep('mobileStep');
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
  // Input formatting
  authElements.mobileInput?.addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10);
  });

  authElements.otpInput?.addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/\D/g, '').slice(0, 6);
  });

  // Enter key handlers
  authElements.mobileInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') requestOtp();
  });

  authElements.otpInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') verifyOtp();
  });

  // Button handlers
  authElements.requestOtpBtn?.addEventListener('click', requestOtp);
  authElements.verifyOtpBtn?.addEventListener('click', verifyOtp);
  authElements.resendOtpBtn?.addEventListener('click', resendOtp);

  // Check if already signed in
  const token = localStorage.getItem('EV_AUTH_TOKEN');
  if (token) {
    window.location.href = 'index.html';
  }
});