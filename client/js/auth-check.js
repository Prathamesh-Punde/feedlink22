/**
 * auth-check.js
 * Client-side authentication check for protected pages
 */

// Function to handle redirect to login page
function redirectToLogin() {
  // Save the current page URL for redirect after login
  const currentPage = window.location.pathname;
  window.location.href = `/login.html?redirectTo=${encodeURIComponent(currentPage)}`;
}

// Function to check if token exists in localStorage
function checkAuth() {
  const token = localStorage.getItem('token');
  
  // If no token is found, the server-side middleware will handle the redirect
  // This is just a backup to improve user experience
  if (!token) {
    // Optional: Show a message before redirecting
    alert('Please login to access this page');
    redirectToLogin();
  }
}

// Run the authentication check when page loads
document.addEventListener('DOMContentLoaded', checkAuth);