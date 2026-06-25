// Set current year
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById('year').textContent = new Date().getFullYear();
});

  window.addEventListener("load", () => {
    const loader = document.getElementById("loader");
    const content = document.getElementById("mainContent");

    setTimeout(() => {
      // Fade out loader
      loader.classList.add("opacity-0");

      setTimeout(() => {
        loader.style.display = "none";

        // Show content
        content.classList.remove("hidden");

        // Small delay ensures transition triggers
        setTimeout(() => {
          content.classList.add("opacity-100");
        }, 50);

      }, 700); // loader fade duration

    }, 3000);
  });

  const menuBtn = document.getElementById("menuBtn");
  const mobileMenu = document.getElementById("mobileMenu");

  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener("click", () => {
    mobileMenu.classList.remove("hidden");
      setTimeout(() => {
     mobileMenu.classList.add("hidden");
     }, 3000); 
    });
  }

    function showToast(message, type = "error") {
    const container = document.getElementById("toastContainer");
  
    const toast = document.createElement("div");
  
    const colors = {
      error: "bg-red-600",
      success: "bg-green-600",
      info: "bg-blue-600"
    };
  
    toast.className = `
      ${colors[type] || colors.error}
      text-white px-4 py-2 rounded-lg shadow-lg
      animate-slide-in
    `;
  
    toast.textContent = message;
  
    container.appendChild(toast);
  
    setTimeout(() => {
      toast.classList.add("opacity-0", "transition");
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }


const LOGIN_KEY = "currentUser";
const USERS_KEY = "registeredUsers";

// ================= DEFAULT ADMIN =================
const defaultUsers = [
  {
    id: 1,
    name: "Admin",
    email: "admin@example.com",
    password: "admin123",
    role: "admin"
  }
];

// ================= CREATE USER =================
function createUser() {
  const name =
    document.getElementById("fullName")?.value.trim() || "";

  const email =
    document.getElementById("email")?.value.trim() || "";

  const password =
    document.getElementById("password")?.value.trim() || "";
    
  const confirmPassword = document.getElementById("confirmPassword").value.trim();

  const role =
    document.getElementById("role")?.value || "";

  if (!name || !email || !password) {
    showToast("Name, Email and Password are required", "error");
    return;
  }

  if (password !== confirmPassword) {
      showToast("Passwords do not match.", "error");
      return;
    }

  let users =
    JSON.parse(localStorage.getItem(USERS_KEY)) || [];

  const exists = users.find(
    u =>
      u.email &&
      u.email.toLowerCase() === email.toLowerCase()
  );

  if (exists) {
    showToast("User already exists", "error");
    return;
  }

  const newUser = {
    id: Date.now(),
    name,
    email,
    password,
    role
  };

  users.push(newUser);

  localStorage.setItem(
    USERS_KEY,
    JSON.stringify(users)
  );

  showToast("Account created", "success");

  // Clear form
  document.getElementById("fullName").value = "";
  document.getElementById("email").value = "";
  document.getElementById("password").value = "";
  document.getElementById("confirmPassword").value = "";

  if (typeof renderUsers === "function") {
    renderUsers();
  }
}

// ================= LOGIN =================
function login() {
  const identity =
    document.getElementById("loginEmail")?.value.trim() || "";

  const password =
    document.getElementById("loginPassword")?.value.trim() || "";
    
  if (!identity || !password) {
    showToast(
      "Enter Email and Password","error");
    return;
  }

  let users =
    JSON.parse(localStorage.getItem(USERS_KEY)) || [];

  // Ensure admin exists
  defaultUsers.forEach(admin => {
    const exists = users.some(
      u =>
        u.email &&
        u.email.toLowerCase() ===
          admin.email.toLowerCase()
    );

    if (!exists) {
      users.push(admin);
    }
  });

  localStorage.setItem(
    USERS_KEY,
    JSON.stringify(users)
  );

const user = users.find(u => {
  const matchIdentity =
    (u.email &&
      u.email.toLowerCase() === identity.toLowerCase()) ||
    u.studentId === identity;

  if (u.role === "admin" || u.role === "user") {
    return matchIdentity && u.password === password;
  }

  if (u.role === "student") {
    return matchIdentity && password === u.studentId;
  }
});

  if (!user) {
    showToast(
      "Invalid Email or Password",
      "error"
    );
    return;
  }

  localStorage.setItem(
    LOGIN_KEY,
    JSON.stringify(user)
  );

  showToast(`Welcome ${user.firstName || user.name}`, "success");

  setTimeout(() => {
    switch (user.role) {
      case "admin":
        window.location.href = "admindash.html";
        break;

      case "student":
        window.location.href = "student.html";
        break;

      case "user":
        window.location.href = "admindash.html";
        break;

      default:
        showToast("Not registered", "error");
    }
  }, 500);
}

function logout(){
showToast("Logged out successfully", "success");

localStorage.removeItem(LOGIN_KEY);

setTimeout(() => {
window.location.href = "login.html";
}, 500);
}

function updateNotificationDot() {
  const requests = JSON.parse(localStorage.getItem("transcriptRequests")) || [];

  const pendingCount = requests.filter(r => r.status === "pending").length;

  const dot = document.getElementById("notificationDot");

  if (!dot) return;

  if (pendingCount > 0) {
    dot.classList.remove("hidden");
    dot.textContent = pendingCount > 9 ? "9+" : pendingCount;
  } else {
    dot.classList.add("hidden");
    dot.textContent = "";
  }
}

const currentUser = JSON.parse(
  localStorage.getItem("currentUser")
);

document.querySelectorAll(".admin-only").forEach(box => {
  box.addEventListener("click", function (e) {
    if (!currentUser || currentUser.role !== "admin") {
      e.preventDefault();
      alert("Admin access only!");
    }
  });
});


function renderUsers() {
  const users = JSON.parse(localStorage.getItem("registeredUsers")) || [];

  const searchValue = document.getElementById("searchUser") ?.value.toLowerCase()
      .trim() || "";

  const filteredUsers = users.filter(user => {
    // Only show users
    if (user.role !== "user") return false;

    const name = (user.name || user.firstName || "").toLowerCase();
    const email = (user.email || "").toLowerCase();
    const role = (user.role || "").toLowerCase();

    return (
      name.includes(searchValue) ||
      email.includes(searchValue) ||
      role.includes(searchValue)
    );
  });

  const container = document.getElementById("usersTable");

  if (filteredUsers.length === 0) {
    container.innerHTML = `
    <tr>
      <td colspan="5" class="text-center p-4">No user found</td>
    </tr>
    `;
    return;
  }

  container.innerHTML = `
    <tbody>
      ${filteredUsers.map(user => `
        <tr>
          <td class="p-2 text-center">
            ${user.name || user.firstName || "-"}
          </td>

          <td class="p-2 text-center">
            ${user.email || "-"}
          </td>

          <td class="p-2 text-center">
            ${user.role}
          </td>

          <td class="p-2 text-center text-red-600 font-bold">
            <button onclick="deleteUser(${user.id})">
              Delete
            </button>
          </td>
        </tr>
      `).join("")}
    </tbody>
  `;
}

function deleteUser(id) {
  if (!confirm("Delete this account?")) return;

  let users = JSON.parse(localStorage.getItem(USERS_KEY)) || [];

  users = users.filter(user => user.id !== id);

  localStorage.setItem(USERS_KEY, JSON.stringify(users));

  renderUsers();
}

document.addEventListener("DOMContentLoaded", () => {
  renderUsers();
});
document.addEventListener("DOMContentLoaded",
  updateNotificationDot);
 
 const images = document.querySelectorAll('.carousel-image');
const overlay = document.getElementById('carousel-overlay');

const palettes = [
  'linear-gradient(to right, rgba(30,58,138,0.7), rgba(88,28,135,0.4), transparent)',   // blue → purple
  'linear-gradient(to right, rgba(67,56,202,0.7), rgba(59,130,246,0.4), transparent)',  // indigo → blue
  'linear-gradient(to right, rgba(88,28,135,0.7), rgba(30,64,175,0.4), transparent)',   // purple → blue
  'linear-gradient(to right, rgba(29,78,216,0.7), rgba(99,102,241,0.4), transparent)',  // blue → indigo
];

let current = 0;

function nextSlide() {
  const next = (current + 1) % images.length;

  images[current].style.opacity = 0;
  images[next].style.opacity = 1;
  overlay.style.background = palettes[next % palettes.length];

  current = next;
}

// init
images.forEach((img, i) => img.style.opacity = i === 0 ? 1 : 0);
overlay.style.background = palettes[0];

setInterval(nextSlide, 4000);

