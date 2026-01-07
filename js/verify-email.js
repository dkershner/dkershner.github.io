/**
 * Email Verification Logic for Lightning Meal Plans
 * Handles Firebase email verification flow
 */

/**
 * Parse URL parameters from Firebase email link
 * @returns {Object} Object containing oobCode, apiKey, and mode
 */
function getUrlParameters() {
  const urlParams = new URLSearchParams(window.location.search);
  return {
    oobCode: urlParams.get('oobCode'),
    apiKey: urlParams.get('apiKey'),
    mode: urlParams.get('mode')
  };
}

/**
 * Show the loading state
 */
function showLoading() {
  document.getElementById('loading').classList.add('active');
  document.getElementById('success').classList.remove('active');
  document.getElementById('error').classList.remove('active');
}

/**
 * Show the success state
 */
function showSuccess() {
  document.getElementById('loading').classList.remove('active');
  document.getElementById('success').classList.add('active');
  document.getElementById('error').classList.remove('active');
}

/**
 * Show the error state with a message
 * @param {string} message - Error message to display
 * @param {string} [errorCode] - Optional error code for debugging
 */
function showError(message, errorCode) {
  document.getElementById('loading').classList.remove('active');
  document.getElementById('success').classList.remove('active');
  document.getElementById('error').classList.add('active');
  
  document.getElementById('error-message').textContent = message;
  
  if (errorCode) {
    document.getElementById('error-code').textContent = `Error Code: ${errorCode}`;
    document.getElementById('error-details').style.display = 'block';
  }
}

/**
 * Handle verification errors with appropriate messages
 * @param {Error} error - Firebase error object
 */
function handleVerificationError(error) {
  let errorMessage = 'Verification failed. ';
  
  switch (error.code) {
    case 'auth/expired-action-code':
      errorMessage += 'This link has expired. Please request a new verification email from the app.';
      break;
    case 'auth/invalid-action-code':
      errorMessage += 'This link is invalid or has already been used.';
      break;
    case 'auth/user-disabled':
      errorMessage += 'This account has been disabled. Please contact support.';
      break;
    case 'auth/user-not-found':
      errorMessage += 'User account not found.';
      break;
    default:
      errorMessage += 'Please try again or request a new verification email from the app.';
  }
  
  showError(errorMessage, error.code);
}

/**
 * Initialize Firebase and handle email verification
 */
async function initializeEmailVerification() {
  const params = getUrlParameters();
  
  // Validate required parameters
  if (!params.oobCode) {
    showError('Invalid verification link. Missing verification code.');
    return;
  }

  if (!params.apiKey) {
    showError('Invalid verification link. Missing API key.');
    return;
  }

  if (params.mode !== 'verifyEmail') {
    showError('Invalid verification link. This link is not for email verification.');
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
    const auth = firebase.auth();
    
    // Apply the action code to verify the email
    await auth.applyActionCode(params.oobCode);
    showSuccess();
    
  } catch (error) {
    console.error('Verification error:', error);
    handleVerificationError(error);
  }
}

/**
 * Attempt to return to the app via deep link
 */
function returnToApp() {
  // Try to open the app using deep link
  window.location.href = 'lightningmealplans://verify-email-complete';
  
  // Fallback: show instructions after a delay
  setTimeout(() => {
    alert('If the app did not open automatically, please return to the Lightning Meal Plans app and sign in.');
  }, 1000);
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Check if Firebase is loaded
  if (typeof firebase === 'undefined') {
    showError('Failed to load Firebase SDK. Please refresh the page and try again.');
    return;
  }
  
  // Start verification process
  initializeEmailVerification();
});
