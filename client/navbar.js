document.addEventListener("DOMContentLoaded", () => {
  // Select the Donate link
  const donateLink = document.querySelector('a[href="Donate.html"]');

  if (donateLink) {
    donateLink.addEventListener("click", function (e) {
      e.preventDefault(); // stop normal navigation

      const token = localStorage.getItem("token");

      if (!token) {
        // If not logged in, redirect to login page with redirect info
        window.location.href = `login.html?redirectTo=/Donate.html`;
      } else {
        // If logged in, go to donate page
        window.location.href = "Donate.html";
      }
    });
  }
});
