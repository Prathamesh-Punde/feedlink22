// js/auth-check.js

function redirectToLogin() {
  const currentPage = window.location.pathname;
  window.location.href = `login.html?redirectTo=${encodeURIComponent(currentPage)}`;
}

function checkAuth() {
  console.log("Auth check running...");

  const token = localStorage.getItem("token");

  if (!token) {
    console.warn("User not logged in. Redirecting to login page...");
    alert('Please login to access this page');
    redirectToLogin();
  } else {
    console.log("User logged in ✅");
  }
}

document.addEventListener("DOMContentLoaded", checkAuth);
