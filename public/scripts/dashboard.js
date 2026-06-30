// document.addEventListener("DOMContentLoaded", () => {
//   const currentUser = JSON.parse(
//     localStorage.getItem("currentUser"));

//   if (currentUser?.role === "admin") {
//     document.getElementById("adminUser").style.display = "flex";
//   }
  
//   if (!currentUser || currentUser.role === "student") {
//   window.location.href = "/login";
// }
// });
// axios.post('/adduser', { 
//   username: 'test',
//   email: "test@gmail.com",
//   password: '123'
// })
// .then(res => console.log(res.data))
// .catch(err => console.log(err))
// ================= GET UNIQUE STUDENTS =================
// Inside your dashboard frontend javascript file (e.g., admindash.js)
document.addEventListener("DOMContentLoaded", () => {
  enforceRolePermissions();
});

function enforceRolePermissions() {
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  if (!currentUser) return;

  // If the user's role is strictly 'user' (sub-staff), hide/lock administrative elements
  if (currentUser.role === "user") {
    console.log("Sub-staff detected. Restricting administrative modification panels...");

    // 1. Completely hide links/actions with the 'admin-only' class
    document.querySelectorAll(".admin-only").forEach(element => {
      element.classList.add("hidden"); 
      // Or use element.remove() if you want them completely stripped from the DOM tree
    });

    async function deleteUser(mongoObjectId) {
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  
  // Hard blocker right inside the execution track
  if (!currentUser || currentUser.role !== "admin") {
    showToast("Action Denied: You do not have permission to delete accounts.", "error");
    return;
  }

  if (!confirm("Are you absolutely sure you want to permanently delete this staff user?")) return;

  try {
    const response = await fetch(`http://localhost:3000/users/staff/${mongoObjectId}`, {
      method: "DELETE"
    });

    if (response.ok) {
      showToast("Account terminated successfully.", "success");
      renderUsers();
    }
  } catch (error) {
    console.error(error);
  }
}

    // 2. Disable form fields if they manage to navigate or see them
    const submitBtn = document.querySelector("#adduser button[type='submit']");
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.classList.replace("bg-blue-600", "bg-slate-400");
      submitBtn.textContent = "Access Restricted (Admin Only)";
    }
  }
}

// Ensure the name matches your form's onsubmit="createUser()" perfectly
async function createUser() {
  const nameInput = document.getElementById("fullName");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const confirmPasswordInput = document.getElementById("confirmPassword");
  const roleInput = document.getElementById("role");

  // Safety block check in case fields haven't rendered yet
  if (!nameInput || !emailInput || !passwordInput || !confirmPasswordInput) {
    alert("Error: Script could not map form elements from the page layout.");
    return;
  }

  // 1. Password mismatch verification check
  if (passwordInput.value !== confirmPasswordInput.value) {
    alert("Validation Error: Passwords do not match!");
    return;
  }

  // 2. Build out the registration data payload
  const payload = {
    username: nameInput.value.trim(),
    email: emailInput.value.trim(),
    password: passwordInput.value,
    // If you are setting up your master admin, you can change "user" below to "admin" 
    // to force it directly into the database as a full access manager!
    role: roleInput ? roleInput.value : "user" 
  };

  try {
    console.log("Sending registration tracking data to server endpoint...", payload);

    // 3. Connect to your registration API endpoint route address
    const response = await fetch('/users/register', { 
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      alert("Registration Denied: " + (data.message || "Could not write to database context."));
      return;
    }

    // 4. Success handling sequence
    alert("Success! Account profile written and saved to MongoDB.");
    
    // Clear out form inputs smoothly
    const formElement = document.getElementById("adduser");
    if (formElement) formElement.reset();

    // If your table renderer functions are active in dashboard.js, update the list view
    if (typeof renderUsers === "function") {
      renderUsers();
    }

  } catch (error) {
    console.error("Critical submission breakdown trace:", error);
    alert("Network Failure: Could not link up to your Express backend service application.");
  }
}

// Global logout function linked across panels
function logout() {
  localStorage.clear();
  window.location.href = "/login";
}
// Add this to your frontend dashboard controller script
async function searchStudentProfile() {
    const searchInput = document.querySelector('input[placeholder*="01112"]').value.trim();
    if (!searchInput) return;

    try {
        const response = await fetch(`http://localhost:3000/users/search/profile?studentId=${searchInput}`);
        const data = await response.json();

        if (!response.ok) {
            alert(data.message || "Student profile not found.");
            return;
        }

        // Populate your input editing text fields dynamically here
        document.getElementById("firstName").value = data.firstName || "";
        document.getElementById("surname").value = data.surname || "";
        
        console.log("Successfully retrieved data payload:", data);
    } catch (error) {
        console.error("Failed fetching lookups:", error);
    }
}async function initializeDashboardStats() {
  try {
    const response = await fetch('http://localhost:3000/users/dashboard/stats');
    if (!response.ok) throw new Error("Could not download metrics pipeline data.");
    
    const stats = await response.json();
    console.log("Stats received from backend:", stats); 

    updateCounterDOM("totalStudentsCountElement", stats.totalStudents);
    updateCounterDOM("totalSubjectsCountElement", stats.totalSubjectsLogged);

  } catch (error) {
    console.error("Failed to safely update dashboard metric counters:", error);
    updateCounterDOM("totalStudentsCountElement", 0);
  }
}

function updateCounterDOM(elementId, value) {
  const element = document.getElementById(elementId);
  if (element) {
    element.textContent = value;
  } else {
    console.warn(`Could not find HTML element with id="${elementId}" on this page.`);
  }
}

document.addEventListener("DOMContentLoaded", initializeDashboardStats);

function updateCounterDOM(elementId, value) {
  const element = document.getElementById(elementId);
  if (element) {
    element.textContent = value;
  }
}

// ================= DASHBOARD LOAD =================
async function loadDashboard() {

  /* -------- STUDENTS -------- */

  // 🔥 PRIMARY SOURCE (from results)
  let totalStudents = getTotalStudentsFromResults();

  // 🔁 FALLBACK (if results empty)
  if (totalStudents === 0) {
    const storedStudents = JSON.parse(localStorage.getItem("students")) || [];
    totalStudents = storedStudents.length;
  }

  /* -------- REQUESTS -------- */
  const requests = JSON.parse(localStorage.getItem("transcriptRequests")) || [];
  const delivered = JSON.parse(localStorage.getItem("deliveredTranscripts")) || [];

  // Only active requests
  const activeRequests = requests.filter(r => r.status === "pending");

  const totalRequests = activeRequests.length;
  const totalSent = delivered.length;
  const totalPending = activeRequests.length;

  /* -------- FORMAT -------- */
  const format = (num) => num.toLocaleString();

  /* -------- SAFE UI UPDATE -------- */
  function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = format(value);
  }

  setText("totalStudents", totalStudents);
  setText("totalRequests", totalRequests);
  setText("totalSent", totalSent);
  setText("totalPending", totalPending);
}

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", loadDashboard);
window.addEventListener("storage", loadDashboard);
setInterval(loadDashboard, 3000);