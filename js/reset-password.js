/**
 * Password Reset Logic for Lightning Meal Plans
 * Handles Firebase password reset flow
 */

// Parse URL parameters from Firebase email link
function getUrlParameters() {
  const urlParams = new URLSearchParams(window.location.search);
  return {
    oobCode: urlParams.get('oobCode'),
    apiKey: urlParams.get('apiKey'),
    mode: urlParams.get('mode')
  };
}

// Password validation logic
function validatePasswords(newPassword, confirmPassword) {
  const errors = [];

  // Check if passwords are empty or whitespace only
  if (!newPassword || newPassword.trim() === '') {
    errors.push('Password cannot be empty.');
  }

  if (!confirmPassword || confirmPassword.trim() === '') {
    errors.push('Please confirm your password.');
  }

  // Check password length (minimum 8 characters)
  if (newPassword && newPassword.length < 8) {
    errors.push('Password must be at least 8 characters long.');
  }

  // Check if passwords match
  if (newPassword && confirmPassword && newPassword !== confirmPassword) {
    errors.push('Passwords do not match. Please try again.');
  }

  return {
    isValid: errors.length === 0,
    errors: errors
  };
}

// Display status message (success or error)
function displayMessage(message, isError = false) {
  const statusContainer = document.getElementById('status-message');
  if (!statusContainer) return;

  statusContainer.className = isError ? 'alert alert-error' : 'alert alert-success';
  statusContainer.textContent = message;
  statusContainer.classList.remove('hidden');
  
  // Scroll to message
  statusContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Hide status message
function hideMessage() {
  const statusContainer = document.getElementById('status-message');
  if (statusContainer) {
    statusContainer.classList.add('hidden');
  }
}

// Get user-friendly error message from Firebase error
function getFirebaseErrorMessage(error) {
  const errorCode = error.code;
  
  switch (errorCode) {
    case 'auth/expired-action-code':
      return 'This password reset link has expired. Please request a new one.';
    case 'auth/invalid-action-code':
      return 'This password reset link is invalid or has already been used. Please request a new one.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact support.';
    case 'auth/user-not-found':
      return 'No account found with this email. Please check and try again.';
    case 'auth/weak-password':
      return 'Password is too weak. Please choose a stronger password.';
    case 'auth/network-request-failed':
      return 'Unable to connect. Please check your internet connection and try again.';
    default:
      return error.message || 'An error occurred. Please try again.';
  }
}

// Initialize Firebase and handle password reset
async function initializePasswordReset() {
  const params = getUrlParameters();
  
  // Validate required parameters
  if (!params.oobCode) {
    displayMessage('Invalid password reset link. Missing verification code.', true);
    return;
  }

  if (!params.apiKey) {
    displayMessage('Invalid password reset link. Missing API key.', true);
    return;
  }

  if (params.mode !== 'resetPassword') {
    displayMessage('Invalid password reset link. Incorrect mode.', true);
    return;
  }

  // Initialize Firebase with apiKey from URL
  const firebaseConfig = {
    apiKey: params.apiKey,
    authDomain: 'ai-meals-9daf1.firebaseapp.com',
    projectId: 'ai-meals-9daf1'
  };

  try {
    // Initialize Firebase app
    firebase.initializeApp(firebaseConfig);
    
    // Verify the password reset code is valid
    await firebase.auth().verifyPasswordResetCode(params.oobCode);
    
    // Code is valid, show the form (it's already visible, but we could add loading state here)
    console.log('Password reset code verified successfully');
    
  } catch (error) {
    console.error('Error verifying password reset code:', error);
    displayMessage(getFirebaseErrorMessage(error), true);
    
    // Disable the form if code verification fails
    const form = document.getElementById('reset-password-form');
    if (form) {
      const inputs = form.querySelectorAll('input, button');
      inputs.forEach(input => input.disabled = true);
    }
  }
}

// Handle form submission
function handleFormSubmit(event) {
  event.preventDefault();
  hideMessage();

  const newPassword = document.getElementById('new-password').value;
  const confirmPassword = document.getElementById('confirm-password').value;
  const params = getUrlParameters();

  // Validate passwords
  const validation = validatePasswords(newPassword, confirmPassword);
  if (!validation.isValid) {
    displayMessage(validation.errors.join(' '), true);
    return;
  }

  // Disable form during submission
  const submitButton = event.target.querySelector('button[type="submit"]');
  const originalButtonText = submitButton.textContent;
  submitButton.disabled = true;
  submitButton.textContent = 'Resetting...';

  // Confirm password reset with Firebase
  firebase.auth().confirmPasswordReset(params.oobCode, newPassword)
    .then(() => {
      // Success
      displayMessage('Password reset successful! You can now sign in with your new password.', false);
      
      // Clear the form
      document.getElementById('reset-password-form').reset();
      
      // Keep button disabled after success
      submitButton.textContent = 'Password Reset Complete';
    })
    .catch((error) => {
      // Error
      console.error('Error resetting password:', error);
      displayMessage(getFirebaseErrorMessage(error), true);
      
      // Re-enable form
      submitButton.disabled = false;
      submitButton.textContent = originalButtonText;
    });
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Check if Firebase is loaded
  if (typeof firebase === 'undefined') {
    displayMessage('Failed to load Firebase SDK. Please refresh the page and try again.', true);
    return;
  }

  // Initialize password reset
  initializePasswordReset();

  // Attach form submit handler
  const form = document.getElementById('reset-password-form');
  if (form) {
    form.addEventListener('submit', handleFormSubmit);
  }
});
