// Set current year dynamically
document.addEventListener("DOMContentLoaded", () => {
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
});

// Window Page Loading Mask Engine 
window.addEventListener("load", () => {
  const loader = document.getElementById("loader");
  const content = document.getElementById("mainContent");
  if (!loader) return;

  setTimeout(() => {
    loader.classList.add("opacity-0");
    setTimeout(() => {
      loader.style.display = "none";
      if (content) {
        content.classList.remove("hidden");
        setTimeout(() => content.classList.add("opacity-100"), 50);
      }
    }, 700);
  }, 1500);
});

// Mobile Responsive Dropdown Navigation Helper
const menuBtn = document.getElementById("menuBtn");
const mobileMenu = document.getElementById("mobileMenu");

if (menuBtn && mobileMenu) {
  menuBtn.addEventListener("click", () => {
    mobileMenu.classList.toggle("hidden");
  });
}

// Global Custom Application Toast Alert Element Maker
function showToast(message, type = "error") {
  const container = document.getElementById("toastContainer");
  if (!container) return;

  const toast = document.createElement("div");
  const colors = { error: "bg-red-600", success: "bg-green-600", info: "bg-blue-600" };

  toast.className = `${colors[type] || colors.error} text-white px-4 py-2 rounded-lg shadow-lg animate-slide-in transition duration-300`;
  toast.textContent = message;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("opacity-0");
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

const LOGIN_KEY = "currentUser";

// unified login controller
async function login() {
  const emailField = document.getElementById("loginEmail") || document.getElementById("email");
  const passwordField = document.getElementById("loginPassword") || document.getElementById("password");

  if (!emailField || !passwordField) {
    console.error("DOM Error: Could not locate your input elements by ID.");
    return;
  }

  const identity = emailField.value.trim();
  const password = passwordField.value.trim();
    
  // 2. Clear validation block check
  if (!identity || !password) {
    showToast("Email and Password fields are required.", "error");
    return;
  }

  try {
    // 3. Send payload using the exact keys your backend expects
    const response = await fetch('http://localhost:3000/users/login', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: identity, password: password })
    });

    const data = await response.json();

    if (!response.ok) {
      showToast(data.message || "Invalid Email or Password", "error");
      return;
    }

    //Save session context token securely
    localStorage.setItem("currentUser", JSON.stringify(data.user));
    showToast("Sign in successful!", "success");

    //Reroute user based on backend assigned structural role
    setTimeout(() => {
      if (data.user.role === "admin" || data.user.role === "user") {
        window.location.href = "/admindash";
      } else if (data.user.role === "student") {
        window.location.href = "student.html";
      }
    }, 200);

  } catch (error) {
    console.error(error);
    showToast("Server network timeout link error.", "error");
  }
}

//sub staff user
async function createUser() {
  const name = document.getElementById("fullName")?.value.trim() || "";
  const email = document.getElementById("email")?.value.trim() || "";
  const password = document.getElementById("password")?.value.trim() || "";
  const confirmPassword = document.getElementById("confirmPassword")?.value.trim() || "";
  const role = document.getElementById("role")?.value || "user";

  if (!name || !email || !password) {
    showToast("Full Name, Email, and Password are required.", "error");
    return;
  }

  if (password !== confirmPassword) {
    showToast("Input passwords do not match.", "error");
    return;
  }

  try {
    const response = await fetch('http://localhost:3000/users/register', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, role })
    });

    const data = await response.json();

    if (!response.ok) {
      showToast(data.message || "Failed to create staff account profile.", "error");
      return;
    }

    showToast("Staff user successfully registered to system.", "success");

    // Clear input form contexts
    document.getElementById("fullName").value = "";
    document.getElementById("email").value = "";
    document.getElementById("password").value = "";
    document.getElementById("confirmPassword").value = "";

    renderUsers(); // Refresh management tables automatically

  } catch (error) {
    console.error(error);
    showToast("Failed transmitting initialization metadata packet.", "error");
  }
}


async function renderUsers() {
  const container = document.getElementById("usersTable");
  if (!container) return;

  const searchValue = document.getElementById("searchUser")?.value.toLowerCase().trim() || "";

  try {
    // payload list directly
    const response = await fetch(`http://localhost:3000/users/list/staff?search=${encodeURIComponent(searchValue)}`);
    if (!response.ok) return;

    const staffUsers = await response.json();

    if (staffUsers.length === 0) {
      container.innerHTML = `<tr><td colspan="4" class="text-center p-4 text-slate-400 italic">No operational sub-staff accounts found matching index keys.</td></tr>`;
      return;
    }

    container.innerHTML = `
      <tbody>
        ${staffUsers.map(staff => `
          <tr class="border-b text-slate-700 hover:bg-slate-50 transition">
            <td class="p-3 text-center font-medium">${staff.name || "-"}</td>
            <td class="p-3 text-center">${staff.email || "-"}</td>
            <td class="p-3 text-center text-xs font-bold text-indigo-600 uppercase tracking-wide">${staff.role}</td>
            <td class="p-3 text-center text-red-600 font-bold">
              <button onclick="deleteUser('${staff._id}')" class="hover:underline focus:outline-none">Delete Account</button>
            </td>
          </tr>
        `).join("")}
      </tbody>
    `;
  } catch (error) {
    console.error("Error drawing dynamic staff rows lists:", error);
  }
}

async function deleteUser(mongoObjectId) {
  if (!confirm("Are you absolutely sure you want to permanently strip operational clearance and delete this staff user account from the registry?")) return;

  try {
    const response = await fetch(`http://localhost:3000/users/staff/${mongoObjectId}`, {
      method: "DELETE"
    });

    if (response.ok) {
      showToast("Clearance dropped. Account terminated successfully.", "success");
      renderUsers();
    } else {
      showToast("Failed to isolate targeted document schema parameters.", "error");
    }
  } catch (error) {
    console.error(error);
  }
}

// Transcript badge 
async function updateNotificationDot() {
  const dot = document.getElementById("notificationDot");
  if (!dot) return;

  try {
    // Hits the generic global request counting pipeline
    const response = await fetch('http://localhost:3000/users/requests/pending-count');
    if (!response.ok) return;

    const data = await response.json();

    if (data.count > 0) {
      dot.classList.remove("hidden");
      dot.textContent = data.count > 9 ? "9+" : data.count;
    } else {
      dot.classList.add("hidden");
    }
  } catch (error) {
    console.warn("Failed tracking pending order lists:", error);
  }
}

function logout() {
  showToast("Logged out successfully", "success");
  localStorage.removeItem(LOGIN_KEY);
  setTimeout(() => { window.location.href = "login.html"; }, 500);
}

// Hook lifecycle loaders
document.addEventListener("DOMContentLoaded", () => {
  renderUsers();
  updateNotificationDot();
});

// =========================================================================
// INTERACTIVE DASHBOARD DESIGN CAROUSEL MATRICES
// =========================================================================
const images = document.querySelectorAll('.carousel-image');
const overlay = document.getElementById('carousel-overlay');
const palettes = [
  'linear-gradient(to right, rgba(30,58,138,0.7), rgba(88,28,135,0.4), transparent)',
  'linear-gradient(to right, rgba(67,56,202,0.7), rgba(59,130,246,0.4), transparent)',
  'linear-gradient(to right, rgba(88,28,135,0.7), rgba(30,64,175,0.4), transparent)',
  'linear-gradient(to right, rgba(29,78,216,0.7), rgba(99,102,241,0.4), transparent)'
];

let current = 0;
if (images.length > 0 && overlay) {
  images.forEach((img, i) => img.style.opacity = i === 0 ? 1 : 0);
  overlay.style.background = palettes[0];

  setInterval(() => {
    const next = (current + 1) % images.length;
    images[current].style.opacity = 0;
    images[next].style.opacity = 1;
    overlay.style.background = palettes[next % palettes.length];
    current = next;
  }, 4000);
}