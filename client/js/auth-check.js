function redirectToLogin() {
  const currentPage = window.location.pathname;
  window.location.href = `/login.html?redirectTo=${encodeURIComponent(currentPage)}`;
}

function checkAuth() {
  const token = localStorage.getItem('token');
  
  if (!token) {
    alert('Please login to access this page');
    redirectToLogin();
  }
}

document.addEventListener('DOMContentLoaded', checkAuth);