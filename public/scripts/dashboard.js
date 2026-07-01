// ================= GLOBAL STATE =================
let allUsersList = []; // Caches user payload array to optimize filtering speeds

// ================= INITIALIZATION TRACKS =================
document.addEventListener("DOMContentLoaded", () => {
  enforceRolePermissions();
  renderUsers(); // Fires automatically on page load
  initializeDashboardStats();
  loadDashboard();
});

window.addEventListener("storage", loadDashboard);
setInterval(loadDashboard, 3000);

// ================= ROLE SECURITY LOCKS =================
function enforceRolePermissions() {
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  if (!currentUser) return;

  // If the user's role is strictly 'user' (sub-staff), hide/lock administrative elements
  if (currentUser.role === "user") {
    console.log("Sub-staff detected. Restricting administrative modification panels...");

    // Completely hide links/actions with the 'admin-only' class
    document.querySelectorAll(".admin-only").forEach(element => {
      element.classList.add("hidden"); 
    });

    // Disable form fields if they manage to navigate or see them
    const submitBtn = document.querySelector("#adduser button[type='submit']");
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.classList.replace("bg-blue-600", "bg-slate-400");
      submitBtn.textContent = "Access Restricted (Admin Only)";
    }
  }
}

// ================= RENDER & LIVE FILTER USERS =================
// ================= RENDER & LIVE FILTER USERS =================
async function renderUsers() {
  const tableBody = document.getElementById("usersTable");
  const searchInput = document.getElementById("searchUser");
  if (!tableBody) return; 

  try {
    // FORCE FETCH: Fetch from the database if our local cache array is empty
    if (allUsersList.length === 0) {
      console.log("Fetching fresh user directories from backend server...");
      const response = await fetch('/users/all-users');
      if (!response.ok) throw new Error("Could not map active records.");
      allUsersList = await response.json();
    }

    // Clear the table body container layout
    tableBody.innerHTML = "";

    // Read the query search value safely
    const filterQuery = searchInput ? searchInput.value.toLowerCase().trim() : "";

    // Filter matching entries against BOTH fields (username and email)
    const matches = allUsersList.filter(user => {
      const nameString = (user.username || user.name || "").toLowerCase();
      const emailString = (user.email || "").toLowerCase();
      return nameString.includes(filterQuery) || emailString.includes(filterQuery);
    });

    if (matches.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="4" class="p-8 text-center text-slate-500 font-semibold text-sm">
            No matching user profiles found.
          </td>
        </tr>`;
      return;
    }

    // Render the rows cleanly matching your table structure
    matches.forEach(user => {
      const row = document.createElement("tr");
      row.className = "border-b border-slate-200/40 hover:bg-white/20 transition text-sm text-slate-800 font-semibold";
      
      row.innerHTML = `
        <td class="p-3 text-slate-900 truncate max-w-[150px]">${user.username || user.name || 'Staff'}</td>
        <td class="p-3 text-slate-600 truncate max-w-[200px]">${user.email}</td>
        <td class="p-3 text-center">
          <span class="inline-block px-2.5 py-0.5 text-xs font-black rounded-full ${
            user.role === 'admin' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
          }">
            ${user.role || 'user'}
          </span>
        </td>
        <td class="p-3 text-center">
          <button onclick="deleteUser('${user._id}')" class="bg-red-50 hover:bg-red-600 text-red-600 hover:text-white text-xs font-bold px-3 py-1 rounded-md transition">
            Delete
          </button>
        </td>
      `;
      tableBody.appendChild(row);
    });

  } catch (error) {
    console.error("UI population breakdown:", error);
    tableBody.innerHTML = `<tr><td colspan="4" class="p-4 text-center text-red-700 bg-red-50 text-sm font-medium">Error linking workspace to registration pool.</td></tr>`;
  }
}

// ================= ACCOUNTS REMOVAL EXECUTOR =================
async function deleteUser(mongoObjectId) {
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  
  if (!currentUser || currentUser.role !== "admin") {
    alert("Action Denied: You do not have permission to delete accounts.");
    return;
  }

  if (!confirm("Are you absolutely sure you want to permanently delete this staff user?")) return;

  try {
    const response = await fetch(`/users/staff/${mongoObjectId}`, {
      method: "DELETE"
    });

    if (response.ok) {
      alert("Account terminated successfully.");
      allUsersList = []; // Reset local memory array block cache
      renderUsers();     // Reload interface view live
    } else {
      const data = await response.json();
      alert(data.message || "Server rejected transaction.");
    }
  } catch (error) {
    console.error("Deletion operation crash trace:", error);
    alert("Network Failure connecting to removal system endpoint.");
  }
}

// ================= ACCOUNT PROVISIONING =================
async function createUser() {
  const nameInput = document.getElementById("fullName");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const confirmPasswordInput = document.getElementById("confirmPassword");
  const roleInput = document.getElementById("role");

  if (!nameInput || !emailInput || !passwordInput || !confirmPasswordInput) {
    alert("Error: Script could not map form elements from the page layout.");
    return;
  }

  if (passwordInput.value !== confirmPasswordInput.value) {
    alert("Validation Error: Passwords do not match!");
    return;
  }

  const payload = {
    username: nameInput.value.trim(),
    email: emailInput.value.trim(),
    password: passwordInput.value,
    role: roleInput ? roleInput.value : "user" 
  };

  try {
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

    alert("Success! Account profile written and saved to MongoDB.");
    const formElement = document.getElementById("adduser");
    if (formElement) formElement.reset();
    
    allUsersList = []; // Wipe local memory array to force fresh read
    renderUsers();

  } catch (error) {
    console.error("Critical submission breakdown trace:", error);
    alert("Network Failure: Could not link up to your Express backend service application.");
  }
}

// ================= PROFILE ROUTING LOOKUPS =================
async function searchStudentProfile() {
  const searchInput = document.querySelector('input[placeholder*="01112"]').value.trim();
  if (!searchInput) return;

  try {
    const response = await fetch(`/users/search/profile?studentId=${searchInput}`);
    const data = await response.json();

    if (!response.ok) {
      alert(data.message || "Student profile not found.");
      return;
    }

    document.getElementById("firstName").value = data.firstName || "";
    document.getElementById("surname").value = data.surname || "";
  } catch (error) {
    console.error("Failed fetching lookups:", error);
  }
}

// ================= METRICS METADATA LOADING =================
async function initializeDashboardStats() {
  try {
    const response = await fetch('/users/dashboard/stats');
    if (!response.ok) throw new Error("Could not download metrics pipeline data.");
    
    const stats = await response.json();
    updateCounterDOM("totalStudentsCountElement", stats.totalStudents);
    updateCounterDOM("totalSubjectsCountElement", stats.totalSubjectsLogged);
  } catch (error) {
    console.error("Failed to safely update dashboard metric counters:", error);
    updateCounterDOM("totalStudentsCountElement", 0);
  }
}

function updateCounterDOM(elementId, value) {
  const element = document.getElementById(elementId);
  if (element) element.textContent = value;
}

// ================= FALLBACK COMPONENT CONTROLLERS =================
async function loadDashboard() {
  let totalStudents = 0;
  if (typeof getTotalStudentsFromResults === "function") {
    totalStudents = getTotalStudentsFromResults();
  }

  if (totalStudents === 0) {
    const storedStudents = JSON.parse(localStorage.getItem("students")) || [];
    totalStudents = storedStudents.length;
  }

  const requests = JSON.parse(localStorage.getItem("transcriptRequests")) || [];
  const delivered = JSON.parse(localStorage.getItem("deliveredTranscripts")) || [];
  const activeRequests = requests.filter(r => r.status === "pending");

  const format = (num) => num ? num.toLocaleString() : "0";

  function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = format(value);
  }

  setText("totalStudents", totalStudents);
  setText("totalRequests", activeRequests.length);
  setText("totalSent", delivered.length);
  setText("totalPending", activeRequests.length);
}

function logout() {
  localStorage.clear();
  window.location.href = "/login";
}

document.addEventListener("DOMContentLoaded", () => {
  console.log("Page ready! Loading active user profiles from MongoDB...");
  renderUsers(); 
});